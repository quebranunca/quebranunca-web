import { expect, test } from '@playwright/test';
import { autenticarComoAtleta } from './helpers/autenticacao.js';
import { prepararApiRegistroPartida } from './helpers/api.js';

const PARTIDA_ID = '11111111-1111-4111-8111-111111111111';

const partidaBase = {
  id: PARTIDA_ID,
  grupoId: 'grupo-e2e',
  nomeGrupo: 'Grupo E2E',
  criadoPorUsuarioId: 'usr-atleta',
  nomeCriadoPorUsuario: 'Gustavo Drager',
  duplaAId: 'dupla-a',
  nomeDuplaA: 'Gustavo Drager e Marina Costa',
  duplaAAtleta1Id: 'atl-usuario',
  nomeDuplaAAtleta1: 'Gustavo Drager',
  duplaAAtleta2Id: 'atl-marina',
  nomeDuplaAAtleta2: 'Marina Costa',
  duplaBId: 'dupla-b',
  nomeDuplaB: 'Bruna Alves e Carlos Souza',
  duplaBAtleta1Id: 'atl-bruna',
  nomeDuplaBAtleta1: 'Bruna Alves',
  duplaBAtleta2Id: 'atl-carlos',
  nomeDuplaBAtleta2: 'Carlos Souza',
  status: 2,
  statusAprovacao: 3,
  placarDuplaA: 21,
  placarDuplaB: 18,
  duplaVencedoraId: 'dupla-a',
  nomeDuplaVencedora: 'Gustavo Drager e Marina Costa',
  duplaVencedora: 1,
  tipoRegistroResultado: 'PlacarDetalhado',
  possuiPlacarDetalhado: true,
  dataPartida: '2026-07-04T12:00:00.000Z',
  dataCriacao: '2026-07-04T12:00:00.000Z',
  quantidadeAtletasPendentes: 0,
  cancelada: false,
  cancelamentoPendente: false,
  podeEditar: true,
  permissoes: {
    podeEditar: true,
    podeCancelar: false,
    podeExcluirDefinitivamente: false,
    podeSolicitarCancelamento: false,
    podeResponderCancelamento: false,
    podeCancelarSolicitacao: false
  },
  historico: []
};

