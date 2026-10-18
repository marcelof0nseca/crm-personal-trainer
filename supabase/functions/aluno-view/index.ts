// O aluno lê o próprio programa e histórico através de um link com token --
// nunca com conta Supabase própria (ver CLAUDE.md, secção 4, "Área do
// aluno"). A service_role key NUNCA sai daqui; o aluno recebe só o que é
// dele: o seu próprio registo em `alunos`, as suas prescrições (studentId
// igual ao aluno_id do token) e a sua linha de execuções. Nunca a lista de
// alunos inteira, nunca os programas de outro aluno -- o mesmo princípio do
// `admin-overview`, que também nunca devolve `app_data` em bruto.

const ALLOWED_ORIGIN = Deno.env.get('APP_ORIGIN') || '*';
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  // Tem de bater com o que `admin-overview` já usa: `supabase.functions.invoke`
  // manda sempre `apikey`/`authorization` também, mesmo sem sessão nenhuma --
  // faltar um destes aqui faz o browser recusar o pedido no pré-voo (CORS),
  // antes sequer de chegar ao servidor. `curl` não reproduz isto (não faz
  // pré-voo), por isso testar só por `curl` escondeu este bug uma semana.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  Vary: 'Origin',
};

// Mesmo hash de src/data/acessoAluno.ts (hashTokenAcesso) -- `crypto.subtle`
// existe tanto aqui (Deno) como no browser e no Node dos scripts de
// validação, por isso é sempre a mesma conta.
async function hashToken(token: string) {
  const dados = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', dados);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// O mesmo formato que a aplicação já usa para gerar ids (`uid()`) e para o
// `check` de `execucoes:<id>` no schema -- um aluno_id fora disto nunca foi
// escrito pela aplicação, por isso é tratado como um link inválido.
const ID_VALIDO = /^[A-Za-z0-9_-]{1,64}$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: 'Variáveis de ambiente em falta.' }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    if (!token || token.length < 20) return json({ error: 'Link inválido.' }, 401);

    const tokenHash = await hashToken(token);
    const admin = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` };
    const rest = (path: string) => fetch(`${supabaseUrl}/rest/v1/${path}`, { headers: admin });

    const acessoRes = await rest(
      `aluno_acessos?token_hash=eq.${tokenHash}&revogado_em=is.null&select=user_id,aluno_id&limit=1`,
    );
    if (!acessoRes.ok) return json({ error: 'Não foi possível confirmar o acesso.' }, 500);
    const acessos = await acessoRes.json();
    const acesso = acessos[0];
    if (!acesso || !ID_VALIDO.test(String(acesso.aluno_id))) {
      return json({ error: 'Link inválido ou revogado.' }, 401);
    }

    const userId = acesso.user_id as string;
    const alunoId = acesso.aluno_id as string;

    const dadosRes = await rest(
      `app_data?user_id=eq.${userId}&data_key=in.(alunos,treinos,execucoes:${alunoId})&select=data_key,value`,
    );
    if (!dadosRes.ok) return json({ error: 'Não foi possível ler os dados.' }, 500);
    const linhas = (await dadosRes.json()) as { data_key: string; value: unknown }[];

    const alunosBlob = (linhas.find((l) => l.data_key === 'alunos')?.value as any[]) || [];
    const alunoEncontrado = alunosBlob.find((a) => a && a.id === alunoId);
    // O aluno pode ter sido eliminado depois do link ser gerado -- o acesso
    // não se apaga sozinho em todos os caminhos, por isso confirma-se aqui
    // também, não só na tabela de acessos.
    if (!alunoEncontrado) return json({ error: 'Link inválido ou revogado.' }, 401);

    const treinosBlob = (linhas.find((l) => l.data_key === 'treinos')?.value as any) || {};
    const prescricoes = Array.isArray(treinosBlob.prescricoes)
      ? treinosBlob.prescricoes.filter((p: any) => p && p.studentId === alunoId && !p.arquivado)
      : [];

    const execucaoBlob = linhas.find((l) => l.data_key === `execucoes:${alunoId}`)?.value;
    const execucao = execucaoBlob && typeof execucaoBlob === 'object' ? execucaoBlob : { sessoes: [] };

    return json({
      aluno: { id: alunoEncontrado.id, name: alunoEncontrado.name, color: alunoEncontrado.color || null },
      prescricoes,
      execucao,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erro inesperado.' }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
