// Contactos antes de serem alunos, importação, grupos e lixeira.
import { useMemo, useState } from 'react';
import { ConfirmDialog, FormField } from '../../components/UiAtoms';
import { useModulo } from '../useModulo';
import { Abas, Aviso, Grupo, ProntoOu, Titulo, Vazio, alunosAtuais, dm, hojeISO, ligacaoWhatsApp, uid } from '../comum';
import { auditar } from '../servidor';
import { CAMPOS_IMPORTACAO, ETAPAS_LEAD, converterLead, juntarLead, lerCsv, mapearColunas, prepararImportacao } from './logica';

const CORES = ['#5DA9E9', '#E9A15D', '#7BC47F', '#C58BE0', '#E06C75', '#56B6C2'];
const corPara = (i) => CORES[i % CORES.length];

function Leads({ crm, students, onMudarAlunos, onAbrirAluno, showToast, quem }) {
  const [etapa, setEtapa] = useState('abertos');
  const [novo, setNovo] = useState({ nome: '', telefone: '', email: '' });
  const [perder, setPerder] = useState(null);
  const leads = crm.valor.leads || [];
  const mudar = (id, c) => crm.gravar((v) => ({ ...v, leads: v.leads.map((l) => (l.id === id ? { ...l, ...c } : l)) }));
  const lista = leads.filter((l) => (etapa === 'abertos' ? !['convertido', 'perdido'].includes(l.etapa) : l.etapa === etapa));
  const fechados = leads.filter((l) => ['convertido', 'perdido'].includes(l.etapa));
  const convertidos = leads.filter((l) => l.etapa === 'convertido').length;

  async function criar() {
    const agora = new Date().toISOString();
    const r = juntarLead(leads, { ...novo, origem: 'manual' }, { gerarId: uid, agora });
    if (await crm.gravar((v) => ({ ...v, leads: r.leads }))) {
      showToast(r.novo ? 'Contacto criado.' : 'Já existia: juntei a este contacto.');
      setNovo({ nome: '', telefone: '', email: '' });
    }
  }
  async function converter(l) {
    const r = converterLead(l, students, { gerarId: uid, cor: corPara(students.length), hoje: hojeISO() });
    if (r.novo && !(await onMudarAlunos([...students, r.aluno]))) return;
    await mudar(l.id, { etapa: 'convertido', alunoId: r.aluno.id, atividades: [...(l.atividades || []), { em: new Date().toISOString(), texto: r.novo ? 'Convertido em aluno' : 'Ligado a um aluno que já existia' }] });
    auditar(quem, 'Contacto convertido em aluno', l.id, { novo: r.novo });
    showToast(r.novo ? `${r.aluno.name} já é aluno.` : `${r.aluno.name} já era aluno: não criei outro.`);
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="card p-3 flex flex-col gap-2">
        <FormField label="Nome"><input value={novo.nome} maxLength={80} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} className="input-field" /></FormField>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="Telefone"><input value={novo.telefone} inputMode="tel" onChange={(e) => setNovo({ ...novo, telefone: e.target.value })} className="input-field" /></FormField>
          <FormField label="Email"><input value={novo.email} inputMode="email" onChange={(e) => setNovo({ ...novo, email: e.target.value })} className="input-field" /></FormField>
        </div>
        <button type="button" disabled={!novo.nome.trim()} onClick={criar} className="btn btn-primary" style={{ alignSelf: 'flex-start', opacity: novo.nome.trim() ? 1 : 0.45 }}>Criar contacto</button>
      </div>
      <FormField label="Mostrar">
        <select value={etapa} onChange={(e) => setEtapa(e.target.value)} className="input-field">
          <option value="abertos">Em aberto ({leads.length - fechados.length})</option>
          {ETAPAS_LEAD.map((x) => <option key={x.id} value={x.id}>{x.rotulo} ({leads.filter((l) => l.etapa === x.id).length})</option>)}
        </select>
      </FormField>
      {fechados.length > 0 && <p className="text-xs font-body text-faint" style={{ margin: 0 }}>Conversão: {Math.round((convertidos / fechados.length) * 100)}% ({convertidos} de {fechados.length} fechados).</p>}
      {lista.length === 0 && <Vazio>Nenhum contacto aqui.</Vazio>}
      {lista.map((l) => (
        <div key={l.id} className="card p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-body text-primary" style={{ fontWeight: 600 }}>{l.nome || 'Sem nome'}</span>
            <span className="text-2xs font-body text-faint">{l.origem}{l.criadoEm ? ` · ${dm(String(l.criadoEm).slice(0, 10))}` : ''}</span>
          </div>
          <p className="text-xs font-body text-muted" style={{ margin: 0 }}>{[l.telefone, l.email].filter(Boolean).join(' · ') || 'Sem contacto'}</p>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Etapa">
              <select value={l.etapa} onChange={(e) => (e.target.value === 'perdido' ? setPerder(l) : mudar(l.id, { etapa: e.target.value }))} className="input-field">
                {ETAPAS_LEAD.filter((x) => x.id !== 'convertido' || l.etapa === 'convertido').map((x) => <option key={x.id} value={x.id}>{x.rotulo}</option>)}
              </select>
            </FormField>
            <FormField label="Próximo contacto"><input type="date" value={l.proximoContacto || ''} onChange={(e) => mudar(l.id, { proximoContacto: e.target.value })} className="input-field" /></FormField>
          </div>
          <FormField label="Notas"><textarea rows={2} maxLength={500} value={l.notas || ''} onChange={(e) => mudar(l.id, { notas: e.target.value })} className="input-field" /></FormField>
          {l.motivoPerda && <p className="text-xs font-body text-faint" style={{ margin: 0 }}>Motivo: {l.motivoPerda}</p>}
          <div className="flex items-center gap-2 flex-wrap">
            {l.etapa !== 'convertido' && <button type="button" onClick={() => converter(l)} className="btn btn-primary" style={{ fontSize: 12 }}>Converter em aluno</button>}
            {l.etapa === 'convertido' && l.alunoId && students.some((s) => s.id === l.alunoId) && <button type="button" onClick={() => onAbrirAluno(students.find((s) => s.id === l.alunoId))} className="btn btn-ghost" style={{ fontSize: 12 }}>Abrir ficha</button>}
            {l.telefone && <a href={ligacaoWhatsApp(l.telefone, `Olá ${l.nome}, `)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: 12 }}>WhatsApp</a>}
          </div>
        </div>
      ))}
      {perder && <MotivoPerda lead={perder} onCancelar={() => setPerder(null)} onConfirmar={(motivo) => { mudar(perder.id, { etapa: 'perdido', motivoPerda: motivo }); setPerder(null); }} />}
    </div>
  );
}

