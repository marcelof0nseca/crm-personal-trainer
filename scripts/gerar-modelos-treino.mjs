/*
 * Gera os dados da biblioteca de modelos de treino (representacao A do
 * documento de consolidacao, secao 16), no formato de treinos.modelos[] da
 * aplicacao (painel-pt.tsx: guardarComoModelo / clonarTreinos /
 * criarPrescricaoDeModelo):
 *
 *   src/data/modelos-treino.ts     as 860 fichas -- grande (~MB), carregado
 *                                  por import() so quando se abre a biblioteca
 *   src/data/exercicios-modelos.ts os exercicios do dicionario que a
 *                                  biblioteca de exercicios ainda nao tem,
 *                                  mais instrucoes e regressoes -- pequeno,
 *                                  importado estaticamente
 *
 * Funcoes puras, sem aleatoriedade: duas corridas produzem os mesmos
 * ficheiros byte a byte.
 *
 * Uso: node scripts/gerar-modelos-treino.mjs
 */
import fs from 'fs';
import { DICIONARIO } from './dados-modelos-treino/dicionario.mjs';
import { MATRIZES, CATEGORIAS_ORDEM } from './dados-modelos-treino/matrizes.mjs';
import * as R from './dados-modelos-treino/regras.mjs';
import * as motor from './dados-modelos-treino/motor.mjs';
import * as F from './dados-modelos-treino/fichas.mjs';
import mapaExercicios from './dados-modelos-treino/mapa-exercicios.json' with { type: 'json' };
import suplementares from './dados-modelos-treino/exercicios-suplementares.json' with { type: 'json' };

F.registarMapaReverso(mapaExercicios);

const EXPERIENCIA_POR_L = ['Iniciante', 'Intermédio', 'Avançado', 'Especialista'];
const CONDICIONAMENTO_POR_L = ['Baixo', 'Moderado', 'Bom', 'Elevado'];
const CATEGORIAS_SUPERVISAO = new Set(R.CATEGORIAS_SUPERVISAO_TECNICA);
const METODOS_SUPERVISAO = new Set(R.METODOS_SUPERVISAO_TECNICA);

const OBJETIVO_PADRAO_POR_CATEGORIA = {
  'Aeróbico': 'Capacidade cardiorrespiratória',
  'Alongamento': 'Mobilidade e flexibilidade',
  'Mobilidade': 'Mobilidade e flexibilidade',
  'Pliometria': 'Potência e desempenho',
  'Levantamento olímpico': 'Potência e desempenho',
  'Powerlifting': 'Força',
  'Strongman': 'Força',
  'Musculação': 'Hipertrofia',
};
function objetivoPadrao(categoria) { return OBJETIVO_PADRAO_POR_CATEGORIA[categoria] || 'Saúde e autonomia funcional'; }

let idSeq = 0;
function proximoId() { idSeq += 1; return 'PTM-' + String(idSeq).padStart(4, '0'); }

function capitalizar(texto) { return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto; }

// ============================== fecho de um exercício (formato final) ==============================
// Tira o que é interno do gerador e põe o que a app mostra no sítio onde a
// app o mostra: as notas das linhas só se veem no tipo 'observação', por isso
// sobem para o exercício (sem repetições); "cada lado" e a cadência também.
function finalizarExercicio(ex) {
  const familia = F.familiaDoExercicio(ex);
  const partes = [];
  if (ex.notas) partes.push(ex.notas);
  if (ex.lateralidade === 'cada lado') partes.push('Cada lado.');

  const vistas = new Set();
  ex.linhas.forEach((l) => {
    if (l.notas && !vistas.has(l.notas)) { vistas.add(l.notas); partes.push(l.notas); }
    delete l.notas;
  });

  if (ex.bloco === 'Principal') {
    const cadencia = motor.cadenciaBase(familia);
    if (cadencia === R.CADENCIA_FORCA) {
      // Cadência de força: vai na própria linha (tipo "repetições, carga e cadência").
      ex.linhas.forEach((l) => { if (l.tipo === 'reps_carga' && l.reps) { l.tipo = 'cadencia'; l.cadencia = cadencia; } });
    } else if (cadencia !== R.CADENCIA_NAO_APLICAVEL) {
      partes.push(`Cadência: ${cadencia}.`);
    }
    // Notas de intensidade das famílias com RPE. A do RIR é a mesma em todo o
    // lado e mostra-se uma vez só, na ficha.
    const intensidade = motor.intensidadeBase(familia, 0);
    if (intensidade.tipo === 'RPE' && intensidade.nota) partes.push(capitalizar(intensidade.nota));
  }

  ex.notas = partes.join(' ');
  delete ex.lateralidade;
  delete ex._timed;
  delete ex._cronometro;
  return ex;
}

