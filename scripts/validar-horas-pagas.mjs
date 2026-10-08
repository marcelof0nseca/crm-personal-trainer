/*
 * Confere `horasPagasDoAluno` e os ajudantes de que depende, tal como estão
 * em painel-pt.tsx -- são funções puras, sem React nem Supabase, mas vivem
 * dentro do ficheiro gigante e não têm módulo próprio, por isso extraem-se
 * por texto, como já se fez para outras funções que só se podiam testar
 * contra o Supabase real (ver CLAUDE.md, secção 9).
 *
 * Uso: node scripts/validar-horas-pagas.mjs
 */
import fs from 'fs';

const codigo = fs.readFileSync('painel-pt.tsx', 'utf8').replace(/\r\n/g, '\n');
function extrairFuncao(nome) {
  const inicio = codigo.indexOf(`function ${nome}(`);
  if (inicio < 0) throw new Error(`não encontrei a função ${nome}`);
  const fim = codigo.indexOf('\n}\n', inicio);
  return codigo.slice(inicio, fim + 3);
}
function extrairConst(nome) {
  const inicio = codigo.indexOf(`const ${nome} =`);
  if (inicio < 0) throw new Error(`não encontrei a constante ${nome}`);
  const fim = codigo.indexOf(';\n', inicio);
  return codigo.slice(inicio, fim + 1);
}

const fonte = [
  extrairFuncao('monthKeyOf'),
  extrairFuncao('studentGross'),
  extrairFuncao('aulasPorSemanaDoPlano'),
  extrairConst('SEMANAS_POR_MES'),
  extrairFuncao('studentValorPlanoCheio'),
  extrairFuncao('horasPagasDoAluno'),
  'return { aulasPorSemanaDoPlano, studentValorPlanoCheio, horasPagasDoAluno, studentGross };',
].join('\n\n');

const { aulasPorSemanaDoPlano, studentValorPlanoCheio, horasPagasDoAluno } = new Function(fonte)();

let falhas = 0;
function esperar(condicao, mensagem) {
  if (condicao) console.log('ok: ' + mensagem);
  else { falhas += 1; console.log('FALHA: ' + mensagem); }
}
const perto = (a, b, tol = 0.01) => Math.abs(a - b) < tol;
const SEMANAS = 52 / 12;

// ---------- aulasPorSemanaDoPlano ----------
esperar(aulasPorSemanaDoPlano('3x por semana') === 3, '"3x por semana" -> 3');
esperar(aulasPorSemanaDoPlano('1x por semana') === 1, '"1x por semana" -> 1');
esperar(aulasPorSemanaDoPlano('5x por semana') === 5, '"5x por semana" -> 5');
esperar(aulasPorSemanaDoPlano('Personalizado') === null, '"Personalizado" não tem frequência: null');
esperar(aulasPorSemanaDoPlano('Duplas') === null, 'um nome próprio sem "Nx" também dá null');
esperar(aulasPorSemanaDoPlano('') === null && aulasPorSemanaDoPlano(undefined) === null, 'vazio ou ausente: null');
esperar(aulasPorSemanaDoPlano('0x por semana') === null, '0x não é uma frequência válida');

// ---------- horas pagas: plano mensal normal, mês cheio ----------
{
  // 3x/semana, 60 min por aula (duracaoSlot padrão) -> 3 * 4,333 * 1h ~= 13 h,
  // e como gross === planValue (mês pago por inteiro), é isso que se espera.
  const aluno = { planType: '3x por semana', paymentMode: 'mensal', planValue: 210 };
  const h = horasPagasDoAluno(aluno, '2026-09', 60, {});
  esperar(perto(h, 3 * SEMANAS), `3x por semana, mês cheio ~= ${(3 * SEMANAS).toFixed(2)} h (obtido ${h.toFixed(2)})`);
}

{
  // Mesmo plano, mas só metade foi pago este mês (gross metade do planValue):
  // as horas escalam na mesma proporção.
  const aluno = { planType: '3x por semana', paymentMode: 'mensal', planValue: 200 };
  const cheio = horasPagasDoAluno(aluno, '2026-09', 60, {});
  // studentGross em modo mensal usa sempre planValue -- simula pagamento
  // parcial baixando o planValue "de facto pago" via quinzenas_pagas, que é o
  // único modo variável.
  const parcial = { planType: '3x por semana', paymentMode: 'quinzenas_pagas', biweeklyValue: 100, quinzenasPagas: { '2026-09': [true, true, false, false] } };
  const h = horasPagasDoAluno(parcial, '2026-09', 60, {});
  esperar(perto(h, cheio / 2, 0.05), `pagou metade das quinzenas: metade das horas (${h.toFixed(2)} ~= ${(cheio / 2).toFixed(2)})`);
}

