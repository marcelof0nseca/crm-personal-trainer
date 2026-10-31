// Metas e marcos por aluno. O progresso é uma conta à vista entre o ponto de partida e
// o alvo. Sem linguagem sobre o corpo de ninguém: uma meta é um número e um prazo.
import { useState } from 'react';
import { FormField } from '../../components/UiAtoms';
import { useModulo } from '../useModulo';
import { ProntoOu, Vazio, alunosAtuais, hojeISO, nomeDoAluno, uid } from '../comum';
import { progressoDaMeta } from './logica';

const TIPOS = { frequencia: 'Frequência', desempenho: 'Desempenho', medidas: 'Medidas', mobilidade: 'Mobilidade', habitos: 'Hábitos' };

export default function Metas({ students }) {
  const modulo = useModulo('metas');
  const [alunoId, setAlunoId] = useState('');
  const lista = (modulo.valor.itens || []).filter((m) => !alunoId || m.studentId === alunoId);
  const mudar = (id, c) => modulo.gravar((v) => ({ ...v, itens: v.itens.map((x) => (x.id === id ? { ...x, ...c } : x)) }));
  const nova = () => modulo.gravar((v) => ({ ...v, itens: [...v.itens, { id: uid(), studentId: alunoId, tipo: 'desempenho', titulo: 'Meta nova', unidade: '', base: '', alvo: '', atual: '', prazo: '', comentario: '', visivel: true, marcos: [], criadaEm: hojeISO() }] }));
  return (
    <ProntoOu modulos={modulo}>{() => (
      <div className="flex flex-col gap-3">
        <FormField label="Aluno"><select value={alunoId} onChange={(e) => setAlunoId(e.target.value)} className="input-field"><option value="">Todos</option>{alunosAtuais(students).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></FormField>
        <button type="button" disabled={!alunoId} onClick={nova} className="btn btn-primary" style={{ alignSelf: 'flex-start', opacity: alunoId ? 1 : 0.45 }}>Nova meta</button>
        {!alunoId && <p className="text-xs font-body text-faint" style={{ margin: 0 }}>Escolha um aluno para criar uma meta.</p>}
        {lista.length === 0 && <Vazio>Sem metas.</Vazio>}
        {lista.map((m) => {
          const p = progressoDaMeta(m);
          return (
            <div key={m.id} className="card p-3 flex flex-col gap-2">
              {!alunoId && <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>{nomeDoAluno(students, m.studentId)}</p>}
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Título"><input value={m.titulo} maxLength={80} onChange={(e) => mudar(m.id, { titulo: e.target.value })} className="input-field" /></FormField>
                <FormField label="Tipo"><select value={m.tipo} onChange={(e) => mudar(m.id, { tipo: e.target.value })} className="input-field">{Object.entries(TIPOS).map(([k, r]) => <option key={k} value={k}>{r}</option>)}</select></FormField>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <FormField label="Partida"><input value={m.base} inputMode="decimal" onChange={(e) => mudar(m.id, { base: e.target.value })} className="input-field" /></FormField>
                <FormField label="Alvo"><input value={m.alvo} inputMode="decimal" onChange={(e) => mudar(m.id, { alvo: e.target.value })} className="input-field" /></FormField>
                <FormField label="Atual"><input value={m.atual} inputMode="decimal" onChange={(e) => mudar(m.id, { atual: e.target.value })} className="input-field" /></FormField>
                <FormField label="Unidade"><input value={m.unidade} maxLength={12} onChange={(e) => mudar(m.id, { unidade: e.target.value })} className="input-field" /></FormField>
              </div>
              <p className="text-xs font-body text-muted" style={{ margin: 0 }}>{p === null ? 'Preencha a partida, o alvo e o valor atual para ver o progresso.' : `${p}% do caminho entre a partida e o alvo.`}</p>
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Prazo"><input type="date" value={m.prazo} onChange={(e) => mudar(m.id, { prazo: e.target.value })} className="input-field" /></FormField>
                <FormField label="Marcos (um por linha)"><textarea rows={2} maxLength={400} value={(m.marcos || []).join('\n')} onChange={(e) => mudar(m.id, { marcos: e.target.value.split('\n') })} className="input-field" /></FormField>
              </div>
              <FormField label="Comentário"><textarea rows={2} maxLength={400} value={m.comentario} onChange={(e) => mudar(m.id, { comentario: e.target.value })} className="input-field" /></FormField>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="flex items-center gap-2 text-sm font-body text-primary"><input type="checkbox" checked={m.visivel} onChange={(e) => mudar(m.id, { visivel: e.target.checked })} /> O aluno vê esta meta</label>
                <button type="button" onClick={() => modulo.gravar((v) => ({ ...v, itens: v.itens.filter((x) => x.id !== m.id) }))} className="btn btn-ghost" style={{ fontSize: 12 }}>Apagar</button>
              </div>
            </div>
          );
        })}
      </div>
    )}</ProntoOu>
  );
}
