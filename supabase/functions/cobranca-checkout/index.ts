// Ligação de pagamento de uma fatura, pedida pelo treinador. O aluno com conta paga pela
// `aluno-acao`. O valor vem da fatura gravada, e a fatura só fica paga pelo webhook.
import { ambiente, corsHeaders, json, treinadorPede } from '../_shared/aluno.ts';
import { configuracaoConnect, sessaoDaFatura } from '../_shared/cobranca.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const cfg = configuracaoConnect();
    if (!cfg.ativa) return json({ error: cfg.motivo, codigo: 'desligada' }, 503);
    const env = ambiente();
    const origem = Deno.env.get('APP_ORIGIN');
    if (!env || !origem) return json({ error: 'Variáveis de ambiente em falta.' }, 500);
    const userId = await treinadorPede(req, env);
    if (!userId) return json({ error: 'Sessão em falta.' }, 401);
    const { faturaId } = await req.json().catch(() => ({}));

    const p = await env.rest(`app_data?user_id=eq.${userId}&data_key=eq.modulo:planos&select=value`);
    const planos = p.ok ? (await p.json())[0]?.value : null;
    const fatura = (planos?.faturas || []).find((f: any) => f.id === faturaId);
    if (!fatura) return json({ error: 'Fatura não encontrada.' }, 404);
    const r = await sessaoDaFatura(cfg.chave!, env, { userId, fatura, sucesso: `${origem}/?aluno=1&pagamento=ok`, cancelado: `${origem}/?aluno=1&pagamento=cancelado` });
    return r.erro ? json({ error: r.erro }, r.estado) : json({ url: r.url });
  } catch (error) {
    console.error('[cobranca-checkout]', error);
    return json({ error: 'Não foi possível criar a ligação de pagamento.' }, 502);
  }
});
