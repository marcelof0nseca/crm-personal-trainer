// Desafios, pontos e satisfação. Os pontos são opcionais: desligados, o aluno não vê
// nada disto, e nenhuma classificação aparece sem o treinador a pedir.
import { useEffect, useState } from 'react';
import { ConfirmDialog, FormField } from '../../components/UiAtoms';
import { useModulo } from '../useModulo';
import { Abas, Aviso, ProntoOu, Titulo, Vazio, alunosAtuais, dm, hojeISO, nomeDoAluno, uid } from '../comum';
import { despublicar, lerEntradas, ligacaoPublica, publicar, temServidor } from '../servidor';
import { juntarLead } from '../crm/logica';
import { CONQUISTAS, ESTADOS_DESAFIO, REGRAS_PONTOS, acompanhamento, conquistasDe, estadoDoDesafio, notaBaixa, nps, pontosDosTreinos, resgatar, reverterResgate, saldo, sequenciaSemanas } from './logica';

// O que a página pública pode saber do desafio, e nada mais.
const retratoDoDesafio = (d) => ({ nome: d.nome, descricao: d.descricao, regras: d.regras, inicio: d.inicio, fim: d.fim, etapas: (d.etapas || []).map((e) => ({ id: e.id, titulo: e.titulo, conteudo: e.conteudo, dia: e.dia })), consentimento: d.consentimento, ajuda: d.ajuda });

