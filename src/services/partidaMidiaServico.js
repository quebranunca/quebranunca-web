import { http } from './http';

export const partidaMidiaServico = {
  async enviar(partidaId, arquivo) {
    const dados = new FormData();
    dados.append('arquivo', arquivo);

    const resposta = await http.post(`/partidas/${partidaId}/midia`, dados);
    return resposta.data;
  },

  async remover(partidaId) {
    const resposta = await http.delete(`/partidas/${partidaId}/midia`);
    return resposta.data;
  }
};
