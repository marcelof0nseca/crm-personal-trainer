// Agenda, progresso e «Mais» da área do aluno. Cada pedido passa pela `aluno-acao`, e o
// aluno vê apenas o que a `vistaDoAluno` deixou sair. Nunca importa de painel-pt.tsx.
import { useEffect, useMemo, useState } from 'react';
import { FormField } from '../../components/UiAtoms';
import EvolucaoAluno from '../treino/EvolucaoAluno';
import { IDIOMAS, useIdioma } from '../i18n';

const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const TITULO = { margin: 0 };

function Titulo({ children }) {
  return <h2 className="text-2xs uppercase tracking-wide text-faint font-mono" style={TITULO}>{children}</h2>;
}

// `invocar` vem da AreaDoAluno, com o cliente e o token certos.
function useAcao(invocar, onFeito) {
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState('');
  const [feito, setFeito] = useState('');
  async function enviar(op, dados, mensagemFeito) {
    setAEnviar(true); setErro(''); setFeito('');
    const r = await invocar(op, dados);
    setAEnviar(false);
    if (!r.ok) { setErro(r.erro); return null; }
    if (mensagemFeito) setFeito(mensagemFeito);
    if (onFeito) onFeito();
    return r;
  }
  return { aEnviar, erro, feito, enviar };
}

const Mensagens = ({ a }) => (
  <>
    {a.erro && <p className="text-xs font-body" role="alert" style={{ margin: 0, color: 'var(--rust)' }}>{a.erro}</p>}
    {a.feito && <p className="text-xs font-body" role="status" style={{ margin: 0, color: 'var(--ok)' }}>{a.feito}</p>}
  </>
);

/* ---------------------------- início ---------------------------- */

const PERGUNTAS_CHECKIN = ['sono', 'energia', 'stress', 'dor', 'motivacao', 'recuperacao'];

export function CheckIn({ invocar, onRecarregar }) {
  const { t } = useIdioma();
  const [v, setV] = useState({});
  const acao = useAcao(invocar, onRecarregar);
  return (
    <div className="card p-3 flex flex-col gap-2">
      <Titulo>{t('checkin')}</Titulo>
      <p className="text-xs font-body text-faint" style={{ margin: 0 }}>{t('checkin_ajuda')}</p>
      {PERGUNTAS_CHECKIN.map((k) => (
        <div key={k} role="group" aria-label={t(`ci_${k}`)} className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-sm font-body text-primary">{t(`ci_${k}`)}</span>
          <span className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" aria-pressed={v[k] === n} onClick={() => setV({ ...v, [k]: n })} className="btn btn-ghost font-mono" style={{ fontSize: 12, minWidth: 36, padding: '6px 0', ...(v[k] === n ? { color: 'var(--brass)', borderColor: 'var(--brass)' } : {}) }}>{n}</button>)}
          </span>
        </div>
      ))}
      <Mensagens a={acao} />
      <button type="button" disabled={Object.keys(v).length === 0 || acao.aEnviar} onClick={() => acao.enviar('check_in', v, t('checkin_feito'))} className="btn btn-primary" style={{ alignSelf: 'flex-start', opacity: Object.keys(v).length ? 1 : 0.45 }}>{t('enviar')}</button>
    </div>
  );
}

export function Lembretes({ lista }) {
  const { t, data } = useIdioma();
  if (!lista || lista.length === 0) return null;
  return lista.map((l) => <p key={l.id} className="text-sm font-body rounded-lg px-3 py-2" role="status" style={{ margin: 0, color: 'var(--gold)', backgroundColor: 'var(--gold-soft)' }}>{t('lembrete_aula')}: {data(l.date)} · <span className="font-mono">{l.startTime}</span></p>);
}

// A fotografia reduz-se no aparelho, para caber no pedido e não gastar dados.
function reduzirFotografia(ficheiro, lado = 1600, qualidade = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(ficheiro);
    const img = new Image();
    img.onload = () => {
      const f = Math.min(1, lado / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * f); c.height = Math.round(img.height * f);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', qualidade));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('foto')); };
    img.src = url;
  });
}

