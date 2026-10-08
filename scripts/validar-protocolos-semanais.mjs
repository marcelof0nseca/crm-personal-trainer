/*
 * Confere os 200 protocolos semanais gerados por
 * scripts/gerar-protocolos-semanais.mjs: contagens, referências a exercícios
 * reais, variedade real entre eles, e nada de nonsense nas doses (duração a
 * zero, séries vazias, carga negativa...).
 *
 * Uso: node scripts/validar-protocolos-semanais.mjs
 */
import fs from 'fs';

let falhas = 0;
function esperar(condicao, mensagem) {
  if (condicao) console.log('ok: ' + mensagem);
  else { falhas += 1; console.log('FALHA: ' + mensagem); }
}

const { CATALOGO_PROTOCOLOS_SEMANAIS: fichas } = await import('../src/data/protocolos-semanais.ts');

function lerLista(texto, nome) {
  const m = texto.match(new RegExp('export const ' + nome + '\\s*(?::[^=]*)?=\\s*(\\[[\\s\\S]*?\\n\\]);', 'm'));
  return new Function('return ' + m[1])();
}
const textoExercicios = fs.readFileSync(new URL('../src/data/exercicios.ts', import.meta.url), 'utf8');
const GRUPOS_BASE = lerLista(textoExercicios, 'GRUPOS_BASE');
const CATEGORIAS_BASE = lerLista(textoExercicios, 'CATEGORIAS_BASE');
const EXERCICIOS_BASE = lerLista(textoExercicios, 'EXERCICIOS_BASE');
const idsReais = new Set(EXERCICIOS_BASE.map(([nome]) => 'e:' + nome));

esperar(fichas.length === 200, `200 protocolos (tem ${fichas.length})`);

const BANDAS = ['1-2', '2-3', '4-5', '5-7'];
BANDAS.forEach((b) => {
  const n = fichas.filter((f) => f.frequenciaSemanal === b).length;
  esperar(n === 50, `banda "${b}": 50 protocolos (tem ${n})`);
});

const idsFicha = new Set();
let erroDetalhe = '';
for (const f of fichas) {
  if (idsFicha.has(f.id)) { erroDetalhe = `id repetido: ${f.id}`; break; }
  idsFicha.add(f.id);
  if (!/^PTS-\d{4}$/.test(f.id)) { erroDetalhe = `id fora do formato: ${f.id}`; break; }
  if (!BANDAS.includes(f.frequenciaSemanal)) { erroDetalhe = `banda desconhecida em ${f.id}: ${f.frequenciaSemanal}`; break; }
  if (!CATEGORIAS_BASE.includes(f.categoria)) { erroDetalhe = `categoria inexistente em ${f.id}: ${f.categoria}`; break; }
  if (!Array.isArray(f.treinos) || f.treinos.length !== f.diasPorSemana) { erroDetalhe = `${f.id}: diasPorSemana (${f.diasPorSemana}) não bate com treinos.length (${f.treinos && f.treinos.length})`; break; }
  if (!(f.diasPorSemana >= 1 && f.diasPorSemana <= 7)) { erroDetalhe = `${f.id}: diasPorSemana fora de 1-7 (${f.diasPorSemana})`; break; }
  const bandaOk = (b, n) => (b === '1-2' && n <= 2) || (b === '2-3' && n >= 2 && n <= 3) || (b === '4-5' && n >= 4 && n <= 5) || (b === '5-7' && n >= 5 && n <= 7);
  if (!bandaOk(f.frequenciaSemanal, f.diasPorSemana)) { erroDetalhe = `${f.id}: ${f.diasPorSemana} dias não cabe na banda ${f.frequenciaSemanal}`; break; }
  if (!(f.duracaoEstimadaMinutos && f.duracaoEstimadaMinutos.minutos > 0)) { erroDetalhe = `${f.id}: duração estimada inválida`; break; }

  for (const t of f.treinos) {
    if (!t.exercicios || t.exercicios.length === 0) { erroDetalhe = `${f.id}/${t.nome}: sem exercícios`; break; }
    const idsDoTreino = new Set();
    for (const ex of t.exercicios) {
      if (!idsReais.has(ex.exercicioId)) { erroDetalhe = `${f.id}/${t.nome}: exercicioId não existe na biblioteca real: ${ex.exercicioId}`; break; }
      if (idsDoTreino.has(ex.exercicioId)) { erroDetalhe = `${f.id}/${t.nome}: "${ex.nome}" aparece mais do que uma vez no mesmo treino`; break; }
      idsDoTreino.add(ex.exercicioId);
      if (!ex.linhas || ex.linhas.length === 0) { erroDetalhe = `${f.id}/${t.nome}/${ex.nome}: sem séries`; break; }
      for (const l of ex.linhas) {
        const reps = Number(l.reps);
        if (l.reps && (!Number.isFinite(reps) || reps <= 0)) { erroDetalhe = `${f.id}/${t.nome}/${ex.nome}: repetições inválidas (${l.reps})`; break; }
        if (l.tempo && !/^\d+(\.\d+)? s$/.test(l.tempo)) { erroDetalhe = `${f.id}/${t.nome}/${ex.nome}: tempo mal formatado (${l.tempo})`; break; }
        if (l.descanso && (!Number.isFinite(Number(l.descanso)) || Number(l.descanso) < 0)) { erroDetalhe = `${f.id}/${t.nome}/${ex.nome}: descanso inválido (${l.descanso})`; break; }
        if (l.rir && !/^\d+$/.test(l.rir)) { erroDetalhe = `${f.id}/${t.nome}/${ex.nome}: RIR mal formatado (${l.rir})`; break; }
        if (l.rpe && !/^\d+$/.test(l.rpe)) { erroDetalhe = `${f.id}/${t.nome}/${ex.nome}: RPE mal formatado (${l.rpe})`; break; }
      }
      if (erroDetalhe) break;
    }
    if (erroDetalhe) break;
  }
  if (erroDetalhe) break;
}
esperar(!erroDetalhe, erroDetalhe || 'sem erros de conteúdo');

