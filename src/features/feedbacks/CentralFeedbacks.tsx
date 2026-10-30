// Os feedbacks de todos os alunos num só sítio. Lê o registo de cada aluno a pedido,
// e cada resposta passa pelo mesmo caminho de corrigir uma sessão.
import { useEffect, useMemo, useState } from 'react';
import { FormField } from '../../components/UiAtoms';
import { temSintomas } from '../../data/sessoes';

const dm = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
const temFeedback = (s) => Boolean(s.feedback && (s.feedback.satisfacao || s.feedback.energia || s.feedback.comentario)) || s.esforco !== '' || temSintomas(s) || s.estado === 'interrompida' || Boolean(s.notas);

export default function CentralFeedbacks({ students, execucoes, onCarregarExecucoes, onCorrigirSessao, onAbrirAluno, quem }) {
  const [alunoId, setAlunoId] = useState('');
  const [filtro, setFiltro] = useState('por-ler');
  const [respostas, setRespostas] = useState({});
  useEffect(() => { students.forEach((s) => onCarregarExecucoes(s.id)); }, [students]); // eslint-disable-line react-hooks/exhaustive-deps

  const aLer = students.filter((s) => !execucoes[s.id] || execucoes[s.id].estado === 'a-carregar').length;
  const comErro = students.filter((s) => execucoes[s.id] && execucoes[s.id].estado === 'erro');

  const lista = useMemo(() => {
    const todos = [];
    students.forEach((st) => {
      (execucoes[st.id]?.sessoes || []).forEach((s) => { if (temFeedback(s)) todos.push({ s, st }); });
    });
    return todos
      .filter(({ s, st }) => {
        if (alunoId && st.id !== alunoId) return false;
        const a = s.acompanhamento || {};
        if (filtro === 'por-ler') return !a.lido && !a.arquivado;
        if (filtro === 'sintomas') return temSintomas(s) && !a.arquivado;
        if (filtro === 'arquivados') return a.arquivado;
        return !a.arquivado;
      })
      .sort((a, b) => String(b.s.data).localeCompare(String(a.s.data)));
  }, [students, execucoes, alunoId, filtro]);

  const mudar = (st, s, campos) => onCorrigirSessao(st.id, { ...s, acompanhamento: { ...(s.acompanhamento || {}), ...campos, em: new Date().toISOString(), quem } });

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <FormField label="Aluno">
          <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)} className="input-field">
            <option value="">Todos</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>
        <FormField label="Mostrar">
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="input-field">
            <option value="por-ler">Por ler</option>
            <option value="sintomas">Com sintomas referidos</option>
            <option value="todos">Todos</option>
            <option value="arquivados">Arquivados</option>
          </select>
        </FormField>
      </div>
      {aLer > 0 && <p className="text-xs font-body text-faint" role="status" style={{ margin: 0 }}>A ler o registo de {aLer} {aLer === 1 ? 'aluno' : 'alunos'}...</p>}
      {comErro.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-body" style={{ margin: 0, color: 'var(--rust)' }}>Não foi possível ler o registo de {comErro.map((s) => s.name).join(', ')}.</p>
          <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => comErro.forEach((s) => onCarregarExecucoes(s.id, true))}>Tentar de novo</button>
        </div>
      )}
      {lista.length === 0 && aLer === 0 && <p className="text-sm font-body text-faint" style={{ margin: 0 }}>Nada para mostrar com estes filtros.</p>}
      {lista.map(({ s, st }) => {
        const a = s.acompanhamento || {};
        const f = s.feedback || {};
        const chave = `${st.id}:${s.id}`;
        return (
          <article key={chave} className="card p-4 flex flex-col gap-2 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <button type="button" onClick={() => onAbrirAluno(st)} className="text-sm font-body text-primary text-left link-sky" style={{ fontWeight: 600 }}>{st.name}</button>
              <span className="text-2xs font-mono text-faint">{dm(s.data)} · {s.treinoNome || 'Treino'}</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {s.estado === 'interrompida' && <span className="badge" style={{ color: 'var(--gold)', backgroundColor: 'var(--gold-soft)' }}>interrompida</span>}
              {temSintomas(s) && <span className="badge" style={{ color: 'var(--gold)', backgroundColor: 'var(--gold-soft)' }}>sintomas referidos</span>}
              {s.esforco !== '' && <span className="badge">esforço {s.esforco}/10</span>}
              {f.satisfacao && <span className="badge">satisfação {f.satisfacao}/5</span>}
              {f.energia && <span className="badge">energia {f.energia}/5</span>}
            </div>
            {f.comentario && <p className="text-sm font-body text-primary" style={{ margin: 0 }}>{f.comentario}</p>}
            {s.notas && <p className="text-xs font-body text-muted" style={{ margin: 0 }}>{s.notas}</p>}
            {s.motivoInterrupcao && <p className="text-xs font-body text-muted" style={{ margin: 0 }}>Motivo: {s.motivoInterrupcao}</p>}
            {temSintomas(s) && (
              <p className="text-xs font-body text-muted" style={{ margin: 0 }}>
                {s.sintomas.durante && `Durante: ${s.sintomas.durante}. `}{s.sintomas.depois && `Depois: ${s.sintomas.depois}. `}
                <span className="text-faint">O que o aluno referiu, não é um diagnóstico.</span>
              </p>
            )}
            {a.resposta && <p className="text-xs font-body text-primary rounded-lg px-3 py-2" style={{ margin: 0, backgroundColor: 'var(--bg-inset)' }}>A sua resposta: {a.resposta}</p>}
            <FormField label="Responder">
              <textarea rows={2} value={respostas[chave] ?? ''} onChange={(e) => setRespostas((r) => ({ ...r, [chave]: e.target.value }))} className="input-field" />
            </FormField>
            <div className="flex gap-2 flex-wrap">
              <button type="button" disabled={!(respostas[chave] || '').trim()} onClick={async () => { if (await mudar(st, s, { resposta: respostas[chave].trim(), lido: true })) setRespostas((r) => ({ ...r, [chave]: '' })); }} className="btn btn-primary disabled:opacity-40" style={{ fontSize: 12 }}>Enviar resposta</button>
              {!a.lido && <button type="button" onClick={() => mudar(st, s, { lido: true })} className="btn btn-ghost" style={{ fontSize: 12 }}>Marcar como lido</button>}
              <button type="button" onClick={() => mudar(st, s, { arquivado: !a.arquivado })} className="btn btn-ghost" style={{ fontSize: 12 }}>{a.arquivado ? 'Desarquivar' : 'Arquivar'}</button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
