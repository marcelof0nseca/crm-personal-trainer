/*
 * Motor de construcao deterministica da representacao A (secoes 12-17 do
 * documento de consolidacao). Funcoes puras, sem aleatoriedade -- a mesma
 * entrada produz sempre a mesma saida. Usado por gerar-modelos-treino.mjs.
 */
import { DICIONARIO } from './dicionario.mjs';
import { MATRIZES, CATEGORIAS_ORDEM } from './matrizes.mjs';
import * as R from './regras.mjs';
import mapaExercicios from './mapa-exercicios.json' with { type: 'json' };

const EXP_POR_L = ['Iniciante', 'Intermédio', 'Avançado', 'Especialista'];
const COND_POR_L = ['Baixo', 'Moderado', 'Bom', 'Elevado'];
const DICIONARIO_POR_CODIGO = new Map(DICIONARIO.map((e) => [e.codigo, e]));

export function exercicioDoc(codigo) {
  const item = DICIONARIO_POR_CODIGO.get(codigo);
  if (!item) throw new Error(`Código de exercício desconhecido: ${codigo}`);
  return item;
}

export function exercicioApp(codigo) {
  const resolvido = mapaExercicios[codigo];
  if (!resolvido) throw new Error(`Sem resolução de biblioteca para: ${codigo}`);
  return resolvido; // { id, nome, novo }
}

// ---- id determinístico (sem Math.random -- duas corridas do gerador têm de
// produzir exatamente o mesmo ficheiro) --------------------------------
let contadorId = 0;
export function reiniciarContadorId() { contadorId = 0; }
export function idDet(prefixo) { contadorId += 1; return `${prefixo}${contadorId.toString(36)}`; }

// ============================== 12.1 — dose base ==============================
function familiaContem(familia, ...palavras) {
  return palavras.some((p) => familia.includes(p));
}

// Devolve { tipo: 'reps'|'tempo', valor } para o nível L (0-3). Preserva a
// particularidade editorial: só a família EXATAMENTE 'pliometria' entra na
// regra de repetições da pliometria -- 'pliometria técnica'/'pliometria
// unilateral' caem na regra residual (ver secção 12.1 e pendência 5).
export function doseBase(familia, L) {
  if (familiaContem(familia, 'alongamento')) return { tipo: 'tempo', valor: R.DOSE_BASE.alongamento.valores[L] };
  if (familiaContem(familia, 'tempo')) return { tipo: 'tempo', valor: R.DOSE_BASE.contemTempo.valores[L] };
  if (familiaContem(familia, 'transporte')) return { tipo: 'tempo', valor: R.DOSE_BASE.transporte.valores[L] };
  if (familiaContem(familia, 'aeróbico')) return { tipo: 'tempo', valor: R.DOSE_BASE.aerobico.valores[L] };
  if (familiaContem(familia, 'respiração')) return { tipo: 'tempo', valor: R.DOSE_BASE.respiracao.valores[L] };
  if (familia === 'pliometria') return { tipo: 'reps', valor: R.DOSE_BASE.pliometriaExata.valores[L] };
  if (familiaContem(familia, 'olímpico')) return { tipo: 'reps', valor: R.DOSE_BASE.olimpico.valores[L] };
  if (familiaContem(familia, 'potência')) return { tipo: 'reps', valor: R.DOSE_BASE.potencia.valores[L] };
  if (familiaContem(familia, 'mobilidade', 'pilates')) return { tipo: 'reps', valor: R.DOSE_BASE.mobilidadeOuPilates.formula(L) };
  return { tipo: 'reps', valor: R.DOSE_BASE.restantes.valores[L] };
}

// Conversão de repetições -> dose temporal quando a família é temporal/
// transporte/aeróbica/respiratória/alongamento mas a chamada deu repetições.
export function converterSeTemporal(familia, temRepeticoes) {
  if (!temRepeticoes) return null;
  if (familiaContem(familia, 'aeróbico')) return R.CONVERSAO_TEMPORAL.aerobico;
  if (familiaContem(familia, 'respiração')) return R.CONVERSAO_TEMPORAL.respiracao;
  if (familiaContem(familia, 'tempo', 'transporte', 'alongamento')) return R.CONVERSAO_TEMPORAL.restantesTemporais;
  return null;
}

