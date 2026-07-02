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
  criarSenhaComToken: vi.fn(),
  entrarComSenha: vi.fn()
}));

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    iniciarAcesso: mocks.iniciarAcesso,
    confirmarCodigoAcesso: mocks.confirmarCodigoAcesso,
    completarCadastroPublico: mocks.completarCadastroPublico,
    criarSenhaComToken: mocks.criarSenhaComToken,
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
    status: 'CadastroNovoCodigoEnviado',
    mensagem: 'Enviamos um código para confirmar seu e-mail.',
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
  mocks.criarSenhaComToken.mockReset();
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
      status: 'CadastroNovoCodigoEnviado',
      mensagem: 'Enviamos um código para confirmar seu e-mail.',
      podeEntrarComSenha: false,
      cadastroNovo: true
    });

    renderizar();
    await preencherEmailEContinuar('PESSOA@EXAMPLE.COM');

    expect(mocks.iniciarAcesso).toHaveBeenCalledWith('PESSOA@EXAMPLE.COM');
    expect(await screen.findByRole('heading', { name: /Confira seu e-mail/i })).toBeInTheDocument();
  });

  it('valida formato básico de e-mail antes de iniciar acesso', async () => {
    renderizar();

    const usuario = userEvent.setup();
    await usuario.type(screen.getByLabelText(/^E-mail$/i), 'email-invalido');
    fireEvent.submit(screen.getByRole('button', { name: /Continuar/i }).closest('form'));

    expect(await screen.findByText(/Informe um e-mail válido/i)).toBeInTheDocument();
    expect(mocks.iniciarAcesso).not.toHaveBeenCalled();
  });

  it('não mostra nem preenche código de desenvolvimento na tela pública', async () => {
    mocks.iniciarAcesso.mockResolvedValue({
      status: 'CadastroNovoCodigoEnviado',
      mensagem: 'Enviamos um código para confirmar seu e-mail.',
      podeEntrarComSenha: false,
      cadastroNovo: true,
      codigoDesenvolvimento: '123456'
    });

    renderizar();
    await preencherEmailEContinuar('novo@example.com');

    const campoCodigo = await screen.findByLabelText(/Código de acesso/i);
    expect(campoCodigo).toHaveValue('');
    expect(screen.queryByText(/Código de desenvolvimento/i)).not.toBeInTheDocument();
  });

  it('confirma código pelo endpoint novo', async () => {
    mocks.iniciarAcesso.mockResolvedValue({
      status: 'CadastroNovoCodigoEnviado',
      mensagem: 'Código enviado.',
      podeEntrarComSenha: false,
      cadastroNovo: true
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

    expect(mocks.confirmarCodigoAcesso).toHaveBeenCalledWith('atleta@example.com', '123456', 'CadastroPublico');
  });

  it('mostra erro amigável quando o código é inválido ou expirado', async () => {
    mocks.iniciarAcesso.mockResolvedValue({
      status: 'CadastroNovoCodigoEnviado',
      mensagem: 'Código enviado.',
      podeEntrarComSenha: false,
      cadastroNovo: true
    });
    mocks.confirmarCodigoAcesso.mockRejectedValue({
      response: {
        data: {
          erro: 'Código de acesso inválido ou expirado.'
        }
      }
    });

    renderizar();
    const usuario = await preencherEmailEContinuar('atleta@example.com');
    await screen.findByRole('heading', { name: /Confira seu e-mail/i });
    await usuario.type(screen.getByLabelText(/Código de acesso/i), '000000');
    await usuario.click(screen.getByRole('button', { name: /Confirmar código/i }));

    expect(await screen.findByText(/Código de acesso inválido ou expirado/i)).toBeInTheDocument();
  });

  it('cadastro novo exige nome, senha, termos, política e declaração 18+', async () => {
    renderizar();
    await chegarAoCadastroPublico();

    fireEvent.submit(screen.getByRole('button', { name: /Criar conta e entrar/i }).closest('form'));
    expect(await screen.findByText(/Informe como você quer aparecer no app/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/Como você quer aparecer/i), 'Gustavo');
    fireEvent.submit(screen.getByRole('button', { name: /Criar conta e entrar/i }).closest('form'));
    expect(await screen.findByText(/Crie uma senha para entrar/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/^Crie uma senha$/i), 'Senha123');
    await userEvent.type(screen.getByLabelText(/Confirme sua senha/i), 'Senha123');
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
    await usuario.type(screen.getByLabelText(/^Crie uma senha$/i), 'Senha123');
    await usuario.type(screen.getByLabelText(/Confirme sua senha/i), 'Senha123');
    await usuario.click(screen.getByLabelText(/Termos de Uso/i));
    await usuario.click(screen.getByLabelText(/18 anos ou mais/i));
    await usuario.click(screen.getByRole('button', { name: /Criar conta e entrar/i }));

    expect(mocks.completarCadastroPublico).toHaveBeenCalledWith(expect.objectContaining({
      cadastroToken: 'cadastro-token',
      nomeExibicao: 'Gustavo',
      senha: 'Senha123',
      confirmacaoSenha: 'Senha123',
      aceitouTermos: true,
      aceitouPoliticaPrivacidade: true,
      declarouMaiorDe18: true,
      aceitouMarketing: false
    }));
  });

  it('envia consentimento de marketing quando marcado', async () => {
    mocks.completarCadastroPublico.mockResolvedValue({
      token: 'token',
      refreshToken: 'refresh',
      usuario: { id: 'usuario-1' }
    });

    renderizar();
    const usuario = await chegarAoCadastroPublico();

    await usuario.type(screen.getByLabelText(/Como você quer aparecer/i), 'Gustavo');
    await usuario.type(screen.getByLabelText(/^Crie uma senha$/i), 'Senha123');
    await usuario.type(screen.getByLabelText(/Confirme sua senha/i), 'Senha123');
    await usuario.click(screen.getByLabelText(/Termos de Uso/i));
    await usuario.click(screen.getByLabelText(/18 anos ou mais/i));
    await usuario.click(screen.getByLabelText(/Quero receber novidades/i));
    await usuario.click(screen.getByRole('button', { name: /Criar conta e entrar/i }));

    expect(mocks.completarCadastroPublico).toHaveBeenCalledWith(expect.objectContaining({
      aceitouMarketing: true
    }));
  });

  it('usuário existente com senha acessa tela de senha', async () => {
    mocks.iniciarAcesso.mockResolvedValue({
      status: 'EntrarComSenha',
      mensagem: 'Digite sua senha para entrar.',
      podeEntrarComSenha: true,
      cadastroNovo: false
    });

    renderizar();
    await preencherEmailEContinuar('atleta@example.com');

    expect(await screen.findByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Entrar com código enviado por e-mail/i })).not.toBeInTheDocument();
  });

  it('usuário antigo sem senha confirma e-mail e cria senha antes de entrar', async () => {
    mocks.iniciarAcesso.mockResolvedValue({
      status: 'CriarSenhaNecessarioCodigoEnviado',
      mensagem: 'Encontramos sua conta. Para continuar, confirme seu e-mail e crie uma senha.',
      podeEntrarComSenha: false,
      cadastroNovo: false
    });
    mocks.confirmarCodigoAcesso.mockResolvedValue({
      status: 'CriarSenhaNecessario',
      senhaToken: 'senha-token',
      emailConfirmado: true
    });
    mocks.criarSenhaComToken.mockResolvedValue({
      token: 'token',
      refreshToken: 'refresh',
      usuario: { id: 'usuario-1' }
    });

    renderizar();
    const usuario = await preencherEmailEContinuar('atleta@example.com');

    expect(await screen.findByRole('heading', { name: /Encontramos sua conta/i })).toBeInTheDocument();
    await usuario.type(screen.getByLabelText(/Código de acesso/i), '123456');
    await usuario.click(screen.getByRole('button', { name: /Confirmar código/i }));

    expect(mocks.confirmarCodigoAcesso).toHaveBeenCalledWith('atleta@example.com', '123456', 'CriarSenhaPrimeiroAcesso');
    expect(await screen.findByRole('heading', { name: /Crie sua senha/i })).toBeInTheDocument();
    await usuario.type(screen.getByLabelText(/^Crie sua senha$/i), 'Senha123');
    await usuario.type(screen.getByLabelText(/Confirme sua senha/i), 'Senha123');
    await usuario.click(screen.getByRole('button', { name: /Criar senha e entrar/i }));

    expect(mocks.criarSenhaComToken).toHaveBeenCalledWith({
      senhaToken: 'senha-token',
      senha: 'Senha123',
      confirmacaoSenha: 'Senha123'
    });
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
