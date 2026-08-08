const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_DETAILS: Record<string, { name: string; unitAmount: number; interval: string; months: number }> = {
  mensal: { name: 'PTMANAGER Mensal', unitAmount: 1390, interval: 'Mensal', months: 1 },
  trimestral: { name: 'PTMANAGER Trimestral', unitAmount: 3990, interval: 'Trimestral', months: 3 },
  anual: { name: 'PTMANAGER Anual', unitAmount: 12990, interval: 'Anual', months: 12 },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!stripeSecretKey || !supabaseUrl || !supabaseAnonKey) {
      return json({ error: 'Missing Stripe or Supabase environment variables.' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing authorization header.' }, 401);
    }

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: authHeader,
        apikey: supabaseAnonKey,
      },
    });

    if (!userRes.ok) {
      return json({ error: 'Invalid Supabase session.' }, 401);
    }

    const user = await userRes.json();
    const { planId, successUrl, cancelUrl } = await req.json();
    const plan = PLAN_DETAILS[planId];

    if (!plan) {
      return json({ error: 'Invalid plan.' }, 400);
    }

    const origin = safeOrigin(req.headers.get('Origin'));
    const finalSuccessUrl = safeReturnUrl(successUrl, origin, '?checkout=success');
    const finalCancelUrl = safeReturnUrl(cancelUrl, origin, '?checkout=cancelled');

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', finalSuccessUrl);
    params.set('cancel_url', finalCancelUrl);
    params.set('customer_email', user.email);
    params.set('customer_creation', 'always');
    params.set('client_reference_id', user.id);
    params.set('payment_method_types[0]', 'mb_way');
    params.set('line_items[0][price_data][currency]', 'eur');
    params.set('line_items[0][price_data][unit_amount]', String(plan.unitAmount));
    params.set('line_items[0][price_data][product_data][name]', plan.name);
    params.set('line_items[0][quantity]', '1');
    params.set('metadata[user_id]', user.id);
    params.set('metadata[plan_id]', planId);
    params.set('metadata[payment_type]', 'mb_way');
    params.set('metadata[billing_interval]', plan.interval);
    params.set('metadata[period_months]', String(plan.months));
    params.set('metadata[plan_value]', String(plan.unitAmount / 100));

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const stripeData = await stripeRes.json();
    if (!stripeRes.ok) {
      return json({ error: stripeData.error?.message || 'Stripe MB WAY checkout failed.' }, 400);
    }

    return json({ url: stripeData.url });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function safeOrigin(value: string | null) {
  try {
    const url = new URL(value || 'http://localhost:5173');
    return url.origin;
  } catch {
    return 'http://localhost:5173';
  }
}

function safeReturnUrl(value: unknown, origin: string, fallbackPath: string) {
  if (typeof value !== 'string') return `${origin}${fallbackPath}`;
  try {
    const url = new URL(value);
    return url.origin === origin ? url.toString() : `${origin}${fallbackPath}`;
  } catch {
    return `${origin}${fallbackPath}`;
  }
}
