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

  async listarParaSelecao() {
    const resposta = await http.get('/grupos/selecao');
    return resposta.data;
  },

  async obterResumoUsuario() {
    const resposta = await http.get('/grupos/resumo-usuario');
    return resposta.data;
  },

  async obterDashboard() {
    const resposta = await http.get('/grupos/dashboard');
    return resposta.data;
  },

  async listarResumosUsuario() {
    try {
      const resposta = await http.get('/grupos/resumos-usuario');
      return resposta.data;
    } catch (erro) {
      if (erro?.response?.status !== 404) {
        throw erro;
      }

      const respostaResumoLegado = await http.get('/grupos/resumo-usuario');
      return respostaResumoLegado.data ? [respostaResumoLegado.data] : [];
    }
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
