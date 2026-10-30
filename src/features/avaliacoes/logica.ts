/*
 * Avaliações modulares: postural, funcional, neuromotora e modelos próprios, com
 * rascunho, revisões com motivo, resposta do aluno e recorrência. A avaliação física
 * da agenda continua onde estava. Mostra resultados brutos: não classifica, não
 * prevê e não diagnostica (CLAUDE.md, 10b).
 */
export const MAX_VERSOES = 20;
const sim = (rotulo) => ({ rotulo });
const numero = (id, rotulo, unidade, extra = {}) => ({ id, rotulo, tipo: 'numero', unidade, tentativas: 1, regra: 'melhor', ...extra });
const padrao = (id, rotulo) => ({ id, rotulo, tipo: 'escala', min: 0, max: 3, lados: true, comDor: true, comNota: true });

export const MODELOS_BASE = [
  {
    id: 'am:funcional', base: true, nome: 'Bateria funcional', categoria: 'funcional',
    ajuda: 'Escala de 0 a 3 definida por si. Regista o que observou; não infere nenhuma patologia.',
    campos: [
      padrao('agachar', 'Agachar'), padrao('avancar', 'Avançar'), padrao('anca', 'Dobrar a anca'), padrao('empurrar', 'Empurrar'),
      padrao('puxar', 'Puxar'), padrao('elevar', 'Elevar'), padrao('rodar', 'Rodar'), padrao('caminhar', 'Caminhar'),
      padrao('degrau', 'Subir degrau'), padrao('sentar', 'Sentar e levantar'), padrao('equilibrio', 'Equilíbrio'), padrao('tronco', 'Estabilidade do tronco'),
    ],
  },
  {
    id: 'am:neuromotora', base: true, nome: 'Avaliação neuromotora', categoria: 'neuromotora',
    ajuda: 'Resultado bruto de cada tentativa. As referências populacionais, se as usar, não são um diagnóstico.',
    campos: [
      numero('sentar_alcancar', 'Flexibilidade: sentar e alcançar', 'cm', { tentativas: 3, min: -40, max: 80 }),
      numero('flexoes', 'Resistência: flexões em 1 minuto', 'reps', { min: 0, max: 200 }),
      numero('abdominais', 'Resistência: abdominais em 1 minuto', 'reps', { min: 0, max: 200 }),
      numero('salto_vertical', 'Impulsão: salto vertical', 'cm', { tentativas: 3, min: 0, max: 150 }),
      numero('salto_horizontal', 'Impulsão: salto horizontal', 'cm', { tentativas: 3, min: 0, max: 400 }),
      numero('carga_maxima', 'Carga máxima (1RM)', 'kg', { tentativas: 3, min: 0, max: 600 }),
      { id: 'carga_exercicio', rotulo: 'Exercício da carga máxima', tipo: 'texto' },
    ],
  },
  {
    id: 'am:medidas_aluno', base: true, nome: 'Medidas feitas pelo aluno', categoria: 'online', online: true,
    ajuda: 'Para enviar ao aluno. Fica à espera da sua revisão antes de contar como avaliação.',
    campos: [
      numero('peso', 'Peso', 'kg', { min: 20, max: 300, instrucoes: 'De manhã, em jejum, com pouca roupa.' }),
      numero('cintura', 'Perímetro da cintura', 'cm', { min: 30, max: 250, instrucoes: 'Fita à volta da zona mais estreita, sem apertar.' }),
      numero('anca', 'Perímetro da anca', 'cm', { min: 30, max: 250, instrucoes: 'Fita à volta da zona mais larga.' }),
      { id: 'notas', rotulo: 'Notas', tipo: 'texto' },
    ],
  },
];
void sim;

export const VISTAS_POSTURAIS = [
  { id: 'frontal', rotulo: 'Frontal' }, { id: 'posterior', rotulo: 'Posterior' },
  { id: 'lateral_d', rotulo: 'Lateral direita' }, { id: 'lateral_e', rotulo: 'Lateral esquerda' },
];

