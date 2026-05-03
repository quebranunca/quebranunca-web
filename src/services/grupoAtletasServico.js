import { http } from './http';

export const grupoAtletasServico = {
  async listarPorCompeticao(competicaoId) {
    return this.listarPorGrupo(competicaoId);
  },

  async listarPorGrupo(grupoId) {
    const resposta = await http.get(`/grupos/${grupoId}/atletas`);
    return resposta.data;
  },

  async criar(grupoId, dados) {
    const resposta = await http.post(`/grupos/${grupoId}/atletas`, dados);
    return resposta.data;
  },

  async completarEmail(grupoId, id, email) {
    const resposta = await http.put(`/grupos/${grupoId}/atletas/${id}/email`, { email });
    return resposta.data;
  },

  async remover(grupoId, id) {
    await http.delete(`/grupos/${grupoId}/atletas/${id}`);
  },

  async assumirMeuNome(grupoId, id) {
    const resposta = await http.post(`/grupos/${grupoId}/atletas/${id}/assumir`);
    return resposta.data;
  }
};
