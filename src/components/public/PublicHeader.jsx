import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logoLiga from '../../assets/logo-liga.svg';

const mensagemRegistro = 'Para registrar sua partida, entre ou crie sua conta rapidinho.';

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

      <nav className={`public-header-nav ${menuAberto ? 'aberto' : ''}`} aria-label="Navegação pública">
        <NavLink to="/" onClick={fecharMenu}>Início</NavLink>
        <NavLink to="/ranking" onClick={fecharMenu}>Rankings</NavLink>
        <a href="/#grupos" onClick={fecharMenu}>Grupos</a>
        <NavLink to="/competicoes" onClick={fecharMenu}>Campeonatos</NavLink>
      </nav>

      <div className="public-header-actions">
        <Link
          to="/login"
          state={{ mensagem: mensagemRegistro }}
          className="botao-primario public-header-register"
        >
          Registrar Partida
        </Link>       
      </div>
    </header>
  );
}
