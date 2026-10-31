/*
 * CRM: pipeline de contactos, importação de alunos por CSV, tarefas e regras de
 * automação «quando/então». Tudo regras explícitas; nenhum texto é gerado.
 */
export const ETAPAS_LEAD = [
  { id: 'novo', rotulo: 'Lead novo' }, { id: 'contactado', rotulo: 'Contactado' }, { id: 'agendado', rotulo: 'Avaliação ou experimental' },
  { id: 'proposta', rotulo: 'Proposta enviada' }, { id: 'decisao', rotulo: 'Em decisão' }, { id: 'convertido', rotulo: 'Convertido' }, { id: 'perdido', rotulo: 'Perdido' },
];
const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const soDigitos = (t) => String(t || '').replace(/\D/g, '');

// A mesma pessoa, por email ou telefone. Os dois vazios nunca coincidem.
export function mesmaPessoa(a, b) {
  const ea = semAcento(a.email); const eb = semAcento(b.email);
  const ta = soDigitos(a.phone ?? a.telefone); const tb = soDigitos(b.phone ?? b.telefone);
  return Boolean((ea && ea === eb) || (ta && ta === tb));
}

// Um pedido público entra uma só vez, mesmo que venha repetido.
export function juntarLead(leads, entrada, { gerarId, agora }) {
  const existente = (leads || []).find((l) => mesmaPessoa(l, entrada));
  const atividade = { em: agora, texto: `Pedido recebido${entrada.origem ? ` (${entrada.origem})` : ''}` };
  if (existente) return { leads: leads.map((l) => (l.id === existente.id ? { ...l, atividades: [...(l.atividades || []), atividade] } : l)), lead: existente, novo: false };
  const lead = { id: gerarId(), nome: entrada.nome || '', email: entrada.email || '', telefone: entrada.telefone || '', origem: entrada.origem || 'manual', utm: entrada.utm || '', etapa: 'novo', valor: 0, proximoContacto: '', notas: entrada.notas || '', etiquetas: [], criadoEm: agora, atividades: [atividade] };
  return { leads: [...(leads || []), lead], lead, novo: true };
}

// Converter nunca cria um segundo aluno da mesma pessoa.
export function converterLead(lead, alunos, { gerarId, cor, hoje }) {
  const existente = (alunos || []).find((a) => mesmaPessoa(a, lead));
  if (existente) return { aluno: existente, novo: false };
  return {
    novo: true,
    aluno: {
      id: gerarId(), name: lead.nome, color: cor, active: true, memberNumber: '', sex: '', planType: '1x por semana', paymentMode: 'mensal', planValue: 0, biweeklyValue: 0, quinzenasPagas: {}, taxPercent: 0, gymFeeType: 'percent', gymFeeValue: 0, phone: lead.telefone || '', email: lead.email || '', height: '', notes: lead.notas || '', startDate: hoje, origem: lead.origem || '',
    },
  };
}

/* ---------------------------- CSV ---------------------------- */

