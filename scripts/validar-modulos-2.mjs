/*
 * Segunda parte de scripts/validar-modulos.mjs: os módulos das fases seguintes.
 * Corre-se a partir desse ficheiro.
 */
export async function correr(esperar0) {
  let falhas = 0;
  const esperar = (c, m) => { if (!c) falhas += 1; esperar0(true, ''); if (c) console.log('ok: ' + m); else console.log('FALHA: ' + m); };
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  let n = 0;
  const gerarId = () => `x${(n += 1)}`;

  // ---------- avaliações ----------
  const A = await import('../src/features/avaliacoes/logica.ts');
  esperar(A.resultadoDeTentativas(['10', '12,5', ''], 'melhor') === 12.5, 'a melhor tentativa, com vírgula decimal');
  esperar(A.resultadoDeTentativas(['10', '20'], 'media') === 15, 'a média das tentativas');
  esperar(A.resultadoDeTentativas(['', 'x']) === null, 'sem números, não há resultado');
  esperar(A.assimetria(10, 8) === 20 && A.assimetria(null, 8) === null, 'a diferença entre lados só existe com os dois');
  esperar(A.assimetria(0, 0) === 0, 'dois zeros não dividem por zero');
  esperar(A.foraDoPlausivel({ min: 0, max: 100 }, '150') && !A.foraDoPlausivel({ min: 0, max: 100 }, '50'), 'um valor fora do plausível é assinalado');
  const base = { id: 'r', studentId: 'a', estado: 'rascunho', data: '2026-10-01', valores: {} };
  const c = { quem: 'T', agora: 'ag', gerarId };
  const r1 = A.gravarRegisto(null, base, { ...c, estado: 'rascunho' }).registo;
  const r2 = A.gravarRegisto(r1, { ...r1, observacoes: 'a' }, { ...c, estado: 'rascunho' }).registo;
  esperar(r2.versoes.length === 0, 'rascunho sobre rascunho não cria revisão');
  const r3 = A.gravarRegisto(r2, { ...r2 }, { ...c, estado: 'final' }).registo;
  esperar(r3.estado === 'final' && r3.versoes.length === 1 && r3.versoes[0].acao === 'Finalizada', 'finalizar cria uma revisão');
  const semMotivo = A.gravarRegisto(r3, { ...r3 }, { ...c, estado: 'final' });
  esperar(!semMotivo.ok && /motivo/.test(semMotivo.erro), 'alterar um final exige motivo');
  const r4 = A.gravarRegisto(r3, { ...r3, observacoes: 'novo' }, { ...c, estado: 'final', motivo: 'erro' }).registo;
  esperar(r4.versoes.length === 2 && r4.versoes[1].motivo === 'erro' && r4.versoes[1].dados.observacoes === 'a', 'a revisão guarda o que estava antes e o motivo');
  const r5 = A.reporRegisto(r4, 2, c);
  esperar(r5.observacoes === 'a' && r5.versoes.length === 3 && r5.estado === 'final', 'repor é mais uma revisão, e nada se apaga');
  const lista = [{ id: 'a1', studentId: 'a', tipo: 't', estado: 'final', data: '2026-01-01' }, { id: 'a2', studentId: 'a', tipo: 't', estado: 'rascunho', data: '2026-02-01' }, { id: 'a3', studentId: 'b', tipo: 't', estado: 'final', data: '2026-02-02' }];
  esperar(A.registoAnterior(lista, { id: 'n', studentId: 'a', tipo: 't', data: '2026-03-01' }).id === 'a1', 'compara com o último final do mesmo aluno, nunca com outro');
  const mod = { campos: [{ id: 'p', rotulo: 'P', tipo: 'numero', regra: 'melhor' }, { id: 'l', rotulo: 'L', tipo: 'escala', lados: true }] };
  const cmp = A.comparar(mod, { valores: { p: { unico: ['12'] }, l: { d: ['3'], e: ['2'] } } }, { valores: { p: { unico: ['10'] }, l: { d: ['1'] } } });
  esperar(cmp[0].dif === 2 && cmp[1].difD === 2 && cmp[1].difE === null && cmp[1].assimetria === 33, 'a comparação não inventa o que falta');
  let recs = A.criarRecorrencia([], { registoId: 'r', studentId: 'a', tipo: 't', data: '2026-11-01', intervaloDias: '30' });
  recs = A.criarRecorrencia(recs, { registoId: 'r', studentId: 'a', tipo: 't', data: '2026-11-02', intervaloDias: '30' });
  esperar(recs.length === 1 && recs[0].proxima === '2026-11-02', 'repetir a ação não duplica a recorrência');
  esperar(A.concluirRecorrencia(recs[0], '2026-11-02').proxima === '2026-12-02', 'concluir marca a seguinte');
  esperar(A.pendentes(recs, '2026-11-10')[0].atrasada === true, 'uma recorrência passada fica atrasada');
  esperar(A.anguloEmB({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }) === 90, 'ângulo reto no ponto do meio');
  esperar(A.anguloEmB({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, 0.5) === 90 && A.inclinacao({ x: 0, y: 0 }, { x: 10, y: 10 }, 0.5) === 63.4, 'o aspeto da imagem entra na conta');
  esperar(A.inclinacao({ x: 0, y: 5 }, { x: 10, y: 5 }) === 0, 'uma linha horizontal tem inclinação 0');
  esperar(A.medirAngulo([{ x: 1, y: 1 }]) === null, 'um ponto só não mede nada');
  esperar(A.MODELOS_BASE.every((m) => !/fms|functional movement/i.test(JSON.stringify(m))), 'nenhum modelo usa o nome FMS');
  void igual;

  const extra = await import('./validar-modulos-3.mjs').catch((e) => { if (e.code === 'ERR_MODULE_NOT_FOUND') return null; throw e; });
  if (extra) falhas += await extra.correr(esperar0);
  return falhas;
}
