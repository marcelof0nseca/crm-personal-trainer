// O treinador convida um aluno a criar conta própria (email + password), a
// par do link com token que já existia (ver CLAUDE.md, secção 4, "Área do
// aluno"). Autenticado como o PRÓPRIO TREINADOR (sessão real, não o hash de
// um token) -- o mesmo princípio do `admin-overview`: resolve quem está a
// pedir pelo cabeçalho Authorization, nunca confia num id vindo do corpo.

import { APP_URL, botaoEmail, enviarEmailResend, layoutEmail } from '../_shared/email.ts';

const ALLOWED_ORIGIN = Deno.env.get('APP_ORIGIN') || '*';
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  Vary: 'Origin',
};

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

    // Quem está a pedir -- o treinador, pela sessão real dele. Nunca pelo
    // corpo do pedido: um aluno_id/user_id no corpo seria fácil de forjar.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Sessão em falta.' }, 401);
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: supabaseAnonKey },
    });
    if (!userRes.ok) return json({ error: 'Sessão inválida.' }, 401);
    const callerUser = await userRes.json();
    const trainerUserId = callerUser.id as string;
    if (!trainerUserId) return json({ error: 'Sessão inválida.' }, 401);

    const body = await req.json().catch(() => ({}));
    const alunoId = typeof body?.alunoId === 'string' ? body.alunoId.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!alunoId || !ID_VALIDO.test(alunoId)) return json({ error: 'Aluno inválido.' }, 400);
    if (!email || !EMAIL_VALIDO.test(email)) return json({ error: 'Email inválido.' }, 400);

    const admin = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` };
    const rest = (path: string, init?: RequestInit) => fetch(`${supabaseUrl}/rest/v1/${path}`, {
      ...init,
      headers: { ...admin, ...(init?.headers || {}) },
    });

    // O aluno é mesmo deste treinador? Nunca se confia no alunoId sozinho --
    // aproveita-se também para o nome, a usar no e-mail.
    const alunosRes = await rest(`app_data?user_id=eq.${trainerUserId}&data_key=eq.alunos&select=value`);
    if (!alunosRes.ok) return json({ error: 'Não foi possível confirmar o aluno.' }, 500);
    const alunosLinhas = await alunosRes.json();
    const alunosBlob = (alunosLinhas[0]?.value as any[]) || [];
    const aluno = alunosBlob.find((a: any) => a && a.id === alunoId);
    if (!aluno) return json({ error: 'Aluno não encontrado.' }, 404);

    const redirectTo = `${APP_URL}/?aluno-convite=1`;

    // Tenta convidar -- cria a conta em auth.users (por confirmar) e devolve
    // um link de uso único, sem o Supabase mandar o e-mail genérico dele
    // (controlamos o convite inteiro, com a marca da casa).
    let actionLink: string | null = null;
    let authUserId: string | null = null;

    const gerarLink = async (type: 'invite' | 'recovery') => {
      const res = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
        method: 'POST',
        headers: { ...admin, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, email, options: { redirect_to: redirectTo } }),
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data };
    };

    let resultado = await gerarLink('invite');
    if (resultado.ok) {
      actionLink = resultado.data.action_link || null;
      authUserId = resultado.data.user?.id || null;
    } else {
      // Já existe conta com este email -- só é um reenvio legítimo se já for
      // a conta ligada a ESTE aluno (nunca se envia para uma conta de outra
      // pessoa, nem se liga uma conta alheia a este aluno).
      const existenteRes = await rest(`aluno_contas?user_id=eq.${trainerUserId}&aluno_id=eq.${alunoId}&select=auth_user_id`);
      const existente = existenteRes.ok ? await existenteRes.json() : [];
      const contaJaLigada = existente[0]?.auth_user_id;
      if (!contaJaLigada) {
        return json({ error: 'Este email já está associado a outra conta.' }, 409);
      }
      const reenvio = await gerarLink('recovery');
      if (!reenvio.ok) return json({ error: 'Não foi possível gerar o convite.' }, 500);
      actionLink = reenvio.data.action_link || null;
      authUserId = contaJaLigada;
    }

    if (!actionLink || !authUserId) return json({ error: 'Não foi possível gerar o convite.' }, 500);

    // Liga a conta ao aluno certo -- ignora duplicados (reenvio não cria
    // uma segunda linha; a chave primária é o auth_user_id).
    await rest('aluno_contas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates' },
      body: JSON.stringify({ auth_user_id: authUserId, user_id: trainerUserId, aluno_id: alunoId }),
    });

    const corpo = `
      <p style="margin:0 0 16px;">Olá, ${escaparHtml(aluno.name || '')}!</p>
      <p style="margin:0 0 16px;">O seu personal trainer convidou-o(a) para ter acesso ao seu programa de treino na PTMANAGER -- pode ver o treino prescrito e registar o que fizer, sempre que quiser.</p>
      <p style="margin:0 0 24px;">Comece por escolher a sua palavra-passe:</p>
      <p style="margin:0 0 8px;">${botaoEmail('Criar a minha conta', actionLink)}</p>
    `;
    const envio = await enviarEmailResend(email, { subject: 'Convite para a sua área de treino', html: layoutEmail('O seu treinador convidou-o para a PTMANAGER', corpo) });
    if (!envio.ok && !envio.skipped) {
      return json({ error: 'A conta foi criada, mas não foi possível enviar o e-mail. Tente reenviar.' }, 502);
    }

    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erro inesperado.' }, 500);
  }
});

function escaparHtml(texto: string) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
