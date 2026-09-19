/*
 * Resolve os 95 codigos do dicionario (secao 10 do documento) contra o
 * catalogo real de exercicios da aplicacao (src/data/exercicios.ts).
 *
 * Nao importa exercicios.ts como modulo TS -- extrai os arrays por regex e
 * avalia-os como literais JS, para nao depender de suporte a tipos do node.
 *
 * Uso: node scripts/dados-modelos-treino/resolver-exercicios.mjs
 * Escreve mapa-exercicios.json e exercicios-suplementares.json (as entradas do
 * gerador) e imprime um resumo no terminal.
 */
import fs from 'fs';
import { DICIONARIO } from './dicionario.mjs';

const CATALOGO_PATH = new URL('../../src/data/exercicios.ts', import.meta.url);
const txt = fs.readFileSync(CATALOGO_PATH, 'utf8');

function grab(nome) {
  const re = new RegExp('export const ' + nome + '\\s*(?::[^=]*)?=\\s*(\\[[\\s\\S]*?\\n\\]);', 'm');
  const m = txt.match(re);
  if (!m) throw new Error('Nao encontrei ' + nome + ' em exercicios.ts');
  return new Function('return ' + m[1])();
}

const GRUPOS_BASE = grab('GRUPOS_BASE');
const CATEGORIAS_BASE = grab('CATEGORIAS_BASE');
const EXERCICIOS_BASE = grab('EXERCICIOS_BASE');

function chaveBusca(nome) {
  return String(nome || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

const catalogo = EXERCICIOS_BASE.map(([nome, g, c, equipamento]) => ({
  id: 'e:' + nome,
  nome,
  grupo: GRUPOS_BASE[g],
  categoria: CATEGORIAS_BASE[c],
  equipamento,
  chave: chaveBusca(nome),
}));

const porChaveExata = new Map();
catalogo.forEach((ex) => {
  if (!porChaveExata.has(ex.chave)) porChaveExata.set(ex.chave, []);
  porChaveExata.get(ex.chave).push(ex);
});

const resultado = { exatos: [], ambiguos: [], candidatos: [], semCorrespondencia: [] };

// Política de resolução (secção 20 do documento: "não fundir... impedir
// ligação silenciosa"): só o nome IDENTICO ao de um exercício real reaproveita
// o id desse exercício. Qualquer aproximação (nome parecido, mas não igual)
// não é fundida às cegas -- vira uma entrada suplementar nova, com o seu
// próprio nome e a instrução do documento (que os exercícios base não têm).
// Os candidatos aproximados ficam registados só para revisão humana, não
// para decidir a fusão sozinhos.
const mapaFinal = {}; // codigo -> { id, nome, novo }
const suplementares = []; // exercícios que não existem no catálogo, tal como o documento os descreve

for (const item of DICIONARIO) {
  const chaveItem = chaveBusca(item.nomePt);

  const exatas = porChaveExata.get(chaveItem) || [];
  if (exatas.length === 1) {
    resultado.exatos.push({ codigo: item.codigo, nomePt: item.nomePt, id: exatas[0].id, nomeReal: exatas[0].nome });
    mapaFinal[item.codigo] = { id: exatas[0].id, nome: exatas[0].nome, novo: false };
    continue;
  }
  if (exatas.length > 1) {
    resultado.ambiguos.push({ codigo: item.codigo, nomePt: item.nomePt, candidatos: exatas.map((e) => ({ id: e.id, nome: e.nome, grupo: e.grupo, equipamento: e.equipamento })) });
    // Mais de um exercício real com o mesmo nome exato -- não decide sozinho, mas ainda assim
    // fica resolvido como entrada suplementar (nunca bloqueia a construção por uma ambiguidade
    // de dados que já existia no catálogo, alheia a este documento).
  }

  // Sem correspondência exata e segura: candidatos aproximados só para revisão, nunca fundidos.
  const candidatos = catalogo.filter((ex) => ex.chave.includes(chaveItem) || chaveItem.includes(ex.chave));
  if (candidatos.length > 0) {
    resultado.candidatos.push({
      codigo: item.codigo, nomePt: item.nomePt,
      candidatos: candidatos.slice(0, 8).map((e) => ({ id: e.id, nome: e.nome, grupo: e.grupo, equipamento: e.equipamento })),
      truncado: candidatos.length > 8 ? candidatos.length : undefined,
    });
  } else {
    resultado.semCorrespondencia.push({ codigo: item.codigo, nomePt: item.nomePt, nomeEn: item.nomeEn, familia: item.familia, equipamento: item.equipamento });
  }

  const idNovo = 'e:' + item.nomePt;
  mapaFinal[item.codigo] = { id: idNovo, nome: item.nomePt, novo: true };
  suplementares.push({
    id: idNovo,
    nome: item.nomePt,
    familiaDocumento: item.familia,
    equipamento: item.equipamento,
    instrucao: item.instrucao,
  });
}

fs.writeFileSync(new URL('./mapa-exercicios.json', import.meta.url), JSON.stringify(mapaFinal, null, 2), 'utf8');
fs.writeFileSync(new URL('./exercicios-suplementares.json', import.meta.url), JSON.stringify(suplementares, null, 2), 'utf8');

console.log(`Catálogo real: ${catalogo.length} exercícios.`);
console.log(`Dicionário do documento: ${DICIONARIO.length} exercícios.`);
console.log(`Reaproveitam id real (nome idêntico): ${resultado.exatos.length}`);
console.log(`Ambíguos no catálogo real (registados, não usados para fundir): ${resultado.ambiguos.length}`);
console.log(`Com candidatos aproximados (registados só para revisão): ${resultado.candidatos.length}`);
console.log(`Sem candidato nenhum no catálogo real: ${resultado.semCorrespondencia.length}`);
console.log(`Entram como suplementares (novos, com a instrução do documento): ${suplementares.length}`);
