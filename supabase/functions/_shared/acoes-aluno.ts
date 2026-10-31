// O que o aluno e o público podem pedir, em lista fechada. Cada pedido vira uma entrada
// que o treinador trata; ninguém de fora escreve nos dados da conta. Sem Deno nem rede
// (scripts/validar-modulos-4.mjs).

const texto = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^\d{2}:\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID = /^[A-Za-z0-9_:.-]{1,80}$/;

export const TIPOS_FOTO = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const LIMITE_FOTO_BASE64 = 6 * 1024 * 1024;

export const ACOES_SO_COM_CONTA = ['check_in', 'publicar_progresso', 'pedir_aula', 'cancelar_aula', 'responder_formulario', 'responder_avaliacao', 'aceitar_contrato', 'atualizar_perfil', 'responder_pesquisa', 'abrir_documento', 'pagar_fatura', 'ligacao_calendario'];
export const ACOES_COM_TOKEN = ['marcar_lida'];

function horasAte(data, hora, agoraMs) {
  return (Date.parse(`${data}T${hora}:00Z`) - agoraMs) / 3600000;
}

const respostasLimpas = (r) => {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return {};
  const saida = {};
  Object.entries(r).slice(0, 200).forEach(([k, v]) => {
    if (!ID.test(k)) return;
    if (Array.isArray(v)) saida[k] = v.slice(0, 50).map((x) => texto(x, 500));
    else if (v && typeof v === 'object') saida[k] = { valor: texto(v.valor, 10), detalhe: texto(v.detalhe, 500) };
    else saida[k] = typeof v === 'boolean' || typeof v === 'number' ? v : texto(v, 4000);
  });
  return saida;
};

