import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { CriarGrupoFluxoModal } from '../components/grupos/CriarGrupoFluxoModal';
import { gruposServico } from '../services/gruposServico';
import { PaginaCriarGrupo } from './PaginaCriarGrupo';

const notificacaoMock = vi.hoisted(() => ({
  showNotification: vi.fn()
}));

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    token: 'token-teste',
    usuario: {
      id: 'usuario-1',
      nome: 'Primo',
      atletaId: 'atleta-1',
      perfil: 3
    },
    estadoAcesso: 'Ativo'
  })
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: notificacaoMock.showNotification
  })
}));

vi.mock('../services/gruposServico', () => ({
  gruposServico: {
    verificarNome: vi.fn(),
    criar: vi.fn(),
    atualizarImagem: vi.fn()
  }
}));

vi.mock('../utils/compressaoImagem', () => ({
  comprimirImagemParaUpload: vi.fn(async (arquivo) => arquivo),
  ehImagemNaoSuportada: vi.fn(() => false),
  ehImagemPermitida: vi.fn(() => true)
}));

function LocalizacaoAtual() {
  const location = useLocation();
  const navigationType = useNavigationType();
  return (
    <>
      <span data-testid="rota-atual">{location.pathname}</span>
      <span data-testid="origem-atual">{location.state?.origem || ''}</span>
      <span data-testid="navegacao-atual">{navigationType}</span>
    </>
  );
}

function renderizarPagina(initialEntry = {
  pathname: '/app/grupos/criar',
  state: { origem: '/grupos' }
}) {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route path="/app/grupos/criar" element={<><PaginaCriarGrupo /><LocalizacaoAtual /></>} />
        <Route path="/grupos" element={<LocalizacaoAtual />} />
        <Route path="/grupos/:grupoId" element={<LocalizacaoAtual />} />
        <Route path="/admin/grupos" element={<LocalizacaoAtual />} />
      </Routes>
    </MemoryRouter>
  );
}

async function avancarAteConfirmacao(usuario, nome = 'Fechadinho de Quinta') {
  await usuario.type(screen.getByLabelText(/Nome do grupo/i), nome);
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
  await screen.findByText('Quem poderá encontrar este grupo?');
  await usuario.click(screen.getByRole('button', { name: /Público/i }));
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
  await screen.findByText('Escolha uma imagem para seu grupo');
  await usuario.click(screen.getByRole('button', { name: 'Pular' }));
  await screen.findByText('Confirme as informações');
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:grupo');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  document.documentElement.className = '';
  document.body.className = '';
});

