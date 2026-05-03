import { http } from './http';

export const gruposServico = {
  async obterResumoUsuario() {
    const resposta = await http.get('/grupos/resumo-usuario');
    return resposta.data;
  }
};
