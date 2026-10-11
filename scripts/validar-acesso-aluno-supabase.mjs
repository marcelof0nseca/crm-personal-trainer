/*
 * Confere gerarAcessoAluno/acessoAtivoDoAluno/revogarAcessoAluno/
 * apagarAcessosDoAluno (painel-pt.tsx) contra um cliente Supabase falso --
 * extraidas por texto, o mesmo padrao que o CLAUDE.md (seccao 9) ja usa para
 * o que so corre contra o Supabase. Confere sobretudo o isolamento entre
 * contas: um treinador nunca pode ver nem revogar o acesso de outro, mesmo
 * que os dois tenham um aluno com o mesmo id.
 *
 * Uso: node scripts/validar-acesso-aluno-supabase.mjs
 */
import { register } from 'node:module';
import { readFileSync } from 'node:fs';

register('./resolver-extensao-ts.mjs', import.meta.url);
const A = await import('../src/data/acessoAluno.ts');

let falhas = 0;
function esperar(condicao, mensagem) {
  if (condicao) console.log('ok: ' + mensagem);
  else { falhas += 1; console.log('FALHA: ' + mensagem); }
}

// --- cliente Supabase falso, so o suficiente para aluno_acessos ---
class FakeQueryBuilder {
  constructor(table, op, payload) {
    this.table = table; this.op = op; this.payload = payload;
    this.filters = []; this._single = false; this._limit = null; this._order = null;
  }
  eq(col, val) { this.filters.push((row) => row[col] === val); return this; }
  // Postgres: uma coluna nunca escrita no INSERT fica no seu default (NULL
  // aqui), nao em "undefined" -- por isso `is(col, null)` tem de bater tanto
  // com null como com a chave em falta, como bateria a serio no servidor.
  is(col, val) { this.filters.push((row) => (val === null ? row[col] == null : row[col] === val)); return this; }
  order(col, opts) { this._order = { col, asc: !(opts && opts.ascending === false) }; return this; }
  limit(n) { this._limit = n; return this; }
  select() { return this; }
  maybeSingle() { this._single = true; return this._run(); }
  then(resolve, reject) { return this._run().then(resolve, reject); }
  _matchRows() { return this.table.rows.filter((row) => this.filters.every((f) => f(row))); }
  _run() {
    if (this.op === 'insert') {
      // `criado_em timestamptz not null default now()` no schema a serio --
      // o INSERT da aplicacao nunca o escreve, e e por isso que a conta com
      // ele.
      const nova = { criado_em: new Date().toISOString(), ...this.payload };
      if (this.table.rows.some((r) => r.token_hash === nova.token_hash)) {
        return Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate key' } });
      }
      this.table.rows.push(nova);
      return Promise.resolve({ data: [nova], error: null });
    }
    if (this.op === 'update') {
      const alvo = this._matchRows();
      alvo.forEach((row) => Object.assign(row, this.payload));
      return Promise.resolve({ data: alvo, error: null });
    }
    if (this.op === 'delete') {
      const alvo = this._matchRows();
      this.table.rows = this.table.rows.filter((row) => !alvo.includes(row));
      return Promise.resolve({ data: alvo, error: null });
    }
    let linhas = this._matchRows();
    if (this._order) {
      linhas = [...linhas].sort((a, b) => {
        const av = a[this._order.col]; const bv = b[this._order.col];
        return this._order.asc ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
      });
    }
    if (this._limit != null) linhas = linhas.slice(0, this._limit);
    if (this._single) return Promise.resolve({ data: linhas[0] || null, error: null });
    return Promise.resolve({ data: linhas, error: null });
  }
}
function criarSupabaseFalso(userId) {
  const tabelas = { aluno_acessos: { rows: [] } };
  return {
    _tabelas: tabelas,
    auth: { getUser: async () => ({ data: { user: userId ? { id: userId } : null }, error: null }) },
    from(nome) {
      const tabela = tabelas[nome];
      return {
        select: () => new FakeQueryBuilder(tabela, 'select', null),
        insert: (payload) => new FakeQueryBuilder(tabela, 'insert', payload),
        update: (payload) => new FakeQueryBuilder(tabela, 'update', payload),
        delete: () => new FakeQueryBuilder(tabela, 'delete', null),
      };
    },
  };
}

// --- extrai as funcoes reais de painel-pt.tsx por texto ---
// So o bloco do acesso do aluno (currentSupabaseUserId vem a parte, por ser
// partilhado com readStoredValue/writeStoredValue, que tem "as any" -- TS
// que o `new Function` abaixo nao consegue interpretar).
const src = readFileSync(new URL('../painel-pt.tsx', import.meta.url), 'utf8');
const authInicio = src.indexOf('async function currentSupabaseUserId');
const authFim = src.indexOf('// A data da última gravação conhecida');
const authCorpo = src.slice(authInicio, authFim);

const inicio = src.indexOf('/* ============================= Acesso do aluno');
const fim = src.indexOf('// Todas as linhas `execucoes:*`');
const corpo = src.slice(inicio, fim);

const fabrica = new Function(
  'supabase', 'supabaseConfigured', 'gerarTokenAcesso', 'hashTokenAcesso',
  `${authCorpo}
   ${corpo}
   return { gerarAcessoAluno, acessoAtivoDoAluno, revogarAcessoAluno, apagarAcessosDoAluno };`,
);

function montar(userId) {
  const supabase = criarSupabaseFalso(userId);
  const { gerarAcessoAluno, acessoAtivoDoAluno, revogarAcessoAluno, apagarAcessosDoAluno } =
    fabrica(supabase, true, A.gerarTokenAcesso, A.hashTokenAcesso);
  return { supabase, gerarAcessoAluno, acessoAtivoDoAluno, revogarAcessoAluno, apagarAcessosDoAluno };
}

