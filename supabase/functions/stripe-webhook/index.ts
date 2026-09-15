const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

const planByPriceId = {
  [Deno.env.get('STRIPE_PRICE_MONTHLY') || '']: { tier: 'mensal', interval: 'Mensal' },
  [Deno.env.get('STRIPE_PRICE_QUARTERLY') || '']: { tier: 'trimestral', interval: 'Trimestral' },
  [Deno.env.get('STRIPE_PRICE_YEARLY') || '']: { tier: 'anual', interval: 'Anual' },
};

// months = tempo total de acesso concedido por pagamento (já inclui os meses
// grátis); paidMonths = só os meses pagos, sem bónus -- o que se concede a
// quem já teve conta antes (ver activateOneTimePlan).
const oneTimePlanDetails = {
  mensal: { tier: 'mensal', interval: 'Mensal', value: 9.95, months: 1, paidMonths: 1 },
  trimestral: { tier: 'trimestral', interval: 'Trimestral', value: 27.90, months: 4, paidMonths: 3 },
  anual: { tier: 'anual', interval: 'Anual', value: 92.90, months: 14, paidMonths: 12 },
};

// E-mails transacionais: mesma conta e domínio já verificado do SMTP do
// Supabase Auth, mas pela API HTTP do Resend -- é o único jeito de disparar
// um e-mail a partir de uma Edge Function (o SMTP só serve os e-mails
// nativos do Supabase). Sem a chave configurada, o envio fica silenciosamente
// desligado -- nunca deve impedir o resto do webhook de correr.
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const EMAIL_FROM = 'PTMANAGER <suporte@ptmanagerapp.com>';
const APP_URL = Deno.env.get('APP_ORIGIN') || 'https://ptmanagerapp.com';
const NOME_DO_PLANO = { mensal: 'Mensal', trimestral: 'Trimestral', anual: 'Anual' };
const CADENCIA_DO_PLANO = { mensal: 'mensal', trimestral: 'a cada 3 meses', anual: 'a cada 12 meses' };

// Acesso total esperado no primeiro período de uma assinatura recorrente.
// Se o preço na Stripe já cobrir esse tempo (ex: preço trimestral configurado
// para 4 meses), o cálculo abaixo não acrescenta nada — evita duplicar o bónus.
const PLAN_ACCESS_MONTHS = { mensal: 1, trimestral: 4, anual: 14 };
const SECONDS_PER_MONTH = 30.44 * 24 * 60 * 60;

function periodStartOf(subscription) {
  return subscription.current_period_start
    || subscription.items?.data?.[0]?.current_period_start
    || subscription.start_date
    || null;
}

function periodEndOf(subscription) {
  return subscription.current_period_end
    || subscription.items?.data?.[0]?.current_period_end
    || subscription.cancel_at
    || null;
}

// O bónus só vale no primeiro ciclo: nas renovações o período volta ao normal.
// Quando há trial, o primeiro ciclo A SÉRIO só começa quando o trial acaba
// -- current_period_start desse ciclo fica ~7 dias depois de start_date, não
// no dia seguinte. Comparar sempre contra start_date fazia isFirstCycle()
// devolver falso logo na primeira cobrança pós-trial, apagando o bónus de
// trimestral/anual sem nenhum erro a avisar (só não se notava em mensal,
// que não tem bónus a perder). trial_end é o instante certo para comparar
// quando existiu trial; sem trial, continua a ser start_date, como sempre.
function isFirstCycle(subscription) {
  const start = subscription.trial_end || subscription.start_date;
  const periodStart = periodStartOf(subscription);
  if (!start || !periodStart) return false;
  return Math.abs(periodStart - start) < 24 * 60 * 60;
}

