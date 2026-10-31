// Tarefas e regras «quando/então». As regras correm ao abrir esta área, porque não
// há nenhum processo no servidor a vigiar a conta, e isso diz-se no ecrã.
import { useEffect, useRef, useState } from 'react';
import { FormField } from '../../components/UiAtoms';
import { useModulo } from '../useModulo';
import { Abas, Aviso, ProntoOu, Titulo, Vazio, alunosAtuais, dm, hojeISO, nomeDoAluno, uid } from '../comum';
import { ACOES, GATILHOS, correrRegras, vistaDeTarefas } from './logica';
import { estadoDaFatura } from '../planos/logica';

const diasAte = (hoje, d) => Math.round((Date.parse(`${d}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / 86400000);

function factosDe({ sessions, students, planos, hoje }) {
  const nome = (id) => nomeDoAluno(students, id);
  return {
    avaliacao_proxima: sessions.filter((s) => s.type === 'avaliacao' && s.date >= hoje).map((s) => ({ chave: s.id, dias: diasAte(hoje, s.date), nome: nome(s.studentId), studentId: s.studentId, titulo: `Preparar a avaliação de ${nome(s.studentId)}` })),
    credito_a_expirar: sessions.filter((s) => s.status === 'falta' && s.faltaPrecisaReposicao && s.faltaCreditoValidade && !s.reposicaoSessionId && s.faltaCreditoValidade >= hoje).map((s) => ({ chave: s.id, dias: diasAte(hoje, s.faltaCreditoValidade), nome: nome(s.studentId), studentId: s.studentId, titulo: `Crédito de ${nome(s.studentId)} a expirar` })),
    fatura_vencida: (planos.faturas || []).filter((f) => estadoDaFatura(f, hoje) === 'vencida').map((f) => ({ chave: f.id, nome: nome(f.studentId), studentId: f.studentId, titulo: `Fatura vencida de ${nome(f.studentId)}` })),
  };
}

function ListaTarefas({ tarefas, students }) {
  const hoje = hojeISO();
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState(hoje);
  const [alunoId, setAlunoId] = useState('');
  const v = vistaDeTarefas(tarefas.valor.itens, hoje);
  const mudar = (id, campos) => tarefas.gravar((t) => ({ ...t, itens: t.itens.map((x) => (x.id === id ? { ...x, ...campos } : x)) }));
  const secao = (rotulo, lista, cor) => lista.length > 0 && (
    <div className="flex flex-col gap-1">
      <Titulo>{rotulo} ({lista.length})</Titulo>
      {lista.map((t) => (
        <label key={t.id} className="flex items-start gap-2 border-b border-hair py-2">
          <input type="checkbox" checked={Boolean(t.feita)} onChange={(e) => mudar(t.id, { feita: e.target.checked, feitaEm: e.target.checked ? hoje : null })} style={{ marginTop: 3 }} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-body text-primary" style={t.feita ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}>{t.titulo}</span>
            <span className="block text-2xs font-body" style={{ color: cor || 'var(--text-faint)' }}>{t.data ? dm(t.data) : 'Sem data'}{t.studentId ? ` · ${nomeDoAluno(students, t.studentId)}` : ''}{t.origem && t.origem.startsWith('regra:') ? ' · por regra' : ''}</span>
          </span>
        </label>
      ))}
    </div>
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="card p-3 flex flex-col gap-2">
        <FormField label="Nova tarefa"><input value={titulo} maxLength={120} onChange={(e) => setTitulo(e.target.value)} className="input-field" placeholder="Ex.: Ligar à Rita" /></FormField>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="Data"><input type="date" value={data} onChange={(e) => setData(e.target.value)} className="input-field" /></FormField>
          <FormField label="Aluno (opcional)">
            <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)} className="input-field"><option value="">Nenhum</option>{alunosAtuais(students).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          </FormField>
        </div>
        <button type="button" disabled={!titulo.trim()} onClick={() => { tarefas.gravar((t) => ({ ...t, itens: [...t.itens, { id: uid(), titulo: titulo.trim(), data, studentId: alunoId, prioridade: 'normal', origem: 'manual', feita: false, criadaEm: hoje }] })); setTitulo(''); }} className="btn btn-primary" style={{ alignSelf: 'flex-start', opacity: titulo.trim() ? 1 : 0.45 }}>Criar tarefa</button>
      </div>
      {secao('Atrasadas', v.atrasadas, 'var(--gold)')}
      {secao('Hoje', v.hoje)}
      {secao('Próximas', v.proximas)}
      {v.atrasadas.length + v.hoje.length + v.proximas.length === 0 && <Vazio>Sem tarefas por fazer.</Vazio>}
      {secao('Feitas', v.feitas.slice(-15).reverse())}
    </div>
  );
}

function Regras({ automacoes }) {
  const regras = automacoes.valor.regras || [];
  const mudar = (id, c) => automacoes.gravar((a) => ({ ...a, regras: a.regras.map((r) => (r.id === id ? { ...r, ...c } : r)) }));
  return (
    <div className="flex flex-col gap-3">
      <Aviso>As regras correm quando abre esta área. Não há nada a correr em segundo plano no servidor, e por isso nenhuma envia mensagens: criam tarefas para si.</Aviso>
      <button type="button" onClick={() => automacoes.gravar((a) => ({ ...a, regras: [...(a.regras || []), { id: uid(), ativa: true, gatilho: 'avaliacao_proxima', dias: 3, acao: 'criar_tarefa', titulo: '' }] }))} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Nova regra</button>
      {regras.length === 0 && <Vazio>Sem regras.</Vazio>}
      {regras.map((r) => {
        const g = GATILHOS[r.gatilho];
        return (
          <div key={r.id} className="card p-3 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-body text-primary"><input type="checkbox" checked={r.ativa} onChange={(e) => mudar(r.id, { ativa: e.target.checked })} /> Ligada</label>
            <FormField label="Quando">
              <select value={r.gatilho} onChange={(e) => mudar(r.id, { gatilho: e.target.value })} className="input-field">
                {Object.entries(GATILHOS).filter(([id]) => !['aluno_em_risco', 'treino_concluido'].includes(id)).map(([id, x]) => <option key={id} value={id}>{x.rotulo}</option>)}
              </select>
            </FormField>
            {g?.comDias && <FormField label="Dias de antecedência"><input type="number" min="0" value={r.dias ?? 3} onChange={(e) => mudar(r.id, { dias: Number(e.target.value) || 0 })} className="input-field" /></FormField>}
            <FormField label={`Então: ${ACOES.criar_tarefa.toLowerCase()} com o título (opcional)`}><input value={r.titulo || ''} maxLength={120} onChange={(e) => mudar(r.id, { titulo: e.target.value })} className="input-field" placeholder="Ex.: Falar com {nome}" /></FormField>
            <button type="button" onClick={() => automacoes.gravar((a) => ({ ...a, regras: a.regras.filter((x) => x.id !== r.id) }))} className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12 }}>Apagar regra</button>
          </div>
        );
      })}
      {(automacoes.valor.registo || []).length > 0 && (
        <>
          <Titulo>Últimas execuções</Titulo>
          {[...automacoes.valor.registo].reverse().slice(0, 10).map((x) => <p key={x.chave} className="text-xs font-body text-muted" style={{ margin: 0 }}><span className="font-mono">{dm(x.em)}</span> · {(regras.find((r) => r.id === x.regraId)?.titulo) || GATILHOS[regras.find((r) => r.id === x.regraId)?.gatilho]?.rotulo || 'Regra apagada'}</p>)}
        </>
      )}
    </div>
  );
}

export default function Tarefas({ students, sessions, showToast }) {
  const tarefas = useModulo('tarefas');
  const automacoes = useModulo('automacoes');
  const planos = useModulo('planos');
  const [aba, setAba] = useState('tarefas');
  const correu = useRef(false);

  useEffect(() => {
    if (correu.current || tarefas.estado !== 'ok' || automacoes.estado !== 'ok' || planos.estado !== 'ok') return;
    correu.current = true;
    const hoje = hojeISO();
    const r = correrRegras(automacoes.valor.regras, factosDe({ sessions, students, planos: planos.valor, hoje }), { feitos: (automacoes.valor.registo || []).map((x) => x.chave), hoje, gerarId: uid });
    if (r.tarefas.length === 0) return;
    // A ordem importa: o registo primeiro, para uma falha nunca criar a tarefa duas vezes.
    automacoes.gravar((a) => ({ ...a, registo: [...(a.registo || []), ...r.registo].slice(-500) })).then((ok) => {
      if (!ok) return;
      tarefas.gravar((t) => ({ ...t, itens: [...t.itens, ...r.tarefas] }));
      showToast(`${r.tarefas.length} ${r.tarefas.length === 1 ? 'tarefa criada' : 'tarefas criadas'} pelas suas regras.`);
    });
  }, [tarefas.estado, automacoes.estado, planos.estado]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ProntoOu modulos={[tarefas, automacoes, planos]}>{() => (
      <div className="flex flex-col gap-3">
        <Abas valor={aba} onMudar={setAba} abas={[{ id: 'tarefas', rotulo: 'Tarefas' }, { id: 'regras', rotulo: 'Regras' }]} />
        {aba === 'tarefas' ? <ListaTarefas tarefas={tarefas} students={students} /> : <Regras automacoes={automacoes} />}
      </div>
    )}</ProntoOu>
  );
}
