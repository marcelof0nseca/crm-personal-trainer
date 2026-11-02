// Grava a aplicação real, em tamanho de telemóvel, contra um Supabase falso com dados fictícios.
// Os vídeos saem para public/landing. Corre-se da raiz do projeto (ver CLAUDE.md, secção 9).
import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import { pathToFileURL } from 'url';
import path from 'path';
import { execFileSync } from 'child_process';
const require = createRequire(`${process.cwd()}/package.json`);
export const pw = require('playwright');
const FFMPEG = require('ffmpeg-static');
const raizF = pathToFileURL(`${process.cwd()}/supabase/functions/_shared`).href;
const V = await import(`${raizF}/vista-aluno.ts`);
const A = await import(`${raizF}/acoes-aluno.ts`);
export const SP = path.join(os.tmpdir(), 'ptmanager-gravador');
export const SAIDA = `${process.cwd()}/public/landing`;
const BASE = 'http://localhost:5202';
fs.mkdirSync(SAIDA, { recursive: true });

const UID = '11111111-1111-1111-1111-111111111111';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = `${b64({ alg: 'none' })}.${b64({ sub: UID, aal: 'aal1', exp: 4102444800, role: 'authenticated', session_id: 's', email: 'ana@exemplo.pt' })}.x`;
const user = { id: UID, email: 'ana@exemplo.pt', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: { name: 'Ana Martins', full_name: 'Ana Martins' }, factors: [], created_at: '2026-01-01T00:00:00Z' };

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const dia = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const hoje = dia(0);
const segunda = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; })();
const naSemana = (n) => { const d = new Date(segunda); d.setDate(d.getDate() + n); return iso(d); };

const NOMES = [['Rita Ferreira', '#5DA9E9', '3x por semana', 210, 'F'], ['Bruno Costa', '#E9A15D', '2x por semana', 150, 'M'], ['Inês Marques', '#7BC47F', '3x por semana', 210, 'F'], ['Tiago Almeida', '#C58BE0', '1x por semana', 85, 'M'], ['Marta Lopes', '#56B6C2', '2x por semana', 150, 'F'], ['João Pires', '#E06C75', '3x por semana', 210, 'M'], ['Sofia Neves', '#D19A66', '2x por semana', 150, 'F'], ['Diogo Ramos', '#61AFEF', '1x por semana', 85, 'M'], ['Carla Teixeira', '#98C379', '2x por semana', 150, 'F']];
const ALUNOS = NOMES.map(([name, color, planType, planValue, sex], i) => ({ id: `a${i + 1}`, name, color, active: true, memberNumber: String(1021 + i), sex, planType, paymentMode: 'mensal', planValue, biweeklyValue: '', quinzenasPagas: {}, taxPercent: 20, gymFeeType: 'percent', gymFeeValue: 10, phone: `91${pad(i + 2)}45${pad(i + 11)}7`, email: `${name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@exemplo.pt`, height: String(162 + i * 2), notes: '', startDate: dia(-200 + i * 12), birthDate: i === 2 ? `1992${hoje.slice(4)}` : `19${85 + i}-0${(i % 8) + 1}-14` }));

