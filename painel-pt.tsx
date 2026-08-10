import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard, CalendarDays, CalendarRange, Users, Plus, UserPlus, X, Trash2,
  TrendingUp, AlertTriangle, CheckCircle2, RotateCcw, Shuffle, Repeat, ClipboardCheck,
  Sparkles, UserX, ChevronLeft, ChevronRight, Search, Wallet, Percent, Building2,
  Loader2, Settings, Check, Info, Activity, Ban, Download, Upload,
  Camera, ArrowLeft, LineChart as LineChartIcon, Tag,
  Coffee, Dumbbell, UtensilsCrossed, Stethoscope, Gift, CreditCard, Mail, CircleUser, KeyRound, ShieldCheck,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { supabase, supabaseConfigured } from './src/supabaseClient';
import logoSrc from './src/assets/ptmanager-logo.png';
import LandingPage from './src/components/LandingPage';
import Turnstile from './src/components/Turnstile';

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

function pendingFaltas(studentId, sessions) {
  const faltas = sessions.filter((s) => s.studentId === studentId && s.status === 'falta').length;
  const reposicoes = sessions.filter((s) => s.studentId === studentId && s.type === 'reposicao' && s.status !== 'falta' && s.status !== 'cancelado').length;
  return Math.max(0, faltas - reposicoes);
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

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
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
          <button onClick={onConfirm} type="button" className="btn" style={{ backgroundColor: 'var(--rust)', color: 'var(--on-accent)', fontWeight: 600 }}>Eliminar</button>
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
        {TURNSTILE_SITE_KEY && !isLocked && (
          <Turnstile siteKey={TURNSTILE_SITE_KEY} onVerify={setCaptchaToken} resetSignal={captchaReset} />
        )}
        {isLocked ? (
          <div className="text-xs font-body text-rust">Muitas tentativas de login. Tente novamente em {secondsLeft}s.</div>
        ) : message && <div className="text-xs font-body text-rust">{message}</div>}
        <button type="submit" disabled={busy || isLocked || (Boolean(TURNSTILE_SITE_KEY) && !captchaToken)} className="px-4 py-2.5 rounded-lg text-sm font-body font-medium disabled:opacity-60" style={{ backgroundColor: 'var(--brass)', color: '#0A0A0A' }}>
          {isLocked ? `Aguarde ${secondsLeft}s` : busy ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : 'Entrar'}
        </button>
        <button type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage(''); }} className="text-xs font-body link-sky">
          {mode === 'signup' ? 'Já tenho conta' : 'Criar primeira conta'}
        </button>
      </form>
      </div>
      <DeveloperCredit />
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
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-primary">Escolha seu plano para liberar o painel</h1>
          <p className="text-sm sm:text-base text-muted font-body max-w-2xl">
            Organize alunos, agenda, avaliações físicas, reposições e finanças em um só lugar. O pagamento é processado com segurança pela Stripe.
          </p>
          <div className="text-xs text-muted font-body max-w-2xl">
            Cartão mantém renovação automática. MB WAY libera o período escolhido como pagamento único, com renovação manual no vencimento.
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
                  style={{ backgroundColor: 'rgba(214,83,74,0.14)', borderColor: 'var(--rust)', color: 'var(--rust)' }}
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
            <div className="text-sm font-body font-medium text-primary">Já contrataram seu plano?</div>
            <div className="text-xs text-muted font-body">Atualize após a ativação no Supabase para entrar no painel.</div>
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
}) {
  const [section, setSection] = useState('conta');
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingRestore, setPendingRestore] = useState(null);
  const [restoreError, setRestoreError] = useState('');
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

