// Comum às funções do aluno: CORS, leitura pela service_role e quem está a pedir. Um
// aluno entra por um link com token ou pela sessão da conta dele; o id do aluno vem
// sempre destas tabelas, nunca do corpo do pedido.
const ALLOWED_ORIGIN = Deno.env.get('APP_ORIGIN') || '*';
export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  Vary: 'Origin',
};
const ID_VALIDO = /^[A-Za-z0-9_-]{1,64}$/;
import { configuracaoConnect } from './cobranca.ts';

export function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

export function ambiente() {
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anon || !service) return null;
  const headers = { apikey: service, Authorization: `Bearer ${service}` };
  const rest = (path: string, init: RequestInit = {}) => fetch(`${url}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  return { url, anon, service, rest };
}

export async function hashToken(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function quemPede(req: Request, token: string, env: NonNullable<ReturnType<typeof ambiente>>) {
  if (token) {
    if (token.length < 20) return null;
    const r = await env.rest(`aluno_acessos?token_hash=eq.${await hashToken(token)}&revogado_em=is.null&select=user_id,aluno_id&limit=1`);
    if (!r.ok) return null;
    const a = (await r.json())[0];
    return a && ID_VALIDO.test(String(a.aluno_id)) ? { userId: a.user_id as string, alunoId: a.aluno_id as string, via: 'token' } : null;
  }
  const auth = req.headers.get('Authorization');
  if (!auth) return null;
  const u = await fetch(`${env.url}/auth/v1/user`, { headers: { Authorization: auth, apikey: env.anon } });
  if (!u.ok) return null;
  const id = (await u.json())?.id;
  if (!id) return null;
  const r = await env.rest(`aluno_contas?auth_user_id=eq.${id}&select=user_id,aluno_id&limit=1`);
  const c = r.ok ? (await r.json())[0] : null;
  return c && ID_VALIDO.test(String(c.aluno_id)) ? { userId: c.user_id as string, alunoId: c.aluno_id as string, via: 'conta' } : null;
}

// O treinador autenticado, pela sessão real.
export async function treinadorPede(req: Request, env: NonNullable<ReturnType<typeof ambiente>>) {
  const auth = req.headers.get('Authorization');
  if (!auth) return null;
  const u = await fetch(`${env.url}/auth/v1/user`, { headers: { Authorization: auth, apikey: env.anon } });
  if (!u.ok) return null;
  return (await u.json())?.id as string | null;
}

const MODULOS_DO_ALUNO = ['planos', 'documentos', 'progresso', 'mensagens', 'crm', 'pontos', 'recursos', 'avaliacoes', 'satisfacao', 'metas'];

// Lê os blocos de que a vista precisa. Um módulo que falte vem vazio.
export async function lerBlocos(userId: string, alunoId: string, env: NonNullable<ReturnType<typeof ambiente>>) {
  const chaves = ['alunos', 'treinos', 'agenda', `execucoes:${alunoId}`, ...MODULOS_DO_ALUNO.map((m) => `modulo:${m}`)];
  const r = await env.rest(`app_data?user_id=eq.${userId}&data_key=in.(${chaves.join(',')})&select=data_key,value`);
  if (!r.ok) return null;
  const linhas = (await r.json()) as { data_key: string; value: any }[];
  const valor = (k: string) => linhas.find((l) => l.data_key === k)?.value;
  const modulos: Record<string, any> = {};
  MODULOS_DO_ALUNO.forEach((m) => { modulos[m] = valor(`modulo:${m}`) || {}; });

  // Estas tabelas podem ainda não existir, antes de correr o SQL: contam como vazias.
  const lista = async (path: string) => { const x = await env.rest(path); return x.ok ? await x.json() : []; };
  const leituras = (await lista(`notificacao_leituras?user_id=eq.${userId}&aluno_id=eq.${alunoId}&select=ocorrencia_id`)).map((l: any) => l.ocorrencia_id);
  const pagamentos = await lista(`cobranca_pagamentos?user_id=eq.${userId}&aluno_id=eq.${alunoId}&select=fatura_id,estado`);
  const respondidas = (await lista(`entradas?user_id=eq.${userId}&aluno_id=eq.${alunoId}&select=ref&limit=500`)).map((e: any) => e.ref).filter(Boolean);
  const contaPag = configuracaoConnect().ativa ? await lista(`cobranca_contas?user_id=eq.${userId}&select=pagamentos_ativos&limit=1`) : [];
  return { pagarOnline: Boolean(contaPag[0]?.pagamentos_ativos), alunos: valor('alunos') || [], treinos: valor('treinos') || {}, agenda: valor('agenda') || [], execucao: valor(`execucoes:${alunoId}`), modulos, leituras, pagamentos, respondidas };
}

export async function gravarEntrada(env: NonNullable<ReturnType<typeof ambiente>>, linha: Record<string, unknown>) {
  const r = await env.rest('entradas?on_conflict=user_id,chave', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify(linha) });
  return r.ok;
}
