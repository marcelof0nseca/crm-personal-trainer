/*
 * Validacao automatica do catalogo gerado (secao 30.1/30.3 do documento).
 * Logica pura sobre os dados -- sem Playwright.
 *
 * Uso: node scripts/dados-modelos-treino/validar.mjs
 */
import { CATALOGO_MODELOS } from '../../src/data/modelos-treino.ts';
import { EXERCICIOS_MODELOS, INSTRUCOES_MODELOS, REGRESSOES_MODELOS, TOTAL_MODELOS_CATALOGO } from '../../src/data/exercicios-modelos.ts';
import { DICIONARIO } from './dicionario.mjs';
import { CATEGORIAS_ORDEM } from './matrizes.mjs';
import { METODOS_ORDEM } from './fichas.mjs';
import mapaExercicios from './mapa-exercicios.json' with { type: 'json' };

let falhas = 0;
function esperar(condicao, mensagem) {
  if (!condicao) { falhas += 1; console.error('FALHA: ' + mensagem); }
  else console.log('ok: ' + mensagem);
}

esperar(DICIONARIO.length === 95, `95 exercícios no dicionário A (tem ${DICIONARIO.length})`);
esperar(CATALOGO_MODELOS.length === 860, `860 fichas construídas (tem ${CATALOGO_MODELOS.length})`);
esperar(TOTAL_MODELOS_CATALOGO === CATALOGO_MODELOS.length, 'TOTAL_MODELOS_CATALOGO coincide com as fichas');

// 56 grupos: 14 categorias + 8 objetivos + 4 experiências + 4 condicionamentos + 26 métodos.
const grupos = new Map();
CATALOGO_MODELOS.forEach((f) => {
  const chave = f.colecao + '::' + f.chaveColecao;
  grupos.set(chave, (grupos.get(chave) || 0) + 1);
});
esperar(grupos.size === 56, `56 grupos (tem ${grupos.size})`);

let contagensErradas = 0;
grupos.forEach((n, chave) => {
  const esperado = chave.startsWith('metodo::') ? 10 : 20;
  if (n !== esperado) { contagensErradas += 1; console.error(`  contagem errada em ${chave}: ${n}, esperava ${esperado}`); }
});
esperar(contagensErradas === 0, 'contagens por grupo corretas (20 por grupo não-método, 10 por método)');

const ids = new Set(CATALOGO_MODELOS.map((f) => f.id));
esperar(ids.size === CATALOGO_MODELOS.length, `IDs de ficha únicos (${ids.size} de ${CATALOGO_MODELOS.length})`);

const gruposEsperados = [
  ...CATEGORIAS_ORDEM.map((c) => 'categoria::' + c),
  ...['Hipertrofia', 'Força', 'Gestão do peso e composição corporal', 'Resistência muscular', 'Capacidade cardiorrespiratória', 'Mobilidade e flexibilidade', 'Potência e desempenho', 'Saúde e autonomia funcional'].map((o) => 'objetivo::' + o),
  ...['Iniciante', 'Intermédio', 'Avançado', 'Especialista'].map((e) => 'experiencia::' + e),
  ...['Baixo', 'Moderado', 'Bom', 'Elevado'].map((c) => 'condicionamento::' + c),
  ...METODOS_ORDEM.map((m) => 'metodo::' + m),
];
const faltamGrupos = gruposEsperados.filter((g) => !grupos.has(g));
esperar(faltamGrupos.length === 0, `todos os 56 grupos esperados presentes (faltam: ${faltamGrupos.join(', ') || 'nenhum'})`);

