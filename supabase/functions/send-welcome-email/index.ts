import { APP_URL, layoutEmail, botaoEmail, enviarEmailResend } from '../_shared/email.ts';

// Disparada por um Database Webhook do Supabase (Database → Webhooks, em
// INSERT sobre auth.users) -- ao contrário da Stripe, o Supabase não assina
// estes avisos, por isso um segredo partilhado (WEBHOOK_SHARED_SECRET, no
// cabeçalho configurado à mão no painel, nunca derivado do pedido) é o que
// impede qualquer pedido de fora de disparar e-mails para quem quiser.
const WEBHOOK_SHARED_SECRET = Deno.env.get('WEBHOOK_SHARED_SECRET') || '';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    if (!WEBHOOK_SHARED_SECRET) return json({ error: 'WEBHOOK_SHARED_SECRET não está configurado.' }, 500);
    const recebido = req.headers.get('x-webhook-secret') || '';
    if (!timingSafeEqual(recebido, WEBHOOK_SHARED_SECRET)) return json({ error: 'Não autorizado.' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Variáveis de ambiente em falta.' }, 500);

    const body = await req.json().catch(() => ({}));
    if (body?.type !== 'INSERT' || body?.table !== 'users') return json({ ignored: true });

    const userId = body?.record?.id;
    const email = body?.record?.email;
    if (!userId || !email) return json({ ignored: true });

    // A esta hora o campo quase nunca está preenchido -- "nome" só se define
    // depois, em Definições (ver painel-pt.tsx) -- mas se algum dia o
    // registo passar a pedi-lo, isto já aproveita.
    const nome = body?.record?.raw_user_meta_data?.nome || '';

    // Só dispara na primeira vez: se este pedido for um reenvio do mesmo
    // INSERT, a linha já existe e o RETURNING não traz nada. Mesmo padrão
    // do registarEvento() em stripe-webhook.
    const registado = await registarEnvio(userId, supabaseUrl, serviceRoleKey);
    if (registado) {
      const { subject, html } = modeloContaCriada({ nome });
      const resultado = await enviarEmailResend(email, { subject, html });
      if (!resultado.ok && !resultado.skipped) {
        console.error('[PTMANAGER] falha ao enviar e-mail de boas-vindas', resultado.error);
      }
    }

    return json({ received: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erro inesperado.' }, 500);
  }
});

async function registarEnvio(userId: string, supabaseUrl: string, serviceRoleKey: string) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/welcome_email_log`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation,resolution=ignore-duplicates',
      },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) return false;
    const linhas = await res.json();
    return Array.isArray(linhas) && linhas.length > 0;
  } catch (_) {
    return false;
  }
}

function modeloContaCriada({ nome }: { nome: string }) {
  const corpo = `
    <p style="margin:0 0 16px;">Olá${nome ? `, ${nome}` : ''}!</p>
    <p style="margin:0 0 16px;">A sua conta no PTMANAGER foi criada.</p>
    <p style="margin:0 0 16px;">Falta só um passo: escolher um plano para começar os seus <strong>7 dias grátis</strong>. Não é cobrado nada até ao fim desse período.</p>
    <p style="margin:24px 0;">${botaoEmail('Escolher plano', APP_URL)}</p>
    <p style="margin:0;color:#71717a;font-size:13px;">Se já escolheu um plano entretanto, pode ignorar este e-mail.</p>
  `;
  return {
    subject: 'A sua conta PTMANAGER está criada — falta escolher o plano',
    html: layoutEmail('Falta escolher um plano para começar os 7 dias grátis.', corpo),
  };
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
