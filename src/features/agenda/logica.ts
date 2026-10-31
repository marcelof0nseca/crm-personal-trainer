/*
 * Agenda: modelos de horário por intervalo de datas, colar marcações, calendário
 * .ics, lista de espera, turmas e políticas de reserva. Conflitos continuam a avisar
 * e nunca a bloquear, como no resto da agenda.
 */
const somarDias = (iso, n) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const diaDaSemana = (iso) => new Date(`${iso}T00:00:00Z`).getUTCDay();
export const LIMITE_DIAS_MODELO = 92;

// Exceções a criar. Feriados e bloqueios não mexem no horário-base. Uma exceção que
// já exista só se substitui se o pedir: nunca em silêncio.
export function excecoesDoModelo({ de, ate, dias, aberto, intervalos }, existentes = {}, substituir = false) {
  const novas = {}; const ignoradas = [];
  if (!de || !ate || ate < de) return { novas, ignoradas };
  let iso = de; let n = 0;
  while (iso <= ate && n < LIMITE_DIAS_MODELO) {
    if (!dias || dias.length === 0 || dias.includes(diaDaSemana(iso))) {
      if (existentes[iso] && !substituir) ignoradas.push(iso);
      else novas[iso] = { aberto: Boolean(aberto), intervalos: intervalos.map((x) => ({ ...x })) };
    }
    iso = somarDias(iso, 1); n += 1;
  }
  return { novas, ignoradas };
}

// Colar mantém a distância entre dias das marcações copiadas, a contar da primeira.
// Cada cópia nasce agendada, sem falta, série, crédito nem dados de avaliação.
export function colarMarcacoes(copiadas, dataDestino, gerarId) {
  if (!copiadas.length || !dataDestino) return [];
  const primeira = [...copiadas].map((s) => s.date).sort()[0];
  const distancia = (Date.parse(`${dataDestino}T00:00:00Z`) - Date.parse(`${primeira}T00:00:00Z`)) / 86400000;
  const grupos = {};
  return copiadas.map((s) => {
    const novo = {
      id: gerarId(), kind: s.kind, studentId: s.studentId ?? null, type: s.type === 'avaliacao' ? 'fixo' : s.type, status: 'agendado',
      startTime: s.startTime, endTime: s.endTime, notes: s.notes || '', date: somarDias(s.date, distancia),
    };
    if (s.title) novo.title = s.title;
    if (s.groupId) { grupos[s.groupId] = grupos[s.groupId] || gerarId(); novo.groupId = grupos[s.groupId]; }
    return novo;
  });
}

// Mover para outro dia só muda a data; o resto decide-se na caixa de confirmação.
export const moverParaDia = (sessao, iso) => ({ ...sessao, date: iso });

