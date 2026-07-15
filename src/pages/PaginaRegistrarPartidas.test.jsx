import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { PaginaRegistrarPartidas } from './PaginaRegistrarPartidas1';

const mocks = vi.hoisted(() => ({
  ultimaPropsContainer: null,
  obterResumoPendencias: vi.fn()
}));

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    usuario: {
      id: 'usuario-1',
      nome: 'Primo',
      atletaId: 'atleta-1',
      perfil: 3
    }
  })
}));

vi.mock('../services/pendenciasServico', () => ({
  EVENTO_PENDENCIAS_ATUALIZADAS: 'pendencias-atualizadas',
  pendenciasServico: {
    obterResumo: mocks.obterResumoPendencias
  }
}));

vi.mock('../containers/partidas/RegistrarPartidaNovoContainer', () => ({
  RegistrarPartidaNovoContainer: (props) => {
    mocks.ultimaPropsContainer = props;
    return (
      <section
        data-testid="registrar-container"
        data-modo-exibicao={props.modoExibicao}
        aria-label="Formulário de registro"
      >
        <button type="button" onClick={props.onFechar}>Cancelar</button>
      </section>
    );
  }
}));

function LocalizacaoAtual() {
  const location = useLocation();
  return <span data-testid="rota-atual">{`${location.pathname}${location.search}`}</span>;
}

function renderizarPagina(initialEntry = '/partidas/registrar') {
  const entry = typeof initialEntry === 'string' ? initialEntry : initialEntry;

  return render(
    <MemoryRouter
      initialEntries={[entry]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route
          path="/partidas/registrar"
          element={(
            <>
              <PaginaRegistrarPartidas />
              <LocalizacaoAtual />
            </>
          )}
        />
        <Route path="/app" element={<LocalizacaoAtual />} />
        <Route path="/minhas-partidas" element={<LocalizacaoAtual />} />
        <Route path="/grupos/:grupoId" element={<LocalizacaoAtual />} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.ultimaPropsContainer = null;
});

describe('PaginaRegistrarPartidas', () => {
  it('renderiza página real com título e container em modo página', () => {
    renderizarPagina();

    expect(screen.getByRole('heading', { name: 'Registrar partida' })).toBeInTheDocument();
    expect(screen.getByTestId('registrar-container')).toHaveAttribute('data-modo-exibicao', 'pagina');
    expect(screen.queryByRole('dialog', { name: /Registrar partida/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('registrar-container')).not.toHaveAttribute('aria-modal');
  });

  it('preserva contexto de grupo recebido pela URL e volta para o grupo', async () => {
    const usuario = userEvent.setup();
    renderizarPagina('/partidas/registrar?grupoId=grupo-1');

    expect(mocks.ultimaPropsContainer.contextoInicial).toMatchObject({ grupoId: 'grupo-1' });

    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/grupos/grupo-1');
  });

  it('volta para origem interna recebida por location.state', async () => {
    const usuario = userEvent.setup();
    renderizarPagina({
      pathname: '/partidas/registrar',
      state: {
        origem: {
          pathname: '/minhas-partidas',
          search: '?filtro=registradas'
        }
      }
    });

    await usuario.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/minhas-partidas?filtro=registradas');
  });

  it('ignora origem externa e usa fallback seguro para Home', async () => {
    const usuario = userEvent.setup();
    renderizarPagina({
      pathname: '/partidas/registrar',
      state: {
        origem: 'https://example.com/externo'
      }
    });

    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/app');
  });
});
