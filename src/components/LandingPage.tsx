import { useRef, useState, useEffect } from 'react';
import {
  MessageCircle, CalendarDays, RotateCcw, ClipboardCheck, Images, Wallet, TrendingDown,
  ShieldCheck, ChevronDown, CheckCircle2, TrendingUp, UserPlus, Gift, Mail,
  MousePointerClick, CalendarX2, FileSignature, Stamp, BarChart3, UserSearch, Clock,
} from 'lucide-react';
import LegalModal from './LegalDocs';

/* ============================== MOCK DATA (previews) ============================== */

const MOCK_STATS = [
  { label: 'Alunos ativos', value: '24', icon: UserPlus },
  { label: 'Aulas esta semana', value: '18', icon: CalendarDays },
  { label: 'Faltas pendentes', value: '3', icon: RotateCcw },
  { label: 'Receita do mês', value: '€2.340', icon: TrendingUp },
];

const MOCK_SESSIONS = [
  { time: '08:00', name: 'Rita Almeida', type: 'Horário Fixo', color: '#5DA9E9' },
  { time: '10:30', name: 'João Pereira', type: 'Avaliação Física', color: '#D6764A' },
  { time: '17:00', name: 'Marta Silva', type: 'Reposição', color: '#5FBFA0' },
];

const MOCK_STUDENTS = [
  { name: 'Rita Almeida', plan: '3x/semana', status: 'Ativo', color: '#5DA9E9' },
  { name: 'João Pereira', plan: '2x/semana', status: 'Ativo', color: '#C77DFF' },
  { name: 'Marta Silva', plan: '1x/semana', status: 'Ativo', color: '#6FCF97' },
  { name: 'Tiago Costa', plan: 'Personalizado', status: 'Inativo', color: '#8FA6C2' },
];

const WEEK_DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
// Dia · nº de marcações — o dia ativo é o índice 3 (quinta).
const MOCK_WEEK_DAYS = [
  { d: '03', n: 3 }, { d: '04', n: 2 }, { d: '05', n: 0 }, { d: '06', n: 4 },
  { d: '07', n: 2 }, { d: '08', n: 1 }, { d: '09', n: 0 },
];

// Um dia real da agenda: aula, evento pessoal, reposição e avaliação.
const MOCK_DAY_SESSIONS = [
  { time: '08:00', name: 'Rita Almeida', type: 'Horário Fixo', color: '#5DA9E9', status: 'Realizado', statusColor: '#5FBFA0' },
  { time: '10:30', name: 'João Pereira', type: 'Horário Fixo', color: '#C77DFF', status: 'Agendado', statusColor: '#8C8C8C' },
  { time: '13:00', name: 'Horário de Almoço', type: 'Evento pessoal', color: '#F2A65A', status: 'Agendado', statusColor: '#8C8C8C', evento: true },
  { time: '17:00', name: 'Tiago Costa', type: 'Reposição', color: '#5FBFA0', status: 'Agendado', statusColor: '#8C8C8C' },
];

const FAT_TREND = [22, 20.5, 19.4, 18.2];

// Rótulos iguais aos do painel (BIA_FIELDS em painel-pt.tsx).
const MOCK_BIA = [
  { label: '% Massa Muscular', value: '38,4' },
  { label: 'Massa Gorda (kg)', value: '11,7' },
  { label: '% Água Corporal', value: '54,2' },
  { label: 'Gordura Visceral', value: '4' },
  { label: 'TMB (kcal)', value: '1.412' },
  { label: 'Idade Metabólica', value: '27' },
];

// Os cinco protocolos de dobras realmente implementados no app.
const FOLD_PROTOCOLS_MOCK = [
  'Jackson-Pollock 7 Dobras',
  'Jackson-Pollock 3 Dobras',
  'Durnin-Womersley 4 Dobras',
  'Faulkner 4 Dobras',
  'Guedes 3 Dobras',
];

// As 11 combinações realmente disponíveis (METODOS_COMBINACAO, em
// painel-pt.tsx) -- "e mais oito" não bastava para quem quisesse mesmo saber
// quais são, por isso ficam todas nomeadas aqui.
const COMBO_METHODS_MOCK = [
  'Bi-set', 'Supersérie', 'Superset antagonista', 'Pré-exaustão',
  'Pós-exaustão', 'Série composta', 'Trissérie', 'Giant set',
  'Circuito', 'Contraste', 'Complexo',
];

const PHOTO_GRADIENTS = [
  'linear-gradient(135deg, #1EA6B4 0%, #14343a 100%)',
  'linear-gradient(135deg, #5DA9E9 0%, #1c2a3a 100%)',
  'linear-gradient(135deg, #6FCF97 0%, #17301f 100%)',
  'linear-gradient(135deg, #D6534A 0%, #331917 100%)',
];

const PAIN_POINTS = [
  { icon: MessageCircle, text: 'Alunos espalhados no WhatsApp' },
  { icon: CalendarDays, text: 'Agenda desorganizada' },
  { icon: RotateCcw, text: 'Reposições esquecidas' },
  { icon: ClipboardCheck, text: 'Avaliações físicas perdidas' },
  { icon: Images, text: 'Fotos sem histórico' },
  { icon: Wallet, text: 'Falta de clareza financeira' },
  { icon: TrendingDown, text: 'Dificuldade em saber o lucro real' },
];

// Tudo o que existe de verdade e não tem secção própria mais acima — cada
// item aqui é uma funcionalidade real do painel (ver CLAUDE.md, secção 10),
// nunca uma promessa. É aqui, e só aqui, que se fala de segurança: a antiga
// secção "Confiança" duplicava a mesma mensagem noutro sítio da página.
const FEATURE_INDEX = [
  {
    icon: CalendarX2,
    heading: 'Faltas e reposições',
    items: [
      'Direito a reposição registado na própria falta, ligado à aula de origem',
      'Validade do crédito com estado "Expirada" quando o prazo passa',
      'Registo de auditoria: quem concedeu, quando, e o que aconteceu depois',
    ],
  },
  {
    icon: FileSignature,
    heading: 'Formulários de saúde',
    items: [
      'PAR-Q, anamnese e consentimentos — com construtor próprio para os seus',
      'Assinatura desenhada no ecrã, guardada junto com a resposta',
      'PDF timbrado, com os pontos a ter em conta assinalados como avisos',
    ],
  },
  {
    icon: Stamp,
    heading: 'Documentos com o seu timbre',
    items: [
      'Logótipo, estúdio, número profissional e contactos em cada folha',
      'Escolhe que secções saem, com pré-visualização antes de imprimir',
      'Aviso de confidencialidade em todas as páginas',
    ],
  },
  {
    icon: BarChart3,
    heading: 'Relatórios',
    items: [
      'Relatório do período: atividade, ocupação da agenda, receita e lançamentos',
      'Relatório de progresso: primeira avaliação contra a mais recente, com gráfico',
      'Ambos prontos a imprimir, com o mesmo timbre dos restantes documentos',
    ],
  },
  {
    icon: UserSearch,
    heading: 'Ficha 360º',
    items: [
      'Aulas, faltas, avaliações, treinos e formulários de um aluno, numa linha só',
      'Procura livre sobre todo o histórico, com filtros por tipo e período',
      'Comparência e créditos de reposição resumidos no topo',
    ],
  },
  {
    icon: ShieldCheck,
    heading: 'Segurança e fiabilidade',
    items: [
      'Autenticação de dois fatores e dados isolados por conta, alojados na UE',
      'Gravação imediata, com aviso se outro dispositivo escrever primeiro',
      'Exportação ou eliminação dos seus dados sempre que quiser',
    ],
  },
];

