/*
 * Regras por categoria (secao 14), aquecimento / preparacao / volta a calma /
 * equipamento (secao 15), ajustes por condicionamento e por posicao (secao
 * 16) e estimativa de duracao (secao 17) da representacao A. Consome
 * motor.mjs e construcao.mjs; a montagem das 860 fichas esta em
 * scripts/gerar-modelos-treino.mjs.
 */
import * as R from './regras.mjs';
import * as motor from './motor.mjs';
import * as C from './construcao.mjs';

const { exercicioDoc, doseBase, intensidadeBase, cadenciaBase } = motor;
const { novaLinha, novoExercicioApp } = motor._internos;
const { exTradicional, intensidadeComRir, camposDeIntensidade, marcar } = C._api;

// exercicioId -> codigo do documento, para reler a familia de um exercicio ja
// construido (incrementos, duracao, equipamento).
const CODIGO_POR_EXERCICIO_ID = new Map();
export function registarMapaReverso(mapaExercicios) {
  Object.entries(mapaExercicios).forEach(([codigo, info]) => CODIGO_POR_EXERCICIO_ID.set(info.id, codigo));
}
export function reverterParaCodigo(ex) { return CODIGO_POR_EXERCICIO_ID.get(ex.exercicioId) || null; }
export function familiaDoExercicio(ex) {
  const codigo = reverterParaCodigo(ex);
  return codigo ? exercicioDoc(codigo).familia : '';
}

// ============================== dispatch dos 26 métodos (secção 9) ==============================
// Cada um recebe (matriz de codigos, L, v). 'Sem método' e 'Série tradicional'
// nao levam etiqueta no exercicio: e o estado normal de um exercicio.
export const METODOS_EXPLICITOS = {
  'Sem método': (matriz, L) => ({ exercicios: C._api.blocoTradicional(matriz, L, { metodo: '' }), grupos: {} }),
  'Série tradicional': (matriz, L) => ({ exercicios: C._api.blocoTradicional(matriz, L, { metodo: '' }), grupos: {} }),
  'Supersérie': (matriz, L) => C.supersérie(matriz, L),
  'Bi-set': (matriz, L, v) => C.biSet(matriz, L, v),
  'Trissérie': (matriz, L) => C.trisserie(matriz, L),
  'Giant set': (matriz, L) => C.giantSet(matriz, L),
  'Circuito': (matriz, L) => C.circuito(matriz, L),
  'EMOM': (matriz, L) => C.emom(matriz, L),
  'AMRAP': (matriz, L) => C.amrap(matriz, L),
  'Tabata': (matriz, L, v) => C.tabata(v),
  'Intervalado': (matriz, L, v) => C.intervalado(v),
  'For time': (matriz, L) => C.forTime(matriz, L),
  'Rest-pause': (matriz, L, v) => C.restPause(matriz, L, v),
  'Drop-set': (matriz, L, v) => C.dropSet(matriz, L, v),
  'Série de aproximação': (matriz, L) => ({ exercicios: C._api.serieAproximacao(matriz[0], L, matriz), grupos: {} }),
  'Série de trabalho': (matriz, L) => ({ exercicios: C._api.blocoTradicional(matriz, L, { metodo: 'Série de trabalho' }), grupos: {} }),
  'Back-off': (matriz, L) => C.backOff(matriz, L),
  'Até à falha': (matriz, L, v) => C.ateAFalha(matriz, L, v),
  'Pirâmide': (matriz, L) => C.piramide(matriz, L),
  'Pré-exaustão': (matriz, L, v) => C.preExaustao(matriz, L, v),
  'Pós-exaustão': (matriz, L, v) => C.posExaustao(matriz, L, v),
  'Superset antagonista': (matriz, L, v) => C.supersetAntagonista(matriz, L, v),
  'Série composta': (matriz, L, v) => C.serieComposta(matriz, L, v),
  'Cluster': (matriz, L) => C.cluster(matriz, L),
  'Contraste': (matriz, L, v) => C.contraste(matriz, L, v),
  'Personalizado...': (matriz, L) => C.personalizado(matriz, L),
};
export const METODOS_ORDEM = Object.keys(METODOS_EXPLICITOS);
if (METODOS_ORDEM.length !== 26) throw new Error(`Esperava 26 métodos, há ${METODOS_ORDEM.length}.`);

