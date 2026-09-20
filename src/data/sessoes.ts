/*
 * Treino realizado: o registo do que aconteceu numa sessão, feito pelo
 * treinador. Funções puras -- sem React nem Supabase -- para se poderem testar
 * sozinhas (scripts/validar-sessoes.mjs). Onde vive e porquê: CLAUDE.md,
 * secção 4.
 *
 * Uma linha por aluno na base de dados, `execucoes:<idDoAluno>`, com
 * `{ sessoes: [...] }`. Nunca dentro de `treinos`: o registo cresce sem fim e
 * cada gravação reescreve o bloco inteiro.
 */

export const PREFIXO_CHAVE_EXECUCOES = 'execucoes:';
// O `check` de `data_key` (supabase-schema.sql) só aceita letras, números, «_» e
// «-», até 64. Os ids que a aplicação gera já cabem; um id vindo de um backup
// antigo com outro carácter faria a gravação falhar com um erro que ninguém
// perceberia.
export function chaveExecucoes(idAluno) {
  return PREFIXO_CHAVE_EXECUCOES + String(idAluno).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64);
}

// Os campos que uma série realizada pode levar: os da prescrição (CAMPO_SERIE
// em TreinoAtoms, sem a cadência nem a % de 1RM, que só existem para prescrever)
// mais o esforço observado.
export const CAMPOS_REALIZADOS = [
  'reps', 'carga', 'tempo', 'duracao', 'distancia', 'velocidade', 'ritmo', 'potencia', 'inclinacao', 'rir', 'rpe',
];

const ESTADOS_ITEM = ['feito', 'parcial', 'saltado'];
const ESTADOS_SESSAO = ['concluida', 'interrompida'];

function texto(valor, max) { return String(valor == null ? '' : valor).slice(0, max); }

/* ============================== normalização ============================== */

export function normalizarSerieRealizada(s) {
  const bruto = (s && s.v && typeof s.v === 'object') ? s.v : {};
  const v = {};
  CAMPOS_REALIZADOS.forEach((k) => {
    const t = texto(bruto[k], 24).trim();
    if (t) v[k] = t;
  });
  // `c` diz que campos a série mostra ao editar; tudo o que tem valor entra.
  const declarados = Array.isArray(s && s.c) ? s.c.filter((k) => CAMPOS_REALIZADOS.includes(k)) : [];
  const c = Array.from(new Set([...declarados, ...Object.keys(v)]));
  return {
    linhaId: texto(s && s.linhaId, 40),
    prescrito: texto(s && s.prescrito, 160),
    c,
    v,
    feito: Boolean(s && s.feito),
  };
}

// Um exercício sem uma única série feita foi saltado, não "feito a zeros".
export function estadoDoItem({ series, saltado }) {
  if (saltado) return 'saltado';
  const feitas = series.filter((x) => x.feito).length;
  if (feitas === 0) return 'saltado';
  return feitas === series.length ? 'feito' : 'parcial';
}

export function normalizarItemRealizado(it) {
  const series = (Array.isArray(it && it.series) ? it.series : []).map(normalizarSerieRealizada);
  const estadoGuardado = it && ESTADOS_ITEM.includes(it.estado) ? it.estado : null;
  return {
    exercicioId: texto(it && it.exercicioId, 80),
    nome: texto(it && it.nome, 120),
    bloco: texto(it && it.bloco, 30),
    grupo: texto(it && it.grupo, 40),
    metodo: texto(it && it.metodo, 40),
    estado: estadoGuardado || estadoDoItem({ series, saltado: false }),
    notas: texto(it && it.notas, 500),
    series,
  };
}

function normalizarOrigem(o) {
  if (!o || typeof o !== 'object') return null;
  const saida = {};
  ['ficha', 'catalogo', 'modelo'].forEach((k) => { if (o[k]) saida[k] = texto(o[k], 80); });
  return Object.keys(saida).length ? saida : null;
}

