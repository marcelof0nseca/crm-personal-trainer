/*
 * Gera 200 protocolos de treino semanais novos -- NAO vêm de nenhum
 * documento de origem (ao contrário dos 860 de gerar-modelos-treino.mjs):
 * são regras escritas de propósito para esta biblioteca, organizadas
 * primeiro pela frequência semanal do aluno (1-2x, 2-3x, 4-5x, 5-7x), com
 * 50 protocolos completos em cada uma, cruzando valência (força,
 * hipertrofia, resistência muscular, mobilidade e estabilidade),
 * modalidade, condicionamento físico, nível de experiência e objetivo.
 *
 * Escreve no mesmo formato de ficha que a biblioteca de modelos existente
 * (src/data/modelos-treino.ts) -- entram na mesma vista, no mesmo "Usar este
 * modelo", no mesmo PDF -- mas com id próprio (PTS-, não PTM-) e com
 * `frequenciaSemanal`, o campo novo que os distingue e que os filtra.
 *
 * Reaproveita a dosagem já escrita para a biblioteca de modelos
 * (scripts/dados-modelos-treino/{motor,regras}.mjs: séries, descanso, RIR/
 * RPE, cadência por família de exercício) e os textos fixos de
 * src/data/modelos-treino-textos.ts (critérios de entrada, progressão,
 * regressão, o que registar) -- não a inventar de novo. A seleção de
 * exercícios é nova: em vez do dicionário de 95 exercícios do documento,
 * escolhe diretamente da biblioteca real de 2076 (src/data/exercicios.ts),
 * por grupo muscular e categoria.
 *
 * Função pura, sem aleatoriedade: duas corridas produzem o mesmo ficheiro
 * byte a byte -- a "aleatoriedade" vem de um índice determinístico (ver
 * `escolher`), não de Math.random.
 *
 * Uso: node scripts/gerar-protocolos-semanais.mjs
 */
import fs from 'fs';
import * as motor from './dados-modelos-treino/motor.mjs';
import * as R from './dados-modelos-treino/regras.mjs';

const { doseBase, intensidadeBase, cadenciaBase, seriesDescanso } = motor;
const { novaLinha } = motor._internos;

/* ============================== biblioteca real de exercícios ============================== */
function lerLista(texto, nome) {
  const m = texto.match(new RegExp('export const ' + nome + '\\s*(?::[^=]*)?=\\s*(\\[[\\s\\S]*?\\n\\]);', 'm'));
  if (!m) throw new Error('Não encontrei ' + nome + ' em exercicios.ts');
  return new Function('return ' + m[1])();
}
const textoExercicios = fs.readFileSync(new URL('../src/data/exercicios.ts', import.meta.url), 'utf8');
const GRUPOS_BASE = lerLista(textoExercicios, 'GRUPOS_BASE');
const CATEGORIAS_BASE = lerLista(textoExercicios, 'CATEGORIAS_BASE');
const EXERCICIOS_BASE = lerLista(textoExercicios, 'EXERCICIOS_BASE');

const CATALOGO = EXERCICIOS_BASE.map(([nome, g, c, equipamento]) => ({
  id: 'e:' + nome, nome, grupo: GRUPOS_BASE[g], categoria: CATEGORIAS_BASE[c], equipamento,
})).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));

// Nem toda a categoria tem todos os grupos (ex.: "Funcional" quase não isola
// bíceps/tríceps) -- sem correspondência exata, usa-se a categoria inteira:
// continua a ser um exercício dessa modalidade, só não tão dirigido ao grupo
// pedido. Só falha se a própria categoria não tiver exercício nenhum.
function pool(categoria, grupos) {
  const exato = CATALOGO.filter((e) => e.categoria === categoria && (!grupos || grupos.includes(e.grupo)));
  if (exato.length > 0) return exato;
  const daCategoria = CATALOGO.filter((e) => e.categoria === categoria);
  if (daCategoria.length === 0) throw new Error(`Sem exercícios nenhuns para categoria=${categoria}`);
  return daCategoria;
}
// Escolha determinística dentro de um poço: a mesma semente dá sempre o mesmo
// exercício, mas sementes vizinhas (dias/protocolos vizinhos) não colidem
// sempre no mesmo ponto -- um primo grande como passo evita padrões óbvios.
function escolher(lista, semente) {
  const i = ((semente * 2654435761) >>> 0) % lista.length;
  return lista[i];
}
// `usados` é partilhado por TODOS os slots do mesmo treino (aquecimento,
// principal e volta à calma -- ver construirTreino): sem isso, um protocolo
// de modalidade Mobilidade podia aquecer com o mesmo exercício que depois
// prescrevia como principal, porque os dois bebem do mesmo poço de categoria.
function escolherUm(candidatos, semente, usados) {
  let ex = escolher(candidatos, semente);
  let tentativa = 0;
  while (usados.has(ex.id) && tentativa < candidatos.length) {
    tentativa += 1;
    ex = escolher(candidatos, semente + tentativa * 53);
  }
  usados.add(ex.id);
  return ex;
}

