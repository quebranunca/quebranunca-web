import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { PaginaUsuarios } from './PaginaUsuarios';
import { PERFIS_USUARIO } from '../utils/perfis';

const mocks = vi.hoisted(() => ({
  usuarioLogado: {
    id: 'admin-logado',
    nome: 'Admin',
    perfil: 1
  },
  listarUsuarios: vi.fn(),
  atualizarUsuario: vi.fn(),
  excluirUsuario: vi.fn(),
  buscarAtletas: vi.fn()
}));

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    usuario: mocks.usuarioLogado
  })
}));

vi.mock('../services/usuariosServico', () => ({
  usuariosServico: {
    listar: mocks.listarUsuarios,
    atualizar: mocks.atualizarUsuario,
    excluirPorAdministrador: mocks.excluirUsuario
  }
}));

vi.mock('../services/atletasServico', () => ({
  atletasServico: {
    buscar: mocks.buscarAtletas
  }
}));

beforeEach(() => {
  mocks.usuarioLogado = {
    id: 'admin-logado',
    nome: 'Admin',
    perfil: PERFIS_USUARIO.administrador
  };
  mocks.listarUsuarios.mockReset();
  mocks.atualizarUsuario.mockReset();
  mocks.excluirUsuario.mockReset();
  mocks.buscarAtletas.mockReset();
  mocks.listarUsuarios.mockResolvedValue([
    {
      id: 'usuario-organizador',
      nome: 'Organizador QN',
      email: 'organizador@example.com',
      perfil: PERFIS_USUARIO.organizador,
      ativo: true,
      atletaId: null,
      atleta: null
    },
    {
      id: 'usuario-admin',
      nome: 'Admin QN',
      email: 'admin@example.com',
      perfil: PERFIS_USUARIO.administrador,
      ativo: true,
      atletaId: null,
      atleta: null
    }
  ]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PaginaUsuarios', () => {
  it('não oferece promoção para Administrador em cadastros comuns', async () => {
    render(<PaginaUsuarios />);

    await waitFor(() => {
      expect(screen.getByText('Organizador QN')).toBeInTheDocument();
      expect(screen.getByText('Admin QN')).toBeInTheDocument();
    });

    const cartaoOrganizador = screen.getByText('Organizador QN').closest('article');
    const cartaoAdmin = screen.getByText('Admin QN').closest('article');

    expect(cartaoOrganizador).not.toBeNull();
    expect(cartaoAdmin).not.toBeNull();

    const perfilOrganizador = within(cartaoOrganizador).getByLabelText('Perfil');
    const perfilAdmin = within(cartaoAdmin).getByLabelText('Perfil');

    expect(within(perfilOrganizador).queryByRole('option', { name: 'Administrador' })).not.toBeInTheDocument();
    expect(within(perfilOrganizador).getByRole('option', { name: 'Organizador' })).toBeInTheDocument();
    expect(within(perfilOrganizador).getByRole('option', { name: 'Atleta' })).toBeInTheDocument();

    expect(within(perfilAdmin).getByRole('option', { name: 'Administrador' })).toBeInTheDocument();
  });
});
