// Línguas da área do aluno e das páginas públicas. A escolha é do aparelho. Uma chave
// que falte numa língua cai no português, nunca em branco.
import { createContext, useContext, useMemo, useState } from 'react';
import { TEXTOS as T } from './i18n-textos';

const CHAVE = 'ptmanager:idioma';
export const IDIOMAS = { pt: 'Português', en: 'English', es: 'Español' };

export const CHAVES_I18N = Object.keys(T.pt);
export const faltasDe = (idioma) => CHAVES_I18N.filter((k) => !(k in T[idioma]));

function inicial() {
  try {
    const g = localStorage.getItem(CHAVE);
    if (g && T[g]) return g;
  } catch { /* sem armazenamento */ }
  const n = typeof navigator !== 'undefined' ? String(navigator.language || '').slice(0, 2) : 'pt';
  return T[n] ? n : 'pt';
}

const Ctx = createContext(null);

export function ProvedorIdioma({ children }) {
  const [idioma, setIdioma] = useState(inicial);
  const valor = useMemo(() => ({
    idioma,
    mudar(i) { setIdioma(i); try { localStorage.setItem(CHAVE, i); } catch { /* sem armazenamento */ } },
    t: (k) => T[idioma][k] ?? T.pt[k] ?? k,
    data: (iso) => { const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString({ pt: 'pt-PT', en: 'en-GB', es: 'es-ES' }[idioma], { day: '2-digit', month: '2-digit', year: 'numeric' }); },
    euros: (c, moeda = 'EUR') => (Number(c || 0) / 100).toLocaleString({ pt: 'pt-PT', en: 'en-GB', es: 'es-ES' }[idioma], { style: 'currency', currency: moeda }),
  }), [idioma]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export const useIdioma = () => useContext(Ctx);
