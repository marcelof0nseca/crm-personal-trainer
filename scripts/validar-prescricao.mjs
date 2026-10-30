/*
 * Confere src/data/prescricao.ts: o RIR alvo e a clonagem de um programa.
 *
 * Uso: node scripts/validar-prescricao.mjs
 */
import { clonarPrograma, clonarTreinosCom, rirValido } from '../src/data/prescricao.ts';
import { camposRealizaveis, valoresSugeridos } from '../src/data/sessoes.ts';

let falhas = 0;
function esperar(condicao, mensagem) {
  if (condicao) console.log('ok: ' + mensagem);
  else { falhas += 1; console.log('FALHA: ' + mensagem); }
}

// ---------- RIR ----------
for (const v of ['', null, undefined, 0, '0', '2', 10, '10', '1-3', '1 - 3', '2-2', ' 3 ']) {
  esperar(rirValido(v), `RIR ${JSON.stringify(v)} é válido`);
}
for (const v of ['11', '-1', '3-1', '1-11', 'abc', '1-', '2,5', '1-2-3']) {
  esperar(!rirValido(v), `RIR ${JSON.stringify(v)} é recusado`);
}

// O alvo e o realizado continuam separados: uma faixa não é o que se fez.
esperar(camposRealizaveis(['reps', 'carga'], { rir: '1-3' }).includes('rir'), 'uma série com RIR alvo pede o RIR realizado');
esperar(!('rir' in valoresSugeridos({ rir: '1-3' }, ['rir'])), 'uma faixa de RIR não se preenche sozinha no registo');
esperar(valoresSugeridos({ rir: 0 }, ['rir']).rir === '0', 'um RIR 0 exato sugere-se como 0');

// ---------- clonar ----------
let n = 0;
const gerarId = () => `novo${(n += 1)}`;
const original = {
  id: 'p1', studentId: 'a1', nome: 'Força', objetivo: 'Base', inicio: '2026-01-01', fim: '2026-03-01',
  arquivado: true, origem: { ficha: 'PTM-0001', catalogo: 'v1' }, criadoEm: '2026-01-01T00:00:00Z',
  treinos: [{
    id: 't1', nome: 'Treino A', notas: 'nota', grupos: { g1: { metodo: 'bi_set', params: { pausaRonda: '60' } } },
    exercicios: [
      { id: 'e1', nome: 'Supino', grupo: 'g1', metodo: 'Drop-set', metodoParams: { quedas: '2' }, linhas: [{ id: 'l1', reps: '10', rir: 0 }] },
      { id: 'e2', nome: 'Remada', grupo: 'g1', linhas: [{ id: 'l2', reps: '8', rir: '1-3' }] },
    ],
  }],
};
const antes = JSON.stringify(original);
const opcoes = { gerarId, hoje: '2026-10-30', agora: '2026-10-30T10:00:00Z' };
const copia = clonarPrograma(original, { ...opcoes, studentId: 'a1' });
const outro = clonarPrograma(original, { ...opcoes, studentId: 'a2' });

esperar(copia.id !== original.id && copia.treinos[0].id !== 't1' && copia.treinos[0].exercicios[0].id !== 'e1', 'programa, treino e exercício têm ids novos');
esperar(copia.nome === 'Força (cópia)', 'no mesmo aluno, o nome diz que é cópia');
esperar(outro.nome === 'Força' && outro.studentId === 'a2', 'noutro aluno, mantém o nome e muda de dono');
esperar(!('arquivado' in copia), 'a cópia nasce ativa, mesmo de um programa arquivado');
esperar(copia.inicio === '2026-10-30' && copia.fim === '' && copia.criadoEm === '2026-10-30T10:00:00Z', 'o período e a data de criação recomeçam');
esperar(copia.origem.ficha === 'PTM-0001', 'a proveniência mantém-se');
esperar(copia.treinos[0].exercicios[0].linhas[0].rir === 0, 'um RIR 0 sobrevive à cópia');
esperar(copia.treinos[0].exercicios[1].grupo === 'g1' && copia.treinos[0].grupos.g1.metodo === 'bi_set', 'a combinação continua ligada dentro da cópia');

copia.treinos[0].exercicios[0].linhas[0].reps = '99';
copia.treinos[0].exercicios[0].metodoParams.quedas = '9';
copia.treinos[0].grupos.g1.params.pausaRonda = '9';
copia.treinos[0].exercicios.push({ id: 'x' });
esperar(JSON.stringify(original) === antes, 'editar a cópia não altera o original');
esperar(outro.treinos[0].exercicios.length === 2 && outro.treinos[0].exercicios[0].linhas[0].reps === '10', 'duas cópias não partilham nada');

esperar(clonarTreinosCom(undefined, gerarId).length === 0, 'um programa sem treinos não rebenta');
esperar(clonarPrograma({ id: 'p', studentId: 'a' }, { ...opcoes, studentId: 'a' }).treinos.length === 0, 'dados antigos incompletos não rebentam');

console.log(falhas === 0 ? '\nTUDO OK' : `\n${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
