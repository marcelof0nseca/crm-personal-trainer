/*
 * Textos fixos das fichas da biblioteca de modelos (critérios de entrada,
 * progressão, regressão, o que interromper, o que registar, nota de
 * duração) -- secções 15.5-15.9 do documento de consolidação.
 *
 * Ficam aqui, uma vez só, em vez de dentro de cada uma das 860 fichas em
 * src/data/modelos-treino.ts: são as mesmas poucas frases, repetidas
 * centenas de vezes, e isso custava ~2 MB do ficheiro gerado por nada.
 * `textosDaFicha(ficha)` reconstrói o mesmo conteúdo a partir das flags que
 * a ficha já carrega (categoria, requerValidacaoClinica,
 * requerSupervisaoTecnica, precisaAvisoPliometriaContraste).
 */

export const CRITERIOS_ENTRADA_PADRAO = 'Adulto; triagem inicial concluída; sem sintomas novos impeditivos; exercícios demonstrados e tecnicamente executáveis.';
export const CRITERIOS_ENTRADA_CLINICA = 'Validar diagnóstico, fase, restrições de carga e amplitude e autorização de retorno com o profissional de saúde responsável. Não aplicar a lesão aguda, pós-operatório não liberado ou condição clínica não estabilizada. São modelos gerais de retorno, não tratamento de patologias.';
export const CRITERIOS_ENTRADA_TECNICA = 'Aprovação do treinador para a habilidade específica; supervisão nas primeiras aplicações. Experiência numa modalidade não equivale a experiência nesta técnica.';
export const CRITERIOS_ENTRADA_PLIOMETRIA_CONTRASTE = 'Tolerância prévia ao impacto; aterragem alinhada e estável, sem sintomas durante nem agravamento nas 24 horas seguintes.';

export const FREQUENCIA_SUGERIDA: Record<string, string> = {
  padrao: 'Duas a três sessões semanais, alternando focos; pelo menos 48 horas antes de repetir trabalho exigente do mesmo grupo.',
  'Laboral': 'Uma pausa de cinco a dez minutos conforme tolerância e organização do trabalho; alternar posturas ao longo do dia.',
  'Mobilidade': 'Três a cinco dias por semana conforme tolerância; não forçar amplitude nem procurar dor.',
  'Alongamento': 'Três a cinco dias por semana conforme tolerância; não forçar amplitude nem procurar dor.',
  'Aeróbico': 'Três a cinco dias por semana; começar pelo volume tolerado e progredir o total semanal.',
  'Reabilitação': 'Frequência a validar pelo profissional responsável antes de atribuir; modelo de dose inicial, não plano clínico automático.',
};

export const PROGRESSAO_PADRAO = [
  'Repetir a sessão duas a quatro vezes para observar técnica e resposta.',
  'As vinte opções não são vinte dias consecutivos.',
  'Cumprir todas as séries na intensidade-alvo em duas exposições e recuperar adequadamente antes de progredir.',
  'Aumentar a menor carga disponível, aproximadamente 2–5%, ou uma a duas repetições.',
  'Não aumentar todas as variáveis simultaneamente.',
  'Cardio: aumentar um a três minutos antes da intensidade.',
  'Mobilidade e Pilates: progredir controlo e amplitude confortável.',
  'Potência e técnica: progredir com aprovação técnica.',
  'Se o equipamento só permitir saltos grandes de carga, privilegiar primeiro repetições ou controlo.',
].join(' ');
export const PROGRESSAO_REABILITACAO = 'Alterações de dose, amplitude e exercício dependem da resposta e das restrições validadas pelo profissional responsável. Reavaliar sintomas durante, depois e no dia seguinte. Não progredir automaticamente.';

export const NOTA_RIR = 'RIR é a estimativa de repetições que ainda conseguiria fazer com boa técnica (RIR 3 = terminar quando calcula mais três). Escolha a carga por essa margem; é só uma estimativa, sobretudo em quem está a começar.';
export const PROGRESSAO_EXERCICIO_GENERICA = 'Aumentar uma variável de cada vez, apenas após cumprir técnica, intensidade e recuperação previstas.';

