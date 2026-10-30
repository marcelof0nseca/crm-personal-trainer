// Editor da avaliação postural: grelha, fio de prumo, marcadores e ângulos sobre a
// fotografia. A imagem original nunca muda: rodar, espelhar e aproximar só alteram a
// forma de a ver. Não reconhece o corpo nem interpreta nada.
import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { FormField } from '../../components/UiAtoms';
import { medirAngulo } from './logica';

const COR = { marcador: 'var(--gold)', angulo: 'var(--sky)', prumo: 'var(--brass)' };

export function vistaVazia() {
  return { fotoId: '', rotacao: 0, espelho: false, zoom: 1, grelha: 0, prumo: null, aspecto: 1, marcadores: [], angulos: [] };
}

export default function PosturalEditor({ vista, url, urlComparar, onMudar, onCarregar, aCarregar, gerarId, soLeitura }) {
  const [modo, setModo] = useState('marcador');
  const [pontos, setPontos] = useState([]);
  const [opacidade, setOpacidade] = useState(50);
  const [coord, setCoord] = useState({ x: '50', y: '50' });
  const caixa = useRef(null);
  const v = vista;

  function acrescentar(p) {
    if (soLeitura) return;
    if (modo === 'marcador') {
      onMudar({ ...v, marcadores: [...v.marcadores, { id: gerarId(), ...p, comentario: '' }] });
    } else {
      setPontos((lista) => [...lista, p]);
    }
  }
  function aoTocar(e) {
    const r = caixa.current.getBoundingClientRect();
    acrescentar({ x: Math.round(((e.clientX - r.left) / r.width) * 1000) / 10, y: Math.round(((e.clientY - r.top) / r.height) * 1000) / 10 });
  }
  function fecharAngulo() {
    const valor = medirAngulo(pontos, v.aspecto);
    if (valor === null) return;
    onMudar({ ...v, angulos: [...v.angulos, { id: gerarId(), pontos, valor, comentario: '' }] });
    setPontos([]);
  }
  const mudarItem = (lista, id, campos) => onMudar({ ...v, [lista]: v[lista].map((x) => (x.id === id ? { ...x, ...campos } : x)) });
  const tirarItem = (lista, id) => onMudar({ ...v, [lista]: v[lista].filter((x) => x.id !== id) });

  if (!url) {
    return (
      <div className="rounded-lg p-4 flex flex-col gap-2" style={{ backgroundColor: 'var(--bg-inset)' }}>
        <p className="text-sm font-body text-muted" style={{ margin: 0 }}>Sem fotografia nesta vista.</p>
        {!soLeitura && (
          <label className="btn btn-ghost self-start" style={{ fontSize: 12 }}>
            {aCarregar ? 'A carregar...' : 'Escolher fotografia'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={aCarregar} onChange={(e) => { onCarregar(e.target.files); e.target.value = ''; }} />
          </label>
        )}
      </div>
    );
  }

  const transforma = `rotate(${v.rotacao}deg) scaleX(${v.espelho ? -1 : 1})`;
  return (
    <div className="flex flex-col gap-3 min-w-0">
      {!soLeitura && (
        <div className="flex gap-1.5 flex-wrap" role="group" aria-label="O que acrescentar ao tocar">
          <button type="button" aria-pressed={modo === 'marcador'} onClick={() => { setModo('marcador'); setPontos([]); }} className={modo === 'marcador' ? 'btn btn-primary' : 'btn btn-ghost'} style={{ fontSize: 12 }}>Marcador</button>
          <button type="button" aria-pressed={modo === 'angulo'} onClick={() => setModo('angulo')} className={modo === 'angulo' ? 'btn btn-primary' : 'btn btn-ghost'} style={{ fontSize: 12 }}>Ângulo</button>
          {modo === 'angulo' && (
            <button type="button" disabled={pontos.length < 2} onClick={fecharAngulo} className="btn btn-ghost disabled:opacity-40" style={{ fontSize: 12 }}>
              Medir com {pontos.length} {pontos.length === 1 ? 'ponto' : 'pontos'}
            </button>
          )}
        </div>
      )}
      <div style={{ overflow: 'auto', maxHeight: '70dvh', borderRadius: 'var(--r-sm)', backgroundColor: 'var(--bg-inset)' }}>
        <div
          ref={caixa}
          onClick={aoTocar}
          data-testid="postural-caixa"
          className="relative"
          style={{ width: `${v.zoom * 100}%`, margin: '0 auto', cursor: soLeitura ? 'default' : 'crosshair', touchAction: 'manipulation', overflow: 'hidden' }}
        >
          <img
            src={url}
            alt="Fotografia da avaliação postural"
            draggable={false}
            onLoad={(e) => { const a = e.target.naturalWidth / e.target.naturalHeight; if (a && Math.abs(a - v.aspecto) > 0.001 && !soLeitura) onMudar({ ...v, aspecto: a }); }}
            style={{ display: 'block', width: '100%', transform: transforma }}
          />
          {urlComparar && <img src={urlComparar} alt="Avaliação anterior, sobreposta" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', opacity: opacidade / 100, pointerEvents: 'none' }} />}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden="true">
            {v.grelha > 0 && Array.from({ length: Math.floor(100 / v.grelha) }, (_, i) => (i + 1) * v.grelha).map((g) => (
              <g key={g} stroke="var(--text-primary)" strokeOpacity="0.35" strokeWidth="0.15">
                <line x1={g} y1="0" x2={g} y2="100" /><line x1="0" y1={g} x2="100" y2={g} />
              </g>
            ))}
            {v.prumo !== null && <line x1={v.prumo} y1="0" x2={v.prumo} y2="100" stroke={COR.prumo} strokeWidth="0.4" />}
            {v.angulos.map((a) => (
              <polyline key={a.id} points={a.pontos.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={COR.angulo} strokeWidth="0.5" />
            ))}
            {pontos.length > 1 && <polyline points={pontos.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={COR.angulo} strokeWidth="0.4" strokeDasharray="1 1" />}
          </svg>
          {[...v.marcadores.map((m, i) => ({ ...m, rotulo: String(i + 1), cor: COR.marcador })), ...pontos.map((p, i) => ({ ...p, id: `p${i}`, rotulo: '', cor: COR.angulo }))].map((m) => (
            <span key={m.id} className="font-mono" style={{ position: 'absolute', left: `${m.x}%`, top: `${m.y}%`, transform: 'translate(-50%,-50%)', width: 18, height: 18, borderRadius: 999, backgroundColor: m.cor, color: 'var(--on-accent)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>{m.rotulo}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <FormField label="Aproximar"><input type="range" min="1" max="3" step="0.25" value={v.zoom} onChange={(e) => onMudar({ ...v, zoom: Number(e.target.value) })} /></FormField>
        <FormField label="Rodar (graus)"><input type="number" min="-45" max="45" step="0.5" value={v.rotacao} disabled={soLeitura} onChange={(e) => onMudar({ ...v, rotacao: Number(e.target.value) || 0 })} className="input-field font-mono" /></FormField>
        <FormField label="Grelha">
          <select value={v.grelha} onChange={(e) => onMudar({ ...v, grelha: Number(e.target.value) })} className="input-field">
            <option value="0">Sem grelha</option><option value="25">Larga</option><option value="10">Média</option><option value="5">Fina</option>
          </select>
        </FormField>
        <FormField label="Fio de prumo (%)">
          <input type="range" min="0" max="100" step="0.5" value={v.prumo ?? 50} onChange={(e) => onMudar({ ...v, prumo: Number(e.target.value) })} />
        </FormField>
      </div>
      <div className="flex gap-3 flex-wrap items-center">
        <label className="flex items-center gap-2 text-xs font-body text-primary"><input type="checkbox" checked={v.espelho} onChange={(e) => onMudar({ ...v, espelho: e.target.checked })} /> Espelhar</label>
        <button type="button" onClick={() => onMudar({ ...v, prumo: null })} className="text-2xs font-body link-sky">Tirar o fio de prumo</button>
      </div>
      {urlComparar && <FormField label="Opacidade da avaliação anterior"><input type="range" min="0" max="100" value={opacidade} onChange={(e) => setOpacidade(Number(e.target.value))} /></FormField>}

      {!soLeitura && (
        <div className="flex items-end gap-2 flex-wrap">
          <FormField label="X (%)"><input inputMode="decimal" value={coord.x} onChange={(e) => setCoord({ ...coord, x: e.target.value })} className="input-field font-mono" style={{ width: 80 }} /></FormField>
          <FormField label="Y (%)"><input inputMode="decimal" value={coord.y} onChange={(e) => setCoord({ ...coord, y: e.target.value })} className="input-field font-mono" style={{ width: 80 }} /></FormField>
          <button type="button" onClick={() => { const x = parseFloat(coord.x); const y = parseFloat(coord.y); if (x >= 0 && x <= 100 && y >= 0 && y <= 100) acrescentar({ x, y }); }} className="btn btn-ghost" style={{ fontSize: 12 }}>Acrescentar ponto</button>
        </div>
      )}

      {v.marcadores.map((m, i) => (
        <div key={m.id} className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-2xs text-faint flex-shrink-0">{i + 1}</span>
          <input value={m.comentario} disabled={soLeitura} onChange={(e) => mudarItem('marcadores', m.id, { comentario: e.target.value })} aria-label={`Comentário do marcador ${i + 1}`} placeholder="O que observou" className="input-field" />
          {!soLeitura && <button type="button" onClick={() => tirarItem('marcadores', m.id)} className="p-2 btn-surface rounded tap flex-shrink-0" aria-label={`Remover marcador ${i + 1}`}><Trash2 size={14} className="text-rust" style={{ display: 'block' }} /></button>}
        </div>
      ))}
      {v.angulos.map((a, i) => (
        <div key={a.id} className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs text-primary flex-shrink-0">{String(a.valor).replace('.', ',')}°</span>
          <input value={a.comentario} disabled={soLeitura} onChange={(e) => mudarItem('angulos', a.id, { comentario: e.target.value })} aria-label={`Comentário do ângulo ${i + 1}`} placeholder="O que mediu" className="input-field" />
          {!soLeitura && <button type="button" onClick={() => tirarItem('angulos', a.id)} className="p-2 btn-surface rounded tap flex-shrink-0" aria-label={`Remover ângulo ${i + 1}`}><Trash2 size={14} className="text-rust" style={{ display: 'block' }} /></button>}
        </div>
      ))}
      <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>Dois pontos medem a inclinação em relação à horizontal; três medem o ângulo no ponto do meio. É uma medida sobre a fotografia, não um diagnóstico.</p>
    </div>
  );
}
