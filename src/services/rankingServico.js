import { http } from './http';

export const rankingServico = {
  async obterFiltroInicial() {
    const resposta = await http.get('/ranking/filtro-inicial');
    return resposta.data;
  },

  async listarAtletasGeral() {
    const resposta = await http.get('/ranking/geral/atletas');
    return resposta.data;
  },

  async listarAtletasPorLiga(ligaId) {
    const resposta = await http.get(`/ranking/ligas/${ligaId}/atletas`);
    return resposta.data;
  },

  async listarRegioesDisponiveis() {
    const resposta = await http.get('/ranking/regioes');
    return resposta.data;
  },

  async listarAtletasPorRegiao(filtros = {}) {
    const params = {};
    if (filtros.estado) {
      params.estado = filtros.estado;
    }
    if (filtros.cidade) {
      params.cidade = filtros.cidade;
    }
    if (filtros.bairro) {
      params.bairro = filtros.bairro;
    }

    const resposta = await http.get('/ranking/regiao/atletas', { params });
    return resposta.data;
  },

  async listarAtletasPorCompeticao(competicaoId) {
    const resposta = await http.get(`/ranking/competicoes/${competicaoId}/atletas`);
    return resposta.data;
  },

  async listarAtletasPorGrupo(grupoId) {
    const resposta = await http.get(`/ranking/grupos/${grupoId}/atletas`);
    return resposta.data;
  },

  async listarDuplas(filtros = {}) {
    const resposta = await http.get('/rankings/duplas', {
      params: montarParamsRanking(filtros)
    });
    return resposta.data;
  },

  async obterDupla(id, filtros = {}) {
    const resposta = await http.get(`/rankings/duplas/${id}`, {
      params: montarParamsRanking(filtros)
    });
    return resposta.data;
  },

  async listarGruposRanking(filtros = {}) {
    const resposta = await http.get('/rankings/grupos', {
      params: montarParamsRanking(filtros)
    });
    return resposta.data;
  },

  async obterGrupoRanking(id, filtros = {}) {
    const resposta = await http.get(`/rankings/grupos/${id}`, {
      params: montarParamsRanking(filtros)
    });
    return resposta.data;
  }
};

function montarParamsRanking(filtros = {}) {
  return Object.entries({
    grupoId: filtros.grupoId || undefined,
    periodo: filtros.periodo || undefined,
    pagina: filtros.pagina || undefined,
    tamanhoPagina: filtros.tamanhoPagina || undefined,
    ordenacao: filtros.ordenacao || undefined
  }).reduce((params, [chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') {
      params[chave] = valor;
    }

    return params;
  }, {});
}