// A taxonomia dos seletores (modelos-treino-textos.ts) coincide com o que as fichas usam.
{
  const T = await import('../../src/data/modelos-treino-textos.ts');
  const iguais = (lista, campo, filtroColecao) => {
    const usados = new Set(CATALOGO_MODELOS.filter((f) => !filtroColecao || f.colecao === filtroColecao).map((f) => f[campo]));
    return usados.size === lista.length && lista.every((x) => usados.has(x));
  };
  esperar(iguais(T.CATEGORIAS_MODELOS, 'categoria', 'categoria'), 'taxonomia: 14 categorias coincidem');
  esperar(iguais(T.OBJETIVOS_MODELOS, 'chaveColecao', 'objetivo'), 'taxonomia: 8 objetivos coincidem');
  esperar(iguais(T.EXPERIENCIAS_MODELOS, 'chaveColecao', 'experiencia'), 'taxonomia: 4 experiências coincidem');
  esperar(iguais(T.CONDICIONAMENTOS_MODELOS, 'chaveColecao', 'condicionamento'), 'taxonomia: 4 condicionamentos coincidem');
  esperar(iguais(T.METODOS_MODELOS, 'chaveColecao', 'metodo'), 'taxonomia: 26 métodos coincidem');
  const usadasEmQualquer = (campo, lista) => CATALOGO_MODELOS.every((f) => lista.includes(f[campo]));
  esperar(usadasEmQualquer('categoria', T.CATEGORIAS_MODELOS) && usadasEmQualquer('objetivo', T.OBJETIVOS_MODELOS)
    && usadasEmQualquer('experiencia', T.EXPERIENCIAS_MODELOS) && usadasEmQualquer('condicionamento', T.CONDICIONAMENTOS_MODELOS),
  'nenhuma ficha usa um valor fora da taxonomia');
}

// Referências de exercício: todo exercicioId vem do mapa de resolução, e todo
// o id novo tem a sua entrada em EXERCICIOS_MODELOS.
const idsValidos = new Set(Object.values(mapaExercicios).map((v) => v.id));
let refsInvalidas = 0;
CATALOGO_MODELOS.forEach((f) => f.treinos.forEach((t) => t.exercicios.forEach((ex) => {
  if (!idsValidos.has(ex.exercicioId)) { refsInvalidas += 1; console.error(`  referência inválida: ${ex.exercicioId} em ${f.id}`); }
})));
esperar(refsInvalidas === 0, 'todas as referências de exercício são válidas');

const idsNovos = new Set(EXERCICIOS_MODELOS.map((e) => 'e:' + e.nome));
const novosDoMapa = Object.values(mapaExercicios).filter((v) => v.novo).map((v) => v.id);
esperar(novosDoMapa.length === EXERCICIOS_MODELOS.length && novosDoMapa.every((id) => idsNovos.has(id)), `${EXERCICIOS_MODELOS.length} exercícios novos coincidem com o mapa de resolução`);
esperar(Object.keys(INSTRUCOES_MODELOS).length === 95 && Object.keys(REGRESSOES_MODELOS).length === 95, 'instrução e regressão para os 95 exercícios');

// Campos obrigatórios.
const CAMPOS_OBRIGATORIOS = ['id', 'nome', 'colecao', 'chaveColecao', 'numeroNaColecao', 'categoria', 'objetivo', 'experiencia', 'condicionamento', 'metodoPrincipal', 'equipamento', 'duracaoEstimadaMinutos', 'treinos'];
let camposFaltam = 0;
CATALOGO_MODELOS.forEach((f) => CAMPOS_OBRIGATORIOS.forEach((c) => {
  if (f[c] === undefined || f[c] === null) { camposFaltam += 1; console.error(`  campo em falta: ${c} em ${f.id}`); }
}));
esperar(camposFaltam === 0, 'campos obrigatórios presentes em todas as fichas');

