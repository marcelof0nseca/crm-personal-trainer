// Ligação de pagamento de uma fatura, na conta do treinador. O valor vem da fatura
// gravada, nunca do pedido, e a fatura só fica paga pelo webhook.
import { ambiente, corsHeaders, json, treinadorPede } from '../_shared/aluno.ts';
import { configuracaoConnect, stripe } from '../_shared/cobranca.ts';
import { estadoDaFatura, pagoDaFatura, totalDaFatura } from '../_shared/vista-aluno.ts';

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

    const c = await env.rest(`cobranca_contas?user_id=eq.${userId}&select=stripe_account_id,pagamentos_ativos&limit=1`);
    const conta = c.ok ? (await c.json())[0] : null;
    if (!conta || !conta.pagamentos_ativos) return json({ error: 'Conclua primeiro a verificação da carteira.' }, 400);

    const p = await env.rest(`app_data?user_id=eq.${userId}&data_key=eq.modulo:planos&select=value`);
    const planos = p.ok ? (await p.json())[0]?.value : null;
    const fatura = (planos?.faturas || []).find((f: any) => f.id === faturaId);
    if (!fatura) return json({ error: 'Fatura não encontrada.' }, 404);
    const hoje = new Date().toISOString().slice(0, 10);
    if (!['aberta', 'vencida', 'parcial'].includes(estadoDaFatura(fatura, hoje))) return json({ error: 'Esta fatura não está por pagar.' }, 400);
    const emFalta = totalDaFatura(fatura) - pagoDaFatura(fatura);
    if (!(emFalta > 0)) return json({ error: 'Esta fatura não está por pagar.' }, 400);

    const sessao = await stripe(cfg.chave!, 'checkout/sessions', {
      mode: 'payment', success_url: `${origem}/?pagamento=ok`, cancel_url: `${origem}/?pagamento=cancelado`,
      'line_items[0][quantity]': '1', 'line_items[0][price_data][currency]': String(fatura.moeda || 'EUR').toLowerCase(), 'line_items[0][price_data][unit_amount]': String(emFalta), 'line_items[0][price_data][product_data][name]': String(fatura.itens?.[0]?.descricao || 'Fatura').slice(0, 120),
      client_reference_id: fatura.id, 'metadata[user_id]': userId, 'metadata[aluno_id]': fatura.studentId, 'metadata[fatura_id]': fatura.id, 'metadata[dominio]': 'aluno',
    }, conta.stripe_account_id);
    return json({ url: sessao.url });
  } catch (error) {
    console.error('[cobranca-checkout]', error);
    return json({ error: 'Não foi possível criar a ligação de pagamento.' }, 502);
  }
});
