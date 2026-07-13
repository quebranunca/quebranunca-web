import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    solicitarCancelamentoPartida: vi.fn(),
    aprovarCancelamentoPartida: vi.fn(),
    recusarCancelamentoPartida: vi.fn(),
    cancelarSolicitacaoCancelamento: vi.fn(),
    excluirPartidaDefinitivamente: vi.fn(),
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
    cancelada: false,
    cancelamentoPendente: false,
    podeSolicitarCancelamento: false,
    podeResponderCancelamento: false,
    podeCancelarSolicitacao: false,
    podeEditar: true,
    podeExcluirDefinitivamente: false,
    solicitacaoCancelamento: null,
    ...sobrescritas
  };
}

function criarSolicitacaoCancelamento(sobrescritas = {}) {
  return {
    id: 'solicitacao-1',
    partidaId: 'partida-1',
    solicitadaPorUsuarioId: 'admin-1',
    nomeSolicitante: 'Admin QN',
    solicitadaEm: '2026-07-04T13:00:00Z',
    duplaSolicitanteId: 'dupla-a',
    duplaAdversariaId: 'dupla-b',
    motivo: 1,
    motivoTexto: 'Partida duplicada',
    observacao: null,
    status: 1,
    respondidaPorUsuarioId: null,
    nomeRespondente: null,
    respondidaEm: null,
    canceladaPeloSolicitanteEm: null,
    respostaUsuarioAtual: null,
    pendencias: [
      {
        pendenciaId: 'pendencia-cancelamento-1',
        atletaId: 'atleta-b1',
        nomeAtleta: 'Rafa',
        status: 1,
        usuarioAtualPodeResponder: true
      },
      {
        pendenciaId: 'pendencia-cancelamento-2',
        atletaId: 'atleta-b2',
        nomeAtleta: 'Leo',
        status: 1,
        usuarioAtualPodeResponder: false
      }
    ],
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
  partidasServico.solicitarCancelamentoPartida.mockResolvedValue({});
  partidasServico.aprovarCancelamentoPartida.mockResolvedValue({});
  partidasServico.recusarCancelamentoPartida.mockResolvedValue({});
  partidasServico.cancelarSolicitacaoCancelamento.mockResolvedValue({});
  partidasServico.excluirPartidaDefinitivamente.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PaginaMinhasPartidas - detalhes e exclusao', () => {
  it('navega para a pagina unica de detalhes ao tocar no atalho do card', async () => {
    const usuario = userEvent.setup();
    renderizarPagina();

    await usuario.click(await screen.findByRole('link', { name: 'Abrir detalhes da partida' }));

    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/app/partidas/partida-1');
  });

  it('navega para os detalhes com Enter e Espaco no card clicavel', async () => {
    renderizarPagina();

    const tituloCard = await screen.findByText('Fechadinho de Quinta');
    const card = tituloCard.closest('article');

    expect(card).toHaveAttribute('role', 'link');

    card.focus();
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/app/partidas/partida-1');

    cleanup();
    renderizarPagina();

    const novoCard = (await screen.findByText('Fechadinho de Quinta')).closest('article');
    novoCard.focus();
    fireEvent.keyDown(novoCard, { key: ' ' });
    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/app/partidas/partida-1');
  });

  it('abre e cancela a confirmacao de exclusao sem remover a partida', async () => {
    const usuario = userEvent.setup();
    configurarPartidas([criarPartida({
      cancelada: true,
      canceladaEm: '2026-07-04T13:10:00Z',
      podeEditar: false,
      podeExcluirDefinitivamente: true,
      solicitacaoCancelamento: criarSolicitacaoCancelamento({ status: 2 })
    })]);

    renderizarPagina('/minhas-partidas?filtro=canceladas');

    await usuario.click(await screen.findByRole('button', { name: 'Excluir definitivamente' }));

    const modalConfirmacao = screen.getByRole('dialog', { name: 'Excluir definitivamente?' });
    expect(within(modalConfirmacao).getByText('Esta ação removerá a partida das consultas normais e não poderá ser desfeita pela interface.')).toBeInTheDocument();
    expect(within(modalConfirmacao).getByText('O histórico administrativo mínimo será preservado.')).toBeInTheDocument();

    await usuario.click(within(modalConfirmacao).getByRole('button', { name: 'Voltar' }));

    expect(screen.queryByRole('dialog', { name: 'Excluir definitivamente?' })).not.toBeInTheDocument();
    expect(partidasServico.excluirPartidaDefinitivamente).not.toHaveBeenCalled();
  });

  it('confirma exclusao com loading, remove da lista e volta para Minhas Partidas', async () => {
    const usuario = userEvent.setup();
    let resolverExclusao;
    configurarPartidas([criarPartida({
      cancelada: true,
      canceladaEm: '2026-07-04T13:10:00Z',
      podeEditar: false,
      podeExcluirDefinitivamente: true,
      solicitacaoCancelamento: criarSolicitacaoCancelamento({ status: 2 })
    })]);

    partidasServico.excluirPartidaDefinitivamente.mockImplementation(() => new Promise((resolve) => {
      resolverExclusao = resolve;
    }));

    renderizarPagina('/minhas-partidas?filtro=canceladas');

    await usuario.click(await screen.findByRole('button', { name: 'Excluir definitivamente' }));

    const modalConfirmacao = screen.getByRole('dialog', { name: 'Excluir definitivamente?' });
    await usuario.type(within(modalConfirmacao).getByPlaceholderText('Informe por que esta partida será excluída...'), 'Auditoria administrativa');
    await usuario.click(within(modalConfirmacao).getByRole('button', { name: 'Excluir definitivamente' }));

    expect(within(modalConfirmacao).getByRole('button', { name: 'Excluindo...' })).toBeDisabled();
    expect(within(modalConfirmacao).getByRole('button', { name: 'Voltar' })).toBeDisabled();

    resolverExclusao();

    await waitFor(() => {
      expect(partidasServico.excluirPartidaDefinitivamente).toHaveBeenCalledWith('partida-1', 'Auditoria administrativa');
    });
    expect(mocks.showNotification).toHaveBeenCalledWith({
      type: 'success',
      title: 'Partida excluída definitivamente.'
    });
    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/minhas-partidas');
  });

  it('mantem detalhes abertos e exibe erro amigavel quando a API falha', async () => {
    const usuario = userEvent.setup();
    configurarPartidas([criarPartida({
      cancelada: true,
      canceladaEm: '2026-07-04T13:10:00Z',
      podeEditar: false,
      podeExcluirDefinitivamente: true,
      solicitacaoCancelamento: criarSolicitacaoCancelamento({ status: 2 })
    })]);

    partidasServico.excluirPartidaDefinitivamente.mockRejectedValue({
      response: {
        data: {
          erro: 'Voce nao tem permissao para excluir esta partida.'
        }
      }
    });

    renderizarPagina('/minhas-partidas?filtro=canceladas');

    await usuario.click(await screen.findByRole('button', { name: 'Excluir definitivamente' }));

    const modalConfirmacao = screen.getByRole('dialog', { name: 'Excluir definitivamente?' });
    await usuario.type(within(modalConfirmacao).getByPlaceholderText('Informe por que esta partida será excluída...'), 'Auditoria administrativa');
    await usuario.click(within(modalConfirmacao).getByRole('button', { name: 'Excluir definitivamente' }));

    expect(await within(modalConfirmacao).findByText('Voce nao tem permissao para excluir esta partida.')).toBeInTheDocument();
    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/minhas-partidas?filtro=canceladas');
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

    await screen.findByText('Fechadinho de Quinta');
    expect(screen.queryByRole('button', { name: 'Excluir definitivamente' })).not.toBeInTheDocument();
  });
});

