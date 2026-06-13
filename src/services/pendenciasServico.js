import { http } from './http';

export const EVENTO_PENDENCIAS_ATUALIZADAS = 'qnf:pendencias-atualizadas';

function notificarAtualizacao() {
  window.dispatchEvent(new CustomEvent(EVENTO_PENDENCIAS_ATUALIZADAS));
}

export const pendenciasServico = {
  async listar() {
    const resposta = await http.get('/pendencias');
    return resposta.data;
  },

  async obterResumo() {
    const resposta = await http.get('/pendencias/resumo');
    return resposta.data;
  },

  async aprovarPartida(id, observacao) {
    const resposta = await http.post(`/pendencias/${id}/aprovar`, { observacao: observacao || null });
    notificarAtualizacao();
    return resposta.data;
  },

  async contestarPartida(id, observacao) {
    const resposta = await http.post(`/pendencias/${id}/contestar`, { observacao: observacao || null });
    notificarAtualizacao();
    return resposta.data;
  },

  async completarContato(id, dados) {
    const payload = typeof dados === 'string' ? { email: dados } : dados;
    const resposta = await http.put(`/pendencias/${id}/contato`, payload);
    if (!resposta.data?.usuarioJaCadastrado) {
      notificarAtualizacao();
    }
    return resposta.data;
  },

  async confirmarVinculoAtletaCadastrado(id, usuarioId) {
    const resposta = await http.post(`/pendencias/${id}/vincular-atleta-cadastrado`, { usuarioId });
    notificarAtualizacao();
    return resposta.data;
  }
};
