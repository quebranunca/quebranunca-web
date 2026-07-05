import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PaginaRanking } from './PaginaRanking';
import { competicoesServico } from '../services/competicoesServico';
import { gruposServico } from '../services/gruposServico';
import { rankingServico } from '../services/rankingServico';

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

vi.mock('../components/ranking/CompartilharRankingBotao', () => ({
  CompartilharRankingBotao: () => (
    <button type="button">Compartilhar</button>
  )
}));

vi.mock('../services/competicoesServico', () => ({
  competicoesServico: {
    listar: vi.fn()
  }
}));

vi.mock('../services/gruposServico', () => ({
  gruposServico: {
    listar: vi.fn()
  }
}));

vi.mock('../services/rankingServico', () => ({
  rankingServico: {
    listarRegioesDisponiveis: vi.fn(),
    listarAtletasGeral: vi.fn(),
    listarAtletasPorGrupo: vi.fn(),
    listarAtletasPorCompeticao: vi.fn(),
    listarAtletasPorRegiao: vi.fn()
  }
}));

function criarAtleta(posicao, nome, pontos, sobrescritas = {}) {
  return {
    posicao,
    atletaId: `atleta-${posicao}`,
    nomeAtleta: nome,
    apelidoAtleta: '',
    bairro: '',
    cidade: '',
    estado: '',
    lado: 1,
    possuiUsuarioVinculado: true,
    cadastroPendente: false,
    temEmail: true,
    statusPendencia: '',
    jogos: 10 - posicao,
    vitorias: Math.max(0, 7 - posicao),
    derrotas: Math.max(0, posicao - 1),
    empates: 0,
    pontos,
    pontosPendentes: 0,
    fotoPerfilUrl: '',
    partidas: [],
    ...sobrescritas
  };
}

function criarGrupoRanking(atletas) {
  return {
    categoriaId: 'categoria-1',
    competicaoId: 'competicao-geral',
    nomeCompeticao: 'Todas as competições',
    nomeCategoria: 'Ranking geral',
    genero: null,
    atletas
  };
}

function configurarBase({ atletas = atletasPadrao() } = {}) {
  competicoesServico.listar.mockResolvedValue([
    { id: 'competicao-1', nome: 'Circuito Verão', tipo: 1 },
    { id: 'competicao-grupo', nome: 'Grupo técnico', tipo: 3 }
  ]);
  gruposServico.listar.mockResolvedValue([
    { id: 'grupo-1', nome: 'Fechadinho de Quinta' }
  ]);
  rankingServico.listarRegioesDisponiveis.mockResolvedValue({
    estados: ['SP'],
    cidades: [{ estado: 'SP', cidade: 'Santos' }],
    bairros: [{ estado: 'SP', cidade: 'Santos', bairro: 'Gonzaga' }]
  });
  rankingServico.listarAtletasGeral.mockResolvedValue([criarGrupoRanking(atletas)]);
  rankingServico.listarAtletasPorGrupo.mockResolvedValue([
    {
      ...criarGrupoRanking(atletas),
      competicaoId: 'grupo-1',
      nomeCompeticao: 'Fechadinho de Quinta',
      nomeCategoria: 'Ranking do grupo'
    }
  ]);
  rankingServico.listarAtletasPorCompeticao.mockResolvedValue([criarGrupoRanking(atletas)]);
  rankingServico.listarAtletasPorRegiao.mockResolvedValue([criarGrupoRanking(atletas)]);
}

function atletasPadrao() {
  return [
    criarAtleta(1, 'Gustavo Drager Nome Bem Comprido', 7),
    criarAtleta(2, 'Casão', 4),
    criarAtleta(3, 'Eriquito', 4, { possuiUsuarioVinculado: false, temEmail: false }),
    criarAtleta(4, 'Paulinho', 3),
    criarAtleta(5, 'Bruninho', 3)
  ];
}

