import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { PaginaPartidaDetalhe } from './PaginaPartidaDetalhe';
import { partidasServico } from '../services/partidasServico';

vi.mock('../components/partidas/CompartilharPartidaBotao', () => ({
  CompartilharPartidaBotao: ({ partidaId }) => (
    <button type="button">Compartilhar {partidaId}</button>
  )
}));

vi.mock('../services/partidasServico', () => ({
  partidasServico: {
    obterPorId: vi.fn(),
    cancelarPartida: vi.fn(),
    excluirPartidaDefinitivamente: vi.fn(),
    solicitarCancelamentoPartida: vi.fn(),
    aprovarCancelamentoPartida: vi.fn(),
    recusarCancelamentoPartida: vi.fn(),
    cancelarSolicitacaoCancelamento: vi.fn()
  }
}));

function LocalizacaoAtual() {
  const location = useLocation();
  return (
    <>
      <span data-testid="rota-atual">{`${location.pathname}${location.search}`}</span>
      <span data-testid="origem-atual">{location.state?.origem || ''}</span>
    </>
  );
}

function criarPartida(sobrescritas = {}) {
  return {
    id: 'partida-1',
    grupoId: 'grupo-1',
    nomeGrupo: 'Fechadinho de Quinta',
    criadoPorUsuarioId: 'usuario-1',
    nomeCriadoPorUsuario: 'Gustavo',
    duplaAId: 'dupla-a',
    nomeDuplaA: 'Gustavo e Bruno',
    duplaAAtleta1Id: 'atleta-a1',
    nomeDuplaAAtleta1: 'Gustavo',
    duplaAAtleta2Id: 'atleta-a2',
    nomeDuplaAAtleta2: 'Bruno',
    duplaBId: 'dupla-b',
    nomeDuplaB: 'Rafa e Leo',
    duplaBAtleta1Id: 'atleta-b1',
    nomeDuplaBAtleta1: 'Rafa',
    duplaBAtleta2Id: 'atleta-b2',
    nomeDuplaBAtleta2: 'Leo',
    status: 2,
    statusAprovacao: 3,
    placarDuplaA: 21,
    placarDuplaB: 18,
    duplaVencedoraId: 'dupla-a',
    nomeDuplaVencedora: 'Gustavo e Bruno',
    duplaVencedora: 1,
    tipoRegistroResultado: 1,
    possuiPlacarDetalhado: true,
    dataPartida: '2026-07-04T12:00:00Z',
    dataCriacao: '2026-07-04T12:00:00Z',
    quantidadeAtletasPendentes: 0,
    cancelada: false,
    cancelamentoPendente: false,
    solicitacaoCancelamento: null,
    permissoes: {
      podeEditar: true,
      podeCancelar: true,
      podeExcluirDefinitivamente: true,
      podeSolicitarCancelamento: false,
      podeResponderCancelamento: false,
      podeCancelarSolicitacao: false
    },
    historico: [],
    ...sobrescritas
  };
}

