const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey || !supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
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
    const { returnUrl } = await req.json().catch(() => ({}));
    const subscriptionRes = await fetch(
      `${supabaseUrl}/rest/v1/personal_subscriptions?user_id=eq.${encodeURIComponent(user.id)}&select=stripe_customer_id,stripe_subscription_id&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    );

    if (!subscriptionRes.ok) {
      return json({ error: await subscriptionRes.text() }, 500);
    }

    const subscriptions = await subscriptionRes.json();
    const customerId = subscriptions[0]?.stripe_customer_id;
    const subscriptionId = subscriptions[0]?.stripe_subscription_id;
    if (!customerId) {
      return json({ error: 'Stripe customer not found for this user.' }, 404);
    }
    if (!subscriptionId) {
      return json({ error: 'No recurring Stripe subscription found for this user.' }, 404);
    }

    const origin = safeOrigin(req.headers.get('Origin'));
    const params = new URLSearchParams();
    params.set('customer', customerId);
    params.set('return_url', safeReturnUrl(returnUrl, origin));

    const stripeRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const stripeData = await stripeRes.json();
    if (!stripeRes.ok) {
      return json({ error: stripeData.error?.message || 'Stripe portal failed.' }, 400);
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

function safeReturnUrl(value: unknown, origin: string) {
  if (typeof value !== 'string') return origin;
  try {
    const url = new URL(value);
    return url.origin === origin ? url.toString() : origin;
  } catch {
    return origin;
  }
}
