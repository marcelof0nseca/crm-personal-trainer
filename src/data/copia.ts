/*
 * A cópia de segurança: o que se exporta, como se lê um ficheiro e o que muda
 * nas sessões de treino ao restaurar. Funções puras -- sem React nem Supabase --
 * para se poderem testar sozinhas (scripts/validar-copia.mjs).
 *
 * Uma chave nova de `app_data` tem de entrar em três sítios: aqui (e em
 * `juntarCopia`, no que se exporta), no restauro, e no «Apagar todos os
 * dados». Já uma vez ficaram de fora três das oito, e a política de privacidade
 * prometia «todos os dados».
 */
import { chaveExecucoes, normalizarExecucoes } from './sessoes';
import { NOMES_MODULOS, chaveModulo, nomeDaChave } from '../features/modulos';

// Versão 1 (sem o campo `versao`): alunos, agenda, finanças, fotos e categorias.
// Versão 2: tudo o que a conta guarda -- mais definições, treinos, formulários
// e as sessões de treino realizadas, por aluno.
// Versão 3: mais os módulos novos (`modulo:<nome>`).
export const VERSAO_COPIA = 3;

const ehObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function montarCopia(partes, agoraISO) {
  const { alunos, agenda, financas, fotos, categorias, definicoes, treinos, formularios, execucoes, modulos } = partes;
  return {
    exportedAt: agoraISO,
    versao: VERSAO_COPIA,
    alunos, agenda, financas, fotos, categorias, definicoes, treinos, formularios, execucoes, modulos: modulos || {},
  };
}

// Lê o texto de um ficheiro. Recusa-o inteiro se algo tiver a forma errada, em
// vez de restaurar metade: quem restaura vai substituir os dados que tem.
//
// As chaves da versão 2 são opcionais. Ausente quer dizer «este ficheiro não as
// leva» e, ao restaurar, ficam como estão; presente com a forma errada é um
// ficheiro estragado.
export function lerCopia(texto) {
  const d = JSON.parse(texto);
  if (!ehObjeto(d) || !Array.isArray(d.alunos) || !Array.isArray(d.agenda)) throw new Error('formato inválido');
  const copia = {
    versao: Number.isInteger(d.versao) ? d.versao : 1,
    alunos: d.alunos,
    agenda: d.agenda,
    financas: Array.isArray(d.financas) ? d.financas : [],
    fotos: Array.isArray(d.fotos) ? d.fotos : [],
    categorias: ehObjeto(d.categorias) ? d.categorias : null,
  };
  ['definicoes', 'treinos', 'formularios'].forEach((k) => {
    if (d[k] === undefined) return;
    if (!ehObjeto(d[k])) throw new Error(`formato inválido: ${k}`);
    copia[k] = d[k];
  });
  if (d.execucoes !== undefined) {
    if (!ehObjeto(d.execucoes)) throw new Error('formato inválido: execucoes');
    const ids = new Set(d.alunos.filter((a) => a && a.id).map((a) => a.id));
    copia.execucoes = {};
    Object.entries(d.execucoes).forEach(([id, valor]) => {
      // As sessões de um aluno que não está na cópia não têm a quem ligar-se.
      if (!ids.has(id)) return;
      const { sessoes } = normalizarExecucoes(valor);
      if (sessoes.length > 0) copia.execucoes[id] = { sessoes };
    });
  }
  if (d.modulos !== undefined) {
    if (!ehObjeto(d.modulos)) throw new Error('formato inválido: modulos');
    copia.modulos = {};
    Object.entries(d.modulos).forEach(([nome, valor]) => {
      if (!NOMES_MODULOS.includes(nome)) return;
      if (!ehObjeto(valor)) throw new Error(`formato inválido: ${nome}`);
      copia.modulos[nome] = valor;
    });
  }
  return copia;
}

// Uma cópia sem módulos (versões 1 e 2) não toca neles. Uma com módulos deixa a
// conta com os do ficheiro, e só esses.
export function planoDeModulos(copia, chavesExistentes) {
  if (copia.modulos === undefined) return { escrever: [], apagar: [] };
  const escrever = Object.entries(copia.modulos).map(([nome, valor]) => ({ chave: chaveModulo(nome), valor }));
  const aEscrever = new Set(escrever.map((e) => e.chave));
  return { escrever, apagar: chavesExistentes.filter((c) => nomeDaChave(c) && !aEscrever.has(c)) };
}

// Os números que o aviso de «Restaurar backup» mostra. `completa` é falso num
// ficheiro da versão 1, que não leva programas, formulários, definições nem
// sessões: o aviso di-lo em vez de deixar quem restaura achar que os leva.
export function resumoDaCopia(c) {
  const sessoes = Object.values(c.execucoes || {}).reduce((n, e) => n + e.sessoes.length, 0);
  return {
    alunos: c.alunos.length,
    aulas: c.agenda.length,
    lancamentos: c.financas.length,
    fotos: c.fotos.length,
    programas: c.treinos && Array.isArray(c.treinos.prescricoes) ? c.treinos.prescricoes.length : 0,
    sessoes,
    respostas: c.formularios && Array.isArray(c.formularios.respostas) ? c.formularios.respostas.length : 0,
    completa: c.definicoes !== undefined && c.treinos !== undefined && c.formularios !== undefined && c.execucoes !== undefined,
  };
}

// O que fazer às linhas `execucoes:<aluno>` ao restaurar, dadas as que já
// existem. As sessões seguem o aluno:
//  - cópia com sessões (versão 2): no fim, as da conta são as do ficheiro, e só
//    essas -- as linhas que o ficheiro não tem apagam-se;
//  - cópia sem elas (versão 1): as dos alunos que ficam não se tocam, e as dos
//    que saem com o restauro saem com eles.
export function planoDeSessoes(copia, chavesExistentes) {
  const escrever = Object.entries(copia.execucoes || {}).map(([id, valor]) => ({ chave: chaveExecucoes(id), valor }));
  const aEscrever = new Set(escrever.map((e) => e.chave));
  const dosAlunos = new Set(copia.alunos.filter((a) => a && a.id).map((a) => chaveExecucoes(a.id)));
  const apagar = chavesExistentes.filter((c) => !aEscrever.has(c) && (copia.execucoes !== undefined || !dosAlunos.has(c)));
  return { escrever, apagar };
}
