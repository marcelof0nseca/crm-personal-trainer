import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard, CalendarDays, CalendarRange, Users, Plus, UserPlus, X, Trash2,
  TrendingUp, AlertTriangle, CheckCircle2, RotateCcw, Shuffle, Repeat, ClipboardCheck,
  Sparkles, UserX, ChevronLeft, ChevronRight, Search, Wallet, Percent, Building2,
  Loader2, Settings, Check, Info, ChevronDown, ChevronUp, Activity, Ban, Download, Upload,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { supabase, supabaseConfigured } from './src/supabaseClient';

/* ============================== LOGO ============================== */

const LOGO_B64 = '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';
const LOGO_SRC = `data:image/png;base64,${LOGO_B64}`;

/* ============================== CONSTANTS ============================== */

const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const SESSION_TYPES = [
  { id: 'fixo', label: 'Horário Fixo', icon: Repeat, color: '#4A90D9' },
  { id: 'flutuante', label: 'Horário Flutuante', icon: Shuffle, color: '#9B8AC4' },
  { id: 'reposicao', label: 'Reposição', icon: RotateCcw, color: '#5FBFA0' },
  { id: 'avaliacao', label: 'Avaliação Física', icon: ClipboardCheck, color: '#D6764A' },
  { id: 'experimental', label: 'Aula Experimental', icon: Sparkles, color: '#E08FB0' },
];

const STATUS_OPTIONS = [
  { id: 'agendado', label: 'Agendado', color: '#8C8C8C' },
  { id: 'realizado', label: 'Realizado', color: '#5FBFA0' },
  { id: 'falta', label: 'Falta', color: '#D6534A' },
  { id: 'cancelado', label: 'Cancelado', color: '#5C5C5C' },
];

const STUDENT_COLORS = ['#5DA9E9', '#C77DFF', '#4EC5D4', '#EF88AD', '#7EC4CF', '#8FA6C2', '#A78BFA', '#7FB3B3', '#6FCF97', '#E8735A'];
const PLAN_TYPES = ['1x por semana', '2x por semana', '3x por semana', '4x por semana', '5x por semana', 'Personalizado'];
const ACCENT_HEX = { brass: '#FFB300', rust: '#D6534A', slate: '#8C8C8C', sky: '#E0B85C' };

const EXPENSE_CATEGORIES = [
  { id: 'moradia', label: 'Moradia', color: '#5DA9E9' },
  { id: 'contas', label: 'Contas e Utilidades', color: '#7EC4CF' },
  { id: 'alimentacao', label: 'Alimentação', color: '#6FCF97' },
  { id: 'transporte', label: 'Transporte', color: '#A78BFA' },
  { id: 'saude', label: 'Saúde', color: '#EF88AD' },
  { id: 'lazer', label: 'Lazer', color: '#C77DFF' },
  { id: 'educacao', label: 'Educação', color: '#4EC5D4' },
  { id: 'assinaturas', label: 'Assinaturas', color: '#8FA6C2' },
  { id: 'impostos', label: 'Impostos Pessoais', color: '#D6534A' },
  { id: 'outros_gasto', label: 'Outros', color: '#7FB3B3' },
];

const INCOME_CATEGORIES = [
  { id: 'rendimento_pt', label: 'Rendimento PT', color: '#FFB300' },
  { id: 'freelance', label: 'Freelance / Extra', color: '#5DA9E9' },
  { id: 'investimentos', label: 'Investimentos', color: '#6FCF97' },
  { id: 'reembolsos', label: 'Reembolsos', color: '#7EC4CF' },
  { id: 'presentes', label: 'Presentes', color: '#EF88AD' },
  { id: 'outros_entrada', label: 'Outros', color: '#8FA6C2' },
];

const FOLD_SITES = [
  { id: 'assessFoldChest', label: 'Peitoral' },
  { id: 'assessFoldMidaxillary', label: 'Axilar Média' },
  { id: 'assessFoldTriceps', label: 'Tríceps' },
  { id: 'assessFoldSubscapular', label: 'Subescapular' },
  { id: 'assessFoldAbdominal', label: 'Abdominal' },
  { id: 'assessFoldSuprailiac', label: 'Supra-ilíaca' },
  { id: 'assessFoldThigh', label: 'Coxa' },
];

const BIA_FIELDS = [
  { id: 'assessMuscleMass', label: '% Massa Muscular', suffix: '%' },
  { id: 'assessBodyWater', label: '% Água Corporal', suffix: '%' },
  { id: 'assessVisceralFat', label: 'Gordura Visceral', suffix: '' },
  { id: 'assessBoneMass', label: 'Massa Óssea (kg)', suffix: '' },
  { id: 'assessBMR', label: 'TMB (kcal)', suffix: '' },
  { id: 'assessMetabolicAge', label: 'Idade Metabólica', suffix: '' },
];

const EMPTY_ASSESS_FIELDS = {
  assessWeight: '', assessBodyFat: '', assessMuscleMass: '', assessBodyWater: '',
  assessVisceralFat: '', assessBoneMass: '', assessBMR: '', assessMetabolicAge: '',
  assessFoldChest: '', assessFoldMidaxillary: '', assessFoldTriceps: '', assessFoldSubscapular: '',
  assessFoldAbdominal: '', assessFoldSuprailiac: '', assessFoldThigh: '', assessNotes: '',
};

/* ============================== HELPERS ============================== */

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
function currency(v) { return (Number(v) || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }); }

function studentFinance(student) {
  const gross = Number(student.planValue) || 0;
  const tax = (gross * (Number(student.taxPercent) || 0)) / 100;
  const gymFee = student.gymFeeType === 'fixed' ? (Number(student.gymFeeValue) || 0) : (gross * (Number(student.gymFeeValue) || 0)) / 100;
  const net = gross - tax - gymFee;
  return { gross, tax, gymFee, net };
}

function pendingFaltas(studentId, sessions) {
  const faltas = sessions.filter((s) => s.studentId === studentId && s.status === 'falta').length;
  const reposicoes = sessions.filter((s) => s.studentId === studentId && s.type === 'reposicao' && s.status !== 'falta' && s.status !== 'cancelado').length;
  return Math.max(0, faltas - reposicoes);
}

function foldSum(form) {
  return FOLD_SITES.reduce((sum, f) => sum + (parseFloat(form[f.id]) || 0), 0);
}

function bmiOf(weightKg, heightCm) {
  const w = parseFloat(weightKg), h = parseFloat(heightCm);
  if (!w || !h) return null;
  const m = h / 100;
  return w / (m * m);
}
function bmiLabel(bmi) {
  if (bmi == null) return '';
  if (bmi < 18.5) return 'Abaixo do peso';
  if (bmi < 25) return 'Peso normal';
  if (bmi < 30) return 'Sobrepeso';
  return 'Obesidade';
}

function browserStorageAvailable() {
  if (typeof window === 'undefined') return false;
  return supabaseConfigured || !!(window as any).storage || !!window.localStorage;
}

async function currentSupabaseUserId() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id || null;
}

async function readStoredValue(key) {
  if (supabaseConfigured && supabase) {
    const userId = await currentSupabaseUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('app_data')
      .select('value')
      .eq('user_id', userId)
      .eq('data_key', key)
      .maybeSingle();
    if (error) throw error;
    return data ? { value: JSON.stringify(data.value || []) } : null;
  }
  const customStorage = typeof window !== 'undefined' ? (window as any).storage : null;
  if (customStorage) return customStorage.get(key, false);
  const value = window.localStorage.getItem(key);
  return value == null ? null : { value };
}

