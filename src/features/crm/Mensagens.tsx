// Modelos de mensagem e avisos para a área do aluno. Um aviso aparece a quem abre a
// área dele; nada é enviado por email, SMS ou WhatsApp a partir daqui.
import { useMemo, useState } from 'react';
import { FormField } from '../../components/UiAtoms';
import { useModulo } from '../useModulo';
import { Abas, Aviso, Grupo, ProntoOu, Titulo, Vazio, alunosAtuais, dm, hojeISO, ligacaoWhatsApp, primeiroNome, uid } from '../comum';
import { LISTA_VARIAVEIS, MODELOS_SUGERIDOS, destinatarios, preencherMensagem } from './logica';

const ROTULOS = { retencao: 'Retenção', agenda: 'Agenda', cobranca: 'Cobrança', geral: 'Geral' };

function Modelos({ modulo, students }) {
  const [alunoId, setAlunoId] = useState('');
  const proprios = modulo.valor.modelos || [];
  const aluno = students.find((s) => s.id === alunoId);
  const dados = { primeiroNome: primeiroNome(aluno?.name), nome: aluno?.name, data: dm(hojeISO()), vencimento: dm(hojeISO()) };
  const sugeridos = useMemo(() => Object.entries(MODELOS_SUGERIDOS).flatMap(([contexto, l]) => l.map((x) => ({ ...x, contexto, id: `s:${x.titulo}`, base: true }))), []);
  const mudar = (id, c) => modulo.gravar((m) => ({ ...m, modelos: m.modelos.map((x) => (x.id === id ? { ...x, ...c } : x)) }));
  const cartao = (x) => {
    const texto = preencherMensagem(x.texto, dados);
    return (
      <div key={x.id} className="card p-3 flex flex-col gap-2">
        {x.base ? <p className="text-sm font-body text-primary" style={{ margin: 0, fontWeight: 600 }}>{x.titulo} <span className="text-2xs text-faint" style={{ fontWeight: 400 }}>{ROTULOS[x.contexto]}</span></p>
          : <FormField label="Título"><input value={x.titulo} maxLength={60} onChange={(e) => mudar(x.id, { titulo: e.target.value })} className="input-field" /></FormField>}
        {x.base ? <p className="text-sm font-body text-muted" style={{ margin: 0 }}>{texto}</p>
          : <FormField label="Texto"><textarea rows={3} value={x.texto} maxLength={1000} onChange={(e) => mudar(x.id, { texto: e.target.value })} className="input-field" /></FormField>}
        {!x.base && <p className="text-xs font-body text-muted" style={{ margin: 0 }}>Pré-visualização: {texto}</p>}
        <div className="flex items-center gap-2 flex-wrap">
          {aluno?.phone && <a href={ligacaoWhatsApp(aluno.phone, texto)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: 12 }}>Abrir no WhatsApp</a>}
          <button type="button" onClick={() => navigator.clipboard?.writeText(texto)} className="btn btn-ghost" style={{ fontSize: 12 }}>Copiar</button>
          {x.base ? <button type="button" onClick={() => modulo.gravar((m) => ({ ...m, modelos: [...m.modelos, { id: uid(), titulo: x.titulo, texto: x.texto, contexto: x.contexto }] }))} className="btn btn-ghost" style={{ fontSize: 12 }}>Duplicar e editar</button>
            : <button type="button" onClick={() => modulo.gravar((m) => ({ ...m, modelos: m.modelos.filter((i) => i.id !== x.id) }))} className="btn btn-ghost" style={{ fontSize: 12 }}>Apagar</button>}
        </div>
      </div>
    );
  };
  return (
    <div className="flex flex-col gap-3">
      <FormField label="Pré-visualizar com o aluno">
        <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)} className="input-field"><option value="">Nenhum</option>{alunosAtuais(students).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      </FormField>
      <p className="text-xs font-body text-faint" style={{ margin: 0 }}>Variáveis: {LISTA_VARIAVEIS.map((v) => `{${v}}`).join(', ')}. O que não se souber fica escrito assim, para se notar antes de enviar.</p>
      <button type="button" onClick={() => modulo.gravar((m) => ({ ...m, modelos: [...m.modelos, { id: uid(), titulo: 'Modelo novo', texto: 'Olá {primeiro_nome}, ', contexto: 'geral' }] }))} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Novo modelo</button>
      {proprios.length > 0 && <Titulo>Os seus</Titulo>}
      {proprios.map(cartao)}
      <Titulo>Sugeridos</Titulo>
      {sugeridos.map(cartao)}
    </div>
  );
}

