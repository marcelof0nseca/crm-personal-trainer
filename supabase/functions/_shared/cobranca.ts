// Cobrança aluno → treinador. Outro domínio, outro segredo e outro webhook da subscrição
// do PTMANAGER: nada daqui toca em `personal_subscriptions` nem em STRIPE_SECRET_KEY.
// Enquanto o serviço não estiver ligado, as funções dizem isso e não fazem mais nada.
// Chaves de produção só com autorização explícita (STRIPE_CONNECT_LIVE=true).
import { estadoDaFatura, pagoDaFatura, totalDaFatura } from './vista-aluno.ts';

// Em modo de teste, só as contas em STRIPE_CONNECT_TESTERS (ids separados por
// vírgulas) a veem: um treinador a sério punha os seus dados num cadastro de teste,
// que nunca recebe dinheiro. Sem a lista, ninguém. Com a chave de produção e
// STRIPE_CONNECT_LIVE=true, fica para todos.
export function configuracaoConnect(userId?: string | null) {
  const ligado = Deno.env.get('STRIPE_CONNECT_ENABLED') === 'true';
  const chave = Deno.env.get('STRIPE_CONNECT_SECRET_KEY') || '';
  if (!ligado || !chave) return { ativa: false, motivo: 'A cobrança online ainda não está ligada no servidor.' };
  const teste = chave.startsWith('sk_test_');
  if (!teste && Deno.env.get('STRIPE_CONNECT_LIVE') !== 'true') return { ativa: false, motivo: 'A cobrança online está só em modo de teste.' };
  if (teste) {
    const testadores = (Deno.env.get('STRIPE_CONNECT_TESTERS') || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!userId || !testadores.includes(userId)) return { ativa: false, motivo: 'A cobrança online ainda não está disponível. Até lá, registe os pagamentos à mão nas faturas.' };
  }
  return { ativa: true, chave };
}

export async function stripe(chave: string, caminho: string, campos?: Record<string, string>, conta?: string, idempotencia?: string) {
  const r = await fetch(`https://api.stripe.com/v1/${caminho}`, {
    method: campos ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${chave}`, ...(campos ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}), ...(conta ? { 'Stripe-Account': conta } : {}), ...(idempotencia ? { 'Idempotency-Key': idempotencia } : {}) },
    body: campos ? new URLSearchParams(campos) : undefined,
  });
  const dados = await r.json();
  if (!r.ok) throw new Error(dados?.error?.message || `Stripe ${r.status}`);
  return dados;
}

// As contas dos treinadores são da API v2 do Stripe: numa plataforma Connect nova, a v1
// já não cria contas. O resto (Checkout, reembolsos) continua na v1, com Stripe-Account.
export const VERSAO_V2 = '2026-10-28.endive';
export async function stripeV2(chave: string, caminho: string, corpo?: Record<string, unknown>) {
  const r = await fetch(`https://api.stripe.com/v2/${caminho}`, {
    method: corpo ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${chave}`, 'Stripe-Version': VERSAO_V2, ...(corpo ? { 'Content-Type': 'application/json' } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const dados = await r.json();
  if (!r.ok) throw new Error(dados?.error?.message || `Stripe v2 ${r.status}`);
  return dados;
}

// Conta com painel próprio, em que as taxas e as perdas ficam com o Stripe e o treinador,
// nunca com a plataforma: o equivalente da antiga conta Standard.
export const contaNovaV2 = (userId: string) => ({
  dashboard: 'full',
  identity: { country: 'pt' },
  configuration: { merchant: { capabilities: { card_payments: { requested: true } } } },
  defaults: { currency: 'eur', locales: ['pt-PT'], responsibilities: { fees_collector: 'stripe', losses_collector: 'stripe' } },
  metadata: { user_id: userId },
  include: ['configuration.merchant', 'requirements'],
});
export const INCLUIR_V2 = 'include[0]=configuration.merchant&include[1]=requirements';

// A sessão de pagamento de uma fatura. O valor sai sempre da fatura gravada. Uma sessão
// dura uma hora e pedir de novo nessa hora devolve a mesma, para não haver duas abertas.
export async function sessaoDaFatura(chave: string, env: any, { userId, fatura, sucesso, cancelado }: any) {
  const c = await env.rest(`cobranca_contas?user_id=eq.${userId}&select=stripe_account_id,pagamentos_ativos&limit=1`);
  const conta = c.ok ? (await c.json())[0] : null;
  if (!conta || !conta.pagamentos_ativos) return { erro: 'O pagamento online não está ativo nesta conta.', estado: 400 };
  const agora = Date.now();
  const hoje = new Date(agora).toISOString().slice(0, 10);
  if (!['aberta', 'vencida', 'parcial'].includes(estadoDaFatura(fatura, hoje))) return { erro: 'Esta fatura não está por pagar.', estado: 400 };
  const emFalta = totalDaFatura(fatura) - pagoDaFatura(fatura);
  if (!(emFalta > 0)) return { erro: 'Esta fatura não está por pagar.', estado: 400 };
  const hora = Math.floor(agora / 3600000);
  const sessao = await stripe(chave, 'checkout/sessions', {
    mode: 'payment', success_url: sucesso, cancel_url: cancelado, expires_at: String(Math.floor(agora / 1000) + 3660),
    'line_items[0][quantity]': '1', 'line_items[0][price_data][currency]': String(fatura.moeda || 'EUR').toLowerCase(), 'line_items[0][price_data][unit_amount]': String(emFalta), 'line_items[0][price_data][product_data][name]': String(fatura.itens?.[0]?.descricao || 'Fatura').slice(0, 120),
    client_reference_id: fatura.id, 'metadata[user_id]': userId, 'metadata[aluno_id]': fatura.studentId, 'metadata[fatura_id]': fatura.id, 'metadata[dominio]': 'aluno',
  }, conta.stripe_account_id, `fatura:${fatura.id}:${emFalta}:${hora}`);
  return { url: sessao.url };
}

// Lê as duas formas: a da v2 (as contas novas) e a da v1 (o evento account.updated).
export function estadoDaConta(a: any) {
  if (a?.object === 'v2.core.account') {
    const cap = a.configuration?.merchant?.capabilities || {};
    const emFalta = (a.requirements?.entries || []).filter((e: any) => ['currently_due', 'past_due'].includes(e?.minimum_deadline?.status));
    return { pagamentos_ativos: cap.card_payments?.status === 'active', transferencias_ativas: cap.stripe_balance?.payouts?.status === 'active', requisitos: emFalta.map((e: any) => String(e.description || 'dado em falta')) };
  }
  return { pagamentos_ativos: Boolean(a.charges_enabled), transferencias_ativas: Boolean(a.payouts_enabled), requisitos: a.requirements?.currently_due || [] };
}
