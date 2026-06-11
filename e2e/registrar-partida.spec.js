import { expect, test } from '@playwright/test';
import { autenticarComoAtleta } from './helpers/autenticacao.js';
import { prepararApiRegistroPartida } from './helpers/api.js';
import { RegistrarPartidaPage } from './pages/RegistrarPartidaPage.js';

test.beforeEach(async ({ page }) => {
  await autenticarComoAtleta(page);
  await prepararApiRegistroPartida(page);
});

test.describe('Registrar partida', () => {
  test('abre o fluxo e exibe os elementos principais', async ({ page }) => {
    const fluxo = new RegistrarPartidaPage(page);
    await fluxo.abrir();

    await expect(page.getByRole('heading', { name: 'Grupo' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Dupla 1' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Dupla 2' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Como registrar o resultado' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registrar partida' })).toBeVisible();
  });

  test('exibe o usuário logado automaticamente como Atleta 1 da Dupla 1', async ({ page }) => {
    const fluxo = new RegistrarPartidaPage(page);
    await fluxo.abrir();

    await expect(page.getByTestId('campo-atleta1Dupla1').getByText('Gustavo Drager', { exact: true })).toBeVisible();
  });

  test('mantém o atleta selecionado ao clicar em sugestão rápida', async ({ page }) => {
    const fluxo = new RegistrarPartidaPage(page);
    await fluxo.abrir();

    await fluxo.selecionarSugestaoRapida(1, 'Atleta 2', 'Marina Costa');
    await expect(fluxo.campoAtleta(1, 'Atleta 2')).toBeHidden();
    await expect(fluxo.dupla(1).getByText('Marina Costa')).toBeVisible();
  });

  test('busca por início do nome e preenche o campo com a seleção correta', async ({ page }) => {
    const fluxo = new RegistrarPartidaPage(page);
    await fluxo.abrir();

    await fluxo.buscarESelecionar(2, 'Atleta 1', 'bru', 'Bruna Alves');
    await expect(fluxo.campoAtleta(2, 'Atleta 1')).toBeHidden();
    await expect(page.getByTestId('campo-atleta1Dupla2').getByText('Bruna Alves', { exact: true })).toBeVisible();
  });

  test('mantém conteúdo visível e topo alinhado ao focar campo de atleta', async ({ page }) => {
    const fluxo = new RegistrarPartidaPage(page);
    await fluxo.abrir();

    const topoAntes = await fluxo.dialog.boundingBox();
    await fluxo.campoAtleta(2, 'Atleta 2').focus();
    await expect(fluxo.campoAtleta(2, 'Atleta 2')).toBeInViewport();
    await expect(fluxo.dialog).toBeInViewport();
    const topoDepois = await fluxo.dialog.boundingBox();

    expect(Math.abs((topoDepois?.y ?? 0) - (topoAntes?.y ?? 0))).toBeLessThanOrEqual(24);
  });

  test('mantém ações acessíveis e formulário rolável no viewport mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Cenário específico do projeto Mobile Chrome.');

    const fluxo = new RegistrarPartidaPage(page);
    await fluxo.abrir();

    await expect(page.getByRole('button', { name: 'Registrar partida' })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeInViewport();

    const scrollavel = await fluxo.corpo.evaluate((elemento) => elemento.scrollHeight > elemento.clientHeight);
    expect(scrollavel).toBe(true);
  });

  test('registra uma partida completa e exibe sucesso', async ({ page }) => {
    const fluxo = new RegistrarPartidaPage(page);
    await fluxo.abrir();

    await fluxo.preencherPartidaValida();
    await page.getByRole('button', { name: 'Registrar partida' }).click();

    await expect(page.getByRole('heading', { name: '🏆 Partida registrada' })).toBeVisible();
    await expect(page.getByText('Resultado salvo no histórico QuebraNunca.')).toBeVisible();
    await expect(page.getByText('Marina Costa', { exact: true })).toBeVisible();
  });
});
