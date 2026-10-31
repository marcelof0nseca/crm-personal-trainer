// Página de vendas, inscrição pública, indicações e imagens para redes sociais. O que
// se publica é um retrato do que está aqui: a página pública não lê mais nada.
import { useEffect, useRef, useState } from 'react';
import { FormField } from '../../components/UiAtoms';
import { useModulo } from '../useModulo';
import { Abas, Aviso, ProntoOu, Titulo, Vazio, alunosAtuais, nomeDoAluno, uid } from '../comum';
import { despublicar, ligacaoPublica, publicar, temServidor } from '../servidor';
import { formatar } from '../planos/logica';

const PAGINA_VAZIA = { titulo: '', subtitulo: '', sobre: '', beneficios: '', cta: 'Quero saber mais', whatsapp: '', planosIds: [], consentimento: '', slug: '', publicada: false };

function retrato(p, planos, depoimentos) {
  return {
    titulo: p.titulo, subtitulo: p.subtitulo, sobre: p.sobre, beneficios: String(p.beneficios || '').split('\n').map((x) => x.trim()).filter(Boolean), cta: p.cta, whatsapp: p.whatsapp, consentimento: p.consentimento,
    planos: planos.filter((x) => (p.planosIds || []).includes(x.id)).map((x) => ({ nome: x.nome, descricao: x.descricao, preco: formatar(x.centimos, x.moeda), cadencia: x.cadencia })),
    depoimentos: depoimentos.filter((d) => d.autorizado).map((d) => ({ texto: d.texto, autor: d.autor })),
  };
}

function Pagina({ vendas, planos, showToast }) {
  const p = { ...PAGINA_VAZIA, ...(vendas.valor.pagina || {}) };
  const mudar = (c) => vendas.gravar((v) => ({ ...v, pagina: { ...p, ...c } }));
  const faltas = [!p.titulo.trim() && 'um título', !p.consentimento.trim() && 'o texto de consentimento'].filter(Boolean);
  async function publicarPagina() {
    const r = await publicar({ slug: p.slug, tipo: 'vendas', ref: 'pagina', dados: retrato(p, planos, vendas.valor.depoimentos || []) });
    if (r.ok) { await mudar({ slug: r.slug, publicada: true }); showToast('Página publicada.'); } else showToast(r.erro, 'error');
  }
  return (
    <div className="flex flex-col gap-3">
      <FormField label="Título"><input value={p.titulo} maxLength={90} onChange={(e) => mudar({ titulo: e.target.value })} className="input-field" /></FormField>
      <FormField label="Subtítulo"><input value={p.subtitulo} maxLength={160} onChange={(e) => mudar({ subtitulo: e.target.value })} className="input-field" /></FormField>
      <FormField label="Sobre si"><textarea rows={3} maxLength={1200} value={p.sobre} onChange={(e) => mudar({ sobre: e.target.value })} className="input-field" /></FormField>
      <FormField label="Benefícios (um por linha)"><textarea rows={3} maxLength={800} value={p.beneficios} onChange={(e) => mudar({ beneficios: e.target.value })} className="input-field" /></FormField>
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Texto do botão"><input value={p.cta} maxLength={40} onChange={(e) => mudar({ cta: e.target.value })} className="input-field" /></FormField>
        <FormField label="WhatsApp (opcional)"><input value={p.whatsapp} inputMode="tel" onChange={(e) => mudar({ whatsapp: e.target.value })} className="input-field" /></FormField>
      </div>
      <Titulo>Planos a mostrar</Titulo>
      {planos.length === 0 && <Vazio>Crie planos em Planos e faturas.</Vazio>}
      {planos.map((x) => <label key={x.id} className="flex items-center gap-2 text-sm font-body text-primary"><input type="checkbox" checked={(p.planosIds || []).includes(x.id)} onChange={(e) => mudar({ planosIds: e.target.checked ? [...p.planosIds, x.id] : p.planosIds.filter((i) => i !== x.id) })} /> {x.nome} · {formatar(x.centimos, x.moeda)}</label>)}
      <FormField label="Consentimento do formulário (obrigatório)"><textarea rows={2} maxLength={800} value={p.consentimento} onChange={(e) => mudar({ consentimento: e.target.value })} className="input-field" placeholder="Para que usa os dados de quem preenche, e como pedir para os apagar." /></FormField>
      {faltas.length > 0 && <Aviso>Para publicar, falta {faltas.join(' e ')}.</Aviso>}
      {!temServidor() && <Aviso>Publicar precisa da conta ligada ao servidor.</Aviso>}
      {p.publicada && p.slug && <input readOnly value={ligacaoPublica(p.slug)} aria-label="Ligação da página" className="input-field" onFocus={(e) => e.target.select()} />}
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={publicarPagina} disabled={faltas.length > 0 || !temServidor()} className="btn btn-primary" style={{ opacity: faltas.length === 0 && temServidor() ? 1 : 0.45 }}>{p.publicada ? 'Publicar alterações' : 'Publicar'}</button>
        {p.publicada && <button type="button" onClick={async () => { if (await despublicar(p.slug)) mudar({ publicada: false }); }} className="btn btn-ghost" style={{ fontSize: 12 }}>Retirar do ar</button>}
      </div>
      <p className="text-xs font-body text-faint" style={{ margin: 0 }}>O que muda aqui só chega à página quando publicar de novo.</p>
    </div>
  );
}

