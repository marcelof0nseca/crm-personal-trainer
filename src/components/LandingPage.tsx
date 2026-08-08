import React, { useRef, useState } from 'react';
import {
  Users, CalendarRange, RotateCcw, ClipboardCheck, Camera, Wallet, Settings,
  MessageCircle, CalendarDays, ShieldCheck, LogIn, RefreshCcw, Lock, ChevronDown,
  CheckCircle2, TrendingUp,
} from 'lucide-react';

const PAIN_POINTS = [
  { icon: MessageCircle, text: 'Alunos espalhados no WhatsApp' },
  { icon: CalendarDays, text: 'Agenda desorganizada' },
  { icon: RotateCcw, text: 'Reposições esquecidas' },
  { icon: ClipboardCheck, text: 'Avaliações físicas perdidas' },
  { icon: Wallet, text: 'Falta de clareza financeira' },
];

const FEATURES = [
  { icon: Users, title: 'Gestão de alunos', text: 'Cadastro, planos e histórico em um só lugar.' },
  { icon: CalendarRange, title: 'Agenda semanal e mensal', text: 'Veja sua semana e seu mês sem esforço.' },
  { icon: RotateCcw, title: 'Faltas e reposições', text: 'Controle automático de quem precisa repor.' },
  { icon: ClipboardCheck, title: 'Avaliações físicas completas', text: 'Protocolos de dobras e evolução do aluno.' },
  { icon: Camera, title: 'Fotos de progresso', text: 'Acompanhe a evolução visual de cada aluno.' },
  { icon: Wallet, title: 'Controle financeiro', text: 'Receitas, despesas e clareza sobre seu mês.' },
  { icon: Settings, title: 'Assinatura e conta', text: 'Gerencie seu plano direto pelo painel.' },
];

const TRUST_ITEMS = [
  { icon: Lock, text: 'Pagamento seguro via Stripe' },
  { icon: ShieldCheck, text: 'Dados separados por conta' },
  { icon: LogIn, text: 'Acesso por login' },
  { icon: RefreshCcw, text: 'Cancelamento pelo portal da Stripe' },
];

const FAQ_ITEMS = [
  { q: 'Preciso instalar algo?', a: 'Não. O PTMANAGER funciona direto no navegador, em qualquer computador ou celular.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim. O cancelamento é feito a qualquer momento pelo portal de assinatura da Stripe.' },
  { q: 'Meus alunos acessam o sistema?', a: 'Não. O acesso é exclusivo do personal trainer — seus alunos não precisam de login.' },
  { q: 'Funciona em Portugal?', a: 'Sim. Preços em euro e suporte pensados para o mercado português.' },
  { q: 'O pagamento é seguro?', a: 'Sim. Todos os pagamentos são processados pela Stripe, com criptografia de nível bancário.' },
];

const MOCK_STATS = [
  { label: 'Alunos ativos', value: '24', icon: Users },
  { label: 'Aulas esta semana', value: '18', icon: CalendarRange },
  { label: 'Faltas pendentes', value: '3', icon: RotateCcw },
  { label: 'Receita do mês', value: '€2.340', icon: TrendingUp },
];

const MOCK_SESSIONS = [
  { time: '08:00', name: 'Rita Almeida', type: 'Horário Fixo', color: '#5DA9E9' },
  { time: '10:30', name: 'João Pereira', type: 'Avaliação Física', color: '#D6764A' },
  { time: '17:00', name: 'Marta Silva', type: 'Reposição', color: '#5FBFA0' },
];

function SectionTag({ children }) {
  return <div className="text-2xs uppercase tracking-wide text-faint font-mono">{children}</div>;
}

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

function SecondaryButton({ children, onClick, href, className = '' }) {
  const cls = `px-5 py-3 rounded-lg text-sm font-body font-medium border border-hair btn-surface text-primary text-center ${className}`;
  if (href) {
    return <a href={href} onClick={onClick} className={cls}>{children}</a>;
  }
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

function FaqItem({ item, open, onToggle }) {
  return (
    <div className="border border-hair rounded-xl bg-surface overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-sm font-body font-medium text-primary">{item.q}</span>
        <ChevronDown size={16} className="text-faint flex-shrink-0" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm font-body text-muted animate-in">{item.a}</div>
      )}
    </div>
  );
}

