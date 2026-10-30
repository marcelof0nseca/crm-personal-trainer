/*
 * Frequência, evolução de cargas e recordes, calculados só do registo das sessões
 * realizadas. Nada se grava: mudar a fórmula não reescreve o que aconteceu.
 */
const num = (v) => {
  const m = String(v == null ? '' : v).trim().replace(',', '.').match(/^(\d+(?:\.\d+)?)\s*(kg|kgs|k)?$/i);
  return m ? parseFloat(m[1]) : null;
};

// Cada fórmula diz o que é. O resultado fica sempre identificado com ela, e acima
// de 12 repetições não se estima: o erro destas equações cresce muito.
export const FORMULAS_1RM = {
  epley: { nome: 'Epley', texto: 'carga × (1 + reps / 30)', calc: (c, r) => c * (1 + r / 30) },
  brzycki: { nome: 'Brzycki', texto: 'carga × 36 / (37 − reps)', calc: (c, r) => (c * 36) / (37 - r) },
  lander: { nome: 'Lander', texto: '100 × carga / (101,3 − 2,67123 × reps)', calc: (c, r) => (100 * c) / (101.3 - 2.67123 * r) },
  lombardi: { nome: 'Lombardi', texto: 'carga × reps^0,10', calc: (c, r) => c * r ** 0.1 },
  oconner: { nome: "O'Conner", texto: 'carga × (1 + reps / 40)', calc: (c, r) => c * (1 + r / 40) },
};

export function estimar1RM(carga, reps, formula = 'epley') {
  const c = num(carga);
  const r = num(reps);
  const f = FORMULAS_1RM[formula];
  if (!f || c === null || r === null || c <= 0 || r < 1 || r > 12 || !Number.isInteger(r)) return null;
  return r === 1 ? c : Math.round(f.calc(c, r) * 10) / 10;
}

const chaveDoExercicio = (it) => it.exercicioId || `nome:${it.nome}`;

// Por exercício e por sessão: só séries marcadas como feitas, e só com números
// simples. Uma faixa ou um texto ficam de fora em vez de virarem um valor falso.
export function historicoPorExercicio(sessoes, formula = 'epley') {
  const mapa = new Map();
  [...(sessoes || [])].sort((a, b) => String(a.data).localeCompare(String(b.data))).forEach((s) => {
    (s.itens || []).forEach((it) => {
      const feitas = (it.series || []).filter((x) => x.feito);
      if (!feitas.length) return;
      let melhorCarga = null; let volume = 0; let melhor1RM = null; let reps = 0; let comCarga = 0;
      feitas.forEach((x) => {
        const c = num(x.v && x.v.carga);
        const r = num(x.v && x.v.reps);
        if (r !== null) reps += r;
        if (c !== null) melhorCarga = melhorCarga === null ? c : Math.max(melhorCarga, c);
        if (c !== null && r !== null) { volume += c * r; comCarga += 1; }
        const e = estimar1RM(x.v && x.v.carga, x.v && x.v.reps, formula);
        if (e !== null) melhor1RM = melhor1RM === null ? e : Math.max(melhor1RM, e);
      });
      const chave = chaveDoExercicio(it);
      if (!mapa.has(chave)) mapa.set(chave, { chave, nome: it.nome, pontos: [] });
      mapa.get(chave).pontos.push({
        sessaoId: s.id, data: s.data, carga: melhorCarga, reps, volume: comCarga ? Math.round(volume * 10) / 10 : null, e1rm: melhor1RM, series: feitas.length,
      });
    });
  });
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-PT'));
}

// O maior valor de sempre, com a sessão de onde veio: um recorde tem de se poder
// conferir. Sem valor numérico, não há recorde.
export function recordes(historico) {
  return historico.map((h) => {
    const maior = (campo) => h.pontos.reduce((m, p) => (p[campo] != null && (!m || p[campo] > m[campo]) ? p : m), null);
    const carga = maior('carga'); const volume = maior('volume'); const e1rm = maior('e1rm');
    return {
      chave: h.chave, nome: h.nome,
      carga: carga && { valor: carga.carga, data: carga.data, sessaoId: carga.sessaoId },
      volume: volume && { valor: volume.volume, data: volume.data, sessaoId: volume.sessaoId },
      e1rm: e1rm && { valor: e1rm.e1rm, data: e1rm.data, sessaoId: e1rm.sessaoId },
    };
  }).filter((r) => r.carga || r.volume || r.e1rm);
}

const iso = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
export function segundaDaSemana(data) {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return iso(d);
}

// Conta o que aconteceu entre duas datas. Uma sessão só é «concluída» se o estado
// o disser e tiver séries feitas; sem nenhuma, foi aberta mas não feita.
export function frequencia(sessoes, de, ate) {
  const r = { concluidas: 0, parciais: 0, interrompidas: 0, semSeries: 0, dias: new Set(), semanas: {} };
  (sessoes || []).filter((s) => s.data && s.data >= de && s.data <= ate).forEach((s) => {
    const series = (s.itens || []).flatMap((it) => it.series || []);
    const feitas = series.filter((x) => x.feito).length;
    if (s.estado === 'interrompida') r.interrompidas += 1;
    else if (feitas === 0) r.semSeries += 1;
    else if (feitas < series.length) r.parciais += 1;
    else r.concluidas += 1;
    r.dias.add(s.data);
    const sem = segundaDaSemana(s.data);
    r.semanas[sem] = (r.semanas[sem] || 0) + 1;
  });
  return { ...r, dias: [...r.dias].sort(), total: r.concluidas + r.parciais + r.interrompidas + r.semSeries };
}

// Comparar com o plano só tem sentido com uma frequência conhecida: sem ela o
// denominador era inventado, e devolve-se null.
export function adesao(sessoes, de, ate, porSemana) {
  if (!porSemana) return null;
  const dias = Math.floor((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86400000) + 1;
  const planeadas = Math.round((dias / 7) * porSemana);
  if (planeadas <= 0) return null;
  const f = frequencia(sessoes, de, ate);
  const feitas = f.concluidas + f.parciais;
  return { feitas, planeadas, percentagem: Math.round((feitas / planeadas) * 100) };
}

export function csvDeHistorico(h) {
  const linhas = [['Data', 'Exercício', 'Séries', 'Maior carga', 'Repetições', 'Volume', '1RM estimado']];
  h.pontos.forEach((p) => linhas.push([p.data, h.nome, p.series, p.carga ?? '', p.reps, p.volume ?? '', p.e1rm ?? '']));
  return linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
}