function MotivoPerda({ lead, onCancelar, onConfirmar }) {
  const [motivo, setMotivo] = useState('');
  return (
    <div className="card p-3 flex flex-col gap-2">
      <FormField label={`Porque não avançou ${lead.nome}?`}><input value={motivo} maxLength={120} onChange={(e) => setMotivo(e.target.value)} className="input-field" placeholder="Ex.: preço, horário" /></FormField>
      <div className="flex gap-2"><button type="button" onClick={() => onConfirmar(motivo)} className="btn btn-primary" style={{ fontSize: 12 }}>Marcar como perdido</button><button type="button" onClick={onCancelar} className="btn btn-ghost" style={{ fontSize: 12 }}>Cancelar</button></div>
    </div>
  );
}

function Importar({ students, onMudarAlunos, showToast }) {
  const [csv, setCsv] = useState(null);
  const [mapa, setMapa] = useState({});
  const [feito, setFeito] = useState(null);
  const relatorio = useMemo(() => (csv && mapa.name !== undefined ? prepararImportacao(csv, mapa, students) : null), [csv, mapa, students]);
  async function lerFicheiro(f) {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { showToast('O ficheiro passa de 2 MB.', 'error'); return; }
    const lido = lerCsv(await f.text());
    setCsv(lido); setMapa(mapearColunas(lido.cabecalho)); setFeito(null);
  }
  async function importar() {
    const novos = relatorio.validos.map((v, i) => ({ id: uid(), name: v.name, color: corPara(students.length + i), active: true, memberNumber: '', sex: '', planType: '1x por semana', paymentMode: 'mensal', planValue: v.planValue || 0, biweeklyValue: 0, quinzenasPagas: {}, taxPercent: 0, gymFeeType: 'percent', gymFeeValue: 0, phone: v.phone || '', email: v.email || '', height: '', notes: v.notes || '', startDate: hojeISO(), origem: 'importação' }));
    if (await onMudarAlunos([...students, ...novos])) { setFeito(novos.length); setCsv(null); showToast(`${novos.length} ${novos.length === 1 ? 'aluno importado' : 'alunos importados'}.`); }
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-body text-muted" style={{ margin: 0 }}>Um ficheiro CSV com uma linha por aluno. Nada se grava antes de ver o resultado. Alunos que já existam, pelo email ou telefone, ficam de fora.</p>
      <input type="file" accept=".csv,text/csv" aria-label="Ficheiro CSV" onChange={(e) => lerFicheiro(e.target.files[0])} className="text-sm font-body text-muted" />
      {feito !== null && <p className="text-sm font-body" style={{ margin: 0, color: 'var(--ok)' }}>{feito} importados.</p>}
      {csv && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {CAMPOS_IMPORTACAO.map((c) => (
              <FormField key={c.id} label={`${c.rotulo}${c.obrigatorio ? ' *' : ''}`}>
                <select value={mapa[c.id] ?? ''} onChange={(e) => { const n = { ...mapa }; if (e.target.value === '') delete n[c.id]; else n[c.id] = Number(e.target.value); setMapa(n); }} className="input-field">
                  <option value="">Não importar</option>
                  {csv.cabecalho.map((h, i) => <option key={h + i} value={i}>{h}</option>)}
                </select>
              </FormField>
            ))}
          </div>
          {mapa.name === undefined && <Aviso>Escolha a coluna do nome.</Aviso>}
          {relatorio && (
            <div className="card p-3 flex flex-col gap-2">
              <p className="text-sm font-body text-primary" style={{ margin: 0 }}>{relatorio.validos.length} prontos a entrar, {relatorio.erros.length} de fora.</p>
              {relatorio.erros.slice(0, 20).map((e) => <p key={e.linha} className="text-xs font-body text-muted" style={{ margin: 0 }}>Linha {e.linha}: {e.motivo}</p>)}
              <button type="button" disabled={relatorio.validos.length === 0} onClick={importar} className="btn btn-primary" style={{ alignSelf: 'flex-start', opacity: relatorio.validos.length ? 1 : 0.45 }}>Importar {relatorio.validos.length}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Grupos({ crm, students, onMudarAlunos }) {
  const [nome, setNome] = useState('');
  const grupos = crm.valor.grupos || [];
  const ativos = alunosAtuais(students);
  const etiquetasDe = useMemo(() => [...new Set(ativos.flatMap((s) => s.etiquetas || []))].sort(), [ativos]);
  const [etiqueta, setEtiqueta] = useState('');
  const [alvo, setAlvo] = useState('');
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} className="input-field" style={{ flex: 1, minWidth: 0 }} placeholder="Nome do grupo" aria-label="Nome do grupo" />
        <button type="button" disabled={!nome.trim()} onClick={() => { crm.gravar((v) => ({ ...v, grupos: [...(v.grupos || []), { id: uid(), nome: nome.trim(), alunos: [] }] })); setNome(''); }} className="btn btn-primary flex-shrink-0" style={{ opacity: nome.trim() ? 1 : 0.45 }}>Criar grupo</button>
      </div>
      {grupos.length === 0 && <Vazio>Sem grupos. Servem para os avisos e os desafios.</Vazio>}
      {grupos.map((g) => (
        <div key={g.id} className="card p-3 flex flex-col gap-2">
          <Grupo rotulo={`${g.nome} (${(g.alunos || []).length})`}>
            <div className="flex flex-wrap gap-1">{ativos.map((s) => { const on = (g.alunos || []).includes(s.id); return <button key={s.id} type="button" aria-pressed={on} onClick={() => crm.gravar((v) => ({ ...v, grupos: v.grupos.map((x) => (x.id === g.id ? { ...x, alunos: on ? x.alunos.filter((a) => a !== s.id) : [...(x.alunos || []), s.id] } : x)) }))} className="btn btn-ghost" style={{ fontSize: 12, ...(on ? { color: 'var(--brass)', borderColor: 'var(--brass)' } : {}) }}>{s.name}</button>; })}</div>
          </Grupo>
          <button type="button" onClick={() => crm.gravar((v) => ({ ...v, grupos: v.grupos.filter((x) => x.id !== g.id) }))} className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12 }}>Apagar grupo</button>
        </div>
      ))}
      <Titulo>Etiquetas</Titulo>
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Aluno"><select value={alvo} onChange={(e) => setAlvo(e.target.value)} className="input-field"><option value="">Escolher...</option>{ativos.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></FormField>
        <FormField label="Etiqueta"><input value={etiqueta} maxLength={30} onChange={(e) => setEtiqueta(e.target.value)} className="input-field" /></FormField>
      </div>
      <button type="button" disabled={!alvo || !etiqueta.trim()} onClick={() => { onMudarAlunos(students.map((s) => (s.id === alvo ? { ...s, etiquetas: [...new Set([...(s.etiquetas || []), etiqueta.trim()])] } : s))); setEtiqueta(''); }} className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12, opacity: alvo && etiqueta.trim() ? 1 : 0.45 }}>Acrescentar etiqueta</button>
      {etiquetasDe.map((t) => <p key={t} className="text-xs font-body text-muted" style={{ margin: 0 }}><b>{t}:</b> {ativos.filter((s) => (s.etiquetas || []).includes(t)).map((s) => s.name).join(', ')}</p>)}
    </div>
  );
}

