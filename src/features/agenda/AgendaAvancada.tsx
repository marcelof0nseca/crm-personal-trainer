// Agenda avançada: modelos de horário, turmas e lista de espera, locais, regras de
// reserva e exportação. A agenda do dia a dia continua no seu separador.
import { useMemo, useState } from 'react';
import { ConfirmDialog, FormField } from '../../components/UiAtoms';
import { useModulo } from '../useModulo';
import { Abas, Aviso, Grupo, ProntoOu, Titulo, Vazio, alunosAtuais, descarregar, dm, hojeISO, nomeDoAluno, uid } from '../comum';
import {
  POLITICA_OMISSAO, aulasDaTurma, entrarNaLista, excecoesDoModelo, icsDeSessoes, lugaresLivres, promover,
} from './logica';

const DIAS = [[1, 'Seg'], [2, 'Ter'], [3, 'Qua'], [4, 'Qui'], [5, 'Sex'], [6, 'Sáb'], [0, 'Dom']];

function ModelosHorario({ definicoes, onMudarDefinicoes, showToast }) {
  const [f, setF] = useState({ de: hojeISO(), ate: hojeISO(), dias: [], aberto: true, inicio: '08:00', fim: '20:00', nome: '' });
  const [substituir, setSubstituir] = useState(false);
  const existentes = definicoes.excecoes || {};
  const plano = useMemo(() => excecoesDoModelo({ de: f.de, ate: f.ate, dias: f.dias, aberto: f.aberto, intervalos: f.aberto ? [{ inicio: f.inicio, fim: f.fim }] : [] }, existentes, substituir), [f, existentes, substituir]);
  const novas = Object.keys(plano.novas);
  async function aplicar() {
    const carimbadas = Object.fromEntries(novas.map((d) => [d, { ...plano.novas[d], motivo: f.nome || (f.aberto ? 'Horário especial' : 'Fechado') }]));
    await onMudarDefinicoes({ ...definicoes, excecoes: { ...existentes, ...carimbadas } });
    showToast(`Horário aplicado a ${novas.length} ${novas.length === 1 ? 'dia' : 'dias'}.`);
  }
  async function retirar(d) {
    const resto = { ...existentes }; delete resto[d];
    await onMudarDefinicoes({ ...definicoes, excecoes: resto });
  }
  const proximas = Object.keys(existentes).filter((d) => d >= hojeISO()).sort().slice(0, 30);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-body text-muted" style={{ margin: 0 }}>Férias, feriados ou um período com outro horário. Aplica-se sem mexer no horário normal da semana, e não altera aulas já marcadas.</p>
      <FormField label="Nome (opcional)"><input value={f.nome} maxLength={60} onChange={(e) => setF({ ...f, nome: e.target.value })} className="input-field" placeholder="Ex.: Férias de agosto" /></FormField>
      <div className="grid grid-cols-2 gap-2">
        <FormField label="De"><input type="date" value={f.de} onChange={(e) => setF({ ...f, de: e.target.value })} className="input-field" /></FormField>
        <FormField label="Até"><input type="date" value={f.ate} onChange={(e) => setF({ ...f, ate: e.target.value })} className="input-field" /></FormField>
      </div>
      <Grupo rotulo="Dias da semana (nenhum = todos)">
        <div className="flex gap-1 flex-wrap">
          {DIAS.map(([id, r]) => <button key={id} type="button" aria-pressed={f.dias.includes(id)} onClick={() => setF({ ...f, dias: f.dias.includes(id) ? f.dias.filter((x) => x !== id) : [...f.dias, id] })} className="btn btn-ghost" style={{ fontSize: 12, ...(f.dias.includes(id) ? { color: 'var(--brass)', borderColor: 'var(--brass)' } : {}) }}>{r}</button>)}
        </div>
      </Grupo>
      <label className="flex items-center gap-2 text-sm font-body text-primary"><input type="checkbox" checked={f.aberto} onChange={(e) => setF({ ...f, aberto: e.target.checked })} /> Aberto nestes dias</label>
      {f.aberto && (
        <div className="grid grid-cols-2 gap-2">
          <FormField label="Das"><input type="time" value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} className="input-field" /></FormField>
          <FormField label="Às"><input type="time" value={f.fim} onChange={(e) => setF({ ...f, fim: e.target.value })} className="input-field" /></FormField>
        </div>
      )}
      <div className="card p-3 flex flex-col gap-2">
        <p className="text-sm font-body text-primary" style={{ margin: 0 }}>Pré-visualização: {novas.length} {novas.length === 1 ? 'dia' : 'dias'} {f.aberto ? `com ${f.inicio}–${f.fim}` : 'fechados'}.</p>
        {plano.ignoradas.length > 0 && (
          <label className="flex items-center gap-2 text-xs font-body text-muted"><input type="checkbox" checked={substituir} onChange={(e) => setSubstituir(e.target.checked)} /> Substituir {plano.ignoradas.length} {plano.ignoradas.length === 1 ? 'dia que já tem' : 'dias que já têm'} um horário especial</label>
        )}
        <button type="button" onClick={aplicar} disabled={novas.length === 0} className="btn btn-primary" style={{ alignSelf: 'flex-start', opacity: novas.length ? 1 : 0.45 }}>Aplicar</button>
      </div>
      <Titulo>Dias com horário especial</Titulo>
      {proximas.length === 0 ? <Vazio>Nenhum.</Vazio> : proximas.map((d) => (
        <div key={d} className="flex items-center justify-between gap-2 border-b border-hair py-1.5">
          <span className="text-sm font-body text-primary min-w-0"><span className="font-mono">{dm(d)}</span> · {existentes[d].motivo || (existentes[d].aberto ? 'Horário especial' : 'Fechado')}</span>
          <button type="button" onClick={() => retirar(d)} className="btn btn-ghost flex-shrink-0" style={{ fontSize: 12 }}>Retirar</button>
        </div>
      ))}
    </div>
  );
}

