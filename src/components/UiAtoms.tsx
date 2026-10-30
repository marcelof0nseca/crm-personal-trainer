// Peças de interface partilhadas entre painel-pt.tsx e src/features, para os
// módulos novos não terem de importar o monólito.
import { useEffect, useRef } from 'react';
import { ArrowLeft, Info, X } from 'lucide-react';

export function FormField({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 min-w-0">
      <span className="text-xs font-body text-muted">{label}</span>
      {children}
    </label>
  );
}

// Resistencia progressiva para la do limite. Puxar a folha para cima nao tem
// para onde ir, e parar a seco le-se como encravado; o que existe no mundo
// abranda antes de parar.
function elastico(excesso, dimensao, constante = 0.55) {
  return (excesso * dimensao * constante) / (dimensao + constante * Math.abs(excesso));
}

// Onde e que um lancamento ia parar sozinho, com a travagem do sistema. E a
// projeccao -- e nao a distancia ja percorrida -- que decide fechar ou voltar:
// um piparote curto e rapido fecha, um arrasto longo e parado volta.
function projetar(velocidade, travagem = 0.998) {
  return (velocidade / 1000) * travagem / (1 - travagem);
}

function deslocamentoY(el) {
  if (!el) return 0;
  const t = getComputedStyle(el).transform;
  if (!t || t === 'none') return 0;
  const n = t.match(/matrix3d\(([^)]+)\)/) ? 13 : 5;
  const v = t.slice(t.indexOf('(') + 1, -1).split(',').map((x) => parseFloat(x));
  return v[n] || 0;
}

// Puxar a folha para baixo fecha-a. So pelo cabecalho: o corpo rola, e disputar
// o mesmo dedo entre rolar e arrastar faz as duas coisas mal.
function useFolhaArrastavel(onFechar) {
  const painelRef = useRef(null);
  const veuRef = useRef(null);
  const gesto = useRef(null);

  function pintar(y, altura) {
    const el = painelRef.current;
    if (!el) return;
    el.style.transform = y ? `translate3d(0, ${y}px, 0)` : '';
    if (veuRef.current) {
      veuRef.current.style.opacity = String(Math.max(0, 1 - (y / (altura || 1)) * 0.9));
    }
  }

  function comecar(e) {
    // So no telemovel: com rato isto e um painel, nao uma folha.
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches) return;
    if (e.button > 0) return;
    // Um botao no cabecalho nao e uma pega.
    if (e.target && e.target.closest && e.target.closest('button')) return;
    const el = painelRef.current;
    if (!el) return;
    // Sai da animacao de entrada e de qualquer transicao a meio: a partir daqui
    // quem manda e o dedo, e uma transicao por cima poe um fotograma de atraso.
    // Comeca do valor que esta no ecra, e nao de zero, para nao dar o salto.
    el.classList.add('a-puxar');
    el.style.transition = 'none';
    if (veuRef.current) veuRef.current.style.transition = 'none';
    gesto.current = {
      id: e.pointerId,
      origem: e.clientY - deslocamentoY(el),
      altura: el.offsetHeight || 400,
      historia: [{ y: e.clientY, t: performance.now() }],
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* sem captura segue na mesma */ }
  }

  function mover(e) {
    const g = gesto.current;
    if (!g || e.pointerId !== g.id) return;
    let dy = e.clientY - g.origem;
    if (dy < 0) dy = -elastico(-dy, g.altura);
    pintar(dy, g.altura);
    g.historia.push({ y: e.clientY, t: performance.now() });
    if (g.historia.length > 6) g.historia.shift();
  }

  function largar(e) {
    const g = gesto.current;
    if (!g || e.pointerId !== g.id) return;
    gesto.current = null;
    const el = painelRef.current;
    if (!el) return;

    // Ler a posição primeiro, e só depois mexer em estilos.
    const y = deslocamentoY(el);

    // Velocidade dos ultimos milissegundos, nao do gesto inteiro: o que conta e
    // para onde a mao ia no instante em que largou.
    const prim = g.historia[0];
    const ult = g.historia[g.historia.length - 1];
    const v = ((ult.y - prim.y) / Math.max(1, ult.t - prim.t)) * 1000;

    el.style.transition = 'transform var(--dur-folha) var(--ease-folha)';
    if (veuRef.current) veuRef.current.style.transition = 'opacity 180ms linear';

    if (y + projetar(v) > g.altura * 0.4) {
      el.style.transform = `translate3d(0, ${g.altura}px, 0)`;
      if (veuRef.current) veuRef.current.style.opacity = '0';
      window.setTimeout(onFechar, 190);
    } else {
      pintar(0, g.altura);
      if (veuRef.current) veuRef.current.style.opacity = '1';
    }
  }

  return { painelRef, veuRef, puxar: { onPointerDown: comecar, onPointerMove: mover, onPointerUp: largar, onPointerCancel: largar } };
}