function Lixeira({ students, onMudarAlunos, showToast }) {
  const [aluno, setAluno] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const naLixeira = students.filter((s) => s.naLixeira);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-body text-muted" style={{ margin: 0 }}>Um aluno na lixeira sai da lista de alunos e fica com os dados guardados, pronto a recuperar. Para apagar de vez, como num pedido de apagamento, use «Eliminar aluno» na ficha dele.</p>
      <div className="flex gap-2 flex-wrap">
        <select value={aluno} onChange={(e) => setAluno(e.target.value)} aria-label="Aluno a mover para a lixeira" className="input-field" style={{ flex: '1 1 180px', minWidth: 0 }}><option value="">Escolher aluno...</option>{alunosAtuais(students).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <button type="button" disabled={!aluno} onClick={() => setConfirmar(true)} className="btn btn-ghost" style={{ fontSize: 12, opacity: aluno ? 1 : 0.45 }}>Mover para a lixeira</button>
      </div>
      {naLixeira.length === 0 && <Vazio>A lixeira está vazia.</Vazio>}
      {naLixeira.map((s) => (
        <div key={s.id} className="flex items-center justify-between gap-2 border-b border-hair py-2">
          <span className="text-sm font-body text-primary min-w-0">{s.name} <span className="text-2xs text-faint">desde {dm(s.naLixeiraDesde)}</span></span>
          <button type="button" onClick={() => { const { naLixeira: _a, naLixeiraDesde: _b, ...resto } = s; onMudarAlunos(students.map((x) => (x.id === s.id ? resto : x))); showToast(`${s.name} recuperado.`); }} className="btn btn-ghost flex-shrink-0" style={{ fontSize: 12 }}>Recuperar</button>
        </div>
      ))}
      {confirmar && <ConfirmDialog title="Mover para a lixeira" message="O aluno sai da lista, e os dados dele continuam guardados. Pode recuperá-lo aqui." confirmLabel="Mover" tone="brass" onCancel={() => setConfirmar(false)} onConfirm={() => { onMudarAlunos(students.map((s) => (s.id === aluno ? { ...s, naLixeira: true, naLixeiraDesde: hojeISO() } : s))); setAluno(''); setConfirmar(false); }} />}
    </div>
  );
}

export default function CentralCrm({ students, onMudarAlunos, onAbrirAluno, showToast, quem }) {
  const crm = useModulo('crm');
  const [aba, setAba] = useState('leads');
  return (
    <ProntoOu modulos={crm}>{() => (
      <div className="flex flex-col gap-3">
        <Abas valor={aba} onMudar={setAba} abas={[{ id: 'leads', rotulo: 'Contactos' }, { id: 'importar', rotulo: 'Importar' }, { id: 'grupos', rotulo: 'Grupos e etiquetas' }, { id: 'lixeira', rotulo: 'Lixeira' }]} />
        {aba === 'leads' && <Leads crm={crm} students={students} onMudarAlunos={onMudarAlunos} onAbrirAluno={onAbrirAluno} showToast={showToast} quem={quem} />}
        {aba === 'importar' && <Importar students={students} onMudarAlunos={onMudarAlunos} showToast={showToast} />}
        {aba === 'grupos' && <Grupos crm={crm} students={students} onMudarAlunos={onMudarAlunos} />}
        {aba === 'lixeira' && <Lixeira students={students} onMudarAlunos={onMudarAlunos} showToast={showToast} />}
      </div>
    )}</ProntoOu>
  );
}
