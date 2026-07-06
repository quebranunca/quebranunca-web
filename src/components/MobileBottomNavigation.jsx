import { useState } from 'react';
import { NavLink, matchPath, useLocation } from 'react-router-dom';
import { FaChartBar, FaClipboardList, FaHome, FaPlus, FaShieldAlt, FaTrophy, FaUser, FaUsers } from 'react-icons/fa';
import { RegistrarPartidaNovoContainer } from '../containers/partidas/RegistrarPartidaNovoContainer';
import { obterItensNavegacao } from '../pages/navagacao';
import { ehAdministrador } from '../utils/perfis';
import './partidas/registrar-partida-novo.css';

function itemAtivo(pathname, caminhos) {
  return caminhos.some((caminho) => matchPath({ path: caminho, end: caminho === '/app' }, pathname));
}

function obterIconeAdmin(caminho) {
  if (caminho === '/admin/partidas') {
    return <FaClipboardList aria-hidden="true" />;
  }

  if (caminho === '/admin/grupos') {
    return <FaUsers aria-hidden="true" />;
  }

  if (caminho === '/admin/atletas') {
    return <FaUser aria-hidden="true" />;
  }

  if (caminho === '/ranking') {
    return <FaTrophy aria-hidden="true" />;
  }

  if (caminho === '/admin') {
    return <FaShieldAlt aria-hidden="true" />;
  }

  return <FaHome aria-hidden="true" />;
}

export function MobileBottomNavigation({ usuario, estadoAcesso }) {
  const location = useLocation();
  const [registrarAberto, setRegistrarAberto] = useState(false);

  if (ehAdministrador(usuario)) {
    const itensAdmin = obterItensNavegacao(usuario, estadoAcesso).slice(0, 5);

    return (
      <nav className="mobile-bottom-navigation" aria-label="Navegação principal">
        {itensAdmin.map((item) => (
          <NavLink
            key={item.caminho}
            to={item.caminho}
            end={item.caminho === '/app'}
            className={() => `mobile-bottom-item ${itemAtivo(location.pathname, [item.caminho, `${item.caminho}/*`]) ? 'ativo' : ''}`}
          >
            {obterIconeAdmin(item.caminho)}
            <span>{item.nome}</span>
          </NavLink>
        ))}
      </nav>
    );
  }

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
          to="/app/scouts"
          className={({ isActive }) => `mobile-bottom-item ${isActive ? 'ativo' : ''}`}
        >
          <FaChartBar aria-hidden="true" />
          <span>Scouts</span>
        </NavLink>
      </nav>

      {registrarAberto && (
        <RegistrarPartidaNovoContainer onFechar={() => setRegistrarAberto(false)} />
      )}
    </>
  );
}