function aula(id, studentId, date, startTime, endTime, status = 'agendado', extra = {}) {
  return { id, kind: 'aula', studentId, date, startTime, endTime, type: 'fixo', status, notes: '', ...extra };
}
function agenda() {
  const l = [];
  const horas = [['07:00', '08:00'], ['08:00', '09:00'], ['09:30', '10:30'], ['11:00', '12:00'], ['17:00', '18:00'], ['18:00', '19:00'], ['19:00', '20:00']];
  for (let d = 0; d < 6; d += 1) {
    const dt = naSemana(d);
    horas.forEach(([a, b], h) => {
      if ((d + h) % 3 === 2) return;
      const al = `a${((d * 3 + h) % 9) + 1}`;
      l.push(aula(`w${d}${h}`, al, dt, a, b, dt < hoje ? 'realizado' : 'agendado'));
    });
    if (d < 5) l.push({ id: `liv${d}`, kind: 'evento', studentId: null, date: dt, startTime: '14:00', endTime: '15:00', type: 'horario_livre', status: 'agendado', notes: '', title: '' });
  }
  for (let s = 1; s <= 5; s += 1) for (let i = 0; i < 12; i += 1) {
    const dt = dia(-7 * s - (i % 5));
    l.push(aula(`p${s}${i}`, `a${(i % 9) + 1}`, dt, '09:00', '10:00', i === 7 ? 'falta' : 'realizado'));
  }
  l.push(aula('falta1', 'a2', dia(-2), '18:00', '19:00', 'falta', { faltaMotivo: 'Doença', faltaPrecisaReposicao: true, faltaCreditoValidade: dia(26), faltaCreditoPor: 'Ana Martins', faltaCreditoEm: dia(-2), faltaCreditoLog: [{ em: `${dia(-2)}T18:30:00Z`, quem: 'Ana Martins', acao: 'Crédito concedido' }] }));
  l.push(aula('falta2', 'a5', dia(-4), '08:00', '09:00', 'falta', { faltaMotivo: 'Trabalho', faltaPrecisaReposicao: true, faltaCreditoValidade: dia(9), faltaCreditoPor: 'Ana Martins', faltaCreditoEm: dia(-4) }));
  l.push(aula('falta3', 'a7', dia(-1), '17:00', '18:00', 'falta', { faltaMotivo: 'Sem aviso', faltaPrecisaReposicao: false }));
  const aval = (id, d, peso, gord, musc) => ({ ...aula(id, 'a1', d, '09:30', '10:30', 'realizado'), type: 'avaliacao', assessMethod: 'bioimpedancia', assessAge: '33', assessWeight: peso, assessBodyFat: gord, assessMuscleMassPct: musc, assessGoalWeight: '60', assessGoalBodyFat: '22', assessPerimWaist: '', photoIds: [], assessMobilidade: [], assessCondicionamento: [], assessEstado: 'final' });
  l.push(aval('av1', dia(-120), '66.4', '28.6', '33.2'), aval('av2', dia(-60), '64.1', '26.1', '34.5'), aval('av3', dia(-6), '62.3', '24.2', '35.8'));
  return l;
}
const linha = (id, reps, carga, descanso, rir = '') => ({ id, tipo: 'reps_carga', reps, carga, descanso, rpe: '', rir });
const exercicio = (id, nome, grupo, bloco, linhas, extra = {}) => ({ id, exercicioId: `e:${nome}`, nome, bloco, metodo: '', metodoParams: {}, notas: '', grupo: '', linhas, ...extra });
const PROGRAMA = {
  id: 'p1', studentId: 'a1', nome: 'Força e composição', objetivo: 'Ganhar força, baixar % de gordura', inicio: dia(-30), fim: dia(60), ativo: true, criadoEm: `${dia(-30)}T09:00:00Z`, estadoPublicacao: 'publicado',
  treinos: [
    { id: 't1', nome: 'Treino A', notas: '', exercicios: [
      exercicio('e1', 'Agachamento livre', 'Quadricípites', 'Principal', [linha('l1', '8', '40%', '60', '6'), linha('l2', '8', '60', '120', '2'), linha('l3', '8', '60', '120', '2')]),
      exercicio('e2', 'Supino reto com barra', 'Peito', 'Principal', [linha('l4', '10', '35', '90', '2'), linha('l5', '10', '35', '90', '2'), linha('l6', '8', '40', '90', '1')], { grupo: 'g1' }),
      exercicio('e3', 'Puxada aberta barra reta', 'Costas', 'Principal', [linha('l7', '12', '35', '90', '2'), linha('l8', '12', '35', '90', '2')], { grupo: 'g1' }),
      exercicio('e4', 'Elevação pélvica com barra', 'Glúteos', 'Principal', [linha('l9', '12', '50', '75', '2'), linha('l10', '12', '50', '75', '2')]),
      exercicio('e5', 'Prancha', 'Core', 'Volta à calma', [{ id: 'l11', tipo: 'tempo', tempo: '45', descanso: '45' }]),
    ], grupos: { g1: { metodo: 'Bi-set', cor: '#E9A15D' } } },
    { id: 't2', nome: 'Treino B', notas: '', exercicios: [exercicio('e6', 'Leg press 45 pés afastados', 'Quadricípites', 'Principal', [linha('l12', '12', '120', '90', '2'), linha('l13', '12', '120', '90', '2'), linha('l14', '10', '130', '90', '1')]), exercicio('e7', 'Puxada aberta barra reta', 'Costas', 'Principal', [linha('l15', '12', '35', '90', '2'), linha('l16', '12', '35', '90', '2')])] },
  ],
};
const sessao = (id, data, carga, extra = {}) => ({
  id, data, inicio: '18:00', duracaoMin: 52, prescricaoId: 'p1', prescricaoNome: 'Força e composição', treinoId: 't1', treinoNome: 'Treino A', estado: 'concluida', esforco: 7, sintomasDurante: '', sintomasDepois: '', motivo: '', notas: '', feedback: {},
  itens: [{ exercicioId: 'e:Agachamento livre', nome: 'Agachamento livre', estado: 'feito', series: [{ linhaId: 'l2', c: ['reps', 'carga'], v: { reps: '8', carga: String(carga) }, feito: true }, { linhaId: 'l3', c: ['reps', 'carga'], v: { reps: '8', carga: String(carga) }, feito: true }] }, { exercicioId: 'e:Supino reto com barra', nome: 'Supino reto com barra', estado: 'feito', series: [{ linhaId: 'l4', c: ['reps', 'carga'], v: { reps: '10', carga: String(carga - 20) }, feito: true }] }], ...extra,
});