describe('PaginaMinhasPartidas - cancelamento de partida', () => {
  it('exibe e envia solicitacao de cancelamento com codigo de motivo', async () => {
    const usuario = userEvent.setup();
    const partidaAtiva = criarPartida({ podeSolicitarCancelamento: true });
    const partidaPendente = criarPartida({
      cancelamentoPendente: true,
      podeSolicitarCancelamento: false,
      podeCancelarSolicitacao: true,
      solicitacaoCancelamento: criarSolicitacaoCancelamento()
    });

    partidasServico.listarMinhas.mockResolvedValue([]);
    partidasServico.listarRegistradasPorMim
      .mockResolvedValueOnce([partidaAtiva])
      .mockResolvedValueOnce([partidaPendente]);
    pendenciasServico.listar.mockResolvedValue([]);

    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: /Solicitar cancelamento/i }));

    const modal = screen.getByRole('dialog', { name: 'Solicitar cancelamento' });
    expect(within(modal).getByRole('button', { name: 'Enviar solicitação' })).toBeDisabled();

    await usuario.selectOptions(within(modal).getByLabelText('Motivo do cancelamento'), '1');
    await usuario.click(within(modal).getByRole('button', { name: 'Enviar solicitação' }));

    await waitFor(() => {
      expect(partidasServico.solicitarCancelamentoPartida).toHaveBeenCalledWith('partida-1', {
        motivo: 1,
        observacao: null
      });
    });
    expect((await screen.findAllByText('Cancelamento pendente')).length).toBeGreaterThan(0);
  });

  it('exige observacao quando o motivo for outro', async () => {
    const usuario = userEvent.setup();
    configurarPartidas([criarPartida({ podeSolicitarCancelamento: true })]);

    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: /Solicitar cancelamento/i }));
    const modal = screen.getByRole('dialog', { name: 'Solicitar cancelamento' });

    await usuario.selectOptions(within(modal).getByLabelText('Motivo do cancelamento'), '6');

    expect(within(modal).getByRole('button', { name: 'Enviar solicitação' })).toBeDisabled();
    expect(partidasServico.solicitarCancelamentoPartida).not.toHaveBeenCalled();
  });

  it('permite aprovacao de cancelamento quando backend autoriza', async () => {
    const usuario = userEvent.setup();
    const partidaPendente = criarPartida({
      cancelamentoPendente: true,
      podeResponderCancelamento: true,
      podeEditar: false,
      solicitacaoCancelamento: criarSolicitacaoCancelamento()
    });
    const partidaCancelada = criarPartida({
      cancelada: true,
      canceladaEm: '2026-07-04T13:20:00Z',
      cancelamentoPendente: false,
      podeResponderCancelamento: false,
      podeEditar: false,
      solicitacaoCancelamento: criarSolicitacaoCancelamento({
        status: 2,
        nomeRespondente: 'Rafa',
        respondidaEm: '2026-07-04T13:20:00Z'
      })
    });

    partidasServico.listarMinhas.mockResolvedValue([]);
    partidasServico.listarRegistradasPorMim
      .mockResolvedValueOnce([partidaPendente])
      .mockResolvedValueOnce([partidaCancelada]);
    pendenciasServico.listar.mockResolvedValue([]);

    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: /Aprovar cancelamento/i }));
    const modal = screen.getByRole('dialog', { name: 'Aprovar cancelamento?' });
    await usuario.click(within(modal).getByRole('button', { name: 'Aprovar cancelamento' }));

    await waitFor(() => {
      expect(partidasServico.aprovarCancelamentoPartida).toHaveBeenCalledWith('partida-1', 'solicitacao-1');
    });
    await usuario.click(screen.getByRole('button', { name: 'Canceladas' }));
    expect((await screen.findAllByText('Partida cancelada')).length).toBeGreaterThan(0);
  });

  it('mostra partidas canceladas apenas no filtro Canceladas e sem editar', async () => {
    const usuario = userEvent.setup();
    configurarPartidas([
      criarPartida({ id: 'partida-ativa', nomeGrupo: 'Grupo Ativo' }),
      criarPartida({
        id: 'partida-cancelada',
        nomeGrupo: 'Grupo Cancelado',
        cancelada: true,
        canceladaEm: '2026-07-04T13:20:00Z',
        podeEditar: false,
        solicitacaoCancelamento: criarSolicitacaoCancelamento({
          id: 'solicitacao-cancelada',
          partidaId: 'partida-cancelada',
          status: 2
        })
      })
    ]);

    renderizarPagina('/minhas-partidas');

    expect(await screen.findByText('Grupo Ativo')).toBeInTheDocument();
    expect(screen.queryByText('Grupo Cancelado')).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Canceladas' }));

    expect(await screen.findByText('Grupo Cancelado')).toBeInTheDocument();
    expect(screen.queryByText('Grupo Ativo')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar partida' })).not.toBeInTheDocument();
  });
});
