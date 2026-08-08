const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRICE_BY_PLAN: Record<string, string | undefined> = {
  mensal: Deno.env.get('STRIPE_PRICE_MONTHLY'),
  trimestral: Deno.env.get('STRIPE_PRICE_QUARTERLY'),
  anual: Deno.env.get('STRIPE_PRICE_YEARLY'),
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
    const priceId = PRICE_BY_PLAN[planId];

    if (!priceId) {
      return json({ error: 'Invalid or unconfigured plan.' }, 400);
    }

    const origin = safeOrigin(req.headers.get('Origin'));
    const finalSuccessUrl = safeReturnUrl(successUrl, origin, '?checkout=success');
    const finalCancelUrl = safeReturnUrl(cancelUrl, origin, '?checkout=cancelled');

    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('success_url', finalSuccessUrl);
    params.set('cancel_url', finalCancelUrl);
    params.set('customer_email', user.email);
    params.set('client_reference_id', user.id);
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', '1');
    params.set('metadata[user_id]', user.id);
    params.set('metadata[plan_id]', planId);
    params.set('subscription_data[metadata][user_id]', user.id);
    params.set('subscription_data[metadata][plan_id]', planId);

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
      return json({ error: stripeData.error?.message || 'Stripe checkout failed.' }, 400);
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
