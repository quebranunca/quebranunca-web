import { useEffect, useRef, useState } from 'react';
import { FaEnvelope, FaKey, FaLock, FaUser } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { EmailDomainSuggestions } from '../components/formularios/EmailDomainSuggestions';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { autenticacaoServico } from '../services/autenticacaoServico';
import { extrairMensagemErro } from '../utils/erros';
import { aoPressionarEnterParaProximo, focusNextField, scrollFocusedInputIntoView } from '../utils/tecladoMobile';

const ETAPAS = {
  email: 'email',
  senha: 'senha',
  codigo: 'codigo',
  cadastro: 'cadastro',
  recuperacao: 'recuperacao'
};

const TERMOS_PADRAO = {
  versaoTermos: '2026-05-18',
  urlTermos: '/privacidade',
  versaoPoliticaPrivacidade: '2026-05-18',
  urlPoliticaPrivacidade: '/privacidade'
};

function emailPareceValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || '').trim());
}

export function PaginaLogin() {
  const [etapa, setEtapa] = useState(ETAPAS.email);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [codigoRedefinicao, setCodigoRedefinicao] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [cadastroToken, setCadastroToken] = useState('');
  const [nomeExibicao, setNomeExibicao] = useState('');
  const [apelido, setApelido] = useState('');
  const [aceitouDocumentos, setAceitouDocumentos] = useState(false);
  const [declarouMaiorDe18, setDeclarouMaiorDe18] = useState(false);
  const [aceitouMarketing, setAceitouMarketing] = useState(false);
  const [termos, setTermos] = useState(TERMOS_PADRAO);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [carregandoCodigo, setCarregandoCodigo] = useState(false);
  const [cooldownReenvio, setCooldownReenvio] = useState(0);

  const {
    iniciarAcesso,
    confirmarCodigoAcesso,
    completarCadastroPublico,
    entrarComSenha,
    token,
    rotaInicial
  } = useAutenticacao();
  const navegar = useNavigate();
  const location = useLocation();
  const emailRef = useRef(null);
  const senhaRef = useRef(null);
  const codigoRef = useRef(null);
  const codigoRedefinicaoRef = useRef(null);
  const novaSenhaRef = useRef(null);
  const nomeRef = useRef(null);

  const emRecuperacao = etapa === ETAPAS.recuperacao;
  const podeReenviar = cooldownReenvio <= 0 && !carregandoCodigo && !carregando;

  useEffect(() => {
    if (token) {
      navegar(rotaInicial, { replace: true });
    }
  }, [token, rotaInicial, navegar]);

  useEffect(() => {
    async function carregarTermos() {
      try {
        const resposta = await autenticacaoServico.obterTermosVersaoAtual();
        setTermos({
          versaoTermos: resposta.versaoTermos || TERMOS_PADRAO.versaoTermos,
          urlTermos: resposta.urlTermos || TERMOS_PADRAO.urlTermos,
          versaoPoliticaPrivacidade: resposta.versaoPoliticaPrivacidade || TERMOS_PADRAO.versaoPoliticaPrivacidade,
          urlPoliticaPrivacidade: resposta.urlPoliticaPrivacidade || TERMOS_PADRAO.urlPoliticaPrivacidade
        });
      } catch {
        setTermos(TERMOS_PADRAO);
      }
    }

    carregarTermos();
  }, []);

  useEffect(() => {
    if (cooldownReenvio <= 0) {
      return undefined;
    }

    const temporizador = setTimeout(() => {
      setCooldownReenvio((valorAtual) => Math.max(valorAtual - 1, 0));
    }, 1000);

    return () => clearTimeout(temporizador);
  }, [cooldownReenvio]);

  function iniciarCooldownReenvio() {
    setCooldownReenvio(30);
  }

  function mostrarMensagemEnvio(resposta) {
    setMensagem(resposta?.mensagem || 'Enviamos um código de acesso para seu e-mail.');
  }

  function voltarParaEmail() {
    setEtapa(ETAPAS.email);
    setErro('');
    setMensagem('');
    setSenha('');
    setCodigo('');
    setCadastroToken('');
    setNomeExibicao('');
    setApelido('');
    setAceitouDocumentos(false);
    setDeclarouMaiorDe18(false);
    setAceitouMarketing(false);
  }

  async function aoContinuarEmail(evento) {
    evento.preventDefault();
    setErro('');
    setMensagem('');

    if (!emailPareceValido(email)) {
      setErro('Informe um e-mail válido.');
      return;
    }

    setCarregando(true);
    try {
      const resposta = await iniciarAcesso(email.trim());
      mostrarMensagemEnvio(resposta);
      iniciarCooldownReenvio();
      setEtapa(resposta?.podeEntrarComSenha ? ETAPAS.senha : ETAPAS.codigo);
      setTimeout(() => {
        if (resposta?.podeEntrarComSenha) {
          senhaRef.current?.focus();
          return;
        }
        codigoRef.current?.focus();
      }, 0);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  async function aoEntrarComSenha(evento) {
    evento.preventDefault();
    setErro('');

    if (!senha.trim()) {
      setErro('Informe sua senha.');
      return;
    }

    setCarregando(true);
    try {
      await entrarComSenha(email.trim(), senha);
      navegar(rotaInicial, { replace: true });
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  async function aoConfirmarCodigo(evento) {
    evento.preventDefault();
    setErro('');

    if (!codigo.trim()) {
      setErro('Informe o código recebido por e-mail.');
      return;
    }

    setCarregando(true);
    try {
      const resposta = await confirmarCodigoAcesso(email.trim(), codigo.trim());
      if (resposta?.status === 'Autenticado') {
        navegar(rotaInicial, { replace: true });
        return;
      }

      if (resposta?.status === 'CadastroIncompleto' && resposta?.cadastroToken) {
        setCadastroToken(resposta.cadastroToken);
        setMensagem('');
        setEtapa(ETAPAS.cadastro);
        setTimeout(() => nomeRef.current?.focus(), 0);
        return;
      }

      setErro('Não foi possível concluir o acesso. Solicite um novo código.');
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  async function aoReenviarCodigo() {
    if (!podeReenviar) {
      return;
    }

    setErro('');
    setMensagem('');
    setCarregandoCodigo(true);
    try {
      const resposta = await iniciarAcesso(email.trim());
      mostrarMensagemEnvio(resposta);
      iniciarCooldownReenvio();
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregandoCodigo(false);
    }
  }

  async function aoCompletarCadastro(evento) {
    evento.preventDefault();
    setErro('');

    if (!nomeExibicao.trim()) {
      setErro('Informe como você quer aparecer no app.');
      return;
    }

    if (!aceitouDocumentos) {
      setErro('É necessário aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }

    if (!declarouMaiorDe18) {
      setErro('É necessário declarar que você tem 18 anos ou mais.');
      return;
    }

    setCarregando(true);
    try {
      await completarCadastroPublico({
        cadastroToken,
        nomeExibicao: nomeExibicao.trim(),
        apelido: apelido.trim() || null,
        aceitouTermos: aceitouDocumentos,
        versaoTermos: termos.versaoTermos,
        aceitouPoliticaPrivacidade: aceitouDocumentos,
        versaoPoliticaPrivacidade: termos.versaoPoliticaPrivacidade,
        declarouMaiorDe18,
        aceitouMarketing
      });
      navegar('/app', { replace: true });
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  async function aoSolicitarRedefinicao() {
    setErro('');
    setMensagem('');

    if (!emailPareceValido(email)) {
      setErro('Informe um e-mail válido.');
      return;
    }

    setCarregandoCodigo(true);
    try {
      const resposta = await autenticacaoServico.solicitarRedefinicaoSenha({ email: email.trim() });
      setMensagem(resposta.mensagem);
      setTimeout(() => codigoRedefinicaoRef.current?.focus(), 0);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregandoCodigo(false);
    }
  }

  async function aoRedefinirSenha(evento) {
    evento.preventDefault();
    setErro('');

    setCarregando(true);
    try {
      await autenticacaoServico.redefinirSenha({
        email: email.trim(),
        codigo: codigoRedefinicao.trim(),
        novaSenha
      });
      setMensagem('Senha redefinida com sucesso. Faça login com a nova senha.');
      setEtapa(ETAPAS.senha);
      setSenha('');
      setCodigoRedefinicao('');
      setNovaSenha('');
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  function renderizarFormularioEmail() {
    return (
      <form onSubmit={aoContinuarEmail} className="formulario-grid unico">
        <label className="campo-login-icone">
          E-mail
          <span>
            <FaEnvelope aria-hidden="true" />
            <input
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              enterKeyHint="done"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              onFocus={scrollFocusedInputIntoView}
              placeholder="voce@email.com"
              required
            />
          </span>
          <EmailDomainSuggestions valor={email} onChange={setEmail} inputRef={emailRef} proximoRef={emailRef} />
        </label>

        {erro && <p className="texto-erro">{erro}</p>}
        {mensagem && <p className="texto-sucesso">{mensagem}</p>}

        <button type="submit" className="botao-primario" disabled={carregando}>
          {carregando ? 'Continuando...' : 'Continuar'}
        </button>

        <button
          type="button"
          className="botao-link login-recuperacao-link"
          onClick={() => {
            setEtapa(ETAPAS.recuperacao);
            setErro('');
            setMensagem('');
          }}
          disabled={carregando}
        >
          Esqueci minha senha
        </button>
      </form>
    );
  }

  function renderizarFormularioSenha() {
    return (
      <form onSubmit={aoEntrarComSenha} className="formulario-grid unico">
        <label className="campo-login-icone">
          Senha
          <span>
            <FaLock aria-hidden="true" />
            <input
              ref={senhaRef}
              type="password"
              autoComplete="current-password"
              enterKeyHint="done"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              onFocus={scrollFocusedInputIntoView}
              placeholder="Digite sua senha"
              required
            />
          </span>
        </label>

        {erro && <p className="texto-erro">{erro}</p>}
        {mensagem && <p className="texto-sucesso">{mensagem}</p>}

        <button type="submit" className="botao-primario" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>

        <button
          type="button"
          className="botao-secundario"
          onClick={() => setEtapa(ETAPAS.codigo)}
          disabled={carregando}
        >
          Entrar com código enviado por e-mail
        </button>

        <div className="login-acoes-secundarias">
          <button type="button" className="botao-link" onClick={voltarParaEmail} disabled={carregando}>
            Usar outro e-mail
          </button>
          <button
            type="button"
            className="botao-link"
            onClick={() => {
              setEtapa(ETAPAS.recuperacao);
              setErro('');
              setMensagem('');
            }}
            disabled={carregando}
          >
            Esqueci minha senha
          </button>
        </div>
      </form>
    );
  }

  function renderizarFormularioCodigo() {
    return (
      <form onSubmit={aoConfirmarCodigo} className="formulario-grid unico">
        <label className="campo-login-icone">
          Código de acesso
          <span>
            <FaKey aria-hidden="true" />
            <input
              ref={codigoRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              enterKeyHint="done"
              value={codigo}
              onChange={(evento) => setCodigo(evento.target.value)}
              onFocus={scrollFocusedInputIntoView}
              placeholder="Digite o código recebido por e-mail"
              required
            />
          </span>
        </label>

        {erro && <p className="texto-erro">{erro}</p>}
        {mensagem && <p className="texto-sucesso">{mensagem}</p>}

        <button type="submit" className="botao-primario" disabled={carregando}>
          {carregando ? 'Confirmando...' : 'Confirmar código'}
        </button>

        <button
          type="button"
          className="botao-secundario"
          onClick={aoReenviarCodigo}
          disabled={!podeReenviar}
        >
          {carregandoCodigo
            ? 'Reenviando...'
            : cooldownReenvio > 0
              ? `Reenviar em ${cooldownReenvio}s`
              : 'Reenviar código'}
        </button>

        <button type="button" className="botao-link login-recuperacao-link" onClick={voltarParaEmail} disabled={carregando}>
          Usar outro e-mail
        </button>
      </form>
    );
  }

  function renderizarFormularioCadastro() {
    return (
      <form onSubmit={aoCompletarCadastro} className="formulario-grid unico">
        <label className="campo-login-icone">
          Como você quer aparecer no app?
          <span>
            <FaUser aria-hidden="true" />
            <input
              ref={nomeRef}
              type="text"
              autoComplete="name"
              enterKeyHint="next"
              value={nomeExibicao}
              onChange={(evento) => setNomeExibicao(evento.target.value)}
              onFocus={scrollFocusedInputIntoView}
              onKeyDown={(evento) => aoPressionarEnterParaProximo(evento, () => focusNextField(codigoRef))}
              placeholder="Seu nome de exibição"
              required
            />
          </span>
        </label>

        <label className="campo-login-icone">
          Apelido
          <span>
            <FaUser aria-hidden="true" />
            <input
              type="text"
              autoComplete="nickname"
              value={apelido}
              onChange={(evento) => setApelido(evento.target.value)}
              onFocus={scrollFocusedInputIntoView}
              placeholder="Opcional"
            />
          </span>
        </label>

        <label className="campo-checkbox">
          <input
            type="checkbox"
            checked={aceitouDocumentos}
            onChange={(evento) => setAceitouDocumentos(evento.target.checked)}
            required
          />
          <span>
            Li e aceito os <Link to={termos.urlTermos} target="_blank" rel="noreferrer">Termos de Uso</Link> e a{' '}
            <Link to={termos.urlPoliticaPrivacidade} target="_blank" rel="noreferrer">Política de Privacidade</Link>.
          </span>
        </label>

        <label className="campo-checkbox">
          <input
            type="checkbox"
            checked={declarouMaiorDe18}
            onChange={(evento) => setDeclarouMaiorDe18(evento.target.checked)}
            required
          />
          <span>Declaro que tenho 18 anos ou mais.</span>
        </label>

        <label className="campo-checkbox">
          <input
            type="checkbox"
            checked={aceitouMarketing}
            onChange={(evento) => setAceitouMarketing(evento.target.checked)}
          />
          <span>Quero receber novidades, eventos e campanhas do QuebraNunca.</span>
        </label>

        {erro && <p className="texto-erro">{erro}</p>}
        {mensagem && <p className="texto-sucesso">{mensagem}</p>}

        <button type="submit" className="botao-primario" disabled={carregando}>
          {carregando ? 'Criando conta...' : 'Criar conta e entrar'}
        </button>
      </form>
    );
  }

  function renderizarFormularioRecuperacao() {
    return (
      <form onSubmit={aoRedefinirSenha} className="formulario-grid unico">
        <label className="campo-login-icone">
          E-mail
          <span>
            <FaEnvelope aria-hidden="true" />
            <input
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              enterKeyHint="next"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              onFocus={scrollFocusedInputIntoView}
              onKeyDown={(evento) => aoPressionarEnterParaProximo(evento, () => focusNextField(codigoRedefinicaoRef))}
              placeholder="voce@email.com"
              required
            />
          </span>
          <EmailDomainSuggestions valor={email} onChange={setEmail} inputRef={emailRef} proximoRef={codigoRedefinicaoRef} />
        </label>

        <div className="acoes-formulario login-acoes-codigo">
          <button
            type="button"
            className="botao-secundario"
            onClick={aoSolicitarRedefinicao}
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
              ref={codigoRedefinicaoRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              enterKeyHint="next"
              value={codigoRedefinicao}
              onChange={(evento) => setCodigoRedefinicao(evento.target.value)}
              onFocus={scrollFocusedInputIntoView}
              onKeyDown={(evento) => aoPressionarEnterParaProximo(evento, () => focusNextField(novaSenhaRef))}
              placeholder="Digite o código recebido"
              required
            />
          </span>
        </label>

        <label className="campo-login-icone">
          Nova senha
          <span>
            <FaLock aria-hidden="true" />
            <input
              ref={novaSenhaRef}
              type="password"
              autoComplete="new-password"
              enterKeyHint="done"
              value={novaSenha}
              onChange={(evento) => setNovaSenha(evento.target.value)}
              onFocus={scrollFocusedInputIntoView}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </span>
        </label>

        {erro && <p className="texto-erro">{erro}</p>}
        {mensagem && <p className="texto-sucesso">{mensagem}</p>}

        <button type="submit" className="botao-primario" disabled={carregando}>
          {carregando ? 'Redefinindo...' : 'Redefinir senha'}
        </button>

        <button type="button" className="botao-link login-recuperacao-link" onClick={voltarParaEmail} disabled={carregando || carregandoCodigo}>
          Voltar ao login
        </button>
      </form>
    );
  }

  const titulo = etapa === ETAPAS.codigo
    ? 'Confira seu e-mail'
    : etapa === ETAPAS.cadastro
      ? 'Complete seu cadastro'
      : etapa === ETAPAS.recuperacao
        ? 'Redefinir senha'
        : 'Entrar no QuebraNunca';

  const subtitulo = etapa === ETAPAS.codigo
    ? 'Enviamos um código de acesso para seu e-mail.'
    : etapa === ETAPAS.cadastro
      ? 'Só precisamos dessas informações para criar seu perfil no QuebraNunca.'
      : emRecuperacao
        ? 'Redefina sua senha com o código recebido por e-mail.'
        : 'Use seu e-mail para entrar ou criar sua conta.';

  return (
    <section className="pagina-login">
      <div className="painel-login">
        <div className="login-card-cabecalho">
          <span>QuebraNunca Futevôlei</span>
          <h1>{titulo}</h1>
          <p>{subtitulo}</p>
        </div>

        {location.state?.mensagem && (
          <div className="feedback sucesso">
            {location.state.mensagem}
          </div>
        )}

        {etapa === ETAPAS.email && renderizarFormularioEmail()}
        {etapa === ETAPAS.senha && renderizarFormularioSenha()}
        {etapa === ETAPAS.codigo && renderizarFormularioCodigo()}
        {etapa === ETAPAS.cadastro && renderizarFormularioCadastro()}
        {etapa === ETAPAS.recuperacao && renderizarFormularioRecuperacao()}

        <p className="login-link-privacidade">
          Ao acessar, consulte a <Link to="/privacidade">Política de Privacidade</Link>.
        </p>
      </div>
    </section>
  );
}