// Devolve { erro } ou { entrada } para gravar. `vista` é a mesma que o aluno recebeu:
// só se pode responder ao que foi enviado a este aluno.
export function validarAcao(op, dados, { via, vista, agenda, alunoId, agoraMs }) {
  const d = dados && typeof dados === 'object' ? dados : {};
  if (![...ACOES_SO_COM_CONTA, ...ACOES_COM_TOKEN].includes(op)) return { erro: 'Pedido desconhecido.', estado: 400 };
  if (ACOES_SO_COM_CONTA.includes(op) && via !== 'conta') return { erro: 'Para isto precisa de entrar com a sua conta.', estado: 403 };

  if (op === 'check_in') {
    const dia = new Date(agoraMs).toISOString().slice(0, 10);
    const escala = (k) => { const n = Number(d[k]); return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null; };
    const valores = Object.fromEntries(['sono', 'energia', 'stress', 'dor', 'motivacao', 'recuperacao'].map((k) => [k, escala(k)]).filter(([, v]) => v !== null));
    if (Object.keys(valores).length === 0) return { erro: 'Responda a pelo menos uma pergunta.', estado: 400 };
    return { entrada: { tipo: 'checkin', ref: `checkin:${dia}`, chave: `checkin:${alunoId}:${dia}`, dados: { ...valores, dia, nota: texto(d.nota, 300) } } };
  }
  if (op === 'publicar_progresso') {
    const nota = texto(d.texto, 500); const peso = texto(d.peso, 12); const medida = texto(d.medida, 60);
    const foto = typeof d.foto === 'string' ? d.foto : '';
    if (!nota && !peso && !medida && !foto) return { erro: 'Escreva alguma coisa ou escolha uma fotografia.', estado: 400 };
    let fotoInfo = null;
    if (foto) {
      const m = foto.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
      if (!m) return { erro: 'Só fotografias JPEG, PNG ou WebP.', estado: 400 };
      if (foto.length > LIMITE_FOTO_BASE64) return { erro: 'A fotografia é demasiado grande.', estado: 400 };
      if (d.consentimentoFoto !== true) return { erro: 'Confirme que autoriza o envio da fotografia ao seu treinador.', estado: 400 };
      fotoInfo = { tipo: m[1], base64: m[2], extensao: TIPOS_FOTO[m[1]] };
    }
    return { fotoInfo, entrada: { tipo: 'progresso_aluno', ref: '', chave: null, dados: { texto: nota, peso, medida, vista: texto(d.vista, 20), comFoto: Boolean(fotoInfo), consentimentoFotoEm: fotoInfo ? new Date(agoraMs).toISOString() : null } } };
  }
  if (op === 'pedir_aula') {
    const p = vista.politica;
    if (!p || !p.aceitaPedidos) return { erro: 'O seu treinador não recebe pedidos por aqui.', estado: 403 };
    if (!DATA.test(d.date) || !HORA.test(d.startTime) || !HORA.test(d.endTime) || d.endTime <= d.startTime) return { erro: 'Escolha um dia e um horário válidos.', estado: 400 };
    const h = horasAte(d.date, d.startTime, agoraMs);
    if (h < (p.antecedenciaMinHoras ?? 24)) return { erro: `Os pedidos fazem-se com ${p.antecedenciaMinHoras ?? 24} horas de antecedência.`, estado: 400 };
    if (h > (p.antecedenciaMaxDias ?? 30) * 24) return { erro: `Só se pode pedir até ${p.antecedenciaMaxDias ?? 30} dias à frente.`, estado: 400 };
    return { entrada: { tipo: 'pedido_aula', ref: '', chave: `pedido:${alunoId}:${d.date}:${d.startTime}`, dados: { date: d.date, startTime: d.startTime, endTime: d.endTime, notas: texto(d.notas, 300) } } };
  }
  if (op === 'cancelar_aula') {
    const s = (agenda || []).find((x) => x.id === d.sessaoId && x.studentId === alunoId);
    if (!s) return { erro: 'Esta aula já não existe.', estado: 404 };
    if (s.status !== 'agendado') return { erro: 'Esta aula já não está marcada.', estado: 400 };
    const min = vista.politica ? vista.politica.cancelamentoMinHoras ?? 24 : 24;
    if (!vista.politica || !vista.politica.aceitaPedidos) return { erro: 'Para cancelar, fale com o seu treinador.', estado: 403 };
    if (horasAte(s.date, s.startTime, agoraMs) < min) return { erro: `Os cancelamentos fazem-se com ${min} horas de antecedência. Fale com o seu treinador.`, estado: 400 };
    return { entrada: { tipo: 'cancelamento', ref: s.id, chave: `cancelar:${s.id}`, dados: { date: s.date, startTime: s.startTime, motivo: texto(d.motivo, 300) } } };
  }
  if (op === 'responder_formulario') {
    const f = (vista.formularios || []).find((x) => x.id === d.envioId);
    if (!f) return { erro: 'Este formulário já não está por responder.', estado: 404 };
    const nome = texto(d.nomeAssinado, 120);
    if (!nome) return { erro: 'Escreva o seu nome para confirmar.', estado: 400 };
    const respostas = respostasLimpas(d.respostas);
    const perguntas = (f.modelo.seccoes || []).flatMap((s) => s.perguntas || []);
    const falta = perguntas.some((p) => {
      const v = respostas[p.id];
      if (p.tipo === 'declaracao') return !v || v.valor !== 'sim';
      if (!p.obrigatoria) return false;
      if (p.tipo === 'sim_nao' || p.tipo === 'sim_nao_detalhe') return !v || !v.valor;
      return v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
    });
    if (falta) return { erro: 'Falta responder a uma pergunta obrigatória.', estado: 400 };
    const sintomas = perguntas.some((p) => p.alerta && respostas[p.id] && respostas[p.id].valor === 'sim');
    return { entrada: { tipo: 'resposta_formulario', ref: f.id, chave: `form:${f.id}`, dados: { modeloId: f.modelo.id, nomeFormulario: f.modelo.nome, respostas, nomeAssinado: nome, sintomas, aceiteEm: new Date(agoraMs).toISOString() } } };
  }
  if (op === 'responder_avaliacao') {
    const a = (vista.avaliacoesOnline || []).find((x) => x.id === d.registoId);
    if (!a) return { erro: 'Esta avaliação já não está por responder.', estado: 404 };
    return { entrada: { tipo: 'avaliacao_online', ref: a.id, chave: `aval:${a.id}`, dados: { valores: respostasLimpas(d.valores) } } };
  }
  if (op === 'aceitar_contrato') {
    const c = (vista.contratos || []).find((x) => x.id === d.envioId);
    if (!c) return { erro: 'Este contrato já não está por aceitar.', estado: 404 };
    const nome = texto(d.nome, 120);
    if (!nome || d.aceito !== true) return { erro: 'Confirme que leu e escreva o seu nome.', estado: 400 };
    return { entrada: { tipo: 'contrato_aceite', ref: c.id, chave: `contrato:${c.id}`, dados: { titulo: c.titulo, versao: c.versao, nome, aceiteEm: new Date(agoraMs).toISOString() } } };
  }
  if (op === 'atualizar_perfil') {
    const phone = texto(d.phone, 30); const email = texto(d.email, 120);
    if (email && !EMAIL.test(email)) return { erro: 'Este email não parece válido.', estado: 400 };
    if (!phone && !email) return { erro: 'Nada para atualizar.', estado: 400 };
    return { entrada: { tipo: 'perfil', ref: '', chave: null, dados: { phone, email } } };
  }
  if (op === 'responder_pesquisa') {
    const p = (vista.pesquisas || []).find((x) => x.id === d.pesquisaId);
    const nota = Number(d.nota);
    if (!p) return { erro: 'Esta pesquisa já não está aberta.', estado: 404 };
    if (!Number.isInteger(nota) || nota < 0 || nota > 10) return { erro: 'Escolha uma nota de 0 a 10.', estado: 400 };
    return { entrada: { tipo: 'nps', ref: p.id, chave: `nps:${p.id}:${alunoId}`, dados: { nota, comentario: texto(d.comentario, 500) } } };
  }
  return { semEntrada: true };
}

