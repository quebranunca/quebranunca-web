import { http } from './http';

export const partidaFeedServico = {
  async listar({ page = 1, pageSize = 10 } = {}) {
    const resposta = await http.get('/feed/partidas', {
      params: { page, pageSize }
    });
    return resposta.data;
  }
};
