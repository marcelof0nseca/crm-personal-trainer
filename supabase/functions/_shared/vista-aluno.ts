// O que o aluno pode ver, a partir dos blocos da conta do treinador. Sem Deno nem rede,
// para se testar sozinho (scripts/validar-modulos-4.mjs): é esta função que decide o
// que sai, por isso um campo novo nunca sai sem entrar aqui pelo nome.
//
// As regras copiadas de src/features são as mesmas, conferidas lá também: o bundler
// das Edge Functions não sai de supabase/functions.

export function estadoDoPrograma(p, hoje) {
  if (p.arquivado) return 'arquivado';
  if (p.estadoPublicacao === 'rascunho') return 'rascunho';
  if (p.estadoPublicacao === 'concluido') return 'concluido';
  if (p.inicio && p.inicio > hoje && p.estadoPublicacao === 'publicado') return 'programado';
  return 'publicado';
}

export function visivelAoAluno(p, hoje) {
  if (estadoDoPrograma(p, hoje) !== 'publicado') return false;
  if (p.extra && p.extra.validade && p.extra.validade < hoje) return false;
  return true;
}

const subtotalDe = (itens) => (itens || []).reduce((s, i) => s + Math.round(Number(i.centimos) || 0) * (Number(i.quantidade) || 1), 0);
export function totalDaFatura(f) {
  const subtotal = subtotalDe(f.itens);
  const base = subtotal - Math.round((subtotal * (f.descontoBp || 0)) / 10000);
  return base + Math.round((base * (f.impostoBp || 0)) / 10000);
}
export function pagoDaFatura(f) {
  return (f.pagamentos || []).filter((p) => p.estado === 'confirmado').reduce((s, p) => s + p.centimos, 0) - (f.reembolsos || []).reduce((s, r) => s + r.centimos, 0);
}
export function estadoDaFatura(f, hoje) {
  if (['rascunho', 'anulada', 'incobravel'].includes(f.estado)) return f.estado;
  const total = totalDaFatura(f);
  const pago = pagoDaFatura(f);
  if ((f.reembolsos || []).length > 0 && pago <= 0) return 'reembolsada';
  if (total > 0 && pago >= total) return 'paga';
  if (pago > 0) return 'parcial';
  if (f.vencimento && f.vencimento < hoje) return 'vencida';
  return 'aberta';
}
export function acessoRestrito(politica, faturas, hoje) {
  if (!politica || !politica.restringir) return false;
  const margem = Number(politica.toleranciaDias) || 0;
  return (faturas || []).some((f) => {
    if (f.override || estadoDaFatura(f, hoje) !== 'vencida') return false;
    const limite = new Date(`${f.vencimento}T00:00:00Z`); limite.setUTCDate(limite.getUTCDate() + margem);
    return limite.toISOString().slice(0, 10) < hoje;
  });
}

const DIA_MS = 86400000;
export function ocorrenciaAtual(c, agoraMs) {
  if (c.estado !== 'ativa') return null;
  const inicio = Date.parse(c.enviarEm);
  if (!Number.isFinite(inicio) || inicio > agoraMs) return null;
  if (!c.recorrencia || c.recorrencia === 'nenhuma') return { id: `${c.id}:0`, em: c.enviarEm };
  const dias = Math.floor((agoraMs - inicio) / DIA_MS);
  for (let d = dias; d >= Math.max(0, dias - 7); d -= 1) {
    if (c.recorrencia === 'diaria' || (c.recorrencia === 'semanal' && d % 7 === 0)) return { id: `${c.id}:${d}`, em: new Date(inicio + d * DIA_MS).toISOString() };
  }
  return null;
}

export function campanhaParaAluno(c, alunoId, aluno, grupos) {
  if (c.alvo === 'todos') return aluno.active !== false;
  if (c.alvo === 'grupo') return (grupos || []).some((g) => g.id === c.grupoId && (g.alunos || []).includes(alunoId));
  return (c.alunos || []).includes(alunoId);
}

export function saldoDePontos(movimentos, alunoId, hoje) {
  const meus = (movimentos || []).filter((m) => m.studentId === alunoId);
  let debitos = meus.filter((m) => m.pontos < 0).reduce((s, m) => s - m.pontos, 0);
  return meus.filter((m) => m.pontos > 0).sort((a, b) => String(a.em).localeCompare(String(b.em))).reduce((s, c) => {
    const usado = Math.min(c.pontos, debitos); debitos -= usado;
    return !c.expira || c.expira >= hoje ? s + (c.pontos - usado) : s;
  }, 0);
}

