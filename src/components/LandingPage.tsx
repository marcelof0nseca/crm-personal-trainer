import { useRef, useState } from 'react';
import {
  MessageCircle, CalendarDays, RotateCcw, ClipboardCheck, Images, Wallet, TrendingDown,
  ShieldCheck, LogIn, RefreshCcw, Lock, ChevronDown, CheckCircle2, TrendingUp, ArrowRight, UserPlus, Gift, Mail,
  MousePointerClick,
} from 'lucide-react';

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

const PHOTO_DATES = ['Jan', 'Mar', 'Mai', 'Jul'];
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

const TRUST_ITEMS = [
  { icon: Lock, text: 'Pagamento processado com segurança pela Stripe' },
  { icon: ShieldCheck, text: 'Os seus dados ficam separados por conta, isolados dos restantes utilizadores' },
  { icon: LogIn, text: 'Acesso protegido por sessão — só o titular entra no painel' },
  { icon: RefreshCcw, text: 'Cancele ou altere o plano quando quiser, no portal da Stripe' },
];

const FAQ_ITEMS = [
  { q: 'Preciso de instalar alguma coisa?', a: 'Não. O PTMANAGER funciona diretamente no navegador, em qualquer computador ou telemóvel — sem instalar nada.' },
  { q: 'Funciona no telemóvel e no tablet?', a: 'Sim. O painel é totalmente responsivo e funciona igualmente bem no telemóvel, tablet e computador.' },
  { q: 'Como funcionam os meses grátis?', a: 'No plano trimestral paga 3 meses e fica com 4. No anual paga 12 meses e fica com 14. Os meses grátis são acrescentados ao primeiro período, logo após a confirmação do pagamento.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim. O cancelamento é feito a qualquer momento, diretamente no portal de subscrição da Stripe.' },
  { q: 'Os meus alunos acedem ao sistema?', a: 'Não. O acesso é exclusivo do personal trainer — os seus alunos não precisam de conta nem de iniciar sessão.' },
  { q: 'Funciona em Portugal?', a: 'Sim. Preços em euros e suporte pensados para o mercado português.' },
  { q: 'O pagamento é seguro?', a: 'Sim. Todos os pagamentos são processados pela Stripe, com encriptação de nível bancário.' },
  { q: 'Como ativo o meu plano depois de pagar?', a: 'Automaticamente. Assim que a Stripe confirma o pagamento, o plano fica ativo em poucos segundos — se demorar, o botão "Verificar subscrição" confirma de imediato.' },
];

const PLAN_INCLUDES = [
  'Alunos, agenda e avaliações sem limite',
  'Fotos de progresso incluídas',
  'Controlo financeiro completo',
  'Suporte e portal de subscrição',
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
    heading: 'Evolução documentada, não só recordada',
    body: 'Registe por bioimpedância — massa muscular, água corporal, gordura visceral, TMB — ou por dobras cutâneas, com cinco protocolos à escolha. Com fotos ligadas a cada avaliação.',
    bullets: [
      'Bioimpedância com 12 campos e fotos da avaliação',
      'Cinco protocolos de dobras: Jackson-Pollock 7 e 3, Durnin-Womersley, Faulkner e Guedes',
      '% de gordura e IMC calculados automaticamente',
    ],
    Mockup: AssessmentMockup,
  },
  {
    heading: 'O antes e depois, guardado como deve ser',
    body: 'Fotos de progresso organizadas por aluno e por data, ligadas diretamente à avaliação física correspondente.',
    bullets: ['Fotos por aluno e por data', 'Acompanhamento visual da evolução', 'Tudo dentro do perfil do aluno'],
    Mockup: PhotosMockup,
  },
  {
    heading: 'Quanto ganha realmente',
    body: 'Receita bruta, impostos, taxa de ginásio e líquido — por aluno e no total — além das despesas e entradas pessoais do mês.',
    bullets: ['Líquido calculado automaticamente', 'Controlo por aluno e vista geral', 'Despesas e entradas pessoais'],
    Mockup: FinanceMockup,
  },
  {
    heading: 'A sua subscrição, sob o seu controlo',
    body: 'Escolha um plano e pague com segurança pela Stripe. Depois, atualize o cartão, veja faturas ou cancele diretamente no portal oficial.',
    bullets: ['Pagamento seguro via Stripe', 'Portal para gerir ou cancelar', 'Mudança de plano quando quiser'],
    Mockup: AccountMockup,
  },
];

