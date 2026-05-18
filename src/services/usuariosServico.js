import { http } from './http';

export const usuariosServico = {
  async obterMeu() {
    const resposta = await http.get('/usuarios/me');
    return resposta.data;
  },

  async obterResumo() {
    const resposta = await http.get('/usuarios/resumo');
    return resposta.data;
  },

  async atualizarMeu(dados) {
    const resposta = await http.put('/usuarios/me', dados);
    return resposta.data;
  },

  async atualizarFotoPerfil(arquivo) {
    const dados = new FormData();
    dados.append('arquivo', arquivo);

    const resposta = await http.post('/usuarios/foto-perfil', dados, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return resposta.data;
  },

  async excluirMeuPerfil() {
    await http.delete('/usuarios/meu-perfil');
  },

  async vincularMeuAtleta(dados) {
    const resposta = await http.post('/usuarios/me/vincular-atleta', dados);
    return resposta.data;
  },

  async listar(filtros) {
    const resposta = await http.get('/usuarios', {
      params: filtros
    });
    return resposta.data;
  },

  async atualizar(id, dados) {
    const resposta = await http.put(`/usuarios/${id}`, dados);
    return resposta.data;
  },

  async excluirPorAdministrador(id) {
    await http.delete(`/admin/usuarios/${id}`);
  }
};
