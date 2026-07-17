import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

vi.mock('../services/gruposServico', () => ({
  gruposServico: {
    obterDashboardGrupo: vi.fn(),
    remover: vi.fn()
  }
}));

vi.mock('../services/pendenciasServico', () => ({
  pendenciasServico: {
    listar: vi.fn()
  }
}));

function LocalizacaoAtual() {
  const location = useLocation();
  return (
    <>
      <span data-testid="rota-atual">{`${location.pathname}${location.search}`}</span>
      <span data-testid="origem-atual">{location.state?.origem || ''}</span>
    </>
  );
}

function criarDashboard(sobrescritasGrupo = {}, sobrescritasResumo = {}) {
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
      podeExcluir: true,
      ehCriador: true,
      ehAdministrador: false,
      ...sobrescritasGrupo
    },
    resumo: {
      totalMembros: 4,
      totalPartidas: 2,
      totalAtletasAtivos: 4,
      totalPartidasSemPlacar: 0,
      ultimaPartidaEm: '2026-07-01T12:00:00Z',
      ...sobrescritasResumo
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
        <Route path="/grupos" element={<LocalizacaoAtual />} />
        <Route path="/grupos/:grupoId" element={<><PaginaGrupoDashboard /><LocalizacaoAtual /></>} />
        <Route path="/grupos/:grupoId/configuracoes" element={<LocalizacaoAtual />} />
        <Route path="/partidas/registrar" element={<LocalizacaoAtual />} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PaginaGrupoDashboard', () => {
  it('mostra ações compactas e ações administrativas no menu do topo', async () => {
    gruposServico.obterDashboardGrupo.mockResolvedValue(criarDashboard());
    pendenciasServico.listar.mockResolvedValue([]);

    renderizarPagina();

    expect(await screen.findByRole('heading', { name: 'Serie C' })).toBeInTheDocument();
    const acoesGrupo = screen.getByRole('region', { name: 'Ações do grupo' });
    expect(within(acoesGrupo).getByRole('button', { name: /^Membros$/i })).toBeInTheDocument();
    expect(within(acoesGrupo).getByRole('button', { name: /^Ranking/i })).toBeInTheDocument();
    expect(screen.queryByText(/Convidar atleta/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Compartilhar grupo/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ações do grupo' }));

    expect(screen.getByRole('menuitem', { name: /Editar grupo/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Gerenciar membros/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Registrar partida/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Excluir grupo/i })).toBeInTheDocument();
  });

  it('leva Editar grupo para a rota de configurações', async () => {
    const usuario = userEvent.setup();
    gruposServico.obterDashboardGrupo.mockResolvedValue(criarDashboard());
    pendenciasServico.listar.mockResolvedValue([]);

    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: 'Ações do grupo' }));
    await usuario.click(screen.getByRole('menuitem', { name: /Editar grupo/i }));

    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/grupos/grupo-1/configuracoes');
  });

  it('não mostra menu administrativo para grupo sem permissão de edição', async () => {
    gruposServico.obterDashboardGrupo.mockResolvedValue(criarDashboard({ podeEditar: false, podeExcluir: false, podeRegistrarPartida: false }));
    pendenciasServico.listar.mockResolvedValue([]);

    renderizarPagina();

    await waitFor(() => expect(screen.queryByText('Carregando dashboard do grupo...')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Ações do grupo' })).not.toBeInTheDocument();
  });

  it('leva Registrar partida para a página com grupo e origem preservados', async () => {
    const usuario = userEvent.setup();
    gruposServico.obterDashboardGrupo.mockResolvedValue(criarDashboard());
    pendenciasServico.listar.mockResolvedValue([]);

    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: /Registrar partida/i }));

    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/partidas/registrar?grupoId=grupo-1');
    expect(screen.getByTestId('origem-atual')).toHaveTextContent('/grupos/grupo-1');
    expect(screen.queryByRole('dialog', { name: /Registrar partida/i })).not.toBeInTheDocument();
  });

  it('não exibe registro nem ações administrativas para usuário fora de grupo público', async () => {
    gruposServico.obterDashboardGrupo.mockResolvedValue(criarDashboard({
      publico: true,
      privacidade: 'Público',
      podeEditar: false,
      podeExcluir: false,
      pertenceAoGrupo: false,
      podeRegistrarPartida: false
    }));
    pendenciasServico.listar.mockResolvedValue([]);

    renderizarPagina();

    expect(await screen.findByRole('heading', { name: 'Serie C' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Registrar partida/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ações do grupo' })).not.toBeInTheDocument();
  });

  it('confirma exclusão pelo menu administrativo', async () => {
    const usuario = userEvent.setup();
    gruposServico.obterDashboardGrupo.mockResolvedValue(criarDashboard());
    gruposServico.remover.mockResolvedValue();
    pendenciasServico.listar.mockResolvedValue([]);

    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: 'Ações do grupo' }));
    await usuario.click(screen.getByRole('menuitem', { name: /Excluir grupo/i }));

    expect(screen.getByRole('dialog', { name: 'Excluir grupo?' })).toBeInTheDocument();
    expect(screen.getByText('Esta ação removerá o grupo.')).toBeInTheDocument();
    expect(screen.getByText('As partidas, histórico, rankings e scouts continuarão preservados.')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /^Excluir grupo$/i }));

    await waitFor(() => expect(gruposServico.remover).toHaveBeenCalledWith('grupo-1'));
    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/grupos');
  });

  it('oculta blocos esportivos no grupo sem partidas', async () => {
    gruposServico.obterDashboardGrupo.mockResolvedValue(criarDashboard({
      totalPartidas: 0
    }, {
      totalPartidas: 0,
      ultimaPartidaEm: null
    }));
    pendenciasServico.listar.mockResolvedValue([]);

    renderizarPagina();

    expect(await screen.findByRole('heading', { name: 'Serie C' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Grupo pronto para receber partidas/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Top 3 do grupo/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Dupla do momento$/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Últimas partidas/i })).not.toBeInTheDocument();
  });
});