export const REGRESSAO_SESSAO ='Reduzir uma série por exercício e/ou 10–20% da carga, aumentar a pausa ou usar a regressão do dicionário. Se falhar o teto de esforço, não insistir.';
export const INTERROMPER = 'Parar perante dor súbita, dor no peito, tontura, falta de ar desproporcionada ou perda persistente de técnica; encaminhar sintomas clínicos para avaliação.';
export const REGISTO_SUGERIDO = [
  'Carga real por série.', 'Repetições ou tempo realizados.', 'RIR ou RPE observado.',
  'Sintomas durante e após.', 'Tempo total.', 'Observações técnicas.',
].join(' ');
export const NOTA_DURACAO = 'Estimativa com execução, pausas e transições; nos blocos For time representa o teto. Não é duração garantida.';

/* Taxonomia da biblioteca de modelos, na ordem editorial do documento. São as
   listas dos seletores de filtro; `scripts/dados-modelos-treino/validar.mjs`
   confirma que coincidem com o que as 860 fichas realmente usam. Experiência
   e condicionamento são duas dimensões, nunca uma classificação só do aluno. */
export const COLECOES_MODELOS = [
  { id: 'categoria', label: 'Categoria' },
  { id: 'objetivo', label: 'Objetivo' },
  { id: 'experiencia', label: 'Experiência' },
  { id: 'condicionamento', label: 'Condicionamento' },
  { id: 'metodo', label: 'Método' },
];
export const CATEGORIAS_MODELOS = [
  'Musculação', 'Aeróbico', 'Funcional', 'Alongamento', 'Em casa', 'Mobilidade', 'Elástico',
  'Pilates', 'Laboral', 'Pliometria', 'Levantamento olímpico', 'Powerlifting', 'Strongman', 'Reabilitação',
];
export const OBJETIVOS_MODELOS = [
  'Hipertrofia', 'Força', 'Gestão do peso e composição corporal', 'Resistência muscular',
  'Capacidade cardiorrespiratória', 'Mobilidade e flexibilidade', 'Potência e desempenho', 'Saúde e autonomia funcional',
];
export const EXPERIENCIAS_MODELOS = ['Iniciante', 'Intermédio', 'Avançado', 'Especialista'];
export const CONDICIONAMENTOS_MODELOS = ['Baixo', 'Moderado', 'Bom', 'Elevado'];
export const METODOS_MODELOS = [
  'Sem método', 'Série tradicional', 'Supersérie', 'Bi-set', 'Trissérie', 'Giant set', 'Circuito',
  'EMOM', 'AMRAP', 'Tabata', 'Intervalado', 'For time', 'Rest-pause', 'Drop-set',
  'Série de aproximação', 'Série de trabalho', 'Back-off', 'Até à falha', 'Pirâmide', 'Pré-exaustão',
  'Pós-exaustão', 'Superset antagonista', 'Série composta', 'Cluster', 'Contraste', 'Personalizado...',
];

export interface FlagsTextoFicha {
  categoria: string;
  requerValidacaoClinica: boolean;
  requerSupervisaoTecnica: boolean;
  precisaAvisoPliometriaContraste: boolean;
}

export function criteriosEntradaDeFicha(f: FlagsTextoFicha): string {
  const partes = [CRITERIOS_ENTRADA_PADRAO];
  if (f.requerValidacaoClinica) partes.push(CRITERIOS_ENTRADA_CLINICA);
  if (f.requerSupervisaoTecnica) partes.push(CRITERIOS_ENTRADA_TECNICA);
  if (f.precisaAvisoPliometriaContraste) partes.push(CRITERIOS_ENTRADA_PLIOMETRIA_CONTRASTE);
  return partes.join(' ');
}

export function frequenciaSugeridaDeFicha(f: FlagsTextoFicha): string {
  return FREQUENCIA_SUGERIDA[f.categoria] || FREQUENCIA_SUGERIDA.padrao;
}

export function progressaoDeFicha(f: FlagsTextoFicha): string {
  return f.categoria === 'Reabilitação' ? PROGRESSAO_REABILITACAO : PROGRESSAO_PADRAO;
}

export function textosDaFicha(f: FlagsTextoFicha) {
  return {
    criteriosEntrada: criteriosEntradaDeFicha(f),
    frequenciaSugerida: frequenciaSugeridaDeFicha(f),
    progressao: progressaoDeFicha(f),
    regressao: REGRESSAO_SESSAO,
    interromper: INTERROMPER,
    registo: REGISTO_SUGERIDO,
    notaDuracao: NOTA_DURACAO,
  };
}
