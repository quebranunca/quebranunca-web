import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PaginaScouts } from './PaginaScouts';
import { dashboardServico } from '../services/dashboardServico';
import { duplasServico } from '../services/duplasServico';

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    usuario: {
      id: 'usuario-1',
      nome: 'Gustavo Drager',
      apelido: 'Primo',
      atletaId: 'atleta-1'
    }
  })
}));

vi.mock('../services/dashboardServico', () => ({
  dashboardServico: {
    obterDashboardAtleta: vi.fn(),
    listarJogosAtleta: vi.fn()
  }
}));

vi.mock('../services/duplasServico', () => ({
  duplasServico: {
    obterDashboard: vi.fn()
  }
}));

function criarDashboard(overrides = {}) {
  return {
    perfil: {
      atletaId: 'atleta-1',
      nome: 'Gustavo Drager',
      apelido: 'Primo',
      categoriaPrincipal: 'Bronze'
    },
    resumo: {
      totalPartidas: 3,
      vitorias: 2,
      derrotas: 1,
      aproveitamento: 66.7,
      sequenciaAtual: 1,
      tipoSequenciaAtual: 'vitoria',
      textoSequenciaAtual: '1 vitória seguida'
    },
    estatisticasPontos: {
      disponivel: true,
      partidasComPlacar: 2,
      pontosPro: 36,
      pontosContra: 30,
      saldo: 6,
      mediaPontosPro: 18,
      mediaPontosContra: 15,
      mediaSaldo: 3,
      jogosDiferencaMinima: 1
    },
    formaRecente: [
      { partidaId: 'partida-1', resultado: 'V', dataPartida: '2026-07-07T10:00:00Z' },
      { partidaId: 'partida-2', resultado: 'D', dataPartida: '2026-07-06T10:00:00Z' }
    ],
    ultimasPartidas: [
      {
        id: 'partida-1',
        resultado: 'Vitória',
        grupoOuContexto: 'Partidas avulsas',
        dataPartida: '2026-07-07T10:00:00Z',
        placarSuaDupla: 18,
        placarAdversarios: 14,
        possuiPlacarDetalhado: true
      }
    ],
    melhoresParceiros: [
      {
        atletaId: 'atleta-2',
        nome: 'Bruno Costa',
        apelido: 'Bruno',
        partidas: 3,
        vitorias: 2,
        derrotas: 1,
        aproveitamento: 66.7,
        saldoPontos: 6,
        partidasComPlacar: 2
      }
    ],
    rivaisMaisEnfrentados: [
      {
        atletaId: 'atleta-3',
        nome: 'Professor',
        apelido: 'Professor',
        partidas: 2,
        vitorias: 1,
        derrotas: 1,
        aproveitamento: 50
      }
    ],
    desempenhoPorGrupo: [
      {
        grupoId: 'grupo-1',
        nome: 'Fechadinho Quinta',
        jogos: 2,
        vitorias: 1,
        derrotas: 1,
        aproveitamento: 50,
        partidasAvulsas: false,
        estatisticasPontos: { disponivel: true, saldo: 2, partidasComPlacar: 1 }
      }
    ],
    evolucao: [
      { mes: 'fev', ano: 2026, numeroMes: 2, partidas: 0, vitorias: 0, aproveitamento: 0, aproveitamentoDados: null, possuiDados: false },
      { mes: 'mar', ano: 2026, numeroMes: 3, partidas: 1, vitorias: 0, aproveitamento: 0, aproveitamentoDados: 0, possuiDados: true }
    ],
    duplasDisponiveis: [
      {
        parceiroId: 'atleta-2',
        nome: 'Bruno Costa',
        apelido: 'Bruno',
        jogos: 3,
        vitorias: 2,
        derrotas: 1,
        aproveitamento: 66.7
      }
    ],
    ...overrides
  };
}