// Quantos meses de bónus ainda faltam para chegar ao acesso prometido.
// `jaTeveConta` vem de uma leitura a personal_subscriptions feita ANTES do
// upsert desta chamada (ver syncSubscription) -- o "primeiro ciclo" é do
// objeto de subscrição da Stripe, não da conta: cancelar e voltar a assinar
// cria uma subscrição nova, com start_date novo, e isFirstCycle() sozinho
// deixava repetir o bónus indefinidamente. Verificar contra a linha existente
// em vez de um registo de eventos evita uma corrida entre dois webhooks quase
// simultâneos (checkout.session.completed e customer.subscription.updated
// chegam frequentemente juntos) a negarem o bónus um ao outro.
function bonusMonthsFor(subscription, tier, jaTeveConta) {
  const accessMonths = PLAN_ACCESS_MONTHS[tier];
  // Durante o trial o "período" são os 7 dias grátis, não um mês pago -- sem
  // esta guarda, o cálculo via coveredMonths achava que faltava quase um mês
  // inteiro por cobrir e esticava current_period_end para lá do fim do trial.
  if (!accessMonths || subscription.status === 'trialing' || !isFirstCycle(subscription) || jaTeveConta) return 0;
  const start = periodStartOf(subscription);
  const end = periodEndOf(subscription);
  if (!start || !end || end <= start) return 0;
  const coveredMonths = Math.round((end - start) / SECONDS_PER_MONTH);
  return Math.max(0, accessMonths - coveredMonths);
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
      return json({ error: 'Missing environment variables.' }, 500);
    }

    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');
    if (!signature) return json({ error: 'Missing Stripe signature.' }, 400);

    const verified = await verifyStripeSignature(rawBody, signature, webhookSecret);
    if (!verified) return json({ error: 'Invalid Stripe signature.' }, 400);

    const event = JSON.parse(rawBody);
    if (!relevantEvents.has(event.type)) return json({ received: true, ignored: true });

    if (event.type === 'checkout.session.completed') {
      await handleCheckoutSessionCompleted(event.data.object, stripeSecretKey, supabaseUrl, serviceRoleKey, event.id);
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      // Volta a ler a subscrição à Stripe em vez de confiar na fotografia
      // presa ao evento: um evento antigo capturado e reenviado (a
      // assinatura, sozinha, não tem validade -- só prova quem a fez, não
      // quando) ficaria a repor um estado ultrapassado. A leitura ao vivo
      // devolve sempre o estado atual, mesmo que o evento seja velho.
      const subscription = await stripeGet(`/v1/subscriptions/${event.data.object.id}`, stripeSecretKey);
      await syncSubscription(subscription, stripeSecretKey, supabaseUrl, serviceRoleKey, { stripeEventId: event.id });
    }

    if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.payment_failed') {
      await handleInvoice(event.data.object, event.type, stripeSecretKey, supabaseUrl, serviceRoleKey, event.id);
    }

    return json({ received: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected webhook error.' }, 500);
  }
});

async function handleCheckoutSessionCompleted(session, stripeSecretKey, supabaseUrl, serviceRoleKey, stripeEventId) {
  if (session.mode === 'payment' && session.metadata?.payment_type === 'mb_way') {
    await activateOneTimePlan(session, supabaseUrl, serviceRoleKey, stripeEventId);
    return;
  }
  if (!session.subscription) return;
  const subscription = await stripeGet(`/v1/subscriptions/${session.subscription}`, stripeSecretKey);
  await syncSubscription(subscription, stripeSecretKey, supabaseUrl, serviceRoleKey, { stripeEventId });
}

async function activateOneTimePlan(session, supabaseUrl, serviceRoleKey, stripeEventId) {
  if (session.payment_status !== 'paid') return;

  const userId = session.metadata?.user_id || session.client_reference_id;
  if (!userId) return;

  const planId = session.metadata?.plan_id;
  const plan = oneTimePlanDetails[planId] || oneTimePlanDetails.mensal;
  // O MB WAY não tem "renovação" a distinguir de "primeira vez" como a
  // subscrição da Stripe -- sem isto, comprar trimestral/anual repetidamente
  // dava sempre o mês grátis, sem precisar sequer de cancelar entre compras.
  const anteriorRow = await readSubscriptionRow(userId, supabaseUrl, serviceRoleKey);
  const primeiraVez = !anteriorRow;
  const mesesConcedidos = primeiraVez
    ? (Number(session.metadata?.period_months) || plan.months)
    : plan.paidMonths;
  const periodStart = session.created ? new Date(session.created * 1000) : new Date();
  const periodEnd = addMonths(periodStart, mesesConcedidos);

  const payload = {
    user_id: userId,
    plan_status: 'active',
    plan_tier: plan.tier,
    plan_value: Number(session.metadata?.plan_value) || plan.value,
    billing_interval: `${plan.interval} via MB WAY`,
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: false,
    payment_method_brand: 'MB WAY',
    payment_method_last4: null,
    stripe_customer_id: asId(session.customer),
    stripe_subscription_id: null,
    last_payment_status: 'paid_mb_way',
    updated_at: new Date().toISOString(),
  };

  await supabaseUpsertSubscription(payload, supabaseUrl, serviceRoleKey);

  // Regista sempre -- é esta linha que faz a próxima compra, MB WAY ou
  // Stripe, reconhecer que esta conta já teve acesso antes.
  const tipo = primeiraVez ? 'created' : 'renewed';
  const registado = await registarEvento({
    user_id: userId,
    event_type: tipo,
    from_tier: null,
    to_tier: plan.tier,
    amount: payload.plan_value,
    stripe_event_id: stripeEventId || null,
    occurred_at: new Date().toISOString(),
    raw: { status: 'active', interval: payload.billing_interval },
  }, supabaseUrl, serviceRoleKey);

  if (registado) await enviarEmailDeEvento(tipo, userId, payload, supabaseUrl, serviceRoleKey);
}

