import { expect, test } from '@playwright/test';
import { autenticarComoAtleta } from './helpers/autenticacao.js';
import { usuarioAtleta } from './fixtures/registrarPartida.js';

async function prepararApiCriarGrupo(page) {
  let totalCriacoes = 0;

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ json: usuarioAtleta });
  });

  await page.route('**/api/dashboard/atleta/perfil', async (route) => {
    await route.fulfill({ json: { nome: 'Gustavo Drager', apelido: 'Primo' } });
  });

  await page.route('**/api/dashboard/atleta/resumo', async (route) => {
    await route.fulfill({ json: { totalPartidas: 0, vitorias: 0, aproveitamento: 0 } });
  });

  await page.route('**/api/dashboard/atleta/ultimas-partidas', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.route('**/api/pendencias/resumo', async (route) => {
    await route.fulfill({ json: { total: 0 } });
  });

  await page.route('**/api/gamificacao/resumo', async (route) => {
    await route.fulfill({
      json: {
        pontuacao: { saldoAtual: 0, totalAcumulado: 0, totalResgatado: 0, temAtletaVinculado: true },
        nivel: { nome: 'Bronze', numero: 1, pontosMinimos: 0, pontosProximaFaixa: 500, progressoPercentual: 0 }
      }
    });
  });

  await page.route('**/api/grupos/dashboard', async (route) => {
    await route.fulfill({
      json: {
        totais: { quantidadeGrupos: 0, quantidadeAtletas: 0, quantidadePartidas: 0, pendenciasGrupos: 0 },
        grupos: []
      }
    });
  });

  await page.route('**/api/grupos/verificar-nome**', async (route) => {
    const nome = new URL(route.request().url()).searchParams.get('nome') || '';
    if (nome.toLowerCase().includes('similar')) {
      await route.fulfill({
        json: {
          existeExato: false,
          similares: [{ id: 'grupo-similar', nome: 'Grupo Similar Existente', quantidadeAtletas: 8, privacidade: 'Privado' }]
        }
      });
      return;
    }

    await route.fulfill({ json: { existeExato: false, similares: [] } });
  });

  await page.route('**/api/grupos', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }

    totalCriacoes += 1;
    await route.fulfill({
      status: 201,
      json: {
        id: 'grupo-e2e',
        nome: 'Grupo E2E',
        privacidade: 'Público',
        imagemUrl: null
      }
    });
  });

  return {
    totalCriacoes: () => totalCriacoes
  };
}

async function abrirCriacaoPorHome(page) {
  await page.goto('/app');
  await page.getByRole('link', { name: /Criar grupo/i }).click();
}

async function preencherFluxoBasico(page, nome = 'Grupo E2E') {
  await page.getByLabel('Nome do grupo').fill(nome);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('Quem poderá encontrar este grupo?')).toBeVisible();
  await page.getByRole('button', { name: /Público/i }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('Escolha uma imagem para seu grupo')).toBeVisible();
  await page.getByRole('button', { name: 'Pular' }).click();
  await expect(page.getByText('Confirme as informações')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await autenticarComoAtleta(page);
  await prepararApiCriarGrupo(page);
});

test.describe('Criar grupo', () => {
  test('entra pela Home e renderiza como pagina interna', async ({ page }) => {
    await abrirCriacaoPorHome(page);

    await expect(page).toHaveURL(/\/app\/grupos\/criar$/);
    await expect(page.getByRole('heading', { name: 'Criar grupo' })).toBeVisible();
    await expect(page.getByRole('dialog', { name: /^Criar grupo$/ })).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveClass(/criar-grupo-wizard-aberto/);
  });

  test('entra por Grupos e volta para a origem sem dados preenchidos', async ({ page }) => {
    await page.goto('/grupos');
    await page.getByRole('button', { name: 'Criar grupo' }).click();
    await expect(page).toHaveURL(/\/app\/grupos\/criar$/);

    await page.getByRole('button', { name: 'Cancelar' }).click();

    await expect(page).toHaveURL(/\/grupos$/);
  });

  test('conclui o fluxo completo e abre o grupo criado', async ({ page }) => {
    await page.goto('/app/grupos/criar');

    await preencherFluxoBasico(page);
    await page.getByRole('button', { name: 'Criar grupo' }).click();

    await expect(page).toHaveURL(/\/grupos\/grupo-e2e$/);
  });

  test('pede confirmacao ao cancelar com dados preenchidos', async ({ page }) => {
    await page.goto('/app/grupos/criar');

    await page.getByLabel('Nome do grupo').fill('Grupo Rascunho');
    await page.getByRole('button', { name: 'Cancelar' }).click();

    const confirmacao = page.getByRole('dialog', { name: /Deseja sair da criação do grupo/i });
    await expect(confirmacao).toBeVisible();
    await confirmacao.getByRole('button', { name: 'Continuar editando' }).click();
    await expect(page).toHaveURL(/\/app\/grupos\/criar$/);

    await page.getByRole('button', { name: 'Cancelar' }).click();
    await confirmacao.getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/grupos$/);
  });

  test('mostra grupos similares e permite continuar', async ({ page }) => {
    await page.goto('/app/grupos/criar');

    await page.getByLabel('Nome do grupo').fill('Grupo Similar');
    await page.getByRole('button', { name: 'Continuar' }).click();

    const similares = page.getByRole('dialog', { name: /Encontramos grupos parecidos/i });
    await expect(similares).toBeVisible();
    await expect(similares.getByText('Grupo Similar Existente')).toBeVisible();
    await similares.getByRole('button', { name: 'Continuar mesmo assim' }).click();

    await expect(page.getByText('Quem poderá encontrar este grupo?')).toBeVisible();
  });

  test('mantem campo focado e acoes acima da bottom navigation no mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Cenário específico do projeto Mobile Chrome.');

    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/app/grupos/criar');

    const campoNome = page.getByLabel('Nome do grupo');
    await campoNome.focus();
    await expect(campoNome).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeInViewport();

    const geometria = await page.evaluate(() => {
      const campo = document.querySelector('.criar-grupo-campo input');
      const acoes = document.querySelector('.criar-grupo-acoes');
      const bottomNav = document.querySelector('.mobile-bottom-navigation');
      const campoRect = campo?.getBoundingClientRect();
      const acoesRect = acoes?.getBoundingClientRect();
      const bottomNavRect = bottomNav?.getBoundingClientRect();

      return {
        campoAcimaDasAcoes: Boolean(campoRect && acoesRect && campoRect.bottom <= acoesRect.top),
        acoesAcimaDaNav: Boolean(acoesRect && bottomNavRect && acoesRect.bottom <= bottomNavRect.top + 1)
      };
    });

    expect(geometria.campoAcimaDasAcoes).toBe(true);
    expect(geometria.acoesAcimaDaNav).toBe(true);
  });
});
