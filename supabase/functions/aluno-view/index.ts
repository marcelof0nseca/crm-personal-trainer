// O aluno lê o próprio programa e histórico -- por um link com token (sem
// conta) ou pela sessão real de uma conta própria (ver CLAUDE.md, secção 4,
// "Área do aluno"). A service_role key NUNCA sai daqui; o aluno recebe só o
// que é dele: o seu próprio registo em `alunos`, as suas prescrições
// (studentId igual ao aluno_id) e a sua linha de execuções. Nunca a lista de
// alunos inteira, nunca os programas de outro aluno -- o mesmo princípio do
// `admin-overview`, que também nunca devolve `app_data` em bruto.

import { ambiente, lerBlocos } from '../_shared/aluno.ts';
import { vistaDoAluno } from '../_shared/vista-aluno.ts';

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return json({ error: 'Variáveis de ambiente em falta.' }, 500);
    }

    const admin = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` };
    const rest = (path: string) => fetch(`${supabaseUrl}/rest/v1/${path}`, { headers: admin });

    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token.trim() : '';

    let userId: string | null = null;
    let alunoId: string | null = null;
    const via = token ? 'token' : 'conta';

    if (token) {
      if (token.length < 20) return json({ error: 'Link inválido.' }, 401);
      const tokenHash = await hashToken(token);
      const acessoRes = await rest(
        `aluno_acessos?token_hash=eq.${tokenHash}&revogado_em=is.null&select=user_id,aluno_id&limit=1`,
      );
      if (!acessoRes.ok) return json({ error: 'Não foi possível confirmar o acesso.' }, 500);
      const acessos = await acessoRes.json();
      const acesso = acessos[0];
      if (acesso && ID_VALIDO.test(String(acesso.aluno_id))) {
        userId = acesso.user_id as string;
        alunoId = acesso.aluno_id as string;
      }
    } else {
      // Conta própria: resolve-se quem está a pedir pela sessão real (o
      // mesmo truque do admin-overview), nunca por algo vindo do corpo.
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return json({ error: 'Sessão em falta.' }, 401);
      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { Authorization: authHeader, apikey: supabaseAnonKey },
      });
      if (userRes.ok) {
        const callerUser = await userRes.json();
        const authUserId = callerUser?.id as string | undefined;
        if (authUserId) {
          const contaRes = await rest(`aluno_contas?auth_user_id=eq.${authUserId}&select=user_id,aluno_id&limit=1`);
          const contas = contaRes.ok ? await contaRes.json() : [];
          const conta = contas[0];
          if (conta && ID_VALIDO.test(String(conta.aluno_id))) {
            userId = conta.user_id as string;
            alunoId = conta.aluno_id as string;
          }
        }
      }
    }

    if (!userId || !alunoId) return json({ error: 'Link inválido ou revogado.' }, 401);

    const env = ambiente();
    const blocos = env ? await lerBlocos(userId, alunoId, env) : null;
    if (!blocos) return json({ error: 'Não foi possível ler os dados.' }, 500);

    // O aluno pode ter sido eliminado depois do link ser gerado -- o acesso
    // não se apaga sozinho em todos os caminhos, por isso a vista também o confirma.
    const agoraMs = Date.now();
    const vista = vistaDoAluno(blocos, alunoId, { hoje: new Date(agoraMs).toISOString().slice(0, 10), agoraMs, via });
    if (!vista) return json({ error: 'Link inválido ou revogado.' }, 401);
    return json(vista);
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