async function writeStoredValue(key, value) {
  if (supabaseConfigured && supabase) {
    const userId = await currentSupabaseUserId();
    if (!userId) throw new Error('Usuário não autenticado.');
    const parsedValue = JSON.parse(value);
    const { error } = await supabase
      .from('app_data')
      .upsert({
        user_id: userId,
        data_key: key,
        value: parsedValue,
        updated_at: new Date().toISOString(),
      });
    if (error) throw error;
    return null;
  }
  const customStorage = typeof window !== 'undefined' ? (window as any).storage : null;
  if (customStorage) return customStorage.set(key, value, false);
  window.localStorage.setItem(key, value);
  return null;
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function fmtDateISO(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtDateBR(date) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function periodBounds() {
  const now = new Date();
  const weekStartD = startOfWeek(now);
  return {
    weekStart: fmtDateISO(weekStartD), weekEnd: fmtDateISO(addDays(weekStartD, 6)),
    monthStart: fmtDateISO(new Date(now.getFullYear(), now.getMonth(), 1)), monthEnd: fmtDateISO(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    yearStart: fmtDateISO(new Date(now.getFullYear(), 0, 1)), yearEnd: fmtDateISO(new Date(now.getFullYear(), 11, 31)),
  };
}
function countActiveSessions(studentId, startIso, endIso, sessions) {
  return sessions.filter((s) => s.studentId === studentId && s.date >= startIso && s.date <= endIso && (s.status === 'agendado' || s.status === 'realizado')).length;
}

function categoryFor(type, categoryId) {
  const list = type === 'entrada' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.find((c) => c.id === categoryId) || list[list.length - 1];
}
function statusLabel(type, status) {
  if (type === 'entrada') return status === 'concluido' ? 'Recebido' : 'Previsto';
  return status === 'concluido' ? 'Pago' : 'Pendente';
}

function downloadBackup(students, sessions, finances) {
  const data = { exportedAt: new Date().toISOString(), alunos: students, agenda: sessions, financas: finances };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `painel-pt-backup-${fmtDateISO(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ============================== GLOBAL STYLES ============================== */

function GlobalStyles() {
  return (
    <style>{`
      :root {
        color-scheme: dark;
        --bg-base: #0D0D0D;
        --bg-surface: #181818;
        --bg-elevated: #222222;
        --border-hair: #363636;
        --text-primary: #F5F5F0;
        --text-muted: #9A9A9A;
        --text-faint: #656565;
        --brass: #FFB300;
        --rust: #D6534A;
        --slate-acc: #8C8C8C;
        --sky: #E0B85C;
      }

      * { box-sizing: border-box; }
      html, body { background-color: var(--bg-base); margin: 0; }

      .font-display { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .font-body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      .font-mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-variant-numeric: tabular-nums; }

      .text-2xs { font-size: 0.6875rem; line-height: 1rem; }

      .bg-base { background-color: var(--bg-base); }
      .bg-surface { background-color: var(--bg-surface); }
      .bg-elevated { background-color: var(--bg-elevated); }
      .border-hair { border-color: var(--border-hair); }
      .text-primary { color: var(--text-primary); }
      .text-muted { color: var(--text-muted); }
      .text-faint { color: var(--text-faint); }
      .text-brass { color: var(--brass); }
      .text-rust { color: var(--rust); }
      .text-slate-acc { color: var(--slate-acc); }
      .text-sky { color: var(--sky); }

      .card-hover { transition: filter 0.15s ease; }
      .card-hover:hover { filter: brightness(1.12); }
      .btn-surface { transition: background-color 0.15s ease; }
      .btn-surface:hover { background-color: var(--bg-elevated); }
      .link-sky { color: var(--brass); transition: opacity 0.15s ease; background: none; border: none; cursor: pointer; padding: 0; }
      .link-sky:hover { opacity: 0.75; text-decoration: underline; }

      .input-field {
        width: 100%;
        background-color: var(--bg-base);
        border: 1px solid var(--border-hair);
        border-radius: 8px;
        padding: 9px 12px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        color: var(--text-primary);
        outline: none;
        transition: border-color 0.15s ease;
      }
      .input-field:focus { border-color: var(--brass); }
      .input-field::placeholder { color: var(--text-faint); }

      button { font-family: inherit; }
      button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, [tabindex]:focus-visible {
        outline: 2px solid var(--brass);
        outline-offset: 2px;
      }

      ::-webkit-scrollbar { height: 8px; width: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: var(--border-hair); border-radius: 4px; }

      @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      .animate-in { animation: fadeSlideIn 0.2s ease-out; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .spin { animation: spin 0.8s linear infinite; }

      input[type="date"]::-webkit-calendar-picker-indicator,
      input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.8); cursor: pointer; }

      input[type="color"] { -webkit-appearance: none; border: none; padding: 0; background: none; cursor: pointer; }
      input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
      input[type="color"]::-webkit-color-swatch { border: 2px solid var(--border-hair); border-radius: 999px; }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
      }
    `}</style>
  );
}

/* ============================== ERROR BOUNDARY ============================== */

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Erro no Painel PT:', error, info); }
  render() {
    if (this.state.error) {
      if (this.props.compact) {
        return (
          <div className="flex flex-col items-center justify-center text-center py-10 px-4">
            <AlertTriangle size={22} className="text-rust mb-2" />
            <p className="text-xs text-muted font-body">Não foi possível carregar este gráfico.</p>
          </div>
        );
      }
      return (
        <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-4 px-6 text-center">
          <AlertTriangle size={32} className="text-rust" />
          <div className="font-display font-semibold text-lg text-primary">Algo deu errado ao carregar o painel</div>
          <p className="text-sm text-muted font-body max-w-md">{String((this.state.error && this.state.error.message) || this.state.error)}</p>
          <button onClick={() => this.setState({ error: null })} type="button" className="px-4 py-2 rounded-lg text-sm font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0D0D0D' }}>
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ============================== SMALL ATOMS ============================== */

function FormField({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-body text-muted">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center animate-in" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 40 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-surface border border-hair rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-y-auto" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-hair sticky top-0 bg-surface">
          <h2 className="font-display font-medium text-lg text-primary">{title}</h2>
          <button onClick={onClose} type="button" className="p-1.5 rounded-lg btn-surface" aria-label="Fechar">
            <X size={18} className="text-muted" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 animate-in" style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 50 }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="bg-surface border border-hair rounded-2xl w-full max-w-sm p-5">
        <h3 className="font-display font-medium text-base text-primary mb-2">{title}</h3>
        <p className="text-sm text-muted font-body mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} type="button" className="px-4 py-2 rounded-lg text-sm font-body text-muted border border-hair btn-surface">Cancelar</button>
          <button onClick={onConfirm} type="button" className="px-4 py-2 rounded-lg text-sm font-body" style={{ backgroundColor: 'var(--rust)', color: '#0D0D0D' }}>Excluir</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg border font-body text-sm flex items-center gap-2 animate-in" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: isError ? 'var(--rust)' : 'var(--brass)', color: 'var(--text-primary)', zIndex: 60 }}>
      {isError ? <AlertTriangle size={15} className="text-rust" /> : <CheckCircle2 size={15} className="text-brass" />}
      {toast.msg}
    </div>
  );
}

function EmptyState({ message, cta, onCta, icon: Icon = Info }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <Icon size={26} className="text-faint mb-3" />
      <p className="text-sm text-muted font-body max-w-xs">{message}</p>
      {cta && (
        <button onClick={onCta} type="button" className="mt-4 px-4 py-2 rounded-lg text-sm font-body border border-hair" style={{ backgroundColor: 'rgba(255,179,0,0.12)', color: 'var(--brass)' }}>
          {cta}
        </button>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-4">
      <img src={LOGO_SRC} alt="Coach Bruno Fonseca" style={{ width: 72, height: 72 }} />
      <Loader2 size={24} className="text-brass spin" />
      <span className="font-body text-sm text-muted">Carregando painel...</span>
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    if (!supabase) {
      setMessage('Supabase não configurado.');
      return;
    }
    if (!email || !password) {
      setMessage('Digite e-mail e senha.');
      return;
    }
    setBusy(true);
    const action = mode === 'signup'
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });
    const { error } = await action;
    if (error) setMessage(error.message);
    else if (mode === 'signup') setMessage('Conta criada. Se o Supabase pedir confirmação, verifique seu e-mail.');
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <form onSubmit={submit} className="bg-surface border border-hair rounded-xl p-5 w-full max-w-sm flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <img src={LOGO_SRC} alt="Coach Bruno Fonseca" style={{ width: 34, height: 34, flexShrink: 0 }} />
          <span className="font-display font-semibold text-xl tracking-wide text-primary">COACH<span style={{ color: 'var(--brass)' }}>BFONSECA</span></span>
        </div>
        <div>
          <h1 className="font-display text-lg font-semibold text-primary">{mode === 'signup' ? 'Criar acesso' : 'Entrar no painel'}</h1>
          <p className="text-xs font-body text-muted mt-1">Seus dados ficam salvos no banco fixo do Supabase.</p>
        </div>
        <FormField label="E-mail">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="voce@email.com" />
        </FormField>
        <FormField label="Senha">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Mínimo 6 caracteres" />
        </FormField>
        {message && <div className="text-xs font-body text-rust">{message}</div>}
        <button type="submit" disabled={busy} className="px-4 py-2.5 rounded-lg text-sm font-body font-medium disabled:opacity-60" style={{ backgroundColor: 'var(--brass)', color: '#0D0D0D' }}>
          {busy ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : 'Entrar'}
        </button>
        <button type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage(''); }} className="text-xs font-body link-sky">
          {mode === 'signup' ? 'Já tenho conta' : 'Criar primeira conta'}
        </button>
      </form>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent = 'brass', sub }) {
  const hex = ACCENT_HEX[accent];
  return (
    <div className="bg-surface border border-hair rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-2xs uppercase tracking-wide text-muted font-body">{label}</span>
        <Icon size={16} style={{ color: hex }} />
      </div>
      <span className="font-mono text-xl sm:text-2xl text-primary font-semibold">{value}</span>
      {sub && <span className="text-2xs text-faint font-body">{sub}</span>}
    </div>
  );
}

function AlertChip({ icon: Icon, label, count, accent }) {
  const hex = ACCENT_HEX[accent];
  return (
    <div className="bg-surface border border-hair rounded-xl p-3 flex items-center gap-2.5">
      <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${hex}22` }}>
        <Icon size={15} style={{ color: hex }} />
      </div>
      <div className="min-w-0">
        <div className="font-mono text-lg text-primary leading-none">{count}</div>
        <div className="text-2xs text-faint font-body truncate">{label}</div>
      </div>
    </div>
  );
}

function RevenueLoadBar({ gross, tax, gymFee, net, height = 32, showLabels = true }) {
  const total = gross > 0 ? gross : 1;
  const netPct = Math.max(0, (net / total) * 100);
  const taxPct = Math.max(0, (tax / total) * 100);
  const gymPct = Math.max(0, (gymFee / total) * 100);
  return (
    <div>
      <div className="w-full rounded-lg overflow-hidden border border-hair flex" style={{ height }}>
        <div style={{ width: `${netPct}%`, backgroundColor: 'var(--brass)' }} title={`Líquido: ${currency(net)}`} />
        <div style={{ width: `${taxPct}%`, backgroundColor: 'var(--rust)' }} title={`Imposto: ${currency(tax)}`} />
        <div style={{ width: `${gymPct}%`, backgroundColor: 'var(--slate-acc)' }} title={`Taxa Ginásio: ${currency(gymFee)}`} />
      </div>
      {showLabels && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-2xs font-body">
          <span className="flex items-center gap-1.5 text-muted"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: 'var(--brass)' }} />Líquido {currency(net)}</span>
          <span className="flex items-center gap-1.5 text-muted"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: 'var(--rust)' }} />Imposto {currency(tax)}</span>
          <span className="flex items-center gap-1.5 text-muted"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: 'var(--slate-acc)' }} />Taxa Ginásio {currency(gymFee)}</span>
        </div>
      )}
    </div>
  );
}

/* ============================== ASSESSMENT FIELDS (shared) ============================== */

