import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard, CalendarDays, CalendarRange, Users, Plus, UserPlus, X, Trash2,
  TrendingUp, AlertTriangle, CheckCircle2, RotateCcw, Shuffle, Repeat, ClipboardCheck,
  Sparkles, UserX, ChevronLeft, ChevronRight, Search, Wallet, Percent, Building2,
  Loader2, Settings, Check, Info, Activity, Ban, Download, Upload,
  Camera, ArrowLeft, LineChart as LineChartIcon, Tag,
  Coffee, Dumbbell, UtensilsCrossed, Stethoscope, Gift, CreditCard, Mail, CircleUser, KeyRound, ShieldCheck,
  RefreshCcw, Printer, Pencil, Copy, ClipboardPaste, GripVertical, Bell, Archive, BookMarked,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { supabase, supabaseConfigured } from './src/supabaseClient';
import logoSrc from './src/assets/ptmanager-logo.png';
import LandingPage from './src/components/LandingPage';
import Turnstile from './src/components/Turnstile';
import LegalModal from './src/components/LegalDocs';

/* ============================== LOGO ============================== */

const LOGO_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEABAMAAACuXLVVAAAAHlBMVEUAAAAnpbEeXWMpe4MSPEMurcBAo64QQT0AAAAAAABXZ4KNAAAACHRSTlP+/////////z8rUkoAAAyfSURBVHja7VzdbiO3Ff5ICYicxBrKKdC4QKyRe9E0F85u7nrTOkYeoG/aFyhSP0Cx6wAF0ovWGqcF4hRYieMUWNm1yV6QnOH8cIbkaL03cy68WmmG/Ob8n0NygJFGGmmkkUYaaaSRRhpppJHeM5FBd58C9B/vDwBNAICcXb4nAJO5xvFmCAAaf6eeH+Lo/QBYFp9kOgDAJPpGWX5+ePseOHBifR7CgslegO92z84BuSdNir61yvQBMogFwKv/Zc8NoH5b9twAyP78Wdxtv+/UyWcAwLuV8p37Adqw+2hPQPfgBQYpAd2DFxjkCSb7Qh0rgygOLPeY2Uz2Bnq2ezYOLPeZ3E32h/nDt8/EgRYGkDTaECZxkMn2fmbNv7k9iM3MwjmQACCbii/aADkA+YvnALACgHnFGREAIgfwlL57EUwkgCQDcF96wR0A+TAD7j/l75gDdG7mp/UxBAeQp+8YQAKAZLV4pD9KBuDu3QJYKQUs4hHd5gCglW/NAPnJ+TvUgRUH6MZyfHMu//cBILXo+fEO8qcwPaCB8+PQvi8DnmzG3yBYD2jg/ElmyV0WjNdzijwYgbcIKNsBID8aNLsiM7yblU5QPswA3H/x4z4AXJAvy3T/1xKlAmoVkCoAy/sZYASvEPCPfmkUYXpOtlEdkhUHgMXJJQCc6jGKoQizxIEVt6Cpxg3IPANwKnnxOQzAqk2Vixmx4qjNubyqIXDc6SmC1vmXf6/gTopr5P0MeZEQKSlUye2jJ/62Qdbl7zNLHwHgeGelZG0InKGa+medm+rvwv7xpiJMZY1+aXsrANrGr3mtMqtcI1jhkB0I7kIASHSrEW1e869qNiCYz5hOHVg1M2x5axdGO4BVuSTuZ5acL5rVKxxqOPG0TV77nTR83YGZg57iduddOrUBoE0lxsEXB6UXmtk2WOj5DA9vQU8xa1d4+tbbERHm9E4i006ixb0uACo6nG67R56GhM41sKAJtjXGXWRGScXwZg8AfH3VHxu1w2fX+ovzy/50LvMF0OqH8c2fwx5tUed5OwAfEajH/atv4pAAJ5fAFgufy30AfGZEcvG6WyLYgr7BG0AJhvFIHahbgaoDUsltha9w1AR8wuyva+PEiwC4yLbYYvoILCQHEq160xMdoWR+NM+Uv73bgxXUOVBY92qTNZ3AqeYMmWc1FtQyE38/UAel51/NL1WgrMaVa52xyfz0OoIFpN2CWmzzVcGdFmGqpJEeZhUWLFz5RF84brpikrwqfiItynS9XQAQ+ZFkLhbQgK8bMySbrGTYvHUgBUEumJX8VB7kMQBATS5kWyB60c4ABSFnCnw7C1gAAOFKBmnWFXDE+qU7/3Phpv1o59VktMu9ffszs/O/zPlQfQBuHBfzvqWJx/VLAPLIWwIOAAXco0a2znrs+tucAXJRV0SahZXn+ja5tqec8g4VtDSBWSU6WbPOpNgFQE/DhS3JJ6cNNlJ04OWR5uVNpwq4AJA22MyHAQAeOYBLowiqRGBRHRJWufFrVJes3aSAy6MUSPvWFB0ARFNx6BWAKy8A4AADJAe45mYawwFSMeUl/JcHyR9V17B8mMsYAI+NgtW3AScucafcIu+zXOoWP5j6XaUMf0DIosgNZPptDoC86FGCLg7oJEsUGjD3BiAY7pT+36Tdik57chUKnBsN8LJBTT9ApurR81RGAhBaDy6NBvgzAHgqQ1J335L6WXUoAwAOeZ6q/HYbCYCVf4MZAEjgbyYwxADgFeVdtiZq3cTwxKFayYNEkAEp5Qjfo2Byih4E1CdhXyLACVX6VMwgCHXF1MZxF8MAS2SdPKDdVlgGNx4MQNrS4IEAZOHBRUcF1auGel4xzA/UU+MQNdS9pA537PihzCNoZ1bfq4kpeuRHXW6A2hYQxQCUJUIWmpTSQoVUwyqWAVaVlAYBMEHY9M2jGaBZQCKUMLV6HDSOAQSEQb5ApxpQ1+y8VIDY7SECIlNVgnA/Ke0KRaZjKaIFIAuXLEMATGArwCBiBf/SAAAnALGbXJGb9dIpw40CkTmVgDokIFzbhULoUUmPhPaIJpYHUA+QRs3PzZ8jECcbabsEwIiZf3ITz4JMPY3yRswXAOUAjorLP6YxsRimoHlkAO5El9Ot0xIA1mVz6RGxboCoCkGzoH3tsglgwutxOB2ycxpPAPBz8acXAJ03ums8zg6ldmDMuLLWgwi0VQDVRCQbZoylEpu40AWgtl5kwlCMHaaN5BI3aR+Auvd90rGIRT07awTCuz4AyzZfMlQKVjCVrBtAnQHS8DDGDLiBbS+lT7oB1LX9BfZCaSNLdSGqLZWQ79W/xzuEb5mlM2KWq4l1d30RnXaZxLzUgPMhHOAdc9AOCdi5cBbth2oZnQyojISlxnw/KtB0KbTjNx5RwtmDpT6ZndfAYpDol+7H6gGQdojOX/OmPLpFw22fGhENstKbxwEgA2ygHHhIkyp1i86nLvOqqmh/ba1GCTUD4fLmrANA5qqtI+rDVEGYZEM4ULBARJvimUM12wGQrvZCGmqFrJUBnbFAOFnAI53xWVu93AGIuViQBe65AgWy1tbOvBPAjdsQApWAuHxA1gmgka8YFpBQZyxAWi2nJyXDd4078uLx0zArBGgLAz7uAdDcilmykYd6opYGg+y1CtPZLtETU1vTMCu08wDDPML7HZFGIJasoodpmBJQgJXbmJIrPf/GxxOuVQl5VXT5ZYqOpdf+WEqTTA212nRXLSWoBAC2ZZdqq75L/KOytRuMbNRA9DDzjQVqW3Jabk8+UmbAw4xAlxobvej3JvMPRiJXojcItDOgQTqoxX+ttfEsKBoKpnRObBUr83OwEC00o5Ik0+4/ueyvXCv0MoPaprf67yMAsnHsYmsn3WXQWr9w7mTrYOt35qf1vCyredT8EwCb4IREFJvS/pkX7ogGzZ/oWU86hUc7OjvcNgruXRyY+bW86Hkn65ynbORBUVXLh8/1CD6HqGrzA5k5jhOYE3KrzfSaeccj0+VKrWD2wq9/U6Ppoa27atz+d54UXbZt6VbdJtDJgcfKKoeKDCL1mn9RbXt1Lnl1nLT6+QP7MDP/3S16z7Wq+ZObWXGagAK4jawLnqrw/gK07xSszU++zGRpMLLPdrpMm1VZnioEac/8m8taPsWiAfxQ7Wwq9ZLOTTF6fgVVFMP3LDp2AXiqss8MlB/1zG9Z63JQf6DGv8JirQ2b5TgLXuQ8tEhlKR/WH8gqaijKHDX/qjWJMtuvK3VYNgAAqVq++vialYljbf6sPi0b2KAQldpMiVamaueuLYZVZf7SCxP078HsPnN6vLMDUD4DgN1u/fA5B+6L9w1o87+y+ylvjUcc1qDIAFzUtJCa4CQ/SQFgWjf/4ijcxCeFoL25/Z/SqhbKFMA6ByDyrwB6yGspPzHDnvQ36fpEIKvvNTjeKRkAkA+f7gD+4bEEgOR7+64ZIHYaRHo7iANgsNe6MksSap+c3FaTD1sH/TaA9Rx8zmdAeZ518oGdF3FztLSWLBMAzGzDuR2mA/ppj6r9nTtnF8UecenX3PNKdM3LJXSEkecAgAtTOmpzsFFmujgXQwHoAcxxUu3XrwBg9broI4j8tKECiatJFMgBPYKOwVmpOHqH05v1AgC2ZZrAARD1royQKq6vzFXhh5helgp+IBvgOldpwqk9oOmO9NdyfVpSFvrk7LK+rqfTXbPd6TCDPi1JpLslEmaG9gHYn774aPNb3pwfcne8AyDvf7U1XTVzxdvBHGg7So+m+ZtyYCErnkfywQDcxyar7qf9mKgHgOjNGTX3175xNR1uBd790VYEfA8AXGM0svN1HCfj98fkv6l/8YwASArgP7X6QPCYoSYxZrK6vj3eAShf9lGEhSp5vKwshgO/fgWsX9aCEF0lcczs+X162LxFO+AlR3ni+LT1FIOHK+7jgHAOqnOy/BQAXW0BYMH2z4GGK7YfavoZB4CVWoZYvWqcWN4DBzqZ+qii/jqDPpcr928FpPY6CPV+nGm6WJzuDg7KlJOcXZWJe/l4e4+Gyb9PnB3jhciKVwj7iyA+GgLA9LF+8TYUwBTxRBP7JRB2czBAw3oBON5isBAZoNuWlVcTVHuNw82w9Y0YLS84Um6pJ2mIAtDMyRbX7Ve2OMPtHqJh3RWSxDE/rrcs9Om81ITV9LqDq+taluJzRJYgSAaf9L0mvZKcbvfCAXs9O+l9TbudGno5ZoIAFnitmhU88PBCfq6iWED1W7Vb68vpGfbEAYB+mSFg1ZAuue/ze9P04jzo+m8w0kgjjTTSSCONNNJII4000kgjjTTSSCP50v8Bn73uPd2GQ70AAAAASUVORK5CYII=';
const LOGO_SRC = logoSrc;

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

const EVENT_TYPES = [
  { id: 'horario_livre', label: 'Horário Livre', icon: Coffee, color: '#5FC4D0' },
  { id: 'reuniao', label: 'Reunião', icon: Users, color: '#9B8AC4' },
  { id: 'treino_pessoal', label: 'Meu Treino', icon: Dumbbell, color: '#6FCF97' },
  { id: 'almoco', label: 'Horário de Almoço', icon: UtensilsCrossed, color: '#F2A65A' },
  { id: 'consulta_medica', label: 'Consulta Médica', icon: Stethoscope, color: '#EF88AD' },
  { id: 'outro', label: 'Outro', icon: Tag, color: '#8C8C8C' },
];

const STATUS_OPTIONS = [
  { id: 'agendado', label: 'Agendado', color: '#8C8C8C' },
  { id: 'realizado', label: 'Realizado', color: '#5FBFA0' },
  { id: 'falta', label: 'Falta', color: '#D6534A' },
  { id: 'cancelado', label: 'Cancelado', color: '#5C5C5C' },
];

// Recharts recebe estilos como objetos JS, por isso não lê as variáveis CSS.
// Manter aqui evita que os gráficos fiquem dessincronizados da paleta.
const CHART = {
  tooltip: {
    background: '#1B1E24', border: '1px solid #363C45', borderRadius: 10,
    color: '#F2F4F7', boxShadow: '0 6px 16px -6px rgba(0,0,0,0.6)', fontSize: 12,
  },
  // O Recharts usa preto por omissão no rótulo do tooltip e um cursor cinzento
  // claro — ilegíveis sobre fundo escuro. Definidos explicitamente.
  tooltipLabel: { color: '#F2F4F7', fontWeight: 600, marginBottom: 4 },
  tooltipItem: { color: '#A0A6B0', padding: 0 },
  cursor: { fill: 'rgba(255,255,255,0.06)' },
  legend: { fontSize: 11, color: '#A0A6B0' },
  tick: { fill: '#7C838F', fontSize: 11 },
  grid: '#262A31',
};

const STUDENT_COLORS = ['#5DA9E9', '#C77DFF', '#4EC5D4', '#EF88AD', '#7EC4CF', '#8FA6C2', '#A78BFA', '#7FB3B3', '#6FCF97', '#E8735A'];
const PLAN_TYPES = ['1x por semana', '2x por semana', '3x por semana', '4x por semana', '5x por semana', 'Personalizado'];
const ACCENT_HEX = { brass: '#1EA6B4', rust: '#D6534A', slate: '#8C8C8C', sky: '#5FC4D0' };

const EXPENSE_CATEGORIES = [
  { id: 'moradia', label: 'Moradia', color: '#5DA9E9' },
  { id: 'contas', label: 'Contas e Utilidades', color: '#7EC4CF' },
  { id: 'alimentacao', label: 'Alimentação', color: '#6FCF97' },
  { id: 'transporte', label: 'Transporte', color: '#A78BFA' },
  { id: 'saude', label: 'Saúde', color: '#EF88AD' },
  { id: 'lazer', label: 'Lazer', color: '#C77DFF' },
  { id: 'educacao', label: 'Educação', color: '#4EC5D4' },
  { id: 'assinaturas', label: 'Subscrições', color: '#8FA6C2' },
  { id: 'impostos', label: 'Impostos Pessoais', color: '#D6534A' },
  { id: 'outros_gasto', label: 'Outros', color: '#7FB3B3' },
];
const INCOME_CATEGORIES = [
  { id: 'rendimento_pt', label: 'Rendimento PT', color: '#1EA6B4' },
  { id: 'freelance', label: 'Freelance / Extra', color: '#5DA9E9' },
  { id: 'investimentos', label: 'Investimentos', color: '#6FCF97' },
  { id: 'reembolsos', label: 'Reembolsos', color: '#7EC4CF' },
  { id: 'presentes', label: 'Presentes', color: '#EF88AD' },
  { id: 'outros_entrada', label: 'Outros', color: '#8FA6C2' },
];

const PAYMENT_MODES = [
  { id: 'mensal', label: 'Valor por mês' },
  { id: 'quinzenal', label: 'Valor por quinzena' },
  { id: 'quinzenas_pagas', label: 'Registar quinzenas pagas' },
];

const CUSTOM_CATEGORY_COLORS = ['#5DA9E9', '#C77DFF', '#6FCF97', '#EF88AD', '#F2A65A', '#7EC4CF', '#A78BFA', '#E8735A'];
function slugify(label) {
  return `custom_${label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').slice(0, 24)}_${uid().slice(0, 4)}`;
}
const EMPTY_CUSTOM_CATEGORIES = { expense: [], income: [], planTypes: [], sessionTypes: [], eventTypes: [] };

/* ===================== DEFINICOES DA AGENDA ===================== */

// Horario de funcionamento por dia da semana (0 = domingo, como Date.getDay()).
// `aberto: false` fecha o dia inteiro. As excecoes por data sobrepoem-se ao dia
// da semana, para feriados e folgas pontuais.
const EMPTY_DEFINICOES = {
  horarios: {
    0: { aberto: false, inicio: '09:00', fim: '13:00' },
    1: { aberto: true, inicio: '07:00', fim: '21:00' },
    2: { aberto: true, inicio: '07:00', fim: '21:00' },
    3: { aberto: true, inicio: '07:00', fim: '21:00' },
    4: { aberto: true, inicio: '07:00', fim: '21:00' },
    5: { aberto: true, inicio: '07:00', fim: '21:00' },
    6: { aberto: true, inicio: '09:00', fim: '13:00' },
  },
  excecoes: {},          // { '2026-12-25': { aberto: false } }
  lembretes: { ativos: false, minutosAntes: 15 },
};

function normalizarDefinicoes(raw) {
  const d = raw && typeof raw === 'object' ? raw : {};
  const horarios = {};
  for (let i = 0; i < 7; i += 1) {
    horarios[i] = { ...EMPTY_DEFINICOES.horarios[i], ...((d.horarios || {})[i] || {}) };
  }
  return {
    horarios,
    excecoes: d.excecoes && typeof d.excecoes === 'object' ? d.excecoes : {},
    lembretes: { ...EMPTY_DEFINICOES.lembretes, ...(d.lembretes || {}) },
  };
}

// Horario efetivo de um dia: a excecao da data ganha ao dia da semana.
function horarioDoDia(definicoes, iso) {
  const base = definicoes.horarios[new Date(`${iso}T00:00:00`).getDay()] || EMPTY_DEFINICOES.horarios[1];
  const excecao = definicoes.excecoes[iso];
  return excecao ? { ...base, ...excecao } : base;
}

function dentroDoHorario(definicoes, iso, startTime, endTime) {
  const h = horarioDoDia(definicoes, iso);
  if (!h.aberto) return false;
  return startTime >= h.inicio && (endTime || startTime) <= h.fim;
}

const DIAS_SEMANA = [
  { id: 1, curto: 'S', label: 'Segunda' },
  { id: 2, curto: 'T', label: 'Terça' },
  { id: 3, curto: 'Q', label: 'Quarta' },
  { id: 4, curto: 'Q', label: 'Quinta' },
  { id: 5, curto: 'S', label: 'Sexta' },
  { id: 6, curto: 'S', label: 'Sábado' },
  { id: 0, curto: 'D', label: 'Domingo' },
];

// Minutos desde a meia-noite. Serve para comparar e somar horas sem Date.
function minutosDe(hhmm) {
  const [h, m] = String(hhmm || '0:0').split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}
function horaDe(minutos) {
  const m = Math.max(0, Math.min(24 * 60 - 1, minutos));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}


// Suporte é feito por e-mail. Enquanto VITE_SUPPORT_EMAIL não estiver definido,
// os links de contacto simplesmente não aparecem (nada fica quebrado).
const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL || '').trim();
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
const CREATOR_ACTIVE_PLAN_EMAILS = ['maf@cesar.school', 'bfpersonal@live.com'];
const DEV_ACTIVE_PLAN_EMAILS = (import.meta.env.VITE_DEV_ACTIVE_PLAN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
// paidMonths = meses efetivamente cobrados pela Stripe.
// bonusMonths = meses oferecidos no primeiro período (ver stripe-webhook).
// accessMonths = paidMonths + bonusMonths = tempo de acesso do primeiro pagamento.
const SALES_PLANS = [
  {
    id: 'mensal', name: 'Mensal', price: '€13,90', value: 13.90, interval: 'Mensal',
    note: 'Renovação a cada mês', paidMonths: 1, bonusMonths: 0, accessMonths: 1,
    bonusLabel: '', perMonth: '€13,90/mês', highlight: false,
  },
  {
    id: 'trimestral', name: 'Trimestral', price: '€39,90', value: 39.90, interval: 'Trimestral',
    note: '3 meses pagos + 1 grátis', paidMonths: 3, bonusMonths: 1, accessMonths: 4,
    bonusLabel: '+1 mês grátis', perMonth: '€9,98/mês', highlight: true,
  },
  {
    id: 'anual', name: 'Anual', price: '€129,90', value: 129.90, interval: 'Anual',
    note: '12 meses pagos + 2 grátis', paidMonths: 12, bonusMonths: 2, accessMonths: 14,
    bonusLabel: '+2 meses grátis', perMonth: '€9,28/mês', highlight: false,
  },
];

// Todos os pontos de dobra cutânea possíveis, usados por um ou mais protocolos abaixo.
const ALL_FOLD_SITES = [
  { id: 'assessFoldChest', label: 'Peitoral' },
  { id: 'assessFoldMidaxillary', label: 'Axilar Média' },
  { id: 'assessFoldTriceps', label: 'Tríceps' },
  { id: 'assessFoldBiceps', label: 'Bíceps' },
  { id: 'assessFoldSubscapular', label: 'Subescapular' },
  { id: 'assessFoldAbdominal', label: 'Abdominal' },
  { id: 'assessFoldSuprailiac', label: 'Supra-ilíaca' },
  { id: 'assessFoldThigh', label: 'Coxa' },
];
function foldLabel(id) { return (ALL_FOLD_SITES.find((f) => f.id === id) || {}).label || id; }

// 5 protocolos de dobras cutâneas, com os pontos exigidos por sexo e a fórmula embutida.
// Todas as fórmulas convertem para % de gordura pela equação de Siri, exceto Faulkner (direta).
const FOLD_PROTOCOLS = [
  {
    id: 'jp7', label: 'Jackson-Pollock 7 Dobras', needsAge: true,
    sites: { M: ['assessFoldChest', 'assessFoldMidaxillary', 'assessFoldTriceps', 'assessFoldSubscapular', 'assessFoldAbdominal', 'assessFoldSuprailiac', 'assessFoldThigh'], F: ['assessFoldChest', 'assessFoldMidaxillary', 'assessFoldTriceps', 'assessFoldSubscapular', 'assessFoldAbdominal', 'assessFoldSuprailiac', 'assessFoldThigh'] },
    calc: (sum, age, sex) => {
      const d = sex === 'F' ? 1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * age
        : 1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * age;
      return siriFat(d);
    },
  },
  {
    id: 'jp3', label: 'Jackson-Pollock 3 Dobras', needsAge: true,
    sites: { M: ['assessFoldChest', 'assessFoldAbdominal', 'assessFoldThigh'], F: ['assessFoldTriceps', 'assessFoldSuprailiac', 'assessFoldThigh'] },
    calc: (sum, age, sex) => {
      const d = sex === 'F' ? 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age
        : 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age;
      return siriFat(d);
    },
  },
  {
    id: 'durnin', label: 'Durnin-Womersley 4 Dobras', needsAge: true,
    sites: { M: ['assessFoldBiceps', 'assessFoldTriceps', 'assessFoldSubscapular', 'assessFoldSuprailiac'], F: ['assessFoldBiceps', 'assessFoldTriceps', 'assessFoldSubscapular', 'assessFoldSuprailiac'] },
    calc: (sum, age, sex) => {
      if (sum <= 0) return null;
      const table = sex === 'F'
        ? [{ max: 16, c: 1.1369, m: 0.0598 }, { max: 19, c: 1.1549, m: 0.0678 }, { max: 29, c: 1.1599, m: 0.0717 }, { max: 39, c: 1.1423, m: 0.0632 }, { max: 49, c: 1.1333, m: 0.0612 }, { max: 999, c: 1.1339, m: 0.0645 }]
        : [{ max: 16, c: 1.1533, m: 0.0643 }, { max: 19, c: 1.1620, m: 0.0630 }, { max: 29, c: 1.1631, m: 0.0632 }, { max: 39, c: 1.1422, m: 0.0544 }, { max: 49, c: 1.1620, m: 0.0700 }, { max: 999, c: 1.1715, m: 0.0779 }];
      const band = table.find((b) => age <= b.max) || table[table.length - 1];
      const d = band.c - band.m * Math.log10(sum);
      return siriFat(d);
    },
  },
  {
    id: 'faulkner', label: 'Faulkner 4 Dobras', needsAge: false,
    sites: { M: ['assessFoldTriceps', 'assessFoldSubscapular', 'assessFoldSuprailiac', 'assessFoldAbdominal'], F: ['assessFoldTriceps', 'assessFoldSubscapular', 'assessFoldSuprailiac', 'assessFoldAbdominal'] },
    calc: (sum) => (sum > 0 ? 5.783 + 0.153 * sum : null),
  },
  {
    id: 'guedes', label: 'Guedes 3 Dobras', needsAge: false,
    sites: { M: ['assessFoldTriceps', 'assessFoldSuprailiac', 'assessFoldAbdominal'], F: ['assessFoldSubscapular', 'assessFoldSuprailiac', 'assessFoldThigh'] },
    calc: (sum, age, sex) => {
      if (sum <= 0) return null;
      const d = sex === 'F' ? 1.16650 - 0.07063 * Math.log10(sum) : 1.17136 - 0.06706 * Math.log10(sum);
      return siriFat(d);
    },
  },
];

const BIA_FIELDS = [
  { id: 'assessMuscleMassPct', label: '% Massa Muscular' },
  { id: 'assessSkeletalMuscleKg', label: 'Massa Musc. Esquelética (kg)' },
  { id: 'assessFatMassKg', label: 'Massa Gorda (kg)' },
  { id: 'assessLeanMassKg', label: 'Massa Livre de Gordura (kg)' },
  { id: 'assessBodyWater', label: '% Água Corporal' },
  { id: 'assessProteinPct', label: '% Proteína' },
  { id: 'assessMineralsKg', label: 'Minerais (kg)' },
  { id: 'assessBoneMass', label: 'Massa Óssea (kg)' },
  { id: 'assessVisceralFat', label: 'Gordura Visceral (índice)' },
  { id: 'assessObesityDegree', label: 'Grau de Obesidade (%)' },
  { id: 'assessBMR', label: 'TMB (kcal)' },
  { id: 'assessMetabolicAge', label: 'Idade Metabólica (anos)' },
];

const EMPTY_ASSESS_FIELDS = {
  assessMethod: 'bioimpedancia', assessAge: '', assessProtocol: 'jp7',
  assessWeight: '', assessBodyFat: '',
  assessMuscleMassPct: '', assessSkeletalMuscleKg: '', assessFatMassKg: '', assessLeanMassKg: '',
  assessBodyWater: '', assessProteinPct: '', assessMineralsKg: '', assessBoneMass: '',
  assessVisceralFat: '', assessObesityDegree: '', assessBMR: '', assessMetabolicAge: '',
  assessFoldChest: '', assessFoldMidaxillary: '', assessFoldTriceps: '', assessFoldBiceps: '',
  assessFoldSubscapular: '', assessFoldAbdominal: '', assessFoldSuprailiac: '', assessFoldThigh: '',
  assessNotes: '', photoIds: [],
};

/* ===================== PRESCRICAO DE TREINO ===================== */

// Grupos musculares e categorias (modalidade) sao taxonomias distintas: o
// agachamento e "Quadricipites" no grupo e "Musculacao" na categoria; o mesmo
// movimento com elastico muda de categoria mas nao de grupo.
const GRUPOS_BASE = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Antebraço',
  'Quadricípites', 'Isquiotibiais', 'Glúteos', 'Gémeos',
  'Abdominais', 'Lombar', 'Corpo inteiro', 'Cardio', 'Mobilidade',
];

const CATEGORIAS_BASE = [
  'Musculação', 'Aeróbico', 'Funcional', 'Alongamento', 'Em casa',
  'Mobilidade', 'Elástico', 'Pilates', 'Laboral', 'Reabilitação',
];

// [nome, grupo, categoria, equipamento]
const EXERCICIOS_BASE = [
  // ---------------- PEITO ----------------
  ['Supino reto com barra', 'Peito', 'Musculação', 'Barra'],
  ['Supino reto com halteres', 'Peito', 'Musculação', 'Halteres'],
  ['Supino inclinado com barra', 'Peito', 'Musculação', 'Barra'],
  ['Supino inclinado com halteres', 'Peito', 'Musculação', 'Halteres'],
  ['Supino declinado com barra', 'Peito', 'Musculação', 'Barra'],
  ['Supino na máquina', 'Peito', 'Musculação', 'Máquina'],
  ['Aberturas com halteres', 'Peito', 'Musculação', 'Halteres'],
  ['Aberturas inclinadas', 'Peito', 'Musculação', 'Halteres'],
  ['Peck deck', 'Peito', 'Musculação', 'Máquina'],
  ['Cruzamento na polia alta', 'Peito', 'Musculação', 'Polia'],
  ['Cruzamento na polia baixa', 'Peito', 'Musculação', 'Polia'],
  ['Pullover com haltere', 'Peito', 'Musculação', 'Halteres'],
  ['Flexões de braços', 'Peito', 'Em casa', 'Peso corporal'],
  ['Flexões com apoio elevado', 'Peito', 'Em casa', 'Peso corporal'],
  ['Flexões declinadas', 'Peito', 'Em casa', 'Peso corporal'],
  ['Flexões diamante', 'Peito', 'Em casa', 'Peso corporal'],
  ['Flexões com elástico', 'Peito', 'Elástico', 'Elástico'],
  ['Press de peito com elástico', 'Peito', 'Elástico', 'Elástico'],
  ['Fundos para peito', 'Peito', 'Musculação', 'Paralelas'],
  ['Supino com kettlebell', 'Peito', 'Funcional', 'Kettlebell'],

  // ---------------- COSTAS ----------------
  ['Elevações na barra fixa (pronada)', 'Costas', 'Musculação', 'Barra fixa'],
  ['Elevações na barra fixa (supinada)', 'Costas', 'Musculação', 'Barra fixa'],
  ['Elevações assistidas', 'Costas', 'Musculação', 'Máquina'],
  ['Puxada na polia alta (pronada)', 'Costas', 'Musculação', 'Polia'],
  ['Puxada na polia alta (supinada)', 'Costas', 'Musculação', 'Polia'],
  ['Puxada com pega neutra', 'Costas', 'Musculação', 'Polia'],
  ['Puxada atrás da nuca', 'Costas', 'Musculação', 'Polia'],
  ['Remada curvada com barra', 'Costas', 'Musculação', 'Barra'],
  ['Remada curvada com halteres', 'Costas', 'Musculação', 'Halteres'],
  ['Remada unilateral com haltere', 'Costas', 'Musculação', 'Halteres'],
  ['Remada baixa na polia', 'Costas', 'Musculação', 'Polia'],
  ['Remada cavalinho', 'Costas', 'Musculação', 'Barra'],
  ['Remada na máquina', 'Costas', 'Musculação', 'Máquina'],
  ['Remada invertida', 'Costas', 'Funcional', 'Peso corporal'],
  ['Pullover na polia', 'Costas', 'Musculação', 'Polia'],
  ['Levantamento terra convencional', 'Costas', 'Musculação', 'Barra'],
  ['Levantamento terra sumo', 'Costas', 'Musculação', 'Barra'],
  ['Remada com elástico', 'Costas', 'Elástico', 'Elástico'],
  ['Puxada com elástico', 'Costas', 'Elástico', 'Elástico'],
  ['Face pull', 'Costas', 'Musculação', 'Polia'],
  ['Encolhimentos com barra', 'Costas', 'Musculação', 'Barra'],
  ['Encolhimentos com halteres', 'Costas', 'Musculação', 'Halteres'],

  // ---------------- OMBROS ----------------
  ['Desenvolvimento militar com barra', 'Ombros', 'Musculação', 'Barra'],
  ['Desenvolvimento com halteres', 'Ombros', 'Musculação', 'Halteres'],
  ['Desenvolvimento Arnold', 'Ombros', 'Musculação', 'Halteres'],
  ['Desenvolvimento na máquina', 'Ombros', 'Musculação', 'Máquina'],
  ['Elevações laterais', 'Ombros', 'Musculação', 'Halteres'],
  ['Elevações laterais na polia', 'Ombros', 'Musculação', 'Polia'],
  ['Elevações frontais', 'Ombros', 'Musculação', 'Halteres'],
  ['Elevações frontais com barra', 'Ombros', 'Musculação', 'Barra'],
  ['Crucifixo invertido', 'Ombros', 'Musculação', 'Halteres'],
  ['Crucifixo invertido na máquina', 'Ombros', 'Musculação', 'Máquina'],
  ['Remada alta', 'Ombros', 'Musculação', 'Barra'],
  ['Elevações laterais com elástico', 'Ombros', 'Elástico', 'Elástico'],
  ['Rotação externa com elástico', 'Ombros', 'Reabilitação', 'Elástico'],
  ['Rotação interna com elástico', 'Ombros', 'Reabilitação', 'Elástico'],
  ['Press militar com kettlebell', 'Ombros', 'Funcional', 'Kettlebell'],
  ['Pino contra a parede', 'Ombros', 'Funcional', 'Peso corporal'],

  // ---------------- BÍCEPS ----------------
  ['Rosca direta com barra', 'Bíceps', 'Musculação', 'Barra'],
  ['Rosca direta com barra W', 'Bíceps', 'Musculação', 'Barra W'],
  ['Rosca alternada com halteres', 'Bíceps', 'Musculação', 'Halteres'],
  ['Rosca simultânea', 'Bíceps', 'Musculação', 'Halteres'],
  ['Rosca martelo', 'Bíceps', 'Musculação', 'Halteres'],
  ['Rosca concentrada', 'Bíceps', 'Musculação', 'Halteres'],
  ['Rosca Scott', 'Bíceps', 'Musculação', 'Banco Scott'],
  ['Rosca na polia baixa', 'Bíceps', 'Musculação', 'Polia'],
  ['Rosca inclinada', 'Bíceps', 'Musculação', 'Halteres'],
  ['Rosca 21', 'Bíceps', 'Musculação', 'Barra'],
  ['Rosca com elástico', 'Bíceps', 'Elástico', 'Elástico'],

  // ---------------- TRÍCEPS ----------------
  ['Tríceps na polia (corda)', 'Tríceps', 'Musculação', 'Polia'],
  ['Tríceps na polia (barra)', 'Tríceps', 'Musculação', 'Polia'],
  ['Tríceps testa com barra', 'Tríceps', 'Musculação', 'Barra'],
  ['Tríceps testa com halteres', 'Tríceps', 'Musculação', 'Halteres'],
  ['Tríceps francês', 'Tríceps', 'Musculação', 'Halteres'],
  ['Extensão acima da cabeça na polia', 'Tríceps', 'Musculação', 'Polia'],
  ['Tríceps coice', 'Tríceps', 'Musculação', 'Halteres'],
  ['Fundos em paralelas', 'Tríceps', 'Musculação', 'Paralelas'],
  ['Fundos no banco', 'Tríceps', 'Em casa', 'Peso corporal'],
  ['Supino fechado', 'Tríceps', 'Musculação', 'Barra'],
  ['Tríceps com elástico', 'Tríceps', 'Elástico', 'Elástico'],

  // ---------------- ANTEBRAÇO ----------------
  ['Rosca de punho', 'Antebraço', 'Musculação', 'Barra'],
  ['Rosca de punho invertida', 'Antebraço', 'Musculação', 'Barra'],
  ['Rosca inversa', 'Antebraço', 'Musculação', 'Barra W'],
  ['Farmer walk', 'Antebraço', 'Funcional', 'Halteres'],
  ['Suspensão na barra', 'Antebraço', 'Funcional', 'Barra fixa'],

  // ---------------- QUADRICÍPITES ----------------
  ['Agachamento livre', 'Quadricípites', 'Musculação', 'Barra'],
  ['Agachamento frontal', 'Quadricípites', 'Musculação', 'Barra'],
  ['Agachamento no Smith', 'Quadricípites', 'Musculação', 'Smith'],
  ['Agachamento goblet', 'Quadricípites', 'Funcional', 'Kettlebell'],
  ['Agachamento búlgaro', 'Quadricípites', 'Musculação', 'Halteres'],
  ['Agachamento sumo', 'Quadricípites', 'Musculação', 'Barra'],
  ['Agachamento com peso corporal', 'Quadricípites', 'Em casa', 'Peso corporal'],
  ['Agachamento na parede', 'Quadricípites', 'Em casa', 'Peso corporal'],
  ['Prensa de pernas 45°', 'Quadricípites', 'Musculação', 'Máquina'],
  ['Prensa horizontal', 'Quadricípites', 'Musculação', 'Máquina'],
  ['Extensão de pernas', 'Quadricípites', 'Musculação', 'Máquina'],
  ['Afundos no lugar', 'Quadricípites', 'Musculação', 'Halteres'],
  ['Afundos caminhando', 'Quadricípites', 'Funcional', 'Halteres'],
  ['Afundos reversos', 'Quadricípites', 'Funcional', 'Halteres'],
  ['Subida ao banco', 'Quadricípites', 'Funcional', 'Halteres'],
  ['Hack squat', 'Quadricípites', 'Musculação', 'Máquina'],
  ['Agachamento com elástico', 'Quadricípites', 'Elástico', 'Elástico'],

  // ---------------- ISQUIOTIBIAIS ----------------
  ['Levantamento terra romeno', 'Isquiotibiais', 'Musculação', 'Barra'],
  ['Terra romeno com halteres', 'Isquiotibiais', 'Musculação', 'Halteres'],
  ['Terra unilateral', 'Isquiotibiais', 'Funcional', 'Halteres'],
  ['Flexão de pernas deitado', 'Isquiotibiais', 'Musculação', 'Máquina'],
  ['Flexão de pernas sentado', 'Isquiotibiais', 'Musculação', 'Máquina'],
  ['Flexão nórdica', 'Isquiotibiais', 'Funcional', 'Peso corporal'],
  ['Bom dia', 'Isquiotibiais', 'Musculação', 'Barra'],
  ['Curl de pernas com elástico', 'Isquiotibiais', 'Elástico', 'Elástico'],

  // ---------------- GLÚTEOS ----------------
  ['Elevação pélvica com barra', 'Glúteos', 'Musculação', 'Barra'],
  ['Ponte de glúteos', 'Glúteos', 'Em casa', 'Peso corporal'],
  ['Ponte unilateral', 'Glúteos', 'Em casa', 'Peso corporal'],
  ['Abdução de anca na máquina', 'Glúteos', 'Musculação', 'Máquina'],
  ['Abdução com elástico', 'Glúteos', 'Elástico', 'Elástico'],
  ['Coice na polia', 'Glúteos', 'Musculação', 'Polia'],
  ['Coice quadrupede', 'Glúteos', 'Em casa', 'Peso corporal'],
  ['Passada lateral com elástico', 'Glúteos', 'Elástico', 'Elástico'],
  ['Agachamento sumo com haltere', 'Glúteos', 'Musculação', 'Halteres'],
  ['Hip thrust na máquina', 'Glúteos', 'Musculação', 'Máquina'],

  // ---------------- GÉMEOS ----------------
  ['Gémeos em pé na máquina', 'Gémeos', 'Musculação', 'Máquina'],
  ['Gémeos sentado', 'Gémeos', 'Musculação', 'Máquina'],
  ['Gémeos na prensa', 'Gémeos', 'Musculação', 'Máquina'],
  ['Elevação de gémeos com halteres', 'Gémeos', 'Musculação', 'Halteres'],
  ['Elevação de gémeos unilateral', 'Gémeos', 'Em casa', 'Peso corporal'],
  ['Saltos no lugar', 'Gémeos', 'Funcional', 'Peso corporal'],

  // ---------------- ABDOMINAIS ----------------
  ['Prancha frontal', 'Abdominais', 'Funcional', 'Peso corporal'],
  ['Prancha lateral', 'Abdominais', 'Funcional', 'Peso corporal'],
  ['Prancha com elevação de perna', 'Abdominais', 'Funcional', 'Peso corporal'],
  ['Abdominais no solo', 'Abdominais', 'Em casa', 'Peso corporal'],
  ['Abdominais com rotação', 'Abdominais', 'Em casa', 'Peso corporal'],
  ['Elevação de pernas suspenso', 'Abdominais', 'Musculação', 'Barra fixa'],
  ['Elevação de pernas no solo', 'Abdominais', 'Em casa', 'Peso corporal'],
  ['Rotação russa', 'Abdominais', 'Funcional', 'Bola medicinal'],
  ['Roda abdominal', 'Abdominais', 'Funcional', 'Roda'],
  ['Abdominal na polia', 'Abdominais', 'Musculação', 'Polia'],
  ['Mountain climbers', 'Abdominais', 'Funcional', 'Peso corporal'],
  ['Dead bug', 'Abdominais', 'Reabilitação', 'Peso corporal'],
  ['Hollow hold', 'Abdominais', 'Funcional', 'Peso corporal'],
  ['Bicicleta abdominal', 'Abdominais', 'Em casa', 'Peso corporal'],
  ['Prancha dinâmica', 'Abdominais', 'Funcional', 'Peso corporal'],
  ['Cem (Pilates)', 'Abdominais', 'Pilates', 'Colchão'],
  ['Roll up (Pilates)', 'Abdominais', 'Pilates', 'Colchão'],
  ['Teaser (Pilates)', 'Abdominais', 'Pilates', 'Colchão'],

  // ---------------- LOMBAR ----------------
  ['Extensão lombar no banco', 'Lombar', 'Musculação', 'Banco romano'],
  ['Superman', 'Lombar', 'Em casa', 'Peso corporal'],
  ['Bird dog', 'Lombar', 'Reabilitação', 'Peso corporal'],
  ['Ponte de glúteos com pausa', 'Lombar', 'Reabilitação', 'Peso corporal'],
  ['Extensão lombar na máquina', 'Lombar', 'Musculação', 'Máquina'],
  ['Gato-camelo', 'Lombar', 'Mobilidade', 'Peso corporal'],

  // ---------------- CORPO INTEIRO ----------------
  ['Burpees', 'Corpo inteiro', 'Funcional', 'Peso corporal'],
  ['Kettlebell swing', 'Corpo inteiro', 'Funcional', 'Kettlebell'],
  ['Turkish get-up', 'Corpo inteiro', 'Funcional', 'Kettlebell'],
  ['Thruster', 'Corpo inteiro', 'Funcional', 'Barra'],
  ['Clean and press', 'Corpo inteiro', 'Funcional', 'Barra'],
  ['Snatch com haltere', 'Corpo inteiro', 'Funcional', 'Halteres'],
  ['Wall ball', 'Corpo inteiro', 'Funcional', 'Bola medicinal'],
  ['Battle rope', 'Corpo inteiro', 'Funcional', 'Corda naval'],
  ['Slam ball', 'Corpo inteiro', 'Funcional', 'Bola medicinal'],
  ['Bear crawl', 'Corpo inteiro', 'Funcional', 'Peso corporal'],
  ['Sled push', 'Corpo inteiro', 'Funcional', 'Trenó'],
  ['Box jump', 'Corpo inteiro', 'Funcional', 'Caixa'],
  ['Jumping jacks', 'Corpo inteiro', 'Em casa', 'Peso corporal'],
  ['Agachamento com salto', 'Corpo inteiro', 'Funcional', 'Peso corporal'],
  ['Devil press', 'Corpo inteiro', 'Funcional', 'Halteres'],
  ['Man maker', 'Corpo inteiro', 'Funcional', 'Halteres'],

  // ---------------- CARDIO ----------------
  ['Passadeira — caminhada', 'Cardio', 'Aeróbico', 'Passadeira'],
  ['Passadeira — corrida contínua', 'Cardio', 'Aeróbico', 'Passadeira'],
  ['Passadeira — intervalado', 'Cardio', 'Aeróbico', 'Passadeira'],
  ['Passadeira — inclinação', 'Cardio', 'Aeróbico', 'Passadeira'],
  ['Bicicleta estática', 'Cardio', 'Aeróbico', 'Bicicleta'],
  ['Bicicleta — intervalado', 'Cardio', 'Aeróbico', 'Bicicleta'],
  ['Elíptica', 'Cardio', 'Aeróbico', 'Elíptica'],
  ['Remo ergómetro', 'Cardio', 'Aeróbico', 'Remo'],
  ['Escadas', 'Cardio', 'Aeróbico', 'Simulador'],
  ['Corda de saltar', 'Cardio', 'Aeróbico', 'Corda'],
  ['Assault bike', 'Cardio', 'Aeróbico', 'Bicicleta'],
  ['Corrida ao ar livre', 'Cardio', 'Aeróbico', 'Nenhum'],
  ['Caminhada ao ar livre', 'Cardio', 'Aeróbico', 'Nenhum'],
  ['Natação', 'Cardio', 'Aeróbico', 'Piscina'],
  ['Sprint', 'Cardio', 'Aeróbico', 'Nenhum'],

  // ---------------- MOBILIDADE E ALONGAMENTO ----------------
  ['Alongamento de isquiotibiais', 'Mobilidade', 'Alongamento', 'Peso corporal'],
  ['Alongamento de quadricípite', 'Mobilidade', 'Alongamento', 'Peso corporal'],
  ['Alongamento de peitoral', 'Mobilidade', 'Alongamento', 'Peso corporal'],
  ['Alongamento de tricípite', 'Mobilidade', 'Alongamento', 'Peso corporal'],
  ['Alongamento de gémeos', 'Mobilidade', 'Alongamento', 'Peso corporal'],
  ['Alongamento de glúteo', 'Mobilidade', 'Alongamento', 'Peso corporal'],
  ['Mobilidade de anca 90/90', 'Mobilidade', 'Mobilidade', 'Peso corporal'],
  ['Mobilidade torácica', 'Mobilidade', 'Mobilidade', 'Peso corporal'],
  ['Mobilidade de ombro com bastão', 'Mobilidade', 'Mobilidade', 'Bastão'],
  ['Mobilidade de tornozelo', 'Mobilidade', 'Mobilidade', 'Peso corporal'],
  ['Rotação torácica deitado', 'Mobilidade', 'Mobilidade', 'Peso corporal'],
  ['Postura da criança', 'Mobilidade', 'Alongamento', 'Colchão'],
  ['Cão olhando para baixo', 'Mobilidade', 'Alongamento', 'Colchão'],
  ['Libertação miofascial — quadricípite', 'Mobilidade', 'Reabilitação', 'Rolo'],
  ['Libertação miofascial — costas', 'Mobilidade', 'Reabilitação', 'Rolo'],
  ['Libertação miofascial — gémeos', 'Mobilidade', 'Reabilitação', 'Rolo'],
  ['Alongamento de flexores da anca', 'Mobilidade', 'Alongamento', 'Peso corporal'],
  ['Alongamento cervical', 'Mobilidade', 'Laboral', 'Nenhum'],
  ['Alongamento de punho', 'Mobilidade', 'Laboral', 'Nenhum'],
  ['Rotação de ombros sentado', 'Mobilidade', 'Laboral', 'Nenhum'],
  ['Extensão de coluna sentado', 'Mobilidade', 'Laboral', 'Cadeira'],
];

const EMPTY_TREINOS = { biblioteca: [], gruposMusculares: [], categorias: [], modelos: [], prescricoes: [] };

// A biblioteca base so e semeada uma vez. O `base: true` marca a origem, para
// distinguir do que o treinador criou -- e para nao voltar a semear se ele
// apagar tudo de proposito.
function normalizarTreinos(raw) {
  const d = raw && typeof raw === 'object' ? raw : {};
  const biblioteca = Array.isArray(d.biblioteca) ? d.biblioteca : null;
  return {
    biblioteca: biblioteca || EXERCICIOS_BASE.map(([nome, grupo, categoria, equipamento]) => ({
      id: uid(), nome, grupo, categoria, equipamento, instrucoes: '', base: true,
    })),
    // Grupos e categorias que o treinador criou, para lá dos de origem.
    gruposMusculares: Array.isArray(d.gruposMusculares) ? d.gruposMusculares : [],
    categorias: Array.isArray(d.categorias) ? d.categorias : [],
    // Programas guardados para reutilizar noutros alunos. Não pertencem a
    // ninguém: são cópias, e editar o modelo não mexe em quem já o usou.
    modelos: Array.isArray(d.modelos) ? d.modelos : [],
    prescricoes: Array.isArray(d.prescricoes) ? d.prescricoes : [],
  };
}

// Lista completa: os de origem mais os que o treinador acrescentou.
function gruposDe(treinos) {
  return [...GRUPOS_BASE, ...(treinos.gruposMusculares || [])];
}
function categoriasDe(treinos) {
  return [...CATEGORIAS_BASE, ...(treinos.categorias || [])];
}

function novoExercicioTreino(exercicio) {
  return {
    id: uid(),
    exercicioId: exercicio ? exercicio.id : null,
    nome: exercicio ? exercicio.nome : '',
    series: '3', reps: '10', carga: '', descanso: '90', metodo: '', notas: '',
  };
}

function novoTreino(indice) {
  const letra = String.fromCharCode(65 + Math.min(25, indice));
  return { id: uid(), nome: `Treino ${letra}`, notas: '', exercicios: [] };
}

function novaPrescricao(studentId) {
  return {
    id: uid(), studentId, nome: 'Novo programa', objetivo: '',
    inicio: fmtDateISO(new Date()), fim: '', ativo: true,
    treinos: [novoTreino(0)],
    criadoEm: new Date().toISOString(),
  };
}

function prescricoesDoAluno(treinos, studentId, arquivadas = false) {
  return treinos.prescricoes
    .filter((p) => p.studentId === studentId && Boolean(p.arquivado) === arquivadas)
    .sort((a, b) => String(b.criadoEm || '').localeCompare(String(a.criadoEm || '')));
}

// Copia profunda com ids novos: um modelo aplicado a dois alunos tem de dar
// duas prescrições independentes, senão editar uma mexia na outra.
function clonarTreinos(lista) {
  return (lista || []).map((t) => ({
    ...t,
    id: uid(),
    exercicios: (t.exercicios || []).map((ex) => ({ ...ex, id: uid() })),
  }));
}

// Quantos exercicios tem o programa todo. Serve de resumo na ficha do aluno.
function contarExercicios(prescricao) {
  return (prescricao.treinos || []).reduce((s, t) => s + (t.exercicios || []).length, 0);
}

/* ============================== HELPERS ============================== */

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
function currency(v) { return (Number(v) || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }); }
function siriFat(d) { return d > 0 ? (495 / d) - 450 : null; }

function monthKeyOf(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function studentGross(student, monthKey) {
  const mode = student.paymentMode || 'mensal';
  if (mode === 'quinzenal') return (Number(student.biweeklyValue) || 0) * 2;
  if (mode === 'quinzenas_pagas') {
    const mk = monthKey || monthKeyOf(new Date());
    const marks = (student.quinzenasPagas && student.quinzenasPagas[mk]) || [false, false, false, false];
    const paidCount = marks.filter(Boolean).length;
    return (Number(student.biweeklyValue) || 0) * paidCount;
  }
  return Number(student.planValue) || 0;
}

function studentFinance(student, monthKey) {
  const gross = studentGross(student, monthKey);
  const tax = (gross * (Number(student.taxPercent) || 0)) / 100;
  const gymFee = student.gymFeeType === 'fixed' ? (Number(student.gymFeeValue) || 0) : (gross * (Number(student.gymFeeValue) || 0)) / 100;
  const net = gross - tax - gymFee;
  return { gross, tax, gymFee, net };
}

// A receita dos alunos é DERIVADA das fichas dos alunos, não gravada como
// lançamento. Assim nunca duplica, e atualiza-se sozinha quando um aluno é
// criado, editado, desativado ou removido. Painel e Finanças usam esta função,
// para mostrarem sempre o mesmo valor.
function studentsNetForMonth(students, monthKey) {
  return (students || [])
    .filter((s) => s.active)
    .reduce((sum, s) => sum + studentFinance(s, monthKey).net, 0);
}

function autoStudentRevenueTx(students, monthKey, monthStartIso) {
  const net = studentsNetForMonth(students, monthKey);
  if (net <= 0) return null;
  return {
    id: `auto-alunos-${monthKey}`,
    type: 'entrada',
    description: 'Receita líquida de alunos',
    category: 'rendimento_pt',
    amount: net,
    date: monthStartIso,
    status: 'concluido',
    auto: true,
  };
}

// Lançamentos do mês já com a entrada automática dos alunos incluída.
function monthTransactions(finances, students, year, month) {
  const monthStart = fmtDateISO(new Date(year, month, 1));
  const monthEnd = fmtDateISO(new Date(year, month + 1, 0));
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const real = (finances || []).filter((t) => t.date >= monthStart && t.date <= monthEnd);
  const auto = autoStudentRevenueTx(students, monthKey, monthStart);
  return auto ? [auto, ...real] : real;
}

// Plural correto em vez de "avaliação(ões)" / "aluno(s)".
function plural(count, singular, pluralForm) {
  return `${count} ${Number(count) === 1 ? singular : pluralForm}`;
}

// Ordenação alfabética portuguesa: ignora maiúsculas e ordena acentos
// corretamente (Álvaro antes de Ana, Óscar depois de Marta).
const PT_COLLATOR = new Intl.Collator('pt', { sensitivity: 'base', numeric: true });
function byNamePt(a, b) {
  return PT_COLLATOR.compare(a || '', b || '');
}

/* ============================== FALTAS E REPOSIÇÕES ============================== */

const FALTA_MOTIVOS = ['Doença', 'Lesão', 'Trabalho', 'Viagem', 'Compromisso pessoal', 'Sem aviso', 'Outro'];

// Limiares de alerta (confirmados com o utilizador).
const ALERTA_REPOSICOES_PENDENTES = 3;
const ALERTA_FALTAS_DIAS = 30;
const ALERTA_FALTAS_NO_PERIODO = 3;

const REPOSICAO_ESTADOS = {
  na: { id: 'na', label: 'Sem reposição', color: '#8C8C8C' },
  pendente: { id: 'pendente', label: 'Pendente', color: '#D6534A' },
  agendada: { id: 'agendada', label: 'Agendada', color: '#F5B44C' },
  concluida: { id: 'concluida', label: 'Concluída', color: '#5FBFA0' },
};

function isFalta(session) {
  return session.status === 'falta' && session.kind !== 'evento';
}

// Faltas anteriores a esta funcionalidade não têm o campo definido. Nessas,
// assume-se que dão direito a reposição — que é o comportamento antigo.
function faltaPrecisaReposicao(falta) {
  return falta.faltaPrecisaReposicao === undefined ? true : Boolean(falta.faltaPrecisaReposicao);
}

// O estado NÃO é guardado: é derivado da aula de reposição ligada, para não
// haver dois valores a dessincronizar.
function reposicaoEstadoDe(falta, sessions) {
  if (!faltaPrecisaReposicao(falta)) return REPOSICAO_ESTADOS.na;
  if (!falta.reposicaoSessionId) return REPOSICAO_ESTADOS.pendente;
  const rep = sessions.find((s) => s.id === falta.reposicaoSessionId);
  if (!rep) return REPOSICAO_ESTADOS.pendente;
  if (rep.status === 'realizado') return REPOSICAO_ESTADOS.concluida;
  // Se a própria reposição falhou ou foi cancelada, a dívida continua por saldar.
  if (rep.status === 'falta' || rep.status === 'cancelado') return REPOSICAO_ESTADOS.pendente;
  return REPOSICAO_ESTADOS.agendada;
}

function faltasDoAluno(studentId, sessions) {
  return sessions
    .filter((s) => s.studentId === studentId && isFalta(s))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function pendingFaltas(studentId, sessions) {
  return faltasDoAluno(studentId, sessions)
    .filter((f) => reposicaoEstadoDe(f, sessions).id === 'pendente')
    .length;
}

// Próxima reposição agendada (data futura mais próxima) de um aluno.
function proximaReposicao(studentId, sessions) {
  const hoje = fmtDateISO(new Date());
  return sessions
    .filter((s) => s.studentId === studentId && s.type === 'reposicao'
      && s.status === 'agendado' && s.date >= hoje)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))[0] || null;
}

function alertaFaltas(studentId, sessions) {
  const faltas = faltasDoAluno(studentId, sessions);
  const pendentes = faltas.filter((f) => reposicaoEstadoDe(f, sessions).id === 'pendente').length;
  const limite = new Date();
  limite.setDate(limite.getDate() - ALERTA_FALTAS_DIAS);
  const limiteIso = fmtDateISO(limite);
  const recentes = faltas.filter((f) => f.date >= limiteIso).length;
  if (pendentes >= ALERTA_REPOSICOES_PENDENTES) {
    return { ativo: true, motivo: `${plural(pendentes, 'reposição pendente', 'reposições pendentes')}` };
  }
  if (recentes >= ALERTA_FALTAS_NO_PERIODO) {
    return { ativo: true, motivo: `${plural(recentes, 'falta', 'faltas')} em ${ALERTA_FALTAS_DIAS} dias` };
  }
  return { ativo: false, motivo: '' };
}

// Emparelha faltas e reposições antigas, que não têm ligação entre si. Sem isto,
// ao passar a contar por ligação os contadores saltavam e todos os alunos
// pareciam dever mais aulas. Só toca em faltas legado (campo por definir).
function migrarFaltasLegado(sessions) {
  const legado = sessions.filter((s) => isFalta(s) && s.faltaPrecisaReposicao === undefined);
  if (legado.length === 0) return { sessions, migradas: 0 };

  const usadas = new Set(sessions.map((s) => s.reposicaoSessionId).filter(Boolean));
  const porAluno = {};
  legado.forEach((f) => {
    (porAluno[f.studentId] = porAluno[f.studentId] || []).push(f);
  });

  const ligacoes = {};
  Object.entries(porAluno).forEach(([studentId, faltas]) => {
    const reposicoesLivres = sessions
      .filter((s) => s.studentId === studentId && s.type === 'reposicao'
        && s.status !== 'cancelado' && !s.reposicaoDeSessionId && !usadas.has(s.id))
      .sort((a, b) => a.date.localeCompare(b.date));
    faltas
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((f) => {
        const rep = reposicoesLivres.shift();
        if (rep) { ligacoes[f.id] = rep.id; usadas.add(rep.id); }
      });
  });

  const inverso = {};
  Object.entries(ligacoes).forEach(([faltaId, repId]) => { inverso[repId] = faltaId; });

  const next = sessions.map((s) => {
    if (isFalta(s) && s.faltaPrecisaReposicao === undefined) {
      return {
        ...s,
        faltaMotivo: s.faltaMotivo || '',
        faltaObs: s.faltaObs || '',
        faltaJustificada: false,
        faltaPrecisaReposicao: true,
        reposicaoSessionId: ligacoes[s.id] || null,
      };
    }
    if (inverso[s.id]) return { ...s, reposicaoDeSessionId: inverso[s.id] };
    return s;
  });
  return { sessions: next, migradas: legado.length };
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

// Calcula a % de gordura pelo protocolo de dobras escolhido, usando o sexo do aluno e a idade da avaliação.
function calcFoldBodyFat(form, sex) {
  const protocol = FOLD_PROTOCOLS.find((p) => p.id === form.assessProtocol);
  if (!protocol) return null;
  const sexKey = sex === 'F' ? 'F' : 'M';
  const sites = protocol.sites[sexKey];
  const sum = sites.reduce((s, id) => s + (parseFloat(form[id]) || 0), 0);
  if (sum <= 0) return null;
  const age = parseFloat(form.assessAge);
  if (protocol.needsAge && !age) return null;
  const result = protocol.calc(sum, age, sexKey);
  return typeof result === 'number' && !Number.isNaN(result) ? result : null;
}

// Gera as ocorrencias de uma serie. Devolve null quando nao ha repeticao, para
// o chamador seguir o caminho de sessao unica.
//   plano = { semanas }                    -> repete semanalmente na mesma hora
//   plano = { semanas, dias, horas }       -> produto de dias da semana x horas
function gerarSerie(base, plano) {
  if (!plano || !plano.semanas || plano.semanas < 1) return null;
  const semanas = Math.min(52, Math.max(1, plano.semanas));
  const dias = Array.isArray(plano.dias) && plano.dias.length ? plano.dias : null;
  const horas = Array.isArray(plano.horas) && plano.horas.length
    ? plano.horas
    : [{ inicio: base.startTime, fim: base.endTime }];

  // Sem dias escolhidos e com uma so hora, e a repeticao semanal simples.
  if (!dias && horas.length === 1 && semanas < 2) return null;

  const seriesId = uid();
  const inicioIso = base.date;
  const semanaBase = startOfWeek(new Date(`${inicioIso}T00:00:00`));
  const saida = [];

  for (let w = 0; w < semanas; w += 1) {
    const offsetsDia = dias
      // startOfWeek devolve segunda-feira; getDay() tem domingo a 0.
      ? dias.map((d) => (d === 0 ? 6 : d - 1))
      : [Math.round((new Date(`${inicioIso}T00:00:00`) - semanaBase) / 86400000)];
    for (const off of offsetsDia) {
      const iso = fmtDateISO(addDays(semanaBase, w * 7 + off));
      // Nao criar no passado relativo a data escolhida: se o utilizador marcou
      // quarta e pediu tambem segunda, a segunda dessa semana ja passou.
      if (iso < inicioIso) continue;
      for (const h of horas) {
        saida.push({
          ...base,
          id: uid(),
          date: iso,
          startTime: h.inicio,
          endTime: h.fim,
          seriesId,
        });
      }
    }
  }
  if (saida.length === 0) return null;
  // A primeira ocorrencia herda o id que o formulario ja tinha, para nao perder
  // ligacoes (por exemplo, a reposicao apontada por uma falta).
  saida[0].id = base.id;
  return saida;
}

// Duas sessoes chocam quando sao no mesmo dia e os intervalos se cruzam.
function sessoesChocam(a, b) {
  if (a.date !== b.date) return false;
  return minutosDe(a.startTime) < minutosDe(b.endTime) && minutosDe(b.startTime) < minutosDe(a.endTime);
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

function categoryFor(type, categoryId, customCategories) {
  const list = type === 'entrada'
    ? [...INCOME_CATEGORIES, ...((customCategories && customCategories.income) || [])]
    : [...EXPENSE_CATEGORIES, ...((customCategories && customCategories.expense) || [])];
  return list.find((c) => c.id === categoryId) || list[list.length - 1];
}
// Um ícone é um componente React e NÃO sobrevive a JSON.stringify: as categorias
// personalizadas eram gravadas com o componente e voltavam do armazenamento como
// {}, fazendo o React rebentar ao renderizá-las (erro #130). Validar sempre antes
// de usar, e cair no ícone genérico quando o valor não for renderizável.
function iconOf(candidate, fallback = Tag) {
  if (typeof candidate === 'function') return candidate;
  if (candidate && typeof candidate === 'object' && candidate.$$typeof) return candidate;
  return fallback;
}

function sessionTypeFor(typeId, customCategories) {
  const list = [...SESSION_TYPES, ...((customCategories && customCategories.sessionTypes) || [])];
  return list.find((t) => t.id === typeId) || SESSION_TYPES[0];
}
function eventTypeFor(typeId, customCategories) {
  const list = [...EVENT_TYPES, ...((customCategories && customCategories.eventTypes) || [])];
  return list.find((t) => t.id === typeId) || EVENT_TYPES[0];
}
function statusLabel(type, status) {
  if (type === 'entrada') return status === 'concluido' ? 'Recebido' : 'Previsto';
  return status === 'concluido' ? 'Pago' : 'Pendente';
}

function downloadBackup(students, sessions, finances, photos, customCategories) {
  const data = { exportedAt: new Date().toISOString(), alunos: students, agenda: sessions, financas: finances, fotos: photos, categorias: customCategories };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ptmanager-backup-${fmtDateISO(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function resizePhoto(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o ficheiro.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao carregar a imagem.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * (maxDim / width)); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * (maxDim / height)); height = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
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
    if (!userId) throw new Error('Utilizador não autenticado.');
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

async function readSubscriptionStatus() {
  if (!supabaseConfigured || !supabase) return { active: true, status: 'local' };
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email?.toLowerCase() || '';
  if (CREATOR_ACTIVE_PLAN_EMAILS.includes(email)) {
    return {
      active: true, status: 'creator', tier: 'vitalicio', value: 0, interval: 'Vitalício',
      currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false,
      paymentMethodBrand: null, paymentMethodLast4: null, stripeCustomerId: null,
      stripeSubscriptionId: null, lastPaymentStatus: 'creator', updatedAt: null,
    };
  }
  if (import.meta.env.DEV && DEV_ACTIVE_PLAN_EMAILS.includes(email)) {
    return {
      active: true, status: 'dev_override', tier: 'mensal', value: null, interval: 'Mensal',
      currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false,
      paymentMethodBrand: null, paymentMethodLast4: null, stripeCustomerId: null,
      stripeSubscriptionId: null, lastPaymentStatus: 'dev_override', updatedAt: null,
    };
  }
  const userId = await currentSupabaseUserId();
  if (!userId) return { active: false, status: 'signed_out' };
  const { data, error } = await supabase
    .from('personal_subscriptions')
    .select('plan_status, plan_tier, plan_value, billing_interval, current_period_start, current_period_end, cancel_at_period_end, payment_method_brand, payment_method_last4, stripe_customer_id, stripe_subscription_id, last_payment_status, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  const status = data?.plan_status || 'inactive';
  const periodEnd = data?.current_period_end || null;
  const expired = periodEnd ? new Date(periodEnd).getTime() < Date.now() : false;
  const active = status === 'active' && !expired;
  return {
    active,
    status: expired && status === 'active' ? 'expired' : status,
    tier: data?.plan_tier || null,
    value: data?.plan_value ?? null,
    interval: data?.billing_interval || null,
    currentPeriodStart: data?.current_period_start || null,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: Boolean(data?.cancel_at_period_end),
    paymentMethodBrand: data?.payment_method_brand || null,
    paymentMethodLast4: data?.payment_method_last4 || null,
    stripeCustomerId: data?.stripe_customer_id || null,
    stripeSubscriptionId: data?.stripe_subscription_id || null,
    lastPaymentStatus: data?.last_payment_status || null,
    updatedAt: data?.updated_at || null,
  };
}

/* ============================== GLOBAL STYLES ============================== */

function GlobalStyles() {
  return (
    <style>{`
      :root {
        color-scheme: dark;
        /* Superfícies em camadas: base < surface < elevated. */
        --bg-base: #0A0B0D;
        --bg-surface: #131519;
        --bg-elevated: #1B1E24;
        --bg-inset: #0D0F12;
        --border-hair: #262A31;
        --border-strong: #363C45;
        /* text-faint sobe de #636363 (3.1:1, reprovava) para 4.9:1. */
        --text-primary: #F2F4F7;
        --text-muted: #A0A6B0;
        --text-faint: #7C838F;
        --on-accent: #05181C;
        --brass: #1EA6B4;
        --brass-soft: rgba(30, 166, 180, 0.13);
        --rust: #D6534A;
        --rust-soft: rgba(214, 83, 74, 0.13);
        /* Dourado reservado a ofertas/recompensas. Vermelho lê-se como alerta e
           trabalha contra a vontade de comprar; este destaca-se do turquesa. */
        --gold: #F5B44C;
        --gold-soft: rgba(245, 180, 76, 0.14);
        --slate-acc: #8C8C8C;
        --sky: #5FC4D0;
        --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.45);
        --shadow-md: 0 6px 16px -6px rgba(0, 0, 0, 0.6);
        --shadow-lg: 0 20px 48px -16px rgba(0, 0, 0, 0.72);
        --dur: 160ms;
        --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
      }

      * { box-sizing: border-box; }
      html {
        background-color: var(--bg-base);
        margin: 0;
        overflow-x: hidden;
        -webkit-text-size-adjust: 100%;
      }
      body {
        background-color: var(--bg-base);
        margin: 0;
        min-width: 0;
        overscroll-behavior-y: none;
      }
      #root {
        min-height: 100dvh;
        width: 100%;
      }
      img, svg, canvas, video { max-width: 100%; }
      h1, h2, h3, p, span, button, a, td, th { overflow-wrap: anywhere; }
      /* Números, horas e valores nunca devem partir a meio ("07:00" virava
         "07" / ":0" / "0" em colunas estreitas). break-all continua a funcionar
         onde é pedido explicitamente (IDs longos da Stripe). */
      .font-mono { overflow-wrap: normal; }
      .nowrap { white-space: nowrap; }

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

      .bg-inset { background-color: var(--bg-inset); }
      .border-strong { border-color: var(--border-strong); }
      .shadow-card { box-shadow: var(--shadow-sm); }
      .shadow-float { box-shadow: var(--shadow-md); }

      /* Cartão de superfície: um único nível de elevação, sem cartão dentro de cartão. */
      .card {
        background-color: var(--bg-surface);
        border: 1px solid var(--border-hair);
        border-radius: 12px;
        box-shadow: var(--shadow-sm);
      }
      .card-hover { transition: border-color var(--dur) var(--ease), background-color var(--dur) var(--ease), transform var(--dur) var(--ease); }
      .card-hover:hover { border-color: var(--border-strong); background-color: var(--bg-elevated); }
      .card-hover:active { transform: scale(0.995); }

      .btn-surface { transition: background-color var(--dur) var(--ease), border-color var(--dur) var(--ease), color var(--dur) var(--ease); }
      .btn-surface:hover { background-color: var(--bg-elevated); border-color: var(--border-strong); }
      .link-sky { color: var(--brass); transition: opacity var(--dur) var(--ease); background: none; border: none; cursor: pointer; padding: 0; }
      .link-sky:hover { opacity: 0.75; text-decoration: underline; }

      /* Vocabulário de botões partilhado por todos os ecrãs. */
      .btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        border-radius: 9px; font-size: 14px; font-weight: 500; line-height: 1;
        padding: 10px 14px; border: 1px solid transparent; cursor: pointer;
        font-family: inherit; white-space: nowrap;
        transition: background-color var(--dur) var(--ease), border-color var(--dur) var(--ease), color var(--dur) var(--ease), opacity var(--dur) var(--ease);
      }
      .btn:disabled { opacity: 0.55; cursor: not-allowed; }
      .btn-primary { background-color: var(--brass); color: var(--on-accent); font-weight: 600; }
      .btn-primary:hover:not(:disabled) { background-color: #23BCCC; }
      .btn-ghost { background-color: transparent; border-color: var(--border-hair); color: var(--text-muted); }
      .btn-ghost:hover:not(:disabled) { background-color: var(--bg-elevated); border-color: var(--border-strong); color: var(--text-primary); }
      .btn-danger { background-color: var(--rust-soft); border-color: var(--rust); color: var(--rust); }
      .btn-danger:hover:not(:disabled) { background-color: rgba(214, 83, 74, 0.22); }

      /* Definições: ecrã inteiro no telemóvel, painel centrado a partir de sm. */
      .settings-panel { height: 100%; max-height: 100dvh; }
      @media (min-width: 640px) {
        .settings-panel { max-height: min(92dvh, 680px); }
      }

      .badge {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 3px 8px; border-radius: 999px;
        font-size: 0.6875rem; line-height: 1.1; font-weight: 500; white-space: nowrap;
      }

      .input-field {
        width: 100%;
        background-color: var(--bg-inset);
        border: 1px solid var(--border-hair);
        border-radius: 9px;
        padding: 10px 12px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        color: var(--text-primary);
        outline: none;
        transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
      }
      .input-field:hover:not(:focus) { border-color: var(--border-strong); }
      .input-field:focus { border-color: var(--brass); box-shadow: 0 0 0 3px var(--brass-soft); }
      .input-field::placeholder { color: var(--text-faint); }
      select.input-field { cursor: pointer; }

      button, a, input, select, textarea { min-width: 0; }
      button, a { touch-action: manipulation; }
      button { font-family: inherit; }
      button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, [tabindex]:focus-visible {
        outline: 2px solid var(--brass);
        outline-offset: 2px;
      }

      ::-webkit-scrollbar { height: 8px; width: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: #454C57; }
      ::selection { background: var(--brass-soft); color: var(--text-primary); }

      @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      .animate-in { animation: fadeSlideIn 0.2s ease-out; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .spin { animation: spin 0.8s linear infinite; }

      input[type="date"]::-webkit-calendar-picker-indicator,
      input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.8); cursor: pointer; }

      input[type="color"] { -webkit-appearance: none; border: none; padding: 0; background: none; cursor: pointer; }
      input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
      input[type="color"]::-webkit-color-swatch { border: 2px solid var(--border-hair); border-radius: 999px; }

      @media (max-width: 640px) {
        /* 16px evita o zoom automático do iOS ao focar um campo. */
        .input-field { font-size: 16px; }
        /* Espaço para a barra de navegação fixa no fundo (56px + safe-area). */
        .pb-nav { padding-bottom: calc(56px + 20px + env(safe-area-inset-bottom)); }
        .toast-pos { bottom: calc(56px + 16px + env(safe-area-inset-bottom)); }
        /* Grelhas de 3 colunas caem para 2 (não para 1): mantém a leitura
           comparativa dos números sem os empilhar numa coluna interminável. */
        .grid.grid-cols-3 {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        .max-w-6xl,
        .max-w-5xl,
        .max-w-4xl,
        .max-w-2xl {
          max-width: 100%;
        }
        .px-4 { padding-left: 14px; padding-right: 14px; }
        .py-4 { padding-top: 14px; padding-bottom: 14px; }
        .rounded-xl { border-radius: 10px; }
        .text-3xl { font-size: 1.75rem; line-height: 2.15rem; }
        .mobile-stack {
          flex-direction: column !important;
          align-items: stretch !important;
        }
        .mobile-stack > * {
          width: 100%;
          justify-content: center;
        }
      }

      @media (max-width: 420px) {
        .grid.grid-cols-7.gap-1 { gap: 3px; }
        .aspect-square { min-height: 42px; }
        .text-xl { font-size: 1.125rem; line-height: 1.6rem; }
        .text-lg { font-size: 1rem; line-height: 1.5rem; }
        .px-5 { padding-left: 16px; padding-right: 16px; }
        .p-5 { padding: 16px; }
      }

      @media (min-width: 641px) and (max-width: 1024px) {
        .lg\\:grid-cols-6 {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
        .lg\\:grid-cols-5 {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
        .lg\\:grid-cols-3 {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }

      /* Arrastar: o cursor muda em toda a pagina e o texto deixa de selecionar,
         senao o arrasto pinta seleccao pelo caminho. */
      body.a-arrastar { cursor: grabbing !important; user-select: none; }
      body.a-arrastar * { cursor: grabbing !important; }
      .dia-alvo {
        outline: 2px dashed var(--brass);
        outline-offset: 2px;
        background-color: var(--brass-soft) !important;
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
      }

      /* ===================== IMPRESSAO / EXPORTACAO PDF =====================
         A folha vive fora do ecra ate a impressao comecar. Ao imprimir, tudo o
         que e aplicacao desaparece e so a folha ocupa a pagina, a preto sobre
         branco -- o tema escuro gastaria tinta e sairia ilegivel. */
      .print-sheet { position: absolute; left: -10000px; top: 0; width: 190mm; }

      @media print {
        @page { size: A4; margin: 14mm 14mm 16mm; }

        html, body, #root {
          background: #fff !important;
          height: auto !important;
          overflow: visible !important;
        }
        /* Esconde a aplicacao inteira; a folha volta a aparecer logo abaixo. */
        body > *:not(.print-root), .app-chrome { display: none !important; }
        .print-root { display: block !important; }

        .print-sheet {
          position: static !important;
          left: auto !important;
          width: auto !important;
          color: #111 !important;
          background: #fff !important;
          font-family: ui-sans-serif, system-ui, sans-serif;
        }
        .print-sheet * { color: inherit; background: transparent; }

        .print-head {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding-bottom: 10px; margin-bottom: 18px;
          border-bottom: 2px solid #111;
        }
        .print-brand { font-size: 19pt; font-weight: 700; letter-spacing: -0.02em; }
        .print-brand span { font-weight: 400; color: #555 !important; }
        .print-by { text-align: right; font-size: 9pt; line-height: 1.45; color: #444 !important; }
        .print-by strong { font-size: 10.5pt; color: #111 !important; }

        .print-title { font-size: 15pt; font-weight: 700; margin: 0 0 2px; }
        .print-sub { font-size: 9.5pt; color: #555 !important; margin-bottom: 16px; }

        .print-section { margin-bottom: 15px; break-inside: avoid; }
        .print-section h3 {
          font-size: 8pt; text-transform: uppercase; letter-spacing: 0.09em;
          color: #666 !important; margin: 0 0 6px; padding-bottom: 3px;
          border-bottom: 1px solid #ccc;
        }

        .print-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px 18px; }
        .print-field { display: flex; justify-content: space-between; gap: 8px; font-size: 9.5pt; padding: 2.5px 0; border-bottom: 1px dotted #ddd; }
        .print-field dt { color: #555 !important; }
        .print-field dd { margin: 0; font-weight: 600; white-space: nowrap; }

        .print-highlight { display: flex; gap: 10px; margin-bottom: 15px; break-inside: avoid; }
        .print-kpi { flex: 1; border: 1px solid #bbb; border-radius: 5px; padding: 8px 11px; }
        .print-kpi dt { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.08em; color: #666 !important; }
        .print-kpi dd { margin: 2px 0 0; font-size: 16pt; font-weight: 700; }

        .print-photos { display: flex; gap: 8px; flex-wrap: wrap; }
        .print-photos img { width: 42mm; height: auto; border: 1px solid #ccc; border-radius: 3px; }

        .print-notes { font-size: 9.5pt; line-height: 1.5; white-space: pre-wrap; }

        .print-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
        .print-table th {
          text-align: left; font-size: 7.5pt; text-transform: uppercase;
          letter-spacing: 0.07em; color: #666 !important; font-weight: 600;
          border-bottom: 1px solid #999; padding: 4px 6px;
        }
        .print-table td { padding: 5px 6px; border-bottom: 1px solid #e2e2e2; vertical-align: top; }
        .print-table .num { text-align: right; white-space: nowrap; }
        .print-ex-nota { font-size: 8.5pt; color: #555 !important; margin-top: 2px; line-height: 1.4; }
        .print-assinatura {
          border-bottom: 1px solid #111; width: 70mm; height: 14mm; margin-bottom: 4px;
        }

        .print-foot {
          margin-top: 20px; padding-top: 8px; border-top: 1px solid #ccc;
          font-size: 8pt; color: #666 !important;
          display: flex; justify-content: space-between; gap: 12px;
        }
        .print-page-break { break-before: page; }
        .recharts-surface { overflow: visible; }
      }
    `}</style>
  );
}

/* ============================== ERROR BOUNDARY ============================== */

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Erro no PTMANAGER:', error, info); }
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
          <button onClick={() => this.setState({ error: null })} type="button" className="px-4 py-2 rounded-lg text-sm font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0A0A0A' }}>
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

function Modal({ title, onClose, children, onBack }) {
  // Esc fecha o modal — teclado deve conseguir sair sem rato.
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center animate-in px-0 sm:px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)', zIndex: 40 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="border border-hair rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-surface)', maxHeight: 'min(92dvh, 760px)', paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-hair sticky top-0" style={{ backgroundColor: 'var(--bg-surface)', zIndex: 1 }}>
          <div className="flex items-center gap-2 min-w-0">
            {onBack && <button onClick={onBack} type="button" className="p-1.5 rounded-lg btn-surface flex-shrink-0" aria-label="Voltar"><ArrowLeft size={16} className="text-muted" style={{ display: 'block' }} /></button>}
            <h2 className="font-display font-semibold text-lg text-primary truncate">{title}</h2>
          </div>
          <button onClick={onClose} type="button" className="p-1.5 rounded-lg btn-surface flex-shrink-0" aria-label="Fechar">
            <X size={18} className="text-muted" style={{ display: 'block' }} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// `confirmLabel` e `tone` sao opcionais e mantem o comportamento antigo por
// omissao: a caixa nasceu para eliminar, mas tambem confirma acoes que criam --
// e ai um botao vermelho a dizer "Eliminar" seria mentira.
function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Eliminar', tone = 'rust' }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onCancel(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 animate-in" style={{ backgroundColor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(3px)', zIndex: 50 }} onClick={onCancel} role="alertdialog" aria-modal="true" aria-label={title}>
      <div onClick={(e) => e.stopPropagation()} className="border border-hair rounded-2xl w-full max-w-sm p-5" style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-lg)' }}>
        <h3 className="font-display font-semibold text-base text-primary mb-2">{title}</h3>
        <p className="text-sm text-muted font-body mb-5">{message}</p>
        <div className="flex gap-2 justify-end mobile-stack">
          <button onClick={onCancel} type="button" className="btn btn-ghost">Cancelar</button>
          <button onClick={onConfirm} type="button" className="btn" style={{ backgroundColor: `var(--${tone})`, color: 'var(--on-accent)', fontWeight: 600 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div className="fixed bottom-5 toast-pos left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg border font-body text-sm flex items-center gap-2 animate-in" role="status" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: isError ? 'var(--rust)' : 'var(--brass)', color: 'var(--text-primary)', zIndex: 60, maxWidth: '90vw', boxShadow: 'var(--shadow-lg)' }}>
      {isError ? <AlertTriangle size={15} className="text-rust" style={{flexShrink:0}} /> : <CheckCircle2 size={15} className="text-brass" style={{flexShrink:0}} />}
      <span className="truncate">{toast.msg}</span>
    </div>
  );
}

function EmptyState({ message, cta, onCta, icon: Icon = Info, hint }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <span className="rounded-xl p-3 mb-3.5" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-hair)' }}>
        <Icon size={22} className="text-faint" style={{ display: 'block' }} />
      </span>
      <p className="text-sm text-primary font-body max-w-xs font-medium">{message}</p>
      {hint && <p className="text-xs text-faint font-body max-w-sm mt-1.5">{hint}</p>}
      {cta && (
        <button onClick={onCta} type="button" className="btn mt-4" style={{ backgroundColor: 'var(--brass-soft)', borderColor: 'var(--brass)', color: 'var(--brass)' }}>
          {cta}
        </button>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-4">
      <img src={LOGO_SRC} alt="PTMANAGER" style={{ width: 64, height: 64 }} />
      <Loader2 size={24} className="text-brass spin" />
      <span className="font-body text-sm text-muted">A carregar...</span>
    </div>
  );
}

function DeveloperCredit() {
  return (
    <div className="px-4 py-4 text-center text-2xs font-body text-faint" style={{ opacity: 0.55 }}>
      Developed by Marcelo Fonseca
    </div>
  );
}

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_SECONDS = 60;

function loginAttemptKey(email) {
  return `ptmanager_login_attempts_${email.trim().toLowerCase()}`;
}

function getLoginAttemptState(email) {
  if (!email || typeof window === 'undefined') return { count: 0, lockedUntil: 0 };
  try {
    const raw = window.localStorage.getItem(loginAttemptKey(email));
    if (!raw) return { count: 0, lockedUntil: 0 };
    const parsed = JSON.parse(raw);
    return { count: parsed.count || 0, lockedUntil: parsed.lockedUntil || 0 };
  } catch (e) {
    return { count: 0, lockedUntil: 0 };
  }
}

function setLoginAttemptState(email, state) {
  if (!email || typeof window === 'undefined') return;
  try { window.localStorage.setItem(loginAttemptKey(email), JSON.stringify(state)); } catch (e) { /* localStorage indisponível */ }
}

function clearLoginAttemptState(email) {
  if (!email || typeof window === 'undefined') return;
  try { window.localStorage.removeItem(loginAttemptKey(email)); } catch (e) { /* localStorage indisponível */ }
}

function LoginScreen({ onBack, initialMode = 'signin' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState(initialMode);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReset, setCaptchaReset] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalDoc, setLegalDoc] = useState(null);

  useEffect(() => {
    if (mode !== 'signin' || !email) return;
    const attempt = getLoginAttemptState(email);
    if (attempt.lockedUntil > Date.now()) { setLockedUntil(attempt.lockedUntil); setNow(Date.now()); }
  }, [email, mode]);

  useEffect(() => {
    if (!lockedUntil) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lockedUntil]);

  useEffect(() => {
    if (lockedUntil && Date.now() >= lockedUntil) setLockedUntil(0);
  }, [now, lockedUntil]);

  const secondsLeft = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - now) / 1000)) : 0;
  const isLocked = secondsLeft > 0;

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    if (!supabase) {
      setMessage('Supabase não configurado.');
      return;
    }
    if (!email || !password) {
      setMessage('Introduza o e-mail e a palavra-passe.');
      return;
    }
    // Consentimento obrigatório no registo (não no início de sessão).
    if (mode === 'signup' && !acceptedTerms) {
      setMessage('Para criar conta, tem de aceitar os Termos e a Política de Privacidade.');
      return;
    }
    if (mode === 'signin') {
      const attempt = getLoginAttemptState(email);
      if (attempt.lockedUntil > Date.now()) {
        setLockedUntil(attempt.lockedUntil);
        setNow(Date.now());
        return;
      }
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setMessage('Confirme que não é um robô.');
      return;
    }
    setBusy(true);
    const options = captchaToken ? { captchaToken } : undefined;
    const action = mode === 'signup'
      ? supabase.auth.signUp({ email, password, options })
      : supabase.auth.signInWithPassword({ email, password, options });
    const { error } = await action;
    setCaptchaToken('');
    setCaptchaReset((n) => n + 1);
    if (error) {
      setMessage(error.message);
      if (mode === 'signin') {
        const attempt = getLoginAttemptState(email);
        const count = attempt.count + 1;
        if (count >= LOGIN_MAX_ATTEMPTS) {
          const until = Date.now() + LOGIN_LOCKOUT_SECONDS * 1000;
          setLoginAttemptState(email, { count: 0, lockedUntil: until });
          setLockedUntil(until);
          setNow(Date.now());
        } else {
          setLoginAttemptState(email, { count, lockedUntil: 0 });
        }
      }
    } else if (mode === 'signup') {
      setMessage('Conta criada. Se o Supabase pedir confirmação, verifique seu e-mail.');
    } else {
      clearLoginAttemptState(email);
      setLockedUntil(0);
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-base flex flex-col px-4">
      <div className="flex-1 flex items-center justify-center">
      <form onSubmit={submit} className="bg-surface border border-hair rounded-xl p-5 w-full max-w-sm flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_SRC} alt="PTMANAGER" style={{ width: 34, height: 34, flexShrink: 0 }} />
            <span className="font-display font-semibold text-xl tracking-wide text-primary">PT<span style={{ color: 'var(--brass)' }}>MANAGER</span></span>
          </div>
          {onBack && (
            <button type="button" onClick={onBack} className="text-xs font-body link-sky flex-shrink-0">Voltar</button>
          )}
        </div>
        <div>
          <h1 className="font-display text-lg font-semibold text-primary">{mode === 'signup' ? 'Criar acesso' : 'Entrar no painel'}</h1>
          <p className="text-xs font-body text-muted mt-1">Inicie sessão para aceder ao seu CRM de alunos, agenda, avaliações e finanças.</p>
        </div>
        <FormField label="E-mail">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="voce@email.com" />
        </FormField>
        <FormField label="Palavra-passe">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Mínimo 6 caracteres" />
        </FormField>
        {mode === 'signup' && (
          <label className="flex items-start gap-2.5 text-xs font-body text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => { setAcceptedTerms(e.target.checked); setMessage(''); }}
              style={{ accentColor: 'var(--brass)', marginTop: 2, flexShrink: 0, width: 16, height: 16 }}
            />
            <span>
              Li e aceito os{' '}
              <button type="button" onClick={() => setLegalDoc('termos')} className="link-sky" style={{ fontSize: 'inherit' }}>Termos de Utilização</button>
              {' '}e a{' '}
              <button type="button" onClick={() => setLegalDoc('privacidade')} className="link-sky" style={{ fontSize: 'inherit' }}>Política de Privacidade</button>.
            </span>
          </label>
        )}
        {TURNSTILE_SITE_KEY && !isLocked && (
          <Turnstile siteKey={TURNSTILE_SITE_KEY} onVerify={setCaptchaToken} resetSignal={captchaReset} />
        )}
        {isLocked ? (
          <div className="text-xs font-body text-rust">Muitas tentativas de login. Tente novamente em {secondsLeft}s.</div>
        ) : message && <div className="text-xs font-body text-rust">{message}</div>}
        <button
          type="submit"
          disabled={busy || isLocked || (Boolean(TURNSTILE_SITE_KEY) && !captchaToken) || (mode === 'signup' && !acceptedTerms)}
          className="px-4 py-2.5 rounded-lg text-sm font-body font-medium disabled:opacity-60"
          style={{ backgroundColor: 'var(--brass)', color: 'var(--on-accent)' }}
        >
          {isLocked ? `Aguarde ${secondsLeft}s` : busy ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : 'Entrar'}
        </button>
        <button type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage(''); }} className="text-xs font-body link-sky">
          {mode === 'signup' ? 'Já tenho conta' : 'Criar primeira conta'}
        </button>
      </form>
      </div>
      <div className="flex items-center justify-center gap-3 pb-2 text-2xs font-body">
        <button type="button" onClick={() => setLegalDoc('termos')} className="link-sky">Termos</button>
        <span className="text-faint">·</span>
        <button type="button" onClick={() => setLegalDoc('privacidade')} className="link-sky">Privacidade</button>
      </div>
      <DeveloperCredit />
      {legalDoc && <LegalModal docId={legalDoc} supportEmail={SUPPORT_EMAIL} onClose={() => setLegalDoc(null)} />}
    </div>
  );
}

async function edgeFunctionErrorMessage(error, fallback) {
  if (!error) return fallback;
  const context = error.context;
  if (context && typeof context.json === 'function') {
    try {
      const response = typeof context.clone === 'function' ? context.clone() : context;
      const body = await response.json();
      if (body?.error) return body.error;
    } catch (e) { /* corpo da resposta não era JSON */ }
  }
  return error.message || fallback;
}

function SalesPlansPage({ onSignOut, onRefresh, checkoutReturn }) {
  const supportReady = Boolean(SUPPORT_EMAIL);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  async function startCheckout(planId) {
    setCheckoutError('');
    if (!supabaseConfigured || !supabase) {
      setCheckoutError('Configure o Supabase para ativar pagamentos.');
      return;
    }
    setCheckoutPlan(`card:${planId}`);
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        planId,
        successUrl: `${window.location.origin}?checkout=success`,
        cancelUrl: `${window.location.origin}?checkout=cancelled`,
      },
    });
    setCheckoutPlan(null);
    if (error || !data?.url) {
      setCheckoutError(await edgeFunctionErrorMessage(error, 'Não foi possível iniciar o checkout. Verifique a função no Supabase.'));
      return;
    }
    window.location.href = data.url;
  }

  async function startMbwayCheckout(planId) {
    setCheckoutError('');
    if (!supabaseConfigured || !supabase) {
      setCheckoutError('Configure o Supabase para ativar pagamentos.');
      return;
    }
    setCheckoutPlan(`mbway:${planId}`);
    const { data, error } = await supabase.functions.invoke('create-mbway-checkout-session', {
      body: {
        planId,
        successUrl: `${window.location.origin}?checkout=success`,
        cancelUrl: `${window.location.origin}?checkout=cancelled`,
      },
    });
    setCheckoutPlan(null);
    if (error || !data?.url) {
      setCheckoutError(await edgeFunctionErrorMessage(error, 'Não foi possível iniciar o pagamento MB WAY. Verifique se o MB WAY está ativo na Stripe.'));
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <header className="border-b border-hair bg-surface">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={LOGO_SRC} alt="PTMANAGER" style={{ width: 36, height: 36, flexShrink: 0 }} />
            <span className="font-display font-semibold text-lg tracking-wide text-primary truncate">PT<span style={{ color: 'var(--brass)' }}>MANAGER</span></span>
          </div>
          <button onClick={onSignOut} type="button" className="px-3 py-2 rounded-lg text-xs font-body border border-hair btn-surface text-muted">Sair</button>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 max-w-5xl mx-auto w-full flex flex-col gap-7">
        <section className="flex flex-col gap-3">
          <div className="text-2xs uppercase tracking-wide text-faint font-mono">Planos para personal trainers</div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-primary">Escolha o seu plano para desbloquear o painel</h1>
          <p className="text-sm sm:text-base text-muted font-body max-w-2xl">
            Faça a gestão de alunos, agenda, avaliações físicas, reposições e finanças num só sítio. O pagamento é processado em segurança pela Stripe.
          </p>
          <div className="text-xs text-muted font-body max-w-2xl">
            O cartão mantém a renovação automática. O MB WAY liberta o período escolhido como pagamento único, com renovação manual no fim do prazo.
          </div>
        </section>

        {checkoutError && (
          <div className="border rounded-xl p-4 text-sm font-body" style={{ borderColor: 'var(--rust)', backgroundColor: 'rgba(214,83,74,0.10)', color: 'var(--rust)' }}>
            {checkoutError}
          </div>
        )}

        {checkoutReturn?.status === 'success' && (
          <div className="border rounded-xl p-4 text-sm font-body flex items-center gap-2" style={{ borderColor: 'var(--brass)', backgroundColor: 'rgba(30,166,180,0.10)', color: 'var(--text-primary)' }}>
            <Loader2 size={15} className="text-brass spin" />
            <span>{checkoutReturn.message || 'Pagamento recebido. A verificar subscrição...'}</span>
          </div>
        )}

        {checkoutReturn?.status === 'cancelled' && (
          <div className="border rounded-xl p-4 text-sm font-body" style={{ borderColor: 'var(--border-hair)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
            Pagamento cancelado. Pode escolher um plano quando quiser.
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SALES_PLANS.map((plan) => (
            <div key={plan.id} className="bg-surface border rounded-xl p-5 flex flex-col gap-4" style={{ borderColor: plan.highlight ? 'var(--brass)' : 'var(--border-hair)' }}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-semibold text-primary">{plan.name}</h2>
                {plan.highlight && <span className="text-2xs uppercase tracking-wide font-mono px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(30,166,180,0.16)', color: 'var(--brass)' }}>Mais escolhido</span>}
              </div>
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-mono text-3xl font-semibold text-primary">{plan.price}</span>
                  {plan.bonusMonths > 0 && <span className="font-mono text-xs text-faint">≈ {plan.perMonth}</span>}
                </div>
                <div className="text-xs text-faint font-body mt-1">{plan.note}</div>
              </div>
              {plan.bonusLabel && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--gold-soft)', color: 'var(--gold)' }}>
                  <Gift size={14} style={{ flexShrink: 0 }} />
                  <span className="text-xs font-body font-semibold">{plan.bonusLabel}</span>
                </div>
              )}
              <ul className="text-sm text-muted font-body flex flex-col gap-2">
                <li>Gestão completa de alunos e planos</li>
                <li>Agenda semanal e mensal</li>
                <li>Avaliações físicas com fotos</li>
                <li>Controlo financeiro do personal trainer</li>
              </ul>
              <div className="mt-auto flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => startCheckout(plan.id)}
                  disabled={checkoutPlan === `card:${plan.id}`}
                  className="px-4 py-2.5 rounded-lg text-sm font-body font-medium disabled:opacity-60"
                  style={{ backgroundColor: 'var(--brass)', color: '#0A0A0A' }}
                >
                  {checkoutPlan === `card:${plan.id}` ? 'A abrir checkout...' : 'Pagar com cartão'}
                </button>
                <button
                  type="button"
                  onClick={() => startMbwayCheckout(plan.id)}
                  disabled={checkoutPlan === `mbway:${plan.id}`}
                  className="px-4 py-2.5 rounded-lg text-sm font-body font-medium border disabled:opacity-60"
                  // Contornado em vez de preenchido: hierarquia honesta -- o cartão
                  // renova sozinho e é o caminho principal, o MB WAY é a alternativa.
                  // Vermelho estava a dizer "perigo" num botão de pagar.
                  style={{ backgroundColor: 'var(--brass-soft)', borderColor: 'var(--brass)', color: 'var(--brass)' }}
                >
                  {checkoutPlan === `mbway:${plan.id}` ? 'A abrir MB WAY...' : 'Pagar com MB WAY'}
                </button>
                <div className="text-2xs text-faint font-body text-center">MB WAY não renova automaticamente.</div>
              </div>
              {supportReady && (
                <a href={supportMailtoHref(`Dúvida sobre o plano ${plan.name} do PTMANAGER`)} className="text-center text-xs font-body link-sky">
                  Falar com o suporte
                </a>
              )}
            </div>
          ))}
        </section>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-hair rounded-xl p-4 bg-surface">
          <div>
            <div className="text-sm font-body font-medium text-primary">Já pagou e o painel não abriu?</div>
            <div className="text-xs text-muted font-body">Se o pagamento acabou de ser confirmado, atualize os dados da subscrição.</div>
          </div>
          <button onClick={onRefresh} type="button" className="px-3.5 py-2 rounded-lg text-xs font-body border border-hair btn-surface text-muted">Verificar subscrição</button>
        </div>
      </main>
      <DeveloperCredit />
    </div>
  );
}

function planByTier(tier) {
  return SALES_PLANS.find((plan) => plan.id === tier) || null;
}

function subscriptionStatusLabel(status) {
  if (status === 'active' || status === 'dev_override') return 'Ativo';
  if (status === 'creator') return 'Criador';
  if (status === 'inactive') return 'Inativo';
  if (status === 'canceled') return 'Cancelado';
  if (status === 'past_due') return 'Pagamento pendente';
  return status || 'Sem plano';
}

function fmtDateLong(value) {
  if (!value) return 'Não definido';
  return new Date(value).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysUntil(value) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function daysLeftLabel(value, cancelAtPeriodEnd, manualRenewal = false) {
  const days = daysUntil(value);
  if (days == null) return 'Sem vencimento';
  if (days < 0) return `Vencido há ${plural(Math.abs(days), 'dia', 'dias')}`;
  if (days === 0) return cancelAtPeriodEnd ? 'Cancela hoje' : 'Vence hoje';
  if (manualRenewal) return `Vence em ${plural(days, 'dia', 'dias')}`;
  return cancelAtPeriodEnd ? `Cancela em ${plural(days, 'dia', 'dias')}` : `Renova em ${plural(days, 'dia', 'dias')}`;
}

function paymentMethodLabel(subscription) {
  if (!subscription?.paymentMethodBrand && !subscription?.paymentMethodLast4) return 'Não informado';
  const brand = subscription.paymentMethodBrand || 'Cartão';
  return subscription.paymentMethodLast4 ? `${brand} •••• ${subscription.paymentMethodLast4}` : brand;
}

function supportMailtoHref(subject) {
  if (!SUPPORT_EMAIL) return '';
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

function ChangePasswordModal({ email, onClose, onDone }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReset, setCaptchaReset] = useState(0);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!current || !next || !confirm) { setError('Preencha todos os campos.'); return; }
    if (next.length < 6) { setError('A nova palavra-passe deve ter pelo menos 6 caracteres.'); return; }
    if (next !== confirm) { setError('A nova palavra-passe e a confirmação não coincidem.'); return; }
    if (next === current) { setError('A nova palavra-passe tem de ser diferente da atual.'); return; }
    if (!supabase) { setError('Supabase não configurado.'); return; }
    if (TURNSTILE_SITE_KEY && !captchaToken) { setError('Confirme que não é um robô.'); return; }

    setBusy(true);
    // O Supabase não valida a palavra-passe atual no updateUser, por isso
    // confirmamo-la primeiro com um início de sessão. Com a proteção CAPTCHA
    // ativa, este endpoint exige token — sem ele devolve captcha_failed.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
      options: captchaToken ? { captchaToken } : undefined,
    });
    // O token é de uso único: renovar antes de qualquer nova tentativa.
    setCaptchaToken('');
    setCaptchaReset((n) => n + 1);

    if (signInError) {
      setBusy(false);
      const code = signInError.code || '';
      const msg = String(signInError.message || '');
      if (code.includes('captcha') || msg.toLowerCase().includes('captcha')) {
        setError('Falha na verificação anti-robô. Tente novamente.');
      } else if (code === 'over_request_rate_limit' || msg.toLowerCase().includes('rate limit')) {
        setError('Demasiadas tentativas. Aguarde um pouco e tente de novo.');
      } else {
        setError('A palavra-passe atual está incorreta.');
      }
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (updateError) { setError(updateError.message); return; }
    onDone('Palavra-passe alterada com sucesso.');
    onClose();
  }

  return (
    <Modal title="Alterar palavra-passe" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FormField label="Palavra-passe atual">
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="input-field" autoComplete="current-password" />
        </FormField>
        <FormField label="Nova palavra-passe">
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="input-field" autoComplete="new-password" placeholder="Mínimo 6 caracteres" />
        </FormField>
        <FormField label="Confirmar nova palavra-passe">
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field" autoComplete="new-password" />
        </FormField>
        {TURNSTILE_SITE_KEY && (
          <Turnstile siteKey={TURNSTILE_SITE_KEY} onVerify={setCaptchaToken} resetSignal={captchaReset} />
        )}
        {error && <div className="text-sm font-body text-rust">{error}</div>}
        <div className="flex gap-2 pt-1 mobile-stack">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancelar</button>
          <button type="submit" disabled={busy || (Boolean(TURNSTILE_SITE_KEY) && !captchaToken)} className="btn btn-primary flex-1">
            {busy ? 'A guardar...' : 'Guardar nova palavra-passe'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ============================== DEFINIÇÕES (modal com secções) ============================== */

const SETTINGS_SECTIONS = [
  { id: 'conta', label: 'Conta', icon: CircleUser },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'subscricao', label: 'Subscrição', icon: CreditCard },
  { id: 'dados', label: 'Dados e privacidade', icon: ShieldCheck },
  { id: 'sobre', label: 'Sobre', icon: Info },
];

function SettingsRow({ label, value, mono, tone, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-hair min-w-0">
      <span className="flex items-center gap-2 text-muted min-w-0 flex-shrink-0">
        {Icon && <Icon size={14} className="text-faint flex-shrink-0" />}
        <span className="truncate">{label}</span>
      </span>
      <span
        className={`text-right truncate min-w-0 ${mono ? 'font-mono text-xs text-faint' : ''}`}
        style={{ color: tone || (mono ? undefined : 'var(--text-primary)') }}
        title={String(value)}
      >
        {value}
      </span>
    </div>
  );
}

function SettingsBlock({ title, description, children }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="font-display text-base font-semibold text-primary">{title}</h3>
        {description && <p className="text-xs text-muted font-body mt-1">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function SettingsModal({
  user, subscription, students, sessions, finances, photos, customCategories,
  onClose, onSignOut, onRefreshSubscription, onChangePassword, onReset, onRestore,
  trainerName, onSaveTrainerName, definicoes, onSaveHorario, onSaveLembretes, permissaoNotificacoes,
}) {
  const [section, setSection] = useState('conta');
  const [nome, setNome] = useState(trainerName || '');
  const [nomeEstado, setNomeEstado] = useState('');
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingRestore, setPendingRestore] = useState(null);
  const [restoreError, setRestoreError] = useState('');
  const [legalDoc, setLegalDoc] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const currentPlan = planByTier(subscription?.tier);
  const planName = currentPlan?.name || subscription?.tier || 'Nenhum plano';
  const planValue = subscription?.value != null ? currency(subscription.value) : currentPlan?.price || 'A definir';
  const billingInterval = subscription?.interval || currentPlan?.interval || 'Não definido';
  const isManualPayment = subscription?.paymentMethodBrand === 'MB WAY' || String(subscription?.interval || '').includes('MB WAY');
  const renewalLabel = daysLeftLabel(subscription?.currentPeriodEnd, subscription?.cancelAtPeriodEnd, isManualPayment);
  const paymentLabel = paymentMethodLabel(subscription);
  const currentTierIndex = SALES_PLANS.findIndex((plan) => plan.id === subscription?.tier);
  const upgradePlans = SALES_PLANS.filter((_, index) => currentTierIndex < 0 || index > currentTierIndex);
  const hasSupportEmail = Boolean(SUPPORT_EMAIL);
  const hasRecurringStripeSubscription = Boolean(subscription?.stripeSubscriptionId);

  async function openCustomerPortal() {
    setPortalError('');
    if (!supabaseConfigured || !supabase) {
      setPortalError('Configure o Supabase para abrir o portal do cliente.');
      return;
    }
    setPortalBusy(true);
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: { returnUrl: `${window.location.origin}?portal=return` },
    });
    setPortalBusy(false);
    if (error || !data?.url) {
      setPortalError(await edgeFunctionErrorMessage(error, 'Não foi possível abrir o portal da Stripe.'));
      return;
    }
    window.location.href = data.url;
  }

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
        if (!Array.isArray(data.fotos)) data.fotos = [];
        if (!data.categorias) data.categorias = EMPTY_CUSTOM_CATEGORIES;
        setPendingRestore(data);
      } catch (err) {
        setRestoreError('Não foi possível ler este ficheiro. Verifique se é uma cópia de segurança exportada por esta aplicação.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div
      className="fixed inset-0 flex items-stretch sm:items-center justify-center animate-in p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)', zIndex: 40 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Definições"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="settings-panel border border-hair w-full sm:max-w-4xl flex flex-col sm:rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-lg)' }}
      >
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-hair flex-shrink-0">
          <h2 className="font-display font-semibold text-lg text-primary">Definições</h2>
          <button onClick={onClose} type="button" className="p-1.5 rounded-lg btn-surface flex-shrink-0" aria-label="Fechar">
            <X size={18} className="text-muted" style={{ display: 'block' }} />
          </button>
        </header>

        <div className="flex flex-col sm:flex-row flex-1 min-h-0">
          {/* Barra lateral no desktop; tiras horizontais no telemóvel. */}
          <nav
            className="flex sm:flex-col gap-1 p-2 sm:p-3 border-b sm:border-b-0 sm:border-r border-hair overflow-x-auto flex-shrink-0"
            style={{ backgroundColor: 'var(--bg-base)' }}
            aria-label="Secções das definições"
          >
            {SETTINGS_SECTIONS.map((s) => {
              const active = section === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  aria-current={active ? 'true' : undefined}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body nowrap flex-shrink-0 btn-surface sm:w-52"
                  style={{
                    backgroundColor: active ? 'var(--brass-soft)' : 'transparent',
                    color: active ? 'var(--brass)' : 'var(--text-muted)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <s.icon size={15} style={{ display: 'block', flexShrink: 0 }} />
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex-1 min-w-0 overflow-y-auto p-5 flex flex-col gap-6">
            {section === 'conta' && (
              <>
                <SettingsBlock title="Conta" description="Dados de acesso ao PTMANAGER.">
                  <div className="flex items-center gap-3 pb-1">
                    <img src={LOGO_SRC} alt="" style={{ width: 40, height: 40, flexShrink: 0 }} />
                    <div className="min-w-0">
                      <div className="font-body text-base text-primary truncate">{user?.email || 'Utilizador local'}</div>
                      <div className="text-2xs text-faint font-body">Personal trainer</div>
                    </div>
                  </div>
                  <dl className="flex flex-col text-sm font-body border-t border-hair">
                    <SettingsRow label="E-mail de acesso" value={user?.email || 'Conta local'} />
                    <SettingsRow label="ID do utilizador" value={user?.id || 'local'} mono />
                    <SettingsRow label="Último acesso" value={user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : 'Agora'} />
                    <SettingsRow label="Conta criada" value={fmtDateLong(user?.created_at)} />
                    {/* A palavra-passe real nunca é apresentada. */}
                    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-hair">
                      <span className="text-muted">Palavra-passe</span>
                      <span className="font-mono text-primary tracking-widest" aria-label="Palavra-passe oculta">••••••••</span>
                    </div>
                  </dl>
                </SettingsBlock>

                <SettingsBlock
                  title="Nome profissional"
                  description="Aparece no timbre das avaliações e dos planos de treino que exportar."
                >
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={nome}
                      onChange={(e) => { setNome(e.target.value); setNomeEstado(''); }}
                      className="input-field flex-1"
                      placeholder="Ex.: Bruno Fonseca"
                      aria-label="Nome profissional"
                      maxLength={80}
                    />
                    <button
                      type="button"
                      disabled={nomeEstado === 'a-guardar' || nome.trim() === (trainerName || '').trim()}
                      onClick={async () => {
                        setNomeEstado('a-guardar');
                        const erro = await onSaveTrainerName(nome.trim());
                        setNomeEstado(erro || 'guardado');
                      }}
                      className="btn btn-primary flex-shrink-0"
                      style={{ fontSize: 12 }}
                    >
                      {nomeEstado === 'a-guardar' ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Guardar
                    </button>
                  </div>
                  {nomeEstado === 'guardado' && (
                    <div className="text-2xs font-body" style={{ color: 'var(--brass)' }}>Nome guardado.</div>
                  )}
                  {nomeEstado && nomeEstado !== 'guardado' && nomeEstado !== 'a-guardar' && (
                    <div className="text-2xs font-body text-rust">{nomeEstado}</div>
                  )}
                  {!trainerName && (
                    <div className="text-2xs font-body text-faint">
                      Sem nome definido, os documentos exportados usam o e-mail de acesso.
                    </div>
                  )}
                </SettingsBlock>

                <div className="flex flex-col sm:flex-row gap-2">
                  {onChangePassword && (
                    <button onClick={onChangePassword} type="button" className="btn btn-ghost flex-1" style={{ fontSize: 12 }}>
                      <KeyRound size={14} /> Alterar palavra-passe
                    </button>
                  )}
                  {onSignOut && (
                    <button onClick={onSignOut} type="button" className="btn btn-ghost flex-1" style={{ fontSize: 12 }}>
                      Terminar sessão
                    </button>
                  )}
                </div>
              </>
            )}

            {section === 'agenda' && (
              <>
                <SettingsBlock
                  title="Horário de funcionamento"
                  description="Os dias fechados aparecem esbatidos na agenda e avisam antes de marcar. Nunca bloqueiam — há sempre a exceção."
                >
                  <div className="flex flex-col">
                    {DIAS_SEMANA.map((d) => {
                      const h = definicoes.horarios[d.id];
                      return (
                        <div key={d.id} className="flex items-center gap-2 py-2 border-b border-hair flex-wrap">
                          <label className="flex items-center gap-2 text-sm font-body text-primary" style={{ minWidth: 116 }}>
                            <input
                              type="checkbox"
                              checked={h.aberto}
                              onChange={(e) => onSaveHorario(d.id, { aberto: e.target.checked })}
                              style={{ accentColor: 'var(--brass)' }}
                            />
                            {d.label}
                          </label>
                          <div className="flex items-center gap-1.5 flex-1" style={{ minWidth: 190, opacity: h.aberto ? 1 : 0.45 }}>
                            <input type="time" value={h.inicio} disabled={!h.aberto} aria-label={`Abertura de ${d.label}`}
                              onChange={(e) => onSaveHorario(d.id, { inicio: e.target.value })}
                              className="input-field" style={{ flex: 1 }} />
                            <span className="text-faint text-xs font-body flex-shrink-0">até</span>
                            <input type="time" value={h.fim} disabled={!h.aberto} aria-label={`Fecho de ${d.label}`}
                              onChange={(e) => onSaveHorario(d.id, { fim: e.target.value })}
                              className="input-field" style={{ flex: 1 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SettingsBlock>

                <SettingsBlock
                  title="Lembretes antes da aula"
                  description="Aviso no ecrã e notificação do sistema, à antecedência que escolher."
                >
                  <label className="flex items-center gap-2 text-sm font-body text-primary">
                    <input
                      type="checkbox"
                      checked={definicoes.lembretes.ativos}
                      onChange={(e) => onSaveLembretes({ ativos: e.target.checked })}
                      style={{ accentColor: 'var(--brass)' }}
                    />
                    Avisar-me antes de cada aula
                  </label>
                  {definicoes.lembretes.ativos && (
                    <FormField label="Com que antecedência (minutos)">
                      <input
                        type="number" min="1" max="240"
                        value={definicoes.lembretes.minutosAntes}
                        onChange={(e) => onSaveLembretes({ minutosAntes: Math.max(1, Math.min(240, parseInt(e.target.value, 10) || 1)) })}
                        className="input-field"
                      />
                    </FormField>
                  )}
                  {/* Dizer a verdade: sem service worker isto nao sobrevive ao fecho da app. */}
                  <div className="text-2xs font-body px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--gold-soft)', color: 'var(--gold)' }}>
                    Os lembretes só funcionam com o PTMANAGER aberto numa aba. Se fechar o browser, não recebe o aviso.
                  </div>
                  {permissaoNotificacoes === 'denied' && (
                    <div className="text-2xs font-body text-rust">
                      As notificações estão bloqueadas para este site. Só continua a ver o aviso dentro da aplicação.
                    </div>
                  )}
                </SettingsBlock>
              </>
            )}

            {section === 'subscricao' && (
              <>
                <SettingsBlock title="Plano atual">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-2xl text-primary font-semibold">{planName}</span>
                    <span className="badge" style={{ backgroundColor: subscription?.active ? 'var(--brass-soft)' : 'var(--rust-soft)', color: subscription?.active ? 'var(--brass)' : 'var(--rust)' }}>
                      {subscriptionStatusLabel(subscription?.status)}
                    </span>
                  </div>
                  <dl className="flex flex-col text-sm font-body border-t border-hair">
                    <SettingsRow icon={Wallet} label="Valor" value={planValue} />
                    <SettingsRow icon={CalendarRange} label="Ciclo" value={billingInterval} />
                    <SettingsRow
                      icon={CalendarDays}
                      label={isManualPayment ? 'Vencimento' : subscription?.cancelAtPeriodEnd ? 'Fim do acesso' : 'Próxima renovação'}
                      value={renewalLabel}
                      tone={subscription?.cancelAtPeriodEnd ? 'var(--rust)' : undefined}
                    />
                    <SettingsRow icon={CreditCard} label="Pagamento" value={paymentLabel} />
                  </dl>
                  {subscription?.cancelAtPeriodEnd && (
                    <div className="text-xs font-body px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--rust-soft)', color: 'var(--rust)' }}>
                      Cancelamento agendado. O acesso permanece até {fmtDateLong(subscription.currentPeriodEnd)}.
                    </div>
                  )}
                  <button onClick={onRefreshSubscription} type="button" className="btn btn-ghost self-start" style={{ fontSize: 12 }}>
                    Atualizar dados do plano
                  </button>
                </SettingsBlock>

                <SettingsBlock title="Faturação" description="Resumo para suporte e conciliação.">
                  <dl className="flex flex-col text-sm font-body border-t border-hair">
                    <SettingsRow label="Início do ciclo" value={fmtDateLong(subscription?.currentPeriodStart)} />
                    <SettingsRow label="Vencimento" value={fmtDateLong(subscription?.currentPeriodEnd)} />
                    <SettingsRow label="Último pagamento" value={subscription?.lastPaymentStatus || 'Não informado'} />
                    <SettingsRow label="Última atualização" value={fmtDateLong(subscription?.updatedAt)} />
                    <SettingsRow label="Cliente Stripe" value={subscription?.stripeCustomerId || 'Ainda não vinculado'} mono />
                    <SettingsRow label="Subscrição Stripe" value={subscription?.stripeSubscriptionId || 'Ainda não vinculada'} mono />
                  </dl>
                </SettingsBlock>

                <SettingsBlock
                  title="Gerir plano"
                  description={hasRecurringStripeSubscription
                    ? 'Atualize cartão, veja cobranças, altere plano ou cancele no portal seguro da Stripe.'
                    : 'Pagamentos MB WAY são únicos por período. Para renovar ou alterar plano, fale com o suporte.'}
                >
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <button onClick={openCustomerPortal} type="button" disabled={portalBusy || !hasRecurringStripeSubscription} className="btn btn-primary">
                      {portalBusy ? 'A abrir portal...' : 'Gerir subscrição na Stripe'}
                    </button>
                    {!hasRecurringStripeSubscription && <span className="text-xs text-faint font-body">Disponível apenas para subscrição automática por cartão.</span>}
                  </div>
                  {portalError && (
                    <div className="border rounded-lg p-3 text-xs font-body" style={{ borderColor: 'var(--rust)', backgroundColor: 'var(--rust-soft)', color: 'var(--rust)' }}>
                      {portalError}
                    </div>
                  )}
                  <div className="flex flex-col border-t border-hair">
                    {(upgradePlans.length ? upgradePlans : SALES_PLANS).map((plan) => {
                      const isCurrent = plan.id === subscription?.tier;
                      const subject = isCurrent
                        ? `Dúvida sobre o meu plano ${plan.name} do PTMANAGER`
                        : `Mudança de plano do PTMANAGER para ${plan.name}`;
                      return (
                        <div key={plan.id} className="flex items-center justify-between gap-3 py-3 border-b border-hair flex-wrap">
                          <div className="flex items-baseline gap-2.5 min-w-0 flex-wrap">
                            <span className="font-body font-medium text-primary">{plan.name}</span>
                            <span className="font-mono text-sm text-muted">{plan.price}</span>
                            {plan.bonusLabel && <span className="badge" style={{ backgroundColor: 'var(--gold-soft)', color: 'var(--gold)' }}>{plan.bonusLabel}</span>}
                            {isCurrent && <span className="badge" style={{ backgroundColor: 'var(--brass-soft)', color: 'var(--brass)' }}>Atual</span>}
                          </div>
                          <a href={hasSupportEmail ? supportMailtoHref(subject) : undefined} aria-disabled={!hasSupportEmail} className="btn btn-ghost flex-shrink-0" style={{ padding: '7px 12px', fontSize: 12 }}>
                            {isCurrent ? 'Falar sobre plano' : 'Mudar de plano'}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={hasSupportEmail ? supportMailtoHref('Atualizar a forma de pagamento do plano PTMANAGER') : undefined} aria-disabled={!hasSupportEmail} className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
                      <Mail size={13} /> Atualizar pagamento
                    </a>
                    <a href={hasSupportEmail ? supportMailtoHref('Segunda via ou dúvida sobre uma cobrança do PTMANAGER') : undefined} aria-disabled={!hasSupportEmail} className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
                      <Mail size={13} /> Suporte de faturação
                    </a>
                    <a href={hasSupportEmail ? supportMailtoHref('Cancelamento do plano PTMANAGER') : undefined} aria-disabled={!hasSupportEmail} className="btn" style={{ padding: '8px 14px', fontSize: 12, borderColor: 'var(--rust)', color: 'var(--rust)', backgroundColor: 'transparent' }}>
                      Solicitar cancelamento
                    </a>
                  </div>
                  {!hasSupportEmail && (
                    <div className="text-xs text-faint font-body">
                      Defina <code className="font-mono">VITE_SUPPORT_EMAIL</code> para ativar os contactos de suporte.
                    </div>
                  )}
                </SettingsBlock>
              </>
            )}

            {section === 'dados' && (
              <>
                <SettingsBlock title="Os seus dados" description="O que está guardado nesta conta.">
                  <dl className="flex flex-col text-sm font-body border-t border-hair">
                    <SettingsRow label="Alunos" value={students.length} />
                    <SettingsRow label="Aulas e avaliações" value={sessions.length} />
                    <SettingsRow label="Lançamentos financeiros" value={finances.length} />
                    <SettingsRow label="Fotos de progresso" value={photos.length} />
                  </dl>
                </SettingsBlock>

                <SettingsBlock title="Privacidade" description="Como os seus dados são tratados.">
                  <ul className="flex flex-col gap-2.5 text-sm font-body text-muted">
                    {[
                      'Os dados ficam associados apenas à sua conta — nenhum outro utilizador lhes acede.',
                      'Os seus alunos não têm acesso ao sistema nem recebem convites.',
                      'Os pagamentos são processados pela Stripe; o PTMANAGER nunca guarda dados do cartão.',
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2.5">
                        <ShieldCheck size={15} className="text-brass flex-shrink-0" style={{ marginTop: 2 }} />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setLegalDoc('termos')} className="btn btn-ghost" style={{ fontSize: 12 }}>Termos de Utilização</button>
                    <button type="button" onClick={() => setLegalDoc('privacidade')} className="btn btn-ghost" style={{ fontSize: 12 }}>Política de Privacidade</button>
                  </div>
                </SettingsBlock>

                <SettingsBlock title="Dados dos seus alunos" description="Um lembrete importante sobre a sua responsabilidade.">
                  <div className="rounded-lg px-3.5 py-3 text-xs font-body leading-relaxed" style={{ backgroundColor: 'var(--gold-soft)', color: 'var(--text-muted)', border: '1px solid rgba(245,180,76,0.28)' }}>
                    Medidas corporais, avaliações físicas e fotografias são dados de saúde e exigem
                    consentimento explícito de cada aluno, de preferência por escrito. Perante os seus
                    alunos, é o titular da conta quem responde por esses dados.
                  </div>
                </SettingsBlock>

                <SettingsBlock title="Cópia de segurança" description="Transfira um ficheiro com alunos, aulas, avaliações, finanças e fotos. Pode restaurá-lo aqui se precisar.">
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => downloadBackup(students, sessions, finances, photos, customCategories)} type="button" className="btn btn-primary" style={{ fontSize: 12 }}>
                      <Download size={14} /> Exportar backup
                    </button>
                    <button onClick={() => fileRef.current?.click()} type="button" className="btn btn-ghost" style={{ fontSize: 12 }}>
                      <Upload size={14} /> Restaurar backup
                    </button>
                    <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFile} style={{ display: 'none' }} />
                  </div>
                  {restoreError && <div className="text-2xs font-body text-rust">{restoreError}</div>}
                  <p className="text-2xs font-body text-faint">
                    O ficheiro exportado não é cifrado: contém nomes, medidas e fotografias em texto
                    legível. Guarde-o em local seguro e evite enviá-lo por canais não protegidos.
                  </p>
                </SettingsBlock>

                <SettingsBlock title="Apagar todos os dados" description="Remove alunos, aulas, avaliações, finanças e fotos desta aplicação. Esta ação não pode ser desfeita.">
                  <button onClick={() => setConfirmReset(true)} type="button" className="btn btn-danger self-start" style={{ fontSize: 12 }}>
                    <Trash2 size={14} /> Apagar tudo
                  </button>
                </SettingsBlock>
              </>
            )}

            {section === 'sobre' && (
              <SettingsBlock title="Sobre o PTMANAGER" description="Gestão completa para personal trainers.">
                <dl className="flex flex-col text-sm font-body border-t border-hair">
                  <SettingsRow label="Aplicação" value="PTMANAGER" />
                  <SettingsRow label="Idioma" value="Português (Portugal)" />
                  <SettingsRow label="Moeda" value="Euro (€)" />
                  <SettingsRow label="Pagamentos" value="Stripe" />
                </dl>
                {hasSupportEmail && (
                  <a href={supportMailtoHref('Contacto de suporte do PTMANAGER')} className="btn btn-ghost self-start" style={{ fontSize: 12 }}>
                    <Mail size={14} /> Contactar o suporte
                  </a>
                )}
                <p className="text-2xs font-body text-faint">Developed by Marcelo Fonseca</p>
              </SettingsBlock>
            )}
          </div>
        </div>
      </div>

      {confirmReset && (
        <ConfirmDialog title="Apagar todos os dados" message="Tem a certeza? Todos os dados serão permanentemente removidos." onCancel={() => setConfirmReset(false)} onConfirm={onReset} />
      )}
      {pendingRestore && (
        <ConfirmDialog
          title="Restaurar backup"
          message={`Isto vai SUBSTITUIR os dados atuais pelos ${plural(pendingRestore.alunos.length, 'aluno', 'alunos')}, ${plural(pendingRestore.agenda.length, 'aula', 'aulas')}, ${plural(pendingRestore.financas.length, 'lançamento', 'lançamentos')} e ${plural(pendingRestore.fotos.length, 'foto', 'fotos')} do ficheiro. Esta ação não pode ser desfeita.`}
          onCancel={() => setPendingRestore(null)}
          onConfirm={() => { onRestore(pendingRestore.alunos, pendingRestore.agenda, pendingRestore.financas, pendingRestore.fotos, pendingRestore.categorias); setPendingRestore(null); }}
        />
      )}
      {legalDoc && <LegalModal docId={legalDoc} supportEmail={SUPPORT_EMAIL} onClose={() => setLegalDoc(null)} />}
    </div>
  );
}


function StatCard({ label, value, icon: Icon, accent = 'brass', sub }) {
  const hex = ACCENT_HEX[accent];
  return (
    <div className="card card-hover p-4 flex flex-col gap-2.5 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xs uppercase tracking-wide text-muted font-body leading-tight">{label}</span>
        <span className="rounded-md p-1.5 flex-shrink-0" style={{ backgroundColor: `${hex}1F` }}>
          <Icon size={14} style={{ color: hex, display: 'block' }} />
        </span>
      </div>
      <span className="font-mono text-xl sm:text-2xl text-primary font-semibold leading-none truncate" style={{ letterSpacing: '-0.02em' }}>{value}</span>
      {sub && <span className="text-2xs text-faint font-body leading-tight">{sub}</span>}
    </div>
  );
}

function StudentSessionsCard({ student, weekCount, monthCount, yearCount, pendingFaltasCount }) {
  return (
    <div className="bg-elevated border border-hair rounded-lg p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: student.color }} />
        <span className="text-primary font-body text-sm truncate min-w-0" title={student.name}>{student.name}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-2xs uppercase tracking-wide text-faint font-body truncate">Sem.</span>
          <span className="font-mono text-sm text-primary">{weekCount}</span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-2xs uppercase tracking-wide text-faint font-body truncate">Mês</span>
          <span className="font-mono text-sm text-primary">{monthCount}</span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-2xs uppercase tracking-wide text-faint font-body truncate">Ano</span>
          <span className="font-mono text-sm text-primary">{yearCount}</span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-2xs uppercase tracking-wide text-faint font-body truncate">Faltas</span>
          <span className="font-mono text-sm font-semibold" style={{ color: pendingFaltasCount > 0 ? 'var(--rust)' : 'var(--text-faint)' }}>{pendingFaltasCount}</span>
        </div>
      </div>
    </div>
  );
}

function StudentFinanceCard({ student, finance }) {
  return (
    <div className="bg-elevated border border-hair rounded-lg p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: student.color }} />
          <span className="text-primary font-body text-sm truncate min-w-0" title={student.name}>{student.name}</span>
        </div>
        <span className="text-2xs text-faint font-body flex-shrink-0 truncate max-w-[35%]" title={student.planType}>{student.planType}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-2xs uppercase tracking-wide text-faint font-body truncate">Bruto</span>
          <span className="font-mono text-xs text-primary truncate">{currency(finance.gross)}</span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-2xs uppercase tracking-wide text-faint font-body truncate">Imposto</span>
          <span className="font-mono text-xs text-rust truncate">{currency(finance.tax)}</span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-2xs uppercase tracking-wide text-faint font-body truncate">Ginásio</span>
          <span className="font-mono text-xs text-slate-acc truncate">{currency(finance.gymFee)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2.5 border-t border-hair">
        <span className="text-2xs uppercase tracking-wide text-faint font-body">Líquido</span>
        <span className="font-mono text-sm text-brass font-semibold">{currency(finance.net)}</span>
      </div>
    </div>
  );
}

function AlertChip({ icon: Icon, label, count, accent }) {
  const hex = ACCENT_HEX[accent];
  const active = Number(count) > 0;
  return (
    <div className="card p-3 flex items-center gap-2.5 min-w-0" style={{ borderColor: active ? `${hex}59` : 'var(--border-hair)' }}>
      <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: active ? `${hex}24` : 'rgba(255,255,255,0.04)' }}>
        <Icon size={15} style={{ color: active ? hex : 'var(--text-faint)', display: 'block' }} />
      </div>
      <div className="min-w-0">
        <div className="font-mono text-lg leading-none" style={{ color: active ? 'var(--text-primary)' : 'var(--text-faint)' }}>{count}</div>
        <div className="text-2xs text-faint font-body truncate mt-1">{label}</div>
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

function QuinzenaDots({ marks, onToggle, label }) {
  return (
    <FormField label={label}>
      <div className="flex gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <button key={i} type="button" onClick={() => onToggle(i)} aria-label={`Quinzena ${i + 1}${marks[i] ? ' paga' : ' não paga'}`}
            className="rounded-full flex items-center justify-center" style={{ width: 36, height: 36, border: `2px solid ${marks[i] ? 'var(--brass)' : 'var(--border-hair)'}`, backgroundColor: marks[i] ? 'var(--brass)' : 'transparent' }}>
            {marks[i] ? <Check size={15} color="#0A0A0A" /> : <span className="text-2xs font-mono text-faint">{i + 1}</span>}
          </button>
        ))}
      </div>
    </FormField>
  );
}

function AddCategoryInline({ onAdd, placeholder, label = 'Adicionar personalizado' }) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState('');

  function submit() {
    const label = value.trim();
    if (!label) return;
    onAdd(label);
    setValue('');
    setAdding(false);
  }

  if (!adding) {
    return (
      <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs font-body link-sky mt-2">
        <Plus size={13} /> {label}
      </button>
    );
  }

  return (
    <div className="flex gap-2 mt-2 mobile-stack">
      <input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} className="input-field" placeholder={placeholder} />
      <button type="button" onClick={submit} className="px-3 rounded-lg text-xs font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0A0A0A' }}>OK</button>
      <button type="button" onClick={() => { setAdding(false); setValue(''); }} className="px-3 rounded-lg text-xs font-body border border-hair btn-surface">Cancelar</button>
    </div>
  );
}

/* ============================== ASSESSMENT FIELDS (shared) ============================== */

function AssessmentFields({ form, set, studentHeight, studentSex }) {
  const bmi = bmiOf(form.assessWeight, studentHeight);
  const protocol = FOLD_PROTOCOLS.find((p) => p.id === form.assessProtocol) || FOLD_PROTOCOLS[0];
  const sexKey = studentSex === 'F' ? 'F' : 'M';
  const activeSites = protocol.sites[sexKey];
  const foldResult = form.assessMethod === 'dobras' ? calcFoldBodyFat(form, studentSex) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Peso (kg)">
          <input type="number" inputMode="decimal" min="0" step="0.1" value={form.assessWeight || ''} onChange={(e) => set('assessWeight', e.target.value)} className="input-field" placeholder="0,0" />
        </FormField>
        <FormField label="Idade na avaliação">
          <input type="number" inputMode="numeric" min="0" step="1" value={form.assessAge || ''} onChange={(e) => set('assessAge', e.target.value)} className="input-field" placeholder="anos" />
        </FormField>
      </div>

      {bmi != null && (
        <div className="flex items-center justify-between text-xs font-body px-3 py-2 rounded-lg bg-elevated border border-hair">
          <span className="text-muted">IMC calculado</span>
          <span className="text-primary font-mono">{bmi.toFixed(1)} · <span className="text-faint">{bmiLabel(bmi)}</span></span>
        </div>
      )}
      {bmi == null && !studentHeight && (
        <div className="text-2xs text-faint font-body">Adicione a altura do aluno no registo para calcular o IMC automaticamente.</div>
      )}

      <FormField label="Método de avaliação">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => set('assessMethod', 'bioimpedancia')} className="px-3 py-2 rounded-lg border text-sm font-body" style={{ borderColor: form.assessMethod === 'bioimpedancia' ? 'var(--brass)' : 'var(--border-hair)', backgroundColor: form.assessMethod === 'bioimpedancia' ? 'rgba(30,166,180,0.12)' : 'var(--bg-base)', color: form.assessMethod === 'bioimpedancia' ? 'var(--brass)' : 'var(--text-muted)' }}>Bioimpedância</button>
          <button type="button" onClick={() => set('assessMethod', 'dobras')} className="px-3 py-2 rounded-lg border text-sm font-body" style={{ borderColor: form.assessMethod === 'dobras' ? 'var(--brass)' : 'var(--border-hair)', backgroundColor: form.assessMethod === 'dobras' ? 'rgba(30,166,180,0.12)' : 'var(--bg-base)', color: form.assessMethod === 'dobras' ? 'var(--brass)' : 'var(--text-muted)' }}>Dobras Cutâneas</button>
        </div>
      </FormField>

      {form.assessMethod === 'bioimpedancia' && (
        <div className="bg-elevated rounded-lg p-3 border border-hair flex flex-col gap-3 animate-in">
          <div className="text-2xs uppercase tracking-wide text-faint font-mono">Dados de Bioimpedância</div>
          <FormField label="% Gordura corporal">
            <input type="number" inputMode="decimal" min="0" max="100" step="0.1" value={form.assessBodyFat || ''} onChange={(e) => set('assessBodyFat', e.target.value)} className="input-field" placeholder="0,0" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            {BIA_FIELDS.map((f) => (
              <FormField key={f.id} label={f.label}>
                <input type="number" inputMode="decimal" step="0.1" value={form[f.id] || ''} onChange={(e) => set(f.id, e.target.value)} className="input-field" placeholder="0" />
              </FormField>
            ))}
          </div>
        </div>
      )}

      {form.assessMethod === 'dobras' && (
        <div className="bg-elevated rounded-lg p-3 border border-hair flex flex-col gap-3 animate-in">
          <div className="text-2xs uppercase tracking-wide text-faint font-mono">Protocolo de Dobras Cutâneas</div>
          <FormField label="Protocolo">
            <select value={form.assessProtocol} onChange={(e) => set('assessProtocol', e.target.value)} className="input-field">
              {FOLD_PROTOCOLS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </FormField>
          {!studentSex && <div className="text-2xs text-rust font-body">Defina o sexo biológico do aluno no registo para este protocolo calcular corretamente.</div>}
          {protocol.needsAge && !form.assessAge && <div className="text-2xs text-rust font-body">Informe a idade acima — este protocolo precisa dela para calcular.</div>}
          <div className="grid grid-cols-2 gap-3">
            {activeSites.map((id) => (
              <FormField key={id} label={`${foldLabel(id)} (mm)`}>
                <input type="number" inputMode="decimal" min="0" step="0.1" value={form[id] || ''} onChange={(e) => set(id, e.target.value)} className="input-field" placeholder="0" />
              </FormField>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm font-body px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'rgba(30,166,180,0.1)' }}>
            <span className="text-muted">% Gordura estimada ({protocol.label})</span>
            <span className="font-mono font-semibold text-brass">{foldResult != null ? `${foldResult.toFixed(1)}%` : '—'}</span>
          </div>
        </div>
      )}

      <FormField label="Observações da avaliação">
        <textarea value={form.assessNotes || ''} onChange={(e) => set('assessNotes', e.target.value)} className="input-field" rows={2} placeholder="Evolução, orientações, observações..." />
      </FormField>
    </div>
  );
}

/* ============================== PHOTOS ============================== */

function PhotoPicker({ photoIds, onAdd, onRemove, photosById, busy }) {
  const inputRef = useRef(null);
  return (
    <FormField label="Fotos do aluno">
      <div className="flex flex-wrap gap-2">
        {photoIds.map((id) => {
          const p = photosById[id];
          if (!p) return null;
          return (
            <div key={id} className="relative" style={{ width: 64, height: 64 }}>
              <img src={p.dataUri} alt="Foto do aluno" className="w-full h-full object-cover rounded-lg border border-hair" />
              <button onClick={() => onRemove(id)} type="button" className="absolute rounded-full flex items-center justify-center" style={{ top: -6, right: -6, width: 20, height: 20, backgroundColor: 'var(--rust)' }} aria-label="Remover foto">
                <X size={12} color="#0A0A0A" />
              </button>
            </div>
          );
        })}
        <button onClick={() => inputRef.current?.click()} type="button" disabled={busy} className="flex flex-col items-center justify-center gap-1 rounded-lg border border-hair btn-surface" style={{ width: 64, height: 64 }}>
          {busy ? <Loader2 size={16} className="text-muted spin" /> : <Camera size={16} className="text-muted" />}
          <span className="text-2xs text-faint">{busy ? '...' : 'Add'}</span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={(e) => { onAdd(e.target.files); e.target.value = ''; }} style={{ display: 'none' }} />
      </div>
    </FormField>
  );
}

/* ============================== SESSION CARD ============================== */

// compact = coluna estreita da semana no desktop. Aí o rótulo do tipo é
// omitido (o ícone colorido já o identifica) e as ações ficam lado a lado,
// para o nome do aluno ter a largura toda.
/* ===================== ARRASTAR PARA REMARCAR ===================== */

// Arrasto com Pointer Events, e nao com HTML5 drag-and-drop: o HTML5 DnD nao
// funciona em toque, que e onde a agenda mais se usa.
//
// A pega e propria (nao o cartao inteiro) por causa do touch-action: para o
// browser nos entregar o movimento em vez de deslizar a pagina, a zona tem de
// ter touch-action: none -- e isso, aplicado ao cartao todo, impediria o
// utilizador de fazer scroll comecando em cima de uma aula.
function useArrastarSessao(onLargar) {
  const [arrasto, setArrasto] = useState(null);   // { dx, dy }
  const [alvo, setAlvo] = useState(null);         // ISO do dia sob o dedo
  const ref = useRef(null);

  useEffect(() => {
    if (!arrasto) return undefined;
    const st = ref.current;
    if (!st) return undefined;

    function diaSob(x, y) {
      const el = document.elementFromPoint(x, y);
      const col = el && el.closest ? el.closest('[data-day-iso]') : null;
      return col ? col.getAttribute('data-day-iso') : null;
    }
    function mover(e) {
      st.dx = e.clientX - st.x0;
      st.dy = e.clientY - st.y0;
      setArrasto({ dx: st.dx, dy: st.dy });
      const iso = diaSob(e.clientX, e.clientY);
      setAlvo(iso);
      realcar(iso);
      e.preventDefault();
    }
    function largar(e) {
      const destino = diaSob(e.clientX, e.clientY);
      limpar();
      if (destino) onLargar(destino);
    }
    // Realce imperativo da coluna sob o dedo. Passar isto por props obrigaria a
    // levantar o estado do arrasto ate a vista da semana e a descê-lo de novo.
    function realcar(iso) {
      const anterior = document.querySelector('.dia-alvo');
      if (anterior) anterior.classList.remove('dia-alvo');
      if (!iso) return;
      const col = document.querySelector(`[data-day-iso="${iso}"]`);
      if (col) col.classList.add('dia-alvo');
    }
    function limpar() {
      ref.current = null;
      realcar(null);
      document.body.classList.remove('a-arrastar');
      setArrasto(null);
      setAlvo(null);
    }
    document.body.classList.add('a-arrastar');
    window.addEventListener('pointermove', mover, { passive: false });
    window.addEventListener('pointerup', largar);
    window.addEventListener('pointercancel', limpar);
    return () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', largar);
      window.removeEventListener('pointercancel', limpar);
    };
  }, [Boolean(arrasto), onLargar]);

  function comecar(e) {
    if (e.button !== undefined && e.button !== 0) return;   // so o botao principal
    e.stopPropagation();
    e.preventDefault();
    ref.current = { x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 };
    setArrasto({ dx: 0, dy: 0 });
  }

  return { arrasto, alvo, comecar };
}

function SessionCard({ session, student, onOpen, onQuickStatus, onMoveTo, customCategories, compact }) {
  const largar = React.useCallback((iso) => { if (onMoveTo) onMoveTo(session, iso); }, [onMoveTo, session]);
  const { arrasto, alvo, comecar } = useArrastarSessao(largar);
  const aArrastar = Boolean(arrasto);
  const isEvento = session.kind === 'evento';
  const type = isEvento ? eventTypeFor(session.type, customCategories) : sessionTypeFor(session.type, customCategories);
  const TypeIcon = iconOf(type.icon);
  const isFalta = session.status === 'falta';
  const isCancelado = session.status === 'cancelado';
  const isRealizado = session.status === 'realizado';
  const color = isEvento ? type.color : (student?.color || '#54565D');
  const statusInfo = STATUS_OPTIONS.find((o) => o.id === session.status);

  return (
    // A pega e irma do cartao, e nao filha: um <button> dentro de um elemento com
    // role="button" e ARIA invalido, e o rotulo da pega passaria a fazer parte do
    // nome acessivel do cartao.
    <div
      className="relative min-w-0"
      style={{
        // Segue o dedo 1:1, passa a frente e deixa de ser alvo do hit test, para
        // o elementFromPoint encontrar a coluna por baixo.
        transform: aArrastar ? `translate3d(${arrasto.dx}px, ${arrasto.dy}px, 0)` : 'none',
        zIndex: aArrastar ? 40 : 'auto',
        opacity: aArrastar ? 0.92 : 1,
        pointerEvents: aArrastar ? 'none' : 'auto',
        filter: aArrastar ? 'drop-shadow(0 10px 18px rgba(0,0,0,0.45))' : 'none',
      }}
    >
      {onMoveTo && (
        <button
          type="button"
          onPointerDown={comecar}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Arrastar para outro dia: ${isEvento ? type.label : (student?.name || 'aula')}`}
          title="Arrastar para outro dia"
          className="absolute rounded btn-surface"
          // Alvo de toque generoso com icone pequeno: 17x21 era demasiado
          // apertado para um dedo. O padding cresce, o desenho fica igual.
          style={{
            right: 0, bottom: 0, zIndex: 2,
            padding: '10px 9px', touchAction: 'none', cursor: 'grab', lineHeight: 0,
          }}
        >
          <GripVertical size={13} className="text-faint" style={{ display: 'block' }} />
        </button>
      )}
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
      className={`rounded-lg border border-hair pl-3 pr-1.5 py-2.5 cursor-pointer card-hover animate-in ${isCancelado ? 'opacity-50' : ''}`}
      // Sem borderColor: a abreviada entra em conflito com borderLeftColor e o
      // React avisa. O retorno do arrasto vem do realce da coluna e da sombra,
      // que ja chegam.
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderStyle: isEvento ? 'dashed solid solid dashed' : 'solid',
        borderLeftWidth: '3px',
        borderLeftColor: color,
      }}
    >
      {/* Compacto: hora + ações na 1.ª linha, nome na 2.ª, estado com a linha
          toda na 3.ª — assim "Agendado" nunca é cortado a meio. */}
      {compact ? (
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-2xs text-muted nowrap">{session.startTime}</span>
            <span className="rounded p-0.5 flex-shrink-0" style={{ backgroundColor: `${type.color}22` }}>
              <TypeIcon size={10} style={{ color: type.color, display: 'block' }} />
            </span>
            <span className="flex-1" />
            {!isEvento && (
              <span className="flex gap-0.5 flex-shrink-0">
                {!isRealizado && !isCancelado && !isFalta && (
                  <button onClick={(e) => { e.stopPropagation(); onQuickStatus(session, 'realizado'); }} type="button" className="p-1 rounded btn-surface" aria-label="Marcar como realizado" title="Marcar como realizado">
                    <CheckCircle2 size={13} className="text-slate-acc" style={{ display: 'block' }} />
                  </button>
                )}
                {!isFalta && !isCancelado && (
                  <button onClick={(e) => { e.stopPropagation(); onQuickStatus(session, 'falta'); }} type="button" className="p-1 rounded btn-surface" aria-label="Reportar falta" title="Reportar falta">
                    <UserX size={13} className="text-rust" style={{ display: 'block' }} />
                  </button>
                )}
              </span>
            )}
          </div>
          <div
            className={`font-body text-sm text-primary truncate ${isFalta ? 'line-through' : ''}`}
            style={{ fontWeight: 500 }}
            title={isEvento ? type.label : (student?.name || 'Aluno removido')}
          >
            {isEvento ? type.label : (student?.name || 'Aluno removido')}
          </div>
          <span className="badge self-start" style={{ color: statusInfo?.color, backgroundColor: `${statusInfo?.color}1F` }}>
            {statusInfo?.label}
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1 min-w-0">
                <span className="font-mono text-2xs text-muted nowrap">{session.startTime}</span>
                <span className="rounded p-0.5 flex-shrink-0" style={{ backgroundColor: `${type.color}22` }}>
                  <TypeIcon size={10} style={{ color: type.color, display: 'block' }} />
                </span>
                {!isEvento && <span className="text-2xs font-body text-faint truncate">{type.label}</span>}
              </div>
              <div
                className={`font-body text-sm text-primary truncate ${isFalta ? 'line-through' : ''}`}
                style={{ fontWeight: 500 }}
                title={isEvento ? type.label : (student?.name || 'Aluno removido')}
              >
                {isEvento ? type.label : (student?.name || 'Aluno removido')}
              </div>
            </div>
            {!isEvento && (
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                {!isRealizado && !isCancelado && !isFalta && (
                  <button onClick={(e) => { e.stopPropagation(); onQuickStatus(session, 'realizado'); }} type="button" className="p-1 rounded btn-surface" aria-label="Marcar como realizado" title="Marcar como realizado">
                    <CheckCircle2 size={14} className="text-slate-acc" style={{ display: 'block' }} />
                  </button>
                )}
                {!isFalta && !isCancelado && (
                  <button onClick={(e) => { e.stopPropagation(); onQuickStatus(session, 'falta'); }} type="button" className="p-1 rounded btn-surface" aria-label="Reportar falta" title="Reportar falta">
                    <UserX size={14} className="text-rust" style={{ display: 'block' }} />
                  </button>
                )}
              </div>
            )}
          </div>
          <span className="badge mt-1.5" style={{ color: statusInfo?.color, backgroundColor: `${statusInfo?.color}1F` }}>
            {statusInfo?.label}
          </span>
        </>
      )}
    </div>
    </div>
  );
}

/* ============================== HEADER + NAV ============================== */

function Header({ onOpenSettings }) {
  const now = new Date();
  const dateLabel = `${DAY_NAMES[now.getDay()]}, ${now.getDate()} de ${MONTH_NAMES[now.getMonth()]}`;
  return (
    <header className="border-b border-hair" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src={LOGO_SRC} alt="" style={{ width: 30, height: 30, flexShrink: 0 }} />
          <span className="font-display font-semibold text-xl tracking-wide truncate text-primary">PT<span style={{ color: 'var(--brass)' }}>MANAGER</span></span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs font-body text-faint hidden sm:inline">{dateLabel}</span>
          <button onClick={onOpenSettings} type="button" className="p-2 rounded-lg btn-surface border border-transparent" aria-label="Definições" title="Definições">
            <Settings size={17} className="text-muted" style={{ display: 'block' }} />
          </button>
        </div>
      </div>
    </header>
  );
}

// Semana e Mês são a mesma informação em escalas diferentes: partilham o
// separador Agenda, com alternância interna. Mantém a barra em 6 itens.
const NAV_TABS = [
  { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'faltas', label: 'Faltas', icon: UserX },
  { id: 'students', label: 'Alunos', icon: Users },
  { id: 'assessments', label: 'Avaliações', icon: Activity },
  { id: 'finances', label: 'Finanças', icon: Wallet },
];

// Desktop/tablet: separadores no topo. Telemóvel: barra fixa no fundo, ao alcance
// do polegar, com área de toque de 56px e respeito pela safe-area do iOS.
function NavTabs({ view, setView, isAdmin }) {
  // O separador Admin é acrescentado só para administradores. Isto é apenas
  // cosmético: quem autoriza é a Edge Function, que valida o e-mail no servidor.
  const tabs = isAdmin ? [...NAV_TABS, { id: 'admin', label: 'Admin', icon: ShieldCheck }] : NAV_TABS;
  return (
    <>
      <nav className="border-b border-hair sticky top-0 hidden sm:block" style={{ zIndex: 30, backgroundColor: 'var(--bg-surface)' }} aria-label="Navegação principal">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = view === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                type="button"
                aria-current={active ? 'page' : undefined}
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-body flex-shrink-0 btn-surface"
                style={{
                  color: active ? 'var(--brass)' : 'var(--text-muted)',
                  borderBottom: active ? '2px solid var(--brass)' : '2px solid transparent',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <Icon size={15} style={{ display: 'block' }} /> {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <nav
        className="fixed bottom-0 left-0 right-0 border-t border-hair sm:hidden"
        style={{ zIndex: 30, backgroundColor: 'var(--bg-surface)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Navegação principal"
      >
        <div className="flex">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = view === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                type="button"
                aria-current={active ? 'page' : undefined}
                className="flex-1 flex flex-col items-center justify-center gap-1 min-w-0"
                style={{ height: 56, color: active ? 'var(--brass)' : 'var(--text-faint)' }}
              >
                <Icon size={18} style={{ display: 'block' }} />
                <span className="font-body truncate w-full text-center px-0.5" style={{ fontSize: '0.625rem', lineHeight: 1, fontWeight: active ? 600 : 400 }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/* ============================== DASHBOARD ============================== */

function Dashboard({ students, sessions, finances, customCategories, setView, onAddSession, onOpenSession, onQuickStatus }) {
  const activeStudents = useMemo(() => students.filter((s) => s.active), [students]);

  const totals = useMemo(() => activeStudents.reduce((acc, s) => {
    const f = studentFinance(s);
    acc.gross += f.gross; acc.tax += f.tax; acc.gymFee += f.gymFee; acc.net += f.net;
    return acc;
  }, { gross: 0, tax: 0, gymFee: 0, net: 0 }), [activeStudents]);

  const today = fmtDateISO(new Date());
  const bounds = useMemo(() => periodBounds(), []);

  const todaySessions = useMemo(() => sessions.filter((s) => s.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime)), [sessions, today]);
  const weekSessions = useMemo(() => sessions.filter((s) => s.kind !== 'evento' && s.date >= bounds.weekStart && s.date <= bounds.weekEnd), [sessions, bounds]);
  const monthSessions = useMemo(() => sessions.filter((s) => s.kind !== 'evento' && s.date >= bounds.monthStart && s.date <= bounds.monthEnd), [sessions, bounds]);

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

  // Mesma função usada pela aba Finanças: a entrada automática dos alunos entra
  // nos dois sítios com o mesmo valor.
  const financeMonthTx = useMemo(() => {
    const now = new Date();
    return monthTransactions(finances, students, now.getFullYear(), now.getMonth());
  }, [finances, students]);
  const financeEntradasMes = financeMonthTx.filter((t) => t.type === 'entrada').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const financeSaidasMes = financeMonthTx.filter((t) => t.type === 'gasto').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const financeSaldoMes = financeEntradasMes - financeSaidasMes;
  const financePendenciasMes = financeMonthTx.filter((t) => t.status === 'pendente').length;
  const financeCategoryData = useMemo(() => [...EXPENSE_CATEGORIES, ...customCategories.expense].map((c) => ({
    name: c.label, color: c.color, value: financeMonthTx.filter((t) => t.type === 'gasto' && t.category === c.id).reduce((s, t) => s + (Number(t.amount) || 0), 0),
  })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value), [financeMonthTx, customCategories]);

  const typeDistData = useMemo(() => [...SESSION_TYPES, ...customCategories.sessionTypes].map((t) => ({
    name: t.label, value: weekSessions.filter((s) => s.type === t.id).length, color: t.color,
  })).filter((d) => d.value > 0), [weekSessions, customCategories]);

  // Todos os alunos ativos (antes cortava nos 6 primeiros e escondia o resto).
  // O nome completo vai no tooltip; o eixo mostra uma versão curta mas única.
  const studentRevenueData = useMemo(() => {
    const firstNames = {};
    activeStudents.forEach((s) => {
      const first = (s.name || '').trim().split(/\s+/)[0] || '—';
      firstNames[first] = (firstNames[first] || 0) + 1;
    });
    return [...activeStudents]
      .map((s) => {
        const parts = (s.name || '').trim().split(/\s+/);
        const first = parts[0] || '—';
        // Se houver nomes próprios repetidos, junta a inicial do apelido.
        const short = firstNames[first] > 1 && parts[1] ? `${first} ${parts[1][0]}.` : first;
        const f = studentFinance(s);
        return { name: short, fullName: s.name, bruto: f.gross, liquido: f.net, color: s.color };
      })
      .sort((a, b) => b.liquido - a.liquido);
  }, [activeStudents]);

  // Altura cresce com o nº de alunos para nenhum ficar escondido.
  const revenueChartHeight = Math.max(220, studentRevenueData.length * 34 + 40);

  // Entradas e saídas pessoais agrupadas por semana do mês (mais legível que
  // dia a dia num ecrã estreito, e não fica vazio quando há poucos lançamentos).
  const personalFlowData = useMemo(() => {
    const weeks = [1, 2, 3, 4, 5].map((w) => ({ label: `S${w}`, entradas: 0, saidas: 0 }));
    financeMonthTx.forEach((t) => {
      const dayOfMonth = Number(String(t.date).slice(8, 10)) || 1;
      const idx = Math.min(4, Math.floor((dayOfMonth - 1) / 7));
      const amount = Number(t.amount) || 0;
      if (t.type === 'entrada') weeks[idx].entradas += amount;
      else weeks[idx].saidas += amount;
    });
    return weeks.filter((w) => w.entradas > 0 || w.saidas > 0);
  }, [financeMonthTx]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  if (students.length === 0) {
    return (
      <div className="px-4 py-4 max-w-6xl mx-auto">
        <EmptyState icon={Users} message="Nenhum aluno registado ainda. Registe seu primeiro aluno para ver o painel financeiro e montar sua agenda." cta="Registar aluno" onCta={() => setView('students')} />
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
                  <Tooltip contentStyle={CHART.tooltip} labelStyle={CHART.tooltipLabel} itemStyle={CHART.tooltipItem} cursor={CHART.cursor} />
                  <Legend wrapperStyle={CHART.legend} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ErrorBoundary>
        </div>
        <div className="bg-surface border border-hair rounded-xl p-4 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <span className="text-2xs uppercase tracking-wide text-faint font-mono">Bruto vs. Líquido por Aluno</span>
            <span className="text-2xs font-body text-faint">{plural(studentRevenueData.length, 'aluno', 'alunos')}</span>
          </div>
          <ErrorBoundary compact>
            {studentRevenueData.length === 0 ? (
              <EmptyState icon={Users} message="Ainda não há alunos ativos." hint="Registe um aluno com valor de plano para comparar o que entra e o que sobra depois de impostos e taxa de ginásio." />
            ) : (
              // Rola na vertical quando há muitos alunos, em vez de os esconder.
              <div style={{ maxHeight: 340, overflowY: 'auto', overflowX: 'hidden' }}>
                <ResponsiveContainer width="100%" height={revenueChartHeight}>
                  <BarChart data={studentRevenueData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }} barGap={2}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={92} tick={CHART.tick} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={CHART.cursor}
                      contentStyle={CHART.tooltip}
                      labelStyle={CHART.tooltipLabel}
                      itemStyle={CHART.tooltipItem}
                      formatter={(v, n) => [currency(v), n === 'bruto' ? 'Bruto' : 'Líquido']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                    />
                    <Legend wrapperStyle={CHART.legend} formatter={(v) => (v === 'bruto' ? 'Bruto' : 'Líquido')} />
                    <Bar dataKey="bruto" fill="var(--slate-acc)" radius={[0, 3, 3, 0]} barSize={9} />
                    <Bar dataKey="liquido" fill="var(--brass)" radius={[0, 3, 3, 0]} barSize={9} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
        {todaySessions.length === 0 ? <EmptyState message="Nada agendado para hoje." /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {todaySessions.map((s) => {
              const student = students.find((st) => st.id === s.studentId);
              return <SessionCard key={s.id} session={s} student={student} onOpen={() => onOpenSession(s)} onQuickStatus={onQuickStatus} customCategories={customCategories} />;
            })}
          </div>
        )}
      </div>

      <div>
        <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-3">Aulas por Aluno (Semana / Mês / Ano)</div>

        <div className="sm:hidden flex flex-col gap-2">
          {activeStudents.map((s) => (
            <StudentSessionsCard
              key={s.id}
              student={s}
              weekCount={countActiveSessions(s.id, bounds.weekStart, bounds.weekEnd, sessions)}
              monthCount={countActiveSessions(s.id, bounds.monthStart, bounds.monthEnd, sessions)}
              yearCount={countActiveSessions(s.id, bounds.yearStart, bounds.yearEnd, sessions)}
              pendingFaltasCount={pendingFaltas(s.id, sessions)}
            />
          ))}
        </div>

        <div className="hidden sm:block bg-surface border border-hair rounded-xl overflow-x-auto">
          <table className="w-full text-sm font-body" style={{ minWidth: '520px' }}>
            <thead>
              <tr className="border-b border-hair text-left">
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium whitespace-nowrap">Aluno</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right whitespace-nowrap">Semana</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right whitespace-nowrap">Mês</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right whitespace-nowrap">Ano</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right whitespace-nowrap">Faltas Pend.</th>
              </tr>
            </thead>
            <tbody>
              {activeStudents.map((s) => {
                const pf = pendingFaltas(s.id, sessions);
                return (
                  <tr key={s.id} className="border-b border-hair">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2 max-w-[140px] sm:max-w-[220px]">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-primary truncate min-w-0" title={s.name}>{s.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-primary whitespace-nowrap">{countActiveSessions(s.id, bounds.weekStart, bounds.weekEnd, sessions)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-primary whitespace-nowrap">{countActiveSessions(s.id, bounds.monthStart, bounds.monthEnd, sessions)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-primary whitespace-nowrap">{countActiveSessions(s.id, bounds.yearStart, bounds.yearEnd, sessions)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold whitespace-nowrap" style={{ color: pf > 0 ? 'var(--rust)' : 'var(--text-faint)' }}>{pf}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-3">Detalhamento Financeiro por Aluno</div>

        <div className="sm:hidden flex flex-col gap-2">
          {activeStudents.map((s) => (
            <StudentFinanceCard key={s.id} student={s} finance={studentFinance(s)} />
          ))}
        </div>

        <div className="hidden sm:block bg-surface border border-hair rounded-xl overflow-x-auto">
          <table className="w-full text-sm font-body" style={{ minWidth: '560px' }}>
            <thead>
              <tr className="border-b border-hair text-left">
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium whitespace-nowrap">Aluno</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium whitespace-nowrap">Plano</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right whitespace-nowrap">Bruto</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right whitespace-nowrap">Imposto</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right whitespace-nowrap">Taxa Ginásio</th>
                <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right whitespace-nowrap">Líquido</th>
              </tr>
            </thead>
            <tbody>
              {activeStudents.map((s) => {
                const f = studentFinance(s);
                return (
                  <tr key={s.id} className="border-b border-hair">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2 max-w-[120px] sm:max-w-[200px]">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-primary truncate min-w-0" title={s.name}>{s.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted whitespace-nowrap">{s.planType}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-primary whitespace-nowrap">{currency(f.gross)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-rust whitespace-nowrap">{currency(f.tax)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-acc whitespace-nowrap">{currency(f.gymFee)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-brass font-semibold whitespace-nowrap">{currency(f.net)}</td>
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
          <StatCard label="Saldo" value={currency(financeSaldoMes)} icon={Activity} accent={financeSaldoMes >= 0 ? 'sky' : 'rust'} sub={financePendenciasMes > 0 ? `${plural(financePendenciasMes, 'pendência', 'pendências')}` : undefined} />
        </div>
        {financeCategoryData.length === 0 ? (
          <div className="bg-surface border border-hair rounded-xl">
            <EmptyState icon={Wallet} message="Nenhum gasto pessoal lançado este mês ainda." cta="Ir para Finanças" onCta={() => setView('finances')} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-surface border border-hair rounded-xl p-4 min-w-0">
              <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-2">Gastos Pessoais por Categoria</div>
              <ErrorBoundary compact>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={financeCategoryData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {financeCategoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => currency(v)} contentStyle={CHART.tooltip} labelStyle={CHART.tooltipLabel} itemStyle={CHART.tooltipItem} cursor={CHART.cursor} />
                    <Legend wrapperStyle={CHART.legend} />
                  </PieChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            </div>
            <div className="bg-surface border border-hair rounded-xl p-4 min-w-0">
              <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-2">Movimentações do Mês (Entradas vs. Saídas)</div>
              <ErrorBoundary compact>
                {personalFlowData.length === 0 ? (
                  <EmptyState icon={Wallet} message="Sem movimentações este mês." hint="Lance entradas e gastos em Finanças para ver a evolução do saldo ao longo do mês." />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={personalFlowData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                      <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={CHART.tick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={CHART.tick} axisLine={false} tickLine={false} width={44} />
                      <Tooltip
                        cursor={CHART.cursor}
                        contentStyle={CHART.tooltip}
                        labelStyle={CHART.tooltipLabel}
                        itemStyle={CHART.tooltipItem}
                        formatter={(v, n) => [currency(v), n === 'entradas' ? 'Entradas' : 'Saídas']}
                      />
                      <Legend wrapperStyle={CHART.legend} formatter={(v) => (v === 'entradas' ? 'Entradas' : 'Saídas')} />
                      <Bar dataKey="entradas" fill="var(--brass)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="saidas" fill="var(--rust)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ErrorBoundary>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== WEEKLY VIEW ============================== */

function DayColumn({ date, sessionsList, onOpenSession, onQuickStatus, onAddSession, onPasteSession, onMoveSession, temCopia, horario, students, compact, customCategories }) {
  const iso = fmtDateISO(date);
  const isToday = iso === fmtDateISO(new Date());
  const fechado = horario && !horario.aberto;
  return (
    <div
      // data-day-iso e o alvo que o arrasto procura com elementFromPoint.
      data-day-iso={iso}
      className="bg-surface border border-hair rounded-xl p-3 flex flex-col min-w-0"
      style={{
        minHeight: '140px',
        borderColor: isToday ? 'var(--brass)' : 'var(--border-hair)',
        // Dia fechado continua a aceitar marcacoes: esbate-se para avisar, nao para bloquear.
        opacity: fechado ? 0.55 : 1,
      }}
    >
      <div className="flex items-center justify-between gap-1 mb-2 min-w-0">
        <div className="min-w-0">
          <div className="text-2xs uppercase tracking-wide text-muted font-body nowrap">{compact ? DAY_SHORT[date.getDay()] : DAY_NAMES[date.getDay()]}</div>
          <div className={`font-display font-medium text-lg nowrap ${isToday ? 'text-brass' : 'text-primary'}`}>{fmtDateBR(date)}</div>
          {horario && (
            <div className="text-2xs font-mono text-faint nowrap">{fechado ? 'Fechado' : `${horario.inicio}–${horario.fim}`}</div>
          )}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {temCopia && onPasteSession && (
            <button onClick={() => onPasteSession(iso)} type="button" className="p-1.5 rounded-lg btn-surface" aria-label="Colar aqui" title="Colar aqui">
              <ClipboardPaste size={16} className="text-brass" style={{ display: 'block' }} />
            </button>
          )}
          <button onClick={() => onAddSession(iso)} type="button" className="p-1.5 rounded-lg btn-surface" aria-label="Adicionar">
            <Plus size={16} className="text-muted" style={{ display: 'block' }} />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2 min-w-0">
        {sessionsList.length === 0 && <div className="text-xs text-faint font-body py-3 text-center">Nada agendado</div>}
        {sessionsList.map((s) => {
          const student = students.find((st) => st.id === s.studentId);
          return <SessionCard key={s.id} session={s} student={student} onOpen={() => onOpenSession(s)} onQuickStatus={onQuickStatus} onMoveTo={onMoveSession} customCategories={customCategories} compact={compact} />;
        })}
      </div>
    </div>
  );
}

function WeeklyView({ sessions, students, weekStart, setWeekStart, onOpenSession, onQuickStatus, onAddSession, onPasteSession, onMoveSession, onLibertarSemana, temCopia, definicoes, customCategories }) {
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

  // Horários livres a criar nesta semana: uma faixa por hora cheia dentro do
  // horário de funcionamento, saltando o que já está ocupado. Só conta o futuro
  // — libertar ontem não serve para nada.
  const livresACriar = useMemo(() => {
    if (!definicoes) return [];
    const agoraIso = fmtDateISO(new Date());
    const novos = [];
    for (const d of days) {
      const iso = fmtDateISO(d);
      if (iso < agoraIso) continue;
      const h = horarioDoDia(definicoes, iso);
      if (!h.aberto) continue;
      const doDia = sessions.filter((x) => x.date === iso);
      for (let m = minutosDe(h.inicio); m + 60 <= minutosDe(h.fim); m += 60) {
        const faixa = { date: iso, startTime: horaDe(m), endTime: horaDe(m + 60) };
        if (doDia.some((x) => sessoesChocam(x, faixa))) continue;
        novos.push(faixa);
      }
    }
    return novos;
  }, [days, sessions, definicoes]);

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

      {onLibertarSemana && (
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <span className="text-2xs font-body text-faint">
            {livresACriar.length === 0
              ? 'Sem espaços livres por preencher nesta semana.'
              : `${plural(livresACriar.length, 'hora livre', 'horas livres')} por preencher dentro do horário.`}
          </span>
          <button
            type="button"
            disabled={livresACriar.length === 0}
            onClick={() => onLibertarSemana(livresACriar)}
            className="btn btn-ghost flex-shrink-0"
            style={{ fontSize: 12, opacity: livresACriar.length === 0 ? 0.45 : 1 }}
          >
            <Coffee size={14} /> Libertar horários da semana
          </button>
        </div>
      )}

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
              style={{ backgroundColor: active ? 'rgba(30,166,180,0.12)' : 'var(--bg-surface)', borderColor: active ? 'var(--brass)' : 'var(--border-hair)' }}
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
        <DayColumn date={days.find((d) => fmtDateISO(d) === selectedDay) || days[0]} sessionsList={sessionsForDay(selectedDay)} students={students} onOpenSession={onOpenSession} onQuickStatus={onQuickStatus} onAddSession={onAddSession} onPasteSession={onPasteSession} onMoveSession={onMoveSession} temCopia={temCopia} horario={horarioDoDia(definicoes, selectedDay)} customCategories={customCategories} />
      </div>

      {/* Largura mínima por coluna: abaixo disso os nomes ficavam ilegíveis.
          Se não couber, a semana desliza na horizontal em vez de esmagar. */}
      <div className="hidden md:block overflow-x-auto pb-1">
        <div className="grid grid-cols-7 gap-3" style={{ minWidth: 980 }}>
          {days.map((d) => {
            const iso = fmtDateISO(d);
            return <DayColumn key={iso} date={d} sessionsList={sessionsForDay(iso)} students={students} onOpenSession={onOpenSession} onQuickStatus={onQuickStatus} onAddSession={onAddSession} onPasteSession={onPasteSession} onMoveSession={onMoveSession} temCopia={temCopia} horario={horarioDoDia(definicoes, iso)} compact customCategories={customCategories} />;
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================== MONTHLY VIEW ============================== */

function MonthlyView({ sessions, students, monthCursor, setMonthCursor, onOpenDay, customCategories }) {
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
                  if (s.kind === 'evento') {
                    const type = eventTypeFor(s.type, customCategories);
                    return <span key={s.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: type.color }} />;
                  }
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

function DayDetailModal({ iso, sessions, students, onClose, onOpenSession, onQuickStatus, onAddSession, customCategories }) {
  const date = new Date(`${iso}T00:00:00`);
  const list = sessions.filter((s) => s.date === iso).sort((a, b) => a.startTime.localeCompare(b.startTime));
  return (
    <Modal onClose={onClose} title={`${DAY_NAMES[date.getDay()]}, ${fmtDateBR(date)}`}>
      <div className="flex justify-end mb-3">
        <button onClick={() => { onAddSession(iso); onClose(); }} type="button" className="flex items-center gap-1.5 text-xs font-body px-3 py-1.5 rounded-lg border border-hair" style={{ backgroundColor: 'rgba(30,166,180,0.12)', color: 'var(--brass)' }}>
          <Plus size={14} /> Adicionar
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {list.length === 0 && <EmptyState message="Nada agendado neste dia." />}
        {list.map((s) => {
          const student = students.find((st) => st.id === s.studentId);
          return <SessionCard key={s.id} session={s} student={student} onOpen={() => { onOpenSession(s); onClose(); }} onQuickStatus={onQuickStatus} customCategories={customCategories} />;
        })}
      </div>
    </Modal>
  );
}

/* ============================== STUDENTS VIEW ============================== */

const STUDENT_SORTS = [
  { id: 'az', label: 'Nome (A–Z)' },
  { id: 'za', label: 'Nome (Z–A)' },
  { id: 'plano_desc', label: 'Plano (maior primeiro)' },
  { id: 'plano_asc', label: 'Plano (menor primeiro)' },
];

function StudentsView({ students, sessions, onEdit, onNew }) {
  const [filter, setFilter] = useState('ativos');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('az');

  // A ordenação aplica-se a todos os alunos filtrados, não só aos visíveis.
  const filtered = useMemo(() => {
    // Procura sem acentos: escrever "alvaro" encontra "Álvaro".
    const norm = (v) => (v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const term = norm(search);
    const list = students.filter((s) => {
      if (filter === 'ativos' && !s.active) return false;
      if (term && !norm(s.name).includes(term)) return false;
      return true;
    });
    // Alunos sem valor de plano vão para o fim em ambas as ordenações por plano.
    const planValueOf = (s) => {
      const v = studentGross(s);
      return Number.isFinite(v) ? v : 0;
    };
    const sorted = [...list];
    if (sortBy === 'az') sorted.sort((a, b) => byNamePt(a.name, b.name));
    else if (sortBy === 'za') sorted.sort((a, b) => byNamePt(b.name, a.name));
    else if (sortBy === 'plano_desc') sorted.sort((a, b) => planValueOf(b) - planValueOf(a) || byNamePt(a.name, b.name));
    else if (sortBy === 'plano_asc') sorted.sort((a, b) => planValueOf(a) - planValueOf(b) || byNamePt(a.name, b.name));
    return sorted;
  }, [students, filter, search, sortBy]);

  return (
    <div className="px-4 py-4 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold text-2xl text-primary tracking-wide">Alunos</h1>
        <button onClick={onNew} type="button" className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0A0A0A' }}>
          <UserPlus size={15} /> Novo Aluno
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute text-faint" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Procurar aluno..." aria-label="Procurar aluno" className="input-field" style={{ paddingLeft: '34px' }} />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Ordenar alunos"
            className="input-field"
            style={{ width: 'auto', minWidth: 165 }}
          >
            {STUDENT_SORTS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <div className="flex rounded-lg border border-hair overflow-hidden flex-shrink-0">
            <button onClick={() => setFilter('ativos')} type="button" className="px-3 py-2 text-xs font-body nowrap" style={{ backgroundColor: filter === 'ativos' ? 'var(--bg-elevated)' : 'transparent', color: filter === 'ativos' ? 'var(--text-primary)' : 'var(--text-muted)' }}>Ativos</button>
            <button onClick={() => setFilter('todos')} type="button" className="px-3 py-2 text-xs font-body nowrap" style={{ backgroundColor: filter === 'todos' ? 'var(--bg-elevated)' : 'transparent', color: filter === 'todos' ? 'var(--text-primary)' : 'var(--text-muted)' }}>Todos</button>
          </div>
        </div>
      </div>
      <div className="text-2xs font-body text-faint">{plural(filtered.length, 'aluno', 'alunos')}</div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} message={students.length === 0 ? 'Nenhum aluno registado ainda.' : 'Nenhum aluno encontrado.'} cta={students.length === 0 ? 'Registar primeiro aluno' : undefined} onCta={onNew} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((s) => {
            const f = studentFinance(s);
            const pf = pendingFaltas(s.id, sessions);
            return (
              <div key={s.id} onClick={() => onEdit(s)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onEdit(s); }} className="card card-hover p-4 cursor-pointer">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <div className="min-w-0">
                      <div className="font-body text-sm font-semibold text-primary truncate">{s.name}</div>
                      <div className="text-xs text-faint font-body truncate">{s.planType}{s.memberNumber ? ` · Sócio ${s.memberNumber}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {!s.active && <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-faint)' }}>Inativo</span>}
                    {pf > 0 && (
                      <span className="badge" style={{ backgroundColor: 'var(--rust-soft)', color: 'var(--rust)' }}>
                        <UserX size={10} />{pf} {pf > 1 ? 'faltas' : 'falta'}
                      </span>
                    )}
                  </div>
                </div>
                <RevenueLoadBar gross={f.gross} tax={f.tax} gymFee={f.gymFee} net={f.net} height={16} showLabels={false} />
                <div className="flex items-end justify-between mt-2.5 gap-2">
                  <span className="flex flex-col min-w-0">
                    <span className="text-2xs uppercase tracking-wide text-faint font-body">Bruto</span>
                    <span className="font-mono text-xs text-muted">{currency(f.gross)}</span>
                  </span>
                  <span className="flex flex-col items-end min-w-0">
                    <span className="text-2xs uppercase tracking-wide text-faint font-body">Líquido</span>
                    <span className="font-mono text-sm text-brass font-semibold">{currency(f.net)}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StudentFormModal({ student, sessions, customCategories, treinoCount = 0, onAddCategory, onSave, onClose, onDelete, onGoToAssessments, onGoToTreinos, onGoToSession, onAgendarReposicao }) {
  const isEdit = !!student;
  const [form, setForm] = useState(() => (student ? { ...student, quinzenasPagas: student.quinzenasPagas || {} } : {
    id: uid(), name: '', color: STUDENT_COLORS[Math.floor(Math.random() * STUDENT_COLORS.length)],
    active: true, memberNumber: '', sex: '', planType: PLAN_TYPES[0],
    paymentMode: 'mensal', planValue: '', biweeklyValue: '', quinzenasPagas: {},
    taxPercent: '', gymFeeType: 'percent', gymFeeValue: '', phone: '', height: '', notes: '',
  }));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const allPlanTypes = [...PLAN_TYPES, ...customCategories.planTypes];

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  const currentMonthKey = monthKeyOf(new Date());
  const quinzenaMarks = form.quinzenasPagas?.[currentMonthKey] || [false, false, false, false];
  function toggleQuinzena(i) {
    const next = [...quinzenaMarks];
    next[i] = !next[i];
    setForm((f) => ({ ...f, quinzenasPagas: { ...f.quinzenasPagas, [currentMonthKey]: next } }));
  }

  const finance = studentFinance({
    ...form,
    planValue: parseFloat(form.planValue) || 0,
    biweeklyValue: parseFloat(form.biweeklyValue) || 0,
    taxPercent: parseFloat(form.taxPercent) || 0,
    gymFeeValue: parseFloat(form.gymFeeValue) || 0,
  });

  const pf = isEdit ? pendingFaltas(student.id, sessions) : 0;
  const assessmentCount = isEdit ? sessions.filter((s) => s.studentId === student.id && s.type === 'avaliacao' && (s.assessWeight || s.assessBodyFat)).length : 0;

  function handleSubmit() {
    if (!form.name.trim()) { setError('Informe o nome do aluno.'); return; }
    if (form.paymentMode === 'mensal') {
      const pv = parseFloat(form.planValue);
      if (Number.isNaN(pv) || pv < 0) { setError('Informe um valor de plano válido.'); return; }
    } else {
      const bv = parseFloat(form.biweeklyValue);
      if (Number.isNaN(bv) || bv < 0) { setError('Informe um valor de quinzena válido.'); return; }
    }
    setError('');
    onSave({
      ...form,
      planValue: parseFloat(form.planValue) || 0,
      biweeklyValue: parseFloat(form.biweeklyValue) || 0,
      taxPercent: parseFloat(form.taxPercent) || 0,
      gymFeeValue: parseFloat(form.gymFeeValue) || 0,
      height: parseFloat(form.height) || '',
    });
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
                {form.color === c && <Check size={13} color="#0A0A0A" />}
              </button>
            ))}
            <input type="color" value={form.color} onChange={(e) => set('color', e.target.value)} className="w-7 h-7 rounded-full" aria-label="Cor personalizada" />
          </div>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nº de sócio">
            <input value={form.memberNumber} onChange={(e) => set('memberNumber', e.target.value)} className="input-field" placeholder="Ex: 4521" />
          </FormField>
          <FormField label="Status">
            <select value={form.active ? '1' : '0'} onChange={(e) => set('active', e.target.value === '1')} className="input-field">
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tipo de plano">
            <select value={form.planType} onChange={(e) => set('planType', e.target.value)} className="input-field">
              {allPlanTypes.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <AddCategoryInline placeholder="Ex: Duplas" onAdd={(label) => { onAddCategory('planTypes', label); set('planType', label); }} />
          </FormField>
          <FormField label="Sexo biológico (p/ avaliações)">
            <select value={form.sex} onChange={(e) => set('sex', e.target.value)} className="input-field">
              <option value="">Não definido</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </FormField>
        </div>

        <FormField label="Modelo de pagamento">
          <select value={form.paymentMode} onChange={(e) => set('paymentMode', e.target.value)} className="input-field">
            {PAYMENT_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </FormField>

        {form.paymentMode === 'mensal' && (
          <FormField label="Valor do plano (€/mês)">
            <input type="number" inputMode="decimal" min="0" step="0.01" value={form.planValue} onChange={(e) => set('planValue', e.target.value)} className="input-field" placeholder="0,00" />
          </FormField>
        )}

        {(form.paymentMode === 'quinzenal' || form.paymentMode === 'quinzenas_pagas') && (
          <FormField label="Valor da quinzena (€)">
            <input type="number" inputMode="decimal" min="0" step="0.01" value={form.biweeklyValue} onChange={(e) => set('biweeklyValue', e.target.value)} className="input-field" placeholder="0,00" />
          </FormField>
        )}

        {form.paymentMode === 'quinzenas_pagas' && (
          <QuinzenaDots marks={quinzenaMarks} onToggle={toggleQuinzena} label={`Quinzenas pagas — ${MONTH_NAMES[new Date().getMonth()]}`} />
        )}

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
          <div className="flex items-center gap-2 text-sm font-body px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--rust-soft)', color: 'var(--rust)' }}>
            <UserX size={15} /> {plural(pf, 'reposição pendente', 'reposições pendentes')}
          </div>
        )}

        {isEdit && (
          <div className="flex flex-col gap-2">
            <div className="text-2xs uppercase tracking-wide text-faint font-mono">Histórico de faltas</div>
            <FaltasDoAluno
              studentId={student.id}
              sessions={sessions}
              onOpenSession={(s) => { onClose(); onGoToSession(s); }}
              onAgendarReposicao={(f) => { onClose(); onAgendarReposicao(f); }}
            />
          </div>
        )}

        <div className="bg-elevated rounded-lg p-3 border border-hair">
          <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-2">Prévia do líquido (mês atual)</div>
          <RevenueLoadBar gross={finance.gross} tax={finance.tax} gymFee={finance.gymFee} net={finance.net} height={24} />
        </div>

        {isEdit && (
          <button type="button" onClick={() => onGoToAssessments(student)} className="flex items-center justify-between text-sm font-body px-3 py-2.5 rounded-lg border border-hair btn-surface">
            <span className="flex items-center gap-2 text-primary"><Activity size={15} className="text-brass" /> Avaliações Físicas</span>
            <span className="text-2xs text-faint font-mono">{plural(assessmentCount, 'registada', 'registadas')} →</span>
          </button>
        )}

        {isEdit && onGoToTreinos && (
          <button type="button" onClick={() => onGoToTreinos(student)} className="flex items-center justify-between text-sm font-body px-3 py-2.5 rounded-lg border border-hair btn-surface">
            <span className="flex items-center gap-2 text-primary"><Dumbbell size={15} className="text-brass" /> Treinos</span>
            <span className="text-2xs text-faint font-mono">{plural(treinoCount, 'programa', 'programas')} →</span>
          </button>
        )}

        {error && <div className="text-sm font-body text-rust">{error}</div>}

        <div className="flex gap-2 pt-2 mobile-stack">
          {isEdit && (
            <button onClick={() => setConfirmDelete(true)} type="button" className="px-4 py-2.5 rounded-lg text-sm font-body border border-hair text-rust btn-surface">
              <Trash2 size={15} className="inline mr-1.5" style={{ marginTop: '-2px' }} />Eliminar
            </button>
          )}
          <button onClick={handleSubmit} type="button" className="flex-1 px-4 py-2.5 rounded-lg text-sm font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0A0A0A' }}>
            Guardar Aluno
          </button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar aluno"
          message={`Tem a certeza de que pretende eliminar ${form.name || 'este aluno'}? Todas as aulas e avaliações registadas para ele também serão removidas.`}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { onDelete(form.id); setConfirmDelete(false); }}
        />
      )}
    </Modal>
  );
}

/* ============================== SESSION FORM MODAL ============================== */

function SessionFormModal({ session, students, defaultDate, reposicaoDe, customCategories, definicoes, serieCount = 0, novaCopia = false, onAddCategory, onSave, onClose, onDelete, onCopy }) {
  // Uma colagem chega com sessao preenchida mas ainda nao existe na agenda: nao
  // e edicao, senao o modal oferecia eliminar algo que nunca foi gravado.
  const isEdit = !!session && !novaCopia;
  const [form, setForm] = useState(() => {
    if (session) return { kind: 'aula', ...session };
    const kind = students.length === 0 ? 'evento' : 'aula';
    // Aberto a partir de uma falta: já nasce como reposição desse aluno, ligada.
    if (reposicaoDe) {
      return {
        id: uid(), kind: 'aula', studentId: reposicaoDe.studentId,
        date: defaultDate || fmtDateISO(new Date()), startTime: '08:00', endTime: '09:00',
        type: 'reposicao', status: 'agendado', notes: '',
        reposicaoDeSessionId: reposicaoDe.id,
        ...EMPTY_ASSESS_FIELDS,
      };
    }
    return {
      id: uid(), kind, studentId: kind === 'aula' ? (students[0]?.id || '') : null,
      date: defaultDate || fmtDateISO(new Date()), startTime: '08:00', endTime: '09:00',
      type: kind === 'aula' ? 'fixo' : EVENT_TYPES[0].id, status: 'agendado', notes: '',
      ...EMPTY_ASSESS_FIELDS,
    };
  });
  const [repeat, setRepeat] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(8);
  const [dias, setDias] = useState([]);
  const [horas, setHoras] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  // Ao editar uma ocorrência de uma série: 'uma' ou 'serie'.
  const [escopo, setEscopo] = useState('uma');

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  const selectedStudent = students.find((s) => s.id === form.studentId);
  const isEvento = form.kind === 'evento';
  // Lista do select por ordem alfabética portuguesa (não pela ordem de registo).
  const sortedStudents = useMemo(() => [...students].sort((a, b) => byNamePt(a.name, b.name)), [students]);

  function switchKind(kind) {
    if (isEdit || kind === form.kind) return;
    setForm((f) => ({
      ...f,
      kind,
      type: kind === 'evento' ? EVENT_TYPES[0].id : 'fixo',
      studentId: kind === 'evento' ? null : (students[0]?.id || ''),
    }));
    setError('');
  }

  // O plano de repetição, tal como o saveSession o espera.
  const plano = useMemo(() => (repeat && !isEdit
    ? { semanas: repeatWeeks, dias, horas: horas.filter((h) => h.inicio && h.fim && h.fim > h.inicio) }
    : null), [repeat, isEdit, repeatWeeks, dias, horas]);

  // Previsão honesta: conta o que vai mesmo ser criado, já sem as ocorrências
  // saltadas por caírem antes da data escolhida.
  const previsaoSerie = useMemo(() => (plano ? (gerarSerie(form, plano) || [form]).length : 0), [plano, form]);

  const numaSerie = isEdit && form.seriesId && serieCount > 1;

  // Avisa, não bloqueia: marcar fora de horas é legítimo, só não deve ser
  // silencioso.
  const foraDeHoras = definicoes && form.date && form.startTime
    && !dentroDoHorario(definicoes, form.date, form.startTime, form.endTime);
  const horarioDoDiaEscolhido = definicoes && form.date ? horarioDoDia(definicoes, form.date) : null;

  function handleSubmit() {
    if (!isEvento && !form.studentId) { setError('Selecione um aluno.'); return; }
    if (!form.date) { setError('Selecione uma data.'); return; }
    if (form.endTime <= form.startTime) { setError('O horário final deve ser após o início.'); return; }
    if (repeat && horas.some((h) => !h.inicio || !h.fim || h.fim <= h.inicio)) {
      setError('Há um horário extra com o fim antes do início.');
      return;
    }
    setError('');
    onSave(form, plano, escopo);
  }

  return (
    <Modal title={isEdit ? (isEvento ? 'Editar Evento' : 'Editar Aula') : (isEvento ? 'Novo Evento' : 'Nova Aula')} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {!isEdit && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => switchKind('aula')} className="px-3 py-2 rounded-lg border text-sm font-body font-medium" style={{ borderColor: !isEvento ? 'var(--brass)' : 'var(--border-hair)', backgroundColor: !isEvento ? 'rgba(30,166,180,0.12)' : 'var(--bg-base)', color: !isEvento ? 'var(--brass)' : 'var(--text-muted)' }}>
              Aula
            </button>
            <button type="button" onClick={() => switchKind('evento')} className="px-3 py-2 rounded-lg border text-sm font-body font-medium" style={{ borderColor: isEvento ? 'var(--brass)' : 'var(--border-hair)', backgroundColor: isEvento ? 'rgba(30,166,180,0.12)' : 'var(--bg-base)', color: isEvento ? 'var(--brass)' : 'var(--text-muted)' }}>
              Evento
            </button>
          </div>
        )}

        {!isEvento && students.length === 0 ? (
          <EmptyState message="Registe um aluno antes de agendar uma aula. Pode ainda assim adicionar um evento pessoal." />
        ) : (
          <>
            {!isEvento && (
              <FormField label="Aluno">
                <select value={form.studentId} onChange={(e) => set('studentId', e.target.value)} className="input-field">
                  {sortedStudents.map((s) => <option key={s.id} value={s.id}>{s.name}{!s.active ? ' (inativo)' : ''}</option>)}
                </select>
              </FormField>
            )}

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
                {(isEvento ? [...EVENT_TYPES, ...customCategories.eventTypes] : [...SESSION_TYPES, ...customCategories.sessionTypes]).map((t) => {
                  const Icon = iconOf(t.icon);
                  const active = form.type === t.id;
                  return (
                    <button key={t.id} type="button" onClick={() => set('type', t.id)} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-left" style={{ borderColor: active ? t.color : 'var(--border-hair)', backgroundColor: active ? `${t.color}22` : 'var(--bg-base)' }}>
                      <Icon size={14} style={{ color: t.color, flexShrink: 0 }} />
                      <span className="text-xs font-body text-primary">{t.label}</span>
                    </button>
                  );
                })}
              </div>
              <AddCategoryInline placeholder={isEvento ? 'Ex: Estudo' : 'Ex: Aula em Grupo'} onAdd={(label) => {
                const id = slugify(label);
                if (isEvento) {
                  onAddCategory('eventTypes', { id, label, color: CUSTOM_CATEGORY_COLORS[customCategories.eventTypes.length % CUSTOM_CATEGORY_COLORS.length] });
                } else {
                  onAddCategory('sessionTypes', { id, label, color: CUSTOM_CATEGORY_COLORS[customCategories.sessionTypes.length % CUSTOM_CATEGORY_COLORS.length] });
                }
                set('type', id);
              }} />
            </FormField>

            {!isEvento && form.type === 'avaliacao' && (
              <div className="bg-elevated rounded-lg p-3 border border-hair">
                <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-3">Resultados da Avaliação</div>
                <AssessmentFields form={form} set={set} studentHeight={selectedStudent?.height} studentSex={selectedStudent?.sex} />
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

            {/* Detalhes da falta: só aparecem quando a aula está marcada como falta. */}
            {!isEvento && form.status === 'falta' && (
              <div className="bg-elevated rounded-lg p-3 border border-hair flex flex-col gap-3">
                <div className="text-2xs uppercase tracking-wide text-faint font-mono">Detalhes da falta</div>
                <FormField label="Motivo">
                  <select value={form.faltaMotivo || ''} onChange={(e) => set('faltaMotivo', e.target.value)} className="input-field">
                    <option value="">Não indicado</option>
                    {FALTA_MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </FormField>
                <label className="flex items-center gap-2 text-sm font-body text-primary">
                  <input
                    type="checkbox"
                    checked={Boolean(form.faltaJustificada)}
                    onChange={(e) => {
                      // Justificada sugere não dever reposição, mas fica alterável.
                      const just = e.target.checked;
                      setForm((f) => ({ ...f, faltaJustificada: just, faltaPrecisaReposicao: !just }));
                    }}
                    style={{ accentColor: 'var(--brass)' }}
                  />
                  Falta justificada
                </label>
                <label className="flex items-center gap-2 text-sm font-body text-primary">
                  <input
                    type="checkbox"
                    checked={faltaPrecisaReposicao(form)}
                    onChange={(e) => set('faltaPrecisaReposicao', e.target.checked)}
                    style={{ accentColor: 'var(--brass)' }}
                  />
                  Dá direito a reposição
                </label>
                <FormField label="Observações da falta (opcional)">
                  <textarea value={form.faltaObs || ''} onChange={(e) => set('faltaObs', e.target.value)} className="input-field" rows={2} placeholder="Ex: avisou na véspera" />
                </FormField>
              </div>
            )}

            {numaSerie && (
              <div className="bg-elevated rounded-lg p-3 border border-hair flex flex-col gap-2">
                <div className="text-xs font-body text-muted">
                  Faz parte de uma série de {plural(serieCount, 'ocorrência', 'ocorrências')}. Aplicar a:
                </div>
                <div className="flex rounded-lg border border-hair overflow-hidden" role="group" aria-label="Âmbito da alteração">
                  {[['uma', 'Só esta'], ['serie', 'Toda a série']].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setEscopo(id)}
                      aria-pressed={escopo === id}
                      className="flex-1 px-3 py-2 text-sm font-body nowrap"
                      style={{
                        backgroundColor: escopo === id ? 'var(--bg-surface)' : 'transparent',
                        color: escopo === id ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontWeight: escopo === id ? 600 : 400,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {escopo === 'serie' && (
                  <div className="text-2xs font-body text-faint">
                    A data e o estado de cada ocorrência ficam como estão. Só mudam aluno, tipo, horário e observações.
                  </div>
                )}
              </div>
            )}

            {!isEdit && (isEvento || form.type === 'fixo') && (
              <div className="bg-elevated rounded-lg p-3 border border-hair flex flex-col gap-2.5">
                <label className="flex items-center gap-2 text-sm font-body text-primary">
                  <input
                    type="checkbox"
                    checked={repeat}
                    onChange={(e) => {
                      setRepeat(e.target.checked);
                      // Semear a lista com o horário do formulário: se ficasse
                      // vazia, haveria uma linha implícita invisível e o primeiro
                      // "Acrescentar" pareceria substituí-la em vez de somar.
                      if (e.target.checked && horas.length === 0) {
                        setHoras([{ inicio: form.startTime, fim: form.endTime }]);
                      }
                    }}
                    style={{ accentColor: 'var(--brass)' }}
                  />
                  Repetir
                </label>

                {repeat && (
                  <>
                    <FormField label="Por quantas semanas">
                      <input type="number" min="1" max="52" value={repeatWeeks} onChange={(e) => setRepeatWeeks(Math.max(1, parseInt(e.target.value, 10) || 1))} className="input-field" />
                    </FormField>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-body text-muted">Em que dias</span>
                      <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Dias da semana">
                        {DIAS_SEMANA.map((d) => {
                          const on = dias.includes(d.id);
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => setDias((atual) => (on ? atual.filter((x) => x !== d.id) : [...atual, d.id]))}
                              aria-pressed={on}
                              aria-label={d.label}
                              title={d.label}
                              className="rounded-full text-xs font-body flex items-center justify-center flex-shrink-0"
                              style={{
                                width: 34, height: 34,
                                border: `1px solid ${on ? 'var(--brass)' : 'var(--border-hair)'}`,
                                backgroundColor: on ? 'var(--brass-soft)' : 'transparent',
                                color: on ? 'var(--brass)' : 'var(--text-muted)',
                                fontWeight: on ? 600 : 400,
                              }}
                            >
                              {d.curto}
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-2xs font-body text-faint">Sem nenhum dia escolhido, repete no dia da data acima.</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-body text-muted">Em que horas</span>
                      <div className="flex flex-col gap-1.5">
                        {horas.map((h, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <input type="time" value={h.inicio} aria-label={`Início do horário ${i + 1}`}
                              onChange={(e) => setHoras((a) => a.map((x, j) => (j === i ? { ...x, inicio: e.target.value } : x)))}
                              className="input-field" style={{ flex: 1 }} />
                            <span className="text-faint text-xs font-body flex-shrink-0">até</span>
                            <input type="time" value={h.fim} aria-label={`Fim do horário ${i + 1}`}
                              onChange={(e) => setHoras((a) => a.map((x, j) => (j === i ? { ...x, fim: e.target.value } : x)))}
                              className="input-field" style={{ flex: 1 }} />
                            <button type="button" onClick={() => setHoras((a) => a.filter((_, j) => j !== i))}
                              className="p-2 rounded-lg btn-surface flex-shrink-0" aria-label={`Remover o horário ${i + 1}`}>
                              <X size={14} className="text-muted" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setHoras((a) => {
                            const ultimo = a[a.length - 1] || { inicio: form.startTime, fim: form.endTime };
                            const duracao = minutosDe(ultimo.fim) - minutosDe(ultimo.inicio);
                            return [...a, { inicio: ultimo.fim, fim: horaDe(minutosDe(ultimo.fim) + Math.max(30, duracao)) }];
                          })}
                          className="btn btn-ghost self-start"
                          style={{ fontSize: 12 }}
                        >
                          <Plus size={14} /> Acrescentar horário
                        </button>
                      </div>
                      <span className="text-2xs font-body text-faint">Cada hora desta lista é criada em todos os dias escolhidos.</span>
                    </div>

                    <div className="text-2xs font-body text-faint">
                      {previsaoSerie === 0
                        ? 'Nada a criar com esta combinação.'
                        : `Vai criar ${plural(previsaoSerie, 'ocorrência', 'ocorrências')}.`}
                    </div>
                  </>
                )}
              </div>
            )}

            {(isEvento || form.type !== 'avaliacao') && (
              <FormField label="Observações (opcional)">
                <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className="input-field" rows={2} placeholder={isEvento ? 'Notas sobre o evento...' : 'Notas sobre a aula...'} />
              </FormField>
            )}
          </>
        )}

        {foraDeHoras && (
          <div className="text-xs font-body px-3 py-2 rounded-lg flex items-start gap-2" style={{ backgroundColor: 'var(--gold-soft)', color: 'var(--gold)' }}>
            <AlertTriangle size={14} className="flex-shrink-0" style={{ marginTop: 1 }} />
            <span>
              {horarioDoDiaEscolhido && !horarioDoDiaEscolhido.aberto
                ? 'Este dia está marcado como fechado no seu horário de funcionamento.'
                : `Fora do horário de funcionamento deste dia (${horarioDoDiaEscolhido?.inicio}–${horarioDoDiaEscolhido?.fim}).`}
              {' '}Pode guardar à mesma.
            </span>
          </div>
        )}

        {error && <div className="text-sm font-body text-rust">{error}</div>}

        <div className="flex gap-2 pt-2 mobile-stack">
          {isEdit && (
            <button onClick={() => setConfirmDelete(true)} type="button" className="px-4 py-2.5 rounded-lg text-sm font-body border border-hair text-rust btn-surface">
              <Trash2 size={15} className="inline mr-1.5" style={{ marginTop: '-2px' }} />Eliminar
            </button>
          )}
          {isEdit && onCopy && (
            <button onClick={() => onCopy(form)} type="button" className="px-4 py-2.5 rounded-lg text-sm font-body border border-hair text-muted btn-surface" title="Copiar para colar noutro dia">
              <Copy size={15} className="inline mr-1.5" style={{ marginTop: '-2px' }} />Copiar
            </button>
          )}
          {(isEvento || students.length > 0) && (
            <button onClick={handleSubmit} type="button" className="flex-1 px-4 py-2.5 rounded-lg text-sm font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0A0A0A' }}>
              {isEvento ? 'Guardar Evento' : 'Guardar Aula'}
            </button>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={escopo === 'serie' ? 'Eliminar a série' : (isEvento ? 'Eliminar evento' : 'Eliminar aula')}
          message={escopo === 'serie'
            ? `Isto elimina as ${serieCount} ocorrências desta série, incluindo as já realizadas. Esta ação não pode ser desfeita.`
            : `Tem a certeza de que pretende eliminar ${isEvento ? 'este evento' : 'esta aula'} da agenda?`}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { onDelete(form.id, escopo); setConfirmDelete(false); }}
        />
      )}
    </Modal>
  );
}

/* ===================== ECRAS DE TREINO ===================== */

// Escolher um exercicio da biblioteca, criar, editar ou apagar -- tudo sem sair
// do sitio. Editar importa mais do que parece: os 60 exercicios semeados nascem
// sem instrucoes, e sao as instrucoes que o aluno le no PDF.
function BibliotecaPicker({ treinos, usosDoExercicio, onEscolher, onCriar, onEditar, onApagar, onCriarGrupo, onCriarCategoria, onFechar }) {
  const biblioteca = treinos.biblioteca;
  const grupos = gruposDe(treinos);
  const categorias = categoriasDe(treinos);
  const [procura, setProcura] = useState('');
  const [grupo, setGrupo] = useState('todos');
  const [categoria, setCategoria] = useState('todos');
  // null = a listar; 'novo' = a criar; objeto = a editar esse exercicio.
  const [emEdicao, setEmEdicao] = useState(null);
  const [form, setForm] = useState({ nome: '', grupo: grupos[0], categoria: categorias[0], equipamento: '', instrucoes: '' });
  const [aApagar, setAApagar] = useState(null);

  const filtrados = useMemo(() => {
    const termo = procura.trim().toLowerCase();
    return biblioteca
      .filter((e) => (grupo === 'todos' || e.grupo === grupo)
        && (categoria === 'todos' || e.categoria === categoria)
        && (!termo || e.nome.toLowerCase().includes(termo)))
      .sort((a, b) => byNamePt(a.nome, b.nome));
  }, [biblioteca, procura, grupo, categoria]);

  function abrirNovo() {
    setForm({ nome: '', grupo: grupos[0], categoria: categorias[0], equipamento: '', instrucoes: '' });
    setEmEdicao('novo');
  }
  function abrirEdicao(ex) {
    setForm({
      nome: ex.nome,
      grupo: ex.grupo || grupos[0],
      categoria: ex.categoria || categorias[0],
      equipamento: ex.equipamento || '',
      instrucoes: ex.instrucoes || '',
    });
    setEmEdicao(ex);
  }
  function gravar() {
    const dados = { ...form, nome: form.nome.trim() };
    if (emEdicao === 'novo') {
      onEscolher(onCriar(dados));
      return;
    }
    onEditar({ ...emEdicao, ...dados });
    setEmEdicao(null);
  }

  const usos = aApagar ? usosDoExercicio(aApagar.id) : 0;

  return (
    <Modal title={emEdicao ? (emEdicao === 'novo' ? 'Novo exercício' : 'Editar exercício') : 'Escolher exercício'} onClose={onFechar}>
      <div className="flex flex-col gap-3">
        {!emEdicao ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative min-w-0">
                <Search size={15} className="absolute text-faint" style={{ left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input value={procura} onChange={(e) => setProcura(e.target.value)} placeholder="Procurar exercício..." aria-label="Procurar exercício" className="input-field" style={{ paddingLeft: 34 }} autoFocus />
              </div>
              <select value={grupo} onChange={(e) => setGrupo(e.target.value)} aria-label="Filtrar por grupo muscular" className="input-field">
                <option value="todos">Todos os grupos musculares</option>
                {grupos.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} aria-label="Filtrar por categoria" className="input-field">
                <option value="todos">Todas as categorias</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button type="button" onClick={abrirNovo} className="btn btn-ghost self-start" style={{ fontSize: 12 }}>
              <Plus size={14} /> Criar exercício novo
            </button>

            <div className="text-2xs font-body text-faint">{plural(filtrados.length, 'exercício', 'exercícios')}</div>

            {filtrados.length === 0 ? (
              <EmptyState icon={Dumbbell} message="Nenhum exercício encontrado." hint="Experimente outro termo, ou crie um exercício novo." />
            ) : (
              <div className="flex flex-col gap-1.5" style={{ maxHeight: '46vh', overflowY: 'auto' }}>
                {filtrados.map((e) => (
                  // Os tres botoes sao irmaos: aninhar botoes dentro de botoes e
                  // ARIA invalido e baralha o nome acessivel de cada um.
                  <div key={e.id} className="flex items-stretch gap-1 rounded-lg border border-hair min-w-0" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    <button type="button" onClick={() => onEscolher(e)} className="flex-1 flex items-center justify-between gap-2 text-left px-3 py-2.5 min-w-0 btn-surface rounded-l-lg">
                      <span className="min-w-0">
                        <span className="block text-sm font-body text-primary truncate">{e.nome}</span>
                        <span className="block text-2xs font-body text-faint truncate">
                          {[e.grupo, e.categoria, e.equipamento].filter(Boolean).join(' · ')}{e.instrucoes ? ' · com instruções' : ''}
                        </span>
                      </span>
                      <Plus size={15} className="text-brass flex-shrink-0" />
                    </button>
                    <button type="button" onClick={() => abrirEdicao(e)} className="px-2 btn-surface flex-shrink-0" aria-label={'Editar ' + e.nome} title="Editar">
                      <Pencil size={14} className="text-muted" style={{ display: 'block' }} />
                    </button>
                    <button type="button" onClick={() => setAApagar(e)} className="px-2 btn-surface flex-shrink-0 rounded-r-lg" aria-label={'Apagar ' + e.nome} title="Apagar">
                      <Trash2 size={14} className="text-rust" style={{ display: 'block' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <FormField label="Nome do exercício">
              <input value={form.nome} onChange={(e) => setForm((n) => ({ ...n, nome: e.target.value }))} className="input-field" placeholder="Ex.: Remada cavalinho" autoFocus />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-body text-muted">Grupo muscular</span>
                <select value={form.grupo} onChange={(e) => setForm((n) => ({ ...n, grupo: e.target.value }))} aria-label="Grupo muscular" className="input-field">
                  {grupos.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <AddCategoryInline
                  label="Criar grupo muscular"
                  placeholder="Nome do grupo muscular"
                  onAdd={(nome) => { onCriarGrupo(nome); setForm((n) => ({ ...n, grupo: nome })); }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-body text-muted">Categoria</span>
                <select value={form.categoria} onChange={(e) => setForm((n) => ({ ...n, categoria: e.target.value }))} aria-label="Categoria" className="input-field">
                  {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <AddCategoryInline
                  label="Criar categoria"
                  placeholder="Nome da categoria"
                  onAdd={(nome) => { onCriarCategoria(nome); setForm((n) => ({ ...n, categoria: nome })); }}
                />
              </div>
            </div>
            <FormField label="Equipamento (opcional)">
              <input value={form.equipamento} onChange={(e) => setForm((n) => ({ ...n, equipamento: e.target.value }))} className="input-field" placeholder="Ex.: Barra" />
            </FormField>
            <FormField label="Instruções (opcional)">
              <textarea value={form.instrucoes} onChange={(e) => setForm((n) => ({ ...n, instrucoes: e.target.value }))} className="input-field" rows={3} placeholder="Sai impresso no PDF do aluno, por baixo do exercício." />
            </FormField>
            <div className="flex gap-2 mobile-stack">
              <button type="button" onClick={() => setEmEdicao(null)} className="px-4 py-2.5 rounded-lg text-sm font-body border border-hair btn-surface text-muted">Voltar</button>
              <button
                type="button"
                disabled={!form.nome.trim()}
                onClick={gravar}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-body font-medium disabled:opacity-50"
                style={{ backgroundColor: 'var(--brass)', color: 'var(--on-accent)' }}
              >
                {emEdicao === 'novo' ? 'Criar e acrescentar' : 'Guardar alterações'}
              </button>
            </div>
          </>
        )}
      </div>

      {aApagar && (
        <ConfirmDialog
          title={'Apagar "' + aApagar.nome + '"'}
          message={usos > 0
            ? 'Este exercício está em ' + plural(usos, 'treino', 'treinos') + '. Esses treinos mantêm o nome e os números, mas perdem as instruções. Apagar mesmo assim?'
            : 'Isto remove o exercício da sua biblioteca. Os treinos já criados não são afetados.'}
          confirmLabel="Apagar"
          onCancel={() => setAApagar(null)}
          onConfirm={() => { onApagar(aApagar.id); setAApagar(null); }}
        />
      )}
    </Modal>
  );
}

// Uma linha de exercicio dentro de um treino.
function ExercicioRow({ ex, biblioteca, onMudar, onRemover, onSubir, onDescer, primeiro, ultimo }) {
  const daBiblioteca = biblioteca.find((b) => b.id === ex.exercicioId);
  return (
    <div className="rounded-lg border border-hair p-3 flex flex-col gap-2" style={{ backgroundColor: 'var(--bg-elevated)' }}>
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <div className="text-sm font-body text-primary truncate" style={{ fontWeight: 500 }}>{ex.nome || 'Exercício'}</div>
          {daBiblioteca && (
            <div className="text-2xs font-body text-faint truncate">{daBiblioteca.grupo}{daBiblioteca.equipamento ? ' · ' + daBiblioteca.equipamento : ''}</div>
          )}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button type="button" onClick={onSubir} disabled={primeiro} className="p-1.5 rounded btn-surface disabled:opacity-30" aria-label="Subir exercício"><ChevronLeft size={14} className="text-muted" style={{ display: 'block', transform: 'rotate(90deg)' }} /></button>
          <button type="button" onClick={onDescer} disabled={ultimo} className="p-1.5 rounded btn-surface disabled:opacity-30" aria-label="Descer exercício"><ChevronRight size={14} className="text-muted" style={{ display: 'block', transform: 'rotate(90deg)' }} /></button>
          <button type="button" onClick={onRemover} className="p-1.5 rounded btn-surface" aria-label="Remover exercício"><Trash2 size={14} className="text-rust" style={{ display: 'block' }} /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          ['series', 'Séries', '3'],
          ['reps', 'Repetições', '8-10'],
          ['carga', 'Carga', '22 kg'],
          ['descanso', 'Descanso (s)', '90'],
        ].map(([campo, rotulo, exemplo]) => (
          <FormField key={campo} label={rotulo}>
            <input value={ex[campo] || ''} onChange={(e) => onMudar({ ...ex, [campo]: e.target.value })} className="input-field" placeholder={exemplo} />
          </FormField>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <FormField label="Método (opcional)">
          <input value={ex.metodo || ''} onChange={(e) => onMudar({ ...ex, metodo: e.target.value })} className="input-field" placeholder="Ex.: supersérie com o seguinte" />
        </FormField>
        <FormField label="Notas (opcional)">
          <input value={ex.notas || ''} onChange={(e) => onMudar({ ...ex, notas: e.target.value })} className="input-field" placeholder="Ex.: cadência 3-1-1" />
        </FormField>
      </div>
    </div>
  );
}

// Construtor de um programa: cabecalho, treinos e exercicios.
function PrescricaoBuilder({ prescricao, treinos, usosDoExercicio, onMudar, onCriarExercicio, onEditarExercicio, onApagarExercicio, onCriarGrupo, onCriarCategoria, onArquivar, onGuardarModelo, onImprimir, onEliminar }) {
  const biblioteca = treinos.biblioteca;
  const [picker, setPicker] = useState(null); // id do treino a receber o exercicio
  const [confirmar, setConfirmar] = useState(false);

  function mudarTreino(treinoId, novo) {
    onMudar({ ...prescricao, treinos: prescricao.treinos.map((t) => (t.id === treinoId ? novo : t)) });
  }
  function mexerExercicio(treinoId, indice, delta) {
    const t = prescricao.treinos.find((x) => x.id === treinoId);
    const lista = [...t.exercicios];
    const destino = indice + delta;
    if (destino < 0 || destino >= lista.length) return;
    [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
    mudarTreino(treinoId, { ...t, exercicios: lista });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Sem seta propria: a vista de treinos tem uma so, cujo destino muda
          consoante haja ou nao um programa aberto. Duas setas empilhadas
          confundiam. */}
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button type="button" onClick={onImprimir} className="btn btn-ghost" style={{ fontSize: 12 }}>
            <Printer size={14} /> Exportar PDF
          </button>
          <button type="button" onClick={() => onGuardarModelo(prescricao)} className="btn btn-ghost" style={{ fontSize: 12 }}>
            <BookMarked size={14} /> Guardar como modelo
          </button>
          <button type="button" onClick={() => onArquivar(prescricao.id, !prescricao.arquivado)} className="btn btn-ghost" style={{ fontSize: 12 }}>
            <Archive size={14} /> {prescricao.arquivado ? 'Reativar' : 'Arquivar'}
          </button>
          <button type="button" onClick={() => setConfirmar(true)} className="btn btn-ghost" style={{ fontSize: 12, color: 'var(--rust)' }}>
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      </div>

      <div className="card p-4 flex flex-col gap-3">
        <FormField label="Nome do programa">
          <input value={prescricao.nome} onChange={(e) => onMudar({ ...prescricao, nome: e.target.value })} className="input-field" placeholder="Ex.: Hipertrofia — Fase 1" />
        </FormField>
        <FormField label="Objetivo (opcional)">
          <input value={prescricao.objetivo} onChange={(e) => onMudar({ ...prescricao, objetivo: e.target.value })} className="input-field" placeholder="Ex.: ganho de massa muscular, 3x por semana" />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <FormField label="Início">
            <input type="date" value={prescricao.inicio || ''} onChange={(e) => onMudar({ ...prescricao, inicio: e.target.value })} className="input-field" />
          </FormField>
          <FormField label="Fim (opcional)">
            <input type="date" value={prescricao.fim || ''} onChange={(e) => onMudar({ ...prescricao, fim: e.target.value })} className="input-field" />
          </FormField>
        </div>
      </div>

      {prescricao.treinos.map((t, ti) => (
        <div key={t.id} className="card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <input
              value={t.nome}
              onChange={(e) => mudarTreino(t.id, { ...t, nome: e.target.value })}
              className="input-field"
              aria-label={'Nome do treino ' + (ti + 1)}
              style={{ fontWeight: 600, maxWidth: 260 }}
            />
            <button
              type="button"
              onClick={() => onMudar({ ...prescricao, treinos: prescricao.treinos.filter((x) => x.id !== t.id) })}
              className="p-1.5 rounded btn-surface flex-shrink-0"
              aria-label={'Remover ' + t.nome}
            >
              <Trash2 size={14} className="text-rust" style={{ display: 'block' }} />
            </button>
          </div>

          {t.exercicios.length === 0 ? (
            <EmptyState icon={Dumbbell} message="Sem exercícios neste treino." />
          ) : (
            <div className="flex flex-col gap-2">
              {t.exercicios.map((ex, i) => (
                <ExercicioRow
                  key={ex.id}
                  ex={ex}
                  biblioteca={biblioteca}
                  primeiro={i === 0}
                  ultimo={i === t.exercicios.length - 1}
                  onSubir={() => mexerExercicio(t.id, i, -1)}
                  onDescer={() => mexerExercicio(t.id, i, 1)}
                  onMudar={(novo) => mudarTreino(t.id, { ...t, exercicios: t.exercicios.map((x) => (x.id === ex.id ? novo : x)) })}
                  onRemover={() => mudarTreino(t.id, { ...t, exercicios: t.exercicios.filter((x) => x.id !== ex.id) })}
                />
              ))}
            </div>
          )}

          <button type="button" onClick={() => setPicker(t.id)} className="btn btn-ghost self-start" style={{ fontSize: 12 }}>
            <Plus size={14} /> Acrescentar exercício
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onMudar({ ...prescricao, treinos: [...prescricao.treinos, novoTreino(prescricao.treinos.length)] })}
        className="btn btn-ghost self-start"
        style={{ fontSize: 12 }}
      >
        <Plus size={14} /> Acrescentar treino
      </button>

      {picker && (
        <BibliotecaPicker
          treinos={treinos}
          onFechar={() => setPicker(null)}
          usosDoExercicio={usosDoExercicio}
          onCriar={onCriarExercicio}
          onEditar={onEditarExercicio}
          onApagar={onApagarExercicio}
          onCriarGrupo={onCriarGrupo}
          onCriarCategoria={onCriarCategoria}
          onEscolher={(exercicio) => {
            const t = prescricao.treinos.find((x) => x.id === picker);
            mudarTreino(picker, { ...t, exercicios: [...t.exercicios, novoExercicioTreino(exercicio)] });
            setPicker(null);
          }}
        />
      )}

      {confirmar && (
        <ConfirmDialog
          title="Eliminar programa"
          message={'Isto elimina "' + prescricao.nome + '" e todos os treinos que tem dentro. Esta ação não pode ser desfeita.'}
          onCancel={() => setConfirmar(false)}
          onConfirm={() => { setConfirmar(false); onEliminar(prescricao.id); }}
        />
      )}
    </div>
  );
}

function LinhaPrograma({ p, onAbrir }) {
  return (
    <button type="button" onClick={onAbrir} className="card p-4 flex items-center justify-between gap-3 text-left min-w-0 card-hover">
      <span className="min-w-0">
        <span className="block text-sm font-body text-primary truncate" style={{ fontWeight: 500 }}>{p.nome}</span>
        <span className="block text-2xs font-body text-faint truncate">
          {plural(p.treinos.length, 'treino', 'treinos')} · {plural(contarExercicios(p), 'exercício', 'exercícios')}
          {p.inicio ? ' · desde ' + fmtDateLong(p.inicio + 'T00:00:00') : ''}
        </span>
      </span>
      <ChevronRight size={16} className="text-faint flex-shrink-0" />
    </button>
  );
}

// Lista de programas de um aluno, e a porta de entrada para o construtor.
function TreinosView({ student, treinos, onMudarPrescricao, onCriarPrescricao, onEliminarPrescricao, onCriarExercicio, onEditarExercicio, onApagarExercicio, onCriarGrupo, onCriarCategoria, onArquivarPrescricao, onGuardarModelo, onCriarDeModelo, onApagarModelo, usosDoExercicio, onImprimir, onVoltar }) {
  const [abertoId, setAbertoId] = useState(null);
  const [verArquivados, setVerArquivados] = useState(false);
  const [modeloAApagar, setModeloAApagar] = useState(null);
  const ativos = useMemo(() => prescricoesDoAluno(treinos, student.id, false), [treinos, student.id]);
  const arquivados = useMemo(() => prescricoesDoAluno(treinos, student.id, true), [treinos, student.id]);
  const modelos = treinos.modelos || [];
  const aberta = [...ativos, ...arquivados].find((p) => p.id === abertoId);

  return (
    <div className="px-4 py-4 max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => (aberta ? setAbertoId(null) : onVoltar())}
          type="button"
          className="p-2 rounded-lg bg-surface border border-hair btn-surface flex-shrink-0"
          aria-label={aberta ? 'Voltar aos programas' : 'Voltar aos alunos'}
        >
          <ArrowLeft size={16} className="text-muted" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: student.color }} />
          <h1 className="font-display font-semibold text-xl text-primary tracking-wide truncate">{student.name}</h1>
        </div>
      </div>

      {aberta ? (
        <PrescricaoBuilder
          prescricao={aberta}
          treinos={treinos}
          onMudar={onMudarPrescricao}
          onCriarExercicio={onCriarExercicio}
          onEditarExercicio={onEditarExercicio}
          onApagarExercicio={onApagarExercicio}
          onCriarGrupo={onCriarGrupo}
          onCriarCategoria={onCriarCategoria}
          usosDoExercicio={usosDoExercicio}
          onEliminar={(id) => { setAbertoId(null); onEliminarPrescricao(id); }}
          onImprimir={() => onImprimir(aberta)}
          onArquivar={onArquivarPrescricao}
          onGuardarModelo={onGuardarModelo}
        />
      ) : (
        <>
          <button
            type="button"
            onClick={() => { const nova = onCriarPrescricao(student.id); setAbertoId(nova.id); }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-body font-medium"
            style={{ backgroundColor: 'var(--brass)', color: 'var(--on-accent)' }}
          >
            <Plus size={15} /> Novo programa de treino
          </button>

          {modelos.length > 0 && (
            <>
              <div className="text-2xs uppercase tracking-wide text-faint font-mono">Começar a partir de um modelo</div>
              <div className="flex flex-col gap-2">
                {modelos.map((m) => (
                  // Os dois botões são irmãos: aninhá-los seria ARIA inválido.
                  <div key={m.id} className="card flex items-stretch gap-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => { const nova = onCriarDeModelo(student.id, m); setAbertoId(nova.id); }}
                      className="flex-1 flex items-center justify-between gap-3 text-left p-4 min-w-0 btn-surface rounded-l-xl"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-body text-primary truncate" style={{ fontWeight: 500 }}>{m.nome}</span>
                        <span className="block text-2xs font-body text-faint truncate">
                          {plural((m.treinos || []).length, 'treino', 'treinos')} · {plural(contarExercicios(m), 'exercício', 'exercícios')}
                        </span>
                      </span>
                      <Plus size={16} className="text-brass flex-shrink-0" />
                    </button>
                    <button type="button" onClick={() => setModeloAApagar(m)} className="px-3 btn-surface flex-shrink-0 rounded-r-xl" aria-label={'Apagar modelo ' + m.nome}>
                      <Trash2 size={14} className="text-rust" style={{ display: 'block' }} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="text-2xs uppercase tracking-wide text-faint font-mono">Programas ({ativos.length})</div>

          {ativos.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              message="Ainda não há programas para este aluno."
              hint="Crie um programa, junte os treinos e exporte em PDF para o aluno levar para o ginásio."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {ativos.map((p) => <LinhaPrograma key={p.id} p={p} onAbrir={() => setAbertoId(p.id)} />)}
            </div>
          )}

          {arquivados.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setVerArquivados((v) => !v)}
                aria-expanded={verArquivados}
                className="flex items-center gap-1.5 text-2xs uppercase tracking-wide text-faint font-mono self-start btn-surface rounded px-1.5 py-1"
              >
                <Archive size={12} /> Arquivados ({arquivados.length})
                <ChevronRight size={12} style={{ transform: verArquivados ? 'rotate(90deg)' : 'none' }} />
              </button>
              {verArquivados && (
                <div className="flex flex-col gap-2" style={{ opacity: 0.7 }}>
                  {arquivados.map((p) => <LinhaPrograma key={p.id} p={p} onAbrir={() => setAbertoId(p.id)} />)}
                </div>
              )}
            </>
          )}
        </>
      )}

      {modeloAApagar && (
        <ConfirmDialog
          title={'Apagar o modelo "' + modeloAApagar.nome + '"'}
          message="Isto remove-o da biblioteca de treinos. Os programas já criados a partir dele não são afetados."
          confirmLabel="Apagar"
          onCancel={() => setModeloAApagar(null)}
          onConfirm={() => { onApagarModelo(modeloAApagar.id); setModeloAApagar(null); }}
        />
      )}
    </div>
  );
}

/* ============================== AVALIAÇÕES FÍSICAS (nova aba) ============================== */

// `assessment` presente = edição. Semear com os campos vazios primeiro garante
// que uma avaliação antiga, gravada antes de um campo existir, não fica com o
// valor `undefined` a passar por um input controlado.
function AssessmentForm({ student, assessment, onSave, onCancel, photosById, onUploadPhotos, onRemovePhoto, uploadingPhotos }) {
  const isEdit = Boolean(assessment);
  const [form, setForm] = useState(() => ({
    date: fmtDateISO(new Date()),
    ...EMPTY_ASSESS_FIELDS,
    ...(assessment || {}),
    photoIds: (assessment && assessment.photoIds) || [],
  }));
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  return (
    <div className="flex flex-col gap-3 animate-in">
      <FormField label="Data da avaliação">
        <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="input-field" />
      </FormField>
      <AssessmentFields form={form} set={set} studentHeight={student.height} studentSex={student.sex} />
      <PhotoPicker photoIds={form.photoIds} photosById={photosById} busy={uploadingPhotos}
        onAdd={async (files) => { const ids = await onUploadPhotos(files); set('photoIds', [...form.photoIds, ...ids]); }}
        onRemove={(id) => { onRemovePhoto(id); set('photoIds', form.photoIds.filter((x) => x !== id)); }} />
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-lg text-sm font-body border border-hair btn-surface text-muted">Cancelar</button>
        <button type="button" onClick={() => onSave(form)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0A0A0A' }}>{isEdit ? 'Guardar Alterações' : 'Guardar Avaliação'}</button>
      </div>
    </div>
  );
}

/* ===================== IMPRESSAO / EXPORTACAO PDF ===================== */

// Numero formatado com unidade, ou nada. Devolver null deixa o chamador decidir
// se a linha aparece: uma ficha com metade dos campos vazios nao ajuda ninguem.
function printValue(raw, unit) {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(raw);
  if (Number.isNaN(n)) return String(raw);
  return `${n.toLocaleString('pt-PT', { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ''}`;
}

// Separador decimal portugues. O toFixed devolve sempre ponto, que num documento
// entregue ao aluno esta errado.
function nPT(n, casas = 1) {
  if (typeof n !== 'number' || Number.isNaN(n)) return null;
  return n.toLocaleString('pt-PT', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

function PrintField({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="print-field">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function PrintSection({ title, children }) {
  return (
    <section className="print-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

// Timbre partilhado pela avaliacao e pelo plano de treino.
function PrintHeader({ trainerName, userEmail, titulo, subtitulo }) {
  return (
    <>
      <header className="print-head">
        <div className="print-brand">PT<span>MANAGER</span></div>
        <div className="print-by">
          <strong>{trainerName || userEmail || 'Personal Trainer'}</strong>
          {trainerName && userEmail ? <><br />{userEmail}</> : null}
          <br />Emitido a {fmtDateLong(new Date().toISOString())}
        </div>
      </header>
      <h1 className="print-title">{titulo}</h1>
      {subtitulo ? <div className="print-sub">{subtitulo}</div> : null}
    </>
  );
}

function PrintFooter({ nota }) {
  return (
    <footer className="print-foot">
      <span>{nota}</span>
      <span>Gerado pelo PTMANAGER</span>
    </footer>
  );
}

// Grafico de evolucao proprio da impressao: dimensoes fixas (o ResponsiveContainer
// mede 0 numa folha fora do ecra) e cores escuras para papel branco.
function PrintEvolutionChart({ assessments, sex }) {
  const data = [...assessments]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((a) => {
      const gordura = a.assessMethod === 'dobras' ? calcFoldBodyFat(a, sex) : parseFloat(a.assessBodyFat);
      return {
        // Com ano: o historico pode atravessar anos e dd/mm seria ambiguo.
        data: fmtDateLong(`${a.date}T00:00:00`),
        peso: parseFloat(a.assessWeight) || null,
        gordura: typeof gordura === 'number' && !Number.isNaN(gordura) ? Number(gordura.toFixed(1)) : null,
      };
    });
  if (data.length < 2) return null;
  return (
    <PrintSection title="Evolução">
      <LineChart width={640} height={200} data={data} margin={{ top: 6, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid stroke="#ddd" strokeDasharray="3 3" />
        <XAxis dataKey="data" tick={{ fill: '#444', fontSize: 9 }} axisLine={{ stroke: '#999' }} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
        <YAxis tick={{ fill: '#444', fontSize: 10 }} axisLine={{ stroke: '#999' }} tickLine={false} width={34} />
        <Legend wrapperStyle={{ fontSize: 10, color: '#444' }} />
        <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="#166874" strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} connectNulls />
        <Line type="monotone" dataKey="gordura" name="% Gordura" stroke="#A63A32" strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} connectNulls />
      </LineChart>
    </PrintSection>
  );
}

// A folha e montada num portal para o body, e nao dentro de #root: assim o CSS
// de impressao pode esconder a aplicacao inteira com um seletor de filho direto,
// sem depender da arvore de componentes.
function PrintHost({ job, onDone, children }) {
  useEffect(() => {
    if (!job) return undefined;
    let terminado = false;
    function fechar() {
      if (terminado) return;
      terminado = true;
      onDone(null);
    }
    window.addEventListener('afterprint', fechar);
    // Rede de seguranca longa, e nao curta de proposito: em alguns browsers o
    // window.print() nao bloqueia, e desmontar a folha cedo demais imprimiria
    // uma pagina em branco. A folha esta fora do ecra, nao custa nada esperar.
    const rede = setTimeout(fechar, 60000);
    // Dois frames antes de abrir a caixa: o primeiro aplica o estado, o segundo
    // garante que a folha ja foi pintada. Sem isto sai uma pagina em branco.
    const id = requestAnimationFrame(() => requestAnimationFrame(() => {
      try { window.print(); } catch (e) { fechar(); }
    }));
    return () => {
      terminado = true;
      cancelAnimationFrame(id);
      clearTimeout(rede);
      window.removeEventListener('afterprint', fechar);
    };
  }, [job, onDone]);

  if (!job) return null;
  return createPortal(
    <div className="print-root">
      <div className="print-sheet">{children}</div>
    </div>,
    document.body,
  );
}

function TreinoPrintDoc({ student, prescricao, biblioteca, trainerName, userEmail }) {
  // O aluno ou o programa podem ter desaparecido entre o clique e a impressao.
  if (!student || !prescricao) return null;
  const periodo = [
    prescricao.inicio ? fmtDateLong(prescricao.inicio + 'T00:00:00') : null,
    prescricao.fim ? fmtDateLong(prescricao.fim + 'T00:00:00') : null,
  ].filter(Boolean).join(' a ');

  return (
    <>
      <PrintHeader
        trainerName={trainerName}
        userEmail={userEmail}
        titulo={prescricao.nome || 'Plano de Treino'}
        subtitulo={student.name + (periodo ? ' · ' + periodo : '')}
      />

      {prescricao.objetivo ? (
        <PrintSection title="Objetivo">
          <div className="print-notes">{prescricao.objetivo}</div>
        </PrintSection>
      ) : null}

      {(prescricao.treinos || []).map((t) => (
        <PrintSection key={t.id} title={t.nome}>
          {t.exercicios.length === 0 ? (
            <div className="print-notes">Sem exercícios.</div>
          ) : (
            <table className="print-table">
              <thead>
                <tr>
                  <th>Exercício</th>
                  <th className="num">Séries</th>
                  <th className="num">Reps</th>
                  <th className="num">Carga</th>
                  <th className="num">Descanso</th>
                </tr>
              </thead>
              <tbody>
                {t.exercicios.map((ex) => {
                  const daBiblioteca = biblioteca.find((b) => b.id === ex.exercicioId);
                  // As instrucoes vivem na biblioteca: o treinador escreve uma
                  // vez e saem em todos os treinos onde usar o exercicio.
                  const linhas = [ex.metodo, ex.notas, daBiblioteca && daBiblioteca.instrucoes].filter(Boolean);
                  return (
                    <tr key={ex.id}>
                      <td>
                        <strong>{ex.nome}</strong>
                        {linhas.length > 0 && <div className="print-ex-nota">{linhas.join(' · ')}</div>}
                      </td>
                      <td className="num">{ex.series || '—'}</td>
                      <td className="num">{ex.reps || '—'}</td>
                      <td className="num">{ex.carga || '—'}</td>
                      <td className="num">{ex.descanso ? ex.descanso + ' s' : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {t.notas ? <div className="print-notes" style={{ marginTop: 6 }}>{t.notas}</div> : null}
        </PrintSection>
      ))}

      <PrintSection title="Assinatura do profissional">
        <div className="print-assinatura" />
        <div className="print-ex-nota">{trainerName || userEmail || 'Personal Trainer'}</div>
      </PrintSection>

      <PrintFooter nota={student.name + ' · ' + (prescricao.nome || 'Plano de treino')} />
    </>
  );
}

function AssessmentPrintDoc({ student, assessment, historico, photosById, trainerName, userEmail }) {
  // O aluno ou a avaliacao podem ter desaparecido entre o clique e a impressao.
  if (!student || !assessment) return null;
  const a = assessment;
  const isDobras = a.assessMethod === 'dobras';
  const protocolo = FOLD_PROTOCOLS.find((p) => p.id === a.assessProtocol);
  const gordura = isDobras ? calcFoldBodyFat(a, student.sex) : (parseFloat(a.assessBodyFat) || null);
  const peso = parseFloat(a.assessWeight) || null;
  const bmi = bmiOf(a.assessWeight, student.height);
  const massaGordaKg = peso && gordura != null ? (peso * gordura) / 100 : null;
  const massaMagraKg = peso && massaGordaKg != null ? peso - massaGordaKg : null;
  const sexKey = student.sex === 'F' ? 'F' : 'M';
  const sitesUsados = isDobras && protocolo ? protocolo.sites[sexKey] : [];
  const somaDobras = sitesUsados.reduce((soma, id) => soma + (parseFloat(a[id]) || 0), 0);
  const fotos = (a.photoIds || []).map((id) => photosById[id]).filter(Boolean);

  return (
    <>
      <PrintHeader
        trainerName={trainerName}
        userEmail={userEmail}
        titulo="Avaliação Física"
        subtitulo={`${student.name} · ${fmtDateLong(`${a.date}T00:00:00`)}`}
      />

      <div className="print-highlight">
        <div className="print-kpi"><dt>Peso</dt><dd>{printValue(peso, 'kg') || '—'}</dd></div>
        <div className="print-kpi"><dt>Massa gorda</dt><dd>{gordura != null ? `${nPT(gordura)} %` : '—'}</dd></div>
        <div className="print-kpi"><dt>Massa magra</dt><dd>{massaMagraKg != null ? `${nPT(massaMagraKg)} kg` : '—'}</dd></div>
        <div className="print-kpi"><dt>IMC</dt><dd>{bmi != null ? nPT(bmi) : '—'}</dd></div>
      </div>

      <PrintSection title="Aluno">
        <dl className="print-grid">
          <PrintField label="Nome" value={student.name} />
          <PrintField label="Sexo" value={student.sex === 'F' ? 'Feminino' : student.sex === 'M' ? 'Masculino' : null} />
          <PrintField label="Altura" value={printValue(student.height, 'cm')} />
          <PrintField label="Idade" value={printValue(a.assessAge, 'anos')} />
          <PrintField label="Nº de sócio" value={student.memberNumber || null} />
          <PrintField label="Método" value={isDobras ? (protocolo?.label || 'Dobras cutâneas') : 'Bioimpedância'} />
        </dl>
      </PrintSection>

      {isDobras ? (
        <PrintSection title={`Dobras cutâneas${protocolo ? ` — ${protocolo.label}` : ''}`}>
          <dl className="print-grid">
            {sitesUsados.map((id) => <PrintField key={id} label={foldLabel(id)} value={printValue(a[id], 'mm')} />)}
            <PrintField label="Somatório" value={somaDobras > 0 ? `${somaDobras.toLocaleString('pt-PT', { maximumFractionDigits: 1 })} mm` : null} />
          </dl>
        </PrintSection>
      ) : (
        <PrintSection title="Bioimpedância">
          <dl className="print-grid">
            <PrintField label="% Gordura" value={printValue(a.assessBodyFat, '%')} />
            {BIA_FIELDS.map((f) => <PrintField key={f.id} label={f.label} value={printValue(a[f.id])} />)}
          </dl>
        </PrintSection>
      )}

      {massaGordaKg != null && (
        <PrintSection title="Composição corporal">
          <dl className="print-grid">
            <PrintField label="Massa gorda" value={`${nPT(massaGordaKg)} kg`} />
            <PrintField label="Massa magra" value={massaMagraKg != null ? `${nPT(massaMagraKg)} kg` : null} />
            <PrintField label="IMC" value={bmi != null ? nPT(bmi) : null} />
          </dl>
        </PrintSection>
      )}

      <PrintEvolutionChart assessments={historico} sex={student.sex} />

      {fotos.length > 0 && (
        <PrintSection title="Registo fotográfico">
          <div className="print-photos">
            {fotos.map((f, i) => <img key={f.id || i} src={f.dataUri} alt="" />)}
          </div>
        </PrintSection>
      )}

      {a.assessNotes ? (
        <PrintSection title="Observações">
          <div className="print-notes">{a.assessNotes}</div>
        </PrintSection>
      ) : null}

      {/* fmtDateBR e dd/mm, sem ano: serve na agenda, nao num documento que o aluno guarda. */}
      <PrintFooter nota={`${student.name} · Avaliação de ${fmtDateLong(`${a.date}T00:00:00`)}`} />
    </>
  );
}

function AssessmentComparisonChart({ assessments }) {
  const data = useMemo(() => [...assessments].sort((a, b) => a.date.localeCompare(b.date)).map((a) => ({
    date: fmtDateBR(new Date(`${a.date}T00:00:00`)),
    peso: parseFloat(a.assessWeight) || null,
    gordura: a.assessMethod === 'dobras' ? null : (parseFloat(a.assessBodyFat) || null),
  })), [assessments]);

  if (data.length < 2) return <EmptyState message="Registre pelo menos 2 avaliações para ver a evolução em gráfico." />;

  return (
    <ErrorBoundary compact>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={CHART.tick} axisLine={false} tickLine={false} />
          <YAxis tick={CHART.tick} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={CHART.tooltip} labelStyle={CHART.tooltipLabel} itemStyle={CHART.tooltipItem} cursor={CHART.cursor} />
          <Legend wrapperStyle={CHART.legend} />
          <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="#1EA6B4" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="gordura" name="% Gordura" stroke="#D6534A" strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </ErrorBoundary>
  );
}

function AssessmentDetail({ student, sessions, photosById, onBack, onSaveAssessment, onUploadPhotos, onRemovePhoto, onDeleteAssessment, onPrintAssessment }) {
  // null = fechado, 'nova' = criar, objeto = editar essa avaliação.
  const [editando, setEditando] = useState(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const assessments = sessions.filter((s) => s.studentId === student.id && s.type === 'avaliacao' && (s.assessWeight || s.assessBodyFat)).sort((a, b) => b.date.localeCompare(a.date));

  async function handleUpload(files) {
    setUploadingPhotos(true);
    try { return await onUploadPhotos(files); } finally { setUploadingPhotos(false); }
  }

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} type="button" className="p-2 rounded-lg bg-surface border border-hair btn-surface" aria-label="Voltar">
          <ArrowLeft size={16} className="text-muted" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: student.color }} />
          <h1 className="font-display font-semibold text-xl text-primary tracking-wide truncate">{student.name}</h1>
        </div>
      </div>

      {!editando && (
        <button onClick={() => setEditando('nova')} type="button" className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0A0A0A' }}>
          <Plus size={15} /> Nova Avaliação Física
        </button>
      )}

      {editando && (
        <div className="bg-surface border border-hair rounded-xl p-4">
          <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-3">
            {editando === 'nova' ? 'Nova avaliação' : `A editar a avaliação de ${fmtDateBR(new Date(`${editando.date}T00:00:00`))}`}
          </div>
          {/* key força o formulário a reiniciar ao trocar de avaliação */}
          <AssessmentForm
            key={editando === 'nova' ? 'nova' : editando.id}
            student={student}
            assessment={editando === 'nova' ? null : editando}
            onCancel={() => setEditando(null)}
            photosById={photosById}
            uploadingPhotos={uploadingPhotos}
            onUploadPhotos={handleUpload}
            onRemovePhoto={onRemovePhoto}
            onSave={(form) => { onSaveAssessment(student.id, form); setEditando(null); }}
          />
        </div>
      )}

      <div className="bg-surface border border-hair rounded-xl p-4">
        <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-2 flex items-center gap-1.5"><LineChartIcon size={13} /> Comparação de Evolução</div>
        <AssessmentComparisonChart assessments={assessments} />
      </div>

      <div>
        <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-2">Histórico ({assessments.length})</div>
        {assessments.length === 0 ? <EmptyState message="Nenhuma avaliação registada ainda." /> : (
          <div className="flex flex-col gap-2">
            {assessments.map((a) => {
              const methodLabel = a.assessMethod === 'dobras' ? (FOLD_PROTOCOLS.find((p) => p.id === a.assessProtocol)?.label || 'Dobras') : 'Bioimpedância';
              const foldResult = a.assessMethod === 'dobras' ? calcFoldBodyFat(a, student.sex) : null;
              return (
                <div key={a.id} className="rounded-lg border border-hair bg-elevated p-3">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="font-mono text-xs text-muted">{fmtDateBR(new Date(`${a.date}T00:00:00`))}</div>
                      <div className="text-2xs text-faint font-body">{methodLabel}</div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => onPrintAssessment(a)} type="button" className="p-1.5 rounded btn-surface" aria-label="Exportar avaliação em PDF" title="Exportar PDF"><Printer size={13} className="text-muted" /></button>
                      <button onClick={() => setEditando(a)} type="button" className="p-1.5 rounded btn-surface" aria-label="Editar avaliação" title="Editar"><Pencil size={13} className="text-muted" /></button>
                      <button onClick={() => setConfirmDeleteId(a.id)} type="button" className="p-1.5 rounded btn-surface" aria-label="Eliminar avaliação" title="Eliminar"><Trash2 size={13} className="text-rust" /></button>
                    </div>
                  </div>
                  {/* Numeros em pt-PT: o input guarda com ponto, mas a leitura e com virgula. */}
                  <div className="text-sm font-body text-primary">
                    {a.assessWeight ? `${nPT(parseFloat(a.assessWeight), 1)} kg` : '—'}
                    {a.assessMethod === 'dobras' && foldResult != null ? ` · ${nPT(foldResult)}% gordura` : ''}
                    {a.assessMethod === 'bioimpedancia' && a.assessBodyFat ? ` · ${nPT(parseFloat(a.assessBodyFat), 1)}% gordura` : ''}
                  </div>
                  {a.photoIds && a.photoIds.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {a.photoIds.map((pid) => photosById[pid] && <img key={pid} src={photosById[pid].dataUri} alt="Foto do aluno" className="rounded object-cover" style={{ width: 44, height: 44 }} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {confirmDeleteId && (
        <ConfirmDialog title="Eliminar avaliação" message="Tem a certeza de que pretende eliminar esta avaliação física?" onCancel={() => setConfirmDeleteId(null)} onConfirm={() => { onDeleteAssessment(confirmDeleteId); setConfirmDeleteId(null); }} />
      )}
    </div>
  );
}

function AssessmentsView({ students, sessions, photosById, onSaveAssessment, onUploadPhotos, onRemovePhoto, onDeleteAssessment, onPrintAssessment, onNoStudents, selectedStudentId, setSelectedStudentId }) {
  const selected = students.find((s) => s.id === selectedStudentId);

  if (selected) {
    return <AssessmentDetail student={selected} sessions={sessions} photosById={photosById} onBack={() => setSelectedStudentId(null)}
      onSaveAssessment={onSaveAssessment} onUploadPhotos={onUploadPhotos} onRemovePhoto={onRemovePhoto} onDeleteAssessment={onDeleteAssessment}
      onPrintAssessment={onPrintAssessment} />;
  }

  return (
    <div className="px-4 py-4 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold text-2xl text-primary tracking-wide">Avaliações Físicas</h1>
        <button onClick={() => { if (students.length === 0) onNoStudents(); }} type="button" className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0A0A0A' }}>
          <Plus size={15} /> Nova Avaliação
        </button>
      </div>
      <p className="text-xs font-body text-muted">Toque num aluno para ver o histórico e registar uma nova avaliação física.</p>

      {students.length === 0 ? (
        <EmptyState icon={Users} message="Nenhum aluno registado ainda. Registe um aluno antes de fazer uma avaliação física." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...students].sort((a, b) => byNamePt(a.name, b.name)).map((s) => {
            const count = sessions.filter((x) => x.studentId === s.id && x.type === 'avaliacao' && (x.assessWeight || x.assessBodyFat)).length;
            const last = sessions.filter((x) => x.studentId === s.id && x.type === 'avaliacao' && (x.assessWeight || x.assessBodyFat)).sort((a, b) => b.date.localeCompare(a.date))[0];
            return (
              <button key={s.id} onClick={() => setSelectedStudentId(s.id)} type="button" className="card card-hover p-3 text-left min-w-0">
                <div className="flex items-center gap-2 mb-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="font-body text-sm font-medium text-primary truncate" title={s.name}>{s.name}</span>
                </div>
                <div className="text-2xs text-faint font-body truncate">{plural(count, 'avaliação', 'avaliações')}{last ? ` · última em ${fmtDateBR(new Date(`${last.date}T00:00:00`))}` : ''}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================== FALTAS E REPOSIÇÕES ============================== */

function RegistarFaltaModal({ students, sessions, onSave, onClose }) {
  const sortedStudents = useMemo(() => [...students].sort((a, b) => byNamePt(a.name, b.name)), [students]);
  const [form, setForm] = useState({
    studentId: sortedStudents[0]?.id || '',
    date: fmtDateISO(new Date()),
    motivo: '',
    observacoes: '',
    justificada: false,
    precisaReposicao: true,
  });
  const [error, setError] = useState('');
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  // Avisa se já existe aula nesse dia — em vez de criar outra, marca essa.
  const aulaExistente = sessions.find((s) => s.studentId === form.studentId && s.date === form.date
    && s.kind !== 'evento' && s.type !== 'reposicao');

  function submit() {
    if (!form.studentId) { setError('Selecione um aluno.'); return; }
    if (!form.date) { setError('Selecione a data da falta.'); return; }
    onSave(form);
  }

  if (students.length === 0) {
    return (
      <Modal title="Registar falta" onClose={onClose}>
        <EmptyState icon={Users} message="Registe um aluno antes de lançar faltas." />
      </Modal>
    );
  }

  return (
    <Modal title="Registar falta" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <FormField label="Aluno">
          <select value={form.studentId} onChange={(e) => set('studentId', e.target.value)} className="input-field">
            {sortedStudents.map((s) => <option key={s.id} value={s.id}>{s.name}{!s.active ? ' (inativo)' : ''}</option>)}
          </select>
        </FormField>

        <FormField label="Data da falta">
          <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="input-field" />
        </FormField>

        <div className="text-2xs font-body text-faint">
          {aulaExistente
            ? `Existe uma aula neste dia (${aulaExistente.startTime}) — será marcada como falta.`
            : 'Não há aula neste dia. Será criado um registo de falta na agenda.'}
        </div>

        <FormField label="Motivo">
          <select value={form.motivo} onChange={(e) => set('motivo', e.target.value)} className="input-field">
            <option value="">Não indicado</option>
            {FALTA_MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </FormField>

        <div className="bg-elevated rounded-lg p-3 border border-hair flex flex-col gap-2.5">
          <label className="flex items-center gap-2 text-sm font-body text-primary">
            <input
              type="checkbox"
              checked={form.justificada}
              onChange={(e) => {
                // Justificada sugere não dever reposição — mas fica alterável.
                const just = e.target.checked;
                setForm((f) => ({ ...f, justificada: just, precisaReposicao: !just }));
              }}
              style={{ accentColor: 'var(--brass)' }}
            />
            Falta justificada
          </label>
          <label className="flex items-center gap-2 text-sm font-body text-primary">
            <input type="checkbox" checked={form.precisaReposicao} onChange={(e) => set('precisaReposicao', e.target.checked)} style={{ accentColor: 'var(--brass)' }} />
            Dá direito a reposição
          </label>
        </div>

        <FormField label="Observações (opcional)">
          <textarea value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} className="input-field" rows={2} placeholder="Ex: avisou na véspera" />
        </FormField>

        {error && <div className="text-sm font-body text-rust">{error}</div>}

        <div className="flex gap-2 pt-1 mobile-stack">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancelar</button>
          <button type="button" onClick={submit} className="btn btn-primary flex-1">Registar falta</button>
        </div>
      </div>
    </Modal>
  );
}

// Histórico de faltas de um aluno, reutilizado na ficha do aluno e no ecrã de Faltas.
function FaltasDoAluno({ studentId, sessions, onOpenSession, onAgendarReposicao }) {
  const faltas = faltasDoAluno(studentId, sessions);
  if (faltas.length === 0) {
    return <div className="text-xs font-body text-faint py-2">Sem faltas registadas.</div>;
  }
  return (
    <div className="flex flex-col gap-2">
      {faltas.map((f) => {
        const estado = reposicaoEstadoDe(f, sessions);
        const rep = f.reposicaoSessionId ? sessions.find((s) => s.id === f.reposicaoSessionId) : null;
        return (
          <div key={f.id} className="rounded-lg border border-hair p-3 flex flex-col gap-2 min-w-0" style={{ backgroundColor: 'var(--bg-elevated)' }}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs text-primary nowrap">{fmtDateBR(new Date(`${f.date}T00:00:00`))}</span>
                <span className="text-xs font-body text-muted truncate">{f.faltaMotivo || 'Motivo não indicado'}</span>
              </span>
              <span className="flex items-center gap-1.5 flex-shrink-0">
                {f.faltaJustificada && (
                  <span className="badge" style={{ backgroundColor: 'var(--brass-soft)', color: 'var(--brass)' }}>Justificada</span>
                )}
                <span className="badge" style={{ backgroundColor: `${estado.color}1F`, color: estado.color }}>{estado.label}</span>
              </span>
            </div>
            {f.faltaObs && <div className="text-2xs font-body text-faint">{f.faltaObs}</div>}
            <div className="flex items-center gap-2 flex-wrap">
              {rep && (
                <button type="button" onClick={() => onOpenSession(rep)} className="text-2xs font-body link-sky">
                  Reposição em {fmtDateBR(new Date(`${rep.date}T00:00:00`))} às {rep.startTime}
                </button>
              )}
              {estado.id === 'pendente' && (
                <button type="button" onClick={() => onAgendarReposicao(f)} className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 11 }}>
                  Agendar reposição
                </button>
              )}
              <button type="button" onClick={() => onOpenSession(f)} className="text-2xs font-body link-sky">Ver aula</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const FALTA_PERIODOS = [
  { id: '30', label: 'Últimos 30 dias', dias: 30 },
  { id: '90', label: 'Últimos 90 dias', dias: 90 },
  { id: 'todos', label: 'Todo o histórico', dias: null },
];

function FaltasView({ students, sessions, onRegistarFalta, onOpenSession, onAgendarReposicao }) {
  const [alunoFiltro, setAlunoFiltro] = useState('todos');
  const [periodo, setPeriodo] = useState('30');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [justFiltro, setJustFiltro] = useState('todas');
  const [expandido, setExpandido] = useState(null);

  const desdeIso = useMemo(() => {
    const p = FALTA_PERIODOS.find((x) => x.id === periodo);
    if (!p || p.dias == null) return '';
    const d = new Date();
    d.setDate(d.getDate() - p.dias);
    return fmtDateISO(d);
  }, [periodo]);

  // Faltas que passam nos filtros; a contagem por aluno deriva daqui.
  const faltasFiltradas = useMemo(() => sessions.filter((s) => {
    if (!isFalta(s)) return false;
    if (alunoFiltro !== 'todos' && s.studentId !== alunoFiltro) return false;
    if (desdeIso && s.date < desdeIso) return false;
    if (justFiltro === 'sim' && !s.faltaJustificada) return false;
    if (justFiltro === 'nao' && s.faltaJustificada) return false;
    if (estadoFiltro !== 'todos' && reposicaoEstadoDe(s, sessions).id !== estadoFiltro) return false;
    return true;
  }), [sessions, alunoFiltro, desdeIso, justFiltro, estadoFiltro]);

  const linhas = useMemo(() => {
    const porAluno = {};
    faltasFiltradas.forEach((f) => {
      (porAluno[f.studentId] = porAluno[f.studentId] || []).push(f);
    });
    return Object.entries(porAluno).map(([studentId, faltas]) => {
      const aluno = students.find((s) => s.id === studentId);
      const justificadas = faltas.filter((f) => f.faltaJustificada).length;
      const pendentes = faltas.filter((f) => reposicaoEstadoDe(f, sessions).id === 'pendente').length;
      return {
        studentId,
        nome: aluno?.name || 'Aluno removido',
        cor: aluno?.color || '#54565D',
        total: faltas.length,
        justificadas,
        semJustificacao: faltas.length - justificadas,
        pendentes,
        proxima: proximaReposicao(studentId, sessions),
        alerta: alertaFaltas(studentId, sessions),
      };
    }).sort((a, b) => b.pendentes - a.pendentes || byNamePt(a.nome, b.nome));
  }, [faltasFiltradas, students, sessions]);

  const totais = useMemo(() => ({
    faltas: faltasFiltradas.length,
    semJustificacao: faltasFiltradas.filter((f) => !f.faltaJustificada).length,
    pendentes: faltasFiltradas.filter((f) => reposicaoEstadoDe(f, sessions).id === 'pendente').length,
  }), [faltasFiltradas, sessions]);

  const proximaGeral = useMemo(() => {
    const todas = students
      .map((s) => proximaReposicao(s.id, sessions))
      .filter(Boolean)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    return todas[0] || null;
  }, [students, sessions]);

  return (
    <div className="px-4 py-4 max-w-6xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display font-semibold text-2xl text-primary tracking-wide">Faltas e Reposições</h1>
        <button onClick={onRegistarFalta} type="button" className="btn btn-primary flex-shrink-0">
          <UserX size={15} /> Registar falta
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Faltas no período" value={totais.faltas} icon={UserX} accent="rust" />
        <StatCard label="Sem justificação" value={totais.semJustificacao} icon={AlertTriangle} accent="rust" />
        <StatCard label="Reposições pendentes" value={totais.pendentes} icon={RotateCcw} accent="brass" />
        <StatCard
          label="Próxima reposição"
          value={proximaGeral ? fmtDateBR(new Date(`${proximaGeral.date}T00:00:00`)) : '—'}
          sub={proximaGeral ? `às ${proximaGeral.startTime}` : undefined}
          icon={CalendarDays}
          accent="sky"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <select value={alunoFiltro} onChange={(e) => setAlunoFiltro(e.target.value)} aria-label="Filtrar por aluno" className="input-field">
          <option value="todos">Todos os alunos</option>
          {[...students].sort((a, b) => byNamePt(a.name, b.name)).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} aria-label="Filtrar por período" className="input-field">
          {FALTA_PERIODOS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} aria-label="Filtrar por estado da reposição" className="input-field">
          <option value="todos">Qualquer reposição</option>
          <option value="pendente">Pendentes</option>
          <option value="agendada">Agendadas</option>
          <option value="concluida">Concluídas</option>
          <option value="na">Sem direito a reposição</option>
        </select>
        <select value={justFiltro} onChange={(e) => setJustFiltro(e.target.value)} aria-label="Filtrar por justificação" className="input-field">
          <option value="todas">Justificadas e não justificadas</option>
          <option value="sim">Só justificadas</option>
          <option value="nao">Só sem justificação</option>
        </select>
      </div>

      {linhas.length === 0 ? (
        <EmptyState
          icon={UserX}
          message="Nenhuma falta neste filtro."
          hint="Ajuste o período ou os filtros, ou registe uma falta para começar a acompanhar as reposições."
          cta="Registar falta"
          onCta={onRegistarFalta}
        />
      ) : (
        <>
          {/* Telemóvel: cartões. Desktop: tabela. */}
          <div className="sm:hidden flex flex-col gap-2">
            {linhas.map((l) => (
              <div key={l.studentId} className="card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.cor }} />
                    <span className="font-body text-sm font-semibold text-primary truncate" title={l.nome}>{l.nome}</span>
                  </span>
                  {l.alerta.ativo && (
                    <span className="badge flex-shrink-0" style={{ backgroundColor: 'var(--rust-soft)', color: 'var(--rust)' }}>
                      <AlertTriangle size={10} /> Atenção
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[['Faltas', l.total], ['Just.', l.justificadas], ['S/ just.', l.semJustificacao], ['Pend.', l.pendentes]].map(([lbl, val]) => (
                    <div key={lbl} className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-2xs uppercase tracking-wide text-faint font-body truncate">{lbl}</span>
                      <span className="font-mono text-sm text-primary">{val}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-hair">
                  <span className="text-2xs font-body text-faint">
                    {l.proxima ? `Próxima: ${fmtDateBR(new Date(`${l.proxima.date}T00:00:00`))} às ${l.proxima.startTime}` : 'Sem reposição marcada'}
                  </span>
                  <button type="button" onClick={() => setExpandido(expandido === l.studentId ? null : l.studentId)} className="text-2xs font-body link-sky flex-shrink-0">
                    {expandido === l.studentId ? 'Fechar' : 'Histórico'}
                  </button>
                </div>
                {expandido === l.studentId && (
                  <FaltasDoAluno studentId={l.studentId} sessions={sessions} onOpenSession={onOpenSession} onAgendarReposicao={onAgendarReposicao} />
                )}
              </div>
            ))}
          </div>

          <div className="hidden sm:block card overflow-x-auto">
            <table className="w-full text-sm font-body" style={{ minWidth: 640 }}>
              <thead>
                <tr className="border-b border-hair text-left">
                  <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium whitespace-nowrap">Aluno</th>
                  <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right whitespace-nowrap">Faltas</th>
                  <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right whitespace-nowrap">Justificadas</th>
                  <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right whitespace-nowrap">Sem justif.</th>
                  <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium text-right whitespace-nowrap">Pendentes</th>
                  <th className="px-4 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium whitespace-nowrap">Próxima reposição</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <React.Fragment key={l.studentId}>
                    <tr
                      className="border-b border-hair cursor-pointer card-hover"
                      onClick={() => setExpandido(expandido === l.studentId ? null : l.studentId)}
                    >
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-2 max-w-[220px]">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.cor }} />
                          <span className="text-primary truncate" title={l.nome}>{l.nome}</span>
                          {l.alerta.ativo && (
                            <span className="badge flex-shrink-0" style={{ backgroundColor: 'var(--rust-soft)', color: 'var(--rust)' }} title={l.alerta.motivo}>
                              <AlertTriangle size={10} />
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-primary whitespace-nowrap">{l.total}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-muted whitespace-nowrap">{l.justificadas}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-rust whitespace-nowrap">{l.semJustificacao}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold whitespace-nowrap" style={{ color: l.pendentes > 0 ? 'var(--rust)' : 'var(--text-faint)' }}>{l.pendentes}</td>
                      <td className="px-4 py-2.5 text-muted whitespace-nowrap">
                        {l.proxima ? `${fmtDateBR(new Date(`${l.proxima.date}T00:00:00`))} às ${l.proxima.startTime}` : '—'}
                      </td>
                    </tr>
                    {expandido === l.studentId && (
                      <tr>
                        <td colSpan={6} className="px-4 py-3" style={{ backgroundColor: 'var(--bg-base)' }}>
                          <FaltasDoAluno studentId={l.studentId} sessions={sessions} onOpenSession={onOpenSession} onAgendarReposicao={onAgendarReposicao} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================== ADMINISTRAÇÃO ============================== */

const ADMIN_SECOES = [
  { id: 'visao', label: 'Visão geral' },
  { id: 'contas', label: 'Contas' },
  { id: 'eventos', label: 'Eventos' },
];

const EVENTO_LABELS = {
  created: { label: 'Nova subscrição', color: '#5FBFA0' },
  renewed: { label: 'Renovação', color: '#5FC4D0' },
  upgraded: { label: 'Upgrade', color: '#1EA6B4' },
  downgraded: { label: 'Downgrade', color: '#F5B44C' },
  plan_changed: { label: 'Mudança de plano', color: '#8C8C8C' },
  cancel_scheduled: { label: 'Cancelamento agendado', color: '#F5B44C' },
  canceled: { label: 'Cancelada', color: '#D6534A' },
  reactivated: { label: 'Reativada', color: '#5FBFA0' },
  payment_failed: { label: 'Pagamento falhado', color: '#D6534A' },
};

const ESTADO_CONTA = {
  active: { label: 'Ativa', color: '#5FBFA0' },
  past_due: { label: 'Em atraso', color: '#D6534A' },
  canceled: { label: 'Cancelada', color: '#8C8C8C' },
  sem_plano: { label: 'Sem plano', color: '#7C838F' },
};

function estadoConta(id) {
  return ESTADO_CONTA[id] || { label: id || '—', color: '#8C8C8C' };
}

// O `plan_tier` chega em minúsculas da Stripe; aqui é texto para ler.
function nomePlano(tier) {
  if (!tier) return '—';
  return String(tier).charAt(0).toUpperCase() + String(tier).slice(1);
}

function AdminView() {
  const [secao, setSecao] = useState('visao');
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [procura, setProcura] = useState('');
  const [filtroEvento, setFiltroEvento] = useState('todos');

  async function carregar() {
    setCarregando(true);
    setErro('');
    if (!supabaseConfigured || !supabase) {
      setErro('Supabase não está configurado.');
      setCarregando(false);
      return;
    }
    const { data, error } = await supabase.functions.invoke('admin-overview', { body: {} });
    setCarregando(false);
    if (error || !data || data.error) {
      setErro(await edgeFunctionErrorMessage(error, data?.error || 'Não foi possível carregar os dados de administração.'));
      return;
    }
    setDados(data);
  }

  useEffect(() => { carregar(); }, []);

  const contasFiltradas = useMemo(() => {
    if (!dados) return [];
    const termo = procura.trim().toLowerCase();
    return dados.contas.filter((c) => {
      if (filtroEstado === 'ativas' && !c.ativa) return false;
      if (filtroEstado !== 'todos' && filtroEstado !== 'ativas' && c.estado !== filtroEstado) return false;
      if (termo && !String(c.email || '').toLowerCase().includes(termo)) return false;
      return true;
    }).sort((a, b) => byNamePt(a.email, b.email));
  }, [dados, filtroEstado, procura]);

  const eventosFiltrados = useMemo(() => {
    if (!dados) return [];
    return dados.eventos.filter((e) => filtroEvento === 'todos' || e.event_type === filtroEvento);
  }, [dados, filtroEvento]);

  if (carregando) {
    return (
      <div className="px-4 py-10 max-w-6xl mx-auto flex flex-col items-center gap-3">
        <Loader2 size={22} className="text-brass spin" />
        <span className="text-sm font-body text-muted">A carregar dados de administração...</span>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="px-4 py-4 max-w-6xl mx-auto">
        <div className="card p-5 flex flex-col gap-3 items-start">
          <div className="flex items-center gap-2 text-rust">
            <AlertTriangle size={16} />
            <span className="font-display font-semibold text-base">Administração indisponível</span>
          </div>
          <p className="text-sm font-body text-muted">{erro}</p>
          <button type="button" onClick={carregar} className="btn btn-ghost">Tentar novamente</button>
        </div>
      </div>
    );
  }

  const m = dados.metricas;

  return (
    <div className="px-4 py-4 max-w-6xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-display font-semibold text-2xl text-primary tracking-wide">Administração</h1>
        <button type="button" onClick={carregar} className="btn btn-ghost flex-shrink-0" style={{ fontSize: 12 }}>
          <RefreshCcw size={14} /> Atualizar
        </button>
      </div>

      <div className="flex rounded-lg border border-hair overflow-hidden w-fit">
        {ADMIN_SECOES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSecao(s.id)}
            aria-pressed={secao === s.id}
            className="px-4 py-2 text-sm font-body nowrap"
            style={{
              backgroundColor: secao === s.id ? 'var(--bg-elevated)' : 'transparent',
              color: secao === s.id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: secao === s.id ? 600 : 400,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {secao === 'visao' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Contas ativas" value={m.contasAtivas} sub={`${m.contasTotal} no total`} icon={Users} accent="brass" />
            <StatCard label="MRR" value={currency(m.mrr)} sub="Receita mensal recorrente" icon={TrendingUp} accent="brass" />
            <StatCard label="Em atraso" value={m.inadimplentes} icon={AlertTriangle} accent="rust" />
            <StatCard label="Cancelam. agendados" value={m.cancelamentosAgendados} icon={UserX} accent="rust" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Novos (30 dias)" value={m.novosUltimos30} icon={UserPlus} accent="sky" />
            <StatCard label="Cancelamentos (30 dias)" value={m.cancelamentosUltimos30} icon={RotateCcw} accent="rust" />
            <StatCard label="Churn (30 dias)" value={`${Number(m.churn || 0).toLocaleString('pt-PT', { maximumFractionDigits: 1 })}%`} icon={Activity} accent={m.churn > 10 ? 'rust' : 'sky'} />
            <StatCard label="Sem plano" value={m.semPlano} icon={Ban} accent="slate" />
          </div>

          <div className="card p-4 min-w-0">
            <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-2">Contas ativas por plano</div>
            <ErrorBoundary compact>
              {dados.porPlano.every((p) => p.contas === 0) ? (
                <EmptyState icon={Users} message="Ainda não há subscrições ativas." />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dados.porPlano} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="plano" tick={CHART.tick} axisLine={false} tickLine={false} tickFormatter={nomePlano} />
                    <YAxis tick={CHART.tick} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                    <Tooltip contentStyle={CHART.tooltip} labelStyle={CHART.tooltipLabel} itemStyle={CHART.tooltipItem} cursor={CHART.cursor} formatter={(v) => [v, 'Contas']} />
                    <Bar dataKey="contas" fill="var(--brass)" radius={[3, 3, 0, 0]} maxBarSize={72} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ErrorBoundary>
          </div>

          <div className="card p-4">
            <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-2">Alertas</div>
            {dados.alertas.length === 0 ? (
              <div className="text-sm font-body text-muted py-2">Nada a assinalar.</div>
            ) : (
              <div className="flex flex-col">
                {dados.alertas.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 py-2.5 min-w-0"
                    style={{ borderBottom: i === dados.alertas.length - 1 ? 'none' : '1px solid var(--border-hair)' }}
                  >
                    <span className="text-sm font-body text-primary truncate" title={a.email}>{a.email}</span>
                    <span className="badge flex-shrink-0" style={{
                      backgroundColor: a.tipo === 'inatividade' ? 'rgba(255,255,255,0.05)' : 'var(--rust-soft)',
                      color: a.tipo === 'inatividade' ? 'var(--text-faint)' : 'var(--rust)',
                    }}>{a.detalhe}{a.data ? ` · ${fmtDateLong(a.data)}` : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {secao === 'contas' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative min-w-0">
              <Search size={15} className="absolute text-faint" style={{ left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={procura} onChange={(e) => setProcura(e.target.value)} placeholder="Procurar por e-mail..." aria-label="Procurar conta" className="input-field" style={{ paddingLeft: 34 }} />
            </div>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} aria-label="Filtrar por estado" className="input-field">
              <option value="todos">Todos os estados</option>
              <option value="ativas">Ativas</option>
              <option value="past_due">Em atraso</option>
              <option value="canceled">Canceladas</option>
              <option value="sem_plano">Sem plano</option>
            </select>
          </div>
          <div className="text-2xs font-body text-faint">{plural(contasFiltradas.length, 'conta', 'contas')}</div>

          {contasFiltradas.length === 0 ? (
            <EmptyState icon={Users} message="Nenhuma conta neste filtro." />
          ) : (
            <>
              <div className="sm:hidden flex flex-col gap-2">
                {contasFiltradas.map((c) => {
                  const est = estadoConta(c.estado);
                  return (
                    <div key={c.userId} className="card p-4 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="font-body text-sm text-primary truncate" title={c.email}>{c.email}</span>
                        <span className="badge flex-shrink-0" style={{ backgroundColor: `${est.color}1F`, color: est.color }}>{est.label}</span>
                      </div>
                      {/* Duas colunas com quatro campos: no telemóvel a regra global
                          empurra grid-cols-3 para 2, o que deixaria uma linha órfã. */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                        {[
                          ['Plano', nomePlano(c.plano)],
                          ['Valor', c.valor != null ? currency(c.valor) : '—'],
                          ['Alunos', c.alunos],
                          ['Aulas', c.aulas],
                        ].map(([l, v]) => (
                          <div key={l} className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-2xs uppercase tracking-wide text-faint font-body truncate">{l}</span>
                            <span className="font-mono text-xs text-primary truncate">{v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-2xs font-body text-faint">
                        Registo {fmtDateLong(c.registoEm)}{c.fimCiclo ? ` · ciclo até ${fmtDateLong(c.fimCiclo)}` : ''}
                        {c.cartao ? ` · ${c.cartao}` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden sm:block card overflow-x-auto">
                <table className="w-full text-sm font-body" style={{ minWidth: 860 }}>
                  <thead>
                    <tr className="border-b border-hair text-left">
                      {['Conta', 'Estado', 'Plano', 'Valor', 'Fim do ciclo', 'Cartão', 'Alunos', 'Aulas', 'Último acesso'].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-2xs uppercase tracking-wide text-faint font-body font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contasFiltradas.map((c) => {
                      const est = estadoConta(c.estado);
                      return (
                        <tr key={c.userId} className="border-b border-hair">
                          <td className="px-3 py-2.5">
                            <span className="block truncate max-w-[220px] text-primary" title={c.email}>{c.email}</span>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className="badge" style={{ backgroundColor: `${est.color}1F`, color: est.color }}>{est.label}</span>
                          </td>
                          <td className="px-3 py-2.5 text-muted whitespace-nowrap">{nomePlano(c.plano)}</td>
                          <td className="px-3 py-2.5 font-mono text-primary whitespace-nowrap">{c.valor != null ? currency(c.valor) : '—'}</td>
                          <td className="px-3 py-2.5 text-muted whitespace-nowrap">{c.fimCiclo ? fmtDateLong(c.fimCiclo) : '—'}</td>
                          <td className="px-3 py-2.5 text-faint font-mono text-xs whitespace-nowrap">{c.cartao || '—'}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-primary">{c.alunos}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-primary">{c.aulas}</td>
                          <td className="px-3 py-2.5 text-muted whitespace-nowrap">{c.ultimoAcesso ? fmtDateLong(c.ultimoAcesso) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {secao === 'eventos' && (
        <>
          <select value={filtroEvento} onChange={(e) => setFiltroEvento(e.target.value)} aria-label="Filtrar por tipo de evento" className="input-field" style={{ maxWidth: 280 }}>
            <option value="todos">Todos os eventos</option>
            {Object.entries(EVENTO_LABELS).map(([id, v]) => <option key={id} value={id}>{v.label}</option>)}
          </select>

          {eventosFiltrados.length === 0 ? (
            <EmptyState
              icon={Activity}
              message="Sem eventos registados."
              hint="O histórico começa a acumular a partir da instalação desta funcionalidade. Eventos anteriores continuam disponíveis no painel da Stripe."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {eventosFiltrados.map((e) => {
                const tipo = EVENTO_LABELS[e.event_type] || { label: e.event_type, color: '#8C8C8C' };
                const conta = dados.contas.find((c) => c.userId === e.user_id);
                return (
                  <div key={e.id} className="card p-3 flex items-center justify-between gap-3 flex-wrap min-w-0">
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-2xs text-muted nowrap">{fmtDateLong(e.occurred_at)}</span>
                      <span className="text-sm font-body text-primary truncate" title={conta?.email}>{conta?.email || 'Conta removida'}</span>
                    </span>
                    <span className="flex items-center gap-2 flex-shrink-0">
                      {e.from_tier && e.to_tier && e.from_tier !== e.to_tier && (
                        <span className="text-2xs font-mono text-faint nowrap">{nomePlano(e.from_tier)} → {nomePlano(e.to_tier)}</span>
                      )}
                      {e.amount != null && <span className="font-mono text-xs text-muted nowrap">{currency(e.amount)}</span>}
                      <span className="badge" style={{ backgroundColor: `${tipo.color}1F`, color: tipo.color }}>{tipo.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ============================== PERSONAL FINANCES ============================== */

function TransactionCard({ tx, onOpen, onQuickComplete, customCategories }) {
  const isIncome = tx.type === 'entrada';
  const cat = categoryFor(tx.type, tx.category, customCategories);
  const pending = tx.status === 'pendente';
  const color = isIncome ? 'var(--brass)' : 'var(--rust)';
  // A entrada automática dos alunos é derivada das fichas: não se edita aqui.
  const isAuto = Boolean(tx.auto);
  const interactive = !isAuto;
  return (
    <div
      onClick={interactive ? onOpen : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter') onOpen(); } : undefined}
      className={`rounded-lg border border-hair bg-elevated pl-3 pr-1.5 py-2 animate-in flex items-center justify-between gap-2 ${interactive ? 'cursor-pointer card-hover' : ''}`}
      style={isAuto ? { borderStyle: 'dashed' } : undefined}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
          <span className="font-mono text-2xs text-muted nowrap">{fmtDateBR(new Date(`${tx.date}T00:00:00`))}</span>
          <span className="text-2xs font-body px-1.5 py-0.5 rounded truncate" style={{ backgroundColor: `${cat.color}22`, color: cat.color }}>{cat.label}</span>
          {isAuto && (
            <span className="badge flex-shrink-0" style={{ backgroundColor: 'var(--brass-soft)', color: 'var(--brass)' }}>Automático</span>
          )}
        </div>
        <div className="font-body text-sm text-primary truncate">{tx.description || '(sem descrição)'}</div>
        <span className="text-2xs font-body" style={{ color: isAuto ? 'var(--text-faint)' : pending ? color : 'var(--text-faint)' }}>
          {isAuto ? 'Calculado a partir das fichas dos alunos' : statusLabel(tx.type, tx.status)}
        </span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="font-mono text-sm font-semibold nowrap" style={{ color }}>{isIncome ? '+' : '−'} {currency(tx.amount)}</span>
        {pending && !isAuto && (
          <button onClick={(e) => { e.stopPropagation(); onQuickComplete(tx); }} type="button" className="p-1 rounded btn-surface" aria-label="Marcar como concluído" title={isIncome ? 'Marcar como recebido' : 'Marcar como pago'}>
            <CheckCircle2 size={14} className="text-slate-acc" style={{ display: 'block' }} />
          </button>
        )}
      </div>
    </div>
  );
}

function TransactionFormModal({ tx, defaultType, customCategories, onAddCategory, onSave, onClose, onDelete }) {
  const isEdit = !!tx;
  const [form, setForm] = useState(() => (tx ? { ...tx } : {
    id: uid(), type: defaultType || 'gasto', description: '', category: EXPENSE_CATEGORIES[0].id,
    amount: '', date: fmtDateISO(new Date()), status: 'concluido', notes: '',
  }));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function setType(type) {
    const catList = type === 'entrada' ? [...INCOME_CATEGORIES, ...customCategories.income] : [...EXPENSE_CATEGORIES, ...customCategories.expense];
    setForm((f) => ({ ...f, type, category: catList.some((c) => c.id === f.category) ? f.category : catList[0].id }));
  }

  function handleSubmit() {
    const amt = parseFloat(form.amount);
    if (Number.isNaN(amt) || amt <= 0) { setError('Informe um valor válido.'); return; }
    if (!form.date) { setError('Selecione uma data.'); return; }
    setError('');
    onSave({ ...form, amount: amt });
  }

  const catList = form.type === 'entrada' ? [...INCOME_CATEGORIES, ...customCategories.income] : [...EXPENSE_CATEGORIES, ...customCategories.expense];

  return (
    <Modal title={isEdit ? 'Editar Lançamento' : 'Novo Lançamento'} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <FormField label="Tipo">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setType('gasto')} className="px-3 py-2 rounded-lg border text-sm font-body" style={{ borderColor: form.type === 'gasto' ? 'var(--rust)' : 'var(--border-hair)', backgroundColor: form.type === 'gasto' ? 'rgba(214,83,74,0.12)' : 'var(--bg-base)', color: form.type === 'gasto' ? 'var(--rust)' : 'var(--text-muted)' }}>Gasto / Conta</button>
            <button type="button" onClick={() => setType('entrada')} className="px-3 py-2 rounded-lg border text-sm font-body" style={{ borderColor: form.type === 'entrada' ? 'var(--brass)' : 'var(--border-hair)', backgroundColor: form.type === 'entrada' ? 'rgba(30,166,180,0.12)' : 'var(--bg-base)', color: form.type === 'entrada' ? 'var(--brass)' : 'var(--text-muted)' }}>Recebimento / Entrada</button>
          </div>
        </FormField>

        <FormField label="Descrição">
          <input value={form.description} onChange={(e) => set('description', e.target.value)} className="input-field" placeholder={form.type === 'entrada' ? 'Ex: Honorários de Junho' : 'Ex: Renda da casa'} />
        </FormField>

        <FormField label="Categoria">
          <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input-field">
            {catList.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <AddCategoryInline placeholder={form.type === 'entrada' ? 'Ex: Consultoria' : 'Ex: Animais de estimação'} onAdd={(label) => {
            const kind = form.type === 'entrada' ? 'income' : 'expense';
            const pool = customCategories[kind];
            const id = slugify(label);
            onAddCategory(kind, { id, label, color: CUSTOM_CATEGORY_COLORS[pool.length % CUSTOM_CATEGORY_COLORS.length] });
            set('category', id);
          }} />
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
      <div className="flex gap-2 mobile-stack">
            <button type="button" onClick={() => set('status', 'concluido')} className="px-3 py-1.5 rounded-full border text-xs font-body" style={{ borderColor: form.status === 'concluido' ? 'var(--slate-acc)' : 'var(--border-hair)', backgroundColor: form.status === 'concluido' ? 'rgba(140,140,140,0.15)' : 'transparent', color: form.status === 'concluido' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {statusLabel(form.type, 'concluido')}
            </button>
            <button type="button" onClick={() => set('status', 'pendente')} className="px-3 py-1.5 rounded-full border text-xs font-body" style={{ borderColor: form.status === 'pendente' ? (form.type === 'entrada' ? 'var(--brass)' : 'var(--rust)') : 'var(--border-hair)', backgroundColor: form.status === 'pendente' ? (form.type === 'entrada' ? 'rgba(30,166,180,0.12)' : 'rgba(214,83,74,0.12)') : 'transparent', color: form.status === 'pendente' ? (form.type === 'entrada' ? 'var(--brass)' : 'var(--rust)') : 'var(--text-muted)' }}>
              {statusLabel(form.type, 'pendente')}
            </button>
          </div>
        </FormField>

        <FormField label="Observações (opcional)">
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className="input-field" rows={2} placeholder="Notas..." />
        </FormField>

        {error && <div className="text-sm font-body text-rust">{error}</div>}

        <div className="flex gap-2 pt-2 mobile-stack">
          {isEdit && (
            <button onClick={() => setConfirmDelete(true)} type="button" className="px-4 py-2.5 rounded-lg text-sm font-body border border-hair text-rust btn-surface">
              <Trash2 size={15} className="inline mr-1.5" style={{ marginTop: '-2px' }} />Eliminar
            </button>
          )}
          <button onClick={handleSubmit} type="button" className="flex-1 px-4 py-2.5 rounded-lg text-sm font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0A0A0A' }}>
            Guardar
          </button>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmDialog title="Eliminar lançamento" message="Tem a certeza de que pretende eliminar este lançamento?" onCancel={() => setConfirmDelete(false)} onConfirm={() => { onDelete(form.id); setConfirmDelete(false); }} />
      )}
    </Modal>
  );
}

function FinancesView({ finances, students, monthCursor, setMonthCursor, onOpenTransaction, onNewTransaction, onQuickComplete, customCategories }) {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const monthTx = useMemo(
    () => monthTransactions(finances, students, year, month).sort((a, b) => b.date.localeCompare(a.date)),
    [finances, students, year, month],
  );

  const entradas = monthTx.filter((t) => t.type === 'entrada').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const saidas = monthTx.filter((t) => t.type === 'gasto').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const saldo = entradas - saidas;
  const pendencias = monthTx.filter((t) => t.status === 'pendente');

  const categoryData = useMemo(() => [...EXPENSE_CATEGORIES, ...customCategories.expense].map((c) => ({
    name: c.label, color: c.color, value: monthTx.filter((t) => t.type === 'gasto' && t.category === c.id).reduce((s, t) => s + (Number(t.amount) || 0), 0),
  })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value), [monthTx, customCategories]);

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
        <div className="flex gap-2 mobile-stack">
          <button onClick={() => onNewTransaction('gasto')} type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-medium border" style={{ backgroundColor: 'var(--rust)', borderColor: 'var(--rust)', color: '#0A0A0A' }}>
            <Plus size={13} /> Gasto
          </button>
          <button onClick={() => onNewTransaction('entrada')} type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0A0A0A' }}>
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
                <Tooltip formatter={(v) => currency(v)} contentStyle={CHART.tooltip} labelStyle={CHART.tooltipLabel} itemStyle={CHART.tooltipItem} cursor={CHART.cursor} />
                <Legend wrapperStyle={CHART.legend} />
              </PieChart>
            </ResponsiveContainer>
          </ErrorBoundary>
        </div>
      )}

      {pendencias.length > 0 && (
        <div>
          <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-2">Pendências deste mês</div>
          <div className="flex flex-col gap-2">
            {pendencias.map((t) => <TransactionCard key={t.id} tx={t} onOpen={() => onOpenTransaction(t)} onQuickComplete={onQuickComplete} customCategories={customCategories} />)}
          </div>
        </div>
      )}

      <div>
        <div className="text-2xs uppercase tracking-wide text-faint font-mono mb-2">Todos os Lançamentos</div>
        {monthTx.length === 0 ? (
          <EmptyState icon={Wallet} message="Nenhum lançamento neste mês ainda." cta="Novo lançamento" onCta={() => onNewTransaction('gasto')} />
        ) : (
          <div className="flex flex-col gap-2">
            {monthTx.map((t) => <TransactionCard key={t.id} tx={t} onOpen={() => onOpenTransaction(t)} onQuickComplete={onQuickComplete} customCategories={customCategories} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== SETTINGS ============================== */


/* ============================== APP ROOT ============================== */

function AppInner() {
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(!supabaseConfigured);
  const [subscriptionReady, setSubscriptionReady] = useState(!supabaseConfigured);
  const [user, setUser] = useState(null);
  const [subscriptionActive, setSubscriptionActive] = useState(!supabaseConfigured);
  const [subscription, setSubscription] = useState({
    active: !supabaseConfigured, status: supabaseConfigured ? 'inactive' : 'local', tier: supabaseConfigured ? null : 'local',
    value: null, interval: supabaseConfigured ? null : 'Local', currentPeriodStart: null, currentPeriodEnd: null,
    cancelAtPeriodEnd: false, paymentMethodBrand: null, paymentMethodLast4: null, stripeCustomerId: null,
    stripeSubscriptionId: null, lastPaymentStatus: null, updatedAt: null,
  });
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [finances, setFinances] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [customCategories, setCustomCategories] = useState(EMPTY_CUSTOM_CATEGORIES);
  const [view, setView] = useState('dashboard');
  const [agendaScale, setAgendaScale] = useState('weekly');
  const [showFaltaModal, setShowFaltaModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [financeMonthCursor, setFinanceMonthCursor] = useState(new Date());
  const [assessmentsStudentId, setAssessmentsStudentId] = useState(null);
  const [printJob, setPrintJob] = useState(null);
  const [definicoes, setDefinicoes] = useState(() => normalizarDefinicoes(null));
  const [treinos, setTreinos] = useState(EMPTY_TREINOS);
  const [treinosStudentId, setTreinosStudentId] = useState(null);
  const [clipboardSession, setClipboardSession] = useState(null);
  const [permissaoNotificacoes, setPermissaoNotificacoes] = useState(
    () => (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'),
  );
  const [lembreteAtivo, setLembreteAtivo] = useState(null);
  const [confirmLibertar, setConfirmLibertar] = useState(null);
  const [sessionModal, setSessionModal] = useState(null);
  const [studentModal, setStudentModal] = useState(null);
  const [transactionModal, setTransactionModal] = useState(null);
  const [dayDetailIso, setDayDetailIso] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [checkoutReturn, setCheckoutReturn] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loginMode, setLoginMode] = useState('signin');
  const storageOk = browserStorageAvailable();

  function openLogin(mode = 'signin') {
    setLoginMode(mode);
    setShowLogin(true);
  }

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setAuthReady(true);
      setSubscriptionReady(true);
      setSubscriptionActive(true);
      setSubscription({
        active: true, status: 'local', tier: 'local', value: null, interval: 'Local', currentPeriodStart: null,
        currentPeriodEnd: null, cancelAtPeriodEnd: false, paymentMethodBrand: null, paymentMethodLast4: null,
        stripeCustomerId: null, stripeSubscriptionId: null, lastPaymentStatus: null, updatedAt: null,
      });
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
      setSubscriptionReady(true);
      setSubscriptionActive(false);
      setSubscription({
        active: false, status: 'signed_out', tier: null, value: null, interval: null, currentPeriodStart: null,
        currentPeriodEnd: null, cancelAtPeriodEnd: false, paymentMethodBrand: null, paymentMethodLast4: null,
        stripeCustomerId: null, stripeSubscriptionId: null, lastPaymentStatus: null, updatedAt: null,
      });
      clearLoadedData();
      return;
    }
    refreshSubscription();
  }, [authReady, user?.id]);

  useEffect(() => {
    if (!authReady || !user || !supabaseConfigured) return undefined;
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    if (checkout !== 'success' && checkout !== 'cancelled') return undefined;

    window.history.replaceState({}, '', window.location.pathname);
    if (checkout === 'cancelled') {
      setCheckoutReturn({ status: 'cancelled' });
      return undefined;
    }

    let cancelled = false;
    setCheckoutReturn({ status: 'success', message: 'Pagamento recebido. A verificar subscrição...' });

    async function verifyPaidSubscription() {
      const waits = [0, 1200, 2200, 3500, 5000];
      for (let i = 0; i < waits.length; i += 1) {
        if (waits[i] > 0) await new Promise((resolve) => setTimeout(resolve, waits[i]));
        if (cancelled) return;
        setCheckoutReturn({ status: 'success', message: i === 0 ? 'Pagamento recebido. A verificar subscrição...' : 'Ainda a verificar a ativação do plano...' });
        const status = await readSubscriptionStatus();
        if (cancelled) return;
        setSubscriptionActive(status.active);
        setSubscription(status);
        if (status.active) {
          setCheckoutReturn(null);
          showToast('Plano ativado. Bem-vindo ao PTMANAGER.');
          return;
        }
      }
      setCheckoutReturn({ status: 'success', message: 'Pagamento recebido. Clique em verificar se a ativação ainda não apareceu.' });
    }

    verifyPaidSubscription().catch(() => {
      if (!cancelled) setCheckoutReturn({ status: 'success', message: 'Pagamento recebido. Clique em verificar subscrição para concluir.' });
    });

    return () => { cancelled = true; };
  }, [authReady, user?.id]);

  useEffect(() => {
    if (!authReady || !subscriptionReady) return;
    if (supabaseConfigured && (!user || !subscriptionActive)) {
      setLoading(false);
      clearLoadedData();
      return;
    }
    loadAll();
  }, [authReady, subscriptionReady, subscriptionActive, user?.id]);

  // Pergunta ao servidor se esta conta é de administrador. Serve apenas para
  // mostrar o separador — a autorização real é feita na Edge Function.
  useEffect(() => {
    let cancelado = false;
    if (!supabaseConfigured || !supabase || !user?.id) { setIsAdmin(false); return undefined; }
    supabase.functions
      .invoke('admin-overview', { body: { ping: true } })
      .then(({ data, error }) => {
        if (!cancelado) setIsAdmin(!error && Boolean(data) && !data.error);
      })
      .catch(() => { if (!cancelado) setIsAdmin(false); });
    return () => { cancelado = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // Lembretes: verificacao periodica em vez de um setTimeout longo. Um
  // temporizador para daqui a dois dias e adiado ou perdido quando o browser
  // suspende a aba; um intervalo curto recupera assim que a aba acorda.
  const jaAvisadasRef = useRef(new Set());
  useEffect(() => {
    if (!definicoes.lembretes.ativos) { setLembreteAtivo(null); return undefined; }
    const janela = (definicoes.lembretes.minutosAntes || 15) * 60000;
    const avisadas = jaAvisadasRef.current;

    function verificar() {
      const agora = Date.now();
      for (const sessao of sessions) {
        if (sessao.status !== 'agendado' || avisadas.has(sessao.id)) continue;
        const inicio = new Date(`${sessao.date}T${sessao.startTime || '00:00'}:00`).getTime();
        if (!Number.isFinite(inicio)) continue;
        const faltam = inicio - agora;
        if (faltam <= 0 || faltam > janela) continue;
        avisadas.add(sessao.id);
        const aluno = students.find((st) => st.id === sessao.studentId);
        const titulo = sessao.kind === 'evento'
          ? eventTypeFor(sessao.type, customCategories).label
          : (aluno?.name || 'Aula');
        const minutos = Math.max(1, Math.round(faltam / 60000));
        const corpo = `${titulo} às ${sessao.startTime} — daqui a ${plural(minutos, 'minuto', 'minutos')}.`;
        setLembreteAtivo({ id: sessao.id, titulo, corpo });
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try { new Notification('PTMANAGER', { body: corpo, tag: sessao.id }); } catch (e) { /* o aviso no ecra basta */ }
        }
      }
    }

    verificar();
    const id = setInterval(verificar, 30000);
    return () => clearInterval(id);
  }, [sessions, students, customCategories, definicoes.lembretes.ativos, definicoes.lembretes.minutosAntes]);

  async function loadAll() {
    setLoading(true);
    let st = []; let se = []; let fi = []; let ph = []; let cc = EMPTY_CUSTOM_CATEGORIES; let df = null; let tr = null;
    if (storageOk) {
      try { const r = await readStoredValue('alunos'); if (r && r.value) st = JSON.parse(r.value); } catch (e) { /* sem dados */ }
      try { const r = await readStoredValue('agenda'); if (r && r.value) se = JSON.parse(r.value); } catch (e) { /* sem dados */ }
      try { const r = await readStoredValue('financas'); if (r && r.value) fi = JSON.parse(r.value); } catch (e) { /* sem dados */ }
      try { const r = await readStoredValue('fotos'); if (r && r.value) ph = JSON.parse(r.value); } catch (e) { /* sem dados */ }
      try { const r = await readStoredValue('categorias'); if (r && r.value) cc = JSON.parse(r.value); } catch (e) { /* sem dados */ }
      try { const r = await readStoredValue('definicoes'); if (r && r.value) df = JSON.parse(r.value); } catch (e) { /* sem dados */ }
      try { const r = await readStoredValue('treinos'); if (r && r.value) tr = JSON.parse(r.value); } catch (e) { /* sem dados */ }
    }
    setStudents(Array.isArray(st) ? st : []);

    // Faltas antigas não têm ligação a reposições. Emparelha-as uma única vez,
    // para os contadores não saltarem ao mudar para a contagem por ligação.
    const agenda = Array.isArray(se) ? se : [];
    const { sessions: agendaMigrada, migradas } = migrarFaltasLegado(agenda);
    setSessions(agendaMigrada);
    if (migradas > 0 && storageOk) {
      try { await writeStoredValue('agenda', JSON.stringify(agendaMigrada)); } catch (e) { /* fica para a próxima gravação */ }
    }

    setFinances(Array.isArray(fi) ? fi : []);
    setPhotos(Array.isArray(ph) ? ph : []);
    setCustomCategories({ ...EMPTY_CUSTOM_CATEGORIES, ...(cc || {}) });
    setDefinicoes(normalizarDefinicoes(df));
    const treinosNorm = normalizarTreinos(tr);
    treinosRef.current = treinosNorm;
    setTreinos(treinosNorm);
    setLoading(false);
  }

  function clearLoadedData() {
    setStudents([]);
    setSessions([]);
    setFinances([]);
    setPhotos([]);
    setCustomCategories(EMPTY_CUSTOM_CATEGORIES);
    setDefinicoes(normalizarDefinicoes(null));
    setTreinos(EMPTY_TREINOS);
  }

  async function refreshSubscription() {
    setSubscriptionReady(false);
    try {
      const status = await readSubscriptionStatus();
      setSubscriptionActive(status.active);
      setSubscription(status);
    } catch (e) {
      setSubscriptionActive(false);
      setSubscription({
        active: false, status: 'error', tier: null, value: null, interval: null, currentPeriodStart: null,
        currentPeriodEnd: null, cancelAtPeriodEnd: false, paymentMethodBrand: null, paymentMethodLast4: null,
        stripeCustomerId: null, stripeSubscriptionId: null, lastPaymentStatus: null, updatedAt: null,
      });
      showToast('Não foi possível verificar a sua subscrição.', 'error');
    }
    setSubscriptionReady(true);
  }

  function showToast(msg, type = 'success') { setToast({ msg, type, key: Date.now() }); }

  async function persistStudents(next) {
    setStudents(next);
    if (!storageOk) { showToast('Dados salvos apenas nesta sessão (armazenamento indisponível).'); return; }
    try { await writeStoredValue('alunos', JSON.stringify(next)); } catch (e) { showToast('Erro ao guardar. Tente novamente.', 'error'); }
  }
  async function persistSessions(next) {
    setSessions(next);
    if (!storageOk) return;
    try { await writeStoredValue('agenda', JSON.stringify(next)); } catch (e) { showToast('Erro ao guardar. Tente novamente.', 'error'); }
  }
  async function persistFinances(next) {
    setFinances(next);
    if (!storageOk) return;
    try { await writeStoredValue('financas', JSON.stringify(next)); } catch (e) { showToast('Erro ao guardar. Tente novamente.', 'error'); }
  }
  async function persistPhotos(next) {
    setPhotos(next);
    if (!storageOk) return;
    try { await writeStoredValue('fotos', JSON.stringify(next)); } catch (e) { showToast('Erro ao guardar fotos — experimente imagens mais pequenas.', 'error'); }
  }

  // Aceita uma funcao do valor atual, e nao um objeto ja montado. Criar um
  // exercicio e acrescenta-lo ao treino sao duas gravacoes seguidas no mesmo
  // handler: com um objeto montado a partir do `treinos` do render, a segunda
  // gravacao escrevia por cima da primeira e o exercicio novo perdia-se.
  const treinosRef = useRef(EMPTY_TREINOS);
  useEffect(() => { treinosRef.current = treinos; }, [treinos]);

  async function persistTreinos(atualizar) {
    const base = treinosRef.current;
    const normalizado = normalizarTreinos(typeof atualizar === 'function' ? atualizar(base) : atualizar);
    treinosRef.current = normalizado;
    setTreinos(normalizado);
    if (!storageOk) return;
    try { await writeStoredValue('treinos', JSON.stringify(normalizado)); } catch (e) { showToast('Erro ao guardar os treinos.', 'error'); }
  }

  async function persistDefinicoes(next) {
    const normalizado = normalizarDefinicoes(next);
    setDefinicoes(normalizado);
    if (!storageOk) return;
    try { await writeStoredValue('definicoes', JSON.stringify(normalizado)); } catch (e) { showToast('Erro ao guardar as definições da agenda.', 'error'); }
  }

  async function persistCustomCategories(next) {
    const normalized = { ...EMPTY_CUSTOM_CATEGORIES, ...(next || {}) };
    setCustomCategories(normalized);
    if (!storageOk) return;
    try { await writeStoredValue('categorias', JSON.stringify(normalized)); } catch (e) { showToast('Erro ao guardar categoria.', 'error'); }
  }

  function addCategory(kind, item) {
    const list = customCategories[kind] || [];
    if (kind === 'planTypes') {
      if (list.includes(item) || PLAN_TYPES.includes(item)) return;
      persistCustomCategories({ ...customCategories, planTypes: [...list, item] });
      return;
    }
    if (list.some((entry) => entry.id === item.id || entry.label.toLowerCase() === item.label.toLowerCase())) return;
    persistCustomCategories({ ...customCategories, [kind]: [...list, item] });
  }

  // Nome profissional do treinador. Vive no user_metadata do Supabase: viaja com
  // a sessão e não obriga a tabela nem a migração de schema.
  const trainerName = (user && user.user_metadata && user.user_metadata.nome) || '';

  async function saveTrainerName(nome) {
    if (!supabaseConfigured || !supabase) return 'Supabase não está configurado.';
    const { data, error } = await supabase.auth.updateUser({ data: { nome } });
    if (error) return error.message || 'Não foi possível guardar o nome.';
    if (data?.user) setUser(data.user);
    return '';
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSettingsOpen(false);
    setShowLogin(false);
    clearLoadedData();
  }

  async function uploadPhotos(fileList) {
    const files = Array.from(fileList || []);
    const newPhotos = [];
    for (const file of files) {
      try {
        const dataUri = await resizePhoto(file, 700, 0.72);
        newPhotos.push({ id: uid(), dataUri, createdAt: new Date().toISOString() });
      } catch (e) { showToast('Não foi possível processar uma das fotos.', 'error'); }
    }
    if (newPhotos.length > 0) await persistPhotos([...photos, ...newPhotos]);
    return newPhotos.map((p) => p.id);
  }
  function removePhoto(id) { persistPhotos(photos.filter((p) => p.id !== id)); }
  const photosById = useMemo(() => Object.fromEntries(photos.map((p) => [p.id, p])), [photos]);

  function saveStudent(student) {
    const exists = students.some((s) => s.id === student.id);
    const next = exists ? students.map((s) => (s.id === student.id ? student : s)) : [...students, student];
    persistStudents(next);
    setShowStudentModal(false);
    showToast(exists ? 'Aluno atualizado.' : 'Aluno registado.');
  }
  function deleteStudent(id) {
    persistStudents(students.filter((s) => s.id !== id));
    persistSessions(sessions.filter((s) => s.studentId !== id));
    setShowStudentModal(false);
    showToast('Aluno excluído.');
  }

  // `plano` descreve a repetição a criar: ou { semanas } (o formato antigo), ou
  // { semanas, dias, horas } para gerar vários dias e horas de uma vez.
  // `escopo` só conta ao editar: 'serie' propaga às irmãs, 'uma' fica por aqui.
  function saveSession(session, plano, escopo) {
    const isEvento = session.kind === 'evento';
    const novas = gerarSerie(session, plano);
    if (novas) {
      persistSessions([...sessions, ...novas]);
      showToast(isEvento
        ? `${plural(novas.length, 'evento agendado', 'eventos agendados')}.`
        : `${plural(novas.length, 'aula agendada', 'aulas agendadas')}.`);
      setShowSessionModal(false);
      return;
    }

    const exists = sessions.some((s) => s.id === session.id);
    let next;
    if (exists && escopo === 'serie' && session.seriesId) {
      // Propaga só o que é comum à série. A data e o estado ficam de fora: cada
      // ocorrência tem o seu dia e o seu histórico de presença.
      const comum = {
        kind: session.kind, type: session.type, studentId: session.studentId,
        startTime: session.startTime, endTime: session.endTime, notes: session.notes,
      };
      next = sessions.map((s) => (s.id === session.id
        ? session
        : (s.seriesId === session.seriesId ? { ...s, ...comum } : s)));
    } else {
      next = exists ? sessions.map((s) => (s.id === session.id ? session : s)) : [...sessions, session];
    }
    // Reposição ligada a uma falta: gravar também o sentido inverso na falta.
    if (session.reposicaoDeSessionId) {
      next = next.map((s) => (s.id === session.reposicaoDeSessionId
        ? { ...s, reposicaoSessionId: session.id }
        : s));
    }
    persistSessions(next);
    if (!exists) {
      showToast(isEvento ? 'Evento agendado.' : 'Aula agendada.');
    } else if (escopo === 'serie' && session.seriesId) {
      const total = sessions.filter((s) => s.seriesId === session.seriesId).length;
      showToast(`${plural(total, 'ocorrência atualizada', 'ocorrências atualizadas')}.`);
    } else {
      showToast(isEvento ? 'Evento atualizado.' : 'Aula atualizada.');
    }
    setShowSessionModal(false);
  }

  function deleteSession(id, escopo) {
    const removida = sessions.find((s) => s.id === id);
    const isEvento = removida?.kind === 'evento';
    const serie = escopo === 'serie' && removida?.seriesId ? removida.seriesId : null;
    const remover = new Set(serie
      ? sessions.filter((s) => s.seriesId === serie).map((s) => s.id)
      : [id]);
    // Apagar a reposição devolve a falta ao estado pendente.
    const next = sessions
      .filter((s) => !remover.has(s.id))
      .map((s) => (remover.has(s.reposicaoSessionId) ? { ...s, reposicaoSessionId: null } : s));
    persistSessions(next);
    setShowSessionModal(false);
    if (remover.size > 1) {
      showToast(`${plural(remover.size, 'ocorrência removida', 'ocorrências removidas')}.`);
    } else {
      showToast(isEvento ? 'Evento removido.' : 'Aula removida.');
    }
  }
  function quickStatus(session, status) {
    persistSessions(sessions.map((s) => (s.id === session.id ? { ...s, status } : s)));
    showToast(status === 'falta' ? 'Falta registada.' : 'Aula marcada como realizada.');
  }

  // Trabalho de impressao pendente. Guarda ids, nao o objeto: assim a folha
  // reflete sempre o estado atual das sessoes, mesmo se algo mudar entretanto.
  function printAssessment(assessment) {
    const aluno = students.find((s) => s.id === assessment.studentId);
    if (!aluno) { showToast('Aluno não encontrado.', 'error'); return; }
    setPrintJob({ tipo: 'avaliacao', assessmentId: assessment.id, studentId: aluno.id });
  }

  function saveAssessment(studentId, form) {
    // A avaliação é uma sessão da agenda. Ao editar, só os campos da avaliação
    // mudam: hora, estado, tipo e aluno da sessão ficam como estavam, para não
    // desalinhar a agenda nem os contadores de faltas.
    if (form.id && sessions.some((s) => s.id === form.id)) {
      persistSessions(sessions.map((s) => (s.id === form.id ? { ...s, ...form } : s)));
      showToast('Avaliação atualizada.');
      return;
    }
    const session = {
      ...form,
      id: uid(), studentId, date: form.date, startTime: '08:00', endTime: '08:30',
      type: 'avaliacao', status: 'realizado', notes: '',
    };
    persistSessions([...sessions, session]);
    showToast('Avaliação registada.');
  }
  function deleteAssessment(id) {
    persistSessions(sessions.filter((s) => s.id !== id));
    showToast('Avaliação removida.');
  }
  function goToTreinos(student) {
    setShowStudentModal(false);
    setTreinosStudentId(student.id);
  }

  function criarPrescricao(studentId) {
    const nova = novaPrescricao(studentId);
    persistTreinos((t) => ({ ...t, prescricoes: [...t.prescricoes, nova] }));
    return nova;
  }

  function mudarPrescricao(prescricao) {
    persistTreinos((t) => ({
      ...t,
      prescricoes: t.prescricoes.map((p) => (p.id === prescricao.id ? prescricao : p)),
    }));
  }

  function arquivarPrescricao(id, arquivado) {
    persistTreinos((t) => ({
      ...t,
      prescricoes: t.prescricoes.map((p) => (p.id === id ? { ...p, arquivado } : p)),
    }));
    showToast(arquivado ? 'Programa arquivado.' : 'Programa reativado.');
  }

  // O modelo guarda uma cópia dos treinos, não uma referência. Assim, editar o
  // programa do aluno depois de o guardar não altera o modelo, nem o contrário.
  function guardarComoModelo(prescricao) {
    const modelo = {
      id: uid(),
      nome: prescricao.nome || 'Modelo sem nome',
      objetivo: prescricao.objetivo || '',
      treinos: clonarTreinos(prescricao.treinos),
      criadoEm: new Date().toISOString(),
    };
    persistTreinos((t) => ({ ...t, modelos: [...(t.modelos || []), modelo] }));
    showToast('Guardado na biblioteca de treinos.');
  }

  function criarPrescricaoDeModelo(studentId, modelo) {
    const nova = {
      ...novaPrescricao(studentId),
      nome: modelo.nome,
      objetivo: modelo.objetivo || '',
      treinos: clonarTreinos(modelo.treinos),
    };
    persistTreinos((t) => ({ ...t, prescricoes: [...t.prescricoes, nova] }));
    showToast('Programa criado a partir do modelo.');
    return nova;
  }

  function apagarModelo(id) {
    persistTreinos((t) => ({ ...t, modelos: (t.modelos || []).filter((m) => m.id !== id) }));
    showToast('Modelo removido da biblioteca.');
  }

  function eliminarPrescricao(id) {
    persistTreinos((t) => ({ ...t, prescricoes: t.prescricoes.filter((p) => p.id !== id) }));
    showToast('Programa eliminado.');
  }

  // Devolve o exercicio criado para o chamador o poder acrescentar logo ao treino.
  function criarExercicioBiblioteca(dados) {
    const exercicio = { id: uid(), base: false, instrucoes: '', ...dados };
    persistTreinos((t) => ({ ...t, biblioteca: [...t.biblioteca, exercicio] }));
    return exercicio;
  }

  function editarExercicioBiblioteca(exercicio) {
    persistTreinos((t) => ({
      ...t,
      biblioteca: t.biblioteca.map((e) => (e.id === exercicio.id ? exercicio : e)),
    }));
  }

  // Grupos e categorias novos entram na lista propria do treinador, sem tocar
  // nos de origem. Ignora repetidos para nao encher a lista de duplicados.
  function criarGrupoMuscular(nome) {
    const limpo = String(nome || '').trim();
    if (!limpo) return;
    persistTreinos((t) => (gruposDe(t).includes(limpo)
      ? t
      : { ...t, gruposMusculares: [...(t.gruposMusculares || []), limpo] }));
  }

  function criarCategoriaExercicio(nome) {
    const limpo = String(nome || '').trim();
    if (!limpo) return;
    persistTreinos((t) => (categoriasDe(t).includes(limpo)
      ? t
      : { ...t, categorias: [...(t.categorias || []), limpo] }));
  }

  function apagarExercicioBiblioteca(id) {
    persistTreinos((t) => ({ ...t, biblioteca: t.biblioteca.filter((e) => e.id !== id) }));
    showToast('Exercício removido da biblioteca.');
  }

  // Quantas linhas de treino apontam para este exercicio. Serve para avisar
  // antes de apagar: o treino sobrevive (o nome fica copiado), mas perde as
  // instrucoes, que vivem na biblioteca.
  function usosDoExercicio(exercicioId) {
    return treinos.prescricoes.reduce((total, p) => total
      + (p.treinos || []).reduce((n, t) => n
        + (t.exercicios || []).filter((x) => x.exercicioId === exercicioId).length, 0), 0);
  }

  function printTreino(prescricao) {
    setPrintJob({ tipo: 'treino', prescricaoId: prescricao.id, studentId: prescricao.studentId });
  }

  function goToAssessments(student) {
    setShowStudentModal(false);
    setAssessmentsStudentId(student.id);
    setView('assessments');
  }

  function openNewSession(dateIso) { setSessionModal({ session: null, defaultDate: dateIso }); setShowSessionModal(true); }
  function openEditSession(session) { setSessionModal({ session, defaultDate: null }); setShowSessionModal(true); }

  function saveHorario(diaId, mudanca) {
    persistDefinicoes({
      ...definicoes,
      horarios: { ...definicoes.horarios, [diaId]: { ...definicoes.horarios[diaId], ...mudanca } },
    });
  }

  async function saveLembretes(mudanca) {
    const proximo = { ...definicoes.lembretes, ...mudanca };
    // Pedir a permissao no momento em que se liga a opcao, e nao ao arrancar:
    // um pedido sem contexto e quase sempre recusado.
    if (mudanca.ativos && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        const r = await Notification.requestPermission();
        setPermissaoNotificacoes(r);
      } catch (e) { /* o aviso dentro da app continua a funcionar */ }
    }
    persistDefinicoes({ ...definicoes, lembretes: proximo });
  }

  // Confirma antes de criar: um lote de 40 eventos e dificil de desfazer a mao.
  function libertarSemana(faixas) {
    if (!faixas || faixas.length === 0) return;
    setConfirmLibertar(faixas);
  }

  function confirmarLibertar() {
    const faixas = confirmLibertar || [];
    const novos = faixas.map((f) => ({
      id: uid(), kind: 'evento', studentId: null,
      date: f.date, startTime: f.startTime, endTime: f.endTime,
      type: 'horario_livre', status: 'agendado', notes: '',
    }));
    persistSessions([...sessions, ...novos]);
    setConfirmLibertar(null);
    showToast(`${plural(novos.length, 'horário livre criado', 'horários livres criados')}.`);
  }

  function copySession(session) {
    // Guarda uma copia limpa: sem id, sem serie e sem as ligacoes de reposicao,
    // que pertencem a ocorrencia original e nao devem ser duplicadas.
    const { id, seriesId, reposicaoDeSessionId, reposicaoSessionId, ...limpa } = session;
    setClipboardSession(limpa);
    setShowSessionModal(false);
    showToast(session.kind === 'evento' ? 'Evento copiado. Escolha o dia para colar.' : 'Aula copiada. Escolha o dia para colar.');
  }

  // Colar e arrastar abrem sempre o modal em vez de gravar em silencio: e a
  // caixa de confirmacao onde se pode mudar tudo antes de assumir.
  function pasteSession(dateIso) {
    if (!clipboardSession) return;
    setSessionModal({
      session: { ...clipboardSession, id: uid(), date: dateIso, status: 'agendado' },
      defaultDate: dateIso,
      novaCopia: true,
    });
    setShowSessionModal(true);
  }

  function moveSessionTo(session, dateIso) {
    if (!session || session.date === dateIso) return;
    setSessionModal({ session: { ...session, date: dateIso }, defaultDate: dateIso });
    setShowSessionModal(true);
  }

  // Abre o modal de aula já preparado como reposição de uma falta concreta,
  // para o utilizador não ter de criar a ligação à mão.
  function openReposicaoFor(falta) {
    setSessionModal({ session: null, defaultDate: fmtDateISO(new Date()), reposicaoDe: falta });
    setShowSessionModal(true);
  }

  // Regista uma falta: se já existe aula do aluno nesse dia, marca-a; caso
  // contrário cria uma aula com estado falta, para o histórico ficar coerente.
  function registarFalta(dados) {
    const existente = sessions.find((s) => s.studentId === dados.studentId && s.date === dados.date
      && s.kind !== 'evento' && s.type !== 'reposicao');
    const camposFalta = {
      status: 'falta',
      faltaMotivo: dados.motivo,
      faltaObs: dados.observacoes,
      faltaJustificada: dados.justificada,
      faltaPrecisaReposicao: dados.precisaReposicao,
      reposicaoSessionId: null,
    };
    if (existente) {
      persistSessions(sessions.map((s) => (s.id === existente.id ? { ...s, ...camposFalta } : s)));
    } else {
      const nova = {
        id: uid(), kind: 'aula', studentId: dados.studentId, date: dados.date,
        startTime: '08:00', endTime: '09:00', type: 'fixo', notes: '',
        ...EMPTY_ASSESS_FIELDS, ...camposFalta,
      };
      persistSessions([...sessions, nova]);
    }
    setShowFaltaModal(false);
    showToast('Falta registada.');
  }
  function openNewStudent() { setStudentModal(null); setShowStudentModal(true); }
  function openEditStudent(student) { setStudentModal(student); setShowStudentModal(true); }

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
  function openNewTransaction(type) { setTransactionModal({ tx: null, defaultType: type }); setShowTransactionModal(true); }
  function openEditTransaction(tx) { setTransactionModal({ tx, defaultType: null }); setShowTransactionModal(true); }

  function restoreBackup(importedStudents, importedSessions, importedFinances, importedPhotos, importedCategories) {
    persistStudents(importedStudents);
    persistSessions(importedSessions);
    persistFinances(Array.isArray(importedFinances) ? importedFinances : []);
    persistPhotos(Array.isArray(importedPhotos) ? importedPhotos : []);
    persistCustomCategories({ ...EMPTY_CUSTOM_CATEGORIES, ...(importedCategories || {}) });
    showToast('Backup restaurado.');
    setSettingsOpen(false);
  }

  async function resetAllData() {
    if (!storageOk) {
      setStudents([]); setSessions([]); setFinances([]); setPhotos([]); setCustomCategories(EMPTY_CUSTOM_CATEGORIES); showToast('Dados apagados.'); setSettingsOpen(false); return;
    }
    try {
      await writeStoredValue('alunos', JSON.stringify([]));
      await writeStoredValue('agenda', JSON.stringify([]));
      await writeStoredValue('financas', JSON.stringify([]));
      await writeStoredValue('fotos', JSON.stringify([]));
      await writeStoredValue('categorias', JSON.stringify(EMPTY_CUSTOM_CATEGORIES));
      setStudents([]); setSessions([]); setFinances([]); setPhotos([]); setCustomCategories(EMPTY_CUSTOM_CATEGORIES);
      showToast('Dados apagados.');
    } catch (e) { showToast('Erro ao apagar dados.', 'error'); }
    setSettingsOpen(false);
  }

  if (!authReady || !subscriptionReady || loading) return <LoadingScreen />;
  if (supabaseConfigured && !user) {
    if (showLogin) return <LoginScreen initialMode={loginMode} onBack={() => setShowLogin(false)} />;
    return (
      <LandingPage
        logoSrc={LOGO_SRC}
        plans={SALES_PLANS}
        supportEmail={SUPPORT_EMAIL}
        onGetStarted={() => openLogin('signup')}
        onLogin={() => openLogin('signin')}
      />
    );
  }
  if (supabaseConfigured && !subscriptionActive) return <SalesPlansPage onSignOut={signOut} onRefresh={refreshSubscription} checkoutReturn={checkoutReturn} />;

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <NavTabs view={view} setView={setView} isAdmin={isAdmin} />
      <main className="flex-1 pb-10 pb-nav">
        {/* Os treinos vivem dentro do aluno e nao na barra de navegacao: quando
            ha um aluno escolhido, esta vista toma conta do ecra. */}
        {treinosStudentId && students.some((st) => st.id === treinosStudentId) ? (
          <TreinosView
            student={students.find((st) => st.id === treinosStudentId)}
            treinos={treinos}
            onMudarPrescricao={mudarPrescricao}
            onCriarPrescricao={criarPrescricao}
            onEliminarPrescricao={eliminarPrescricao}
            onCriarExercicio={criarExercicioBiblioteca}
            onEditarExercicio={editarExercicioBiblioteca}
            onApagarExercicio={apagarExercicioBiblioteca}
            onCriarGrupo={criarGrupoMuscular}
            onCriarCategoria={criarCategoriaExercicio}
            onArquivarPrescricao={arquivarPrescricao}
            onGuardarModelo={guardarComoModelo}
            onCriarDeModelo={criarPrescricaoDeModelo}
            onApagarModelo={apagarModelo}
            usosDoExercicio={usosDoExercicio}
            onImprimir={printTreino}
            onVoltar={() => setTreinosStudentId(null)}
          />
        ) : (
        <>
        {view === 'dashboard' && <Dashboard students={students} sessions={sessions} finances={finances} customCategories={customCategories} setView={setView} onAddSession={openNewSession} onOpenSession={openEditSession} onQuickStatus={quickStatus} />}
        {view === 'agenda' && (
          <div className="px-4 pt-4 max-w-6xl mx-auto">
            <div className="flex rounded-lg border border-hair overflow-hidden w-fit">
              {[['weekly', 'Semana'], ['monthly', 'Mês']].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAgendaScale(id)}
                  aria-pressed={agendaScale === id}
                  className="px-4 py-2 text-sm font-body nowrap"
                  style={{
                    backgroundColor: agendaScale === id ? 'var(--bg-elevated)' : 'transparent',
                    color: agendaScale === id ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: agendaScale === id ? 600 : 400,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        {view === 'agenda' && agendaScale === 'weekly' && <WeeklyView sessions={sessions} students={students} weekStart={weekStart} setWeekStart={setWeekStart} onOpenSession={openEditSession} onQuickStatus={quickStatus} onAddSession={openNewSession} onPasteSession={pasteSession} onMoveSession={moveSessionTo} onLibertarSemana={libertarSemana} temCopia={Boolean(clipboardSession)} definicoes={definicoes} customCategories={customCategories} />}
        {view === 'agenda' && agendaScale === 'monthly' && <MonthlyView sessions={sessions} students={students} monthCursor={monthCursor} setMonthCursor={setMonthCursor} onOpenDay={setDayDetailIso} customCategories={customCategories} />}
        {view === 'faltas' && (
          <FaltasView
            students={students}
            sessions={sessions}
            onRegistarFalta={() => setShowFaltaModal(true)}
            onOpenSession={openEditSession}
            onAgendarReposicao={openReposicaoFor}
          />
        )}
        {view === 'admin' && isAdmin && <AdminView />}
        {view === 'students' && <StudentsView students={students} sessions={sessions} onEdit={openEditStudent} onNew={openNewStudent} />}
        {view === 'assessments' && (
          <AssessmentsView students={students} sessions={sessions} photosById={photosById}
            selectedStudentId={assessmentsStudentId} setSelectedStudentId={setAssessmentsStudentId}
            onSaveAssessment={saveAssessment} onUploadPhotos={uploadPhotos} onRemovePhoto={removePhoto} onDeleteAssessment={deleteAssessment}
            onPrintAssessment={printAssessment}
            onNoStudents={() => showToast('Registe um aluno antes de fazer uma avaliação física.', 'error')} />
        )}
        {view === 'finances' && <FinancesView finances={finances} students={students} monthCursor={financeMonthCursor} setMonthCursor={setFinanceMonthCursor} onOpenTransaction={openEditTransaction} onNewTransaction={openNewTransaction} onQuickComplete={quickCompleteTransaction} customCategories={customCategories} />}
        </>
        )}
      </main>
      <DeveloperCredit />

      {confirmLibertar && (
        <ConfirmDialog
          title="Libertar horários da semana"
          message={`Isto cria ${plural(confirmLibertar.length, 'horário livre', 'horários livres')} de uma hora, nos espaços vagos dentro do seu horário de funcionamento. Os horários já ocupados não são tocados.`}
          confirmLabel={`Criar ${confirmLibertar.length}`}
          tone="brass"
          onCancel={() => setConfirmLibertar(null)}
          onConfirm={confirmarLibertar}
        />
      )}

      {lembreteAtivo && (
        <div
          className="fixed bottom-5 toast-pos left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg border font-body flex items-start gap-3 animate-in"
          role="alert"
          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--gold)', color: 'var(--text-primary)', zIndex: 61, maxWidth: '90vw', boxShadow: 'var(--shadow-lg)' }}
        >
          <Bell size={16} className="flex-shrink-0" style={{ color: 'var(--gold)', marginTop: 1 }} />
          <div className="min-w-0">
            <div className="text-sm" style={{ fontWeight: 600 }}>A começar em breve</div>
            <div className="text-xs text-muted">{lembreteAtivo.corpo}</div>
          </div>
          <button onClick={() => setLembreteAtivo(null)} type="button" className="p-1 rounded btn-surface flex-shrink-0" aria-label="Dispensar lembrete">
            <X size={14} className="text-muted" style={{ display: 'block' }} />
          </button>
        </div>
      )}

      <PrintHost job={printJob} onDone={setPrintJob}>
        {printJob?.tipo === 'treino' && (
          <TreinoPrintDoc
            student={students.find((st) => st.id === printJob.studentId)}
            prescricao={treinos.prescricoes.find((pr) => pr.id === printJob.prescricaoId)}
            biblioteca={treinos.biblioteca}
            trainerName={trainerName}
            userEmail={user?.email}
          />
        )}
        {printJob?.tipo === 'avaliacao' && (
          <AssessmentPrintDoc
            student={students.find((s) => s.id === printJob.studentId)}
            assessment={sessions.find((s) => s.id === printJob.assessmentId)}
            historico={sessions.filter((s) => s.studentId === printJob.studentId && s.type === 'avaliacao' && (s.assessWeight || s.assessBodyFat))}
            photosById={photosById}
            trainerName={trainerName}
            userEmail={user?.email}
          />
        )}
      </PrintHost>

      {showSessionModal && (
        <SessionFormModal
          session={sessionModal?.session}
          students={students}
          defaultDate={sessionModal?.defaultDate}
          reposicaoDe={sessionModal?.reposicaoDe}
          customCategories={customCategories}
          definicoes={definicoes}
          novaCopia={Boolean(sessionModal?.novaCopia)}
          serieCount={sessionModal?.session?.seriesId
            ? sessions.filter((s) => s.seriesId === sessionModal.session.seriesId).length
            : 0}
          onAddCategory={addCategory}
          onSave={saveSession}
          onClose={() => setShowSessionModal(false)}
          onDelete={deleteSession}
          onCopy={copySession}
        />
      )}
      {showFaltaModal && (
        <RegistarFaltaModal students={students} sessions={sessions} onSave={registarFalta} onClose={() => setShowFaltaModal(false)} />
      )}
      {showStudentModal && (
        <StudentFormModal student={studentModal} sessions={sessions} customCategories={customCategories} onAddCategory={addCategory} onSave={saveStudent} onClose={() => setShowStudentModal(false)} onDelete={deleteStudent} onGoToAssessments={goToAssessments} onGoToTreinos={goToTreinos} onGoToSession={openEditSession} onAgendarReposicao={openReposicaoFor}
          treinoCount={studentModal ? prescricoesDoAluno(treinos, studentModal.id).length : 0} />
      )}
      {showTransactionModal && (
        <TransactionFormModal tx={transactionModal?.tx} defaultType={transactionModal?.defaultType} customCategories={customCategories} onAddCategory={addCategory} onSave={saveTransaction} onClose={() => setShowTransactionModal(false)} onDelete={deleteTransaction} />
      )}
      {dayDetailIso && (
        <DayDetailModal iso={dayDetailIso} sessions={sessions} students={students} onClose={() => setDayDetailIso(null)} onOpenSession={openEditSession} onQuickStatus={quickStatus} onAddSession={openNewSession} customCategories={customCategories} />
      )}
      {settingsOpen && (
        <SettingsModal
          user={user}
          subscription={subscription}
          students={students}
          sessions={sessions}
          finances={finances}
          photos={photos}
          customCategories={customCategories}
          onClose={() => setSettingsOpen(false)}
          onSignOut={supabaseConfigured ? signOut : null}
          onRefreshSubscription={refreshSubscription}
          onChangePassword={supabaseConfigured && user?.email ? () => setShowChangePassword(true) : null}
          onReset={resetAllData}
          onRestore={restoreBackup}
          trainerName={trainerName}
          onSaveTrainerName={saveTrainerName}
          definicoes={definicoes}
          onSaveHorario={saveHorario}
          onSaveLembretes={saveLembretes}
          permissaoNotificacoes={permissaoNotificacoes}
        />
      )}
      {showChangePassword && user?.email && (
        <ChangePasswordModal
          email={user.email}
          onClose={() => setShowChangePassword(false)}
          onDone={(msg) => showToast(msg)}
        />
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