const num = (v) => { const x = parseFloat(String(v == null ? '' : v).replace(',', '.')); return Number.isFinite(x) ? x : null; };

// O que conta de várias tentativas, segundo a regra do campo.
export function resultadoDeTentativas(tentativas, regra = 'melhor') {
  const nums = (tentativas || []).map(num).filter((x) => x !== null);
  if (!nums.length) return null;
  if (regra === 'media') return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
  return Math.max(...nums);
}

export function valorDoCampo(campo, valor) {
  if (!valor) return null;
  if (campo.tipo === 'texto' || campo.tipo === 'selecao') return valor.unico?.[0] || null;
  if (campo.lados) return { d: resultadoDeTentativas(valor.d, campo.regra), e: resultadoDeTentativas(valor.e, campo.regra) };
  return resultadoDeTentativas(valor.unico, campo.regra);
}

// Diferença entre lados em relação ao maior. Só com os dois lados medidos.
export function assimetria(d, e) {
  const a = num(d); const b = num(e);
  if (a === null || b === null) return null;
  const maior = Math.max(Math.abs(a), Math.abs(b));
  if (maior === 0) return 0;
  return Math.round((Math.abs(a - b) / maior) * 100);
}

// Valores fora do plausível avisam, nunca se corrigem sozinhos.
export function foraDoPlausivel(campo, v) {
  const x = num(v);
  if (x === null) return false;
  return (campo.min !== undefined && x < campo.min) || (campo.max !== undefined && x > campo.max);
}

export function camposEmFalta(modelo, valores) {
  return modelo.campos.filter((c) => {
    if (c.tipo === 'texto' || !c.obrigatorio) return false;
    const v = valores[c.id];
    return !v || ![...(v.unico || []), ...(v.d || []), ...(v.e || [])].some((x) => num(x) !== null);
  });
}

// A primeira gravação como final, ou mexer num final, cria revisão; rascunho sobre
// rascunho não. Alterar um documento final exige motivo.
export function gravarRegisto(anterior, novo, { estado, motivo, quem, agora, gerarId }) {
  if (!anterior) {
    return { ok: true, registo: { ...novo, id: novo.id || gerarId(), estado, criadoEm: agora, criadoPor: quem, editadoEm: agora, editadoPor: quem, versoes: [] } };
  }
  const eraFinal = anterior.estado === 'final';
  if (eraFinal && !String(motivo || '').trim()) return { ok: false, erro: 'Indique o motivo da alteração a um documento final.' };
  const { versoes = [], ...semVersoes } = anterior;
  const criaVersao = eraFinal || estado === 'final';
  const versao = { v: versoes.length + 1, em: agora, quem, motivo: String(motivo || '').trim(), acao: eraFinal ? 'Revista' : 'Finalizada', dados: semVersoes };
  return {
    ok: true,
    registo: { ...novo, estado: eraFinal ? 'final' : estado, editadoEm: agora, editadoPor: quem, versoes: criaVersao ? [...versoes, versao].slice(-MAX_VERSOES) : versoes },
  };
}

// Repor é mais uma revisão: nada se apaga.
export function reporRegisto(atual, v, { quem, agora }) {
  const alvo = (atual.versoes || []).find((x) => x.v === v);
  if (!alvo) return atual;
  const { versoes = [], ...semVersoes } = atual;
  return { ...alvo.dados, id: atual.id, estado: 'final', editadoEm: agora, editadoPor: quem, versoes: [...versoes, { v: versoes.length + 1, em: agora, quem, motivo: `Reposta a versão ${v}`, acao: 'Revista', dados: semVersoes }].slice(-MAX_VERSOES) };
}

// O registo anterior do mesmo aluno e tipo, para comparar. Só finais.
export function registoAnterior(registos, r) {
  return (registos || [])
    .filter((x) => x.id !== r.id && x.studentId === r.studentId && (x.modeloId || x.tipo) === (r.modeloId || r.tipo) && x.estado === 'final' && x.data < r.data)
    .sort((a, b) => String(b.data).localeCompare(String(a.data)))[0] || null;
}