function PublicarProgresso({ invocar }) {
  const { t } = useIdioma();
  const [f, setF] = useState({ texto: '', peso: '', medida: '' });
  const [foto, setFoto] = useState('');
  const [consent, setConsent] = useState(false);
  const [erro, setErro] = useState('');
  const acao = useAcao(invocar);
  async function escolher(ficheiro) {
    setErro(''); setFoto('');
    if (!ficheiro) return;
    try { setFoto(await reduzirFotografia(ficheiro)); } catch { setErro(t('pp_grande')); }
  }
  async function enviar() {
    if (foto && !consent) { setErro(t('pp_consent_falta')); return; }
    setErro('');
    const r = await acao.enviar('publicar_progresso', { ...f, ...(foto ? { foto, consentimentoFoto: consent } : {}) }, t('pp_enviado'));
    if (r) { setF({ texto: '', peso: '', medida: '' }); setFoto(''); setConsent(false); }
  }
  return (
    <div className="card p-3 flex flex-col gap-2">
      <Titulo>{t('publicar')}</Titulo>
      <FormField label={t('pp_texto')}><textarea rows={2} maxLength={500} value={f.texto} onChange={(e) => setF({ ...f, texto: e.target.value })} className="input-field" /></FormField>
      <div className="grid grid-cols-2 gap-2">
        <FormField label={t('pp_peso')}><input value={f.peso} inputMode="decimal" maxLength={12} onChange={(e) => setF({ ...f, peso: e.target.value })} className="input-field" /></FormField>
        <FormField label={t('pp_medida')}><input value={f.medida} maxLength={60} onChange={(e) => setF({ ...f, medida: e.target.value })} className="input-field" /></FormField>
      </div>
      <FormField label={t('pp_foto')}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => escolher(e.target.files[0])} className="text-sm font-body text-muted" /></FormField>
      {foto && <img src={foto} alt={t('pp_foto')} className="rounded-lg" style={{ maxWidth: 160 }} />}
      {foto && <label className="flex items-start gap-2 text-sm font-body text-primary"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} /> {t('pp_consent')}</label>}
      {erro && <p className="text-xs font-body" role="alert" style={{ margin: 0, color: 'var(--rust)' }}>{erro}</p>}
      <Mensagens a={acao} />
      <button type="button" disabled={acao.aEnviar || (!f.texto.trim() && !f.peso.trim() && !f.medida.trim() && !foto)} onClick={enviar} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>{t('enviar')}</button>
    </div>
  );
}

/* ---------------------------- agenda ---------------------------- */

