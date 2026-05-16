import {
  NavLink,
  matchPath,
  useLocation,
  useNavigate
} from 'react-router-dom';

import { ConteudoBotao } from './ConteudoBotao';
import { NotificacoesBotao } from './NotificacoesBotao';

import logoLiga from '../assets/logo-liga.svg';

import {
  ROTAS_APP_HEADER,
  TIPOS_TELA
} from '../pages/navagacao';

import { nomePerfil } from '../utils/perfis';
import { nomeEstadoAcesso } from '../utils/acesso';

const ROTA_HOME_APP = '/app';

function obterConfiguracaoHeader(pathname) {
  return (
    ROTAS_APP_HEADER.find((rota) => (
      matchPath(
        {
          path: rota.path,
          end: true
        },
        pathname
      )
    ))
    || {
      title: 'QuebraNunca',
      tipoTela: TIPOS_TELA.raiz
    }
  );
}

export function AppHeader({
  autenticado,
  usuario,
  estadoAcesso,
  aoSair
}) {
  const location = useLocation();

  const navegar = useNavigate();

  const configuracao =
    obterConfiguracaoHeader(location.pathname);

  const telaContexto =
    configuracao.tipoTela === TIPOS_TELA.contexto;

  const rotaHome =
    autenticado
      ? ROTA_HOME_APP
      : '/';

  const tituloMobile =
    configuracao.title === 'Home'
      ? 'QuebraNunca'
      : configuracao.title;

  function aoVoltar() {
    const indiceHistorico =
      window.history.state?.idx;

    if (
      typeof indiceHistorico === 'number'
      && indiceHistorico > 0
    ) {
      navegar(-1);
      return;
    }

    navegar(ROTA_HOME_APP);
  }

  return (
    <header className="topo-app">
      <NavLink
        to={rotaHome}
        className="marca-topo"
        aria-label="Ir para a home"
      >
        <img
          className="logo-interno"
          src={logoLiga}
          alt="Liga"
        />

        <div className="marca-texto">
          <p className="marca-subtitulo">
            Plataforma
          </p>

          <h1 className="marca-titulo">
            <span className="marca-titulo-desktop">
              QuebraNunca
            </span>

            <span className="marca-titulo-mobile">
              {tituloMobile}
            </span>
          </h1>
        </div>
      </NavLink>

      <div className="usuario-topo">
        <span className="usuario-identidade">
          {autenticado ? (
            <>
              <span className="usuario-nome">
                {usuario?.nome}
              </span>

              <span className="usuario-perfil">
                {nomePerfil(usuario?.perfil)}

                {estadoAcesso
                  ? ` · ${nomeEstadoAcesso(estadoAcesso)}`
                  : ''}
              </span>
            </>
          ) : (
            <>
              <span className="usuario-nome">
                Acesso público
              </span>

              <span className="usuario-perfil">
                Visitante
              </span>
            </>
          )}
        </span>

        {telaContexto && (
          <button
            type="button"
            className="botao-terciario botao-topo-icone"
            onClick={aoVoltar}
            aria-label="Voltar"
            title="Voltar"
          >
            <span
              className="app-header-icone"
              aria-hidden="true"
            >
              &larr;
            </span>
          </button>
        )}        

        {autenticado && (
          <NotificacoesBotao
            autenticado={autenticado}
          />
        )}

        {autenticado ? (
          <button
            type="button"
            className="botao-terciario botao-topo-acao botao-sair-topo"
            onClick={aoSair}
            aria-label="Sair"
            title="Sair"
          >
            <ConteudoBotao
              icone="sair"
              texto="Sair"
              somenteIconeNoMobile={false}
            />
          </button>
        ) : (
          <NavLink
            to="/login"
            className="botao-terciario botao-topo-acao botao-entrar-topo"
            aria-label="Entrar"
            title="Entrar"
          >
            <ConteudoBotao
              icone="entrar"
              texto="Entrar"
              somenteIconeNoMobile={false}
            />
          </NavLink>
        )}
      </div>
    </header>
  );
}