function Desafios({ modulo, crm, showToast }) {
  const [entradas, setEntradas] = useState([]);
  const [erroEntradas, setErroEntradas] = useState('');
  const [abertoId, setAbertoId] = useState(null);
  const [apagar, setApagar] = useState(null);
  const hoje = hojeISO();
  const itens = modulo.valor.itens || [];
  const mudar = (id, c) => modulo.gravar((m) => ({ ...m, itens: m.itens.map((x) => (x.id === id ? { ...x, ...c } : x)) }));
  useEffect(() => { lerEntradas().then((r) => { setEntradas(r.itens); if (!r.ok) setErroEntradas(r.erro); }); }, []);

  async function publicarDesafio(d) {
    if (!d.consentimento?.trim()) { showToast('Escreva o texto de consentimento antes de publicar.', 'error'); return; }
    const r = await publicar({ slug: d.slug, tipo: 'desafio', ref: d.id, dados: retratoDoDesafio(d) });
    if (r.ok) { await mudar(d.id, { slug: r.slug, estado: 'publicado' }); showToast('Desafio publicado.'); } else showToast(r.erro, 'error');
  }
  async function retirar(d) {
    if (d.slug) await despublicar(d.slug);
    await mudar(d.id, { estado: 'inativo' });
  }
  async function participanteParaLead(d, p) {
    const r = juntarLead(crm.valor.leads, { nome: p.nome, email: p.email, telefone: p.telefone, origem: `desafio: ${d.nome}` }, { gerarId: uid, agora: new Date().toISOString() });
    if (await crm.gravar((v) => ({ ...v, leads: r.leads }))) showToast(r.novo ? 'Passou para os contactos.' : 'Já estava nos contactos: juntei a este.');
  }
  return (
    <div className="flex flex-col gap-3">
      <Aviso>Nenhuma classificação pública por omissão. Um desafio mostra o progresso de cada pessoa só a ela. Publicar cria uma ligação que qualquer pessoa pode abrir.</Aviso>
      {erroEntradas && <p className="text-sm font-body" style={{ margin: 0, color: 'var(--rust)' }}>{erroEntradas}</p>}
      <button type="button" onClick={() => modulo.gravar((m) => ({ ...m, itens: [...m.itens, { id: uid(), nome: 'Desafio novo', descricao: '', regras: '', inicio: hoje, fim: '', estado: 'rascunho', etapas: [], consentimento: '', pontos: 0 }] }))} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Novo desafio</button>
      {itens.length === 0 && <Vazio>Sem desafios.</Vazio>}
      {itens.map((d) => {
        const e = estadoDoDesafio(d, hoje);
        const a = acompanhamento(d, entradas);
        const aberto = abertoId === d.id;
        return (
          <div key={d.id} className="card p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <button type="button" onClick={() => setAbertoId(aberto ? null : d.id)} aria-expanded={aberto} className="text-sm font-body text-primary text-left min-w-0" style={{ fontWeight: 600 }}>{d.nome}</button>
              <span className="text-2xs font-body text-faint">{ESTADOS_DESAFIO[e]} · {a.participantes.length} {a.participantes.length === 1 ? 'participante' : 'participantes'}</span>
            </div>
            {d.slug && d.estado === 'publicado' && <input readOnly value={ligacaoPublica(d.slug)} aria-label={`Ligação do desafio ${d.nome}`} className="input-field" onFocus={(ev) => ev.target.select()} />}
            {aberto && (
              <>
                <FormField label="Nome"><input value={d.nome} maxLength={80} onChange={(ev) => mudar(d.id, { nome: ev.target.value })} className="input-field" /></FormField>
                <FormField label="Descrição"><textarea rows={2} maxLength={500} value={d.descricao} onChange={(ev) => mudar(d.id, { descricao: ev.target.value })} className="input-field" /></FormField>
                <FormField label="Regras"><textarea rows={2} maxLength={1000} value={d.regras} onChange={(ev) => mudar(d.id, { regras: ev.target.value })} className="input-field" /></FormField>
                <div className="grid grid-cols-2 gap-2">
                  <FormField label="Início"><input type="date" value={d.inicio} onChange={(ev) => mudar(d.id, { inicio: ev.target.value })} className="input-field" /></FormField>
                  <FormField label="Fim"><input type="date" value={d.fim} onChange={(ev) => mudar(d.id, { fim: ev.target.value })} className="input-field" /></FormField>
                </div>
                <FormField label="Texto de consentimento (obrigatório para publicar)"><textarea rows={2} maxLength={800} value={d.consentimento} onChange={(ev) => mudar(d.id, { consentimento: ev.target.value })} className="input-field" placeholder="Para que usa os dados de quem se inscreve." /></FormField>
                <Titulo>Etapas</Titulo>
                {(d.etapas || []).map((et, i) => (
                  <div key={et.id} className="flex gap-2 items-end">
                    <div className="flex-1 min-w-0"><FormField label={`Etapa ${i + 1}`}><input value={et.titulo} maxLength={80} onChange={(ev) => mudar(d.id, { etapas: d.etapas.map((x) => (x.id === et.id ? { ...x, titulo: ev.target.value } : x)) })} className="input-field" /></FormField></div>
                    <button type="button" onClick={() => mudar(d.id, { etapas: d.etapas.filter((x) => x.id !== et.id) })} className="btn btn-ghost" style={{ fontSize: 12 }}>Tirar</button>
                  </div>
                ))}
                <button type="button" onClick={() => mudar(d.id, { etapas: [...(d.etapas || []), { id: uid(), titulo: '', conteudo: '' }] })} className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12 }}>Acrescentar etapa</button>
                <Titulo>Participantes</Titulo>
                <p className="text-xs font-body text-muted" style={{ margin: 0 }}>Concluíram: {a.concluiram} de {a.participantes.length}{a.adesao !== null ? ` · ${a.adesao}% começaram` : ''}</p>
                {a.participantes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-body text-primary">{p.nome} <span className="text-2xs text-faint">{p.feitas} de {(d.etapas || []).length}</span></span>
                    <button type="button" onClick={() => participanteParaLead(d, p)} className="btn btn-ghost" style={{ fontSize: 12 }}>Passar a contacto</button>
                  </div>
                ))}
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => publicarDesafio(d)} disabled={!temServidor()} className="btn btn-primary" style={{ fontSize: 12, opacity: temServidor() ? 1 : 0.45 }}>{d.slug && d.estado === 'publicado' ? 'Atualizar publicação' : 'Publicar'}</button>
                  {d.estado === 'publicado' && <button type="button" onClick={() => retirar(d)} className="btn btn-ghost" style={{ fontSize: 12 }}>Retirar do ar</button>}
                  <button type="button" onClick={() => setApagar(d)} className="btn btn-ghost" style={{ fontSize: 12 }}>Apagar</button>
                </div>
                {!temServidor() && <p className="text-xs font-body text-faint" style={{ margin: 0 }}>Publicar precisa da conta ligada ao servidor.</p>}
              </>
            )}
          </div>
        );
      })}
      {apagar && <ConfirmDialog title="Apagar desafio" message={`«${apagar.nome}» sai da lista e a ligação deixa de funcionar.`} confirmLabel="Apagar" onCancel={() => setApagar(null)} onConfirm={async () => { if (apagar.slug) await despublicar(apagar.slug); await modulo.gravar((m) => ({ ...m, itens: m.itens.filter((x) => x.id !== apagar.id) })); setApagar(null); }} />}
    </div>
  );
}

