/*
 * Central de retenção: cinco estados por regras escritas e configuráveis, nunca um
 * modelo preditivo. Cada classificação traz o motivo em texto, e sem dados
 * suficientes diz-se isso em vez de inventar um estado.
 */
export const VERSAO_REGRAS = 1;
export const REGRAS_OMISSAO = {
  versao: VERSAO_REGRAS,
  oscilandoDias: 3, // a partir de quantos dias sem treino
  riscoDias: 5,
  abandonoDias: 31,
  aderenciaMinima: 70, // % do planeado nas últimas 4 semanas
  janelaRecuperacaoDias: 14,
};
export const ESTADOS_RETENCAO = {
  engajado: { rotulo: 'Engajado', cor: 'var(--ok)' },
  oscilando: { rotulo: 'Oscilando', cor: 'var(--sky)' },
  risco: { rotulo: 'Em risco', cor: 'var(--gold)' },
  abandono: { rotulo: 'Abandono', cor: 'var(--text-muted)' },
  recuperado: { rotulo: 'Recuperado', cor: 'var(--brass)' },
  insuficiente: { rotulo: 'Dados insuficientes', cor: 'var(--text-faint)' },
};

const diasEntre = (a, b) => Math.floor((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
const somar = (iso, n) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const contaComoTreino = (s) => s.data && s.estado !== 'interrompida' && (s.itens || []).some((it) => (it.series || []).some((x) => x.feito));

export function classificar({ sessoes, aulasPorSemana, temPrograma, hoje, regras }) {
  const r = { ...REGRAS_OMISSAO, ...(regras || {}) };
  const datas = (sessoes || []).filter(contaComoTreino).map((s) => s.data).filter((d) => d <= hoje).sort();
  const ultimo = datas[datas.length - 1] || null;
  if (!ultimo && !temPrograma) return { estado: 'insuficiente', motivo: 'Sem programa nem treinos registados.', ultimo: null, dias: null, aderencia: null };
  if (!ultimo) return { estado: 'insuficiente', motivo: 'Tem programa, mas ainda não há treinos registados.', ultimo: null, dias: null, aderencia: null };
  const dias = diasEntre(ultimo, hoje);
  const inicio4 = somar(hoje, -27);
  const nas4 = datas.filter((d) => d >= inicio4).length;
  const aderencia = aulasPorSemana ? Math.round((nas4 / (aulasPorSemana * 4)) * 100) : null;
  if (dias >= r.abandonoDias) return { estado: 'abandono', motivo: `${dias} dias sem treinar (a partir de ${r.abandonoDias}).`, ultimo, dias, aderencia };
  if (dias >= r.riscoDias) return { estado: 'risco', motivo: `${dias} dias sem treinar (a partir de ${r.riscoDias}).`, ultimo, dias, aderencia };
  // Voltou a treinar depois de uma paragem longa, há pouco tempo.
  const anteriores = datas.slice(0, -1);
  let paragem = 0;
  for (let i = datas.length - 1; i > 0; i -= 1) {
    if (diasEntre(datas[i], hoje) > r.janelaRecuperacaoDias) break;
    paragem = Math.max(paragem, diasEntre(datas[i - 1], datas[i]));
  }
  if (anteriores.length > 0 && paragem >= r.riscoDias + 1 && dias < r.oscilandoDias) {
    return { estado: 'recuperado', motivo: `Voltou a treinar depois de ${paragem} dias de paragem.`, ultimo, dias, aderencia };
  }
  if (dias >= r.oscilandoDias) return { estado: 'oscilando', motivo: `${dias} dias sem treinar (a partir de ${r.oscilandoDias}).`, ultimo, dias, aderencia };
  if (aderencia !== null && aderencia < r.aderenciaMinima) return { estado: 'oscilando', motivo: `${aderencia}% do planeado nas últimas 4 semanas (mínimo ${r.aderenciaMinima}%).`, ultimo, dias, aderencia };
  return { estado: 'engajado', motivo: aderencia === null ? `Treinou há ${dias} dias.` : `Treinou há ${dias} dias, ${aderencia}% do planeado.`, ultimo, dias, aderencia };
}

// Os números com denominador à vista, para se poder conferir a conta.
export function metricas(linhas) {
  const avaliados = linhas.filter((l) => l.estado !== 'insuficiente');
  const contar = (e) => linhas.filter((l) => l.estado === e).length;
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : null);
  const ativos = contar('engajado') + contar('oscilando') + contar('recuperado');
  return {
    total: linhas.length,
    avaliados: avaliados.length,
    ativos,
    engajamento: { n: contar('engajado'), de: avaliados.length, pct: pct(contar('engajado'), avaliados.length) },
    recuperacao: { n: contar('recuperado'), de: contar('recuperado') + contar('risco') + contar('abandono'), pct: pct(contar('recuperado'), contar('recuperado') + contar('risco') + contar('abandono')) },
    distribuicao: Object.keys(ESTADOS_RETENCAO).map((id) => ({ id, n: contar(id) })),
  };
}

// Um por semana, para a tendência. Repetir na mesma semana substitui.
export function instantaneo(lista, { semana, linhas, versao = VERSAO_REGRAS }) {
  const m = metricas(linhas);
  const novo = { semana, versaoRegras: versao, ativos: m.ativos, avaliados: m.avaliados, distribuicao: m.distribuicao };
  return [...(lista || []).filter((x) => x.semana !== semana), novo].sort((a, b) => a.semana.localeCompare(b.semana)).slice(-110);
}

export function crescimento(lista, semanas) {
  const janela = (lista || []).slice(-semanas);
  if (janela.length < 2) return null;
  return janela[janela.length - 1].ativos - janela[0].ativos;
}
