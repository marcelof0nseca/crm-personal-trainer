/*
 * O que sai quando se apaga algo que tem fotografias, ou que pertence a um
 * aluno. Funções puras -- sem React nem Supabase -- para se poderem testar
 * sozinhas (scripts/validar-eliminar.mjs).
 *
 * As fotografias não têm dono: são entradas do bloco `fotos` e ficheiros no
 * balde, e quem as usa guarda só o id -- uma avaliação em `photoIds`, uma
 * medição em `fotoIds`, um formulário em `assinaturaId`, e as versões antigas de
 * uma avaliação dentro de `assessVersoes`. Em vez de listar esses campos um a
 * um -- e esquecer o próximo --, procura-se o id em qualquer sítio dos dados.
 *
 * Uma fotografia só se apaga se **nada mais** a referir. Apagar uma avaliação
 * ou um aluno deixava as fotografias corporais para trás, no balde e no bloco,
 * sem ninguém que as visse.
 */

// Os ids de fotografia (dos `conhecidos`) que aparecem em `valor`, a qualquer
// profundidade: em arrays, em objetos, ou como o próprio texto.
export function idsDeFotosEm(valor, conhecidos, achados = new Set()) {
  if (typeof valor === 'string') {
    if (conhecidos.has(valor)) achados.add(valor);
  } else if (Array.isArray(valor)) {
    valor.forEach((v) => idsDeFotosEm(v, conhecidos, achados));
  } else if (valor && typeof valor === 'object') {
    Object.values(valor).forEach((v) => idsDeFotosEm(v, conhecidos, achados));
  }
  return achados;
}

// As fotografias que só o que se remove referia -- e que por isso se apagam.
// O que fica a usá-las (mesmo por engano, ou numa versão antiga de uma
// avaliação) mantém-nas, e as que ninguém referia não se tocam: não foi isto
// que se apagou.
export function fotosSoltas(removido, restante, fotos) {
  const conhecidos = new Set(fotos.map((f) => f.id));
  const doRemovido = idsDeFotosEm(removido, conhecidos);
  if (doRemovido.size === 0) return [];
  const emUso = idsDeFotosEm(restante, conhecidos);
  return fotos.filter((f) => doRemovido.has(f.id) && !emUso.has(f.id));
}

// Tudo o que um aluno tem, e o que fica. Vive em quatro blocos -- a agenda (aulas
// e avaliações), os programas de treino, as respostas a formulários e as
// fotografias -- mais as sessões de treino realizadas, que têm linha própria.
//
// `treinos` vem sem a biblioteca (é a forma que se grava): são milhares de
// exercícios que não guardam fotografias e só custariam a percorrer.
export function planoDeEliminacao(idAluno, { alunos, sessions, treinos, formularios, fotos, definicoes }) {
  const daquele = (x) => x.studentId === idAluno;
  const sessoesDele = sessions.filter(daquele);
  const programasDele = (treinos.prescricoes || []).filter(daquele);
  const respostasDele = (formularios.respostas || []).filter(daquele);

  const alunosQueFicam = alunos.filter((a) => a.id !== idAluno);
  const sessoes = sessions.filter((s) => !daquele(s));
  const programas = (treinos.prescricoes || []).filter((p) => !daquele(p));
  const respostas = (formularios.respostas || []).filter((r) => !daquele(r));

  const soltas = fotosSoltas(
    [sessoesDele, programasDele, respostasDele],
    [alunosQueFicam, sessoes, { ...treinos, prescricoes: programas }, { ...formularios, respostas }, definicoes],
    fotos,
  );
  const idsSoltas = new Set(soltas.map((f) => f.id));
  return {
    alunos: alunosQueFicam,
    sessoes,
    programas,
    respostas,
    fotos: fotos.filter((f) => !idsSoltas.has(f.id)),
    soltas,
    tem: {
      sessoes: sessoesDele.length,
      programas: programasDele.length,
      respostas: respostasDele.length,
      fotos: soltas.length,
    },
  };
}
