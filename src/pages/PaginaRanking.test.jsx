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
    listarAtletasPorRegiao: vi.fn(),
    listarDuplas: vi.fn(),
    obterDupla: vi.fn(),
    listarGruposRanking: vi.fn(),
    obterGrupoRanking: vi.fn()
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

function criarRankingDuplas() {
  return {
    itens: [
      {
        id: 'dupla-1',
        posicao: 1,
        atleta1: { atletaId: 'atleta-1', nome: 'Gustavo', apelido: '', fotoPerfilUrl: '' },
        atleta2: { atletaId: 'atleta-2', nome: 'João', apelido: '', fotoPerfilUrl: '' },
        jogos: 4,
        vitorias: 3,
        derrotas: 1,
        aproveitamento: 75,
        sequenciaAtual: { tipo: 'V', quantidade: 2, texto: '2 vitórias seguidas' },
        pontosRanking: 8,
        variacao: 0,
        ultimoJogo: '2026-07-10T10:00:00Z',
        grupoPrincipal: 'Fechadinho de Quinta',
        pontosPro: 84,
        pontosContra: 70,
        saldo: 14
      }
    ],
    total: 1,
    pagina: 1,
    tamanhoPagina: 50,
    totalPaginas: 1
  };
}

function criarDetalheDupla() {
  return {
    resumo: criarRankingDuplas().itens[0],
    ultimosJogos: [
      {
        partidaId: 'partida-1',
        dataPartida: '2026-07-10T10:00:00Z',
        contexto: 'Fechadinho de Quinta',
        duplaAdversaria: 'Rafa / Teteu',
        resultado: 'Vitória',
        placar: '21 x 18',
        possuiPlacar: true
      }
    ],
    principaisAdversarios: [
      {
        id: 'dupla-adv',
        nome: 'Rafa / Teteu',
        jogos: 2,
        vitorias: 1,
        derrotas: 1,
        aproveitamento: 50
      }
    ],
    grupos: [
      {
        grupoId: 'grupo-1',
        nome: 'Fechadinho de Quinta',
        jogos: 4,
        vitorias: 3,
        derrotas: 1,
        aproveitamento: 75,
        pontosRanking: 8
      }
    ],
    historico: []
  };
}

function criarRankingGrupos() {
  return {
    itens: [
      {
        grupoId: 'grupo-1',
        posicao: 1,
        nome: 'Long Beach',
        fotoUrl: '',
        cidade: 'Santos',
        quantidadeAtletas: 42,
        quantidadePartidas: 124,
        atletasAtivos: 18,
        pontuacaoRanking: 2145,
        variacao: 0,
        ultimaPartida: '2026-07-09T10:00:00Z'
      }
    ],
    total: 1,
    pagina: 1,
    tamanhoPagina: 50,
    totalPaginas: 1
  };
}