function Depoimentos({ vendas, students }) {
  const lista = vendas.valor.depoimentos || [];
  const mudar = (id, c) => vendas.gravar((v) => ({ ...v, depoimentos: v.depoimentos.map((x) => (x.id === id ? { ...x, ...c } : x)) }));
  return (
    <div className="flex flex-col gap-3">
      <Aviso>Só aparece na página um depoimento com a autorização confirmada. O texto tem de ser real: não escreva depoimentos em nome de ninguém.</Aviso>
      <button type="button" onClick={() => vendas.gravar((v) => ({ ...v, depoimentos: [...(v.depoimentos || []), { id: uid(), texto: '', autor: '', autorizado: false }] }))} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Novo depoimento</button>
      {lista.length === 0 && <Vazio>Sem depoimentos.</Vazio>}
      {lista.map((d) => (
        <div key={d.id} className="card p-3 flex flex-col gap-2">
          <FormField label="Texto"><textarea rows={2} maxLength={400} value={d.texto} onChange={(e) => mudar(d.id, { texto: e.target.value })} className="input-field" /></FormField>
          <FormField label="Nome a mostrar"><input value={d.autor} maxLength={60} list="vendas-alunos" onChange={(e) => mudar(d.id, { autor: e.target.value })} className="input-field" /></FormField>
          <datalist id="vendas-alunos">{alunosAtuais(students).map((s) => <option key={s.id} value={s.name} />)}</datalist>
          <label className="flex items-center gap-2 text-sm font-body text-primary"><input type="checkbox" checked={d.autorizado} onChange={(e) => mudar(d.id, { autorizado: e.target.checked, autorizadoEm: e.target.checked ? new Date().toISOString() : null })} /> Esta pessoa autorizou a publicação</label>
          <button type="button" onClick={() => vendas.gravar((v) => ({ ...v, depoimentos: v.depoimentos.filter((x) => x.id !== d.id) }))} className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12 }}>Apagar</button>
        </div>
      ))}
    </div>
  );
}

