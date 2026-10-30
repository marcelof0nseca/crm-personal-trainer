/*
 * Lógica pura da prescrição: validar o RIR alvo e clonar um programa. Sem React
 * nem Supabase, para se testar sozinha (scripts/validar-prescricao.mjs).
 */

const NUMERO_RIR = '(?:10|\\d)';
const RIR_VALIDO = new RegExp(`^(${NUMERO_RIR})(?:\\s*-\\s*(${NUMERO_RIR}))?$`);

// Um valor (2) ou uma faixa (1-3), de 0 a 10. Vazio é válido: o campo é opcional.
export function rirValido(valor) {
  const texto = String(valor === undefined || valor === null ? '' : valor).trim();
  if (!texto) return true;
  const m = texto.match(RIR_VALIDO);
  if (!m) return false;
  return m[2] === undefined || Number(m[1]) <= Number(m[2]);
}

// Cópia profunda com ids novos: duas prescrições nunca partilham listas, senão
// editar uma mexia na outra. Os ids de `ex.grupo` mantêm-se porque só têm
// sentido dentro do próprio treino, e `grupos` é copiado com eles.
export function clonarTreinosCom(lista, gerarId) {
  return (lista || []).map((t) => ({
    ...t,
    id: gerarId(),
    grupos: t.grupos ? JSON.parse(JSON.stringify(t.grupos)) : t.grupos,
    exercicios: (t.exercicios || []).map((ex) => ({
      ...ex,
      id: gerarId(),
      metodoParams: ex.metodoParams ? { ...ex.metodoParams } : ex.metodoParams,
      linhas: Array.isArray(ex.linhas) ? ex.linhas.map((l) => ({ ...l })) : ex.linhas,
    })),
  }));
}

// O período recomeça: as datas do original não dizem nada sobre quando a cópia
// vai correr. Uma cópia nasce ativa, mesmo que o original esteja arquivado.
export function clonarPrograma(prescricao, { studentId, gerarId, hoje, agora }) {
  const { arquivado, ...resto } = prescricao;
  const mesmoAluno = studentId === prescricao.studentId;
  return {
    ...resto,
    id: gerarId(),
    studentId,
    nome: mesmoAluno ? `${prescricao.nome || 'Programa'} (cópia)` : (prescricao.nome || 'Programa'),
    inicio: hoje,
    fim: '',
    treinos: clonarTreinosCom(prescricao.treinos, gerarId),
    criadoEm: agora,
  };
}