export function AgendaDoAluno({ dados, invocar, onRecarregar }) {
  const { t, data } = useIdioma();
  const hoje = hojeISO();
  const conta = dados.via === 'conta';
  const politica = dados.politica;
  const [pedido, setPedido] = useState({ date: '', startTime: '18:00', endTime: '19:00', notas: '' });
  const [aCancelar, setACancelar] = useState(null);
  const [calendario, setCalendario] = useState('');
  const acao = useAcao(invocar, onRecarregar);
  const acaoPedido = useAcao(invocar, onRecarregar);
  const locais = dados.locais || [];
  const nomeLocal = (id) => (locais.find((l) => l.id === id) || {}).nome;
  const proximas = (dados.agenda || []).filter((s) => s.date >= hoje && s.status === 'agendado').sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  const passadas = (dados.agenda || []).filter((s) => s.date < hoje || s.status !== 'agendado').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  const estado = (s) => t(`estado_${s.status}`) || s.status;

  return (
    <div className="flex flex-col gap-3">
      <Titulo>{t('proximas')}</Titulo>
      {proximas.length === 0 && <p className="text-sm font-body text-faint" style={{ margin: 0 }}>{t('sem_proximas')}</p>}
      {proximas.map((s) => (
        <div key={s.id} className="card p-3 flex flex-col gap-2">
          <p className="text-sm font-body text-primary" style={{ margin: 0, fontWeight: 600 }}>{data(s.date)} · <span className="font-mono">{s.startTime}–{s.endTime}</span></p>
          {nomeLocal(s.localId) && <p className="text-xs font-body text-muted" style={{ margin: 0 }}>{nomeLocal(s.localId)}</p>}
          {conta && politica?.aceitaPedidos && (aCancelar === s.id ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-body text-muted">{t('cancelar_confirma')}</span>
              <button type="button" disabled={acao.aEnviar} onClick={async () => { await acao.enviar('cancelar_aula', { sessaoId: s.id }, t('cancelar_enviado')); setACancelar(null); }} className="btn btn-primary" style={{ fontSize: 12 }}>{t('confirmar')}</button>
              <button type="button" onClick={() => setACancelar(null)} className="btn btn-ghost" style={{ fontSize: 12 }}>{t('voltar')}</button>
            </div>
          ) : <button type="button" onClick={() => setACancelar(s.id)} className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12 }}>{t('cancelar_aula')}</button>)}
        </div>
      ))}
      <Mensagens a={acao} />

      {(dados.creditos || []).length > 0 && (
        <>
          <Titulo>{t('creditos')}</Titulo>
          {dados.creditos.map((c) => <p key={c.id} className="text-sm font-body text-muted" style={{ margin: 0 }}>{data(c.date)}{c.validade ? ` · ${t('valido_ate')} ${data(c.validade)}` : ''}</p>)}
        </>
      )}

      {conta && politica?.aceitaPedidos && (
        <div className="card p-3 flex flex-col gap-2">
          <Titulo>{t('pedir_aula')}</Titulo>
          <FormField label={t('dia')}><input type="date" min={hoje} value={pedido.date} onChange={(e) => setPedido({ ...pedido, date: e.target.value })} className="input-field" /></FormField>
          <div className="grid grid-cols-2 gap-2">
            <FormField label={t('das')}><input type="time" value={pedido.startTime} onChange={(e) => setPedido({ ...pedido, startTime: e.target.value })} className="input-field" /></FormField>
            <FormField label={t('as')}><input type="time" value={pedido.endTime} onChange={(e) => setPedido({ ...pedido, endTime: e.target.value })} className="input-field" /></FormField>
          </div>
          <FormField label={t('notas_opcional')}><input value={pedido.notas} maxLength={300} onChange={(e) => setPedido({ ...pedido, notas: e.target.value })} className="input-field" /></FormField>
          <Mensagens a={acaoPedido} />
          <button type="button" disabled={!pedido.date || acaoPedido.aEnviar} onClick={async () => { if (await acaoPedido.enviar('pedir_aula', pedido, t('pedido_enviado'))) setPedido({ ...pedido, date: '', notas: '' }); }} className="btn btn-primary" style={{ alignSelf: 'flex-start', opacity: pedido.date ? 1 : 0.45 }}>{t('enviar_pedido')}</button>
        </div>
      )}
      {!conta && <p className="text-xs font-body text-faint" style={{ margin: 0 }}>{t('so_conta')}</p>}

      {conta && (
        <div className="flex flex-col gap-2">
          <button type="button" onClick={async () => { const r = await invocar('ligacao_calendario', {}); if (r.ok) setCalendario(r.url); }} className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12 }}>{t('calendario')}</button>
          {calendario && <><input readOnly value={calendario} aria-label={t('calendario')} className="input-field" onFocus={(e) => e.target.select()} /><p className="text-xs font-body text-faint" style={{ margin: 0 }}>{t('calendario_ajuda')}</p></>}
        </div>
      )}

      {passadas.length > 0 && (
        <>
          <Titulo>{t('anteriores')}</Titulo>
          {passadas.map((s) => <p key={s.id} className="text-sm font-body text-muted" style={{ margin: 0 }}>{data(s.date)} · <span className="font-mono">{s.startTime}</span> · {estado(s)}</p>)}
        </>
      )}
    </div>
  );
}

/* ---------------------------- progresso ---------------------------- */