const FAQ_ITEMS = [
  { q: 'Preciso de instalar alguma coisa?', a: 'Não. O PTMANAGER funciona diretamente no navegador, em qualquer computador ou telemóvel — sem instalar nada.' },
  { q: 'Funciona no telemóvel e no tablet?', a: 'Sim. O painel é totalmente responsivo e funciona igualmente bem no telemóvel, tablet e computador.' },
  { q: 'Como funcionam os meses grátis?', a: 'No plano trimestral paga 3 meses e fica com 4. No anual paga 12 meses e fica com 14. Os meses grátis são acrescentados ao primeiro período, logo após a confirmação do pagamento.' },
  { q: 'Como funcionam os 7 dias grátis do plano mensal?', a: 'Regista o cartão ao criar a conta, mas não é cobrado nada nesse momento. Só ao 8º dia, se não tiver cancelado antes, a Stripe cobra a primeira mensalidade automaticamente. Vale só na primeira vez — não se repete ao cancelar e voltar a assinar.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim, a qualquer momento, no portal de subscrição da Stripe — inclui os 7 dias grátis: cancelar antes do fim do período não gera nenhuma cobrança.' },
  { q: 'Os meus alunos acedem ao sistema?', a: 'Não. O acesso é exclusivo do personal trainer — os seus alunos não precisam de conta nem de iniciar sessão.' },
  { q: 'Funciona em Portugal?', a: 'Sim. Preços em euros e suporte pensados para o mercado português.' },
  { q: 'O pagamento é seguro?', a: 'Sim. Todos os pagamentos são processados pela Stripe, com encriptação de nível bancário.' },
  { q: 'Como ativo o meu plano depois de pagar?', a: 'Automaticamente. Assim que a Stripe confirma o pagamento, o plano fica ativo em poucos segundos — se demorar, o botão "Verificar subscrição" confirma de imediato.' },
];

// Os três planos (SALES_PLANS, em painel-pt.tsx) diferem só no preço, no
// período e no bónus — a funcionalidade é sempre a mesma. Por isso há uma
// lista só, mostrada uma vez, em vez de repetir o mesmo bloco em cada
// cartão: repetir três vezes sugeriria uma diferença que não existe.
const PLAN_INCLUDES = [
  'Alunos, planos e preços sem limite',
  'Agenda com dia, semana, mês e lista',
  'Faltas, reposições e crédito com validade',
  'Avaliações físicas, com fotos de progresso',
  'Prescrição de treino e biblioteca com 2076 exercícios',
  'Documentos e formulários com o seu timbre',
  'Relatórios de atividade e de progresso do aluno',
  'Ficha 360º de cada aluno',
  'Controlo financeiro completo',
  'Autenticação de dois fatores e suporte por e-mail',
];

const FEATURE_SECTIONS = [
  {
    heading: 'Cada aluno, com contexto completo',
    body: 'Nome, número de sócio, plano, estado e dados físicos organizados num único perfil — sem andar à procura de informação em conversas antigas.',
    bullets: ['Registo completo por aluno', 'Planos e valores personalizados', 'Ativo, inativo ou em pausa'],
    Mockup: StudentsMockup,
  },
  {
    heading: 'A sua semana, sob controlo',
    body: 'Vê a semana inteira com o nome de cada aluno e a hora de cada aula. Basta tocar no aluno para marcar presença, falta ou reposição — e ajustar horário, tipo de aula ou notas.',
    bullets: [
      'Nome do aluno e hora visíveis em cada dia',
      'Presença, falta e reposição num toque',
      'Eventos pessoais na mesma agenda, com vista semanal e mensal',
    ],
    Mockup: AgendaMockup,
  },
  {
    heading: 'A biblioteca toda, na ponta dos dedos',
    body: '2076 exercícios pesquisáveis em português, português do Brasil ou inglês de ginásio. Combine em bi-set, superset ou trissérie — cada combinação com a sua cor, para o treino se ler num relance.',
    bullets: [
      '2076 exercícios, com sinónimos, favoritos e pastas',
      '11 combinações com nome e cor, de bi-set a circuito — todas à vista',
      'Duas formas de ver: o treino completo, ou um exercício de cada vez',
    ],
    Mockup: TreinosMockup,
  },
  {
    heading: 'Evolução documentada, não só recordada',
    body: 'Registe por bioimpedância — massa muscular, água corporal, gordura visceral, TMB — ou por dobras cutâneas, com cinco protocolos à escolha. Com fotos de progresso ligadas a cada avaliação.',
    bullets: [
      'Bioimpedância com 12 campos, ou dobras com cinco protocolos à escolha',
      'Fotos de progresso ligadas a cada avaliação, por data',
      '% de gordura e IMC calculados automaticamente',
    ],
    Mockup: AssessmentMockup,
  },
  {
    heading: 'Quanto ganha realmente',
    body: 'Receita bruta, impostos, taxa de ginásio e líquido — por aluno e no total — além das despesas e entradas pessoais do mês.',
    bullets: ['Líquido calculado automaticamente', 'Controlo por aluno e vista geral', 'Despesas e entradas pessoais'],
    Mockup: FinanceMockup,
  },
];

/* ============================== MOVIMENTO ============================== */

function useRevelar() {
  const ref = useRef(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setVisivel(true); return undefined; }
    const obs = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting) { setVisivel(true); obs.disconnect(); }
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visivel];
}

