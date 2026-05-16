import { NavLink, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { ConteudoBotao } from './ConteudoBotao';
import { NotificacoesBotao } from './NotificacoesBotao';
import logoLiga from '../assets/logo-liga.svg';
import { ROTAS_APP_HEADER, TIPOS_TELA } from '../pages/navagacao';
import { nomePerfil } from '../utils/perfis';
import { nomeEstadoAcesso } from '../utils/acesso';

const ROTA_HOME_APP = '/app';

function obterConfiguracaoHeader(pathname) {
  return ROTAS_APP_HEADER.find((rota) => (
    matchPath({ path: rota.path, end: true }, pathname)
  )) || { title: 'QuebraNunca', tipoTela: TIPOS_TELA.raiz };
}

export function AppHeader({
  autenticado,
  usuario,
  estadoAcesso,
  menuAberto,
  aoAlternarMenu,
  aoSair
}) {
  const location = useLocation();
  const navegar = useNavigate();
  const configuracao = obterConfiguracaoHeader(location.pathname);
  const telaRaiz = configuracao.tipoTela === TIPOS_TELA.raiz;
  const telaAcao = configuracao.tipoTela === TIPOS_TELA.acao;
  const telaContexto = configuracao.tipoTela === TIPOS_TELA.contexto;
  const mostrarMenu = telaRaiz || telaAcao;
  const mostrarVoltar = telaContexto;
  const rotaHome = autenticado ? ROTA_HOME_APP : '/';
  const tituloMobile = configuracao.title === 'Home' ? 'QuebraNunca' : configuracao.title;

  function aoVoltar() {
    const indiceHistorico = window.history.state?.idx;

    if (typeof indiceHistorico === 'number' && indiceHistorico > 0) {
      navegar(-1);
      return;
    }

    navegar(ROTA_HOME_APP);
  }

  return (
    <header className="topo-app">
      <NavLink to={rotaHome} className="marca-topo" aria-label="Ir para a home">
        <img className="logo-interno" src={logoLiga} alt="Liga" />
        <div className="marca-texto">
          <p className="marca-subtitulo">Plataforma</p>
          <h1 className="marca-titulo">
            <span className="marca-titulo-desktop">QuebraNunca</span>
            <span className="marca-titulo-mobile">{tituloMobile}</span>
          </h1>
        </div>
      </NavLink>

      <div className="usuario-topo">
        <span className="usuario-identidade">
          {autenticado ? (
            <>
              <span className="usuario-nome">{usuario?.nome}</span>
              <span className="usuario-perfil">
                {nomePerfil(usuario?.perfil)}
                {estadoAcesso ? ` · ${nomeEstadoAcesso(estadoAcesso)}` : ''}
              </span>
            </>
          ) : (
            <>
              <span className="usuario-nome">Acesso público</span>
              <span className="usuario-perfil">Visitante</span>
            </>
          )}
        </span>

        {mostrarVoltar && (
          <button
            type="button"
            className="botao-terciario botao-topo-icone"
            onClick={aoVoltar}
            aria-label="Voltar"
            title="Voltar"
          >
            <span className="app-header-icone" aria-hidden="true">&larr;</span>
          </button>
        )}

        <button
          type="button"
          className="botao-terciario botao-topo-icone"
          onClick={() => navegar(rotaHome)}
          aria-label="Ir para a home"
          title="Ir para a home"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 10.6 12 4l8 6.6V20h-5v-5.2H9V20H4Z"
              fill="currentColor"
            />
          </svg>
        </button>

        {autenticado && (
          <NotificacoesBotao autenticado={autenticado} />
        )}

        {autenticado && (
          <NavLink
            to="/app/perfil"
            className="botao-terciario botao-topo-icone app-header-perfil-mobile"
            aria-label="Abrir perfil"
            title="Abrir perfil"
          >
            <span aria-hidden="true">{usuario?.nome?.trim()?.charAt(0)?.toUpperCase() || 'P'}</span>
          </NavLink>
        )}
        
        {mostrarMenu && (
          <button
            type="button"
            className="botao-terciario botao-topo-icone botao-menu-mobile botao-menu-principal"
            onClick={aoAlternarMenu}
            aria-expanded={menuAberto}
            aria-controls="menu-principal-app"
            aria-label={menuAberto ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            title={menuAberto ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {menuAberto ? (
                <path
                  d="M6.7 5.3 12 10.6l5.3-5.3 1.4 1.4L13.4 12l5.3 5.3-1.4 1.4L12 13.4l-5.3 5.3-1.4-1.4L10.6 12 5.3 6.7Z"
                  fill="currentColor"
                />
              ) : (
                <path
                  d="M4 6.5h16v2H4zm0 4.5h16v2H4zm0 4.5h16v2H4z"
                  fill="currentColor"
                />
              )}
            </svg>           
          </button>
        )}

        {autenticado ? (
          <button
            type="button"
            className="botao-terciario botao-topo-acao botao-sair-topo"
            onClick={aoSair}
            aria-label="Sair"
            title="Sair"
          >
            <ConteudoBotao icone="sair" texto="Sair" somenteIconeNoMobile={false} />
          </button>
        ) : (
          <NavLink
            to="/login"
            className="botao-terciario botao-topo-acao botao-entrar-topo"
            aria-label="Entrar"
            title="Entrar"
          >
            <ConteudoBotao icone="entrar" texto="Entrar" somenteIconeNoMobile={false} />
          </NavLink>
        )}
      </div>
    </header>
  );
}
