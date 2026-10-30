/*
 * Presets de treino: estruturas prontas (combinações, métodos, aquecimento) e as
 * que o treinador guarda. Um preset é sempre uma lista de exercícios com as suas
 * linhas, o mesmo formato do treino, para aplicar não precisar de conversão.
 * Aplicar copia tudo com ids novos: editar depois nunca mexe no preset.
 */
const linha = (reps, descanso = '60', extra = {}) => ({ tipo: 'reps_carga', reps, carga: '', descanso, rpe: '', ...extra });
const ex = (nome, linhas, extra = {}) => ({ exercicioId: '', nome, bloco: 'Principal', metodo: '', metodoParams: {}, notas: '', grupo: '', linhas, ...extra });
const repetir = (n, fazer) => Array.from({ length: n }, (_, i) => fazer(i));

function combinacao(metodo, nomes, params = {}, reps = '10') {
  return {
    grupos: { g: { metodo, params } },
    exercicios: nomes.map((nome, i) => ex(nome, repetir(3, () => linha(reps, i === nomes.length - 1 ? '90' : '0')), { grupo: 'g' })),
  };
}

export const PRESETS_SISTEMA = [
  { id: 'sis:bi_set', sistema: true, nome: 'Bi-set', tipo: 'combinacao', ...combinacao('bi_set', ['Exercício A', 'Exercício B'], { pausaRonda: '90' }) },
  { id: 'sis:trisserie', sistema: true, nome: 'Trissérie', tipo: 'combinacao', ...combinacao('trisserie', ['Exercício A', 'Exercício B', 'Exercício C'], { pausaRonda: '120' }) },
  { id: 'sis:circuito', sistema: true, nome: 'Circuito de 4 estações', tipo: 'combinacao', ...combinacao('circuito', ['Estação 1', 'Estação 2', 'Estação 3', 'Estação 4'], { voltas: '3', pausaVolta: '120' }, '12') },
  { id: 'sis:emom', sistema: true, nome: 'EMOM 10 minutos', tipo: 'exercicio', grupos: {}, exercicios: [ex('Exercício', [linha('10', '0')], { metodo: 'EMOM', metodoParams: { minutos: '10', janela: '1' } })] },
  { id: 'sis:amrap', sistema: true, nome: 'AMRAP 12 minutos', tipo: 'exercicio', grupos: {}, exercicios: [ex('Exercício', [linha('10', '0')], { metodo: 'AMRAP', metodoParams: { minutos: '12' } })] },
  { id: 'sis:dropset', sistema: true, nome: 'Drop-set de 2 quedas', tipo: 'exercicio', grupos: {}, exercicios: [ex('Exercício', [linha('10', '90')], { metodo: 'Drop-set', metodoParams: { quedas: '2', reducao: '20' } })] },
  { id: 'sis:cluster', sistema: true, nome: 'Cluster 3 × 3', tipo: 'exercicio', grupos: {}, exercicios: [ex('Exercício', [linha('3', '90')], { metodo: 'Cluster', metodoParams: { seriesCompletas: '3', miniBlocosPorSerie: '3', pausaIntra: '20', pausaEntreSeries: '120' } })] },
  {
    id: 'sis:aquecimento', sistema: true, nome: 'Aquecimento padrão', tipo: 'bloco', grupos: {},
    exercicios: [
      ex('Cardio ligeiro', [{ tipo: 'cardio', duracao: '5 min', velocidade: '', potencia: '', descanso: '0', rpe: '3' }], { bloco: 'Aquecimento' }),
      ex('Mobilidade geral', [{ tipo: 'observacao', notas: 'Ombros, anca e tornozelos, 2 minutos', descanso: '0', rpe: '' }], { bloco: 'Aquecimento' }),
    ],
  },
];

function tipoDe(exercicios) {
  if (exercicios.length === 1) return 'exercicio';
  const grupos = new Set(exercicios.map((e) => e.grupo));
  if (grupos.size === 1 && !grupos.has('')) return 'combinacao';
  const blocos = new Set(exercicios.map((e) => e.bloco));
  return blocos.size === 1 ? 'bloco' : 'treino';
}

export const ROTULO_TIPO_PRESET = { exercicio: 'Exercício', combinacao: 'Combinação', bloco: 'Bloco', treino: 'Treino' };

// Só leva os grupos que os exercícios escolhidos usam.
export function presetDeSelecao(nome, exercicios, gruposDoTreino, gerarId, agora) {
  const grupos = {};
  exercicios.forEach((e) => { if (e.grupo && gruposDoTreino && gruposDoTreino[e.grupo]) grupos[e.grupo] = gruposDoTreino[e.grupo]; });
  return JSON.parse(JSON.stringify({
    id: gerarId(), nome: String(nome || '').trim() || 'Preset', tipo: tipoDe(exercicios), criadoEm: agora, favorito: false, arquivado: false, grupos, exercicios,
  }));
}

// Devolve exercícios e grupos prontos a juntar ao treino, com ids novos. O id de
// cada grupo também muda: aplicar duas vezes tem de dar duas combinações.
export function aplicarPreset(preset, gerarId) {
  const copia = JSON.parse(JSON.stringify(preset));
  const novosGrupos = {};
  const mapa = {};
  Object.keys(copia.grupos || {}).forEach((g) => { mapa[g] = gerarId(); novosGrupos[mapa[g]] = copia.grupos[g]; });
  const exercicios = (copia.exercicios || []).map((e) => ({
    ...e,
    id: gerarId(),
    grupo: e.grupo ? (mapa[e.grupo] || '') : '',
    linhas: (e.linhas || []).map((l) => ({ ...l, id: gerarId() })),
  }));
  return { exercicios, grupos: novosGrupos };
}

// Replica os valores de uma série para outras, só nos campos que o tipo de
// destino usa: uma série de corrida não ganha carga. `id` e `papel` nunca mudam.
export function replicarSerie(origem, destino, camposDoTipo) {
  const saida = { ...destino };
  const campos = camposDoTipo(destino.tipo === undefined ? origem.tipo : destino.tipo);
  [...campos, 'descanso', 'rpe', 'rir'].forEach((c) => {
    if (origem[c] !== undefined) saida[c] = origem[c];
  });
  return saida;
}
