// Webhook próprio da cobrança dos alunos, com segredo próprio. Cada evento conta uma vez
// (`cobranca_eventos`), e a confirmação vive em `cobranca_pagamentos`: a aplicação do
// treinador concilia-a com a fatura ao abrir.
import { ambiente, json } from '../_shared/aluno.ts';
import { estadoDaConta } from '../_shared/cobranca.ts';

async function assinaturaValida(corpo: string, cabecalho: string, segredo: string) {
  const partes = Object.fromEntries(cabecalho.split(',').map((p) => p.split('=') as [string, string]));
  const t = partes.t; const v1 = partes.v1;
  if (!t || !v1 || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(`${t}.${corpo}`));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
  if (hex.length !== v1.length) return false;
  let dif = 0;
  for (let i = 0; i < hex.length; i += 1) dif |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return dif === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const segredo = Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET');
  const env = ambiente();
  if (!segredo || !env) return json({ error: 'Serviço por configurar.' }, 503);
  try {
    const corpo = await req.text();
    if (!(await assinaturaValida(corpo, req.headers.get('stripe-signature') || '', segredo))) return json({ error: 'Assinatura inválida.' }, 400);
    const evento = JSON.parse(corpo);

    const reg = await env.rest('cobranca_eventos?on_conflict=stripe_event_id', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=representation' }, body: JSON.stringify({ stripe_event_id: evento.id, tipo: evento.type }) });
    if (!reg.ok) return json({ error: 'Não foi possível registar o evento.' }, 500);
    if ((await reg.json()).length === 0) return json({ received: true, repetido: true });

    const o = evento.data?.object || {};
    if (evento.type === 'checkout.session.completed' && o.payment_status === 'paid' && o.metadata?.dominio === 'aluno') {
      const g = await env.rest('cobranca_pagamentos?on_conflict=referencia', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify({ user_id: o.metadata.user_id, aluno_id: o.metadata.aluno_id, fatura_id: o.metadata.fatura_id, centimos: o.amount_total, moeda: String(o.currency || 'eur').toUpperCase(), metodo: 'stripe', referencia: o.payment_intent || o.id, estado: 'pago' }) });
      if (!g.ok) return json({ error: 'Não foi possível gravar o pagamento.' }, 500);
    } else if (evento.type === 'charge.refunded' && o.payment_intent) {
      await env.rest(`cobranca_pagamentos?referencia=eq.${o.payment_intent}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: o.refunded ? 'reembolsado' : 'pago', reembolsado_centimos: o.amount_refunded || 0 }) });
    } else if (evento.type === 'account.updated' && o.id) {
      await env.rest(`cobranca_contas?stripe_account_id=eq.${o.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...estadoDaConta(o), atualizado_em: new Date().toISOString() }) });
    }
    return json({ received: true });
  } catch (error) {
    console.error('[cobranca-webhook]', error);
    return json({ error: 'Erro inesperado.' }, 500);
  }
});