// A página pública: formulários com consentimento, e nunca mais do que isto.
const TIPO_POR_ENDERECO = { vendas: 'lead', inscricao: 'inscricao', indicacao: 'indicacao', desafio: 'desafio_inscricao' };

export function validarPublico(endereco, d, { agoraMs, participanteNovo }) {
  if (!endereco || !endereco.ativo) return { erro: 'Esta página já não está disponível.', estado: 404 };
  if (endereco.expira_em && Date.parse(endereco.expira_em) < agoraMs) return { erro: 'Esta página já não está disponível.', estado: 404 };
  // Campo invisível: quem o preenche é um robô, e recebe a mesma resposta de sucesso.
  if (d.empresa) return { ignorar: true };

  if (d.op === 'concluir') {
    if (endereco.tipo !== 'desafio') return { erro: 'Pedido desconhecido.', estado: 400 };
    const etapa = (endereco.dados.etapas || []).find((e) => e.id === d.etapa);
    if (!etapa || !ID.test(String(d.participante || ''))) return { erro: 'Esta etapa não existe.', estado: 400 };
    return { entrada: { tipo: 'desafio_conclusao', ref: endereco.ref, chave: `conc:${d.participante}:${etapa.id}`, dados: { participante: d.participante, etapa: etapa.id, etapaTitulo: etapa.titulo } }, exigeInscricao: d.participante };
  }

  const tipo = TIPO_POR_ENDERECO[endereco.tipo];
  if (!tipo) return { erro: 'Esta página não recebe formulários.', estado: 400 };
  const nome = texto(d.nome, 120); const email = texto(d.email, 120).toLowerCase(); const telefone = texto(d.telefone, 30);
  if (!nome) return { erro: 'Escreva o seu nome.', estado: 400 };
  if (!email && !telefone) return { erro: 'Deixe um email ou um telefone.', estado: 400 };
  if (email && !EMAIL.test(email)) return { erro: 'Este email não parece válido.', estado: 400 };
  if (d.consentimento !== true) return { erro: 'Falta confirmar o consentimento.', estado: 400 };
  const contacto = email || telefone.replace(/\D/g, '');
  const participante = tipo === 'desafio_inscricao' ? participanteNovo : undefined;
  return {
    participante,
    entrada: { tipo, ref: endereco.ref, chave: `pub:${endereco.slug}:${contacto}`, dados: { nome, email, telefone, mensagem: texto(d.mensagem, 500), origem: { lead: 'página de vendas', inscricao: 'inscrição', indicacao: 'indicação', desafio_inscricao: 'desafio' }[tipo], ...(participante ? { participante } : {}), consentimentoTexto: texto(endereco.dados.consentimento, 800), consentimentoEm: new Date(agoraMs).toISOString() } },
  };
}

// O que uma página pública pode devolver. O retrato já é só o público, e mesmo assim
// sai por nome de campo.
export function retratoPublico(e) {
  const d = e.dados || {};
  return { tipo: e.tipo, titulo: d.titulo || d.nome || '', subtitulo: d.subtitulo || '', descricao: d.descricao || d.sobre || '', beneficios: d.beneficios || [], cta: d.cta || '', whatsapp: d.whatsapp || '', planos: d.planos || [], depoimentos: d.depoimentos || [], regras: d.regras || '', inicio: d.inicio || '', fim: d.fim || '', etapas: d.etapas || [], consentimento: d.consentimento || '', comFormulario: Boolean(TIPO_POR_ENDERECO[e.tipo]) };
}

export function calendarioDoAluno(agenda, alunoId, { agora, fuso = 'Europe/Lisbon' }) {
  const carimbo = String(agora).replace(/[-:]/g, '').replace(/\.\d+/, '');
  const dt = (data, hora) => `${String(data).replace(/-/g, '')}T${String(hora).replace(':', '')}00`;
  const eventos = (agenda || []).filter((s) => s.studentId === alunoId && s.kind !== 'evento' && s.date && s.startTime && s.endTime).flatMap((s) => [
    'BEGIN:VEVENT', `UID:${s.id}@ptmanagerapp.com`, `DTSTAMP:${carimbo}`, `DTSTART;TZID=${fuso}:${dt(s.date, s.startTime)}`, `DTEND;TZID=${fuso}:${dt(s.date, s.endTime)}`, 'SUMMARY:Treino', `STATUS:${s.status === 'cancelado' ? 'CANCELLED' : 'CONFIRMED'}`, 'END:VEVENT',
  ]);
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PTMANAGER//Aluno//PT', 'CALSCALE:GREGORIAN', ...eventos, 'END:VCALENDAR'].join('\r\n');
}
