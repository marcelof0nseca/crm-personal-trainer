/*
 * Tabelas de regras deterministicas da representacao A (secoes 10.6, 12,
 * 13.3/13.4/13.8/13.15/13.20, 15.1/15.3-15.9 do documento de consolidacao).
 * Dados puros, transcritos a mao -- a logica de correspondencia (ordem de
 * match por familia, "contem" vs "exatamente") vive em gerar-modelos-treino.mjs,
 * nao aqui.
 */

// 10.6 -- Regressoes especificas (codigo -> codigo). Os restantes exercicios
// usam o texto generico REGRESSAO_GENERICA abaixo.
export const REGRESSOES_ESPECIFICAS = {
  sq: 'box', bsq: 'sq', fsq: 'sq', split: 'box', step: 'box',
  dead: 'rdl', trap: 'rdl', rdl: 'hinge', thrust: 'bridge',
  press: 'mpress', bpress: 'mpress', push: 'incline', incline: 'wall',
  ohp: 'wallslide', pull: 'lat', dbrow: 'row',
  plank: 'deadbug', side: 'bird', run: 'walk',
  jump: 'landing', broad: 'landing', lateral: 'landing', pogo: 'calf',
  hangclean: 'cleanpull', cleanpull: 'hinge', snatchpull: 'hinge',
  musclesnatch: 'wallslide', jerk: 'fronttech',
  sled: 'walk', sand: 'carry', toetap: 'heel', legside: 'clam',
};
export const REGRESSAO_GENERICA = 'Reduzir amplitude, carga ou duração mantendo execução confortável.';
export const PROGRESSAO_EXERCICIO_GENERICA = 'Aumentar uma variável de cada vez, apenas após cumprir técnica, intensidade e recuperação previstas.';

// 12.1 -- Dose base por familia, para L=0,1,2,3. Ordem = prioridade de match
// (primeira regra cuja palavra-chave aparece na familia, "contains"), exceto
// `pliometriaExata`, que e a UNICA regra de correspondencia exata do
// documento -- "pliometria tecnica"/"pliometria unilateral" NAO correspondem
// e caem na regra residual de repeticoes. Preservar esta particularidade
// editorial (secao 12.1 e secao 32, pendencia 5), nao corrigi-la.
export const DOSE_BASE = {
  alongamento: { tipo: 'tempo', valores: [20, 25, 30, 35] },
  contemTempo: { tipo: 'tempo', valores: [15, 20, 25, 30] },
  transporte: { tipo: 'tempo', valores: [15, 20, 25, 30] },
  aerobico: { tipo: 'tempo', valores: [60, 60, 60, 60] },
  respiracao: { tipo: 'tempo', valores: [60, 60, 60, 60] },
  pliometriaExata: { tipo: 'reps', valores: [3, 3, 4, 4] },
  olimpico: { tipo: 'reps', valores: [3, 3, 3, 3] },
  potencia: { tipo: 'reps', valores: [4, 4, 4, 4] },
  mobilidadeOuPilates: { tipo: 'reps', formula: (L) => 6 + L },
  restantes: { tipo: 'reps', valores: [8, 10, 10, 8] },
};

// Conversao para familia temporal/transporte/aerobica/respiratoria/alongamento
// quando uma chamada fornecer repeticoes em vez de dose temporal (12.1, fim).
export const CONVERSAO_TEMPORAL = {
  aerobico: 30,
  respiracao: 60,
  restantesTemporais: 20, // tempo, transporte, alongamento
};

// 12.2 -- Intensidade base.
export const RIR_FORCA_POR_L = [4, 3, 2, 2]; // L0..L3
export const NOTA_RIR = 'Selecionar carga pela margem de repetições; RIR é uma estimativa, sobretudo no iniciante.';
export const RPE_POR_FAMILIA = {
  respiracao: { valor: 2 },
  mobilidadeAlongamentoEquilibrio: { valor: 3 },
  pilates: { valor: 4 },
  aerobico: { valor: 4, nota: 'deve conseguir falar frases completas.' },
  // pliometria (qualquer, incl. tecnica/unilateral), olimpico e potencia --
  // aqui NAO ha excecao de match exato (ao contrario da dose em 12.1).
  pliometriaOlimpicoPotencia: { formula: (L) => 5 + Math.min(L, 2), nota: 'parar se perder velocidade, receção ou coordenação.' },
};

