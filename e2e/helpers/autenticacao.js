import { usuarioAtleta } from '../fixtures/registrarPartida.js';

const CHAVE_ARMAZENAMENTO = 'plataforma_futevolei_autenticacao';

function criarTokenJwtFake() {
  const cabecalho = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' })).replace(/=/g, '');
  const carga = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60 })).replace(/=/g, '');
  return `${cabecalho}.${carga}.e2e`;
}

export async function autenticarComoAtleta(page) {
  await page.addInitScript(({ chave, usuario }) => {
    const token = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJleHAiOjk5OTk5OTk5OTl9.e2e';
    localStorage.setItem(chave, JSON.stringify({
      token,
      refreshToken: 'refresh-token-e2e',
      tokenExpiraEmUtc: '2099-01-01T00:00:00.000Z',
      refreshTokenExpiraEmUtc: '2099-01-01T00:00:00.000Z',
      usuario,
      primeiroAcessoPendente: false
    }));
  }, { chave: CHAVE_ARMAZENAMENTO, usuario: usuarioAtleta, token: criarTokenJwtFake() });
}
