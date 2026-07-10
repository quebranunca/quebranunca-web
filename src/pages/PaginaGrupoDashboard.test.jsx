import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { PaginaGrupoDashboard } from './PaginaGrupoDashboard';
import { gruposServico } from '../services/gruposServico';
import { pendenciasServico } from '../services/pendenciasServico';

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    token: 'token-teste',
    usuario: {
      id: 'usuario-1',
      nome: 'Primo',
      atletaId: 'atleta-1',
      perfil: 3
    }
  })
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: vi.fn()
  })
}));

vi.mock('../containers/partidas/RegistrarPartidaNovoContainer', () => ({
  RegistrarPartidaNovoContainer: () => <div data-testid="registrar-partida-modal" />
}));

vi.mock('../services/gruposServico', () => ({
  gruposServico: {
    obterDashboardGrupo: vi.fn()
  }
}));

vi.mock('../services/pendenciasServico', () => ({
  pendenciasServico: {
    listar: vi.fn()
  }
}));

function LocalizacaoAtual() {
  const location = useLocation();
  return <span data-testid="rota-atual">{location.pathname}</span>;
}

function criarDashboard(sobrescritasGrupo = {}) {
  return {
    grupo: {
      id: 'grupo-1',
      nome: 'Serie C',
      imagemUrl: '',
      publico: false,
      privacidade: 'Privado',
      totalMembros: 4,
      totalPartidas: 2,
      ultimaPartidaEm: '2026-07-01T12:00:00Z',
      podeEditar: true,
      pertenceAoGrupo: true,
      podeRegistrarPartida: true,
      ...sobrescritasGrupo
    },
    resumo: {
      totalMembros: 4,
      totalPartidas: 2,
      totalAtletasAtivos: 4,
      totalPartidasSemPlacar: 0,
      ultimaPartidaEm: '2026-07-01T12:00:00Z'
    },
    ranking: [],
    ultimasPartidas: [],
    membrosMaisAtivos: []
  };
}

function renderizarPagina() {
  return render(
    <MemoryRouter
      initialEntries={['/grupos/grupo-1']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route path="/grupos/:grupoId" element={<><PaginaGrupoDashboard /><LocalizacaoAtual /></>} />
        <Route path="/grupos/:grupoId/configuracoes" element={<LocalizacaoAtual />} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PaginaGrupoDashboard', () => {
  it('mostra ações compactas e remove convite/compartilhamento da tela principal', async () => {
    gruposServico.obterDashboardGrupo.mockResolvedValue(criarDashboard());
    pendenciasServico.listar.mockResolvedValue([]);

    renderizarPagina();

    expect(await screen.findByRole('heading', { name: 'Serie C' })).toBeInTheDocument();
    const acoesGrupo = screen.getByRole('region', { name: 'Ações do grupo' });
    expect(within(acoesGrupo).getByRole('button', { name: /^Membros$/i })).toBeInTheDocument();
    expect(within(acoesGrupo).getByRole('button', { name: /^Ranking/i })).toBeInTheDocument();
    expect(within(acoesGrupo).getByRole('button', { name: /Configurações/i })).toBeInTheDocument();
    expect(screen.queryByText(/Convidar atleta/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Compartilhar grupo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Editar grupo/i)).not.toBeInTheDocument();
  });

  it('leva Configurações para a rota correta', async () => {
    const usuario = userEvent.setup();
    gruposServico.obterDashboardGrupo.mockResolvedValue(criarDashboard());
    pendenciasServico.listar.mockResolvedValue([]);

    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: /Configurações/i }));

    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/grupos/grupo-1/configuracoes');
  });

  it('não mostra Configurações para grupo sem permissão de edição', async () => {
    gruposServico.obterDashboardGrupo.mockResolvedValue(criarDashboard({ podeEditar: false }));
    pendenciasServico.listar.mockResolvedValue([]);

    renderizarPagina();

    await waitFor(() => expect(screen.queryByText('Carregando dashboard do grupo...')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Configurações/i })).not.toBeInTheDocument();
  });

  it('exibe Registrar partida para usuário membro do grupo', async () => {
    const usuario = userEvent.setup();
    gruposServico.obterDashboardGrupo.mockResolvedValue(criarDashboard());
    pendenciasServico.listar.mockResolvedValue([]);

    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: /Registrar partida/i }));

    expect(screen.getByTestId('registrar-partida-modal')).toBeInTheDocument();
  });

  it('não exibe registro nem ações administrativas para usuário fora de grupo público', async () => {
    gruposServico.obterDashboardGrupo.mockResolvedValue(criarDashboard({
      publico: true,
      privacidade: 'Público',
      podeEditar: false,
      pertenceAoGrupo: false,
      podeRegistrarPartida: false
    }));
    pendenciasServico.listar.mockResolvedValue([]);

    renderizarPagina();

    expect(await screen.findByRole('heading', { name: 'Serie C' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Registrar partida/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Configurações/i })).not.toBeInTheDocument();
  });
});
