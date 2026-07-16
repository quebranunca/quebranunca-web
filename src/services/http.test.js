import { describe, expect, it, vi } from 'vitest';

async function carregarHttpComEnv(env = {}) {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv('VITE_API_BASE_URL', '');
  vi.stubEnv('VITE_API_URL', '');

  for (const [chave, valor] of Object.entries(env)) {
    vi.stubEnv(chave, valor);
  }

  return import('./http');
}

describe('http', () => {
  it('usa /api como fallback quando a URL da API nao esta configurada', async () => {
    const { obterApiBaseUrl } = await carregarHttpComEnv();

    expect(obterApiBaseUrl()).toBe('/api');
  });

  it('normaliza VITE_API_BASE_URL adicionando /api somente quando necessario', async () => {
    const { obterApiBaseUrl } = await carregarHttpComEnv({
      VITE_API_BASE_URL: 'http://localhost:5080/'
    });

    expect(obterApiBaseUrl()).toBe('http://localhost:5080/api');
  });

  it('preserva VITE_API_BASE_URL quando a URL ja aponta para /api', async () => {
    const { obterApiBaseUrl } = await carregarHttpComEnv({
      VITE_API_BASE_URL: 'https://api.quebranunca.test/api'
    });

    expect(obterApiBaseUrl()).toBe('https://api.quebranunca.test/api');
  });
});
