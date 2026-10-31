// Planos e faturas dos alunos: a cobrança aluno → treinador, à parte da subscrição do
// PTMANAGER. Sem a carteira ligada regista-se à mão; ligada, só o fornecedor confirma.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog, FormField } from '../../components/UiAtoms';
import { useModulo } from '../useModulo';
import { Abas, Aviso, Grupo, ProntoOu, Titulo, Vazio, alunosAtuais, csvDe, descarregar, dm, hojeISO, nomeDoAluno, uid } from '../comum';
import { auditar, chamar, lerPagamentos, temServidor } from '../servidor';
import {
  CADENCIAS, ESTADOS_FATURA, estadoDaFatura, faturasEmFalta, formatar, mrrClientes, novaVersaoModelo, pagoDe, paraCentimos, proximaDoContrato, reembolsar, registarPagamento, relatorio, totais,
} from './logica';

const METODOS = { numerario: 'Numerário', transferencia: 'Transferência', mbway: 'MB WAY (fora da aplicação)', cartao: 'Cartão', outro: 'Outro' };
const ROTULO_CADENCIA = { mensal: 'Mensal', trimestral: 'Trimestral', anual: 'Anual', livre: 'Sem renovação', pacote: 'Pacote de aulas' };
const COR_ESTADO = { paga: 'var(--ok)', vencida: 'var(--gold)', parcial: 'var(--sky)', anulada: 'var(--text-faint)', rascunho: 'var(--text-faint)', reembolsada: 'var(--text-muted)', incobravel: 'var(--text-muted)', aberta: 'var(--text-primary)' };

function CampoEuros({ rotulo, centimos, onMudar }) {
  const [t, setT] = useState(centimos ? (centimos / 100).toString().replace('.', ',') : '');
  const inv = t !== '' && paraCentimos(t) === null;
  return (
    <FormField label={rotulo}>
      <input value={t} inputMode="decimal" onChange={(e) => { setT(e.target.value); const c = paraCentimos(e.target.value); if (c !== null) onMudar(c); }} className="input-field" aria-invalid={inv} />
      {inv && <span className="text-2xs font-body" style={{ color: 'var(--rust)' }}>Use um valor como 49,90.</span>}
    </FormField>
  );
}

function Planos({ modulo }) {
  const modelos = modulo.valor.modelos || [];
  const mudar = (id, c) => modulo.gravar((m) => ({ ...m, modelos: m.modelos.map((x) => (x.id === id ? { ...x, ...c } : x)) }));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-body text-muted" style={{ margin: 0 }}>O que vende aos seus alunos. Mudar o preço aqui só vale para contratos novos. O PTMANAGER não é software de faturação certificado: um comprovativo daqui não substitui a fatura legal.</p>
      <button type="button" onClick={() => modulo.gravar((m) => ({ ...m, modelos: [...m.modelos, { id: uid(), nome: 'Plano novo', cadencia: 'mensal', centimos: 0, moeda: 'EUR', descricao: '', ativo: true, impostoBp: 0 }] }))} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Novo plano</button>
      {modelos.length === 0 && <Vazio>Sem planos.</Vazio>}
      {modelos.map((p) => (
        <div key={p.id} className="card p-3 flex flex-col gap-2">
          <FormField label="Nome"><input value={p.nome} maxLength={60} onChange={(e) => mudar(p.id, { nome: e.target.value })} className="input-field" /></FormField>
          <div className="grid grid-cols-2 gap-2">
            <CampoEuros rotulo="Preço (€)" centimos={p.centimos} onMudar={(c) => mudar(p.id, { centimos: c })} />
            <FormField label="IVA (%)"><input value={p.impostoBp ? String(p.impostoBp / 100).replace('.', ',') : ''} inputMode="decimal" onChange={(e) => { const x = parseFloat(e.target.value.replace(',', '.')); mudar(p.id, { impostoBp: Number.isFinite(x) && x >= 0 && x <= 100 ? Math.round(x * 100) : 0 }); }} className="input-field" /></FormField>
            <FormField label="Renovação"><select value={p.cadencia} onChange={(e) => mudar(p.id, { cadencia: e.target.value })} className="input-field">{Object.keys(CADENCIAS).map((k) => <option key={k} value={k}>{ROTULO_CADENCIA[k]}</option>)}</select></FormField>
          </div>
          <FormField label="Descrição (aparece na página de vendas)"><textarea rows={2} maxLength={300} value={p.descricao || ''} onChange={(e) => mudar(p.id, { descricao: e.target.value })} className="input-field" /></FormField>
          <label className="flex items-center gap-2 text-sm font-body text-primary"><input type="checkbox" checked={p.ativo !== false} onChange={(e) => mudar(p.id, { ativo: e.target.checked })} /> À venda</label>
        </div>
      ))}
    </div>
  );
}

