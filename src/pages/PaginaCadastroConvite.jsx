import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';
import logoLiga from '../assets/logo-liga.svg';
import { EmailDomainSuggestions } from '../components/formularios/EmailDomainSuggestions';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { convitesCadastroServico } from '../services/convitesCadastroServico';
import { extrairMensagemErro } from '../utils/erros';
import { aoPressionarEnterParaProximo, focusNextField, scrollFocusedInputIntoView } from '../utils/tecladoMobile';

export function PaginaCadastroConvite() {
  const { identificadorPublico = '' } = useParams();
  const [convite, setConvite] = useState(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [codigoConvite, setCodigoConvite] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [aceitouPoliticaPrivacidade, setAceitouPoliticaPrivacidade] = useState(false);
  const [aceitouTermosUso, setAceitouTermosUso] = useState(false);
  const [aceitouUsoLocalizacao, setAceitouUsoLocalizacao] = useState(false);
  const [aceitouUsoImagem, setAceitouUsoImagem] = useState(false);
  const [erro, setErro] = useState('');
  const [carregandoConvite, setCarregandoConvite] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const { registrarPorConvite, token, rotaInicial } = useAutenticacao();
  const navegar = useNavigate();
  const emailRef = useRef(null);
  const nomeRef = useRef(null);
  const codigoRef = useRef(null);
  const senhaRef = useRef(null);

  useEffect(() => {
    if (token) {
      navegar(rotaInicial, { replace: true });
    }
  }, [token, rotaInicial, navegar]);

  useEffect(() => {
    async function carregarConvite() {
      setCarregandoConvite(true);
      setErro('');

      if (!identificadorPublico) {
        setErro('Convite não informado.');
        setCarregandoConvite(false);
        return;
      }

      try {
        const resposta = await convitesCadastroServico.obterPublico(identificadorPublico);
        setConvite(resposta);
        setEmail(resposta.emailMascarado || '');
      } catch (error) {
        setErro(extrairMensagemErro(error));
      } finally {
        setCarregandoConvite(false);
      }
    }

    carregarConvite();
  }, [identificadorPublico]);

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro('');

    if (!convite?.podeSerUsado) {
      setErro('Este convite não está disponível para cadastro.');
      return;
    }

    if (!codigoConvite.trim()) {
      setErro('Informe o código do convite.');
      return;
    }

    if (!email.trim()) {
      setErro('Informe o e-mail.');
      return;
    }

    if (!aceitouPoliticaPrivacidade || !aceitouTermosUso) {
      setErro('É necessário aceitar a Política de Privacidade e os Termos de Uso para continuar.');
      return;
    }

    if (!senha.trim()) {
      setErro('Crie uma senha para continuar.');
      return;
    }

    if (senha !== confirmacaoSenha) {
      setErro('Senha e confirmação devem ser iguais.');
      return;
    }

    setSalvando(true);

    try {
      await registrarPorConvite({
        conviteIdPublico: identificadorPublico,
        codigoConvite: codigoConvite.trim(),
        nome: nome.trim(),
        email: email.trim(),
        senha,
        confirmacaoSenha,
        aceitouPoliticaPrivacidade,
        aceitouTermosUso,
        aceitouUsoLocalizacao,
        aceitouUsoImagem
      });
      navegar('/app/perfil', { replace: true });
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="pagina-login">
      <div className="painel-login">
        <img className="logo-login" src={logoLiga} alt="Logo Liga" />
        <h1>Seu primeiro acesso</h1>
        <p>Use este convite para confirmar seu acesso à Plataforma QuebraNunca Futevôlei.</p>

        {carregandoConvite ? (
          <p>Validando convite...</p>
        ) : (
          <>
            {erro && <p className="texto-erro">{erro}</p>}

            {convite && convite.podeSerUsado && (
              <form onSubmit={aoSubmeter} className="formulario-grid unico">
                  <label>
                    E-mail do convite
                    <input
                      ref={emailRef}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      enterKeyHint="next"
                      value={email}
                      onChange={(evento) => setEmail(evento.target.value)}
                      onFocus={scrollFocusedInputIntoView}
                      onKeyDown={(evento) => aoPressionarEnterParaProximo(evento, () => focusNextField(nomeRef))}
                      placeholder="voce@email.com"
                      required
                    />
                    <EmailDomainSuggestions valor={email} onChange={setEmail} inputRef={emailRef} proximoRef={nomeRef} />
                  </label>

                  <label>
                    Nome completo
                    <input
                      ref={nomeRef}
                      type="text"
                      autoComplete="name"
                      enterKeyHint="next"
                      value={nome}
                      onChange={(evento) => setNome(evento.target.value)}
                      onFocus={scrollFocusedInputIntoView}
                      onKeyDown={(evento) => aoPressionarEnterParaProximo(evento, () => focusNextField(codigoRef))}
                      placeholder="Seu nome completo"
                      required
                    />
                  </label>

                  <label>
                    Código do convite
                    <input
                      ref={codigoRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9-]*"
                      autoComplete="one-time-code"
                      enterKeyHint="done"
                      value={codigoConvite}
                      onChange={(evento) => setCodigoConvite(evento.target.value)}
                      onFocus={scrollFocusedInputIntoView}
                      onKeyDown={(evento) => aoPressionarEnterParaProximo(evento, () => focusNextField(senhaRef))}
                      placeholder="Informe o código recebido"
                      required
                    />
                  </label>

                  <label className="campo-login-icone">
                    Crie uma senha
                    <span>
                      <FaLock aria-hidden="true" />
                      <input
                        ref={senhaRef}
                        type="password"
                        autoComplete="new-password"
                        enterKeyHint="next"
                        value={senha}
                        onChange={(evento) => setSenha(evento.target.value)}
                        onFocus={scrollFocusedInputIntoView}
                        placeholder="Mínimo 6 caracteres"
                        required
                      />
                    </span>
                  </label>

                  <label className="campo-login-icone">
                    Confirme sua senha
                    <span>
                      <FaLock aria-hidden="true" />
                      <input
                        type="password"
                        autoComplete="new-password"
                        enterKeyHint="done"
                        value={confirmacaoSenha}
                        onChange={(evento) => setConfirmacaoSenha(evento.target.value)}
                        onFocus={scrollFocusedInputIntoView}
                        placeholder="Digite a senha novamente"
                        required
                      />
                    </span>
                  </label>

                  <label className="campo-checkbox">
                    <input
                      type="checkbox"
                      checked={aceitouPoliticaPrivacidade}
                      onChange={(evento) => setAceitouPoliticaPrivacidade(evento.target.checked)}
                      required
                    />
                    <span>
                      Li e aceito a <Link to="/privacidade" target="_blank" rel="noreferrer">Política de Privacidade</Link>.
                    </span>
                  </label>

                  <label className="campo-checkbox">
                    <input
                      type="checkbox"
                      checked={aceitouTermosUso}
                      onChange={(evento) => setAceitouTermosUso(evento.target.checked)}
                      required
                    />
                    <span>Aceito os Termos de Uso da plataforma.</span>
                  </label>

                  <label className="campo-checkbox">
                    <input
                      type="checkbox"
                      checked={aceitouUsoLocalizacao}
                      onChange={(evento) => setAceitouUsoLocalizacao(evento.target.checked)}
                    />
                    <span>Permitir uso de localização ao registrar partidas.</span>
                  </label>

                  <label className="campo-checkbox">
                    <input
                      type="checkbox"
                      checked={aceitouUsoImagem}
                      onChange={(evento) => setAceitouUsoImagem(evento.target.checked)}
                    />
                    <span>Permitir uso de foto/imagem em recursos visuais da plataforma.</span>
                  </label>

                  <button type="submit" className="botao-primario" disabled={salvando}>
                    {salvando ? 'Entrando no app...' : 'Confirmar acesso e entrar'}
                  </button>
                </form>
              )}

              {convite && !convite.podeSerUsado && (
                <p className="texto-aviso">
                  Este convite não está mais disponível. Se precisar, solicite um novo link ao administrador.
                </p>
              )}
            </>
          )}
      </div>
    </section>
  );
}