export function ProgressoDoAluno({ dados, sessoes, invocar }) {
  const { t, data } = useIdioma();
  const pct = (m) => {
    const n = (v) => { const x = parseFloat(String(v == null ? '' : v).replace(',', '.')); return Number.isFinite(x) ? x : null; };
    const [b, a, c] = [n(m.base), n(m.alvo), n(m.atual)];
    return b === null || a === null || c === null || a === b ? null : Math.max(0, Math.min(100, Math.round(((c - b) / (a - b)) * 100)));
  };
  const publicacoes = dados.publicacoes || [];
  const pontos = dados.pontos;
  return (
    <div className="flex flex-col gap-4">
      {pontos && (
        <div className="card p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2"><Titulo>{t('pontos')}</Titulo><span className="font-mono text-lg" style={{ color: 'var(--gold)' }}>{pontos.saldo}</span></div>
          {pontos.recompensas.length > 0 && <p className="text-xs font-body text-muted" style={{ margin: 0 }}>{t('recompensas')}: {pontos.recompensas.map((r) => `${r.nome} (${r.pontos})`).join(' · ')}</p>}
          {pontos.movimentos.slice(0, 5).map((m, i) => <p key={`${m.em}${i}`} className="text-xs font-body text-faint" style={{ margin: 0 }}><span className="font-mono">{m.pontos > 0 ? `+${m.pontos}` : m.pontos}</span> · {m.motivo}</p>)}
        </div>
      )}
      {dados.via === 'conta' && <PublicarProgresso invocar={invocar} />}
      {(dados.metas || []).length > 0 && (
        <div className="flex flex-col gap-2">
          <Titulo>{t('metas')}</Titulo>
          {dados.metas.map((m) => (
            <div key={m.id} className="card p-3 flex flex-col gap-1">
              <p className="text-sm font-body text-primary" style={{ margin: 0, fontWeight: 600 }}>{m.titulo}</p>
              {pct(m) !== null && <p className="text-xs font-body text-muted" style={{ margin: 0 }}>{pct(m)}% {t('meta_caminho')} · <span className="font-mono">{m.atual}{m.unidade ? ` ${m.unidade}` : ''}</span></p>}
              {m.prazo && <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>{t('meta_prazo')}: {data(m.prazo)}</p>}
              {m.comentario && <p className="text-xs font-body text-muted" style={{ margin: 0 }}>{m.comentario}</p>}
            </div>
          ))}
        </div>
      )}
      <Titulo>{t('partilhado')}</Titulo>
      {publicacoes.length === 0 && <p className="text-sm font-body text-faint" style={{ margin: 0 }}>{t('sem_partilhado')}</p>}
      {publicacoes.map((p) => (
        <div key={p.id} className="card p-3 flex flex-col gap-1">
          <p className="text-sm font-body text-primary" style={{ margin: 0, fontWeight: 600 }}>{p.titulo}</p>
          <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>{data(p.em)}</p>
          {(p.linhas || []).map(([r, v]) => <p key={r} className="text-sm font-body text-muted flex justify-between gap-2" style={{ margin: 0 }}><span>{r}</span><span className="font-mono">{v}</span></p>)}
          {p.texto && <p className="text-sm font-body text-muted" style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{p.texto}</p>}
        </div>
      ))}
      <Titulo>{t('evolucao')}</Titulo>
      <EvolucaoAluno sessoes={sessoes} />
    </div>
  );
}

/* ---------------------------- mais ---------------------------- */

function Pergunta({ p, valor, onMudar }) {
  const { t } = useIdioma();
  const obrig = p.obrigatoria || p.tipo === 'declaracao' ? ' *' : '';
  if (p.tipo === 'sim_nao' || p.tipo === 'sim_nao_detalhe' || p.tipo === 'declaracao') {
    const v = valor || {};
    return (
      <div role="group" aria-label={p.texto} className="flex flex-col gap-1.5">
        <span className="text-sm font-body text-primary">{p.texto}{obrig}</span>
        {p.tipo === 'declaracao' ? (
          <label className="flex items-center gap-2 text-sm font-body text-muted"><input type="checkbox" checked={v.valor === 'sim'} onChange={(e) => onMudar({ valor: e.target.checked ? 'sim' : '' })} /> {t('li_aceito')}</label>
        ) : (
          <div className="flex gap-3">
            {['sim', 'nao'].map((o) => <label key={o} className="flex items-center gap-1.5 text-sm font-body text-muted"><input type="radio" name={p.id} checked={v.valor === o} onChange={() => onMudar({ ...v, valor: o })} /> {t(o)}</label>)}
          </div>
        )}
        {p.tipo === 'sim_nao_detalhe' && v.valor === 'sim' && <input value={v.detalhe || ''} maxLength={500} aria-label={`${t('detalhe')}: ${p.texto}`} placeholder={t('detalhe')} onChange={(e) => onMudar({ ...v, detalhe: e.target.value })} className="input-field" />}
      </div>
    );
  }
  if (p.tipo === 'varias') {
    const v = Array.isArray(valor) ? valor : [];
    return (
      <div role="group" aria-label={p.texto} className="flex flex-col gap-1.5">
        <span className="text-sm font-body text-primary">{p.texto}{obrig}</span>
        {(p.opcoes || []).map((o) => <label key={o} className="flex items-center gap-2 text-sm font-body text-muted"><input type="checkbox" checked={v.includes(o)} onChange={(e) => onMudar(e.target.checked ? [...v, o] : v.filter((x) => x !== o))} /> {o}</label>)}
      </div>
    );
  }
  return (
    <FormField label={`${p.texto}${obrig}`}>
      {p.tipo === 'texto_longo' ? <textarea rows={3} maxLength={4000} value={valor || ''} onChange={(e) => onMudar(e.target.value)} className="input-field" />
        : p.tipo === 'escolha' ? <select value={valor || ''} onChange={(e) => onMudar(e.target.value)} className="input-field"><option value="" />{(p.opcoes || []).map((o) => <option key={o} value={o}>{o}</option>)}</select>
          : p.tipo === 'escala' ? <select value={valor || ''} onChange={(e) => onMudar(e.target.value)} className="input-field"><option value="" />{[1, 2, 3, 4, 5].map((o) => <option key={o} value={o}>{o}</option>)}</select>
            : <input type={p.tipo === 'numero' ? 'number' : p.tipo === 'data' ? 'date' : 'text'} value={valor || ''} maxLength={500} onChange={(e) => onMudar(e.target.value)} className="input-field" />}
    </FormField>
  );
}