function AssessmentFields({ form, set, studentHeight }) {
  const [showBio, setShowBio] = useState(false);
  const [showFolds, setShowFolds] = useState(false);
  const sum = foldSum(form);
  const bmi = bmiOf(form.assessWeight, studentHeight);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Peso (kg)">
          <input type="number" inputMode="decimal" min="0" step="0.1" value={form.assessWeight || ''} onChange={(e) => set('assessWeight', e.target.value)} className="input-field" placeholder="0,0" />
        </FormField>
        <FormField label="% Gordura corporal">
          <input type="number" inputMode="decimal" min="0" max="100" step="0.1" value={form.assessBodyFat || ''} onChange={(e) => set('assessBodyFat', e.target.value)} className="input-field" placeholder="0,0" />
        </FormField>
      </div>

      {bmi != null && (
        <div className="flex items-center justify-between text-xs font-body px-3 py-2 rounded-lg bg-elevated border border-hair">
          <span className="text-muted">IMC calculado</span>
          <span className="text-primary font-mono">{bmi.toFixed(1)} · <span className="text-faint">{bmiLabel(bmi)}</span></span>
        </div>
      )}
      {bmi == null && !studentHeight && (
        <div className="text-2xs text-faint font-body">Adicione a altura do aluno no cadastro para calcular o IMC automaticamente.</div>
      )}

      <button type="button" onClick={() => setShowBio((v) => !v)} className="flex items-center justify-between text-2xs uppercase tracking-wide text-faint font-mono py-1">
        Bioimpedância (opcional)
        {showBio ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {showBio && (
        <div className="grid grid-cols-2 gap-3 animate-in">
          {BIA_FIELDS.map((f) => (
            <FormField key={f.id} label={f.label}>
              <input type="number" inputMode="decimal" min="0" step="0.1" value={form[f.id] || ''} onChange={(e) => set(f.id, e.target.value)} className="input-field" placeholder="0" />
            </FormField>
          ))}
        </div>
      )}

      <button type="button" onClick={() => setShowFolds((v) => !v)} className="flex items-center justify-between text-2xs uppercase tracking-wide text-faint font-mono py-1">
        Protocolo de Dobras Cutâneas — mm (opcional)
        {showFolds ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {showFolds && (
        <div className="animate-in flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            {FOLD_SITES.map((f) => (
              <FormField key={f.id} label={f.label}>
                <input type="number" inputMode="decimal" min="0" step="0.1" value={form[f.id] || ''} onChange={(e) => set(f.id, e.target.value)} className="input-field" placeholder="0" />
              </FormField>
            ))}
          </div>
          {sum > 0 && (
            <div className="flex items-center justify-between text-xs font-body px-3 py-2 rounded-lg bg-elevated border border-hair">
              <span className="text-muted">Soma das dobras</span>
              <span className="text-primary font-mono">{sum.toFixed(1)} mm</span>
            </div>
          )}
        </div>
      )}

      <FormField label="Observações da avaliação">
        <textarea value={form.assessNotes || ''} onChange={(e) => set('assessNotes', e.target.value)} className="input-field" rows={2} placeholder="Evolução, orientações, observações..." />
      </FormField>
    </div>
  );
}

/* ============================== SESSION CARD ============================== */

