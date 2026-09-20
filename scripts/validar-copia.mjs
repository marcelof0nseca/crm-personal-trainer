/*
 * Confere a logica pura da copia de seguranca (src/data/copia.ts): o que se
 * exporta, como se le um ficheiro -- os antigos (versao 1) e os novos -- e o
 * que muda nas sessoes de treino ao restaurar.
 *
 * Uso: node scripts/validar-copia.mjs
 */
import { register } from 'node:module';

register('./resolver-extensao-ts.mjs', import.meta.url);
const C = await import('../src/data/copia.ts');
const S = await import('../src/data/sessoes.ts');

let falhas = 0;
function esperar(condicao, mensagem) {
  if (condicao) console.log('ok: ' + mensagem);
  else { falhas += 1; console.log('FALHA: ' + mensagem); }
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function recusa(texto) { try { C.lerCopia(texto); return false; } catch (e) { return true; } }

const sessao = (id) => ({ id, data: '2026-09-10', treinoNome: 'Treino A', itens: [] });
const alunos = [{ id: 'a1', name: 'Rita' }, { id: 'a2', name: 'Rui' }];

// ---------- montar e ler de volta ----------
const feita = C.montarCopia({
  alunos, agenda: [{ id: 's1' }], financas: [], fotos: [], categorias: { expense: [] },
  definicoes: { horario: {} }, treinos: { prescricoes: [{ id: 'p1' }, { id: 'p2' }], modelos: [] },
  formularios: { respostas: [{ id: 'r1' }] }, execucoes: { a1: { sessoes: [sessao('x1'), sessao('x2')] } },
}, '2026-09-20T10:00:00.000Z');
esperar(feita.versao === C.VERSAO_COPIA && feita.exportedAt === '2026-09-20T10:00:00.000Z', 'a cópia leva a versão e o instante');
const lida = C.lerCopia(JSON.stringify(feita));
esperar(lida.versao === 2 && lida.definicoes && lida.treinos && lida.formularios && lida.execucoes, 'uma cópia nova volta a ler-se com tudo');
esperar(lida.execucoes.a1.sessoes.length === 2 && lida.execucoes.a1.sessoes[0].id === 'x1', 'as sessões voltam por aluno');
const r = C.resumoDaCopia(lida);
esperar(r.alunos === 2 && r.aulas === 1 && r.programas === 2 && r.sessoes === 2 && r.respostas === 1 && r.completa === true, 'o resumo conta programas, sessões e respostas');

// ---------- um ficheiro antigo (versão 1) continua a restaurar-se ----------
const antiga = C.lerCopia(JSON.stringify({ exportedAt: 'x', alunos, agenda: [], financas: [{ id: 'f' }], fotos: [], categorias: { expense: [] } }));
esperar(antiga.versao === 1 && antiga.definicoes === undefined && antiga.treinos === undefined && antiga.formularios === undefined && antiga.execucoes === undefined, 'um ficheiro antigo não inventa o que não leva (ausente = não se toca)');
esperar(C.resumoDaCopia(antiga).completa === false, 'e o resumo diz que não é completo');
const minima = C.lerCopia(JSON.stringify({ alunos: [], agenda: [] }));
esperar(igual(minima.financas, []) && igual(minima.fotos, []) && minima.categorias === null, 'financas, fotos e categorias em falta assumem vazio (como antes)');

// ---------- ficheiros estragados recusam-se inteiros ----------
esperar(recusa('isto não é json'), 'texto que não é JSON');
esperar(recusa('[]') && recusa('null') && recusa('"x"'), 'JSON que não é um objeto');
esperar(recusa(JSON.stringify({ agenda: [] })) && recusa(JSON.stringify({ alunos: [] })), 'sem alunos ou sem agenda');
esperar(recusa(JSON.stringify({ alunos: [], agenda: [], treinos: [] })), 'treinos com a forma errada recusa o ficheiro todo');
esperar(recusa(JSON.stringify({ alunos: [], agenda: [], definicoes: 'x' })), 'definições com a forma errada');
esperar(recusa(JSON.stringify({ alunos: [], agenda: [], formularios: 3 })), 'formulários com a forma errada');
esperar(recusa(JSON.stringify({ alunos: [], agenda: [], execucoes: [] })), 'sessões com a forma errada');

// ---------- sessões na cópia ----------
const suja = C.lerCopia(JSON.stringify({
  alunos, agenda: [],
  execucoes: {
    a1: { sessoes: [{ nome: 'sem id' }, { ...sessao('ok'), intruso: 'sai' }] },
    a2: { sessoes: [] },
    fantasma: { sessoes: [sessao('z')] },
  },
}));
esperar(igual(Object.keys(suja.execucoes), ['a1']), 'só ficam as sessões de alunos que estão na cópia e que têm sessões');
esperar(suja.execucoes.a1.sessoes.length === 1 && !('intruso' in suja.execucoes.a1.sessoes[0]), 'e passam pela mesma limpeza de campos que ao ler da base de dados');
esperar(C.lerCopia(JSON.stringify({ alunos, agenda: [], execucoes: {} })).execucoes !== undefined, '«sem sessões» (objeto vazio) não é o mesmo que «o ficheiro não as leva»');

// ---------- o que muda nas sessões ao restaurar ----------
const existentes = ['execucoes:a1', 'execucoes:a2', 'execucoes:saiu', 'execucoes:orfa'];
{
  // Cópia nova: a conta fica com as sessões do ficheiro, e só essas.
  const copia = C.lerCopia(JSON.stringify({ alunos, agenda: [], execucoes: { a1: { sessoes: [sessao('x')] } } }));
  const p = C.planoDeSessoes(copia, existentes);
  esperar(igual(p.escrever.map((e) => e.chave), ['execucoes:a1']), 'cópia nova: escreve as sessões que o ficheiro traz');
  esperar(igual(p.apagar, ['execucoes:a2', 'execucoes:saiu', 'execucoes:orfa']), 'cópia nova: apaga as linhas que o ficheiro não tem, incluindo as órfãs');
}
{
  // Cópia nova sem nenhuma sessão: apaga todas.
  const copia = C.lerCopia(JSON.stringify({ alunos, agenda: [], execucoes: {} }));
  const p = C.planoDeSessoes(copia, existentes);
  esperar(p.escrever.length === 0 && p.apagar.length === existentes.length, 'cópia nova sem sessões: a conta fica sem sessões');
}
{
  // Cópia antiga: os alunos que ficam não perdem as sessões; os que saem, sim.
  const copia = C.lerCopia(JSON.stringify({ alunos, agenda: [] }));
  const p = C.planoDeSessoes(copia, existentes);
  esperar(p.escrever.length === 0, 'cópia antiga: não escreve nada');
  esperar(igual(p.apagar, ['execucoes:saiu', 'execucoes:orfa']), 'cópia antiga: só apaga as sessões de quem já não está na lista de alunos');
}
{
  const ids = C.planoDeSessoes(C.lerCopia(JSON.stringify({ alunos: [{ id: 'k3x9 a.b' }], agenda: [] })), ['execucoes:k3x9_a_b', 'execucoes:outro']);
  esperar(igual(ids.apagar, ['execucoes:outro']), 'um id com carácter fora do que a chave aceita continua a ser reconhecido como o mesmo aluno');
}
esperar(C.planoDeSessoes(C.lerCopia(JSON.stringify({ alunos, agenda: [] })), []).apagar.length === 0, 'sem linhas existentes não há nada a apagar');

// A chave que se escreve é a mesma que a aplicação lê.
esperar(C.planoDeSessoes(C.lerCopia(JSON.stringify({ alunos, agenda: [], execucoes: { a1: { sessoes: [sessao('x')] } } })), []).escrever[0].chave === S.chaveExecucoes('a1'), 'a chave escrita é a que a aplicação lê');

console.log(falhas === 0 ? '\nTUDO OK' : `\n${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
