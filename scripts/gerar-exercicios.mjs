/*
 * Gera src/data/exercicios.ts a partir de duas fontes:
 *
 *   1. scripts/exercicios-legado.json  — os 202 exercicios que a aplicacao ja
 *      tinha, em pt-PT. Ganham sempre, para nao mudar debaixo dos pes de quem
 *      ja os usa nos programas.
 *   2. o catalogo MFIT em JSONL, passado como argumento.
 *
 * O catalogo nao esta no repositorio de proposito: e material de terceiros e o
 * repositorio e publico. So o resultado traduzido e reduzido aos quatro campos
 * que a aplicacao usa e que fica versionado.
 *
 *   node scripts/gerar-exercicios.mjs "caminho/para/o/catalogo.md"
 */
import fs from 'fs';

const SRC = process.argv[2];
if (!SRC) {
  console.error('Falta o caminho do catalogo. Ver o cabecalho deste ficheiro.');
  process.exit(1);
}

/* ============================ taxonomia ============================ */

// Os 32 grupos tecnicos do catalogo tem redundancia: "Abdominais",
// "Core / abdomen" e "Core / controle motor" sao o mesmo separador para quem
// monta um treino. Reduzem-se aos 15 que a aplicacao ja usava, mais tres que
// o catalogo justifica (adutores, abdutores e pescoco).
const GRUPOS = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Antebraço',
  'Quadricípites', 'Isquiotibiais', 'Glúteos', 'Adutores', 'Abdutores', 'Gémeos',
  'Abdominais', 'Lombar', 'Pescoço', 'Corpo inteiro', 'Cardio', 'Mobilidade',
];

const MAPA_GRUPO = {
  'Peitoral': 'Peito',
  'Costas / dorsais': 'Costas',
  'Latíssimo do dorso': 'Costas',
  'Dorsal médio / romboides': 'Costas',
  'Trapézio': 'Costas',
  'Ombros': 'Ombros',
  'Bíceps': 'Bíceps',
  'Tríceps': 'Tríceps',
  'Antebraços': 'Antebraço',
  'Antebraços / punhos': 'Antebraço',
  'Quadríceps': 'Quadricípites',
  'Quadríceps / glúteos': 'Quadricípites',
  'Membros inferiores': 'Quadricípites',
  'Posteriores de coxa': 'Isquiotibiais',
  'Cadeia posterior / posteriores de coxa': 'Isquiotibiais',
  'Glúteos': 'Glúteos',
  'Adutores do quadril': 'Adutores',
  'Abdutores do quadril': 'Abdutores',
  'Abdutores / glúteo médio': 'Abdutores',
  'Panturrilhas': 'Gémeos',
  'Panturrilhas / tibial anterior': 'Gémeos',
  'Abdominais': 'Abdominais',
  'Core / abdômen': 'Abdominais',
  'Core / controle motor': 'Abdominais',
  'Lombar': 'Lombar',
  'Pescoço': 'Pescoço',
  'Pescoço / cervical': 'Pescoço',
  'Corpo inteiro / condicionamento': 'Corpo inteiro',
  'Cardiorrespiratório': 'Cardio',
  'Mobilidade geral': 'Mobilidade',
  'Mobilidade / postura': 'Mobilidade',
  'Flexibilidade geral': 'Mobilidade',
};

// "Força" e "Musculação" sao a mesma coisa: a divisao vem de o catalogo ter
// juntado duas fontes. "Cardio" e "Aeróbico" idem.
const CATEGORIAS = [
  'Musculação', 'Aeróbico', 'Funcional', 'Alongamento', 'Em casa',
  'Mobilidade', 'Elástico', 'Pilates', 'Laboral', 'Pliometria',
  'Levantamento olímpico', 'Powerlifting', 'Strongman', 'Reabilitação',
];

const MAPA_CATEGORIA = {
  'Força': 'Musculação',
  'Musculação': 'Musculação',
  'Aeróbico': 'Aeróbico',
  'Cardio': 'Aeróbico',
  'Funcional': 'Funcional',
  'Alongamento': 'Alongamento',
  'Em casa': 'Em casa',
  'Mobilidade': 'Mobilidade',
  'Elástico': 'Elástico',
  'MAT Pilates': 'Pilates',
  'Laboral': 'Laboral',
  'Pliometria': 'Pliometria',
  'Levantamento olímpico': 'Levantamento olímpico',
  'Powerlifting': 'Powerlifting',
  'Strongman': 'Strongman',
};