export function novoBanco() {
  const linhaD = (k, v) => ({ user_id: UID, data_key: k, value: v, updated_at: '2026-01-01T00:00:00.000Z' });
  const exec = {};
  ALUNOS.forEach((a, i) => {
    const ult = [1, 2, 4, 8, 14, 40, 1, 3, null][i];
    exec[a.id] = { sessoes: ult === null ? [] : Array.from({ length: i === 0 ? 14 : 4 }, (_, k) => sessao(`s${i}${k}`, dia(-ult - k * 3), 40 + (14 - k) * 1.5, k === 0 && i === 2 ? { sintomasDepois: 'Ligeira dor no joelho', feedback: { satisfacao: 4, energia: 3, comentario: 'Custou mais hoje.' } } : (k === 0 ? { feedback: { satisfacao: 5, energia: 4, comentario: 'Correu muito bem!' } } : {}))) };
  });
  return {
    app_data: [
      linhaD('alunos', ALUNOS), linhaD('agenda', agenda()),
      linhaD('financas', [{ id: 'f1', type: 'entrada', description: 'Aulas particulares', category: 'rendimento_pt', amount: 320, date: dia(-3), status: 'concluido', notes: '' }, { id: 'f2', type: 'gasto', description: 'Renda do estúdio', category: 'moradia', amount: 450, date: dia(-8), status: 'concluido', notes: '' }, { id: 'f3', type: 'gasto', description: 'Combustível', category: 'transporte', amount: 62.4, date: dia(-2), status: 'concluido', notes: '' }, { id: 'f4', type: 'gasto', description: 'Supermercado', category: 'alimentacao', amount: 88.9, date: dia(-1), status: 'concluido', notes: '' }, { id: 'f5', type: 'gasto', description: 'Seguro profissional', category: 'contas', amount: 39, date: dia(4), status: 'pendente', notes: '' }]),
      linhaD('fotos', []), linhaD('categorias', { expense: [], income: [], planTypes: [], sessionTypes: [], eventTypes: [] }),
      linhaD('definicoes', { timbre: { estudio: 'Estúdio Ana Martins', numeroProfissional: 'TPTF 12345', telefone: '912 345 678', email: 'ana@exemplo.pt', morada: 'Lisboa', avisoConfidencial: true } }),
      linhaD('treinos', { modelos: [], prescricoes: [PROGRAMA, { ...PROGRAMA, id: 'p2', studentId: 'a2' }, { ...PROGRAMA, id: 'p3', studentId: 'a3' }, { ...PROGRAMA, id: 'p4', studentId: 'a4' }, { ...PROGRAMA, id: 'p5', studentId: 'a5' }, { ...PROGRAMA, id: 'p6', studentId: 'a6' }, { ...PROGRAMA, id: 'p7', studentId: 'a7' }, { ...PROGRAMA, id: 'p8', studentId: 'a8' }], bibliotecaEdicoes: { 'e:Agachamento livre': { videoYoutube: 'aclHkVaku9U' } } }),
      linhaD('formularios', { modelos: [], respostas: [] }),
      ...Object.entries(exec).map(([k, v]) => linhaD(`execucoes:${k}`, v)),
      linhaD('modulo:planos', { modelos: [{ id: 'pl1', nome: 'Mensal 2x por semana', centimos: 15000, moeda: 'EUR', cadencia: 'mensal', ativo: true, impostoBp: 2300, descricao: 'Duas aulas por semana' }, { id: 'pl2', nome: 'Pack 10 aulas', centimos: 34000, moeda: 'EUR', cadencia: 'pacote', ativo: true, impostoBp: 2300, descricao: 'Sem data limite' }], contratos: [{ id: 'c1', studentId: 'a1', planoId: 'pl1', nome: 'Mensal 2x por semana', cadencia: 'mensal', centimos: 15000, moeda: 'EUR', inicio: dia(-40), estado: 'ativo', impostoBp: 2300 }], faturas: [{ id: 'fv1', studentId: 'a2', estado: 'aberta', moeda: 'EUR', emissao: dia(-20), vencimento: dia(-6), itens: [{ descricao: 'Mensal 2x por semana', centimos: 15000, quantidade: 1 }], pagamentos: [], reembolsos: [] }, { id: 'fv2', studentId: 'a3', estado: 'aberta', moeda: 'EUR', emissao: dia(-5), vencimento: dia(3), itens: [{ descricao: 'Mensal 2x por semana', centimos: 15000, quantidade: 1 }], pagamentos: [], reembolsos: [] }, { id: 'fv3', studentId: 'a5', estado: 'aberta', moeda: 'EUR', emissao: dia(-12), vencimento: dia(-2), itens: [{ descricao: 'Pack 10 aulas', centimos: 34000, quantidade: 1 }], pagamentos: [{ id: 'pg', centimos: 34000, metodo: 'mbway', referencia: '', em: dia(-2), origem: 'manual', estado: 'confirmado' }], reembolsos: [] }], modelosContrato: [{ id: 'mc', titulo: 'Contrato de serviço', texto: 'O presente contrato regula a prestação de serviços de treino personalizado.', versao: 2 }], envios: [], aceites: [], politicaAcesso: null }),
      linhaD('modulo:crm', { leads: [{ id: 'l1', nome: 'Patrícia Dias', telefone: '913000111', email: 'patricia@exemplo.pt', origem: 'página de vendas', etapa: 'novo', valor: 0, proximoContacto: dia(1), notas: 'Quer treinar de manhã', etiquetas: [], criadoEm: `${dia(-1)}T10:00:00Z`, atividades: [] }, { id: 'l2', nome: 'Rui Gomes', telefone: '913000222', email: '', origem: 'indicação', etapa: 'agendado', valor: 0, proximoContacto: dia(2), notas: 'Avaliação marcada', etiquetas: [], criadoEm: `${dia(-4)}T10:00:00Z`, atividades: [] }, { id: 'l3', nome: 'Helena Rocha', telefone: '913000333', email: '', origem: 'desafio', etapa: 'proposta', valor: 0, proximoContacto: dia(3), notas: '', etiquetas: [], criadoEm: `${dia(-6)}T10:00:00Z`, atividades: [] }], segmentos: [], grupos: [{ id: 'g1', nome: 'Manhãs', alunos: ['a1', 'a3', 'a6'] }], lixeira: [] }),
      linhaD('modulo:tarefas', { itens: [{ id: 't1', titulo: 'Ligar à Rita sobre a avaliação', data: hoje, studentId: 'a1', prioridade: 'normal', origem: 'manual', feita: false }, { id: 't2', titulo: 'Renovar o plano do Bruno', data: dia(-1), studentId: 'a2', prioridade: 'alta', origem: 'manual', feita: false }, { id: 't3', titulo: 'Preparar a avaliação da Inês', data: dia(2), studentId: 'a3', prioridade: 'normal', origem: 'regra:x', feita: false }] }),
      linhaD('modulo:metas', { itens: [{ id: 'm1', studentId: 'a1', tipo: 'desempenho', titulo: 'Agachar 80 kg', unidade: 'kg', base: '50', alvo: '80', atual: '62', prazo: dia(70), comentario: 'Mais perto do que parece.', visivel: true, marcos: ['60 kg', '70 kg'], criadaEm: dia(-40) }, { id: 'm2', studentId: 'a1', tipo: 'frequencia', titulo: 'Treinar 3x por semana', unidade: 'x', base: '1', alvo: '3', atual: '3', prazo: '', comentario: '', visivel: true, marcos: [], criadaEm: dia(-40) }] }),
      linhaD('modulo:recursos', { locais: [{ id: 'L1', nome: 'Sala 2', preparacaoMin: 10 }, { id: 'L2', nome: 'Ginásio Central', preparacaoMin: 0 }], turmas: [{ id: 'T1', nome: 'Grupo da manhã', capacidade: 4, inicio: '07:00', fim: '08:00', localId: 'L1', alunos: ['a1', 'a3', 'a6', 'a9'] }], politica: { aceitaPedidos: true, autoAprovar: false, antecedenciaMinHoras: 24, antecedenciaMaxDias: 30, cancelamentoMinHoras: 24, limiteCancelamentosMes: 0 }, listaEspera: [{ id: 'q1', sessaoId: 'T1', studentId: 'a2', em: `${dia(-2)}T10:00:00Z`, estado: 'espera' }, { id: 'q2', sessaoId: 'T1', studentId: 'a7', em: `${dia(-1)}T10:00:00Z`, estado: 'espera' }], pedidos: [], lembretes: [] }),
      linhaD('modulo:desafios', { itens: [{ id: 'd1', nome: '30 dias a mexer', descricao: 'Um pequeno passo por semana.', regras: 'Marque cada etapa quando a fizer.', inicio: dia(-10), fim: dia(20), estado: 'publicado', slug: 'desafio30dias', etapas: [{ id: 'e1', titulo: 'Semana 1: caminhar' }, { id: 'e2', titulo: 'Semana 2: mobilidade' }, { id: 'e3', titulo: 'Semana 3: força' }], consentimento: 'Uso os dados só para este desafio.', pontos: 0 }] }),
      linhaD('modulo:pontos', { ativo: true, regras: null, movimentos: [{ id: 'mv1', chave: 'x1', studentId: 'a1', pontos: 120, motivo: 'Treinos concluídos', em: `${dia(-9)}T10:00:00Z` }, { id: 'mv2', chave: 'x2', studentId: 'a3', pontos: 70, motivo: 'Treinos concluídos', em: `${dia(-9)}T10:00:00Z` }], recompensas: [{ id: 'r1', nome: 'Aula extra', pontos: 100, ativa: true, stock: '' }, { id: 'r2', nome: 'Avaliação oferecida', pontos: 200, ativa: true, stock: '' }], resgates: [] }),
      linhaD('modulo:satisfacao', { pesquisas: [{ id: 'n1', titulo: 'Recomendaria o meu trabalho a um amigo?', ativa: true, criadaEm: dia(-20) }], respostas: [] }),
      linhaD('modulo:mensagens', { modelos: [], campanhas: [{ id: 'c1', titulo: 'Estúdio fechado na segunda', texto: 'Na próxima segunda não há aulas. Obrigada!', alvo: 'todos', alunos: [], grupoId: '', enviarEm: `${dia(-1)}T09:00:00Z`, recorrencia: 'nenhuma', estado: 'ativa' }] }),
      linhaD('modulo:vendas', { pagina: { titulo: 'Treino a sério, à sua medida', subtitulo: 'Personal trainer em Lisboa', sobre: 'Treino pessoas reais, com vidas cheias.', beneficios: 'Plano feito para si\nAvaliação incluída\nAcompanhamento no telemóvel', cta: 'Quero começar', whatsapp: '912345678', planosIds: ['pl1', 'pl2'], consentimento: 'Uso os seus dados só para lhe responder.', slug: 'anamartins', publicada: true }, depoimentos: [{ id: 'dp', texto: 'Nunca fui tão consistente.', autor: 'Rita F.', autorizado: true }], indicacoes: [], ligacaoInscricao: { slug: 'inscricaoana', consentimento: 'Uso os seus dados só para lhe responder.', ativa: true } }),
      linhaD('modulo:documentos', { itens: [{ id: 'dd', studentId: 'a1', titulo: 'Atestado médico', path: `${UID}/dd.pdf`, nome: 'atestado.pdf', tipo: 'application/pdf', visivelAoAluno: true, criadoEm: `${dia(-9)}T10:00:00Z`, quem: 'Ana Martins' }], envios: [{ id: 'env', studentId: 'a1', estado: 'aguarda', em: `${dia(-1)}T10:00:00Z`, modeloId: 'f:parq', modelo: { id: 'f:parq', nome: 'PAR-Q', seccoes: [{ id: 's', titulo: 'Aptidão', perguntas: [{ id: 'q1', texto: 'Sente dor no peito quando faz atividade física?', tipo: 'sim_nao_detalhe', obrigatoria: true, alerta: true }] }] } }] }),
      linhaD('modulo:avaliacoes', { registos: [{ id: 'onl', studentId: 'a1', estado: 'aguarda-aluno', valores: {}, modeloId: 'am:medidas_aluno', modeloCopia: { nome: 'Medidas feitas pelo aluno', campos: [{ id: 'peso', rotulo: 'Peso', tipo: 'numero', unidade: 'kg', instrucoes: 'De manhã, em jejum.' }, { id: 'cintura', rotulo: 'Perímetro da cintura', tipo: 'numero', unidade: 'cm', instrucoes: 'Fita à volta da zona mais estreita.' }] }, tipo: 'online', data: hoje, prazo: dia(7) }], modelos: [], recorrencias: [{ id: 'rc', studentId: 'a2', proxima: dia(-3), intervaloDias: 60, estado: 'ativa' }] }),
      linhaD('modulo:progresso', { publicacoes: [{ id: 'pb', studentId: 'a1', titulo: 'Avaliação de outubro', linhas: [['Peso', '62,3 kg'], ['Massa gorda', '24,2 %']], texto: 'A cintura desceu 3 cm. Bom trabalho.', em: `${dia(-6)}T10:00:00Z` }] }),
      linhaD('modulo:retencao', { regras: null, instantaneos: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n, i) => ({ semana: dia(-7 * n), versaoRegras: 1, ativos: 5 + (i % 3), avaliados: 8, distribuicao: [] })), acoes: [] }),
    ],
    personal_subscriptions: [{ user_id: UID, plan_status: 'active', plan_tier: 'mensal', plan_value: 9.95, billing_interval: 'month', access_granted: true, cancel_at_period_end: false, current_period_start: `${dia(-10)}T00:00:00Z`, current_period_end: '2099-01-01T00:00:00Z', stripe_customer_id: 'cus_x', stripe_subscription_id: 'sub_x', last_payment_status: 'paid' }],
    entradas: [
      { id: 'e1', user_id: UID, aluno_id: 'a3', origem: 'aluno', tipo: 'pedido_aula', ref: '', estado: 'nova', dados: { date: dia(3), startTime: '18:00', endTime: '19:00', notas: 'Pode ser a esta hora?' }, created_at: `${dia(0)}T08:00:00Z` },
      { id: 'e4', user_id: UID, aluno_id: 'a1', origem: 'aluno', tipo: 'checkin', ref: 'c', estado: 'nova', dados: { sono: 3, energia: 4, stress: 2, dor: 4, motivacao: 5, recuperacao: 3 }, created_at: `${dia(0)}T07:30:00Z` },
      { id: 'e6', user_id: UID, aluno_id: null, origem: 'publico', tipo: 'inscricao', ref: 'x', estado: 'nova', dados: { nome: 'Patrícia Dias', email: 'patricia@exemplo.pt', origem: 'inscrição' }, created_at: `${dia(-1)}T10:00:00Z` },
      { id: 'e3', user_id: UID, aluno_id: 'a4', origem: 'aluno', tipo: 'contrato_aceite', ref: 'x', estado: 'nova', dados: { nome: 'Tiago Almeida', titulo: 'Contrato de serviço', versao: 2 }, created_at: `${dia(-1)}T09:00:00Z` },
    ],
    audit_events: [{ id: 'au', user_id: UID, quem: 'Ana Martins', acao: 'Pagamento registado à mão', alvo: 'fv3', dados: {}, created_at: `${dia(-2)}T10:00:00Z` }],
    publico_enderecos: [], cobranca_pagamentos: [], notificacao_leituras: [], push_subscricoes: [], aluno_acessos: [], aluno_contas: [], conteudos: [{ id: 'ct', titulo: 'Como falar de preços com um aluno novo', categoria: 'Negócio', corpo: 'Comece pelo objetivo da pessoa, e só depois pelo preço.', autor: 'PTMANAGER', fontes: '', revisto_em: dia(-30), publicado: true }],
  };
}