/* ============================== MOCKUP ATOMS ============================== */

function MockupFrame({ label, children }) {
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

function DashboardMockup() {
  return (
    <MockupFrame label="painel · hoje">
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {MOCK_STATS.map((s) => (
          <div key={s.label} className="bg-elevated border border-hair rounded-xl p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs uppercase tracking-wide text-muted font-body">{s.label}</span>
              <s.icon size={14} className="text-brass" />
            </div>
            <span className="font-mono text-lg text-primary font-semibold">{s.value}</span>
          </div>
        ))}
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

function StudentsMockup() {
  return (
    <MockupFrame label="alunos · 24 ativos">
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

function AgendaMockup() {
  const activeDay = 3;
  return (
    <MockupFrame label="agenda · semana de 3 a 9 de agosto">
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

function AssessmentMockup() {
  // Escala com margem em vez de partir do zero: entre 22% e 18,2% a diferença
  // é pequena em absoluto, e a partir do zero a descida ficaria invisível.
  const lo = Math.min(...FAT_TREND) - 1.5;
  const hi = Math.max(...FAT_TREND) + 0.5;
  const heightPct = (v) => ((v - lo) / (hi - lo)) * 100;
  return (
    <MockupFrame label="avaliação física · Rita Almeida">
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

function PhotosMockup() {
  return (
    <MockupFrame label="fotos de progresso · Rita Almeida">
      <div className="grid grid-cols-4 gap-2">
        {PHOTO_DATES.map((d, i) => (
          <div key={d} className="flex flex-col gap-1.5">
            <div className="rounded-lg aspect-square" style={{ background: PHOTO_GRADIENTS[i] }} />
            <span className="text-2xs font-mono text-faint text-center">{d}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function FinanceMockup() {
  return (
    <MockupFrame label="finanças · este mês">
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

function AccountMockup() {
  return (
    <MockupFrame label="perfil · plano">
      <div className="bg-elevated border border-hair rounded-lg p-3.5 flex flex-col gap-2.5 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-2xs uppercase text-faint font-body">Plano atual</span>
          <span className="text-2xs font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(30,166,180,0.16)', color: 'var(--brass)' }}>Ativo</span>
        </div>
        <span className="font-display text-lg text-primary font-semibold">Trimestral · €39,90</span>
        <span className="text-2xs font-body text-faint">Próxima renovação em 62 dias</span>
      </div>
      <div className="border border-hair rounded-lg px-3.5 py-2.5 flex items-center justify-between">
        <span className="text-xs font-body text-primary">Gerir no portal Stripe</span>
        <ArrowRight size={14} className="text-brass flex-shrink-0" />
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
      className={`px-5 py-3 rounded-lg text-sm font-body font-semibold transition-transform active:scale-[0.98] ${className}`}
      style={{ backgroundColor: 'var(--brass)', color: '#0A0A0A' }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick} className={`px-5 py-3 rounded-lg text-sm font-body font-medium border border-hair btn-surface text-primary text-center ${className}`}>
      {children}
    </button>
  );
}

function FaqItem({ item, open, onToggle }) {
  return (
    <div className="border border-hair rounded-xl bg-surface overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left">
        <span className="text-sm font-body font-medium text-primary">{item.q}</span>
        <ChevronDown size={16} className="text-faint flex-shrink-0" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>
      {open && <div className="px-4 pb-4 text-sm font-body text-muted animate-in">{item.a}</div>}
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

/* ============================== LANDING PAGE ============================== */

export default function LandingPage({ logoSrc, plans, supportEmail, onGetStarted, onLogin }) {
  const mailto = (subject) => (supportEmail ? `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}` : '');
  const [openFaq, setOpenFaq] = useState(0);
  const plansRef = useRef(null);
  const featuresRef = useRef(null);

  function scrollTo(ref) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <style>{`html { scroll-behavior: smooth; }`}</style>

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
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold text-primary leading-tight">
              Gestão completa para <span style={{ color: 'var(--brass)' }}>Personal Trainers</span>
            </h1>
            <p className="text-sm sm:text-base text-muted font-body max-w-lg">
              Um único painel para gerir alunos, agenda, avaliações físicas, fotos de progresso e finanças — sem folhas de cálculo, sem informação perdida no WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <PrimaryButton onClick={onGetStarted}>Começar agora</PrimaryButton>
              <SecondaryButton onClick={() => scrollTo(plansRef)}>Ver planos</SecondaryButton>
            </div>
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
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-primary text-center leading-snug">Isto soa-lhe familiar?</h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[PAIN_POINTS.slice(0, 4), PAIN_POINTS.slice(4)].map((col, ci) => (
              <div key={ci} className="border border-hair rounded-2xl bg-surface overflow-hidden">
                {col.map((p, i) => (
                  <div key={p.text} className={`flex items-center gap-3.5 px-5 py-4 ${i > 0 ? 'border-t border-hair' : ''}`}>
                    <p.icon size={16} style={{ color: 'var(--rust)', flexShrink: 0 }} />
                    <span className="text-sm font-body text-muted">{p.text}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Funcionalidades */}
        <div ref={featuresRef} className="scroll-mt-16">
          {FEATURE_SECTIONS.map((f, i) => (
            <FeatureSection key={f.heading} heading={f.heading} body={f.body} bullets={f.bullets} Mockup={f.Mockup} reverse={i % 2 === 1} />
          ))}
        </div>

        {/* Planos */}
        <section ref={plansRef} className="max-w-6xl mx-auto px-4 py-12 sm:py-16 flex flex-col gap-8 scroll-mt-16">
          <div className="flex flex-col gap-2 text-center items-center">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-primary">Quanto mais tempo, mais meses grátis</h2>
            <p className="text-sm text-muted font-body max-w-xl">
              Pagamento processado com segurança pela Stripe. Cancele quando quiser.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
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
                  <div className="text-xs text-faint font-body mt-1">{plan.note}</div>
                </div>

                {plan.bonusLabel ? (
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

                <ul className="text-xs sm:text-sm text-muted font-body flex flex-col gap-1.5">
                  {PLAN_INCLUDES.map((inc) => (
                    <li key={inc} className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-brass flex-shrink-0" /> {inc}
                    </li>
                  ))}
                </ul>
                <PrimaryButton onClick={onGetStarted} className="mt-auto">Começar agora</PrimaryButton>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-faint font-body max-w-xl mx-auto">
            Os meses grátis são acrescentados ao primeiro período, logo após a confirmação do pagamento.
          </p>
          {supportEmail && (
            <a href={mailto('Dúvida sobre os planos do PTMANAGER')} className="text-center text-xs font-body link-sky">
              Prefere esclarecer dúvidas antes? Escreva-nos
            </a>
          )}
        </section>

        {/* Confiança / Segurança */}
        <section className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex flex-col gap-2 text-center items-center mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-primary">Os seus dados, protegidos do início ao fim</h2>
            <p className="text-sm text-muted font-body max-w-xl">
              O acesso ao painel exige sessão iniciada e subscrição ativa — cada conta vê apenas os seus próprios dados.
            </p>
          </div>
          <div className="border border-hair rounded-2xl bg-surface overflow-hidden">
            {[...TRUST_ITEMS, { icon: Mail, text: 'Suporte por e-mail sempre que precisar' }].map((t, i) => (
              <div key={t.text} className={`flex items-center gap-3.5 px-5 py-4 ${i > 0 ? 'border-t border-hair' : ''}`}>
                <t.icon size={16} className="text-brass flex-shrink-0" />
                <span className="text-sm font-body text-muted">{t.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 py-12 sm:py-16 flex flex-col gap-6">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-primary text-center">Perguntas frequentes</h2>
          <div className="flex flex-col gap-2.5">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={item.q} item={item} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="border border-hair rounded-2xl p-8 sm:p-12 flex flex-col items-center text-center gap-4" style={{ backgroundColor: 'rgba(30,166,180,0.08)' }}>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-primary">Pronto para organizar a sua rotina?</h2>
            <p className="text-sm text-muted font-body max-w-md">Crie a sua conta e comece a usar o PTMANAGER hoje mesmo.</p>
            <PrimaryButton onClick={onGetStarted}>Começar agora</PrimaryButton>
          </div>
        </section>
      </main>

      <div className="px-4 py-4 text-center text-2xs font-body text-faint" style={{ opacity: 0.55 }}>
        Developed by Marcelo Fonseca
      </div>
    </div>
  );
}
