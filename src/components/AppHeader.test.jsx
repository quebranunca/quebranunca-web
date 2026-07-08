import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppHeader } from './AppHeader';

vi.mock('./NotificacoesBotao', () => ({
  NotificacoesBotao: () => (
    <button type="button" aria-label="Abrir pendências">
      Sino
    </button>
  )
}));

const usuarioPadrao = {
  id: 'usuario-1',
  nome: 'Primo QN',
  apelido: 'Primo',
  nivelNome: 'Bronze',
  perfil: 3
};

function renderizarHeader(rota = '/app', props = {}) {
  const aoSair = props.aoSair ?? vi.fn();

  render(
    <MemoryRouter
      initialEntries={[rota]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <AppHeader
        autenticado
        usuario={usuarioPadrao}
        mostrarNotificacoes
        aoSair={aoSair}
        {...props}
      />
    </MemoryRouter>
  );

  return { aoSair };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AppHeader', () => {
  it('mostra topo principal com saudacao, apelido, sino e avatar sem botão voltar', () => {
    renderizarHeader('/app');

    expect(screen.getByRole('heading', { name: /Bom dia|Boa tarde|Boa noite/i })).toHaveTextContent(/Primo/i);
    expect(screen.getByText('Primo • Bronze')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Home' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Abrir pendências/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Abrir menu da conta/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Voltar/i })).not.toBeInTheDocument();
  });

  it('abre e fecha o menu rápido de conta pelo avatar', async () => {
    const usuario = userEvent.setup();
    renderizarHeader('/app');

    await usuario.click(screen.getByRole('button', { name: /Abrir menu da conta/i }));

    expect(screen.getByRole('navigation', { name: /Menu da conta/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Meu perfil/i })).toHaveAttribute('href', '/app/perfil');
    expect(screen.getByRole('link', { name: /Configurações/i })).toHaveAttribute('href', '/app/perfil?aba=configuracoes');
    expect(screen.getByRole('button', { name: /Sair/i })).toBeInTheDocument();

    await usuario.keyboard('{Escape}');

    expect(screen.queryByRole('navigation', { name: /Menu da conta/i })).not.toBeInTheDocument();
  });

  it('aciona saída pelo menu de conta', async () => {
    const usuario = userEvent.setup();
    const aoSair = vi.fn();
    renderizarHeader('/app', { aoSair });

    await usuario.click(screen.getByRole('button', { name: /Abrir menu da conta/i }));
    await usuario.click(screen.getByRole('button', { name: /Sair/i }));

    expect(aoSair).toHaveBeenCalledTimes(1);
  });

  it('mostra voltar em tela interna e mantém avatar no topo', () => {
    renderizarHeader('/grupos/grupo-1');

    expect(screen.getByRole('heading', { name: 'Grupo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Voltar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Abrir menu da conta/i })).toBeInTheDocument();
  });
});
