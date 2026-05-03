import { NavLink, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { ConteudoBotao } from './ConteudoBotao';
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
          <h1 className="marca-titulo">QuebraNunca</h1>
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

        {mostrarMenu && (
          <button
            type="button"
            className="botao-terciario botao-topo-icone botao-menu-mobile"
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
            <span className="rotulo-menu-mobile">{menuAberto ? 'Fechar' : 'Menu'}</span>
          </button>
        )}

        {autenticado ? (
          <button type="button" className="botao-secundario botao-sair-topo" onClick={aoSair}>
            <ConteudoBotao icone="sair" texto="Sair" />
          </button>
        ) : (
          <NavLink to="/login" className="botao-secundario botao-sair-topo">
            <ConteudoBotao icone="entrar" texto="Entrar" />
          </NavLink>
        )}
      </div>
    </header>
  );
}