/* ============================== família (para a dosagem reaproveitada) ============================== */
function familiaDoReal(ex) {
  if (ex.categoria === 'Alongamento') return 'alongamento';
  if (ex.categoria === 'Aeróbico') return 'aeróbico';
  if (ex.categoria === 'Mobilidade') return 'mobilidade';
  if (ex.categoria === 'Pilates') return 'pilates';
  if (ex.grupo === 'Abdominais' || ex.grupo === 'Lombar') return 'core';
  return 'força';
}

/* ============================== ajuste por valência (12.1/12.2 não distinguem valência -- isto distingue) ============================== */
// Reps, descanso e RIR-alvo por condicionamento (0-3), só para exercícios de
// força em blocos principais -- aquecimento, volta à calma e as famílias
// temporais (aeróbico, mobilidade, alongamento, pilates) já têm a dose certa
// vinda de doseBase/intensidadeBase e não se tocam.
const AJUSTE_VALENCIA = {
  'Força': { reps: [5, 5, 4, 3], descanso: [120, 150, 180, 180], rir: [3, 2, 1, 1] },
  'Resistência muscular': { reps: [15, 15, 18, 20], descanso: [45, 45, 40, 40], rir: [4, 3, 3, 2] },
};

function linhaPrincipal(ex, L, valencia) {
  const familia = familiaDoReal(ex);
  const dose = doseBase(familia, L);
  const intensidade = intensidadeBase(familia, L);
  const ajuste = (familia === 'força' || familia === 'core') ? AJUSTE_VALENCIA[valencia] : null;
  const reps = ajuste ? ajuste.reps[L] : (dose.tipo === 'reps' ? dose.valor : null);
  const duracaoSeg = dose.tipo === 'tempo' ? dose.valor : null;
  const { series, descanso: descansoPadrao } = seriesDescanso(L);
  const descansoSeg = ajuste ? ajuste.descanso[L] : descansoPadrao;
  const camposIntensidade = intensidade.tipo === 'RIR'
    ? { rir: String(ajuste ? ajuste.rir[L] : intensidade.valor) }
    : { rpe: String(intensidade.valor) };
  return { series, linhas: Array.from({ length: series }, () => novaLinha({ reps, duracaoSeg, descansoSeg, ...camposIntensidade })) };
}

function exercicioApp(ex, linhas, bloco, extra) {
  return { id: motor.idDet('x'), exercicioId: ex.id, nome: ex.nome, bloco, metodo: '', metodoParams: {}, grupo: '', linhas, notas: '', ...extra };
}

/* ============================== aquecimento / volta à calma ============================== */
const POOL_AQUECIMENTO = pool('Mobilidade');
const POOL_CALMA = pool('Alongamento');
// A dose da família 'mobilidade' é em repetições (ver DOSE_BASE.mobilidadeOuPilates
// em regras.mjs), não em tempo -- escrever sempre duracaoSeg dava "6 s" para
// uma mobilização que é "6 repetições".
const DOSE_AQUECIMENTO = doseBase('mobilidade', 0);
const DOSE_CALMA = doseBase('alongamento', 0);

/* ============================== dias de treino (6 modalidades × foco do dia) ============================== */
// Cada "foco" é um conjunto de grupos musculares reais (GRUPOS_BASE) de onde
// se tira cada exercício do bloco principal -- um por grupo, nessa ordem.
const FOCOS = {
  corpoInteiro: [['Peito', 'Costas'], ['Quadricípites', 'Isquiotibiais', 'Glúteos'], ['Ombros'], ['Abdominais', 'Lombar'], ['Bíceps', 'Tríceps']],
  superiores: [['Peito'], ['Costas'], ['Ombros'], ['Bíceps'], ['Tríceps']],
  inferiores: [['Quadricípites'], ['Isquiotibiais'], ['Glúteos'], ['Gémeos'], ['Abdominais', 'Lombar']],
  push: [['Peito'], ['Peito'], ['Ombros'], ['Tríceps']],
  pull: [['Costas'], ['Costas'], ['Bíceps'], ['Antebraço']],
  pernas: [['Quadricípites'], ['Isquiotibiais'], ['Glúteos'], ['Gémeos'], ['Abdominais', 'Lombar']],
};

