import { http } from './http';

export const gruposServico = {
  async listar() {
    const resposta = await http.get('/grupos');
    return resposta.data;
  },

  async obterPorId(id) {
    const resposta = await http.get(`/grupos/${id}`);
    return resposta.data;
  },

  async obterResumoUsuario() {
    const resposta = await http.get('/grupos/resumo-usuario');
    return resposta.data;
  },

  async verificarNome(nome) {
    const resposta = await http.get('/grupos/verificar-nome', {
      params: { nome }
    });
    return resposta.data;
  },

  async criar(dados) {
    const resposta = await http.post('/grupos', dados);
    return resposta.data;
  },

  async atualizar(id, dados) {
    const resposta = await http.put(`/grupos/${id}`, dados);
    return resposta.data;
  },

  async remover(id) {
    await http.delete(`/grupos/${id}`);
  }
};
