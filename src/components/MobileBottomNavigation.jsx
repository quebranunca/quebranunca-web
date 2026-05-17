import { useState } from 'react';
import { NavLink, matchPath, useLocation } from 'react-router-dom';
import { FaHome, FaListAlt, FaPlus, FaShieldAlt, FaTrophy, FaUser } from 'react-icons/fa';
import { RegistrarPartidaNovoContainer } from '../containers/partidas/RegistrarPartidaNovoContainer';
import { ehAdministrador } from '../utils/perfis';
import './partidas/registrar-partida-novo.css';

function itemAtivo(pathname, caminhos) {
  return caminhos.some((caminho) => matchPath({ path: caminho, end: caminho === '/app' }, pathname));
}

export function MobileBottomNavigation({ usuario }) {
  const location = useLocation();
  const [registrarAberto, setRegistrarAberto] = useState(false);
  const administrador = ehAdministrador(usuario);
  const caminhoJogos = usuario?.atletaId ? '/app/meus-jogos' : '/minhas-partidas-registradas';
  const jogosAtivo = itemAtivo(location.pathname, [
    '/app/meus-jogos',
    '/minhas-partidas-registradas',
    '/partidas/consulta'
  ]);

  return (
    <>
      <nav className="mobile-bottom-navigation" aria-label="Navegação principal mobile">
        <NavLink
          to="/app"
          end
          className={({ isActive }) => `mobile-bottom-item ${isActive ? 'ativo' : ''}`}
        >
          <FaHome aria-hidden="true" />
          <span>Home</span>
        </NavLink>

        {administrador ? (
          <NavLink
            to="/admin"
            className={() => `mobile-bottom-item ${itemAtivo(location.pathname, ['/admin', '/admin/*']) ? 'ativo' : ''}`}
          >
            <FaShieldAlt aria-hidden="true" />
            <span>Admin</span>
          </NavLink>
        ) : (
          <NavLink
            to={caminhoJogos}
            className={() => `mobile-bottom-item ${jogosAtivo ? 'ativo' : ''}`}
          >
            <FaListAlt aria-hidden="true" />
            <span>Jogos</span>
          </NavLink>
        )}

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
          to="/ranking"
          className={({ isActive }) => `mobile-bottom-item ${isActive ? 'ativo' : ''}`}
        >
          <FaTrophy aria-hidden="true" />
          <span>Ranking</span>
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
