import { http } from './http';

function removerCamposVazios(filtros = {}) {
  const normalizado = {};

  if (filtros.termoBusca) {
    normalizado.termoBusca = filtros.termoBusca.trim();
  }

  if (filtros.cidade) {
    normalizado.cidade = filtros.cidade.trim();
  }

  if (filtros.estado) {
    normalizado.estado = filtros.estado.trim();
  }

  if (filtros.tipoArena !== undefined && filtros.tipoArena !== null && filtros.tipoArena !== '') {
    const valorTipo = Number(filtros.tipoArena);
    if (!Number.isNaN(valorTipo)) {
      normalizado.tipoArena = valorTipo;
    }
  }

  return normalizado;
}

function normalizarTexto(valor) {
  if (typeof valor !== 'string') {
    return '';
  }

  return valor.trim();
}

function normalizarNumero(valor) {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }

  const numero = Number(valor);
  return Number.isNaN(numero) ? null : numero;
}

function prepararAtualizacaoArena(dados = {}) {
  return {
    nome: normalizarTexto(dados.nome),
    descricao: normalizarTexto(dados.descricao) || null,
    tipoArena: normalizarNumero(dados.tipoArena) ?? 0,
    endereco: normalizarTexto(dados.endereco) || null,
    enderecoResumo: normalizarTexto(dados.enderecoResumo) || null,
    cidade: normalizarTexto(dados.cidade) || null,
    estado: normalizarTexto(dados.estado) || null,
    latitude: normalizarNumero(dados.latitude),
    longitude: normalizarNumero(dados.longitude),
    whatsapp: normalizarTexto(dados.whatsapp) || null,
    instagram: normalizarTexto(dados.instagram) || null,
    site: normalizarTexto(dados.site) || null,
    quantidadeEspacos: normalizarNumero(dados.quantidadeEspacos) ?? 0,
    possuiIluminacao: Boolean(dados.possuiIluminacao),
    possuiEstacionamento: Boolean(dados.possuiEstacionamento),
    possuiVestiario: Boolean(dados.possuiVestiario),
    possuiDucha: Boolean(dados.possuiDucha),
    possuiBarRestaurante: Boolean(dados.possuiBarRestaurante),
    possuiLoja: Boolean(dados.possuiLoja),
    possuiCobertura: Boolean(dados.possuiCobertura)
  };
}

export const arenaService = {
  async listarArenas(filtros = {}) {
    const resposta = await http.get('/arenas', {
      params: removerCamposVazios(filtros)
    });

    return resposta.data;
  },

  async listarMinhasArenas() {
    const resposta = await http.get('/arenas/admin/minhas');
    return resposta.data;
  },

  async obterArenaPorSlug(slug) {
    const resposta = await http.get(`/arenas/${encodeURIComponent(slug)}`);
    return resposta.data;
  },

  async obterArenaAdmin(arenaId) {
    const resposta = await http.get(`/arenas/admin/${encodeURIComponent(arenaId)}`);
    return resposta.data;
  },

  async atualizarArena(arenaId, dados) {
    const payload = prepararAtualizacaoArena(dados);
    const resposta = await http.put(`/arenas/admin/${encodeURIComponent(arenaId)}`, payload);
    return resposta.data;
  },

  async atualizarStatusArena(arenaId, ativa) {
    const resposta = await http.patch(`/arenas/admin/${encodeURIComponent(arenaId)}/status`, {
      ativa: Boolean(ativa)
    });

    return resposta.data;
  },

  async atualizarVisibilidadeArena(arenaId, publica) {
    const resposta = await http.patch(`/arenas/admin/${encodeURIComponent(arenaId)}/visibilidade`, {
      publica: Boolean(publica)
    });

    return resposta.data;
  },

  async listarEspacos(arenaId) {
    const resposta = await http.get(`/arenas/admin/${encodeURIComponent(arenaId)}/espacos`);
    return resposta.data;
  },

  async criarEspaco(arenaId, dados) {
    const resposta = await http.post(`/arenas/admin/${encodeURIComponent(arenaId)}/espacos`, dados);
    return resposta.data;
  },

  async atualizarEspaco(arenaId, espacoId, dados) {
    const resposta = await http.put(`/arenas/admin/${encodeURIComponent(arenaId)}/espacos/${encodeURIComponent(espacoId)}`, dados);
    return resposta.data;
  },

  async atualizarStatusEspaco(arenaId, espacoId, ativo) {
    const resposta = await http.patch(`/arenas/admin/${encodeURIComponent(arenaId)}/espacos/${encodeURIComponent(espacoId)}/status`, {
      ativo: Boolean(ativo)
    });

    return resposta.data;
  },

  async obterResumoPublicoArena(id) {
    const resposta = await http.get(`/arenas/${id}/resumo-publico`);
    return resposta.data;
  }
};