// Modalidade -> categoria real da biblioteca, mais os focos que faz sentido
// usar quando há vários dias por semana (só 'Musculação' faz split por
// grupo; as outras repetem corpo inteiro, como se programam na prática).
const MODALIDADES = {
  'Musculação': { categoria: 'Musculação', comSplit: true },
  'Funcional': { categoria: 'Funcional', comSplit: false },
  'Em casa': { categoria: 'Em casa', comSplit: false },
  'Elástico': { categoria: 'Elástico', comSplit: false },
  'Mobilidade': { categoria: 'Mobilidade', comSplit: false },
  'Pilates': { categoria: 'Pilates', comSplit: false },
};

// Nomes e focos dos treinos da semana, por número de dias (1 a 7). Para
// quem não faz split (comSplit=false), todos os dias usam 'corpoInteiro'.
function planoDaSemana(nDias, comSplit) {
  if (!comSplit) return Array.from({ length: nDias }, (_, i) => ({ nome: `Treino ${String.fromCharCode(65 + i)}`, foco: 'corpoInteiro' }));
  const padroes = {
    1: ['corpoInteiro'],
    2: ['corpoInteiro', 'corpoInteiro'],
    3: ['corpoInteiro', 'corpoInteiro', 'corpoInteiro'],
    4: ['superiores', 'inferiores', 'superiores', 'inferiores'],
    5: ['superiores', 'inferiores', 'superiores', 'inferiores', 'corpoInteiro'],
    6: ['push', 'pull', 'pernas', 'push', 'pull', 'pernas'],
    7: ['push', 'pull', 'pernas', 'push', 'pull', 'pernas', 'corpoInteiro'],
  };
  return padroes[nDias].map((foco, i) => ({ nome: `Treino ${String.fromCharCode(65 + i)}`, foco }));
}

// Dois "focos" (ex.: corpoInteiro) podem cair no mesmo poço de recurso quando
// nenhum dos dois tem exercícios próprios para o grupo pedido -- sem controlo,
// duas posições do mesmo treino escolhiam o mesmo exercício. `usados` evita
// repetir dentro do MESMO treino; entre treinos diferentes repetir é normal
// (ex.: agachamento em "Treino A" e em "Treino C").
//
// A ordem importa: um grupo raro na categoria (ex.: só 1 exercício de
// "Ombros" em Pilates) tem de escolher ANTES de um grupo que caiu no poço de
// recurso (a categoria inteira) -- senão o poço largo "gastava" sem saber o
// único exercício que o poço apertado precisava, e não havia como recuperar.
// Escolhe-se pelos poços mais pequenos primeiro; o resultado final mantém a
// ordem original dos grupos.
function construirTreino({ nome, foco, categoria, L, valencia, metodoPrincipal, semente }) {
  const grupos = FOCOS[foco];
  // Um slot por exercício do treino inteiro -- aquecimento, principal e volta
  // à calma --, para se poder escolher pelos poços mais pequenos PRIMEIRO,
  // seja qual for o bloco. Um grupo raro na categoria (ex.: o único exercício
  // de "Lombar" em Mobilidade) tem de escolher antes de um poço largo que
  // podia -- por acaso -- "gastar" esse único exercício sem saber que outro
  // slot não tinha alternativa nenhuma. Juntar os três blocos numa lista só
  // (em vez de escolher aquecimento, depois principal, depois volta à calma)
  // é o que torna essa ordem possível entre blocos, e não só dentro de um.
  const slots = [
    { tipo: 'aquecimento', candidatos: POOL_AQUECIMENTO, semente: semente + 500 },
    { tipo: 'aquecimento', candidatos: POOL_AQUECIMENTO, semente: semente + 597 },
    ...grupos.map((listaDeGrupos, i) => ({ tipo: 'principal', candidatos: pool(categoria, listaDeGrupos), semente: semente + i * 31 })),
    { tipo: 'calma', candidatos: POOL_CALMA, semente: semente + 700 },
    { tipo: 'calma', candidatos: POOL_CALMA, semente: semente + 797 },
  ];
  const ordem = [...slots].sort((a, b) => a.candidatos.length - b.candidatos.length);
  const usados = new Set();
  const porSlot = new Map(ordem.map((slot) => [slot, escolherUm(slot.candidatos, slot.semente, usados)]));

  const aquecimento = slots.filter((s) => s.tipo === 'aquecimento').map((s) => {
    const linhas = [novaLinha({
      reps: DOSE_AQUECIMENTO.tipo === 'reps' ? DOSE_AQUECIMENTO.valor : null,
      duracaoSeg: DOSE_AQUECIMENTO.tipo === 'tempo' ? DOSE_AQUECIMENTO.valor : null,
      descansoSeg: R.AQUECIMENTO_DESCANSO_LOCAL,
      rpe: 3,
    })];
    return exercicioApp(porSlot.get(s), linhas, 'Aquecimento');
  });
  const principal = slots.filter((s) => s.tipo === 'principal').map((s) => {
    const ex = porSlot.get(s);
    const { linhas } = linhaPrincipal(ex, L, valencia);
    return exercicioApp(ex, linhas, 'Principal', metodoPrincipal !== 'Série tradicional' ? { metodo: metodoPrincipal } : {});
  });
  const voltaCalma = slots.filter((s) => s.tipo === 'calma').map((s) => {
    const linhas = [novaLinha({ duracaoSeg: DOSE_CALMA.valor, descansoSeg: 15, rpe: 3 })];
    return exercicioApp(porSlot.get(s), linhas, 'Volta à calma');
  });

  return {
    id: motor.idDet('t'),
    nome,
    notas: '',
    exercicios: [...aquecimento, ...principal, ...voltaCalma],
    grupos: {},
  };
}

