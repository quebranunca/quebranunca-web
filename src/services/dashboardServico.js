import { http } from './http';

export const dashboardServico = {
  async obterDashboardPublico() {
    const resposta = await http.get('/dashboard/publico');
    return resposta.data;
  },

  async obterDashboardAtleta() {
    const resposta = await http.get('/dashboard/atleta');
    return resposta.data;
  },

  async obterPerfilAtleta() {
    const resposta = await http.get('/dashboard/atleta/perfil');
    return resposta.data;
  },

  async obterResumoAtleta() {
    const resposta = await http.get('/dashboard/atleta/resumo');
    return resposta.data;
  },

  async obterInsightsAtleta() {
    const resposta = await http.get('/dashboard/atleta/insights');
    return resposta.data;
  },

  async listarUltimasPartidasAtleta() {
    const resposta = await http.get('/dashboard/atleta/ultimas-partidas');
    return resposta.data;
  },

  async obterConexoesAtleta() {
    const resposta = await http.get('/dashboard/atleta/conexoes');
    return resposta.data;
  },

  async obterFrequenciaAtleta() {
    const resposta = await http.get('/dashboard/atleta/frequencia');
    return resposta.data;
  }
};
