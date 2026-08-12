// Painel de administração: agrega métricas de negócio, contas e histórico de
// subscrições. A service_role key NUNCA sai daqui — o browser recebe apenas o
// resultado agregado. Devolve exclusivamente metadados de conta: nenhum dado de
// alunos, avaliações, fotografias ou lançamentos atravessa esta função.

const ALLOWED_ORIGIN = Deno.env.get('APP_ORIGIN') || '*';
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  Vary: 'Origin',
};

// Lista de administradores em variável de ambiente do servidor.
// Não usar a lista do frontend: essa vai no bundle e é legível por qualquer um.
const ADMIN_EMAILS = (Deno.env.get('ADMIN_EMAILS') || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Meses de acesso por plano (o trimestral dá 4 e o anual 14, com os meses
// grátis). O MRR normaliza pelo acesso, não pelo período cobrado.
const ACCESS_MONTHS: Record<string, number> = { mensal: 1, trimestral: 4, anual: 14 };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return json({ error: 'Variáveis de ambiente em falta.' }, 500);
    }
    if (ADMIN_EMAILS.length === 0) {
      return json({ error: 'ADMIN_EMAILS não está configurado.' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Sessão em falta.' }, 401);

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: supabaseAnonKey },
    });
    if (!userRes.ok) return json({ error: 'Sessão inválida.' }, 401);

    const user = await userRes.json();
    const email = String(user.email || '').toLowerCase();
    // Este é o único ponto de autorização. A visibilidade do separador no
    // frontend é cosmética e não protege nada.
    if (!ADMIN_EMAILS.includes(email)) {
      return json({ error: 'Sem permissão de administrador.' }, 403);
    }

    // O frontend faz um ping ao carregar, só para saber se mostra o separador
    // Admin. Responder aqui evita a agregação completa a cada arranque.
    const body = await req.json().catch(() => ({}));
    if (body?.ping) return json({ ok: true });

    const admin = {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    };
    const rest = (path: string) => fetch(`${supabaseUrl}/rest/v1/${path}`, { headers: admin })
      .then((r) => (r.ok ? r.json() : []));

    const [subs, stats, eventos, authUsers] = await Promise.all([
      rest('personal_subscriptions?select=*'),
      rest('admin_account_stats?select=*'),
      rest('subscription_events?select=*&order=occurred_at.desc&limit=200'),
      listAuthUsers(supabaseUrl, serviceRoleKey),
    ]);

    const subsPorUser: Record<string, any> = {};
    subs.forEach((s: any) => { subsPorUser[s.user_id] = s; });
    const statsPorUser: Record<string, any> = {};
    stats.forEach((s: any) => { statsPorUser[s.user_id] = s; });

    const agora = Date.now();
    const ha30dias = agora - 30 * 24 * 60 * 60 * 1000;

    const contas = authUsers.map((u: any) => {
      const sub = subsPorUser[u.id] || null;
      const st = statsPorUser[u.id] || null;
      const fimCiclo = sub?.current_period_end ? Date.parse(sub.current_period_end) : null;
      const ativa = sub?.plan_status === 'active' && (fimCiclo === null || fimCiclo > agora);
      return {
        userId: u.id,
        email: u.email,
        registoEm: u.created_at,
        ultimoAcesso: u.last_sign_in_at,
        plano: sub?.plan_tier || null,
        estado: sub?.plan_status || 'sem_plano',
        ativa,
        valor: sub?.plan_value ?? null,
        intervalo: sub?.billing_interval || null,
        fimCiclo: sub?.current_period_end || null,
        cancelamentoAgendado: Boolean(sub?.cancel_at_period_end),
        cartao: sub?.payment_method_brand
          ? `${sub.payment_method_brand}${sub.payment_method_last4 ? ` ••••${sub.payment_method_last4}` : ''}`
          : null,
        ultimoPagamento: sub?.last_payment_status || null,
        // Apenas contagens — o conteúdo fica na base de dados.
        alunos: st?.alunos ?? 0,
        aulas: st?.aulas ?? 0,
        fotos: st?.fotos ?? 0,
        lancamentos: st?.lancamentos ?? 0,
        ultimaAtividade: st?.ultima_atividade || null,
      };
    });

    const ativas = contas.filter((c) => c.ativa);
    const mrr = ativas.reduce((soma, c) => {
      const meses = ACCESS_MONTHS[c.plano || ''] || 1;
      return soma + (Number(c.valor) || 0) / meses;
    }, 0);

    const cancelamentos30 = eventos.filter((e: any) =>
      (e.event_type === 'canceled' || e.event_type === 'cancel_scheduled')
      && Date.parse(e.occurred_at) >= ha30dias).length;

    const metricas = {
      contasTotal: contas.length,
      contasAtivas: ativas.length,
      mrr: Math.round(mrr * 100) / 100,
      inadimplentes: contas.filter((c) => c.estado === 'past_due').length,
      cancelamentosAgendados: contas.filter((c) => c.cancelamentoAgendado).length,
      semPlano: contas.filter((c) => c.estado === 'sem_plano').length,
      novosUltimos30: contas.filter((c) => c.registoEm && Date.parse(c.registoEm) >= ha30dias).length,
      cancelamentosUltimos30: cancelamentos30,
      // Churn sobre a base ativa no início do período; sem base, devolve 0.
      churn: ativas.length + cancelamentos30 > 0
        ? Math.round((cancelamentos30 / (ativas.length + cancelamentos30)) * 1000) / 10
        : 0,
    };

    const porPlano = ['mensal', 'trimestral', 'anual'].map((tier) => ({
      plano: tier,
      contas: ativas.filter((c) => c.plano === tier).length,
    }));

    const alertas = [
      ...contas.filter((c) => c.estado === 'past_due')
        .map((c) => ({ tipo: 'pagamento', email: c.email, detalhe: 'Pagamento por regularizar' })),
      // A data vai em bruto: quem formata é o frontend, com o locale pt-PT.
      ...contas.filter((c) => c.cancelamentoAgendado)
        .map((c) => ({
          tipo: 'cancelamento',
          email: c.email,
          detalhe: 'Cancelamento agendado',
          data: c.fimCiclo,
        })),
      ...contas.filter((c) => c.ativa && c.ultimaAtividade && Date.parse(c.ultimaAtividade) < ha30dias)
        .map((c) => ({ tipo: 'inatividade', email: c.email, detalhe: 'Sem atividade há mais de 30 dias' })),
    ];

    return json({ metricas, porPlano, contas, eventos, alertas, geradoEm: new Date().toISOString() });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erro inesperado.' }, 500);
  }
});

// A API de administração pagina; percorrer todas as páginas para não perder contas.
async function listAuthUsers(supabaseUrl: string, serviceRoleKey: string) {
  const todos: any[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=200`, {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    });
    if (!res.ok) break;
    const data = await res.json();
    const users = data.users || [];
    todos.push(...users);
    if (users.length < 200) break;
  }
  return todos;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