function Pontos({ modulo, students, execucoes, onCarregarExecucoes, showToast }) {
  const v = modulo.valor;
  const hoje = hojeISO();
  const ativos = alunosAtuais(students).filter((s) => s.active !== false);
  const regras = { ...REGRAS_PONTOS, ...(v.regras || {}) };
  const [aluno, setAluno] = useState('');
  const [rec, setRec] = useState({ nome: '', pontos: 100 });

  useEffect(() => { if (v.ativo) ativos.forEach((s) => onCarregarExecucoes(s.id)); }, [v.ativo]); // eslint-disable-line react-hooks/exhaustive-deps
  const prontos = ativos.every((s) => execucoes[s.id]?.estado === 'ok');
  useEffect(() => {
    if (!v.ativo || !prontos) return;
    const novos = ativos.reduce((acc, s) => pontosDosTreinos(acc, s.id, execucoes[s.id].sessoes, { regras, gerarId: uid }), v.movimentos || []);
    if (novos.length !== (v.movimentos || []).length) modulo.gravar((m) => ({ ...m, movimentos: ativos.reduce((acc, s) => pontosDosTreinos(acc, s.id, execucoes[s.id].sessoes, { regras, gerarId: uid }), m.movimentos || []) }));
  }, [v.ativo, prontos]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!v.ativo) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-body text-muted" style={{ margin: 0 }}>Os alunos ganham pontos por treinos concluídos e trocam-nos por recompensas que define. Está desligado até o ligar.</p>
        <button type="button" onClick={() => modulo.gravar((m) => ({ ...m, ativo: true }))} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Ligar pontos</button>
      </div>
    );
  }
  const dadosDe = (s) => {
    const datas = (execucoes[s.id]?.sessoes || []).filter((x) => x.estado !== 'interrompida').map((x) => x.data);
    return { treinos: datas.length, sequencia: sequenciaSemanas(datas, hoje) };
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Pontos por treino"><input type="number" min="0" value={regras.treino} onChange={(e) => modulo.gravar((m) => ({ ...m, regras: { ...regras, treino: Number(e.target.value) || 0 } }))} className="input-field" /></FormField>
        <FormField label="Limite por dia"><input type="number" min="0" value={regras.limitePorDia} onChange={(e) => modulo.gravar((m) => ({ ...m, regras: { ...regras, limitePorDia: Number(e.target.value) || 0 } }))} className="input-field" /></FormField>
      </div>
      <Titulo>Alunos</Titulo>
      {!prontos && <p className="text-xs font-body text-faint" role="status" style={{ margin: 0 }}>A ler os treinos...</p>}
      {ativos.map((s) => {
        const c = conquistasDe(dadosDe(s));
        return (
          <div key={s.id} className="flex items-center justify-between gap-2 border-b border-hair py-1.5 flex-wrap">
            <span className="text-sm font-body text-primary min-w-0">{s.name} <span className="text-2xs text-faint">{c.map((id) => CONQUISTAS.find((x) => x.id === id).rotulo).join(' · ')}</span></span>
            <span className="font-mono text-sm" style={{ color: 'var(--gold)' }}>{saldo(v.movimentos, s.id, hoje)}</span>
          </div>
        );
      })}
      <Titulo>Recompensas</Titulo>
      <div className="flex gap-2 flex-wrap items-end">
        <div className="flex-1 min-w-0" style={{ flexBasis: 160 }}><FormField label="Nome"><input value={rec.nome} maxLength={60} onChange={(e) => setRec({ ...rec, nome: e.target.value })} className="input-field" placeholder="Ex.: Aula extra" /></FormField></div>
        <div style={{ width: 90 }}><FormField label="Pontos"><input type="number" min="1" value={rec.pontos} onChange={(e) => setRec({ ...rec, pontos: Number(e.target.value) || 1 })} className="input-field" /></FormField></div>
        <button type="button" disabled={!rec.nome.trim()} onClick={() => { modulo.gravar((m) => ({ ...m, recompensas: [...m.recompensas, { id: uid(), nome: rec.nome.trim(), pontos: rec.pontos, ativa: true, stock: '' }] })); setRec({ nome: '', pontos: 100 }); }} className="btn btn-primary" style={{ opacity: rec.nome.trim() ? 1 : 0.45 }}>Criar</button>
      </div>
      {(v.recompensas || []).length === 0 && <Vazio>Sem recompensas. Sem compras a dinheiro nem prémios monetários.</Vazio>}
      <FormField label="Resgatar para"><select value={aluno} onChange={(e) => setAluno(e.target.value)} className="input-field"><option value="">Escolher aluno...</option>{ativos.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></FormField>
      {(v.recompensas || []).map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-2 border-b border-hair py-1.5 flex-wrap">
          <span className="text-sm font-body text-primary">{r.nome} <span className="font-mono text-2xs text-faint">{r.pontos} pts</span></span>
          <span className="flex gap-2">
            <button type="button" disabled={!aluno} onClick={() => { const x = resgatar(v.movimentos, r, { studentId: aluno, hoje, em: new Date().toISOString(), gerarId: uid, resgates: v.resgates }); if (!x.ok) { showToast(x.erro, 'error'); return; } modulo.gravar((m) => ({ ...m, movimentos: x.movimentos, resgates: [...(m.resgates || []), x.resgate] })); showToast('Resgate registado.'); }} className="btn btn-ghost" style={{ fontSize: 12, opacity: aluno ? 1 : 0.45 }}>Resgatar</button>
            <button type="button" onClick={() => modulo.gravar((m) => ({ ...m, recompensas: m.recompensas.map((x) => (x.id === r.id ? { ...x, ativa: !x.ativa } : x)) }))} className="btn btn-ghost" style={{ fontSize: 12 }}>{r.ativa ? 'Desligar' : 'Ligar'}</button>
          </span>
        </div>
      ))}
      {(v.resgates || []).length > 0 && <Titulo>Resgates</Titulo>}
      {[...(v.resgates || [])].reverse().slice(0, 15).map((x) => {
        const r = (v.recompensas || []).find((i) => i.id === x.recompensaId);
        return (
          <div key={x.id} className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-body text-muted">{r?.nome || 'Recompensa'} · {nomeDoAluno(students, x.studentId)} · {dm(String(x.em).slice(0, 10))}{x.estado === 'revertido' ? ' · revertido' : ''}</span>
            {x.estado !== 'revertido' && r && <button type="button" onClick={() => modulo.gravar((m) => ({ ...m, movimentos: reverterResgate(m.movimentos, x, r, { em: new Date().toISOString(), gerarId: uid }), resgates: m.resgates.map((i) => (i.id === x.id ? { ...i, estado: 'revertido' } : i)) }))} className="btn btn-ghost" style={{ fontSize: 12 }}>Reverter</button>}
          </div>
        );
      })}
      <button type="button" onClick={() => modulo.gravar((m) => ({ ...m, ativo: false }))} className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12 }}>Desligar pontos</button>
    </div>
  );
}

