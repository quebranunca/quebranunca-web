import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { MobileBottomNavigation } from '../components/MobileBottomNavigation';
import { PublicFooter } from '../components/public/PublicFooter';
import { PublicHeader } from '../components/public/PublicHeader';
import { useAutenticacao } from '../hooks/useAutenticacao';

const ROTAS_SEM_BOTTOM_NAV = [
  /^\/login$/,
  /^\/cadastro\//,
  /^\/partidas\/campeonato$/,
  /^\/partidas\/consulta$/,
  /^\/campeonatos\//,
  /^\/grupos\/[^/]+\/atletas$/,
  /^\/grupos\/[^/]+\/configuracoes$/
];

const ROTAS_COM_HERO_PROPRIO_APP = [
  '/',
  '/app',
  '/app/pendencias',
  '/app/perfil',
  '/app/pontos-qn',
  '/app/scouts',
  '/arenas',
  '/grupos',
  '/mais',
  '/minhas-partidas',
  '/ranking'
];

const PADROES_COM_HERO_PROPRIO_APP = [
  /^\/app\/partidas\/[^/]+$/
];

function normalizarPathname(pathname) {
  const pathnameLimpo = String(pathname || '').replace(/\/+$/, '');
  return pathnameLimpo || '/';
}

function pathnameEhHomeAutenticada(pathname) {
  const pathnameNormalizado = normalizarPathname(pathname);
  return pathnameNormalizado === '/' || pathnameNormalizado === '/app';
}

export function paginaRenderizaHeroProprio(pathname) {
  const pathnameNormalizado = normalizarPathname(pathname);

  return (
    ROTAS_COM_HERO_PROPRIO_APP.includes(pathnameNormalizado) ||
    PADROES_COM_HERO_PROPRIO_APP.some((rota) => rota.test(pathnameNormalizado))
  );
}
 
export function LayoutPrincipal() {
  const { token, usuario, sair } = useAutenticacao();
  const location = useLocation();
  const navegar = useNavigate();
  const autenticado = Boolean(token);
  const homePublica = !autenticado && location.pathname === '/';
  const loginPublico = !autenticado && location.pathname === '/login';
  const pathnameNormalizado = normalizarPathname(location.pathname);
  const homeDashboardApp = autenticado && pathnameEhHomeAutenticada(pathnameNormalizado);
  const gruposDashboardApp = autenticado && pathnameNormalizado === '/grupos';
  const paginaComHeroProprioApp = autenticado && paginaRenderizaHeroProprio(pathnameNormalizado);
  const mostrarBottomNavMobile = autenticado &&
    !ROTAS_SEM_BOTTOM_NAV.some((rota) => rota.test(location.pathname));

  function aoSair() {
    sair();
    navegar('/', { replace: true });
  }

  if (!autenticado) {
    return (
      <div
        className={`layout-app layout-publico${homePublica ? ' layout-home-publica' : ''}${
          loginPublico ? ' layout-login-publico' : ''
        }`}
      >
        <PublicHeader />
        <main className="conteudo-principal">
          <Outlet />
          {loginPublico && <PublicFooter />}
        </main>
        {!loginPublico && <PublicFooter />}
      </div>
    );
  }

  return (
    <div
      className={`layout-app${homePublica ? ' layout-home-publica' : ''}${
        autenticado ? ' layout-autenticado' : ''
      }${mostrarBottomNavMobile ? ' layout-com-bottom-nav' : ''}${
        homeDashboardApp ? ' layout-home-dashboard-app' : ''
      }${
        gruposDashboardApp ? ' layout-grupos-dashboard-app' : ''
      }${
        paginaComHeroProprioApp ? ' layout-pagina-com-hero-proprio' : ''
      }`}
    >
      {!paginaComHeroProprioApp && (
        <AppHeader
          autenticado={autenticado}
          usuario={usuario}
          mostrarNotificacoes
          aoSair={aoSair}
        />
      )}

      <main className="conteudo-principal">
        <Outlet />
      </main>

      {mostrarBottomNavMobile && <MobileBottomNavigation />}
    </div>
  );
}
