// A área do aluno: um shell próprio, fora da app do treinador -- ver
// CLAUDE.md, secção 4 ("Área do aluno"). Dois caminhos para entrar: o link
// pessoal com token (`?a=...`, sem conta nenhuma -- o original) ou uma conta
// própria do aluno (email + password, convidada pelo treinador na Ficha
// 360º), que persiste a sessão e deixa o aluno entrar sempre que quiser sem
// link nenhum. `App()` (painel-pt.tsx) renderiza isto EM VEZ de `AppInner`
// sempre que há token OU a URL pede explicitamente a área do aluno (ver
// `querAreaDoAluno`), antes de qualquer hook de autenticação do treinador
// sequer montar.
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
import {
  CalendarDays, Check, Clock, Flame, History as HistoryIcon, Home, Loader2, LogOut, Mail,
} from 'lucide-react';
import { supabase, supabaseConfigured } from '../supabaseClient';
import { supabaseAluno } from '../supabaseClientAluno';
import { CAMPO_SERIE, ExercicioVista, descreverLinha, tipoDeSerie } from './TreinoAtoms';
import { StatCard } from './DashboardAtoms';
import {
  VERSAO_RASCUNHO, camposRealizaveis, chaveRascunho, construirItens, estatisticasDoAluno,
  lerRascunho, normalizarSessaoRealizada, ordenarSessoes, proximoTreino, resumoDaSessao, temSintomas,
  ultimaVezDoExercicio, valoresSugeridos,
} from '../data/sessoes';
import { PARAM_AREA_ALUNO, PARAM_CONVITE_ALUNO } from '../data/acessoAluno';

// `supabase`/`supabaseConfigured` (de `../supabaseClient`) só serve para a
// leitura inicial do token (`aluno-view` não exige sessão nenhuma para um
// link válido, por isso usar o cliente do treinador para essa UMA chamada
// é inofensivo -- nunca grava nada, nunca lê uma sessão de ninguém). Tudo o
// que é sessão a sério do aluno (login, definir password, registar sessão
// autenticado) usa sempre `supabaseAluno`, nunca este -- ver
// `src/supabaseClientAluno.ts` para o porquê.

function saudacao() {
  const h = new Date().getHours();
  if (h < 6) return 'Boa noite';
  if (h < 12) return 'Bom dia';
  if (h < 20) return 'Boa tarde';
  return 'Boa noite';
}
function primeiroNome(nomeCompleto) {
  return String(nomeCompleto || '').trim().split(/\s+/)[0] || '';
}

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