function Contratos({ modulo, students, showToast }) {
  const [novo, setNovo] = useState({ studentId: '', planoId: '', inicio: hojeISO() });
  const hoje = hojeISO();
  const contratos = modulo.valor.contratos || [];
  const planos = (modulo.valor.modelos || []).filter((p) => p.ativo !== false);
  const mudar = (id, c) => modulo.gravar((m) => ({ ...m, contratos: m.contratos.map((x) => (x.id === id ? { ...x, ...c } : x)) }));
  async function criar() {
    const p = planos.find((x) => x.id === novo.planoId);
    if (!p) return;
    const c = { id: uid(), studentId: novo.studentId, planoId: p.id, nome: p.nome, cadencia: p.cadencia, centimos: p.centimos, moeda: p.moeda || 'EUR', inicio: novo.inicio, estado: 'ativo', impostoBp: p.impostoBp || 0 };
    await modulo.gravar((m) => ({ ...m, contratos: [...m.contratos, c], faturas: [...m.faturas, ...faturasEmFalta(c, m.faturas, hoje)] }));
    showToast('Plano atribuído.');
    setNovo({ studentId: '', planoId: '', inicio: hoje });
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="card p-3 flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <FormField label="Aluno"><select value={novo.studentId} onChange={(e) => setNovo({ ...novo, studentId: e.target.value })} className="input-field"><option value="">Escolher...</option>{alunosAtuais(students).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></FormField>
          <FormField label="Plano"><select value={novo.planoId} onChange={(e) => setNovo({ ...novo, planoId: e.target.value })} className="input-field"><option value="">Escolher...</option>{planos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></FormField>
        </div>
        <FormField label="Início"><input type="date" value={novo.inicio} onChange={(e) => setNovo({ ...novo, inicio: e.target.value })} className="input-field" /></FormField>
        <button type="button" onClick={criar} disabled={!novo.studentId || !novo.planoId} className="btn btn-primary" style={{ alignSelf: 'flex-start', opacity: novo.studentId && novo.planoId ? 1 : 0.45 }}>Atribuir plano</button>
      </div>
      {contratos.length === 0 && <Vazio>Nenhum aluno com plano atribuído.</Vazio>}
      {contratos.map((c) => (
        <div key={c.id} className="card p-3 flex items-center justify-between gap-2 flex-wrap">
          <span className="min-w-0">
            <span className="block text-sm font-body text-primary" style={{ fontWeight: 600 }}>{nomeDoAluno(students, c.studentId)}</span>
            <span className="block text-xs font-body text-muted">{c.nome} · {formatar(c.centimos, c.moeda)} · {ROTULO_CADENCIA[c.cadencia]}{c.estado === 'ativo' && proximaDoContrato(c, hoje) ? ` · próxima ${dm(proximaDoContrato(c, hoje))}` : ''}</span>
          </span>
          <select value={c.estado} aria-label={`Estado do plano de ${nomeDoAluno(students, c.studentId)}`} onChange={(e) => mudar(c.id, { estado: e.target.value })} className="input-field" style={{ width: 130 }}>
            <option value="ativo">Ativo</option><option value="pausado">Pausado</option><option value="cancelado">Cancelado</option>
          </select>
        </div>
      ))}
    </div>
  );
}

function Faturas({ modulo, students, showToast, carteiraLigada, quem, onImprimir }) {
  const hoje = hojeISO();
  const [filtro, setFiltro] = useState('por-pagar');
  const [pagar, setPagar] = useState(null);
  const [anular, setAnular] = useState(null);
  const [link, setLink] = useState({});
  const faturas = modulo.valor.faturas || [];
  const lista = faturas.filter((f) => {
    const e = estadoDaFatura(f, hoje);
    return filtro === 'todas' || (filtro === 'por-pagar' ? ['aberta', 'vencida', 'parcial'].includes(e) : e === filtro);
  }).sort((a, b) => String(b.vencimento).localeCompare(String(a.vencimento)));
  const mudar = (id, fn) => modulo.gravar((m) => ({ ...m, faturas: m.faturas.map((x) => (x.id === id ? fn(x) : x)) }));

  async function linkDePagamento(f) {
    const r = await chamar('cobranca-checkout', { faturaId: f.id });
    if (r.ok && r.url) setLink({ ...link, [f.id]: r.url }); else showToast(r.erro || 'Sem ligação de pagamento.', 'error');
  }
  function imprimir(f) {
    const t = totais(f.itens, f);
    onImprimir({ titulo: `Comprovativo ${f.id.slice(-8)}`, subtitulo: `${nomeDoAluno(students, f.studentId)} · ${dm(f.emissao)}`, nota: 'Comprovativo interno de pagamento. Não é um documento fiscal.', secoes: [
      { titulo: 'Itens', linhas: f.itens.map((i) => [i.descricao, formatar(i.centimos * (i.quantidade || 1), f.moeda)]) },
      { titulo: 'Valores', linhas: [['Total', formatar(t.total, f.moeda)], ['Pago', formatar(pagoDe(f), f.moeda)], ['Estado', ESTADOS_FATURA[estadoDaFatura(f, hoje)]]] },
    ] });
  }
  return (
    <div className="flex flex-col gap-3">
      <FormField label="Mostrar">
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="input-field">
          <option value="por-pagar">Por pagar</option><option value="vencida">Vencidas</option><option value="paga">Pagas</option><option value="anulada">Anuladas</option><option value="todas">Todas</option>
        </select>
      </FormField>
      {lista.length === 0 && <Vazio>Nenhuma fatura aqui.</Vazio>}
      {lista.map((f) => {
        const e = estadoDaFatura(f, hoje);
        const t = totais(f.itens, f).total;
        return (
          <div key={f.id} className="card p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm font-body text-primary min-w-0" style={{ fontWeight: 600 }}>{nomeDoAluno(students, f.studentId)}</span>
              <span className="text-2xs font-body" style={{ color: COR_ESTADO[e], fontWeight: 600 }}>{ESTADOS_FATURA[e]}</span>
            </div>
            <p className="text-xs font-body text-muted" style={{ margin: 0 }}>{f.itens[0]?.descricao} · <span className="font-mono">{formatar(t, f.moeda)}</span>{pagoDe(f) > 0 && e !== 'paga' ? ` · pago ${formatar(pagoDe(f), f.moeda)}` : ''} · vence {dm(f.vencimento)}</p>
            {link[f.id] && <input readOnly value={link[f.id]} aria-label="Ligação de pagamento" className="input-field" onFocus={(ev) => ev.target.select()} />}
            <div className="flex items-center gap-2 flex-wrap">
              {['aberta', 'vencida', 'parcial'].includes(e) && !carteiraLigada && <button type="button" onClick={() => setPagar({ f, centimos: t - pagoDe(f), metodo: 'transferencia', referencia: '' })} className="btn btn-primary" style={{ fontSize: 12 }}>Registar pagamento</button>}
              {['aberta', 'vencida', 'parcial'].includes(e) && carteiraLigada && <button type="button" onClick={() => linkDePagamento(f)} className="btn btn-primary" style={{ fontSize: 12 }}>Criar ligação de pagamento</button>}
              {['aberta', 'vencida'].includes(e) && <button type="button" onClick={() => setAnular(f)} className="btn btn-ghost" style={{ fontSize: 12 }}>Anular</button>}
              {e === 'vencida' && <button type="button" onClick={() => mudar(f.id, (x) => ({ ...x, estado: 'incobravel' }))} className="btn btn-ghost" style={{ fontSize: 12 }}>Marcar incobrável</button>}
              {['vencida'].includes(e) && <label className="flex items-center gap-1.5 text-xs font-body text-muted"><input type="checkbox" checked={Boolean(f.override)} onChange={(ev) => { mudar(f.id, (x) => ({ ...x, override: ev.target.checked })); auditar(quem, ev.target.checked ? 'Acesso mantido apesar da fatura' : 'Exceção de acesso retirada', f.id); }} /> Manter o acesso</label>}
              {pagoDe(f) > 0 && (f.pagamentos || []).every((p) => p.origem !== 'webhook') && <button type="button" onClick={() => { const r = reembolsar(f, { id: uid(), centimos: pagoDe(f), em: new Date().toISOString(), motivo: 'Registado à mão' }); if (r.ok) { mudar(f.id, () => r.fatura); auditar(quem, 'Devolução registada', f.id, { centimos: pagoDe(f) }); } else showToast(r.erro, 'error'); }} className="btn btn-ghost" style={{ fontSize: 12 }}>Registar devolução</button>}
              <button type="button" onClick={() => imprimir(f)} className="btn btn-ghost" style={{ fontSize: 12 }}>Comprovativo</button>
            </div>
          </div>
        );
      })}
      {pagar && (
        <div className="card p-3 flex flex-col gap-2">
          <Titulo>Pagamento de {nomeDoAluno(students, pagar.f.studentId)}</Titulo>
          <p className="text-xs font-body text-muted" style={{ margin: 0 }}>Regista um pagamento que recebeu fora da aplicação. Fica assinalado como registado à mão por {quem}.</p>
          <div className="grid grid-cols-2 gap-2">
            <CampoEuros rotulo="Valor (€)" centimos={pagar.centimos} onMudar={(c) => setPagar({ ...pagar, centimos: c })} />
            <FormField label="Método"><select value={pagar.metodo} onChange={(e) => setPagar({ ...pagar, metodo: e.target.value })} className="input-field">{Object.entries(METODOS).map(([k, r]) => <option key={k} value={k}>{r}</option>)}</select></FormField>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={!(pagar.centimos > 0)} onClick={() => { mudar(pagar.f.id, (x) => registarPagamento(x, { id: uid(), centimos: pagar.centimos, metodo: pagar.metodo, em: new Date().toISOString(), origem: 'manual', quem })); auditar(quem, 'Pagamento registado à mão', pagar.f.id, { centimos: pagar.centimos, metodo: pagar.metodo }); setPagar(null); showToast('Pagamento registado.'); }} className="btn btn-primary" style={{ fontSize: 12, opacity: pagar.centimos > 0 ? 1 : 0.45 }}>Confirmar</button>
            <button type="button" onClick={() => setPagar(null)} className="btn btn-ghost" style={{ fontSize: 12 }}>Cancelar</button>
          </div>
        </div>
      )}
      {anular && <ConfirmDialog title="Anular fatura" message="A fatura deixa de contar como dívida, e continua no histórico." confirmLabel="Anular" onCancel={() => setAnular(null)} onConfirm={() => { mudar(anular.id, (x) => ({ ...x, estado: 'anulada', anuladaEm: hoje })); auditar(quem, 'Fatura anulada', anular.id); setAnular(null); }} />}
    </div>
  );
}

function ModelosContrato({ modulo, students }) {
  const modelos = modulo.valor.modelosContrato || [];
  const aceites = modulo.valor.aceites || [];
  const [texto, setTexto] = useState({});
  const [envio, setEnvio] = useState({});
  return (
    <div className="flex flex-col gap-3">
      <Aviso>Aceite eletrónico simples: guarda o texto exato, quem aceitou e quando. Não é assinatura eletrónica qualificada, nem um modelo jurídico: o texto é seu e deve ser revisto por um advogado.</Aviso>
      <button type="button" onClick={() => modulo.gravar((m) => ({ ...m, modelosContrato: [...m.modelosContrato, { id: uid(), titulo: 'Contrato de serviço', texto: '', versao: 1, envios: [] }] }))} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Novo modelo</button>
      {modelos.length === 0 && <Vazio>Sem modelos de contrato.</Vazio>}
      {modelos.map((m) => {
        const t = texto[m.id] ?? m.texto;
        return (
          <div key={m.id} className="card p-3 flex flex-col gap-2">
            <FormField label={`Título · versão ${m.versao}`}><input value={m.titulo} maxLength={80} onChange={(e) => modulo.gravar((x) => ({ ...x, modelosContrato: x.modelosContrato.map((i) => (i.id === m.id ? { ...i, titulo: e.target.value } : i)) }))} className="input-field" /></FormField>
            <FormField label="Texto"><textarea rows={5} value={t} maxLength={20000} onChange={(e) => setTexto({ ...texto, [m.id]: e.target.value })} className="input-field" /></FormField>
            <button type="button" disabled={t === m.texto} onClick={() => modulo.gravar((x) => ({ ...x, modelosContrato: x.modelosContrato.map((i) => (i.id === m.id ? novaVersaoModelo(i, t) : i)) }))} className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12, opacity: t === m.texto ? 0.45 : 1 }}>Guardar nova versão</button>
            <div className="flex gap-2 flex-wrap">
              <select aria-label={`Enviar ${m.titulo} a`} value={envio[m.id] || ''} onChange={(e) => setEnvio({ ...envio, [m.id]: e.target.value })} className="input-field" style={{ flex: '1 1 180px', minWidth: 0 }}><option value="">Enviar a...</option>{alunosAtuais(students).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <button type="button" disabled={!envio[m.id] || !m.texto} onClick={() => { modulo.gravar((x) => ({ ...x, envios: [...(x.envios || []), { id: uid(), modeloId: m.id, versao: m.versao, titulo: m.titulo, texto: m.texto, studentId: envio[m.id], em: new Date().toISOString(), estado: 'aguarda' }] })); setEnvio({ ...envio, [m.id]: '' }); }} className="btn btn-ghost" style={{ fontSize: 12, opacity: envio[m.id] && m.texto ? 1 : 0.45 }}>Enviar para aceitar</button>
            </div>
          </div>
        );
      })}
      <Titulo>À espera de aceite</Titulo>
      {(modulo.valor.envios || []).filter((e) => e.estado === 'aguarda').length === 0 && <Vazio>Nenhum.</Vazio>}
      {(modulo.valor.envios || []).filter((e) => e.estado === 'aguarda').map((e) => <p key={e.id} className="text-sm font-body text-muted" style={{ margin: 0 }}>{e.titulo} · {nomeDoAluno(students, e.studentId)} · v{e.versao}</p>)}
      <Titulo>Aceites</Titulo>
      {aceites.length === 0 && <Vazio>Nenhum.</Vazio>}
      {aceites.map((a) => <p key={a.id} className="text-sm font-body text-muted" style={{ margin: 0 }}>{a.titulo} · {nomeDoAluno(students, a.studentId)} · v{a.versao} · aceite por «{a.nome}» em {dm(String(a.aceiteEm).slice(0, 10))}</p>)}
    </div>
  );
}

