import { useEffect, useState } from 'react';
import { FaEnvelope, FaKey } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SolicitacaoAcessoAccordion } from '../components/login/SolicitacaoAcessoAccordion';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { autenticacaoServico } from '../services/autenticacaoServico';
import { extrairMensagemErro } from '../utils/erros';

const USUARIOS_TESTE_DESENVOLVIMENTO = import.meta.env.DEV
  ? [
      { email: 'admin@teste.com', nome: 'Administrador' },
      { email: 'organizador@teste.com', nome: 'Organizador' },
      { email: 'atleta@teste.com', nome: 'Atleta' }
    ]
  : [];
const EMAIL_LOGIN_DESENVOLVIMENTO = USUARIOS_TESTE_DESENVOLVIMENTO[0]?.email || '';

export function PaginaLogin() {
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState(EMAIL_LOGIN_DESENVOLVIMENTO);
  const [codigoLogin, setCodigoLogin] = useState('');
  const [codigoRedefinicao, setCodigoRedefinicao] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [carregandoCodigo, setCarregandoCodigo] = useState(false);
  const [codigoLoginEnviado, setCodigoLoginEnviado] = useState(false);

  const { solicitarCodigoLogin, entrarComCodigo, token, rotaInicial } = useAutenticacao();
  const navegar = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token) {
      navegar(rotaInicial, { replace: true });
    }
  }, [token, rotaInicial, navegar]);

  const emModoRecuperacao = modo === 'recuperacao';

  function alterarModo(novoModo) {
    setModo(novoModo);
    setErro('');
    setMensagem('');
    setCodigoLogin('');
    setCodigoLoginEnviado(false);
    setCodigoRedefinicao('');
    setNovaSenha('');
  }

  function selecionarUsuarioTeste(emailTeste) {
    setEmail(emailTeste);
    setErro('');
    setMensagem('');
    setCodigoLogin('');
    setCodigoLoginEnviado(false);
    setCodigoRedefinicao('');
    setNovaSenha('');
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      if (emModoRecuperacao) {
        await autenticacaoServico.redefinirSenha({
          email,
          codigo: codigoRedefinicao,
          novaSenha
        });
        setMensagem('Senha redefinida com sucesso. Faça login com a nova senha.');
        setModo('login');
        setCodigoRedefinicao('');
        setNovaSenha('');
      } else {
        await entrarComCodigo(email, codigoLogin);
      }

      if (!emModoRecuperacao) {
        navegar(rotaInicial, { replace: true });
      }
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  async function aoSolicitarCodigo() {
    setErro('');
    setMensagem('');
    setCarregandoCodigo(true);

    try {
      const resposta = emModoRecuperacao
        ? await autenticacaoServico.solicitarRedefinicaoSenha({ email })
        : await solicitarCodigoLogin(email);

      if (!emModoRecuperacao && resposta.codigoDesenvolvimento) {
        setCodigoLogin(resposta.codigoDesenvolvimento);
        setMensagem(`${resposta.mensagem} Código de desenvolvimento: ${resposta.codigoDesenvolvimento}`);
      } else {
        setMensagem(resposta.mensagem);
      }

      if (!emModoRecuperacao) {
        setCodigoLoginEnviado(true);
      }
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregandoCodigo(false);
    }
  }

  return (
    <section className="pagina-login">
      <div className="painel-login">
        <div className="login-card-cabecalho">
          <span>QuebraNunca Futevôlei</span>
          <h1>Entrar na plataforma</h1>
          <p>Digite seu e-mail para receber o código de acesso.</p>
        </div>

        {location.state?.mensagem && (
          <div className="feedback sucesso">
            {location.state.mensagem}
          </div>
        )}
        
        {USUARIOS_TESTE_DESENVOLVIMENTO.length > 0 && (
          <div className="acoes-formulario">
            {USUARIOS_TESTE_DESENVOLVIMENTO.map((usuarioTeste) => (
              <button
                key={usuarioTeste.email}
                type="button"
                className="botao-secundario"
                onClick={() => selecionarUsuarioTeste(usuarioTeste.email)}
                disabled={carregando || carregandoCodigo}
              >
                {usuarioTeste.nome}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={aoSubmeter} className="formulario-grid unico">
          <label className="campo-login-icone">
            E-mail
            <span>
              <FaEnvelope aria-hidden="true" />
              <input
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="voce@email.com"
                required
              />
            </span>
          </label>

          {!emModoRecuperacao && (
            <>
              <div className="acoes-formulario login-acoes-codigo">
                <button
                  type="button"
                  className="botao-secundario"
                  onClick={aoSolicitarCodigo}
                  disabled={carregandoCodigo || carregando}
                >
                  {carregandoCodigo
                    ? 'Enviando código...'
                    : (codigoLoginEnviado ? 'Reenviar código' : 'Enviar código')}
                </button>
              </div>

              <label className="campo-login-icone">
                Código de acesso
                <span>
                  <FaKey aria-hidden="true" />
                  <input
                    type="text"
                    value={codigoLogin}
                    onChange={(evento) => setCodigoLogin(evento.target.value)}
                    placeholder="Digite o código recebido por e-mail"
                    required
                  />
                </span>
              </label>
            </>
          )}

          {emModoRecuperacao && (
            <>
              <div className="acoes-formulario">
                <button
                  type="button"
                  className="botao-secundario"
                  onClick={aoSolicitarCodigo}
                  disabled={carregandoCodigo || carregando}
                >
                  {carregandoCodigo ? 'Enviando código...' : 'Enviar código'}
                </button>
              </div>

              <label className="campo-login-icone">
                Código de redefinição
                <span>
                  <FaKey aria-hidden="true" />
                  <input
                    type="text"
                    value={codigoRedefinicao}
                    onChange={(evento) => setCodigoRedefinicao(evento.target.value)}
                    placeholder="Digite o código recebido"
                    required
                  />
                </span>
              </label>

              <label>
                Nova senha
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(evento) => setNovaSenha(evento.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </label>
            </>
          )}

          {erro && <p className="texto-erro">{erro}</p>}
          {mensagem && <p className="texto-sucesso">{mensagem}</p>}

          <button type="submit" className="botao-primario" disabled={carregando}>
            {carregando
              ? (emModoRecuperacao ? 'Redefinindo...' : 'Entrando...')
              : (emModoRecuperacao ? 'Redefinir senha' : 'Entrar')}
          </button>          
        </form>

        <p className="login-link-privacidade">
          Ao acessar, consulte a <Link to="/privacidade">Política de Privacidade</Link>.
        </p>
      </div>

      <SolicitacaoAcessoAccordion />
    </section>
  );
}
