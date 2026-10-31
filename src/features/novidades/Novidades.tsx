// O que chegou de fora: pedidos e respostas dos alunos, inscrições públicas. Nada entra
// nos dados da conta sozinho: o treinador aceita, e só então é escrito.
import { useEffect, useState } from 'react';
import { useModulo } from '../useModulo';
import { Abas, Aviso, Vazio, dm, hojeISO, nomeDoAluno, uid } from '../comum';
import { auditar, lerAuditoria, lerEntradas, marcarEntrada, temServidor, urlDeDocumento } from '../servidor';
import { estadoDaFatura, formatar, totais } from '../planos/logica';
import { pendentes } from '../avaliacoes/logica';
import { pontosDoCheckin } from '../metas/logica';
import { juntarLead } from '../crm/logica';
import { aceitarContrato } from '../planos/logica';

const ROTULO_PONTO = { dor: 'dor', energia: 'pouca energia', sono: 'pouco sono', stress: 'stress' };

// O que a própria conta já sabe, calculado ao abrir. Nada disto se grava.
function atualizacoes({ students, sessions, planos, avaliacoes, hoje }) {
  const em = (d) => Math.round((Date.parse(`${d}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / 86400000);
  const lista = [];
  students.filter((s) => s.birthDate && !s.naLixeira && s.active !== false).forEach((s) => {
    const aqui = `${hoje.slice(0, 4)}${s.birthDate.slice(4)}`;
    const dias = em(aqui) < 0 ? em(`${Number(hoje.slice(0, 4)) + 1}${s.birthDate.slice(4)}`) : em(aqui);
    if (dias <= 7) lista.push({ id: `anos-${s.id}`, ordem: dias, texto: dias === 0 ? `Faz anos hoje: ${s.name}` : `${s.name} faz anos em ${dias} ${dias === 1 ? 'dia' : 'dias'}` });
  });
  (planos.faturas || []).forEach((f) => {
    const e = estadoDaFatura(f, hoje);
    const nome = nomeDoAluno(students, f.studentId);
    if (e === 'vencida') lista.push({ id: `venc-${f.id}`, ordem: 2, texto: `Fatura em atraso de ${nome}: ${formatar(totais(f.itens, f).total, f.moeda)}, venceu em ${dm(f.vencimento)}` });
    else if (e === 'aberta' && f.vencimento && em(f.vencimento) <= 3) lista.push({ id: `prox-${f.id}`, ordem: 3, texto: `Fatura de ${nome} vence em ${dm(f.vencimento)}` });
  });
  pendentes(avaliacoes.recorrencias, hoje).filter((r) => r.atrasada).forEach((r) => lista.push({ id: `rec-${r.id}`, ordem: 1, texto: `Avaliação em atraso: ${nomeDoAluno(students, r.studentId)}` }));
  (avaliacoes.registos || []).filter((r) => r.estado === 'aguarda-aluno' && r.prazo && r.prazo < hoje).forEach((r) => lista.push({ id: `onl-${r.id}`, ordem: 2, texto: `${nomeDoAluno(students, r.studentId)} ainda não respondeu à avaliação online` }));
  sessions.filter((s) => s.status === 'falta' && s.faltaPrecisaReposicao && !s.reposicaoSessionId && s.faltaCreditoValidade && s.faltaCreditoValidade >= hoje && em(s.faltaCreditoValidade) <= 7).forEach((s) => lista.push({ id: `cred-${s.id}`, ordem: 3, texto: `Reposição de ${nomeDoAluno(students, s.studentId)} expira em ${dm(s.faltaCreditoValidade)}` }));
  return lista.sort((a, b) => a.ordem - b.ordem);
}

const TITULOS = {
  checkin: 'Check-in do dia', progresso_aluno: 'Progresso publicado pelo aluno',
  pedido_aula: 'Pedido de aula', cancelamento: 'Pedido de cancelamento', lista_espera: 'Quer entrar na lista de espera', resposta_formulario: 'Formulário respondido', avaliacao_online: 'Avaliação preenchida', contrato_aceite: 'Contrato aceite', perfil: 'Atualização de contacto', nps: 'Resposta de satisfação', lead: 'Pedido de informação', inscricao: 'Inscrição', indicacao: 'Indicação', desafio_inscricao: 'Inscrição em desafio', desafio_conclusao: 'Etapa de desafio concluída',
};

function resumo(e) {
  const d = e.dados || {};
  switch (e.tipo) {
    case 'pedido_aula': return `${dm(d.date)} às ${d.startTime}${d.notas ? ` · ${d.notas}` : ''}`;
    case 'cancelamento': return `${dm(d.date)} às ${d.startTime}${d.motivo ? ` · ${d.motivo}` : ''}`;
    case 'resposta_formulario': return d.nomeFormulario || '';
    case 'contrato_aceite': return `«${d.titulo || ''}», aceite por ${d.nome || ''}`;
    case 'perfil': return Object.entries(d).filter(([k]) => ['phone', 'email'].includes(k)).map(([k, v]) => `${k === 'phone' ? 'Telefone' : 'Email'}: ${v}`).join(' · ');
    case 'checkin': { const ROT = { sono: 'Sono', energia: 'Energia', stress: 'Stress', dor: 'Dor', motivacao: 'Motivação', recuperacao: 'Recuperação' }; return Object.entries(ROT).filter(([k]) => d[k] != null).map(([k, r]) => `${r} ${d[k]}`).join(' · ') + (d.nota ? ` · ${d.nota}` : ''); }
    case 'progresso_aluno': return [d.peso && `Peso: ${d.peso}`, d.medida, d.texto, d.comFoto && 'com fotografia'].filter(Boolean).join(' · ');
    case 'nps': return `Nota ${d.nota}${d.comentario ? ` · ${d.comentario}` : ''}`;
    case 'desafio_conclusao': return d.etapaTitulo || '';
    default: return [d.nome, d.email, d.telefone].filter(Boolean).join(' · ');
  }
}

export default function Novidades({ students, sessions, formularios, onMudarSessoes, onMudarAlunos, onMudarFormularios, showToast, quem }) {
  const crm = useModulo('crm');
  const planos = useModulo('planos');
  const docs = useModulo('documentos');
  const aval = useModulo('avaliacoes');
  const [itens, setItens] = useState(null);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState('atualizacoes');
  const [aGravar, setAGravar] = useState(null);
  const [registo, setRegisto] = useState(null);
  async function ler() {
    setItens(null); setErro('');
    const r = await lerEntradas();
    if (!r.ok) setErro(r.erro);
    setItens(r.itens);
  }
  useEffect(() => { ler(); }, []);

  // Só depois de escrever é que a entrada passa a tratada: uma falha fica para repetir.
  async function fechar(e, escrever) {
    setAGravar(e.id);
    const ok = escrever ? await escrever() : true;
    if (ok !== false && (await marcarEntrada(e.id, 'tratada'))) { setItens((l) => l.map((x) => (x.id === e.id ? { ...x, estado: 'tratada' } : x))); if (escrever) auditar(quem, `Aceite: ${TITULOS[e.tipo] || e.tipo}`, e.id); }
    else showToast('Não ficou gravado. Tente de novo.', 'error');
    setAGravar(null);
  }

  const acoes = {
    pedido_aula: (e) => fechar(e, () => onMudarSessoes([...sessions, { id: uid(), kind: 'aula', studentId: e.aluno_id, date: e.dados.date, startTime: e.dados.startTime, endTime: e.dados.endTime, type: 'fixo', status: 'agendado', notes: e.dados.notas || '' }])),
    cancelamento: (e) => fechar(e, () => onMudarSessoes(sessions.map((s) => (s.id === e.ref && s.studentId === e.aluno_id ? { ...s, status: 'cancelado' } : s)))),
    resposta_formulario: (e) => fechar(e, async () => {
      const envio = (docs.valor.envios || []).find((x) => x.id === e.ref);
      await onMudarFormularios({ ...formularios, respostas: [...formularios.respostas, { id: uid(), modeloId: e.dados.modeloId, studentId: e.aluno_id, nome: e.dados.nomeFormulario, em: e.created_at, quem: 'O próprio aluno', respostas: e.dados.respostas || {}, assinaturaId: '', assinadoEm: e.dados.aceiteEm || null, assinadoPor: e.dados.nomeAssinado || '', copiaModelo: envio?.modelo || null }] });
      return docs.gravar((m) => ({ ...m, envios: (m.envios || []).map((x) => (x.id === e.ref ? { ...x, estado: 'respondido' } : x)) }));
    }),
    avaliacao_online: (e) => fechar(e, () => aval.gravar((m) => ({ ...m, registos: m.registos.map((r) => (r.id === e.ref && r.studentId === e.aluno_id ? { ...r, valores: { ...r.valores, ...(e.dados.valores || {}) }, estado: 'rascunho', respondidoEm: e.created_at } : r)) }))),
    contrato_aceite: (e) => fechar(e, () => planos.gravar((m) => {
      const envio = (m.envios || []).find((x) => x.id === e.ref);
      if (!envio) return m;
      return { ...m, aceites: [...(m.aceites || []), aceitarContrato({ id: envio.modeloId, versao: envio.versao, titulo: envio.titulo, texto: envio.texto }, { studentId: e.aluno_id, nome: e.dados.nome, em: e.created_at, id: e.id })], envios: m.envios.map((x) => (x.id === e.ref ? { ...x, estado: 'aceite' } : x)) };
    })),
    progresso_aluno: (e) => fechar(e, () => (e.dados.path ? docs.gravar((m) => ({ ...m, itens: [...m.itens, { id: e.id, studentId: e.aluno_id, titulo: `Progresso de ${dm(String(e.created_at).slice(0, 10))}`, path: e.dados.path, nome: 'progresso', tipo: 'image/jpeg', visivelAoAluno: true, criadoEm: e.created_at, quem: 'O próprio aluno' }] })) : true)),
    perfil: (e) => fechar(e, () => onMudarAlunos(students.map((s) => (s.id === e.aluno_id ? { ...s, ...(e.dados.phone ? { phone: e.dados.phone } : {}), ...(e.dados.email ? { email: e.dados.email } : {}) } : s)))),
  };
  const paraContacto = (e) => fechar(e, () => {
    const r = juntarLead(crm.valor.leads, { nome: e.dados.nome, email: e.dados.email, telefone: e.dados.telefone, notas: e.dados.mensagem, origem: e.dados.origem || e.tipo }, { gerarId: uid, agora: e.created_at });
    return crm.gravar((v) => ({ ...v, leads: r.leads }));
  });
  const ROTULO_ACEITAR = { progresso_aluno: 'Marcar como revisto', pedido_aula: 'Marcar a aula', cancelamento: 'Cancelar a aula', resposta_formulario: 'Guardar na ficha', avaliacao_online: 'Passar a rascunho', contrato_aceite: 'Registar o aceite', perfil: 'Atualizar a ficha' };
  const paraLead = ['lead', 'inscricao', 'indicacao'];
  const pronto = [crm, planos, docs, aval].every((m) => m.estado === 'ok');

  if (itens === null || !pronto) return <p className="text-sm font-body text-faint" role="status">A carregar...</p>;
  if (erro) return <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-body" style={{ margin: 0, color: 'var(--rust)' }}>{erro}</p><button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={ler}>Tentar de novo</button></div>;
  const lista = itens.filter((e) => e.estado === aba);
  const hoje = hojeISO();
  const derivadas = atualizacoes({ students, sessions, planos: planos.valor, avaliacoes: aval.valor, hoje });
  async function verFoto(e) { const u = await urlDeDocumento(e.dados.path); if (u) window.open(u, '_blank', 'noopener'); else showToast('Não foi possível abrir a fotografia.', 'error'); }
  async function abrirRegisto() { setAba('registo'); setRegisto(null); const r = await lerAuditoria(); setRegisto(r); }
  return (
    <div className="flex flex-col gap-3">
      <Abas valor={aba} onMudar={(a) => (a === 'registo' ? abrirRegisto() : setAba(a))} abas={[{ id: 'atualizacoes', rotulo: `Atualizações (${derivadas.length})` }, { id: 'nova', rotulo: `Por tratar (${itens.filter((e) => e.estado === 'nova').length})` }, { id: 'tratada', rotulo: 'Tratadas' }, { id: 'registo', rotulo: 'Registo' }]} />
      {!temServidor() && aba !== 'atualizacoes' && <Aviso>Os pedidos dos alunos e o registo chegam com a conta ligada ao servidor.</Aviso>}
      {aba === 'atualizacoes' && derivadas.length === 0 && <Vazio>Sem atualizações.</Vazio>}
      {aba === 'atualizacoes' && derivadas.map((d) => <p key={d.id} className="text-sm font-body text-primary border-b border-hair pb-2" style={{ margin: 0 }}>{d.texto}</p>)}
      {aba === 'registo' && registo === null && <p className="text-sm font-body text-faint" role="status">A carregar...</p>}
      {aba === 'registo' && registo && !registo.ok && <p className="text-sm font-body" style={{ margin: 0, color: 'var(--rust)' }}>{registo.erro}</p>}
      {aba === 'registo' && registo && registo.ok && registo.itens.length === 0 && <Vazio>Sem registos.</Vazio>}
      {aba === 'registo' && registo && registo.itens.map((r) => <p key={r.id} className="text-sm font-body text-muted border-b border-hair pb-2" style={{ margin: 0 }}><span className="font-mono text-2xs text-faint">{dm(String(r.created_at).slice(0, 10))}</span> {r.acao}{r.quem ? ` · ${r.quem}` : ''}</p>)}
      {['nova', 'tratada'].includes(aba) && temServidor() && lista.length === 0 && <Vazio>{aba === 'nova' ? 'Nada por tratar.' : 'Nada tratado ainda.'}</Vazio>}
      {lista.map((e) => (
        <div key={e.id} className="card p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-body text-primary min-w-0" style={{ fontWeight: 600 }}>{TITULOS[e.tipo] || e.tipo}</span>
            <span className="text-2xs font-body text-faint">{dm(String(e.created_at).slice(0, 10))}</span>
          </div>
          <p className="text-xs font-body text-muted" style={{ margin: 0 }}>{e.aluno_id ? `${nomeDoAluno(students, e.aluno_id)} · ` : ''}{resumo(e)}</p>
          {e.tipo === 'checkin' && pontosDoCheckin(e.dados).length > 0 && <p className="text-xs font-body" style={{ margin: 0, color: 'var(--gold)' }}>Ponto a ter em conta: {pontosDoCheckin(e.dados).map((p) => ROTULO_PONTO[p]).join(', ')}. Referido pelo aluno; não é um diagnóstico, e o treino não muda sozinho.</p>}
          {e.tipo === 'progresso_aluno' && e.dados?.path && <button type="button" onClick={() => verFoto(e)} className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12 }}>Ver fotografia</button>}
          {e.tipo === 'resposta_formulario' && e.dados?.sintomas && <p className="text-xs font-body" style={{ margin: 0, color: 'var(--gold)' }}>Há pontos a ter em conta nesta resposta. Assinala; não é um diagnóstico.</p>}
          {e.estado === 'nova' && (
            <div className="flex items-center gap-2 flex-wrap">
              {acoes[e.tipo] && <button type="button" disabled={aGravar === e.id} onClick={() => acoes[e.tipo](e)} className="btn btn-primary" style={{ fontSize: 12 }}>{ROTULO_ACEITAR[e.tipo]}</button>}
              {paraLead.includes(e.tipo) && <button type="button" disabled={aGravar === e.id} onClick={() => paraContacto(e)} className="btn btn-primary" style={{ fontSize: 12 }}>Passar a contacto</button>}
              <button type="button" disabled={aGravar === e.id} onClick={() => fechar(e)} className="btn btn-ghost" style={{ fontSize: 12 }}>{acoes[e.tipo] || paraLead.includes(e.tipo) ? 'Recusar' : 'Marcar como vista'}</button>
            </div>
          )}
        </div>
      ))}
      <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>Conta: {quem}</p>
    </div>
  );
}