function Numeros({ modulo, students }) {
  const hoje = hojeISO();
  const [de, setDe] = useState(`${hoje.slice(0, 7)}-01`);
  const [ate, setAte] = useState(hoje);
  const r = useMemo(() => relatorio(modulo.valor.faturas, { de, ate, hoje }), [modulo.valor.faturas, de, ate, hoje]);
  function csv() {
    const linhas = [['Aluno', 'Emissão', 'Vencimento', 'Estado', 'Total', 'Pago'], ...(modulo.valor.faturas || []).filter((f) => f.emissao >= de && f.emissao <= ate).map((f) => [nomeDoAluno(students, f.studentId), f.emissao, f.vencimento, ESTADOS_FATURA[estadoDaFatura(f, hoje)], (totais(f.itens, f).total / 100).toLocaleString('pt-PT'), (pagoDe(f) / 100).toLocaleString('pt-PT')])];
    descarregar('faturas.csv', csvDe(linhas));
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <FormField label="De"><input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="input-field" /></FormField>
        <FormField label="Até"><input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="input-field" /></FormField>
      </div>
      <div className="card p-3 flex flex-col gap-1 font-body text-sm text-primary">
        <p style={{ margin: 0 }}>Recebido: <b className="font-mono">{formatar(r.recebido)}</b></p>
        <p style={{ margin: 0 }}>A receber: <b className="font-mono">{formatar(r.aReceber)}</b></p>
        <p style={{ margin: 0 }}>Vencido: <b className="font-mono">{formatar(r.vencido)}</b></p>
        <p style={{ margin: 0 }}>Devolvido: <b className="font-mono">{formatar(r.reembolsado)}</b></p>
        <p style={{ margin: 0 }}>Receita recorrente dos alunos: <b className="font-mono">{formatar(mrrClientes(modulo.valor.contratos))}</b>/mês <span className="text-xs text-faint">(só contratos ativos com renovação)</span></p>
      </div>
      {Object.keys(r.porMetodo).length > 0 && <><Titulo>Por método</Titulo>{Object.entries(r.porMetodo).map(([k, v]) => <p key={k} className="text-sm font-body text-muted" style={{ margin: 0 }}>{METODOS[k] || k}: <span className="font-mono">{formatar(v)}</span></p>)}</>}
      {Object.keys(r.porPlano).length > 0 && <><Titulo>Por plano</Titulo>{Object.entries(r.porPlano).map(([k, v]) => <p key={k} className="text-sm font-body text-muted" style={{ margin: 0 }}>{k}: <span className="font-mono">{formatar(v)}</span></p>)}</>}
      <button type="button" onClick={csv} className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12 }}>Exportar CSV</button>
    </div>
  );
}

