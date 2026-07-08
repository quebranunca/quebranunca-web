import {
  Link,
  matchPath,
  useLocation
} from 'react-router-dom';

import { useEffect, useRef, useState } from 'react';
import { FaCog, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { HeaderBackButton } from './BotaoVoltar';
import { NotificacoesBotao } from './NotificacoesBotao';
import { AvatarUsuario, obterFotoPerfilAvatar } from './AvatarUsuario';

import {
  ROTAS_APP_HEADER,
  TIPOS_TELA
} from '../pages/navagacao';

const ROTA_HOME_APP = '/app';
const ROTAS_PRINCIPAIS_SEM_VOLTAR = new Set([
  '/app',
  '/admin',
  '/minhas-partidas',
  '/ranking',
  '/grupos',
  '/mais'
]);

function obterTextoLimpo(...valores) {
  return valores
    .map((valor) => String(valor || '').trim())
    .find(Boolean) || '';
}

function obterPrimeiroNomeUsuario(usuario) {
  return obterTextoLimpo(usuario?.nome, usuario?.nomeCompleto, usuario?.apelido, 'Atleta').split(/\s+/)[0];
}

function obterSaudacaoAtual() {
  const hora = new Date().getHours();

  if (hora < 12) {
    return 'Bom dia';
  }

  if (hora < 18) {
    return 'Boa tarde';
  }

  return 'Boa noite';
}

function obterApelidoUsuario(usuario) {
  const nome = obterTextoLimpo(usuario?.nome, usuario?.nomeCompleto);
  const apelido = obterTextoLimpo(
    usuario?.apelido,
    usuario?.apelidoAtleta,
    usuario?.atleta?.apelido,
    usuario?.atleta?.nomeExibicao
  );

  return apelido && apelido !== nome ? apelido : '';
}

function obterNivelUsuario(usuario) {
  return obterTextoLimpo(
    usuario?.nivelNome,
    usuario?.nivel,
    usuario?.atleta?.nivelNome,
    usuario?.atleta?.nivel?.nome
  );
}

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
  mostrarNotificacoes = true,
  aoSair
}) {
  const location = useLocation();
  const [menuContaAberto, setMenuContaAberto] = useState(false);
  const contaRef = useRef(null);

  const configuracao =
    obterConfiguracaoHeader(location.pathname);

  const telaHomeApp = autenticado && location.pathname === ROTA_HOME_APP;
  const telaInterna =
    autenticado &&
    !ROTAS_PRINCIPAIS_SEM_VOLTAR.has(location.pathname);

  const rotaHome =
    autenticado
      ? ROTA_HOME_APP
      : '/';
  const tituloTopo = telaHomeApp
    ? `${obterSaudacaoAtual()}, ${obterPrimeiroNomeUsuario(usuario)}`
    : configuracao.title;
  const apelidoTopo = telaHomeApp ? obterApelidoUsuario(usuario) : '';
  const nivelTopo = telaHomeApp ? obterNivelUsuario(usuario) : '';
  const subtituloTopo = [apelidoTopo, nivelTopo].filter(Boolean).join(' • ');

  useEffect(() => {
    setMenuContaAberto(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuContaAberto) {
      return undefined;
    }

    function aoClicarFora(evento) {
      if (!contaRef.current?.contains(evento.target)) {
        setMenuContaAberto(false);
      }
    }

    function aoPressionarTecla(evento) {
      if (evento.key === 'Escape') {
        setMenuContaAberto(false);
      }
    }

    document.addEventListener('mousedown', aoClicarFora);
    window.addEventListener('keydown', aoPressionarTecla);

    return () => {
      document.removeEventListener('mousedown', aoClicarFora);
      window.removeEventListener('keydown', aoPressionarTecla);
    };
  }, [menuContaAberto]);

  function sairDaConta() {
    setMenuContaAberto(false);
    aoSair?.();
  }

  return (
    <header className={`topo-app ${telaInterna ? 'topo-app-interno' : 'topo-app-principal'}`}>
      {telaInterna ? (
        <div className="marca-topo marca-topo-interna">
          <HeaderBackButton
            mostrarTexto={false}
            rotaFallback={ROTA_HOME_APP}
          />

          <div className="marca-texto">
            <h1 className="marca-titulo" title={configuracao.title}>
              {configuracao.title}
            </h1>
          </div>
        </div>
      ) : (
        <Link to={rotaHome} className="marca-topo" aria-label="Ir para a home">
          <div className="marca-texto">
            <h1 className="marca-titulo" title={tituloTopo}>
              {tituloTopo}
            </h1>
            {subtituloTopo && <span className="marca-subtitulo-app">{subtituloTopo}</span>}
          </div>
        </Link>
      )}

      <div className="usuario-topo">
        {autenticado && mostrarNotificacoes && (
          <NotificacoesBotao
            autenticado={autenticado}
          />
        )}

        {autenticado && (
          <div className="app-header-conta" ref={contaRef}>
            <button
              type="button"
              className="app-header-avatar-botao"
              aria-label="Abrir menu da conta"
              aria-haspopup="menu"
              aria-expanded={menuContaAberto}
              onClick={() => setMenuContaAberto((aberto) => !aberto)}
            >
              <AvatarUsuario
                nome={usuario?.nome}
                fotoPerfilUrl={obterFotoPerfilAvatar(usuario)}
                tamanho="sm"
                className="usuario-avatar"
                alt=""
              />
            </button>

            {menuContaAberto && (
              <nav className="app-header-conta-menu" aria-label="Menu da conta">
                <Link to="/app/perfil" onClick={() => setMenuContaAberto(false)}>
                  <FaUser aria-hidden="true" />
                  <span>Meu perfil</span>
                </Link>
                <Link to="/app/perfil?aba=configuracoes" onClick={() => setMenuContaAberto(false)}>
                  <FaCog aria-hidden="true" />
                  <span>Configurações</span>
                </Link>
                <button type="button" onClick={sairDaConta}>
                  <FaSignOutAlt aria-hidden="true" />
                  <span>Sair</span>
                </button>
              </nav>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
