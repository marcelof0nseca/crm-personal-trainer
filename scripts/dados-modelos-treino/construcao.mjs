/*
 * Construcao por metodo (secao 13 do documento de consolidacao) da
 * representacao A. Consome motor.mjs. Cada funcao devolve
 *   { exercicios, grupos, duracaoBlocoSegundos?, avisos? }
 * e nunca usa aleatoriedade.
 *
 * Vocabulario da aplicacao (painel-pt.tsx / TreinoAtoms.tsx):
 *  - metodos de UM exercicio (`ex.metodo` + `ex.metodoParams`, campos em
 *    CAMPOS_POR_METODO): Rest-pause, Drop-set, Back-off, Piramide, Tabata,
 *    Intervalado, Serie de aproximacao, Ate a falha, Cluster...
 *  - metodos de UMA COMBINACAO (`ex.grupo` + `treino.grupos[id]`, campos em
 *    CAMPOS_POR_COMBINACAO): bi-set, supersérie, trissérie, giant set,
 *    circuito, pre/pos-exaustao, superset antagonista, serie composta,
 *    contraste e -- acrescentados por esta funcionalidade -- EMOM, AMRAP e
 *    For time.
 */
import * as R from './regras.mjs';
import * as motor from './motor.mjs';

const { _internos, exercicioDoc, doseBase, intensidadeBase, seriesDescanso } = motor;
const { novaLinha, novoExercicioApp } = _internos;

function familiaDe(codigo) { return exercicioDoc(codigo).familia; }

// Dose do exercicio; `repsOverride` (uma chamada pode substituir a dose,
// secao 12.4) continua a respeitar a conversao temporal de 12.1.
function doseDe(familia, L, repsOverride) {
  if (repsOverride != null) {
    const conv = motor.converterSeTemporal(familia, true);
    return conv != null ? { tipo: 'tempo', valor: conv } : { tipo: 'reps', valor: repsOverride };
  }
  return doseBase(familia, L);
}

// "RIR n quando aplicavel": so as familias com escala RIR o levam; as outras
// mantem a sua escala (RPE) -- "salvo familia com outra escala" (13.7).
function intensidadeComRir(familia, L, rirAlvo) {
  const base = intensidadeBase(familia, L);
  return base.tipo === 'RIR' ? { tipo: 'RIR', valor: rirAlvo } : base;
}

function camposDeIntensidade(intensidade) {
  return intensidade.tipo === 'RIR' ? { rir: intensidade.valor } : { rpe: intensidade.valor };
}

function marcar(ex, { timed = false, cronometro = false } = {}) {
  if (timed) ex._timed = true;
  if (cronometro) ex._cronometro = true;
  return ex;
}

// Um exercicio "tradicional": serie x dose x intensidade x descanso do nivel L.
// Sem etiqueta de metodo por omissao: e o estado normal de um exercicio, e uma
// etiqueta "Serie tradicional" em cada linha so faria ruido. O metodo da
// ficha vive em `metodoPrincipal`.
function exTradicional(codigo, L, { series, descanso, metodo = '', notas, reps } = {}) {
  const familia = familiaDe(codigo);
  const sd = seriesDescanso(L);
  const nSeries = series != null ? series : sd.series;
  const nDescanso = descanso != null ? descanso : sd.descanso;
  const dose = doseDe(familia, L, reps);
  const intensidade = intensidadeBase(familia, L);
  const linhas = Array.from({ length: nSeries }, () => novaLinha({
    reps: dose.tipo === 'reps' ? dose.valor : null,
    duracaoSeg: dose.tipo === 'tempo' ? dose.valor : null,
    descansoSeg: nDescanso,
    ...camposDeIntensidade(intensidade),
  }));
  return novoExercicioApp({ codigo, metodo, linhas, notas });
}

function blocoTradicional(codigos, L, opcoes) {
  return codigos.map((c) => exTradicional(c, L, opcoes));
}

const NOTA_PERCENTAGENS = 'Percentagens da carga de trabalho (não são % de 1RM); definir a carga real em kg.';

