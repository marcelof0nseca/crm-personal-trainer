/*
 * Pontos, conquistas, desafios e satisfação. O registo de pontos só cresce: corrigir
 * é outro movimento. Cada movimento tem chave própria e não conta duas vezes.
 */
export const REGRAS_PONTOS = { treino: 10, avaliacao: 30, formulario: 15, renovacao: 50, indicacao: 100, sequencia7: 25, limitePorDia: 30 };

export function creditar(movimentos, { chave, studentId, pontos, motivo, em, gerarId, expira, limitePorDia }) {
  if ((movimentos || []).some((m) => m.chave === chave)) return movimentos;
  if (limitePorDia) {
    const dia = String(em).slice(0, 10);
    const hoje = (movimentos || []).filter((m) => m.studentId === studentId && m.pontos > 0 && String(m.em).slice(0, 10) === dia).reduce((s, m) => s + m.pontos, 0);
    if (hoje + pontos > limitePorDia) return movimentos;
  }
  return [...(movimentos || []), { id: gerarId(), chave, studentId, pontos, motivo, em, expira: expira || null }];
}

// Os que expiraram deixam de contar sem se apagar nada.
export function saldo(movimentos, studentId, hoje) {
  let creditos = (movimentos || []).filter((m) => m.studentId === studentId && m.pontos > 0).sort((a, b) => String(a.em).localeCompare(String(b.em))).map((m) => ({ ...m, resto: m.pontos }));
  let debitos = (movimentos || []).filter((m) => m.studentId === studentId && m.pontos < 0).reduce((s, m) => s - m.pontos, 0);
  creditos = creditos.map((c) => { const u = Math.min(c.resto, debitos); debitos -= u; return { ...c, resto: c.resto - u }; });
  return creditos.filter((c) => !c.expira || c.expira >= hoje).reduce((s, c) => s + c.resto, 0);
}

// Quantas semanas seguidas, a acabar nesta ou na anterior, tiveram treino.
export function sequenciaSemanas(datas, hoje) {
  const segunda = (iso) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
  const semanas = new Set((datas || []).map(segunda));
  let atual = segunda(hoje);
  const voltar = (iso) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - 7); return d.toISOString().slice(0, 10); };
  if (!semanas.has(atual)) atual = voltar(atual);
  let n = 0;
  while (semanas.has(atual)) { n += 1; atual = voltar(atual); }
  return n;
}

export const CONQUISTAS = [
  { id: 'primeiro', rotulo: 'Primeiro treino', ok: (x) => x.treinos >= 1 },
  { id: 'dez', rotulo: '10 treinos', ok: (x) => x.treinos >= 10 },
  { id: 'cinquenta', rotulo: '50 treinos', ok: (x) => x.treinos >= 50 },
  { id: 'quatro', rotulo: '4 semanas seguidas', ok: (x) => x.sequencia >= 4 },
];
export const conquistasDe = (dados) => CONQUISTAS.filter((c) => c.ok(dados)).map((c) => c.id);

// Pontos dos treinos: só sessões concluídas e com séries feitas. A chave é a sessão.
export function pontosDosTreinos(movimentos, studentId, sessoes, { regras, gerarId }) {
  let lista = movimentos;
  (sessoes || []).filter((s) => s.estado !== 'interrompida' && (s.itens || []).some((i) => (i.series || []).some((x) => x.feito))).forEach((s) => {
    lista = creditar(lista, { chave: `treino:${s.id}`, studentId, pontos: regras.treino, motivo: 'Treino concluído', em: `${s.data}T12:00:00Z`, gerarId, limitePorDia: regras.limitePorDia });
  });
  return lista;
}

export function resgatar(movimentos, recompensa, { studentId, hoje, em, gerarId, resgates = [] }) {
  if (!recompensa.ativa) return { ok: false, erro: 'Esta recompensa não está disponível.' };
  if (recompensa.validade && recompensa.validade < hoje) return { ok: false, erro: 'Esta recompensa já não é válida.' };
  const usados = resgates.filter((r) => r.recompensaId === recompensa.id && r.estado !== 'revertido').length;
  if (recompensa.stock !== '' && recompensa.stock != null && usados >= Number(recompensa.stock)) return { ok: false, erro: 'Esta recompensa esgotou.' };
  if (saldo(movimentos, studentId, hoje) < recompensa.pontos) return { ok: false, erro: 'Pontos insuficientes.' };
  const id = gerarId();
  return {
    ok: true,
    resgate: { id, recompensaId: recompensa.id, studentId, em, estado: 'resgatado' },
    movimentos: [...movimentos, { id: gerarId(), chave: `resgate:${id}`, studentId, pontos: -recompensa.pontos, motivo: `Resgate: ${recompensa.nome}`, em }],
  };
}

export function reverterResgate(movimentos, resgate, recompensa, { em, gerarId }) {
  return creditar(movimentos, { chave: `reversao:${resgate.id}`, studentId: resgate.studentId, pontos: recompensa.pontos, motivo: `Reversão: ${recompensa.nome}`, em, gerarId });
}

/* ---------------------------- desafios ---------------------------- */

export const ESTADOS_DESAFIO = { rascunho: 'Rascunho', publicado: 'Publicado', em_curso: 'Em curso', encerrado: 'Encerrado', inativo: 'Inativo', arquivado: 'Arquivado' };
export function estadoDoDesafio(d, hoje) {
  if (['rascunho', 'inativo', 'arquivado'].includes(d.estado)) return d.estado;
  if (d.fim && d.fim < hoje) return 'encerrado';
  if (d.inicio && d.inicio <= hoje) return 'em_curso';
  return 'publicado';
}

// A partir das entradas públicas. Cada participante conta uma vez por etapa.
export function acompanhamento(desafio, entradas) {
  const doDesafio = (entradas || []).filter((e) => e.ref === desafio.id);
  const inscricoes = new Map();
  doDesafio.filter((e) => e.tipo === 'desafio_inscricao').forEach((e) => { if (!inscricoes.has(e.dados.participante)) inscricoes.set(e.dados.participante, e); });
  const conclusoes = new Map();
  doDesafio.filter((e) => e.tipo === 'desafio_conclusao').forEach((e) => {
    const p = e.dados.participante;
    if (!inscricoes.has(p)) return;
    if (!conclusoes.has(p)) conclusoes.set(p, new Set());
    conclusoes.get(p).add(e.dados.etapa);
  });
  const etapas = (desafio.etapas || []).length;
  const participantes = [...inscricoes.entries()].map(([id, e]) => ({ id, nome: e.dados.nome, email: e.dados.email, telefone: e.dados.telefone, feitas: conclusoes.get(id)?.size || 0, entradaId: e.id }));
  const concluiram = participantes.filter((p) => etapas > 0 && p.feitas >= etapas).length;
  return { participantes, concluiram, adesao: participantes.length ? Math.round((participantes.filter((p) => p.feitas > 0).length / participantes.length) * 100) : null };
}

/* ---------------------------- satisfação ---------------------------- */

// NPS com o denominador à vista. Menos de 5 respostas não mostra a nota: identificava
// quem respondeu.
export function nps(respostas) {
  const notas = (respostas || []).map((r) => Number(r.nota)).filter((n) => Number.isInteger(n) && n >= 0 && n <= 10);
  if (notas.length < 5) return { respostas: notas.length, nps: null };
  const p = notas.filter((n) => n >= 9).length; const d = notas.filter((n) => n <= 6).length;
  return { respostas: notas.length, promotores: p, detratores: d, nps: Math.round(((p - d) / notas.length) * 100) };
}
export const notaBaixa = (r, limite = 6) => Number(r.nota) <= limite;