function renderizarPagina(rota = '/app/partidas/partida-1') {
  return render(
    <MemoryRouter initialEntries={[rota]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/app/partidas/:partidaId" element={<><PaginaPartidaDetalhe /><LocalizacaoAtual /></>} />
        <Route path="/app/partidas/:partidaId/editar" element={<LocalizacaoAtual />} />
        <Route path="/minhas-partidas" element={<LocalizacaoAtual />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  partidasServico.obterPorId.mockResolvedValue(criarPartida());
  partidasServico.cancelarPartida.mockResolvedValue(criarPartida({ cancelada: true, canceladaEm: '2026-07-05T12:00:00Z' }));
  partidasServico.excluirPartidaDefinitivamente.mockResolvedValue(undefined);
  partidasServico.solicitarCancelamentoPartida.mockResolvedValue({});
  partidasServico.aprovarCancelamentoPartida.mockResolvedValue({});
  partidasServico.recusarCancelamentoPartida.mockResolvedValue({});
  partidasServico.cancelarSolicitacaoCancelamento.mockResolvedValue({});
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PaginaPartidaDetalhe', () => {
  it('renderiza placar e ações permitidas para registrador', async () => {
    renderizarPagina();

    expect(await screen.findByText('21 x 18')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancelar partida/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Excluir definitivamente/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Solicitar cancelamento/i })).not.toBeInTheDocument();
  });

  it('navega para a página de edição preservando origem do detalhe', async () => {
    const usuario = userEvent.setup();
    renderizarPagina();

    await usuario.click(await screen.findByRole('link', { name: 'Editar partida' }));

    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/app/partidas/partida-1/editar');
    expect(screen.getByTestId('origem-atual')).toHaveTextContent('/app/partidas/partida-1');
  });

  it('valida motivo obrigatório antes de cancelar diretamente', async () => {
    const usuario = userEvent.setup();
    renderizarPagina();

    await screen.findByText('21 x 18');
    await usuario.click(screen.getByRole('button', { name: /Cancelar partida/i }));
    const modal = screen.getByRole('dialog', { name: /Cancelar partida/i });
    expect(within(modal).getByRole('button', { name: /^Cancelar partida$/i })).toBeDisabled();

    await usuario.type(within(modal).getByPlaceholderText(/por que esta partida será cancelada/i), 'Duplicada');
    await usuario.click(within(modal).getByRole('button', { name: /^Cancelar partida$/i }));

    await waitFor(() => {
      expect(partidasServico.cancelarPartida).toHaveBeenCalledWith('partida-1', 'Duplicada');
    });
    expect(await screen.findByText(/Partida cancelada com sucesso/i)).toBeInTheDocument();
  });

  it('redireciona para minhas partidas após exclusão definitiva', async () => {
    const usuario = userEvent.setup();
    renderizarPagina();

    await screen.findByText('21 x 18');
    await usuario.click(screen.getByRole('button', { name: /Excluir definitivamente/i }));
    await usuario.type(screen.getByPlaceholderText(/por que esta partida será excluída/i), 'Auditoria');
    await usuario.click(screen.getAllByRole('button', { name: /Excluir definitivamente/i }).at(-1));

    await waitFor(() => {
      expect(partidasServico.excluirPartidaDefinitivamente).toHaveBeenCalledWith('partida-1', 'Auditoria');
    });
    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/minhas-partidas');
  });

  it('mostra solicitação para participante sem permissão direta', async () => {
    const usuario = userEvent.setup();
    partidasServico.obterPorId.mockResolvedValueOnce(criarPartida({
      permissoes: {
        podeEditar: false,
        podeCancelar: false,
        podeExcluirDefinitivamente: false,
        podeSolicitarCancelamento: true,
        podeResponderCancelamento: false,
        podeCancelarSolicitacao: false
      }
    }));
    renderizarPagina();

    await screen.findByText('21 x 18');
    await usuario.click(screen.getByRole('button', { name: /Solicitar cancelamento/i }));
    await usuario.selectOptions(screen.getByLabelText(/Motivo do cancelamento/i), '1');
    await usuario.click(screen.getByRole('button', { name: /Enviar solicitação/i }));

    await waitFor(() => {
      expect(partidasServico.solicitarCancelamentoPartida).toHaveBeenCalledWith('partida-1', {
        motivo: 1,
        observacao: null
      });
    });
  });

  it('não exibe ações destrutivas para usuário sem permissão', async () => {
    partidasServico.obterPorId.mockResolvedValueOnce(criarPartida({
      permissoes: {
        podeEditar: false,
        podeCancelar: false,
        podeExcluirDefinitivamente: false,
        podeSolicitarCancelamento: false,
        podeResponderCancelamento: false,
        podeCancelarSolicitacao: false
      }
    }));

    renderizarPagina();

    expect(await screen.findByText('21 x 18')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cancelar partida/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Excluir definitivamente/i })).not.toBeInTheDocument();
  });
});
