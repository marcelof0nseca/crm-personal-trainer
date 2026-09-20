/*
 * Confere a logica pura do treino realizado (src/data/sessoes.ts): a
 * normalizacao do que vem da base de dados, o texto das series, a "ultima
 * vez", os campos que cada tipo de serie pede, o rascunho e a fila de
 * gravacoes -- esta contra um armazenamento falso com o mesmo carimbo de
 * versao do real (writeStoredValue em painel-pt.tsx).
 *
 * Uso: node scripts/validar-sessoes.mjs
 */
import * as S from '../src/data/sessoes.ts';

let falhas = 0;
function esperar(condicao, mensagem) {
  if (condicao) console.log('ok: ' + mensagem);
  else { falhas += 1; console.log('FALHA: ' + mensagem); }
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------- normalização ----------
esperar(igual(S.normalizarExecucoes(null), { sessoes: [] }), 'null vira registo vazio');
esperar(igual(S.normalizarExecucoes({ sessoes: 'x' }), { sessoes: [] }), 'lixo em `sessoes` vira registo vazio');
esperar(S.normalizarExecucoes({ sessoes: [{ nome: 'sem id' }, { id: 'a' }] }).sessoes.length === 1, 'uma sessão sem id é descartada');
esperar(S.normalizarExecucoes([{ id: 'a' }]).sessoes.length === 1, 'uma lista solta (formato defensivo) também serve');

const s1 = S.normalizarSessaoRealizada({
  id: 'x', data: '2026-09-20', inicio: '18:02', duracaoMin: '34,5', esforco: '7', estado: 'inventado',
  sintomas: { durante: 'a'.repeat(5000) }, intruso: 'não entra', origem: { ficha: 'PTM-0001', lixo: 1 },
  itens: [{ exercicioId: 'e:Supino', nome: 'Supino', series: [{ linhaId: 'l1', feito: true, v: { reps: '10', carga: '22', intruso: '1' } }] }],
});
esperar(s1.duracaoMin === 35, `duração "34,5" arredonda para 35 (${s1.duracaoMin})`);
esperar(s1.estado === 'concluida', 'um estado desconhecido volta a «concluida»');
esperar(s1.sintomas.durante.length === 1000, 'o texto livre tem limite');
esperar(!('intruso' in s1), 'campos desconhecidos não passam');
esperar(igual(s1.origem, { ficha: 'PTM-0001' }), 'a origem só leva os campos conhecidos');
esperar(!('intruso' in s1.itens[0].series[0].v), 'uma série só leva campos conhecidos');
esperar(s1.itens[0].estado === 'feito', 'o estado do item deriva das séries quando falta');
for (const [entrada, esperado] of [['0', '0'], ['10', '10'], ['11', ''], ['-1', ''], ['', ''], ['7.5', ''], [7, '7']]) {
  const e = S.normalizarSessaoRealizada({ id: 'x', esforco: entrada }).esforco;
  esperar(e === esperado, `esforço ${JSON.stringify(entrada)} -> ${JSON.stringify(esperado)} (${JSON.stringify(e)})`);
}
esperar(S.normalizarSessaoRealizada({ id: 'x', data: '20/09/2026' }).data === '', 'uma data fora do formato fica vazia');
esperar(S.normalizarSessaoRealizada({ id: 'x', duracaoMin: 0 }).duracaoMin === null, 'duração 0 fica sem valor');

// ---------- estado do item ----------
const serie = (feito) => ({ feito });
esperar(S.estadoDoItem({ series: [serie(true), serie(true)], saltado: false }) === 'feito', 'todas feitas: feito');
esperar(S.estadoDoItem({ series: [serie(true), serie(false)], saltado: false }) === 'parcial', 'algumas feitas: parcial');
esperar(S.estadoDoItem({ series: [serie(false), serie(false)], saltado: false }) === 'saltado', 'nenhuma feita: saltado');
esperar(S.estadoDoItem({ series: [serie(true)], saltado: true }) === 'saltado', 'saltar ganha às séries feitas');
esperar(S.estadoDoItem({ series: [], saltado: false }) === 'saltado', 'sem séries: saltado');

// ---------- texto da série ----------
esperar(S.textoSerieRealizada({ v: { reps: '10', carga: '22', rir: '3' } }) === '10 × 22 kg · RIR 3', 'só o número leva a unidade: "10 × 22 kg · RIR 3"');
esperar(S.textoSerieRealizada({ v: { reps: '10', carga: '22,5 kg' } }) === '10 × 22,5 kg', 'uma unidade escrita mantém-se');
esperar(S.textoSerieRealizada({ v: { reps: '12', carga: 'elástico azul' } }) === '12 × elástico azul', 'uma carga em texto mantém-se');
esperar(S.textoSerieRealizada({ v: { tempo: '40', rpe: '6' } }) === '40 s · RPE 6', 'tempo em segundos');
esperar(S.textoSerieRealizada({ v: { distancia: '400', tempo: '95', ritmo: '5:30 /km' } }) === '95 s · 400 m · 5:30 /km', 'corrida: tempo, distância, ritmo');
esperar(S.textoSerieRealizada({ v: {} }) === '', 'uma série vazia dá texto vazio');

// ---------- última vez ----------
const sessoes = S.normalizarExecucoes({ sessoes: [
  { id: 'a', data: '2026-09-01', itens: [{ exercicioId: 'e:Supino', nome: 'Supino', series: [{ feito: true, v: { reps: '10', carga: '20' } }] }] },
  { id: 'b', data: '2026-09-10', itens: [{ exercicioId: 'e:Supino', nome: 'Supino', series: [{ feito: true, v: { reps: '10', carga: '22' } }, { feito: true, v: { reps: '8', carga: '24' } }, { feito: false, v: { reps: '6' } }] }] },
  { id: 'c', data: '2026-09-15', itens: [{ exercicioId: 'e:Supino', nome: 'Supino', series: [{ feito: false, v: {} }] }] },
  { id: 'd', data: '2026-09-16', itens: [{ exercicioId: 'e:Remada', nome: 'Remada', series: [{ feito: true, v: { reps: '12' } }] }] },
] }).sessoes;
let u = S.ultimaVezDoExercicio(sessoes, 'e:Supino');
esperar(u && u.data === '2026-09-10' && igual(u.series, ['10 × 22 kg', '8 × 24 kg']), 'a última vez ignora a sessão em que nada foi feito e as séries por fazer');
u = S.ultimaVezDoExercicio(sessoes, 'e:Supino', 'b');
esperar(u && u.data === '2026-09-01', 'ignorar a sessão em curso (ao editar)');
esperar(S.ultimaVezDoExercicio(sessoes, 'e:Inexistente') === null, 'exercício nunca feito: sem dica');
esperar(S.ultimaVezDoExercicio(sessoes, '') === null, 'sem id de exercício: sem dica');
esperar(S.ordenarSessoes(sessoes).map((s) => s.id).join('') === 'dcba', 'mais recentes primeiro');

// ---------- campos que cada série pede ----------
const T = {
  reps_carga: ['reps', 'carga'], cadencia: ['reps', 'carga', 'cadencia'], reps_1rm: ['reps', 'percentagem1rm'],
  reps_tempo: ['reps', 'tempo'], corrida: ['distancia', 'tempo', 'ritmo'], cardio: ['duracao', 'velocidade', 'potencia'], observacao: [],
};
esperar(igual(S.camposRealizaveis(T.reps_carga, {}), ['reps', 'carga']), 'repetições e carga');
esperar(igual(S.camposRealizaveis(T.cadencia, {}), ['reps', 'carga']), 'a cadência só serve para prescrever');
esperar(igual(S.camposRealizaveis(T.reps_1rm, {}), ['reps', 'carga']), 'com % de 1RM prescrito, regista-se a carga em kg');
esperar(igual(S.camposRealizaveis(T.corrida, {}), ['distancia', 'tempo', 'ritmo']), 'corrida');
esperar(igual(S.camposRealizaveis(T.reps_carga, { rir: '3' }), ['reps', 'carga', 'rir']), 'RIR prescrito: pede RIR');
esperar(igual(S.camposRealizaveis(T.reps_carga, { rpe: '7' }), ['reps', 'carga', 'rpe']), 'RPE prescrito: pede RPE');
esperar(igual(S.camposRealizaveis(T.reps_carga, { rir: '0' }), ['reps', 'carga', 'rir']), 'RIR 0 é um valor (não se perde)');
esperar(igual(S.camposRealizaveis(T.observacao, {}), []), 'só observação: nenhum campo');
esperar(igual(S.camposRealizaveis(T.reps_tempo, { tempo: '60 s' }), ['tempo']), 'uma série só de tempo não pede repetições');
esperar(igual(S.camposRealizaveis(T.reps_tempo, { reps: '10', tempo: '3 s' }), ['reps', 'tempo']), 'com repetições e tempo prescritos, pede os dois');
esperar(igual(S.camposRealizaveis(T.reps_carga, { reps: '' }), ['reps', 'carga']), 'uma série de carga sem repetições escritas mantém o campo');
esperar(igual(S.valoresSugeridos({ reps: '10', carga: '22 kg', rir: '3' }, ['reps', 'carga', 'rir']), { reps: '10', carga: '22 kg', rir: '3' }), 'sugere o que a prescrição diz');
esperar(igual(S.valoresSugeridos({ reps: '8-10', carga: '40%' }, ['reps', 'carga']), {}), 'uma faixa ou uma percentagem não são o que se fez');
esperar(igual(S.valoresSugeridos({ reps: '' }, ['reps']), {}), 'campo vazio: sem sugestão');

// ---------- construir os itens; a prescrição não se toca ----------
const treino = { exercicios: [
  { id: 'x1', exercicioId: 'e:Supino', nome: 'Supino', bloco: 'Principal', grupo: '', metodo: '', linhas: [{ id: 'l1', tipo: 'reps_carga', reps: '10', carga: '22 kg', rir: '3' }, { id: 'l2', tipo: 'reps_carga', reps: '10', carga: '22 kg', rir: '3' }] },
  { id: 'x2', exercicioId: 'e:Remada', nome: 'Remada', bloco: 'Principal', grupo: 'g1', metodo: 'Drop-set', linhas: [{ id: 'l3', tipo: 'reps_carga', reps: '12' }] },
  { id: 'x3', exercicioId: 'e:Prancha', nome: 'Prancha', bloco: 'Principal', grupo: '', metodo: '', linhas: [{ id: 'l4', tipo: 'reps_tempo', tempo: '40 s' }] },
] };
const antes = JSON.stringify(treino);
const dep = { descreverLinha: (l) => `${l.reps || ''}${l.carga ? ' × ' + l.carga : ''}`, camposDoTipo: (l) => T[l.tipo] };
const itens = S.construirItens(treino, {
  x1: { series: { l1: { feito: true, v: { reps: '10', carga: '22', rir: '3' } }, l2: { feito: false, v: { reps: '9' } } }, notas: 'joelho direito estalou' },
  x2: { saltado: true, series: { l3: { feito: true, v: { reps: '12' } } } },
}, dep);
esperar(JSON.stringify(treino) === antes, 'construir os itens não altera a prescrição');
esperar(itens[0].estado === 'parcial' && itens[0].series[0].feito && !itens[0].series[1].feito, 'uma série feita e outra não: parcial');
esperar(itens[0].notas === 'joelho direito estalou', 'a nota do exercício passa');
esperar(itens[1].estado === 'saltado' && itens[1].series[0].feito === false, 'saltar o exercício desfaz o ✓ das suas séries');
esperar(itens[2].estado === 'saltado', 'o que não se tocou fica «saltado», nunca «feito»');
esperar(itens[0].series[0].prescrito === '10 × 22 kg', 'guarda o texto prescrito no momento');
esperar(igual(itens[0].series[0].c, ['reps', 'carga', 'rir']), 'guarda os campos que a série pediu');
esperar(igual(S.normalizarItemRealizado(itens[0]).series[1].v, { reps: '9' }), 'os valores por confirmar (série sem ✓) mantêm-se para editar');

// ---------- corrigir uma sessão ----------
const original = S.normalizarSessaoRealizada({
  id: 's1', data: '2026-09-20', inicio: '18:02', duracaoMin: 40, esforco: '6', criadoEm: '2026-09-20T18:45:00.000Z',
  estado: 'concluida', sintomas: { durante: 'ombro', depois: '' }, notas: 'ok', prescricaoId: 'p1', treinoId: 't1', treinoNome: 'Treino A',
  itens: itens,
});
const fecho = S.fechoDaSessao(original);
esperar(fecho.data === '2026-09-20' && fecho.duracaoMin === '40' && fecho.esforco === '6' && fecho.durante === 'ombro' && fecho.interrompida === false, 'o fecho da sessão devolve o que o formulário edita, em texto');
const itensEditados = JSON.parse(JSON.stringify(original.itens));
itensEditados[0].series[1].feito = true;       // o exercício «parcial» passa a completo
itensEditados[2].series[0].feito = true;       // o «saltado» passa a parcial ou feito
itensEditados[2].series[0].v = { tempo: '38' };
const corrigida = S.sessaoCorrigida(original, { ...fecho, esforco: '8', interrompida: true, motivo: 'tontura', durante: '' }, itensEditados, '2026-09-21T09:00:00.000Z');
esperar(corrigida.itens[0].estado === 'feito', 'marcar a série que faltava faz do exercício «feito»');
esperar(corrigida.itens[2].estado === 'feito' && corrigida.itens[2].series[0].v.tempo === '38', 'um exercício «saltado» com uma série marcada deixa de o ser');
esperar(corrigida.itens[1].estado === 'saltado', 'o que continua sem séries feitas continua «saltado»');
esperar(corrigida.esforco === '8' && corrigida.estado === 'interrompida' && corrigida.motivoInterrupcao === 'tontura', 'esforço, estado e motivo corrigidos');
esperar(corrigida.id === 's1' && corrigida.criadoEm === original.criadoEm && corrigida.editadoEm === '2026-09-21T09:00:00.000Z', 'o id e a data de criação mantêm-se; regista-se quando foi editada');
const desmarcada = JSON.parse(JSON.stringify(original.itens));
desmarcada[0].series[0].feito = false;
esperar(S.sessaoCorrigida(original, fecho, desmarcada, 'x').itens[0].estado === 'saltado', 'desmarcar todas as séries volta a fazer do exercício «saltado»');
esperar(S.sessaoCorrigida(original, { ...fecho, interrompida: false, motivo: 'resto' }, original.itens, 'x').motivoInterrupcao === '', 'uma sessão que deixou de ser «interrompida» perde o motivo');
esperar(S.sessaoCorrigida(original, { ...fecho, duracaoMin: '' }, original.itens, 'x').duracaoMin === null, 'a duração pode ficar por indicar');
const busca = S.textoDeBuscaDaSessao(original);
esperar(/Supino/.test(busca) && /ombro/.test(busca) && /joelho direito/.test(busca) && /Treino A/.test(busca), 'a procura encontra exercícios, sintomas e notas');

// ---------- rascunho ----------
esperar(S.lerRascunho('{isto não é json') === null, 'um rascunho estragado é ignorado, sem rebentar');
esperar(S.lerRascunho(JSON.stringify({ v: 99, itens: {} })) === null, 'um rascunho de outra versão é ignorado');
const rasc = S.lerRascunho(JSON.stringify({ v: 1, inicioMs: 1700000000000, passo: 2, itens: { x1: { series: { l1: { feito: true }, l2: { feito: false } } }, x2: { saltado: true } } }));
esperar(rasc && rasc.passo === 2 && S.seriesFeitasDoRascunho(rasc) === 1, 'lê o passo e conta as séries feitas');
esperar(S.rascunhoTemTrabalho(rasc) && !S.rascunhoTemTrabalho({ itens: {} }) && S.rascunhoTemTrabalho({ itens: { x: { saltado: true } } }), 'só há trabalho a perder se algo foi feito, saltado ou anotado');
esperar(S.chaveRascunho('a1', 't1') === 'ptmanager:sessao:a1:t1', 'chave do rascunho');
esperar(S.chaveExecucoes('a1') === 'execucoes:a1', 'chave do registo: uma por aluno');
esperar(S.chaveExecucoes('k3x9 a.b/c') === 'execucoes:k3x9_a_b_c', 'um id com carácter fora do que o `check` aceita não rebenta a gravação');
esperar(/^execucoes:[A-Za-z0-9_-]{1,64}$/.test(S.chaveExecucoes('x'.repeat(200))), 'e um id comprido cabe no limite de 64');

// ---------- fila de gravações contra um armazenamento com carimbo de versão ----------
const pausa = () => new Promise((r) => setTimeout(r, 5));
function armazenamentoFalso() {
  let versao = 'v0'; let n = 0; const carimbos = new Map();
  return {
    async ler(chave) { await pausa(); carimbos.set(chave, versao); },
    // O mesmo que writeStoredValue: espera pelo utilizador (getUser), lê o
    // carimbo conhecido, e só escreve se o servidor ainda estiver nessa versão.
    async gravar(chave) {
      await pausa();
      const anterior = carimbos.get(chave);
      await pausa();
      if (anterior !== versao) throw new Error('ConflitoDeGravacao');
      n += 1; versao = 'v' + n; carimbos.set(chave, versao);
    },
  };
}
{
  const a = armazenamentoFalso();
  await a.ler('execucoes:a1');
  const r = await Promise.allSettled([a.gravar('execucoes:a1'), a.gravar('execucoes:a1')]);
  esperar(r.filter((x) => x.status === 'rejected').length === 1, 'sem fila, duas gravações seguidas dão um falso conflito (o problema que a fila resolve)');
}
{
  const a = armazenamentoFalso();
  const enfileirar = S.criarFilaPorChave();
  await a.ler('execucoes:a1');
  const r = await Promise.allSettled([enfileirar('execucoes:a1', () => a.gravar('execucoes:a1')), enfileirar('execucoes:a1', () => a.gravar('execucoes:a1')), enfileirar('execucoes:a1', () => a.gravar('execucoes:a1'))]);
  esperar(r.every((x) => x.status === 'fulfilled'), 'com fila, três gravações seguidas passam todas');
}
{
  const enfileirar = S.criarFilaPorChave();
  const ordem = [];
  const p1 = enfileirar('k', async () => { await pausa(); ordem.push(1); throw new Error('falhou'); });
  const p2 = enfileirar('k', async () => { ordem.push(2); return 'ok'; });
  const r1 = await p1.then(() => 'ok', () => 'erro');
  esperar(r1 === 'erro' && (await p2) === 'ok' && igual(ordem, [1, 2]), 'uma gravação que falha não bloqueia a seguinte, e a ordem mantém-se');
}
{
  const enfileirar = S.criarFilaPorChave();
  let emCurso = 0; let maximo = 0;
  const tarefa = async () => { emCurso += 1; maximo = Math.max(maximo, emCurso); await pausa(); emCurso -= 1; };
  await Promise.all([enfileirar('a', tarefa), enfileirar('b', tarefa), enfileirar('a', tarefa)]);
  esperar(maximo === 2, 'chaves diferentes (alunos diferentes) gravam em paralelo; a mesma chave nunca');
}
esperar(S.podeGravarExecucoes({ estado: 'ok', sessoes: [] }) && !S.podeGravarExecucoes({ estado: 'a-carregar' }) && !S.podeGravarExecucoes({ estado: 'erro' }) && !S.podeGravarExecucoes(undefined), 'só se grava depois de o registo do aluno ter sido lido');

console.log(falhas === 0 ? '\nTUDO OK' : `\n${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
