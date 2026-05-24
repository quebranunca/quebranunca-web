function normalizarId(valor) {
  return valor ? String(valor) : '';
}

export function obterAtletaIdPerfil(atletaOuId) {
  if (!atletaOuId) {
    return '';
  }

  if (typeof atletaOuId === 'string') {
    return normalizarId(atletaOuId);
  }

  return normalizarId(
    atletaOuId.atletaId
    || atletaOuId.id
    || atletaOuId.atleta?.id
    || atletaOuId.usuarioAtletaId
  );
}

export function obterAtletaIdUsuario(usuario) {
  return normalizarId(usuario?.atletaId || usuario?.atleta?.id);
}

export function atletaEhUsuarioLogado(atletaOuId, usuario) {
  const atletaId = obterAtletaIdPerfil(atletaOuId);
  const atletaUsuarioId = obterAtletaIdUsuario(usuario);

  return Boolean(atletaId && atletaUsuarioId && atletaId === atletaUsuarioId);
}

export function montarRotaPerfilAtleta(atletaOuId, usuario) {
  const atletaId = obterAtletaIdPerfil(atletaOuId);

  if (!atletaId) {
    return '';
  }

  return atletaEhUsuarioLogado(atletaId, usuario)
    ? '/app/perfil'
    : `/atletas/${atletaId}/dashboard`;
}
