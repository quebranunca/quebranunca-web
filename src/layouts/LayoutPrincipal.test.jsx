import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppHero } from '../components/AppHero';
import { LayoutPrincipal, paginaRenderizaHeroProprio } from './LayoutPrincipal';

const usuarioAutenticado = {
  id: 'usuario-1',
  nome: 'Gustavo',
  apelido: 'Primo',
  atletaId: 'atleta-1',
  perfil: 3
};

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    token: 'token-teste',
    usuario: usuarioAutenticado,
    sair: vi.fn()
  })
}));

vi.mock('../components/AppHeader', () => ({
  AppHeader: () => (
    <header data-testid="global-app-header">
      <h1>Home</h1>
      <button type="button" aria-label="Voltar">Voltar</button>
      <button type="button" aria-label="Abrir pendências">Sino global</button>
      <button type="button" aria-label="Abrir menu da conta">Avatar global</button>
    </header>
  )
}));

vi.mock('../components/NotificacoesBotao', () => ({
  NotificacoesBotao: () => (
    <button type="button" aria-label="Abrir pendências">
      Sino
    </button>
  )
}));

vi.mock('../components/MobileBottomNavigation', () => ({
  MobileBottomNavigation: () => <nav aria-label="Menu inferior">Bottom navigation</nav>
}));

vi.mock('../components/public/PublicHeader', () => ({
  PublicHeader: () => <header data-testid="public-header">Header público</header>
}));

vi.mock('../components/public/PublicFooter', () => ({
  PublicFooter: () => <footer data-testid="public-footer">Footer público</footer>
}));

function HomeHeroTeste() {
  return (
    <AppHero
      variant="home"
      subtitle="Boa noite,"
      title="Gustavo"
      accountUser={usuarioAutenticado}
      autenticado
      showNotifications
      showBackButton={false}
      testId="home-dashboard-hero"
    />
  );
}

function renderizarLayout(rota = '/app') {
  return render(
    <MemoryRouter
      initialEntries={[rota]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route element={<LayoutPrincipal />}>
          <Route path="/" element={<HomeHeroTeste />} />
          <Route
            path="/app"
            element={<HomeHeroTeste />}
          />
          <Route
            path="/ranking"
            element={(
              <AppHero
                variant="page"
                title="Rankings"
                subtitle="Veja sua evolução."
                accountUser={usuarioAutenticado}
                autenticado
                showNotifications
                showBackButton
                testId="ranking-hero"
              />
            )}
          />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LayoutPrincipal com AppHero proprio da pagina', () => {
  it.each(['/app', '/'])(
    'na Home autenticada em %s renderiza apenas o hero da pagina, sem header global, titulo Home ou voltar',
    (rota) => {
      const { container } = renderizarLayout(rota);
      const hero = screen.getByTestId('home-dashboard-hero');

      expect(screen.queryByTestId('global-app-header')).not.toBeInTheDocument();
      expect(container.querySelectorAll('.app-hero')).toHaveLength(1);
      expect(within(hero).getByRole('heading', { name: 'Gustavo' })).toBeInTheDocument();
      expect(within(hero).queryByRole('heading', { name: 'Home' })).not.toBeInTheDocument();
      expect(within(hero).queryByRole('button', { name: /Voltar/i })).not.toBeInTheDocument();
      expect(within(hero).getAllByRole('button', { name: /Abrir pendências/i })).toHaveLength(1);
      expect(within(hero).getAllByRole('button', { name: /Abrir menu da conta/i })).toHaveLength(1);
    }
  );

  it('na Home autenticada em /app/ normaliza a rota e nao renderiza header global', () => {
    const { container } = renderizarLayout('/app/');
    const hero = screen.getByTestId('home-dashboard-hero');

    expect(screen.queryByTestId('global-app-header')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.app-hero')).toHaveLength(1);
    expect(within(hero).getByRole('heading', { name: 'Gustavo' })).toBeInTheDocument();
    expect(within(hero).queryByRole('heading', { name: 'Home' })).not.toBeInTheDocument();
    expect(within(hero).queryByRole('button', { name: /Voltar/i })).not.toBeInTheDocument();
    expect(within(hero).getAllByRole('button', { name: /Abrir pendências/i })).toHaveLength(1);
    expect(within(hero).getAllByRole('button', { name: /Abrir menu da conta/i })).toHaveLength(1);
  });

  it('em pagina interna renderiza apenas o hero compacto com voltar e titulo uma vez', () => {
    const { container } = renderizarLayout('/ranking');
    const hero = screen.getByTestId('ranking-hero');

    expect(screen.queryByTestId('global-app-header')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.app-hero')).toHaveLength(1);
    expect(within(hero).getByRole('button', { name: /Voltar/i })).toBeInTheDocument();
    expect(within(hero).getAllByRole('heading', { name: 'Rankings' })).toHaveLength(1);
    expect(within(hero).getByText('Veja sua evolução.')).toBeInTheDocument();
  });

  it('normaliza rotas com barra final para manter um unico ponto de renderizacao', () => {
    expect(paginaRenderizaHeroProprio('/')).toBe(true);
    expect(paginaRenderizaHeroProprio('/app/')).toBe(true);
    expect(paginaRenderizaHeroProprio('/ranking/')).toBe(true);
    expect(paginaRenderizaHeroProprio('/app/partidas/partida-1/')).toBe(true);
  });
});
