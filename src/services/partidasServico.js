import { http } from './http';
import { localizacaoServico } from './localizacaoServico';

export const partidasServico = {
  async listar({ competicaoId, grupoId, categoriaId, administracao } = {}) {
    const resposta = await http.get('/partidas', {
      params: administracao ? { administracao: true } : categoriaId ? { categoriaId } : grupoId ? { grupoId } : { competicaoId }
    });
    return resposta.data;
  },

  async listarAdministracao() {
    return this.listar({ administracao: true });
  },

  async listarPorCategoria(categoriaId) {
    return this.listar({ categoriaId });
  },

  async listarPorCompeticao(competicaoId) {
    return this.listar({ competicaoId });
  },

  async listarPorGrupo(grupoId) {
    return this.listar({ grupoId });
  },

  async listarMinhas() {
    const resposta = await http.get('/partidas/minhas');
    return resposta.data;
  },

  async listarRegistradasPorMim() {
    const resposta = await http.get('/partidas/registradas-por-mim');
    return resposta.data;
  },

  async obterCompartilhamento(id) {
    const resposta = await http.get(`/partidas/${id}/compartilhamento`);
    return resposta.data;
  },

  async verificarDuplicidade(dados) {
    const resposta = await http.post('/partidas/verificar-duplicidade', dados);
    return resposta.data;
  },

  async listarEstrutura({ competicaoId, grupoId, categoriaId }) {
    const resposta = await http.get('/partidas/estrutura', {
      params: categoriaId ? { categoriaId } : grupoId ? { grupoId } : { competicaoId }
    });
    return resposta.data;
  },

  async criar(dados) {
    const localizacao = dados?.localizacao === undefined
      ? await localizacaoServico.obterLocalizacaoAtual()
      : dados.localizacao;
    const resposta = await http.post('/partidas', {
      ...dados,
      ...(localizacao ? { localizacao } : {})
    });
    return resposta.data;
  },

  async atualizar(id, dados) {
    const resposta = await http.put(`/partidas/${id}`, dados);
    return resposta.data;
  },

  async atualizarPartida(id, dados) {
    return this.atualizar(id, dados);
  },

  async atualizarBasica(id, dados) {
    const resposta = await http.put(`/partidas/${id}/edicao-basica`, dados);
    return resposta.data;
  },

  async remover(id) {
    await http.delete(`/partidas/${id}`);
  }
};