// A carteira é o adaptador: enquanto o serviço não estiver ligado no servidor, diz
// isso e fica por aí. Nada se simula.
function Carteira({ estadoCarteira, aCarregar, modulo, onAtualizar, showToast }) {
  const [abrindo, setAbrindo] = useState(false);
  const politica = modulo.valor.politicaAcesso || {};
  async function abrir() {
    setAbrindo(true);
    const r = await chamar('cobranca-onboarding', { regressoUrl: window.location.origin });
    setAbrindo(false);
    if (r.ok && r.url) window.location.href = r.url; else { showToast(r.erro || 'Não foi possível abrir a verificação.', 'error'); onAtualizar(); }
  }
  const e = estadoCarteira;
  return (
    <div className="flex flex-col gap-3">
      {aCarregar && <p className="text-sm font-body text-faint" role="status">A confirmar a carteira...</p>}
      {!aCarregar && (!temServidor() || (e && e.ativa === false)) && (
        <Aviso>{!temServidor() ? 'A carteira só existe com a conta ligada ao servidor.' : (e.motivo || 'A cobrança online ainda não está ligada no servidor.')} Até lá, registe os pagamentos à mão nas faturas. Nenhum pagamento é simulado.</Aviso>
      )}
      {!aCarregar && e && e.ativa !== false && (
        <div className="card p-3 flex flex-col gap-2">
          <p className="text-sm font-body text-primary" style={{ margin: 0, fontWeight: 600 }}>{e.pagamentos ? 'A receber pagamentos' : 'Verificação por concluir'}</p>
          <p className="text-xs font-body text-muted" style={{ margin: 0 }}>Pagamentos: {e.pagamentos ? 'ativos' : 'por ativar'} · Transferências: {e.transferencias ? 'ativas' : 'por ativar'}{e.requisitos && e.requisitos.length ? ` · Em falta: ${e.requisitos.length} ${e.requisitos.length === 1 ? 'dado' : 'dados'}` : ''}</p>
          <button type="button" disabled={abrindo} onClick={abrir} className="btn btn-primary" style={{ alignSelf: 'flex-start', fontSize: 12 }}>{e.pagamentos ? 'Gerir a verificação' : 'Continuar a verificação'}</button>
          <p className="text-xs font-body text-faint" style={{ margin: 0 }}>A verificação de identidade e os dados bancários ficam no fornecedor de pagamentos. O PTMANAGER nunca os guarda.</p>
        </div>
      )}
      <Titulo>Faturas em atraso</Titulo>
      <Grupo rotulo="Restringir o acesso do aluno">
        <label className="flex items-start gap-2 text-sm font-body text-primary"><input type="checkbox" checked={Boolean(politica.restringir)} onChange={(ev) => modulo.gravar((m) => ({ ...m, politicaAcesso: { ...politica, restringir: ev.target.checked } }))} style={{ marginTop: 3 }} /> <span>Esconder os treinos a quem tiver faturas vencidas<span className="block text-xs text-faint">Desligado por omissão. Os consentimentos, os comprovativos e o pedido dos dados continuam sempre acessíveis.</span></span></label>
      </Grupo>
      {politica.restringir && <FormField label="Dias de tolerância"><input type="number" min="0" value={politica.toleranciaDias ?? 7} onChange={(ev) => modulo.gravar((m) => ({ ...m, politicaAcesso: { ...politica, toleranciaDias: Number(ev.target.value) || 0 } }))} className="input-field" /></FormField>}
    </div>
  );
}