export const respostaEmFalta = (modelo, r) => (modelo.seccoes || []).some((s) => (s.perguntas || []).some((p) => {
  const v = r[p.id];
  if (p.tipo === 'declaracao') return !v || v.valor !== 'sim';
  if (!p.obrigatoria) return false;
  if (p.tipo === 'sim_nao' || p.tipo === 'sim_nao_detalhe') return !v || !v.valor;
  return v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
}));

function Formulario({ envio, invocar, onRecarregar }) {
  const { t } = useIdioma();
  const [r, setR] = useState({});
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const acao = useAcao(invocar, onRecarregar);
  const m = envio.modelo;
  const temAlerta = (m.seccoes || []).some((s) => (s.perguntas || []).some((p) => p.alerta && r[p.id]?.valor === 'sim'));
  return (
    <div className="card p-3 flex flex-col gap-3">
      <p className="text-sm font-body text-primary" style={{ margin: 0, fontWeight: 600 }}>{m.nome}</p>
      {m.descricao && <p className="text-xs font-body text-muted" style={{ margin: 0 }}>{m.descricao}</p>}
      {(m.seccoes || []).map((s) => (
        <div key={s.id} className="flex flex-col gap-3">
          {s.titulo && <Titulo>{s.titulo}</Titulo>}
          {(s.perguntas || []).map((p) => <Pergunta key={p.id} p={p} valor={r[p.id]} onMudar={(v) => setR({ ...r, [p.id]: v })} />)}
        </div>
      ))}
      {temAlerta && <p className="text-xs font-body" style={{ margin: 0, color: 'var(--gold)' }}>{m.rodape || t('nao_diagnostico')}</p>}
      <FormField label={t('nome_confirmar')}><input value={nome} maxLength={120} onChange={(e) => setNome(e.target.value)} className="input-field" /></FormField>
      {erro && <p className="text-xs font-body" role="alert" style={{ margin: 0, color: 'var(--rust)' }}>{erro}</p>}
      <Mensagens a={acao} />
      <button type="button" disabled={acao.aEnviar} onClick={() => { if (respostaEmFalta(m, r) || !nome.trim()) { setErro(t('campo_obrigatorio')); return; } setErro(''); acao.enviar('responder_formulario', { envioId: envio.id, respostas: r, nomeAssinado: nome }); }} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>{t('enviar')}</button>
    </div>
  );
}

function Contrato({ c, invocar, onRecarregar }) {
  const { t } = useIdioma();
  const [nome, setNome] = useState('');
  const [aceito, setAceito] = useState(false);
  const acao = useAcao(invocar, onRecarregar);
  return (
    <div className="card p-3 flex flex-col gap-2">
      <p className="text-sm font-body text-primary" style={{ margin: 0, fontWeight: 600 }}>{c.titulo}</p>
      <p className="text-sm font-body text-muted" style={{ margin: 0, whiteSpace: 'pre-wrap', maxHeight: 280, overflowY: 'auto' }}>{c.texto}</p>
      <label className="flex items-center gap-2 text-sm font-body text-primary"><input type="checkbox" checked={aceito} onChange={(e) => setAceito(e.target.checked)} /> {t('li_aceito')}</label>
      <FormField label={t('nome_confirmar')}><input value={nome} maxLength={120} onChange={(e) => setNome(e.target.value)} className="input-field" /></FormField>
      <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>{t('aceite_simples')}</p>
      <Mensagens a={acao} />
      <button type="button" disabled={!aceito || !nome.trim() || acao.aEnviar} onClick={() => acao.enviar('aceitar_contrato', { envioId: c.id, nome, aceito })} className="btn btn-primary" style={{ alignSelf: 'flex-start', opacity: aceito && nome.trim() ? 1 : 0.45 }}>{t('aceitar')}</button>
    </div>
  );
}

