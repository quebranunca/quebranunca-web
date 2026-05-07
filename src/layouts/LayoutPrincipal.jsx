import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { obterItensNavegacao, obterItensNavegacaoPublica } from '../pages/navagacao';
 
export function LayoutPrincipal() {
  const { token, usuario, estadoAcesso, sair } = useAutenticacao();
  const location = useLocation();
  const navegar = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const autenticado = Boolean(token);
  const homePublica = !autenticado && location.pathname === '/';
  const itensMenu = autenticado
    ? obterItensNavegacao(usuario, estadoAcesso)
    : obterItensNavegacaoPublica();

  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

  function aoSair() {
    sair();
    navegar('/', { replace: true });
  }

  return (
    <div className={`layout-app${homePublica ? ' layout-home-publica' : ''}`}>
      <AppHeader
        autenticado={autenticado}
        usuario={usuario}
        estadoAcesso={estadoAcesso}
        menuAberto={menuAberto}
        aoAlternarMenu={() => setMenuAberto((aberto) => !aberto)}
        aoSair={aoSair}
      />

      <nav
        id="menu-principal-app"
        className={`menu-principal ${menuAberto ? 'aberto' : ''}`}
        aria-label="Navegação principal"
      >
        {itensMenu.map((item) => (
          item.externo ? (
            <a
              key={item.caminho}
              href={item.caminho}
              className="item-menu"
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.nome}
            </a>
          ) : (
            <NavLink
              key={item.caminho}
              to={item.caminho}
              className={({ isActive }) => `item-menu ${isActive ? 'ativo' : ''}`}
            >
              {item.nome}
            </NavLink>
          )
        ))}
      </nav>

      <main className="conteudo-principal">
        <Outlet />
      </main>
    </div>
  );
}
