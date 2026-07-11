import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { PaginaGrupoConfiguracoes } from './PaginaGrupoConfiguracoes';
import { gruposServico } from '../services/gruposServico';

const estadoAutenticacao = vi.hoisted(() => ({
  usuario: {
    id: 'usuario-owner',
    nome: 'Primo',
    atletaId: 'atleta-1',
    perfil: 3
  }
}));

const notificacoes = vi.hoisted(() => ({
  showNotification: vi.fn()
}));

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    usuario: estadoAutenticacao.usuario
  })
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: notificacoes.showNotification
  })
}));

vi.mock('../services/gruposServico', () => ({
  gruposServico: {
    obterPorId: vi.fn(),
    atualizar: vi.fn(),
    atualizarImagem: vi.fn(),
    removerImagem: vi.fn(),
    remover: vi.fn()
  }
}));

function LocalizacaoAtual() {
  const location = useLocation();
  return <span data-testid="rota-atual">{location.pathname}</span>;
}

function criarGrupo(sobrescritas = {}) {
  return {
    id: 'grupo-1',
    nome: 'Serie C',
    imagemUrl: '',
    privacidade: 'Privado',
    publico: false,
    usuarioOrganizadorId: 'usuario-owner',
    nomeUsuarioOrganizador: 'Primo',
    localPrincipal: null,
    diasDaSemana: [],
    ...sobrescritas
  };
}

function renderizarPagina() {
  return render(
    <MemoryRouter
      initialEntries={['/grupos/grupo-1/configuracoes']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route path="/grupos/:grupoId/configuracoes" element={<><PaginaGrupoConfiguracoes /><LocalizacaoAtual /></>} />
        <Route path="/grupos" element={<LocalizacaoAtual />} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  estadoAutenticacao.usuario = {
    id: 'usuario-owner',
    nome: 'Primo',
    atletaId: 'atleta-1',
    perfil: 3
  };
});

describe('PaginaGrupoConfiguracoes', () => {
  it('mostra resumo, seções administrativas e avatar automático com uma letra para o owner', async () => {
    gruposServico.obterPorId.mockResolvedValue(criarGrupo());

    renderizarPagina();

    expect(await screen.findByRole('heading', { name: 'Configurações do Grupo' })).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('Informações')).toBeInTheDocument();
    expect(screen.getByText('Participantes')).toBeInTheDocument();
    expect(screen.getByText('ZONA DE PERIGO')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Excluir grupo/i })).toBeInTheDocument();
    expect(screen.queryByText(/Convidar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Compartilhar/i)).not.toBeInTheDocument();
  });

  it('não mostra Excluir grupo para administrador que não é criador', async () => {
    estadoAutenticacao.usuario = {
      id: 'usuario-admin',
      nome: 'Admin',
      perfil: 1
    };
    gruposServico.obterPorId.mockResolvedValue(criarGrupo());

    renderizarPagina();

    expect(await screen.findByRole('heading', { name: 'Configurações do Grupo' })).toBeInTheDocument();
    expect(screen.getByText('Informações')).toBeInTheDocument();
    expect(screen.queryByText('ZONA DE PERIGO')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Excluir grupo/i })).not.toBeInTheDocument();
  });

  it('não mostra Excluir grupo para membro comum', async () => {
    estadoAutenticacao.usuario = {
      id: 'usuario-membro',
      nome: 'Membro',
      perfil: 3
    };
    gruposServico.obterPorId.mockResolvedValue(criarGrupo());

    renderizarPagina();

    expect(await screen.findByRole('heading', { name: 'Configurações do Grupo' })).toBeInTheDocument();
    expect(screen.queryByText('ZONA DE PERIGO')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Excluir grupo/i })).not.toBeInTheDocument();
  });

  it('exige confirmação EXCLUIR antes de chamar exclusão', async () => {
    const usuario = userEvent.setup();
    gruposServico.obterPorId.mockResolvedValue(criarGrupo());
    gruposServico.remover.mockResolvedValue();

    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: /Excluir grupo/i }));

    const modal = screen.getByRole('dialog', { name: 'Excluir grupo' });
    const botaoExcluir = screen.getByRole('button', { name: /^Excluir grupo$/i });
    expect(botaoExcluir).toBeDisabled();

    await usuario.type(withinModalInput(modal), 'EXCLUIR');
    expect(botaoExcluir).toBeEnabled();
    await usuario.click(botaoExcluir);

    await waitFor(() => expect(gruposServico.remover).toHaveBeenCalledWith('grupo-1'));
    expect(notificacoes.showNotification).toHaveBeenCalledWith(expect.objectContaining({
      type: 'success',
      title: 'Grupo excluído com sucesso.'
    }));
    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/grupos');
  });
});

function withinModalInput(modal) {
  return modal.querySelector('input');
}
