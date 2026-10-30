// Cronómetro de descanso e de método, comuns ao registo do treinador e do aluno.
// Contam por relógio e não por intervalos somados: com o ecrã bloqueado os
// intervalos param, e ao voltar o tempo certo continua a ser o certo.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, SkipForward, Timer } from 'lucide-react';
import { ORIENTACAO_METODO, mmss, planoDoTemporizador, segundosDePausa } from './temporizador';

function avisar() {
  try { if (navigator.vibrate) navigator.vibrate(200); } catch { /* sem vibração, fica o aviso no ecrã */ }
}

function useContagem(segundos, aoAcabar) {
  const [fimMs, setFimMs] = useState(null);
  const [resto, setResto] = useState(segundos);
  const [agora, setAgora] = useState(0);
  const acabou = useRef(aoAcabar);
  acabou.current = aoAcabar;
  useEffect(() => { setResto(segundos); setFimMs(null); }, [segundos]);
  useEffect(() => {
    if (fimMs === null) return undefined;
    const t = setInterval(() => {
      const r = Math.max(0, Math.ceil((fimMs - Date.now()) / 1000));
      setAgora(r);
      if (r <= 0) { clearInterval(t); setResto(0); setFimMs(null); avisar(); acabou.current?.(); }
    }, 250);
    return () => clearInterval(t);
  }, [fimMs]);
  const aCorrer = fimMs !== null;
  return {
    aCorrer,
    mostrar: aCorrer ? agora || resto : resto,
    iniciar() { setAgora(resto || segundos); setFimMs(Date.now() + (resto || segundos) * 1000); if (!resto) setResto(segundos); },
    pausar() { setResto(Math.max(0, Math.ceil((fimMs - Date.now()) / 1000))); setFimMs(null); },
    repor() { setFimMs(null); setResto(segundos); },
  };
}

export function CronometroDescanso({ descanso }) {
  const segundos = segundosDePausa(descanso);
  const c = useContagem(segundos);
  if (segundos <= 0) return null;
  return (
    <button
      type="button"
      onClick={() => (c.aCorrer ? c.pausar() : c.iniciar())}
      className="btn btn-ghost self-start font-mono"
      style={{ fontSize: 12 }}
      aria-label={c.aCorrer ? 'Pausar descanso' : 'Iniciar descanso'}
    >
      <Timer size={14} /> Descanso {mmss(c.mostrar)}
    </button>
  );
}

export function CronometroMetodo({ metodo, params }) {
  const etapas = useMemo(() => planoDoTemporizador(metodo, params), [metodo, params]);
  const [indice, setIndice] = useState(0);
  const etapa = etapas[Math.min(indice, etapas.length - 1)];
  const ultima = indice >= etapas.length - 1;
  const continuar = useRef(false);
  const c = useContagem(etapa ? etapa.segundos : 0, () => { if (!ultima) { continuar.current = true; setIndice((i) => i + 1); } });
  // Ao acabar uma etapa, a seguinte arranca sozinha; saltar à mão não arranca.
  useEffect(() => {
    if (continuar.current && etapa) { continuar.current = false; c.iniciar(); }
  }, [indice]); // eslint-disable-line react-hooks/exhaustive-deps

  const orientacao = ORIENTACAO_METODO[metodo];
  if (etapas.length === 0) {
    return orientacao ? <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>{orientacao}</p> : null;
  }
  return (
    <div className="rounded-lg px-3 py-2 flex flex-col gap-2" style={{ backgroundColor: 'var(--bg-inset)' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-body text-muted min-w-0">
          {metodo} · {etapa.rotulo} <span className="text-faint">({indice + 1} de {etapas.length})</span>
        </span>
        <span className="font-mono text-lg text-primary" role="timer" aria-live="off">{mmss(c.mostrar)}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => (c.aCorrer ? c.pausar() : c.iniciar())} className="btn btn-ghost" style={{ fontSize: 12 }}>
          {c.aCorrer ? <Pause size={14} /> : <Play size={14} />} {c.aCorrer ? 'Pausar' : 'Iniciar'}
        </button>
        <button type="button" onClick={() => { c.repor(); if (!ultima) setIndice(indice + 1); }} disabled={ultima} className="btn btn-ghost disabled:opacity-40" style={{ fontSize: 12 }}>
          <SkipForward size={14} /> Saltar etapa
        </button>
        <button type="button" onClick={() => { c.repor(); setIndice(0); }} className="btn btn-ghost" style={{ fontSize: 12 }}>
          <RotateCcw size={14} /> Repor
        </button>
      </div>
      <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>O tempo não marca nada como feito: cada série continua a contar só com o ✓.</p>
    </div>
  );
}
