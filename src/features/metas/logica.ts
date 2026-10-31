/*
 * Metas, check-in e exportação por aluno. Sem React nem Supabase
 * (scripts/validar-modulos-4.mjs).
 */
const num = (v) => { const x = parseFloat(String(v == null ? '' : v).replace(',', '.')); return Number.isFinite(x) ? x : null; };

// Funciona nos dois sentidos: uma meta pode ser subir ou descer. Sem dados, não há número.
export function progressoDaMeta(m) {
  const base = num(m.base); const alvo = num(m.alvo); const atual = num(m.atual);
  if (base === null || alvo === null || atual === null || base === alvo) return null;
  return Math.max(0, Math.min(100, Math.round(((atual - base) / (alvo - base)) * 100)));
}

// A regra é esta e está escrita: destaca para o treinador olhar, não muda o treino.
export const REGRA_CHECKIN = { dorMinima: 4, energiaMaxima: 2, sonoMaximo: 2, stressMinimo: 5 };
export function pontosDoCheckin(c, regra = REGRA_CHECKIN) {
  const v = (k) => Number(c && c[k]);
  const pontos = [];
  if (v('dor') >= regra.dorMinima) pontos.push('dor');
  if (c && c.energia !== undefined && v('energia') <= regra.energiaMaxima) pontos.push('energia');
  if (c && c.sono !== undefined && v('sono') <= regra.sonoMaximo) pontos.push('sono');
  if (v('stress') >= regra.stressMinimo) pontos.push('stress');
  return pontos;
}

// O que um aluno tem na conta, para um pedido de portabilidade. Nada de outros alunos.
export function dadosDoAluno({ aluno, sessoes, prescricoes, execucoes, respostas, modulos }, agora) {
  const id = aluno.id;
  const so = (l, chave = 'studentId') => (l || []).filter((x) => x && x[chave] === id);
  const m = modulos || {};
  return {
    formato: 'ptmanager-dados-do-aluno',
    versao: 1,
    geradoEm: agora,
    aluno,
    agenda: so(sessoes),
    programas: so(prescricoes),
    sessoesDeTreino: execucoes || [],
    formularios: so(respostas),
    avaliacoes: so(m.avaliacoes && m.avaliacoes.registos),
    metas: so(m.metas && m.metas.itens),
    faturas: so(m.planos && m.planos.faturas),
    contratosAceites: so(m.planos && m.planos.aceites),
    documentos: so(m.documentos && m.documentos.itens).map(({ path, ...resto }) => resto),
    pontos: so(m.pontos && m.pontos.movimentos),
    resultadosPartilhados: so(m.progresso && m.progresso.publicacoes),
  };
}
