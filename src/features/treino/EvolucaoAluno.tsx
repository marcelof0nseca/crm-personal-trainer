// Frequência, cargas e recordes de um aluno. Só leitura, e igual para o treinador
// e para o aluno. Onde não há dados diz-se, em vez de desenhar uma linha falsa.
import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FORMULAS_1RM, adesao, csvDeHistorico, frequencia, historicoPorExercicio, recordes, segundaDaSemana } from './evolucao';

const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const antes = (dias) => { const d = new Date(); d.setDate(d.getDate() - dias); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dm = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '');
const fmt = (v) => (v == null ? '—' : String(v).replace('.', ','));
const CHART = { tick: { fill: 'var(--text-faint)', fontSize: 11 }, grid: 'var(--border-hair)' };

const PERIODOS = [{ id: 30, rotulo: '30 dias' }, { id: 90, rotulo: '3 meses' }, { id: 365, rotulo: '1 ano' }];
const METRICAS = [{ id: 'carga', rotulo: 'Maior carga (kg)' }, { id: 'volume', rotulo: 'Volume (kg)' }, { id: 'e1rm', rotulo: '1RM estimado (kg)' }, { id: 'reps', rotulo: 'Repetições' }];

function descarregar(nome, texto) {
  const url = URL.createObjectURL(new Blob([`﻿${texto}`], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = nome; a.click();
  URL.revokeObjectURL(url);
}

export default function EvolucaoAluno({ sessoes, aulasPorSemana }) {
  const [aba, setAba] = useState('frequencia');
  const [periodo, setPeriodo] = useState(90);
  const [formula, setFormula] = useState('epley');
  const historico = useMemo(() => historicoPorExercicio(sessoes, formula), [sessoes, formula]);
  const [chave, setChave] = useState(null);
  const [metrica, setMetrica] = useState('carga');
  const atual = historico.find((h) => h.chave === chave) || historico[0];
  const recs = useMemo(() => recordes(historico), [historico]);
  const de = antes(periodo - 1); const ate = hojeISO();
  const freq = useMemo(() => frequencia(sessoes, de, ate), [sessoes, de, ate]);
  const ades = useMemo(() => adesao(sessoes, de, ate, aulasPorSemana), [sessoes, de, ate, aulasPorSemana]);

  const semanas = useMemo(() => {
    const lista = [];
    let s = segundaDaSemana(de);
    while (s <= ate) {
      lista.push({ semana: s, n: freq.semanas[s] || 0 });
      const d = new Date(`${s}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 7); s = d.toISOString().slice(0, 10);
    }
    return lista;
  }, [de, ate, freq]);

  if (!sessoes || sessoes.length === 0) {
    return <p className="text-sm font-body text-faint" style={{ margin: 0 }}>Ainda não há sessões registadas. A evolução aparece depois da primeira.</p>;
  }

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div className="flex gap-1.5 flex-wrap" role="tablist">
        {[['frequencia', 'Frequência'], ['cargas', 'Cargas'], ['recordes', 'Recordes']].map(([id, rotulo]) => (
          <button key={id} type="button" role="tab" aria-selected={aba === id} onClick={() => setAba(id)} className={aba === id ? 'btn btn-primary' : 'btn btn-ghost'} style={{ fontSize: 12 }}>{rotulo}</button>
        ))}
      </div>

      {aba === 'frequencia' && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {PERIODOS.map((p) => (
              <button key={p.id} type="button" aria-pressed={periodo === p.id} onClick={() => setPeriodo(p.id)} className={periodo === p.id ? 'btn btn-primary' : 'btn btn-ghost'} style={{ fontSize: 11 }}>{p.rotulo}</button>
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-2" style={{ margin: 0 }}>
            {[['Concluídas', freq.concluidas], ['Parciais', freq.parciais], ['Interrompidas', freq.interrompidas], ['Sem séries feitas', freq.semSeries]].map(([r, v]) => (
              <div key={r} className="rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--bg-inset)' }}>
                <dt className="text-2xs font-body text-faint">{r}</dt>
                <dd className="font-mono text-lg text-primary" style={{ margin: 0 }}>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs font-body text-muted" style={{ margin: 0 }}>
            {ades
              ? `${ades.feitas} sessões feitas de ${ades.planeadas} planeadas (${ades.percentagem}%).`
              : 'Sem frequência semanal no plano, não há comparação com o planeado.'}
          </p>
          <div className="flex flex-col gap-1">
            <span className="text-2xs font-body text-faint">Sessões por semana</span>
            <div className="flex gap-1 flex-wrap" role="list">
              {semanas.map((s) => (
                <span
                  key={s.semana}
                  role="listitem"
                  title={`Semana de ${dm(s.semana)}: ${s.n}`}
                  aria-label={`Semana de ${dm(s.semana)}: ${s.n} sessões`}
                  className="font-mono text-2xs flex items-center justify-center rounded"
                  style={{ width: 24, height: 24, backgroundColor: s.n ? 'var(--brass-soft)' : 'var(--bg-inset)', color: s.n ? 'var(--brass)' : 'var(--text-faint)' }}
                >
                  {s.n}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {aba === 'cargas' && atual && (
        <div className="flex flex-col gap-3 min-w-0">
          <label className="flex flex-col gap-1">
            <span className="text-2xs font-body text-faint">Exercício</span>
            <select value={atual.chave} onChange={(e) => setChave(e.target.value)} className="input-field">
              {historico.map((h) => <option key={h.chave} value={h.chave}>{h.nome}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 min-w-0">
              <span className="text-2xs font-body text-faint">Medida</span>
              <select value={metrica} onChange={(e) => setMetrica(e.target.value)} className="input-field">
                {METRICAS.map((m) => <option key={m.id} value={m.id}>{m.rotulo}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 min-w-0">
              <span className="text-2xs font-body text-faint">Fórmula do 1RM</span>
              <select value={formula} onChange={(e) => setFormula(e.target.value)} className="input-field">
                {Object.entries(FORMULAS_1RM).map(([id, f]) => <option key={id} value={id}>{f.nome}</option>)}
              </select>
            </label>
          </div>
          <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>1RM estimado: {FORMULAS_1RM[formula].texto}, até 12 repetições. É uma estimativa, não uma medição.</p>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={atual.pontos}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis dataKey="data" tickFormatter={dm} tick={CHART.tick} />
                <YAxis tick={CHART.tick} width={36} />
                <Tooltip labelFormatter={dm} contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-hair)', color: 'var(--text-primary)', fontSize: 12 }} />
                <Line type="monotone" dataKey={metrica} stroke="var(--brass)" strokeWidth={2} connectNulls={false} dot name={METRICAS.find((m) => m.id === metrica).rotulo} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-xs font-body" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="text-faint text-left">{['Data', 'Séries', 'Carga', 'Volume', '1RM est.'].map((c) => <th key={c} style={{ padding: '4px 8px 4px 0', fontWeight: 500 }}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {[...atual.pontos].reverse().map((p) => (
                  <tr key={p.sessaoId} className="text-primary font-mono" style={{ borderTop: '1px solid var(--border-hair)' }}>
                    <td style={{ padding: '4px 8px 4px 0' }}>{dm(p.data)}</td><td>{p.series}</td><td>{fmt(p.carga)}</td><td>{fmt(p.volume)}</td><td>{fmt(p.e1rm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => descarregar(`evolucao-${atual.nome}.csv`, csvDeHistorico(atual))} className="btn btn-ghost self-start" style={{ fontSize: 12 }}>Exportar CSV</button>
        </div>
      )}

      {aba === 'recordes' && (
        recs.length === 0
          ? <p className="text-sm font-body text-faint" style={{ margin: 0 }}>Ainda não há séries com carga e repetições registadas.</p>
          : (
            <ul className="flex flex-col gap-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {recs.map((r) => (
                <li key={r.chave} className="rounded-lg px-3 py-2 flex flex-col gap-0.5" style={{ backgroundColor: 'var(--bg-inset)' }}>
                  <span className="text-sm font-body text-primary" style={{ fontWeight: 600 }}>{r.nome}</span>
                  <span className="text-2xs font-body text-muted">
                    {r.carga ? `Carga ${fmt(r.carga.valor)} kg (${dm(r.carga.data)})` : 'Sem carga'}
                    {r.volume ? ` · Volume ${fmt(r.volume.valor)} kg (${dm(r.volume.data)})` : ''}
                    {r.e1rm ? ` · 1RM est. ${fmt(r.e1rm.valor)} kg (${dm(r.e1rm.data)}, ${FORMULAS_1RM[formula].nome})` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )
      )}
    </div>
  );
}
