import { normalizarOrigemInterna } from './partidaRotas';

export const ROTA_CRIAR_GRUPO = '/app/grupos/criar';
export const ROTA_GRUPOS = '/grupos';

export function obterRotaDetalheGrupo(grupoOuId) {
  const grupoId = typeof grupoOuId === 'string'
    ? grupoOuId
    : grupoOuId?.id ?? grupoOuId?.grupoId;

  return grupoId ? `/grupos/${grupoId}` : ROTA_GRUPOS;
}

export function obterOrigemAtualParaCriarGrupo(location) {
  const origem = normalizarOrigemInterna({
    pathname: location?.pathname,
    search: location?.search,
    hash: location?.hash
  });

  return origem.startsWith(ROTA_CRIAR_GRUPO) ? '' : origem;
}

export function criarNavegacaoCriacaoGrupo({ origem } = {}) {
  const origemNormalizada = normalizarOrigemInterna(origem);

  return {
    to: ROTA_CRIAR_GRUPO,
    state: origemNormalizada ? { origem: origemNormalizada } : undefined
  };
}