function Satisfacao({ modulo, students, tarefas, showToast }) {
  const [entradas, setEntradas] = useState([]);
  useEffect(() => { lerEntradas().then((r) => setEntradas(r.itens)); }, []);
  const pesquisas = modulo.valor.pesquisas || [];
  const respostas = entradas.filter((e) => e.tipo === 'nps').map((e) => ({ id: e.id, studentId: e.aluno_id, pesquisaId: e.ref, nota: e.dados.nota, comentario: e.dados.comentario, em: e.created_at }));
  const r = nps(respostas);
  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={() => modulo.gravar((m) => ({ ...m, pesquisas: [...m.pesquisas, { id: uid(), titulo: 'Recomendaria o meu trabalho a um amigo?', ativa: false, criadaEm: hojeISO() }] }))} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Nova pesquisa</button>
      {pesquisas.length === 0 && <Vazio>Sem pesquisas.</Vazio>}
      {pesquisas.map((p) => (
        <div key={p.id} className="card p-3 flex flex-col gap-2">
          <FormField label="Pergunta (nota de 0 a 10)"><input value={p.titulo} maxLength={120} onChange={(e) => modulo.gravar((m) => ({ ...m, pesquisas: m.pesquisas.map((x) => (x.id === p.id ? { ...x, titulo: e.target.value } : x)) }))} className="input-field" /></FormField>
          <label className="flex items-center gap-2 text-sm font-body text-primary"><input type="checkbox" checked={p.ativa} onChange={(e) => modulo.gravar((m) => ({ ...m, pesquisas: m.pesquisas.map((x) => (x.id === p.id ? { ...x, ativa: e.target.checked } : x)) }))} /> Aparece na área dos alunos</label>
        </div>
      ))}
      <Titulo>Resultado</Titulo>
      <p className="text-sm font-body text-primary" style={{ margin: 0 }}>{r.nps === null ? `${r.respostas} ${r.respostas === 1 ? 'resposta' : 'respostas'}. A nota aparece a partir de 5, para não identificar quem respondeu.` : `NPS ${r.nps} (${r.promotores} promotores, ${r.detratores} detratores, ${r.respostas} respostas).`}</p>
      {respostas.filter((x) => notaBaixa(x)).map((x) => (
        <div key={x.id} className="flex items-center justify-between gap-2 border-b border-hair py-1.5 flex-wrap">
          <span className="text-sm font-body text-muted min-w-0">Nota {x.nota} · {nomeDoAluno(students, x.studentId)}{x.comentario ? ` · ${x.comentario}` : ''}</span>
          <button type="button" onClick={async () => { if (await tarefas.gravar((t) => ({ ...t, itens: [...t.itens, { id: uid(), titulo: `Falar com ${nomeDoAluno(students, x.studentId)} sobre a nota ${x.nota}`, studentId: x.studentId, data: hojeISO(), prioridade: 'alta', origem: 'satisfacao', feita: false, criadaEm: hojeISO() }] }))) showToast('Tarefa criada.'); }} className="btn btn-ghost" style={{ fontSize: 12 }}>Criar tarefa</button>
        </div>
      ))}
    </div>
  );
}

export default function Fidelizacao({ students, execucoes, onCarregarExecucoes, showToast }) {
  const desafios = useModulo('desafios');
  const pontos = useModulo('pontos');
  const satisfacao = useModulo('satisfacao');
  const crm = useModulo('crm');
  const tarefas = useModulo('tarefas');
  const [aba, setAba] = useState('desafios');
  return (
    <ProntoOu modulos={[desafios, pontos, satisfacao, crm, tarefas]}>{() => (
      <div className="flex flex-col gap-3">
        <Abas valor={aba} onMudar={setAba} abas={[{ id: 'desafios', rotulo: 'Desafios' }, { id: 'pontos', rotulo: 'Pontos' }, { id: 'satisfacao', rotulo: 'Satisfação' }]} />
        {aba === 'desafios' && <Desafios modulo={desafios} crm={crm} showToast={showToast} />}
        {aba === 'pontos' && <Pontos modulo={pontos} students={students} execucoes={execucoes} onCarregarExecucoes={onCarregarExecucoes} showToast={showToast} />}
        {aba === 'satisfacao' && <Satisfacao modulo={satisfacao} students={students} tarefas={tarefas} showToast={showToast} />}
      </div>
    )}</ProntoOu>
  );
}