// ============================== 16.6 — substituições de Musculação em L0 ==============================
const SUBSTITUICOES_L0 = { sq: 'box', split: 'step', press: 'mpress', ohp: 'wallslide', rdl: 'bridge', plank: 'bird', suit: 'carry' };
export function aplicarSubstituicoesL0(matriz, categoria, L) {
  if (categoria !== 'Musculação' || L !== 0) return matriz;
  return matriz.map((c) => SUBSTITUICOES_L0[c] || c);
}

// ============================== 14.1 — Aeróbico ==============================
function construirAerobico(matriz, L, v) {
  const codigo = matriz[0];
  if (v % 2 === 0) {
    const duracaoSeg = [720, 1200, 1500, 1800][L] + 120 * Math.floor(v / 10);
    return {
      exercicios: [novoExercicioApp({ codigo, linhas: [novaLinha({ duracaoSeg, rpe: 4 })] })],
      grupos: {}, metodoPrincipal: 'Sem método',
    };
  }
  const nIntervalos = 6 + Math.floor(v / 10);
  const trabalho = [45, 60, 90, 120][L];
  const recuperacao = [75, 60, 60, 60][L];
  const rpeTrabalho = [4, 5, 6, 7][L];
  const ex = marcar(novoExercicioApp({
    codigo, metodo: 'Intervalado', metodoParams: { esforco: String(trabalho), recuperacao: String(recuperacao) },
    linhas: Array.from({ length: nIntervalos }, () => novaLinha({ duracaoSeg: trabalho, descansoSeg: recuperacao, rpe: rpeTrabalho })),
    notas: `${nIntervalos} intervalos de ${trabalho} s com ${recuperacao} s de recuperação ativa (RPE 2–3).`,
  }), { timed: true });
  return { exercicios: [ex], grupos: {}, metodoPrincipal: 'Intervalado' };
}

// ============================== 14 — principal por categoria (sem método explícito) ==============================
export function construirPrincipalPadrao(categoria, matriz, L, v) {
  if (categoria === 'Aeróbico') return construirAerobico(matriz, L, v);

  if (['Alongamento', 'Mobilidade', 'Pilates', 'Laboral', 'Reabilitação'].includes(categoria)) {
    const descanso = categoria === 'Laboral' ? 15 : 30;
    const series = categoria === 'Laboral' ? 1 : 2;
    const exercicios = matriz.map((codigo) => {
      const familia = exercicioDoc(codigo).familia;
      const dose = doseBase(familia, L);
      let intensidade = intensidadeBase(familia, L);
      if (categoria === 'Reabilitação' && intensidade.tipo === 'RIR') intensidade = { ...intensidade, valor: 4 };
      const linhas = Array.from({ length: series }, () => novaLinha({
        reps: dose.tipo === 'reps' ? dose.valor : null,
        duracaoSeg: dose.tipo === 'tempo' ? dose.valor : null,
        descansoSeg: descanso,
        ...camposDeIntensidade(intensidade),
      }));
      return novoExercicioApp({ codigo, linhas });
    });
    return { exercicios, grupos: {}, metodoPrincipal: 'Série tradicional' };
  }

  if (categoria === 'Pliometria') {
    const exercicios = matriz.map((codigo, i) => exTradicional(codigo, L, i < 2 ? { series: 3, descanso: 120 } : { series: 2, descanso: 60 }));
    return { exercicios, grupos: {}, metodoPrincipal: 'Série tradicional' };
  }

  if (categoria === 'Levantamento olímpico') {
    // Os dois primeiros: 4 séries de 3 repetições, 150 s. Os restantes: 2 séries
    // de 6 repetições, 90 s -- com conversão temporal quando a família o pede.
    const exercicios = matriz.map((codigo, i) => (
      i < 2 ? exTradicional(codigo, L, { series: 4, descanso: 150, reps: 3 }) : exTradicional(codigo, L, { series: 2, descanso: 90, reps: 6 })
    ));
    return { exercicios, grupos: {}, metodoPrincipal: 'Série tradicional' };
  }

  if (categoria === 'Powerlifting') {
    const principais = new Set(['bsq', 'bpress', 'dead']);
    const exercicios = matriz.map((codigo) => (
      principais.has(codigo)
        ? exTradicional(codigo, L, { series: 3, descanso: 180, reps: L < 2 ? 5 : 4 })
        : exTradicional(codigo, L, { series: 3 })
    ));
    return { exercicios, grupos: {}, metodoPrincipal: 'Série tradicional' };
  }

  if (categoria === 'Strongman') {
    return { exercicios: matriz.map((codigo) => exTradicional(codigo, L, { series: 3 })), grupos: {}, metodoPrincipal: 'Série tradicional' };
  }

  // 14.7 -- Musculação, Funcional, Em casa, Elástico: série tradicional se L=0
  // ou v par, circuito nos restantes casos.
  const metodo = (L === 0 || v % 2 === 0) ? 'Série tradicional' : 'Circuito';
  return { ...METODOS_EXPLICITOS[metodo](matriz, L, v), metodoPrincipal: metodo };
}