// `atraso` da o efeito de cascata a uma lista de cartões sem escrever uma
// transition-delay por item à mão.
function Revelar({ children, className = '', atraso = 0, style }) {
  const [ref, visivel] = useRevelar();
  return (
    <div
      ref={ref}
      className={`revelar ${visivel ? 'revelar-visivel' : ''} ${className}`}
      style={{ ...style, transitionDelay: visivel ? `${atraso}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

/* ============================== MOCKUP ATOMS ============================== */

// `chromeless` despe a moldura de janela (os tres pontos fazem sentido numa
// pagina, nao dentro de um ecra de telemovel) e reduz o padding, para o mesmo
// conteudo caber num PhoneFrame sem parecer encolhido a forca.
function MockupFrame({ label, chromeless, children }) {
  if (chromeless) {
    // O padding de cima e maior de proposito: e a "safe area" por baixo da
    // barra de estado e da ilha dinamica, que se sobrepoem ao ecra nos
    // primeiros ~44px.
    return <div className="w-full h-full" style={{ backgroundColor: 'var(--bg-base)', padding: '44px 12px 14px' }}>{children}</div>;
  }
  return (
    <div
      className="bg-surface border border-hair rounded-2xl p-4 sm:p-5 card-hover"
      style={{ boxShadow: '0 30px 70px -34px rgba(30,166,180,0.35), 0 14px 30px -18px rgba(0,0,0,0.65)' }}
    >
      <div className="flex items-center gap-1.5 mb-4">
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--rust)' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#8C8C8C' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--brass)' }} />
        <span className="text-2xs font-mono text-faint ml-2 truncate">{label}</span>
      </div>
      {children}
    </div>
  );
}

// Os quatro numeros do resumo sobem ao ecra em vez de aparecerem prontos: e
// a primeira coisa que se ve na pagina, e um numero que "chega" da mais
// sensacao de um produto vivo do que um numero que simplesmente esta la.
function useContagem(alvo, ativo, duracaoMs = 900) {
  const [valor, setValor] = useState(ativo ? 0 : alvo);
  useEffect(() => {
    if (!ativo) return undefined;
    const reduzido = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduzido) { setValor(alvo); return undefined; }
    let quadro;
    const inicio = performance.now();
    function passo(agora) {
      const t = Math.min(1, (agora - inicio) / duracaoMs);
      const suave = 1 - (1 - t) ** 3;
      setValor(Math.round(alvo * suave));
      if (t < 1) quadro = requestAnimationFrame(passo);
    }
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [ativo, alvo, duracaoMs]);
  return valor;
}

// "24", "18" ou "€2.340" -- extrai o numero, mantem o € e o separador de
// milhar ao estilo português.
function numeroDoStat(texto) { return parseInt(texto.replace(/[^\d]/g, ''), 10) || 0; }
function formatarStat(valor, modelo) {
  const texto = valor.toLocaleString('pt-PT');
  return modelo.trim().startsWith('€') ? `€${texto}` : texto;
}

function StatMock({ s, ativo }) {
  const alvo = numeroDoStat(s.value);
  const valor = useContagem(alvo, ativo);
  return (
    <div className="bg-elevated border border-hair rounded-xl p-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-2xs uppercase tracking-wide text-muted font-body">{s.label}</span>
        <s.icon size={14} className="text-brass" />
      </div>
      <span className="font-mono text-lg text-primary font-semibold tabular-nums">{formatarStat(valor, s.value)}</span>
    </div>
  );
}

function DashboardMockup({ chromeless } = {}) {
  const [ativo, setAtivo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAtivo(true), 260);
    return () => clearTimeout(t);
  }, []);
  return (
    <MockupFrame label="painel · hoje" chromeless={chromeless}>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {MOCK_STATS.map((s) => <StatMock key={s.label} s={s} ativo={ativo} />)}
      </div>
      <div className="bg-elevated border border-hair rounded-xl p-3 flex flex-col gap-2">
        {MOCK_SESSIONS.map((s) => (
          <div key={s.time} className="flex items-center gap-2.5 py-1">
            <span className="font-mono text-2xs text-muted w-10 flex-shrink-0">{s.time}</span>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
            <span className="text-xs font-body text-primary truncate flex-1">{s.name}</span>
            <span className="text-2xs font-body text-faint flex-shrink-0">{s.type}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function StudentsMockup({ chromeless } = {}) {
  return (
    <MockupFrame label="alunos · 24 ativos" chromeless={chromeless}>
      <div className="flex flex-col gap-2">
        {MOCK_STUDENTS.map((s) => (
          <div key={s.name} className="bg-elevated border border-hair rounded-lg pl-3 pr-2.5 py-2.5 flex items-center gap-2.5" style={{ borderLeftWidth: '3px', borderLeftColor: s.color }}>
            <span className="text-xs font-body text-primary truncate flex-1">{s.name}</span>
            <span className="text-2xs font-body text-faint hidden sm:inline flex-shrink-0">{s.plan}</span>
            <span
              className="text-2xs font-body px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ color: s.status === 'Ativo' ? 'var(--brass)' : 'var(--text-faint)', backgroundColor: s.status === 'Ativo' ? 'rgba(30,166,180,0.14)' : 'rgba(255,255,255,0.05)' }}
            >
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function AgendaMockup({ chromeless } = {}) {
  const activeDay = 3;
  return (
    <MockupFrame label="agenda · semana de 3 a 9 de agosto" chromeless={chromeless}>
      {/* Seletor de dia da semana, com o nº de marcações de cada dia */}
      <div className="grid grid-cols-7 gap-1.5 mb-3">
        {WEEK_DAYS.map((d, i) => {
          const active = i === activeDay;
          return (
            <div
              key={d}
              className="flex flex-col items-center gap-0.5 rounded-lg border py-1.5"
              style={{
                borderColor: active ? 'var(--brass)' : 'var(--border-hair)',
                backgroundColor: active ? 'rgba(30,166,180,0.12)' : 'transparent',
              }}
            >
              <span className="text-2xs font-body" style={{ color: active ? 'var(--brass)' : 'var(--text-faint)' }}>{d}</span>
              <span className="font-mono text-xs" style={{ color: active ? 'var(--brass)' : 'var(--text-primary)' }}>{MOCK_WEEK_DAYS[i].d}</span>
              <span className="font-mono text-2xs text-faint">{MOCK_WEEK_DAYS[i].n || '–'}</span>
            </div>
          );
        })}
      </div>

      {/* Marcações do dia selecionado, com o nome de cada aluno */}
      <div className="flex flex-col gap-2">
        {MOCK_DAY_SESSIONS.map((s) => (
          <div
            key={s.time}
            className="rounded-lg border border-hair pl-2.5 pr-2 py-2 flex items-center gap-2.5"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderLeftWidth: 3,
              borderLeftColor: s.color,
              borderStyle: s.evento ? 'dashed solid solid dashed' : 'solid',
            }}
          >
            <span className="font-mono text-2xs text-muted flex-shrink-0">{s.time}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-body text-primary truncate" style={{ fontWeight: 500 }}>{s.name}</span>
              <span className="block text-2xs font-body text-faint truncate">{s.type}</span>
            </span>
            <span className="badge flex-shrink-0" style={{ color: s.statusColor, backgroundColor: `${s.statusColor}1F` }}>{s.status}</span>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 mt-3 text-2xs font-body text-faint">
        <MousePointerClick size={12} className="text-brass flex-shrink-0" style={{ marginTop: 1 }} />
        <span>Toque no nome do aluno para marcar presença, falta ou reposição.</span>
      </div>
    </MockupFrame>
  );
}

function AssessmentMockup({ chromeless } = {}) {
  // Escala com margem em vez de partir do zero: entre 22% e 18,2% a diferença
  // é pequena em absoluto, e a partir do zero a descida ficaria invisível.
  const lo = Math.min(...FAT_TREND) - 1.5;
  const hi = Math.max(...FAT_TREND) + 0.5;
  const heightPct = (v) => ((v - lo) / (hi - lo)) * 100;
  return (
    <MockupFrame label="avaliação física · Rita Almeida" chromeless={chromeless}>
      {/* Escolha do método, tal como no painel */}
      <div className="text-2xs uppercase tracking-wide text-faint font-body mb-1.5">Método de avaliação</div>
      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <div className="rounded-lg border px-3 py-2 text-center text-xs font-body" style={{ borderColor: 'var(--brass)', backgroundColor: 'rgba(30,166,180,0.12)', color: 'var(--brass)' }}>
          Bioimpedância
        </div>
        <div className="rounded-lg border border-hair px-3 py-2 text-center text-xs font-body text-muted">
          Dobras Cutâneas
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { l: 'Peso', v: '64,2 kg', accent: false },
          { l: 'Gordura', v: '18,2%', accent: true },
          { l: 'IMC', v: '21,4', accent: false },
        ].map((m) => (
          <div key={m.l} className="bg-elevated border border-hair rounded-lg p-2.5 flex flex-col gap-0.5">
            <span className="text-2xs uppercase text-faint font-body">{m.l}</span>
            <span className={`font-mono text-sm ${m.accent ? 'text-brass' : 'text-primary'}`}>{m.v}</span>
          </div>
        ))}
      </div>

      {/* Dados completos de bioimpedância */}
      <div className="bg-elevated border border-hair rounded-lg p-3 mb-3">
        <div className="text-2xs uppercase tracking-wide text-faint font-body mb-2">Dados de bioimpedância</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {MOCK_BIA.map((f) => (
            <div key={f.label} className="flex items-baseline justify-between gap-2 min-w-0">
              <span className="text-2xs font-body text-muted truncate">{f.label}</span>
              <span className="font-mono text-2xs text-primary flex-shrink-0">{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fotos ligadas à avaliação */}
      <div className="bg-elevated border border-hair rounded-lg p-3 mb-3">
        <div className="text-2xs uppercase tracking-wide text-faint font-body mb-2">Fotos desta avaliação</div>
        <div className="grid grid-cols-4 gap-2">
          {PHOTO_GRADIENTS.map((g, i) => (
            <div key={i} className="rounded-md aspect-square" style={{ background: g }} />
          ))}
        </div>
      </div>

      {/* Todos os protocolos de dobras disponíveis */}
      <div className="bg-elevated border border-hair rounded-lg p-3 mb-3">
        <div className="text-2xs uppercase tracking-wide text-faint font-body mb-2">Protocolos de dobras disponíveis</div>
        <div className="flex flex-wrap gap-1.5">
          {FOLD_PROTOCOLS_MOCK.map((p, i) => (
            <span
              key={p}
              className="rounded-md border px-2 py-1 text-2xs font-body"
              style={{
                borderColor: i === 0 ? 'var(--brass)' : 'var(--border-hair)',
                color: i === 0 ? 'var(--brass)' : 'var(--text-muted)',
                backgroundColor: i === 0 ? 'rgba(30,166,180,0.12)' : 'transparent',
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-elevated border border-hair rounded-lg p-3">
        <div className="flex items-baseline justify-between gap-2 mb-2.5">
          <span className="text-2xs uppercase text-faint font-body">Evolução da % de gordura</span>
          <span className="text-2xs font-mono text-brass">−3,8 p.p.</span>
        </div>
        <div className="flex items-end gap-2" style={{ height: 56 }}>
          {FAT_TREND.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{ height: `${heightPct(v)}%`, backgroundColor: i === FAT_TREND.length - 1 ? 'var(--brass)' : 'var(--border-hair)' }}
            />
          ))}
        </div>
        <div className="flex gap-2 mt-1.5">
          {FAT_TREND.map((v, i) => (
            <span
              key={i}
              className="flex-1 text-center font-mono text-2xs"
              style={{ color: i === FAT_TREND.length - 1 ? 'var(--brass)' : 'var(--text-faint)' }}
            >
              {String(v).replace('.', ',')}%
            </span>
          ))}
        </div>
      </div>
    </MockupFrame>
  );
}

// A cor de uma combinação (bi-set, trissérie…) tal como no painel: um tom
// forte no primeiro membro, mais clara nos seguintes -- vê-se que são um
// bloco só, sem a ficha ficar aos quadrados. Os exercícios soltos usam a
// mesma paleta, tom mais discreto, só para se lerem separados uns dos outros.
const COR_COMBO = '#1EA6B4';
function LinhaExercicio({ etiqueta, nome, prescricao, carga, cor, tinta, corTexto }) {
  return (
    <div
      className="rounded-lg px-3 py-2 mb-1.5"
      style={{ backgroundColor: `color-mix(in srgb, ${cor} ${tinta}%, var(--bg-elevated))`, borderLeft: `3px solid ${cor}` }}
    >
      <div className="flex items-baseline gap-1.5 mb-0.5 min-w-0">
        {etiqueta && <span className="font-mono text-2xs flex-shrink-0" style={{ color: corTexto || cor, fontWeight: 700 }}>{etiqueta}</span>}
        <span className="text-xs font-body text-primary truncate" style={{ fontWeight: 600 }}>{nome}</span>
      </div>
      <div className="flex items-center justify-between text-2xs font-body text-faint">
        <span>{prescricao}</span>
        <span className="font-mono text-primary">{carga}</span>
      </div>
    </div>
  );
}

function TreinosMockup({ chromeless } = {}) {
  return (
    <MockupFrame label="treino · Hipertrofia — Treino A" chromeless={chromeless}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-display text-sm font-semibold text-primary">Treino A</span>
        <div className="flex rounded-lg border border-hair overflow-hidden flex-shrink-0">
          <span className="px-2.5 py-1 text-2xs font-body" style={{ backgroundColor: 'var(--brass-soft)', color: 'var(--brass)', fontWeight: 600 }}>Completo</span>
          <span className="px-2.5 py-1 text-2xs font-body text-faint">Passo a passo</span>
        </div>
      </div>

      <div
        className="rounded-lg px-2.5 py-1.5 mb-2"
        style={{ backgroundColor: `color-mix(in srgb, ${COR_COMBO} 12%, var(--bg-surface))`, borderLeft: `3px solid ${COR_COMBO}` }}
      >
        <span className="font-mono text-2xs flex-shrink-0" style={{ color: COR_COMBO, fontWeight: 700 }}>A</span>
        <span className="text-xs font-body text-primary ml-1.5" style={{ fontWeight: 500 }}>Bi-set · 2 exercícios seguidos</span>
      </div>
      <LinhaExercicio etiqueta="A1" nome="Supino reto com barra" prescricao="3 séries · 8-10 reps" carga="40 kg" cor={COR_COMBO} tinta={17} />
      <LinhaExercicio etiqueta="A2" nome="Remada curvada" prescricao="3 séries · 10 reps" carga="30 kg" cor={COR_COMBO} tinta={11} />

      <LinhaExercicio nome="Elevação lateral" prescricao="4 séries · 12 reps" carga="8 kg" cor="#C77DFF" tinta={12} corTexto="#C77DFF" />
      <LinhaExercicio nome="Prancha frontal" prescricao="3 séries · 40 s" carga="—" cor="#6FCF97" tinta={7} corTexto="#6FCF97" />

      <div className="flex items-center gap-5 mt-3 pt-3 border-t border-hair">
        {[['4', 'exercícios'], ['10', 'séries'], ['1.240 kg', 'de volume']].map(([v, l]) => (
          <div key={l}>
            <span className="font-mono text-sm text-primary" style={{ fontWeight: 600 }}>{v}</span>
            <span className="block text-2xs font-body text-faint">{l}</span>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 mt-3 mb-3 text-2xs font-body text-faint">
        <MousePointerClick size={12} className="text-brass flex-shrink-0" style={{ marginTop: 1 }} />
        <span>A carga de cada série edita-se aqui mesmo, a meio do treino.</span>
      </div>

      {/* As 11 combinações a sério -- para não ficar só no "e mais oito". */}
      <div className="bg-elevated border border-hair rounded-lg p-3">
        <div className="text-2xs uppercase tracking-wide text-faint font-body mb-2">Combinações disponíveis</div>
        <div className="flex flex-wrap gap-1.5">
          {COMBO_METHODS_MOCK.map((m, i) => (
            <span
              key={m}
              className="rounded-md border px-2 py-1 text-2xs font-body"
              style={{
                borderColor: i === 0 ? 'var(--brass)' : 'var(--border-hair)',
                color: i === 0 ? 'var(--brass)' : 'var(--text-muted)',
                backgroundColor: i === 0 ? 'rgba(30,166,180,0.12)' : 'transparent',
              }}
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </MockupFrame>
  );
}

function FinanceMockup({ chromeless } = {}) {
  return (
    <MockupFrame label="finanças · este mês" chromeless={chromeless}>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-elevated border border-hair rounded-lg p-2.5 flex flex-col gap-0.5">
          <span className="text-2xs uppercase text-faint font-body">Bruto</span>
          <span className="font-mono text-sm text-primary">€2.340</span>
        </div>
        <div className="bg-elevated border border-hair rounded-lg p-2.5 flex flex-col gap-0.5">
          <span className="text-2xs uppercase text-faint font-body">Impostos</span>
          <span className="font-mono text-sm text-rust">€210</span>
        </div>
        <div className="bg-elevated border border-hair rounded-lg p-2.5 flex flex-col gap-0.5">
          <span className="text-2xs uppercase text-faint font-body">Líquido</span>
          <span className="font-mono text-sm text-brass">€1.890</span>
        </div>
      </div>
      <div className="bg-elevated border border-hair rounded-lg p-3">
        <div className="text-2xs uppercase text-faint font-body mb-2.5">Composição da receita</div>
        <div className="w-full rounded-full overflow-hidden flex" style={{ height: 10 }}>
          <div style={{ width: '81%', backgroundColor: 'var(--brass)' }} />
          <div style={{ width: '9%', backgroundColor: 'var(--rust)' }} />
          <div style={{ width: '10%', backgroundColor: 'var(--slate-acc)' }} />
        </div>
      </div>
    </MockupFrame>
  );
}

/* ============================== UI ATOMS ============================== */

function PrimaryButton({ children, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn btn-primary ${className}`}
      style={{ padding: '13px 22px', fontSize: 14, fontWeight: 600 }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick} className={`btn btn-ghost ${className}`} style={{ padding: '13px 22px', fontSize: 14 }}>
      {children}
    </button>
  );
}

function FaqItem({ item, open, onToggle, index }) {
  const painelId = `faq-painel-${index}`;
  return (
    <div className="border border-hair rounded-xl bg-surface overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={painelId}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left btn-surface"
      >
        <span className="text-sm font-body font-medium text-primary">{item.q}</span>
        <ChevronDown size={16} className="text-faint flex-shrink-0" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 220ms var(--ease)' }} />
      </button>
      {/* `grid-template-rows: 0fr -> 1fr` anima uma altura que ninguem mediu
          a mao -- a alternativa a max-height, que ou corta cedo de mais ou
          deixa um resto de tempo morto no fim da transição. */}
      <div id={painelId} role="region" className={`faq-colapso ${open ? 'aberto' : ''}`}>
        <div>
          <p className="px-4 pb-4 text-sm font-body text-muted" style={{ lineHeight: 1.6 }}>{item.a}</p>
        </div>
      </div>
    </div>
  );
}

function FeatureSection({ heading, body, bullets, Mockup, reverse }) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div className={`flex flex-col gap-4 max-w-md order-1 ${reverse ? 'lg:order-2' : 'lg:order-1'}`}>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-primary leading-snug">{heading}</h2>
          <p className="text-sm sm:text-base text-muted font-body">{body}</p>
          <ul className="flex flex-col gap-2.5 mt-1">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm font-body text-muted">
                <CheckCircle2 size={15} className="text-brass flex-shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={`order-2 ${reverse ? 'lg:order-1' : 'lg:order-2'}`}>
          <Mockup />
        </div>
      </div>
    </section>
  );
}

