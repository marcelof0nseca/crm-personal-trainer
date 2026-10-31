// Páginas públicas (`?p=<slug>`): montam-se antes de qualquer hook do treinador e só
// falam com a função `publico`. Sem sessão, sem blocos da conta.
import { useEffect, useRef, useState } from 'react';
import { FormField } from '../../components/UiAtoms';
import Turnstile from '../../components/Turnstile';
import { supabase, supabaseConfigured } from '../../supabaseClient';
import { IDIOMAS, useIdioma } from '../i18n';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

async function chamar(corpo) {
  if (!supabaseConfigured || !supabase) return { ok: false, erro: null };
  const { data, error } = await supabase.functions.invoke('publico', { body: corpo });
  if (error) {
    try {
      const c = error.context && typeof error.context.json === 'function' ? await error.context.json() : null;
      if (c && c.error) return { ok: false, erro: c.error };
    } catch { /* resposta sem JSON */ }
    return { ok: false, erro: null };
  }
  return data && data.error ? { ok: false, erro: data.error } : { ok: true, ...data };
}

const chaveParticipante = (slug) => `ptmanager:desafio:${slug}`;
function lerParticipante(slug) {
  try { return JSON.parse(localStorage.getItem(chaveParticipante(slug))) || null; } catch { return null; }
}
function gravarParticipante(slug, v) {
  try { localStorage.setItem(chaveParticipante(slug), JSON.stringify(v)); } catch { /* sem armazenamento */ }
}

function Formulario({ slug, pagina, onInscrito }) {
  const { t } = useIdioma();
  const [f, setF] = useState({ nome: '', email: '', telefone: '', mensagem: '', empresa: '', consentimento: false });
  const [turnstile, setTurnstile] = useState('');
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState('');
  const [feito, setFeito] = useState(false);
  const montado = useRef(true);
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);
  async function enviar() {
    if (!turnstile) { setErro(t('pub_protecao')); return; }
    setAEnviar(true); setErro('');
    const r = await chamar({ op: 'enviar', slug, turnstile, dados: f });
    if (!montado.current) return;
    setAEnviar(false);
    if (!r.ok) { setErro(r.erro || t('pub_erro')); return; }
    if (r.participante) onInscrito(r.participante);
    setFeito(true);
  }
  if (feito) return <p className="text-sm font-body" role="status" style={{ margin: 0, color: 'var(--ok)' }}>{t('pub_enviado')}</p>;
  return (
    <div className="card p-4 flex flex-col gap-3">
      <FormField label={t('pub_nome')}><input value={f.nome} maxLength={120} autoComplete="name" onChange={(e) => setF({ ...f, nome: e.target.value })} className="input-field" /></FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <FormField label={t('pub_email')}><input value={f.email} type="email" autoComplete="email" onChange={(e) => setF({ ...f, email: e.target.value })} className="input-field" /></FormField>
        <FormField label={t('pub_tel')}><input value={f.telefone} inputMode="tel" autoComplete="tel" onChange={(e) => setF({ ...f, telefone: e.target.value })} className="input-field" /></FormField>
      </div>
      <FormField label={t('pub_msg')}><textarea rows={2} maxLength={500} value={f.mensagem} onChange={(e) => setF({ ...f, mensagem: e.target.value })} className="input-field" /></FormField>
      {/* Invisível para as pessoas: quem o preenche é um robô. */}
      <input tabIndex={-1} aria-hidden="true" autoComplete="off" value={f.empresa} onChange={(e) => setF({ ...f, empresa: e.target.value })} style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
      {pagina.consentimento && <p className="text-xs font-body text-muted" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{pagina.consentimento}</p>}
      <label className="flex items-start gap-2 text-sm font-body text-primary"><input type="checkbox" checked={f.consentimento} onChange={(e) => setF({ ...f, consentimento: e.target.checked })} style={{ marginTop: 3 }} /> {t('pub_consent')}</label>
      {SITE_KEY && <Turnstile siteKey={SITE_KEY} onVerify={setTurnstile} />}
      {erro && <p className="text-xs font-body" role="alert" style={{ margin: 0, color: 'var(--rust)' }}>{erro}</p>}
      <button type="button" disabled={aEnviar || !f.nome.trim() || !f.consentimento} onClick={enviar} className="btn btn-primary" style={{ alignSelf: 'flex-start', opacity: f.nome.trim() && f.consentimento ? 1 : 0.45 }}>{pagina.cta || t('pub_enviar')}</button>
    </div>
  );
}

function Etapas({ slug, pagina, participante, feitas, onConcluir }) {
  const { t } = useIdioma();
  const [erro, setErro] = useState('');
  const [token, setToken] = useState('');
  async function concluir(e) {
    if (!token) { setErro(t('pub_protecao')); return; }
    setErro('');
    const r = await chamar({ op: 'enviar', slug, turnstile: token, dados: { op: 'concluir', participante, etapa: e.id } });
    // Cada token do Turnstile só serve uma vez: pede-se outro para a etapa seguinte.
    setToken('');
    if (r.ok) onConcluir(e.id); else setErro(r.erro || t('pub_erro'));
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-body text-muted" style={{ margin: 0 }}>{t('pub_inscrito')}</p>
      {(pagina.etapas || []).map((e) => (
        <div key={e.id} className="card p-3 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-sm font-body text-primary min-w-0">{e.titulo}</span>
          {feitas.includes(e.id) ? <span className="text-xs font-body" style={{ color: 'var(--ok)' }}>{t('pub_concluido')}</span> : <button type="button" onClick={() => concluir(e)} className="btn btn-ghost flex-shrink-0" style={{ fontSize: 12 }}>{t('pub_concluir')}</button>}
        </div>
      ))}
      {SITE_KEY && !token && <Turnstile siteKey={SITE_KEY} onVerify={setToken} />}
      {erro && <p className="text-xs font-body" role="alert" style={{ margin: 0, color: 'var(--rust)' }}>{erro}</p>}
    </div>
  );
}