function Ligacoes({ vendas, students, showToast }) {
  const lig = vendas.valor.ligacaoInscricao || null;
  const [consent, setConsent] = useState(lig?.consentimento || '');
  const [aluno, setAluno] = useState('');
  const indicacoes = vendas.valor.indicacoes || [];
  async function criarInscricao() {
    const r = await publicar({ slug: lig?.slug, tipo: 'inscricao', ref: 'autocadastro', dados: { titulo: 'Inscrição', consentimento: consent } });
    if (r.ok) { await vendas.gravar((v) => ({ ...v, ligacaoInscricao: { slug: r.slug, consentimento: consent, ativa: true } })); showToast('Ligação criada.'); } else showToast(r.erro, 'error');
  }
  async function criarIndicacao() {
    const r = await publicar({ tipo: 'indicacao', ref: aluno, dados: { titulo: 'Recebeu uma indicação', consentimento: consent } });
    if (r.ok) { await vendas.gravar((v) => ({ ...v, indicacoes: [...(v.indicacoes || []), { id: uid(), studentId: aluno, slug: r.slug, ativa: true }] })); setAluno(''); } else showToast(r.erro, 'error');
  }
  return (
    <div className="flex flex-col gap-3">
      {!temServidor() && <Aviso>As ligações precisam da conta ligada ao servidor.</Aviso>}
      <FormField label="Consentimento mostrado nos formulários (obrigatório)"><textarea rows={2} maxLength={800} value={consent} onChange={(e) => setConsent(e.target.value)} className="input-field" /></FormField>
      <Titulo>Inscrição de novos alunos</Titulo>
      <p className="text-xs font-body text-muted" style={{ margin: 0 }}>Quem preencher entra nos contactos, à espera da sua decisão. Nunca vira aluno sozinho.</p>
      {lig?.ativa && <input readOnly value={ligacaoPublica(lig.slug)} aria-label="Ligação de inscrição" className="input-field" onFocus={(e) => e.target.select()} />}
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={criarInscricao} disabled={!consent.trim() || !temServidor()} className="btn btn-primary" style={{ fontSize: 12, opacity: consent.trim() && temServidor() ? 1 : 0.45 }}>{lig?.ativa ? 'Atualizar ligação' : 'Criar ligação'}</button>
        {lig?.ativa && <button type="button" onClick={async () => { if (await despublicar(lig.slug)) vendas.gravar((v) => ({ ...v, ligacaoInscricao: { ...lig, ativa: false } })); }} className="btn btn-ghost" style={{ fontSize: 12 }}>Desligar</button>}
      </div>
      <Titulo>Indicações</Titulo>
      <div className="flex gap-2 flex-wrap">
        <select value={aluno} aria-label="Aluno que indica" onChange={(e) => setAluno(e.target.value)} className="input-field" style={{ flex: '1 1 180px', minWidth: 0 }}><option value="">Aluno que indica...</option>{alunosAtuais(students).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <button type="button" onClick={criarIndicacao} disabled={!aluno || !consent.trim() || !temServidor()} className="btn btn-ghost" style={{ fontSize: 12, opacity: aluno && consent.trim() && temServidor() ? 1 : 0.45 }}>Criar ligação</button>
      </div>
      {indicacoes.length === 0 && <Vazio>Sem ligações de indicação.</Vazio>}
      {indicacoes.map((i) => (
        <div key={i.id} className="flex flex-col gap-1">
          <span className="text-xs font-body text-muted">{nomeDoAluno(students, i.studentId)}{i.ativa ? '' : ' · desligada'}</span>
          {i.ativa && <div className="flex gap-2"><input readOnly value={ligacaoPublica(i.slug)} aria-label={`Ligação de ${nomeDoAluno(students, i.studentId)}`} className="input-field" style={{ flex: 1, minWidth: 0 }} onFocus={(e) => e.target.select()} /><button type="button" onClick={async () => { if (await despublicar(i.slug)) vendas.gravar((v) => ({ ...v, indicacoes: v.indicacoes.map((x) => (x.id === i.id ? { ...x, ativa: false } : x)) })); }} className="btn btn-ghost flex-shrink-0" style={{ fontSize: 12 }}>Desligar</button></div>}
        </div>
      ))}
      <p className="text-xs font-body text-faint" style={{ margin: 0 }}>O prémio de uma indicação decide-se e dá-se à mão: nada é pago ou creditado sozinho.</p>
    </div>
  );
}

const FORMATOS = { quadrado: { rotulo: 'Publicação (1080 × 1080)', w: 1080, h: 1080 }, historia: { rotulo: 'História (1080 × 1920)', w: 1080, h: 1920 } };
const PALETAS = { petroleo: ['#0B1A1E', '#2DD4BF', '#F4F4F5'], areia: ['#F5EFE6', '#0F766E', '#1C1917'], grafite: ['#18181B', '#EAB308', '#FAFAFA'] };

function partirLinhas(ctx, texto, largura) {
  const linhas = [];
  String(texto || '').split('\n').forEach((par) => {
    let atual = '';
    par.split(/\s+/).forEach((p) => {
      const t = atual ? `${atual} ${p}` : p;
      if (ctx.measureText(t).width > largura && atual) { linhas.push(atual); atual = p; } else atual = t;
    });
    linhas.push(atual);
  });
  return linhas;
}

// Modelos genéricos, desenhados de raiz: sem imagens nem frases de terceiros.
function Imagens({ marca }) {
  const [f, setF] = useState({ titulo: '', texto: '', assinatura: marca || '', formato: 'quadrado', paleta: 'petroleo' });
  const canvas = useRef(null);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const { w, h } = FORMATOS[f.formato];
    c.width = w; c.height = h;
    const [fundo, acento, tinta] = PALETAS[f.paleta];
    const x = c.getContext('2d');
    x.fillStyle = fundo; x.fillRect(0, 0, w, h);
    x.fillStyle = acento; x.fillRect(90, 90, 120, 12);
    x.fillStyle = tinta; x.textBaseline = 'top';
    x.font = '700 92px system-ui, sans-serif';
    let y = 150;
    partirLinhas(x, f.titulo || 'O seu título', w - 180).forEach((l) => { x.fillText(l, 90, y); y += 108; });
    y += 30;
    x.globalAlpha = 0.85; x.font = '400 46px system-ui, sans-serif';
    partirLinhas(x, f.texto, w - 180).forEach((l) => { x.fillText(l, 90, y); y += 62; });
    x.globalAlpha = 1; x.fillStyle = acento; x.font = '600 40px system-ui, sans-serif';
    x.fillText(f.assinatura, 90, h - 140);
  }, [f]);
  function descarregarImagem() {
    canvas.current.toBlob((b) => { const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `imagem-${f.formato}.png`; a.click(); URL.revokeObjectURL(u); }, 'image/png');
  }
  return (
    <div className="flex flex-col gap-3">
      <FormField label="Título"><input value={f.titulo} maxLength={70} onChange={(e) => setF({ ...f, titulo: e.target.value })} className="input-field" /></FormField>
      <FormField label="Texto"><textarea rows={2} maxLength={240} value={f.texto} onChange={(e) => setF({ ...f, texto: e.target.value })} className="input-field" /></FormField>
      <FormField label="Assinatura"><input value={f.assinatura} maxLength={50} onChange={(e) => setF({ ...f, assinatura: e.target.value })} className="input-field" /></FormField>
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Formato"><select value={f.formato} onChange={(e) => setF({ ...f, formato: e.target.value })} className="input-field">{Object.entries(FORMATOS).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}</select></FormField>
        <FormField label="Cores"><select value={f.paleta} onChange={(e) => setF({ ...f, paleta: e.target.value })} className="input-field"><option value="petroleo">Petróleo</option><option value="areia">Areia</option><option value="grafite">Grafite</option></select></FormField>
      </div>
      <canvas ref={canvas} aria-label="Pré-visualização da imagem" className="rounded-lg border border-hair" style={{ width: f.formato === 'quadrado' ? 280 : 200, height: 'auto', maxWidth: '100%' }} />
      <button type="button" onClick={descarregarImagem} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Descarregar PNG</button>
    </div>
  );
}

export default function Vendas({ students, showToast, definicoes }) {
  const vendas = useModulo('vendas');
  const planos = useModulo('planos');
  const [aba, setAba] = useState('pagina');
  return (
    <ProntoOu modulos={[vendas, planos]}>{() => (
      <div className="flex flex-col gap-3">
        <Abas valor={aba} onMudar={setAba} abas={[{ id: 'pagina', rotulo: 'Página de vendas' }, { id: 'depoimentos', rotulo: 'Depoimentos' }, { id: 'ligacoes', rotulo: 'Inscrição e indicações' }, { id: 'imagens', rotulo: 'Imagens' }]} />
        {aba === 'pagina' && <Pagina vendas={vendas} planos={(planos.valor.modelos || []).filter((p) => p.ativo !== false)} showToast={showToast} />}
        {aba === 'depoimentos' && <Depoimentos vendas={vendas} students={students} />}
        {aba === 'ligacoes' && <Ligacoes vendas={vendas} students={students} showToast={showToast} />}
        {aba === 'imagens' && <Imagens marca={definicoes?.timbre?.estudio || ''} />}
      </div>
    )}</ProntoOu>
  );
}
