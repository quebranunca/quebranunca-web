import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { PaginaGrupos } from './PaginaGrupos';
import { gruposServico } from '../services/gruposServico';

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    token: 'token-teste',
    usuario: {
      id: 'usuario-1',
      nome: 'Primo',
      atletaId: 'atleta-1',
      perfil: 3
    },
    estadoAcesso: 'Ativo'
  })
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: vi.fn(),
    closeNotification: vi.fn()
  })
}));

vi.mock('../services/gruposServico', () => ({
  gruposServico: {
    obterDashboard: vi.fn(),
    obterPorId: vi.fn(),
    atualizar: vi.fn(),
    atualizarImagem: vi.fn(),
    removerImagem: vi.fn(),
    criar: vi.fn(),
    remover: vi.fn()
  }
}));

function LocalizacaoAtual() {
  const location = useLocation();
  return <span data-testid="rota-atual">{location.pathname}</span>;
}

function renderizarPagina() {
  return render(
    <MemoryRouter
      initialEntries={['/grupos']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <PaginaGrupos />
      <LocalizacaoAtual />
    </MemoryRouter>
  );
}

function criarGrupo(sobrescritas = {}) {
  return {
    grupoId: sobrescritas.grupoId || sobrescritas.id || 'grupo-1',
    nome: 'Fechadinho De Quinta',
    imagemUrl: '',
    privacidade: 'Privado',
    usuarioOrganizadorId: 'usuario-1',
    quantidadeAtletas: 8,
    quantidadePartidas: 11,
    pendencias: 2,
    ultimaAtividade: '2026-07-04T11:00:00Z',
    rankingTop3: [],
    ...sobrescritas
  };
}

function configurarDashboard(grupos) {
  gruposServico.obterDashboard.mockResolvedValue({
    totais: {
      quantidadeGrupos: grupos.length,
      quantidadeAtletas: 18,
      quantidadePartidas: 29,
      pendenciasGrupos: 2
    },
    grupos
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PaginaGrupos - home de grupos', () => {
  it('destaca grupo principal e não mostra grupo técnico de partida avulsa', async () => {
    configurarDashboard([
      criarGrupo({
        grupoId: 'geral',
        nome: 'Geral',
        quantidadeAtletas: 99,
        quantidadePartidas: 99,
        ultimaAtividade: '2026-07-05T11:00:00Z'
      }),
      criarGrupo({
        grupoId: 'grupo-principal',
        nome: 'Fechadinho De Quinta',
        ultimoAcessoEm: '2026-07-03T10:00:00Z'
      }),
      criarGrupo({
        grupoId: 'grupo-2',
        nome: 'Beach Friends',
        privacidade: 'Público',
        quantidadeAtletas: 6,
        quantidadePartidas: 18,
        pendencias: 0,
        ultimaAtividade: '2026-07-05T09:00:00Z'
      })
    ]);

    renderizarPagina();

    expect(await screen.findByRole('heading', { name: 'Grupos' })).toBeInTheDocument();
    expect(screen.getByText('Sua comunidade de partidas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Novo grupo/i })).toBeInTheDocument();

    const principal = await screen.findByRole('button', { name: /Abrir grupo Fechadinho De Quinta/i });
    expect(within(principal).getByText('Fechadinho De Quinta')).toBeInTheDocument();
    expect(within(principal).getByText('Privado')).toBeInTheDocument();
    expect(within(principal).getByText('8')).toBeInTheDocument();
    expect(within(principal).getByText('11')).toBeInTheDocument();
    expect(within(principal).getByText('2')).toBeInTheDocument();
    expect(within(principal).getByText('Abrir grupo')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Meus grupos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Abrir grupo Beach Friends/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ações rápidas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Criar grupo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Explorar grupos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Convites/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Atividade recente' })).toBeInTheDocument();

    expect(screen.queryByText('Geral')).not.toBeInTheDocument();
    expect(screen.queryByText('Partidas avulsas')).not.toBeInTheDocument();
  });

  it('abre o grupo pelo card inteiro', async () => {
    const usuario = userEvent.setup();
    configurarDashboard([
      criarGrupo({
        grupoId: 'grupo-principal',
        nome: 'Fechadinho De Quinta'
      })
    ]);

    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: /Abrir grupo Fechadinho De Quinta/i }));

    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/grupos/grupo-principal');
  });

  it('trata estado sem grupos reais quando só existe grupo técnico', async () => {
    configurarDashboard([
      criarGrupo({
        grupoId: 'geral',
        nome: 'Geral',
        quantidadeAtletas: 0,
        quantidadePartidas: 0,
        pendencias: 0
      })
    ]);

    renderizarPagina();

    expect(await screen.findByText('Crie seu primeiro grupo')).toBeInTheDocument();
    expect(screen.getByText(/Organize sua turma/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ações rápidas' })).toBeInTheDocument();
    expect(screen.getByText('Nenhuma atividade recente')).toBeInTheDocument();
    expect(screen.queryByText('Geral')).not.toBeInTheDocument();
    expect(screen.queryByText('Partidas avulsas')).not.toBeInTheDocument();
  });
});
