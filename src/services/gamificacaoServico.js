import { http } from './http';

export const gamificacaoServico = {
  async obterResumo() {
    const resposta = await http.get('/gamificacao/resumo');
    return resposta.data;
  },

  async listarExtrato(params = {}) {
    const resposta = await http.get('/gamificacao/extrato', { params });
    return resposta.data;
  },

  async listarBeneficios(params = {}) {
    const resposta = await http.get('/gamificacao/beneficios', { params });
    return resposta.data;
  },

  async solicitarResgate(beneficioId, dados = {}) {
    const resposta = await http.post(`/gamificacao/beneficios/${beneficioId}/resgatar`, dados);
    return resposta.data;
  },

  async listarResgates() {
    const resposta = await http.get('/gamificacao/resgates');
    return resposta.data;
  },

  async listarMissoes() {
    const resposta = await http.get('/gamificacao/missoes');
    return resposta.data;
  },

  async listarConquistas() {
    const resposta = await http.get('/gamificacao/conquistas');
    return resposta.data;
  },

  async registrarCompartilhamento(dados) {
    await http.post('/gamificacao/compartilhamentos', dados);
  }
};