export default function CentroPlanos({ students, showToast, quem, onImprimir }) {
  const modulo = useModulo('planos');
  const [aba, setAba] = useState('faturas');
  const [carteira, setCarteira] = useState(null);
  const [aCarregar, setACarregar] = useState(true);
  const sincronizou = useRef(false);

  async function lerCarteira() {
    setACarregar(true);
    if (!temServidor()) { setCarteira({ ativa: false }); setACarregar(false); return; }
    const r = await chamar('cobranca-onboarding', { apenasEstado: true });
    setCarteira(r.ok ? r : { ativa: false, motivo: r.erro });
    setACarregar(false);
  }
  useEffect(() => { lerCarteira(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ao abrir: faturas em falta e pagamentos confirmados pelo fornecedor. As duas contas
  // são repetíveis: o id de cada fatura e a referência de cada pagamento não duplicam.
  useEffect(() => {
    if (modulo.estado !== 'ok' || sincronizou.current) return;
    sincronizou.current = true;
    (async () => {
      const hoje = hojeISO();
      const pag = await lerPagamentos();
      const confirmados = pag.ok ? pag.itens.filter((p) => p.estado === 'pago') : [];
      const devolvidos = pag.ok ? pag.itens.filter((p) => p.estado === 'reembolsado') : [];
      const v = modulo.valor;
      const novas = (v.contratos || []).flatMap((c) => faturasEmFalta(c, v.faturas, hoje));
      const porConciliar = confirmados.filter((p) => (v.faturas || []).some((f) => f.id === p.fatura_id && !(f.pagamentos || []).some((x) => x.referencia === p.referencia)));
      const porDevolver = devolvidos.filter((p) => (v.faturas || []).some((f) => f.id === p.fatura_id && (f.pagamentos || []).some((x) => x.referencia === p.referencia) && !(f.reembolsos || []).some((x) => x.id === p.referencia)));
      if (novas.length === 0 && porConciliar.length === 0 && porDevolver.length === 0) return;
      await modulo.gravar((m) => ({
        ...m,
        faturas: [...m.faturas.map((f) => porConciliar.filter((p) => p.fatura_id === f.id).reduce((acc, p) => registarPagamento(acc, { id: p.referencia, centimos: p.centimos, metodo: p.metodo || 'cartao', referencia: p.referencia, em: p.created_at, origem: 'webhook' }), f)).map((f) => porDevolver.filter((p) => p.fatura_id === f.id).reduce((acc, p) => { const r = reembolsar(acc, { id: p.referencia, centimos: p.reembolsado_centimos || p.centimos, em: new Date().toISOString(), motivo: 'Devolução no fornecedor' }); return r.ok ? r.fatura : acc; }, f)), ...novas],
      }));
    })();
  }, [modulo.estado]); // eslint-disable-line react-hooks/exhaustive-deps

  const carteiraLigada = Boolean(carteira && carteira.ativa !== false && carteira.pagamentos);
  return (
    <ProntoOu modulos={modulo}>{() => (
      <div className="flex flex-col gap-3">
        <Abas valor={aba} onMudar={setAba} abas={[{ id: 'faturas', rotulo: 'Faturas' }, { id: 'contratos', rotulo: 'Alunos e planos' }, { id: 'planos', rotulo: 'Planos' }, { id: 'digitais', rotulo: 'Contratos' }, { id: 'numeros', rotulo: 'Números' }, { id: 'carteira', rotulo: 'Carteira' }]} />
        {aba === 'faturas' && <Faturas modulo={modulo} students={students} showToast={showToast} carteiraLigada={carteiraLigada} quem={quem} onImprimir={onImprimir} />}
        {aba === 'contratos' && <Contratos modulo={modulo} students={students} showToast={showToast} />}
        {aba === 'planos' && <Planos modulo={modulo} />}
        {aba === 'digitais' && <ModelosContrato modulo={modulo} students={students} />}
        {aba === 'numeros' && <Numeros modulo={modulo} students={students} />}
        {aba === 'carteira' && <Carteira estadoCarteira={carteira} aCarregar={aCarregar} modulo={modulo} onAtualizar={lerCarteira} showToast={showToast} />}
      </div>
    )}</ProntoOu>
  );
}
