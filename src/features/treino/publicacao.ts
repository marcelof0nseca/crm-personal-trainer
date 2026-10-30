/*
 * Estado, versões e ciclos de um programa. Um programa sem estes campos é um
 * programa publicado: é assim que os que já existem continuam a aparecer ao aluno.
 * Sessões já realizadas guardam a sua própria cópia, por isso nada disto as altera.
 */
export const MAX_VERSOES_PROGRAMA = 5;

export const ESTADOS_PROGRAMA = {
  rascunho: { rotulo: 'Rascunho', ajuda: 'O aluno ainda não o vê.' },
  programado: { rotulo: 'Programado', ajuda: 'O aluno vê-o a partir da data de início.' },
  publicado: { rotulo: 'Publicado', ajuda: 'O aluno vê-o.' },
  concluido: { rotulo: 'Concluído', ajuda: 'Terminou. Continua no histórico do aluno.' },
  arquivado: { rotulo: 'Arquivado', ajuda: 'Fora da lista do aluno.' },
};

export function estadoDoPrograma(p, hoje) {
  if (p.arquivado) return 'arquivado';
  if (p.estadoPublicacao === 'rascunho') return 'rascunho';
  if (p.estadoPublicacao === 'concluido') return 'concluido';
  if (p.inicio && p.inicio > hoje && p.estadoPublicacao === 'publicado') return 'programado';
  return 'publicado';
}

// O que o aluno pode ver: publicado e com a data de início já alcançada.
export function visivelAoAluno(p, hoje) {
  const estado = estadoDoPrograma(p, hoje);
  if (estado !== 'publicado') return false;
  if (p.extra && p.extra.validade && p.extra.validade < hoje) return false;
  return true;
}

// Cada publicação guarda uma cópia do que foi publicado, com o resumo escrito
// pelo treinador. É dessa cópia que se pode repor mais tarde.
export function publicarPrograma(p, { quem, resumo, agora }) {
  const numero = (p.versaoNumero || 0) + 1;
  const texto = String(resumo || '').slice(0, 300);
  const copia = { numero, em: agora, quem, resumo: texto, treinos: JSON.parse(JSON.stringify(p.treinos || [])) };
  return { ...p, estadoPublicacao: 'publicado', versaoNumero: numero, publicadoEm: agora, ultimaAlteracao: texto, versoes: [...(p.versoes || []), copia].slice(-MAX_VERSOES_PROGRAMA) };
}

// Repor é mais uma publicação: o histórico nunca perde a versão que estava em vigor.
export function reporVersao(p, numero, { quem, agora }) {
  const alvo = (p.versoes || []).find((v) => v.numero === numero);
  if (!alvo) return p;
  return publicarPrograma({ ...p, treinos: JSON.parse(JSON.stringify(alvo.treinos)) }, { quem, resumo: `Reposta a versão ${numero}`, agora });
}

const diasEntre = (de, ate) => Math.floor((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86400000);

// Semana do programa, a contar de 1. Antes do início ou sem início: null.
export function semanaDoPrograma(p, hoje) {
  if (!p.inicio || p.inicio > hoje) return null;
  return Math.floor(diasEntre(p.inicio, hoje) / 7) + 1;
}

// A fase em curso, a partir da duração de cada uma. Depois da última: null.
export function faseAtual(p, hoje) {
  const semana = semanaDoPrograma(p, hoje);
  if (!semana) return null;
  let inicio = 1;
  for (const fase of p.fases || []) {
    const n = Math.max(1, Number(fase.semanas) || 1);
    if (semana < inicio + n) return { fase, semanaNaFase: semana - inicio + 1, semana };
    inicio += n;
  }
  return null;
}

// Carga planeada para uma semana. A regra é só aritmética visível, e uma carga
// que não seja um número simples ("elástico azul") fica como está.
export function cargaPlaneada(carga, regra, semanas) {
  const m = String(carga == null ? '' : carga).trim().replace(',', '.').match(/^(\d+(?:\.\d+)?)\s*(kg)?$/i);
  const n = Math.max(0, Number(semanas) || 0);
  const valor = Number(regra && regra.valor);
  if (!m || !regra || !Number.isFinite(valor) || n === 0) return carga;
  const base = parseFloat(m[1]);
  let total = base;
  if (regra.tipo === 'absoluta') total = base + valor * n;
  else if (regra.tipo === 'percentagem') total = base * (1 + (valor / 100) * n);
  else return carga;
  const arredondado = Math.round(total * 4) / 4;
  return `${String(arredondado).replace('.', ',')}${m[2] ? ' kg' : ''}`;
}

export function novaFase(gerarId, n) {
  return { id: gerarId(), nome: `Fase ${n}`, semanas: 4, deload: false, notas: '', progressao: { tipo: 'manual', valor: '' } };
}