function AvaliacaoOnline({ a, invocar, onRecarregar }) {
  const { t, data } = useIdioma();
  const [v, setV] = useState({});
  const acao = useAcao(invocar, onRecarregar);
  const campos = a.modelo?.campos || [];
  return (
    <div className="card p-3 flex flex-col gap-2">
      <p className="text-sm font-body text-primary" style={{ margin: 0, fontWeight: 600 }}>{a.modelo?.nome}</p>
      {a.prazo && <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>{t('ate_prazo')}: {data(a.prazo)}</p>}
      {campos.map((c) => (
        <FormField key={c.id} label={`${c.rotulo}${c.unidade ? ` (${c.unidade})` : ''}`}>
          <input type="text" inputMode={c.tipo === 'numero' ? 'decimal' : undefined} value={v[c.id] || ''} onChange={(e) => setV({ ...v, [c.id]: e.target.value })} className="input-field" />
          {c.instrucoes && <span className="text-2xs font-body text-faint">{c.instrucoes}</span>}
        </FormField>
      ))}
      <Mensagens a={acao} />
      <button type="button" disabled={acao.aEnviar} onClick={() => acao.enviar('responder_avaliacao', { registoId: a.id, valores: v })} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>{t('enviar')}</button>
    </div>
  );
}

function Pesquisa({ p, invocar, onRecarregar }) {
  const { t } = useIdioma();
  const [nota, setNota] = useState(null);
  const [comentario, setComentario] = useState('');
  const acao = useAcao(invocar, onRecarregar);
  return (
    <div className="card p-3 flex flex-col gap-2">
      <p className="text-sm font-body text-primary" style={{ margin: 0 }}>{p.titulo}</p>
      <div role="group" aria-label={t('nota')} className="flex flex-wrap gap-1">
        {Array.from({ length: 11 }, (_, i) => <button key={i} type="button" aria-pressed={nota === i} onClick={() => setNota(i)} className="btn btn-ghost font-mono" style={{ fontSize: 12, minWidth: 36, padding: '6px 0', ...(nota === i ? { color: 'var(--brass)', borderColor: 'var(--brass)' } : {}) }}>{i}</button>)}
      </div>
      <FormField label={t('comentario')}><input value={comentario} maxLength={500} onChange={(e) => setComentario(e.target.value)} className="input-field" /></FormField>
      <Mensagens a={acao} />
      <button type="button" disabled={nota === null || acao.aEnviar} onClick={() => acao.enviar('responder_pesquisa', { pesquisaId: p.id, nota, comentario }, t('obrigado'))} className="btn btn-primary" style={{ alignSelf: 'flex-start', opacity: nota === null ? 0.45 : 1 }}>{t('responder')}</button>
    </div>
  );
}