// ============================== 13.2 — Série de aproximação ==============================
function serieAproximacao(codigoAlvo, L, matriz) {
  const familia = familiaDe(codigoAlvo);
  const linhas = R.SERIE_APROXIMACAO.map((s) => novaLinha({
    reps: s.reps, cargaTexto: `${s.cargaPct}%`, descansoSeg: s.descanso, ...camposDeIntensidade(intensidadeComRir(familia, L, R.SERIE_APROXIMACAO_RIR)),
  }));
  const aproximacao = novoExercicioApp({
    codigo: codigoAlvo, metodo: 'Série de aproximação', linhas,
    notas: 'Preparação com margem ampla antes do bloco tradicional completo. ' + NOTA_PERCENTAGENS,
  });
  return [aproximacao, ...blocoTradicional(matriz, L)];
}

// ============================== 13.5-13.7 — combinações ==============================
// Grupo de N exercicios com o mesmo id de grupo: dez repeticoes por exercicio
// (conversao temporal quando a familia e temporal), transicao de 20 s entre
// eles, sem pausa local no ultimo, 2 rondas (L<2) ou 3 (L>=2). A recuperacao
// entre rondas e do bloco, nao de um exercicio: vive nos parametros do grupo.
function combinacaoDose(codigos, L, { metodoApp, recuperacaoRonda }) {
  const grupoId = motor.idDet('g');
  const rondas = L < 2 ? 2 : 3;
  const exercicios = codigos.map((codigo, i) => {
    const familia = familiaDe(codigo);
    const conv = motor.converterSeTemporal(familia, true);
    const intensidade = intensidadeComRir(familia, L, L < 2 ? 3 : 2);
    const eUltimo = i === codigos.length - 1;
    const linhas = Array.from({ length: rondas }, () => novaLinha({
      reps: conv == null ? 10 : null,
      duracaoSeg: conv,
      descansoSeg: eUltimo ? 0 : 20,
      ...camposDeIntensidade(intensidade),
    }));
    return novoExercicioApp({ codigo, grupo: grupoId, linhas, notas: eUltimo ? '' : 'Transição de 20 s para o exercício seguinte.' });
  });
  return { exercicios, grupoEntry: { metodo: metodoApp, params: { pausaRonda: String(recuperacaoRonda) } }, grupoId };
}

function comComplementos(matriz, usados, L, resultado) {
  const extras = matriz.filter((c) => !usados.includes(c)).slice(0, 2);
  const complementares = extras.map((c) => exTradicional(c, L, { series: 2 }));
  return { exercicios: [...resultado.exercicios, ...complementares], grupos: { [resultado.grupoId]: resultado.grupoEntry } };
}

export function supersérie(matriz, L) {
  const primeiro = matriz[0];
  const familiaPrimeiro = familiaDe(primeiro);
  const segundo = matriz.slice(1).find((c) => familiaDe(c) !== familiaPrimeiro) || 'row';
  const usados = [primeiro, segundo];
  return comComplementos(matriz, usados, L, combinacaoDose(usados, L, { metodoApp: 'superserie', recuperacaoRonda: 90 }));
}

export function biSet(matriz, L, v) {
  const par = R.PARES_MESMO_ALVO[v % 10];
  return comComplementos(matriz, par, L, combinacaoDose(par, L, { metodoApp: 'bi_set', recuperacaoRonda: 120 }));
}

export function serieComposta(matriz, L, v) {
  const par = R.PARES_MESMO_ALVO[v % 10];
  return comComplementos(matriz, par, L, combinacaoDose(par, L, { metodoApp: 'serie_composta', recuperacaoRonda: 120 }));
}

export function preExaustao(matriz, L, v) {
  const par = R.PARES_MESMO_ALVO[v % 10]; // isolamento -> composto
  return comComplementos(matriz, par, L, combinacaoDose(par, L, { metodoApp: 'pre_exaustao', recuperacaoRonda: 120 }));
}

