/*
 * O que os módulos pedem ao servidor para lá de `app_data`: entradas vindas do aluno e
 * do público, endereços publicados, documentos e funções. Sem servidor ligado (modo
 * local) cada função diz-o em vez de fingir que resultou.
 */
import { supabase, supabaseConfigured } from '../supabaseClient';

export const temServidor = () => Boolean(supabaseConfigured && supabase);
export const SEM_SERVIDOR = 'Disponível só com a conta ligada ao servidor.';

const tabelaEmFalta = (e) => e && (e.code === '42P01' || e.code === 'PGRST205');
const erroDe = (e) => (tabelaEmFalta(e) ? 'Falta correr o SQL de supabase-schema.sql no servidor.' : 'Não foi possível falar com o servidor.');

async function idDaConta() {
  const { data } = await supabase.auth.getUser();
  return data.user ? data.user.id : null;
}

function tokenAleatorio(n = 18) {
  const b = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(b).map((x) => x.toString(36).padStart(2, '0')).join('').slice(0, n);
}

/* ---------------------------- entradas ---------------------------- */

export async function lerEntradas() {
  if (!temServidor()) return { ok: true, itens: [], semServidor: true };
  const { data, error } = await supabase.from('entradas').select('*').order('created_at', { ascending: false }).limit(500);
  if (error) { console.error('[PTMANAGER] entradas', error); return { ok: false, erro: erroDe(error), itens: [] }; }
  return { ok: true, itens: data || [] };
}

export async function marcarEntrada(id, estado) {
  const { error } = await supabase.from('entradas').update({ estado }).eq('id', id);
  return !error;
}

/* ---------------------------- endereços públicos ---------------------------- */

export const ligacaoPublica = (slug) => `${window.location.origin}/?p=${slug}`;

// `dados` é um retrato só do que é público: a página pública nunca lê os blocos.
export async function publicar({ slug, tipo, ref, dados }) {
  if (!temServidor()) return { ok: false, erro: SEM_SERVIDOR };
  const userId = await idDaConta();
  if (!userId) return { ok: false, erro: 'Sessão terminada.' };
  const linha = { slug: slug || tokenAleatorio(), user_id: userId, tipo, ref: ref || '', dados, ativo: true };
  const { error } = await supabase.from('publico_enderecos').upsert(linha, { onConflict: 'slug' });
  if (error) { console.error('[PTMANAGER] publicar', error); return { ok: false, erro: erroDe(error) }; }
  return { ok: true, slug: linha.slug };
}

export async function despublicar(slug) {
  const { error } = await supabase.from('publico_enderecos').update({ ativo: false }).eq('slug', slug);
  return !error;
}

/* ---------------------------- funções ---------------------------- */

export async function chamar(funcao, corpo = {}) {
  if (!temServidor()) return { ok: false, erro: SEM_SERVIDOR };
  const { data, error } = await supabase.functions.invoke(funcao, { body: corpo });
  if (error) {
    try {
      const c = error.context && typeof error.context.json === 'function' ? await error.context.json() : null;
      if (c && c.error) return { ok: false, erro: c.error, codigo: c.codigo };
    } catch { /* resposta sem JSON */ }
    return { ok: false, erro: 'Este serviço ainda não está disponível no servidor.' };
  }
  if (data && data.error) return { ok: false, erro: data.error, codigo: data.codigo };
  return { ok: true, ...data };
}

/* ---------------------------- pagamentos confirmados ---------------------------- */

export async function lerPagamentos() {
  if (!temServidor()) return { ok: true, itens: [] };
  const { data, error } = await supabase.from('cobranca_pagamentos').select('*').order('created_at', { ascending: false }).limit(500);
  if (error) return { ok: false, erro: erroDe(error), itens: [] };
  return { ok: true, itens: data || [] };
}

/* ---------------------------- documentos ---------------------------- */

export const TIPOS_DOCUMENTO = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const LIMITE_DOCUMENTO = 10 * 1024 * 1024;

export async function carregarDocumento(ficheiro, id) {
  if (!temServidor()) return { ok: false, erro: SEM_SERVIDOR };
  if (!TIPOS_DOCUMENTO.includes(ficheiro.type)) return { ok: false, erro: 'Só PDF ou imagem.' };
  if (ficheiro.size > LIMITE_DOCUMENTO) return { ok: false, erro: 'O ficheiro passa de 10 MB.' };
  const userId = await idDaConta();
  const ext = (ficheiro.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5);
  const path = `${userId}/${id}.${ext}`;
  const { error } = await supabase.storage.from('documentos').upload(path, ficheiro, { contentType: ficheiro.type });
  if (error) { console.error('[PTMANAGER] documento', error); return { ok: false, erro: 'Não foi possível carregar o ficheiro.' }; }
  return { ok: true, path };
}

export async function urlDeDocumento(path) {
  const { data, error } = await supabase.storage.from('documentos').createSignedUrl(path, 300);
  return error ? null : data.signedUrl;
}

export async function apagarDocumentos(paths) {
  if (!temServidor() || paths.length === 0) return true;
  const { error } = await supabase.storage.from('documentos').remove(paths);
  if (error) console.error('[PTMANAGER] apagar documentos', error);
  return !error;
}

/* ---------------------------- apagar ---------------------------- */

const tolerarTabelaEmFalta = (r) => !r.error || tabelaEmFalta(r.error);

// Ao eliminar um aluno: o que chegou dele e as leituras. Devolve se ficou feito.
export async function limparAlunoNoServidor(alunoId) {
  if (!temServidor()) return true;
  const a = await supabase.from('entradas').delete().eq('aluno_id', alunoId);
  const b = await supabase.from('notificacao_leituras').delete().eq('aluno_id', alunoId);
  const c = await supabase.from('push_subscricoes').delete().eq('aluno_id', alunoId);
  return tolerarTabelaEmFalta(a) && tolerarTabelaEmFalta(b) && tolerarTabelaEmFalta(c);
}

// Ao apagar todos os dados: tudo o que vive fora de `app_data`, ficheiros incluídos.
export async function limparContaNoServidor() {
  if (!temServidor()) return true;
  const userId = await idDaConta();
  if (!userId) return false;
  const lista = await supabase.storage.from('documentos').list(userId, { limit: 1000 });
  if (lista.error) { console.error('[PTMANAGER] listar documentos', lista.error); }
  const paths = (lista.data || []).map((f) => `${userId}/${f.name}`);
  if (!(await apagarDocumentos(paths))) return false;
  const rs = await Promise.all(['entradas', 'publico_enderecos', 'notificacao_leituras', 'push_subscricoes'].map((t) => supabase.from(t).delete().eq('user_id', userId)));
  return rs.every(tolerarTabelaEmFalta);
}