// Variedade: nenhuma das 50-por-banda deveria ter o mesmo "treino A" (mesmos
// exercícios, mesma ordem) que outra -- sinal de que a semente não está a
// variar nada.
BANDAS.forEach((b) => {
  const assinaturas = new Set(fichas.filter((f) => f.frequenciaSemanal === b)
    .map((f) => f.treinos[0].exercicios.map((e) => e.exercicioId).join('|')));
  esperar(assinaturas.size > 30, `banda "${b}": pelo menos 30 "treino A" diferentes entre os 50 (tem ${assinaturas.size})`);
});

// As 4 valências e as (até) 6 modalidades aparecem todas.
const valencias = new Set(fichas.map((f) => f.objetivo));
esperar(valencias.size === 4, `4 objetivos distintos usados (tem ${valencias.size}: ${[...valencias].join(', ')})`);
const modalidades = new Set(fichas.map((f) => f.categoria));
esperar(modalidades.size === 6, `6 categorias/modalidades distintas usadas (tem ${modalidades.size}: ${[...modalidades].join(', ')})`);
const condicionamentos = new Set(fichas.map((f) => f.condicionamento));
esperar(condicionamentos.size === 4, `4 níveis de condicionamento usados (tem ${condicionamentos.size})`);

// Nenhum nome de ficha repetido (seriam indistinguíveis na lista).
const nomes = new Set(fichas.map((f) => f.nome));
esperar(nomes.size === fichas.length, `todos os nomes são únicos (${nomes.size} de ${fichas.length})`);

// Mobilidade e estabilidade só combina com Mobilidade/Pilates -- nunca com
// Musculação (não faria sentido um protocolo "força" com dose de mobilidade).
const mobilidadeForaDeSitio = fichas.filter((f) => f.objetivo === 'Mobilidade e flexibilidade' && !['Mobilidade', 'Pilates'].includes(f.categoria));
esperar(mobilidadeForaDeSitio.length === 0, `"Mobilidade e flexibilidade" só aparece com as categorias Mobilidade/Pilates (${mobilidadeForaDeSitio.length} exceções)`);

console.log(falhas === 0 ? '\nTUDO OK' : `\n${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