async function handleInvoice(invoice, eventType, stripeSecretKey, supabaseUrl, serviceRoleKey, stripeEventId) {
  if (!invoice.subscription) return;
  const subscription = await stripeGet(`/v1/subscriptions/${invoice.subscription}`, stripeSecretKey);
  await syncSubscription(subscription, stripeSecretKey, supabaseUrl, serviceRoleKey, {
    lastPaymentStatus: eventType === 'invoice.payment_succeeded' ? 'paid' : 'failed',
    stripeEventId,
  });
}

// Ordem dos planos, para distinguir upgrade de downgrade.
const TIER_ORDER = ['mensal', 'trimestral', 'anual'];

async function readSubscriptionRow(userId, supabaseUrl, serviceRoleKey) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/personal_subscriptions?user_id=eq.${encodeURIComponent(userId)}&select=plan_tier,plan_status,cancel_at_period_end&limit=1`,
    { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } },
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

// Traduz a diferença entre o estado anterior e o novo num tipo de evento.
// Devolve null quando nada de relevante mudou, para não encher a tabela de ruído.
function derivarEvento(anterior, payload, overrides) {
  if (!anterior) return payload.plan_status === 'trialing' ? 'trial_started' : 'created';
  if (payload.plan_status === 'canceled' && anterior.plan_status !== 'canceled') {
    return anterior.plan_status === 'trialing' ? 'trial_canceled' : 'canceled';
  }
  // O trial acaba de virar cobrança a sério -- é a transição mais importante
  // de rastrear neste fluxo inteiro, por isso ganha o próprio tipo em vez de
  // cair em "renewed" (que também é verdade, mas esconde que veio de um trial).
  if (anterior.plan_status === 'trialing' && payload.plan_status === 'active') return 'trial_converted';

  if (payload.plan_tier && anterior.plan_tier && payload.plan_tier !== anterior.plan_tier) {
    const de = TIER_ORDER.indexOf(anterior.plan_tier);
    const para = TIER_ORDER.indexOf(payload.plan_tier);
    if (de >= 0 && para >= 0) return para > de ? 'upgraded' : 'downgraded';
    return 'plan_changed';
  }

  if (payload.cancel_at_period_end && !anterior.cancel_at_period_end) return 'cancel_scheduled';
  if (!payload.cancel_at_period_end && anterior.cancel_at_period_end) return 'reactivated';

  if (overrides.lastPaymentStatus === 'failed' || payload.plan_status === 'past_due') return 'payment_failed';
  if (overrides.lastPaymentStatus === 'paid') return 'renewed';
  return null;
}

// O registo do evento é secundário: se falhar, o webhook tem de continuar a
// devolver 200, senão a Stripe reenvia e a subscrição fica por sincronizar.
//
// Devolve true só quando a linha entrou mesmo. Um reenvio da Stripe com o
// mesmo stripe_event_id bate no "ON CONFLICT DO NOTHING" (via
// resolution=ignore-duplicates) e o RETURNING não traz nada -- é o sinal
// certo para decidir se dispara um e-mail: só quando o evento é
// genuinamente novo, nunca num reenvio.
async function registarEvento(evento, supabaseUrl, serviceRoleKey) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/subscription_events`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation,resolution=ignore-duplicates',
      },
      body: JSON.stringify(evento),
    });
    if (!res.ok) return false;
    const linhas = await res.json();
    return Array.isArray(linhas) && linhas.length > 0;
  } catch (_) {
    return false; /* histórico é acessório: nunca derruba a sincronização */
  }
}