// `largura` serve os poucos casos que nao cabem na coluna estreita -- a
// pre-visualizacao de uma folha A4, por exemplo. Por omissao nada muda.
export function Modal({ title, onClose, children, onBack, largura, semPadding, acoes, camada }) {
  // Esc fecha o modal — teclado deve conseguir sair sem rato.
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const { painelRef, veuRef, puxar } = useFolhaArrastavel(onClose);

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ zIndex: camada || 40 }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* O véu é irmão da folha e não pai: a opacidade dele acompanha o dedo
          enquanto se puxa, e sendo pai levava a folha atrás no desvanecer. */}
      <div
        ref={veuRef}
        className="absolute inset-0 animate-in"
        style={{ backgroundColor: 'var(--overlay)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />
      <div
        ref={painelRef}
        onClick={(e) => e.stopPropagation()}
        className={`folha relative border border-hair w-full overflow-y-auto folha-corpo ${largura ? '' : 'sm:max-w-md'}`}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
          maxWidth: largura || undefined,
          maxHeight: 'min(92dvh, 760px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: 'var(--shadow-lg)',
          willChange: 'transform',
        }}
      >
        {/* Cabeçalho e pega são a mesma peça: é por aqui que a folha se puxa. */}
        <div
          className="sticky top-0 folha-puxador"
          style={{ backgroundColor: 'var(--bg-surface)', zIndex: 1, borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}
          {...puxar}
        >
          <span className="folha-pega" style={{ marginTop: 8, marginBottom: 2 }} aria-hidden="true" />
          <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-hair">
            <div className="flex items-center gap-2 min-w-0">
              {onBack && <button onClick={onBack} type="button" className="p-1.5 rounded-lg btn-surface flex-shrink-0 tap" aria-label="Voltar"><ArrowLeft size={16} className="text-muted" style={{ display: 'block' }} /></button>}
              <h2 className="font-display font-semibold text-lg text-primary truncate" style={{ letterSpacing: '-0.01em' }}>{title}</h2>
            </div>
            <span className="flex items-center gap-2 flex-shrink-0">
              {acoes}
              <button onClick={onClose} type="button" className="p-1.5 rounded-lg btn-surface flex-shrink-0 tap" aria-label="Fechar">
                <X size={18} className="text-muted" style={{ display: 'block' }} />
              </button>
            </span>
          </div>
        </div>
        <div className={semPadding ? '' : 'p-5'}>{children}</div>
      </div>
    </div>
  );
}

// `confirmLabel` e `tone` sao opcionais e mantem o comportamento antigo por
// omissao: a caixa nasceu para eliminar, mas tambem confirma acoes que criam --
// e ai um botao vermelho a dizer "Eliminar" seria mentira.
export function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Eliminar', cancelLabel = 'Cancelar', tone = 'rust' }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onCancel(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center px-0 sm:px-4 animate-in" style={{ backgroundColor: 'var(--overlay-strong)', backdropFilter: 'blur(3px)', zIndex: 50 }} onClick={onCancel} role="alertdialog" aria-modal="true" aria-label={title}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="dialogo border border-hair w-full sm:max-w-sm p-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
        }}
      >
        <h3 className="font-display font-semibold text-base text-primary mb-2" style={{ letterSpacing: '-0.01em' }}>{title}</h3>
        <p className="text-sm text-muted font-body mb-5" style={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>{message}</p>
        <div className="flex gap-2 justify-end acoes-folha">
          <button onClick={onCancel} type="button" className="btn btn-ghost">{cancelLabel}</button>
          <button onClick={onConfirm} type="button" className="btn" style={{ backgroundColor: `var(--${tone})`, color: 'var(--on-accent)', fontWeight: 600 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ message, cta, onCta, icon: Icon = Info, hint }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <span className="p-3.5 mb-4" style={{ backgroundColor: 'var(--wash)', border: '1px solid var(--border-hair)', borderRadius: 'var(--r-lg)' }}>
        <Icon size={22} className="text-faint" style={{ display: 'block' }} />
      </span>
      <p className="text-sm text-primary font-body max-w-xs font-medium" style={{ lineHeight: 1.5 }}>{message}</p>
      {hint && <p className="text-xs text-faint font-body max-w-sm mt-1.5">{hint}</p>}
      {cta && (
        <button onClick={onCta} type="button" className="btn mt-4" style={{ backgroundColor: 'var(--brass-soft)', borderColor: 'var(--brass)', color: 'var(--brass)' }}>
          {cta}
        </button>
      )}
    </div>
  );
}
