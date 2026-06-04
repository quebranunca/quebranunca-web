import { obterApiBaseUrl } from './http';

function montarUrlHealth() {
  const origem = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  const base = obterApiBaseUrl().replace(/\/+$/, '');
  return new URL(`${base}/health`, origem).href;
}

export const versaoServico = {
  async obterAtual() {
    const resposta = await fetch(montarUrlHealth(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!resposta.ok) {
      throw new Error('Não foi possível consultar a versão da plataforma.');
    }

    return resposta.json();
  }
};