// Só estes três tipos de transição têm e-mail. Uma renovação recorrente
// (tipo 'renewed') não tem -- ninguém precisa de um e-mail a cada mês só
// porque o cartão foi cobrado como esperado.
function escolherModeloDeEmail(tipo, payload) {
  if (tipo === 'trial_started') return modeloTrialComecou;
  if (tipo === 'trial_converted') return modeloPagamentoConfirmado;
  // 'created' cobre dois casos que não passam pelo trial: a compra MB WAY
  // (nunca tem trial) e uma subscrição Stripe que nasce já ativa (quem já
  // teve conta antes não recebe trial_period_days -- ver userHasPriorSubscription
  // em create-checkout-session). Os dois são um pagamento já confirmado.
  if (tipo === 'created' && payload.plan_status === 'active') return modeloPagamentoConfirmado;
  if (tipo === 'payment_failed') return modeloPagamentoFalhou;
  return null;
}

async function enviarEmailDeEvento(tipo, userId, payload, supabaseUrl, serviceRoleKey) {
  if (!RESEND_API_KEY) return;
  const modelo = escolherModeloDeEmail(tipo, payload);
  if (!modelo) return;
  try {
    const utilizador = await emailDoUtilizador(userId, supabaseUrl, serviceRoleKey);
    if (!utilizador) return;
    const { subject, html } = modelo({ ...payload, nome: utilizador.nome });
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to: utilizador.email, subject, html }),
    });
    if (!res.ok) console.error('[PTMANAGER] falha ao enviar e-mail', tipo, await res.text());
  } catch (error) {
    console.error('[PTMANAGER] falha ao enviar e-mail', tipo, error);
  }
}

// A API de administração do Supabase devolve o utilizador diretamente nuns
// SDKs e embrulhado em { user } noutros -- aceitar as duas formas em vez de
// arriscar um "email indefinido" por causa da forma errada.
async function emailDoUtilizador(userId, supabaseUrl, serviceRoleKey) {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const user = data.user || data;
  if (!user?.email) return null;
  return { email: user.email, nome: user.user_metadata?.nome || '' };
}

function formatEuro(value) {
  if (value == null) return '';
  return `€${Number(value).toFixed(2).replace('.', ',')}`;
}

