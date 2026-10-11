/*
 * Confere a logica pura do acesso do aluno (src/data/acessoAluno.ts): geracao
 * do token, o hash, o link e a leitura do token a partir da URL.
 *
 * Uso: node scripts/validar-acesso-aluno.mjs
 */
import { register } from 'node:module';

register('./resolver-extensao-ts.mjs', import.meta.url);
const A = await import('../src/data/acessoAluno.ts');

let falhas = 0;
function esperar(condicao, mensagem) {
  if (condicao) console.log('ok: ' + mensagem);
  else { falhas += 1; console.log('FALHA: ' + mensagem); }
}

// --- gerarTokenAcesso ---
const t1 = A.gerarTokenAcesso();
const t2 = A.gerarTokenAcesso();
esperar(typeof t1 === 'string' && t1.length >= 40, `token tem um comprimento razoavel (${t1.length} caracteres)`);
esperar(t1 !== t2, 'dois tokens gerados seguidos sao diferentes');
esperar(!/[+/=]/.test(t1), 'token e base64url (sem +, / nem =), seguro para ir numa URL');

// --- hashTokenAcesso ---
const h1 = await A.hashTokenAcesso(t1);
const h1Outravez = await A.hashTokenAcesso(t1);
const h2 = await A.hashTokenAcesso(t2);
esperar(/^[0-9a-f]{64}$/.test(h1), `hash e hexadecimal de 64 caracteres (sha-256) -- tem "${h1}"`);
esperar(h1 === h1Outravez, 'o mesmo token da sempre o mesmo hash (deterministico)');
esperar(h1 !== h2, 'tokens diferentes dao hashes diferentes');
esperar((await A.hashTokenAcesso('')) !== h1, 'uma string vazia nao colide com um token a serio');

// --- linkDeAcesso ---
esperar(
  A.linkDeAcesso('https://ptmanagerapp.com', t1) === `https://ptmanagerapp.com/?a=${t1}`,
  'constroi o link com a barra certa',
);
esperar(
  A.linkDeAcesso('https://ptmanagerapp.com/', t1) === `https://ptmanagerapp.com/?a=${t1}`,
  'uma barra final na origem nao duplica a barra do link',
);

// --- tokenDaUrl ---
const link = A.linkDeAcesso('https://ptmanagerapp.com', t1);
esperar(A.tokenDaUrl(link) === t1, 'le de volta o mesmo token que foi posto no link');
esperar(A.tokenDaUrl('https://ptmanagerapp.com/') === null, 'sem "?a=" na URL, devolve null');
esperar(A.tokenDaUrl('https://ptmanagerapp.com/?a=curto') === null, 'um token demasiado curto na URL e recusado');
esperar(A.tokenDaUrl('isto nao e uma URL') === null, 'uma URL invalida nao rebenta, devolve null');
esperar(
  A.tokenDaUrl(`https://ptmanagerapp.com/?outro=1&a=${t1}&mais=2`) === t1,
  'encontra o token mesmo com outros parametros antes e depois',
);

console.log(falhas === 0 ? '\nTUDO OK' : `\n${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