const ENDERECOS = { anamartins: { slug: 'anamartins', ativo: true, tipo: 'vendas', ref: 'pagina', dados: { titulo: 'Treino a sério, à sua medida', subtitulo: 'Personal trainer em Lisboa', sobre: 'Treino pessoas reais, com vidas cheias. Um plano que cabe na sua semana.', beneficios: ['Plano feito para si', 'Avaliação incluída', 'Acompanhamento no telemóvel'], cta: 'Quero começar', whatsapp: '912345678', consentimento: 'Uso os seus dados só para lhe responder.', planos: [{ nome: 'Mensal 2x por semana', preco: '150,00 €', descricao: 'Duas aulas por semana' }, { nome: 'Pack 10 aulas', preco: '340,00 €', descricao: 'Sem data limite' }], depoimentos: [{ texto: 'Nunca fui tão consistente.', autor: 'Rita F.' }] } } };

// Um toque visível, como a opção «mostrar toques» de um telemóvel.
const TOQUES = () => {
  const css = document.createElement('style');
  css.textContent = '.__t{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(255,255,255,.42);box-shadow:0 0 0 1px rgba(0,0,0,.18);pointer-events:none;z-index:2147483647;animation:__t .46s cubic-bezier(.23,1,.32,1) forwards}@keyframes __t{from{transform:scale(.7);opacity:1}to{transform:scale(1.25);opacity:0}}html{scrollbar-width:none}::-webkit-scrollbar{display:none}';
  const pôr = () => (document.head || document.documentElement).appendChild(css);
  pôr();
  document.addEventListener('pointerdown', (e) => { const d = document.createElement('div'); d.className = '__t'; d.style.left = `${e.clientX}px`; d.style.top = `${e.clientY}px`; document.documentElement.appendChild(d); setTimeout(() => d.remove(), 500); }, true);
};

