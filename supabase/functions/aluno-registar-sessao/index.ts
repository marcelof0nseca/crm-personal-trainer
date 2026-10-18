// O aluno regista a própria sessão através do link com token -- mesma
// autorização de aluno-view (hash do token em aluno_acessos), nunca conta
// Supabase própria. Só escreve na linha de execuções do próprio aluno; a
// prescrição (`treinos`) nunca é tocada por este caminho (ver CLAUDE.md,
// secção 4, "Área do aluno").

const ALLOWED_ORIGIN = Deno.env.get('APP_ORIGIN') || '*';
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  // Ver aluno-view/index.ts: `apikey`/`authorization` têm de estar aqui, ou o
  // browser recusa o pedido no pré-voo CORS antes de chegar ao servidor.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  Vary: 'Origin',
};

async function hashToken(token: string) {
  const dados = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', dados);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

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
    const sessao = body?.sessao;
    if (!token || token.length < 20) return json({ error: 'Link inválido.' }, 401);
    if (!sessao || typeof sessao !== 'object' || !Array.isArray(sessao.itens)) {
      return json({ error: 'Sessão inválida.' }, 400);
    }

    const tokenHash = await hashToken(token);
    const admin = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` };
    const rest = (path: string, init?: RequestInit) => fetch(`${supabaseUrl}/rest/v1/${path}`, {
      ...init,
      headers: { ...admin, ...(init?.headers || {}) },
    });

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
    const dataKey = `execucoes:${alunoId}`;

    // O aluno pode ter sido eliminado depois do link ser gerado -- confirma-se
    // que ainda existe antes de escrever nada, não só que o acesso é válido.
    const alunoRes = await rest(`app_data?user_id=eq.${userId}&data_key=eq.alunos&select=value`);
    const alunoLinhas = alunoRes.ok ? await alunoRes.json() : [];
    const alunosBlob = (alunoLinhas[0]?.value as any[]) || [];
    if (!alunosBlob.some((a: any) => a && a.id === alunoId)) {
      return json({ error: 'Link inválido ou revogado.' }, 401);
    }

    // Ler antes de gravar, com o carimbo de versão -- o mesmo princípio de
    // `podeGravarExecucoes`/`writeStoredValue` do lado do treinador
    // (CLAUDE.md, secção 4), só que a correr no servidor em vez do browser.
    const atualRes = await rest(`app_data?user_id=eq.${userId}&data_key=eq.${dataKey}&select=value,updated_at`);
    if (!atualRes.ok) return json({ error: 'Não foi possível ler o registo.' }, 500);
    const atualLinhas = await atualRes.json();
    const atual = atualLinhas[0];
    const sessoesAtuais = (atual && atual.value && Array.isArray(atual.value.sessoes)) ? atual.value.sessoes : [];
    const novoValor = { sessoes: [...sessoesAtuais, sessao] };
    const agora = new Date().toISOString();

    if (atual) {
      const upRes = await rest(
        `app_data?user_id=eq.${userId}&data_key=eq.${dataKey}&updated_at=eq.${encodeURIComponent(atual.updated_at)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
          body: JSON.stringify({ value: novoValor, updated_at: agora }),
        },
      );
      if (!upRes.ok) return json({ error: 'Não foi possível guardar.' }, 500);
      const upData = await upRes.json();
      if (!Array.isArray(upData) || upData.length === 0) {
        // Outra gravação aconteceu entretanto (outro aparelho, ou o próprio
        // treinador) -- nunca se escreve por cima às cegas.
        return json({ error: 'Foi registada outra sessão entretanto. Tente outra vez.' }, 409);
      }
    } else {
      const insRes = await rest('app_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ user_id: userId, data_key: dataKey, value: novoValor, updated_at: agora }),
      });
      if (!insRes.ok) {
        if (insRes.status === 409) return json({ error: 'Foi registada outra sessão entretanto. Tente outra vez.' }, 409);
        return json({ error: 'Não foi possível guardar.' }, 500);
      }
    }

    return json({ ok: true });
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
