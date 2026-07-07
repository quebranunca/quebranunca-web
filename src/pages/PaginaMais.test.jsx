import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { PaginaMais } from './PaginaMais';
import { ESTADOS_ACESSO } from '../utils/acesso';
import { PERFIS_USUARIO } from '../utils/perfis';

const mocks = vi.hoisted(() => ({
  sair: vi.fn(),
  obterResumo: vi.fn(),
  usuario: {
    id: 'usuario-1',
    nome: 'Primo QN',
    perfil: 3
  },
  estadoAcesso: 'ativo'
}));

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    usuario: mocks.usuario,
    estadoAcesso: mocks.estadoAcesso,
    sair: mocks.sair
  })
}));

vi.mock('../services/pendenciasServico', () => ({
  pendenciasServico: {
    obterResumo: mocks.obterResumo
  }
}));

function LocalizacaoAtual() {
  const location = useLocation();
  return <span data-testid="rota-atual">{location.pathname}</span>;
}

function renderizarPagina() {
  return render(
    <MemoryRouter
      initialEntries={['/mais']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route
          path="/mais"
          element={(
            <>
              <PaginaMais />
              <LocalizacaoAtual />
            </>
          )}
        />
        <Route path="/" element={<LocalizacaoAtual />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  mocks.usuario = {
    id: 'usuario-1',
    nome: 'Primo QN',
    perfil: PERFIS_USUARIO.atleta
  };
  mocks.estadoAcesso = ESTADOS_ACESSO.ativo;
  mocks.sair.mockReset();
  mocks.obterResumo.mockReset();
  mocks.obterResumo.mockResolvedValue({ total: 2 });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PaginaMais', () => {
  it('renderiza o hub com seções e rotas seguras', async () => {
    renderizarPagina();

    expect(screen.getByRole('heading', { name: 'Mais' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Minha área' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Jogo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'QuebraNunca' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Suporte' })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Meu perfil/i })).toHaveAttribute('href', '/app/perfil');
    expect(screen.getByRole('link', { name: /Histórico/i })).toHaveAttribute('href', '/minhas-partidas');
    expect(screen.getByRole('link', { name: /Pontos QN/i })).toHaveAttribute('href', '/app/pontos-qn');
    expect(screen.getByRole('link', { name: /Configurações/i })).toHaveAttribute('href', '/app/perfil?aba=configuracoes');

    expect(screen.getByRole('button', { name: /Minhas duplas/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Loja/i })).toBeDisabled();
    expect(screen.getAllByText('Em breve').length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    });
  });

  it('mantém administração oculta para atleta comum e exibe para administrador ativo', () => {
    const { rerender } = renderizarPagina();

    expect(screen.queryByRole('link', { name: /Administração/i })).not.toBeInTheDocument();

    mocks.usuario = {
      id: 'admin-1',
      nome: 'Admin QN',
      perfil: PERFIS_USUARIO.administrador
    };

    rerender(
      <MemoryRouter
        initialEntries={['/mais']}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <Routes>
          <Route path="/mais" element={<PaginaMais />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Administração/i })).toHaveAttribute('href', '/admin');
  });

  it('encerra sessão pelo item Sair', async () => {
    const usuario = userEvent.setup();
    renderizarPagina();

    const suporte = screen.getByRole('heading', { name: 'Suporte' }).closest('section');
    expect(suporte).not.toBeNull();

    await usuario.click(within(suporte).getByRole('button', { name: /Sair/i }));

    expect(mocks.sair).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/');
  });
});