export default function PaginaPublica({ slug }) {
  const { t, data, idioma, mudar } = useIdioma();
  const [estado, setEstado] = useState('a-carregar');
  const [pagina, setPagina] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [part, setPart] = useState(() => lerParticipante(slug));
  async function ler() {
    setEstado('a-carregar');
    const r = await chamar({ op: 'ver', slug });
    if (r.ok) { setPagina(r.pagina); setEstado('ok'); document.title = r.pagina.titulo || 'PTMANAGER'; } else { setMensagem(r.erro || ''); setEstado('erro'); }
  }
  useEffect(() => { ler(); }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (estado === 'a-carregar') return <main className="px-4 py-10 max-w-2xl mx-auto"><p className="text-sm font-body text-faint" role="status">{t('pub_carregar')}</p></main>;
  if (estado === 'erro') {
    return (
      <main className="px-4 py-10 max-w-2xl mx-auto flex flex-col gap-3">
        <p className="text-sm font-body text-primary" role="alert" style={{ margin: 0 }}>{mensagem || t('pub_erro')}</p>
        {!mensagem && <button type="button" onClick={ler} className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12 }}>{t('tentar')}</button>}
      </main>
    );
  }
  const whats = pagina.whatsapp ? `https://wa.me/${String(pagina.whatsapp).replace(/\D/g, '').replace(/^(\d{9})$/, '351$1')}` : '';
  return (
    <main className="px-4 py-8 max-w-2xl mx-auto flex flex-col gap-5" style={{ minHeight: '100dvh' }}>
      <header className="flex flex-col gap-2">
        <h1 className="font-display font-semibold text-2xl text-primary" style={{ margin: 0 }}>{pagina.titulo}</h1>
        {pagina.subtitulo && <p className="text-base font-body text-muted" style={{ margin: 0 }}>{pagina.subtitulo}</p>}
        {(pagina.inicio || pagina.fim) && <p className="text-xs font-body text-faint" style={{ margin: 0 }}>{pagina.inicio ? `${t('pub_inicio')} ${data(pagina.inicio)}` : ''}{pagina.inicio && pagina.fim ? ' · ' : ''}{pagina.fim ? `${t('pub_fim')} ${data(pagina.fim)}` : ''}</p>}
      </header>
      {pagina.descricao && <p className="text-sm font-body text-primary" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{pagina.descricao}</p>}
      {pagina.beneficios.length > 0 && <ul className="text-sm font-body text-primary flex flex-col gap-1" style={{ margin: 0, paddingLeft: 18 }}>{pagina.beneficios.map((b) => <li key={b}>{b}</li>)}</ul>}
      {pagina.planos.length > 0 && (
        <section className="flex flex-col gap-2" aria-label={t('pub_planos')}>
          {pagina.planos.map((p) => (
            <div key={p.nome} className="card p-3 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 flex-wrap"><span className="text-sm font-body text-primary" style={{ fontWeight: 600 }}>{p.nome}</span><span className="font-mono text-sm text-primary">{p.preco}</span></div>
              {p.descricao && <p className="text-xs font-body text-muted" style={{ margin: 0 }}>{p.descricao}</p>}
            </div>
          ))}
        </section>
      )}
      {pagina.regras && <section className="flex flex-col gap-1"><h2 className="text-2xs uppercase tracking-wide text-faint font-mono" style={{ margin: 0 }}>{t('pub_regras')}</h2><p className="text-sm font-body text-muted" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{pagina.regras}</p></section>}
      {pagina.depoimentos.length > 0 && (
        <section className="flex flex-col gap-2" aria-label={t('pub_depoimentos')}>
          {pagina.depoimentos.map((d) => <blockquote key={d.texto} className="text-sm font-body text-muted" style={{ margin: 0 }}>«{d.texto}»{d.autor ? <footer className="text-xs text-faint">{d.autor}</footer> : null}</blockquote>)}
        </section>
      )}
      {pagina.tipo === 'desafio' && part ? (
        <Etapas slug={slug} pagina={pagina} participante={part.id} feitas={part.feitas || []} onConcluir={(id) => { const n = { ...part, feitas: [...(part.feitas || []), id] }; setPart(n); gravarParticipante(slug, n); }} />
      ) : (
        pagina.comFormulario && <Formulario slug={slug} pagina={pagina} onInscrito={(id) => { const n = { id, feitas: [] }; setPart(n); gravarParticipante(slug, n); }} />
      )}
      {whats && <a href={whats} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12 }}>{t('pub_whats')}</a>}
      <footer className="flex items-center justify-between gap-2 flex-wrap border-t border-hair pt-3">
        <span className="text-2xs font-body text-faint">PTMANAGER</span>
        <select value={idioma} aria-label={t('idioma')} onChange={(e) => mudar(e.target.value)} className="input-field" style={{ width: 130 }}>{Object.entries(IDIOMAS).map(([k, r]) => <option key={k} value={k}>{r}</option>)}</select>
      </footer>
    </main>
  );
}