// Sem depender de dados de locale do Deno (ICU pode não estar completo no
// runtime das Edge Functions) -- dd/mm/aaaa escrito à mão.
function formatDataPT(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dia = String(d.getUTCDate()).padStart(2, '0');
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${d.getUTCFullYear()}`;
}

function layoutEmail(preheader, corpo) {
  return `<!doctype html>
<html lang="pt">
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <tr><td style="background-color:#111113;padding:24px 32px;">
            <span style="color:#f5c542;font-size:18px;font-weight:700;letter-spacing:0.02em;">PTMANAGER</span>
          </td></tr>
          <tr><td style="padding:32px;color:#18181b;font-size:15px;line-height:1.6;">
            ${corpo}
          </td></tr>
          <tr><td style="padding:20px 32px;background-color:#fafafa;color:#71717a;font-size:12px;">
            PTMANAGER — gestão para personal trainers independentes.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function botaoEmail(texto, href) {
  return `<a href="${href}" style="display:inline-block;background-color:#f5c542;color:#111113;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;">${texto}</a>`;
}

function modeloTrialComecou(payload) {
  const plano = NOME_DO_PLANO[payload.plan_tier] || payload.plan_tier;
  const dataFim = formatDataPT(payload.current_period_end);
  const valor = formatEuro(payload.plan_value);
  const cadencia = CADENCIA_DO_PLANO[payload.plan_tier] || '';
  const corpo = `
    <p style="margin:0 0 16px;">Olá${payload.nome ? `, ${payload.nome}` : ''}!</p>
    <p style="margin:0 0 16px;">A sua conta no PTMANAGER foi criada e o seu <strong>período de 7 dias grátis</strong> já começou, no plano <strong>${plano}</strong>.</p>
    <p style="margin:0 0 16px;">Durante este período pode organizar os seus alunos, agenda, treinos, avaliações e finanças sem qualquer custo.</p>
    <p style="margin:0 0 16px;">O período gratuito termina a <strong>${dataFim}</strong>. Depois dessa data, a assinatura segue para a cobrança de <strong>${valor}</strong> (${cadencia}), no cartão que já indicou — não precisa de fazer mais nada até lá.</p>
    <p style="margin:24px 0;">${botaoEmail('Aceder ao PTMANAGER', APP_URL)}</p>
    <p style="margin:0;color:#71717a;font-size:13px;">Se cancelar antes de ${dataFim}, não paga nada.</p>
  `;
  return {
    subject: 'Bem-vindo ao PTMANAGER — os seus 7 dias grátis começaram',
    html: layoutEmail('Os seus 7 dias grátis já começaram.', corpo),
  };
}

function modeloPagamentoConfirmado(payload) {
  const plano = NOME_DO_PLANO[payload.plan_tier] || payload.plan_tier;
  const valor = formatEuro(payload.plan_value);
  const data = formatDataPT(payload.current_period_end);
  // MB WAY não é recorrente (ver CLAUDE.md) -- só uma subscrição Stripe a
  // sério tem stripe_subscription_id. Dizer "próxima cobrança" a quem pagou
  // por MB WAY prometeria uma cobrança automática que nunca vai acontecer.
  const recorrente = Boolean(payload.stripe_subscription_id);
  const rotuloData = recorrente ? 'Próxima cobrança' : 'Acesso até';
  const corpo = `
    <p style="margin:0 0 16px;">Olá${payload.nome ? `, ${payload.nome}` : ''}!</p>
    <p style="margin:0 0 16px;">O seu pagamento foi confirmado e a sua assinatura do PTMANAGER está <strong>ativa</strong>.</p>
    <table role="presentation" style="width:100%;margin:0 0 16px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#71717a;">Plano</td><td style="padding:6px 0;text-align:right;font-weight:600;">${plano}</td></tr>
      <tr><td style="padding:6px 0;color:#71717a;">Valor</td><td style="padding:6px 0;text-align:right;font-weight:600;">${valor}</td></tr>
      ${data ? `<tr><td style="padding:6px 0;color:#71717a;">${rotuloData}</td><td style="padding:6px 0;text-align:right;font-weight:600;">${data}</td></tr>` : ''}
    </table>
    <p style="margin:24px 0;">${botaoEmail('Aceder ao PTMANAGER', APP_URL)}</p>
    <p style="margin:0;color:#71717a;font-size:13px;">${recorrente ? 'Obrigado por usar o PTMANAGER.' : 'Este pagamento não é recorrente -- para continuar depois dessa data, basta renovar quando quiser.'}</p>
  `;
  return {
    subject: 'Pagamento confirmado — a sua assinatura PTMANAGER está ativa',
    html: layoutEmail('O seu pagamento foi confirmado.', corpo),
  };
}

function modeloPagamentoFalhou(payload) {
  const corpo = `
    <p style="margin:0 0 16px;">Olá${payload.nome ? `, ${payload.nome}` : ''}!</p>
    <p style="margin:0 0 16px;">Não conseguimos processar o pagamento da sua assinatura PTMANAGER.</p>
    <p style="margin:0 0 16px;">Isto costuma acontecer por um cartão expirado, sem saldo, ou por um bloqueio do próprio banco. A sua conta continua acessível por agora, mas convém atualizar os dados de pagamento para evitar uma interrupção.</p>
    <p style="margin:24px 0;">${botaoEmail('Atualizar pagamento', APP_URL)}</p>
    <p style="margin:0;color:#71717a;font-size:13px;">Se já tratou disto entretanto, pode ignorar este e-mail.</p>
  `;
  return {
    subject: 'Não conseguimos processar o seu pagamento PTMANAGER',
    html: layoutEmail('Precisa de atualizar o método de pagamento.', corpo),
  };
}

async function syncSubscription(subscription, stripeSecretKey, supabaseUrl, serviceRoleKey, overrides = {}) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  const firstItem = subscription.items?.data?.[0];
  const priceId = firstItem?.price?.id || '';
  const plan = planByPriceId[priceId] || {
    tier: subscription.metadata?.plan_id || 'desconhecido',
    interval: firstItem?.price?.recurring?.interval || null,
  };

  const paymentMethod = subscription.default_payment_method
    ? await stripeGet(`/v1/payment_methods/${subscription.default_payment_method}`, stripeSecretKey)
    : null;

  const planValue = firstItem?.price?.unit_amount != null ? firstItem.price.unit_amount / 100 : null;
  const deleted = subscription.status === 'canceled';
  // 'trialing' grava-se como o seu próprio estado, não como 'active' -- o
  // acesso é o mesmo (ver has_personal_app_access no schema), mas confundir
  // os dois faria a aplicação nunca saber dizer "ainda não foi cobrado".
  const trialing = subscription.status === 'trialing';
  const active = subscription.status === 'active';
  const pastDue = ['past_due', 'unpaid', 'incomplete', 'incomplete_expired'].includes(subscription.status);

  // Lida antes do bónus e do upsert, para servir aos dois: ao bónus, como
  // prova de que esta conta já teve subscrição; ao registo de eventos, como
  // o estado a comparar com o novo.
  const anterior = await readSubscriptionRow(userId, supabaseUrl, serviceRoleKey);

  const rawPeriodEnd = periodEndOf(subscription);
  const bonusMonths = bonusMonthsFor(subscription, plan.tier, Boolean(anterior));
  const periodEndIso = bonusMonths && rawPeriodEnd
    ? addMonths(new Date(rawPeriodEnd * 1000), bonusMonths).toISOString()
    : toIso(rawPeriodEnd);

  const payload = {
    user_id: userId,
    plan_status: deleted ? 'canceled' : trialing ? 'trialing' : active ? 'active' : pastDue ? 'past_due' : subscription.status,
    plan_tier: plan.tier,
    plan_value: planValue,
    billing_interval: plan.interval,
    current_period_start: toIso(periodStartOf(subscription)),
    current_period_end: periodEndIso,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    payment_method_brand: paymentMethod?.card?.brand || null,
    payment_method_last4: paymentMethod?.card?.last4 || null,
    stripe_customer_id: asId(subscription.customer),
    stripe_subscription_id: subscription.id,
    last_payment_status: overrides.lastPaymentStatus || subscription.status,
    updated_at: new Date().toISOString(),
  };

  await supabaseUpsertSubscription(payload, supabaseUrl, serviceRoleKey);

  const tipo = derivarEvento(anterior, payload, overrides);
  if (tipo) {
    const registado = await registarEvento({
      user_id: userId,
      event_type: tipo,
      from_tier: anterior?.plan_tier || null,
      to_tier: payload.plan_tier || null,
      amount: planValue,
      stripe_event_id: overrides.stripeEventId || null,
      occurred_at: new Date().toISOString(),
      raw: { status: payload.plan_status, interval: payload.billing_interval },
    }, supabaseUrl, serviceRoleKey);

    if (registado) await enviarEmailDeEvento(tipo, userId, payload, supabaseUrl, serviceRoleKey);
  }
}

async function stripeGet(path, stripeSecretKey) {
  const response = await fetch(`https://api.stripe.com${path}`, {
    headers: { Authorization: `Bearer ${stripeSecretKey}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Stripe request failed.');
  return data;
}

async function supabaseUpsertSubscription(payload, supabaseUrl, serviceRoleKey) {
  const response = await fetch(`${supabaseUrl}/rest/v1/personal_subscriptions`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await response.text());
}

// Tolerância recomendada pela própria Stripe: um pedido com uma assinatura
// válida mas um "t" fora desta janela é quase sempre um replay de um evento
// capturado antes -- a assinatura, sozinha, prova quem o fez, não quando.
const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

async function verifyStripeSignature(payload, signatureHeader, secret) {
  const parts = Object.fromEntries(signatureHeader.split(',').map((part) => {
    const [key, value] = part.split('=');
    return [key, value];
  }));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > SIGNATURE_TOLERANCE_SECONDS) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  return timingSafeEqual(hex(digest), signature);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function hex(buffer) {
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function toIso(value) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function asId(value) {
  return typeof value === 'string' ? value : value?.id || null;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