export function comparar(modelo, atual, anterior) {
  return modelo.campos.filter((c) => c.tipo !== 'texto' && c.tipo !== 'selecao').map((c) => {
    const a = valorDoCampo(c, atual.valores?.[c.id]);
    const b = anterior ? valorDoCampo(c, anterior.valores?.[c.id]) : null;
    if (c.lados) {
      const dif = (x, y) => (x != null && y != null ? Math.round((x - y) * 100) / 100 : null);
      return { id: c.id, rotulo: c.rotulo, unidade: c.unidade, lados: true, agora: a, antes: b, difD: dif(a?.d, b?.d), difE: dif(a?.e, b?.e), assimetria: a ? assimetria(a.d, a.e) : null };
    }
    return { id: c.id, rotulo: c.rotulo, unidade: c.unidade, agora: a, antes: b, dif: a != null && b != null ? Math.round((a - b) * 100) / 100 : null };
  });
}

/* ---------------------------- recorrência ---------------------------- */

export function somarDias(iso, dias) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Number(dias));
  return d.toISOString().slice(0, 10);
}

// O id depende do registo de origem: repetir a ação não cria outra.
export function criarRecorrencia(lista, { registoId, studentId, modeloId, tipo, data, intervaloDias }) {
  const id = `rec:${registoId}`;
  const nova = { id, registoId, studentId, modeloId: modeloId || null, tipo, proxima: data, intervaloDias: Number(intervaloDias) || null, estado: 'ativa' };
  return (lista || []).some((r) => r.id === id) ? lista.map((r) => (r.id === id ? { ...r, ...nova } : r)) : [...(lista || []), nova];
}

export function concluirRecorrencia(r, hoje) {
  if (!r.intervaloDias) return { ...r, estado: 'concluida', concluidaEm: hoje };
  return { ...r, proxima: somarDias(hoje, r.intervaloDias), ultimaEm: hoje };
}

export function pendentes(lista, hoje) {
  return (lista || []).filter((r) => r.estado === 'ativa').map((r) => ({ ...r, atrasada: r.proxima < hoje })).sort((a, b) => a.proxima.localeCompare(b.proxima));
}

/* ---------------------------- geometria da postural ---------------------------- */

// Pontos em percentagem da imagem. `aspecto` é largura / altura, sem o qual uma
// imagem que não seja quadrada dava ângulos errados. É só geometria.
export function anguloEmB(a, b, c, aspecto = 1) {
  const v1 = [(a.x - b.x) * aspecto, a.y - b.y];
  const v2 = [(c.x - b.x) * aspecto, c.y - b.y];
  const n1 = Math.hypot(...v1); const n2 = Math.hypot(...v2);
  if (n1 === 0 || n2 === 0) return null;
  const cos = Math.min(1, Math.max(-1, (v1[0] * v2[0] + v1[1] * v2[1]) / (n1 * n2)));
  return Math.round((Math.acos(cos) * 180 / Math.PI) * 10) / 10;
}

export function inclinacao(a, b, aspecto = 1) {
  const dx = (b.x - a.x) * aspecto; const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return null;
  let g = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
  if (g > 90) g = 180 - g;
  return Math.round(g * 10) / 10;
}

export function medirAngulo(pontos, aspecto) {
  if (pontos.length === 2) return inclinacao(pontos[0], pontos[1], aspecto);
  if (pontos.length === 3) return anguloEmB(pontos[0], pontos[1], pontos[2], aspecto);
  return null;
}

// Um modelo próprio nasce de uma lista simples, com ids estáveis e únicos.
export function novoModelo(nome, gerarId) {
  return { id: gerarId(), nome: String(nome || '').trim() || 'Modelo', categoria: 'personalizada', ajuda: '', online: false, campos: [] };
}
export const novoCampo = (gerarId) => ({ id: gerarId(), rotulo: '', tipo: 'numero', unidade: '', tentativas: 1, regra: 'melhor' });
