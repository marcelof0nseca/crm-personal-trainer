/*
 * Planos e faturas que o aluno paga ao treinador. É outro domínio da subscrição que
 * o treinador paga ao PTMANAGER: nomes, tabelas e webhooks separados. Valores em
 * cêntimos inteiros, com moeda explícita. Uma fatura só fica paga por confirmação
 * do fornecedor ou por decisão do treinador registada à mão, nunca por inferência.
 */
export const ESTADOS_FATURA = {
  rascunho: 'Rascunho', aberta: 'Aberta', parcial: 'Parcialmente paga', paga: 'Paga', vencida: 'Vencida', anulada: 'Anulada', reembolsada: 'Reembolsada', incobravel: 'Incobrável',
};
export const CADENCIAS = { mensal: 1, trimestral: 3, anual: 12, livre: 0, pacote: 0 };

export function paraCentimos(texto) {
  const t = String(texto == null ? '' : texto).trim().replace(/\s|€/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const [e, d = ''] = t.split('.');
  return Number(e) * 100 + Number(d.padEnd(2, '0'));
}
export function formatar(centimos, moeda = 'EUR') {
  return (Number(centimos || 0) / 100).toLocaleString('pt-PT', { style: 'currency', currency: moeda });
}

// Desconto e imposto em pontos-base inteiros (2300 = 23%), para não haver floats.
export function totais(itens, { descontoBp = 0, impostoBp = 0 } = {}) {
  const subtotal = (itens || []).reduce((s, i) => s + Math.round(Number(i.centimos) || 0) * (Number(i.quantidade) || 1), 0);
  const desconto = Math.round((subtotal * descontoBp) / 10000);
  const base = subtotal - desconto;
  const imposto = Math.round((base * impostoBp) / 10000);
  return { subtotal, desconto, imposto, total: base + imposto };
}

export function pagoDe(f) {
  return (f.pagamentos || []).filter((p) => p.estado === 'confirmado').reduce((s, p) => s + p.centimos, 0)
    - (f.reembolsos || []).reduce((s, r) => s + r.centimos, 0);
}

// O estado deriva dos pagamentos e da data; só os estados de decisão se gravam.
export function estadoDaFatura(f, hoje) {
  if (['rascunho', 'anulada', 'incobravel'].includes(f.estado)) return f.estado;
  const total = totais(f.itens, f).total;
  const pago = pagoDe(f);
  if ((f.reembolsos || []).length > 0 && pago <= 0) return 'reembolsada';
  if (total > 0 && pago >= total) return 'paga';
  if (pago > 0) return 'parcial';
  if (f.vencimento && f.vencimento < hoje) return 'vencida';
  return 'aberta';
}

export function registarPagamento(f, { id, centimos, metodo, referencia, em, origem }) {
  // A mesma referência do fornecedor não conta duas vezes.
  if ((f.pagamentos || []).some((p) => p.id === id || (referencia && p.referencia === referencia))) return f;
  return { ...f, pagamentos: [...(f.pagamentos || []), { id, centimos, metodo, referencia: referencia || '', em, origem, estado: 'confirmado' }] };
}

export function reembolsar(f, { id, centimos, em, motivo }) {
  if (centimos <= 0 || centimos > pagoDe(f)) return { ok: false, erro: 'O reembolso não pode passar do que foi pago.' };
  if ((f.reembolsos || []).some((r) => r.id === id)) return { ok: true, fatura: f };
  return { ok: true, fatura: { ...f, reembolsos: [...(f.reembolsos || []), { id, centimos, em, motivo }] } };
}

const somarMeses = (iso, m) => {
  const [a, mes, d] = iso.split('-').map(Number);
  const alvo = new Date(Date.UTC(a, mes - 1 + m, 1));
  const ultimo = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(d, ultimo));
  return alvo.toISOString().slice(0, 10);
};

