// APP_ORIGIN é a origem real do site (ex.: https://ptmanagerapp.com),
// configurada como secret no Supabase. Sem isto, o CORS e a validação do
// success_url/cancel_url confiavam no cabeçalho Origin do próprio pedido --
// que um cliente fora do browser (curl, script) escreve à vontade, e que um
// browser real também envia em pedidos vindos de qualquer origem. Um pedido
// com Origin forjado conseguia pôr a Stripe a redirecionar o comprador, a
// seguir a um pagamento verdadeiro, para um domínio à escolha do atacante.
const APP_ORIGIN = Deno.env.get('APP_ORIGIN') || '';
// Só para desenvolvimento local: portas fixas, nunca derivadas do pedido.
const DEV_ORIGINS = new Set(['http://localhost:5173', 'http://localhost:5199', 'http://localhost:5208', 'http://localhost:5210']);

const corsHeaders = {
  'Access-Control-Allow-Origin': APP_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  Vary: 'Origin',
};

const PRICE_BY_PLAN: Record<string, string | undefined> = {
  mensal: Deno.env.get('STRIPE_PRICE_MONTHLY'),
  trimestral: Deno.env.get('STRIPE_PRICE_QUARTERLY'),
  anual: Deno.env.get('STRIPE_PRICE_YEARLY'),
};

// Os três planos têm 7 dias grátis. Em trimestral e anual, o trial soma-se
// ao bónus de meses grátis que já tinham -- os dois incentivos coexistem de
// propósito (decisão de produto), o bónus continua a aplicar-se à primeira
// cobrança a sério, só que agora essa cobrança só acontece depois do trial.
const TRIAL_DAYS_BY_PLAN: Record<string, number> = { mensal: 7, trimestral: 7, anual: 7 };

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

    const origin = trustedOrigin(req.headers.get('Origin'));
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

    // Os 7 dias grátis só valem para quem nunca teve conta -- decidido aqui,
    // no servidor, nunca por algo que o cliente peça. Cancelar e voltar a
    // assinar, ou tentar de novo depois de um trial anterior, não repete o
    // trial: a mesma verificação que já impede o bónus de "meses grátis"
    // repetido (ver stripe-webhook).
    const trialDays = TRIAL_DAYS_BY_PLAN[planId];
    if (trialDays) {
      const jaTeveConta = await userHasPriorSubscription(supabaseUrl, supabaseAnonKey, authHeader);
      if (!jaTeveConta) {
        params.set('subscription_data[trial_period_days]', String(trialDays));
        // Sem isto, uma subscrição em trial cujo cartão falhe ao fim dos 7
        // dias fica "incomplete" indefinidamente em vez de se resolver --
        // cancela e liberta o lugar para tentar de novo, em vez de prender
        // a conta num limbo que nem cobra nem liberta.
        params.set('subscription_data[trial_settings][end_behavior][missing_payment_method]', 'cancel');
        params.set('payment_method_collection', 'always');
      }
    }

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

// Lê pela API do próprio utilizador (não service_role) -- a política "Users
// can read own subscription" já garante que só vê a própria linha, e não
// precisamos de um privilégio maior só para esta pergunta de sim/não.
// Falha fechada (nega o trial) se o pedido em si falhar: ao contrário do
// bónus de meses grátis, conceder um trial a mais é um desconto que se
// repete sozinho se o mecanismo tiver um problema -- mais vale negar um
// trial genuíno por uma falha rara do que abrir essa porta.
async function userHasPriorSubscription(supabaseUrl: string, supabaseAnonKey: string, authHeader: string) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/personal_subscriptions?select=user_id&limit=1`, {
      headers: { apikey: supabaseAnonKey, Authorization: authHeader },
    });
    if (!res.ok) return true;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch (_) {
    return true;
  }
}

// A origem de confiança é sempre APP_ORIGIN quando está configurado. O
// cabeçalho Origin do pedido só é aceite como alternativa para as portas
// fixas de desenvolvimento local -- nunca para o que o pedido disser que é.
function trustedOrigin(requestOrigin: string | null) {
  if (APP_ORIGIN) return APP_ORIGIN;
  if (requestOrigin && DEV_ORIGINS.has(requestOrigin)) return requestOrigin;
  return 'http://localhost:5173';
}

function safeReturnUrl(value: unknown, trusted: string, fallbackPath: string) {
  if (typeof value !== 'string') return `${trusted}${fallbackPath}`;
  try {
    const url = new URL(value);
    return url.origin === trusted ? url.toString() : `${trusted}${fallbackPath}`;
  } catch {
    return `${trusted}${fallbackPath}`;
  }
}
