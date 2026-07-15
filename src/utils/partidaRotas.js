export const ROTA_REGISTRAR_PARTIDA = '/partidas/registrar';

export function obterRotaDetalhePartida(partidaOuId) {
  const partidaId = typeof partidaOuId === 'string'
    ? partidaOuId
    : partidaOuId?.id ?? partidaOuId?.partidaId;

  return partidaId ? `/app/partidas/${partidaId}` : '/minhas-partidas';
}

export function normalizarOrigemInterna(origem) {
  if (!origem) {
    return '';
  }

  if (typeof origem === 'string') {
    const destino = origem.trim();
    return destino.startsWith('/') && !destino.startsWith('//') ? destino : '';
  }

  const pathname = typeof origem.pathname === 'string' ? origem.pathname : '';
  if (!pathname.startsWith('/') || pathname.startsWith('//')) {
    return '';
  }

  const search = typeof origem.search === 'string' && origem.search.startsWith('?') ? origem.search : '';
  const hash = typeof origem.hash === 'string' && origem.hash.startsWith('#') ? origem.hash : '';
  return `${pathname}${search}${hash}`;
}

export function obterOrigemAtualParaRegistro(location) {
  const origem = normalizarOrigemInterna({
    pathname: location?.pathname,
    search: location?.search,
    hash: location?.hash
  });

  return origem.startsWith(ROTA_REGISTRAR_PARTIDA) ? '' : origem;
}

export function criarNavegacaoRegistroPartida({
  origem,
  grupoId,
  categoriaId,
  competicaoId,
  partidaId
} = {}) {
  const parametros = new URLSearchParams();

  if (grupoId) {
    parametros.set('grupoId', grupoId);
  }

  if (categoriaId) {
    parametros.set('categoriaId', categoriaId);
  }

  if (competicaoId) {
    parametros.set('competicaoId', competicaoId);
  }

  if (partidaId) {
    parametros.set('partidaId', partidaId);
  }

  const queryString = parametros.toString();
  const origemNormalizada = normalizarOrigemInterna(origem);

  return {
    to: queryString ? `${ROTA_REGISTRAR_PARTIDA}?${queryString}` : ROTA_REGISTRAR_PARTIDA,
    state: origemNormalizada ? { origem: origemNormalizada } : undefined
  };
}
