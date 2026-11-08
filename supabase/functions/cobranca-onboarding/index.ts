// A verificação do treinador no fornecedor de pagamentos. Identidade e IBAN ficam lá;
// aqui só se guarda o id da conta e o estado.
import { ambiente, corsHeaders, json, treinadorPede } from '../_shared/aluno.ts';
import { INCLUIR_V2, configuracaoConnect, contaNovaV2, estadoDaConta, stripeV2 } from '../_shared/cobranca.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const cfg = configuracaoConnect();
    if (!cfg.ativa) return json({ ativa: false, motivo: cfg.motivo });
    const env = ambiente();
    if (!env) return json({ error: 'Variáveis de ambiente em falta.' }, 500);
    const userId = await treinadorPede(req, env);
    if (!userId) return json({ error: 'Sessão em falta.' }, 401);
    const body = await req.json().catch(() => ({}));

    const lida = await env.rest(`cobranca_contas?user_id=eq.${userId}&select=stripe_account_id&limit=1`);
    let contaId = lida.ok ? (await lida.json())[0]?.stripe_account_id : null;

    if (!contaId && body.apenasEstado) return json({ ativa: true, pagamentos: false, transferencias: false, requisitos: [] });
    if (!contaId) {
      const nova = await stripeV2(cfg.chave!, 'core/accounts', contaNovaV2(userId));
      contaId = nova.id;
      const g = await env.rest('cobranca_contas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, stripe_account_id: contaId, ...estadoDaConta(nova) }) });
      if (!g.ok) return json({ error: 'Não foi possível guardar a conta.' }, 500);
    }
    const conta = await stripeV2(cfg.chave!, `core/accounts/${contaId}?${INCLUIR_V2}`);
    const estado = estadoDaConta(conta);
    await env.rest(`cobranca_contas?user_id=eq.${userId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...estado, atualizado_em: new Date().toISOString() }) });
    if (body.apenasEstado) return json({ ativa: true, pagamentos: estado.pagamentos_ativos, transferencias: estado.transferencias_ativas, requisitos: estado.requisitos });

    const origem = Deno.env.get('APP_ORIGIN');
    if (!origem) return json({ error: 'Falta configurar o endereço da aplicação.' }, 500);
    const ligacao = await stripeV2(cfg.chave!, 'core/account_links', { account: contaId, use_case: { type: 'account_onboarding', account_onboarding: { configurations: ['merchant'], refresh_url: origem, return_url: origem } } });
    return json({ ativa: true, url: ligacao.url });
  } catch (error) {
    console.error('[cobranca-onboarding]', error);
    return json({ error: 'Não foi possível falar com o fornecedor de pagamentos.' }, 502);
  }
});