function Campanhas({ modulo, crm, students }) {
  const campanhas = modulo.valor.campanhas || [];
  const grupos = crm.valor.grupos || [];
  const ativos = alunosAtuais(students);
  const mudar = (id, c) => modulo.gravar((m) => ({ ...m, campanhas: m.campanhas.map((x) => (x.id === id ? { ...x, ...c } : x)) }));
  const nova = () => modulo.gravar((m) => ({ ...m, campanhas: [...m.campanhas, { id: uid(), titulo: 'Aviso novo', texto: '', alvo: 'todos', alunos: [], grupoId: '', enviarEm: new Date().toISOString(), recorrencia: 'nenhuma', estado: 'rascunho' }] }));
  return (
    <div className="flex flex-col gap-3">
      <Aviso>O aviso aparece na área do aluno a partir da data escolhida. Só o vê quem tiver acesso à área.{import.meta.env.VITE_VAPID_PUBLIC_KEY ? ' Quem ligou as notificações recebe-o também no telemóvel, fora do horário de silêncio.' : ''}</Aviso>
      <button type="button" onClick={nova} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Novo aviso</button>
      {campanhas.length === 0 && <Vazio>Sem avisos.</Vazio>}
      {campanhas.map((c) => (
        <div key={c.id} className="card p-3 flex flex-col gap-2">
          <FormField label="Título"><input value={c.titulo} maxLength={80} onChange={(e) => mudar(c.id, { titulo: e.target.value })} className="input-field" /></FormField>
          <FormField label="Mensagem"><textarea rows={3} value={c.texto} maxLength={500} onChange={(e) => mudar(c.id, { texto: e.target.value })} className="input-field" /></FormField>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Para">
              <select value={c.alvo} onChange={(e) => mudar(c.id, { alvo: e.target.value })} className="input-field">
                <option value="todos">Todos os ativos</option><option value="grupo">Um grupo</option><option value="alunos">Alunos escolhidos</option>
              </select>
            </FormField>
            <FormField label="Repetir">
              <select value={c.recorrencia} onChange={(e) => mudar(c.id, { recorrencia: e.target.value })} className="input-field">
                <option value="nenhuma">Não repete</option><option value="diaria">Todos os dias</option><option value="semanal">Todas as semanas</option>
              </select>
            </FormField>
          </div>
          {c.alvo === 'grupo' && (
            <FormField label="Grupo"><select value={c.grupoId} onChange={(e) => mudar(c.id, { grupoId: e.target.value })} className="input-field"><option value="">Escolher...</option>{grupos.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}</select></FormField>
          )}
          {c.alvo === 'alunos' && (
            <Grupo rotulo="Alunos">
              <div className="flex flex-wrap gap-1">{ativos.map((s) => { const on = (c.alunos || []).includes(s.id); return <button key={s.id} type="button" aria-pressed={on} onClick={() => mudar(c.id, { alunos: on ? c.alunos.filter((x) => x !== s.id) : [...(c.alunos || []), s.id] })} className="btn btn-ghost" style={{ fontSize: 12, ...(on ? { color: 'var(--brass)', borderColor: 'var(--brass)' } : {}) }}>{s.name}</button>; })}</div>
            </Grupo>
          )}
          <FormField label="A partir de"><input type="datetime-local" value={String(c.enviarEm).slice(0, 16)} onChange={(e) => { if (e.target.value) mudar(c.id, { enviarEm: new Date(e.target.value).toISOString() }); }} className="input-field" /></FormField>
          <p className="text-xs font-body text-muted" style={{ margin: 0 }}>Vai para {destinatarios(c, ativos, grupos).length} {destinatarios(c, ativos, grupos).length === 1 ? 'aluno' : 'alunos'}.</p>
          <div className="flex items-center gap-2 flex-wrap">
            {c.estado !== 'ativa' && <button type="button" disabled={!c.texto.trim() || destinatarios(c, ativos, grupos).length === 0} onClick={() => mudar(c.id, { estado: 'ativa' })} className="btn btn-primary" style={{ fontSize: 12, opacity: c.texto.trim() && destinatarios(c, ativos, grupos).length ? 1 : 0.45 }}>Ativar</button>}
            {c.estado === 'ativa' && <button type="button" onClick={() => mudar(c.id, { estado: 'pausada' })} className="btn btn-ghost" style={{ fontSize: 12 }}>Pausar</button>}
            <button type="button" onClick={() => modulo.gravar((m) => ({ ...m, campanhas: m.campanhas.filter((x) => x.id !== c.id) }))} className="btn btn-ghost" style={{ fontSize: 12 }}>Apagar</button>
            <span className="text-2xs font-body text-faint">{{ rascunho: 'Rascunho', ativa: 'Ativo', pausada: 'Pausado' }[c.estado]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Mensagens({ students }) {
  const modulo = useModulo('mensagens');
  const crm = useModulo('crm');
  const [aba, setAba] = useState('modelos');
  return (
    <ProntoOu modulos={[modulo, crm]}>{() => (
      <div className="flex flex-col gap-3">
        <Abas valor={aba} onMudar={setAba} abas={[{ id: 'modelos', rotulo: 'Modelos' }, { id: 'avisos', rotulo: 'Avisos aos alunos' }]} />
        {aba === 'modelos' ? <Modelos modulo={modulo} students={students} /> : <Campanhas modulo={modulo} crm={crm} students={students} />}
      </div>
    )}</ProntoOu>
  );
}
