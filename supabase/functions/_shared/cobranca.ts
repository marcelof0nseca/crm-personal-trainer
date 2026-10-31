// Cobrança aluno → treinador. Outro domínio, outro segredo e outro webhook da subscrição
// do PTMANAGER: nada daqui toca em `personal_subscriptions` nem em STRIPE_SECRET_KEY.
// Enquanto o serviço não estiver ligado, as funções dizem isso e não fazem mais nada.
// Chaves de produção só com autorização explícita (STRIPE_CONNECT_LIVE=true).
export function configuracaoConnect() {
  const ligado = Deno.env.get('STRIPE_CONNECT_ENABLED') === 'true';
  const chave = Deno.env.get('STRIPE_CONNECT_SECRET_KEY') || '';
  if (!ligado || !chave) return { ativa: false, motivo: 'A cobrança online ainda não está ligada no servidor.' };
  if (!chave.startsWith('sk_test_') && Deno.env.get('STRIPE_CONNECT_LIVE') !== 'true') return { ativa: false, motivo: 'A cobrança online está só em modo de teste.' };
  return { ativa: true, chave };
}

export async function stripe(chave: string, caminho: string, campos?: Record<string, string>, conta?: string) {
  const r = await fetch(`https://api.stripe.com/v1/${caminho}`, {
    method: campos ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${chave}`, ...(campos ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}), ...(conta ? { 'Stripe-Account': conta } : {}) },
    body: campos ? new URLSearchParams(campos) : undefined,
  });
  const dados = await r.json();
  if (!r.ok) throw new Error(dados?.error?.message || `Stripe ${r.status}`);
  return dados;
}

export function estadoDaConta(a: any) {
  return { pagamentos_ativos: Boolean(a.charges_enabled), transferencias_ativas: Boolean(a.payouts_enabled), requisitos: a.requirements?.currently_due || [] };
}
