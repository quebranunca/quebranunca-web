import { http } from './http';

export const dashboardServico = {
  async obterDashboardPublico() {
    const resposta = await http.get('/dashboard/publico');
    return resposta.data;
  },

  async obterDashboardAtleta() {
    const resposta = await http.get('/dashboard/atleta');
    return resposta.data;
  }
};
