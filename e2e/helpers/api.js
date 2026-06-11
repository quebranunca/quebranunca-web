import {
  atletasBusca,
  atletaLogado,
  partidaRegistrada,
  sugestoesPartida,
  usuarioAtleta
} from '../fixtures/registrarPartida.js';

function filtrarAtletasPorTermo(url) {
  const termo = (new URL(url).searchParams.get('termo') || '').trim().toLowerCase();
  return atletasBusca.filter((atleta) => atleta.nome.toLowerCase().includes(termo));
}

export async function prepararApiRegistroPartida(page) {
  await page.route('**/api/atletas/me', async (route) => {
    await route.fulfill({ json: atletaLogado });
  });

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ json: usuarioAtleta });
  });

  await page.route('**/api/atletas/sugestoes/partida**', async (route) => {
    await route.fulfill({ json: sugestoesPartida });
  });

  await page.route('**/api/atletas/busca**', async (route) => {
    await route.fulfill({ json: filtrarAtletasPorTermo(route.request().url()) });
  });

  await page.route('**/api/grupos/selecao**', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.route('**/api/partidas', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }

    await route.fulfill({ json: partidaRegistrada });
  });

  await page.route('**/api/partidas/**/compartilhamento', async (route) => {
    await route.fulfill({ json: { url: 'http://127.0.0.1:5173/feed' } });
  });
}
