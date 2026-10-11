// A área do aluno: um shell próprio, fora da app do treinador -- ver
// CLAUDE.md, secção 4 ("Área do aluno"). O aluno entra por um link com
// token (`?a=...`), nunca por conta Supabase própria; `App()` (painel-pt.tsx)
// renderiza isto EM VEZ de `AppInner` quando a URL tem o token, antes de
// qualquer hook de autenticação do treinador sequer montar.
//
// Nunca importa nada de painel-pt.tsx (a direção é sempre a mesma dos outros
// `*Atoms.tsx`: painel-pt.tsx importa daqui, nunca o contrário) -- só de
// TreinoAtoms.tsx e de src/data, os mesmos componentes e lógica reais que o
// treinador usa, não uma reprodução.
//
// O registo da sessão NÃO reaproveita o `RegistarSessao` do treinador -- essa
// extração arrastaria uma dúzia de funções/componentes entrelaçados de
// painel-pt.tsx (alguns usados em dezenas de sítios sem relação nenhuma),
// um refactor grande e arriscado num componente que o treinador já usa ao
// vivo (decisão tomada com o dono do produto). Em vez disso, o aluno tem um
// formulário de registo próprio, mais simples -- mas reaproveita 100% da
// lógica pura já testada em src/data/sessoes.ts (a mesma que o treinador
// usa) e a mesma forma de sessão gravada, por isso o histórico e o resumo do
// treinador leem as sessões do aluno exatamente como as dele próprias.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { supabase, supabaseConfigured } from '../supabaseClient';
import { CAMPO_SERIE, ExercicioVista, descreverLinha, tipoDeSerie } from './TreinoAtoms';
import {
  VERSAO_RASCUNHO, camposRealizaveis, chaveRascunho, construirItens,
  lerRascunho, normalizarSessaoRealizada, ordenarSessoes, resumoDaSessao, temSintomas,
  ultimaVezDoExercicio, valoresSugeridos,
} from '../data/sessoes';

function horaDeMs(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function dataDeHoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dataCurta(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}
function novoId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Erro de `supabase.functions.invoke`: um estado HTTP que não seja 2xx chega
// em `error`, não em `data` -- o corpo (`{ error: '...' }`) só se lê pelo
// `context`, a Response original. Sem isto, qualquer falha mostrava sempre a
// mesma mensagem genérica, nunca a razão a sério do servidor (ver aluno-view,
// o mesmo problema apanhado a testar a fase anterior).
async function mensagemDeErro(error, data, omissao) {
  if (error) {
    try {
      const corpo = error.context && typeof error.context.json === 'function' ? await error.context.json() : null;
      if (corpo && corpo.error) return corpo.error;
    } catch {
      // Resposta sem JSON -- fica a mensagem por omissão.
    }
    return omissao;
  }
  return (data && data.error) || omissao;
}

function Ecra({ children }) {
  return (
    <div
      className="px-4 py-4 max-w-3xl mx-auto flex flex-col gap-4"
      style={{ minHeight: '100dvh' }}
    >
      {children}
    </div>
  );
}

function EcraCentrado({ children }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="flex flex-col items-center gap-3 text-center" style={{ maxWidth: 340 }}>
        {children}
      </div>
    </div>
  );
}

function ListaDeProgramas({ prescricoes, onAbrir }) {
  if (prescricoes.length === 0) {
    return (
      <p className="text-sm font-body text-faint">
        Ainda não há nenhum programa de treino atribuído. Fale com o seu treinador.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-2xs uppercase tracking-wide text-faint font-mono">Os seus programas</h2>
      {prescricoes.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onAbrir(p.id)}
          className="card text-left btn-surface flex flex-col gap-0.5"
        >
          <span className="text-sm font-body text-primary" style={{ fontWeight: 600 }}>
            {p.nome || 'Programa de treino'}
          </span>
          {p.objetivo && <span className="text-2xs font-body text-faint">{p.objetivo}</span>}
        </button>
      ))}
    </div>
  );
}

/* ============================== registar a sessão ============================== */