export default function LandingPage({ logoSrc, plans, whatsappUrl, onGetStarted, onLogin }) {
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
        <section className="max-w-6xl mx-auto px-4 pt-12 pb-14 sm:pt-16 sm:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-5">
            <SectionTag>CRM para Personal Trainers</SectionTag>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold text-primary leading-tight">
              Gestão completa para <span style={{ color: 'var(--brass)' }}>Personal Trainers</span>
            </h1>
            <p className="text-sm sm:text-base text-muted font-body max-w-lg">
              Controle alunos, agenda, avaliações físicas, fotos de progresso e finanças em um só painel.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <PrimaryButton onClick={onGetStarted}>Começar agora</PrimaryButton>
              <SecondaryButton onClick={() => scrollTo(plansRef)}>Ver planos</SecondaryButton>
            </div>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-body link-sky w-fit">
                <MessageCircle size={14} /> Falar no WhatsApp
              </a>
            )}
          </div>

          {/* Mockup preview */}
          <div className="bg-surface border border-hair rounded-2xl p-4 sm:p-5 animate-in">
            <div className="flex items-center gap-1.5 mb-4">
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--rust)' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#8C8C8C' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--brass)' }} />
              <span className="text-2xs font-mono text-faint ml-2">painel · hoje</span>
            </div>
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
          </div>
        </section>

        {/* Dores */}
        <section className="max-w-6xl mx-auto px-4 py-12 sm:py-14 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <SectionTag>O problema</SectionTag>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-primary">Isso te soa familiar?</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PAIN_POINTS.map((p) => (
              <div key={p.text} className="bg-surface border border-hair rounded-xl p-4 flex flex-col gap-3">
                <div className="p-2 rounded-lg w-fit" style={{ backgroundColor: 'rgba(214,83,74,0.14)' }}>
                  <p.icon size={16} style={{ color: 'var(--rust)' }} />
                </div>
                <span className="text-xs sm:text-sm font-body text-muted">{p.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Funcionalidades */}
        <section ref={featuresRef} className="max-w-6xl mx-auto px-4 py-12 sm:py-14 flex flex-col gap-6 scroll-mt-16">
          <div className="flex flex-col gap-2">
            <SectionTag>A solução</SectionTag>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-primary">Tudo que você precisa em um só painel</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-surface border border-hair rounded-xl p-4 flex flex-col gap-3 card-hover">
                <div className="p-2 rounded-lg w-fit" style={{ backgroundColor: 'rgba(30,166,180,0.14)' }}>
                  <f.icon size={16} className="text-brass" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-body font-medium text-primary">{f.title}</span>
                  <span className="text-xs font-body text-faint">{f.text}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Planos */}
        <section ref={plansRef} className="max-w-6xl mx-auto px-4 py-12 sm:py-14 flex flex-col gap-6 scroll-mt-16">
          <div className="flex flex-col gap-2">
            <SectionTag>Planos</SectionTag>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-primary">Escolha o plano ideal para você</h2>
            <p className="text-sm text-muted font-body max-w-xl">Pagamento processado com segurança pela Stripe. Cancele quando quiser.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-surface border rounded-xl p-5 flex flex-col gap-4"
                style={{ borderColor: plan.highlight ? 'var(--brass)' : 'var(--border-hair)' }}
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
                  <div className="font-mono text-2xl sm:text-3xl font-semibold text-primary">{plan.price}</div>
                  <div className="text-xs text-faint font-body mt-1">{plan.note}</div>
                </div>
                <ul className="text-xs sm:text-sm text-muted font-body flex flex-col gap-1.5">
                  <li className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-brass flex-shrink-0" /> Alunos, agenda e avaliações</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-brass flex-shrink-0" /> Fotos de progresso</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-brass flex-shrink-0" /> Controle financeiro</li>
                </ul>
                <PrimaryButton onClick={onGetStarted} className="mt-auto">Começar agora</PrimaryButton>
              </div>
            ))}
          </div>
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="text-center text-xs font-body link-sky">
              Prefere tirar dúvidas antes? Fale no WhatsApp
            </a>
          )}
        </section>

        {/* Confiança */}
        <section className="max-w-6xl mx-auto px-4 py-10 sm:py-12">
          <div className="border border-hair rounded-2xl bg-surface p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[...TRUST_ITEMS, { icon: MessageCircle, text: whatsappUrl ? 'Suporte via WhatsApp' : 'Suporte dedicado' }].map((t) => (
              <div key={t.text} className="flex flex-col items-center text-center gap-2">
                <t.icon size={18} className="text-brass" />
                <span className="text-2xs sm:text-xs font-body text-muted">{t.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 py-12 sm:py-14 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <SectionTag>Dúvidas frequentes</SectionTag>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-primary">Perguntas frequentes</h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={item.q} item={item} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-6xl mx-auto px-4 pb-14">
          <div className="border border-hair rounded-2xl p-7 sm:p-10 flex flex-col items-center text-center gap-4" style={{ backgroundColor: 'rgba(30,166,180,0.08)' }}>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-primary">Pronto para organizar sua rotina?</h2>
            <p className="text-sm text-muted font-body max-w-md">Crie sua conta e comece a usar o PTMANAGER hoje mesmo.</p>
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
