import { http } from './http';

export const CHAVE_PERMISSAO_LOCALIZACAO = 'qnf_permitir_uso_localizacao';

export function sincronizarPermissaoLocalizacao(valor) {
  localStorage.setItem(CHAVE_PERMISSAO_LOCALIZACAO, valor ? 'true' : 'false');
}

export const privacidadeServico = {
  async obterPoliticaAtual() {
    const resposta = await http.get('/privacidade/politica-atual');
    return resposta.data;
  },

  async obterMinhasPreferencias() {
    const resposta = await http.get('/privacidade/minhas-preferencias');
    sincronizarPermissaoLocalizacao(Boolean(resposta.data?.permitirUsoLocalizacao));
    return resposta.data;
  },

  async atualizarMinhasPreferencias(dados) {
    const resposta = await http.put('/privacidade/minhas-preferencias', dados);
    sincronizarPermissaoLocalizacao(Boolean(resposta.data?.permitirUsoLocalizacao));
    return resposta.data;
  },

  async registrarConsentimento(dados) {
    const resposta = await http.post('/privacidade/consentimentos', dados);
    sincronizarPermissaoLocalizacao(Boolean(resposta.data?.permitirUsoLocalizacao));
    return resposta.data;
  },

  async solicitarExclusao() {
    await http.post('/privacidade/solicitar-exclusao');
  }
};