// Uma linha de série a registar: o texto prescrito, os campos que esta série
// pede (`camposRealizaveis`, a mesma lista que o treinador usa) e o ✓. Os
// campos a 16px -- não os 13px do `CargaDaSerie` da prescrição -- senão o
// iOS aproxima a página ao tocar (armadilha já apanhada no registo do
// treinador, CLAUDE.md secção 6).
function LinhaRegisto({ linha, indice, estado, onMudarCampo, onAlternar }) {
  const campos = camposRealizaveis(tipoDeSerie(linha.tipo).campos, linha);
  const feito = Boolean(estado.feito);
  const texto = descreverLinha(linha);
  return (
    <div className="flex flex-col gap-1.5 py-2" style={{ borderTop: indice === 0 ? 'none' : '1px solid var(--border-hair)' }}>
      <span className="text-xs font-body text-muted min-w-0">
        <span className="font-mono text-2xs text-faint">Série {indice + 1}</span>{texto ? ` · ${texto}` : ''}
      </span>
      <div className="flex items-end gap-2 flex-wrap">
        {campos.length > 0 ? campos.map((campo) => (
          <div key={campo} className="flex flex-col gap-1" style={{ minWidth: 70, flex: '1 1 70px' }}>
            <span className="text-2xs font-body text-faint">{CAMPO_SERIE[campo] ? CAMPO_SERIE[campo][0] : campo}</span>
            <input
              value={(estado.v && estado.v[campo]) || ''}
              onChange={(e) => onMudarCampo(campo, e.target.value)}
              inputMode={campo === 'reps' || campo === 'carga' || campo === 'rir' || campo === 'rpe' ? 'decimal' : 'text'}
              enterKeyHint="next"
              aria-label={`${CAMPO_SERIE[campo] ? CAMPO_SERIE[campo][0] : campo} da série ${indice + 1}`}
              className="input-field font-mono"
              style={{ fontSize: 16 }}
            />
          </div>
        )) : <span className="flex-1 text-xs font-body text-faint">Só observação.</span>}
        <button
          type="button"
          onClick={onAlternar}
          aria-pressed={feito}
          aria-label={`Série ${indice + 1}: ${feito ? 'feita' : 'por fazer'}`}
          className="flex-shrink-0 rounded-lg border flex items-center justify-center"
          style={{
            width: 48, height: 48,
            borderColor: feito ? 'var(--brass)' : 'var(--border-strong)',
            backgroundColor: feito ? 'var(--brass)' : 'transparent',
            color: feito ? 'var(--on-accent)' : 'var(--text-faint)',
          }}
        >
          <Check size={22} style={{ display: 'block' }} />
        </button>
      </div>
    </div>
  );
}

