/*
 * Registo dos módulos novos que vivem em `app_data`, uma linha por módulo
 * (`modulo:<nome>`). Um módulo novo entra aqui, e só por isso passa a estar na
 * cópia de segurança, no restauro, no «Apagar todos os dados» e na eliminação
 * de um aluno. Sem React nem Supabase (scripts/validar-modulos.mjs).
 *
 * Histórico que cresce sem fim (notificações, pagamentos) não vive aqui: vai
 * para tabelas próprias, porque cada gravação reescreve a linha inteira.
 */
export const PREFIXO_MODULO = 'modulo:';
export const chaveModulo = (nome) => `${PREFIXO_MODULO}${nome}`;

const lista = (campo = 'itens') => ({ [campo]: [] });
// Tira de `valor[campo]` o que pertence ao aluno.
const semAluno = (campo = 'itens', chave = 'studentId') => (valor, id) => ({
  ...valor,
  [campo]: (valor[campo] || []).filter((x) => x[chave] !== id),
});
const nenhum = (valor) => valor;

export const MODULOS = {
  presets: { vazio: lista(), removerAluno: nenhum },
  avaliacoes: { vazio: { registos: [], modelos: [], recorrencias: [] }, removerAluno: (v, id) => ({ ...v, registos: (v.registos || []).filter((r) => r.studentId !== id), recorrencias: (v.recorrencias || []).filter((r) => r.studentId !== id) }) },
  crm: { vazio: { leads: [], segmentos: [], grupos: [], ligacaoRegisto: null, lixeira: [] }, removerAluno: (v, id) => ({ ...v, grupos: (v.grupos || []).map((g) => ({ ...g, alunos: (g.alunos || []).filter((a) => a !== id) })) }) },
  tarefas: { vazio: lista(), removerAluno: semAluno() },
  automacoes: { vazio: { regras: [], registo: [] }, removerAluno: nenhum },
  mensagens: { vazio: { modelos: [], campanhas: [] }, removerAluno: nenhum },
  retencao: { vazio: { regras: null, instantaneos: [], acoes: [] }, removerAluno: (v, id) => ({ ...v, acoes: (v.acoes || []).filter((a) => a.studentId !== id) }) },
  progresso: { vazio: lista('publicacoes'), removerAluno: semAluno('publicacoes') },
  documentos: { vazio: lista(), removerAluno: semAluno() },
  planos: { vazio: { modelos: [], contratos: [], faturas: [], modelosContrato: [] }, removerAluno: (v, id) => ({ ...v, contratos: (v.contratos || []).filter((c) => c.studentId !== id), faturas: (v.faturas || []).filter((f) => f.studentId !== id) }) },
  vendas: { vazio: { pagina: null, depoimentos: [], indicacoes: [] }, removerAluno: nenhum },
  desafios: { vazio: lista(), removerAluno: nenhum },
  pontos: { vazio: { regras: null, movimentos: [], recompensas: [], resgates: [], ativo: false }, removerAluno: (v, id) => ({ ...v, movimentos: (v.movimentos || []).filter((m) => m.studentId !== id), resgates: (v.resgates || []).filter((r) => r.studentId !== id) }) },
  conteudos: { vazio: { favoritos: [], templates: [] }, removerAluno: nenhum },
  satisfacao: { vazio: { pesquisas: [], respostas: [] }, removerAluno: semAluno('respostas') },
  recursos: { vazio: { locais: [], turmas: [], politica: null, listaEspera: [], pedidos: [], lembretes: [] }, removerAluno: (v, id) => ({ ...v, turmas: (v.turmas || []).map((t) => ({ ...t, alunos: (t.alunos || []).filter((a) => a !== id) })), listaEspera: (v.listaEspera || []).filter((x) => x.studentId !== id), pedidos: (v.pedidos || []).filter((x) => x.studentId !== id), lembretes: (v.lembretes || []).filter((x) => x.studentId !== id) }) },
};

export const NOMES_MODULOS = Object.keys(MODULOS);

export function vazioDe(nome) {
  return JSON.parse(JSON.stringify(MODULOS[nome].vazio));
}

// Lê o que veio da base de dados sem confiar nele: o que falta vem do vazio, e o
// que tem a forma errada não rebenta o ecrã.
export function normalizarModulo(nome, bruto) {
  const vazio = vazioDe(nome);
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return vazio;
  const saida = { ...vazio, ...bruto };
  Object.keys(vazio).forEach((k) => {
    if (Array.isArray(vazio[k]) && !Array.isArray(saida[k])) saida[k] = [];
  });
  return saida;
}

// O que muda em cada módulo ao eliminar um aluno. Só devolve os que mudam, para
// não se regravar o que não tem nada dele.
export function modulosAoEliminarAluno(valores, idAluno) {
  const mudancas = {};
  Object.entries(valores).forEach(([nome, valor]) => {
    const def = MODULOS[nome];
    if (!def) return;
    const novo = def.removerAluno(normalizarModulo(nome, valor), idAluno);
    if (JSON.stringify(novo) !== JSON.stringify(normalizarModulo(nome, valor))) mudancas[nome] = novo;
  });
  return mudancas;
}

// Fila simples por módulo: duas gravações seguidas liam o mesmo carimbo.
export function nomeDaChave(chave) {
  return String(chave || '').startsWith(PREFIXO_MODULO) ? chave.slice(PREFIXO_MODULO.length) : null;
}