// Forma de cada treino/exercício/linha compatível com a app.
let formaInvalida = 0;
CATALOGO_MODELOS.forEach((f) => f.treinos.forEach((t) => {
  if (!t.id || !t.nome || !Array.isArray(t.exercicios) || typeof t.grupos !== 'object') formaInvalida += 1;
  t.exercicios.forEach((ex) => {
    if (!ex.id || !ex.exercicioId || !ex.nome || !Array.isArray(ex.linhas) || ex.linhas.length === 0) { formaInvalida += 1; return; }
    if (!['Aquecimento', 'Principal', 'Volta à calma'].includes(ex.bloco)) formaInvalida += 1;
    if (ex.lateralidade !== undefined || ex._timed !== undefined || ex._cronometro !== undefined) formaInvalida += 1; // internos do gerador
    if (ex.grupo && !t.grupos[ex.grupo]) formaInvalida += 1;
    ex.linhas.forEach((l) => { if (!l.id || !l.tipo) formaInvalida += 1; if (l.notas !== undefined) formaInvalida += 1; });
  });
}));
esperar(formaInvalida === 0, 'treinos, exercícios e linhas com a forma da aplicação (sem campos internos)');

// Sem duração/reps ambíguas: uma linha não tem repetições numéricas E tempo ao mesmo tempo.
let ambiguas = 0;
CATALOGO_MODELOS.forEach((f) => f.treinos.forEach((t) => t.exercicios.forEach((ex) => ex.linhas.forEach((l) => {
  if (l.tempo && /^\d+$/.test(String(l.reps || '').trim())) ambiguas += 1;
}))));
esperar(ambiguas === 0, 'nenhuma linha mistura repetições e tempo');

// Aritmética de blocos temporizados (secção 30.3).
function primeira(metodo, n = 1) { return CATALOGO_MODELOS.find((f) => f.colecao === 'metodo' && f.chaveColecao === metodo && f.numeroNaColecao === n); }
esperar(primeira('EMOM').cronometroSegundos === 720, 'EMOM: 3×4×60=720 s');
esperar(primeira('Tabata', 1).cronometroSegundos === 240, 'Tabata (v=0): 8×(20+10)=240 s');
esperar(primeira('Tabata', 6).cronometroSegundos === 660, 'Tabata (v=5): 2×240 + 180 s de recuperação = 660 s');
esperar(primeira('AMRAP').cronometroSegundos === 600, 'AMRAP: 600 s');
esperar(primeira('For time').cronometroSegundos === 900, 'For time: teto 900 s');
esperar(primeira('Personalizado...').cronometroSegundos === 600, 'Personalizado: 5×(60+60)=600 s');
esperar(primeira('Intervalado', 1).cronometroSegundos === 960, 'Intervalado (v=0): 8×(45+75)=960 s');
esperar(primeira('Intervalado', 6).cronometroSegundos === 1200, 'Intervalado (v=5): 10×(60+60)=1200 s');

// Regras corrigidas depois da primeira leitura (secções 14.1, 14.4, 14.5, 13.7, 16.7, 16.2).
const nomeDe = (f, bloco) => f.treinos[0].exercicios.filter((e) => e.bloco === bloco).map((e) => e.nome);
const aero = CATALOGO_MODELOS.find((f) => f.colecao === 'categoria' && f.chaveColecao === 'Aeróbico' && f.numeroNaColecao === 3);
esperar(nomeDe(aero, 'Aquecimento').length === 1 && aero.treinos[0].exercicios[0].linhas[0].tempo === '180 s', 'Aeróbico: aquecimento é o próprio exercício, 180 s (15.1)');

const power = CATALOGO_MODELOS.find((f) => f.colecao === 'categoria' && f.chaveColecao === 'Powerlifting' && f.numeroNaColecao === 1); // L=1 -> 5 reps no agachamento
// (o primeiro "Agachamento com barra" do bloco é a preparação específica; o de trabalho é o seguinte)
const agach = power.treinos[0].exercicios.find((e) => e.bloco === 'Principal' && e.nome === 'Agachamento com barra' && e.metodo !== 'Série de aproximação');
esperar(agach && agach.linhas.length === 3 && agach.linhas.every((l) => l.reps === '5' && l.descanso === '180'), 'Powerlifting L1: agachamento com barra 3×5, 180 s (14.5)');

