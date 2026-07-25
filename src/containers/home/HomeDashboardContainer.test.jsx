import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomeDashboardContainer } from './HomeDashboardContainer';
import { dashboardServico } from '../../services/dashboardServico';
import { pendenciasServico } from '../../services/pendenciasServico';
import { gamificacaoServico } from '../../services/gamificacaoServico';

const autenticacaoMock = vi.hoisted(() => ({
  usuario: {
    id: 'usuario-1',
    nome: 'Atleta completo',
    atletaId: 'atleta-1',
    perfil: 3
  },
  atualizarUsuarioLocal: vi.fn()
}));

vi.mock('../../hooks/useAutenticacao', () => ({
  useAutenticacao: () => autenticacaoMock
}));

vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ showNotification: vi.fn() })
}));

vi.mock('../../services/dashboardServico', () => ({
  dashboardServico: {
    obterPerfilAtleta: vi.fn(),
    obterResumoAtleta: vi.fn(),
    listarUltimasPartidasAtleta: vi.fn()
  }
}));

vi.mock('../../services/pendenciasServico', () => ({
  EVENTO_PENDENCIAS_ATUALIZADAS: 'pendencias-atualizadas',
  pendenciasServico: {
    obterResumo: vi.fn(),
    aprovarPartida: vi.fn(),
    contestarPartida: vi.fn()
  }
}));

vi.mock('../../services/gamificacaoServico', () => ({
  gamificacaoServico: {
    obterResumo: vi.fn()
  }
}));

function prepararRespostas() {
  dashboardServico.obterPerfilAtleta.mockResolvedValue({
    atletaId: 'atleta-1',
    nome: 'Atleta completo'
  });
  dashboardServico.obterResumoAtleta.mockResolvedValue({
    totalPartidas: 2,
    vitorias: 1
  });
  dashboardServico.listarUltimasPartidasAtleta.mockResolvedValue([]);
  pendenciasServico.obterResumo.mockResolvedValue({ total: 0 });
  gamificacaoServico.obterResumo.mockResolvedValue({
    pontuacao: { saldoAtual: 0, temAtletaVinculado: Boolean(autenticacaoMock.usuario.atletaId) },
    nivel: { nome: 'Bronze', pontosProximaFaixa: 500, progressoPercentual: 0 },
    proximosBeneficios: []
  });
}

function renderizarContainer() {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <HomeDashboardContainer />
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  autenticacaoMock.usuario = {
    id: 'usuario-1',
    nome: 'Atleta completo',
    atletaId: 'atleta-1',
    perfil: 3
  };
});

describe('HomeDashboardContainer', () => {
  it('carrega todos os modulos esportivos quando o usuario possui atleta', async () => {
    prepararRespostas();
    renderizarContainer();

    await waitFor(() => {
      expect(dashboardServico.obterPerfilAtleta).toHaveBeenCalledTimes(1);
      expect(dashboardServico.obterResumoAtleta).toHaveBeenCalledTimes(1);
      expect(dashboardServico.listarUltimasPartidasAtleta).toHaveBeenCalledTimes(1);
      expect(pendenciasServico.obterResumo).toHaveBeenCalledTimes(1);
      expect(gamificacaoServico.obterResumo).toHaveBeenCalledTimes(1);
    });
  });

  it('nao chama endpoints esportivos quando o usuario ainda nao possui atleta', async () => {
    autenticacaoMock.usuario = {
      id: 'usuario-novo',
      nome: 'Novo atleta',
      atletaId: null,
      perfil: 3
    };
    prepararRespostas();
    renderizarContainer();

    await waitFor(() => {
      expect(pendenciasServico.obterResumo).toHaveBeenCalledTimes(1);
      expect(gamificacaoServico.obterResumo).toHaveBeenCalledTimes(1);
    });

    expect(dashboardServico.obterPerfilAtleta).not.toHaveBeenCalled();
    expect(dashboardServico.obterResumoAtleta).not.toHaveBeenCalled();
    expect(dashboardServico.listarUltimasPartidasAtleta).not.toHaveBeenCalled();
  });

  it('mantem tratamento de erro real nos modulos compativeis', async () => {
    autenticacaoMock.usuario = {
      id: 'usuario-novo',
      nome: 'Novo atleta',
      atletaId: null,
      perfil: 3
    };
    prepararRespostas();
    gamificacaoServico.obterResumo.mockRejectedValue(new Error('Falha temporária'));
    renderizarContainer();

    await waitFor(() => {
      expect(gamificacaoServico.obterResumo).toHaveBeenCalledTimes(1);
    });

    expect(dashboardServico.obterPerfilAtleta).not.toHaveBeenCalled();
  });
});
