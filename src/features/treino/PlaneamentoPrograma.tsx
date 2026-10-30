// Estado de publicação, ciclos, treino extra e versões de um programa, no construtor.
import { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { FormField, Modal } from '../../components/UiAtoms';
import { ESTADOS_PROGRAMA, cargaPlaneada, estadoDoPrograma, faseAtual, novaFase, publicarPrograma, reporVersao } from './publicacao';

const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export default function PlaneamentoPrograma({ prescricao, onMudar, gerarId, quem }) {
  const [aberto, setAberto] = useState(false);
  const [publicar, setPublicar] = useState(false);
  const [resumo, setResumo] = useState('');
  const hoje = hojeISO();
  const estado = estadoDoPrograma(prescricao, hoje);
  const fases = prescricao.fases || [];
  const atual = faseAtual(prescricao, hoje);
  const extra = prescricao.extra || null;
  const mudarFase = (id, campos) => onMudar({ ...prescricao, fases: fases.map((f) => (f.id === id ? { ...f, ...campos } : f)) });
  const exemplo = cargaPlaneada('40 kg', { tipo: 'absoluta', valor: 2.5 }, 2);

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="flex flex-col min-w-0">
          <span className="text-sm font-body text-primary" style={{ fontWeight: 600 }}>Estado: {ESTADOS_PROGRAMA[estado].rotulo}</span>
          <span className="text-2xs font-body text-faint">
            {ESTADOS_PROGRAMA[estado].ajuda}{prescricao.versaoNumero ? ` Versão ${prescricao.versaoNumero}.` : ''}
            {atual ? ` Semana ${atual.semana}, ${atual.fase.nome}${atual.fase.deload ? ' (deload)' : ''}.` : ''}
          </span>
        </span>
        <span className="flex gap-2 flex-wrap">
          {estado === 'rascunho'
            ? <button type="button" onClick={() => setPublicar(true)} className="btn btn-primary" style={{ fontSize: 12 }}>Publicar</button>
            : (
              <>
                <button type="button" onClick={() => setPublicar(true)} className="btn btn-ghost" style={{ fontSize: 12 }}>Publicar alterações</button>
                <button type="button" onClick={() => onMudar({ ...prescricao, estadoPublicacao: 'rascunho' })} className="btn btn-ghost" style={{ fontSize: 12 }}>Passar a rascunho</button>
                {estado !== 'concluido' && <button type="button" onClick={() => onMudar({ ...prescricao, estadoPublicacao: 'concluido' })} className="btn btn-ghost" style={{ fontSize: 12 }}>Concluir</button>}
              </>
            )}
        </span>
      </div>

      <button type="button" onClick={() => setAberto((x) => !x)} aria-expanded={aberto} className="text-xs font-body link-sky self-start flex items-center gap-1">
        <ChevronDown size={14} style={{ transform: aberto ? 'rotate(180deg)' : 'none' }} /> Ciclos, treino extra e versões
      </button>

      {aberto && (
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-body text-muted" style={{ margin: 0, fontWeight: 600 }}>Ciclos</h3>
            {fases.length === 0 && <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>Sem ciclos definidos. A semana conta a partir da data de início do programa.</p>}
            {fases.map((f) => (
              <div key={f.id} className="rounded-lg p-3 flex flex-col gap-2" style={{ backgroundColor: 'var(--bg-inset)' }}>
                <div className="grid grid-cols-2 gap-2">
                  <FormField label="Nome"><input value={f.nome} onChange={(e) => mudarFase(f.id, { nome: e.target.value })} className="input-field" /></FormField>
                  <FormField label="Semanas"><input inputMode="numeric" value={f.semanas} onChange={(e) => mudarFase(f.id, { semanas: e.target.value })} className="input-field font-mono" /></FormField>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField label="Progressão de carga">
                    <select value={f.progressao?.tipo || 'manual'} onChange={(e) => mudarFase(f.id, { progressao: { ...f.progressao, tipo: e.target.value } })} className="input-field">
                      <option value="manual">Manual</option>
                      <option value="absoluta">Valor por semana (kg)</option>
                      <option value="percentagem">Percentagem por semana</option>
                    </select>
                  </FormField>
                  <FormField label="Valor">
                    <input inputMode="decimal" disabled={(f.progressao?.tipo || 'manual') === 'manual'} value={f.progressao?.valor || ''} onChange={(e) => mudarFase(f.id, { progressao: { ...f.progressao, valor: e.target.value } })} className="input-field font-mono" />
                  </FormField>
                </div>
                <label className="flex items-center gap-2 text-xs font-body text-primary">
                  <input type="checkbox" checked={Boolean(f.deload)} onChange={(e) => mudarFase(f.id, { deload: e.target.checked })} /> Deload
                </label>
                <FormField label="Notas da fase"><input value={f.notas || ''} onChange={(e) => mudarFase(f.id, { notas: e.target.value })} className="input-field" /></FormField>
                <button type="button" onClick={() => onMudar({ ...prescricao, fases: fases.filter((x) => x.id !== f.id) })} className="btn btn-ghost self-start" style={{ fontSize: 12, color: 'var(--rust)' }}><Trash2 size={13} /> Remover fase</button>
              </div>
            ))}
            <button type="button" onClick={() => onMudar({ ...prescricao, fases: [...fases, novaFase(gerarId, fases.length + 1)] })} className="btn btn-ghost self-start" style={{ fontSize: 12 }}><Plus size={13} /> Acrescentar fase</button>
            <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>A progressão é só uma conta visível: com 2,5 kg por semana, 40 kg ao fim de 2 semanas dá {exemplo}. Nada muda sozinho no treino.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-body text-muted" style={{ margin: 0, fontWeight: 600 }}>Treino extra</h3>
            <label className="flex items-center gap-2 text-sm font-body text-primary">
              <input type="checkbox" checked={Boolean(extra)} onChange={(e) => onMudar({ ...prescricao, extra: e.target.checked ? { validade: '', contaFrequencia: false, instrucoes: '' } : null })} />
              É uma sessão avulsa, fora da rotina principal
            </label>
            {extra && (
              <div className="flex flex-col gap-2">
                <FormField label="Válido até (opcional)"><input type="date" value={extra.validade || ''} onChange={(e) => onMudar({ ...prescricao, extra: { ...extra, validade: e.target.value } })} className="input-field" /></FormField>
                <FormField label="Instruções"><textarea rows={2} value={extra.instrucoes || ''} onChange={(e) => onMudar({ ...prescricao, extra: { ...extra, instrucoes: e.target.value } })} className="input-field" /></FormField>
                <label className="flex items-center gap-2 text-sm font-body text-primary">
                  <input type="checkbox" checked={Boolean(extra.contaFrequencia)} onChange={(e) => onMudar({ ...prescricao, extra: { ...extra, contaFrequencia: e.target.checked } })} /> Conta para a frequência
                </label>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-body text-muted" style={{ margin: 0, fontWeight: 600 }}>Versões anteriores</h3>
            {(prescricao.versoes || []).length === 0 && <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>Cada publicação guarda a anterior. Guardam-se as 5 mais recentes.</p>}
            {[...(prescricao.versoes || [])].reverse().map((v) => (
              <div key={`${v.numero}-${v.em}`} className="flex items-center justify-between gap-2 text-xs font-body text-primary flex-wrap">
                <span className="min-w-0">Versão {v.numero} · {String(v.em).slice(0, 10)}{v.resumo ? ` · ${v.resumo}` : ''}</span>
                <button type="button" onClick={() => onMudar(reporVersao(prescricao, v.numero, { quem, agora: new Date().toISOString() }))} className="btn btn-ghost" style={{ fontSize: 11 }}>Repor</button>
              </div>
            ))}
          </section>
        </div>
      )}

      {publicar && (
        <Modal title="Publicar programa" onClose={() => setPublicar(false)}>
          <div className="flex flex-col gap-3">
            <FormField label="O que mudou (o aluno lê este texto)">
              <textarea rows={3} value={resumo} onChange={(e) => setResumo(e.target.value)} maxLength={300} className="input-field" placeholder="Ex.: Troquei o supino por flexões." />
            </FormField>
            <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>Sessões já feitas não mudam: cada uma guarda a sua própria cópia.</p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setPublicar(false)} className="btn btn-ghost">Cancelar</button>
              <button type="button" onClick={() => { onMudar(publicarPrograma(prescricao, { quem, resumo, agora: new Date().toISOString() })); setPublicar(false); setResumo(''); }} className="btn btn-primary">Publicar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