export function lerCsv(texto) {
  const limpo = String(texto || '').replace(/^﻿/, '');
  const sep = (limpo.split('\n')[0].match(/;/g) || []).length >= (limpo.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  const linhas = []; const numeros = []; let campo = ''; let linha = []; let aspas = false; let fisica = 1; let inicioDaLinha = 1;
  for (let i = 0; i < limpo.length; i += 1) {
    const c = limpo[i];
    if (aspas) {
      if (c === '\n') fisica += 1;
      if (c === '"' && limpo[i + 1] === '"') { campo += '"'; i += 1; } else if (c === '"') aspas = false; else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ''; } else if (c === '\n' || c === '\r') {
      if (c === '\r' && limpo[i + 1] === '\n') i += 1;
      linha.push(campo); campo = '';
      if (linha.some((x) => x.trim())) { linhas.push(linha); numeros.push(inicioDaLinha); }
      linha = []; fisica += 1; inicioDaLinha = fisica;
    } else campo += c;
  }
  linha.push(campo);
  if (linha.some((x) => x.trim())) { linhas.push(linha); numeros.push(inicioDaLinha); }
  return { cabecalho: (linhas[0] || []).map((x) => x.trim()), linhas: linhas.slice(1), numeros: numeros.slice(1) };
}

export const CAMPOS_IMPORTACAO = [
  { id: 'name', rotulo: 'Nome', obrigatorio: true, procura: ['nome', 'name', 'aluno'] },
  { id: 'phone', rotulo: 'Telefone', procura: ['telefone', 'telemovel', 'phone', 'contacto'] },
  { id: 'email', rotulo: 'Email', procura: ['email', 'e-mail', 'mail'] },
  { id: 'planValue', rotulo: 'Valor do plano', procura: ['valor', 'preco', 'plano valor', 'mensalidade'] },
  { id: 'notes', rotulo: 'Notas', procura: ['notas', 'observacoes', 'obs'] },
];

export function mapearColunas(cabecalho) {
  const mapa = {};
  CAMPOS_IMPORTACAO.forEach((c) => {
    const i = cabecalho.findIndex((h) => c.procura.includes(semAcento(h)));
    if (i >= 0) mapa[c.id] = i;
  });
  return mapa;
}

// O relatório diz, linha a linha, o que entra e porque não entra o resto.
export function prepararImportacao({ linhas, numeros }, mapa, alunos) {
  const validos = []; const erros = [];
  const vistos = [...(alunos || [])];
  linhas.forEach((l, i) => {
    const v = {};
    Object.entries(mapa).forEach(([campo, col]) => { v[campo] = String(l[col] ?? '').trim(); });
    const n = numeros ? numeros[i] : i + 2;
    if (!v.name) { erros.push({ linha: n, motivo: 'Sem nome' }); return; }
    if (vistos.some((a) => mesmaPessoa(a, v))) { erros.push({ linha: n, motivo: `Já existe: ${v.name}` }); return; }
    const valor = v.planValue ? Number(String(v.planValue).replace(',', '.')) : 0;
    if (!Number.isFinite(valor) || valor < 0) { erros.push({ linha: n, motivo: `Valor inválido: ${v.planValue}` }); return; }
    const novo = { ...v, planValue: valor };
    validos.push(novo); vistos.push(novo);
  });
  return { validos, erros };
}

/* ---------------------------- tarefas ---------------------------- */

export function vistaDeTarefas(tarefas, hoje) {
  const abertas = (tarefas || []).filter((t) => !t.feita);
  const porData = (a, b) => String(a.data || '9').localeCompare(String(b.data || '9'));
  return {
    atrasadas: abertas.filter((t) => t.data && t.data < hoje).sort(porData),
    hoje: abertas.filter((t) => t.data === hoje),
    proximas: abertas.filter((t) => !t.data || t.data > hoje).sort(porData),
    feitas: (tarefas || []).filter((t) => t.feita),
  };
}

/* ---------------------------- automações ---------------------------- */

export const GATILHOS = {
  avaliacao_proxima: { rotulo: 'Faltam X dias para uma avaliação', comDias: true },
  fatura_vencida: { rotulo: 'Uma fatura venceu' },
  credito_a_expirar: { rotulo: 'Um crédito de reposição expira em X dias', comDias: true },
  aluno_em_risco: { rotulo: 'Um aluno entrou Em risco' },
  treino_concluido: { rotulo: 'Um treino foi concluído' },
};
export const ACOES = { criar_tarefa: 'Criar uma tarefa' };

// Devolve as tarefas novas. A chave de cada ocorrência impede que a regra volte a
// disparar para o mesmo caso, e por isso também não pode entrar em ciclo.
export function correrRegras(regras, factos, { feitos = [], hoje, gerarId, limitePorRegra = 20 }) {
  const jaFeitos = new Set(feitos);
  const tarefas = []; const registo = [];
  (regras || []).filter((r) => r.ativa).forEach((r) => {
    let n = 0;
    (factos[r.gatilho] || []).forEach((f) => {
      if (r.dias !== undefined && f.dias !== undefined && Number(f.dias) > Number(r.dias)) return;
      const chave = `${r.id}:${f.chave}`;
      if (jaFeitos.has(chave) || n >= limitePorRegra) return;
      jaFeitos.add(chave); n += 1;
      tarefas.push({ id: gerarId(), titulo: (r.titulo || f.titulo || 'Tarefa').replace('{nome}', f.nome || ''), studentId: f.studentId || '', data: hoje, prioridade: r.prioridade || 'normal', origem: `regra:${r.id}`, feita: false, criadaEm: hoje });
      registo.push({ chave, regraId: r.id, em: hoje });
    });
  });
  return { tarefas, registo };
}

/* ---------------------------- mensagens ---------------------------- */

const VARIAVEIS = { primeiro_nome: 'primeiroNome', nome: 'nome', data: 'data', treino: 'treino', vencimento: 'vencimento' };
export const LISTA_VARIAVEIS = Object.keys(VARIAVEIS);
// Só as variáveis conhecidas se substituem; o que não se sabe fica à vista, para se
// notar na pré-visualização em vez de ir vazio.
export function preencherMensagem(texto, dados) {
  return String(texto || '').replace(/\{(\w+)\}/g, (m, k) => {
    const campo = VARIAVEIS[k];
    return campo && dados[campo] ? dados[campo] : m;
  });
}

export const MODELOS_SUGERIDOS = {
  retencao: [
    { titulo: 'Sentimos a sua falta', texto: 'Olá {primeiro_nome}, já há algum tempo que não treina. Está tudo bem? Diga-me se quer ajustar o plano.' },
    { titulo: 'Voltar com calma', texto: 'Olá {primeiro_nome}, quando quiser voltar, preparo um regresso leve. É só dizer.' },
    { titulo: 'Marcar conversa', texto: 'Olá {primeiro_nome}, podemos falar 5 minutos esta semana sobre o seu treino?' },
  ],
  agenda: [
    { titulo: 'Lembrete de aula', texto: 'Olá {primeiro_nome}, lembro que tem aula em {data}. Até lá!' },
    { titulo: 'Reposição disponível', texto: 'Olá {primeiro_nome}, tem uma reposição por marcar. Diga-me que dia lhe dá jeito.' },
    { titulo: 'Avaliação a chegar', texto: 'Olá {primeiro_nome}, está na altura da sua avaliação. Marcamos para {data}?' },
  ],
  cobranca: [
    { titulo: 'Fatura a vencer', texto: 'Olá {primeiro_nome}, a sua fatura vence em {vencimento}.' },
    { titulo: 'Fatura vencida', texto: 'Olá {primeiro_nome}, a fatura de {vencimento} continua por pagar. Precisa de ajuda?' },
    { titulo: 'Obrigado', texto: 'Olá {primeiro_nome}, recebi o pagamento. Obrigado!' },
  ],
};

const DIAS_MS = 86400000;
// A ocorrência mais recente de uma campanha que já deva estar visível, no fuso do
// aluno. Sem servidor a enviar: quem abre a área vê o que já está em vigor.
export function ocorrenciaAtual(c, agoraMs) {
  if (c.estado !== 'ativa') return null;
  const inicio = Date.parse(c.enviarEm);
  if (!Number.isFinite(inicio) || inicio > agoraMs) return null;
  if (!c.recorrencia || c.recorrencia === 'nenhuma') return { id: `${c.id}:0`, em: c.enviarEm };
  const dias = Math.floor((agoraMs - inicio) / DIAS_MS);
  for (let d = dias; d >= Math.max(0, dias - 7); d -= 1) {
    const t = inicio + d * DIAS_MS;
    const dia = new Date(t).getUTCDay();
    if (c.recorrencia === 'diaria' || (c.recorrencia === 'semanal' && d % 7 === 0) || (c.recorrencia === 'dias' && (c.dias || []).includes(dia))) {
      return { id: `${c.id}:${d}`, em: new Date(t).toISOString() };
    }
  }
  return null;
}

export const destinatarios = (c, alunos, grupos) => {
  if (c.alvo === 'todos') return alunos.filter((a) => a.active !== false);
  if (c.alvo === 'grupo') { const g = (grupos || []).find((x) => x.id === c.grupoId); return alunos.filter((a) => g && (g.alunos || []).includes(a.id)); }
  return alunos.filter((a) => (c.alunos || []).includes(a.id));
};