async function rolarConteudoAteFicarAcimaDasAcoes(page, seletorConteudo) {
  await expect.poll(async () => {
    return page.evaluate((seletor) => {
      const conteudo = document.querySelector(seletor);
      const acoes = document.querySelector('.registrar-partida-novo-cta-sticky');
      const scroller = document.querySelector('.editar-partida-pagina .registrar-partida-novo-corpo') ||
        document.querySelector('.conteudo-principal') ||
        document.scrollingElement;

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

async function prepararApiEdicao(page, { semPermissao = false } = {}) {
  let partidaAtual = {
    ...partidaBase,
    podeEditar: !semPermissao,
    permissoes: {
      ...partidaBase.permissoes,
      podeEditar: !semPermissao
    }
  };

  await prepararApiRegistroPartida(page);

  await page.route('**/api/pendencias', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.route('**/api/partidas/minhas', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.route('**/api/partidas/registradas-por-mim', async (route) => {
    await route.fulfill({ json: [partidaAtual] });
  });

  await page.route('**/api/grupos/grupo-e2e', async (route) => {
    await route.fulfill({ json: { id: 'grupo-e2e', nome: 'Grupo E2E', privacidade: 'Privado' } });
  });

  await page.route('**/api/grupos/grupo-e2e/dashboard', async (route) => {
    await route.fulfill({ json: { grupo: { id: 'grupo-e2e', nome: 'Grupo E2E', podeRegistrarPartida: true } } });
  });

  await page.route('**/api/grupos/grupo-e2e/atletas', async (route) => {
    await route.fulfill({
      json: [
        { id: 'atl-usuario', nome: 'Gustavo Drager' },
        { id: 'atl-marina', nome: 'Marina Costa' },
        { id: 'atl-bruna', nome: 'Bruna Alves' },
        { id: 'atl-carlos', nome: 'Carlos Souza' }
      ]
    });
  });

  await page.route(`**/api/partidas/${PARTIDA_ID}`, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }

    await route.fulfill({ json: partidaAtual });
  });

  await page.route(`**/api/partidas/${PARTIDA_ID}/edicao-basica`, async (route) => {
    const payload = route.request().postDataJSON();
    partidaAtual = {
      ...partidaAtual,
      placarDuplaA: payload.placarDuplaA,
      placarDuplaB: payload.placarDuplaB,
      duplaVencedora: payload.placarDuplaA > payload.placarDuplaB ? 1 : 2,
      nomeDuplaVencedora: payload.placarDuplaA > payload.placarDuplaB
        ? partidaAtual.nomeDuplaA
        : partidaAtual.nomeDuplaB
    };
    await route.fulfill({ json: partidaAtual });
  });
}

test.beforeEach(async ({ page }) => {
  await autenticarComoAtleta(page);
});

test.describe('Editar partida', () => {
  test('Minhas partidas abre edição, altera resultado, salva e abre detalhes atualizados', async ({ page }) => {
    await prepararApiEdicao(page);
    await page.goto('/minhas-partidas?filtro=registradas');

    await page.getByRole('button', { name: 'Editar partida' }).click();
    await expect(page).toHaveURL(new RegExp(`/app/partidas/${PARTIDA_ID}/editar$`));
    await expect(page.getByRole('heading', { name: 'Editar partida' })).toBeVisible();
    await expect(page.locator('.app-hero')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'QuebraNunca' })).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'Editar partida' })).toHaveCount(0);

    await page.getByLabel('Pontos da Dupla 1').fill('19');
    await page.getByLabel('Pontos da Dupla 2').fill('21');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();

    await expect(page).toHaveURL(new RegExp(`/app/partidas/${PARTIDA_ID}$`));
    await expect(page.getByText('19 x 21')).toBeVisible();
  });

  test('detalhe mobile mostra editar e compartilhar fora do hero e abaixo do resultado', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Cenário específico do projeto Mobile Chrome.');

    await page.setViewportSize({ width: 390, height: 844 });
    await prepararApiEdicao(page);
    await page.goto(`/app/partidas/${PARTIDA_ID}`);

    const hero = page.locator('.app-hero');
    const cardPrincipal = page.locator('.partida-detalhe-card.principal');
    const secaoAcoes = page.getByRole('region', { name: 'Ações da partida' });

    await expect(cardPrincipal).toBeVisible();
    await expect(secaoAcoes).toBeVisible();
    await expect(hero.getByRole('link', { name: 'Editar partida' })).toHaveCount(0);
    await expect(hero.getByRole('button', { name: 'Compartilhar partida' })).toHaveCount(0);
    await expect(secaoAcoes.getByRole('link', { name: 'Editar partida' })).toBeVisible();
    await expect(secaoAcoes.getByRole('button', { name: 'Compartilhar partida' })).toBeVisible();

    const posicoes = await page.evaluate(() => {
      const principal = document.querySelector('.partida-detalhe-card.principal');
      const acoes = document.querySelector('.partida-detalhe-card.acoes-partida');
      const bottomNav = document.querySelector('.mobile-bottom-navigation');
      const principalRect = principal?.getBoundingClientRect();
      const acoesRect = acoes?.getBoundingClientRect();
      const bottomNavRect = bottomNav?.getBoundingClientRect();

      return {
        acoesAbaixoResultado: Boolean(principalRect && acoesRect && acoesRect.top >= principalRect.bottom),
        acoesSobrepoemNav: Boolean(acoesRect && bottomNavRect && acoesRect.bottom > bottomNavRect.top && acoesRect.top < bottomNavRect.bottom)
      };
    });

    expect(posicoes.acoesAbaixoResultado).toBe(true);
    expect(posicoes.acoesSobrepoemNav).toBe(false);

    await secaoAcoes.getByRole('link', { name: 'Editar partida' }).click();
    await expect(page).toHaveURL(new RegExp(`/app/partidas/${PARTIDA_ID}/editar$`));
  });

  test('confirma volta sem salvar mantendo origem', async ({ page }) => {
    await prepararApiEdicao(page);
    await page.goto(`/app/partidas/${PARTIDA_ID}/editar`);

    await page.getByLabel('Pontos da Dupla 1').fill('20');
    await page.locator('.editar-partida-pagina .app-hero__back-button').click();

    await expect(page.getByRole('dialog', { name: 'Sair sem salvar' })).toBeVisible();
    await page.getByRole('button', { name: 'Sair sem salvar' }).click();
    await expect(page).toHaveURL(new RegExp(`/app/partidas/${PARTIDA_ID}$`));
  });

  test('mantém ações visíveis no mobile e não bloqueia body como modal', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Cenário específico do projeto Mobile Chrome.');

    await page.setViewportSize({ width: 390, height: 844 });
    await prepararApiEdicao(page);
    await page.goto(`/app/partidas/${PARTIDA_ID}/editar`);

    await page.locator('[data-testid="campo-atleta2Dupla2"]').scrollIntoViewIfNeeded();
    await rolarConteudoAteFicarAcimaDasAcoes(page, '[data-testid="campo-atleta2Dupla2"]');
    await expect(page.getByRole('button', { name: 'Salvar alterações' })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeInViewport();

    const regioes = await page.evaluate(() => {
      const ultimoCampo = document.querySelector('[data-testid="campo-atleta2Dupla2"]');
      const acoes = document.querySelector('.registrar-partida-novo-cta-sticky');
      const bottomNav = document.querySelector('.mobile-bottom-navigation');
      const corpo = document.querySelector('.registrar-partida-novo-corpo');

      const campoRect = ultimoCampo?.getBoundingClientRect();
      const acoesRect = acoes?.getBoundingClientRect();
      const bottomNavRect = bottomNav?.getBoundingClientRect();
      const corpoRect = corpo?.getBoundingClientRect();

      return {
        areaRolavelAntesDasAcoes: Boolean(corpoRect && acoesRect && corpoRect.bottom <= acoesRect.top + 1),
        acoesAntesDaNav: Boolean(acoesRect && bottomNavRect && acoesRect.bottom <= bottomNavRect.top + 1),
        campoVisivelNaAreaRolavel: Boolean(campoRect && corpoRect && campoRect.top >= corpoRect.top && campoRect.bottom <= corpoRect.bottom),
        areaCruzaAcoes: Boolean(corpoRect && acoesRect && corpoRect.bottom > acoesRect.top && corpoRect.top < acoesRect.bottom),
        acoesCruzamNav: Boolean(acoesRect && bottomNavRect && acoesRect.bottom > bottomNavRect.top && acoesRect.top < bottomNavRect.bottom)
      };
    });

    expect(regioes.areaRolavelAntesDasAcoes).toBe(true);
    expect(regioes.acoesAntesDaNav).toBe(true);
    expect(regioes.campoVisivelNaAreaRolavel).toBe(true);
    expect(regioes.areaCruzaAcoes).toBe(false);
    expect(regioes.acoesCruzamNav).toBe(false);

    const bloqueioModal = await page.evaluate(() => ({
      bodyClass: document.body.classList.contains('registrar-partida-modal-aberto'),
      overflowBody: getComputedStyle(document.body).overflow
    }));
    expect(bloqueioModal.bodyClass).toBe(false);
    expect(bloqueioModal.overflowBody).not.toBe('hidden');
  });

  test('exibe sem permissão quando backend não autoriza edição', async ({ page }) => {
    await prepararApiEdicao(page, { semPermissao: true });
    await page.goto(`/app/partidas/${PARTIDA_ID}/editar`);

    await expect(page.getByRole('alert')).toContainText('Você não possui permissão');
    await expect(page.getByRole('form', { name: 'Formulário de edição' })).toHaveCount(0);
  });
});