// `padNav` reserva o espaço da barra inferior fixa (`.pb-nav`, já definida em
// GlobalStyles para a navegação do treinador) -- só faz falta quando a barra
// está mesmo visível, isto é, fora de um programa aberto.
function Ecra({ children, padNav = false }) {
  return (
    <div
      className={`px-4 py-4 max-w-3xl mx-auto flex flex-col gap-4${padNav ? ' pb-nav' : ''}`}
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

function ListaDeProgramas({ prescricoes, onAbrir, titulo = 'Os seus programas' }) {
  if (prescricoes.length === 0) {
    return (
      <p className="text-sm font-body text-faint">
        Ainda não há nenhum programa de treino atribuído. Fale com o seu treinador.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-2xs uppercase tracking-wide text-faint font-mono">{titulo}</h2>
      {prescricoes.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onAbrir(p.id)}
          className="card text-left btn-surface flex flex-col gap-0.5 p-4"
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

/* ============================== início (dashboard) ============================== */

function CartaoProximoTreino({ treino, prescricaoNome, onComecar }) {
  if (!treino) return null;
  const nExercicios = (treino.exercicios || []).length;
  return (
    <div className="card flex flex-col gap-3 p-4" style={{ borderLeft: '3px solid var(--brass)' }}>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-2xs uppercase tracking-wide font-mono" style={{ color: 'var(--brass)' }}>
          Próximo treino
        </span>
        <span className="font-display font-semibold text-lg text-primary tracking-wide truncate">
          {treino.nome || 'Treino'}
        </span>
        <span className="text-xs font-body text-faint truncate">
          {prescricaoNome}{nExercicios ? ` · ${nExercicios} ${nExercicios === 1 ? 'exercício' : 'exercícios'}` : ''}
        </span>
      </div>
      {nExercicios > 0 && (
        <button type="button" onClick={onComecar} className="btn btn-primary self-start">
          Começar treino
        </button>
      )}
    </div>
  );
}

// Três números simples, lado a lado -- flex, não `grid grid-cols-3` (essa
// classe cai para 2 colunas no telemóvel por regra global, o que deixaria
// uma das três numa linha órfã; CLAUDE.md secção 6). Só aparece depois da
// primeira sessão registada -- "0 · 0 · —" não ajuda ninguém a começar.
function LinhaEstatisticas({ stats }) {
  return (
    <div className="flex gap-2">
      <div className="flex-1 min-w-0"><StatCard label="Semana" value={String(stats.estaSemana)} icon={Flame} accent="brass" /></div>
      <div className="flex-1 min-w-0"><StatCard label="Mês" value={String(stats.esteMes)} icon={CalendarDays} accent="sky" /></div>
      <div className="flex-1 min-w-0"><StatCard label="Última vez" value={stats.ultimaData ? dataCurta(stats.ultimaData) : '—'} icon={Clock} accent="slate" /></div>
    </div>
  );
}

function InicioDoAluno({ prescricoes, sessoesAnteriores, onAbrir }) {
  const primaria = prescricoes[0] || null;
  const outras = prescricoes.slice(1);
  const hojeISO = useMemo(() => dataDeHoje(), []);
  const stats = useMemo(() => estatisticasDoAluno(sessoesAnteriores, hojeISO), [sessoesAnteriores, hojeISO]);
  const treinoSugerido = useMemo(
    () => (primaria ? proximoTreino(primaria.treinos, sessoesAnteriores) : null),
    [primaria, sessoesAnteriores],
  );

  if (!primaria) {
    return (
      <p className="text-sm font-body text-faint">
        Ainda não há nenhum programa de treino atribuído. Fale com o seu treinador.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CartaoProximoTreino
        treino={treinoSugerido}
        prescricaoNome={primaria.nome || 'Programa de treino'}
        onComecar={() => onAbrir(primaria.id, treinoSugerido && treinoSugerido.id, 'registar')}
      />
      {stats.total > 0 && <LinhaEstatisticas stats={stats} />}
      {outras.length > 0 && (
        <ListaDeProgramas prescricoes={outras} onAbrir={onAbrir} titulo="Outros programas" />
      )}
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

function BarraDeProgresso({ feitos, total }) {
  const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-2xs font-body text-faint">{feitos} de {total} exercícios</span>
        <span className="text-2xs font-mono text-faint">{pct}%</span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: 6, backgroundColor: 'var(--bg-inset)' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--brass)', transition: 'width var(--dur) var(--ease)' }} />
      </div>
    </div>
  );
}

function RegistoSessaoAluno({ cliente, token, student, prescricao, treino, sessoesAnteriores, onConcluido, onVoltar }) {
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
  const exerciciosTotal = (treino.exercicios || []).length;
  const exerciciosTocados = useMemo(
    () => (treino.exercicios || []).filter((ex) => {
      const it = itens[ex.id];
      return Boolean(it && (it.saltado || Object.values(it.series || {}).some((s) => s && s.feito)));
    }).length,
    [itens, treino],
  );

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
      const { data, error } = await cliente.functions.invoke('aluno-registar-sessao', { body: { token, sessao } });
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
      <BarraDeProgresso feitos={exerciciosTocados} total={exerciciosTotal} />
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
// plano). Mostra TODAS as sessões do aluno, de qualquer programa, mais
// recentes primeiro -- é o ecrã próprio "Histórico" da barra inferior, não
// um apêndice dentro de um programa aberto.
function HistoricoGeral({ sessoes }) {
  const ordenadas = useMemo(() => ordenarSessoes(sessoes), [sessoes]);
  const [abertaId, setAbertaId] = useState(null);
  // Só se mostra a que programa pertence cada sessão quando há mais de um --
  // com um só, seria sempre a mesma etiqueta repetida, sem dizer nada.
  const mostrarPrograma = useMemo(
    () => new Set(ordenadas.map((s) => s.prescricaoNome).filter(Boolean)).size > 1,
    [ordenadas],
  );

  if (ordenadas.length === 0) {
    return <p className="text-sm font-body text-faint">Ainda não registou nenhuma sessão.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-2xs uppercase tracking-wide text-faint font-mono">
        {ordenadas.length} {ordenadas.length === 1 ? 'sessão registada' : 'sessões registadas'}
      </h2>
      {ordenadas.map((s) => {
        const resumo = resumoDaSessao(s);
        const aberta = abertaId === s.id;
        return (
          <div key={s.id} className="card flex flex-col gap-2 min-w-0 p-4">
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
                  {mostrarPrograma && s.prescricaoNome ? `${s.prescricaoNome} · ` : ''}
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

function ProgramaDoAluno({ student, prescricao, sessoesAnteriores, onVoltar, token, cliente, treinoInicialId, modoInicial = 'ver' }) {
  const treinos = Array.isArray(prescricao.treinos) ? prescricao.treinos : [];
  const [treinoId, setTreinoId] = useState(treinoInicialId || treinos[0]?.id || null);
  const [modo, setModo] = useState(modoInicial); // ver | registar | concluido
  const treino = treinos.find((t) => t.id === treinoId) || treinos[0] || null;

  if (treino && modo === 'registar') {
    return (
      <RegistoSessaoAluno
        cliente={cliente}
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
        ← Início
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
    </div>
  );
}

/* ============================== conta própria (login) ============================== */

function LoginDoAluno({ onEntrou }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState('');
  const [recuperacaoEnviada, setRecuperacaoEnviada] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    if (!supabaseAluno) return;
    setAEnviar(true);
    setErro('');
    const { error } = await supabaseAluno.auth.signInWithPassword({ email: email.trim(), password });
    setAEnviar(false);
    if (error) { setErro('Email ou palavra-passe incorretos.'); return; }
    onEntrou();
  }

  async function pedirRecuperacao(e) {
    e.preventDefault();
    if (!supabaseAluno || typeof window === 'undefined') return;
    setAEnviar(true);
    setErro('');
    await supabaseAluno.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/?${PARAM_CONVITE_ALUNO}=1`,
    });
    setAEnviar(false);
    setRecuperacaoEnviada(true);
  }

  if (modoRecuperar) {
    return (
      <EcraCentrado>
        <h1 className="font-display font-semibold text-lg text-primary" style={{ margin: 0 }}>Recuperar palavra-passe</h1>
        {recuperacaoEnviada ? (
          <>
            <p className="text-sm font-body text-faint">
              Se existir uma conta com esse email, enviámos um link para escolher uma palavra-passe nova.
            </p>
            <button type="button" onClick={() => { setModoRecuperar(false); setRecuperacaoEnviada(false); }} className="btn btn-ghost">
              ← Voltar a entrar
            </button>
          </>
        ) : (
          <form onSubmit={pedirRecuperacao} className="flex flex-col gap-3 w-full" style={{ maxWidth: 300 }}>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="O seu email" aria-label="Email" className="input-field" style={{ fontSize: 16 }}
            />
            {erro && <p className="text-xs font-body" style={{ color: 'var(--rust)' }}>{erro}</p>}
            <button type="submit" disabled={aEnviar} className="btn btn-primary">{aEnviar ? 'A enviar...' : 'Enviar link'}</button>
            <button type="button" onClick={() => setModoRecuperar(false)} className="btn btn-ghost">Cancelar</button>
          </form>
        )}
      </EcraCentrado>
    );
  }

  return (
    <EcraCentrado>
      <Mail size={26} className="text-brass" />
      <h1 className="font-display font-semibold text-lg text-primary" style={{ margin: 0 }}>Entrar</h1>
      <p className="text-xs font-body text-faint" style={{ margin: 0 }}>A sua área de treino na PTMANAGER.</p>
      <form onSubmit={entrar} className="flex flex-col gap-3 w-full" style={{ maxWidth: 300 }}>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" aria-label="Email" className="input-field" style={{ fontSize: 16 }}
        />
        <input
          type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Palavra-passe" aria-label="Palavra-passe" className="input-field" style={{ fontSize: 16 }}
        />
        {erro && <p className="text-xs font-body" style={{ color: 'var(--rust)' }}>{erro}</p>}
        <button type="submit" disabled={aEnviar} className="btn btn-primary">{aEnviar ? 'A entrar...' : 'Entrar'}</button>
        <button type="button" onClick={() => setModoRecuperar(true)} className="text-2xs font-body link-sky self-center">
          Esqueci-me da palavra-passe
        </button>
      </form>
    </EcraCentrado>
  );
}

// Depois de aceitar o convite (ou de pedir para recuperar a password) --
// mesma cautela do `ResetPasswordScreen` do treinador: um scanner de
// segurança do email pode gastar um link de uso único antes da pessoa
// clicar, por isso confirma-se a sessão a sério antes de mostrar o
// formulário (CLAUDE.md, secção 6, armadilha do "Safe Links").
function DefinirPasswordAluno({ onDefinida }) {
  const [temSessao, setTemSessao] = useState(null); // null = a verificar
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!supabaseAluno) { setTemSessao(false); return; }
    let vivo = true;
    supabaseAluno.auth.getSession().then(({ data }) => { if (vivo) setTemSessao(Boolean(data.session)); });
    return () => { vivo = false; };
  }, []);

  async function guardar(e) {
    e.preventDefault();
    if (password.length < 6) { setErro('A palavra-passe precisa de pelo menos 6 caracteres.'); return; }
    if (password !== confirmar) { setErro('As duas palavras-passe têm de ser iguais.'); return; }
    setAGuardar(true);
    setErro('');
    const { error } = await supabaseAluno.auth.updateUser({ password });
    setAGuardar(false);
    if (error) { setErro('Não foi possível guardar. O link pode já não ser válido.'); return; }
    onDefinida();
  }

  if (temSessao === null) {
    return (
      <EcraCentrado>
        <Loader2 size={22} className="text-faint spin" />
        <p className="text-sm font-body text-faint">A confirmar...</p>
      </EcraCentrado>
    );
  }

  if (!temSessao) {
    return (
      <EcraCentrado>
        <p className="text-sm font-body text-primary" style={{ fontWeight: 600 }}>Este link já não é válido</p>
        <p className="text-xs font-body text-faint">Pode já ter sido usado, ou expirou. Peça ao seu treinador para o reenviar.</p>
      </EcraCentrado>
    );
  }

  return (
    <EcraCentrado>
      <h1 className="font-display font-semibold text-lg text-primary" style={{ margin: 0 }}>Escolha a sua palavra-passe</h1>
      <p className="text-xs font-body text-faint" style={{ margin: 0 }}>É assim que vai entrar da próxima vez.</p>
      <form onSubmit={guardar} className="flex flex-col gap-3 w-full" style={{ maxWidth: 300 }}>
        <input
          type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Palavra-passe nova" aria-label="Palavra-passe nova" className="input-field" style={{ fontSize: 16 }}
        />
        <input
          type="password" required value={confirmar} onChange={(e) => setConfirmar(e.target.value)}
          placeholder="Confirmar palavra-passe" aria-label="Confirmar palavra-passe" className="input-field" style={{ fontSize: 16 }}
        />
        {erro && <p className="text-xs font-body" style={{ color: 'var(--rust)' }}>{erro}</p>}
        <button type="submit" disabled={aGuardar} className="btn btn-primary">{aGuardar ? 'A guardar...' : 'Começar'}</button>
      </form>
    </EcraCentrado>
  );
}

/* ============================== navegação ============================== */

const ABAS = [
  { id: 'inicio', label: 'Início', icon: Home },
  { id: 'historico', label: 'Histórico', icon: HistoryIcon },
];

// Mesma estrutura e classes (`vidro`, `tab-fundo`, `tab-icone`, `--nav-h`) da
// barra de separadores do treinador em painel-pt.tsx -- já vêm do
// `GlobalStyles` partilhado (ver cabeçalho deste ficheiro), por isso não
// precisam de CSS novo nenhum aqui. Só visível fora de um programa aberto
// (ver `AreaDoAluno`, mais abaixo) -- uma sub-vista tapa a navegação,
// CLAUDE.md secção 6.
function BarraInferior({ aba, onMudar }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t border-hair vidro"
      style={{ zIndex: 30, paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegação da área do aluno"
    >
      <div
        className="flex max-w-3xl mx-auto"
        style={{ paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
      >
        {ABAS.map((t) => {
          const Icon = t.icon;
          const active = aba === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onMudar(t.id)}
              aria-current={active ? 'page' : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 min-w-0 tab-fundo"
              style={{ height: 'var(--nav-h)', color: active ? 'var(--brass)' : 'var(--text-faint)' }}
            >
              <span className="tab-icone" style={{ backgroundColor: active ? 'var(--brass-soft)' : 'transparent' }}>
                <Icon size={19} style={{ display: 'block' }} />
              </span>
              <span className="font-body truncate w-full text-center px-0.5" style={{ fontSize: '0.625rem', lineHeight: 1, fontWeight: active ? 600 : 400 }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Três caminhos para chegar aqui: `?a=<token>` (link direto, sem conta --
// cliente é sempre `supabase`, o `aluno-view`/`aluno-registar-sessao` nem
// olham para sessão nenhuma quando há token); `?aluno-convite=1` (acabou de
// aceitar um convite, ou pediu para recuperar a password -- mostra-se
// `DefinirPasswordAluno`); ou nenhum dos dois, em que a conta própria do
// aluno decide tudo (`supabaseAluno`, login ou já autenticado).
function fasesDeArranque(token) {
  if (token) return 'a-carregar';
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has(PARAM_CONVITE_ALUNO)) {
    return 'definir-password';
  }
  return 'a-verificar-sessao';
}

export default function AreaDoAluno({ token }) {
  const [fase, setFase] = useState(() => fasesDeArranque(token));
  const [erro, setErro] = useState('');
  const [dados, setDados] = useState(null);
  const [aba, setAba] = useState('inicio');
  const [abertoId, setAbertoId] = useState(null);
  const [treinoInicialId, setTreinoInicialId] = useState(null);
  const [modoInicial, setModoInicial] = useState('ver');
  const cliente = token ? supabase : supabaseAluno;

  function abrirPrograma(id, treinoId, modo) {
    setTreinoInicialId(treinoId || null);
    setModoInicial(modo === 'registar' ? 'registar' : 'ver');
    setAbertoId(id);
  }
  function voltarAoInicio() {
    setAbertoId(null);
    setTreinoInicialId(null);
    setModoInicial('ver');
  }
  // Capturado uma vez só, da URL original -- não se recalcula a partir de
  // `fasesDeArranque` dentro do efeito abaixo, que já reescreve essa mesma
  // URL para "?aluno=1". Em StrictMode (dev), o React invoca o efeito duas
  // vezes; recalcular ali leria a URL já normalizada e perdia este modo.
  const eraConvite = useRef(fase === 'definir-password').current;

  async function carregarDados() {
    setFase('a-carregar');
    setErro('');
    if (!cliente) {
      setErro('Esta ligação não está configurada.');
      setFase('erro');
      return;
    }
    try {
      const { data, error } = await cliente.functions.invoke('aluno-view', { body: token ? { token } : {} });
      if (error || !data || data.error) {
        setErro(await mensagemDeErro(error, data, token ? 'Não foi possível abrir este link.' : 'Não foi possível carregar os seus dados.'));
        setFase('erro');
        return;
      }
      setDados(data);
      setFase('ok');
    } catch {
      setErro('Não foi possível ligar ao servidor.');
      setFase('erro');
    }
  }

  useEffect(() => {
    if (token) { carregarDados(); return undefined; }
    if (eraConvite) return undefined; // tratado pelo próprio ecrã (DefinirPasswordAluno)

    if (!supabaseConfigured || !supabaseAluno) {
      setErro('Esta ligação não está configurada.');
      setFase('erro');
      return undefined;
    }
    let vivo = true;
    supabaseAluno.auth.getSession().then(({ data }) => {
      if (!vivo) return;
      if (data.session) carregarDados(); else setFase('login');
    });
    const { data: listener } = supabaseAluno.auth.onAuthStateChange((_event, session) => {
      if (!vivo) return;
      if (session) carregarDados();
      else setFase((f) => (f === 'definir-password' ? f : 'login'));
    });
    return () => { vivo = false; listener.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, eraConvite]);

  async function sair() {
    if (supabaseAluno) await supabaseAluno.auth.signOut();
    setDados(null);
    setAbertoId(null);
    setFase('login');
  }

  // Assenta a barra do endereço no link fixo (`?aluno=1`), venha-se de onde
  // se vier (convite, recuperação, ou já lá) -- é essa barra que o aluno
  // marca/guarda para voltar a entrar sem precisar de outro email.
  useEffect(() => {
    if (token || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get(PARAM_AREA_ALUNO) !== '1' || params.has(PARAM_CONVITE_ALUNO)) {
      window.history.replaceState(null, '', `${window.location.pathname}?${PARAM_AREA_ALUNO}=1`);
    }
  }, [token]);

  if (fase === 'a-carregar' || fase === 'a-verificar-sessao') {
    return (
      <EcraCentrado>
        <Loader2 size={22} className="text-faint spin" />
        <p className="text-sm font-body text-faint">A abrir...</p>
      </EcraCentrado>
    );
  }

  if (fase === 'definir-password') {
    return <DefinirPasswordAluno onDefinida={carregarDados} />;
  }

  if (fase === 'login') {
    return <LoginDoAluno onEntrou={carregarDados} />;
  }

  if (fase === 'erro') {
    return (
      <EcraCentrado>
        <p className="text-sm font-body text-primary" style={{ fontWeight: 600 }}>{token ? 'Link inválido' : 'Não foi possível entrar'}</p>
        <p className="text-xs font-body text-faint">
          {erro} {token ? 'Peça ao seu treinador um link novo.' : ''}
        </p>
      </EcraCentrado>
    );
  }

  const { aluno, prescricoes, execucao } = dados;
  const sessoesAnteriores = (execucao && Array.isArray(execucao.sessoes)) ? execucao.sessoes : [];
  const aberto = prescricoes.find((p) => p.id === abertoId);
  const primeiro = primeiroNome(aluno.name);

  return (
    <>
      <Ecra padNav={!aberto}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: aluno.color || 'var(--brass)' }} />
            <h1 className="font-display font-semibold text-xl text-primary tracking-wide truncate" style={{ margin: 0 }}>
              {saudacao()}{primeiro ? `, ${primeiro}` : ''}
            </h1>
          </div>
          {!token && (
            <button type="button" onClick={sair} className="btn btn-ghost flex-shrink-0" style={{ fontSize: 12 }} aria-label="Sair da conta">
              <LogOut size={14} /> Sair
            </button>
          )}
        </div>

        {aberto ? (
          <ProgramaDoAluno
            student={aluno}
            prescricao={aberto}
            sessoesAnteriores={sessoesAnteriores}
            onVoltar={voltarAoInicio}
            token={token}
            cliente={cliente}
            treinoInicialId={treinoInicialId}
            modoInicial={modoInicial}
          />
        ) : aba === 'historico' ? (
          <HistoricoGeral sessoes={sessoesAnteriores} />
        ) : (
          <InicioDoAluno prescricoes={prescricoes} sessoesAnteriores={sessoesAnteriores} onAbrir={abrirPrograma} />
        )}
      </Ecra>
      {!aberto && <BarraInferior aba={aba} onMudar={setAba} />}
    </>
  );
}
