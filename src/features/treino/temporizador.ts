/*
 * O que um cronómetro de método tem de contar, a partir dos números do método.
 * Só diz o tempo: nunca marca nada como feito quando o tempo acaba.
 */
const n = (v, omissao = 0) => {
  const x = parseFloat(String(v == null ? '' : v).replace(',', '.'));
  return Number.isFinite(x) && x >= 0 ? x : omissao;
};

export function segundosDePausa(valor) {
  const t = String(valor == null ? '' : valor).trim().toLowerCase().replace(',', '.');
  const m = t.match(/^(\d+(?:\.\d+)?)\s*(s|seg|segundos|min|m|minutos)?$/);
  if (!m) return 0;
  const x = parseFloat(m[1]);
  return Math.round(m[2] && m[2].startsWith('m') ? x * 60 : x);
}

// Uma lista de etapas { rotulo, segundos, tipo }. Sem números suficientes: lista vazia.
export function planoDoTemporizador(metodo, params) {
  const p = params || {};
  const etapas = [];
  if (metodo === 'EMOM') {
    const total = n(p.minutos); const janela = Math.max(1, n(p.janela, 1));
    for (let i = 1; i <= Math.floor(total / janela); i += 1) etapas.push({ rotulo: `Janela ${i}`, segundos: janela * 60, tipo: 'trabalho' });
  } else if (metodo === 'AMRAP') {
    if (n(p.minutos) > 0) etapas.push({ rotulo: 'AMRAP', segundos: n(p.minutos) * 60, tipo: 'trabalho' });
  } else if (metodo === 'Tabata') {
    const rondas = n(p.rondas); const trabalho = n(p.trabalho); const pausa = n(p.pausa);
    for (let i = 1; i <= rondas && trabalho > 0; i += 1) {
      etapas.push({ rotulo: `Ronda ${i}: trabalho`, segundos: trabalho, tipo: 'trabalho' });
      if (pausa > 0 && i < rondas) etapas.push({ rotulo: `Ronda ${i}: pausa`, segundos: pausa, tipo: 'pausa' });
    }
  } else if (metodo === 'Intervalado') {
    const esforco = n(p.esforco); const recuperacao = n(p.recuperacao);
    const blocos = Math.max(1, n(p.blocos, 1)); const pausaBloco = n(p.pausaBloco); const prep = n(p.preparacao);
    if (esforco > 0) {
      if (prep > 0) etapas.push({ rotulo: 'Preparação', segundos: prep, tipo: 'pausa' });
      for (let b = 1; b <= blocos; b += 1) {
        etapas.push({ rotulo: `Bloco ${b}: esforço`, segundos: esforco, tipo: 'trabalho' });
        if (recuperacao > 0) etapas.push({ rotulo: `Bloco ${b}: recuperação`, segundos: recuperacao, tipo: 'pausa' });
        if (pausaBloco > 0 && b < blocos) etapas.push({ rotulo: 'Pausa entre blocos', segundos: pausaBloco, tipo: 'pausa' });
      }
    }
  } else if (metodo === 'For time') {
    const limite = segundosDePausa(p.limite) || n(p.limite) * 60;
    if (limite > 0) etapas.push({ rotulo: 'Tempo limite', segundos: limite, tipo: 'trabalho' });
  }
  return etapas;
}

// Orientação por passos dos métodos sem relógio próprio.
export const ORIENTACAO_METODO = {
  'Rest-pause': 'Série até perto da falha, pausa curta, e continuar. Marque cada retomada à parte.',
  'Drop-set': 'Sem pausa entre quedas: baixe a carga e continue. Marque cada queda à parte.',
  'Strip Set': 'Retire a carga indicada e continue logo. Marque cada queda à parte.',
  Cluster: 'Blocos pequenos com a pausa curta entre eles, e a pausa longa entre séries.',
  'Myo-reps': 'Série de ativação, depois mini-séries com pausa curta até ao máximo indicado.',
  Ladder: 'Suba ou desça as repetições a cada degrau, respeitando a pausa indicada.',
  'Método 21': 'Parcial inferior, parcial superior e completo, sem pausa entre eles.',
};

export const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
