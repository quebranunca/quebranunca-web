import { http } from './http';

export const dashboardServico = {
  async obterDashboardAtleta() {
    const resposta = await http.get('/dashboard/atleta');
    return resposta.data;
  }
};