/* ============================== TELEMÓVEL INTERATIVO ============================== */

// A moldura em si: botões laterais, ilha dinâmica com câmara, barra de
// estado, ecrã e barra de baixo. O conteúdo é sempre um dos Mockups reais da
// aplicação, em modo `chromeless` -- nada aqui é uma imagem.
function PhoneFrame({ children }) {
  return (
    <div className="phone-moldura">
      <span className="phone-botao phone-botao-volume-1" aria-hidden="true" />
      <span className="phone-botao phone-botao-volume-2" aria-hidden="true" />
      <span className="phone-botao phone-botao-ligar" aria-hidden="true" />
      <div className="phone-entalhe" aria-hidden="true">
        <span className="phone-camara" />
      </div>
      <div className="phone-ecra">
        <div className="phone-status" aria-hidden="true">
          <span className="font-mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>9:41</span>
          <div className="flex items-center gap-1">
            {/* Barras de rede, wifi e bateria -- desenhadas em SVG para não
                depender de nenhuma fonte de ícones ter estes símbolos. */}
            <svg width="15" height="10" viewBox="0 0 15 10" fill="none"><rect x="0" y="6" width="2.5" height="4" rx="0.5" fill="var(--text-primary)" /><rect x="4" y="4" width="2.5" height="6" rx="0.5" fill="var(--text-primary)" /><rect x="8" y="2" width="2.5" height="8" rx="0.5" fill="var(--text-primary)" /><rect x="12" y="0" width="2.5" height="10" rx="0.5" fill="var(--text-primary)" opacity="0.35" /></svg>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M7 8.5a1 1 0 100-2 1 1 0 000 2z" fill="var(--text-primary)" /><path d="M4 5.2a4.2 4.2 0 016 0" stroke="var(--text-primary)" strokeWidth="1.3" fill="none" strokeLinecap="round" /><path d="M1.8 2.8a7.4 7.4 0 0110.4 0" stroke="var(--text-primary)" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.55" /></svg>
            <svg width="22" height="11" viewBox="0 0 22 11" fill="none"><rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="var(--text-primary)" /><rect x="2" y="2" width="14" height="7" rx="1.2" fill="var(--text-primary)" /><rect x="19.5" y="3.2" width="1.6" height="4.6" rx="0.8" fill="var(--text-primary)" /></svg>
          </div>
        </div>
        {children}
        <div className="phone-reflexo" />
      </div>
      <div className="phone-barra" aria-hidden="true" />
    </div>
  );
}