// Alinhado com os termos que a aplicacao ja usava ("Peso corporal", "Polia",
// "Passadeira"). Vazio quando o catalogo nao sabe: a interface esconde-o.
const MAPA_EQUIPAMENTO = {
  'Anilha': 'Anilha',
  'Banco': 'Banco',
  'Barra': 'Barra',
  'Barra fixa': 'Barra fixa',
  'Barra W / EZ': 'Barra W',
  'Bicicleta / bike': 'Bicicleta',
  'Bola medicinal': 'Bola medicinal',
  'Bola suíça': 'Bola suíça',
  'BOSU': 'BOSU',
  'Cadeira / banco': 'Cadeira',
  'Corda': 'Corda',
  'Corda naval': 'Corda naval',
  'Elástico / faixa': 'Elástico',
  'Elíptico': 'Elíptica',
  'Esteira': 'Passadeira',
  'Halteres': 'Halteres',
  'Kettlebell': 'Kettlebell',
  'Máquina': 'Máquina',
  'Mochila': 'Mochila',
  'Peso do corpo': 'Peso corporal',
  'Peso do corpo / acessório de Pilates': 'Peso corporal',
  'Peso do corpo / acessório simples': 'Peso corporal',
  'Peso do corpo / equipamento funcional': 'Peso corporal',
  'Polia / cabo': 'Polia',
  'Rolo de liberação miofascial': 'Rolo',
  'Smith': 'Smith',
  'Step / caixa': 'Step',
  'TRX / suspensão': 'TRX',
  'Não identificado pelo nome': '',
  'Não informado': '',
  'Outro': '',
};

/* ======================= limpeza dos nomes ======================= */

// O catalogo e do Brasil. Estes sao os termos que mudam mesmo de palavra em
// Portugal, mais os erros de escrita que a fonte traz.
//
// Cada entrada e [padrao, substituto] e o padrao e envolvido em fronteiras de
// palavra proprias. As de \b nao servem: sao ASCII, e "sumo" nao casa em
// "sumô" nem "agual" em "águal" porque o acento nao conta como letra.
const LETRA = '0-9A-Za-zÀ-ÿ';
function palavra(padrao) {
  return new RegExp('(?<![' + LETRA + '])(?:' + padrao + ')(?![' + LETRA + '])', 'gi');
}

const SUBSTITUICOES = [
  // termos que sao mesmo outra palavra em Portugal
  ['panturrilhas?', 'gémeos'],
  ['esteira', 'passadeira'],
  ['quadr[ií]ceps', 'quadricípites'],
  ['posteriores? de coxa', 'isquiotibiais'],
  ['abd[oô]m[eê]n', 'abdómen'],
  ['gastrocn[êe]mio', 'gastrocnémio'],
  ['caneleiras', 'tornozeleiras'],
  ['caneleira', 'tornozeleira'],
  ['sum[oô]', 'sumo'],
  ['suic[ií]dio', 'vaivém'],
  ['trote', 'corrida lenta'],
  ['infra', 'inferior'],
  ['supra', 'superior'],
  // erros de escrita da fonte
  ['pancha', 'prancha'],
  ['glutos', 'glúteos'],
  ['[aá]gual', 'água'],
  ['obl[ií]qui?o', 'oblíquo'],
  ['sui[cç]a', 'suíça'],
  ['triceps', 'tríceps'],
  ['biceps', 'bíceps'],
  ['gluteos', 'glúteos'],
  ['tor[aá]rica|toracia|toracica', 'torácica'],
  ['depressao', 'depressão'],
  ['retracao', 'retração'],
  ['rotacao', 'rotação'],
  ['eleva[cç][aã]o', 'elevação'],
  ['simultanea', 'simultânea'],
  ['bulgaro', 'búlgaro'],
  ['isometrica', 'isométrica'],
  ['isometrico', 'isométrico'],
  ['dinamica', 'dinâmica'],
  ['unileral', 'unilateral'],
  ['eliptico', 'elíptico'],
  ['hiperextensao', 'hiperextensão'],
  ['extensao', 'extensão'],
  ['flexao', 'flexão'],
  ['abducao', 'abdução'],
  ['aducao', 'adução'],
  ['faixa el[aá]stico', 'faixa elástica'],
].map(([p, s]) => [palavra(p), s]);

// Nomes que ficam como estao: marcas, apelidos e o repertorio de Pilates, que
// e conhecido em ingles ate em Portugal.
const PROTEGIDAS = new Set([
  'TRX', 'BOSU', 'EZ', 'JM', 'MAT', 'SMR', 'Smith', 'Scott', 'Arnold', 'Zottman',
  'Pilates', 'Jefferson', 'Zercher', 'Pallof', 'Svend', 'Tate', 'Cuban',
  'Bradford', 'Rocky', 'Gironda', 'Janda', 'Otis', 'Turkish', 'Fitball',
]);
// Hack, sissy, pistol, goblet e landmine sao nomes de movimento, nao de gente:
// ficam em minusculas, como os 202 que a aplicacao ja escrevia assim.