function renderizarPagina(rota = '/ranking') {
  return render(
    <MemoryRouter
      initialEntries={[rota]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <PaginaRanking />
    </MemoryRouter>
  );
}

beforeEach(() => {
  configurarBase();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PaginaRanking redesenhada', () => {
  it('renderiza hero compacto, abas principais e ranking de atletas sem destacar competicao no geral', async () => {
    renderizarPagina();

    expect(await screen.findByText('QNF RANKING')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Ranking' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeInTheDocument();

    const visoes = screen.getByRole('navigation', { name: 'Visões do ranking' });
    expect(within(visoes).getByRole('button', { name: /Atletas/i })).toHaveClass('ativo');
    expect(within(visoes).getByRole('button', { name: /Duplas/i })).toBeInTheDocument();
    expect(within(visoes).getByRole('button', { name: /Grupos/i })).toBeInTheDocument();

    const filtros = screen.getByRole('navigation', { name: 'Filtros de ranking' });
    expect(within(filtros).getByRole('button', { name: 'Geral' })).toHaveClass('ativo');
    expect(within(filtros).getByRole('button', { name: 'Grupos' })).toBeInTheDocument();
    expect(within(filtros).getByRole('button', { name: 'Competições' })).toBeInTheDocument();
    expect(within(filtros).getByRole('button', { name: 'Região' })).toBeInTheDocument();

    expect(screen.getByText('Todos os atletas')).toBeInTheDocument();
    expect(await screen.findByText('Destaques')).toBeInTheDocument();
    expect(screen.getByText(/Gustavo Drager Nome Bem/)).toBeInTheDocument();
    expect(screen.getByText('Sem conta')).toBeInTheDocument();
    expect(screen.getByText('Ranking completo')).toBeInTheDocument();
    expect(screen.getByText('Paulinho')).toBeInTheDocument();
    expect(screen.queryByText('Todas as competições')).not.toBeInTheDocument();
  });

  it('mostra estado vazio preparado para ranking de duplas sem chamar endpoint inexistente', async () => {
    const usuario = userEvent.setup();

    renderizarPagina();
    await screen.findByText('Destaques');

    const visoes = screen.getByRole('navigation', { name: 'Visões do ranking' });
    await usuario.click(within(visoes).getByRole('button', { name: /Duplas/i }));

    expect(screen.getByText('Todas as duplas')).toBeInTheDocument();
    expect(screen.getByText('Ranking de duplas em preparação')).toBeInTheDocument();
    expect(screen.queryByText('Paulinho')).not.toBeInTheDocument();
    expect(rankingServico.listarAtletasGeral).toHaveBeenCalledTimes(1);
  });

  it('mantem filtro por grupo usando o endpoint atual de atletas por grupo', async () => {
    const usuario = userEvent.setup();

    renderizarPagina();
    await screen.findByText('Destaques');

    const filtros = screen.getByRole('navigation', { name: 'Filtros de ranking' });
    await usuario.click(within(filtros).getByRole('button', { name: 'Grupos' }));

    await waitFor(() => {
      expect(rankingServico.listarAtletasPorGrupo).toHaveBeenCalledWith('grupo-1');
    });
    expect((await screen.findAllByText('Fechadinho de Quinta')).length).toBeGreaterThan(0);
    expect(screen.getByText('Ranking do grupo')).toBeInTheDocument();
  });

  it('renderiza poucos atletas sem exigir tres cards ou lista restante', async () => {
    configurarBase({
      atletas: [
        criarAtleta(1, 'Primo', 5),
        criarAtleta(2, 'Gustavo', 4)
      ]
    });

    renderizarPagina();

    expect(await screen.findByText('Primo')).toBeInTheDocument();
    expect(screen.getByText('Gustavo')).toBeInTheDocument();
    expect(screen.getByText('Os atletas disponíveis já aparecem nos destaques.')).toBeInTheDocument();
  });

  it('mostra estado vazio quando a API retorna grupos sem atletas', async () => {
    configurarBase({ atletas: [] });

    renderizarPagina();

    expect(await screen.findByText('Nenhuma pontuação encontrada para o filtro selecionado.')).toBeInTheDocument();
    expect(screen.queryByText('Destaques')).not.toBeInTheDocument();
    expect(screen.queryByText('Ranking completo')).not.toBeInTheDocument();
  });
});