// ============================== montagem de uma ficha ==============================
function montarFicha({ colecao, chaveColecao, numeroNaColecao, categoria, categoriaMatriz, LConstrucao, experienciaExibida, condicionamentoExibida, objetivo, metodoExplicito, v, posProcessos = [] }) {
  const matrizDef = MATRIZES[categoriaMatriz][v % 10];
  const matriz = F.aplicarSubstituicoesL0(matrizDef.exercicios, categoria, LConstrucao);
  const avisos = [];

  const principal = metodoExplicito
    ? F.METODOS_EXPLICITOS[metodoExplicito](matriz, LConstrucao, v)
    : F.construirPrincipalPadrao(categoria, matriz, LConstrucao, v);
  if (!principal.grupos) principal.grupos = {};
  if (principal.avisos) avisos.push(...principal.avisos);

  const preparacao = F.construirPreparacaoEspecifica(categoria, matriz, LConstrucao, metodoExplicito);
  if (preparacao) {
    principal.exercicios = [preparacao.exercicio, ...principal.exercicios];
    if (preparacao.aviso) avisos.push(preparacao.aviso);
  }

  posProcessos.forEach((fn) => fn(principal, avisos));
  if (condicionamentoExibida === 'Baixo') F.aplicarCondicionamentoBaixo(principal);

  principal.exercicios.forEach((ex) => { ex.bloco = 'Principal'; });
  const aquecimento = F.construirAquecimento(categoria, matriz);
  aquecimento.forEach((ex) => { ex.bloco = 'Aquecimento'; });
  const voltaCalma = F.construirVoltaCalma(categoria);
  voltaCalma.forEach((ex) => { ex.bloco = 'Volta à calma'; });

  const duracao = F.estimarDuracao(aquecimento, principal, voltaCalma);
  const equipamento = F.equipamentoDoTreino(aquecimento, principal.exercicios, voltaCalma);
  // "Equipamento essencial" do cartão: só o do bloco principal, sem o que é o corpo.
  const equipamentoPrincipal = F.equipamentoDoTreino(principal.exercicios).filter((e) => e !== 'nenhum');

  const exercicios = [...aquecimento, ...principal.exercicios, ...voltaCalma].map(finalizarExercicio);

  const nome = `${chaveColecao} | ${String(numeroNaColecao).padStart(2, '0')} — ${matrizDef.foco}`;
  const ficha = {
    id: proximoId(),
    nome,
    colecao,
    chaveColecao,
    numeroNaColecao,
    categoria,
    objetivo,
    experiencia: experienciaExibida,
    condicionamento: condicionamentoExibida,
    metodoPrincipal: metodoExplicito || principal.metodoPrincipal || 'Série tradicional',
    equipamento,
    equipamentoPrincipal,
    duracaoEstimadaMinutos: duracao,
    treinos: [{
      id: motor.idDet('t'),
      nome: 'Treino A',
      notas: avisos.join(' '),
      exercicios,
      grupos: principal.grupos,
    }],
  };
  // Só as flags verdadeiras: ausente = falso. Os textos que delas dependem
  // (critérios de entrada, progressão...) resolvem-se em modelos-treino-textos.ts.
  if (categoria === 'Reabilitação') ficha.requerValidacaoClinica = true;
  if (CATEGORIAS_SUPERVISAO.has(categoria) || (metodoExplicito && METODOS_SUPERVISAO.has(metodoExplicito))) ficha.requerSupervisaoTecnica = true;
  if (categoria === 'Pliometria' || metodoExplicito === 'Contraste') ficha.precisaAvisoPliometriaContraste = true;
  if (principal.duracaoBlocoSegundos != null) ficha.cronometroSegundos = principal.duracaoBlocoSegundos;
  if (avisos.length) ficha.avisosEditoriais = avisos;
  return ficha;
}