// Seis ecrãs bastam para explicar o produto sem repetir o que as secções de
// funcionalidades mais abaixo já mostram em detalhe -- este é o resumo em
// movimento; aquelas são a leitura demorada.
const STORY_SCREENS = [
  {
    id: 'painel', label: 'Painel', eyebrow: 'Ao abrir a aplicação',
    title: 'Tudo à vista, num relance',
    body: 'Receita do mês, aulas da semana e faltas pendentes no primeiro ecrã — sem ter de ir procurar em três sítios diferentes.',
    Mockup: DashboardMockup,
  },
  {
    id: 'alunos', label: 'Alunos', eyebrow: 'Cada aluno, organizado',
    title: 'Contexto completo, num toque',
    body: 'Plano, estado e valores por aluno, à vista assim que abre a lista — sem histórico de conversas para reconstituir.',
    Mockup: StudentsMockup,
  },
  {
    id: 'agenda', label: 'Agenda', eyebrow: 'A semana inteira',
    title: 'A sua agenda, sob controlo',
    body: 'Nome do aluno e hora de cada aula, com presença, falta ou reposição a um toque de distância.',
    Mockup: AgendaMockup,
  },
  {
    id: 'treinos', label: 'Treinos', eyebrow: 'A prescrição',
    title: 'O treino, tal como se faz',
    body: 'Bi-sets e superséries com nome e cor próprios. Veja o treino completo ou um exercício de cada vez, com a carga a editar-se ali mesmo.',
    Mockup: TreinosMockup,
  },
  {
    id: 'avaliacao', label: 'Avaliação', eyebrow: 'Evolução do aluno',
    title: 'Resultados, documentados',
    body: 'Bioimpedância ou dobras cutâneas, fotos ligadas à avaliação e o gráfico de evolução sempre atualizado.',
    Mockup: AssessmentMockup,
  },
  {
    id: 'financas', label: 'Finanças', eyebrow: 'O seu negócio',
    title: 'Quanto ganha realmente',
    body: 'Receita bruta, impostos e taxa de ginásio calculados automaticamente, com o líquido sempre em evidência.',
    Mockup: FinanceMockup,
  },
];