// ============================== 15.1 — aquecimento ==============================
export function construirAquecimento(categoria, matriz) {
  if (categoria === 'Laboral') {
    return [novoExercicioApp({ codigo: R.AQUECIMENTO_LABORAL.exercicio, linhas: [novaLinha({ duracaoSeg: R.AQUECIMENTO_LABORAL.segundos })] })];
  }
  // Aeróbico: o próprio exercício aeróbico da matriz, 180 s.
  const sequencia = categoria === 'Aeróbico'
    ? [matriz[0]]
    : (R.AQUECIMENTO_POR_CATEGORIA[categoria] || R.AQUECIMENTO_POR_CATEGORIA.restantes);
  return sequencia.map((codigo, i) => {
    const familia = exercicioDoc(codigo).familia;
    const dose = doseBase(familia, 0); // dose do aquecimento é sempre a de L0
    const primeiroAerobico = i === 0 && familia.includes('aeróbico');
    return novoExercicioApp({
      codigo,
      linhas: [novaLinha({
        reps: !primeiroAerobico && dose.tipo === 'reps' ? dose.valor : null,
        duracaoSeg: primeiroAerobico ? R.AQUECIMENTO_PRIMEIRO_AEROBICO_SEGUNDOS : (dose.tipo === 'tempo' ? dose.valor : null),
        descansoSeg: R.AQUECIMENTO_DESCANSO_LOCAL,
      })],
    });
  });
}

// ============================== 15.2 — preparação específica adicional ==============================
// Devolve { exercicio, aviso } ou null.
export function construirPreparacaoEspecifica(categoria, matriz, L, metodoExplicito) {
  if (!R.CATEGORIAS_PREPARACAO_ESPECIFICA.includes(categoria)) return null;
  if (metodoExplicito === 'Série de aproximação') return null;
  const alvo = matriz[0];
  const familia = exercicioDoc(alvo).familia;
  const temporal = motor.converterSeTemporal(familia, true); // caso de borda da secção 15.2
  const intensidade = camposDeIntensidade(intensidadeComRir(familia, L, R.PREPARACAO_ESPECIFICA_RIR));
  const linhas = R.PREPARACAO_ESPECIFICA.map((s) => novaLinha({
    reps: temporal == null ? s.reps : null,
    duracaoSeg: temporal,
    cargaTexto: `${s.cargaPct}%`,
    descansoSeg: s.descanso,
    ...intensidade,
  }));
  const exercicio = novoExercicioApp({
    codigo: alvo, metodo: 'Série de aproximação', linhas,
    notas: 'Preparação específica do primeiro exercício do bloco principal. ' + C._api.NOTA_PERCENTAGENS,
  });
  const aviso = temporal == null ? null
    : `A preparação específica herdou uma família temporal (${familia}); a dose foi convertida para ${temporal} s em vez de repetições. Rever antes de usar (secção 15.2).`;
  return { exercicio, aviso };
}

// ============================== 15.3 — volta à calma ==============================
export function construirVoltaCalma(categoria) {
  const lista = categoria === 'Laboral' ? R.VOLTA_CALMA_LABORAL : R.VOLTA_CALMA_PADRAO;
  return lista.map((item) => novoExercicioApp({ codigo: item.exercicio, linhas: [novaLinha({ duracaoSeg: item.segundos })] }));
}