export async function abrir(browser, { url = '/', sessao: comSessao = true, via = 'conta', banco = novoBanco(), tema = 'dark' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: tema, serviceWorkers: 'block', locale: 'pt-PT', timezoneId: 'Europe/Lisbon' });
  const page = await ctx.newPage();
  page.setDefaultTimeout(9000);
  await page.addInitScript(TOQUES);
  if (comSessao) await page.addInitScript((s) => { localStorage.setItem('sb-falso-auth-token', s); localStorage.setItem('ptmanager:idioma', 'pt'); }, JSON.stringify({ access_token: jwt, refresh_token: 'r', expires_at: 4102444800, expires_in: 99999999, token_type: 'bearer', user }));
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*', 'Content-Type': 'application/json' };
  await page.route('**/turnstile/**', (r) => r.fulfill({ contentType: 'text/javascript', body: 'window.turnstile={render:(e,o)=>{setTimeout(()=>o.callback("tok"),0);return "i"},remove(){},reset(){}};' }));
  await page.route(/youtube-nocookie|fonts\.g/, (r) => r.abort());
  const blocoAluno = () => { const v = (k) => banco.app_data.find((l) => l.data_key === k)?.value; const mods = {}; banco.app_data.filter((l) => l.data_key.startsWith('modulo:')).forEach((l) => { mods[l.data_key.slice(7)] = l.value; }); return { alunos: v('alunos'), treinos: v('treinos'), agenda: v('agenda'), execucao: v('execucoes:a1'), modulos: mods, leituras: banco.notificacao_leituras.map((x) => x.id), pagamentos: [], respondidas: banco.__resp || (banco.__resp = []) }; };
  await page.route('https://falso.supabase.co/**', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    const res = (o, status = 200) => route.fulfill({ status, headers: cors, body: o === undefined ? '' : JSON.stringify(o) });
    if (req.method() === 'OPTIONS') return res({});
    if (u.pathname.startsWith('/auth/v1/user')) return res(user);
    if (u.pathname.startsWith('/auth/v1/')) return res({});
    if (u.pathname.startsWith('/functions/v1/')) {
      const nome = u.pathname.split('/').pop();
      const c = req.postDataJSON() || {};
      const agoraMs = Date.now();
      if (nome === 'cobranca-onboarding') return res({ ativa: false, motivo: 'x' });
      if (nome === 'aluno-view') return res(V.vistaDoAluno(blocoAluno(), 'a1', { hoje: dia(0), agoraMs, via }));
      if (nome === 'aluno-acao') {
        const b = blocoAluno(); const vista = V.vistaDoAluno(b, 'a1', { hoje: dia(0), agoraMs, via });
        const v = A.validarAcao(c.op, c.dados, { via, vista, agenda: b.agenda, alunoId: 'a1', agoraMs });
        if (v.erro) return res({ error: v.erro }, 400);
        if (v.entrada) { b.respondidas.push(v.entrada.ref); return res({ ok: true }); }
        return res({ ok: true, url: 'https://exemplo.pt/x' });
      }
      if (nome === 'aluno-registar-sessao') return res({ ok: true });
      if (nome === 'publico') {
        const e = ENDERECOS[c.slug];
        if (!e) return res({ error: 'x' }, 404);
        if (c.op === 'ver') return res({ pagina: A.retratoPublico(e) });
        return res({ ok: true });
      }
      return res({ error: 'x' }, 404);
    }
    if (u.pathname.startsWith('/storage/v1/')) {
      if (u.pathname.includes('/object/list/')) return res([]);
      if (u.pathname.includes('/object/sign/')) return res({ signedURL: '/object/sign/x?token=t' });
      return res({ Key: u.pathname, Id: 'x' });
    }
    if (u.pathname.startsWith('/rest/v1/')) {
      const tabela = u.pathname.split('/').pop();
      if (tabela.startsWith('rpc') || !(tabela in banco)) return res(tabela === 'is_creator_account' ? false : []);
      const filtros = [...u.searchParams.entries()].filter(([k]) => !['select', 'order', 'limit', 'on_conflict', 'offset'].includes(k));
      const passa = (l) => filtros.every(([k, v]) => {
        if (v.startsWith('eq.')) return String(l[k]) === v.slice(3);
        if (v.startsWith('in.(')) return v.slice(4, -1).split(',').includes(String(l[k]));
        if (v === 'is.null') return l[k] == null;
        if (v.startsWith('like.')) return String(l[k]).startsWith(v.slice(5).replace(/[%*]$/, ''));
        return true;
      });
      const m = req.method();
      const rep = (req.headers().prefer || '').includes('return=representation');
      if (m === 'GET' || m === 'HEAD') {
        const r = banco[tabela].filter(passa);
        if ((req.headers().accept || '').includes('vnd.pgrst.object')) return r.length ? res(r[0]) : res({ code: 'PGRST116' }, 406);
        return res(r);
      }
      if (m === 'POST') {
        const cp = req.postDataJSON();
        const novos = (Array.isArray(cp) ? cp : [cp]).map((x) => ({ updated_at: new Date().toISOString(), created_at: new Date().toISOString(), id: x.id || `id${Math.random()}`, ...x }));
        const ch = u.searchParams.get('on_conflict');
        novos.forEach((n) => { const i = ch ? banco[tabela].findIndex((l) => ch.split(',').every((c) => l[c] === n[c])) : -1; if (i >= 0) banco[tabela][i] = { ...banco[tabela][i], ...n }; else banco[tabela].push(n); });
        return rep ? res(novos, 201) : res(undefined, 201);
      }
      if (m === 'PATCH') {
        const c = req.postDataJSON(); const al = [];
        banco[tabela] = banco[tabela].map((l) => { if (!passa(l)) return l; const n = { ...l, ...c, updated_at: c.updated_at || new Date().toISOString() }; al.push(n); return n; });
        return rep ? res(al) : res(undefined, 204);
      }
      if (m === 'DELETE') { banco[tabela] = banco[tabela].filter((l) => !passa(l)); return res(rep ? [] : undefined, rep ? 200 : 204); }
    }
    return res({}, 404);
  });
  await page.goto(BASE + url, { timeout: 60000 });
  return { page, ctx, banco };
}