function SessionCard({ session, student, onOpen, onQuickStatus }) {
  const type = SESSION_TYPES.find((t) => t.id === session.type) || SESSION_TYPES[0];
  const TypeIcon = type.icon;
  const isFalta = session.status === 'falta';
  const isCancelado = session.status === 'cancelado';
  const isRealizado = session.status === 'realizado';
  const color = student?.color || '#54565D';
  const statusInfo = STATUS_OPTIONS.find((o) => o.id === session.status);

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
      className={`rounded-lg border border-hair bg-elevated pl-3 pr-1.5 py-2 cursor-pointer card-hover animate-in ${isCancelado ? 'opacity-50' : ''}`}
      style={{ borderLeftWidth: '3px', borderLeftColor: color }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-mono text-2xs text-muted">{session.startTime}</span>
            <TypeIcon size={11} style={{ color: type.color }} />
            <span className="text-2xs font-body text-faint truncate">{type.label}</span>
          </div>
          <div className={`font-body text-sm text-primary truncate ${isFalta ? 'line-through' : ''}`}>
            {student?.name || 'Aluno removido'}
          </div>
          <span className="inline-block text-2xs font-body mt-0.5 px-1.5 py-0.5 rounded" style={{ color: statusInfo?.color, backgroundColor: 'rgba(255,255,255,0.05)' }}>
            {statusInfo?.label}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          {!isRealizado && !isCancelado && !isFalta && (
            <button onClick={(e) => { e.stopPropagation(); onQuickStatus(session, 'realizado'); }} type="button" className="p-1 rounded btn-surface" aria-label="Marcar como realizado" title="Marcar como realizado">
              <CheckCircle2 size={14} className="text-slate-acc" />
            </button>
          )}
          {!isFalta && !isCancelado && (
            <button onClick={(e) => { e.stopPropagation(); onQuickStatus(session, 'falta'); }} type="button" className="p-1 rounded btn-surface" aria-label="Reportar falta" title="Reportar falta">
              <UserX size={14} className="text-rust" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== HEADER + NAV ============================== */

function Header({ onOpenSettings }) {
  const now = new Date();
  const dateLabel = `${DAY_NAMES[now.getDay()]}, ${now.getDate()} de ${MONTH_NAMES[now.getMonth()]}`;
  return (
    <header className="border-b border-hair bg-surface">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={LOGO_SRC} alt="Coach Bruno Fonseca" style={{ width: 30, height: 30, flexShrink: 0 }} />
          <span className="font-display font-semibold text-xl tracking-wide text-primary">COACH<span style={{ color: 'var(--brass)' }}>BFONSECA</span></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-body text-faint hidden sm:inline">{dateLabel}</span>
          <button onClick={onOpenSettings} type="button" className="p-2 rounded-lg btn-surface" aria-label="Configurações">
            <Settings size={17} className="text-muted" />
          </button>
        </div>
      </div>
    </header>
  );
}

function NavTabs({ view, setView }) {
  const tabs = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'weekly', label: 'Semana', icon: CalendarDays },
    { id: 'monthly', label: 'Mês', icon: CalendarRange },
    { id: 'students', label: 'Alunos', icon: Users },
    { id: 'finances', label: 'Finanças', icon: Wallet },
  ];
  return (
    <nav className="border-b border-hair bg-surface sticky top-0" style={{ zIndex: 30 }}>
      <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = view === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              type="button"
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-body flex-shrink-0"
              style={{ color: active ? 'var(--brass)' : 'var(--text-muted)', borderBottom: active ? '2px solid var(--brass)' : '2px solid transparent' }}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ============================== DASHBOARD ============================== */

function Dashboard({ students, sessions, finances, setView, onAddSession, onOpenSession, onQuickStatus }) {
  const activeStudents = useMemo(() => students.filter((s) => s.active), [students]);

  const totals = useMemo(() => activeStudents.reduce((acc, s) => {
    const f = studentFinance(s);
    acc.gross += f.gross; acc.tax += f.tax; acc.gymFee += f.gymFee; acc.net += f.net;
    return acc;
  }, { gross: 0, tax: 0, gymFee: 0, net: 0 }), [activeStudents]);

  const today = fmtDateISO(new Date());
  const bounds = useMemo(() => periodBounds(), []);

  const todaySessions = useMemo(() => sessions.filter((s) => s.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime)), [sessions, today]);
  const weekSessions = useMemo(() => sessions.filter((s) => s.date >= bounds.weekStart && s.date <= bounds.weekEnd), [sessions, bounds]);
  const monthSessions = useMemo(() => sessions.filter((s) => s.date >= bounds.monthStart && s.date <= bounds.monthEnd), [sessions, bounds]);

  const faltasSemana = weekSessions.filter((s) => s.status === 'falta').length;
  const reposicoesPendentes = sessions.filter((s) => s.type === 'reposicao' && s.status === 'agendado' && s.date >= today).length;
  const avaliacoesAgendadas = sessions.filter((s) => s.type === 'avaliacao' && s.status === 'agendado' && s.date >= today).length;
  const experimentaisAgendadas = sessions.filter((s) => s.type === 'experimental' && s.status === 'agendado' && s.date >= today).length;
  const totalFaltasPendentes = useMemo(() => activeStudents.reduce((sum, s) => sum + pendingFaltas(s.id, sessions), 0), [activeStudents, sessions]);

  const aulasRealizadasMes = monthSessions.filter((s) => s.status === 'realizado' && s.type !== 'avaliacao').length;
  const avaliacoesRealizadasMes = monthSessions.filter((s) => s.status === 'realizado' && s.type === 'avaliacao').length;
  const faltasMes = monthSessions.filter((s) => s.status === 'falta').length;
  const cancelamentosAulasMes = monthSessions.filter((s) => s.status === 'cancelado' && s.type !== 'avaliacao').length;
  const cancelamentosAvaliacoesMes = monthSessions.filter((s) => s.status === 'cancelado' && s.type === 'avaliacao').length;
  const comparecimentoBase = aulasRealizadasMes + avaliacoesRealizadasMes + faltasMes;
  const taxaComparecimento = comparecimentoBase > 0 ? Math.round(((aulasRealizadasMes + avaliacoesRealizadasMes) / comparecimentoBase) * 100) : null;

  const financeMonthTx = useMemo(() => finances.filter((t) => t.date >= bounds.monthStart && t.date <= bounds.monthEnd), [finances, bounds]);
  const financeEntradasMes = financeMonthTx.filter((t) => t.type === 'entrada').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const financeSaidasMes = financeMonthTx.filter((t) => t.type === 'gasto').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const financeSaldoMes = financeEntradasMes - financeSaidasMes;
  const financePendenciasMes = financeMonthTx.filter((t) => t.status === 'pendente').length;
  const financeCategoryData = useMemo(() => EXPENSE_CATEGORIES.map((c) => ({
    name: c.label, color: c.color, value: financeMonthTx.filter((t) => t.type === 'gasto' && t.category === c.id).reduce((s, t) => s + (Number(t.amount) || 0), 0),
  })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value), [financeMonthTx]);

  const typeDistData = useMemo(() => SESSION_TYPES.map((t) => ({
    name: t.label, value: weekSessions.filter((s) => s.type === t.id).length, color: t.color,
  })).filter((d) => d.value > 0), [weekSessions]);

  const topStudentsData = useMemo(() => [...activeStudents]
    .map((s) => ({ name: s.name.split(' ')[0], value: studentFinance(s).net, color: s.color }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6), [activeStudents]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  if (students.length === 0) {
    return (
      <div className="px-4 py-4 max-w-6xl mx-auto">
        <EmptyState icon={Users} message="Nenhum aluno cadastrado ainda. Cadastre seu primeiro aluno para ver o painel financeiro e montar sua agenda." cta="Cadastrar aluno" onCta={() => setView('students')} />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <div className="text-2xs uppercase tracking-widest text-faint font-mono mb-1">{greeting}</div>
        <h1 className="font-display font-semibold text-2xl text-primary tracking-wide">Painel Financeiro e Operacional</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Receita Bruta" value={currency(totals.gross)} icon={Wallet} accent="sky" />
        <StatCard label="Receita Líquida" value={currency(totals.net)} icon={TrendingUp} accent="brass" />
        <StatCard label="Impostos" value={currency(totals.tax)} icon={Percent} accent="rust" />
        <StatCard label="Taxa Ginásio" value={currency(totals.gymFee)} icon={Building2} accent="slate" />
        <StatCard label="Alunos Ativos" value={activeStudents.length} icon={Users} accent="sky" sub={`${students.length} no total`} />
        <StatCard label="Aulas / Semana" value={weekSessions.length} icon={CalendarDays} accent="sky" />
      </div>

      <div className="bg-surface border border-hair rounded-xl p-4">
        <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-3">Composição da Receita Mensal</div>
        <RevenueLoadBar gross={totals.gross} tax={totals.tax} gymFee={totals.gymFee} net={totals.net} height={36} />
      </div>

      <div>
        <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-3">Atividade do Mês</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Aulas Realizadas" value={aulasRealizadasMes} icon={CheckCircle2} accent="brass" />
          <StatCard label="Avaliações Realizadas" value={avaliacoesRealizadasMes} icon={ClipboardCheck} accent="sky" />
          <StatCard label="Faltas" value={faltasMes} icon={UserX} accent="rust" />
          <StatCard label="Cancelamentos" value={cancelamentosAulasMes + cancelamentosAvaliacoesMes} icon={Ban} accent="slate" sub={`${cancelamentosAulasMes} aulas · ${cancelamentosAvaliacoesMes} avaliações`} />
          <StatCard label="Taxa de Comparecimento" value={taxaComparecimento != null ? `${taxaComparecimento}%` : '—'} icon={Activity} accent="brass" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-hair rounded-xl p-4">
          <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-2">Aulas por Tipo (Esta Semana)</div>
          <ErrorBoundary compact>
            {typeDistData.length === 0 ? <EmptyState message="Sem aulas agendadas esta semana." /> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={typeDistData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {typeDistData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#222222', border: '1px solid #363636', borderRadius: 8, color: '#F5F5F0' }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#9A9A9A' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ErrorBoundary>
        </div>
        <div className="bg-surface border border-hair rounded-xl p-4">
          <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-2">Receita Líquida por Aluno</div>
          <ErrorBoundary compact>
            {topStudentsData.length === 0 ? <EmptyState message="Cadastre alunos para ver o ranking." /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topStudentsData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fill: '#9A9A9A', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => currency(v)} contentStyle={{ background: '#222222', border: '1px solid #363636', borderRadius: 8, color: '#F5F5F0' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                    {topStudentsData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ErrorBoundary>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <AlertChip icon={UserX} label="Faltas (semana)" count={faltasSemana} accent="rust" />
        <AlertChip icon={UserX} label="Faltas pendentes (total)" count={totalFaltasPendentes} accent="rust" />
        <AlertChip icon={RotateCcw} label="Reposições pendentes" count={reposicoesPendentes} accent="slate" />
        <AlertChip icon={ClipboardCheck} label="Avaliações agendadas" count={avaliacoesAgendadas} accent="sky" />
        <AlertChip icon={Sparkles} label="Experimentais agendadas" count={experimentaisAgendadas} accent="brass" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-2xs uppercase tracking-wide text-faint font-mono">Agenda de Hoje</div>
          <button onClick={() => onAddSession(today)} type="button" className="flex items-center gap-1 text-xs font-body link-sky">
            <Plus size={13} /> Agendar
          </button>
        </div>
        {todaySessions.length === 0 ? <EmptyState message="Nenhuma aula agendada para hoje." /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {todaySessions.map((s) => {
              const student = students.find((st) => st.id === s.studentId);
              return <SessionCard key={s.id} session={s} student={student} onOpen={() => onOpenSession(s)} onQuickStatus={onQuickStatus} />;
            })}
          </div>
        )}
      </div>

      <div>
        <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-3">Aulas por Aluno (Semana / Mês / Ano)</div>
        <div className="bg-surface border border-hair rounded-xl overflow-x-auto">
          <table className="w-full text-sm font-body" style={{ minWidth: '520px' }}>
            <thead>
              <tr className="border-b border-hair text-left">
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium">Aluno</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right">Semana</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right">Mês</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right">Ano</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right">Faltas Pend.</th>
              </tr>
            </thead>
            <tbody>
              {activeStudents.map((s) => {
                const pf = pendingFaltas(s.id, sessions);
                return (
                  <tr key={s.id} className="border-b border-hair">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-primary">{s.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-primary">{countActiveSessions(s.id, bounds.weekStart, bounds.weekEnd, sessions)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-primary">{countActiveSessions(s.id, bounds.monthStart, bounds.monthEnd, sessions)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-primary">{countActiveSessions(s.id, bounds.yearStart, bounds.yearEnd, sessions)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold" style={{ color: pf > 0 ? 'var(--rust)' : 'var(--text-faint)' }}>{pf}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-3">Detalhamento Financeiro por Aluno</div>
        <div className="bg-surface border border-hair rounded-xl overflow-x-auto">
          <table className="w-full text-sm font-body" style={{ minWidth: '560px' }}>
            <thead>
              <tr className="border-b border-hair text-left">
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium">Aluno</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium">Plano</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right">Bruto</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right">Imposto</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right">Taxa Ginásio</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right">Líquido</th>
              </tr>
            </thead>
            <tbody>
              {activeStudents.map((s) => {
                const f = studentFinance(s);
                return (
                  <tr key={s.id} className="border-b border-hair">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-primary">{s.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted">{s.planType}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-primary">{currency(f.gross)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-rust">{currency(f.tax)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-acc">{currency(f.gymFee)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-brass font-semibold">{currency(f.net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-3">Finanças Pessoais (Mês)</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <StatCard label="Entradas" value={currency(financeEntradasMes)} icon={TrendingUp} accent="brass" />
          <StatCard label="Saídas" value={currency(financeSaidasMes)} icon={Wallet} accent="rust" />
          <StatCard label="Saldo" value={currency(financeSaldoMes)} icon={Activity} accent={financeSaldoMes >= 0 ? 'sky' : 'rust'} sub={financePendenciasMes > 0 ? `${financePendenciasMes} pendência(s)` : undefined} />
        </div>
        {financeCategoryData.length === 0 ? (
          <div className="bg-surface border border-hair rounded-xl">
            <EmptyState icon={Wallet} message="Nenhum gasto pessoal lançado este mês ainda." cta="Ir para Finanças" onCta={() => setView('finances')} />
          </div>
        ) : (
          <div className="bg-surface border border-hair rounded-xl p-4">
            <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-2">Gastos Pessoais por Categoria</div>
            <ErrorBoundary compact>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={financeCategoryData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {financeCategoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => currency(v)} contentStyle={{ background: '#222222', border: '1px solid #363636', borderRadius: 8, color: '#F5F5F0' }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#9A9A9A' }} />
                </PieChart>
              </ResponsiveContainer>
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== WEEKLY VIEW ============================== */

function DayColumn({ date, sessionsList, onOpenSession, onQuickStatus, onAddSession, students, compact }) {
  const iso = fmtDateISO(date);
  const isToday = iso === fmtDateISO(new Date());
  return (
    <div className="bg-surface border border-hair rounded-xl p-3 flex flex-col" style={{ minHeight: '140px' }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-2xs uppercase tracking-wide text-muted font-body">{compact ? DAY_SHORT[date.getDay()] : DAY_NAMES[date.getDay()]}</div>
          <div className={`font-display font-medium text-lg ${isToday ? 'text-brass' : 'text-primary'}`}>{fmtDateBR(date)}</div>
        </div>
        <button onClick={() => onAddSession(iso)} type="button" className="p-1.5 rounded-lg btn-surface" aria-label="Adicionar aula">
          <Plus size={16} className="text-muted" />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {sessionsList.length === 0 && <div className="text-xs text-faint font-body py-3 text-center">Sem aulas</div>}
        {sessionsList.map((s) => {
          const student = students.find((st) => st.id === s.studentId);
          return <SessionCard key={s.id} session={s} student={student} onOpen={() => onOpenSession(s)} onQuickStatus={onQuickStatus} />;
        })}
      </div>
    </div>
  );
}

function WeeklyView({ sessions, students, weekStart, setWeekStart, onOpenSession, onQuickStatus, onAddSession }) {
  const [selectedDay, setSelectedDay] = useState(fmtDateISO(new Date()));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    const iso = days.map((d) => fmtDateISO(d));
    if (!iso.includes(selectedDay)) setSelectedDay(iso[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  function sessionsForDay(iso) {
    return sessions.filter((s) => s.date === iso).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  const weekLabel = `${fmtDateBR(days[0])} – ${fmtDateBR(days[6])}`;

  return (
    <div className="px-4 py-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} type="button" className="p-2 rounded-lg bg-surface border border-hair btn-surface" aria-label="Semana anterior">
          <ChevronLeft size={18} className="text-muted" />
        </button>
        <div className="text-center">
          <div className="font-display font-medium text-lg tracking-wide text-primary">{weekLabel}</div>
          <button onClick={() => { const t = new Date(); setWeekStart(startOfWeek(t)); setSelectedDay(fmtDateISO(t)); }} type="button" className="text-xs font-body link-sky">Ir para hoje</button>
        </div>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} type="button" className="p-2 rounded-lg bg-surface border border-hair btn-surface" aria-label="Próxima semana">
          <ChevronRight size={18} className="text-muted" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 md:hidden">
        {days.map((d) => {
          const iso = fmtDateISO(d);
          const count = sessionsForDay(iso).length;
          const isToday = iso === fmtDateISO(new Date());
          const active = iso === selectedDay;
          return (
            <button
              key={iso}
              onClick={() => setSelectedDay(iso)}
              type="button"
              className="flex-shrink-0 flex flex-col items-center rounded-xl px-3 py-2 border"
              style={{ backgroundColor: active ? 'rgba(255,179,0,0.12)' : 'var(--bg-surface)', borderColor: active ? 'var(--brass)' : 'var(--border-hair)' }}
            >
              <span className="text-2xs uppercase tracking-wide text-muted font-body">{DAY_SHORT[d.getDay()]}</span>
              <span className="font-display font-medium text-base" style={{ color: active ? 'var(--brass)' : 'var(--text-primary)' }}>{d.getDate()}</span>
              {count > 0 && <span className="text-2xs text-faint font-mono">{count}</span>}
              {isToday && <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: 'var(--sky)' }} />}
            </button>
          );
        })}
      </div>

      <div className="md:hidden">
        <DayColumn date={days.find((d) => fmtDateISO(d) === selectedDay) || days[0]} sessionsList={sessionsForDay(selectedDay)} students={students} onOpenSession={onOpenSession} onQuickStatus={onQuickStatus} onAddSession={onAddSession} />
      </div>

      <div className="hidden md:grid md:grid-cols-7 gap-3">
        {days.map((d) => {
          const iso = fmtDateISO(d);
          return <DayColumn key={iso} date={d} sessionsList={sessionsForDay(iso)} students={students} onOpenSession={onOpenSession} onQuickStatus={onQuickStatus} onAddSession={onAddSession} compact />;
        })}
      </div>
    </div>
  );
}

/* ============================== MONTHLY VIEW ============================== */

function MonthlyView({ sessions, students, monthCursor, setMonthCursor, onOpenDay }) {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startGrid = startOfWeek(firstOfMonth);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(startGrid, i));
  const todayIso = fmtDateISO(new Date());

  function sessionsForDay(iso) {
    return sessions.filter((s) => s.date === iso);
  }

  return (
    <div className="px-4 py-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonthCursor(new Date(year, month - 1, 1))} type="button" className="p-2 rounded-lg bg-surface border border-hair btn-surface" aria-label="Mês anterior">
          <ChevronLeft size={18} className="text-muted" />
        </button>
        <div className="text-center">
          <div className="font-display font-medium text-lg tracking-wide text-primary uppercase">{MONTH_NAMES[month]} {year}</div>
          <button onClick={() => setMonthCursor(new Date())} type="button" className="text-xs font-body link-sky">Ir para hoje</button>
        </div>
        <button onClick={() => setMonthCursor(new Date(year, month + 1, 1))} type="button" className="p-2 rounded-lg bg-surface border border-hair btn-surface" aria-label="Próximo mês">
          <ChevronRight size={18} className="text-muted" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_SHORT.map((d) => <div key={d} className="text-center text-2xs uppercase tracking-wide text-faint font-body py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const iso = fmtDateISO(d);
          const inMonth = d.getMonth() === month;
          const daySessions = sessionsForDay(iso);
          const isToday = iso === todayIso;
          return (
            <button
              key={iso}
              onClick={() => onOpenDay(iso)}
              type="button"
              className="aspect-square rounded-lg border flex flex-col items-center justify-start pt-1 gap-0.5"
              style={{ backgroundColor: inMonth ? 'var(--bg-surface)' : 'transparent', opacity: inMonth ? 1 : 0.3, borderColor: isToday ? 'var(--brass)' : 'var(--border-hair)', borderWidth: isToday ? '1.5px' : '1px' }}
            >
              <span className="font-mono text-xs" style={{ color: isToday ? 'var(--brass)' : inMonth ? 'var(--text-primary)' : 'var(--text-faint)' }}>{d.getDate()}</span>
              <div className="flex flex-wrap gap-0.5 justify-center px-0.5">
                {daySessions.slice(0, 3).map((s) => {
                  const st = students.find((x) => x.id === s.studentId);
                  return <span key={s.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st?.color || '#54565D' }} />;
                })}
                {daySessions.length > 3 && <span className="text-2xs text-faint font-mono">+{daySessions.length - 3}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayDetailModal({ iso, sessions, students, onClose, onOpenSession, onQuickStatus, onAddSession }) {
  const date = new Date(`${iso}T00:00:00`);
  const list = sessions.filter((s) => s.date === iso).sort((a, b) => a.startTime.localeCompare(b.startTime));
  return (
    <Modal onClose={onClose} title={`${DAY_NAMES[date.getDay()]}, ${fmtDateBR(date)}`}>
      <div className="flex justify-end mb-3">
        <button onClick={() => { onAddSession(iso); onClose(); }} type="button" className="flex items-center gap-1.5 text-xs font-body px-3 py-1.5 rounded-lg border border-hair" style={{ backgroundColor: 'rgba(255,179,0,0.12)', color: 'var(--brass)' }}>
          <Plus size={14} /> Agendar aula
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {list.length === 0 && <EmptyState message="Nenhuma aula neste dia." />}
        {list.map((s) => {
          const student = students.find((st) => st.id === s.studentId);
          return <SessionCard key={s.id} session={s} student={student} onOpen={() => { onOpenSession(s); onClose(); }} onQuickStatus={onQuickStatus} />;
        })}
      </div>
    </Modal>
  );
}

/* ============================== STUDENTS VIEW ============================== */

function StudentsView({ students, sessions, onEdit, onNew }) {
  const [filter, setFilter] = useState('ativos');
  const [search, setSearch] = useState('');

  const filtered = students.filter((s) => {
    if (filter === 'ativos' && !s.active) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="px-4 py-4 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold text-2xl text-primary tracking-wide">Alunos</h1>
        <button onClick={onNew} type="button" className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0D0D0D' }}>
          <UserPlus size={15} /> Novo Aluno
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute text-faint" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar aluno..." className="input-field" style={{ paddingLeft: '34px' }} />
        </div>
        <div className="flex rounded-lg border border-hair overflow-hidden flex-shrink-0">
          <button onClick={() => setFilter('ativos')} type="button" className="px-3 py-2 text-xs font-body" style={{ backgroundColor: filter === 'ativos' ? 'var(--bg-elevated)' : 'transparent', color: filter === 'ativos' ? 'var(--text-primary)' : 'var(--text-muted)' }}>Ativos</button>
          <button onClick={() => setFilter('todos')} type="button" className="px-3 py-2 text-xs font-body" style={{ backgroundColor: filter === 'todos' ? 'var(--bg-elevated)' : 'transparent', color: filter === 'todos' ? 'var(--text-primary)' : 'var(--text-muted)' }}>Todos</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} message={students.length === 0 ? 'Nenhum aluno cadastrado ainda.' : 'Nenhum aluno encontrado.'} cta={students.length === 0 ? 'Cadastrar primeiro aluno' : undefined} onCta={onNew} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((s) => {
            const f = studentFinance(s);
            const pf = pendingFaltas(s.id, sessions);
            return (
              <div key={s.id} onClick={() => onEdit(s)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onEdit(s); }} className="bg-surface border border-hair rounded-xl p-4 cursor-pointer card-hover">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <div className="min-w-0">
                      <div className="font-body text-sm font-medium text-primary truncate">{s.name}</div>
                      <div className="text-xs text-faint font-body">{s.planType}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {!s.active && <span className="text-2xs px-2 py-0.5 rounded-full font-body" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-faint)' }}>Inativo</span>}
                    {pf > 0 && (
                      <span className="text-2xs px-2 py-0.5 rounded-full font-body flex items-center gap-1" style={{ backgroundColor: 'rgba(214,83,74,0.15)', color: 'var(--rust)' }}>
                        <UserX size={10} />{pf} {pf > 1 ? 'faltas' : 'falta'}
                      </span>
                    )}
                  </div>
                </div>
                <RevenueLoadBar gross={f.gross} tax={f.tax} gymFee={f.gymFee} net={f.net} height={18} showLabels={false} />
                <div className="flex justify-between mt-2 text-xs font-mono">
                  <span className="text-muted">{currency(f.gross)}</span>
                  <span className="text-brass font-semibold">{currency(f.net)} líq.</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StudentFormModal({ student, sessions, onSave, onClose, onDelete, onAddAssessment }) {
  const isEdit = !!student;
  const [form, setForm] = useState(() => (student ? { ...student } : {
    id: uid(), name: '', color: STUDENT_COLORS[Math.floor(Math.random() * STUDENT_COLORS.length)],
    active: true, planType: PLAN_TYPES[0], planValue: '', taxPercent: '',
    gymFeeType: 'percent', gymFeeValue: '', phone: '', height: '', notes: '',
  }));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [newAssessOpen, setNewAssessOpen] = useState(false);
  const [assessForm, setAssessForm] = useState({ date: fmtDateISO(new Date()), ...EMPTY_ASSESS_FIELDS });

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  function setAssess(field, value) { setAssessForm((f) => ({ ...f, [field]: value })); }

  const finance = studentFinance({
    ...form,
    planValue: parseFloat(form.planValue) || 0,
    taxPercent: parseFloat(form.taxPercent) || 0,
    gymFeeValue: parseFloat(form.gymFeeValue) || 0,
  });

  const pf = isEdit ? pendingFaltas(student.id, sessions) : 0;
  const assessments = isEdit
    ? sessions.filter((s) => s.studentId === student.id && s.type === 'avaliacao' && (s.assessWeight || s.assessBodyFat || s.assessNotes)).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  function handleSubmit() {
    if (!form.name.trim()) { setError('Informe o nome do aluno.'); return; }
    const pv = parseFloat(form.planValue);
    if (Number.isNaN(pv) || pv < 0) { setError('Informe um valor de plano válido.'); return; }
    setError('');
    onSave({
      ...form,
      planValue: pv,
      taxPercent: parseFloat(form.taxPercent) || 0,
      gymFeeValue: parseFloat(form.gymFeeValue) || 0,
      height: parseFloat(form.height) || '',
    });
  }

  function handleSaveAssessment() {
    onAddAssessment({
      id: uid(), studentId: student.id, date: assessForm.date, startTime: '08:00', endTime: '08:30',
      type: 'avaliacao', status: 'realizado', notes: '',
      ...assessForm,
    });
    setAssessForm({ date: fmtDateISO(new Date()), ...EMPTY_ASSESS_FIELDS });
    setNewAssessOpen(false);
  }

  return (
    <Modal title={isEdit ? 'Editar Aluno' : 'Novo Aluno'} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <FormField label="Nome do aluno">
          <input value={form.name} onChange={(e) => set('name', e.target.value)} className="input-field" placeholder="Ex: Maria Silva" />
        </FormField>

        <FormField label="Cor de identificação">
          <div className="flex flex-wrap gap-2 items-center">
            {STUDENT_COLORS.map((c) => (
              <button key={c} onClick={() => set('color', c)} type="button" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: c, border: form.color === c ? '2px solid var(--text-primary)' : '2px solid transparent' }} aria-label={`Cor ${c}`}>
                {form.color === c && <Check size={13} color="#0D0D0D" />}
              </button>
            ))}
            <input type="color" value={form.color} onChange={(e) => set('color', e.target.value)} className="w-7 h-7 rounded-full" aria-label="Cor personalizada" />
          </div>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tipo de plano">
            <select value={form.planType} onChange={(e) => set('planType', e.target.value)} className="input-field">
              {PLAN_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </FormField>
          <FormField label="Status">
            <select value={form.active ? '1' : '0'} onChange={(e) => set('active', e.target.value === '1')} className="input-field">
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </select>
          </FormField>
        </div>

        <FormField label="Valor do plano (€/mês)">
          <input type="number" inputMode="decimal" min="0" step="0.01" value={form.planValue} onChange={(e) => set('planValue', e.target.value)} className="input-field" placeholder="0,00" />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Imposto (%)">
            <input type="number" inputMode="decimal" min="0" max="100" step="0.01" value={form.taxPercent} onChange={(e) => set('taxPercent', e.target.value)} className="input-field" placeholder="0" />
          </FormField>
          <FormField label="Taxa do ginásio">
            <div className="flex gap-1.5">
              <select value={form.gymFeeType} onChange={(e) => set('gymFeeType', e.target.value)} className="input-field" style={{ flex: '0 0 72px' }}>
                <option value="percent">%</option>
                <option value="fixed">€</option>
              </select>
              <input type="number" inputMode="decimal" min="0" step="0.01" value={form.gymFeeValue} onChange={(e) => set('gymFeeValue', e.target.value)} className="input-field" placeholder="0" />
            </div>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Telefone (opcional)">
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="input-field" placeholder="912 345 678" />
          </FormField>
          <FormField label="Altura (cm)">
            <input type="number" inputMode="decimal" min="0" step="1" value={form.height} onChange={(e) => set('height', e.target.value)} className="input-field" placeholder="Para calcular IMC" />
          </FormField>
        </div>

        <FormField label="Observações (opcional)">
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className="input-field" rows={2} placeholder="Notas sobre o aluno..." />
        </FormField>

        {isEdit && pf > 0 && (
          <div className="flex items-center gap-2 text-sm font-body px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(214,83,74,0.12)', color: 'var(--rust)' }}>
            <UserX size={15} /> {pf} {pf > 1 ? 'faltas pendentes' : 'falta pendente'} (agende uma reposição para abater)
          </div>
        )}

        {parseFloat(form.planValue) > 0 && (
          <div className="bg-elevated rounded-lg p-3 border border-hair">
            <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-2">Prévia do líquido</div>
            <RevenueLoadBar gross={finance.gross} tax={finance.tax} gymFee={finance.gymFee} net={finance.net} height={24} />
          </div>
        )}

        {isEdit && (
          <div className="bg-elevated rounded-lg p-3 border border-hair flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-2xs uppercase tracking-wide text-faint font-mono">Avaliações Físicas</div>
              <button type="button" onClick={() => setNewAssessOpen((v) => !v)} className="flex items-center gap-1 text-2xs font-body link-sky">
                <Plus size={12} /> Nova avaliação
              </button>
            </div>

            {newAssessOpen && (
              <div className="flex flex-col gap-3 pt-1 animate-in">
                <FormField label="Data da avaliação">
                  <input type="date" value={assessForm.date} onChange={(e) => setAssess('date', e.target.value)} className="input-field" />
                </FormField>
                <AssessmentFields form={assessForm} set={setAssess} studentHeight={form.height} />
                <button type="button" onClick={handleSaveAssessment} className="px-4 py-2 rounded-lg text-sm font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0D0D0D' }}>
                  Salvar Avaliação
                </button>
              </div>
            )}

            {assessments.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {assessments.slice(0, 6).map((a) => {
                  const bmi = bmiOf(a.assessWeight, form.height);
                  return (
                    <div key={a.id} className="flex items-center justify-between text-xs font-body">
                      <span className="text-muted font-mono">{fmtDateBR(new Date(`${a.date}T00:00:00`))}</span>
                      <span className="text-primary text-right">
                        {a.assessWeight ? `${a.assessWeight} kg` : '—'}
                        {a.assessBodyFat ? ` · ${a.assessBodyFat}% gord.` : ''}
                        {bmi ? ` · IMC ${bmi.toFixed(1)}` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : !newAssessOpen && <div className="text-2xs text-faint font-body">Nenhuma avaliação registrada ainda.</div>}
          </div>
        )}

        {error && <div className="text-sm font-body text-rust">{error}</div>}

        <div className="flex gap-2 pt-2">
          {isEdit && (
            <button onClick={() => setConfirmDelete(true)} type="button" className="px-4 py-2.5 rounded-lg text-sm font-body border border-hair text-rust btn-surface">
              <Trash2 size={15} className="inline mr-1.5" style={{ marginTop: '-2px' }} />Excluir
            </button>
          )}
          <button onClick={handleSubmit} type="button" className="flex-1 px-4 py-2.5 rounded-lg text-sm font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0D0D0D' }}>
            Salvar Aluno
          </button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Excluir aluno"
          message={`Tem certeza que deseja excluir ${form.name || 'este aluno'}? Todas as aulas agendadas para ele também serão removidas.`}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { onDelete(form.id); setConfirmDelete(false); }}
        />
      )}
    </Modal>
  );
}

/* ============================== SESSION FORM MODAL ============================== */

function SessionFormModal({ session, students, defaultDate, onSave, onClose, onDelete }) {
  const isEdit = !!session;
  const [form, setForm] = useState(() => (session ? { ...session } : {
    id: uid(), studentId: students[0]?.id || '', date: defaultDate || fmtDateISO(new Date()),
    startTime: '08:00', endTime: '09:00', type: 'fixo', status: 'agendado', notes: '',
    ...EMPTY_ASSESS_FIELDS,
  }));
  const [repeat, setRepeat] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(8);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  const selectedStudent = students.find((s) => s.id === form.studentId);

  function handleSubmit() {
    if (!form.studentId) { setError('Selecione um aluno.'); return; }
    if (!form.date) { setError('Selecione uma data.'); return; }
    if (form.endTime <= form.startTime) { setError('O horário final deve ser após o início.'); return; }
    setError('');
    onSave(form, repeat && !isEdit ? repeatWeeks : null);
  }

  if (students.length === 0) {
    return (
      <Modal title="Nova Aula" onClose={onClose}>
        <EmptyState message="Cadastre um aluno antes de agendar uma aula." />
      </Modal>
    );
  }

  return (
    <Modal title={isEdit ? 'Editar Aula' : 'Nova Aula'} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <FormField label="Aluno">
          <select value={form.studentId} onChange={(e) => set('studentId', e.target.value)} className="input-field">
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}{!s.active ? ' (inativo)' : ''}</option>)}
          </select>
        </FormField>

        <FormField label="Data">
          <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="input-field" />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Início">
            <input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} className="input-field" />
          </FormField>
          <FormField label="Fim">
            <input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} className="input-field" />
          </FormField>
        </div>

        <FormField label="Categoria">
          <div className="grid grid-cols-2 gap-2">
            {SESSION_TYPES.map((t) => {
              const Icon = t.icon;
              const active = form.type === t.id;
              return (
                <button key={t.id} type="button" onClick={() => set('type', t.id)} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-left" style={{ borderColor: active ? t.color : 'var(--border-hair)', backgroundColor: active ? `${t.color}22` : 'var(--bg-base)' }}>
                  <Icon size={14} style={{ color: t.color, flexShrink: 0 }} />
                  <span className="text-xs font-body text-primary">{t.label}</span>
                </button>
              );
            })}
          </div>
        </FormField>

        {form.type === 'avaliacao' && (
          <div className="bg-elevated rounded-lg p-3 border border-hair">
            <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-3">Resultados da Avaliação</div>
            <AssessmentFields form={form} set={set} studentHeight={selectedStudent?.height} />
          </div>
        )}

        <FormField label="Status">
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((st) => {
              const active = form.status === st.id;
              return (
                <button key={st.id} type="button" onClick={() => set('status', st.id)} className="px-3 py-1.5 rounded-full border text-xs font-body" style={{ borderColor: active ? st.color : 'var(--border-hair)', backgroundColor: active ? `${st.color}22` : 'transparent', color: active ? st.color : 'var(--text-muted)' }}>
                  {st.label}
                </button>
              );
            })}
          </div>
        </FormField>

        {!isEdit && form.type === 'fixo' && (
          <div className="bg-elevated rounded-lg p-3 border border-hair flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-body text-primary">
              <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} style={{ accentColor: 'var(--brass)' }} />
              Repetir semanalmente (horário fixo)
            </label>
            {repeat && (
              <FormField label="Por quantas semanas">
                <input type="number" min="1" max="52" value={repeatWeeks} onChange={(e) => setRepeatWeeks(Math.max(1, parseInt(e.target.value, 10) || 1))} className="input-field" />
              </FormField>
            )}
          </div>
        )}

        {form.type !== 'avaliacao' && (
          <FormField label="Observações (opcional)">
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className="input-field" rows={2} placeholder="Notas sobre a aula..." />
          </FormField>
        )}

        {error && <div className="text-sm font-body text-rust">{error}</div>}

        <div className="flex gap-2 pt-2">
          {isEdit && (
            <button onClick={() => setConfirmDelete(true)} type="button" className="px-4 py-2.5 rounded-lg text-sm font-body border border-hair text-rust btn-surface">
              <Trash2 size={15} className="inline mr-1.5" style={{ marginTop: '-2px' }} />Excluir
            </button>
          )}
          <button onClick={handleSubmit} type="button" className="flex-1 px-4 py-2.5 rounded-lg text-sm font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0D0D0D' }}>
            Salvar Aula
          </button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog title="Excluir aula" message="Tem certeza que deseja excluir esta aula da agenda?" onCancel={() => setConfirmDelete(false)} onConfirm={() => { onDelete(form.id); setConfirmDelete(false); }} />
      )}
    </Modal>
  );
}

/* ============================== SETTINGS ============================== */

/* ============================== PERSONAL FINANCES ============================== */

function TransactionCard({ tx, onOpen, onQuickComplete }) {
  const isIncome = tx.type === 'entrada';
  const cat = categoryFor(tx.type, tx.category);
  const pending = tx.status === 'pendente';
  const color = isIncome ? 'var(--brass)' : 'var(--rust)';
  return (
    <div onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
      className="rounded-lg border border-hair bg-elevated pl-3 pr-1.5 py-2 cursor-pointer card-hover animate-in flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-mono text-2xs text-muted">{fmtDateBR(new Date(`${tx.date}T00:00:00`))}</span>
          <span className="text-2xs font-body px-1.5 py-0.5 rounded truncate" style={{ backgroundColor: `${cat.color}22`, color: cat.color }}>{cat.label}</span>
        </div>
        <div className="font-body text-sm text-primary truncate">{tx.description || '(sem descrição)'}</div>
        <span className="text-2xs font-body" style={{ color: pending ? color : 'var(--text-faint)' }}>{statusLabel(tx.type, tx.status)}</span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="font-mono text-sm font-semibold" style={{ color }}>{isIncome ? '+' : '−'} {currency(tx.amount)}</span>
        {pending && (
          <button onClick={(e) => { e.stopPropagation(); onQuickComplete(tx); }} type="button" className="p-1 rounded btn-surface" aria-label="Marcar como concluído" title={isIncome ? 'Marcar como recebido' : 'Marcar como pago'}>
            <CheckCircle2 size={14} className="text-slate-acc" />
          </button>
        )}
      </div>
    </div>
  );
}

function TransactionFormModal({ tx, defaultType, onSave, onClose, onDelete }) {
  const isEdit = !!tx;
  const [form, setForm] = useState(() => (tx ? { ...tx } : {
    id: uid(), type: defaultType || 'gasto', description: '', category: EXPENSE_CATEGORIES[0].id,
    amount: '', date: fmtDateISO(new Date()), status: 'concluido', notes: '',
  }));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function setType(type) {
    const catList = type === 'entrada' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    setForm((f) => ({ ...f, type, category: catList.some((c) => c.id === f.category) ? f.category : catList[0].id }));
  }

  function handleSubmit() {
    const amt = parseFloat(form.amount);
    if (Number.isNaN(amt) || amt <= 0) { setError('Informe um valor válido.'); return; }
    if (!form.date) { setError('Selecione uma data.'); return; }
    setError('');
    onSave({ ...form, amount: amt });
  }

  const catList = form.type === 'entrada' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Modal title={isEdit ? 'Editar Lançamento' : 'Novo Lançamento'} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <FormField label="Tipo">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setType('gasto')} className="px-3 py-2 rounded-lg border text-sm font-body" style={{ borderColor: form.type === 'gasto' ? 'var(--rust)' : 'var(--border-hair)', backgroundColor: form.type === 'gasto' ? 'rgba(214,83,74,0.12)' : 'var(--bg-base)', color: form.type === 'gasto' ? 'var(--rust)' : 'var(--text-muted)' }}>Gasto / Conta</button>
            <button type="button" onClick={() => setType('entrada')} className="px-3 py-2 rounded-lg border text-sm font-body" style={{ borderColor: form.type === 'entrada' ? 'var(--brass)' : 'var(--border-hair)', backgroundColor: form.type === 'entrada' ? 'rgba(255,179,0,0.12)' : 'var(--bg-base)', color: form.type === 'entrada' ? 'var(--brass)' : 'var(--text-muted)' }}>Recebimento / Entrada</button>
          </div>
        </FormField>

        <FormField label="Descrição">
          <input value={form.description} onChange={(e) => set('description', e.target.value)} className="input-field" placeholder={form.type === 'entrada' ? 'Ex: Honorários de Junho' : 'Ex: Renda da casa'} />
        </FormField>

        <FormField label="Categoria">
          <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input-field">
            {catList.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Valor (€)">
            <input type="number" inputMode="decimal" min="0" step="0.01" value={form.amount} onChange={(e) => set('amount', e.target.value)} className="input-field" placeholder="0,00" />
          </FormField>
          <FormField label="Data">
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="input-field" />
          </FormField>
        </div>

        <FormField label="Status">
          <div className="flex gap-2">
            <button type="button" onClick={() => set('status', 'concluido')} className="px-3 py-1.5 rounded-full border text-xs font-body" style={{ borderColor: form.status === 'concluido' ? 'var(--slate-acc)' : 'var(--border-hair)', backgroundColor: form.status === 'concluido' ? 'rgba(140,140,140,0.15)' : 'transparent', color: form.status === 'concluido' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {statusLabel(form.type, 'concluido')}
            </button>
            <button type="button" onClick={() => set('status', 'pendente')} className="px-3 py-1.5 rounded-full border text-xs font-body" style={{ borderColor: form.status === 'pendente' ? (form.type === 'entrada' ? 'var(--brass)' : 'var(--rust)') : 'var(--border-hair)', backgroundColor: form.status === 'pendente' ? (form.type === 'entrada' ? 'rgba(255,179,0,0.12)' : 'rgba(214,83,74,0.12)') : 'transparent', color: form.status === 'pendente' ? (form.type === 'entrada' ? 'var(--brass)' : 'var(--rust)') : 'var(--text-muted)' }}>
              {statusLabel(form.type, 'pendente')}
            </button>
          </div>
        </FormField>

        <FormField label="Observações (opcional)">
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className="input-field" rows={2} placeholder="Notas..." />
        </FormField>

        {error && <div className="text-sm font-body text-rust">{error}</div>}

        <div className="flex gap-2 pt-2">
          {isEdit && (
            <button onClick={() => setConfirmDelete(true)} type="button" className="px-4 py-2.5 rounded-lg text-sm font-body border border-hair text-rust btn-surface">
              <Trash2 size={15} className="inline mr-1.5" style={{ marginTop: '-2px' }} />Excluir
            </button>
          )}
          <button onClick={handleSubmit} type="button" className="flex-1 px-4 py-2.5 rounded-lg text-sm font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0D0D0D' }}>
            Salvar
          </button>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmDialog title="Excluir lançamento" message="Tem certeza que deseja excluir este lançamento?" onCancel={() => setConfirmDelete(false)} onConfirm={() => { onDelete(form.id); setConfirmDelete(false); }} />
      )}
    </Modal>
  );
}

function FinancesView({ finances, monthCursor, setMonthCursor, onOpenTransaction, onNewTransaction, onQuickComplete }) {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const monthStart = fmtDateISO(new Date(year, month, 1));
  const monthEnd = fmtDateISO(new Date(year, month + 1, 0));
  const monthTx = useMemo(() => finances.filter((t) => t.date >= monthStart && t.date <= monthEnd).sort((a, b) => b.date.localeCompare(a.date)), [finances, monthStart, monthEnd]);

  const entradas = monthTx.filter((t) => t.type === 'entrada').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const saidas = monthTx.filter((t) => t.type === 'gasto').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const saldo = entradas - saidas;
  const pendencias = monthTx.filter((t) => t.status === 'pendente');

  const categoryData = useMemo(() => EXPENSE_CATEGORIES.map((c) => ({
    name: c.label, color: c.color, value: monthTx.filter((t) => t.type === 'gasto' && t.category === c.id).reduce((s, t) => s + (Number(t.amount) || 0), 0),
  })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value), [monthTx]);

  return (
    <div className="px-4 py-4 max-w-4xl mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <button onClick={() => setMonthCursor(new Date(year, month - 1, 1))} type="button" className="p-2 rounded-lg bg-surface border border-hair btn-surface" aria-label="Mês anterior">
          <ChevronLeft size={18} className="text-muted" />
        </button>
        <div className="text-center">
          <div className="font-display font-medium text-lg tracking-wide text-primary uppercase">{MONTH_NAMES[month]} {year}</div>
          <button onClick={() => setMonthCursor(new Date())} type="button" className="text-xs font-body link-sky">Ir para hoje</button>
        </div>
        <button onClick={() => setMonthCursor(new Date(year, month + 1, 1))} type="button" className="p-2 rounded-lg bg-surface border border-hair btn-surface" aria-label="Próximo mês">
          <ChevronRight size={18} className="text-muted" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Entradas" value={currency(entradas)} icon={TrendingUp} accent="brass" />
        <StatCard label="Saídas" value={currency(saidas)} icon={Wallet} accent="rust" />
        <StatCard label="Saldo" value={currency(saldo)} icon={Activity} accent={saldo >= 0 ? 'sky' : 'rust'} />
      </div>

      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold text-xl text-primary tracking-wide">Lançamentos</h1>
        <div className="flex gap-2">
          <button onClick={() => onNewTransaction('gasto')} type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body border border-hair btn-surface">
            <Plus size={13} /> Gasto
          </button>
          <button onClick={() => onNewTransaction('entrada')} type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0D0D0D' }}>
            <Plus size={13} /> Entrada
          </button>
        </div>
      </div>

      {categoryData.length > 0 && (
        <div className="bg-surface border border-hair rounded-xl p-4">
          <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-2">Gastos por Categoria</div>
          <ErrorBoundary compact>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => currency(v)} contentStyle={{ background: '#222222', border: '1px solid #363636', borderRadius: 8, color: '#F5F5F0' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9A9A9A' }} />
              </PieChart>
            </ResponsiveContainer>
          </ErrorBoundary>
        </div>
      )}

      {pendencias.length > 0 && (
        <div>
          <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-2">Pendências deste mês</div>
          <div className="flex flex-col gap-2">
            {pendencias.map((t) => <TransactionCard key={t.id} tx={t} onOpen={() => onOpenTransaction(t)} onQuickComplete={onQuickComplete} />)}
          </div>
        </div>
      )}

      <div>
        <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-2">Todos os Lançamentos</div>
        {monthTx.length === 0 ? (
          <EmptyState icon={Wallet} message="Nenhum lançamento neste mês ainda." cta="Novo lançamento" onCta={() => onNewTransaction('gasto')} />
        ) : (
          <div className="flex flex-col gap-2">
            {monthTx.map((t) => <TransactionCard key={t.id} tx={t} onOpen={() => onOpenTransaction(t)} onQuickComplete={onQuickComplete} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== SETTINGS ============================== */

function SettingsPanel({ students, sessions, finances, onReset, onRestore, studentCount, sessionCount, onSignOut }) {
  const [confirm, setConfirm] = useState(false);
  const [pendingRestore, setPendingRestore] = useState(null);
  const [restoreError, setRestoreError] = useState('');
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setRestoreError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (!Array.isArray(data.alunos) || !Array.isArray(data.agenda)) throw new Error('formato inválido');
        if (!Array.isArray(data.financas)) data.financas = [];
        setPendingRestore(data);
      } catch (err) {
        setRestoreError('Não foi possível ler este arquivo. Confira se é um backup exportado por este app.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm font-body text-muted">{studentCount} aluno(s) cadastrado(s) · {sessionCount} aula(s) na agenda · {finances.length} lançamento(s) financeiro(s).</div>

      <div className="border border-hair rounded-lg p-4">
        <div className="text-sm font-body font-medium text-primary mb-1">Backup dos dados</div>
        <p className="text-xs font-body text-muted mb-3">Baixe um arquivo com alunos, aulas e finanças pessoais — guarde-o em algum lugar seguro. Você pode restaurar esse arquivo aqui se precisar.</p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => downloadBackup(students, sessions, finances)} type="button" className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0D0D0D' }}>
            <Download size={14} /> Exportar backup
          </button>
          <button onClick={() => fileRef.current?.click()} type="button" className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-body border border-hair btn-surface">
            <Upload size={14} /> Restaurar backup
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFile} style={{ display: 'none' }} />
        </div>
        {restoreError && <div className="text-2xs font-body text-rust mt-2">{restoreError}</div>}
      </div>

      <div className="border rounded-lg p-4" style={{ borderColor: 'var(--rust)' }}>
        <div className="text-sm font-body font-medium text-primary mb-1">Apagar todos os dados</div>
        <p className="text-xs font-body text-muted mb-3">Remove todos os alunos, aulas e lançamentos financeiros salvos neste aplicativo. Essa ação não pode ser desfeita.</p>
        <button onClick={() => setConfirm(true)} type="button" className="px-3.5 py-2 rounded-lg text-xs font-body" style={{ backgroundColor: 'var(--rust)', color: '#0D0D0D' }}>
          Apagar tudo
        </button>
      </div>

      {onSignOut && (
        <div className="border border-hair rounded-lg p-4">
          <div className="text-sm font-body font-medium text-primary mb-1">Conta</div>
          <p className="text-xs font-body text-muted mb-3">Encerre a sessão neste dispositivo.</p>
          <button onClick={onSignOut} type="button" className="px-3.5 py-2 rounded-lg text-xs font-body border border-hair btn-surface text-muted">
            Sair da conta
          </button>
        </div>
      )}

      {confirm && (
        <ConfirmDialog title="Apagar todos os dados" message="Tem certeza? Todos os alunos, aulas e lançamentos financeiros serão permanentemente removidos." onCancel={() => setConfirm(false)} onConfirm={onReset} />
      )}
      {pendingRestore && (
        <ConfirmDialog
          title="Restaurar backup"
          message={`Isso vai SUBSTITUIR os dados atuais pelos ${pendingRestore.alunos.length} aluno(s), ${pendingRestore.agenda.length} aula(s) e ${pendingRestore.financas.length} lançamento(s) do arquivo. Essa ação não pode ser desfeita.`}
          onCancel={() => setPendingRestore(null)}
          onConfirm={() => { onRestore(pendingRestore.alunos, pendingRestore.agenda, pendingRestore.financas); setPendingRestore(null); }}
        />
      )}
    </div>
  );
}

/* ============================== APP ROOT ============================== */

function AppInner() {
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(!supabaseConfigured);
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [finances, setFinances] = useState([]);
  const [view, setView] = useState('dashboard');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [financeMonthCursor, setFinanceMonthCursor] = useState(new Date());
  const [sessionModal, setSessionModal] = useState(null);
  const [studentModal, setStudentModal] = useState(null);
  const [transactionModal, setTransactionModal] = useState(null);
  const [dayDetailIso, setDayDetailIso] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const storageOk = browserStorageAvailable();

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setAuthReady(true);
      loadAll();
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAuthReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (supabaseConfigured && !user) {
      setLoading(false);
      setStudents([]);
      setSessions([]);
      setFinances([]);
      return;
    }
    loadAll();
  }, [authReady, user?.id]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  async function loadAll() {
    setLoading(true);
    let st = [];
    let se = [];
    let fi = [];
    if (storageOk) {
      try {
        const r = await readStoredValue('alunos');
        if (r && r.value) st = JSON.parse(r.value);
      } catch (e) { /* sem dados salvos ainda */ }
      try {
        const r2 = await readStoredValue('agenda');
        if (r2 && r2.value) se = JSON.parse(r2.value);
      } catch (e) { /* sem dados salvos ainda */ }
      try {
        const r3 = await readStoredValue('financas');
        if (r3 && r3.value) fi = JSON.parse(r3.value);
      } catch (e) { /* sem dados salvos ainda */ }
    }
    setStudents(Array.isArray(st) ? st : []);
    setSessions(Array.isArray(se) ? se : []);
    setFinances(Array.isArray(fi) ? fi : []);
    setLoading(false);
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type, key: Date.now() });
  }

  async function persistStudents(next) {
    setStudents(next);
    if (!storageOk) { showToast('Dados salvos apenas nesta sessão (armazenamento indisponível).'); return; }
    try { await writeStoredValue('alunos', JSON.stringify(next)); } catch (e) { showToast('Erro ao salvar. Tente novamente.', 'error'); }
  }
  async function persistSessions(next) {
    setSessions(next);
    if (!storageOk) return;
    try { await writeStoredValue('agenda', JSON.stringify(next)); } catch (e) { showToast('Erro ao salvar. Tente novamente.', 'error'); }
  }
  async function persistFinances(next) {
    setFinances(next);
    if (!storageOk) return;
    try { await writeStoredValue('financas', JSON.stringify(next)); } catch (e) { showToast('Erro ao salvar. Tente novamente.', 'error'); }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSettingsOpen(false);
  }

  function saveStudent(student) {
    const exists = students.some((s) => s.id === student.id);
    const next = exists ? students.map((s) => (s.id === student.id ? student : s)) : [...students, student];
    persistStudents(next);
    setShowStudentModal(false);
    showToast(exists ? 'Aluno atualizado.' : 'Aluno cadastrado.');
  }
  function deleteStudent(id) {
    persistStudents(students.filter((s) => s.id !== id));
    persistSessions(sessions.filter((s) => s.studentId !== id));
    setShowStudentModal(false);
    showToast('Aluno excluído.');
  }

  function saveSession(session, repeatWeeks) {
    if (repeatWeeks && repeatWeeks > 1) {
      const seriesId = uid();
      const base = new Date(`${session.date}T00:00:00`);
      const newOnes = Array.from({ length: repeatWeeks }, (_, i) => ({
        ...session, id: i === 0 ? session.id : uid(), date: fmtDateISO(addDays(base, i * 7)), seriesId,
      }));
      persistSessions([...sessions, ...newOnes]);
      showToast(`${repeatWeeks} aulas agendadas.`);
    } else {
      const exists = sessions.some((s) => s.id === session.id);
      const next = exists ? sessions.map((s) => (s.id === session.id ? session : s)) : [...sessions, session];
      persistSessions(next);
      showToast(exists ? 'Aula atualizada.' : 'Aula agendada.');
    }
    setShowSessionModal(false);
  }
  function addAssessment(session) {
    persistSessions([...sessions, session]);
    showToast('Avaliação registrada.');
  }
  function deleteSession(id) {
    persistSessions(sessions.filter((s) => s.id !== id));
    setShowSessionModal(false);
    showToast('Aula removida.');
  }
  function quickStatus(session, status) {
    persistSessions(sessions.map((s) => (s.id === session.id ? { ...s, status } : s)));
    showToast(status === 'falta' ? 'Falta registrada.' : 'Aula marcada como realizada.');
  }

  function openNewSession(dateIso) {
    setSessionModal({ session: null, defaultDate: dateIso });
    setShowSessionModal(true);
  }
  function openEditSession(session) {
    setSessionModal({ session, defaultDate: null });
    setShowSessionModal(true);
  }
  function openNewStudent() {
    setStudentModal(null);
    setShowStudentModal(true);
  }
  function openEditStudent(student) {
    setStudentModal(student);
    setShowStudentModal(true);
  }

  function saveTransaction(tx) {
    const exists = finances.some((t) => t.id === tx.id);
    const next = exists ? finances.map((t) => (t.id === tx.id ? tx : t)) : [...finances, tx];
    persistFinances(next);
    setShowTransactionModal(false);
    showToast(exists ? 'Lançamento atualizado.' : 'Lançamento adicionado.');
  }
  function deleteTransaction(id) {
    persistFinances(finances.filter((t) => t.id !== id));
    setShowTransactionModal(false);
    showToast('Lançamento removido.');
  }
  function quickCompleteTransaction(tx) {
    persistFinances(finances.map((t) => (t.id === tx.id ? { ...t, status: 'concluido' } : t)));
    showToast(tx.type === 'entrada' ? 'Marcado como recebido.' : 'Marcado como pago.');
  }
  function openNewTransaction(type) {
    setTransactionModal({ tx: null, defaultType: type });
    setShowTransactionModal(true);
  }
  function openEditTransaction(tx) {
    setTransactionModal({ tx, defaultType: null });
    setShowTransactionModal(true);
  }

  function restoreBackup(importedStudents, importedSessions, importedFinances) {
    persistStudents(importedStudents);
    persistSessions(importedSessions);
    persistFinances(Array.isArray(importedFinances) ? importedFinances : []);
    showToast('Backup restaurado.');
    setSettingsOpen(false);
  }

  async function resetAllData() {
    if (!storageOk) {
      setStudents([]); setSessions([]); setFinances([]); showToast('Dados apagados.'); setSettingsOpen(false); return;
    }
    try {
      await writeStoredValue('alunos', JSON.stringify([]));
      await writeStoredValue('agenda', JSON.stringify([]));
      await writeStoredValue('financas', JSON.stringify([]));
      setStudents([]);
      setSessions([]);
      setFinances([]);
      showToast('Dados apagados.');
    } catch (e) { showToast('Erro ao apagar dados.', 'error'); }
    setSettingsOpen(false);
  }

  if (!authReady || loading) return <LoadingScreen />;
  if (supabaseConfigured && !user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <NavTabs view={view} setView={setView} />
      <main className="flex-1 pb-10">
        {view === 'dashboard' && <Dashboard students={students} sessions={sessions} finances={finances} setView={setView} onAddSession={openNewSession} onOpenSession={openEditSession} onQuickStatus={quickStatus} />}
        {view === 'weekly' && <WeeklyView sessions={sessions} students={students} weekStart={weekStart} setWeekStart={setWeekStart} onOpenSession={openEditSession} onQuickStatus={quickStatus} onAddSession={openNewSession} />}
        {view === 'monthly' && <MonthlyView sessions={sessions} students={students} monthCursor={monthCursor} setMonthCursor={setMonthCursor} onOpenDay={setDayDetailIso} />}
        {view === 'students' && <StudentsView students={students} sessions={sessions} onEdit={openEditStudent} onNew={openNewStudent} />}
        {view === 'finances' && <FinancesView finances={finances} monthCursor={financeMonthCursor} setMonthCursor={setFinanceMonthCursor} onOpenTransaction={openEditTransaction} onNewTransaction={openNewTransaction} onQuickComplete={quickCompleteTransaction} />}
      </main>

      {showSessionModal && (
        <SessionFormModal session={sessionModal?.session} students={students} defaultDate={sessionModal?.defaultDate} onSave={saveSession} onClose={() => setShowSessionModal(false)} onDelete={deleteSession} />
      )}
      {showStudentModal && (
        <StudentFormModal student={studentModal} sessions={sessions} onSave={saveStudent} onClose={() => setShowStudentModal(false)} onDelete={deleteStudent} onAddAssessment={addAssessment} />
      )}
      {showTransactionModal && (
        <TransactionFormModal tx={transactionModal?.tx} defaultType={transactionModal?.defaultType} onSave={saveTransaction} onClose={() => setShowTransactionModal(false)} onDelete={deleteTransaction} />
      )}
      {dayDetailIso && (
        <DayDetailModal iso={dayDetailIso} sessions={sessions} students={students} onClose={() => setDayDetailIso(null)} onOpenSession={openEditSession} onQuickStatus={quickStatus} onAddSession={openNewSession} />
      )}
      {settingsOpen && (
        <Modal title="Configurações" onClose={() => setSettingsOpen(false)}>
          <SettingsPanel students={students} sessions={sessions} finances={finances} onReset={resetAllData} onRestore={restoreBackup} studentCount={students.length} sessionCount={sessions.length} onSignOut={supabaseConfigured ? signOut : null} />
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}

export default function App() {
  return (
    <>
      <GlobalStyles />
      <ErrorBoundary>
        <AppInner />
      </ErrorBoundary>
    </>
  );
}
