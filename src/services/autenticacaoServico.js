import { http } from './http';

export const autenticacaoServico = {
  async registrarPorConvite(dados) {
    const resposta = await http.post('/autenticacao/registrar-por-convite', dados);
    return resposta.data;
  },

  async iniciarAcesso(dados) {
    const resposta = await http.post('/autenticacao/iniciar-acesso', dados);
    return resposta.data;
  },

  async confirmarCodigoAcesso(dados) {
    const resposta = await http.post('/autenticacao/confirmar-codigo', dados);
    return resposta.data;
  },

  async completarCadastroPublico(dados) {
    const resposta = await http.post('/autenticacao/completar-cadastro-publico', dados);
    return resposta.data;
  },

  async criarSenha(dados) {
    const resposta = await http.post('/autenticacao/criar-senha', dados);
    return resposta.data;
  },

  async criarSenhaComToken(dados) {
    const resposta = await http.post('/autenticacao/criar-senha-com-token', dados);
    return resposta.data;
  },

  async obterTermosVersaoAtual() {
    const resposta = await http.get('/termos/versao-atual');
    return resposta.data;
  },

  async solicitarCodigoLogin(dados) {
    const resposta = await http.post('/autenticacao/login/codigo/solicitar', dados);
    return resposta.data;
  },

  async loginComCodigo(dados) {
    const resposta = await http.post('/autenticacao/login/codigo', dados);
    return resposta.data;
  },

  async login(dados) {
    const resposta = await http.post('/autenticacao/login', dados);
    return resposta.data;
  },

  async renovarToken(dados) {
    const resposta = await http.post('/autenticacao/renovar-token', dados);
    return resposta.data;
  },

  async solicitarRedefinicaoSenha(dados) {
    const resposta = await http.post('/autenticacao/esqueci-senha/solicitar', dados);
    return resposta.data;
  },

  async redefinirSenha(dados) {
    const resposta = await http.post('/autenticacao/esqueci-senha/redefinir', dados);
    return resposta.data;
  },

  async me() {
    const resposta = await http.get('/autenticacao/me');
    return resposta.data;
  }
};
