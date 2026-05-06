function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

export function obterNomeExibicaoAtleta(atleta) {
  if (!atleta) {
    return '';
  }

  return normalizarTexto(atleta.apelido) ||
    normalizarTexto(atleta.apelidoAtleta) ||
    normalizarTexto(atleta.nome) ||
    normalizarTexto(atleta.nomeAtleta) ||
    '';
}

export function obterNomeExibicaoAtletaCampos(nome, apelido) {
  return obterNomeExibicaoAtleta({ nome, apelido });
}