// ============================== pós-processos ==============================
function posProcessoIncrementoI10(principal) { F.aplicarIncrementoI10(principal); }

const FAMILIAS_EXCLUIDAS_FORCA = new Set(['core unilateral', 'core tempo', 'core tempo unilateral']);
const comRirEReps = (l) => l.rir !== undefined && l.rir !== '' && /^\d+$/.test(String(l.reps || '').trim());
const estrutural = (ex) => ex._timed || ex.metodo === 'Série de aproximação';

// 16.2 Força: em blocos sequenciais (os circuitos não viram força pesada).
function posProcessoObjetivoForca(L) {
  return (principal) => {
    principal.exercicios.forEach((ex) => {
      if (ex.grupo || estrutural(ex) || FAMILIAS_EXCLUIDAS_FORCA.has(F.familiaDoExercicio(ex))) return;
      ex.linhas.forEach((l) => {
        if (!comRirEReps(l)) return;
        l.reps = String(L === 0 ? 6 : 5);
        l.descanso = String(L < 2 ? 150 : 180);
      });
    });
  };
}

// 16.2 Resistência muscular: pausa local de 60 s, preservando a pausa de ronda
// (que vive no grupo) e a ausência de pausa local no fim de cada ronda.
function posProcessoObjetivoResistencia(L) {
  return (principal) => {
    principal.exercicios.forEach((ex) => {
      if (estrutural(ex)) return;
      ex.linhas.forEach((l) => {
        if (!comRirEReps(l)) return;
        l.reps = String(L === 0 ? 12 : 15);
        if (Number(l.descanso) > 0) l.descanso = '60';
      });
    });
  };
}

// 16.2 Gestão do peso: bicicleta confortável, sem pausa local.
function posProcessoObjetivoGestaoPeso(i) {
  return (principal) => {
    const duracaoSeg = 600 + 120 * (i % 3);
    principal.exercicios.push(motor._internos.novoExercicioApp({
      codigo: 'bike',
      linhas: [motor._internos.novaLinha({ duracaoSeg, rpe: 4 })],
      notas: 'Bicicleta confortável no fim da sessão.',
    }));
  };
}

// ============================== 16.1 — Coleção Categoria (280) ==============================
function gerarColecaoCategoria() {
  const fichas = [];
  CATEGORIAS_ORDEM.forEach((categoria) => {
    for (let i = 0; i < 20; i += 1) {
      let L = Math.floor(i / 5) % 4;
      if (categoria === 'Laboral' || categoria === 'Reabilitação') L = 0;
      if (['Pliometria', 'Levantamento olímpico', 'Powerlifting', 'Strongman'].includes(categoria)) L = Math.max(L, 1);
      fichas.push(montarFicha({
        colecao: 'categoria', chaveColecao: categoria, numeroNaColecao: i + 1,
        categoria, categoriaMatriz: categoria, LConstrucao: L,
        experienciaExibida: EXPERIENCIA_POR_L[L], condicionamentoExibida: CONDICIONAMENTO_POR_L[L],
        objetivo: objetivoPadrao(categoria), metodoExplicito: null, v: i,
        posProcessos: i >= 10 && categoria !== 'Aeróbico' ? [posProcessoIncrementoI10] : [],
      }));
    }
  });
  return fichas;
}

