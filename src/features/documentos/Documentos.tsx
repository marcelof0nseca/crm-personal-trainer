// Documentos do aluno e formulários enviados para ele preencher na área dele.
import { useRef, useState } from 'react';
import { ConfirmDialog, FormField } from '../../components/UiAtoms';
import { useModulo } from '../useModulo';
import { Abas, Aviso, ProntoOu, Titulo, Vazio, alunosAtuais, dm, hojeISO, nomeDoAluno, uid } from '../comum';
import { apagarDocumentos, carregarDocumento, temServidor, urlDeDocumento } from '../servidor';

function Ficheiros({ modulo, students, quem, showToast }) {
  const [alunoId, setAlunoId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [visivel, setVisivel] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const [apagar, setApagar] = useState(null);
  const ficheiro = useRef(null);
  const itens = modulo.valor.itens.filter((d) => !alunoId || d.studentId === alunoId);

  async function enviar() {
    const f = ficheiro.current?.files?.[0];
    if (!f || !alunoId) return;
    setAEnviar(true);
    const id = uid();
    const r = await carregarDocumento(f, id);
    setAEnviar(false);
    if (!r.ok) { showToast(r.erro, 'error'); return; }
    const ok = await modulo.gravar((m) => ({ ...m, itens: [...m.itens, { id, studentId: alunoId, titulo: titulo.trim() || f.name, path: r.path, nome: f.name, tipo: f.type, tamanho: f.size, visivelAoAluno: visivel, criadoEm: new Date().toISOString(), quem }] }));
    if (ok) { setTitulo(''); setVisivel(false); ficheiro.current.value = ''; showToast('Documento guardado.'); } else await apagarDocumentos([r.path]);
  }
  async function abrir(d) {
    const url = await urlDeDocumento(d.path);
    if (url) window.open(url, '_blank', 'noopener'); else showToast('Não foi possível abrir o ficheiro.', 'error');
  }
  async function confirmarApagar() {
    if (!(await apagarDocumentos([apagar.path]))) { showToast('Não foi possível apagar o ficheiro.', 'error'); setApagar(null); return; }
    await modulo.gravar((m) => ({ ...m, itens: m.itens.filter((x) => x.id !== apagar.id) }));
    setApagar(null);
  }
  return (
    <div className="flex flex-col gap-3">
      {!temServidor() && <Aviso>Os ficheiros precisam da conta ligada ao servidor.</Aviso>}
      <FormField label="Aluno"><select value={alunoId} onChange={(e) => setAlunoId(e.target.value)} className="input-field"><option value="">Todos</option>{alunosAtuais(students).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></FormField>
      {alunoId && temServidor() && (
        <div className="card p-3 flex flex-col gap-2">
          <FormField label="Título (opcional)"><input value={titulo} maxLength={80} onChange={(e) => setTitulo(e.target.value)} className="input-field" /></FormField>
          <input ref={ficheiro} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" aria-label="Ficheiro do documento" className="text-sm font-body text-muted" />
          <label className="flex items-center gap-2 text-sm font-body text-primary"><input type="checkbox" checked={visivel} onChange={(e) => setVisivel(e.target.checked)} /> O aluno vê este documento na área dele</label>
          <button type="button" disabled={aEnviar} onClick={enviar} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>{aEnviar ? 'A enviar...' : 'Guardar documento'}</button>
          <p className="text-xs font-body text-faint" style={{ margin: 0 }}>PDF ou imagem, até 10 MB. Ficam em armazenamento privado.</p>
        </div>
      )}
      {itens.length === 0 && <Vazio>Sem documentos.</Vazio>}
      {itens.map((d) => (
        <div key={d.id} className="flex items-center justify-between gap-2 border-b border-hair py-2 flex-wrap">
          <span className="min-w-0"><span className="block text-sm font-body text-primary">{d.titulo}</span><span className="block text-2xs font-body text-faint">{nomeDoAluno(students, d.studentId)} · {dm(String(d.criadoEm).slice(0, 10))}{d.visivelAoAluno ? ' · o aluno vê' : ' · só o treinador vê'}</span></span>
          <span className="flex gap-2 flex-shrink-0">
            <button type="button" onClick={() => abrir(d)} className="btn btn-ghost" style={{ fontSize: 12 }}>Abrir</button>
            <button type="button" onClick={() => modulo.gravar((m) => ({ ...m, itens: m.itens.map((x) => (x.id === d.id ? { ...x, visivelAoAluno: !x.visivelAoAluno } : x)) }))} className="btn btn-ghost" style={{ fontSize: 12 }}>{d.visivelAoAluno ? 'Esconder' : 'Mostrar ao aluno'}</button>
            <button type="button" onClick={() => setApagar(d)} className="btn btn-ghost" style={{ fontSize: 12 }}>Apagar</button>
          </span>
        </div>
      ))}
      {apagar && <ConfirmDialog title="Apagar documento" message={`«${apagar.titulo}» sai de vez, incluindo o ficheiro.`} confirmLabel="Apagar" onCancel={() => setApagar(null)} onConfirm={confirmarApagar} />}
    </div>
  );
}

function Envios({ modulo, students, modelos, showToast }) {
  const [alunoId, setAlunoId] = useState('');
  const [modeloId, setModeloId] = useState('');
  const envios = modulo.valor.envios || [];
  const hoje = hojeISO();
  async function enviar() {
    const m = modelos.find((x) => x.id === modeloId);
    if (!m) return;
    // Vai uma cópia: a resposta fica ligada ao texto que o aluno viu.
    const ok = await modulo.gravar((x) => ({ ...x, envios: [...(x.envios || []), { id: uid(), studentId: alunoId, modeloId: m.id, modelo: JSON.parse(JSON.stringify(m)), em: new Date().toISOString(), estado: 'aguarda' }] }));
    if (ok) { showToast('Enviado. Aparece na área do aluno.'); setModeloId(''); }
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-body text-muted" style={{ margin: 0 }}>O aluno com conta preenche na área dele. A resposta chega às Novidades e só entra na ficha quando a aceitar.</p>
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Aluno"><select value={alunoId} onChange={(e) => setAlunoId(e.target.value)} className="input-field"><option value="">Escolher...</option>{alunosAtuais(students).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></FormField>
        <FormField label="Formulário"><select value={modeloId} onChange={(e) => setModeloId(e.target.value)} className="input-field"><option value="">Escolher...</option>{modelos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></FormField>
      </div>
      <button type="button" disabled={!alunoId || !modeloId} onClick={enviar} className="btn btn-primary" style={{ alignSelf: 'flex-start', opacity: alunoId && modeloId ? 1 : 0.45 }}>Enviar ao aluno</button>
      <Titulo>Enviados</Titulo>
      {envios.length === 0 && <Vazio>Nenhum.</Vazio>}
      {[...envios].reverse().map((e) => (
        <div key={e.id} className="flex items-center justify-between gap-2 border-b border-hair py-2">
          <span className="text-sm font-body text-primary min-w-0">{e.modelo?.nome} · {nomeDoAluno(students, e.studentId)} <span className="text-2xs text-faint">{dm(String(e.em).slice(0, 10))}{String(e.em).slice(0, 10) === hoje ? ' (hoje)' : ''} · {e.estado === 'aguarda' ? 'por responder' : 'respondido'}</span></span>
          {e.estado === 'aguarda' && <button type="button" onClick={() => modulo.gravar((m) => ({ ...m, envios: m.envios.filter((x) => x.id !== e.id) }))} className="btn btn-ghost flex-shrink-0" style={{ fontSize: 12 }}>Retirar</button>}
        </div>
      ))}
    </div>
  );
}

export default function Documentos({ students, quem, modelosFormulario, showToast }) {
  const modulo = useModulo('documentos');
  const [aba, setAba] = useState('ficheiros');
  return (
    <ProntoOu modulos={modulo}>{() => (
      <div className="flex flex-col gap-3">
        <Abas valor={aba} onMudar={setAba} abas={[{ id: 'ficheiros', rotulo: 'Ficheiros' }, { id: 'envios', rotulo: 'Formulários enviados' }]} />
        {aba === 'ficheiros' ? <Ficheiros modulo={modulo} students={students} quem={quem} showToast={showToast} /> : <Envios modulo={modulo} students={students} modelos={modelosFormulario || []} showToast={showToast} />}
      </div>
    )}</ProntoOu>
  );
}