function ExercicioRegisto({ ex, estado, ultima, onMudar }) {
  const linhas = Array.isArray(ex.linhas) ? ex.linhas : [];
  const saltado = Boolean(estado.saltado);

  function mudarCampo(linha, campo, valor) {
    onMudar((it) => {
      const s = (it.series && it.series[linha.id]) || {};
      const v = { ...(s.v || {}) };
      if (valor === '') delete v[campo]; else v[campo] = valor;
      return { ...it, series: { ...(it.series || {}), [linha.id]: { ...s, v } } };
    });
  }
  function alternar(linha, campos) {
    onMudar((it) => {
      const s = (it.series && it.series[linha.id]) || {};
      if (s.feito) return { ...it, series: { ...(it.series || {}), [linha.id]: { ...s, feito: false } } };
      return { ...it, saltado: false, series: { ...(it.series || {}), [linha.id]: { feito: true, v: { ...valoresSugeridos(linha, campos), ...(s.v || {}) } } } };
    });
  }

  return (
    <div className="rounded-lg px-3 py-2.5 flex flex-col gap-1 min-w-0" style={{ backgroundColor: 'var(--bg-elevated)', opacity: saltado ? 0.6 : 1 }}>
      <span className="font-body text-sm text-primary" style={{ fontWeight: 600 }}>{ex.nome || 'Exercício'}</span>
      {ultima && (
        <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>
          Última vez ({dataCurta(ultima.data)}): {ultima.series.slice(0, 4).join(' · ')}
        </p>
      )}
      {saltado ? (
        <p className="text-xs font-body text-muted" style={{ margin: '6px 0' }}>Exercício saltado.</p>
      ) : (
        <div className="flex flex-col min-w-0">
          {linhas.map((linha, i) => (
            <LinhaRegisto
              key={linha.id}
              linha={linha}
              indice={i}
              estado={(estado.series && estado.series[linha.id]) || {}}
              onMudarCampo={(campo, valor) => mudarCampo(linha, campo, valor)}
              onAlternar={() => alternar(linha, camposRealizaveis(tipoDeSerie(linha.tipo).campos, linha))}
            />
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => onMudar((it) => ({ ...it, saltado: !it.saltado }))}
        className="text-2xs font-body link-sky tap self-start"
      >
        {saltado ? 'Fazer este exercício' : 'Saltar exercício'}
      </button>
    </div>
  );
}

function FechoDaSessao({ duracaoSugerida, aGuardar, erro, onGuardar, onVoltar }) {
  const [f, setF] = useState(() => ({
    data: dataDeHoje(), duracaoMin: String(Math.max(1, duracaoSugerida)), esforco: '',
    durante: '', depois: '', interrompida: false, motivo: '', notas: '',
  }));
  function mudar(campo, valor) { setF((x) => ({ ...x, [campo]: valor })); }
  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={onVoltar} className="btn btn-ghost self-start" style={{ fontSize: 12 }}>← Voltar às séries</button>
      <h2 className="font-display font-semibold text-lg text-primary tracking-wide">Terminar sessão</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-2xs font-body text-faint">Data</span>
          <input type="date" value={f.data} onChange={(e) => mudar('data', e.target.value)} required className="input-field" style={{ fontSize: 16 }} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-2xs font-body text-faint">Duração (min)</span>
          <input inputMode="numeric" value={f.duracaoMin} onChange={(e) => mudar('duracaoMin', e.target.value)} className="input-field font-mono" style={{ fontSize: 16 }} />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-2xs font-body text-faint">Esforço da sessão (0 = repouso, 10 = máximo)</span>
        <select value={f.esforco} onChange={(e) => mudar('esforco', e.target.value)} className="input-field" style={{ fontSize: 16 }}>
          <option value="">Sem indicar</option>
          {Array.from({ length: 11 }, (_, n) => <option key={n} value={String(n)}>{n}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-2xs font-body text-faint">Sintomas durante o treino (opcional)</span>
        <textarea rows={2} value={f.durante} onChange={(e) => mudar('durante', e.target.value)} className="input-field" style={{ resize: 'vertical', fontSize: 16 }} placeholder="Ex.: dor no ombro direito ao subir" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-2xs font-body text-faint">Sintomas depois (opcional)</span>
        <textarea rows={2} value={f.depois} onChange={(e) => mudar('depois', e.target.value)} className="input-field" style={{ resize: 'vertical', fontSize: 16 }} />
      </label>
      <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>Isto não é um diagnóstico -- só o que notou.</p>

      <label className="flex items-center gap-2 text-sm font-body text-primary">
        <input type="checkbox" checked={f.interrompida} onChange={(e) => mudar('interrompida', e.target.checked)} />
        Interrompi a sessão antes do fim
      </label>
      {f.interrompida && (
        <label className="flex flex-col gap-1">
          <span className="text-2xs font-body text-faint">Motivo</span>
          <input value={f.motivo} onChange={(e) => mudar('motivo', e.target.value)} className="input-field" style={{ fontSize: 16 }} placeholder="Ex.: tontura, falta de tempo" />
        </label>
      )}
      <label className="flex flex-col gap-1">
        <span className="text-2xs font-body text-faint">Notas (opcional)</span>
        <textarea rows={2} value={f.notas} onChange={(e) => mudar('notas', e.target.value)} className="input-field" style={{ resize: 'vertical', fontSize: 16 }} />
      </label>

      {erro && <p className="text-xs font-body" style={{ color: 'var(--rust)' }}>{erro}</p>}

      <button type="button" onClick={() => onGuardar(f)} disabled={aGuardar} className="btn btn-primary">
        {aGuardar ? 'A guardar...' : 'Concluir sessão'}
      </button>
    </div>
  );
}

function RegistoSessaoAluno({ token, student, prescricao, treino, sessoesAnteriores, onConcluido, onVoltar }) {
  const dep = useMemo(() => ({ descreverLinha, camposDoTipo: (l) => tipoDeSerie(l.tipo).campos }), []);
  const chave = useMemo(() => chaveRascunho(student.id, treino.id), [student.id, treino.id]);
  const inicioMsRef = useRef(null);
  const [itens, setItens] = useState(() => {
    try {
      const r = lerRascunho(window.localStorage.getItem(chave));
      if (r) { inicioMsRef.current = r.inicioMs; return r.itens; }
    } catch { /* localStorage indisponível -- começa do zero */ }
    inicioMsRef.current = Date.now();
    return {};
  });
  const [aFechar, setAFechar] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState('');

  // Grava o rascunho neste aparelho a cada mudança (com uma pausa curta) --
  // sobrevive a bloquear o telemóvel ou recarregar, o mesmo que o treinador
  // já tem.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(chave, JSON.stringify({ v: VERSAO_RASCUNHO, inicioMs: inicioMsRef.current, passo: 0, itens }));
      } catch { /* sem localStorage, sem rascunho -- a sessão continua a funcionar */ }
    }, 500);
    return () => clearTimeout(t);
  }, [itens, chave]);

  function atualizarItem(exId, fn) {
    setItens((prev) => ({ ...prev, [exId]: fn(prev[exId] || { series: {} }) }));
  }

  const itensConstruidos = useMemo(() => construirItens(treino, itens, dep), [treino, itens, dep]);
  const minutosDecorridos = Math.max(1, Math.round((Date.now() - (inicioMsRef.current || Date.now())) / 60000));

  async function guardar(f) {
    setAGuardar(true);
    setErro('');
    const sessao = normalizarSessaoRealizada({
      id: novoId(),
      data: f.data,
      inicio: horaDeMs(inicioMsRef.current || Date.now()),
      duracaoMin: f.duracaoMin,
      prescricaoId: prescricao.id,
      prescricaoNome: prescricao.nome,
      treinoId: treino.id,
      treinoNome: treino.nome,
      origem: prescricao.origem || null,
      estado: f.interrompida ? 'interrompida' : 'concluida',
      motivoInterrupcao: f.interrompida ? f.motivo : '',
      esforco: f.esforco,
      sintomas: { durante: f.durante, depois: f.depois },
      notas: f.notas,
      itens: itensConstruidos,
      criadoEm: new Date().toISOString(),
      editadoEm: '',
    });
    try {
      const { data, error } = await supabase.functions.invoke('aluno-registar-sessao', { body: { token, sessao } });
      if (error || !data || data.error) {
        setErro(await mensagemDeErro(error, data, 'Não foi possível guardar. Tente outra vez.'));
        setAGuardar(false);
        return;
      }
      try { window.localStorage.removeItem(chave); } catch { /* nada a limpar */ }
      setAGuardar(false);
      onConcluido();
    } catch {
      setErro('Não foi possível ligar ao servidor.');
      setAGuardar(false);
    }
  }

  if (aFechar) {
    return (
      <FechoDaSessao
        duracaoSugerida={minutosDecorridos}
        aGuardar={aGuardar}
        erro={erro}
        onGuardar={guardar}
        onVoltar={() => setAFechar(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3" style={{ paddingBottom: 96 }}>
      <button type="button" onClick={onVoltar} className="btn btn-ghost self-start" style={{ fontSize: 12 }}>← {prescricao.nome || 'Programa'}</button>
      <h2 className="font-display font-semibold text-lg text-primary tracking-wide">{treino.nome || 'Treino'}</h2>
      <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>
        Marque ✓ em cada série que fizer. O que não tocar fica por fazer -- não há problema em saltar um exercício.
      </p>
      <div className="flex flex-col gap-2">
        {(treino.exercicios || []).map((ex) => (
          <ExercicioRegisto
            key={ex.id}
            ex={ex}
            estado={itens[ex.id] || { series: {} }}
            ultima={ultimaVezDoExercicio(sessoesAnteriores, ex.exercicioId)}
            onMudar={(fn) => atualizarItem(ex.id, fn)}
          />
        ))}
      </div>
      <button type="button" onClick={() => setAFechar(true)} className="btn btn-primary self-start">
        Terminar sessão
      </button>
    </div>
  );
}

function SessaoConcluida({ onVoltar }) {
  return (
    <EcraCentrado>
      <Check size={28} style={{ color: 'var(--brass)' }} />
      <p className="text-sm font-body text-primary" style={{ fontWeight: 600 }}>Sessão registada</p>
      <p className="text-xs font-body text-faint">O seu treinador vai poder ver o que fez.</p>
      <button type="button" onClick={onVoltar} className="btn btn-primary">Voltar ao programa</button>
    </EcraCentrado>
  );
}

/* ============================== histórico (só leitura) ============================== */

// "9 de 12 séries" -- igual ao que o treinador vê, não editável nem
// apagável aqui: isso continua a ser autoridade do treinador (secção 10 do
// plano). Mostra só as sessões DESTE programa, mais recentes primeiro.
function HistoricoDeSessoes({ sessoes, prescricaoId }) {
  const doPrograma = useMemo(
    () => ordenarSessoes(sessoes.filter((s) => s.prescricaoId === prescricaoId)),
    [sessoes, prescricaoId],
  );
  const [abertaId, setAbertaId] = useState(null);

  if (doPrograma.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-2xs uppercase tracking-wide text-faint font-mono">Sessões registadas</h3>
      {doPrograma.map((s) => {
        const resumo = resumoDaSessao(s);
        const aberta = abertaId === s.id;
        return (
          <div key={s.id} className="card flex flex-col gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setAbertaId(aberta ? null : s.id)}
              className="flex items-center justify-between gap-2 text-left btn-surface w-full"
            >
              <span className="min-w-0">
                <span className="block text-sm font-body text-primary" style={{ fontWeight: 600 }}>
                  {dataCurta(s.data)} · {s.treinoNome || 'Treino'}
                </span>
                <span className="block text-2xs font-body text-faint">
                  {resumo.feitas} de {resumo.series} séries
                  {s.esforco !== '' && s.esforco != null ? ` · esforço ${s.esforco}` : ''}
                </span>
              </span>
              <span className="flex gap-1 flex-shrink-0">
                {s.estado === 'interrompida' && (
                  <span className="badge" style={{ color: 'var(--gold)', backgroundColor: 'var(--gold-soft)' }}>interrompida</span>
                )}
                {temSintomas(s) && (
                  <span className="badge" style={{ color: 'var(--gold)', backgroundColor: 'var(--gold-soft)' }}>sintomas</span>
                )}
              </span>
            </button>
            {aberta && (
              <div className="flex flex-col gap-1.5 px-1 pb-1">
                {s.itens.map((it, i) => (
                  <div key={i} className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-body text-primary" style={{ fontWeight: 600 }}>
                      {it.nome}{it.estado === 'saltado' ? ' (saltado)' : it.estado === 'parcial' ? ' (parcial)' : ''}
                    </span>
                    {it.series.filter((x) => x.feito).length > 0 && (
                      <span className="text-2xs font-body text-faint">
                        {it.series.filter((x) => x.feito).map((x) => Object.entries(x.v || {}).map(([k, v]) => `${v}${k === 'carga' ? ' kg' : ''}`).join('×')).filter(Boolean).join(' · ') || '—'}
                      </span>
                    )}
                  </div>
                ))}
                {s.notas && <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>Notas: {s.notas}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================== programa (vista) ============================== */

function ProgramaDoAluno({ student, prescricao, sessoesAnteriores, onVoltar, token }) {
  const treinos = Array.isArray(prescricao.treinos) ? prescricao.treinos : [];
  const [treinoId, setTreinoId] = useState(treinos[0]?.id || null);
  const [modo, setModo] = useState('ver'); // ver | registar | concluido
  const treino = treinos.find((t) => t.id === treinoId) || treinos[0] || null;

  if (treino && modo === 'registar') {
    return (
      <RegistoSessaoAluno
        token={token}
        student={student}
        prescricao={prescricao}
        treino={treino}
        sessoesAnteriores={sessoesAnteriores}
        onConcluido={() => setModo('concluido')}
        onVoltar={() => setModo('ver')}
      />
    );
  }
  if (modo === 'concluido') {
    return <SessaoConcluida onVoltar={() => setModo('ver')} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={onVoltar} className="btn btn-ghost self-start" style={{ fontSize: 12 }}>
        ← Os seus programas
      </button>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-display font-semibold text-lg text-primary tracking-wide">
          {prescricao.nome || 'Programa de treino'}
        </h2>
        {treino && (treino.exercicios || []).length > 0 && (
          <button type="button" onClick={() => setModo('registar')} className="btn btn-primary" style={{ fontSize: 12 }}>
            Registar sessão
          </button>
        )}
      </div>

      {treinos.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {treinos.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTreinoId(t.id)}
              className={t.id === (treino && treino.id) ? 'btn btn-primary' : 'btn btn-ghost'}
              style={{ fontSize: 12 }}
            >
              {t.nome || 'Treino'}
            </button>
          ))}
        </div>
      )}

      {treino ? (
        (treino.exercicios || []).length === 0 ? (
          <p className="text-xs font-body text-faint">Este treino ainda não tem exercícios.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(treino.exercicios || []).map((ex) => (
              // biblioteca=[] -- a área do aluno não precisa de resolver nome
              // de grupo muscular/equipamento nem vídeo: o nome, as séries e
              // a carga já vêm na própria prescrição. onMudar={() => {}} é o
              // mesmo padrão já usado na landing para uma vista só de leitura
              // (LandingPage.tsx) -- o componente é real, só não persiste.
              <ExercicioVista key={ex.id} ex={ex} biblioteca={[]} onMudar={() => {}} comCabecalho />
            ))}
          </div>
        )
      ) : (
        <p className="text-xs font-body text-faint">Este programa ainda não tem treinos.</p>
      )}

      <HistoricoDeSessoes sessoes={sessoesAnteriores} prescricaoId={prescricao.id} />
    </div>
  );
}

export default function AreaDoAluno({ token }) {
  const [estado, setEstado] = useState('a-carregar'); // a-carregar | ok | erro
  const [erro, setErro] = useState('');
  const [dados, setDados] = useState(null);
  const [abertoId, setAbertoId] = useState(null);

  useEffect(() => {
    let vivo = true;
    async function carregar() {
      if (!supabaseConfigured || !supabase) {
        if (vivo) { setErro('Esta ligação não está configurada.'); setEstado('erro'); }
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke('aluno-view', { body: { token } });
        if (!vivo) return;
        if (error || !data || data.error) {
          setErro(await mensagemDeErro(error, data, 'Não foi possível abrir este link.'));
          setEstado('erro');
          return;
        }
        setDados(data);
        setEstado('ok');
      } catch {
        if (vivo) { setErro('Não foi possível ligar ao servidor.'); setEstado('erro'); }
      }
    }
    carregar();
    return () => { vivo = false; };
  }, [token]);

  if (estado === 'a-carregar') {
    return (
      <EcraCentrado>
        <Loader2 size={22} className="text-faint spin" />
        <p className="text-sm font-body text-faint">A abrir...</p>
      </EcraCentrado>
    );
  }

  if (estado === 'erro') {
    return (
      <EcraCentrado>
        <p className="text-sm font-body text-primary" style={{ fontWeight: 600 }}>Link inválido</p>
        <p className="text-xs font-body text-faint">{erro} Peça ao seu treinador um link novo.</p>
      </EcraCentrado>
    );
  }

  const { aluno, prescricoes, execucao } = dados;
  const sessoesAnteriores = (execucao && Array.isArray(execucao.sessoes)) ? execucao.sessoes : [];
  const aberto = prescricoes.find((p) => p.id === abertoId);

  return (
    <Ecra>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: aluno.color || 'var(--brass)' }} />
        <h1 className="font-display font-semibold text-xl text-primary tracking-wide truncate">{aluno.name}</h1>
      </div>

      {aberto ? (
        <ProgramaDoAluno
          student={aluno}
          prescricao={aberto}
          sessoesAnteriores={sessoesAnteriores}
          onVoltar={() => setAbertoId(null)}
          token={token}
        />
      ) : (
        <ListaDeProgramas prescricoes={prescricoes} onAbrir={setAbertoId} />
      )}
    </Ecra>
  );
}