export function normalizarSessaoRealizada(s) {
  const bruto = s || {};
  const duracao = Number(String(bruto.duracaoMin == null ? '' : bruto.duracaoMin).replace(',', '.'));
  const esforco = Number(bruto.esforco);
  const sintomas = bruto.sintomas && typeof bruto.sintomas === 'object' ? bruto.sintomas : {};
  return {
    id: texto(bruto.id, 60),
    data: /^\d{4}-\d{2}-\d{2}$/.test(bruto.data) ? bruto.data : '',
    inicio: /^\d{2}:\d{2}$/.test(bruto.inicio) ? bruto.inicio : '',
    duracaoMin: Number.isFinite(duracao) && duracao > 0 ? Math.round(duracao) : null,
    prescricaoId: texto(bruto.prescricaoId, 60),
    prescricaoNome: texto(bruto.prescricaoNome, 120),
    treinoId: texto(bruto.treinoId, 60),
    treinoNome: texto(bruto.treinoNome, 60),
    origem: normalizarOrigem(bruto.origem),
    estado: ESTADOS_SESSAO.includes(bruto.estado) ? bruto.estado : 'concluida',
    motivoInterrupcao: texto(bruto.motivoInterrupcao, 300),
    esforco: bruto.esforco !== '' && bruto.esforco != null && Number.isInteger(esforco) && esforco >= 0 && esforco <= 10 ? String(esforco) : '',
    sintomas: { durante: texto(sintomas.durante, 1000), depois: texto(sintomas.depois, 1000) },
    notas: texto(bruto.notas, 2000),
    itens: (Array.isArray(bruto.itens) ? bruto.itens : []).map(normalizarItemRealizado),
    criadoEm: texto(bruto.criadoEm, 40),
    editadoEm: texto(bruto.editadoEm, 40),
  };
}

// Aceita o que veio da base de dados: nada, um objeto, ou (por defesa) uma lista.
export function normalizarExecucoes(raw) {
  const lista = Array.isArray(raw && raw.sessoes) ? raw.sessoes : (Array.isArray(raw) ? raw : []);
  return { sessoes: lista.filter((s) => s && s.id).map(normalizarSessaoRealizada) };
}

/* ============================== leitura do registo ============================== */

export function resumoDaSessao(s) {
  const r = { series: 0, feitas: 0, exercicios: s.itens.length, feitos: 0, saltados: 0 };
  s.itens.forEach((it) => {
    r.series += it.series.length;
    r.feitas += it.series.filter((x) => x.feito).length;
    if (it.estado === 'feito') r.feitos += 1;
    if (it.estado === 'saltado') r.saltados += 1;
  });
  return r;
}

export function temSintomas(s) {
  return Boolean(s.sintomas && (s.sintomas.durante.trim() || s.sintomas.depois.trim()));
}

// Mais recentes primeiro: pela data da sessão, depois pela hora, depois pelo
// momento em que foi registada.
export function ordenarSessoes(lista) {
  return [...lista].sort((a, b) => (b.data || '').localeCompare(a.data || '')
    || (b.inicio || '').localeCompare(a.inicio || '')
    || (b.criadoEm || '').localeCompare(a.criadoEm || ''));
}

const UNIDADE = {
  carga: ' kg', tempo: ' s', duracao: ' min', distancia: ' m', velocidade: ' km/h', potencia: ' W', inclinacao: '%',
};
const SO_NUMERO = /^\d+(?:[.,]\d+)?$/;

// "22" vira "22 kg", mas "22 kg" e "BW" ficam como foram escritos: quem
// registou à pressa escreve só o número.
function comUnidade(campo, valor) {
  return UNIDADE[campo] && SO_NUMERO.test(valor) ? valor + UNIDADE[campo] : valor;
}

// Uma série realizada numa frase: "10 × 22 kg · RIR 3".
export function textoSerieRealizada(serie) {
  const v = serie.v || {};
  const partes = [];
  if (v.reps && v.carga) partes.push(`${v.reps} × ${comUnidade('carga', v.carga)}`);
  else if (v.reps) partes.push(v.reps);
  else if (v.carga) partes.push(comUnidade('carga', v.carga));
  ['tempo', 'duracao', 'distancia', 'velocidade', 'ritmo', 'potencia', 'inclinacao'].forEach((k) => {
    if (v[k]) partes.push(comUnidade(k, v[k]));
  });
  if (v.rir) partes.push(`RIR ${v.rir}`);
  if (v.rpe) partes.push(`RPE ${v.rpe}`);
  return partes.join(' · ');
}

