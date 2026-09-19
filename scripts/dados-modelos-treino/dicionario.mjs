/*
 * O dicionario de 95 exercicios da representacao A do documento de
 * consolidacao da biblioteca de modelos (secao 10.1-10.5). Transcrito a
 * mao a partir do texto-fonte -- nao e gerado.
 *
 * Cada entrada: { codigo, nomePt, nomeEn, equipamento, familia, instrucao }.
 * `codigo` e o id editorial local do documento (ex.: 'sq', 'rdl') -- nao e o
 * id que a aplicacao usa. A resolucao para um exercicio real da biblioteca
 * (src/data/exercicios.ts) acontece a parte, em resolver-exercicios.mjs.
 */

export const DICIONARIO = [
  // 10.1 -- Forca e controlo
  { codigo: 'sq', nomePt: 'Agachamento cálice', nomeEn: 'Goblet squat', equipamento: 'haltere', familia: 'joelho', instrucao: 'pé inteiro apoiado; joelhos acompanham os pés.' },
  { codigo: 'box', nomePt: 'Sentar e levantar da cadeira', nomeEn: 'Chair sit-to-stand', equipamento: 'cadeira estável', familia: 'joelho', instrucao: 'controlar a descida e levantar sem impulso.' },
  { codigo: 'leg', nomePt: 'Prensa de pernas', nomeEn: 'Leg press', equipamento: 'máquina', familia: 'joelho', instrucao: 'manter a bacia apoiada; não bloquear os joelhos.' },
  { codigo: 'split', nomePt: 'Agachamento dividido', nomeEn: 'Split squat', equipamento: 'halteres', familia: 'joelho unilateral', instrucao: 'base estável; descer verticalmente.' },
  { codigo: 'step', nomePt: 'Subida para degrau baixo', nomeEn: 'Low step-up', equipamento: 'degrau estável', familia: 'joelho unilateral', instrucao: 'usar apoio e controlar a descida.' },
  { codigo: 'bsq', nomePt: 'Agachamento com barra', nomeEn: 'Barbell back squat', equipamento: 'barra e rack com seguranças', familia: 'joelho', instrucao: 'ajustar seguranças; manter tronco firme.' },
  { codigo: 'fsq', nomePt: 'Agachamento frontal', nomeEn: 'Front squat', equipamento: 'barra e rack', familia: 'joelho', instrucao: 'cotovelos altos; amplitude estável.' },
  { codigo: 'rdl', nomePt: 'Peso morto romeno', nomeEn: 'Romanian deadlift', equipamento: 'halteres', familia: 'anca', instrucao: 'levar a anca atrás sem perder posição da coluna.' },
  { codigo: 'dead', nomePt: 'Peso morto com barra', nomeEn: 'Barbell deadlift', equipamento: 'barra e discos', familia: 'anca', instrucao: 'barra próxima; reiniciar cada repetição.' },
  { codigo: 'trap', nomePt: 'Peso morto com barra hexagonal', nomeEn: 'Trap-bar deadlift', equipamento: 'barra hexagonal', familia: 'anca', instrucao: 'empurrar o chão; evitar arranque brusco.' },
  { codigo: 'bridge', nomePt: 'Ponte de glúteos', nomeEn: 'Glute bridge', equipamento: 'colchão', familia: 'anca', instrucao: 'subir sem hiperextensão lombar.' },
  { codigo: 'thrust', nomePt: 'Elevação pélvica com carga', nomeEn: 'Hip thrust', equipamento: 'banco estável e haltere', familia: 'anca', instrucao: 'terminar com bacia neutra.' },
  { codigo: 'curlleg', nomePt: 'Flexão de joelhos na máquina', nomeEn: 'Leg curl', equipamento: 'máquina', familia: 'posterior', instrucao: 'controlar o retorno.' },
  { codigo: 'ext', nomePt: 'Extensão de joelhos na máquina', nomeEn: 'Leg extension', equipamento: 'máquina', familia: 'quadricípite', instrucao: 'alinhar o eixo da máquina com o joelho.' },
  { codigo: 'calf', nomePt: 'Elevação de gémeos', nomeEn: 'Calf raise', equipamento: 'apoio fixo', familia: 'gémeos', instrucao: 'subir e descer sem ressalto.' },
  { codigo: 'press', nomePt: 'Supino com halteres', nomeEn: 'Dumbbell bench press', equipamento: 'banco e halteres', familia: 'peito', instrucao: 'punhos alinhados; amplitude confortável.' },
  { codigo: 'floor', nomePt: 'Supino no chão com halteres', nomeEn: 'Dumbbell floor press', equipamento: 'colchão e halteres', familia: 'peito', instrucao: 'pousar os braços suavemente.' },
  { codigo: 'bpress', nomePt: 'Supino com barra', nomeEn: 'Barbell bench press', equipamento: 'banco, barra e seguranças', familia: 'peito', instrucao: 'utilizar seguranças e observador competente.' },
  { codigo: 'mpress', nomePt: 'Press de peito na máquina', nomeEn: 'Machine chest press', equipamento: 'máquina', familia: 'peito', instrucao: 'ajustar banco; ombros confortáveis.' },
  { codigo: 'wall', nomePt: 'Flexão na parede', nomeEn: 'Wall push-up', equipamento: 'parede', familia: 'peito', instrucao: 'corpo alinhado; aproximar o peito.' },
  { codigo: 'incline', nomePt: 'Flexão com mãos elevadas', nomeEn: 'Incline push-up', equipamento: 'banco fixo', familia: 'peito', instrucao: 'tronco firme e apoio estável.' },
  { codigo: 'push', nomePt: 'Flexão de braços', nomeEn: 'Push-up', equipamento: 'nenhum', familia: 'peito', instrucao: 'corpo alinhado; controlo lombar.' },
  { codigo: 'fly', nomePt: 'Aberturas na máquina', nomeEn: 'Pec deck fly', equipamento: 'máquina', familia: 'peito', instrucao: 'amplitude confortável, sem forçar o ombro.' },
  { codigo: 'row', nomePt: 'Remada sentada na polia', nomeEn: 'Seated cable row', equipamento: 'polia', familia: 'costas', instrucao: 'puxar sem balanço.' },
  { codigo: 'dbrow', nomePt: 'Remada unilateral apoiada', nomeEn: 'Supported dumbbell row', equipamento: 'banco e haltere', familia: 'costas unilateral', instrucao: 'manter a bacia estável.' },
  { codigo: 'chrow', nomePt: 'Remada com peito apoiado', nomeEn: 'Chest-supported row', equipamento: 'banco e halteres', familia: 'costas', instrucao: 'peito apoiado; evitar elevar ombros.' },
  { codigo: 'lat', nomePt: 'Puxada à frente', nomeEn: 'Lat pulldown', equipamento: 'polia', familia: 'costas', instrucao: 'puxar à frente sem inclinação excessiva.' },
  { codigo: 'pull', nomePt: 'Elevação na barra assistida', nomeEn: 'Assisted pull-up', equipamento: 'máquina assistida', familia: 'costas', instrucao: 'controlar descida e assistência.' },
  { codigo: 'pullover', nomePt: 'Pullover na polia', nomeEn: 'Cable pullover', equipamento: 'polia', familia: 'costas', instrucao: 'mover pelos ombros sem arquear lombar.' },
  { codigo: 'ohp', nomePt: 'Press de ombros sentado', nomeEn: 'Seated dumbbell shoulder press', equipamento: 'banco e halteres', familia: 'ombro', instrucao: 'evitar compensação lombar.' },
  { codigo: 'raise', nomePt: 'Elevação lateral', nomeEn: 'Lateral raise', equipamento: 'halteres', familia: 'ombro', instrucao: 'subir sem impulso até amplitude confortável.' },
  { codigo: 'face', nomePt: 'Puxada à face', nomeEn: 'Face pull', equipamento: 'polia com corda', familia: 'ombro', instrucao: 'não projetar a cabeça.' },
  { codigo: 'bic', nomePt: 'Flexão de cotovelos com halteres', nomeEn: 'Dumbbell curl', equipamento: 'halteres', familia: 'bíceps', instrucao: 'cotovelos estáveis; sem balanço.' },
  { codigo: 'hammer', nomePt: 'Flexão martelo', nomeEn: 'Hammer curl', equipamento: 'halteres', familia: 'bíceps', instrucao: 'punhos neutros.' },
  { codigo: 'tri', nomePt: 'Extensão de cotovelos na polia', nomeEn: 'Triceps pushdown', equipamento: 'polia', familia: 'tríceps', instrucao: 'braços junto ao tronco.' },

  // 10.2 -- Core, transportes e aerobico
  { codigo: 'deadbug', nomePt: 'Inseto morto alternado', nomeEn: 'Dead bug', equipamento: 'colchão', familia: 'core unilateral', instrucao: 'expirar; estender apenas mantendo controlo lombar.' },
  { codigo: 'bird', nomePt: 'Extensão contralateral em quatro apoios', nomeEn: 'Bird dog', equipamento: 'colchão', familia: 'core unilateral', instrucao: 'bacia estável; amplitude curta.' },
  { codigo: 'plank', nomePt: 'Prancha frontal', nomeEn: 'Front plank', equipamento: 'colchão', familia: 'core tempo', instrucao: 'respirar sem ceder na lombar.' },
  { codigo: 'side', nomePt: 'Prancha lateral com joelhos apoiados', nomeEn: 'Kneeling side plank', equipamento: 'colchão', familia: 'core tempo unilateral', instrucao: 'alinhar ombro e bacia.' },
  { codigo: 'pallof', nomePt: 'Press anti-rotação', nomeEn: 'Pallof press', equipamento: 'elástico e ancoragem segura', familia: 'core unilateral', instrucao: 'resistir à rotação e respirar.' },
  { codigo: 'carry', nomePt: 'Caminhada do fazendeiro', nomeEn: 'Farmer carry', equipamento: 'halteres e corredor livre', familia: 'transporte', instrucao: 'passos controlados; ombros nivelados.' },
  { codigo: 'suit', nomePt: 'Transporte unilateral', nomeEn: 'Suitcase carry', equipamento: 'haltere e corredor livre', familia: 'transporte unilateral', instrucao: 'não inclinar o tronco.' },
  { codigo: 'sled', nomePt: 'Empurrar trenó', nomeEn: 'Sled push', equipamento: 'trenó e pista', familia: 'transporte', instrucao: 'passos curtos; superfície livre.' },
  { codigo: 'sand', nomePt: 'Abraço e transporte de saco', nomeEn: 'Bear-hug sandbag carry', equipamento: 'saco de areia e pista', familia: 'transporte', instrucao: 'saco leve junto ao corpo; respirar.' },
  { codigo: 'walk', nomePt: 'Caminhada', nomeEn: 'Walking', equipamento: 'espaço livre', familia: 'aeróbico', instrucao: 'ritmo compatível com a intensidade.' },
  { codigo: 'bike', nomePt: 'Bicicleta estática', nomeEn: 'Stationary cycling', equipamento: 'bicicleta estática', familia: 'aeróbico', instrucao: 'ajustar selim e resistência; não balançar bacia.' },
  { codigo: 'ellip', nomePt: 'Elíptica', nomeEn: 'Elliptical trainer', equipamento: 'elíptica', familia: 'aeróbico', instrucao: 'movimento fluido; postura confortável.' },
  { codigo: 'rower', nomePt: 'Remo ergómetro', nomeEn: 'Rowing ergometer', equipamento: 'remo ergómetro', familia: 'aeróbico', instrucao: 'pernas, tronco, braços; regressar pela ordem inversa.' },
  { codigo: 'march', nomePt: 'Marcha no lugar', nomeEn: 'March in place', equipamento: 'nenhum', familia: 'aeróbico', instrucao: 'pousar os pés suavemente.' },
  { codigo: 'jack', nomePt: 'Polichinelo sem salto', nomeEn: 'Step jack', equipamento: 'nenhum', familia: 'aeróbico', instrucao: 'alternar passos laterais sem impacto.' },
  { codigo: 'run', nomePt: 'Corrida leve', nomeEn: 'Easy running', equipamento: 'pista ou passadeira', familia: 'aeróbico', instrucao: 'passada confortável; exigir tolerância ao impacto.' },

  // 10.3 -- Elasticos
  { codigo: 'bandsq', nomePt: 'Agachamento com elástico', nomeEn: 'Band squat', equipamento: 'elástico', familia: 'joelho', instrucao: 'fixar sob os pés e controlar tensão.' },
  { codigo: 'bandrow', nomePt: 'Remada com elástico', nomeEn: 'Band row', equipamento: 'elástico e ancoragem segura', familia: 'costas', instrucao: 'testar ancoragem.' },
  { codigo: 'bandpress', nomePt: 'Press de peito com elástico', nomeEn: 'Band chest press', equipamento: 'elástico e ancoragem segura', familia: 'peito', instrucao: 'não utilizar elástico danificado junto à face.' },
  { codigo: 'bandrdl', nomePt: 'Dobradiça de anca com elástico', nomeEn: 'Band Romanian deadlift', equipamento: 'elástico', familia: 'anca', instrucao: 'controlar retorno.' },
  { codigo: 'bandlat', nomePt: 'Puxada alta com elástico', nomeEn: 'Band pulldown', equipamento: 'elástico e ancoragem alta segura', familia: 'costas', instrucao: 'não puxar atrás da nuca.' },
  { codigo: 'bandbic', nomePt: 'Flexão de cotovelos com elástico', nomeEn: 'Band curl', equipamento: 'elástico', familia: 'bíceps', instrucao: 'cotovelos junto ao corpo.' },
  { codigo: 'bandtri', nomePt: 'Extensão de cotovelos com elástico', nomeEn: 'Band triceps extension', equipamento: 'elástico e ancoragem segura', familia: 'tríceps', instrucao: 'evitar movimento do ombro.' },
  { codigo: 'bandab', nomePt: 'Abdução da anca com minibanda', nomeEn: 'Mini-band hip abduction', equipamento: 'minibanda', familia: 'anca unilateral', instrucao: 'bacia estável; amplitude controlada.' },

  // 10.4 -- Mobilidade e alongamento
  { codigo: 'ankle', nomePt: 'Mobilização do tornozelo à parede', nomeEn: 'Knee-to-wall ankle mobility', equipamento: 'parede', familia: 'mobilidade unilateral', instrucao: 'calcanhar apoiado; joelho alinhado.' },
  { codigo: 'hip90', nomePt: 'Transições de anca 90/90', nomeEn: '90/90 hip switches', equipamento: 'colchão', familia: 'mobilidade', instrucao: 'usar mãos se necessário; não forçar.' },
  { codigo: 'cat', nomePt: 'Mobilização da coluna em quatro apoios', nomeEn: 'Cat-cow', equipamento: 'colchão', familia: 'mobilidade', instrucao: 'movimento lento e confortável.' },
  { codigo: 'open', nomePt: 'Rotação torácica deitado', nomeEn: 'Open book', equipamento: 'colchão', familia: 'mobilidade unilateral', instrucao: 'rodar tórax sem forçar ombro.' },
  { codigo: 'wallslide', nomePt: 'Deslizamento dos braços na parede', nomeEn: 'Wall slide', equipamento: 'parede', familia: 'mobilidade', instrucao: 'não arquear lombar.' },
  { codigo: 'hinge', nomePt: 'Dobradiça de anca com bastão', nomeEn: 'Dowel hip hinge', equipamento: 'bastão', familia: 'mobilidade', instrucao: 'contacto com cabeça, dorso e sacro.' },
  { codigo: 'neck', nomePt: 'Rotação cervical ativa suave', nomeEn: 'Gentle neck rotation', equipamento: 'cadeira', familia: 'mobilidade unilateral', instrucao: 'amplitude confortável; parar perante tontura.' },
  { codigo: 'wrist', nomePt: 'Mobilização dos punhos', nomeEn: 'Wrist mobility', equipamento: 'mesa', familia: 'mobilidade', instrucao: 'apoio leve sem dor.' },
  { codigo: 'hamstretch', nomePt: 'Alongamento posterior da coxa deitado', nomeEn: 'Supine hamstring stretch', equipamento: 'colchão e toalha', familia: 'alongamento unilateral', instrucao: 'joelho ligeiramente fletido; não puxar com força.' },
  { codigo: 'hipstretch', nomePt: 'Alongamento do flexor da anca', nomeEn: 'Half-kneeling hip flexor stretch', equipamento: 'colchão', familia: 'alongamento unilateral', instrucao: 'bacia neutra; não arquear lombar.' },
  { codigo: 'pecstretch', nomePt: 'Alongamento peitoral na parede', nomeEn: 'Wall chest stretch', equipamento: 'parede', familia: 'alongamento unilateral', instrucao: 'rodar suavemente; sem dor anterior no ombro.' },
  { codigo: 'calfstretch', nomePt: 'Alongamento de gémeos na parede', nomeEn: 'Wall calf stretch', equipamento: 'parede', familia: 'alongamento unilateral', instrucao: 'calcanhar no chão; pé em frente.' },
  { codigo: 'glutestretch', nomePt: 'Alongamento de glúteo deitado', nomeEn: 'Supine figure-four stretch', equipamento: 'colchão', familia: 'alongamento unilateral', instrucao: 'não forçar o joelho.' },
  { codigo: 'latstretch', nomePt: 'Alongamento dorsal apoiado', nomeEn: 'Supported lat stretch', equipamento: 'mesa fixa', familia: 'alongamento', instrucao: 'expiração suave.' },
  { codigo: 'quadstretch', nomePt: 'Alongamento da coxa em pé com apoio', nomeEn: 'Supported quadriceps stretch', equipamento: 'apoio fixo', familia: 'alongamento unilateral', instrucao: 'joelhos próximos; não forçar flexão.' },

  // 10.5 -- Pilates, potencia e tecnica
  { codigo: 'breath', nomePt: 'Respiração costal deitado', nomeEn: 'Supine rib breathing', equipamento: 'colchão', familia: 'respiração', instrucao: 'respirar naturalmente, sem pausas forçadas.' },
  { codigo: 'heel', nomePt: 'Deslizamento alternado do calcanhar', nomeEn: 'Heel slide', equipamento: 'colchão', familia: 'pilates unilateral', instrucao: 'bacia estável.' },
  { codigo: 'clam', nomePt: 'Abertura lateral da anca deitado', nomeEn: 'Side-lying clam', equipamento: 'colchão', familia: 'pilates unilateral', instrucao: 'não rodar a bacia.' },
  { codigo: 'toetap', nomePt: 'Toque alternado do pé no chão', nomeEn: 'Supine toe tap', equipamento: 'colchão', familia: 'pilates unilateral', instrucao: 'reduzir amplitude perante perda de controlo lombar.' },
  { codigo: 'pilbridge', nomePt: 'Ponte articulada', nomeEn: 'Articulated bridge', equipamento: 'colchão', familia: 'pilates', instrucao: 'articular suavemente, sem desconforto.' },
  { codigo: 'legside', nomePt: 'Elevação lateral da perna deitado', nomeEn: 'Side-lying leg lift', equipamento: 'colchão', familia: 'pilates unilateral', instrucao: 'alinhar bacia e tronco.' },
  { codigo: 'quadruped', nomePt: 'Deslizamento de perna em quatro apoios', nomeEn: 'Quadruped leg slide', equipamento: 'colchão', familia: 'pilates unilateral', instrucao: 'apoio das mãos e tronco estável.' },
  { codigo: 'landing', nomePt: 'Queda para posição atlética sem salto', nomeEn: 'Snap-down', equipamento: 'piso antiderrapante', familia: 'pliometria técnica', instrucao: 'estabilizar e absorver com anca e joelhos.' },
  { codigo: 'pogo', nomePt: 'Saltos baixos de tornozelo', nomeEn: 'Low pogo hops', equipamento: 'piso adequado', familia: 'pliometria', instrucao: 'contactos baixos e controlados.' },
  { codigo: 'jump', nomePt: 'Salto vertical com estabilização', nomeEn: 'Countermovement jump and stick', equipamento: 'piso adequado', familia: 'pliometria', instrucao: 'aterrar silenciosamente e estabilizar.' },
  { codigo: 'broad', nomePt: 'Salto horizontal com estabilização', nomeEn: 'Broad jump and stick', equipamento: 'piso adequado', familia: 'pliometria', instrucao: 'distância submáxima; aterragem estável.' },
  { codigo: 'lateral', nomePt: 'Salto lateral curto com estabilização', nomeEn: 'Lateral hop and stick', equipamento: 'piso adequado', familia: 'pliometria unilateral', instrucao: 'amplitude curta; alinhar joelho e pé.' },
  { codigo: 'throw', nomePt: 'Lançamento de bola medicinal ao peito', nomeEn: 'Medicine-ball chest throw', equipamento: 'bola medicinal, parede autorizada e área livre', familia: 'potência', instrucao: 'lançar leve e rápido; recuperar sem pressa.' },
  { codigo: 'cleanpull', nomePt: 'Puxada de clean com barra leve', nomeEn: 'Clean pull', equipamento: 'barra e plataforma', familia: 'olímpico', instrucao: 'extensão coordenada; não puxar precocemente com braços.' },
  { codigo: 'hangclean', nomePt: 'Clean de potência suspenso', nomeEn: 'Hang power clean', equipamento: 'barra e plataforma', familia: 'olímpico', instrucao: 'carga técnica; receção estável; supervisão.' },
  { codigo: 'snatchpull', nomePt: 'Puxada de arranco', nomeEn: 'Snatch pull', equipamento: 'barra e plataforma', familia: 'olímpico', instrucao: 'barra próxima; posição dorsal.' },
  { codigo: 'musclesnatch', nomePt: 'Arranco de força com bastão', nomeEn: 'Dowel muscle snatch', equipamento: 'bastão', familia: 'olímpico', instrucao: 'aprender trajetória e receção sem carga.' },
  { codigo: 'jerk', nomePt: 'Técnica de pés do jerk com bastão', nomeEn: 'Dowel split-jerk footwork', equipamento: 'bastão e espaço livre', familia: 'olímpico', instrucao: 'fixar receção antes de recuperar pés.' },
  { codigo: 'fronttech', nomePt: 'Agachamento frontal com bastão', nomeEn: 'Dowel front squat', equipamento: 'bastão', familia: 'olímpico', instrucao: 'receção estável na amplitude disponível.' },
  { codigo: 'balance', nomePt: 'Equilíbrio unipodal com apoio próximo', nomeEn: 'Supported single-leg balance', equipamento: 'apoio fixo', familia: 'equilíbrio tempo unilateral', instrucao: 'apoio acessível; não fechar olhos.' },
  { codigo: 'retract', nomePt: 'Retração escapular sem carga', nomeEn: 'Unloaded scapular retraction', equipamento: 'cadeira', familia: 'mobilidade', instrucao: 'mover escápulas sem elevar ombros.' },
];

if (DICIONARIO.length !== 95) {
  throw new Error(`DICIONARIO devia ter 95 exercícios, tem ${DICIONARIO.length}.`);
}

const codigosUnicos = new Set(DICIONARIO.map((e) => e.codigo));
if (codigosUnicos.size !== DICIONARIO.length) {
  throw new Error('DICIONARIO tem códigos repetidos.');
}
