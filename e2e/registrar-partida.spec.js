import { expect, test } from '@playwright/test';
import { autenticarComoAtleta } from './helpers/autenticacao.js';
import { prepararApiRegistroPartida } from './helpers/api.js';
import { RegistrarPartidaPage } from './pages/RegistrarPartidaPage.js';

test.beforeEach(async ({ page }) => {
  await autenticarComoAtleta(page);
  await prepararApiRegistroPartida(page);
});

async function rolarConteudoAteFicarAcimaDasAcoes(page, seletorConteudo) {
  await expect.poll(async () => {
    return page.evaluate((seletor) => {
      const conteudo = document.querySelector(seletor);
      const acoes = document.querySelector('.registrar-partida-novo-cta-sticky');
      const scroller = document.querySelector('.conteudo-principal') || document.scrollingElement;

      if (!(conteudo instanceof HTMLElement) || !acoes || !scroller) {
        return false;
      }

      const conteudoRect = conteudo.getBoundingClientRect();
      const acoesRect = acoes.getBoundingClientRect();
      const visivelAcimaDasAcoes = conteudoRect.bottom <= acoesRect.top;

      if (!visivelAcimaDasAcoes) {
        scroller.scrollBy({ top: 120, behavior: 'instant' });
      }

      return visivelAcimaDasAcoes;
    }, seletorConteudo);
  }, {
    intervals: [100, 150, 200],
    timeout: 3000
  }).toBe(true);
}

test.describe('Registrar partida', () => {
  test('abre o fluxo e exibe os elementos principais', async ({ page }) => {
    const fluxo = new RegistrarPartidaPage(page);
    await fluxo.abrir();

    await expect(page.getByRole('heading', { name: 'Onde foi a partida?' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Partida avulsa/i })).toBeVisible();
    await fluxo.continuar();
    await expect(fluxo.dupla(1)).toBeVisible();
    await fluxo.selecionarSugestaoRapida(1, 'Atleta 2', 'Marina Costa');
    await fluxo.continuar();
    await expect(fluxo.dupla(2)).toBeVisible();
    await fluxo.selecionarSugestaoRapida(2, 'Atleta 1', 'Bruna Alves');
    await fluxo.selecionarSugestaoRapida(2, 'Atleta 2', 'Carlos Souza');
    await fluxo.continuar();
    await expect(page.getByRole('group', { name: 'Como registrar o resultado' })).toBeVisible();
  });

  test('exibe o usuário logado automaticamente como Atleta 1 da Dupla 1', async ({ page }) => {
    const fluxo = new RegistrarPartidaPage(page);
    await fluxo.abrir();
    await fluxo.avancarDoGrupo();

    await expect(page.getByTestId('campo-atleta1Dupla1').getByText('Gustavo Drager', { exact: true })).toBeVisible();
  });

  test('mantém o atleta selecionado ao clicar em sugestão rápida', async ({ page }) => {
    const fluxo = new RegistrarPartidaPage(page);
    await fluxo.abrir();
    await fluxo.avancarDoGrupo();

    await fluxo.selecionarSugestaoRapida(1, 'Atleta 2', 'Marina Costa');
    await expect(fluxo.campoAtleta(1, 'Atleta 2')).toBeHidden();
    await expect(fluxo.dupla(1).getByText('Marina Costa')).toBeVisible();
  });

  test('busca por início do nome e preenche o campo com a seleção correta', async ({ page }) => {
    const fluxo = new RegistrarPartidaPage(page);
    await fluxo.abrir();
    await fluxo.avancarDoGrupo();
    await fluxo.selecionarSugestaoRapida(1, 'Atleta 2', 'Marina Costa');
    await fluxo.continuar();

    await fluxo.buscarESelecionar(2, 'Atleta 1', 'bru', 'Bruna Alves');
    await expect(fluxo.campoAtleta(2, 'Atleta 1')).toBeHidden();
    await expect(page.getByTestId('campo-atleta1Dupla2').getByText('Bruna Alves', { exact: true })).toBeVisible();
  });

  test('mantém conteúdo visível e topo alinhado ao focar campo de atleta', async ({ page }) => {
    const fluxo = new RegistrarPartidaPage(page);
    await fluxo.abrir();
    await fluxo.avancarDoGrupo();
    await fluxo.selecionarSugestaoRapida(1, 'Atleta 2', 'Marina Costa');
    await fluxo.continuar();

    const topoAntes = await fluxo.pagina.boundingBox();
    await fluxo.campoAtleta(2, 'Atleta 2').focus();
    await expect(fluxo.campoAtleta(2, 'Atleta 2')).toBeInViewport();
    await expect(fluxo.pagina).toBeInViewport();
    const topoDepois = await fluxo.pagina.boundingBox();

    expect(Math.abs((topoDepois?.y ?? 0) - (topoAntes?.y ?? 0))).toBeLessThanOrEqual(24);
  });

test('mantém ações acessíveis e página sem bloqueio de modal no viewport mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Cenário específico do projeto Mobile Chrome.');

    await page.setViewportSize({ width: 360, height: 740 });
    const fluxo = new RegistrarPartidaPage(page);
    await fluxo.abrir();
    await fluxo.preencherPartidaValida();

    await rolarConteudoAteFicarAcimaDasAcoes(page, '.registrar-partida-novo-revisao');
    await expect(page.getByRole('button', { name: 'Registrar partida' })).toBeInViewport();
    await expect(fluxo.pagina.getByRole('button', { name: 'Voltar' })).toBeInViewport();

    const geometria = await page.evaluate(() => {
      const conteudoFinal = document.querySelector('.registrar-partida-novo-revisao-card') ||
        document.querySelector('.registrar-partida-novo-revisao');
      const acoes = document.querySelector('.registrar-partida-novo-cta-sticky');
      const bottomNav = document.querySelector('.mobile-bottom-navigation');
      const corpo = document.querySelector('.registrar-partida-novo-corpo');
      const formulario = document.querySelector('.registrar-partida-novo-formulario');

      const conteudoRect = conteudoFinal?.getBoundingClientRect();
      const acoesRect = acoes?.getBoundingClientRect();
      const bottomNavRect = bottomNav?.getBoundingClientRect();
      const corpoStyle = corpo ? getComputedStyle(corpo) : null;
      const formularioStyle = formulario ? getComputedStyle(formulario) : null;

      return {
        conteudoAcimaDasAcoes: Boolean(conteudoRect && acoesRect && conteudoRect.bottom <= acoesRect.top),
        acoesAcimaDaNav: Boolean(acoesRect && bottomNavRect && acoesRect.bottom <= bottomNavRect.top + 1),
        paddingCorpo: corpoStyle?.paddingBottom || '',
        paddingFormulario: formularioStyle?.paddingBottom || ''
      };
    });

    expect(geometria.conteudoAcimaDasAcoes).toBe(true);
    expect(geometria.acoesAcimaDaNav).toBe(true);
    expect(parseFloat(geometria.paddingCorpo)).toBeGreaterThan(120);
    expect(parseFloat(geometria.paddingFormulario)).toBeGreaterThan(120);

    const bloqueioModal = await page.evaluate(() => ({
      bodyClass: document.body.classList.contains('registrar-partida-modal-aberto'),
      overflowBody: getComputedStyle(document.body).overflow
    }));
    expect(bloqueioModal.bodyClass).toBe(false);
    expect(bloqueioModal.overflowBody).not.toBe('hidden');
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
