import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuMenu, LuX } from 'react-icons/lu';
import { Link, NavLink } from 'react-router-dom';
import logoLiga from '../../assets/logo-liga.svg';

const estadoCriarConta = {
  mensagem: 'Use seu e-mail para entrar ou criar sua conta grátis.',
  origem: { pathname: '/app' }
};

const linksPrincipais = [
  { to: '/', label: 'Início' },
  { to: '/ranking', label: 'Rankings' },
  { to: '/grupos', label: 'Grupos' }
];

const linksDesktop = [
  ...linksPrincipais,
  { to: '/arenas', label: 'Arenas' }
];

const itensDrawer = [
  ...linksPrincipais,
  { to: '/arenas', label: 'Arenas' },
  { label: 'Campeonatos', detail: 'Em breve', disabled: true },
  { href: 'mailto:contato@quebranunca.com.br', label: 'Contato' }
];

export function PublicHeader() {
  const [menuAberto, setMenuAberto] = useState(false);
  const botaoMenuRef = useRef(null);
  const botaoFecharRef = useRef(null);

  useEffect(() => {
    if (!menuAberto) {
      return undefined;
    }

    document.body.classList.add('public-menu-open');
    window.setTimeout(() => {
      botaoFecharRef.current?.focus();
    }, 0);

    function aoPressionarTecla(evento) {
      if (evento.key === 'Escape') {
        fecharMenu(true);
      }
    }

    window.addEventListener('keydown', aoPressionarTecla);

    return () => {
      document.body.classList.remove('public-menu-open');
      window.removeEventListener('keydown', aoPressionarTecla);
    };
  }, [menuAberto]);

  function fecharMenu(restaurarFoco = false) {
    setMenuAberto(false);
    if (restaurarFoco) {
      window.setTimeout(() => {
        botaoMenuRef.current?.focus();
      }, 0);
    }
  }

  const drawer = (
    <>
      <button
        type="button"
        className={`public-header-backdrop ${menuAberto ? 'aberto' : ''}`}
        onClick={() => fecharMenu(true)}
        aria-label="Fechar menu"
        aria-hidden={!menuAberto}
        hidden={!menuAberto}
        tabIndex={-1}
      />

      <aside
        id="public-menu-drawer"
        className={`public-header-drawer ${menuAberto ? 'aberto' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="public-menu-title"
        aria-hidden={!menuAberto}
        hidden={!menuAberto}
      >
        <div className="public-drawer-top">
          <Link to="/" className="public-drawer-brand" onClick={() => fecharMenu()} aria-label="QuebraNunca">
            <img src={logoLiga} alt="QNF" />
            <span className="public-drawer-brand-copy">
              <strong id="public-menu-title">QuebraNunca</strong>
              <small>Futevôlei em tempo real</small>
            </span>
          </Link>
          <button
            ref={botaoFecharRef}
            type="button"
            className="public-drawer-close"
            onClick={() => fecharMenu(true)}
            aria-label="Fechar menu"
          >
            <LuX aria-hidden="true" strokeWidth={2.1} />
          </button>
        </div>

        <nav className="public-drawer-nav" aria-label="Menu público">
          {itensDrawer.map((item) => {
            if (item.disabled) {
              return (
                <span key={item.label} className="public-drawer-link public-drawer-link-disabled">
                  <span>{item.label}</span>
                  <small>{item.detail}</small>
                </span>
              );
            }

            if (item.href) {
              return (
                <a key={item.href} href={item.href} className="public-drawer-link" onClick={() => fecharMenu()}>
                  {item.label}
                </a>
              );
            }

            return (
              <NavLink key={item.to} to={item.to} className="public-drawer-link" onClick={() => fecharMenu()}>
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="public-drawer-actions">
          <Link to="/login" className="public-drawer-login" onClick={() => fecharMenu()}>
            Entrar
          </Link>
          <Link
            to="/login"
            state={estadoCriarConta}
            className="public-drawer-create"
            onClick={() => fecharMenu()}
          >
            Criar conta grátis
          </Link>
        </div>
      </aside>
    </>
  );

  return (
    <>
      <header className="public-header">
        <Link to="/" className="public-header-brand" onClick={() => fecharMenu()} aria-label="QuebraNunca">
          <img src={logoLiga} alt="QNF" />
          <span>QuebraNunca</span>
        </Link>

        <nav className="public-header-nav" aria-label="Navegação pública">
          {linksDesktop.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => fecharMenu()}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="public-header-actions">
          <Link to="/login" className="public-header-login">
            Entrar
          </Link>
          <Link to="/login" state={estadoCriarConta} className="public-header-create">
            Criar conta grátis
          </Link>
          <button
            ref={botaoMenuRef}
            type="button"
            className={`public-header-menu ${menuAberto ? 'aberto' : ''}`}
            onClick={() => setMenuAberto((aberto) => !aberto)}
            aria-label={menuAberto ? 'Fechar navegação' : 'Abrir navegação'}
            aria-controls="public-menu-drawer"
            aria-expanded={menuAberto}
          >
            {menuAberto
              ? <LuX aria-hidden="true" strokeWidth={2.1} />
              : <LuMenu aria-hidden="true" strokeWidth={2.1} />}
          </button>
        </div>
      </header>

      {typeof document !== 'undefined'
        ? createPortal(drawer, document.body)
        : drawer}
    </>
  );
}
