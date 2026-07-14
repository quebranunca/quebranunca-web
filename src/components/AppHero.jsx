import { useContext, useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaCog, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { AutenticacaoContexto } from '../contexts/AutenticacaoContexto';
import { AvatarUsuario, obterFotoPerfilAvatar } from './AvatarUsuario';
import { NotificacoesBotao } from './NotificacoesBotao';
import homeHeroFutevolei from '../assets/images/home/home-hero-futevolei.jpg';
import './AppHero.css';

function obterTextoLimpo(...valores) {
  return valores
    .map((valor) => String(valor || '').trim())
    .find(Boolean) || '';
}

export function AppHero({
  eyebrow = 'QuebraNunca',
  title,
  subtitle,
  badge,
  actions,
  className = '',
  accountUser,
  autenticado: autenticadoProp,
  onSair,
  showAccountActions = true,
  showNotifications,
  showAvatar,
  showBackButton = false,
  onBack,
  backLabel = 'Voltar',
  resumoNotificacoes,
  testId,
  variant = 'page',
  height
}) {
  const contextoAutenticacao = useContext(AutenticacaoContexto);
  const navegar = useNavigate();
  const tituloId = useId();
  const contaRef = useRef(null);
  const [menuContaAberto, setMenuContaAberto] = useState(false);
  const usuario = accountUser || contextoAutenticacao?.usuario || {};
  const autenticado = autenticadoProp ?? Boolean(contextoAutenticacao?.token);
  const nomeUsuario = obterTextoLimpo(
    usuario?.nomeCompleto,
    usuario?.nome,
    usuario?.apelido,
    contextoAutenticacao?.usuario?.nomeCompleto,
    contextoAutenticacao?.usuario?.nome,
    'Atleta'
  );
  const fotoPerfilUrl = obterTextoLimpo(
    accountUser?.fotoPerfilUrl,
    obterFotoPerfilAvatar(usuario),
    obterFotoPerfilAvatar(contextoAutenticacao?.usuario)
  );
  const resumoNotificacoesControlado = resumoNotificacoes !== undefined
    ? resumoNotificacoes
    : (!contextoAutenticacao?.token && autenticadoProp !== undefined ? { total: 0 } : undefined);

  useEffect(() => {
    if (!menuContaAberto) {
      return undefined;
    }

    function aoClicarFora(evento) {
      if (!contaRef.current?.contains(evento.target)) {
        setMenuContaAberto(false);
      }
    }

    function aoPressionarTecla(evento) {
      if (evento.key === 'Escape') {
        setMenuContaAberto(false);
      }
    }

    document.addEventListener('mousedown', aoClicarFora);
    window.addEventListener('keydown', aoPressionarTecla);

    return () => {
      document.removeEventListener('mousedown', aoClicarFora);
      window.removeEventListener('keydown', aoPressionarTecla);
    };
  }, [menuContaAberto]);

  function sairDaConta() {
    setMenuContaAberto(false);
    if (onSair) {
      onSair();
    } else {
      contextoAutenticacao?.sair?.();
    }
    navegar('/', { replace: true });
  }

  const mostrarNotificacoes = (showNotifications ?? showAccountActions) && autenticado;
  const mostrarAvatar = (showAvatar ?? showAccountActions) && autenticado;
  const mostrarAcoesTopo = showBackButton || actions || mostrarNotificacoes || mostrarAvatar;

  function voltar() {
    if (onBack) {
      onBack();
      return;
    }

    navegar(-1);
  }

  const classeVariante = `app-hero--${variant || height || 'page'}`;

  return (
    <section
      className={`app-hero ${classeVariante} ${height ? `app-hero--${height}` : ''} ${className}`.trim()}
      aria-labelledby={tituloId}
      data-testid={testId}
      style={{ '--app-hero-image': `url(${homeHeroFutevolei})` }}
    >
      <div className="app-hero__topbar">
        {eyebrow && <span className="app-hero__eyebrow">{eyebrow}</span>}

        {mostrarAcoesTopo && (
          <div className="app-hero__top-actions">
            {showBackButton && (
              <button type="button" className="app-hero__back-button" onClick={voltar} aria-label={backLabel}>
                <FaChevronLeft aria-hidden="true" />
                <span>{backLabel}</span>
              </button>
            )}

            {actions && <div className="app-hero__custom-actions">{actions}</div>}

            {mostrarNotificacoes && (
              <NotificacoesBotao autenticado={autenticado} resumo={resumoNotificacoesControlado} />
            )}

            {mostrarAvatar && (
              <div className="app-hero__account" ref={contaRef}>
                <button
                  type="button"
                  className="app-hero__avatar-button"
                  aria-label="Abrir menu da conta"
                  aria-haspopup="menu"
                  aria-expanded={menuContaAberto}
                  onClick={() => setMenuContaAberto((aberto) => !aberto)}
                >
                  <AvatarUsuario
                    nome={nomeUsuario}
                    fotoPerfilUrl={fotoPerfilUrl}
                    tamanho="sm"
                    className="app-hero__avatar"
                    alt=""
                  />
                </button>

                {menuContaAberto && (
                  <nav className="app-hero__account-menu" aria-label="Menu da conta">
                    <Link to="/app/perfil" onClick={() => setMenuContaAberto(false)}>
                      <FaUser aria-hidden="true" />
                      <span>Meu perfil</span>
                    </Link>
                    <Link to="/app/perfil?aba=configuracoes" onClick={() => setMenuContaAberto(false)}>
                      <FaCog aria-hidden="true" />
                      <span>Configurações</span>
                    </Link>
                    <button type="button" onClick={sairDaConta}>
                      <FaSignOutAlt aria-hidden="true" />
                      <span>Sair</span>
                    </button>
                  </nav>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="app-hero__copy">
        {subtitle ? <span className="app-hero__subtitle">{subtitle}</span> : null}
        <h1 id={tituloId} title={title}>{title}</h1>
        {badge && (
          <div className="app-hero__badge" aria-label="Resumo">
            <span>{badge}</span>
          </div>
        )}
      </div>
    </section>
  );
}