describe('PaginaCriarGrupo', () => {
  it('renderiza como pagina sem dialog principal e sem bloqueio global de scroll', () => {
    renderizarPagina();

    expect(screen.getByRole('heading', { name: 'Criar grupo' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /Criar grupo/i })).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass('criar-grupo-wizard-aberto');
    expect(document.documentElement).not.toHaveClass('criar-grupo-wizard-aberto');
  });

  it('modal legado preserva dialog principal e bloqueio global', () => {
    render(
      <CriarGrupoFluxoModal
        aberto
        onFechar={vi.fn()}
        onCriado={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: /Criar grupo/i })).toBeInTheDocument();
    expect(document.body).toHaveClass('criar-grupo-wizard-aberto');
    expect(document.documentElement).toHaveClass('criar-grupo-wizard-aberto');
  });

  it('volta entre etapas sem sair da pagina', async () => {
    const usuario = userEvent.setup();
    gruposServico.verificarNome.mockResolvedValue({ similares: [] });
    renderizarPagina();

    await usuario.type(screen.getByLabelText(/Nome do grupo/i), 'Fechadinho');
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText('Quem poderá encontrar este grupo?')).toBeInTheDocument();
    await usuario.click(screen.getAllByRole('button', { name: 'Voltar' }).at(-1));

    expect(screen.getByText('Como seu grupo se chama?')).toBeInTheDocument();
    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/app/grupos/criar');
  });

  it('tentativa de sair com dados abre confirmacao como dialog', async () => {
    const usuario = userEvent.setup();
    renderizarPagina();

    await usuario.type(screen.getByLabelText(/Nome do grupo/i), 'Fechadinho');
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByRole('dialog', { name: /Deseja sair da criação do grupo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar editando' })).toBeInTheDocument();
  });

  it('usa origem interna valida ao sair na primeira etapa', async () => {
    const usuario = userEvent.setup();
    renderizarPagina({
      pathname: '/app/grupos/criar',
      state: { origem: '/admin/grupos' }
    });

    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/admin/grupos');
  });

  it('usa fallback /grupos quando origem externa e malformada for recebida', async () => {
    const usuario = userEvent.setup();
    renderizarPagina({
      pathname: '/app/grupos/criar',
      state: { origem: 'https://evil.test/grupos' }
    });

    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/grupos');
  });

  it('mostra grupos similares como dialog e permite continuar quando nao ha nome exato', async () => {
    const usuario = userEvent.setup();
    gruposServico.verificarNome.mockResolvedValue({
      existeExato: false,
      similares: [{ id: 'grupo-1', nome: 'Fechadinho Quinta', quantidadeAtletas: 8, privacidade: 'Privado' }]
    });
    renderizarPagina();

    await usuario.type(screen.getByLabelText(/Nome do grupo/i), 'Fechadinho de Quinta');
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));

    const similares = await screen.findByRole('dialog', { name: /Encontramos grupos parecidos/i });
    expect(within(similares).getByText('Fechadinho Quinta')).toBeInTheDocument();

    await usuario.click(within(similares).getByRole('button', { name: 'Continuar mesmo assim' }));
    expect(await screen.findByText('Quem poderá encontrar este grupo?')).toBeInTheDocument();
  });

  it('cria grupo e navega com replace para o detalhe', async () => {
    const usuario = userEvent.setup();
    gruposServico.verificarNome.mockResolvedValue({ similares: [] });
    gruposServico.criar.mockResolvedValue({
      id: 'grupo-novo',
      nome: 'Fechadinho de Quinta',
      privacidade: 'Público'
    });
    renderizarPagina();

    await avancarAteConfirmacao(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Criar grupo' }));

    expect(await screen.findByTestId('rota-atual')).toHaveTextContent('/grupos/grupo-novo');
    expect(screen.getByTestId('navegacao-atual')).toHaveTextContent('REPLACE');
    expect(gruposServico.criar).toHaveBeenCalledWith(expect.objectContaining({
      nome: 'Fechadinho de Quinta',
      privacidade: 'Público',
      localPrincipal: null,
      diasDaSemana: []
    }));
  });

  it('falha de upload nao dispara segunda criacao e permite concluir', async () => {
    const usuario = userEvent.setup();
    const arquivo = new File(['foto'], 'grupo.png', { type: 'image/png' });
    gruposServico.verificarNome.mockResolvedValue({ similares: [] });
    gruposServico.criar.mockResolvedValue({
      id: 'grupo-com-foto',
      nome: 'Grupo com Foto',
      privacidade: 'Privado'
    });
    gruposServico.atualizarImagem.mockRejectedValue(new Error('Falha no upload'));
    renderizarPagina();

    await usuario.type(screen.getByLabelText(/Nome do grupo/i), 'Grupo com Foto');
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    await screen.findByText('Quem poderá encontrar este grupo?');
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    await screen.findByText('Escolha uma imagem para seu grupo');
    await usuario.upload(document.querySelector('input[type="file"]'), arquivo);
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
    await screen.findByText('Confirme as informações');
    await usuario.click(screen.getByRole('button', { name: 'Criar grupo' }));

    expect(await screen.findByText(/Grupo criado, mas não foi possível enviar a foto/i)).toBeInTheDocument();
    expect(gruposServico.criar).toHaveBeenCalledTimes(1);

    await usuario.click(screen.getByRole('button', { name: 'Abrir grupo' }));

    await waitFor(() => expect(gruposServico.criar).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/grupos/grupo-com-foto');
  });
});