// ============================== 16.2 — Coleção Objetivo (160) ==============================
const OBJETIVOS_ORDEM = [
  'Hipertrofia', 'Força', 'Gestão do peso e composição corporal', 'Resistência muscular',
  'Capacidade cardiorrespiratória', 'Mobilidade e flexibilidade', 'Potência e desempenho', 'Saúde e autonomia funcional',
];
function categoriaDoObjetivo(objetivo, i) {
  switch (objetivo) {
    case 'Hipertrofia': case 'Força': return 'Musculação';
    case 'Gestão do peso e composição corporal': return i % 2 === 0 ? 'Funcional' : 'Em casa';
    case 'Resistência muscular': return i % 2 === 0 ? 'Musculação' : 'Elástico';
    case 'Capacidade cardiorrespiratória': return 'Aeróbico';
    case 'Mobilidade e flexibilidade': return i % 2 === 0 ? 'Mobilidade' : 'Alongamento';
    case 'Potência e desempenho': return 'Pliometria';
    case 'Saúde e autonomia funcional': return 'Funcional';
    default: throw new Error('Objetivo desconhecido: ' + objetivo);
  }
}
function gerarColecaoObjetivo() {
  const fichas = [];
  OBJETIVOS_ORDEM.forEach((objetivo) => {
    for (let i = 0; i < 20; i += 1) {
      let L = Math.floor(i / 5);
      const categoria = categoriaDoObjetivo(objetivo, i);
      const v = objetivo === 'Mobilidade e flexibilidade' ? (Math.floor(i / 2) + 10 * (i % 2)) : i;
      if (objetivo === 'Potência e desempenho') L = Math.max(L, 1); // mínimo técnico L1

      const posProcessos = [];
      if (objetivo === 'Força') posProcessos.push(posProcessoObjetivoForca(L));
      if (objetivo === 'Resistência muscular') posProcessos.push(posProcessoObjetivoResistencia(L));
      if (objetivo === 'Gestão do peso e composição corporal') posProcessos.push(posProcessoObjetivoGestaoPeso(i));

      fichas.push(montarFicha({
        colecao: 'objetivo', chaveColecao: objetivo, numeroNaColecao: i + 1,
        categoria, categoriaMatriz: categoria, LConstrucao: L,
        experienciaExibida: EXPERIENCIA_POR_L[L], condicionamentoExibida: CONDICIONAMENTO_POR_L[L],
        objetivo, metodoExplicito: null, v, posProcessos,
      }));
    }
  });
  return fichas;
}

// ============================== 16.3 — Coleção Experiência (80) ==============================
const CATEGORIA_POR_BLOCO_EXPERIENCIA = ['Musculação', 'Em casa', 'Elástico', 'Funcional'];
const METODO_POR_I_MOD5_L2 = ['Série tradicional', 'Superset antagonista', 'Pirâmide', 'Back-off', 'Cluster'];
function gerarColecaoExperiencia() {
  const fichas = [];
  for (let L = 0; L < 4; L += 1) {
    for (let i = 0; i < 20; i += 1) {
      const categoria = CATEGORIA_POR_BLOCO_EXPERIENCIA[Math.floor(i / 5)];
      const metodoExplicito = L >= 2 && categoria === 'Musculação' ? METODO_POR_I_MOD5_L2[i % 5] : null;
      fichas.push(montarFicha({
        colecao: 'experiencia', chaveColecao: EXPERIENCIA_POR_L[L], numeroNaColecao: i + 1,
        categoria, categoriaMatriz: categoria, LConstrucao: L,
        experienciaExibida: EXPERIENCIA_POR_L[L], condicionamentoExibida: CONDICIONAMENTO_POR_L[L],
        objetivo: objetivoPadrao(categoria), metodoExplicito, v: 2 * (i % 5) + (L % 2),
      }));
    }
  }
  return fichas;
}

// ============================== 16.4 — Coleção Condicionamento (80) ==============================
const CATEGORIA_POR_BLOCO_CONDICIONAMENTO = ['Aeróbico', 'Funcional', 'Em casa', 'Elástico'];
function gerarColecaoCondicionamento() {
  const fichas = [];
  for (let nivel = 0; nivel < 4; nivel += 1) {
    for (let i = 0; i < 20; i += 1) {
      const categoria = CATEGORIA_POR_BLOCO_CONDICIONAMENTO[Math.floor(i / 5)];
      const LTecnico = Math.min(nivel, 2); // condicionamento Elevado não força experiência Especialista
      fichas.push(montarFicha({
        colecao: 'condicionamento', chaveColecao: CONDICIONAMENTO_POR_L[nivel], numeroNaColecao: i + 1,
        categoria, categoriaMatriz: categoria, LConstrucao: LTecnico,
        experienciaExibida: EXPERIENCIA_POR_L[LTecnico], condicionamentoExibida: CONDICIONAMENTO_POR_L[nivel],
        objetivo: objetivoPadrao(categoria), metodoExplicito: null, v: 2 * (i % 5) + (nivel % 2),
      }));
    }
  }
  return fichas;
}