// O que se fez da última vez, para o treinador ter à frente quando regista a
// seguinte. Ignora séries por fazer e sessões sem esse exercício.
export function ultimaVezDoExercicio(sessoes, exercicioId, ignorarSessaoId) {
  if (!exercicioId) return null;
  const ordenadas = ordenarSessoes(sessoes);
  for (let i = 0; i < ordenadas.length; i += 1) {
    const s = ordenadas[i];
    if (ignorarSessaoId && s.id === ignorarSessaoId) continue;
    const item = s.itens.find((it) => it.exercicioId === exercicioId);
    if (!item) continue;
    const feitas = item.series.filter((x) => x.feito).map(textoSerieRealizada).filter(Boolean);
    if (feitas.length) return { data: s.data, series: feitas };
  }
  return null;
}

/* ============================== registar ============================== */

// Que campos pede a série. Os da prescrição, menos os que só servem para
// prescrever (cadência, % de 1RM -- de que se regista a carga em kg), e o
// esforço observado só quando a prescrição também o tinha.
export function camposRealizaveis(camposDoTipo, linha) {
  let base = camposDoTipo.filter((c) => c !== 'cadencia' && c !== 'percentagem1rm');
  if (camposDoTipo.includes('percentagem1rm') && !base.includes('carga')) base.push('carga');
  // Uma série só de tempo (respiração, prancha) não tem repetições: o tipo
  // «repetições e tempo» pede os dois, mas aqui só o tempo conta.
  const semReps = linha && !String(linha.reps || '').trim() && String(linha.tempo || '').trim();
  if (semReps && base.includes('reps') && base.includes('tempo')) base = base.filter((c) => c !== 'reps');
  const intensidade = linha && linha.rir !== undefined && linha.rir !== '' && linha.rir !== null
    ? 'rir'
    : (linha && linha.rpe ? 'rpe' : null);
  return intensidade ? [...base, intensidade] : base;
}

// O que a prescrição sugere para cada campo, para se confirmar com um toque.
// Só o que é um valor certo: uma faixa ("8-10") ou uma percentagem não são o
// que se fez.
export function valoresSugeridos(linha, campos) {
  const v = {};
  campos.forEach((c) => {
    const x = linha ? linha[c] : undefined;
    if (x === undefined || x === null || x === '') return;
    const t = String(x).trim();
    if (!/^\d+(?:[.,]\d+)?(?:\s*[a-zA-Z/]+)*$/.test(t)) return;
    v[c] = t;
  });
  return v;
}

// Do estado de um treino a meio (o que o treinador foi marcando) para os itens
// que se gravam. Nada se marca como feito sozinho: só as séries em que carregou
// em ✓ contam, e o que não tocou fica «saltado».
export function construirItens(treino, estadoItens, dep) {
  return (treino.exercicios || []).map((ex) => {
    const est = (estadoItens && estadoItens[ex.id]) || {};
    const saltado = Boolean(est.saltado);
    const series = (Array.isArray(ex.linhas) ? ex.linhas : []).map((linha) => {
      const s = (est.series && est.series[linha.id]) || {};
      return {
        linhaId: linha.id,
        prescrito: dep.descreverLinha(linha),
        c: camposRealizaveis(dep.camposDoTipo(linha), linha),
        v: s.v || {},
        feito: Boolean(s.feito) && !saltado,
      };
    });
    return {
      exercicioId: ex.exercicioId || '',
      nome: ex.nome || '',
      bloco: ex.bloco || '',
      grupo: ex.grupo || '',
      metodo: ex.metodo || '',
      estado: estadoDoItem({ series, saltado }),
      notas: est.notas || '',
      series,
    };
  });
}

/* ============================== corrigir uma sessão ============================== */

// Os campos de fecho de uma sessão como o formulário os edita: tudo texto.
export function fechoDaSessao(s) {
  return {
    data: s.data,
    duracaoMin: s.duracaoMin ? String(s.duracaoMin) : '',
    esforco: s.esforco,
    durante: s.sintomas.durante,
    depois: s.sintomas.depois,
    interrompida: s.estado === 'interrompida',
    motivo: s.motivoInterrupcao,
    notas: s.notas,
  };
}