export function posExaustao(matriz, L, v) {
  const par = R.PARES_MESMO_ALVO[v % 10];
  const invertido = [par[1], par[0]]; // composto -> isolamento
  return comComplementos(matriz, par, L, combinacaoDose(invertido, L, { metodoApp: 'pos_exaustao', recuperacaoRonda: 120 }));
}

export function supersetAntagonista(matriz, L, v) {
  const par = R.PARES_ANTAGONISTAS[v % 10];
  return comComplementos(matriz, par, L, combinacaoDose(par, L, { metodoApp: 'superset_antagonista', recuperacaoRonda: 120 }));
}

export function trisserie(matriz, L) {
  const usados = matriz.slice(0, 3);
  return comComplementos(matriz, usados, L, combinacaoDose(usados, L, { metodoApp: 'trisserie', recuperacaoRonda: 120 }));
}

export function giantSet(matriz, L) {
  const usados = matriz.slice(0, 4);
  return comComplementos(matriz, usados, L, combinacaoDose(usados, L, { metodoApp: 'giant_set', recuperacaoRonda: 150 }));
}

// ============================== 13.8-13.14 — intensificação localizada ==============================
// Os tres primeiros exercicios da matriz (sem o alvo) com tres series
// tradicionais, e depois o alvo com o metodo pedido.
function blocoComAlvo(matriz, L, v, construirAlvo) {
  const alvo = R.EXERCICIOS_INTENSIFICACAO[v % 10];
  const preliminares = matriz.filter((c) => c !== alvo).slice(0, 3).map((c) => exTradicional(c, L, { series: 3 }));
  return { exercicios: [...preliminares, construirAlvo(alvo)], grupos: {} };
}

function linhaPreparatoria() { return novaLinha({ reps: 12, descansoSeg: 120, rir: 2 }); }

export function restPause(matriz, L, v) {
  return blocoComAlvo(matriz, L, v, (alvo) => novoExercicioApp({
    codigo: alvo, metodo: 'Rest-pause', metodoParams: { pausas: '2', pausaSeg: '20' },
    linhas: [
      linhaPreparatoria(),
      novaLinha({ reps: '10 + 3 + 3', descansoSeg: 120, rir: 1 }),
    ],
    notas: 'Segunda série: 10 repetições a 100% da carga inicial, pausa de 20 s, 3 repetições à mesma carga, pausa de 20 s, 3 repetições. Parar cada segmento ao atingir RIR 1 ou perder técnica, mesmo sem cumprir todas as repetições.',
  }));
}

export function dropSet(matriz, L, v) {
  return blocoComAlvo(matriz, L, v, (alvo) => novoExercicioApp({
    codigo: alvo, metodo: 'Drop-set', metodoParams: { quedas: '1', reducao: '25' },
    linhas: [
      linhaPreparatoria(),
      novaLinha({ reps: '10 + 8', cargaTexto: '100% → 75%', descansoSeg: 120, rir: 1 }),
    ],
    notas: 'Segunda série: 10 repetições a 100% da carga inicial, até 20 s para reduzir a carga, 8 repetições a 75% da carga inicial. Uma só queda. Parar ao atingir RIR 1 ou perder técnica. ' + NOTA_PERCENTAGENS,
  }));
}

export function ateAFalha(matriz, L, v) {
  return blocoComAlvo(matriz, L, v, (alvo) => novoExercicioApp({
    codigo: alvo, metodo: 'Até à falha',
    linhas: [
      linhaPreparatoria(),
      novaLinha({ faixaRepeticoes: '8–15', descansoSeg: 120, rir: 0 }),
    ],
    notas: 'Só a última série é até à falha técnica, sem repetições assistidas. Se atingir 15 repetições com margem, parar e ajustar a carga numa aplicação posterior.',
  }));
}

