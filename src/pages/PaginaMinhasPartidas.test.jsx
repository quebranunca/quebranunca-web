import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { PaginaMinhasPartidas } from './PaginaMinhasPartidas';
import { partidasServico } from '../services/partidasServico';
import { pendenciasServico } from '../services/pendenciasServico';

const mocks = vi.hoisted(() => ({
  usuario: {
    id: 'admin-1',
    nome: 'Admin QN',
    atletaId: null,
    perfil: 1
  },
  showNotification: vi.fn()
}));

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    usuario: mocks.usuario
  })
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: mocks.showNotification,
    closeNotification: vi.fn()
  })
}));

vi.mock('../services/partidasServico', () => ({
  partidasServico: {
    listarMinhas: vi.fn(),
    listarRegistradasPorMim: vi.fn(),
    remover: vi.fn(),
    atualizarBasica: vi.fn(),
    obterCompartilhamento: vi.fn()
  }
}));

vi.mock('../services/pendenciasServico', () => ({
  pendenciasServico: {
    listar: vi.fn()
  }
}));

function LocalizacaoAtual() {
  const location = useLocation();
  return <span data-testid="rota-atual">{`${location.pathname}${location.search}`}</span>;
}

function criarPartida(sobrescritas = {}) {
  return {
    id: 'partida-1',
    categoriaCompeticaoId: null,
    grupoId: 'grupo-1',
    nomeGrupo: 'Fechadinho de Quinta',
    nomeCategoria: '',
    criadoPorUsuarioId: 'admin-1',
    nomeCriadoPorUsuario: 'Admin QN',
    duplaAId: 'dupla-a',
    nomeDuplaA: 'Primo e Gustavo',
    duplaAAtleta1Id: 'atleta-a1',
    nomeDuplaAAtleta1: 'Primo',
    duplaAAtleta2Id: 'atleta-a2',
    nomeDuplaAAtleta2: 'Gustavo',
    duplaBId: 'dupla-b',
    nomeDuplaB: 'Rafa e Leo',
    duplaBAtleta1Id: 'atleta-b1',
    nomeDuplaBAtleta1: 'Rafa',
    duplaBAtleta2Id: 'atleta-b2',
    nomeDuplaBAtleta2: 'Leo',
    status: 2,
    placarDuplaA: 18,
    placarDuplaB: 16,
    duplaVencedoraId: 'dupla-a',
    nomeDuplaVencedora: 'Primo e Gustavo',
    duplaVencedora: 1,
    tipoRegistroResultado: 1,
    statusAprovacao: 3,
    pesoRankingCategoria: 1,
    pontosRankingVitoria: 3,
    dataPartida: '2026-07-04T12:00:00Z',
    dataCriacao: '2026-07-04T12:00:00Z',
    quantidadeAtletasPendentes: 0,
    quantidadeAtletasPendentesSemEmail: 0,
    atletasPendentes: [],
    ...sobrescritas
  };
}

function configurarPartidas(partidas) {
  partidasServico.listarMinhas.mockResolvedValue([]);
  partidasServico.listarRegistradasPorMim.mockResolvedValue(partidas);
  pendenciasServico.listar.mockResolvedValue([]);
}

function renderizarPagina(rota = '/minhas-partidas?filtro=registradas') {
  return render(
    <MemoryRouter
      initialEntries={[rota]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <PaginaMinhasPartidas />
      <LocalizacaoAtual />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mocks.usuario = {
    id: 'admin-1',
    nome: 'Admin QN',
    atletaId: null,
    perfil: 1
  };
  configurarPartidas([criarPartida()]);
  partidasServico.remover.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PaginaMinhasPartidas - exclusao pelos detalhes', () => {
  it('abre e cancela a confirmacao de exclusao sem remover a partida', async () => {
    const usuario = userEvent.setup();

    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: /Abrir detalhes da partida/i }));
    expect(screen.getByRole('dialog', { name: 'Detalhes da partida' })).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Excluir partida' }));

    const modalConfirmacao = screen.getByRole('dialog', { name: 'Excluir partida?' });
    expect(within(modalConfirmacao).getByText('Esta ação é permanente e removerá esta partida do histórico, rankings e estatísticas relacionadas.')).toBeInTheDocument();
    expect(within(modalConfirmacao).getByText('Você realmente deseja excluir esta partida?')).toBeInTheDocument();

    await usuario.click(within(modalConfirmacao).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog', { name: 'Excluir partida?' })).not.toBeInTheDocument();
    expect(partidasServico.remover).not.toHaveBeenCalled();
  });

  it('confirma exclusao com loading, remove da lista e volta para Minhas Partidas', async () => {
    const usuario = userEvent.setup();
    let resolverExclusao;

    partidasServico.remover.mockImplementation(() => new Promise((resolve) => {
      resolverExclusao = resolve;
    }));

    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: /Abrir detalhes da partida/i }));
    await usuario.click(screen.getByRole('button', { name: 'Excluir partida' }));

    const modalConfirmacao = screen.getByRole('dialog', { name: 'Excluir partida?' });
    await usuario.click(within(modalConfirmacao).getByRole('button', { name: 'Excluir partida' }));

    expect(within(modalConfirmacao).getByRole('button', { name: 'Excluindo partida...' })).toBeDisabled();
    expect(within(modalConfirmacao).getByRole('button', { name: 'Cancelar' })).toBeDisabled();

    resolverExclusao();

    await waitFor(() => {
      expect(partidasServico.remover).toHaveBeenCalledWith('partida-1');
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Detalhes da partida' })).not.toBeInTheDocument();
    });

    expect(mocks.showNotification).toHaveBeenCalledWith({
      type: 'success',
      title: 'Partida excluída com sucesso.'
    });
    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/minhas-partidas');
  });

  it('mantem detalhes abertos e exibe erro amigavel quando a API falha', async () => {
    const usuario = userEvent.setup();

    partidasServico.remover.mockRejectedValue({
      response: {
        data: {
          erro: 'Voce nao tem permissao para excluir esta partida.'
        }
      }
    });

    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: /Abrir detalhes da partida/i }));
    await usuario.click(screen.getByRole('button', { name: 'Excluir partida' }));

    const modalConfirmacao = screen.getByRole('dialog', { name: 'Excluir partida?' });
    await usuario.click(within(modalConfirmacao).getByRole('button', { name: 'Excluir partida' }));

    expect(await within(modalConfirmacao).findByText('Voce nao tem permissao para excluir esta partida.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Detalhes da partida' })).toBeInTheDocument();
    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/minhas-partidas?filtro=registradas');
  });

  it('nao mostra a acao destrutiva para usuario sem permissao', async () => {
    const usuario = userEvent.setup();
    mocks.usuario = {
      id: 'atleta-1',
      nome: 'Primo',
      atletaId: 'atleta-a1',
      perfil: 3
    };
    configurarPartidas([criarPartida({ criadoPorUsuarioId: 'atleta-1' })]);

    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: /Abrir detalhes da partida/i }));

    expect(screen.getByRole('dialog', { name: 'Detalhes da partida' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir partida' })).not.toBeInTheDocument();
  });
});
