/*
 * Quarta parte de scripts/validar-modulos.mjs: o que o servidor deixa sair e entrar.
 * Corre `_shared/vista-aluno.ts` e `_shared/acoes-aluno.ts`, que não dependem do Deno,
 * e confere que as regras copiadas dão o mesmo que as de src/features.
 */
export async function correr() {
  let falhas = 0;
  const esperar = (c, m) => { if (c) console.log('ok: ' + m); else { falhas += 1; console.log('FALHA: ' + m); } };
  const V = await import('../supabase/functions/_shared/vista-aluno.ts');
  const A = await import('../supabase/functions/_shared/acoes-aluno.ts');
  const PUB = await import('../src/features/treino/publicacao.ts');
  const PL = await import('../src/features/planos/logica.ts');
  const CR = await import('../src/features/crm/logica.ts');
  const FI = await import('../src/features/fidelidade/logica.ts');
  const hoje = '2026-10-30';
  const agoraMs = Date.parse('2026-10-30T12:00:00Z');

  // as cópias dão o mesmo que os originais
  [{}, { arquivado: true }, { estadoPublicacao: 'rascunho' }, { estadoPublicacao: 'concluido' }, { estadoPublicacao: 'publicado', inicio: '2027-01-01' }, { estadoPublicacao: 'publicado', extra: { validade: '2020-01-01' } }]
    .forEach((p) => esperar(V.visivelAoAluno(p, hoje) === PUB.visivelAoAluno(p, hoje), `a visibilidade bate com a da aplicação: ${JSON.stringify(p)}`));
  const faturas = [{ itens: [{ centimos: 1000 }], vencimento: '2020-01-01' }, { itens: [{ centimos: 1000, quantidade: 2 }], descontoBp: 1000, impostoBp: 2300, vencimento: '2030-01-01', pagamentos: [{ estado: 'confirmado', centimos: 500 }] }, { itens: [{ centimos: 1000 }], estado: 'anulada' }, { itens: [{ centimos: 100 }], pagamentos: [{ estado: 'confirmado', centimos: 100 }], reembolsos: [{ centimos: 100 }] }];
  faturas.forEach((f, i) => {
    esperar(V.estadoDaFatura(f, hoje) === PL.estadoDaFatura(f, hoje), `o estado da fatura ${i} bate`);
    esperar(V.totalDaFatura(f) === PL.totais(f.itens, f).total, `o total da fatura ${i} bate`);
  });
  [{ restringir: false }, { restringir: true }, { restringir: true, toleranciaDias: 99999 }].forEach((pol) => esperar(V.acessoRestrito(pol, faturas, hoje) === PL.acessoRestrito(pol, faturas, hoje), 'a restrição bate'));
  ['nenhuma', 'diaria', 'semanal'].forEach((recorrencia) => {
    const c = { id: 'c', estado: 'ativa', enviarEm: '2026-10-20T09:00:00Z', recorrencia };
    esperar(JSON.stringify(V.ocorrenciaAtual(c, agoraMs)) === JSON.stringify(CR.ocorrenciaAtual(c, agoraMs)), `o aviso ${recorrencia} bate`);
  });
  const mov = [{ studentId: 'a', pontos: 10, em: '1', expira: '2026-01-01' }, { studentId: 'a', pontos: 20, em: '2' }, { studentId: 'a', pontos: -15, em: '3' }, { studentId: 'b', pontos: 99, em: '1' }];
  esperar(V.saldoDePontos(mov, 'a', hoje) === FI.saldo(mov, 'a', hoje), 'o saldo bate');

  // a vista do aluno
  const prog = (id, studentId, extra = {}) => ({ id, studentId, nome: id, treinos: [], versoes: [{ numero: 1 }], fases: [{ nome: 'x' }], ...extra });
  const blocos = {
    alunos: [{ id: 'a', name: 'Rita', color: '#000', phone: '91', email: 'r@x.pt', notes: 'SEGREDO-NOTAS', planValue: 99, active: true }, { id: 'b', name: 'OUTRO-ALUNO', active: true }],
    treinos: { prescricoes: [prog('meu', 'a'), prog('rascunho', 'a', { estadoPublicacao: 'rascunho' }), prog('futuro', 'a', { estadoPublicacao: 'publicado', inicio: '2027-01-01' }), prog('dele', 'b')], modelos: [{ id: 'SEGREDO-MODELO' }] },
    execucao: { sessoes: [{ id: 's' }] },
    agenda: [
      { id: 'mi', studentId: 'a', date: '2026-11-02', startTime: '09:00', endTime: '10:00', type: 'avaliacao', status: 'agendado', notes: 'SEGREDO-AGENDA', assessWeight: '80', assessNotes: 'SEGREDO-AVAL', faltaCreditoLog: ['SEGREDO-LOG'] },
      { id: 'de', studentId: 'b', date: '2026-11-02', startTime: '09:00', endTime: '10:00', status: 'agendado' },
      { id: 'ev', studentId: null, kind: 'evento', date: '2026-11-02', startTime: '09:00', endTime: '10:00', title: 'SEGREDO-EVENTO' },
      { id: 'fa', studentId: 'a', date: '2026-10-01', startTime: '09:00', endTime: '10:00', status: 'falta', faltaPrecisaReposicao: true, faltaCreditoValidade: '2026-12-01' },
      { id: 've', studentId: 'a', date: '2026-10-01', startTime: '09:00', endTime: '10:00', status: 'falta', faltaPrecisaReposicao: true, faltaCreditoValidade: '2026-01-01' },
    ],
    modulos: {
      planos: { faturas: [{ id: 'f1', studentId: 'a', itens: [{ descricao: 'Plano', centimos: 100 }], vencimento: '2030-01-01', emissao: '2026-10-01' }, { id: 'f2', studentId: 'b', itens: [{ descricao: 'SEGREDO-FATURA', centimos: 1 }] }, { id: 'f3', studentId: 'a', estado: 'rascunho', itens: [] }], envios: [{ id: 'ct', studentId: 'a', estado: 'aguarda', titulo: 'T', texto: 'X', versao: 1 }, { id: 'ct2', studentId: 'b', estado: 'aguarda', titulo: 'SEGREDO-CONTRATO' }] },
      documentos: { itens: [{ id: 'd1', studentId: 'a', titulo: 'Visível', visivelAoAluno: true, path: 'SEGREDO-CAMINHO' }, { id: 'd2', studentId: 'a', titulo: 'SEGREDO-DOC', visivelAoAluno: false }], envios: [{ id: 'e1', studentId: 'a', estado: 'aguarda', modelo: { id: 'm', nome: 'PAR-Q' } }, { id: 'e2', studentId: 'a', estado: 'respondido', modelo: { id: 'm' } }] },
      mensagens: { campanhas: [{ id: 'c1', estado: 'ativa', titulo: 'Olá', texto: 'x', alvo: 'todos', enviarEm: '2026-10-01T00:00:00Z' }, { id: 'c2', estado: 'ativa', titulo: 'SEGREDO-CAMPANHA', alvo: 'alunos', alunos: ['b'], enviarEm: '2026-10-01T00:00:00Z' }, { id: 'c3', estado: 'pausada', titulo: 'SEGREDO-PAUSADA', alvo: 'todos', enviarEm: '2026-10-01T00:00:00Z' }] },
      pontos: { ativo: true, movimentos: mov, recompensas: [{ id: 'r', nome: 'Aula', pontos: 5, ativa: true }, { id: 'r2', nome: 'SEGREDO-RECOMPENSA', ativa: false }] },
      recursos: { politica: { aceitaPedidos: true, antecedenciaMinHoras: 24, antecedenciaMaxDias: 30, cancelamentoMinHoras: 24 } },
      avaliacoes: { registos: [{ id: 'r1', studentId: 'a', estado: 'aguarda-aluno', modeloId: 'm' }, { id: 'r2', studentId: 'b', estado: 'aguarda-aluno' }, { id: 'r3', studentId: 'a', estado: 'final', valores: { x: 'SEGREDO-REGISTO' } }], modelos: [{ id: 'm', nome: 'Medidas', campos: [] }] },
      satisfacao: { pesquisas: [{ id: 'n', titulo: 'Nota', ativa: true }, { id: 'n2', titulo: 'SEGREDO-PESQUISA', ativa: false }] },
    },
    leituras: ['c1:0'], pagamentos: [], respondidas: [],
  };
  const conta = V.vistaDoAluno(blocos, 'a', { hoje, agoraMs, via: 'conta' });
  const txt = JSON.stringify(conta);
  esperar(!/SEGREDO|OUTRO-ALUNO/.test(txt), `nada do treinador nem de outro aluno sai na vista (${(txt.match(/SEGREDO[-A-Z]*|OUTRO-ALUNO/g) || []).join(',')})`);
  esperar(conta.prescricoes.map((p) => p.id).join() === 'meu', 'só os programas publicados dele; rascunho e programado não chegam');
  esperar(!('versoes' in conta.prescricoes[0]) && !('fases' in conta.prescricoes[0]), 'as versões e as fases não saem');
  esperar(conta.agenda.map((s) => s.id).sort().join() === 'fa,mi,ve', 'só a agenda dele, sem eventos');
  esperar(!('notes' in conta.agenda[0]) && !('assessWeight' in conta.agenda[0]), 'a agenda sai sem notas nem medidas');
  esperar(conta.creditos.map((c) => c.id).join() === 'fa', 'só os créditos válidos');
  esperar(conta.notificacoes.length === 1 && conta.notificacoes[0].lida === true, 'só os avisos para ele, com o estado de leitura');
  esperar(conta.faturas.map((f) => f.id).join() === 'f1' && conta.documentos.length === 1 && !('path' in conta.documentos[0]), 'as faturas e os documentos dele, sem o caminho do ficheiro');
  esperar(conta.formularios.map((f) => f.id).join() === 'e1' && conta.contratos.map((c) => c.id).join() === 'ct', 'só o que está por responder');
  esperar(conta.pontos.saldo === 15 && conta.pontos.recompensas.length === 1, 'os pontos, quando ligados');
  esperar(V.vistaDoAluno({ ...blocos, modulos: { ...blocos.modulos, pontos: { ativo: false, movimentos: mov } } }, 'a', { hoje, agoraMs, via: 'conta' }).pontos === null, 'com os pontos desligados, nada');
  const tk = V.vistaDoAluno(blocos, 'a', { hoje, agoraMs, via: 'token' });
  esperar(!('faturas' in tk) && !('documentos' in tk) && !('formularios' in tk) && !('contratos' in tk) && tk.aluno.email === '' && tk.aluno.phone === '', 'o link sem conta tem o âmbito reduzido');
  esperar(tk.prescricoes.length === 1, 'mas continua a ver o programa');
  esperar(V.vistaDoAluno(blocos, 'zzz', { hoje, agoraMs, via: 'conta' }) === null, 'um aluno que não existe não vê nada');
  esperar(V.vistaDoAluno({ ...blocos, alunos: [{ id: 'a', name: 'R', naLixeira: true }] }, 'a', { hoje, agoraMs, via: 'conta' }) === null, 'na lixeira não entra');
  const vencida = { ...blocos, modulos: { ...blocos.modulos, planos: { politicaAcesso: { restringir: true, toleranciaDias: 1 }, faturas: [{ id: 'v', studentId: 'a', itens: [{ centimos: 1 }], vencimento: '2026-01-01' }] } } };
  const r = V.vistaDoAluno(vencida, 'a', { hoje, agoraMs, via: 'conta' });
  esperar(r.restrito === true && r.prescricoes.length === 0 && r.faturas.length === 1 && r.formularios.length === 1, 'a restrição esconde os treinos e nunca as faturas nem os formulários');
  esperar(V.vistaDoAluno({ ...blocos, respondidas: ['e1', 'ct', 'r1', 'n'] }, 'a', { hoje, agoraMs, via: 'conta' }).formularios.length === 0, 'o que já foi respondido sai da lista');
  const pag = V.vistaDoAluno({ ...blocos, pagamentos: [{ fatura_id: 'f1', estado: 'pago' }] }, 'a', { hoje, agoraMs, via: 'conta' });
  esperar(pag.faturas[0].estado === 'paga', 'a confirmação do fornecedor chega ao aluno antes da conciliação');

  const { TEXTOS } = await import('../src/features/i18n-textos.ts');
  ['en', 'es'].forEach((l) => {
    const faltam = Object.keys(TEXTOS.pt).filter((k) => !TEXTOS[l][k]);
    const sobram = Object.keys(TEXTOS[l]).filter((k) => !(k in TEXTOS.pt));
    esperar(faltam.length === 0 && sobram.length === 0, `a língua ${l} tem as mesmas chaves (${[...faltam, ...sobram].join(',')})`);
  });
  const ML = await import('../src/features/metas/logica.ts');
  esperar(ML.progressoDaMeta({ base: '10', alvo: '20', atual: '15' }) === 50 && ML.progressoDaMeta({ base: '80', alvo: '70', atual: '75' }) === 50, 'a meta conta nos dois sentidos');
  esperar(ML.progressoDaMeta({ base: '10', alvo: '20', atual: '' }) === null && ML.progressoDaMeta({ base: '5', alvo: '5', atual: '5' }) === null, 'sem dados não inventa um número');
  esperar(ML.progressoDaMeta({ base: '0', alvo: '10', atual: '99' }) === 100 && ML.progressoDaMeta({ base: '0', alvo: '10', atual: '-5' }) === 0, 'fica entre 0 e 100');
  esperar(ML.pontosDoCheckin({ dor: 4, energia: 2, sono: 3, stress: 1 }).join() === 'dor,energia' && ML.pontosDoCheckin({ dor: 1, energia: 5 }).length === 0, 'o check-in destaca por regra escrita');
  esperar(ML.pontosDoCheckin({}).length === 0, 'o que não se respondeu não levanta nada');
  const exp = ML.dadosDoAluno({ aluno: { id: 'a', name: 'R' }, sessoes: [{ id: '1', studentId: 'a' }, { id: 'SEGREDO', studentId: 'b' }], prescricoes: [{ id: 'SEGREDO', studentId: 'b' }], execucoes: [], respostas: [{ studentId: 'b', id: 'SEGREDO' }], modulos: { documentos: { itens: [{ studentId: 'a', id: 'd', path: 'SEGREDO' }] }, planos: { faturas: [{ studentId: 'b', id: 'SEGREDO' }] } } }, 'agora');
  esperar(!/SEGREDO/.test(JSON.stringify(exp)) && exp.agenda.length === 1 && exp.documentos.length === 1, 'a exportação só leva o que é do aluno');
  const comLembrete = V.vistaDoAluno({ ...blocos, agenda: [{ id: 'am', studentId: 'a', date: '2026-10-31', startTime: '09:00', endTime: '10:00', status: 'agendado' }, { id: 'lg', studentId: 'a', date: '2026-11-20', startTime: '09:00', endTime: '10:00', status: 'agendado' }, { id: 'cc', studentId: 'a', date: '2026-10-31', startTime: '11:00', endTime: '12:00', status: 'cancelado' }] }, 'a', { hoje, agoraMs, via: 'conta' });
  esperar(comLembrete.lembretes.map((l) => l.id).join() === 'am', 'o lembrete é só da aula próxima e marcada');
  const comMeta = V.vistaDoAluno({ ...blocos, modulos: { ...blocos.modulos, metas: { itens: [{ id: 'm1', studentId: 'a', titulo: 'T', visivel: true }, { id: 'm2', studentId: 'a', titulo: 'SEGREDO', visivel: false }, { id: 'm3', studentId: 'b', titulo: 'SEGREDO', visivel: true }] } } }, 'a', { hoje, agoraMs, via: 'conta' });
  esperar(comMeta.metas.length === 1 && !/SEGREDO/.test(JSON.stringify(comMeta.metas)), 'só as metas visíveis e dele');
  esperar(V.vistaDoAluno({ ...blocos, respondidas: [`checkin:${hoje}`] }, 'a', { hoje, agoraMs, via: 'conta' }).checkinFeito === true, 'o check-in de hoje não se repete');

  const Y = await import('../src/data/youtube.ts');
  const VID = 'dQw4w9WgXcQ';
  [`https://www.youtube.com/watch?v=${VID}`, `https://youtube.com/watch?t=10&v=${VID}`, `https://youtu.be/${VID}?si=abc`, `youtu.be/${VID}`, `https://m.youtube.com/watch?v=${VID}`, `https://www.youtube.com/shorts/${VID}`, `https://www.youtube.com/embed/${VID}`, `  https://www.youtube.com/live/${VID}  `]
    .forEach((u) => esperar(Y.idDoYoutube(u) === VID, `reconhece o link ${u.trim()}`));
  ['', 'abc', 'https://www.youtube.com/', 'https://www.youtube.com/watch?v=curto', `https://youtube.com.falso.pt/watch?v=${VID}`, `https://falso.pt/youtu.be/${VID}`, `javascript:alert(1)//youtu.be/${VID}`, `https://www.youtube.com/watch?v=${VID}"><script>`, `https://www.youtube.com/channel/${VID}`]
    .forEach((u) => esperar(Y.idDoYoutube(u) === null, `recusa ${u || 'vazio'}`));
  const comVideos = { ...blocos, treinos: { ...blocos.treinos, prescricoes: [{ ...prog('meu', 'a'), treinos: [{ exercicios: [{ exercicioId: 'x1' }, { exercicioId: 'e:Base' }, { exercicioId: 'semlink' }] }] }, { ...prog('dele', 'b'), treinos: [{ exercicios: [{ exercicioId: 'x2' }] }] }], bibliotecaExtra: [{ id: 'x1', videoYoutube: VID, videoPath: 'SEGREDO', nome: 'SEGREDO' }, { id: 'x2', videoYoutube: 'SEGREDOxxxx' }, { id: 'semlink', videoPath: 'SEGREDO' }], bibliotecaEdicoes: { 'e:Base': { videoYoutube: VID }, 'e:Outro': { videoYoutube: 'SEGREDOyyyy' } } } };
  const vv = V.vistaDoAluno(comVideos, 'a', { hoje, agoraMs, via: 'token' }).videos;
  esperar(vv.length === 2 && !/SEGREDO/.test(JSON.stringify(vv)), 'o aluno recebe só os links dos exercícios dele, e nenhum ficheiro');
  esperar(V.vistaDoAluno({ ...comVideos, treinos: { ...comVideos.treinos, bibliotecaExtra: [{ id: 'x1', videoYoutube: '"><script>' }], bibliotecaEdicoes: {} } }, 'a', { hoje, agoraMs, via: 'token' }).videos.length === 0, 'um id que não o é não sai');

  // ações
  const ctx = { via: 'conta', vista: conta, agenda: blocos.agenda, alunoId: 'a', agoraMs };
  esperar(A.validarAcao('apagar_tudo', {}, ctx).estado === 400, 'um pedido fora da lista é recusado');
  esperar(A.validarAcao('pedir_aula', { date: '2026-11-02', startTime: '09:00', endTime: '10:00' }, { ...ctx, via: 'token' }).estado === 403, 'o link sem conta não pede aulas');
  esperar(A.validarAcao('marcar_lida', { id: 'x' }, { ...ctx, via: 'token' }).semEntrada, 'mas pode marcar um aviso como lido');
  esperar(A.validarAcao('pedir_aula', { date: '2026-11-02', startTime: '09:00', endTime: '10:00' }, ctx).entrada.tipo === 'pedido_aula', 'um pedido válido vira entrada');
  esperar(A.validarAcao('pedir_aula', { date: '2026-10-30', startTime: '20:00', endTime: '21:00' }, ctx).erro, 'em cima da hora não');
  esperar(A.validarAcao('pedir_aula', { date: '2027-06-01', startTime: '09:00', endTime: '10:00' }, ctx).erro, 'longe demais não');
  esperar(A.validarAcao('pedir_aula', { date: 'x', startTime: '09:00', endTime: '10:00' }, ctx).erro, 'datas inválidas não');
  esperar(A.validarAcao('pedir_aula', { date: '2026-11-02', startTime: '09:00', endTime: '10:00' }, { ...ctx, vista: { ...conta, politica: null } }).estado === 403, 'sem a política ligada não');
  esperar(A.validarAcao('cancelar_aula', { sessaoId: 'de' }, ctx).estado === 404, 'não se cancela a aula de outro aluno');
  esperar(A.validarAcao('cancelar_aula', { sessaoId: 'mi' }, ctx).entrada.ref === 'mi', 'cancela a própria, como pedido');
  esperar(A.validarAcao('responder_formulario', { envioId: 'e2', nomeAssinado: 'R' }, ctx).estado === 404, 'só responde ao que foi enviado');
  const longa = A.validarAcao('responder_formulario', { envioId: 'e1', nomeAssinado: 'R', respostas: { a: 'x'.repeat(9000), 'b c': 'y', d: { valor: 'sim', detalhe: 'z' } } }, ctx).entrada.dados.respostas;
  esperar(longa.a.length === 4000 && !('b c' in longa) && longa.d.valor === 'sim', 'com limites, e mantém o sim com detalhe');
  esperar(A.validarAcao('responder_formulario', { envioId: 'e1', respostas: {} }, ctx).erro, 'responder exige o nome');
  const comPerguntas = { ...conta, formularios: [{ id: 'f', modelo: { id: 'm', nome: 'P', seccoes: [{ perguntas: [{ id: 'q', tipo: 'sim_nao', obrigatoria: true, alerta: true }, { id: 'dc', tipo: 'declaracao' }] }] } }] };
  esperar(A.validarAcao('responder_formulario', { envioId: 'f', nomeAssinado: 'R', respostas: { dc: { valor: 'sim' } } }, { ...ctx, vista: comPerguntas }).erro, 'a pergunta obrigatória também se confere no servidor');
  esperar(A.validarAcao('responder_formulario', { envioId: 'f', nomeAssinado: 'R', respostas: { q: { valor: 'sim' } } }, { ...ctx, vista: comPerguntas }).erro, 'e a declaração');
  esperar(A.validarAcao('responder_formulario', { envioId: 'f', nomeAssinado: 'R', respostas: { q: { valor: 'sim' }, dc: { valor: 'sim' } } }, { ...ctx, vista: comPerguntas }).entrada.dados.sintomas === true, 'um sim com alerta fica assinalado');
  esperar(A.validarAcao('aceitar_contrato', { envioId: 'ct', nome: '', aceito: true }, ctx).erro && A.validarAcao('aceitar_contrato', { envioId: 'ct', nome: 'R' }, ctx).erro, 'aceitar exige nome e confirmação');
  esperar(A.validarAcao('aceitar_contrato', { envioId: 'ct', nome: 'R', aceito: true }, ctx).entrada.chave === 'contrato:ct', 'aceitar duas vezes conta uma');
  esperar(A.validarAcao('responder_pesquisa', { pesquisaId: 'n', nota: 11 }, ctx).erro && A.validarAcao('responder_pesquisa', { pesquisaId: 'n', nota: 0 }, ctx).entrada.dados.nota === 0, 'nota de 0 a 10, e o 0 conta');
  esperar(A.validarAcao('check_in', { dor: 4 }, { ...ctx, via: 'token' }).estado === 403, 'o check-in exige conta');
  esperar(A.validarAcao('check_in', { dor: 9, sono: 'x' }, ctx).erro && A.validarAcao('check_in', { dor: 4 }, ctx).entrada.dados.dor === 4, 'o check-in só aceita de 1 a 5');
  esperar(A.validarAcao('check_in', { dor: 1 }, ctx).entrada.chave === 'checkin:a:2026-10-30', 'um check-in por dia');
  const png = 'data:image/png;base64,AAAA';
  esperar(A.validarAcao('publicar_progresso', {}, ctx).erro, 'o progresso vazio não entra');
  esperar(A.validarAcao('publicar_progresso', { foto: png }, ctx).erro, 'a fotografia exige consentimento próprio');
  esperar(A.validarAcao('publicar_progresso', { foto: 'data:text/html;base64,AAAA', consentimentoFoto: true }, ctx).erro, 'só fotografias');
  esperar(A.validarAcao('publicar_progresso', { foto: `data:image/png;base64,${'A'.repeat(A.LIMITE_FOTO_BASE64)}`, consentimentoFoto: true }, ctx).erro, 'com limite de tamanho');
  const pf = A.validarAcao('publicar_progresso', { foto: png, consentimentoFoto: true, texto: 'ok' }, ctx);
  esperar(pf.fotoInfo.extensao === 'png' && pf.entrada.dados.comFoto && !JSON.stringify(pf.entrada).includes('AAAA'), 'a fotografia não fica na entrada');
  esperar(A.validarAcao('publicar_progresso', { peso: '60' }, ctx).entrada.dados.peso === '60', 'o peso é opcional, e a fotografia também');
  esperar(A.validarAcao('atualizar_perfil', { email: 'mau' }, ctx).erro && A.validarAcao('atualizar_perfil', { phone: '91' }, ctx).entrada.tipo === 'perfil', 'o perfil passa pelo treinador');

  // público
  const ender = { ativo: true, slug: 'abc', tipo: 'inscricao', ref: 'x', user_id: 'u', dados: { consentimento: 'C', etapas: [{ id: 'e1', titulo: 'E' }] } };
  const c2 = { agoraMs, participanteNovo: 'p1' };
  const ok = { nome: 'A', email: 'A@x.pt', consentimento: true };
  esperar(A.validarPublico({ ...ender, ativo: false }, ok, c2).estado === 404, 'uma página desligada não aceita');
  esperar(A.validarPublico({ ...ender, expira_em: '2020-01-01' }, ok, c2).estado === 404, 'nem uma expirada');
  esperar(A.validarPublico(ender, { ...ok, consentimento: false }, c2).erro, 'sem consentimento não entra');
  esperar(A.validarPublico(ender, { nome: 'A', consentimento: true }, c2).erro, 'sem contacto não entra');
  esperar(A.validarPublico(ender, { ...ok, empresa: 'robo' }, c2).ignorar, 'o campo invisível apanha robôs');
  const en = A.validarPublico(ender, ok, c2).entrada;
  esperar(en.tipo === 'inscricao' && en.chave === 'pub:abc:a@x.pt' && en.dados.consentimentoTexto === 'C', 'guarda o consentimento, e a mesma pessoa não repete');
  esperar(!('aluno_id' in en), 'uma inscrição nunca nasce como aluno');
  const de = { ...ender, tipo: 'desafio' };
  esperar(A.validarPublico(de, ok, c2).participante === 'p1', 'um desafio dá um identificador ao participante');
  esperar(A.validarPublico(de, { op: 'concluir', participante: 'p1', etapa: 'zz' }, c2).erro, 'uma etapa inventada não conta');
  const conc = A.validarPublico(de, { op: 'concluir', participante: 'p1', etapa: 'e1' }, c2);
  esperar(conc.exigeInscricao === 'p1' && conc.entrada.chave === 'conc:p1:e1', 'concluir exige inscrição e conta uma vez');
  esperar(A.validarPublico({ ...ender, tipo: 'calendario' }, ok, c2).erro, 'o calendário não recebe formulários');
  const rt = A.retratoPublico({ tipo: 'vendas', user_id: 'SEGREDO', ref: 'SEGREDO', dados: { titulo: 'T', segredoNovo: 'SEGREDO' } });
  esperar(!/SEGREDO/.test(JSON.stringify(rt)) && rt.titulo === 'T', 'o retrato público sai por nome de campo');
  const ics = A.calendarioDoAluno(blocos.agenda, 'a', { agora: '2026-10-30T10:00:00.000Z' });
  esperar(/SUMMARY:Treino/.test(ics) && !/SEGREDO|avaliacao|T090000.*80/.test(ics) && (ics.match(/BEGIN:VEVENT/g) || []).length === 3, 'o calendário diz só «Treino», só do aluno, mesmo numa avaliação');
  return falhas;
}
