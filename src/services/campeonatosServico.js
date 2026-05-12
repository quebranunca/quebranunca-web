import { http } from './http';

export const campeonatosServico = {
  async obterPorId(id) {
    const resposta = await http.get(`/campeonatos/${id}`);
    return resposta.data;
  },

  async criar(dados) {
    const resposta = await http.post('/campeonatos', dados);
    return resposta.data;
  },

  async atualizar(id, dados) {
    const resposta = await http.put(`/campeonatos/${id}`, dados);
    return resposta.data;
  }
};
