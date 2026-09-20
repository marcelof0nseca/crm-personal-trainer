/*
 * Confere a logica pura de apagar (src/data/eliminar.ts): que fotografias saem
 * quando se apaga uma avaliacao ou um aluno, e o que sai com um aluno.
 *
 * Uso: node scripts/validar-eliminar.mjs
 */
import { register } from 'node:module';

register('./resolver-extensao-ts.mjs', import.meta.url);
const E = await import('../src/data/eliminar.ts');

let falhas = 0;
function esperar(condicao, mensagem) {
  if (condicao) console.log('ok: ' + mensagem);
  else { falhas += 1; console.log('FALHA: ' + mensagem); }
}
const ids = (lista) => lista.map((f) => f.id).sort().join(',');
const foto = (id) => ({ id, path: `u/${id}.jpg`, createdAt: 'x' });

// ---------- procurar ids de fotografia em qualquer sítio ----------
{
  const conhecidos = new Set(['f1', 'f2', 'f3', 'f4']);
  const valor = {
    a: 'f1', b: ['x', { c: 'f2' }], d: { e: { f: [['f3']] } }, n: 5, nulo: null, texto: 'f1f2 não é um id', fim: undefined,
  };
  const achados = E.idsDeFotosEm(valor, conhecidos);
  esperar([...achados].sort().join() === 'f1,f2,f3', 'encontra ids em objetos, arrays e níveis fundos, e só os que são fotografias');
  esperar(E.idsDeFotosEm(null, conhecidos).size === 0 && E.idsDeFotosEm('f9', conhecidos).size === 0, 'valores vazios ou desconhecidos não dão nada');
}

// ---------- que fotografias saem ----------
const fotos = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'].map(foto);
const avaliacao = (id, studentId, extra = {}) => ({ id, studentId, type: 'avaliacao', photoIds: [], ...extra });
{
  const removida = [avaliacao('av1', 'a1', { photoIds: ['f1', 'f2'] })];
  const restante = [avaliacao('av2', 'a2', { photoIds: ['f4'] })];
  esperar(ids(E.fotosSoltas(removida, restante, fotos)) === 'f1,f2', 'apagar uma avaliação apaga as fotografias dela');
  esperar(!ids(E.fotosSoltas(removida, restante, fotos)).includes('f4') && !ids(E.fotosSoltas(removida, restante, fotos)).includes('f6'), 'e não toca nas de outras avaliações nem nas que ninguém referia');
}
{
  const removida = [avaliacao('av1', 'a1', { photoIds: ['f1', 'f2'] })];
  esperar(ids(E.fotosSoltas(removida, [avaliacao('av2', 'a2', { photoIds: ['f2'] })], fotos)) === 'f1', 'uma fotografia que outra avaliação também refere fica');
  esperar(ids(E.fotosSoltas(removida, [avaliacao('av2', 'a1', { assessVersoes: [{ v: 1, campos: { photoIds: ['f1'] } }] })], fotos)) === 'f2', 'uma fotografia que ainda está numa versão antiga de outra avaliação fica');
  esperar(ids(E.fotosSoltas(removida, [{ respostas: [{ assinaturaId: 'f1' }] }], fotos)) === 'f2', 'e a que um formulário usa como assinatura');
  esperar(E.fotosSoltas([avaliacao('av1', 'a1')], [], fotos).length === 0, 'uma avaliação sem fotografias não apaga nenhuma');
  esperar(E.fotosSoltas(removida, [], []).length === 0, 'sem fotografias no bloco, não há nada a apagar');
}
{
  // Medições de mobilidade dentro da avaliação, com `fotoIds` próprios.
  const removida = [avaliacao('av1', 'a1', { photoIds: [], medicoes: [{ id: 'm1', fotoIds: ['f3'] }, { id: 'm2', fotoIds: [] }] })];
  esperar(ids(E.fotosSoltas(removida, [], fotos)) === 'f3', 'as fotografias das medições de mobilidade também saem');
}

// ---------- eliminar um aluno ----------
const alunos = [{ id: 'a1', name: 'Rita' }, { id: 'a2', name: 'Rui' }];
const dados = {
  alunos,
  sessions: [
    avaliacao('av1', 'a1', { photoIds: ['f1', 'f2'] }),
    { id: 'au1', studentId: 'a1', kind: 'aula' },
    avaliacao('av2', 'a2', { photoIds: ['f4'] }),
    { id: 'au2', studentId: 'a2', kind: 'aula' },
    { id: 'ev1', studentId: null, kind: 'evento' },
  ],
  treinos: { modelos: [{ id: 'm1', nome: 'Modelo' }], prescricoes: [{ id: 'p1', studentId: 'a1' }, { id: 'p2', studentId: 'a2' }] },
  formularios: { modelos: [], respostas: [{ id: 'r1', studentId: 'a1', assinaturaId: 'f3' }, { id: 'r2', studentId: 'a2', assinaturaId: 'f5' }] },
  fotos,
  definicoes: { timbre: { estudio: 'x' } },
};
const original = JSON.stringify(dados);
const p = E.planoDeEliminacao('a1', dados);
esperar(JSON.stringify(dados) === original, 'o plano não altera os dados que recebe');
esperar(p.alunos.length === 1 && p.alunos[0].id === 'a2', 'sai o aluno');
esperar(p.sessoes.map((s) => s.id).join() === 'av2,au2,ev1', 'saem as aulas e avaliações dele; ficam as de outros e os eventos sem aluno');
esperar(p.programas.map((x) => x.id).join() === 'p2', 'saem os programas de treino dele');
esperar(p.respostas.map((x) => x.id).join() === 'r2', 'saem as respostas a formulários dele');
esperar(ids(p.soltas) === 'f1,f2,f3', 'saem as fotografias das avaliações e a assinatura do formulário dele');
esperar(ids(p.fotos) === 'f4,f5,f6', 'ficam as dos outros alunos e a que ninguém referia');
esperar(p.tem.sessoes === 2 && p.tem.programas === 1 && p.tem.respostas === 1 && p.tem.fotos === 3, 'a contagem diz o que sai');
esperar(dados.treinos.modelos.length === 1, 'os modelos de treino, que não são de ninguém, ficam');
{
  // Uma fotografia partilhada com outro aluno não se apaga.
  const partilhada = { ...dados, sessions: [...dados.sessions, avaliacao('av3', 'a2', { photoIds: ['f1'] })] };
  esperar(ids(E.planoDeEliminacao('a1', partilhada).soltas) === 'f2,f3', 'uma fotografia que outro aluno também refere fica');
}
{
  const semNada = E.planoDeEliminacao('a2', { ...dados, sessions: [], treinos: { prescricoes: [] }, formularios: { respostas: [] }, fotos: [] });
  esperar(semNada.tem.sessoes === 0 && semNada.tem.programas === 0 && semNada.tem.respostas === 0 && semNada.tem.fotos === 0 && semNada.alunos.length === 1, 'um aluno sem mais nada: só sai o aluno');
  const semCampos = E.planoDeEliminacao('a1', { alunos, sessions: [], treinos: {}, formularios: {}, fotos: [], definicoes: null });
  esperar(semCampos.programas.length === 0 && semCampos.respostas.length === 0, 'blocos sem lista (conta nova) não rebentam');
}

console.log(falhas === 0 ? '\nTUDO OK' : `\n${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
