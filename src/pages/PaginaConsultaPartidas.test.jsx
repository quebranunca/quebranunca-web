import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { PaginaConsultaPartidas } from './PaginaConsultaPartidas';
import { gruposServico } from '../services/gruposServico';
import { partidasServico } from '../services/partidasServico';

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    usuario: {
      id: 'admin-1',
      nome: 'Admin',
      perfil: 1
    }
  })
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: vi.fn()
  })
}));

vi.mock('../components/partidas/CompartilharPartidaBotao', () => ({
  CompartilharPartidaBotao: ({ partidaId }) => <button type="button">Compartilhar {partidaId}</button>
}));

vi.mock('../services/gruposServico', () => ({
  gruposServico: {
    listar: vi.fn()
  }
}));

vi.mock('../services/partidasServico', () => ({
  partidasServico: {
    listarAdministracao: vi.fn(),
    listarPorGrupo: vi.fn(),
    remover: vi.fn()
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

function criarPartida() {
  return {
    id: 'partida-consulta-1',
    grupoId: 'grupo-1',
    nomeGrupo: 'Grupo Admin',
    dataPartida: '2026-07-04T12:00:00Z',
    status: 2,
    placarDuplaA: 21,
    placarDuplaB: 17,
    nomeDuplaA: 'Primo e Gustavo',
    nomeDuplaB: 'Rafa e Leo',
    nomeDuplaVencedora: 'Primo e Gustavo',
    duplaAAtleta1Id: 'a1',
    duplaAAtleta2Id: 'a2',
    duplaBAtleta1Id: 'b1',
    duplaBAtleta2Id: 'b2',
    criadoPorUsuarioId: 'admin-1',
    podeEditar: true
  };
}

function renderizarPagina(rota = '/admin/partidas') {
  return render(
    <MemoryRouter initialEntries={[rota]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <PaginaConsultaPartidas />
      <LocalizacaoAtual />
    </MemoryRouter>
  );
}

beforeEach(() => {
  gruposServico.listar.mockResolvedValue([{ id: 'grupo-1', nome: 'Grupo Admin' }]);
  partidasServico.listarAdministracao.mockResolvedValue([criarPartida()]);
  partidasServico.listarPorGrupo.mockResolvedValue([criarPartida()]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PaginaConsultaPartidas', () => {
  it('navega para edição administrativa com origem em vez de abrir modal', async () => {
    const usuario = userEvent.setup();
    renderizarPagina('/admin/partidas?grupoId=grupo-1');

    await usuario.click(await screen.findByRole('link', { name: /Editar/i }));

    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/app/partidas/partida-consulta-1/editar');
    expect(screen.getByTestId('origem-atual')).toHaveTextContent('/admin/partidas?grupoId=grupo-1');
    expect(screen.queryByRole('dialog', { name: /Editar partida/i })).not.toBeInTheDocument();
  });
});
