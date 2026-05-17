import { http } from './http';

export const solicitacoesAcessoServico = {
  async criar(dados) {
    const resposta = await http.post('/solicitacoes-acesso', dados);
    return resposta.data;
  },

  async listarAdmin() {
    const resposta = await http.get('/admin/solicitacoes-acesso');
    return resposta.data;
  },

  async aprovar(id) {
    const resposta = await http.post(`/admin/solicitacoes-acesso/${id}/aprovar`);
    return resposta.data;
  },

  async rejeitar(id) {
    const resposta = await http.post(`/admin/solicitacoes-acesso/${id}/rejeitar`);
    return resposta.data;
  },

  async enviarConvite(id) {
    const resposta = await http.post(`/admin/solicitacoes-acesso/${id}/enviar-convite`);
    return resposta.data;
  }
};
