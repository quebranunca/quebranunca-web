import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PaginaPendenciasAtletas } from './PaginaPendenciasAtletas';
import { partidasServico } from '../services/partidasServico';
import { pendenciasServico } from '../services/pendenciasServico';
import { atletasServico } from '../services/atletasServico';
import { gruposServico } from '../services/gruposServico';

const mocks = vi.hoisted(() => ({
  usuario: {
    id: 'usuario-1',
    nome: 'Rafa',
    atletaId: null,
    perfil: 1
  },
  showNotification: vi.fn(),
  closeNotification: vi.fn()
}));

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    usuario: mocks.usuario,
    estadoAcesso: 'Ativo'
  })
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: mocks.showNotification,
    closeNotification: mocks.closeNotification
  })
}));

vi.mock('../services/partidasServico', () => ({
  partidasServico: {
    aprovarCancelamentoPartida: vi.fn(),
    recusarCancelamentoPartida: vi.fn()
  }
}));

vi.mock('../services/pendenciasServico', () => ({
  pendenciasServico: {
    listar: vi.fn(),
    completarContato: vi.fn(),
    confirmarVinculoAtletaCadastrado: vi.fn(),
    contestarPartida: vi.fn(),
    aprovarPartida: vi.fn()
  }
}));

vi.mock('../services/atletasServico', () => ({
  atletasServico: {
    obterMeu: vi.fn()
  }
}));

vi.mock('../services/gruposServico', () => ({
  gruposServico: {
    buscarAtletas: vi.fn()
  }
}));

function criarPendenciaCancelamento(sobrescritas = {}) {
  return {
    id: 'pendencia-cancelamento-1',
    tipo: 4,
    status: 1,
    prioridade: 1,
    partidaId: 'partida-1',
    solicitacaoCancelamentoPartidaId: 'solicitacao-1',
    nomeGrupo: 'Fechadinho de Quinta',
    dataPartida: '2026-07-04T12:00:00Z',
    nomeDuplaA: 'Primo e Gustavo',
    nomeDuplaAAtleta1: 'Primo',
    nomeDuplaAAtleta2: 'Gustavo',
    nomeDuplaB: 'Rafa e Leo',
    nomeDuplaBAtleta1: 'Rafa',
    nomeDuplaBAtleta2: 'Leo',
    placarDuplaA: 18,
    placarDuplaB: 16,
    ...sobrescritas
  };
}

function renderizarPagina() {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <PaginaPendenciasAtletas />
    </MemoryRouter>
  );
}

beforeEach(() => {
  pendenciasServico.listar.mockResolvedValue([criarPendenciaCancelamento()]);
  partidasServico.aprovarCancelamentoPartida.mockResolvedValue({});
  partidasServico.recusarCancelamentoPartida.mockResolvedValue({});
  atletasServico.obterMeu.mockResolvedValue(null);
  gruposServico.buscarAtletas.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PaginaPendenciasAtletas - cancelamento de partida', () => {
  it('abre a pendencia de cancelamento e aprova usando a solicitacao vinculada', async () => {
    const usuario = userEvent.setup();
    pendenciasServico.listar
      .mockResolvedValueOnce([criarPendenciaCancelamento()])
      .mockResolvedValueOnce([]);

    renderizarPagina();

    expect(await screen.findByText('Solicitação de cancelamento')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: /Revisar/i }));

    expect(screen.getByRole('link', { name: /Ver solicitação/i })).toHaveAttribute(
      'href',
      '/app/partidas/partida-1'
    );

    await usuario.click(screen.getByRole('button', { name: /Aprovar cancelamento/i }));

    await waitFor(() => {
      expect(partidasServico.aprovarCancelamentoPartida).toHaveBeenCalledWith('partida-1', 'solicitacao-1');
    });
    expect(mocks.showNotification).toHaveBeenCalledWith({
      type: 'success',
      title: 'Partida cancelada com sucesso.'
    });
  });
});
