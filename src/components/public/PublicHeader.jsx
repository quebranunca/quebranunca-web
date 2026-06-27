import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logoLiga from '../../assets/logo-liga.svg';

const mensagemRegistro = 'Para registrar sua partida, entre ou crie sua conta rapidinho.';
const estadoRegistroPartida = {
  mensagem: mensagemRegistro,
  origem: { pathname: '/partidas/registrar' }
};

export function PublicHeader() {
  const [menuAberto, setMenuAberto] = useState(false);

  function fecharMenu() {
    setMenuAberto(false);
  }

  return (
    <header className="public-header">
      <Link to="/" className="public-header-brand" onClick={fecharMenu} aria-label="QuebraNunca">
        <img src={logoLiga} alt="QNF" />
        <span>QuebraNunca</span>
      </Link>

      <button
        type="button"
        className="public-header-menu"
        onClick={() => setMenuAberto((aberto) => !aberto)}
        aria-label={menuAberto ? 'Fechar navegação' : 'Abrir navegação'}
        aria-expanded={menuAberto}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`public-header-nav ${menuAberto ? 'aberto' : ''}`} aria-label="Navegação pública">
        <NavLink to="/" onClick={fecharMenu}>Início</NavLink>
        <NavLink to="/ranking" onClick={fecharMenu}>Rankings</NavLink>
        <a href="/#grupos" onClick={fecharMenu}>Grupos</a>
        <NavLink to="/competicoes" onClick={fecharMenu}>Campeonatos</NavLink>
        <NavLink to="/arenas" onClick={fecharMenu}>Arenas</NavLink>
      </nav>

      <div className="public-header-actions">
        <Link
          to="/login"
          state={estadoRegistroPartida}
          className="botao-primario public-header-register"
        >
          Registrar Partida
        </Link>
      </div>
    </header>
  );
}