// === cenario 1: gerar o primeiro acesso ===
{
  const { supabase, gerarAcessoAluno, acessoAtivoDoAluno } = montar('treinador-1');
  const token = await gerarAcessoAluno('aluno-A');
  esperar(typeof token === 'string' && token.length > 20, 'gerarAcessoAluno devolve o token em claro');
  esperar(supabase._tabelas.aluno_acessos.rows.length === 1, 'gravou exatamente uma linha');
  const linha = supabase._tabelas.aluno_acessos.rows[0];
  esperar(linha.user_id === 'treinador-1' && linha.aluno_id === 'aluno-A', 'a linha fica com o treinador e o aluno certos');
  esperar(linha.token_hash !== token, 'o token em claro nunca fica gravado -- so o hash');
  esperar(linha.token_hash === (await A.hashTokenAcesso(token)), 'o hash gravado bate com o hash do token devolvido');
  esperar(linha.revogado_em === undefined, 'a linha nova nao vem revogada');

  const ativo = await acessoAtivoDoAluno('aluno-A');
  esperar(ativo && typeof ativo.criadoEm !== 'undefined', 'acessoAtivoDoAluno confirma que ha acesso ativo');
}

// === cenario 2: gerar de novo revoga o anterior (um so ativo de cada vez) ===
{
  const { supabase, gerarAcessoAluno } = montar('treinador-1');
  const token1 = await gerarAcessoAluno('aluno-B');
  const token2 = await gerarAcessoAluno('aluno-B');
  esperar(token1 !== token2, 'o segundo token gerado e diferente do primeiro');
  esperar(supabase._tabelas.aluno_acessos.rows.length === 2, 'ficam as duas linhas (historico), nao se apaga a antiga');
  const [linha1, linha2] = supabase._tabelas.aluno_acessos.rows;
  esperar(!!linha1.revogado_em, 'a primeira linha fica revogada ao gerar a segunda');
  esperar(!linha2.revogado_em, 'a segunda linha (a nova) fica ativa');
}

// === cenario 3: revogarAcessoAluno ===
{
  const { supabase, gerarAcessoAluno, revogarAcessoAluno, acessoAtivoDoAluno } = montar('treinador-1');
  await gerarAcessoAluno('aluno-C');
  const ok = await revogarAcessoAluno('aluno-C');
  esperar(ok === true, 'revogarAcessoAluno devolve true ao conseguir');
  const ativo = await acessoAtivoDoAluno('aluno-C');
  esperar(ativo === null, 'depois de revogar, acessoAtivoDoAluno ja nao encontra nada ativo');
}

// === cenario 4: isolamento entre contas (um treinador nunca mexe no acesso de outro) ===
{
  const supabaseCompartilhado = criarSupabaseFalso('treinador-X');
  const { gerarAcessoAluno: gerarX } = fabrica(supabaseCompartilhado, true, A.gerarTokenAcesso, A.hashTokenAcesso);
  await gerarX('aluno-Z');
  // Troca para outro treinador, mesma tabela.
  supabaseCompartilhado.auth.getUser = async () => ({ data: { user: { id: 'treinador-Y' } }, error: null });
  const { acessoAtivoDoAluno: verY, revogarAcessoAluno: revogarY } =
    fabrica(supabaseCompartilhado, true, A.gerarTokenAcesso, A.hashTokenAcesso);
  // Y pergunta pelo MESMO aluno_id (coincidencia de id entre contas) -- a
  // funcao filtra sempre por user_id tambem, nunca so por aluno_id.
  const vistoPorY = await verY('aluno-Z');
  esperar(vistoPorY === null, 'o treinador Y nao ve o acesso que X criou para o mesmo aluno_id');
  const revogouY = await revogarY('aluno-Z');
  esperar(revogouY === true, 'revogar "nao encontra nada" nao da erro (so nao revoga nada)');
  const linhaDeX = supabaseCompartilhado._tabelas.aluno_acessos.rows[0];
  esperar(!linhaDeX.revogado_em, 'a linha do treinador X continua intacta -- Y nunca lhe tocou');
}

// === cenario 5: apagarAcessosDoAluno (ao eliminar o aluno) ===
{
  const { supabase, gerarAcessoAluno, apagarAcessosDoAluno } = montar('treinador-1');
  await gerarAcessoAluno('aluno-D');
  await gerarAcessoAluno('aluno-D'); // fica historico: 2 linhas
  const ok = await apagarAcessosDoAluno('aluno-D');
  esperar(ok === true, 'apagarAcessosDoAluno devolve true');
  esperar(supabase._tabelas.aluno_acessos.rows.length === 0, 'apaga TODAS as linhas do aluno, incluindo as ja revogadas -- nao so a ativa');
}

// === cenario 6: sem utilizador autenticado -- falha fechada, nunca uma excecao ===
{
  const { gerarAcessoAluno, acessoAtivoDoAluno, revogarAcessoAluno, apagarAcessosDoAluno } = montar(null);
  esperar(await gerarAcessoAluno('x') === null, 'gerarAcessoAluno sem sessao devolve null, nao rebenta');
  esperar(await acessoAtivoDoAluno('x') === null, 'acessoAtivoDoAluno sem sessao devolve null');
  esperar(await revogarAcessoAluno('x') === false, 'revogarAcessoAluno sem sessao devolve false');
  esperar(await apagarAcessosDoAluno('x') === false, 'apagarAcessosDoAluno sem sessao devolve false');
}

console.log(falhas === 0 ? '\nTUDO OK' : `\n${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
