// Central de retenção: quem está a treinar e quem deixou de treinar, por regras à
// vista. O contacto abre o WhatsApp com o texto escrito; é o treinador quem envia.
import { useEffect, useMemo, useState } from 'react';
import { FormField } from '../../components/UiAtoms';
import { useModulo } from '../useModulo';
import { Abas, Aviso, ProntoOu, Titulo, Vazio, alunosAtuais, dm, hojeISO, ligacaoWhatsApp, primeiroNome, uid } from '../comum';
import { MODELOS_SUGERIDOS, preencherMensagem } from '../crm/logica';
import { ESTADOS_RETENCAO, REGRAS_OMISSAO, classificar, crescimento, instantaneo, metricas } from './logica';

const porSemanaDoPlano = (plano) => { const m = String(plano || '').match(/(\d+)\s*x\s*por\s*semana/i); return m ? Number(m[1]) : null; };
const segunda = (hoje) => { const d = new Date(`${hoje}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };

export default function CentralRetencao({ students, treinos, execucoes, onCarregarExecucoes, onAbrirAluno, showToast }) {
  const retencao = useModulo('retencao');
  const tarefas = useModulo('tarefas');
  const [aba, setAba] = useState('lista');
  const [filtro, setFiltro] = useState('risco');
  const hoje = hojeISO();
  const ativos = useMemo(() => alunosAtuais(students).filter((s) => s.active !== false), [students]);
  useEffect(() => { ativos.forEach((s) => onCarregarExecucoes(s.id)); }, [ativos]); // eslint-disable-line react-hooks/exhaustive-deps

  const regras = { ...REGRAS_OMISSAO, ...(retencao.valor.regras || {}) };
  const aLer = ativos.filter((s) => !execucoes[s.id] || execucoes[s.id].estado === 'a-carregar').length;
  const comErro = ativos.filter((s) => execucoes[s.id]?.estado === 'erro');
  const linhas = useMemo(() => ativos.filter((s) => execucoes[s.id]?.estado === 'ok').map((s) => ({
    student: s,
    ...classificar({ sessoes: execucoes[s.id].sessoes, aulasPorSemana: porSemanaDoPlano(s.planType), temPrograma: (treinos.prescricoes || []).some((p) => p.studentId === s.id && !p.arquivado), hoje, regras }),
  })), [ativos, execucoes, treinos, hoje, JSON.stringify(regras)]); // eslint-disable-line react-hooks/exhaustive-deps
  const m = metricas(linhas);
  const instantaneos = retencao.valor.instantaneos || [];

  // Um instantâneo por semana, só depois de lidos todos: um número a meio mentia.
  useEffect(() => {
    if (retencao.estado !== 'ok' || aLer > 0 || comErro.length > 0 || linhas.length === 0) return;
    const semana = segunda(hoje);
    const novo = instantaneo(instantaneos, { semana, linhas });
    if (JSON.stringify(novo) !== JSON.stringify(instantaneos)) retencao.gravar((v) => ({ ...v, instantaneos: instantaneo(v.instantaneos, { semana, linhas }) }));
  }, [retencao.estado, aLer, comErro.length, JSON.stringify(m.distribuicao)]); // eslint-disable-line react-hooks/exhaustive-deps

  const visiveis = linhas.filter((l) => filtro === 'todos' || l.estado === filtro).sort((a, b) => (b.dias ?? -1) - (a.dias ?? -1));
  async function criarTarefa(s) {
    const ok = await tarefas.gravar((t) => ({ ...t, itens: [...t.itens, { id: uid(), titulo: `Falar com ${s.name}`, studentId: s.id, data: hoje, prioridade: 'alta', origem: 'retencao', feita: false, criadaEm: hoje }] }));
    if (ok) showToast('Tarefa criada.');
  }
  const pct = (x) => (x.pct === null ? '—' : `${x.pct}%`);
  const c4 = crescimento(instantaneos, 4);
  const c12 = crescimento(instantaneos, 12);

  return (
    <ProntoOu modulos={[retencao, tarefas]}>{() => (
      <div className="flex flex-col gap-3">
        <Abas valor={aba} onMudar={setAba} abas={[{ id: 'lista', rotulo: 'Alunos' }, { id: 'numeros', rotulo: 'Números' }, { id: 'regras', rotulo: 'Regras' }]} />
        {aLer > 0 && <p className="text-xs font-body text-faint" role="status" style={{ margin: 0 }}>A ler o registo de {aLer} {aLer === 1 ? 'aluno' : 'alunos'}...</p>}
        {comErro.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-body" style={{ margin: 0, color: 'var(--rust)' }}>Não foi possível ler o registo de {comErro.map((s) => s.name).join(', ')}.</p><button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => comErro.forEach((s) => onCarregarExecucoes(s.id, true))}>Tentar de novo</button></div>
        )}

        {aba === 'lista' && (
          <>
            <FormField label="Mostrar">
              <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="input-field">
                <option value="todos">Todos ({linhas.length})</option>
                {Object.entries(ESTADOS_RETENCAO).map(([id, e]) => <option key={id} value={id}>{e.rotulo} ({linhas.filter((l) => l.estado === id).length})</option>)}
              </select>
            </FormField>
            {visiveis.length === 0 && aLer === 0 && <Vazio>Nenhum aluno neste estado.</Vazio>}
            {visiveis.map((l) => {
              const e = ESTADOS_RETENCAO[l.estado];
              const dados = { primeiroNome: primeiroNome(l.student.name), nome: l.student.name };
              return (
                <div key={l.student.id} className="card p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <button type="button" onClick={() => onAbrirAluno(l.student)} className="text-sm font-body text-primary text-left min-w-0" style={{ fontWeight: 600 }}>{l.student.name}</button>
                    <span className="text-2xs font-body" style={{ color: e.cor, fontWeight: 600 }}>{e.rotulo}</span>
                  </div>
                  <p className="text-xs font-body text-muted" style={{ margin: 0 }}>{l.motivo}{l.ultimo ? ` Último treino em ${dm(l.ultimo)}.` : ''}</p>
                  {['oscilando', 'risco', 'abandono'].includes(l.estado) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {l.student.phone ? (
                        <select aria-label={`Mensagem para ${l.student.name}`} defaultValue="" onChange={(ev) => { const t = ev.target.value; ev.target.value = ''; if (t !== '') window.open(ligacaoWhatsApp(l.student.phone, preencherMensagem(MODELOS_SUGERIDOS.retencao[Number(t)].texto, dados)), '_blank', 'noopener'); }} className="input-field" style={{ flex: '1 1 180px', minWidth: 0 }}>
                          <option value="">Abrir WhatsApp com...</option>
                          {MODELOS_SUGERIDOS.retencao.map((x, i) => <option key={x.titulo} value={i}>{x.titulo}</option>)}
                        </select>
                      ) : <span className="text-xs font-body text-faint">Sem telefone na ficha.</span>}
                      <button type="button" onClick={() => criarTarefa(l.student)} className="btn btn-ghost" style={{ fontSize: 12 }}>Criar tarefa</button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {aba === 'numeros' && (
          <div className="flex flex-col gap-3">
            <div className="card p-3 flex flex-col gap-1">
              <p className="text-sm font-body text-primary" style={{ margin: 0 }}>Engajamento: <b className="font-mono">{pct(m.engajamento)}</b> <span className="text-xs text-faint">({m.engajamento.n} de {m.engajamento.de} com dados)</span></p>
              <p className="text-sm font-body text-primary" style={{ margin: 0 }}>Recuperação: <b className="font-mono">{pct(m.recuperacao)}</b> <span className="text-xs text-faint">({m.recuperacao.n} de {m.recuperacao.de})</span></p>
              <p className="text-sm font-body text-primary" style={{ margin: 0 }}>Alunos a treinar: <b className="font-mono">{m.ativos}</b> <span className="text-xs text-faint">de {m.total} ativos</span></p>
              <p className="text-sm font-body text-primary" style={{ margin: 0 }}>Variação em 4 semanas: <b className="font-mono">{c4 === null ? '—' : c4}</b> · em 12: <b className="font-mono">{c12 === null ? '—' : c12}</b></p>
            </div>
            {instantaneos.length < 2 && <Vazio>A tendência precisa de pelo menos duas semanas de registo. Abrir esta área guarda o retrato da semana.</Vazio>}
            <Titulo>Por semana</Titulo>
            {[...instantaneos].reverse().slice(0, 12).map((x) => <p key={x.semana} className="text-sm font-body text-muted" style={{ margin: 0 }}><span className="font-mono">{dm(x.semana)}</span> · {x.ativos} a treinar de {x.avaliados} com dados</p>)}
          </div>
        )}

        {aba === 'regras' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              {[['oscilandoDias', 'Oscilando a partir de (dias)'], ['riscoDias', 'Em risco a partir de (dias)'], ['abandonoDias', 'Abandono a partir de (dias)'], ['aderenciaMinima', 'Aderência mínima (%)']].map(([k, r]) => (
                <FormField key={k} label={r}><input type="number" min="1" value={regras[k]} onChange={(e) => { const n = Number(e.target.value) || 1; retencao.gravar((v) => ({ ...v, regras: { ...regras, [k]: n } })); }} className="input-field" /></FormField>
              ))}
            </div>
            {!(regras.oscilandoDias < regras.riscoDias && regras.riscoDias < regras.abandonoDias) && <Aviso>Os dias têm de subir de Oscilando para Em risco e para Abandono, ou os estados sobrepõem-se.</Aviso>}
            <p className="text-xs font-body text-faint" style={{ margin: 0 }}>A aderência compara os treinos das últimas 4 semanas com o «Nx por semana» do plano; sem esse número no plano, não entra. São regras simples para ajudar a decidir quem contactar, não uma previsão.</p>
            <button type="button" onClick={() => retencao.gravar((v) => ({ ...v, regras: null }))} className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12 }}>Repor os valores iniciais</button>
          </div>
        )}
      </div>
    )}</ProntoOu>
  );
}