// ============================== 13.12 — Back-off ==============================
export function backOff(matriz, L) {
  const alvo = matriz[0];
  const ex = novoExercicioApp({
    codigo: alvo, metodo: 'Back-off', metodoParams: { reducao: '15' },
    linhas: [
      novaLinha({ reps: 5, cargaTexto: '100%', descansoSeg: 180, rir: 2 }),
      novaLinha({ reps: 8, cargaTexto: '85%', descansoSeg: 180, rir: 2 }),
      novaLinha({ reps: 8, cargaTexto: '85%', descansoSeg: 180, rir: 2 }),
    ],
    notas: 'Uma série principal e duas séries com 85% da carga principal. ' + NOTA_PERCENTAGENS,
  });
  return { exercicios: [ex, ...matriz.slice(1, 4).map((c) => exTradicional(c, L, { series: 2 }))], grupos: {} };
}

// ============================== 13.13 — Pirâmide ==============================
export function piramide(matriz, L) {
  const alvo = matriz[0];
  const ex = novoExercicioApp({
    codigo: alvo, metodo: 'Pirâmide', metodoParams: { sentido: 'crescente' },
    linhas: [12, 10, 8].map((reps) => novaLinha({ reps, descansoSeg: 180, rir: 2 })),
    notas: 'Aumentar a carga apenas se mantiver RIR 2.',
  });
  return { exercicios: [ex, ...matriz.slice(1, 4).map((c) => exTradicional(c, L, { series: 2 }))], grupos: {} };
}

// ============================== 13.14 — Cluster ==============================
export function cluster(matriz, L) {
  const alvo = matriz[0];
  const ex = novoExercicioApp({
    codigo: alvo, metodo: 'Cluster',
    linhas: [0, 1, 2].map(() => novaLinha({ reps: '2 + 2 + 2', descansoSeg: 180, rir: 2 })),
    notas: 'Cada série tem três segmentos de 2 repetições com a mesma carga, com pausas internas de 20 s, 20 s e nenhuma.',
  });
  return { exercicios: [ex, ...matriz.slice(1, 4).map((c) => exTradicional(c, L, { series: 2 }))], grupos: {} };
}

// ============================== 13.15 — Contraste ==============================
export function contraste(matriz, L, v) {
  const [forca, potencia] = R.PARES_CONTRASTE[v % 10];
  const grupoId = motor.idDet('g');
  const rondas = 3;
  const intensidadePotencia = intensidadeBase(familiaDe(potencia), L);
  const exForca = novoExercicioApp({
    codigo: forca, grupo: grupoId,
    linhas: Array.from({ length: rondas }, () => novaLinha({ reps: 3, descansoSeg: 180, rir: 3 })),
  });
  const exPotencia = novoExercicioApp({
    codigo: potencia, grupo: grupoId,
    linhas: Array.from({ length: rondas }, () => novaLinha({ reps: 3, descansoSeg: 0, ...camposDeIntensidade(intensidadePotencia) })),
  });
  const complementares = ['row', 'deadbug'].map((c) => exTradicional(c, 1, { series: 2 })); // dose tradicional L1
  return {
    exercicios: [exForca, exPotencia, ...complementares],
    grupos: { [grupoId]: { metodo: 'contraste', params: { pausaEntre: '180', pausaRonda: '180' } } },
  };
}

// ============================== 13.16 — Circuito ==============================
export function circuito(matriz, L) {
  const grupoId = motor.idDet('g');
  const rondas = L === 0 ? 2 : 3;
  const exercicios = matriz.map((codigo, i) => {
    const familia = familiaDe(codigo);
    const dose = doseBase(familia, L);
    const intensidade = intensidadeBase(familia, L);
    const eUltimo = i === matriz.length - 1;
    const linhas = Array.from({ length: rondas }, () => novaLinha({
      reps: dose.tipo === 'reps' ? dose.valor : null,
      duracaoSeg: dose.tipo === 'tempo' ? dose.valor : null,
      descansoSeg: eUltimo ? 0 : 30,
      ...camposDeIntensidade(intensidade),
    }));
    return novoExercicioApp({ codigo, grupo: grupoId, linhas });
  });
  return { exercicios, grupos: { [grupoId]: { metodo: 'circuito', params: { voltas: String(rondas), pausaVolta: '90' } } } };
}