/* ============================== duração e equipamento (resumo do cartão) ============================== */
function estimarMinutos(treino) {
  let seg = 0;
  treino.exercicios.forEach((ex) => {
    ex.linhas.forEach((l) => {
      const tempoSerie = l.tempo ? Number(String(l.tempo).replace(' s', '')) : (Number(l.reps) || 10) * 3.5;
      seg += tempoSerie + (Number(l.descanso) || 0);
    });
  });
  return Math.max(10, Math.round(seg / 60));
}
function equipamentoDoTreino(treino, catalogoPorId) {
  const set = new Set();
  treino.exercicios.forEach((ex) => { const e = catalogoPorId.get(ex.exercicioId); if (e && e.equipamento) set.add(e.equipamento); });
  return [...set].sort((a, b) => a.localeCompare(b, 'pt'));
}

/* ============================== plano dos 200 protocolos ============================== */
const BANDAS = [
  { id: '1-2', label: '1 a 2x por semana', dias: [1, 2] },
  { id: '2-3', label: '2 a 3x por semana', dias: [2, 3] },
  { id: '4-5', label: '4 a 5x por semana', dias: [4, 5] },
  { id: '5-7', label: '5 a 7x por semana', dias: [5, 6, 7] },
];
// Força/Hipertrofia/Resistência muscular combinam com as 4 modalidades "de
// treino de força"; Mobilidade e estabilidade só combina com Mobilidade e
// Pilates -- combiná-la com Musculação não faria sentido.
const VALENCIAS = [
  { nome: 'Força', objetivo: 'Força', modalidades: ['Musculação', 'Funcional', 'Em casa', 'Elástico'] },
  { nome: 'Hipertrofia', objetivo: 'Hipertrofia', modalidades: ['Musculação', 'Funcional', 'Em casa', 'Elástico'] },
  { nome: 'Resistência muscular', objetivo: 'Resistência muscular', modalidades: ['Musculação', 'Funcional', 'Em casa', 'Elástico'] },
  { nome: 'Mobilidade e estabilidade', objetivo: 'Mobilidade e flexibilidade', modalidades: ['Mobilidade', 'Pilates'] },
];
const PARES_VALENCIA_MODALIDADE = VALENCIAS.flatMap((v) => v.modalidades.map((m) => ({ valencia: v.nome, objetivo: v.objetivo, modalidade: m })));
const EXP_POR_L = ['Iniciante', 'Intermédio', 'Avançado', 'Especialista'];
const COND_POR_L = ['Baixo', 'Moderado', 'Bom', 'Elevado'];

let idSeq = 0;
function proximoId() { idSeq += 1; return 'PTS-' + String(idSeq).padStart(4, '0'); }
const catalogoPorId = new Map(CATALOGO.map((e) => [e.id, e]));

