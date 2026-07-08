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
    expect(nav).toHaveTextContent('Rankings');
    expect(nav).toHaveTextContent('Registrar');
    expect(nav).toHaveTextContent('Grupos');
    expect(nav).toHaveTextContent('Mais');
    expect(nav).not.toHaveTextContent('Perfil');
    expect(nav).not.toHaveTextContent('Scouts');
    expect(screen.getByRole('link', { name: /Home/i })).toHaveAttribute('href', '/app');
    expect(screen.getByRole('link', { name: /Rankings/i })).toHaveAttribute('href', '/ranking');
    expect(screen.getByRole('link', { name: /Registrar partida/i })).toHaveAttribute('href', '/partidas/registrar');
    expect(screen.getByRole('link', { name: /Registrar partida/i })).toHaveClass('principal');
    expect(screen.getByRole('link', { name: /Mais/i })).toHaveAttribute('href', '/mais');
  });

  it('destaca Registrar quando a rota atual pertence ao fluxo de registro de partida', () => {
    renderizar('/partidas/registrar');

    expect(screen.getByRole('link', { name: /Registrar partida/i })).toHaveClass('ativo');
    expect(screen.getByRole('link', { name: /Home/i })).not.toHaveClass('ativo');
  });
});
