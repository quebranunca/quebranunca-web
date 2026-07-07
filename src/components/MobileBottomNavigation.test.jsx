import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MobileBottomNavigation } from './MobileBottomNavigation';

afterEach(() => {
  cleanup();
});

function renderizar(rota = '/app') {
  return render(
    <MemoryRouter initialEntries={[rota]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <MobileBottomNavigation />
    </MemoryRouter>
  );
}

describe('MobileBottomNavigation', () => {
  it('renderiza o menu inferior oficial com cinco itens principais', () => {
    renderizar();

    const nav = screen.getByRole('navigation', { name: /Navegação principal/i });

    expect(nav).toHaveTextContent('Home');
    expect(nav).toHaveTextContent('Partidas');
    expect(nav).toHaveTextContent('Grupos');
    expect(nav).toHaveTextContent('Ranking');
    expect(nav).toHaveTextContent('Mais');
    expect(nav).not.toHaveTextContent('Perfil');
    expect(nav).not.toHaveTextContent('Registrar');
    expect(nav).not.toHaveTextContent('Scouts');
    expect(screen.getByRole('link', { name: /Home/i })).toHaveAttribute('href', '/app');
    expect(screen.getByRole('link', { name: /Partidas/i })).toHaveAttribute('href', '/minhas-partidas');
    expect(screen.getByRole('link', { name: /Mais/i })).toHaveAttribute('href', '/mais');
  });

  it('destaca Partidas quando a rota atual pertence ao fluxo de partidas', () => {
    renderizar('/partidas/registrar');

    expect(screen.getByRole('link', { name: /Partidas/i })).toHaveClass('ativo');
    expect(screen.getByRole('link', { name: /Home/i })).not.toHaveClass('ativo');
  });
});