{
  // Duração da aula diferente (90 min) multiplica as horas na mesma proporção.
  const aluno = { planType: '2x por semana', paymentMode: 'mensal', planValue: 100 };
  const h60 = horasPagasDoAluno(aluno, '2026-09', 60, {});
  const h90 = horasPagasDoAluno(aluno, '2026-09', 90, {});
  esperar(perto(h90, h60 * 1.5, 0.05), `90 min por aula dá 1,5x as horas de 60 min (${h90.toFixed(2)} ~= ${(h60 * 1.5).toFixed(2)})`);
}

{
  // Sem valor de plano definido (0): assume o mês cheio, em vez de dar zero.
  const aluno = { planType: '4x por semana', paymentMode: 'mensal', planValue: 0 };
  const h = horasPagasDoAluno(aluno, '2026-09', 60, {});
  esperar(perto(h, 4 * SEMANAS), `sem valor de plano definido, assume o mês cheio (${h.toFixed(2)} ~= ${(4 * SEMANAS).toFixed(2)})`);
}

{
  // Sem duracaoSlot definido: usa 60 min por omissão.
  const aluno = { planType: '1x por semana', paymentMode: 'mensal', planValue: 50 };
  const hSemSlot = horasPagasDoAluno(aluno, '2026-09', undefined, {});
  const h60 = horasPagasDoAluno(aluno, '2026-09', 60, {});
  esperar(perto(hSemSlot, h60), 'sem duracaoSlot, assume 60 min');
}

// ---------- plano quinzenal fixo: a cobrança não depende de comparência ----------
{
  const aluno = { planType: '2x por semana', paymentMode: 'quinzenal', biweeklyValue: 50 };
  const h = horasPagasDoAluno(aluno, '2026-09', 60, {});
  esperar(perto(h, 2 * SEMANAS), `quinzenal fixo: sempre o mês cheio (${h.toFixed(2)} ~= ${(2 * SEMANAS).toFixed(2)})`);
}

// ---------- sem "Nx por semana" no nome: cai para o preço/hora manual ----------
{
  const aluno = { planType: 'Personalizado', paymentMode: 'mensal', planValue: 100 };
  esperar(horasPagasDoAluno(aluno, '2026-09', 60, {}) === null, 'sem frequência no nome e sem preço/hora configurado: null (não zero, para não parecer que o aluno não paga nada)');
  const h = horasPagasDoAluno(aluno, '2026-09', 60, { Personalizado: 25 });
  esperar(perto(h, 100 / 25), `com preço/hora manual configurado: gross / preço (${h} ~= ${100 / 25})`);
}
{
  // Um aluno com "Nx por semana" no nome usa sempre o caminho automático,
  // mesmo que também exista um preço/hora manual configurado para esse plano
  // -- o automático é a fonte de verdade para quem tem frequência no nome.
  const aluno = { planType: '3x por semana', paymentMode: 'mensal', planValue: 210 };
  const hComManual = horasPagasDoAluno(aluno, '2026-09', 60, { '3x por semana': 999 });
  const hSemManual = horasPagasDoAluno(aluno, '2026-09', 60, {});
  esperar(perto(hComManual, hSemManual), 'um plano com frequência no nome ignora o preço/hora manual, mesmo que exista');
}

// ---------- studentValorPlanoCheio ----------
esperar(studentValorPlanoCheio({ paymentMode: 'mensal', planValue: 150 }) === 150, 'mensal: o valor do plano');
esperar(studentValorPlanoCheio({ paymentMode: 'quinzenal', biweeklyValue: 60 }) === 120, 'quinzenal: duas quinzenas');
esperar(studentValorPlanoCheio({ paymentMode: 'quinzenas_pagas', biweeklyValue: 60 }) === 240, 'quinzenas pagas: quatro quinzenas (o mês cheio)');

console.log(falhas === 0 ? '\nTUDO OK' : `\n${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