// A sessão corrigida. O estado de cada exercício refaz-se a partir das séries:
// marcar uma série num exercício «não feito» faz dele «parcial», e desmarcar
// todas volta a fazê-lo «não feito». `id` e `criadoEm` nunca mudam.
export function sessaoCorrigida(s, fecho, itens, agoraISO) {
  return normalizarSessaoRealizada({
    ...s,
    data: fecho.data,
    duracaoMin: fecho.duracaoMin,
    esforco: fecho.esforco,
    sintomas: { durante: fecho.durante, depois: fecho.depois },
    estado: fecho.interrompida ? 'interrompida' : 'concluida',
    motivoInterrupcao: fecho.interrompida ? fecho.motivo : '',
    notas: fecho.notas,
    itens: itens.map((it) => ({ ...it, estado: estadoDoItem({ series: it.series, saltado: false }) })),
    id: s.id,
    criadoEm: s.criadoEm,
    editadoEm: agoraISO,
  });
}

// Tudo o que se pode procurar numa sessão (exercícios, sintomas, notas), para a
// ficha 360º. Não se mostra: só serve para a procura a encontrar.
export function textoDeBuscaDaSessao(s) {
  return [
    s.treinoNome, s.prescricaoNome, s.motivoInterrupcao, s.notas, s.sintomas.durante, s.sintomas.depois,
    ...s.itens.flatMap((it) => [it.nome, it.notas]),
  ].filter(Boolean).join(' ');
}

/* ============================== rascunho (neste aparelho) ============================== */

export const VERSAO_RASCUNHO = 1;
// Os rascunhos vivem só neste aparelho, mas levam o que o treinador escreveu
// sobre o aluno: saem com ele e no «Apagar todos os dados», por prefixo.
export const PREFIXO_RASCUNHO = 'ptmanager:sessao:';
export function chaveRascunho(idAluno, idTreino) { return `${PREFIXO_RASCUNHO}${idAluno}:${idTreino}`; }

export function normalizarRascunho(raw) {
  if (!raw || typeof raw !== 'object' || raw.v !== VERSAO_RASCUNHO || !raw.itens || typeof raw.itens !== 'object') return null;
  const inicioMs = Number(raw.inicioMs);
  return {
    v: VERSAO_RASCUNHO,
    inicioMs: Number.isFinite(inicioMs) && inicioMs > 0 ? inicioMs : Date.now(),
    passo: Number.isInteger(raw.passo) && raw.passo >= 0 ? raw.passo : 0,
    itens: raw.itens,
  };
}

export function lerRascunho(textoGuardado) {
  if (!textoGuardado) return null;
  try { return normalizarRascunho(JSON.parse(textoGuardado)); } catch (e) { return null; }
}

// Quantas séries já têm ✓ -- o que a pergunta «continuar?» diz ao treinador.
export function seriesFeitasDoRascunho(rascunho) {
  let n = 0;
  Object.values((rascunho && rascunho.itens) || {}).forEach((it) => {
    Object.values((it && it.series) || {}).forEach((s) => { if (s && s.feito) n += 1; });
  });
  return n;
}

// Há alguma coisa que valha a pena guardar/perguntar antes de sair?
export function rascunhoTemTrabalho(rascunho) {
  if (!rascunho) return false;
  if (seriesFeitasDoRascunho(rascunho) > 0) return true;
  return Object.values(rascunho.itens || {}).some((it) => it && (it.saltado || String(it.notas || '').trim()));
}

/* ============================== gravações ============================== */

// Serializa as tarefas de cada chave. Duas gravações seguidas da mesma chave
// no mesmo instante liam o mesmo carimbo de versão, e a segunda dava um falso
// «alterado noutro dispositivo».
export function criarFilaPorChave() {
  const caudas = new Map();
  return function enfileirar(chave, tarefa) {
    const anterior = caudas.get(chave) || Promise.resolve();
    const atual = anterior.then(() => tarefa());
    caudas.set(chave, atual.then(() => undefined, () => undefined));
    return atual;
  };
}

// Só se grava depois de o registo do aluno ter sido lido: sem essa leitura não
// há carimbo, a gravação segue por INSERT, e se já havia linha dá um conflito
// que não é conflito nenhum.
export function podeGravarExecucoes(estadoDoAluno) {
  return Boolean(estadoDoAluno && estadoDoAluno.estado === 'ok');
}