// As faturas em falta de um contrato até à data. O id vem do contrato e do período:
// correr duas vezes não duplica nenhuma dívida. Mudar o preço só vale para as seguintes.
export function faturasEmFalta(contrato, faturas, hoje) {
  const novas = [];
  if (contrato.estado !== 'ativo') return novas;
  const meses = contrato.cadenciaMeses || CADENCIAS[contrato.cadencia] || 0;
  let data = contrato.proximaFatura || contrato.inicio;
  let n = 0;
  while (data && data <= hoje && (!contrato.fim || data <= contrato.fim) && n < 36) {
    const id = `fat-${contrato.id}-${data}`;
    if (!(faturas || []).some((f) => f.id === id)) {
      novas.push({
        id, contratoId: contrato.id, studentId: contrato.studentId, estado: 'aberta', moeda: contrato.moeda || 'EUR', emissao: data, vencimento: data, descontoBp: contrato.descontoBp || 0, impostoBp: contrato.impostoBp || 0,
        itens: [{ descricao: contrato.nome, centimos: contrato.centimos, quantidade: 1 }], pagamentos: [], reembolsos: [],
      });
    }
    if (!meses) break;
    data = somarMeses(data, meses); n += 1;
  }
  return novas;
}

export function proximaDoContrato(contrato, hoje) {
  const meses = contrato.cadenciaMeses || CADENCIAS[contrato.cadencia] || 0;
  if (!meses) return null;
  let data = contrato.proximaFatura || contrato.inicio;
  while (data <= hoje) data = somarMeses(data, meses);
  return data;
}

// Restringir o acesso só com a política ligada, passada a tolerância, e nunca o que
// é dever manter acessível (consentimentos, recibos, exportação de dados).
export function acessoRestrito(politica, faturas, hoje) {
  if (!politica || !politica.restringir) return false;
  const margem = Number(politica.toleranciaDias) || 0;
  return (faturas || []).some((f) => {
    if (f.override || estadoDaFatura(f, hoje) !== 'vencida') return false;
    const limite = new Date(`${f.vencimento}T00:00:00Z`); limite.setUTCDate(limite.getUTCDate() + margem);
    return limite.toISOString().slice(0, 10) < hoje;
  });
}

export function relatorio(faturas, { de, ate, hoje }) {
  const r = { aReceber: 0, recebido: 0, vencido: 0, reembolsado: 0, porMetodo: {}, porPlano: {} };
  (faturas || []).filter((f) => f.emissao >= de && f.emissao <= ate).forEach((f) => {
    const estado = estadoDaFatura(f, hoje);
    if (['rascunho', 'anulada'].includes(estado)) return;
    const total = totais(f.itens, f).total;
    const pago = pagoDe(f);
    (f.pagamentos || []).forEach((p) => { r.porMetodo[p.metodo] = (r.porMetodo[p.metodo] || 0) + p.centimos; });
    (f.reembolsos || []).forEach((x) => { r.reembolsado += x.centimos; });
    r.recebido += Math.max(0, pago);
    const nome = f.itens[0]?.descricao || 'Sem plano';
    r.porPlano[nome] = (r.porPlano[nome] || 0) + total;
    if (estado === 'incobravel') return;
    const falta = Math.max(0, total - pago);
    if (estado === 'vencida') r.vencido += falta; else r.aReceber += falta;
  });
  return r;
}

// MRR dos clientes do treinador: normalizado por mês e à parte do da plataforma.
export function mrrClientes(contratos) {
  return (contratos || []).filter((c) => c.estado === 'ativo').reduce((s, c) => {
    const meses = c.cadenciaMeses || CADENCIAS[c.cadencia] || 0;
    return meses ? s + Math.round(c.centimos / meses) : s;
  }, 0);
}

/* ---------------------------- contratos digitais ---------------------------- */

// O texto aceite fica copiado: mudar o modelo depois não altera o que foi aceite.
export function aceitarContrato(modelo, { studentId, nome, em, id, assinaturaId }) {
  return { id, modeloId: modelo.id, versao: modelo.versao || 1, titulo: modelo.titulo, texto: modelo.texto, studentId, nome, aceiteEm: em, assinaturaId: assinaturaId || '', tipo: 'aceite eletrónico simples' };
}
export const novaVersaoModelo = (m, texto) => ({ ...m, texto, versao: (m.versao || 1) + 1 });