// Só o id de um link do YouTube dos exercícios dos programas dele, confirmado de novo.
// Os ficheiros carregados continuam a ser só para o treinador.
function videosDosProgramas(treinos, prescricoes) {
  const ids = new Set(prescricoes.flatMap((p) => (p.treinos || []).flatMap((t) => (t.exercicios || []).map((e) => e.exercicioId))).filter(Boolean));
  const extra = (treinos && treinos.bibliotecaExtra) || [];
  const edicoes = (treinos && treinos.bibliotecaEdicoes) || {};
  const valido = (v) => /^[A-Za-z0-9_-]{11}$/.test(String(v || ''));
  const daExtra = extra.filter((e) => e && ids.has(e.id) && valido(e.videoYoutube)).map((e) => ({ id: e.id, videoYoutube: e.videoYoutube }));
  const dasEdicoes = Object.entries(edicoes).filter(([id, e]) => ids.has(id) && e && valido(e.videoYoutube)).map(([id, e]) => ({ id, videoYoutube: e.videoYoutube }));
  return [...daExtra, ...dasEdicoes];
}

const somarDias = (iso, n) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

// `via` é 'token' ou 'conta'. O link sem conta vê o programa, a agenda e os avisos;
// faturas, documentos e formulários exigem conta, porque um link reencaminha-se.
export function vistaDoAluno(blocos, alunoId, { hoje, agoraMs, via }) {
  const { alunos, treinos, execucao, agenda, modulos = {}, pagamentos = [], leituras = [], respondidas = [] } = blocos;
  const aluno = (alunos || []).find((a) => a && a.id === alunoId && !a.naLixeira);
  if (!aluno) return null;
  const planos = modulos.planos || {};
  const faturasMinhas = (planos.faturas || []).filter((f) => f.studentId === alunoId);
  const restrito = acessoRestrito(planos.politicaAcesso, faturasMinhas, hoje);
  const conta = via === 'conta';

  const prescricoes = (treinos && Array.isArray(treinos.prescricoes) ? treinos.prescricoes : [])
    .filter((p) => p && p.studentId === alunoId && visivelAoAluno(p, hoje))
    // Fases, versões e notas de planeamento são do treinador.
    .map(({ versoes, fases, ...resto }) => resto);

  const inicio = somarDias(hoje, -60);
  const fim = somarDias(hoje, 90);
  const minhas = (agenda || []).filter((s) => s && s.studentId === alunoId && s.kind !== 'evento');
  const lidas = new Set(leituras);
  const recursos = modulos.recursos || {};
  const politica = recursos.politica || null;
  const pontos = modulos.pontos || {};
  const respondidasSet = new Set(respondidas);

  const base = {
    aluno: { id: aluno.id, name: aluno.name, color: aluno.color || null, phone: conta ? aluno.phone || '' : '', email: conta ? aluno.email || '' : '' },
    via,
    restrito,
    prescricoes: restrito ? [] : prescricoes,
    videos: restrito ? [] : videosDosProgramas(treinos, prescricoes),
    execucao: execucao && typeof execucao === 'object' ? execucao : { sessoes: [] },
    agenda: minhas.filter((s) => s.date >= inicio && s.date <= fim).map((s) => ({ id: s.id, date: s.date, startTime: s.startTime, endTime: s.endTime, type: s.type, status: s.status, localId: s.localId || '', reposicaoDeSessionId: s.reposicaoDeSessionId || '' })),
    creditos: minhas.filter((s) => s.status === 'falta' && s.faltaPrecisaReposicao && !s.reposicaoSessionId && (!s.faltaCreditoValidade || s.faltaCreditoValidade >= hoje)).map((s) => ({ id: s.id, date: s.date, validade: s.faltaCreditoValidade || '' })),
    notificacoes: ((modulos.mensagens || {}).campanhas || []).filter((c) => campanhaParaAluno(c, alunoId, aluno, (modulos.crm || {}).grupos)).map((c) => {
      const o = ocorrenciaAtual(c, agoraMs);
      return o ? { id: o.id, titulo: c.titulo, texto: c.texto, em: o.em, lida: lidas.has(o.id) } : null;
    }).filter(Boolean).sort((a, b) => String(b.em).localeCompare(String(a.em))),
    pontos: pontos.ativo ? { saldo: saldoDePontos(pontos.movimentos, alunoId, hoje), movimentos: (pontos.movimentos || []).filter((m) => m.studentId === alunoId).slice(-20).reverse().map((m) => ({ pontos: m.pontos, motivo: m.motivo, em: m.em })), recompensas: (pontos.recompensas || []).filter((r) => r.ativa).map((r) => ({ id: r.id, nome: r.nome, pontos: r.pontos })) } : null,
    politica: politica ? { aceitaPedidos: Boolean(politica.aceitaPedidos), antecedenciaMinHoras: politica.antecedenciaMinHoras, antecedenciaMaxDias: politica.antecedenciaMaxDias, cancelamentoMinHoras: politica.cancelamentoMinHoras } : null,
    locais: (recursos.locais || []).map((l) => ({ id: l.id, nome: l.nome })),
    lembretes: minhas.filter((s) => s.status === 'agendado' && s.date >= hoje && s.date <= somarDias(hoje, 1)).map((s) => ({ id: s.id, date: s.date, startTime: s.startTime })),
    metas: ((modulos.metas || {}).itens || []).filter((m) => m.studentId === alunoId && m.visivel).map((m) => ({ id: m.id, titulo: m.titulo, tipo: m.tipo, base: m.base, alvo: m.alvo, atual: m.atual, unidade: m.unidade, prazo: m.prazo, marcos: m.marcos || [], comentario: m.comentario })),
    checkinFeito: respondidasSet.has(`checkin:${hoje}`),
    publicacoes: ((modulos.progresso || {}).publicacoes || []).filter((p) => p.studentId === alunoId).map((p) => ({ id: p.id, titulo: p.titulo, texto: p.texto, linhas: p.linhas, em: p.em })),
  };
  if (!conta) return base;

  const pagosConfirmados = new Map(pagamentos.filter((p) => p.estado === 'pago').map((p) => [p.fatura_id, p]));
  return {
    ...base,
    pagarOnline: Boolean(blocos.pagarOnline),
    faturas: faturasMinhas.filter((f) => f.estado !== 'rascunho').map((f) => {
      const confirmado = pagosConfirmados.get(f.id);
      const e = confirmado && pagoDaFatura(f) < totalDaFatura(f) ? 'paga' : estadoDaFatura(f, hoje);
      return { id: f.id, descricao: (f.itens && f.itens[0] && f.itens[0].descricao) || '', total: totalDaFatura(f), moeda: f.moeda || 'EUR', estado: e, emissao: f.emissao, vencimento: f.vencimento };
    }).sort((a, b) => String(b.vencimento).localeCompare(String(a.vencimento))),
    documentos: ((modulos.documentos || {}).itens || []).filter((d) => d.studentId === alunoId && d.visivelAoAluno).map((d) => ({ id: d.id, titulo: d.titulo, tipo: d.tipo, em: d.criadoEm })),
    formularios: ((modulos.documentos || {}).envios || []).filter((e) => e.studentId === alunoId && e.estado === 'aguarda' && !respondidasSet.has(e.id) && e.modelo).map((e) => ({ id: e.id, modelo: e.modelo, em: e.em })),
    contratos: (planos.envios || []).filter((e) => e.studentId === alunoId && e.estado === 'aguarda' && !respondidasSet.has(e.id)).map((e) => ({ id: e.id, titulo: e.titulo, texto: e.texto, versao: e.versao, em: e.em })),
    avaliacoesOnline: ((modulos.avaliacoes || {}).registos || []).filter((r) => r.studentId === alunoId && r.estado === 'aguarda-aluno' && !respondidasSet.has(r.id)).map((r) => {
      const modelo = r.modeloCopia || ((modulos.avaliacoes || {}).modelos || []).find((m) => m.id === r.modeloId) || null;
      return { id: r.id, modeloId: r.modeloId, modelo: modelo ? { nome: modelo.nome, campos: modelo.campos } : null, prazo: r.prazo || '' };
    }),
    pesquisas: ((modulos.satisfacao || {}).pesquisas || []).filter((p) => p.ativa && !respondidasSet.has(p.id)).map((p) => ({ id: p.id, titulo: p.titulo })),
  };
}
