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

// months = tempo total de acesso concedido por pagamento (já inclui os meses grátis).
const oneTimePlanDetails = {
  mensal: { tier: 'mensal', interval: 'Mensal', value: 13.90, months: 1 },
  trimestral: { tier: 'trimestral', interval: 'Trimestral', value: 39.90, months: 4 },
  anual: { tier: 'anual', interval: 'Anual', value: 129.90, months: 14 },
};

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
function isFirstCycle(subscription) {
  const start = subscription.start_date;
  const periodStart = periodStartOf(subscription);
  if (!start || !periodStart) return false;
  return Math.abs(periodStart - start) < 24 * 60 * 60;
}

// Quantos meses de bónus ainda faltam para chegar ao acesso prometido.
function bonusMonthsFor(subscription, tier) {
  const accessMonths = PLAN_ACCESS_MONTHS[tier];
  if (!accessMonths || !isFirstCycle(subscription)) return 0;
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
      await syncSubscription(event.data.object, stripeSecretKey, supabaseUrl, serviceRoleKey, { stripeEventId: event.id });
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
    await activateOneTimePlan(session, supabaseUrl, serviceRoleKey);
    return;
  }
  if (!session.subscription) return;
  const subscription = await stripeGet(`/v1/subscriptions/${session.subscription}`, stripeSecretKey);
  await syncSubscription(subscription, stripeSecretKey, supabaseUrl, serviceRoleKey, { stripeEventId });
}

async function activateOneTimePlan(session, supabaseUrl, serviceRoleKey) {
  if (session.payment_status !== 'paid') return;

  const userId = session.metadata?.user_id || session.client_reference_id;
  if (!userId) return;

  const planId = session.metadata?.plan_id;
  const plan = oneTimePlanDetails[planId] || oneTimePlanDetails.mensal;
  const periodStart = session.created ? new Date(session.created * 1000) : new Date();
  const periodEnd = addMonths(periodStart, Number(session.metadata?.period_months) || plan.months);

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
  if (!anterior) return 'created';
  if (payload.plan_status === 'canceled' && anterior.plan_status !== 'canceled') return 'canceled';

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
async function registarEvento(evento, supabaseUrl, serviceRoleKey) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/subscription_events`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        // Reenvio da Stripe com o mesmo stripe_event_id é ignorado em silêncio.
        Prefer: 'resolution=ignore-duplicates',
      },
      body: JSON.stringify(evento),
    });
  } catch (_) { /* histórico é acessório: nunca derruba a sincronização */ }
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
  const active = ['active', 'trialing'].includes(subscription.status);
  const pastDue = ['past_due', 'unpaid', 'incomplete', 'incomplete_expired'].includes(subscription.status);

  const rawPeriodEnd = periodEndOf(subscription);
  const bonusMonths = bonusMonthsFor(subscription, plan.tier);
  const periodEndIso = bonusMonths && rawPeriodEnd
    ? addMonths(new Date(rawPeriodEnd * 1000), bonusMonths).toISOString()
    : toIso(rawPeriodEnd);

  const payload = {
    user_id: userId,
    plan_status: deleted ? 'canceled' : active ? 'active' : pastDue ? 'past_due' : subscription.status,
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

  // Ler o estado anterior antes de o substituir, para saber o que mudou.
  const anterior = await readSubscriptionRow(userId, supabaseUrl, serviceRoleKey);

  await supabaseUpsertSubscription(payload, supabaseUrl, serviceRoleKey);

  const tipo = derivarEvento(anterior, payload, overrides);
  if (tipo) {
    await registarEvento({
      user_id: userId,
      event_type: tipo,
      from_tier: anterior?.plan_tier || null,
      to_tier: payload.plan_tier || null,
      amount: planValue,
      stripe_event_id: overrides.stripeEventId || null,
      occurred_at: new Date().toISOString(),
      raw: { status: payload.plan_status, interval: payload.billing_interval },
    }, supabaseUrl, serviceRoleKey);
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

async function verifyStripeSignature(payload, signatureHeader, secret) {
  const parts = Object.fromEntries(signatureHeader.split(',').map((part) => {
    const [key, value] = part.split('=');
    return [key, value];
  }));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

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