function Turmas({ modulo, students, sessions, onMudarSessoes, showToast }) {
  const v = modulo.valor;
  const [dataPorTurma, setDataPorTurma] = useState({});
  const turmas = v.turmas || [];
  const ativos = alunosAtuais(students).filter((s) => s.active !== false);
  const mudar = (id, campos) => modulo.gravar((x) => ({ ...x, turmas: (x.turmas || []).map((t) => (t.id === id ? { ...t, ...campos } : t)) }));
  const nova = () => modulo.gravar((x) => ({ ...x, turmas: [...(x.turmas || []), { id: uid(), nome: 'Turma nova', capacidade: 6, inicio: '18:00', fim: '19:00', localId: '', alunos: [] }] }));

  async function gerar(t) {
    const data = dataPorTurma[t.id];
    if (!data) return;
    const aulas = aulasDaTurma(t, data).filter((a) => !sessions.some((s) => s.id === a.id));
    if (aulas.length === 0) { showToast('Essa aula já estava na agenda.'); return; }
    await onMudarSessoes([...sessions, ...aulas]);
    showToast(`${aulas.length} ${aulas.length === 1 ? 'marcação criada' : 'marcações criadas'} em ${dm(data)}.`);
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2"><p className="text-sm font-body text-muted" style={{ margin: 0 }}>Cada aluno mantém a sua marcação, com falta e reposição próprias.</p><button type="button" onClick={nova} className="btn btn-primary flex-shrink-0">Nova turma</button></div>
      {turmas.length === 0 && <Vazio>Sem turmas.</Vazio>}
      {turmas.map((t) => {
        const livres = lugaresLivres(t);
        const espera = (v.listaEspera || []).filter((x) => x.sessaoId === t.id && x.estado === 'espera').sort((a, b) => String(a.em).localeCompare(String(b.em)));
        const oferta = (v.listaEspera || []).filter((x) => x.sessaoId === t.id && x.estado === 'oferecida');
        return (
          <div key={t.id} className="card p-3 flex flex-col gap-2">
            <FormField label="Nome"><input value={t.nome} maxLength={60} onChange={(e) => mudar(t.id, { nome: e.target.value })} className="input-field" /></FormField>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <FormField label="Das"><input type="time" value={t.inicio} onChange={(e) => mudar(t.id, { inicio: e.target.value })} className="input-field" /></FormField>
              <FormField label="Às"><input type="time" value={t.fim} onChange={(e) => mudar(t.id, { fim: e.target.value })} className="input-field" /></FormField>
              <FormField label="Lugares"><input type="number" min="1" value={t.capacidade} onChange={(e) => mudar(t.id, { capacidade: Number(e.target.value) || 1 })} className="input-field" /></FormField>
              <FormField label="Local">
                <select value={t.localId || ''} onChange={(e) => mudar(t.id, { localId: e.target.value })} className="input-field">
                  <option value="">Sem local</option>
                  {(v.locais || []).map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
              </FormField>
            </div>
            <Grupo rotulo={`Alunos (${(t.alunos || []).length} de ${t.capacidade})`}>
              <div className="flex flex-wrap gap-1">
                {ativos.map((s) => {
                  const dentro = (t.alunos || []).includes(s.id);
                  return <button key={s.id} type="button" aria-pressed={dentro} disabled={!dentro && livres === 0} onClick={() => mudar(t.id, { alunos: dentro ? t.alunos.filter((x) => x !== s.id) : [...(t.alunos || []), s.id] })} className="btn btn-ghost" style={{ fontSize: 12, ...(dentro ? { color: 'var(--brass)', borderColor: 'var(--brass)' } : {}), opacity: !dentro && livres === 0 ? 0.45 : 1 }}>{s.name}</button>;
                })}
              </div>
            </Grupo>
            <div className="flex items-end gap-2 flex-wrap">
              <FormField label="Marcar a aula do dia"><input type="date" value={dataPorTurma[t.id] || ''} onChange={(e) => setDataPorTurma({ ...dataPorTurma, [t.id]: e.target.value })} className="input-field" /></FormField>
              <button type="button" onClick={() => gerar(t)} disabled={!dataPorTurma[t.id] || !(t.alunos || []).length} className="btn btn-ghost" style={{ fontSize: 12, opacity: dataPorTurma[t.id] && (t.alunos || []).length ? 1 : 0.45 }}>Criar na agenda</button>
            </div>
            <Titulo>Lista de espera</Titulo>
            {espera.length === 0 && oferta.length === 0 && <Vazio>Ninguém à espera.</Vazio>}
            {oferta.map((x) => (
              <div key={x.id} className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-body text-primary">{nomeDoAluno(students, x.studentId)} · <span style={{ color: 'var(--gold)' }}>vaga oferecida</span></span>
                <button type="button" disabled={livres === 0} onClick={() => modulo.gravar((m) => ({ ...m, listaEspera: m.listaEspera.filter((i) => i.id !== x.id), turmas: m.turmas.map((i) => (i.id === t.id ? { ...i, alunos: [...i.alunos, x.studentId] } : i)) }))} className="btn btn-ghost" style={{ fontSize: 12, opacity: livres === 0 ? 0.45 : 1 }}>Confirmar na turma</button>
              </div>
            ))}
            {espera.map((x, i) => <p key={x.id} className="text-sm font-body text-muted" style={{ margin: 0 }}>{i + 1}. {nomeDoAluno(students, x.studentId)}</p>)}
            <div className="flex items-center gap-2 flex-wrap">
              <select aria-label="Acrescentar à lista de espera" defaultValue="" onChange={(e) => { const id = e.target.value; e.target.value = ''; if (id) modulo.gravar((m) => ({ ...m, listaEspera: entrarNaLista(m.listaEspera, { sessaoId: t.id, studentId: id, em: new Date().toISOString(), gerarId: uid }) })); }} className="input-field" style={{ flex: '1 1 180px', minWidth: 0 }}>
                <option value="">Acrescentar à lista...</option>
                {ativos.filter((s) => !(t.alunos || []).includes(s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button type="button" disabled={livres === 0 || espera.length === 0} onClick={() => modulo.gravar((m) => ({ ...m, listaEspera: promover(m.listaEspera, t.id, { agora: new Date().toISOString() }).lista }))} className="btn btn-ghost" style={{ fontSize: 12, opacity: livres === 0 || espera.length === 0 ? 0.45 : 1 }}>Oferecer a vaga ao primeiro</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Locais({ modulo }) {
  const [nome, setNome] = useState('');
  const [apagar, setApagar] = useState(null);
  const locais = modulo.valor.locais || [];
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-body text-muted" style={{ margin: 0 }}>Ginásios, salas ou espaços. Com um local escolhido, a marcação avisa quando o espaço já está ocupado; não bloqueia.</p>
      <div className="flex gap-2">
        <input value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} className="input-field" style={{ flex: 1, minWidth: 0 }} placeholder="Ex.: Sala 2" aria-label="Nome do local" />
        <button type="button" disabled={!nome.trim()} onClick={() => { modulo.gravar((m) => ({ ...m, locais: [...(m.locais || []), { id: uid(), nome: nome.trim(), preparacaoMin: 0 }] })); setNome(''); }} className="btn btn-primary flex-shrink-0" style={{ opacity: nome.trim() ? 1 : 0.45 }}>Acrescentar</button>
      </div>
      {locais.length === 0 && <Vazio>Sem locais.</Vazio>}
      {locais.map((l) => (
        <div key={l.id} className="flex items-end gap-2 border-b border-hair pb-2 flex-wrap">
          <div className="flex-1 min-w-0" style={{ flexBasis: 160 }}><FormField label="Nome"><input value={l.nome} maxLength={60} onChange={(e) => modulo.gravar((m) => ({ ...m, locais: m.locais.map((x) => (x.id === l.id ? { ...x, nome: e.target.value } : x)) }))} className="input-field" /></FormField></div>
          <div style={{ width: 130 }}><FormField label="Preparação (min)"><input type="number" min="0" value={l.preparacaoMin || 0} onChange={(e) => modulo.gravar((m) => ({ ...m, locais: m.locais.map((x) => (x.id === l.id ? { ...x, preparacaoMin: Number(e.target.value) || 0 } : x)) }))} className="input-field" /></FormField></div>
          <button type="button" onClick={() => setApagar(l)} className="btn btn-ghost" style={{ fontSize: 12 }}>Apagar</button>
        </div>
      ))}
      {apagar && <ConfirmDialog title="Apagar local" message={`As marcações com «${apagar.nome}» ficam sem local. A marcação em si não se apaga.`} confirmLabel="Apagar" onCancel={() => setApagar(null)} onConfirm={() => { modulo.gravar((m) => ({ ...m, locais: m.locais.filter((x) => x.id !== apagar.id) })); setApagar(null); }} />}
    </div>
  );
}

function Regras({ modulo }) {
  const p = { ...POLITICA_OMISSAO, ...(modulo.valor.politica || {}) };
  const mudar = (campos) => modulo.gravar((m) => ({ ...m, politica: { ...p, ...campos } }));
  const numero = (rotulo, campo, ajuda) => (
    <FormField label={rotulo}><input type="number" min="0" value={p[campo]} onChange={(e) => mudar({ [campo]: Number(e.target.value) || 0 })} className="input-field" aria-describedby={ajuda ? undefined : undefined} /></FormField>
  );
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-start gap-2 text-sm font-body text-primary"><input type="checkbox" checked={p.aceitaPedidos} onChange={(e) => mudar({ aceitaPedidos: e.target.checked })} style={{ marginTop: 3 }} /> <span>Os alunos com conta podem pedir aulas e cancelar pela área deles<span className="block text-xs text-faint">Por omissão fica desligado. Cada pedido chega às Novidades, e é o treinador quem o aprova.</span></span></label>
      <div className="grid grid-cols-2 gap-2">
        {numero('Pedir com pelo menos (horas)', 'antecedenciaMinHoras')}
        {numero('Pedir até (dias à frente)', 'antecedenciaMaxDias')}
        {numero('Cancelar com pelo menos (horas)', 'cancelamentoMinHoras')}
        {numero('Cancelamentos por mês (0 = sem limite)', 'limiteCancelamentosMes')}
      </div>
    </div>
  );
}

function Exportar({ sessions, students }) {
  const [de, setDe] = useState(hojeISO());
  const [ate, setAte] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 60); return d.toISOString().slice(0, 10); });
  const lista = sessions.filter((s) => s.date >= de && s.date <= ate && s.type !== 'horario_livre' && s.type !== 'bloqueado');
  function baixar() {
    const texto = icsDeSessoes(lista, { agora: new Date().toISOString(), nomeDe: (s) => (s.kind === 'evento' ? (s.title || 'Evento') : `Aula: ${nomeDoAluno(students, s.studentId)}`) });
    descarregar('agenda-ptmanager.ics', texto, 'text/calendar;charset=utf-8');
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-body text-muted" style={{ margin: 0 }}>Abre no Google Calendar, Apple ou Outlook. Leva a hora e o nome da aula; nunca avaliações, medidas nem notas.</p>
      <div className="grid grid-cols-2 gap-2">
        <FormField label="De"><input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="input-field" /></FormField>
        <FormField label="Até"><input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="input-field" /></FormField>
      </div>
      <button type="button" onClick={baixar} disabled={lista.length === 0} className="btn btn-primary" style={{ alignSelf: 'flex-start', opacity: lista.length ? 1 : 0.45 }}>Descarregar {lista.length} {lista.length === 1 ? 'marcação' : 'marcações'}</button>
      <Aviso>A sincronização é por ficheiro: uma alteração depois de descarregar não chega ao calendário sem descarregar outra vez. O calendário por ligação do aluno fica na área dele.</Aviso>
    </div>
  );
}

export default function AgendaAvancada({ definicoes, onMudarDefinicoes, students, sessions, onMudarSessoes, showToast }) {
  const modulo = useModulo('recursos');
  const [aba, setAba] = useState('horarios');
  return (
    <div className="flex flex-col gap-3">
      <Abas valor={aba} onMudar={setAba} abas={[{ id: 'horarios', rotulo: 'Modelos de horário' }, { id: 'turmas', rotulo: 'Turmas' }, { id: 'locais', rotulo: 'Locais' }, { id: 'regras', rotulo: 'Regras de reserva' }, { id: 'exportar', rotulo: 'Calendário' }]} />
      {aba === 'horarios' && <ModelosHorario definicoes={definicoes} onMudarDefinicoes={onMudarDefinicoes} showToast={showToast} />}
      {aba === 'exportar' && <Exportar sessions={sessions} students={students} />}
      {['turmas', 'locais', 'regras'].includes(aba) && (
        <ProntoOu modulos={modulo}>{() => (
          <>
            {aba === 'turmas' && <Turmas modulo={modulo} students={students} sessions={sessions} onMudarSessoes={onMudarSessoes} showToast={showToast} />}
            {aba === 'locais' && <Locais modulo={modulo} />}
            {aba === 'regras' && <Regras modulo={modulo} />}
          </>
        )}</ProntoOu>
      )}
    </div>
  );
}