// ============================== 16.5 — Coleção Método (260) ==============================
const METODOS_EM_FUNCIONAL = new Set(['EMOM', 'AMRAP', 'For time', 'Circuito', 'Personalizado...']);
function gerarColecaoMetodo() {
  const fichas = [];
  F.METODOS_ORDEM.forEach((metodo) => {
    const categoria = METODOS_EM_FUNCIONAL.has(metodo) ? 'Funcional' : 'Musculação';
    const L = METODOS_SUPERVISAO.has(metodo) ? 2 : 1;
    for (let i = 0; i < 10; i += 1) {
      fichas.push(montarFicha({
        colecao: 'metodo', chaveColecao: metodo, numeroNaColecao: i + 1,
        categoria, categoriaMatriz: categoria, LConstrucao: L,
        experienciaExibida: EXPERIENCIA_POR_L[L], condicionamentoExibida: CONDICIONAMENTO_POR_L[L],
        objetivo: objetivoPadrao(categoria), metodoExplicito: metodo, v: i,
      }));
    }
  });
  return fichas;
}

// ============================== construção completa ==============================
const fichas = [
  ...gerarColecaoCategoria(),
  ...gerarColecaoObjetivo(),
  ...gerarColecaoExperiencia(),
  ...gerarColecaoCondicionamento(),
  ...gerarColecaoMetodo(),
];
if (fichas.length !== 860) throw new Error(`Esperava 860 fichas, construí ${fichas.length}.`);

// ============================== exercícios do dicionário para a biblioteca ==============================
// Lê os grupos e categorias da biblioteca de origem, para garantir que cada
// exercício novo entra num que existe (o mesmo cuidado do gerador de exercícios).
function lerLista(texto, nome) {
  const m = texto.match(new RegExp('export const ' + nome + '\\s*(?::[^=]*)?=\\s*(\\[[\\s\\S]*?\\n\\]);', 'm'));
  if (!m) throw new Error('Não encontrei ' + nome + ' em exercicios.ts');
  return new Function('return ' + m[1])();
}
const textoExercicios = fs.readFileSync(new URL('../src/data/exercicios.ts', import.meta.url), 'utf8');
const GRUPOS_BASE = lerLista(textoExercicios, 'GRUPOS_BASE');
const CATEGORIAS_BASE = lerLista(textoExercicios, 'CATEGORIAS_BASE');

// Primeira palavra-chave que a família contém ganha; "anca unilateral" antes de "anca".
const GRUPO_POR_FAMILIA = [
  ['core', 'Abdominais'], ['transporte', 'Corpo inteiro'], ['aeróbico', 'Cardio'],
  ['alongamento', 'Mobilidade'], ['mobilidade', 'Mobilidade'], ['respiração', 'Mobilidade'],
  ['pilates', 'Corpo inteiro'], ['pliometria', 'Corpo inteiro'], ['potência', 'Corpo inteiro'],
  ['olímpico', 'Corpo inteiro'], ['equilíbrio', 'Corpo inteiro'],
  ['joelho', 'Quadricípites'], ['quadricípite', 'Quadricípites'],
  ['anca unilateral', 'Abdutores'], ['anca', 'Glúteos'], ['posterior', 'Isquiotibiais'], ['gémeos', 'Gémeos'],
  ['peito', 'Peito'], ['costas', 'Costas'], ['ombro', 'Ombros'], ['bíceps', 'Bíceps'], ['tríceps', 'Tríceps'],
];
const CATEGORIA_POR_FAMILIA = [
  ['aeróbico', 'Aeróbico'], ['alongamento', 'Alongamento'], ['mobilidade', 'Mobilidade'],
  ['respiração', 'Pilates'], ['pilates', 'Pilates'], ['pliometria', 'Pliometria'], ['potência', 'Pliometria'],
  ['olímpico', 'Levantamento olímpico'], ['transporte', 'Strongman'], ['core', 'Funcional'], ['equilíbrio', 'Funcional'],
];
function primeiraCorrespondencia(tabela, familia, omissao) {
  const achado = tabela.find(([chave]) => familia.includes(chave));
  return achado ? achado[1] : omissao;
}