const CHAVE_PUSH = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const paraBytes = (b64) => Uint8Array.from(atob(`${b64}${'='.repeat((4 - (b64.length % 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const emBase64Url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// O iPhone só dá notificações a uma página adicionada ao ecrã inicial.
function Notificacoes({ invocar }) {
  const { t } = useIdioma();
  const [estado, setEstado] = useState('a-ver');
  const [erro, setErro] = useState('');
  const registo = () => navigator.serviceWorker.getRegistration();

  useEffect(() => {
    (async () => {
      const iphone = /iPhone|iPad/.test(navigator.userAgent);
      const instalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
      if (!CHAVE_PUSH) { setEstado('indisponivel'); return; }
      if (iphone && !instalada) { setEstado('instalar'); return; }
      if (!('PushManager' in window) || !('serviceWorker' in navigator)) { setEstado('indisponivel'); return; }
      if (Notification.permission === 'denied') { setEstado('negado'); return; }
      const r = await registo();
      const s = r ? await r.pushManager.getSubscription() : null;
      setEstado(s ? 'ativas' : 'por-ativar');
    })().catch(() => setEstado('indisponivel'));
  }, []);

  async function ativar() {
    setErro('');
    const permissao = await Notification.requestPermission();
    if (permissao !== 'granted') { setEstado(permissao === 'denied' ? 'negado' : 'por-ativar'); return; }
    try {
      const r = await registo();
      const s = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: paraBytes(CHAVE_PUSH) });
      const g = await invocar('push_subscrever', { endpoint: s.endpoint, p256dh: emBase64Url(s.getKey('p256dh')), auth: emBase64Url(s.getKey('auth')) });
      if (!g.ok) { await s.unsubscribe(); setErro(g.erro); return; }
      setEstado('ativas');
    } catch { setErro(t('erro_enviar')); }
  }
  async function desligar() {
    setErro('');
    const r = await registo();
    const s = r ? await r.pushManager.getSubscription() : null;
    if (s) { await invocar('push_cancelar', { endpoint: s.endpoint }); await s.unsubscribe(); }
    setEstado('por-ativar');
  }

  if (estado === 'a-ver') return null;
  return (
    <div className="flex flex-col gap-2">
      <Titulo>{t('notificacoes')}</Titulo>
      {estado === 'indisponivel' && <p className="text-xs font-body text-faint" style={{ margin: 0 }}>{t('notificacoes_indisponivel')}</p>}
      {estado === 'instalar' && <p className="text-xs font-body text-muted" style={{ margin: 0 }}>{t('notif_instalar')}</p>}
      {estado === 'negado' && <p className="text-xs font-body text-muted" style={{ margin: 0 }}>{t('notif_negado')}</p>}
      {estado === 'por-ativar' && <><p className="text-xs font-body text-muted" style={{ margin: 0 }}>{t('notif_ajuda')}</p><button type="button" onClick={ativar} className="btn btn-primary" style={{ alignSelf: 'flex-start', fontSize: 12 }}>{t('notif_ativar')}</button></>}
      {estado === 'ativas' && <div className="flex items-center gap-2 flex-wrap"><span className="text-xs font-body text-muted">{t('notif_ativas')}</span><button type="button" onClick={desligar} className="btn btn-ghost" style={{ fontSize: 12 }}>{t('notif_desligar')}</button></div>}
      {erro && <p className="text-xs font-body" role="alert" style={{ margin: 0, color: 'var(--rust)' }}>{erro}</p>}
    </div>
  );
}

export const contarPorLer = (dados) => (dados.notificacoes || []).filter((n) => !n.lida).length + (dados.formularios || []).length + (dados.contratos || []).length + (dados.avaliacoesOnline || []).length;

export function MaisDoAluno({ dados, invocar, onRecarregar, onLerLocal }) {
  const { t, data, euros, idioma, mudar } = useIdioma();
  const conta = dados.via === 'conta';
  const [perfil, setPerfil] = useState({ phone: dados.aluno.phone || '', email: dados.aluno.email || '' });
  const acaoPerfil = useAcao(invocar);
  const acaoDoc = useAcao(invocar);
  const acaoPagar = useAcao(invocar);
  async function pagar(f) {
    const r = await acaoPagar.enviar('pagar_fatura', { id: f.id });
    if (r && r.url) window.location.href = r.url;
  }
  const avisos = dados.notificacoes || [];
  const faturas = dados.faturas || [];
  const pendentes = useMemo(() => [...(dados.pesquisas || [])], [dados.pesquisas]);

  async function marcar(n) {
    const r = await invocar('marcar_lida', { id: n.id });
    if (r.ok) onLerLocal(n.id);
  }
  async function abrirDocumento(d) {
    const r = await acaoDoc.enviar('abrir_documento', { id: d.id });
    if (r && r.url) window.open(r.url, '_blank', 'noopener');
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Titulo>{t('avisos')}</Titulo>
        {avisos.length === 0 && <p className="text-sm font-body text-faint" style={{ margin: 0 }}>{t('sem_avisos')}</p>}
        {avisos.map((n) => (
          <div key={n.id} className="card p-3 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm font-body text-primary" style={{ fontWeight: n.lida ? 400 : 600 }}>{n.titulo}</span>
              <span className="text-2xs font-body text-faint">{data(n.em)}</span>
            </div>
            <p className="text-sm font-body text-muted" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{n.texto}</p>
            {n.lida ? <span className="text-2xs font-body text-faint">{t('lido')}</span> : <button type="button" onClick={() => marcar(n)} className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12 }}>{t('marcar_lido')}</button>}
          </div>
        ))}
      </div>

      {conta && (dados.formularios || []).length > 0 && <div className="flex flex-col gap-2"><Titulo>{t('formularios')}</Titulo>{dados.formularios.map((f) => <Formulario key={f.id} envio={f} invocar={invocar} onRecarregar={onRecarregar} />)}</div>}
      {conta && (dados.contratos || []).length > 0 && <div className="flex flex-col gap-2"><Titulo>{t('contratos')}</Titulo>{dados.contratos.map((c) => <Contrato key={c.id} c={c} invocar={invocar} onRecarregar={onRecarregar} />)}</div>}
      {conta && (dados.avaliacoesOnline || []).length > 0 && <div className="flex flex-col gap-2"><Titulo>{t('avaliacoes')}</Titulo>{dados.avaliacoesOnline.map((a) => <AvaliacaoOnline key={a.id} a={a} invocar={invocar} onRecarregar={onRecarregar} />)}</div>}
      {conta && pendentes.length > 0 && <div className="flex flex-col gap-2"><Titulo>{t('satisfacao')}</Titulo>{pendentes.map((p) => <Pesquisa key={p.id} p={p} invocar={invocar} onRecarregar={onRecarregar} />)}</div>}

      {conta && (
        <div className="flex flex-col gap-2">
          <Titulo>{t('faturas')}</Titulo>
          {faturas.length === 0 && <p className="text-sm font-body text-faint" style={{ margin: 0 }}>{t('sem_faturas')}</p>}
          {faturas.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-2 border-b border-hair py-2 flex-wrap">
              <span className="min-w-0"><span className="block text-sm font-body text-primary">{f.descricao}</span><span className="block text-2xs font-body text-faint">{t('vence')} {data(f.vencimento)} · {t(`fatura_estado_${f.estado}`)}</span></span>
              <span className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono text-sm text-primary">{euros(f.total, f.moeda)}</span>
                {dados.pagarOnline && ['aberta', 'vencida', 'parcial'].includes(f.estado) && <button type="button" disabled={acaoPagar.aEnviar} onClick={() => pagar(f)} className="btn btn-primary" style={{ fontSize: 12 }}>{t('pagar')}</button>}
              </span>
            </div>
          ))}
          <Mensagens a={acaoPagar} />
          {!dados.pagarOnline && faturas.some((f) => ['aberta', 'vencida', 'parcial'].includes(f.estado)) && <p className="text-xs font-body text-faint" style={{ margin: 0 }}>{t('pagar_ajuda')}</p>}
        </div>
      )}

      {conta && (dados.documentos || []).length > 0 && (
        <div className="flex flex-col gap-2">
          <Titulo>{t('documentos')}</Titulo>
          {dados.documentos.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2 border-b border-hair py-2">
              <span className="text-sm font-body text-primary min-w-0">{d.titulo}</span>
              <button type="button" onClick={() => abrirDocumento(d)} className="btn btn-ghost flex-shrink-0" style={{ fontSize: 12 }}>{t('abrir')}</button>
            </div>
          ))}
          <Mensagens a={acaoDoc} />
        </div>
      )}

      {conta && (
        <div className="flex flex-col gap-2">
          <Titulo>{t('perfil')}</Titulo>
          <FormField label={t('telefone')}><input value={perfil.phone} inputMode="tel" onChange={(e) => setPerfil({ ...perfil, phone: e.target.value })} className="input-field" /></FormField>
          <FormField label="Email"><input value={perfil.email} inputMode="email" onChange={(e) => setPerfil({ ...perfil, email: e.target.value })} className="input-field" /></FormField>
          <Mensagens a={acaoPerfil} />
          <button type="button" disabled={acaoPerfil.aEnviar} onClick={() => acaoPerfil.enviar('atualizar_perfil', perfil, t('perfil_enviado'))} className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12 }}>{t('enviar')}</button>
        </div>
      )}

      <FormField label={t('idioma')}>
        <select value={idioma} onChange={(e) => mudar(e.target.value)} className="input-field">{Object.entries(IDIOMAS).map(([k, r]) => <option key={k} value={k}>{r}</option>)}</select>
      </FormField>
      {conta && <Notificacoes invocar={invocar} />}
      <p className="text-xs font-body text-faint" style={{ margin: 0 }}>{t('dados_ajuda')}</p>
    </div>
  );
}