function criarDashboardDupla() {
  return {
    dupla: {
      atleta1: { atletaId: 'atleta-1', nome: 'Gustavo Drager', apelido: 'Primo' },
      atleta2: { atletaId: 'atleta-2', nome: 'Bruno Costa', apelido: 'Bruno' },
      nome: 'Primo e Bruno'
    },
    resumo: {
      totalPartidas: 3,
      vitorias: 2,
      derrotas: 1,
      aproveitamento: 66.7,
      sequenciaAtual: 1,
      tipoSequenciaAtual: 'vitoria'
    },
    estatisticasPontos: {
      disponivel: true,
      partidasComPlacar: 2,
      pontosPro: 36,
      pontosContra: 30,
      saldo: 6,
      mediaPontosPro: 18,
      mediaPontosContra: 15,
      mediaSaldo: 3,
      jogosDiferencaMinima: 1
    },
    formaRecente: [{ partidaId: 'partida-1', resultado: 'V' }],
    ultimasPartidas: [
      {
        id: 'partida-1',
        resultado: 'Vitória',
        grupo: 'Fechadinho Quinta',
        dataPartida: '2026-07-07T10:00:00Z',
        placarDupla: 18,
        placarAdversarios: 14
      }
    ],
    melhoresAdversarios: [
      {
        atletas: [
          { atletaId: 'atleta-3', nome: 'Professor' },
          { atletaId: 'atleta-4', nome: 'Daniel' }
        ],
        partidas: 2,
        vitorias: 1,
        derrotas: 1,
        aproveitamento: 50,
        ultimaPartida: '2026-07-07T10:00:00Z'
      }
    ],
    grupos: [],
    evolucao: []
  };
}

function renderizarPagina() {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <PaginaScouts />
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PaginaScouts', () => {
  it('renderiza o resumo do atleta com percentual em pt-BR', async () => {
    dashboardServico.obterDashboardAtleta.mockResolvedValue(criarDashboard());
    renderizarPagina();

    expect(await screen.findByText('Gustavo Drager')).toBeInTheDocument();
    expect(screen.getByText('66,7%')).toBeInTheDocument();
    expect(screen.getByText('1 vitória seguida')).toBeInTheDocument();
    expect(screen.getByText('36')).toBeInTheDocument();
    expect(screen.getByText('+6')).toBeInTheDocument();
  });

  it('não exibe saldo de pontos quando não há partida com placar', async () => {
    dashboardServico.obterDashboardAtleta.mockResolvedValue(criarDashboard({
      estatisticasPontos: {
        disponivel: false,
        partidasComPlacar: 0,
        pontosPro: null,
        pontosContra: null,
        saldo: null
      }
    }));
    renderizarPagina();

    expect(await screen.findByText(/Estatísticas de pontos indisponíveis/i)).toBeInTheDocument();
    expect(screen.queryByText(/Saldo \+6/i)).not.toBeInTheDocument();
  });

  it('seleciona a aba Jogos pelo Ver todos e carrega a lista paginada', async () => {
    const usuario = userEvent.setup();
    dashboardServico.obterDashboardAtleta.mockResolvedValue(criarDashboard());
    dashboardServico.listarJogosAtleta.mockResolvedValue({
      itens: criarDashboard().ultimasPartidas,
      total: 1,
      pagina: 1,
      tamanhoPagina: 20,
      temMais: false
    });
    renderizarPagina();

    await screen.findByText('Últimos jogos');
    await usuario.click(screen.getAllByRole('button', { name: /Ver todos/i })[0]);

    await waitFor(() => expect(dashboardServico.listarJogosAtleta).toHaveBeenCalled());
    expect(screen.getByRole('heading', { name: 'Jogos' })).toBeInTheDocument();
  });

  it('diferencia mês sem partida de aproveitamento zero no gráfico', async () => {
    dashboardServico.obterDashboardAtleta.mockResolvedValue(criarDashboard());
    renderizarPagina();

    await screen.findByText('Evolução do aproveitamento');

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('carrega o scout de dupla após selecionar parceiro', async () => {
    const usuario = userEvent.setup();
    dashboardServico.obterDashboardAtleta.mockResolvedValue(criarDashboard());
    duplasServico.obterDashboard.mockResolvedValue(criarDashboardDupla());
    renderizarPagina();

    await screen.findByText('Gustavo Drager');
    await usuario.click(screen.getByRole('tab', { name: 'Duplas' }));
    await usuario.click(screen.getByRole('button', { name: /Bruno/i }));

    await waitFor(() => expect(duplasServico.obterDashboard).toHaveBeenCalledWith('atleta-1', 'atleta-2'));
    expect(await screen.findByText('Primo')).toBeInTheDocument();
    expect(screen.getByText('Professor / Daniel')).toBeInTheDocument();
  });
});