// ============================== 15.10 — equipamento ==============================
export function equipamentoDoTreino(...blocosDeExercicios) {
  const set = new Set();
  blocosDeExercicios.flat().forEach((ex) => {
    const codigo = reverterParaCodigo(ex);
    if (codigo) set.add(exercicioDoc(codigo).equipamento);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt'));
}

// ============================== 16.7 — condicionamento Baixo ==============================
// Só blocos sequenciais (sem combinação, sem modo temporizado): no máximo duas
// séries por exercício e, nas séries com RIR, RIR mínimo 4 e descanso mínimo
// 90 s. A série de aproximação é estrutural e fica como está.
export function aplicarCondicionamentoBaixo(principal) {
  principal.exercicios.forEach((ex) => {
    if (ex.grupo || ex._timed || ex.metodo === 'Série de aproximação') return;
    if (ex.linhas.length > 2) ex.linhas = ex.linhas.slice(0, 2);
    ex.linhas.forEach((l) => {
      if (l.rir === undefined || l.rir === '') return;
      l.rir = String(Math.max(Number(l.rir), 4));
      const atual = /^\d+$/.test(String(l.descanso || '')) ? Number(l.descanso) : 0;
      l.descanso = String(Math.max(atual, 90));
    });
  });
}

// ============================== 16.1 — incremento editorial de Categoria i>=10 ==============================
// +5 s nas doses temporais (exceto Respiração) e +2 repetições nas doses por
// repetições (exceto famílias com pliometria, olímpico ou potência).
export function aplicarIncrementoI10(principal) {
  principal.exercicios.forEach((ex) => {
    if (ex.metodo === 'Série de aproximação') return;
    const familia = familiaDoExercicio(ex);
    const especial = /pliometria|olímpico|potência/.test(familia);
    ex.linhas.forEach((l) => {
      if (l.tempo && /^\d+/.test(l.tempo)) {
        if (familia !== 'respiração') l.tempo = (parseInt(l.tempo, 10) + 5) + ' s';
      } else if (/^\d+$/.test(String(l.reps || '').trim()) && !especial) {
        l.reps = String(Number(l.reps) + 2);
      }
    });
  });
}

// ============================== 17 — estimativa de duração ==============================
function segundosDeRepeticoes(reps, segPorRep) {
  const texto = String(reps || '').trim();
  if (/^\d+$/.test(texto)) return Number(texto) * segPorRep;
  if (/^\d+(\s*\+\s*\d+)+$/.test(texto)) { // segmentos: 10 + 3 + 3
    const partes = texto.split('+').map((p) => Number(p.trim()));
    return partes.reduce((s, n) => s + n * segPorRep, 0) + (partes.length - 1) * 20; // pausa interna de 20 s
  }
  return 12 * segPorRep; // faixa / falha sem repetições fixas: 12 só para estimar
}

function duracaoExercicioSegundos(ex) {
  const segPorRep = cadenciaBase(familiaDoExercicio(ex)).includes('lento') ? 4 : 3;
  const cadaLado = ex.lateralidade === 'cada lado';
  let total = 0;
  ex.linhas.forEach((l) => {
    let execucao = 0;
    if (l.tempo) { const m = /^(\d+)/.exec(l.tempo); execucao = m ? Number(m[1]) : 0; }
    else if (l.reps) execucao = segundosDeRepeticoes(l.reps, segPorRep);
    if (cadaLado) execucao *= 2;
    total += execucao + (/^\d+$/.test(String(l.descanso || '')) ? Number(l.descanso) : 0);
  });
  return total;
}

function somaSemCronometro(lista) {
  return lista.filter((e) => !e._cronometro).reduce((s, e) => s + duracaoExercicioSegundos(e), 0);
}

// Recuperação entre rondas de uma combinação: só rondas-1 vezes.
function recuperacaoEntreRondas(principal) {
  let total = 0;
  Object.entries(principal.grupos || {}).forEach(([gid, g]) => {
    const membros = principal.exercicios.filter((e) => e.grupo === gid);
    if (!membros.length || membros.some((m) => m._cronometro)) return;
    const pausa = Number((g.params || {}).pausaVolta || (g.params || {}).pausaRonda || 0);
    total += Math.max(0, membros[0].linhas.length - 1) * pausa;
  });
  return total;
}

export function estimarDuracao(aquecimento, principal, voltaCalma) {
  const segundos = somaSemCronometro(aquecimento)
    + somaSemCronometro(principal.exercicios) + (principal.duracaoBlocoSegundos || 0) + recuperacaoEntreRondas(principal)
    + somaSemCronometro(voltaCalma);
  const minutos = Math.ceil(segundos / 60);
  return { minutos, min: Math.max(3, minutos - 3), max: minutos + 5 };
}