function montarProtocolo({ banda, numeroNaBanda, par, L, nDias, semente }) {
  const { comSplit, categoria } = MODALIDADES[par.modalidade];
  const plano = planoDaSemana(nDias, comSplit);
  // Resistência muscular fora do ginásio programa-se melhor em circuito --
  // dá, dentro das 200, uma segunda forma de prescrever além da série
  // tradicional, sem precisar dos 26 métodos todos para uma primeira versão.
  const metodoPrincipal = (par.valencia === 'Resistência muscular' && par.modalidade !== 'Musculação') ? 'Circuito' : 'Série tradicional';
  const treinos = plano.map((dia, i) => construirTreino({
    nome: dia.nome, foco: dia.foco, categoria, L, valencia: par.valencia, metodoPrincipal,
    semente: semente + i * 211,
  }));
  const duracaoMinutos = estimarMinutos(treinos[0]);
  const equipamento = [...new Set(treinos.flatMap((t) => equipamentoDoTreino(t, catalogoPorId)))].sort((a, b) => a.localeCompare(b, 'pt'));
  const equipamentoPrincipal = equipamento.filter((e) => e && e !== 'Nenhum' && e !== 'Peso corporal');
  const nome = `${banda.label} | ${String(numeroNaBanda).padStart(2, '0')} — ${par.valencia} · ${par.modalidade} (${nDias}x)`;
  const ficha = {
    id: proximoId(),
    nome,
    colecao: 'categoria',
    chaveColecao: categoria,
    numeroNaColecao: numeroNaBanda,
    frequenciaSemanal: banda.id,
    diasPorSemana: nDias,
    categoria,
    objetivo: par.objetivo,
    experiencia: EXP_POR_L[L],
    condicionamento: COND_POR_L[L],
    metodoPrincipal,
    equipamento,
    equipamentoPrincipal,
    duracaoEstimadaMinutos: { minutos: duracaoMinutos },
    treinos,
  };
  if (par.modalidade === 'Mobilidade' || par.modalidade === 'Pilates') {
    // Mesma regra do resto da biblioteca: supervisão/validação são avisos,
    // nunca bloqueios -- aqui não se aplicam, porque nenhuma destas
    // modalidades entra em CATEGORIAS_SUPERVISAO_TECNICA.
  }
  return ficha;
}

const fichas = [];
BANDAS.forEach((banda) => {
  let numeroNaBanda = 0;
  let parIdx = 0;
  let levelIdx = 0;
  let diaIdx = 0;
  while (numeroNaBanda < 50) {
    const par = PARES_VALENCIA_MODALIDADE[parIdx % PARES_VALENCIA_MODALIDADE.length];
    const L = levelIdx % 4;
    const nDias = banda.dias[diaIdx % banda.dias.length];
    numeroNaBanda += 1;
    fichas.push(montarProtocolo({
      banda, numeroNaBanda, par, L, nDias,
      semente: fichas.length * 1009 + 3,
    }));
    parIdx += 1;
    levelIdx += 1;
    diaIdx += 1;
  }
});
if (fichas.length !== 200) throw new Error(`Esperava 200 protocolos, construí ${fichas.length}.`);

/* ============================== escrita ============================== */
const cabecalho = `/* eslint-disable */
/*
 * GERADO por scripts/gerar-protocolos-semanais.mjs. Não editar à mão --
 * voltar a correr o script. 200 protocolos novos, sem documento de origem
 * (regras próprias, ver o cabeçalho do gerador), organizados primeiro por
 * frequência semanal (frequenciaSemanal: '1-2'|'2-3'|'4-5'|'5-7'), cruzando
 * valência, modalidade, condicionamento e experiência. Mesma forma de ficha
 * da biblioteca de modelos (CATALOGO_MODELOS); entram na mesma vista.
 * Carregado por import() dinâmico: não entra no bundle de arranque.
 */
`;
fs.writeFileSync(
  new URL('../src/data/protocolos-semanais.ts', import.meta.url),
  `${cabecalho}export const CATALOGO_PROTOCOLOS_SEMANAIS = ${JSON.stringify(fichas)};\n`,
  'utf8',
);

console.log(`Escrevi ${fichas.length} protocolos em src/data/protocolos-semanais.ts.`);
BANDAS.forEach((b) => console.log(`  ${b.label}: ${fichas.filter((f) => f.frequenciaSemanal === b.id).length}`));
