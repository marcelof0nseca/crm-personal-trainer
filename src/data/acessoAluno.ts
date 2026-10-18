/*
 * O acesso do aluno à área dele: um link pessoal com token, nunca uma conta
 * Supabase própria -- sem fluxo de registo, sem password a recuperar, sem
 * mudar de alojamento por aluno. Funções puras -- sem React nem Supabase --
 * para se testarem sozinhas (scripts/validar-acesso-aluno.mjs). Onde vive e
 * porquê: CLAUDE.md, secção 4.
 *
 * O token em si nunca é gravado -- só o seu hash (`hashTokenAcesso`), na
 * tabela `aluno_acessos`. O mesmo princípio de um link de recuperação de
 * password: quem só tem o hash não consegue reconstruir o link.
 */

const TAMANHO_TOKEN_BYTES = 32; // 32 bytes em base64url ficam por 43 caracteres

function bytesParaBase64Url(bytes) {
  let binario = '';
  for (let i = 0; i < bytes.length; i += 1) binario += String.fromCharCode(bytes[i]);
  const base64 = typeof btoa === 'function'
    ? btoa(binario)
    : Buffer.from(binario, 'binary').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Gerado no aparelho do treinador, mostrado uma vez só -- depois disso só o
// hash sobrevive. `getRandomValues`, não `Math.random`: isto é uma chave de
// acesso a dados de saúde de um aluno, não um id decorativo.
export function gerarTokenAcesso() {
  const bytes = new Uint8Array(TAMANHO_TOKEN_BYTES);
  globalThis.crypto.getRandomValues(bytes);
  return bytesParaBase64Url(bytes);
}

// SHA-256 em hexadecimal. `crypto.subtle` existe tanto no browser como no
// Deno das Edge Functions como no Node 19+ dos scripts de validação -- por
// isso é a mesma função dos três sítios, sem depender de nenhum deles.
export async function hashTokenAcesso(token) {
  const dados = new TextEncoder().encode(String(token || ''));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', dados);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// O link que o treinador copia e manda ao aluno. Parâmetro de consulta, não
// caminho novo: `/` já serve `index.html` com qualquer `?query`, sem mexer
// no `vercel.json` (ver CLAUDE.md, secção 7).
export function linkDeAcesso(origem, token) {
  const base = String(origem || '').replace(/\/+$/, '');
  return `${base}/?a=${token}`;
}

// O inverso, para a aplicação ler o token da própria URL ao abrir. Um
// comprimento mínimo chega para recusar lixo óbvio sem fingir validar a
// sério -- quem valida a sério é o servidor, pelo hash.
export function tokenDaUrl(href) {
  let url;
  try {
    url = new URL(String(href || ''));
  } catch {
    return null;
  }
  const token = url.searchParams.get('a');
  return token && token.length >= 20 ? token : null;
}

// Conta própria do aluno (email+password, a par do link com token acima --
// CLAUDE.md, secção 4): dois parâmetros, sem caminho novo, pela mesma razão
// de `linkDeAcesso`. `aluno-convite` é de uso único (convite ou recuperação
// de password, consumido pelo Supabase); `aluno` é o link fixo que fica na
// barra do endereço depois disso, para o aluno marcar/guardar e voltar a
// entrar sempre que quiser, sem precisar de outro email.
export const PARAM_CONVITE_ALUNO = 'aluno-convite';
export const PARAM_AREA_ALUNO = 'aluno';

export function quiserAreaDoAluno(href) {
  let url;
  try {
    url = new URL(String(href || ''));
  } catch {
    return false;
  }
  return url.searchParams.has(PARAM_CONVITE_ALUNO) || url.searchParams.has(PARAM_AREA_ALUNO);
}