// ============================== 12.2 — intensidade base ==============================
// { tipo: 'RIR'|'RPE', valor, nota? }
export function intensidadeBase(familia, L) {
  if (familiaContem(familia, 'respiração')) return { tipo: 'RPE', valor: R.RPE_POR_FAMILIA.respiracao.valor };
  if (familiaContem(familia, 'mobilidade', 'alongamento', 'equilíbrio')) return { tipo: 'RPE', valor: R.RPE_POR_FAMILIA.mobilidadeAlongamentoEquilibrio.valor };
  if (familiaContem(familia, 'pilates')) return { tipo: 'RPE', valor: R.RPE_POR_FAMILIA.pilates.valor };
  if (familiaContem(familia, 'aeróbico')) return { tipo: 'RPE', valor: R.RPE_POR_FAMILIA.aerobico.valor, nota: R.RPE_POR_FAMILIA.aerobico.nota };
  if (familiaContem(familia, 'pliometria', 'olímpico', 'potência')) {
    return { tipo: 'RPE', valor: R.RPE_POR_FAMILIA.pliometriaOlimpicoPotencia.formula(L), nota: R.RPE_POR_FAMILIA.pliometriaOlimpicoPotencia.nota };
  }
  return { tipo: 'RIR', valor: R.RIR_FORCA_POR_L[L], nota: R.NOTA_RIR };
}

// ============================== 12.3 — cadência base ==============================
export function cadenciaBase(familia) {
  if (familiaContem(familia, 'aeróbico', 'transporte', 'alongamento', 'tempo', 'respiração')) return R.CADENCIA_NAO_APLICAVEL;
  if (familiaContem(familia, 'pliometria', 'potência')) return R.CADENCIA_PLIOMETRIA_POTENCIA;
  if (familiaContem(familia, 'olímpico')) return R.CADENCIA_OLIMPICO;
  if (familiaContem(familia, 'mobilidade', 'pilates')) return R.CADENCIA_MOBILIDADE_PILATES;
  return R.CADENCIA_FORCA;
}

// ============================== 12.4 — séries/descanso tradicionais ==============================
export function seriesDescanso(L) { return R.SERIES_DESCANSO_POR_L[L]; }

// ============================== 12.5 — lateralidade ==============================
export function lateralidade(familia) {
  return familiaContem(familia, 'unilateral') ? 'cada lado' : 'bilateral/alternado conforme nome';
}

// ============================== linha/série (formato da app) ==============================
// Só ficam as chaves com valor: uma linha de 'novaLinhaSerie' da app também
// traz só id, tipo, reps, carga, descanso e rpe. Ficheiro e prescrições
// gravadas ficam mais pequenos, e tudo o que lê uma linha já tolera chaves
// em falta (descreverLinha, CargaDaSerie).
let contadorLinha = 0;
function novaLinha(campos) {
  contadorLinha += 1;
  // Uma linha com carga relativa E tempo (preparação de uma família temporal)
  // usa o tipo que mostra os dois; senão a percentagem ficava escrita e invisível.
  let tipo = 'reps_carga';
  if (campos.cadencia) tipo = 'cadencia';
  else if (campos.duracaoSeg != null) tipo = campos.cargaTexto ? 'reps_carga_tempo' : 'reps_tempo';
  const linha = {
    id: 'l' + contadorLinha.toString(36),
    tipo: campos.tipoForcado || tipo,
    reps: campos.reps != null ? String(campos.reps) : (campos.faixaRepeticoes || ''),
    carga: campos.cargaTexto || '',
    descanso: campos.descansoSeg != null ? String(campos.descansoSeg) : '',
    rpe: campos.rpe != null && campos.rpe !== '' ? String(campos.rpe) : '',
  };
  if (campos.duracaoSeg != null) linha.tempo = campos.duracaoSeg + ' s';
  if (campos.rir != null && campos.rir !== '') linha.rir = String(campos.rir);
  if (campos.cadencia) linha.cadencia = campos.cadencia;
  if (campos.notas) linha.notas = campos.notas;
  return linha;
}

// Um exercício no formato da app: { id, exercicioId, nome, bloco, metodo,
// metodoParams, grupo, linhas, notas }. `lateralidade`, `_timed` e
// `_cronometro` são internos do gerador (duração, ajustes por método) e
// saem antes de gravar o ficheiro.
let contadorExercicio = 0;
function novoExercicioApp({ codigo, metodo, metodoParams, grupo, linhas, notas }) {
  contadorExercicio += 1;
  const app = exercicioApp(codigo);
  const doc = exercicioDoc(codigo);
  return {
    id: 'x' + contadorExercicio.toString(36),
    exercicioId: app.id,
    nome: app.nome,
    metodo: metodo || '',
    metodoParams: metodoParams || {},
    grupo: grupo || '',
    linhas: linhas || [],
    lateralidade: lateralidade(doc.familia),
    notas: notas || '',
  };
}

export const _internos = { novaLinha, novoExercicioApp, familiaContem };
export { EXP_POR_L, COND_POR_L };