// No rato, o texto rola numa coluna comprida e o telemóvel fica fixo ao lado
// -- o ecrã ativo é o do bloco de texto que estiver mais perto do centro da
// janela. No telemóvel não há coluna de sobra para os dois lado a lado, por
// isso quem manda é uma aba tocada, e só o texto do ecrã ativo aparece.
function FeatureStoryteller() {
  const [ativo, setAtivo] = useState(0);
  const blocosRef = useRef([]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) setAtivo(Number(entrada.target.dataset.storyIndex));
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    blocosRef.current.forEach((el) => { if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const tela = (
    <PhoneFrame>
      {STORY_SCREENS.map((s, i) => (
        <div key={s.id} className="phone-tela" style={{ opacity: i === ativo ? 1 : 0, pointerEvents: i === ativo ? 'auto' : 'none' }}>
          <s.Mockup chromeless />
        </div>
      ))}
    </PhoneFrame>
  );

  return (
    <section className="max-w-6xl mx-auto px-4 py-12 sm:py-20">
      <Revelar>
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-primary leading-snug">Assim é usar o PTMANAGER</h2>
          <p className="text-sm sm:text-base text-muted font-body mt-2">Um ecrã por tarefa, pensado para se usar com uma mão, no meio de uma aula.</p>
        </div>
      </Revelar>

      {/* Abas: só se vêem no telemóvel, onde substituem o scroll como forma
          de escolher o ecrã. */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 mb-6 -mx-4 px-4" role="tablist" aria-label="Ecrãs do aplicativo">
        {STORY_SCREENS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={ativo === i}
            onClick={() => setAtivo(i)}
            className="px-3.5 py-2.5 rounded-lg border text-xs font-body nowrap flex-shrink-0 btn-surface"
            style={{
              borderColor: ativo === i ? 'var(--brass)' : 'var(--border-hair)',
              backgroundColor: ativo === i ? 'var(--brass-soft)' : 'transparent',
              color: ativo === i ? 'var(--brass)' : 'var(--text-muted)',
              fontWeight: ativo === i ? 600 : 400,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="lg:hidden flex flex-col gap-6 items-center">
        {tela}
        <div className="text-center max-w-sm">
          <span className="text-2xs uppercase tracking-widest text-brass font-mono">{STORY_SCREENS[ativo].eyebrow}</span>
          <h3 className="font-display text-xl font-semibold text-primary mt-1.5 mb-2">{STORY_SCREENS[ativo].title}</h3>
          <p className="text-sm text-muted font-body">{STORY_SCREENS[ativo].body}</p>
        </div>
      </div>

      <div className="hidden lg:grid grid-cols-2 gap-16 items-start">
        <div className="flex flex-col gap-[26vh] py-8">
          {STORY_SCREENS.map((s, i) => (
            <div
              key={s.id}
              data-story-index={i}
              ref={(el) => { blocosRef.current[i] = el; }}
              style={{ opacity: ativo === i ? 1 : 0.32, transition: 'opacity 320ms var(--ease)' }}
            >
              <span className="text-2xs uppercase tracking-widest text-brass font-mono">{s.eyebrow}</span>
              <h3 className="font-display text-2xl font-semibold text-primary mt-1.5 mb-2">{s.title}</h3>
              <p className="text-base text-muted font-body max-w-sm">{s.body}</p>
            </div>
          ))}
        </div>
        <div style={{ position: 'sticky', top: '14vh', alignSelf: 'start' }}>
          {tela}
        </div>
      </div>
    </section>
  );
}

/* ============================== LANDING PAGE ============================== */

export default function LandingPage({ logoSrc, plans, supportEmail, onGetStarted, onLogin }) {
  const mailto = (subject) => (supportEmail ? `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}` : '');
  const [legalDoc, setLegalDoc] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const plansRef = useRef(null);
  const featuresRef = useRef(null);
  // O mesmo plano que a secção de preços lê para decidir se mostra o selo do
  // trial -- ler daqui em vez de escrever "7" e "mensal" à mão aqui em cima
  // é o que garante que a hero e o pricing nunca dizem coisas diferentes.
  const trialPlan = plans.find((p) => p.trialDays);

  function scrollTo(ref) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <style>{`
        html { scroll-behavior: smooth; }

        .revelar {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 560ms cubic-bezier(0.16, 1, 0.3, 1), transform 560ms cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .revelar-visivel { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .revelar { transition: opacity 200ms ease; transform: none; }
        }

        .faq-colapso {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 280ms cubic-bezier(0.32, 0.72, 0, 1);
        }
        .faq-colapso.aberto { grid-template-rows: 1fr; }
        .faq-colapso > div { overflow: hidden; }

        /* Moldura com duas camadas de cor -- um titânio simulado (gradiente
           muito subtil, de canto a canto) por baixo de um brilho fino no
           rebordo superior esquerdo, como luz a apanhar uma aresta metálica
           real. Os botões laterais são pequenos ressaltos, não decoração
           colada -- têm sombra própria, como se estivessem lá mesmo. */
        .phone-moldura {
          position: relative;
          width: clamp(232px, 74vw, 300px);
          aspect-ratio: 9 / 19.3;
          margin: 0 auto;
          border-radius: 52px;
          background:
            linear-gradient(155deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 18%),
            linear-gradient(200deg, var(--bg-elevated) 0%, color-mix(in srgb, var(--bg-elevated) 82%, black) 100%);
          box-shadow:
            0 50px 100px -30px rgba(0,0,0,0.55),
            0 16px 32px -16px rgba(0,0,0,0.4),
            inset 0 0 0 1px rgba(255,255,255,0.06);
          padding: 13px;
          display: flex;
          flex-direction: column;
        }
        /* O anel entre a moldura e o vidro do ecrã -- é o que dá a sensação
           de duas peças físicas distintas, em vez de um retângulo só. */
        .phone-moldura::before {
          content: '';
          position: absolute; inset: 5px;
          border-radius: 47px;
          border: 1px solid rgba(255,255,255,0.05);
          pointer-events: none;
        }
        .phone-botao {
          position: absolute;
          background: color-mix(in srgb, var(--bg-elevated) 60%, black);
          box-shadow: -1px 0 2px rgba(0,0,0,0.3);
        }
        .phone-botao-volume-1 { left: -2px; top: 21%; width: 3px; height: 7%; border-radius: 2px 0 0 2px; }
        .phone-botao-volume-2 { left: -2px; top: 30%; width: 3px; height: 7%; border-radius: 2px 0 0 2px; }
        .phone-botao-ligar { right: -2px; top: 24%; width: 3px; height: 11%; border-radius: 0 2px 2px 0; }
        .phone-entalhe {
          position: absolute; top: 14px; left: 50%; transform: translateX(-50%);
          width: 34%; height: 26px; border-radius: 999px; background: #000;
          z-index: 3;
          display: flex; align-items: center; justify-content: flex-end; gap: 8px;
          padding-right: 10px;
        }
        /* A câmara: um pequeno círculo mais escuro dentro do entalhe, com um
           reflexo de vidro -- o detalhe que faz a ilha parecer uma peça de
           vidro sobre o ecrã, e não uma forma pintada. */
        .phone-camara {
          width: 7px; height: 7px; border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #3a3a3a, #050505 70%);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.04);
        }
        .phone-ecra {
          flex: 1; min-height: 0; border-radius: 40px; overflow: hidden;
          background: var(--bg-base); position: relative;
        }
        /* A barra de estado: hora + os ícones que qualquer ecrã de telemóvel
           tem, para o conteúdo por baixo se ler como uma aplicação a sério
           desde o primeiro fotograma, e não uma janela recortada. */
        .phone-status {
          position: absolute; top: 0; left: 0; right: 0; z-index: 2;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 22px 0; pointer-events: none;
        }
        .phone-tela {
          position: absolute; inset: 0; overflow-y: auto;
          transition: opacity 320ms ease;
        }
        .phone-barra {
          position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
          width: 34%; height: 4px; border-radius: 999px; background: rgba(255,255,255,0.55);
          z-index: 3;
        }
        /* Um brilho muito ténue a atravessar o vidro na diagonal -- não é um
           reflexo literal, é só o suficiente para o ecrã deixar de parecer
           uma cor plana. Desaparece com pouco movimento, de propósito. */
        .phone-reflexo {
          position: absolute; inset: 0; z-index: 4; pointer-events: none;
          background: linear-gradient(115deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 20%, rgba(255,255,255,0) 100%);
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-hair bg-surface sticky top-0" style={{ zIndex: 30 }}>
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={logoSrc} alt="PTMANAGER" style={{ width: 30, height: 30, flexShrink: 0 }} />
            <span className="font-display font-semibold text-lg tracking-wide text-primary truncate">
              PT<span style={{ color: 'var(--brass)' }}>MANAGER</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => scrollTo(featuresRef)} className="hidden sm:inline text-xs font-body link-sky">Recursos</button>
            <button type="button" onClick={() => scrollTo(plansRef)} className="hidden sm:inline text-xs font-body link-sky">Planos</button>
            <button type="button" onClick={onLogin} className="px-3.5 py-2 rounded-lg text-xs font-body font-medium border border-hair btn-surface text-primary">
              Entrar
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 pt-12 pb-16 sm:pt-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="flex flex-col gap-5 order-1">
            {trialPlan && (
              <Revelar
                className="inline-flex w-fit items-center gap-2 rounded-lg px-3 py-1.5"
                style={{ backgroundColor: 'var(--gold-soft)', border: '1px solid rgba(245,180,76,0.28)' }}
              >
                <Clock size={13} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                <span className="text-2xs sm:text-xs font-body font-semibold" style={{ color: 'var(--gold)' }}>
                  {trialPlan.trialDays} dias grátis, sem cobrança agora
                </span>
              </Revelar>
            )}
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold text-primary leading-tight">
              Gestão completa para <span style={{ color: 'var(--brass)' }}>Personal Trainers</span>
            </h1>
            <p className="text-sm sm:text-base text-muted font-body max-w-lg">
              Um único painel para gerir alunos, agenda, avaliações físicas, fotos de progresso e finanças — sem folhas de cálculo, sem informação perdida no WhatsApp.
              {trialPlan && ` Experimente ${trialPlan.trialDays} dias sem custo antes de decidir.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <PrimaryButton onClick={onGetStarted}>{trialPlan ? 'Começar grátis' : 'Começar agora'}</PrimaryButton>
              <SecondaryButton onClick={() => scrollTo(plansRef)}>Ver planos</SecondaryButton>
            </div>
            {trialPlan && (
              <span className="text-2xs sm:text-xs font-body text-faint -mt-2">
                {trialPlan.trialDays} dias grátis · depois {trialPlan.perMonth} · cancele quando quiser
              </span>
            )}
            {supportEmail && (
              <a href={mailto('Quero saber mais sobre o PTMANAGER')} className="inline-flex items-center gap-1.5 text-xs font-body link-sky w-fit">
                <Mail size={14} /> Falar com o suporte
              </a>
            )}
          </div>

          <div className="relative order-2">
            <div
              className="hidden sm:flex absolute z-10 bg-elevated border border-hair rounded-xl px-3 py-2.5 items-center gap-2"
              style={{ top: -18, right: -8, boxShadow: '0 16px 34px -14px rgba(0,0,0,0.7)' }}
            >
              <div className="p-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(30,166,180,0.18)' }}>
                <UserPlus size={13} className="text-brass" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-2xs font-body text-primary">Novo aluno</span>
                <span className="text-2xs font-body text-faint">registado agora</span>
              </div>
            </div>

            <DashboardMockup />

            <div
              className="hidden sm:flex absolute z-10 bg-elevated border border-hair rounded-xl px-3 py-2.5 items-center gap-2"
              style={{ bottom: -16, left: -10, boxShadow: '0 16px 34px -14px rgba(0,0,0,0.7)' }}
            >
              <TrendingUp size={13} className="text-brass flex-shrink-0" />
              <span className="text-2xs font-body text-primary">Receita líquida em dia</span>
            </div>
          </div>
        </section>

        {/* Dores */}
        <section className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <Revelar><h2 className="font-display text-2xl sm:text-3xl font-semibold text-primary text-center leading-snug">Isto soa-lhe familiar?</h2></Revelar>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[PAIN_POINTS.slice(0, 4), PAIN_POINTS.slice(4)].map((col, ci) => (
              <Revelar key={ci} atraso={ci * 90} className="border border-hair rounded-2xl bg-surface overflow-hidden">
                {col.map((p, i) => (
                  <div key={p.text} className={`flex items-center gap-3.5 px-5 py-4 ${i > 0 ? 'border-t border-hair' : ''}`}>
                    <p.icon size={16} style={{ color: 'var(--rust)', flexShrink: 0 }} />
                    <span className="text-sm font-body text-muted">{p.text}</span>
                  </div>
                ))}
              </Revelar>
            ))}
          </div>
        </section>

        {/* Telemóvel interativo */}
        <FeatureStoryteller />

        {/* Funcionalidades */}
        <div ref={featuresRef} className="scroll-mt-16">
          {FEATURE_SECTIONS.map((f, i) => (
            <Revelar key={f.heading}>
              <FeatureSection heading={f.heading} body={f.body} bullets={f.bullets} Mockup={f.Mockup} reverse={i % 2 === 1} />
            </Revelar>
          ))}
        </div>

        {/* Tudo o que você precisa — o resto do produto, que não cabe em
            cinco secções demonstradas sem repetir o que elas já mostraram. */}
        <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <Revelar className="flex flex-col gap-2 text-center items-center mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-primary leading-snug">E tudo o resto, no mesmo sítio</h2>
            <p className="text-sm sm:text-base text-muted font-body max-w-xl">
              O que não tem uma demonstração própria acima, mas está lá — pronto a usar desde o primeiro dia.
            </p>
          </Revelar>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURE_INDEX.map((cat, i) => (
              <Revelar
                key={cat.heading}
                atraso={(i % 2) * 60}
                className="border border-hair rounded-2xl bg-surface px-6 py-6 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(30,166,180,0.12)' }}>
                    <cat.icon size={16} className="text-brass" />
                  </div>
                  <h3 className="font-display text-sm font-semibold text-primary">{cat.heading}</h3>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {cat.items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-xs sm:text-sm font-body text-muted">
                      <CheckCircle2 size={13} className="text-brass flex-shrink-0 mt-0.5" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </Revelar>
            ))}
          </div>
        </section>

        {/* Planos */}
        <section ref={plansRef} className="max-w-6xl mx-auto px-4 py-12 sm:py-16 flex flex-col gap-8 scroll-mt-16">
          <div className="flex flex-col gap-2 text-center items-center">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-primary">Quanto mais tempo, mais meses grátis</h2>
            <p className="text-sm text-muted font-body max-w-xl">
              Pagamento processado com segurança pela Stripe. Cancele quando quiser.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan, pi) => (
              <Revelar
                key={plan.id}
                atraso={pi * 90}
                className="bg-surface border rounded-2xl p-6 flex flex-col gap-4 relative"
                style={{
                  borderColor: plan.highlight ? 'var(--brass)' : 'var(--border-hair)',
                  boxShadow: plan.highlight ? '0 24px 60px -28px rgba(30,166,180,0.45)' : 'none',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold text-primary">{plan.name}</h3>
                  {plan.highlight && (
                    <span className="text-2xs uppercase tracking-wide font-mono px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(30,166,180,0.16)', color: 'var(--brass)' }}>
                      Mais escolhido
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-mono text-2xl sm:text-3xl font-semibold text-primary">{plan.price}</span>
                    {plan.perMonth && plan.bonusMonths > 0 && (
                      <span className="font-mono text-xs text-faint">≈ {plan.perMonth}</span>
                    )}
                  </div>
                  <div className="text-xs text-faint font-body mt-1">{plan.trialDays ? `${plan.note} — a partir do 8º dia` : plan.note}</div>
                </div>

                {plan.trialDays ? (
                  <div
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                    style={{ backgroundColor: 'var(--gold-soft)', color: 'var(--gold)', border: '1px solid rgba(245,180,76,0.28)' }}
                  >
                    <Clock size={15} className="flex-shrink-0" />
                    <span className="text-xs font-body font-semibold">{plan.trialDays} dias grátis, sem cobrança agora</span>
                  </div>
                ) : plan.bonusLabel ? (
                  <div
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                    style={{ backgroundColor: 'var(--gold-soft)', color: 'var(--gold)', border: '1px solid rgba(245,180,76,0.28)' }}
                  >
                    <Gift size={15} className="flex-shrink-0" />
                    <span className="text-xs font-body font-semibold">{plan.bonusLabel}</span>
                  </div>
                ) : (
                  <div className="rounded-lg px-3 py-2.5 border border-hair">
                    <span className="text-xs font-body text-faint">Sem compromisso, cancele a qualquer momento</span>
                  </div>
                )}

                <p className="text-xs text-muted font-body">
                  {plan.trialDays && `Experimente ${plan.trialDays} dias de graça. Depois, ${plan.price}/mês — cancele antes do fim do período gratuito e não paga nada.`}
                  {!plan.trialDays && plan.id === 'mensal' && 'Para começar sem compromisso, ou testar antes de decidir o período.'}
                  {!plan.trialDays && plan.id === 'trimestral' && 'O equilíbrio entre poupança e liberdade — o mais escolhido pelos treinadores.'}
                  {!plan.trialDays && plan.id === 'anual' && 'Para quem já sabe que fica — o custo mensal mais baixo dos três.'}
                </p>

                <PrimaryButton onClick={onGetStarted} className="mt-auto">
                  {plan.trialDays ? `Experimentar ${plan.trialDays} dias grátis` : 'Começar agora'}
                </PrimaryButton>
              </Revelar>
            ))}
          </div>

          {/* O carrinho começa aqui: a mesma lista que a Stripe vai mostrar a
              seguir, uma vez só, porque os três planos não diferem em
              funcionalidade — só em preço, período e bónus. */}
          <Revelar className="border border-hair rounded-2xl bg-surface p-6 sm:p-7">
            <h3 className="font-display text-base font-semibold text-primary mb-4">Incluído em qualquer plano</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {PLAN_INCLUDES.map((inc) => (
                <li key={inc} className="flex items-start gap-2 text-sm font-body text-muted">
                  <CheckCircle2 size={15} className="text-brass flex-shrink-0 mt-0.5" />
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </Revelar>

          <p className="text-center text-xs text-faint font-body max-w-xl mx-auto">
            Os meses grátis são acrescentados ao primeiro período, logo após a confirmação do pagamento.
          </p>
          {supportEmail && (
            <a href={mailto('Dúvida sobre os planos do PTMANAGER')} className="text-center text-xs font-body link-sky">
              Prefere esclarecer dúvidas antes? Escreva-nos
            </a>
          )}
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 py-12 sm:py-16 flex flex-col gap-6">
          <Revelar><h2 className="font-display text-2xl sm:text-3xl font-semibold text-primary text-center">Perguntas frequentes</h2></Revelar>
          <Revelar className="flex flex-col gap-2.5">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={item.q} item={item} index={i} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </Revelar>
        </section>

        {/* Final CTA */}
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <Revelar className="border border-hair rounded-2xl p-8 sm:p-12 flex flex-col items-center text-center gap-4" style={{ backgroundColor: 'rgba(30,166,180,0.08)' }}>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-primary">Pronto para organizar a sua rotina?</h2>
            <p className="text-sm text-muted font-body max-w-md">Crie a sua conta e comece a usar o PTMANAGER hoje mesmo.</p>
            <PrimaryButton onClick={onGetStarted}>Começar agora</PrimaryButton>
          </Revelar>
        </section>
      </main>

      <footer className="px-4 py-5 border-t border-hair flex flex-col items-center gap-2.5">
        <div className="flex items-center gap-3 text-xs font-body">
          <button type="button" onClick={() => setLegalDoc('termos')} className="link-sky">Termos de Utilização</button>
          <span className="text-faint">·</span>
          <button type="button" onClick={() => setLegalDoc('privacidade')} className="link-sky">Política de Privacidade</button>
        </div>
      </footer>

      {legalDoc && <LegalModal docId={legalDoc} supportEmail={supportEmail} onClose={() => setLegalDoc(null)} />}
    </div>
  );
}