// 12.3 -- Cadencia base.
export const CADENCIA_FORCA = '2-0-1-0';
export const CADENCIA_NAO_APLICAVEL = 'não aplicável'; // aerobico, transporte, alongamento, tempo, respiracao
export const CADENCIA_PLIOMETRIA_POTENCIA = 'intenção explosiva; estabilizar e reiniciar';
export const CADENCIA_OLIMPICO = 'técnico; reiniciar cada repetição';
export const CADENCIA_MOBILIDADE_PILATES = 'lento e controlado (~4 s por repetição)';

// 12.4 -- Series e descanso tradicionais, por L.
export const SERIES_DESCANSO_POR_L = [
  { series: 2, descanso: 75 },
  { series: 3, descanso: 90 },
  { series: 3, descanso: 120 },
  { series: 4, descanso: 150 },
];
export const DESCANSO_SERIE_SIMPLES_OMISSAO = 60;

// 13.3 -- Pares do mesmo alvo (bi-set / série composta / pré-exaustão; v mod 10).
// Pós-exaustão usa o mesmo par com a ordem invertida.
export const PARES_MESMO_ALVO = [
  ['fly', 'mpress'], ['ext', 'leg'], ['curlleg', 'rdl'], ['pullover', 'lat'], ['raise', 'ohp'],
  ['fly', 'press'], ['ext', 'sq'], ['curlleg', 'thrust'], ['pullover', 'row'], ['raise', 'ohp'],
];

// 13.4 -- Pares antagonistas (superset antagonista; v mod 10).
export const PARES_ANTAGONISTAS = [
  ['mpress', 'row'], ['ext', 'curlleg'], ['bic', 'tri'], ['press', 'chrow'], ['lat', 'ohp'],
  ['bandpress', 'bandrow'], ['bandbic', 'bandtri'], ['floor', 'dbrow'], ['leg', 'curlleg'], ['push', 'row'],
];

// 13.8 -- Exercicios de intensificacao localizada (rest-pause / drop-set /
// ate a falha; v mod 10).
export const EXERCICIOS_INTENSIFICACAO = ['ext', 'curlleg', 'fly', 'pullover', 'raise', 'bic', 'tri', 'mpress', 'row', 'hammer'];

// 13.15 -- Pares de contraste (v mod 10).
export const PARES_CONTRASTE = [
  ['sq', 'jump'], ['mpress', 'throw'], ['trap', 'broad'], ['leg', 'jump'], ['press', 'throw'],
  ['bsq', 'jump'], ['floor', 'throw'], ['rdl', 'broad'], ['fsq', 'jump'], ['incline', 'throw'],
];

// 13.20 -- Modalidade de Tabata/Intervalado (v mod 5).
export const MODALIDADE_TABATA_INTERVALADO = ['bike', 'ellip', 'rower', 'march', 'jack'];

// 15.1 -- Aquecimento por categoria (sequencia de codigos). 'Aeróbico' e um
// caso especial (usa o proprio exercicio aerobico da matriz, tratado no
// gerador) e nao entra aqui. Categorias fora desta lista usam `restantes`.
export const AQUECIMENTO_POR_CATEGORIA = {
  'Alongamento': ['walk', 'cat'],
  'Mobilidade': ['march', 'cat'],
  'Pilates': ['breath', 'cat'],
  'Laboral': ['march'],
  'Reabilitação': ['walk', 'breath'],
  'Pliometria': ['walk', 'ankle', 'landing'],
  'Levantamento olímpico': ['bike', 'hinge', 'fronttech'],
  'Powerlifting': ['bike', 'hinge', 'box'],
  'Strongman': ['walk', 'hinge', 'box'],
  'Em casa': ['march', 'hinge', 'wallslide'],
  'Elástico': ['march', 'hinge', 'wallslide'],
  restantes: ['bike', 'hinge', 'wallslide'],
};
export const AQUECIMENTO_DESCANSO_LOCAL = 15;
export const AQUECIMENTO_LABORAL = { exercicio: 'march', segundos: 45 }; // exceção: sem pausa
export const AQUECIMENTO_PRIMEIRO_AEROBICO_SEGUNDOS = 180;

