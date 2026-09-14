// Componentes reais do painel, extraídos para aqui para poderem ser
// reaproveitados tal como são na landing (src/components/LandingPage.tsx),
// sem criar uma dependência circular com painel-pt.tsx -- que continua a
// importá-los daqui, em vez de os definir localmente.
import { UserX } from 'lucide-react';

const ACCENT_HEX = { brass: '#1EA6B4', rust: '#D6534A', slate: '#8C8C8C', sky: '#5FC4D0' };

function currency(v) { return (Number(v) || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }); }

export function StatCard({ label, value, icon: Icon, accent = 'brass', sub }) {
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

// O cartão de um aluno na lista de Alunos -- círculo de cor própria, plano,
// nº de sócio, estado, faltas pendentes e a barra de composição da receita.
export function StudentCard({ student, finance, pendingFaltasCount = 0, onClick }) {
  return (
    <div onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(); }} className="card card-hover p-4 cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: student.color }} />
          <div className="min-w-0">
            <div className="font-body text-sm font-semibold text-primary truncate">{student.name}</div>
            <div className="text-xs text-faint font-body truncate">{student.planType}{student.memberNumber ? ` · Sócio ${student.memberNumber}` : ''}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {!student.active && <span className="badge" style={{ backgroundColor: 'var(--wash-strong)', color: 'var(--text-faint)' }}>Inativo</span>}
          {pendingFaltasCount > 0 && (
            <span className="badge" style={{ backgroundColor: 'var(--rust-soft)', color: 'var(--rust)' }}>
              <UserX size={10} />{pendingFaltasCount} {pendingFaltasCount > 1 ? 'faltas' : 'falta'}
            </span>
          )}
        </div>
      </div>
      <RevenueLoadBar gross={finance.gross} tax={finance.tax} gymFee={finance.gymFee} net={finance.net} height={16} showLabels={false} />
      <div className="flex items-end justify-between mt-2.5 gap-2">
        <span className="flex flex-col min-w-0">
          <span className="text-2xs uppercase tracking-wide text-faint font-body">Bruto</span>
          <span className="font-mono text-xs text-muted">{currency(finance.gross)}</span>
        </span>
        <span className="flex flex-col items-end min-w-0">
          <span className="text-2xs uppercase tracking-wide text-faint font-body">Líquido</span>
          <span className="font-mono text-sm text-brass font-semibold">{currency(finance.net)}</span>
        </span>
      </div>
    </div>
  );
}

export function RevenueLoadBar({ gross, tax, gymFee, net, height = 32, showLabels = true }) {
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
