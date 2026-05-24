import { useState } from 'react';
import { NavLink, matchPath, useLocation } from 'react-router-dom';
import { FaHome, FaPlus, FaTrophy, FaUser, FaUsers } from 'react-icons/fa';
import { RegistrarPartidaNovoContainer } from '../containers/partidas/RegistrarPartidaNovoContainer';
import './partidas/registrar-partida-novo.css';

function itemAtivo(pathname, caminhos) {
  return caminhos.some((caminho) => matchPath({ path: caminho, end: caminho === '/app' }, pathname));
}

export function MobileBottomNavigation({ usuario }) {
  const location = useLocation();
  const [registrarAberto, setRegistrarAberto] = useState(false);

  return (
    <>
      <nav className="mobile-bottom-navigation" aria-label="Navegação principal">
        <NavLink
          to="/app"
          end
          className={({ isActive }) => `mobile-bottom-item ${isActive ? 'ativo' : ''}`}
        >
          <FaHome aria-hidden="true" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/ranking"
          className={() => `mobile-bottom-item ${itemAtivo(location.pathname, ['/ranking', '/ranking/*', '/app/ranking-liga']) ? 'ativo' : ''}`}
        >
          <FaTrophy aria-hidden="true" />
          <span>Rankings</span>
        </NavLink>

        <button
          type="button"
          className={`mobile-bottom-item mobile-bottom-registrar ${
            itemAtivo(location.pathname, ['/partidas/registrar', '/app/registrar-partida']) ? 'ativo' : ''
          }`}
          onClick={() => setRegistrarAberto(true)}
          aria-label="Registrar partida"
        >
          <span className="mobile-bottom-registrar-icone">
            <FaPlus aria-hidden="true" />
          </span>
          <span>Registrar</span>
        </button>

        <NavLink
          to="/grupos"
          className={() => `mobile-bottom-item ${itemAtivo(location.pathname, ['/grupos', '/grupos/*']) ? 'ativo' : ''}`}
        >
          <FaUsers aria-hidden="true" />
          <span>Grupos</span>
        </NavLink>

        <NavLink
          to="/app/perfil"
          className={({ isActive }) => `mobile-bottom-item ${isActive ? 'ativo' : ''}`}
        >
          <FaUser aria-hidden="true" />
          <span>Perfil</span>
        </NavLink>
      </nav>

      {registrarAberto && (
        <RegistrarPartidaNovoContainer onFechar={() => setRegistrarAberto(false)} />
      )}
    </>
  );
}
