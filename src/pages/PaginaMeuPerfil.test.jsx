import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PaginaMeuPerfil } from './PaginaMeuPerfil';
import { atletasServico } from '../services/atletasServico';
import { dashboardServico } from '../services/dashboardServico';
import { privacidadeServico } from '../services/privacidadeServico';
import { PERFIS_USUARIO } from '../utils/perfis';

const mocks = vi.hoisted(() => ({
  usuario: {
    id: 'usuario-1',
    nome: 'Gustavo Drager',
    email: 'gustavo@example.com',
    atletaId: 'atleta-1',
    perfil: 3
  },
  atualizarUsuarioLocal: vi.fn(),
  recarregarUsuario: vi.fn(),
  criarSenha: vi.fn(),
  concluirPrimeiroAcesso: vi.fn(),
  sair: vi.fn(),
  showNotification: vi.fn(),
  closeNotification: vi.fn()
}));

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    usuario: mocks.usuario,
    atualizarUsuarioLocal: mocks.atualizarUsuarioLocal,
    recarregarUsuario: mocks.recarregarUsuario,
    criarSenha: mocks.criarSenha,
    concluirPrimeiroAcesso: mocks.concluirPrimeiroAcesso,
    sair: mocks.sair,
    primeiroAcessoPendente: false,
    estadoAcesso: 'ativo'
  })
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: mocks.showNotification,
    closeNotification: mocks.closeNotification
  })
}));

vi.mock('../services/atletasServico', () => ({
  atletasServico: {
    obterMeu: vi.fn(),
    verificarEmail: vi.fn(),
    salvarMeu: vi.fn(),
    salvarMinhasMedidas: vi.fn()
  }
}));

vi.mock('../services/dashboardServico', () => ({
  dashboardServico: {
    obterDashboardAtleta: vi.fn()
  }
}));

vi.mock('../services/privacidadeServico', () => ({
  privacidadeServico: {
    obterMinhasPreferencias: vi.fn(),
    atualizarMinhasPreferencias: vi.fn(),
    solicitarExclusao: vi.fn()
  }
}));

vi.mock('../services/arenaService', () => ({
  arenaService: {
    listarArenas: vi.fn()
  }
}));

vi.mock('../services/usuariosServico', () => ({
  usuariosServico: {
    atualizarMeu: vi.fn(),
    excluirMeuPerfil: vi.fn()
  }
}));

function criarAtleta(sobrescritas = {}) {
  return {
    id: 'atleta-1',
    nome: 'Gustavo Drager',
    apelido: 'Primo',
    email: 'gustavo@example.com',
    telefone: '',
    instagram: '',
    cpf: '',
    bairro: '',
    cidade: '',
    estado: '',
    cadastroPendente: false,
    sexo: null,
    nivel: null,
    lado: 3,
    dataNascimento: null,
    peDominante: null,
    tempoPratica: null,
    arenaPrincipalId: null,
    arenaPrincipalNome: '',
    objetivoAtual: null,
    medidas: {
      camiseta: '',
      regata: '',
      short: '',
      sunga: '',
      top: '',
      biquini: ''
    },
    ...sobrescritas
  };
}

function renderizarPagina() {
  return render(
    <MemoryRouter
      initialEntries={['/app/perfil?aba=perfil']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <PaginaMeuPerfil />
    </MemoryRouter>
  );
}

async function renderizarPerfilCarregado(atleta = criarAtleta()) {
  mocks.recarregarUsuario.mockResolvedValue({
    ...mocks.usuario,
    atletaId: atleta.id,
    perfil: PERFIS_USUARIO.atleta
  });
  atletasServico.obterMeu.mockResolvedValue(atleta);
  atletasServico.salvarMinhasMedidas.mockImplementation(async (dados) => dados);
  privacidadeServico.obterMinhasPreferencias.mockResolvedValue({});
  dashboardServico.obterDashboardAtleta.mockResolvedValue({
    resumo: {},
    perfil: { atletaId: atleta.id },
    ultimasPartidas: []
  });

  renderizarPagina();

  await screen.findByRole('heading', { name: /Tamanhos do atleta/i });
}

beforeEach(() => {
  mocks.usuario = {
    id: 'usuario-1',
    nome: 'Gustavo Drager',
    email: 'gustavo@example.com',
    atletaId: 'atleta-1',
    perfil: PERFIS_USUARIO.atleta
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PaginaMeuPerfil - medidas e uniformes', () => {
  it('mantem campos basicos habilitados sem sexo/genero e mostra mensagem nao bloqueante', async () => {
    await renderizarPerfilCarregado();

    expect(screen.getByLabelText('Camiseta')).toBeEnabled();
    expect(screen.getByLabelText('Regata')).toBeEnabled();
    expect(screen.getByLabelText('Short')).toBeEnabled();
    expect(screen.getByText(/Você pode informar os tamanhos básicos agora/i)).toBeInTheDocument();
    expect(screen.queryByText(/Informe o sexo\/gênero no perfil do atleta para exibir/i)).not.toBeInTheDocument();
  });

  it('mantem o botao salvar medidas desabilitado enquanto nao houver alteracao', async () => {
    await renderizarPerfilCarregado();

    expect(screen.getByRole('button', { name: /Salvar medidas/i })).toBeDisabled();
  });

  it.each([
    ['Camiseta', 'M'],
    ['Regata', 'G'],
    ['Short', '42']
  ])('habilita o botao ao alterar %s', async (label, valor) => {
    const usuario = userEvent.setup();
    await renderizarPerfilCarregado();

    await usuario.selectOptions(screen.getByLabelText(label), valor);

    expect(screen.getByRole('button', { name: /Salvar medidas/i })).toBeEnabled();
  });

  it('salva medidas basicas sem exigir sexo/genero', async () => {
    const usuario = userEvent.setup();
    await renderizarPerfilCarregado();

    await usuario.selectOptions(screen.getByLabelText('Camiseta'), 'M');
    await usuario.click(screen.getByRole('button', { name: /Salvar medidas/i }));

    await waitFor(() => {
      expect(atletasServico.salvarMinhasMedidas).toHaveBeenCalledWith({
        camiseta: 'M',
        regata: null,
        short: null,
        sunga: null,
        top: null,
        biquini: null
      });
    });
    expect(mocks.showNotification).toHaveBeenCalledWith(expect.objectContaining({
      type: 'success',
      title: 'Medidas salvas'
    }));
  });
});