const MARCAS_INGLESAS = new Set([
  'the', 'of', 'with', 'and', 'on', 'in', 'to', 'for', 'up', 'down', 'back',
  'front', 'side', 'one', 'two', 'single', 'double', 'leg', 'arm', 'ball',
  'roll', 'plank', 'press', 'curl', 'bridge', 'kick', 'over', 'out', 'push',
  'pull', 'snatch', 'clean', 'jerk', 'squat', 'deadlift', 'swing', 'balance',
  'hundred', 'teaser', 'saw', 'seal', 'crab', 'boomerang', 'rocking', 'jump',
  'scissors', 'bicycle', 'swan', 'dive', 'stretch', 'twist', 'bend', 'knife',
  'jack', 'cross', 'bike', 'spinning', 'muscle', 'body', 'wind', 'sprints',
  'stairmaster', 'mill', 'step', 'shuffle', 'hops', 'hop', 'crawl', 'drill',
]);

const LIGACOES_PT = new Set([
  'de', 'do', 'da', 'dos', 'das', 'com', 'sem', 'em', 'na', 'no', 'nas', 'nos',
  'para', 'ao', 'aos', 'pelo', 'pela', 'entre', 'sobre', 'até', 'e',
]);

// Uma parte do catalogo e repertorio de Pilates e halterofilismo, conhecido em
// ingles ate em Portugal. Esses nomes ficam como estao. So conta como ingles o
// que nao tem acentos nem ligacoes portuguesas e cuja maioria das palavras e
// reconhecidamente inglesa -- "Abdominal Infra Bike" tem uma so, e e portugues.
function pareceIngles(nome) {
  if (/[áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]/.test(nome)) return false;
  const palavras = nome.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (palavras.length < 2) return false;
  if (palavras.some((p) => LIGACOES_PT.has(p))) return false;
  const inglesas = palavras.filter((p) => MARCAS_INGLESAS.has(p)).length;
  return inglesas * 2 >= palavras.length;
}

function nucleo(token) {
  return token.replace(/[^0-9A-Za-zÀ-ÿ]/g, '');
}

function protegida(token) {
  const c = nucleo(token);
  if (!c) return true;
  if (PROTEGIDAS.has(c)) return true;
  if (/^[IVX]+$/.test(c)) return true;              // numerais romanos: I, II, IX
  if (/^[A-Z]$/.test(c)) return true;               // barra W, barra H, treino A
  if (c.length >= 2 && c === c.toUpperCase() && /[A-Z]/.test(c)) return true;
  return false;
}

// O catalogo escreve Tudo Assim; os 202 que a aplicacao ja tinha estao em
// minusculas. Uniformiza, sem tocar nos nomes ingleses.
function caixaDeFrase(nome) {
  if (pareceIngles(nome)) return nome;
  const tokens = nome.split(' ').map((t, i) => (i === 0 || protegida(t) ? t : t.toLowerCase()));
  const junto = tokens.join(' ');
  return junto.charAt(0).toUpperCase() + junto.slice(1);
}

function limparNome(bruto) {
  let n = String(bruto).replace(/\s+/g, ' ').trim();
  // Espacos a mais dentro de parenteses: "( Grip Neutral )".
  n = n.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
  // Sempre, mesmo nos nomes ingleses: sao todas palavras portuguesas, nenhuma
  // colide com ingles, e "Panturrilha no Leg Press" precisa da traducao.
  SUBSTITUICOES.forEach(([re, por]) => { n = n.replace(re, por); });
  return caixaDeFrase(n);
}