function criarDetalheGrupo() {
  return {
    grupoId: 'grupo-1',
    nome: 'Long Beach',
    fotoUrl: '',
    cidade: 'Santos',
    descricao: 'Grupo da comunidade',
    administrador: 'Primo',
    publico: true,
    quantidadeAtletas: 42,
    quantidadePartidas: 124,
    atletasAtivos: 18,
    pontuacaoRanking: 2145,
    topAtletas: [criarAtleta(1, 'Gustavo', 10)],
    topDuplas: criarRankingDuplas().itens,
    ultimosJogos: [
      {
        partidaId: 'partida-1',
        dataPartida: '2026-07-09T10:00:00Z',
        duplaA: 'Gustavo / João',
        duplaB: 'Rafa / Teteu',
        resultado: 'Gustavo / João venceu',
        placar: '21 x 18',
        possuiPlacar: true
      }
    ],
    evolucaoMensal: [
      {
        ano: 2026,
        mes: 7,
        partidas: 12,
        atletasAtivos: 8,
        pontuacaoRanking: 144
      }
    ]
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
  rankingServico.listarDuplas.mockResolvedValue(criarRankingDuplas());
  rankingServico.obterDupla.mockResolvedValue(criarDetalheDupla());
  rankingServico.listarGruposRanking.mockResolvedValue(criarRankingGrupos());
  rankingServico.obterGrupoRanking.mockResolvedValue(criarDetalheGrupo());
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
    const usuario = userEvent.setup();

    renderizarPagina();

    expect(await screen.findByText('QNF RANKING')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Ranking' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeInTheDocument();
    expect(screen.queryByText('Sua referência de performance no QuebraNunca.')).not.toBeInTheDocument();

    const visoes = screen.getByRole('navigation', { name: 'Visões do ranking' });
    expect(within(visoes).getByRole('button', { name: /Atletas/i })).toHaveClass('ativo');
    expect(within(visoes).getByRole('button', { name: /Duplas/i })).toBeInTheDocument();
    expect(within(visoes).getByRole('button', { name: /Grupos/i })).toBeInTheDocument();

    expect(screen.queryByRole('navigation', { name: 'Filtros de ranking' })).not.toBeInTheDocument();
    const contexto = screen.getByLabelText('Contexto do ranking');
    expect(contexto).toHaveValue('geral');
    expect(within(contexto).getByRole('option', { name: 'Grupos' })).toBeInTheDocument();
    expect(within(contexto).getByRole('option', { name: 'Competições' })).toBeInTheDocument();
    expect(within(contexto).getByRole('option', { name: 'Região' })).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /Abrir filtros do ranking: Todos os atletas/i }));
    const painelFiltros = screen.getByRole('dialog', { name: 'Filtros' });
    expect(within(painelFiltros).getByText('Ranking consolidado de todas as partidas registradas.')).toBeInTheDocument();
    expect(within(painelFiltros).getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
    await usuario.click(within(painelFiltros).getByRole('button', { name: 'Aplicar filtros' }));
    expect(screen.queryByRole('dialog', { name: 'Filtros' })).not.toBeInTheDocument();

    expect(await screen.findByText('Destaques')).toBeInTheDocument();
    expect(screen.getByText(/Gustavo Drager Nome Bem/)).toBeInTheDocument();
    expect(screen.getByText('Sem conta')).toBeInTheDocument();
    expect(screen.getByText('Ranking completo')).toBeInTheDocument();
    expect(screen.getByText('Paulinho')).toBeInTheDocument();
    expect(screen.queryByText('Todas as competições')).not.toBeInTheDocument();
  });

  it('renderiza ranking de duplas real e abre detalhe', async () => {
    const usuario = userEvent.setup();

    renderizarPagina();
    await screen.findByText('Destaques');

    const visoes = screen.getByRole('navigation', { name: 'Visões do ranking' });
    await usuario.click(within(visoes).getByRole('button', { name: /Duplas/i }));

    expect(screen.getByRole('button', { name: /Todas as duplas/i })).toBeInTheDocument();
    expect(await screen.findByText('Gustavo / João')).toBeInTheDocument();
    expect(screen.getByText('75% aproveitamento • 3V • 1D')).toBeInTheDocument();
    expect(screen.queryByText('Paulinho')).not.toBeInTheDocument();
    expect(rankingServico.listarAtletasGeral).toHaveBeenCalledTimes(1);
    expect(rankingServico.listarDuplas).toHaveBeenCalledWith({
      grupoId: '',
      pagina: 1,
      periodo: '',
      tamanhoPagina: 50
    });

    await usuario.click(screen.getByRole('button', { name: /Abrir detalhes da dupla Gustavo \/ João/i }));

    expect(await screen.findByRole('dialog', { name: /Gustavo \/ João/i })).toBeInTheDocument();
    expect(screen.getByText('Principais adversários')).toBeInTheDocument();
    expect(rankingServico.obterDupla).toHaveBeenCalledWith('dupla-1', {
      grupoId: '',
      periodo: ''
    });
  });

  it('renderiza ranking de grupos real e abre detalhe', async () => {
    const usuario = userEvent.setup();

    renderizarPagina();
    await screen.findByText('Destaques');

    const visoes = screen.getByRole('navigation', { name: 'Visões do ranking' });
    await usuario.click(within(visoes).getByRole('button', { name: /Grupos/i }));

    expect(await screen.findByText('Long Beach')).toBeInTheDocument();
    expect(screen.getByText('124 partidas • 42 atletas • 18 ativos')).toBeInTheDocument();
    expect(rankingServico.listarGruposRanking).toHaveBeenCalledWith({
      grupoId: '',
      pagina: 1,
      periodo: '',
      tamanhoPagina: 50
    });

    await usuario.click(screen.getByRole('button', { name: /Abrir detalhes do grupo Long Beach/i }));

    expect(await screen.findByRole('dialog', { name: 'Long Beach' })).toBeInTheDocument();
    expect(screen.getByText('Top duplas')).toBeInTheDocument();
    expect(rankingServico.obterGrupoRanking).toHaveBeenCalledWith('grupo-1', {
      periodo: ''
    });
  });

  it('mantem filtro por grupo usando o endpoint atual de atletas por grupo', async () => {
    const usuario = userEvent.setup();

    renderizarPagina();
    await screen.findByText('Destaques');

    await usuario.selectOptions(screen.getByLabelText('Contexto do ranking'), 'grupos');

    await waitFor(() => {
      expect(rankingServico.listarAtletasPorGrupo).toHaveBeenCalledWith('grupo-1');
    });
    expect(screen.getByLabelText('Contexto do ranking')).toHaveValue('grupos');
    expect((await screen.findAllByText('Fechadinho de Quinta')).length).toBeGreaterThan(0);
    expect(screen.getByText('Ranking do grupo')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /Abrir filtros do ranking: Fechadinho de Quinta/i }));
    expect(screen.getByRole('dialog', { name: 'Filtros' })).toBeInTheDocument();
    expect(screen.getByLabelText('Grupo')).toHaveValue('grupo-1');
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
