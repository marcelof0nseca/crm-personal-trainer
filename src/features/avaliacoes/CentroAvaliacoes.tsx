// O centro das avaliações modulares. A física, com dobras e bioimpedância, continua
// no separador Avaliações; aqui ficam a postural, a funcional, a neuromotora, os
// modelos próprios, o envio ao aluno e a recorrência.
import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog, FormField, Modal } from '../../components/UiAtoms';
import { useModulo } from '../useModulo';
import PosturalEditor, { vistaVazia } from './PosturalEditor';
import {
  MODELOS_BASE, VISTAS_POSTURAIS, assimetria, camposEmFalta, comparar, concluirRecorrencia, criarRecorrencia, foraDoPlausivel,
  gravarRegisto, novoCampo, novoModelo, pendentes, registoAnterior, reporRegisto, somarDias, valorDoCampo,
} from './logica';

const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dm = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const fmt = (v) => (v == null || v === '' ? '—' : String(v).replace('.', ','));
const ESTADOS = { rascunho: 'Rascunho', final: 'Final', 'aguarda-aluno': 'À espera do aluno', 'aguarda-revisao': 'Por rever' };

function CampoValor({ campo, valor, onMudar, soLeitura }) {
  const v = valor || {};
  const entrada = (lado, i, rotulo) => {
    const atual = (v[lado] || [])[i] ?? '';
    const avisar = foraDoPlausivel(campo, atual);
    const mudar = (t) => { const lista = [...(v[lado] || [])]; lista[i] = t; onMudar({ ...v, [lado]: lista }); };
    if (campo.tipo === 'escala') {
      return (
        <select key={`${lado}${i}`} value={atual} disabled={soLeitura} onChange={(e) => mudar(e.target.value)} aria-label={`${campo.rotulo} ${rotulo}`} className="input-field" style={{ minWidth: 70, flex: '1 1 70px' }}>
          <option value="">—</option>
          {Array.from({ length: (campo.max ?? 5) - (campo.min ?? 1) + 1 }, (_, n) => (campo.min ?? 1) + n).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      );
    }
    return (
      <input
        key={`${lado}${i}`}
        inputMode="decimal"
        value={atual}
        disabled={soLeitura}
        onChange={(e) => mudar(e.target.value)}
        aria-label={`${campo.rotulo} ${rotulo}`}
        aria-invalid={avisar}
        placeholder={rotulo}
        className="input-field font-mono"
        style={{ minWidth: 70, flex: '1 1 70px', ...(avisar ? { borderColor: 'var(--gold)' } : {}) }}
      />
    );
  };
  const n = Math.max(1, Number(campo.tentativas) || 1);
  const ate = Array.from({ length: n }, (_, i) => i);
  const sufixo = (i) => (n > 1 ? ` ${i + 1}` : '');
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="text-xs font-body text-primary" style={{ fontWeight: 500 }}>{campo.rotulo}{campo.unidade ? ` (${campo.unidade})` : ''}</span>
      {campo.instrucoes && <span className="text-2xs font-body text-faint">{campo.instrucoes}</span>}
      {campo.tipo === 'texto'
        ? <textarea rows={2} value={v.unico?.[0] || ''} disabled={soLeitura} onChange={(e) => onMudar({ ...v, unico: [e.target.value] })} aria-label={campo.rotulo} className="input-field" />
        : campo.tipo === 'selecao'
          ? (
            <select value={v.unico?.[0] || ''} disabled={soLeitura} onChange={(e) => onMudar({ ...v, unico: [e.target.value] })} aria-label={campo.rotulo} className="input-field">
              <option value="">—</option>
              {String(campo.opcoes || '').split(',').map((o) => o.trim()).filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          )
          : campo.lados
            ? <div className="flex gap-2 flex-wrap">{ate.map((i) => entrada('d', i, `direito${sufixo(i)}`))}{ate.map((i) => entrada('e', i, `esquerdo${sufixo(i)}`))}</div>
            : <div className="flex gap-2 flex-wrap">{ate.map((i) => entrada('unico', i, `tentativa${sufixo(i)}`))}</div>}
      {campo.lados && assimetria(valorDoCampo(campo, v)?.d, valorDoCampo(campo, v)?.e) !== null && (
        <span className="text-2xs font-body text-muted">Diferença entre lados: {assimetria(valorDoCampo(campo, v).d, valorDoCampo(campo, v).e)}%</span>
      )}
      {campo.comDor && (
        <label className="flex items-center gap-2 text-2xs font-body text-muted">
          <input type="checkbox" checked={Boolean(v.dor)} disabled={soLeitura} onChange={(e) => onMudar({ ...v, dor: e.target.checked })} /> Dor referida
        </label>
      )}
      {campo.comNota && <input value={v.nota || ''} disabled={soLeitura} onChange={(e) => onMudar({ ...v, nota: e.target.value })} aria-label={`Compensação ou nota: ${campo.rotulo}`} placeholder="Compensação observada, notas" className="input-field" />}
    </div>
  );
}

function FormRegisto({ inicial, modelo, registos, modulo, app, onFechar, onGuardado }) {
  const [r, setR] = useState(inicial);
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');
  const [vista, setVista] = useState('frontal');
  const [aCarregar, setACarregar] = useState(false);
  const [proxima, setProxima] = useState('');
  const [dataProxima, setDataProxima] = useState('');
  const eraFinal = inicial.estado === 'final';
  const postural = r.tipo === 'postural';
  const anterior = registoAnterior(registos, r);
  const emFalta = modelo ? camposEmFalta(modelo, r.valores || {}) : [];
  const vistaAtual = r.vistas?.[vista] || vistaVazia();
  const vistaAntes = anterior?.vistas?.[vista];
  const urlDe = (id) => (id && app.photosById[id] ? app.photosById[id].dataUri : '');

  async function guardar(estado) {
    if (postural && !r.consentimento) { setErro('Confirme o consentimento para fotografias antes de guardar.'); return; }
    const antes = registos.find((x) => x.id === r.id) || null;
    const res = gravarRegisto(antes && antes.estado !== 'aguarda-aluno' && antes.estado !== 'aguarda-revisao' ? antes : null, { ...r, id: r.id }, { estado, motivo, quem: app.quem, agora: new Date().toISOString(), gerarId: uid });
    if (!res.ok) { setErro(res.erro); return; }
    let lista = antes ? registos.map((x) => (x.id === r.id ? res.registo : x)) : [...registos, res.registo];
    void lista;
    const ok = await modulo.gravar((v) => {
      const base = v.registos.some((x) => x.id === r.id) ? v.registos.map((x) => (x.id === r.id ? res.registo : x)) : [...v.registos, res.registo];
      let recorrencias = v.recorrencias;
      if (estado === 'final' && (proxima || dataProxima)) {
        const data = proxima === 'data' ? dataProxima : somarDias(hojeISO(), proxima);
        if (data) recorrencias = criarRecorrencia(recorrencias, { registoId: res.registo.id, studentId: r.studentId, modeloId: r.modeloId, tipo: r.tipo, data, intervaloDias: proxima === 'data' ? null : proxima });
      }
      return { ...v, registos: base, recorrencias };
    });
    if (ok) { app.showToast(estado === 'final' ? 'Avaliação finalizada.' : 'Rascunho guardado.'); onGuardado(); }
  }

  async function carregarFoto(files) {
    setACarregar(true);
    const ids = await app.onCarregarFotos(files);
    setACarregar(false);
    if (ids[0]) setR((x) => ({ ...x, vistas: { ...x.vistas, [vista]: { ...vistaAtual, fotoId: ids[0] } } }));
  }

  return (
    <Modal title={modelo ? modelo.nome : 'Avaliação postural'} onClose={onFechar} largura="720px">
      <div className="flex flex-col gap-4">
        <FormField label="Data"><input type="date" value={r.data} onChange={(e) => setR({ ...r, data: e.target.value })} className="input-field" /></FormField>
        {modelo?.ajuda && <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>{modelo.ajuda}</p>}

        {postural && (
          <>
            <label className="flex items-start gap-2 text-sm font-body text-primary">
              <input type="checkbox" checked={Boolean(r.consentimento)} onChange={(e) => setR({ ...r, consentimento: e.target.checked ? new Date().toISOString() : null })} />
              O aluno autorizou fotografias para esta avaliação, com consentimento específico.
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {VISTAS_POSTURAIS.map((x) => (
                <button key={x.id} type="button" aria-pressed={vista === x.id} onClick={() => setVista(x.id)} className={vista === x.id ? 'btn btn-primary' : 'btn btn-ghost'} style={{ fontSize: 12 }}>{x.rotulo}</button>
              ))}
            </div>
            <PosturalEditor
              key={vista}
              vista={vistaAtual}
              url={urlDe(vistaAtual.fotoId)}
              urlComparar={urlDe(vistaAntes?.fotoId)}
              aCarregar={aCarregar}
              gerarId={uid}
              onCarregar={carregarFoto}
              onMudar={(nova) => setR((x) => ({ ...x, vistas: { ...x.vistas, [vista]: nova } }))}
            />
            <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>A aplicação assinala e mede; não diagnostica.</p>
          </>
        )}

        {modelo && modelo.campos.map((c) => (
          <CampoValor key={c.id} campo={c} valor={r.valores?.[c.id]} onMudar={(v) => setR((x) => ({ ...x, valores: { ...x.valores, [c.id]: v } }))} />
        ))}

        <FormField label="Observações"><textarea rows={2} value={r.observacoes || ''} onChange={(e) => setR({ ...r, observacoes: e.target.value })} className="input-field" /></FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <FormField label="Próxima avaliação">
            <select value={proxima} onChange={(e) => setProxima(e.target.value)} className="input-field">
              <option value="">Sem marcar</option><option value="30">Em 30 dias</option><option value="60">Em 60 dias</option><option value="90">Em 90 dias</option><option value="data">Numa data</option>
            </select>
          </FormField>
          {proxima === 'data' && <FormField label="Data da próxima"><input type="date" value={dataProxima} onChange={(e) => setDataProxima(e.target.value)} className="input-field" /></FormField>}
        </div>

        {eraFinal && <FormField label="Motivo da alteração"><input value={motivo} onChange={(e) => setMotivo(e.target.value)} className="input-field" placeholder="Ex.: erro de digitação" /></FormField>}
        {emFalta.length > 0 && <p className="text-xs font-body text-faint" style={{ margin: 0 }}>Por preencher: {emFalta.map((c) => c.rotulo).join(', ')}.</p>}
        {erro && <p className="text-xs font-body" role="alert" style={{ margin: 0, color: 'var(--rust)' }}>{erro}</p>}
        <div className="flex gap-2 justify-end flex-wrap">
          {!eraFinal && <button type="button" onClick={() => guardar('rascunho')} className="btn btn-ghost">Guardar rascunho</button>}
          <button type="button" onClick={() => guardar('final')} className="btn btn-primary">{eraFinal ? 'Guardar revisão' : 'Finalizar'}</button>
        </div>
      </div>
    </Modal>
  );
}

function DetalheRegisto({ r, modelo, registos, app, modulo, onEditar, onFechar }) {
  const [aApagar, setAApagar] = useState(false);
  const anterior = registoAnterior(registos, r);
  const tabela = modelo ? comparar(modelo, r, anterior) : [];
  const aluno = app.students.find((s) => s.id === r.studentId);

  function imprimir() {
    const secoes = [{ titulo: 'Dados', linhas: [['Aluno', aluno?.name || ''], ['Data', dm(r.data)], ['Estado', ESTADOS[r.estado] || r.estado], ['Avaliador', r.editadoPor || '']] }];
    if (modelo) {
      secoes.push({
        titulo: 'Resultados',
        linhas: tabela.map((t) => [
          `${t.rotulo}${t.unidade ? ` (${t.unidade})` : ''}`,
          t.lados ? `D ${fmt(t.agora?.d)} · E ${fmt(t.agora?.e)}${t.assimetria != null ? ` · diferença ${t.assimetria}%` : ''}` : fmt(t.agora),
        ]),
      });
      modelo.campos.filter((c) => c.tipo === 'texto' || c.tipo === 'selecao').forEach((c) => { const t = valorDoCampo(c, r.valores?.[c.id]); if (t) secoes.push({ titulo: c.rotulo, texto: t }); });
    }
    if (r.tipo === 'postural') {
      VISTAS_POSTURAIS.forEach((x) => {
        const v = r.vistas?.[x.id];
        if (!v?.fotoId) return;
        secoes.push({
          titulo: `Vista ${x.rotulo.toLowerCase()}`,
          imagens: [app.photosById[v.fotoId]?.dataUri].filter(Boolean),
          linhas: [...v.marcadores.map((m, i) => [`Marcador ${i + 1}`, m.comentario || '—']), ...v.angulos.map((a, i) => [`Ângulo ${i + 1}`, `${fmt(a.valor)}° ${a.comentario || ''}`])],
        });
      });
    }
    if (r.observacoes) secoes.push({ titulo: 'Observações', texto: r.observacoes });
    app.onImprimir({ titulo: modelo ? modelo.nome : 'Avaliação postural', subtitulo: `${aluno?.name || ''} · ${dm(r.data)}`, secoes, nota: 'Estes registos assinalam o que foi observado e medido. Não são um diagnóstico.' });
  }

  return (
    <Modal title={modelo ? modelo.nome : 'Avaliação postural'} onClose={onFechar} largura="640px">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-body text-muted" style={{ margin: 0 }}>{aluno?.name} · {dm(r.data)} · {ESTADOS[r.estado] || r.estado}</p>
        {modelo && (
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-xs font-body" style={{ borderCollapse: 'collapse' }}>
              <thead><tr className="text-faint text-left"><th style={{ padding: '4px 8px 4px 0', fontWeight: 500 }}>Medida</th><th style={{ fontWeight: 500 }}>Agora</th><th style={{ fontWeight: 500 }}>{anterior ? dm(anterior.data) : 'Antes'}</th><th style={{ fontWeight: 500 }}>Diferença</th></tr></thead>
              <tbody>
                {tabela.map((t) => (
                  <tr key={t.id} className="text-primary" style={{ borderTop: '1px solid var(--border-hair)' }}>
                    <td style={{ padding: '4px 8px 4px 0' }}>{t.rotulo}</td>
                    <td className="font-mono">{t.lados ? `D ${fmt(t.agora?.d)} E ${fmt(t.agora?.e)}` : fmt(t.agora)}</td>
                    <td className="font-mono">{t.lados ? `D ${fmt(t.antes?.d)} E ${fmt(t.antes?.e)}` : fmt(t.antes)}</td>
                    <td className="font-mono">{t.lados ? `D ${fmt(t.difD)} E ${fmt(t.difE)}` : fmt(t.dif)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {(r.versoes || []).length > 0 && (
          <section className="flex flex-col gap-1">
            <h3 className="text-xs font-body text-muted" style={{ margin: 0, fontWeight: 600 }}>Histórico</h3>
            {[...r.versoes].reverse().map((v) => (
              <div key={v.v} className="flex items-center justify-between gap-2 flex-wrap text-2xs font-body text-primary">
                <span>{v.acao} · {dm(String(v.em).slice(0, 10))} · {v.quem}{v.motivo ? ` · ${v.motivo}` : ''}</span>
                <button type="button" className="text-2xs link-sky" onClick={() => modulo.gravar((m) => ({ ...m, registos: m.registos.map((x) => (x.id === r.id ? reporRegisto(x, v.v, { quem: app.quem, agora: new Date().toISOString() }) : x)) })).then((ok) => { if (ok) onFechar(); })}>Repor estes valores</button>
              </div>
            ))}
          </section>
        )}
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={onEditar} className="btn btn-primary">Editar</button>
          <button type="button" onClick={imprimir} className="btn btn-ghost">Exportar PDF</button>
          <button type="button" onClick={() => setAApagar(true)} className="btn btn-ghost" style={{ color: 'var(--rust)' }}>Apagar</button>
        </div>
      </div>
      {aApagar && (
        <ConfirmDialog
          title="Apagar esta avaliação?"
          message="A avaliação e as fotografias que só ela usa são apagadas de vez."
          onCancel={() => setAApagar(false)}
          onConfirm={async () => {
            setAApagar(false);
            const ok = await modulo.gravar((m) => ({ ...m, registos: m.registos.filter((x) => x.id !== r.id), recorrencias: m.recorrencias.filter((x) => x.registoId !== r.id) }));
            if (ok) { await app.onSoltarFotos(r, modulo.valor.registos.filter((x) => x.id !== r.id)); onFechar(); }
          }}
        />
      )}
    </Modal>
  );
}

function ConstrutorModelo({ modelo, onGuardar, onFechar }) {
  const [m, setM] = useState(modelo);
  const mudarCampo = (id, c) => setM((x) => ({ ...x, campos: x.campos.map((y) => (y.id === id ? { ...y, ...c } : y)) }));
  return (
    <Modal title="Modelo de avaliação" onClose={onFechar}>
      <div className="flex flex-col gap-3">
        <FormField label="Nome"><input value={m.nome} onChange={(e) => setM({ ...m, nome: e.target.value })} className="input-field" /></FormField>
        <FormField label="Instruções (opcional)"><textarea rows={2} value={m.ajuda || ''} onChange={(e) => setM({ ...m, ajuda: e.target.value })} className="input-field" /></FormField>
        <label className="flex items-center gap-2 text-sm font-body text-primary"><input type="checkbox" checked={Boolean(m.online)} onChange={(e) => setM({ ...m, online: e.target.checked })} /> Pode ser enviado ao aluno</label>
        {m.campos.map((c, i) => (
          <div key={c.id} className="rounded-lg p-3 flex flex-col gap-2" style={{ backgroundColor: 'var(--bg-inset)' }}>
            <FormField label={`Campo ${i + 1}`}><input value={c.rotulo} onChange={(e) => mudarCampo(c.id, { rotulo: e.target.value })} className="input-field" /></FormField>
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Tipo">
                <select value={c.tipo} onChange={(e) => mudarCampo(c.id, { tipo: e.target.value })} className="input-field">
                  <option value="numero">Número</option><option value="escala">Escala</option><option value="selecao">Seleção</option><option value="texto">Texto</option>
                </select>
              </FormField>
              {c.tipo === 'numero' && <FormField label="Unidade"><input value={c.unidade || ''} onChange={(e) => mudarCampo(c.id, { unidade: e.target.value })} className="input-field" placeholder="cm" /></FormField>}
              {c.tipo === 'selecao' && <FormField label="Opções, com vírgulas"><input value={c.opcoes || ''} onChange={(e) => mudarCampo(c.id, { opcoes: e.target.value })} className="input-field" /></FormField>}
              {(c.tipo === 'numero') && <FormField label="Tentativas"><input inputMode="numeric" value={c.tentativas} onChange={(e) => mudarCampo(c.id, { tentativas: e.target.value })} className="input-field font-mono" /></FormField>}
            </div>
            {(c.tipo === 'numero' || c.tipo === 'escala') && <label className="flex items-center gap-2 text-xs font-body text-primary"><input type="checkbox" checked={Boolean(c.lados)} onChange={(e) => mudarCampo(c.id, { lados: e.target.checked })} /> Direito e esquerdo</label>}
            <button type="button" onClick={() => setM((x) => ({ ...x, campos: x.campos.filter((y) => y.id !== c.id) }))} className="btn btn-ghost self-start" style={{ fontSize: 12, color: 'var(--rust)' }}><Trash2 size={13} /> Remover</button>
          </div>
        ))}
        <button type="button" onClick={() => setM((x) => ({ ...x, campos: [...x.campos, novoCampo(uid)] }))} className="btn btn-ghost self-start" style={{ fontSize: 12 }}><Plus size={13} /> Acrescentar campo</button>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onFechar} className="btn btn-ghost">Cancelar</button>
          <button type="button" disabled={!m.nome.trim() || m.campos.length === 0 || m.campos.some((c) => !c.rotulo.trim())} onClick={() => onGuardar(m)} className="btn btn-primary disabled:opacity-40">Guardar</button>
        </div>
      </div>
    </Modal>
  );
}

export default function CentroAvaliacoes(props) {
  const modulo = useModulo('avaliacoes');
  const { students, onAgendarAvaliacao, showToast } = props;
  const [alunoId, setAlunoId] = useState(students[0]?.id || '');
  const [form, setForm] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [construtor, setConstrutor] = useState(null);
  const v = modulo.valor;
  const hoje = hojeISO();
  const modelos = useMemo(() => [...MODELOS_BASE, ...v.modelos], [v.modelos]);
  const modeloDe = (r) => modelos.find((m) => m.id === r.modeloId) || null;
  const doAluno = useMemo(() => v.registos.filter((r) => r.studentId === alunoId).sort((a, b) => String(b.data).localeCompare(String(a.data))), [v.registos, alunoId]);
  const proximas = useMemo(() => pendentes(v.recorrencias, hoje), [v.recorrencias, hoje]);
  const nomeDe = (id) => students.find((s) => s.id === id)?.name || 'Aluno removido';

  const nova = (m) => setForm({ inicial: { id: uid(), studentId: alunoId, modeloId: m ? m.id : null, tipo: m ? m.categoria : 'postural', data: hoje, estado: 'rascunho', valores: {}, vistas: {}, observacoes: '' }, modelo: m });

  async function enviar(m) {
    const ok = await modulo.gravar((x) => ({ ...x, registos: [...x.registos, { id: uid(), studentId: alunoId, modeloId: m.id, modeloCopia: { nome: m.nome, campos: m.campos }, tipo: 'online', data: hoje, estado: 'aguarda-aluno', valores: {}, enviadoEm: new Date().toISOString(), prazo: somarDias(hoje, 14) }] }));
    if (ok) showToast(`Enviado a ${nomeDe(alunoId)}. Aparece na área do aluno.`);
  }

  if (modulo.estado === 'a-carregar') return <p className="text-sm font-body text-faint" role="status">A carregar...</p>;
  if (modulo.estado === 'erro') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm font-body" style={{ margin: 0, color: 'var(--rust)' }}>Não foi possível ler as avaliações.</p>
        <button type="button" onClick={modulo.recarregar} className="btn btn-ghost" style={{ fontSize: 12 }}>Tentar de novo</button>
      </div>
    );
  }
  if (students.length === 0) return <p className="text-sm font-body text-faint">Registe um aluno para começar.</p>;

  const appProps = { ...props, quem: props.quem };
  return (
    <div className="flex flex-col gap-4">
      {proximas.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-2xs uppercase tracking-wide text-faint font-mono" style={{ margin: 0 }}>Próximas avaliações</h2>
          {proximas.slice(0, 8).map((r) => (
            <div key={r.id} className="card p-3 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm font-body text-primary min-w-0">
                {nomeDe(r.studentId)} · {dm(r.proxima)}
                {r.atrasada && <span className="badge" style={{ marginLeft: 6, color: 'var(--gold)', backgroundColor: 'var(--gold-soft)' }}>atrasada</span>}
              </span>
              <span className="flex gap-1.5 flex-wrap">
                <button type="button" onClick={() => { onAgendarAvaliacao(r.studentId, r.proxima, r.id); showToast('Marcada na agenda.'); }} className="btn btn-ghost" style={{ fontSize: 11 }}>Marcar na agenda</button>
                <button type="button" onClick={() => modulo.gravar((x) => ({ ...x, recorrencias: x.recorrencias.map((y) => (y.id === r.id ? concluirRecorrencia(y, hoje) : y)) }))} className="btn btn-ghost" style={{ fontSize: 11 }}>Feita</button>
                <button type="button" onClick={() => modulo.gravar((x) => ({ ...x, recorrencias: x.recorrencias.filter((y) => y.id !== r.id) }))} className="btn btn-ghost" style={{ fontSize: 11 }}>Cancelar</button>
              </span>
            </div>
          ))}
        </section>
      )}

      <FormField label="Aluno">
        <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)} className="input-field">
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </FormField>

      <section className="flex flex-col gap-2">
        <h2 className="text-2xs uppercase tracking-wide text-faint font-mono" style={{ margin: 0 }}>Nova avaliação</h2>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => nova(null)} className="btn btn-ghost" style={{ fontSize: 12 }}>Postural</button>
          {modelos.filter((m) => !m.online || m.categoria !== 'online').map((m) => <button key={m.id} type="button" onClick={() => nova(m)} className="btn btn-ghost" style={{ fontSize: 12 }}>{m.nome}</button>)}
          <button type="button" onClick={() => setConstrutor(novoModelo('', uid))} className="btn btn-ghost" style={{ fontSize: 12 }}><Plus size={13} /> Criar modelo</button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-2xs uppercase tracking-wide text-faint font-mono" style={{ margin: 0 }}>Enviar ao aluno</h2>
        <div className="flex gap-2 flex-wrap">
          {modelos.filter((m) => m.online).map((m) => <button key={m.id} type="button" onClick={() => enviar(m)} className="btn btn-ghost" style={{ fontSize: 12 }}>{m.nome}</button>)}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-2xs uppercase tracking-wide text-faint font-mono" style={{ margin: 0 }}>Avaliações de {nomeDe(alunoId)}</h2>
        {doAluno.length === 0 && <p className="text-sm font-body text-faint" style={{ margin: 0 }}>Ainda não há avaliações destes tipos. A avaliação física continua no separador Avaliações.</p>}
        {doAluno.map((r) => (
          <button key={r.id} type="button" onClick={() => (r.estado === 'rascunho' || r.estado === 'aguarda-revisao' ? setForm({ inicial: r, modelo: modeloDe(r) }) : setDetalhe(r.id))} className="card p-3 text-left flex items-center justify-between gap-2 btn-surface">
            <span className="text-sm font-body text-primary min-w-0">{modeloDe(r)?.nome || 'Postural'} · {dm(r.data)}</span>
            <span className="badge flex-shrink-0">{ESTADOS[r.estado] || r.estado}</span>
          </button>
        ))}
      </section>

      {form && <FormRegisto {...form} registos={v.registos} modulo={modulo} app={appProps} onFechar={() => setForm(null)} onGuardado={() => setForm(null)} />}
      {detalhe && v.registos.find((r) => r.id === detalhe) && (() => {
        const r = v.registos.find((x) => x.id === detalhe);
        return <DetalheRegisto r={r} modelo={modeloDe(r)} registos={v.registos} app={appProps} modulo={modulo} onFechar={() => setDetalhe(null)} onEditar={() => { setDetalhe(null); setForm({ inicial: r, modelo: modeloDe(r) }); }} />;
      })()}
      {construtor && <ConstrutorModelo modelo={construtor} onFechar={() => setConstrutor(null)} onGuardar={async (m) => { if (await modulo.gravar((x) => ({ ...x, modelos: [...x.modelos.filter((y) => y.id !== m.id), m] }))) setConstrutor(null); }} />}
    </div>
  );
}