// ============================== 13.17 — EMOM ==============================
export function emom(matriz, L = 1) {
  const grupoId = motor.idDet('g');
  const usados = matriz.slice(0, 3);
  const ciclos = 4;
  const exercicios = usados.map((codigo, i) => {
    const familia = familiaDe(codigo);
    const conv = motor.converterSeTemporal(familia, true);
    const linhas = Array.from({ length: ciclos }, () => novaLinha({
      reps: conv == null ? 6 : null, duracaoSeg: conv, descansoSeg: null,
      ...camposDeIntensidade(intensidadeComRir(familia, L, 3)),
    }));
    return marcar(novoExercicioApp({
      codigo, grupo: grupoId, linhas,
      notas: i === 0 ? 'Uma estação por minuto, quatro ciclos: começar cada estação no início do minuto, trabalhar até 40 s e descansar o restante. Não acumular repetições em atraso.' : '',
    }), { timed: true, cronometro: true });
  });
  return {
    exercicios,
    grupos: { [grupoId]: { metodo: 'emom', params: { minutos: String(usados.length * ciclos), trabalho: '40' } } },
    duracaoBlocoSegundos: usados.length * ciclos * 60,
  };
}

// ============================== 13.18 — AMRAP ==============================
export function amrap(matriz, L = 1) {
  const grupoId = motor.idDet('g');
  const usados = matriz.slice(0, 4);
  const exercicios = usados.map((codigo, i) => {
    const familia = familiaDe(codigo);
    const conv = motor.converterSeTemporal(familia, true);
    return marcar(novoExercicioApp({
      codigo, grupo: grupoId,
      linhas: [novaLinha({ reps: conv == null ? 8 : null, duracaoSeg: conv, descansoSeg: 20, ...camposDeIntensidade(intensidadeComRir(familia, L, 3)) })],
      notas: i === 0 ? 'Repetir a sequência durante 10 minutos, com transição de 20 s. RPE máximo global 7; pausas livres para preservar a técnica. Registar as voltas completas e a volta parcial.' : '',
    }), { timed: true, cronometro: true });
  });
  return { exercicios, grupos: { [grupoId]: { metodo: 'amrap', params: { minutos: '10' } } }, duracaoBlocoSegundos: 600 };
}

// ============================== 13.19 — For time ==============================
export function forTime(matriz, L = 2) {
  const grupoId = motor.idDet('g');
  const usados = matriz.slice(0, 4);
  const rondas = 3;
  const exercicios = usados.map((codigo, i) => {
    const familia = familiaDe(codigo);
    const conv = motor.converterSeTemporal(familia, true);
    const eUltimo = i === usados.length - 1;
    return marcar(novoExercicioApp({
      codigo, grupo: grupoId,
      linhas: Array.from({ length: rondas }, () => novaLinha({
        reps: conv == null ? 8 : null, duracaoSeg: conv, descansoSeg: eUltimo ? 0 : 20,
        ...camposDeIntensidade(intensidadeComRir(familia, L, 3)),
      })),
      notas: i === 0 ? 'Três voltas com 20 s de transição e 60 s de recuperação entre voltas. O teto de 15 minutos e o RPE máximo de 7 mandam: terminar no teto mesmo que o volume não esteja concluído.' : '',
    }), { timed: true, cronometro: true });
  });
  return {
    exercicios,
    grupos: { [grupoId]: { metodo: 'for_time', params: { limite: '15 min', voltas: String(rondas), pausaRonda: '60' } } },
    duracaoBlocoSegundos: 900,
  };
}

// ============================== 13.20 — Tabata e Intervalado ==============================
// Um exercicio so (a modalidade) com o metodo em `ex.metodo` -- o vocabulario
// de CAMPOS_POR_METODO ja tem os numeros de Tabata e Intervalado.
function complementoAerobico(modalidade) {
  return marcar(novoExercicioApp({
    codigo: modalidade,
    linhas: [novaLinha({ duracaoSeg: 600, rpe: 4 })],
    notas: 'Dez minutos de aeróbico confortável.',
  }));
}

