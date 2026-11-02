// Que notificações estão por enviar. Sem Deno nem rede (scripts/validar-modulos-4.mjs).
// O texto nunca leva dados de saúde: um ecrã bloqueado vê-se de longe.
import { campanhaParaAluno, ocorrenciaAtual } from './vista-aluno.ts';

const FUSO = 'Europe/Lisbon';
const DIA_MS = 86400000;

// O relógio de parede em Lisboa, em milissegundos, para comparar com as horas da agenda.
export function paredeEmLisboa(agoraMs) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(agoraMs)).map((x) => [x.type, x.value]));
  return { ms: Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute)), hora: Number(p.hour) };
}

// Silêncio das 22:00 às 08:00: o que ficar por enviar segue no período seguinte.
export const emSilencio = (hora) => hora >= 22 || hora < 8;

export function pushesPendentes({ alunos, agenda, mensagens, grupos }, alunosComSub, enviados, agoraMs) {
  const { ms: parede, hora } = paredeEmLisboa(agoraMs);
  if (emSilencio(hora)) return [];
  const comSub = new Set(alunosComSub);
  const ja = new Set(enviados);
  const lista = [];
  const juntar = (alunoId, ocorrenciaId, titulo, texto) => { if (!ja.has(`${alunoId}|${ocorrenciaId}`)) lista.push({ alunoId, ocorrenciaId, titulo, texto }); };

  (agenda || []).forEach((s) => {
    if (!s || !comSub.has(s.studentId) || s.kind === 'evento' || s.status !== 'agendado' || !s.date || !s.startTime) return;
    const quando = Date.parse(`${s.date}T${s.startTime}:00Z`);
    if (!(quando > parede) || quando - parede > DIA_MS) return;
    juntar(s.studentId, `aula:${s.id}:${s.date}:${s.startTime}`, 'Treino marcado', `${s.date.slice(8, 10)}/${s.date.slice(5, 7)} às ${s.startTime}`);
  });

  ((mensagens && mensagens.campanhas) || []).forEach((c) => {
    const o = ocorrenciaAtual(c, agoraMs);
    // Um aviso antigo não dispara de repente em quem ligou as notificações hoje.
    if (!o || agoraMs - Date.parse(o.em) > DIA_MS) return;
    (alunos || []).filter((a) => a && comSub.has(a.id) && !a.naLixeira && campanhaParaAluno(c, a.id, a, grupos)).forEach((a) => juntar(a.id, o.id, c.titulo, c.texto));
  });
  return lista;
}

const SERVICOS = /^(fcm\.googleapis\.com|android\.googleapis\.com|[a-z0-9.-]*\.push\.apple\.com|[a-z0-9.-]*\.push\.services\.mozilla\.com|[a-z0-9.-]*\.notify\.windows\.com)$/;

// O servidor vai fazer um pedido a este endereço: só aos serviços de push conhecidos.
export function subscricaoValida(d) {
  if (!d || typeof d !== 'object') return false;
  let url;
  try { url = new URL(String(d.endpoint)); } catch { return false; }
  return url.protocol === 'https:' && SERVICOS.test(url.hostname) && String(d.endpoint).length < 1000
    && /^[A-Za-z0-9_=-]{20,200}$/.test(String(d.p256dh)) && /^[A-Za-z0-9_=-]{8,80}$/.test(String(d.auth));
}