// O id vem do nome, e nao de um contador: assim e estavel entre versoes e as
// prescricoes ja gravadas continuam a apontar para o exercicio certo.
function slug(nome) {
  return 'e-' + String(nome)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* ============================ montagem ============================ */

const raw = fs.readFileSync(SRC, 'utf8');

function dicionario(marcador) {
  const i = raw.indexOf(marcador);
  const inicio = raw.indexOf('{"', i);
  return JSON.parse(raw.slice(inicio, raw.indexOf('\n', inicio)).trim());
}
const DIC_CAT = dicionario('Dicionário de categorias');
const DIC_GRP = dicionario('Dicionário de grupos');
const DIC_EQP = dicionario('Dicionário de equipamentos');

const legado = fs.readFileSync('scripts/exercicios-legado.json', 'utf8')
  .split('\n').filter(Boolean).map((l) => JSON.parse(l));

const porId = new Map();
const nomesLegado = [];
const avisos = [];

// A chave de desduplicacao e o slug, que ignora acentos e pontuacao: assim
// "Rosca direta (barra W)" e "Rosca Direta Barra W" contam como um so. O id
// que a aplicacao usa e outro -- o proprio nome -- e esta em painel-pt.tsx.
function acrescentar(nome, grupo, categoria, equipamento, ehLegado) {
  const id = slug(nome);
  if (porId.has(id)) return false;
  if (!GRUPOS.includes(grupo)) { avisos.push('grupo desconhecido: ' + grupo + ' (' + nome + ')'); return false; }
  if (!CATEGORIAS.includes(categoria)) { avisos.push('categoria desconhecida: ' + categoria + ' (' + nome + ')'); return false; }
  porId.set(id, [nome, GRUPOS.indexOf(grupo), CATEGORIAS.indexOf(categoria), equipamento || '']);
  if (ehLegado) nomesLegado.push(nome);
  return true;
}

// 1. o que a aplicacao ja tinha, tal e qual
legado.forEach(([nome, grupo, categoria, equipamento]) => {
  acrescentar(nome, grupo, categoria, equipamento, true);
});
const depoisDoLegado = porId.size;

// 2. o catalogo, so o que ainda nao existe
let repetidos = 0;
const linhas = raw.split('\n').filter((l) => l.startsWith('["')).map((l) => JSON.parse(l));
linhas.forEach((r) => {
  const nome = limparNome(r[1]);
  const grupo = MAPA_GRUPO[DIC_GRP[r[5]].pt];
  const categoria = MAPA_CATEGORIA[DIC_CAT[r[4]].pt];
  const equipamento = MAPA_EQUIPAMENTO[DIC_EQP[r[8]].pt];
  if (grupo === undefined) { avisos.push('grupo do catalogo sem mapa: ' + DIC_GRP[r[5]].pt); return; }
  if (categoria === undefined) { avisos.push('categoria do catalogo sem mapa: ' + DIC_CAT[r[4]].pt); return; }
  if (equipamento === undefined) { avisos.push('equipamento sem mapa: ' + DIC_EQP[r[8]].pt); return; }
  if (!acrescentar(nome, grupo, categoria, equipamento, false)) repetidos += 1;
});

const colador = new Intl.Collator('pt-PT', { sensitivity: 'base' });
const todos = [...porId.entries()].sort((a, b) => colador.compare(a[1][0], b[1][0]));

/* ============================= saida ============================= */

const linhasTs = todos.map(([, v]) => JSON.stringify(v)).join(',\n');
const ficheiro = `/* eslint-disable */
/*
 * GERADO por scripts/gerar-exercicios.mjs. Nao editar a mao -- volte a correr
 * o script. A fonte e o catalogo MFIT, que nao esta no repositorio.
 *
 * Cada linha e [nome, indiceDoGrupo, indiceDaCategoria, equipamento]. Os
 * indices poupam cerca de ${Math.round((todos.length * 30) / 1024)} kB e garantem que nenhum exercicio
 * entra com um grupo ou categoria que nao existe nas listas abaixo.
 */

export const GRUPOS_BASE = ${JSON.stringify(GRUPOS, null, 2)};

export const CATEGORIAS_BASE = ${JSON.stringify(CATEGORIAS, null, 2)};

export const EXERCICIOS_BASE: [string, number, number, string][] = [
${linhasTs},
];

/*
 * Os que existiam antes de o catalogo entrar. So a migracao os usa: para saber
 * que um exercicio de origem ausente da biblioteca gravada foi apagado de
 * proposito, e nao apenas acrescentado agora.
 */
export const NOMES_LEGADO = ${JSON.stringify(nomesLegado, null, 0).replace(/","/g, '",\n  "').replace(/^\[/, '[\n  ').replace(/\]$/, ',\n]')};
`;

fs.writeFileSync('src/data/exercicios.ts', ficheiro, 'utf8');

console.log('legado:            ', depoisDoLegado);
console.log('catalogo lido:     ', linhas.length);
console.log('repetidos ignorados:', repetidos);
console.log('TOTAL:             ', todos.length);
console.log('ficheiro:          ', (ficheiro.length / 1024).toFixed(1), 'kB');
if (avisos.length) {
  console.log('\nAVISOS (' + avisos.length + '):');
  [...new Set(avisos)].slice(0, 20).forEach((a) => console.log(' -', a));
}
