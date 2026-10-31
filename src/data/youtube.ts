/*
 * Link do YouTube de um exercício. Guarda-se só o id do vídeo, nunca o endereço escrito:
 * é o id que entra no endereço do leitor, e assim nada escrito à mão chega à página.
 * Sem React (scripts/validar-modulos-4.mjs).
 */
const ID_VALIDO = /^[A-Za-z0-9_-]{11}$/;
const ANFITRIOES = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com']);

// Aceita o que as pessoas copiam: watch?v=, youtu.be/, shorts/, embed/, live/. Devolve
// null para o resto, incluindo endereços parecidos de outros sítios.
export function idDoYoutube(texto) {
  const limpo = String(texto == null ? '' : texto).trim();
  if (!limpo) return null;
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(limpo) ? limpo : `https://${limpo}`);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol)) return null;
  const anfitriao = url.hostname.toLowerCase();
  let id = null;
  if (anfitriao === 'youtu.be') id = url.pathname.split('/')[1];
  else if (ANFITRIOES.has(anfitriao)) {
    const partes = url.pathname.split('/').filter(Boolean);
    if (partes[0] === 'watch') id = url.searchParams.get('v');
    else if (['shorts', 'embed', 'live', 'v'].includes(partes[0])) id = partes[1];
  }
  return id && ID_VALIDO.test(id) ? id : null;
}

export const idYoutubeValido = (id) => ID_VALIDO.test(String(id || ''));
export const ligacaoYoutube = (id) => `https://www.youtube.com/watch?v=${id}`;
// O domínio sem cookies: o leitor só carrega depois de se tocar para ver.
export const leitorYoutube = (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
