/*
 * Confere a lógica pura dos módulos novos (src/features).
 *
 * Uso: node scripts/validar-modulos.mjs
 */
import { register } from 'node:module';

register('./resolver-extensao-ts.mjs', import.meta.url);
const M = await import('../src/features/modulos.ts');
const P = await import('../src/features/treino/presets.ts');
const V = await import('../src/features/treino/publicacao.ts');
const E = await import('../src/features/treino/evolucao.ts');
const T = await import('../src/features/treino/temporizador.ts');
const C = await import('../src/data/copia.ts');
const S = await import('../src/data/sessoes.ts');

let falhas = 0;
export function esperar(condicao, mensagem) {
  if (condicao) console.log('ok: ' + mensagem);
  else { falhas += 1; console.log('FALHA: ' + mensagem); }
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let n = 0;
const gerarId = () => `id${(n += 1)}`;

// ---------- registo de módulos ----------
esperar(igual(M.normalizarModulo('presets', null), { itens: [] }), 'um módulo sem dados vem vazio');
esperar(igual(M.normalizarModulo('presets', { itens: 'lixo' }), { itens: [] }), 'uma lista com a forma errada não rebenta');
esperar(M.normalizarModulo('tarefas', { itens: [{ id: 'a' }] }).itens.length === 1, 'o que está gravado mantém-se');
esperar(M.vazioDe('presets') !== M.vazioDe('presets'), 'o vazio é uma cópia, nunca a mesma lista');
const mudancas = M.modulosAoEliminarAluno({ tarefas: { itens: [{ id: 't', studentId: 'a1' }, { id: 'u', studentId: 'a2' }] }, presets: { itens: [{ id: 'p' }] } }, 'a1');
esperar(igual(mudancas.tarefas.itens, [{ id: 'u', studentId: 'a2' }]), 'eliminar um aluno tira o que é dele');
esperar(!('presets' in mudancas), 'o que não é de ninguém não se regrava');

// ---------- cópia ----------
const base = { alunos: [], agenda: [] };
esperar(C.lerCopia(JSON.stringify(base)).modulos === undefined, 'um ficheiro antigo não traz módulos');
esperar(igual(C.planoDeModulos({}, ['modulo:presets']), { escrever: [], apagar: [] }), 'um ficheiro antigo não toca nos módulos');
const lida = C.lerCopia(JSON.stringify({ ...base, modulos: { presets: { itens: [] }, inventado: { x: 1 } } }));
esperar(igual(Object.keys(lida.modulos), ['presets']), 'um módulo desconhecido é ignorado');
const plano = C.planoDeModulos(lida, ['modulo:presets', 'modulo:tarefas', 'execucoes:a']);
esperar(plano.apagar.length === 1 && plano.apagar[0] === 'modulo:tarefas' && plano.escrever[0].chave === 'modulo:presets', 'um ficheiro novo deixa só os módulos que traz, sem tocar nas sessões');
let recusou = false;
try { C.lerCopia(JSON.stringify({ ...base, modulos: { presets: [] } })); } catch { recusou = true; }
esperar(recusou, 'um módulo com a forma errada recusa o ficheiro');

// ---------- presets ----------
const bi = P.PRESETS_SISTEMA.find((p) => p.id === 'sis:bi_set');
const a1 = P.aplicarPreset(bi, gerarId);
const a2 = P.aplicarPreset(bi, gerarId);
esperar(a1.exercicios.length === 2 && a1.exercicios[0].grupo === a1.exercicios[1].grupo && a1.grupos[a1.exercicios[0].grupo].metodo === 'bi_set', 'aplicar mantém a combinação ligada');
esperar(a1.exercicios[0].grupo !== a2.exercicios[0].grupo, 'aplicar duas vezes dá duas combinações');
a1.exercicios[0].linhas[0].reps = '99';
esperar(bi.exercicios[0].linhas[0].reps === '10', 'editar depois de aplicar não altera o preset');
esperar(P.PRESETS_SISTEMA.every((p) => p.exercicios.every((e) => e.linhas.length > 0)), 'todos os presets têm séries');
const guardado = P.presetDeSelecao('X', [{ id: 'e', grupo: 'g', bloco: 'Principal', linhas: [] }, { id: 'f', grupo: 'g', bloco: 'Principal', linhas: [] }], { g: { metodo: 'bi_set' }, h: { metodo: 'x' } }, gerarId, 'agora');
esperar(guardado.tipo === 'combinacao' && igual(Object.keys(guardado.grupos), ['g']), 'guardar só leva os grupos usados, e reconhece o tipo');
const rep = P.replicarSerie({ reps: '8', carga: '50', rir: 0, descanso: '60', tipo: 'reps_carga' }, { id: 'l2', tipo: 'corrida', papel: 'queda', distancia: '400' }, () => ['distancia', 'tempo', 'ritmo']);
esperar(rep.id === 'l2' && rep.papel === 'queda' && rep.carga === undefined && rep.rir === 0 && rep.distancia === '400', 'replicar só mexe nos campos que o tipo de destino usa');

// ---------- publicação e ciclos ----------
const prog = { id: 'p', treinos: [{ id: 't', nome: 'A' }], inicio: '2026-10-01' };
esperar(V.estadoDoPrograma(prog, '2026-10-30') === 'publicado', 'um programa antigo, sem estado, está publicado');
esperar(V.visivelAoAluno(prog, '2026-10-30'), 'e continua visível ao aluno');
esperar(!V.visivelAoAluno({ ...prog, estadoPublicacao: 'rascunho' }, '2026-10-30'), 'um rascunho não é visível');
esperar(V.estadoDoPrograma({ ...prog, estadoPublicacao: 'publicado', inicio: '2026-12-01' }, '2026-10-30') === 'programado', 'publicado com início futuro fica programado');
esperar(!V.visivelAoAluno({ ...prog, estadoPublicacao: 'publicado', inicio: '2026-12-01' }, '2026-10-30'), 'e ainda não aparece ao aluno');
esperar(!V.visivelAoAluno({ ...prog, extra: { validade: '2026-10-01' } }, '2026-10-30'), 'um treino extra fora de validade não aparece');
let pub = V.publicarPrograma(prog, { quem: 'T', resumo: 'um', agora: 'a' });
pub = V.publicarPrograma({ ...pub, treinos: [{ id: 't', nome: 'B' }] }, { quem: 'T', resumo: 'dois', agora: 'b' });
esperar(pub.versaoNumero === 2 && pub.versoes.length === 2 && pub.versoes[0].treinos[0].nome === 'A', 'cada publicação guarda o que foi publicado');
const reposto = V.reporVersao(pub, 1, { quem: 'T', agora: 'c' });
esperar(reposto.treinos[0].nome === 'A' && reposto.versaoNumero === 3 && reposto.versoes.some((v) => v.treinos[0].nome === 'B'), 'repor é mais uma versão, e a anterior fica');
let muitas = prog;
for (let i = 0; i < 8; i += 1) muitas = V.publicarPrograma(muitas, { quem: 'T', resumo: '', agora: 'x' });
esperar(muitas.versoes.length === V.MAX_VERSOES_PROGRAMA && muitas.versoes[0].numero === 4, 'só ficam as versões mais recentes');
esperar(V.semanaDoPrograma(prog, '2026-10-01') === 1 && V.semanaDoPrograma(prog, '2026-10-08') === 2 && V.semanaDoPrograma(prog, '2026-09-01') === null, 'a semana conta a partir do início');
const comFases = { ...prog, fases: [{ id: 'f1', nome: 'Base', semanas: 2 }, { id: 'f2', nome: 'Deload', semanas: 1 }] };
esperar(V.faseAtual(comFases, '2026-10-16').fase.id === 'f2' && V.faseAtual(comFases, '2026-10-16').semanaNaFase === 1, 'a fase em curso sai da duração de cada uma');
esperar(V.faseAtual(comFases, '2026-12-01') === null, 'depois da última fase, não há fase');
esperar(V.cargaPlaneada('40 kg', { tipo: 'absoluta', valor: 2.5 }, 2) === '45 kg', 'progressão absoluta');
esperar(V.cargaPlaneada('50', { tipo: 'percentagem', valor: 10 }, 1) === '55', 'progressão por percentagem');
esperar(V.cargaPlaneada('elástico', { tipo: 'absoluta', valor: 2 }, 1) === 'elástico', 'uma carga em texto não muda');
esperar(V.cargaPlaneada('40', { tipo: 'manual' }, 3) === '40', 'manual não calcula nada');

// ---------- evolução ----------
esperar(E.estimar1RM('100', '1') === 100, 'uma repetição é a própria carga');
esperar(E.estimar1RM('100', '10', 'epley') === 133.3, 'Epley');
esperar(E.estimar1RM('100', '10', 'brzycki') === 133.3, 'Brzycki');
esperar(E.estimar1RM('100', '13') === null, 'acima de 12 repetições não se estima');
esperar(E.estimar1RM('8-10', '10') === null && E.estimar1RM('100', '8-10') === null, 'uma faixa não se estima');
const serie = (carga, reps, feito = true) => ({ v: { carga, reps }, feito });
const sess = [
  { id: 's2', data: '2026-10-08', estado: 'concluida', itens: [{ exercicioId: 'e:S', nome: 'Supino', series: [serie('60', '8'), serie('elástico', '10')] }] },
  { id: 's1', data: '2026-10-01', estado: 'concluida', itens: [{ exercicioId: 'e:S', nome: 'Supino', series: [serie('50', '10'), serie('70', '5', false)] }] },
  { id: 's3', data: '2026-10-15', estado: 'interrompida', itens: [{ exercicioId: 'e:S', nome: 'Supino', series: [serie('', '', false)] }] },
];
const hist = E.historicoPorExercicio(sess);
esperar(hist[0].pontos.length === 2 && hist[0].pontos[0].data === '2026-10-01', 'só entram sessões com séries feitas, por ordem de data');
esperar(hist[0].pontos[0].carga === 50, 'uma série por fazer não conta para o máximo');
esperar(hist[0].pontos[1].carga === 60 && hist[0].pontos[1].volume === 480, 'uma carga em texto fica fora do volume');
const rec = E.recordes(hist);
esperar(rec[0].carga.valor === 60 && rec[0].carga.sessaoId === 's2', 'um recorde diz de que sessão veio');
const fr = E.frequencia([...sess, { id: 's4', data: '2026-10-02', estado: 'concluida', itens: [{ series: [serie('1', '1'), serie('1', '1', false)] }] }, { id: 's5', data: '2026-10-03', estado: 'concluida', itens: [{ series: [serie('1', '1', false)] }] }], '2026-10-01', '2026-10-31');
esperar(fr.concluidas === 1 && fr.parciais === 2 && fr.interrompidas === 1 && fr.semSeries === 1, 'distingue concluída, parcial, interrompida e sem séries');
esperar(E.segundaDaSemana('2026-10-30') === '2026-10-26' && E.segundaDaSemana('2026-10-26') === '2026-10-26', 'a semana começa à segunda');
esperar(E.adesao(sess, '2026-10-01', '2026-10-14', null) === null, 'sem frequência planeada, não se inventa adesão');
esperar(E.adesao(sess, '2026-10-01', '2026-10-14', 2).planeadas === 4, 'a adesão compara com o planeado');

// ---------- temporizador ----------
esperar(T.planoDoTemporizador('EMOM', { minutos: '10', janela: '2' }).length === 5, 'EMOM: uma etapa por janela');
esperar(T.planoDoTemporizador('Tabata', { rondas: '8', trabalho: '20', pausa: '10' }).length === 15, 'Tabata: sem pausa depois da última ronda');
esperar(T.planoDoTemporizador('Intervalado', { esforco: '30', recuperacao: '30', blocos: '2', pausaBloco: '60', preparacao: '10' }).length === 6, 'Intervalado com preparação e pausa entre blocos');
esperar(T.planoDoTemporizador('AMRAP', {}).length === 0, 'sem números não há relógio');
esperar(T.planoDoTemporizador('Série tradicional', {}).length === 0, 'um método sem tempo não tem relógio');
esperar(T.segundosDePausa('90 s') === 90 && T.segundosDePausa('2 min') === 120 && T.segundosDePausa('até recuperar') === 0, 'lê pausas escritas à mão');

// ---------- feedback ----------
const nf = S.normalizarSessaoRealizada({ id: 'x', feedback: { satisfacao: '4', energia: '9', comentario: 'bom', intruso: 1 }, acompanhamento: { lido: 1, resposta: 'ok' } });
esperar(nf.feedback.satisfacao === '4' && nf.feedback.energia === '' && !('intruso' in nf.feedback), 'o feedback só aceita a escala de 1 a 5');
esperar(nf.acompanhamento.lido === true && nf.acompanhamento.resposta === 'ok', 'o acompanhamento mantém-se');
esperar(S.normalizarSessaoRealizada({ id: 'y' }).feedback.satisfacao === '', 'uma sessão antiga lê-se sem feedback');

const extras = await import('./validar-modulos-2.mjs').catch((e) => { if (e.code === 'ERR_MODULE_NOT_FOUND') return null; throw e; });
if (extras) falhas += await extras.correr(esperar);

console.log(falhas === 0 ? '\nTUDO OK' : `\n${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