function AddCategoryInline({ onAdd, placeholder }) {
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
        <Plus size={13} /> Adicionar personalizado
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
function SessionCard({ session, student, onOpen, onQuickStatus, customCategories, compact }) {
  const isEvento = session.kind === 'evento';
  const type = isEvento ? eventTypeFor(session.type, customCategories) : sessionTypeFor(session.type, customCategories);
  const TypeIcon = iconOf(type.icon);
  const isFalta = session.status === 'falta';
  const isCancelado = session.status === 'cancelado';
  const isRealizado = session.status === 'realizado';
  const color = isEvento ? type.color : (student?.color || '#54565D');
  const statusInfo = STATUS_OPTIONS.find((o) => o.id === session.status);

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
      className={`rounded-lg border border-hair pl-3 pr-1.5 py-2.5 cursor-pointer card-hover animate-in ${isCancelado ? 'opacity-50' : ''}`}
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderLeftWidth: '3px',
        borderLeftColor: color,
        // Evento pessoal usa fundo tracejado subtil para se distinguir de uma aula.
        borderStyle: isEvento ? 'dashed solid solid dashed' : 'solid',
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

const NAV_TABS = [
  { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
  { id: 'weekly', label: 'Semana', icon: CalendarDays },
  { id: 'monthly', label: 'Mês', icon: CalendarRange },
  { id: 'students', label: 'Alunos', icon: Users },
  { id: 'assessments', label: 'Avaliações', icon: Activity },
  { id: 'finances', label: 'Finanças', icon: Wallet },
];

// Desktop/tablet: separadores no topo. Telemóvel: barra fixa no fundo, ao alcance
// do polegar, com área de toque de 56px e respeito pela safe-area do iOS.
function NavTabs({ view, setView }) {
  return (
    <>
      <nav className="border-b border-hair sticky top-0 hidden sm:block" style={{ zIndex: 30, backgroundColor: 'var(--bg-surface)' }} aria-label="Navegação principal">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {NAV_TABS.map((t) => {
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
          {NAV_TABS.map((t) => {
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

function DayColumn({ date, sessionsList, onOpenSession, onQuickStatus, onAddSession, students, compact, customCategories }) {
  const iso = fmtDateISO(date);
  const isToday = iso === fmtDateISO(new Date());
  return (
    <div
      className="bg-surface border border-hair rounded-xl p-3 flex flex-col min-w-0"
      style={{ minHeight: '140px', borderColor: isToday ? 'var(--brass)' : 'var(--border-hair)' }}
    >
      <div className="flex items-center justify-between gap-1 mb-2 min-w-0">
        <div className="min-w-0">
          <div className="text-2xs uppercase tracking-wide text-muted font-body nowrap">{compact ? DAY_SHORT[date.getDay()] : DAY_NAMES[date.getDay()]}</div>
          <div className={`font-display font-medium text-lg nowrap ${isToday ? 'text-brass' : 'text-primary'}`}>{fmtDateBR(date)}</div>
        </div>
        <button onClick={() => onAddSession(iso)} type="button" className="p-1.5 rounded-lg btn-surface flex-shrink-0" aria-label="Adicionar">
          <Plus size={16} className="text-muted" style={{ display: 'block' }} />
        </button>
      </div>
      <div className="flex flex-col gap-2 min-w-0">
        {sessionsList.length === 0 && <div className="text-xs text-faint font-body py-3 text-center">Nada agendado</div>}
        {sessionsList.map((s) => {
          const student = students.find((st) => st.id === s.studentId);
          return <SessionCard key={s.id} session={s} student={student} onOpen={() => onOpenSession(s)} onQuickStatus={onQuickStatus} customCategories={customCategories} compact={compact} />;
        })}
      </div>
    </div>
  );
}

function WeeklyView({ sessions, students, weekStart, setWeekStart, onOpenSession, onQuickStatus, onAddSession, customCategories }) {
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
        <DayColumn date={days.find((d) => fmtDateISO(d) === selectedDay) || days[0]} sessionsList={sessionsForDay(selectedDay)} students={students} onOpenSession={onOpenSession} onQuickStatus={onQuickStatus} onAddSession={onAddSession} customCategories={customCategories} />
      </div>

      {/* Largura mínima por coluna: abaixo disso os nomes ficavam ilegíveis.
          Se não couber, a semana desliza na horizontal em vez de esmagar. */}
      <div className="hidden md:block overflow-x-auto pb-1">
        <div className="grid grid-cols-7 gap-3" style={{ minWidth: 980 }}>
          {days.map((d) => {
            const iso = fmtDateISO(d);
            return <DayColumn key={iso} date={d} sessionsList={sessionsForDay(iso)} students={students} onOpenSession={onOpenSession} onQuickStatus={onQuickStatus} onAddSession={onAddSession} compact customCategories={customCategories} />;
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

function StudentFormModal({ student, sessions, customCategories, onAddCategory, onSave, onClose, onDelete, onGoToAssessments }) {
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
          <div className="flex items-center gap-2 text-sm font-body px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(214,83,74,0.12)', color: 'var(--rust)' }}>
            <UserX size={15} /> {pf} {pf > 1 ? 'faltas pendentes' : 'falta pendente'} (agende uma reposição para abater)
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

function SessionFormModal({ session, students, defaultDate, customCategories, onAddCategory, onSave, onClose, onDelete }) {
  const isEdit = !!session;
  const [form, setForm] = useState(() => {
    if (session) return { kind: 'aula', ...session };
    const kind = students.length === 0 ? 'evento' : 'aula';
    return {
      id: uid(), kind, studentId: kind === 'aula' ? (students[0]?.id || '') : null,
      date: defaultDate || fmtDateISO(new Date()), startTime: '08:00', endTime: '09:00',
      type: kind === 'aula' ? 'fixo' : EVENT_TYPES[0].id, status: 'agendado', notes: '',
      ...EMPTY_ASSESS_FIELDS,
    };
  });
  const [repeat, setRepeat] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(8);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

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

  function handleSubmit() {
    if (!isEvento && !form.studentId) { setError('Selecione um aluno.'); return; }
    if (!form.date) { setError('Selecione uma data.'); return; }
    if (form.endTime <= form.startTime) { setError('O horário final deve ser após o início.'); return; }
    setError('');
    onSave(form, repeat && !isEdit ? repeatWeeks : null);
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

            {!isEdit && (isEvento || form.type === 'fixo') && (
              <div className="bg-elevated rounded-lg p-3 border border-hair flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm font-body text-primary">
                  <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} style={{ accentColor: 'var(--brass)' }} />
                  Repetir semanalmente
                </label>
                {repeat && (
                  <FormField label="Por quantas semanas">
                    <input type="number" min="1" max="52" value={repeatWeeks} onChange={(e) => setRepeatWeeks(Math.max(1, parseInt(e.target.value, 10) || 1))} className="input-field" />
                  </FormField>
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

        {error && <div className="text-sm font-body text-rust">{error}</div>}

        <div className="flex gap-2 pt-2 mobile-stack">
          {isEdit && (
            <button onClick={() => setConfirmDelete(true)} type="button" className="px-4 py-2.5 rounded-lg text-sm font-body border border-hair text-rust btn-surface">
              <Trash2 size={15} className="inline mr-1.5" style={{ marginTop: '-2px' }} />Eliminar
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
        <ConfirmDialog title={isEvento ? 'Eliminar evento' : 'Eliminar aula'} message={`Tem a certeza de que pretende eliminar ${isEvento ? 'este evento' : 'esta aula'} da agenda?`} onCancel={() => setConfirmDelete(false)} onConfirm={() => { onDelete(form.id); setConfirmDelete(false); }} />
      )}
    </Modal>
  );
}

/* ============================== AVALIAÇÕES FÍSICAS (nova aba) ============================== */

function NewAssessmentForm({ student, onSave, onCancel, photosById, onUploadPhotos, onRemovePhoto, uploadingPhotos }) {
  const [form, setForm] = useState({ date: fmtDateISO(new Date()), ...EMPTY_ASSESS_FIELDS });
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
        <button type="button" onClick={() => onSave(form)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0A0A0A' }}>Guardar Avaliação</button>
      </div>
    </div>
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

function AssessmentDetail({ student, sessions, photosById, onBack, onSaveAssessment, onUploadPhotos, onRemovePhoto, onDeleteAssessment }) {
  const [showNew, setShowNew] = useState(false);
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

      {!showNew && (
        <button onClick={() => setShowNew(true)} type="button" className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-body font-medium" style={{ backgroundColor: 'var(--brass)', color: '#0A0A0A' }}>
          <Plus size={15} /> Nova Avaliação Física
        </button>
      )}

      {showNew && (
        <div className="bg-surface border border-hair rounded-xl p-4">
          <NewAssessmentForm student={student} onCancel={() => setShowNew(false)} photosById={photosById} uploadingPhotos={uploadingPhotos}
            onUploadPhotos={handleUpload} onRemovePhoto={onRemovePhoto}
            onSave={(form) => { onSaveAssessment(student.id, form); setShowNew(false); }} />
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
                    <button onClick={() => setConfirmDeleteId(a.id)} type="button" className="p-1 rounded btn-surface" aria-label="Eliminar avaliação"><Trash2 size={13} className="text-rust" /></button>
                  </div>
                  <div className="text-sm font-body text-primary">
                    {a.assessWeight ? `${a.assessWeight} kg` : '—'}
                    {a.assessMethod === 'dobras' && foldResult != null ? ` · ${foldResult.toFixed(1)}% gordura` : ''}
                    {a.assessMethod === 'bioimpedancia' && a.assessBodyFat ? ` · ${a.assessBodyFat}% gordura` : ''}
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

function AssessmentsView({ students, sessions, photosById, onSaveAssessment, onUploadPhotos, onRemovePhoto, onDeleteAssessment, onNoStudents, selectedStudentId, setSelectedStudentId }) {
  const selected = students.find((s) => s.id === selectedStudentId);

  if (selected) {
    return <AssessmentDetail student={selected} sessions={sessions} photosById={photosById} onBack={() => setSelectedStudentId(null)}
      onSaveAssessment={onSaveAssessment} onUploadPhotos={onUploadPhotos} onRemovePhoto={onRemovePhoto} onDeleteAssessment={onDeleteAssessment} />;
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
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [financeMonthCursor, setFinanceMonthCursor] = useState(new Date());
  const [assessmentsStudentId, setAssessmentsStudentId] = useState(null);
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

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  async function loadAll() {
    setLoading(true);
    let st = []; let se = []; let fi = []; let ph = []; let cc = EMPTY_CUSTOM_CATEGORIES;
    if (storageOk) {
      try { const r = await readStoredValue('alunos'); if (r && r.value) st = JSON.parse(r.value); } catch (e) { /* sem dados */ }
      try { const r = await readStoredValue('agenda'); if (r && r.value) se = JSON.parse(r.value); } catch (e) { /* sem dados */ }
      try { const r = await readStoredValue('financas'); if (r && r.value) fi = JSON.parse(r.value); } catch (e) { /* sem dados */ }
      try { const r = await readStoredValue('fotos'); if (r && r.value) ph = JSON.parse(r.value); } catch (e) { /* sem dados */ }
      try { const r = await readStoredValue('categorias'); if (r && r.value) cc = JSON.parse(r.value); } catch (e) { /* sem dados */ }
    }
    setStudents(Array.isArray(st) ? st : []);
    setSessions(Array.isArray(se) ? se : []);
    setFinances(Array.isArray(fi) ? fi : []);
    setPhotos(Array.isArray(ph) ? ph : []);
    setCustomCategories({ ...EMPTY_CUSTOM_CATEGORIES, ...(cc || {}) });
    setLoading(false);
  }

  function clearLoadedData() {
    setStudents([]);
    setSessions([]);
    setFinances([]);
    setPhotos([]);
    setCustomCategories(EMPTY_CUSTOM_CATEGORIES);
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

  function saveSession(session, repeatWeeks) {
    const isEvento = session.kind === 'evento';
    if (repeatWeeks && repeatWeeks > 1) {
      const seriesId = uid();
      const base = new Date(`${session.date}T00:00:00`);
      const newOnes = Array.from({ length: repeatWeeks }, (_, i) => ({
        ...session, id: i === 0 ? session.id : uid(), date: fmtDateISO(addDays(base, i * 7)), seriesId,
      }));
      persistSessions([...sessions, ...newOnes]);
      showToast(isEvento ? `${plural(repeatWeeks, 'evento agendado', 'eventos agendados')}.` : `${plural(repeatWeeks, 'aula agendada', 'aulas agendadas')}.`);
    } else {
      const exists = sessions.some((s) => s.id === session.id);
      const next = exists ? sessions.map((s) => (s.id === session.id ? session : s)) : [...sessions, session];
      persistSessions(next);
      showToast(exists ? (isEvento ? 'Evento atualizado.' : 'Aula atualizada.') : (isEvento ? 'Evento agendado.' : 'Aula agendada.'));
    }
    setShowSessionModal(false);
  }
  function deleteSession(id) {
    const isEvento = sessions.find((s) => s.id === id)?.kind === 'evento';
    persistSessions(sessions.filter((s) => s.id !== id));
    setShowSessionModal(false);
    showToast(isEvento ? 'Evento removido.' : 'Aula removida.');
  }
  function quickStatus(session, status) {
    persistSessions(sessions.map((s) => (s.id === session.id ? { ...s, status } : s)));
    showToast(status === 'falta' ? 'Falta registada.' : 'Aula marcada como realizada.');
  }

  function saveNewAssessment(studentId, form) {
    const session = {
      id: uid(), studentId, date: form.date, startTime: '08:00', endTime: '08:30',
      type: 'avaliacao', status: 'realizado', notes: '', ...form,
    };
    persistSessions([...sessions, session]);
    showToast('Avaliação registada.');
  }
  function deleteAssessment(id) {
    persistSessions(sessions.filter((s) => s.id !== id));
    showToast('Avaliação removida.');
  }
  function goToAssessments(student) {
    setShowStudentModal(false);
    setAssessmentsStudentId(student.id);
    setView('assessments');
  }

  function openNewSession(dateIso) { setSessionModal({ session: null, defaultDate: dateIso }); setShowSessionModal(true); }
  function openEditSession(session) { setSessionModal({ session, defaultDate: null }); setShowSessionModal(true); }
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
      <NavTabs view={view} setView={setView} />
      <main className="flex-1 pb-10 pb-nav">
        {view === 'dashboard' && <Dashboard students={students} sessions={sessions} finances={finances} customCategories={customCategories} setView={setView} onAddSession={openNewSession} onOpenSession={openEditSession} onQuickStatus={quickStatus} />}
        {view === 'weekly' && <WeeklyView sessions={sessions} students={students} weekStart={weekStart} setWeekStart={setWeekStart} onOpenSession={openEditSession} onQuickStatus={quickStatus} onAddSession={openNewSession} customCategories={customCategories} />}
        {view === 'monthly' && <MonthlyView sessions={sessions} students={students} monthCursor={monthCursor} setMonthCursor={setMonthCursor} onOpenDay={setDayDetailIso} customCategories={customCategories} />}
        {view === 'students' && <StudentsView students={students} sessions={sessions} onEdit={openEditStudent} onNew={openNewStudent} />}
        {view === 'assessments' && (
          <AssessmentsView students={students} sessions={sessions} photosById={photosById}
            selectedStudentId={assessmentsStudentId} setSelectedStudentId={setAssessmentsStudentId}
            onSaveAssessment={saveNewAssessment} onUploadPhotos={uploadPhotos} onRemovePhoto={removePhoto} onDeleteAssessment={deleteAssessment}
            onNoStudents={() => showToast('Registe um aluno antes de fazer uma avaliação física.', 'error')} />
        )}
        {view === 'finances' && <FinancesView finances={finances} students={students} monthCursor={financeMonthCursor} setMonthCursor={setFinanceMonthCursor} onOpenTransaction={openEditTransaction} onNewTransaction={openNewTransaction} onQuickComplete={quickCompleteTransaction} customCategories={customCategories} />}
      </main>
      <DeveloperCredit />

      {showSessionModal && (
        <SessionFormModal session={sessionModal?.session} students={students} defaultDate={sessionModal?.defaultDate} customCategories={customCategories} onAddCategory={addCategory} onSave={saveSession} onClose={() => setShowSessionModal(false)} onDelete={deleteSession} />
      )}
      {showStudentModal && (
        <StudentFormModal student={studentModal} sessions={sessions} customCategories={customCategories} onAddCategory={addCategory} onSave={saveStudent} onClose={() => setShowStudentModal(false)} onDelete={deleteStudent} onGoToAssessments={goToAssessments} />
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
