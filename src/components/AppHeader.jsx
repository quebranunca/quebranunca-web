import {
  NavLink,
  matchPath,
  useLocation
} from 'react-router-dom';

import { ConteudoBotao } from './ConteudoBotao';
import { HeaderBackButton } from './BotaoVoltar';
import { NotificacoesBotao } from './NotificacoesBotao';
import { AvatarUsuario } from './AvatarUsuario';

import logoLiga from '../assets/logo-liga.svg';

import {
  ROTAS_APP_HEADER,
  TIPOS_TELA
} from '../pages/navagacao';

import { nomePerfil } from '../utils/perfis';
import { nomeEstadoAcesso } from '../utils/acesso';

const ROTA_HOME_APP = '/app';
const ROTAS_PRINCIPAIS_SEM_VOLTAR = new Set([
  '/',
  '/app',
  '/app/meus-jogos',
  '/ranking',
  '/app/perfil'
]);

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
  estadoAcesso
}) {
  const location = useLocation();

  const configuracao =
    obterConfiguracaoHeader(location.pathname);

  const telaInterna =
    autenticado &&
    !ROTAS_PRINCIPAIS_SEM_VOLTAR.has(location.pathname);

  const rotaHome =
    autenticado
      ? ROTA_HOME_APP
      : '/';

  const tituloMobile =
    configuracao.title === 'Home'
      ? 'QuebraNunca'
      : configuracao.title;

  return (
    <header className={`topo-app ${telaInterna ? 'topo-app-interno' : 'topo-app-principal'}`}>
      {telaInterna ? (
        <div className="marca-topo marca-topo-interna">
          <HeaderBackButton
            mostrarTexto={false}
            rotaFallback={ROTA_HOME_APP}
          />

          <div className="marca-texto">
            <p className="marca-subtitulo">
              Plataforma
            </p>

            <h1 className="marca-titulo">
              {configuracao.title}
            </h1>
          </div>
        </div>
      ) : (
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
      )}

      <div className="usuario-topo">
        <span className="usuario-identidade">
          {autenticado ? (
            <>
              <AvatarUsuario
                nome={usuario?.nome}
                fotoPerfilUrl={usuario?.fotoPerfilUrl}
                tamanho="sm"
                className="usuario-avatar"
                alt=""
              />

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

        {autenticado && (
          <NotificacoesBotao
            autenticado={autenticado}
          />
        )}

        {!autenticado && (
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