// 15.2 -- Preparação específica adicional (categorias elegíveis).
export const CATEGORIAS_PREPARACAO_ESPECIFICA = ['Musculação', 'Powerlifting', 'Strongman', 'Funcional', 'Em casa', 'Elástico'];
export const PREPARACAO_ESPECIFICA = [
  { reps: 8, cargaPct: 40, descanso: 60 },
  { reps: 4, cargaPct: 70, descanso: 90 },
];
export const PREPARACAO_ESPECIFICA_RIR = 6;

// 13.2 -- Série de aproximação (preparação antes do bloco tradicional completo).
export const SERIE_APROXIMACAO = [
  { reps: 8, cargaPct: 40, descanso: 60 },
  { reps: 5, cargaPct: 60, descanso: 90 },
  { reps: 3, cargaPct: 80, descanso: 120 },
];
export const SERIE_APROXIMACAO_RIR = 6;

// 15.3 -- Volta à calma.
export const VOLTA_CALMA_PADRAO = [
  { exercicio: 'walk', segundos: 180 },
  { exercicio: 'breath', segundos: 60 },
];
export const VOLTA_CALMA_LABORAL = [{ exercicio: 'breath', segundos: 30 }];

// 15.4 -- Frequência sugerida.
export const FREQUENCIA_SUGERIDA = {
  padrao: 'Duas a três sessões semanais, alternando focos; pelo menos 48 horas antes de repetir trabalho exigente do mesmo grupo.',
  'Laboral': 'Uma pausa de cinco a dez minutos conforme tolerância e organização do trabalho; alternar posturas ao longo do dia.',
  'Mobilidade': 'Três a cinco dias por semana conforme tolerância; não forçar amplitude nem procurar dor.',
  'Alongamento': 'Três a cinco dias por semana conforme tolerância; não forçar amplitude nem procurar dor.',
  'Aeróbico': 'Três a cinco dias por semana; começar pelo volume tolerado e progredir o total semanal.',
  'Reabilitação': 'Frequência a validar pelo profissional responsável antes de atribuir; modelo de dose inicial, não plano clínico automático.',
};

// 15.5 -- Critérios de entrada.
export const CRITERIOS_ENTRADA_PADRAO = 'Adulto; triagem inicial concluída; sem sintomas novos impeditivos; exercícios demonstrados e tecnicamente executáveis.';
export const CRITERIOS_ENTRADA_CLINICA = 'Validar diagnóstico, fase, restrições de carga e amplitude e autorização de retorno com o profissional de saúde responsável. Não aplicar a lesão aguda, pós-operatório não liberado ou condição clínica não estabilizada. São modelos gerais de retorno, não tratamento de patologias.';
export const CRITERIOS_ENTRADA_TECNICA = 'Aprovação do treinador para a habilidade específica; supervisão nas primeiras aplicações. Experiência numa modalidade não equivale a experiência nesta técnica.';
export const CRITERIOS_ENTRADA_PLIOMETRIA_CONTRASTE = 'Tolerância prévia ao impacto; aterragem alinhada e estável, sem sintomas durante nem agravamento nas 24 horas seguintes.';

// 15.6 -- Progressão (texto padrão da sessão).
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

// 15.7 -- Regressão da sessão.
export const REGRESSAO_SESSAO = 'Reduzir uma série por exercício e/ou 10–20% da carga, aumentar a pausa ou usar a regressão do dicionário. Se falhar o teto de esforço, não insistir.';

// 15.8 -- Interrupção.
export const INTERROMPER = 'Parar perante dor súbita, dor no peito, tontura, falta de ar desproporcionada ou perda persistente de técnica; encaminhar sintomas clínicos para avaliação.';

// 15.9 -- Registos sugeridos.
export const REGISTO_SUGERIDO = [
  'Carga real por série.', 'Repetições ou tempo realizados.', 'RIR ou RPE observado.',
  'Sintomas durante e após.', 'Tempo total.', 'Observações técnicas.',
].join(' ');

// 9.2 -- Métodos que exigem supervisão técnica.
export const METODOS_SUPERVISAO_TECNICA = [
  'Bi-set', 'Trissérie', 'Giant set', 'Rest-pause', 'Drop-set', 'Back-off',
  'Até à falha', 'Pré-exaustão', 'Pós-exaustão', 'Série composta', 'Cluster',
  'Contraste', 'Tabata', 'For time',
];

// 16.9 -- requerSupervisaoTecnica também por categoria.
export const CATEGORIAS_SUPERVISAO_TECNICA = ['Pliometria', 'Levantamento olímpico', 'Powerlifting', 'Strongman'];