const olim = CATALOGO_MODELOS.find((f) => f.colecao === 'categoria' && f.chaveColecao === 'Levantamento olímpico' && f.numeroNaColecao === 1);
const principaisOlim = olim.treinos[0].exercicios.filter((e) => e.bloco === 'Principal');
esperar(principaisOlim[0].linhas.length === 4 && principaisOlim[0].linhas[0].reps === '3' && principaisOlim[2].linhas.length === 2 && principaisOlim[2].linhas[0].reps === '6', 'Olímpico: 4×3 nos dois primeiros, 2×6 nos restantes (14.4)');

const baixoAero = CATALOGO_MODELOS.find((f) => f.colecao === 'categoria' && f.chaveColecao === 'Aeróbico' && f.numeroNaColecao === 2); // v=1, L0 (Baixo), intervalos
esperar(baixoAero.treinos[0].exercicios.find((e) => e.bloco === 'Principal').linhas.length === 6, 'Baixo não corta os intervalos do Aeróbico (modo temporizado, 16.7)');

const baixoMusc = CATALOGO_MODELOS.find((f) => f.colecao === 'categoria' && f.chaveColecao === 'Musculação' && f.numeroNaColecao === 1);
const seqBaixo = baixoMusc.treinos[0].exercicios.filter((e) => e.bloco === 'Principal' && e.metodo !== 'Série de aproximação');
esperar(seqBaixo.every((e) => e.linhas.length <= 2 && e.linhas.every((l) => !l.rir || (Number(l.rir) >= 4 && Number(l.descanso) >= 90))), 'Baixo em Musculação: ≤2 séries, RIR ≥4, descanso ≥90 s (16.7)');

const falha = CATALOGO_MODELOS.find((f) => f.colecao === 'metodo' && f.chaveColecao === 'Até à falha' && f.numeroNaColecao === 1);
esperar(falha.treinos[0].exercicios.find((e) => e.metodo === 'Até à falha').linhas[1].rir === '0', 'Até à falha: a última série tem RIR 0');

// Distintos principais no catálogo (informativo: expectativa histórica 702 distintos / 158 repetidos).
function assinaturaPrincipal(f) {
  return f.treinos[0].exercicios
    .filter((e) => e.bloco === 'Principal')
    .map((e) => [e.exercicioId, e.metodo, JSON.stringify(e.metodoParams), e.linhas.map((l) => `${l.tipo}:${l.reps}:${l.carga}:${l.tempo || ''}:${l.descanso}:${l.rpe}:${l.rir || ''}`).join(',')].join('~'))
    .join('|');
}
let duplicadosDentroDoGrupo = 0;
grupos.forEach((_, chave) => {
  const [colecao, chaveColecao] = chave.split('::');
  const assinaturas = new Set();
  CATALOGO_MODELOS.filter((f) => f.colecao === colecao && f.chaveColecao === chaveColecao).forEach((f) => {
    const a = assinaturaPrincipal(f);
    if (assinaturas.has(a)) duplicadosDentroDoGrupo += 1;
    assinaturas.add(a);
  });
});
esperar(duplicadosDentroDoGrupo === 0, 'nenhuma duplicação exata do principal dentro do mesmo grupo');
const assinaturasGlobais = new Set(CATALOGO_MODELOS.map(assinaturaPrincipal));
console.log(`(informativo) principais distintos no catálogo inteiro: ${assinaturasGlobais.size} (expectativa do documento: 702 distintos, 158 ocorrências adicionais)`);
console.log(`(informativo) fichas com aviso editorial: ${CATALOGO_MODELOS.filter((f) => f.avisosEditoriais).length}`);

console.log(falhas === 0 ? '\nTODAS AS VALIDAÇÕES PASSARAM' : `\n${falhas} VALIDAÇÃO(ÕES) FALHARAM`);
process.exit(falhas === 0 ? 0 : 1);
