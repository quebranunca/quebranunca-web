import {
  matchPath,
  useLocation
} from 'react-router-dom';

import { AppHero } from './AppHero';

import {
  ROTAS_APP_HEADER,
  TIPOS_TELA
} from '../pages/navagacao';

const ROTA_HOME_APP = '/app';
const ROTAS_PRINCIPAIS_SEM_VOLTAR = new Set([
  '/app'
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

function obterSubtituloPadrao(pathname, titulo) {
  if (pathname === '/ranking') {
    return 'Veja sua evolução.';
  }

  if (pathname === '/grupos') {
    return 'Organize partidas e acompanhe sua comunidade.';
  }

  if (pathname === '/minhas-partidas') {
    return 'Todas as suas partidas em um só lugar.';
  }

  if (pathname === '/mais') {
    return 'Perfil, histórico, benefícios e suporte.';
  }

  if (pathname === '/app/pendencias') {
    return 'Aprove partidas e resolva vínculos.';
  }

  return titulo === 'QuebraNunca'
    ? 'Futevôlei, ranking e comunidade.'
    : '';
}

export function AppHeader({
  autenticado,
  usuario,
  mostrarNotificacoes = true,
  aoSair
}) {
  const location = useLocation();
  const configuracao = obterConfiguracaoHeader(location.pathname);
  const telaHomeApp = autenticado && location.pathname === ROTA_HOME_APP;
  const telaInterna = autenticado && !ROTAS_PRINCIPAIS_SEM_VOLTAR.has(location.pathname);

  if (telaHomeApp) {
    return (
      <AppHero
        subtitle={`${obterSaudacaoAtual()},`}
        title={obterPrimeiroNomeUsuario(usuario)}
        accountUser={usuario}
        autenticado={autenticado}
        showNotifications={mostrarNotificacoes}
        showBackButton={false}
        onSair={aoSair}
        variant="home"
      />
    );
  }

  return (
    <AppHero
      title={configuracao.title}
      subtitle={obterSubtituloPadrao(location.pathname, configuracao.title)}
      accountUser={usuario}
      autenticado={autenticado}
      showNotifications={mostrarNotificacoes}
      showBackButton={telaInterna}
      onSair={aoSair}
      variant="page"
    />
  );
}
