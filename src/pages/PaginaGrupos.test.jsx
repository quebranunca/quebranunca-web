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
    verificarNome: vi.fn(),
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

function configurarDashboard(grupos, extras = {}) {
  gruposServico.obterDashboard.mockResolvedValue({
    ...extras,
    totais: {
      quantidadeGrupos: grupos.length,
      quantidadeAtletas: 18,
      quantidadePartidas: 29,
      pendenciasGrupos: 2,
      ...(extras.totais || {})
    },
    grupos,
    gruposPublicos: extras.gruposPublicos || []
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
    expect(screen.getAllByRole('button', { name: 'Criar grupo' })).toHaveLength(1);

    const principal = await screen.findByRole('button', { name: /Abrir grupo Fechadinho De Quinta/i });
    expect(within(principal).getByText('Fechadinho De Quinta')).toBeInTheDocument();
    expect(within(principal).getByText('Privado')).toBeInTheDocument();
    expect(within(principal).getByText('8')).toBeInTheDocument();
    expect(within(principal).getByText('11')).toBeInTheDocument();
    expect(within(principal).getByText('2')).toBeInTheDocument();
    expect(within(principal).getByText('Abrir grupo')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Meus grupos' })).toBeInTheDocument();
    const beachCard = screen.getByRole('button', { name: /Abrir grupo Beach Friends/i });
    expect(beachCard).toBeInTheDocument();
    expect(within(beachCard).getByText('B')).toBeInTheDocument();
    expect(within(beachCard).queryByText('BF')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ações rápidas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Explorar públicos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Convites/i })).not.toBeInTheDocument();
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
    expect(screen.queryByRole('heading', { name: 'Meus grupos' })).not.toBeInTheDocument();
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

    expect(await screen.findByRole('button', { name: 'Criar grupo' })).toBeInTheDocument();
    expect(screen.getByText('Você ainda não participa de nenhum grupo.')).toBeInTheDocument();
    expect(screen.getByText(/Crie seu primeiro grupo para registrar partidas/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Seu grupo principal' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Meus grupos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ações rápidas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Explorar públicos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Convites/i })).not.toBeInTheDocument();
    expect(screen.getByText('Nenhuma atividade recente')).toBeInTheDocument();
    expect(screen.queryByText('Geral')).not.toBeInTheDocument();
    expect(screen.queryByText('Partidas avulsas')).not.toBeInTheDocument();
  });

  it('não renderiza explorar públicos mesmo quando a API retorna grupos públicos', async () => {
    configurarDashboard([
      criarGrupo({
        grupoId: 'grupo-principal',
        nome: 'Fechadinho De Quinta'
      })
    ], {
      gruposPublicos: [
        criarGrupo({
          grupoId: 'publico-1',
          nome: 'Arena Forte',
          privacidade: 'Publico',
          descricao: 'Grupo focado em diversão e partidas no fim de semana.',
          quantidadeAtletas: 12,
          quantidadePartidas: 32,
          pendencias: 0
        })
      ]
    });

    renderizarPagina();

    await screen.findByRole('button', { name: /Abrir grupo Fechadinho De Quinta/i });

    expect(screen.queryByRole('heading', { name: 'Explorar públicos' })).not.toBeInTheDocument();
    expect(screen.queryByText('Arena Forte')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument();
  });

  it('cria grupo pelo wizard e abre o grupo criado automaticamente', async () => {
    const usuario = userEvent.setup();
    configurarDashboard([]);
    gruposServico.verificarNome.mockResolvedValue({ similares: [] });
    gruposServico.criar.mockResolvedValue({
      id: 'grupo-novo',
      nome: 'Fechadinho de Quinta',
      privacidade: 'Público'
    });

    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: 'Criar grupo' }));

    expect(screen.getByRole('dialog', { name: /Criar grupo/i })).toBeInTheDocument();
    expect(screen.getByText('Como seu grupo se chama?')).toBeInTheDocument();

    await usuario.type(screen.getByLabelText(/Nome do grupo/i), 'Fechadinho de Quinta');
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText('Quem poderá encontrar este grupo?')).toBeInTheDocument();
    const modal = screen.getByRole('dialog', { name: /Criar grupo/i });
    await usuario.click(within(modal).getByRole('button', { name: /Público/i }));
    await usuario.click(within(modal).getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText('Escolha uma imagem para seu grupo')).toBeInTheDocument();
    await usuario.click(within(modal).getByRole('button', { name: 'Pular' }));

    expect(await screen.findByText('Confirme as informações')).toBeInTheDocument();
    await usuario.click(within(modal).getByRole('button', { name: 'Criar grupo' }));

    expect(await screen.findByTestId('rota-atual')).toHaveTextContent('/grupos/grupo-novo');
    expect(gruposServico.verificarNome).toHaveBeenCalledWith('Fechadinho de Quinta');
    expect(gruposServico.criar).toHaveBeenCalledWith(expect.objectContaining({
      nome: 'Fechadinho de Quinta',
      privacidade: 'Público',
      localPrincipal: null,
      diasDaSemana: []
    }));
  });
});