export const espera = (page, ms) => page.waitForTimeout(ms);
// Toca com calma, como uma pessoa: mostra o sítio, espera, toca.
export async function toca(page, alvo, depois = 700) {
  const l = alvo.first ? alvo.first() : alvo;
  await l.waitFor({ state: 'visible' });
  await l.scrollIntoViewIfNeeded();
  await page.waitForTimeout(280);
  await l.tap();
  await page.waitForTimeout(depois);
}
export async function escreve(page, alvo, texto) {
  await alvo.scrollIntoViewIfNeeded();
  await alvo.tap();
  await page.waitForTimeout(150);
  await alvo.pressSequentially(texto, { delay: 55 });
  await page.waitForTimeout(350);
}
// Deslize suave no elemento que tiver scroll.
export async function desliza(page, px, ms = 1100) {
  await page.evaluate(async ({ px, ms }) => {
    const candidatos = [...document.querySelectorAll('[role=dialog] *')].filter((e) => e.scrollHeight > e.clientHeight + 20 && getComputedStyle(e).overflowY !== 'visible');
    const el = candidatos[0] || document.scrollingElement;
    const ini = el.scrollTop; const t0 = performance.now();
    el.style.scrollBehavior = 'auto'; document.documentElement.style.scrollBehavior = 'auto';
    await new Promise((fim) => { const f = (t) => { const p = Math.min(1, (t - t0) / ms); const e = p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2; el.scrollTop = ini + px * e; if (p < 1) requestAnimationFrame(f); else fim(); }; requestAnimationFrame(f); });
  }, { px, ms });
  await page.waitForTimeout(350);
}

