/*
 * Terceira parte de scripts/validar-modulos.mjs: agenda, retenção, CRM, planos,
 * pontos, desafios e satisfação.
 */
export async function correr(reportar) {
  let falhas = 0;
  const esperar = (c, m) => { if (c) console.log('ok: ' + m); else { falhas += 1; console.log('FALHA: ' + m); } };
  void reportar;
  let n = 0;
  const gerarId = () => `z${(n += 1)}`;
  const AG = await import('../src/features/agenda/logica.ts');
  const RE = await import('../src/features/retencao/logica.ts');
  const CR = await import('../src/features/crm/logica.ts');
  const PL = await import('../src/features/planos/logica.ts');
  const FI = await import('../src/features/fidelidade/logica.ts');

  // agenda
  const mod = AG.excecoesDoModelo({ de: '2026-11-02', ate: '2026-11-08', dias: [1, 3], aberto: true, intervalos: [{ inicio: '08:00', fim: '12:00' }] }, { '2026-11-04': { aberto: false } });
  esperar(Object.keys(mod.novas).join() === '2026-11-02' && mod.ignoradas.join() === '2026-11-04', 'o modelo só aplica aos dias escolhidos e não pisa exceções');
  esperar(Object.keys(AG.excecoesDoModelo({ de: '2026-11-02', ate: '2026-11-03', dias: [], aberto: false, intervalos: [] }, { '2026-11-02': {} }, true).novas).length === 2, 'substituir só quando se pede');
  const col = AG.colarMarcacoes([{ id: 'a', kind: 'aula', studentId: 's', date: '2026-11-02', startTime: '09:00', endTime: '10:00', type: 'avaliacao', status: 'falta', groupId: 'g', faltaMotivo: 'x', assessWeight: '80' }, { id: 'b', kind: 'aula', studentId: 't', date: '2026-11-04', startTime: '09:00', endTime: '10:00', type: 'fixo', status: 'realizado', groupId: 'g' }], '2026-11-09', gerarId);
  esperar(col[0].date === '2026-11-09' && col[1].date === '2026-11-11', 'colar mantém a distância entre dias');
  esperar(col[0].status === 'agendado' && !('faltaMotivo' in col[0]) && !('assessWeight' in col[0]) && col[0].type === 'fixo', 'uma cópia nasce limpa, sem falta nem dados de avaliação');
  esperar(col[0].groupId === col[1].groupId && col[0].groupId !== 'g', 'um grupo copiado continua junto, com id novo');
  const ics = AG.icsDeSessoes([{ id: 'a', date: '2026-11-02', startTime: '09:00', endTime: '10:00', status: 'agendado', assessWeight: '80', notes: 'dor no joelho' }, { id: 'l', date: '2026-11-02', startTime: '11:00', endTime: '12:00', type: 'horario_livre' }], { nomeDe: () => 'Aula, PT', agora: '2026-10-30T10:00:00.000Z' });
  esperar(/DTSTART;TZID=Europe\/Lisbon:20261102T090000/.test(ics) && /SUMMARY:Aula\\, PT/.test(ics), 'o .ics leva a hora e escapa o texto');
  esperar(!/joelho|80/.test(ics.replace(/2026\d+T\d+/g, '')) && !/T110000/.test(ics), 'o .ics não leva dados de saúde nem horários livres');
  let espera = AG.entrarNaLista([], { sessaoId: 's', studentId: 'b', em: '2026-01-02', gerarId });
  espera = AG.entrarNaLista(espera, { sessaoId: 's', studentId: 'a', em: '2026-01-01', gerarId });
  espera = AG.entrarNaLista(espera, { sessaoId: 's', studentId: 'a', em: '2026-01-03', gerarId });
  esperar(espera.length === 2, 'entrar duas vezes na lista não duplica');
  const pr = AG.promover(espera, 's', { agora: '2026-01-05T00:00:00.000Z' });
  esperar(pr.promovido.studentId === 'a' && pr.lista.find((x) => x.studentId === 'a').estado === 'oferecida', 'a vaga vai para quem espera há mais tempo');
  const t1 = AG.aulasDaTurma({ id: 'T', alunos: ['a', 'b'], inicio: '09:00', fim: '10:00' }, '2026-11-02');
  const t2 = AG.aulasDaTurma({ id: 'T', alunos: ['a', 'b'], inicio: '09:00', fim: '10:00' }, '2026-11-02');
  esperar(t1[0].id === t2[0].id && t1[0].groupId === t1[1].groupId, 'gerar a turma duas vezes dá as mesmas aulas');
  esperar(AG.lugaresLivres({ capacidade: 2, alunos: ['a', 'b', 'c'] }) === 0, 'os lugares nunca ficam negativos');
  esperar(!AG.podeReservar({}, '2026-11-02T10:00:00Z', '2026-11-01T00:00:00Z').ok, 'por omissão, o aluno não reserva');
  esperar(AG.podeReservar({ aceitaPedidos: true }, '2026-11-03T10:00:00Z', '2026-11-01T00:00:00Z').ok, 'com pedidos ligados e antecedência, reserva');
  esperar(!AG.podeReservar({ aceitaPedidos: true }, '2026-11-01T10:00:00Z', '2026-11-01T00:00:00Z').ok, 'em cima da hora não');
  esperar(!AG.podeCancelar({ limiteCancelamentosMes: 2 }, '2026-11-09T10:00:00Z', '2026-11-01T00:00:00Z', 2).ok, 'o limite de cancelamentos conta');
  const loc = { id: 'n', date: 'd', localId: 'L', startTime: '10:00', endTime: '11:00' };
  esperar(AG.conflitosDeLocal([{ id: 'x', date: 'd', localId: 'L', startTime: '11:00', endTime: '12:00', status: 'agendado' }], loc).length === 0, 'seguidas não chocam');
  esperar(AG.conflitosDeLocal([{ id: 'x', date: 'd', localId: 'L', startTime: '11:00', endTime: '12:00', status: 'agendado' }], loc, 15).length === 1, 'com tempo de preparação, já chocam');

  // retenção
  const feita = (data, estado = 'concluida') => ({ data, estado, itens: [{ series: [{ feito: true }] }] });
  const hoje = '2026-10-30';
  const cl = (datas, extra = {}) => RE.classificar({ sessoes: datas.map((d) => feita(d)), aulasPorSemana: extra.por ?? null, temPrograma: extra.prog ?? true, hoje });
  esperar(cl([], { prog: false }).estado === 'insuficiente' && cl([]).estado === 'insuficiente', 'sem treinos diz dados insuficientes, não inventa estado');
  esperar(cl(['2026-10-29']).estado === 'engajado', 'treinou ontem: engajado');
  esperar(cl(['2026-10-27']).estado === 'oscilando', '3 dias sem treino: oscilando');
  esperar(cl(['2026-10-25']).estado === 'risco', '5 dias: em risco');
  esperar(cl(['2026-10-01']).estado === 'risco', '29 dias: ainda em risco');
  esperar(cl(['2026-09-29']).estado === 'abandono', '31 dias: abandono, sem lacuna entre 30 e 31');
  esperar(cl(['2026-09-01', '2026-10-29']).estado === 'recuperado', 'voltou depois de uma paragem: recuperado');
  esperar(cl(['2026-10-29'], { por: 3 }).estado === 'oscilando' && /planeado/.test(cl(['2026-10-29'], { por: 3 }).motivo), 'aderência baixa: oscilando, com o motivo');
  esperar(RE.classificar({ sessoes: [{ data: '2026-10-29', estado: 'interrompida', itens: [{ series: [{ feito: true }] }] }], temPrograma: true, hoje }).estado === 'insuficiente', 'uma sessão interrompida não conta como treino');
  esperar(RE.classificar({ sessoes: [feita('2026-10-29')], temPrograma: true, hoje, regras: { oscilandoDias: 1 } }).estado === 'oscilando', 'as regras são configuráveis');
  const met = RE.metricas([{ estado: 'engajado' }, { estado: 'risco' }, { estado: 'recuperado' }, { estado: 'insuficiente' }]);
  esperar(met.engajamento.de === 3 && met.engajamento.pct === 33 && met.recuperacao.de === 2, 'os denominadores deixam de fora quem não tem dados');
  let inst = RE.instantaneo([], { semana: '2026-10-19', linhas: [{ estado: 'engajado' }] });
  inst = RE.instantaneo(inst, { semana: '2026-10-26', linhas: [{ estado: 'engajado' }, { estado: 'engajado' }] });
  inst = RE.instantaneo(inst, { semana: '2026-10-26', linhas: [{ estado: 'engajado' }, { estado: 'engajado' }, { estado: 'engajado' }] });
  esperar(inst.length === 2 && RE.crescimento(inst, 4) === 2, 'um instantâneo por semana, e o crescimento sai deles');

  // CRM
  esperar(CR.mesmaPessoa({ email: 'A@b.pt' }, { email: 'a@b.pt ' }) && CR.mesmaPessoa({ telefone: '912 345 678' }, { phone: '912345678' }) && !CR.mesmaPessoa({}, {}), 'reconhece a mesma pessoa, e dois vazios não coincidem');
  const c = { gerarId, agora: 'ag' };
  const l1 = CR.juntarLead([], { nome: 'Rita', email: 'r@x.pt', origem: 'link' }, c);
  const l2 = CR.juntarLead(l1.leads, { nome: 'Rita F', email: 'R@x.pt' }, c);
  esperar(l1.novo && !l2.novo && l2.leads.length === 1 && l2.leads[0].atividades.length === 2, 'um pedido repetido junta-se ao lead');
  const conv = CR.converterLead(l1.lead, [], { gerarId, cor: '#000', hoje: 'h' });
  esperar(conv.novo && conv.aluno.name === 'Rita' && conv.aluno.startDate === 'h', 'converter cria o aluno');
  esperar(!CR.converterLead(l1.lead, [{ id: 'a', email: 'r@x.pt' }], { gerarId, cor: '#000', hoje: 'h' }).novo, 'converter não duplica um aluno que já existe');
  const csv = CR.lerCsv('﻿Nome;Telemóvel;Valor\n"Rita; F";912345678;50,5\n;;\nBruno;;abc\nRita2;912345678;1\n');
  esperar(csv.cabecalho[1] === 'Telemóvel' && csv.linhas[0][0] === 'Rita; F' && csv.linhas.length === 3, 'lê CSV com aspas, BOM e separador');
  const mapa = CR.mapearColunas(csv.cabecalho);
  esperar(mapa.name === 0 && mapa.phone === 1 && mapa.planValue === 2, 'reconhece as colunas sem acentos');
  const imp = CR.prepararImportacao(csv, mapa, []);
  esperar(imp.validos.length === 1 && imp.validos[0].planValue === 50.5 && imp.erros.length === 2, 'o relatório separa o que entra do que não entra');
  esperar(/inválido/.test(imp.erros[0].motivo) && /Já existe/.test(imp.erros[1].motivo), 'diz porque cada linha ficou de fora');
  const tar = CR.vistaDeTarefas([{ id: 1, data: '2026-10-29' }, { id: 2, data: hoje }, { id: 3, data: '2026-11-01' }, { id: 4 }, { id: 5, feita: true }], hoje);
  esperar(tar.atrasadas.length === 1 && tar.hoje.length === 1 && tar.proximas.length === 2 && tar.feitas.length === 1, 'tarefas por hoje, atrasadas e próximas');
  const regra = { id: 'r', ativa: true, gatilho: 'aluno_em_risco', titulo: 'Falar com {nome}' };
  const run1 = CR.correrRegras([regra, { ...regra, id: 'desligada', ativa: false }], { aluno_em_risco: [{ chave: 'a', nome: 'Rita', studentId: 'a' }] }, { hoje, gerarId });
  esperar(run1.tarefas.length === 1 && run1.tarefas[0].titulo === 'Falar com Rita', 'a regra ativa cria a tarefa');
  esperar(CR.correrRegras([regra], { aluno_em_risco: [{ chave: 'a' }] }, { hoje, gerarId, feitos: run1.registo.map((x) => x.chave) }).tarefas.length === 0, 'a mesma ocorrência não dispara duas vezes');
  esperar(CR.correrRegras([{ ...regra, dias: 3, gatilho: 'avaliacao_proxima' }], { avaliacao_proxima: [{ chave: 'x', dias: 5 }] }, { hoje, gerarId }).tarefas.length === 0, 'respeita os dias da condição');
  esperar(CR.correrRegras([regra], { aluno_em_risco: Array.from({ length: 50 }, (_, i) => ({ chave: String(i) })) }, { hoje, gerarId }).tarefas.length === 20, 'há limite por regra');
  esperar(CR.preencherMensagem('Olá {primeiro_nome}, {desconhecida}', { primeiroNome: 'Rita' }) === 'Olá Rita, {desconhecida}', 'o que não se conhece fica à vista');
  const camp = { id: 'c', estado: 'ativa', enviarEm: '2026-10-26T09:00:00Z' };
  esperar(CR.ocorrenciaAtual({ ...camp, estado: 'pausada' }, Date.parse(hoje)) === null, 'uma campanha pausada não aparece');
  esperar(CR.ocorrenciaAtual({ ...camp, enviarEm: '2027-01-01T00:00:00Z' }, Date.parse(hoje)) === null, 'nem uma agendada para o futuro');
  esperar(CR.ocorrenciaAtual(camp, Date.parse(hoje)).id === 'c:0', 'uma única tem sempre a mesma ocorrência');
  esperar(CR.ocorrenciaAtual({ ...camp, recorrencia: 'diaria' }, Date.parse('2026-10-30T10:00:00Z')).id === 'c:4', 'uma diária muda de ocorrência a cada dia');
  esperar(CR.destinatarios({ alvo: 'grupo', grupoId: 'g' }, [{ id: 'a' }, { id: 'b' }], [{ id: 'g', alunos: ['b'] }]).length === 1, 'o grupo escolhe os destinatários');
  Object.values(CR.MODELOS_SUGERIDOS).forEach((l) => esperar(l.length >= 3, 'três modelos ou mais por contexto'));

  // planos
  esperar(PL.paraCentimos('10,5') === 1050 && PL.paraCentimos('0.07') === 7 && PL.paraCentimos('19,99 €') === 1999 && PL.paraCentimos('abc') === null && PL.paraCentimos('1,234') === null, 'os valores entram em cêntimos, sem floats');
  const it = [{ centimos: 1999, quantidade: 3 }];
  const tt = PL.totais(it, { descontoBp: 1000, impostoBp: 2300 });
  esperar(tt.subtotal === 5997 && tt.desconto === 600 && tt.imposto === 1241 && tt.total === 6638 && Number.isInteger(tt.total), 'desconto e imposto em inteiros');
  const f0 = { id: 'f', estado: 'aberta', vencimento: '2026-11-01', itens: [{ centimos: 1000 }], pagamentos: [], reembolsos: [] };
  esperar(PL.estadoDaFatura(f0, hoje) === 'aberta' && PL.estadoDaFatura(f0, '2026-11-02') === 'vencida', 'o estado sai da data');
  const fp = PL.registarPagamento(f0, { id: 'p1', centimos: 400, metodo: 'mbway', referencia: 'R', em: 'x', origem: 'webhook' });
  esperar(PL.estadoDaFatura(fp, hoje) === 'parcial', 'um pagamento parcial');
  const rep = PL.registarPagamento(fp, { id: 'p2', centimos: 400, metodo: 'mbway', referencia: 'R', em: 'x', origem: 'webhook' });
  esperar(rep === fp, 'um webhook repetido não conta duas vezes');
  const paga = PL.registarPagamento(fp, { id: 'p3', centimos: 600, metodo: 'cartao', referencia: 'S', em: 'x' });
  esperar(PL.estadoDaFatura(paga, '2027-01-01') === 'paga', 'paga não fica vencida');
  esperar(!PL.reembolsar(paga, { id: 'r', centimos: 1001 }).ok, 'não se reembolsa mais do que o pago');
  esperar(PL.estadoDaFatura(PL.reembolsar(paga, { id: 'r', centimos: 1000 }).fatura, hoje) === 'reembolsada', 'o reembolso total muda o estado');
  esperar(PL.estadoDaFatura({ ...f0, estado: 'anulada' }, '2027-01-01') === 'anulada', 'uma anulada não vence');
  const ctr = { id: 'c', estado: 'ativo', studentId: 'a', nome: 'Plano', cadencia: 'mensal', centimos: 5000, inicio: '2026-08-31' };
  const emFalta = PL.faturasEmFalta(ctr, [], hoje);
  esperar(emFalta.map((x) => x.vencimento).join() === '2026-08-31,2026-09-30,2026-10-30', 'uma fatura por mês, sem saltar nos meses curtos');
  esperar(PL.faturasEmFalta(ctr, emFalta, hoje).length === 0, 'correr duas vezes não duplica a dívida');
  esperar(PL.faturasEmFalta({ ...ctr, estado: 'pausado' }, [], hoje).length === 0, 'um contrato pausado não fatura');
  esperar(PL.faturasEmFalta({ ...ctr, centimos: 9000 }, emFalta, hoje).length === 0 && emFalta[0].itens[0].centimos === 5000, 'mudar o preço não reescreve as antigas');
  esperar(PL.proximaDoContrato(ctr, hoje) === '2026-11-30', 'a próxima fatura');
  esperar(!PL.acessoRestrito(null, [{ ...f0, vencimento: '2026-01-01' }], hoje), 'por omissão nunca restringe');
  esperar(PL.acessoRestrito({ restringir: true, toleranciaDias: 5 }, [{ ...f0, vencimento: '2026-01-01' }], hoje), 'com a política ligada, restringe depois da tolerância');
  esperar(!PL.acessoRestrito({ restringir: true, toleranciaDias: 5 }, [{ ...f0, vencimento: '2026-10-28' }], hoje), 'dentro da tolerância, não');
  esperar(!PL.acessoRestrito({ restringir: true }, [{ ...f0, vencimento: '2026-01-01', override: true }], hoje), 'a exceção manual conta');
  const rel = PL.relatorio([{ ...f0, emissao: '2026-10-01', vencimento: '2026-10-02' }, { ...paga, emissao: '2026-10-05' }, { ...f0, id: 'a', estado: 'anulada', emissao: '2026-10-05' }], { de: '2026-10-01', ate: '2026-10-31', hoje });
  esperar(rel.vencido === 1000 && rel.recebido === 1000 && rel.porMetodo.cartao === 600 && rel.aReceber === 0, 'o relatório separa recebido, vencido e método');
  esperar(PL.mrrClientes([{ estado: 'ativo', cadencia: 'trimestral', centimos: 3000 }, { estado: 'ativo', cadencia: 'pacote', centimos: 9000 }, { estado: 'pausado', cadencia: 'mensal', centimos: 100 }]) === 1000, 'o MRR normaliza por mês e ignora pacotes');
  const mc = { id: 'm', titulo: 'T', texto: 'A', versao: 2 };
  const ace = PL.aceitarContrato(mc, { studentId: 'a', nome: 'R', em: 'x', id: 'i' });
  esperar(ace.texto === 'A' && PL.novaVersaoModelo(mc, 'B').versao === 3 && ace.versao === 2, 'o texto aceite não muda com o modelo');

  // pontos
  let mv = FI.creditar([], { chave: 'k', studentId: 'a', pontos: 10, motivo: 'm', em: '2026-10-01T10:00:00Z', gerarId });
  mv = FI.creditar(mv, { chave: 'k', studentId: 'a', pontos: 10, motivo: 'm', em: '2026-10-01T10:00:00Z', gerarId });
  esperar(mv.length === 1, 'o mesmo evento não credita duas vezes');
  esperar(FI.creditar(mv, { chave: 'k2', studentId: 'a', pontos: 30, motivo: 'm', em: '2026-10-01T11:00:00Z', gerarId, limitePorDia: 30 }).length === 1, 'há limite por dia');
  const venc = [{ studentId: 'a', pontos: 10, em: '1', expira: '2026-01-01' }, { studentId: 'a', pontos: 20, em: '2' }, { studentId: 'a', pontos: -5, em: '3' }];
  esperar(FI.saldo(venc, 'a', hoje) === 20, 'os resgates gastam primeiro os mais antigos, e o que expirou não conta');
  esperar(FI.saldo(venc, 'b', hoje) === 0, 'o saldo é de cada aluno');
  esperar(FI.sequenciaSemanas(['2026-10-29', '2026-10-20', '2026-10-13', '2026-09-01'], hoje) === 3, 'semanas seguidas');
  esperar(FI.sequenciaSemanas(['2026-10-20'], hoje) === 1, 'a semana em curso sem treino não quebra a sequência');
  esperar(FI.conquistasDe({ treinos: 10, sequencia: 1 }).join() === 'primeiro,dez', 'conquistas');
  const sessoes = [{ id: 's', data: '2026-10-01', estado: 'concluida', itens: [{ series: [{ feito: true }] }] }, { id: 'i', data: '2026-10-02', estado: 'interrompida', itens: [{ series: [{ feito: true }] }] }];
  let pt = FI.pontosDosTreinos([], 'a', sessoes, { regras: FI.REGRAS_PONTOS, gerarId });
  pt = FI.pontosDosTreinos(pt, 'a', sessoes, { regras: FI.REGRAS_PONTOS, gerarId });
  esperar(pt.length === 1 && pt[0].pontos === 10, 'um treino interrompido não pontua, e repetir não duplica');
  const rec = { id: 'x', nome: 'Aula', pontos: 15, ativa: true, stock: 1 };
  esperar(!FI.resgatar(pt, rec, { studentId: 'a', hoje, em: 'e', gerarId }).ok, 'sem pontos não se resgata');
  const rich = FI.creditar(pt, { chave: 'z', studentId: 'a', pontos: 50, motivo: 'm', em: 'e', gerarId });
  const res = FI.resgatar(rich, rec, { studentId: 'a', hoje, em: 'e', gerarId });
  esperar(res.ok && FI.saldo(res.movimentos, 'a', hoje) === 45, 'resgatar debita');
  esperar(!FI.resgatar(res.movimentos, rec, { studentId: 'a', hoje, em: 'e', gerarId, resgates: [res.resgate] }).ok, 'o stock conta');
  esperar(FI.saldo(FI.reverterResgate(res.movimentos, res.resgate, rec, { em: 'e', gerarId }), 'a', hoje) === 60, 'reverter devolve com um movimento novo');

  // desafios
  esperar(FI.estadoDoDesafio({ estado: 'publicado', inicio: '2026-11-01' }, hoje) === 'publicado' && FI.estadoDoDesafio({ estado: 'publicado', inicio: '2026-10-01', fim: '2026-11-01' }, hoje) === 'em_curso' && FI.estadoDoDesafio({ estado: 'publicado', fim: '2026-10-01' }, hoje) === 'encerrado', 'o estado do desafio sai das datas');
  const des = { id: 'd', etapas: [{ id: 'e1' }, { id: 'e2' }] };
  const ent = [
    { id: 'i1', ref: 'd', tipo: 'desafio_inscricao', dados: { participante: 'p1', nome: 'A' } }, { id: 'i2', ref: 'd', tipo: 'desafio_inscricao', dados: { participante: 'p1', nome: 'A' } },
    { id: 'i3', ref: 'd', tipo: 'desafio_inscricao', dados: { participante: 'p2', nome: 'B' } },
    { id: 'c1', ref: 'd', tipo: 'desafio_conclusao', dados: { participante: 'p1', etapa: 'e1' } }, { id: 'c2', ref: 'd', tipo: 'desafio_conclusao', dados: { participante: 'p1', etapa: 'e1' } }, { id: 'c3', ref: 'd', tipo: 'desafio_conclusao', dados: { participante: 'p1', etapa: 'e2' } },
    { id: 'c4', ref: 'd', tipo: 'desafio_conclusao', dados: { participante: 'estranho', etapa: 'e1' } }, { id: 'o', ref: 'outro', tipo: 'desafio_inscricao', dados: { participante: 'p9' } },
  ];
  const ac = FI.acompanhamento(des, ent);
  esperar(ac.participantes.length === 2 && ac.concluiram === 1 && ac.adesao === 50, 'conta participantes e conclusões sem repetidos nem estranhos');

  // satisfação
  esperar(FI.nps([{ nota: 10 }, { nota: 0 }]).nps === null, 'com poucas respostas não mostra o NPS');
  esperar(FI.nps([10, 10, 9, 7, 3].map((nota) => ({ nota }))).nps === 40, 'o NPS');
  esperar(FI.notaBaixa({ nota: 5 }) && !FI.notaBaixa({ nota: 8 }), 'nota baixa por regra');
  return falhas;
}
