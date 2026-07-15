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
    await expect(page.getByRole('dialog', { name: 'Editar partida' })).toHaveCount(0);

    await page.getByLabel('Pontos da Dupla 1').fill('19');
    await page.getByLabel('Pontos da Dupla 2').fill('21');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();

    await expect(page).toHaveURL(new RegExp(`/app/partidas/${PARTIDA_ID}$`));
    await expect(page.getByText('19 x 21')).toBeVisible();
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

    await prepararApiEdicao(page);
    await page.goto(`/app/partidas/${PARTIDA_ID}/editar`);

    await expect(page.getByRole('button', { name: 'Salvar alterações' })).toBeInViewport();
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
