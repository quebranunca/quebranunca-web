import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PaginaLogin } from './PaginaLogin';
import { autenticacaoServico } from '../services/autenticacaoServico';

const mocks = vi.hoisted(() => ({
  iniciarAcesso: vi.fn(),
  confirmarCodigoAcesso: vi.fn(),
  completarCadastroPublico: vi.fn(),
  entrarComSenha: vi.fn()
}));

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    iniciarAcesso: mocks.iniciarAcesso,
    confirmarCodigoAcesso: mocks.confirmarCodigoAcesso,
    completarCadastroPublico: mocks.completarCadastroPublico,
    entrarComSenha: mocks.entrarComSenha,
    token: null,
    rotaInicial: '/app'
  })
}));

vi.mock('../services/autenticacaoServico', () => ({
  autenticacaoServico: {
    obterTermosVersaoAtual: vi.fn(),
    solicitarRedefinicaoSenha: vi.fn(),
    redefinirSenha: vi.fn()
  }
}));

function renderizar() {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <PaginaLogin />
    </MemoryRouter>
  );
}

async function preencherEmailEContinuar(email = 'novo@example.com') {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText(/^E-mail$/i), email);
  await usuario.click(screen.getByRole('button', { name: /Continuar/i }));
  return usuario;
}

async function chegarAoCadastroPublico() {
  mocks.iniciarAcesso.mockResolvedValue({
    status: 'CodigoEnviado',
    mensagem: 'Se o e-mail estiver correto, enviaremos as instruções de acesso.',
    podeEntrarComSenha: false,
    cadastroNovo: true
  });
  mocks.confirmarCodigoAcesso.mockResolvedValue({
    status: 'CadastroIncompleto',
    cadastroToken: 'cadastro-token',
    emailConfirmado: true
  });

  const usuario = await preencherEmailEContinuar();
  await screen.findByRole('heading', { name: /Confira seu e-mail/i });
  await usuario.type(screen.getByLabelText(/Código de acesso/i), '123456');
  await usuario.click(screen.getByRole('button', { name: /Confirmar código/i }));
  await screen.findByRole('heading', { name: /Complete seu cadastro/i });
  return usuario;
}

beforeEach(() => {
  autenticacaoServico.obterTermosVersaoAtual.mockResolvedValue({
    versaoTermos: '2026-05-18',
    urlTermos: '/privacidade',
    versaoPoliticaPrivacidade: '2026-05-18',
    urlPoliticaPrivacidade: '/privacidade'
  });
  mocks.iniciarAcesso.mockReset();
  mocks.confirmarCodigoAcesso.mockReset();
  mocks.completarCadastroPublico.mockReset();
  mocks.entrarComSenha.mockReset();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PaginaLogin - entrar ou criar conta', () => {
  it('mostra tela inicial sem depender de convite', () => {
    renderizar();

    expect(screen.getByRole('heading', { name: /Entrar no QuebraNunca/i })).toBeInTheDocument();
    expect(screen.getByText(/Use seu e-mail para entrar ou criar sua conta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^E-mail$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar/i })).toBeInTheDocument();
    expect(screen.queryByText(/convite/i)).not.toBeInTheDocument();
  });

  it('chama iniciar acesso ao continuar com e-mail', async () => {
    mocks.iniciarAcesso.mockResolvedValue({
      status: 'CodigoEnviado',
      mensagem: 'Se o e-mail estiver correto, enviaremos as instruções de acesso.',
      podeEntrarComSenha: false,
      cadastroNovo: true
    });

    renderizar();
    await preencherEmailEContinuar('PESSOA@EXAMPLE.COM');

    expect(mocks.iniciarAcesso).toHaveBeenCalledWith('PESSOA@EXAMPLE.COM');
    expect(await screen.findByRole('heading', { name: /Confira seu e-mail/i })).toBeInTheDocument();
  });

  it('confirma código pelo endpoint novo', async () => {
    mocks.iniciarAcesso.mockResolvedValue({
      status: 'CodigoEnviado',
      mensagem: 'Código enviado.',
      podeEntrarComSenha: false,
      cadastroNovo: false
    });
    mocks.confirmarCodigoAcesso.mockResolvedValue({
      status: 'Autenticado',
      token: 'token',
      refreshToken: 'refresh',
      usuario: { id: 'usuario-1' }
    });

    renderizar();
    const usuario = await preencherEmailEContinuar('atleta@example.com');
    await screen.findByRole('heading', { name: /Confira seu e-mail/i });
    await usuario.type(screen.getByLabelText(/Código de acesso/i), '123456');
    await usuario.click(screen.getByRole('button', { name: /Confirmar código/i }));

    expect(mocks.confirmarCodigoAcesso).toHaveBeenCalledWith('atleta@example.com', '123456');
  });

  it('cadastro novo exige nome, termos, política e declaração 18+', async () => {
    renderizar();
    await chegarAoCadastroPublico();

    fireEvent.submit(screen.getByRole('button', { name: /Criar conta e entrar/i }).closest('form'));
    expect(await screen.findByText(/Informe como você quer aparecer no app/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/Como você quer aparecer/i), 'Gustavo');
    fireEvent.submit(screen.getByRole('button', { name: /Criar conta e entrar/i }).closest('form'));
    expect(await screen.findByText(/Termos de Uso e a Política de Privacidade/i)).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/Termos de Uso/i));
    fireEvent.submit(screen.getByRole('button', { name: /Criar conta e entrar/i }).closest('form'));
    expect(await screen.findByText(/É necessário declarar que você tem 18 anos ou mais/i)).toBeInTheDocument();
    expect(mocks.completarCadastroPublico).not.toHaveBeenCalled();
  });

  it('marketing é opcional no cadastro público', async () => {
    mocks.completarCadastroPublico.mockResolvedValue({
      token: 'token',
      refreshToken: 'refresh',
      usuario: { id: 'usuario-1' }
    });

    renderizar();
    const usuario = await chegarAoCadastroPublico();

    await usuario.type(screen.getByLabelText(/Como você quer aparecer/i), 'Gustavo');
    await usuario.click(screen.getByLabelText(/Termos de Uso/i));
    await usuario.click(screen.getByLabelText(/18 anos ou mais/i));
    await usuario.click(screen.getByRole('button', { name: /Criar conta e entrar/i }));

    expect(mocks.completarCadastroPublico).toHaveBeenCalledWith(expect.objectContaining({
      cadastroToken: 'cadastro-token',
      nomeExibicao: 'Gustavo',
      aceitouTermos: true,
      aceitouPoliticaPrivacidade: true,
      declarouMaiorDe18: true,
      aceitouMarketing: false
    }));
  });

  it('usuário existente com senha acessa tela de senha', async () => {
    mocks.iniciarAcesso.mockResolvedValue({
      status: 'CodigoEnviado',
      mensagem: 'Código enviado.',
      podeEntrarComSenha: true,
      cadastroNovo: false
    });

    renderizar();
    await preencherEmailEContinuar('atleta@example.com');

    expect(await screen.findByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar com código enviado por e-mail/i })).toBeInTheDocument();
  });

  it('mostra erro amigável quando iniciar acesso falha', async () => {
    mocks.iniciarAcesso.mockRejectedValue({
      response: {
        data: {
          erro: 'E-mail inválido.'
        }
      }
    });

    renderizar();
    await preencherEmailEContinuar('pessoa@example.com');

    expect(await screen.findByText('E-mail inválido.')).toBeInTheDocument();
  });
});