export function tabata(v) {
  const modalidade = R.MODALIDADE_TABATA_INTERVALADO[v % 5];
  const doisBlocos = v >= 5;
  const ex = marcar(novoExercicioApp({
    codigo: modalidade, metodo: 'Tabata',
    metodoParams: { rondas: doisBlocos ? '16' : '8', trabalho: '20', pausa: '10' },
    linhas: [novaLinha({ duracaoSeg: 20, descansoSeg: 10, rpe: 8 })],
    notas: doisBlocos
      ? 'Dois blocos de 8 intervalos (20 s de trabalho a RPE 8, 10 s de recuperação a RPE 2–3), com 180 s de recuperação na mesma modalidade (RPE 2) entre blocos.'
      : 'Oito intervalos de 20 s de trabalho a RPE 8 e 10 s de recuperação a RPE 2–3. Formato 20/10 adaptado, não o protocolo supramáximo original.',
  }), { timed: true, cronometro: true });
  return {
    exercicios: [ex, complementoAerobico(modalidade)],
    grupos: {},
    // Cronómetro do bloco (secção 30.3: 8×(20+10)=240 s). O complemento aeróbico
    // soma-se à parte, pela regra normal de duração por exercício (secção 17).
    duracaoBlocoSegundos: doisBlocos ? 2 * 8 * 30 + 180 : 8 * 30,
  };
}

export function intervalado(v) {
  const modalidade = R.MODALIDADE_TABATA_INTERVALADO[v % 5];
  const dez = v >= 5;
  const nIntervalos = dez ? 10 : 8;
  const trabalho = dez ? 60 : 45;
  const recuperacao = dez ? 60 : 75;
  const ex = marcar(novoExercicioApp({
    codigo: modalidade, metodo: 'Intervalado',
    metodoParams: { esforco: String(trabalho), recuperacao: String(recuperacao) },
    linhas: [novaLinha({ duracaoSeg: trabalho, descansoSeg: recuperacao, rpe: 7 })],
    notas: `${nIntervalos} intervalos de ${trabalho} s de trabalho a RPE 7 e ${recuperacao} s de recuperação a RPE 2–3. O cronómetro inclui a recuperação do último intervalo.`,
  }), { timed: true, cronometro: true });
  return {
    exercicios: [ex, complementoAerobico(modalidade)],
    grupos: {},
    duracaoBlocoSegundos: nIntervalos * (trabalho + recuperacao),
  };
}

// ============================== 13.21 — Personalizado ==============================
export function personalizado(matriz, L) {
  const principais = matriz.slice(0, 3).map((c) => exTradicional(c, L, { series: 2 }));
  const bike = marcar(novoExercicioApp({
    codigo: 'bike', metodo: 'Intervalado', metodoParams: { esforco: '60', recuperacao: '60' },
    linhas: [novaLinha({ duracaoSeg: 60, descansoSeg: 60, rpe: 5 })],
    notas: 'Cinco intervalos de 60 s de trabalho (RPE 5) e 60 s de recuperação (RPE 2). Conflito editorial por resolver: a dose base do exercício aeróbico indica RPE 4 e o cronómetro deste bloco indica RPE 5; os dois valores ficam como no documento de origem.',
  }), { timed: true, cronometro: true });
  return {
    exercicios: [...principais, bike],
    grupos: {},
    duracaoBlocoSegundos: 600,
    avisos: ['Bloco Personalizado: a dose base do complemento aeróbico (RPE 4) e o cronómetro do bloco (RPE 5) não coincidem. Preservado tal como no documento de origem (secção 13.21); requer revisão editorial antes de o usar em modo guiado.'],
  };
}

export const _api = { exTradicional, blocoTradicional, serieAproximacao, intensidadeComRir, camposDeIntensidade, doseDe, marcar, NOTA_PERCENTAGENS };