const porCodigo = new Map(DICIONARIO.map((d) => [d.codigo, d]));
const exerciciosNovos = suplementares.map((s) => {
  const familia = s.familiaDocumento;
  const grupo = primeiraCorrespondencia(GRUPO_POR_FAMILIA, familia, 'Corpo inteiro');
  const categoria = /^(elástico|minibanda)/.test(s.equipamento) ? 'Elástico' : primeiraCorrespondencia(CATEGORIA_POR_FAMILIA, familia, 'Musculação');
  if (!GRUPOS_BASE.includes(grupo)) throw new Error(`Grupo inexistente na biblioteca: ${grupo} (${s.nome})`);
  if (!CATEGORIAS_BASE.includes(categoria)) throw new Error(`Categoria inexistente na biblioteca: ${categoria} (${s.nome})`);
  return { nome: s.nome, grupo, categoria, equipamento: capitalizar(s.equipamento), instrucoes: capitalizar(s.instrucao) };
});

const instrucoes = {};
const regressoes = {};
DICIONARIO.forEach((d) => {
  const id = mapaExercicios[d.codigo].id;
  instrucoes[id] = capitalizar(d.instrucao);
  const alvo = R.REGRESSOES_ESPECIFICAS[d.codigo];
  regressoes[id] = alvo ? porCodigo.get(alvo).nomePt : R.REGRESSAO_GENERICA;
});

// ============================== escrita ==============================
const cabecalho = (quem) => `/* eslint-disable */
/*
 * GERADO por scripts/gerar-modelos-treino.mjs a partir das regras
 * deterministicas da representacao A (documento de consolidacao da
 * biblioteca de modelos de treino). Nao editar a mao -- volte a correr o
 * script. Fonte dos dados: scripts/dados-modelos-treino/*.
 *
 * ${quem}
 */
`;

fs.writeFileSync(
  new URL('../src/data/modelos-treino.ts', import.meta.url),
  `${cabecalho(`As ${fichas.length} fichas. Cada uma tem a forma de treinos.modelos[] (nome, objetivo, treinos[]),
 * mais os campos de filtro. Flags (requerValidacaoClinica, requerSupervisaoTecnica,
 * precisaAvisoPliometriaContraste): ausente = falso. Os textos fixos (criterios de
 * entrada, progressao, regressao...) estao em modelos-treino-textos.ts.
 * Carregado por import() dinamico: nao entra no bundle de arranque.`)}
export const CATALOGO_MODELOS = ${JSON.stringify(fichas)};
`,
  'utf8',
);

fs.writeFileSync(
  new URL('../src/data/exercicios-modelos.ts', import.meta.url),
  `${cabecalho(`Exercicios do dicionario da biblioteca de modelos. Pequeno, importado
 * estaticamente (as fichas em modelos-treino.ts referem-se a estes ids).
 *   CATALOGO_MODELOS_VERSAO e TOTAL_MODELOS_CATALOGO (para a interface nao ter de carregar as fichas)
 *   EXERCICIOS_MODELOS   os que a biblioteca de exercicios ainda nao tinha (id = 'e:' + nome)
 *   INSTRUCOES_MODELOS   instrucao de execucao, por id (todos os do dicionario)
 *   REGRESSOES_MODELOS   regressao, por id (todos os do dicionario)`)}
// Sobe quando o conteudo das fichas muda. Um programa criado a partir de uma
// ficha guarda-a (origem.catalogo), para se saber de que versao veio.
export const CATALOGO_MODELOS_VERSAO = 'ptm_catalogo_a_v1';

export const TOTAL_MODELOS_CATALOGO = ${fichas.length};

export const EXERCICIOS_MODELOS = ${JSON.stringify(exerciciosNovos)};

export const INSTRUCOES_MODELOS = ${JSON.stringify(instrucoes)};

export const REGRESSOES_MODELOS = ${JSON.stringify(regressoes)};
`,
  'utf8',
);

console.log(`Escrevi ${fichas.length} fichas em src/data/modelos-treino.ts e ${exerciciosNovos.length} exercícios novos em src/data/exercicios-modelos.ts.`);