export async function grava(page, nome, fn) {
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => { frames.push({ t: metadata.timestamp, data }); cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, everyNthFrame: 1, maxWidth: 780, maxHeight: 1688 });
  await page.waitForTimeout(500);
  let erro = null;
  try { await fn(); } catch (e) { erro = e; await page.screenshot({ path: `${SP}/${nome}-ERRO.png` }).catch(() => {}); }
  await page.waitForTimeout(900);
  await cdp.send('Page.stopScreencast').catch(() => {});
  await page.waitForTimeout(150);
  const dir = `${SP}/tmp-${nome}`;
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const fim = (frames.at(-1)?.t || 0) + 0.8;
  const linhas = [];
  frames.forEach((f, i) => { const nomeF = `${String(i).padStart(5, '0')}.jpg`; fs.writeFileSync(path.join(dir, nomeF), Buffer.from(f.data, 'base64')); linhas.push(`file '${nomeF}'`, `duration ${Math.max(0.01, (frames[i + 1]?.t ?? fim) - f.t).toFixed(3)}`); });
  linhas.push(`file '${String(frames.length - 1).padStart(5, '0')}.jpg'`);
  fs.writeFileSync(path.join(dir, 'lista.txt'), linhas.join('\n'));
  const mp4 = `${SAIDA}/${nome}.mp4`;
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'lista.txt', '-vf', 'fps=30,scale=600:-2:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'veryslow', '-crf', '30', '-movflags', '+faststart', '-an', mp4], { cwd: dir });
  const dur = (fim - frames[0].t).toFixed(1);
  // Cartaz: o último fotograma, e uma folha de contacto para rever.
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-sseof', '-0.4', '-i', mp4, '-frames:v', '1', '-q:v', '5', `${SAIDA}/${nome}.jpg`]);
  fs.mkdirSync(SP, { recursive: true });
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', mp4, '-vf', `fps=${(8 / Number(dur)).toFixed(3)},scale=180:-2,tile=8x1`, '-frames:v', '1', `${SP}/${nome}-folha.jpg`]);
  fs.rmSync(dir, { recursive: true, force: true });
  const kb = Math.round(fs.statSync(mp4).size / 1024);
  console.log(`${nome}: ${dur}s, ${kb} KB, ${frames.length} fotogramas${erro ? ` · ERRO: ${String(erro.message).split('\n').slice(0, 3).join(' ').slice(0, 260)}` : ''}`);
}
export { hoje };