const escaparIcs = (t) => String(t || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const dtIcs = (data, hora) => `${data.replace(/-/g, '')}T${String(hora).replace(':', '')}00`;
export function icsDeSessoes(sessoes, { nomeDe, fuso = 'Europe/Lisbon', agora }) {
  const carimbo = String(agora).replace(/[-:]/g, '').replace(/\.\d+/, '');
  const eventos = sessoes.filter((s) => s.date && s.startTime && s.endTime && s.type !== 'horario_livre').flatMap((s) => [
    'BEGIN:VEVENT',
    `UID:${s.id}@ptmanagerapp.com`,
    `DTSTAMP:${carimbo}`,
    `DTSTART;TZID=${fuso}:${dtIcs(s.date, s.startTime)}`,
    `DTEND;TZID=${fuso}:${dtIcs(s.date, s.endTime)}`,
    // Título curto de propósito: nada de avaliações, medidas ou notas.
    `SUMMARY:${escaparIcs(nomeDe(s))}`,
    `STATUS:${s.status === 'cancelado' ? 'CANCELLED' : 'CONFIRMED'}`,
    'END:VEVENT',
  ]);
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PTMANAGER//Agenda//PT', 'CALSCALE:GREGORIAN', ...eventos, 'END:VCALENDAR'].join('\r\n');
}

/* ---------------------------- lista de espera e turmas ---------------------------- */

export function entrarNaLista(lista, { sessaoId, studentId, em, gerarId }) {
  if ((lista || []).some((x) => x.sessaoId === sessaoId && x.studentId === studentId && x.estado === 'espera')) return lista;
  return [...(lista || []), { id: gerarId(), sessaoId, studentId, em, estado: 'espera' }];
}

// A vaga vai para quem está há mais tempo, com prazo para aceitar. Determinístico.
export function promover(lista, sessaoId, { agora, horasParaAceitar = 12 }) {
  const fila = (lista || []).filter((x) => x.sessaoId === sessaoId && x.estado === 'espera').sort((a, b) => String(a.em).localeCompare(String(b.em)));
  if (!fila.length) return { lista, promovido: null };
  const prazo = new Date(Date.parse(agora) + horasParaAceitar * 3600000).toISOString();
  return { promovido: fila[0], lista: lista.map((x) => (x.id === fila[0].id ? { ...x, estado: 'oferecida', prazo } : x)) };
}

// Uma aula por aluno, partilhando o `groupId`, como já se faz em vários alunos no
// mesmo horário. `idBase` torna a operação repetível sem duplicar.
export function aulasDaTurma(turma, data, gerarId) {
  const groupId = `turma-${turma.id}-${data}`;
  return (turma.alunos || []).map((studentId) => ({
    id: `${groupId}-${studentId}`.replace(/[^A-Za-z0-9_-]/g, '_'), kind: 'aula', studentId, date: data, startTime: turma.inicio, endTime: turma.fim, type: 'fixo', status: 'agendado', notes: '', groupId, turmaId: turma.id, localId: turma.localId || '',
  })).map((s) => (gerarId ? s : s));
}

export const lugaresLivres = (turma) => Math.max(0, (Number(turma.capacidade) || 0) - (turma.alunos || []).length);

/* ---------------------------- políticas ---------------------------- */

export const POLITICA_OMISSAO = {
  aceitaPedidos: false, autoAprovar: false, antecedenciaMinHoras: 24, antecedenciaMaxDias: 30, cancelamentoMinHoras: 24, limiteCancelamentosMes: 0, preparacaoMin: 0, lembretesMinutos: [1440, 60],
};

// O que o aluno pode fazer, e porquê não, em texto que se lhe possa mostrar.
export function podeReservar(politica, inicioISO, agoraISO) {
  const p = { ...POLITICA_OMISSAO, ...(politica || {}) };
  if (!p.aceitaPedidos) return { ok: false, motivo: 'O seu treinador não recebe pedidos por aqui.' };
  const horas = (Date.parse(inicioISO) - Date.parse(agoraISO)) / 3600000;
  if (horas < p.antecedenciaMinHoras) return { ok: false, motivo: `Os pedidos fazem-se com ${p.antecedenciaMinHoras} horas de antecedência.` };
  if (horas > p.antecedenciaMaxDias * 24) return { ok: false, motivo: `Só se pode reservar até ${p.antecedenciaMaxDias} dias à frente.` };
  return { ok: true };
}

export function podeCancelar(politica, inicioISO, agoraISO, cancelamentosNoMes = 0) {
  const p = { ...POLITICA_OMISSAO, ...(politica || {}) };
  const horas = (Date.parse(inicioISO) - Date.parse(agoraISO)) / 3600000;
  if (horas < p.cancelamentoMinHoras) return { ok: false, motivo: `Os cancelamentos fazem-se com ${p.cancelamentoMinHoras} horas de antecedência. Fale com o seu treinador.` };
  if (p.limiteCancelamentosMes > 0 && cancelamentosNoMes >= p.limiteCancelamentosMes) return { ok: false, motivo: 'Atingiu o limite de cancelamentos deste mês. Fale com o seu treinador.' };
  return { ok: true };
}

// Conflito de um recurso (sala, equipamento), à parte do conflito do treinador, com o
// tempo de preparação entre uma marcação e a seguinte.
export function conflitosDeLocal(sessoes, alvo, preparacaoMin = 0) {
  if (!alvo.localId) return [];
  const m = (h) => { const [a, b] = String(h).split(':').map(Number); return a * 60 + b; };
  return sessoes.filter((s) => s.id !== alvo.id && s.date === alvo.date && s.localId === alvo.localId && s.status !== 'cancelado' && (!alvo.groupId || s.groupId !== alvo.groupId)
    && m(s.startTime) - preparacaoMin < m(alvo.endTime) && m(alvo.startTime) - preparacaoMin < m(s.endTime));
}
