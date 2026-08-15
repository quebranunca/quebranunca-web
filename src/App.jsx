import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RotaProtegida } from './routes/RotaProtegida';
import { LayoutPrincipal } from './layouts/LayoutPrincipal';
import { PERFIS_USUARIO } from './utils/perfis';
import { ESTADOS_ACESSO } from './utils/acesso';
import { AtualizacaoAplicativoModal } from './components/AtualizacaoAplicativoModal';

function carregarPagina(importador, exportacao) {
  return lazy(() => importador().then((modulo) => ({ default: modulo[exportacao] })));
}

function CarregandoRota() {
  return <div className="ranking-estado">Carregando tela...</div>;
}

const PaginaLogin = carregarPagina(() => import('./pages/PaginaLogin'), 'PaginaLogin');
const PaginaHome = carregarPagina(() => import('./pages/PaginaHome'), 'PaginaHome');
const PaginaDashboard = carregarPagina(() => import('./pages/PaginaDashboard'), 'PaginaDashboard');
const PaginaAtletas = carregarPagina(() => import('./pages/PaginaAtletas'), 'PaginaAtletas');
const PaginaAtletaDashboard = carregarPagina(() => import('./pages/PaginaAtletaDashboard'), 'PaginaAtletaDashboard');
const PaginaDuplaDashboard = carregarPagina(() => import('./pages/PaginaDuplaDashboard'), 'PaginaDuplaDashboard');
const PaginaDuplas = carregarPagina(() => import('./pages/PaginaDuplas'), 'PaginaDuplas');
const PaginaLigas = carregarPagina(() => import('./pages/PaginaLigas'), 'PaginaLigas');
const PaginaLocais = carregarPagina(() => import('./pages/PaginaLocais'), 'PaginaLocais');
const PaginaFormatosCampeonato = carregarPagina(() => import('./pages/PaginaFormatosCampeonato'), 'PaginaFormatosCampeonato');
const PaginaRegrasCompeticao = carregarPagina(() => import('./pages/PaginaRegrasCompeticao'), 'PaginaRegrasCompeticao');
const PaginaModelosImportacao = carregarPagina(() => import('./pages/PaginaModelosImportacao'), 'PaginaModelosImportacao');
const PaginaCompeticoes = carregarPagina(() => import('./pages/PaginaCompeticoes'), 'PaginaCompeticoes');
const PaginaFormularioCampeonato = carregarPagina(() => import('./pages/PaginaFormularioCampeonato'), 'PaginaFormularioCampeonato');
const PaginaGrupos = carregarPagina(() => import('./pages/PaginaGrupos'), 'PaginaGrupos');
const PaginaCriarGrupo = carregarPagina(() => import('./pages/PaginaCriarGrupo'), 'PaginaCriarGrupo');
const PaginaGrupoDashboard = carregarPagina(() => import('./pages/PaginaGrupoDashboard'), 'PaginaGrupoDashboard');
const PaginaGrupoAtletas = carregarPagina(() => import('./pages/PaginaGrupoAtletas'), 'PaginaGrupoAtletas');
const PaginaGrupoConfiguracoes = carregarPagina(() => import('./pages/PaginaGrupoConfiguracoes'), 'PaginaGrupoConfiguracoes');
const PaginaRanking = carregarPagina(() => import('./pages/PaginaRanking'), 'PaginaRanking');
const RankingLiga = carregarPagina(() => import('./pages/PaginaRankingLiga'), 'RankingLiga');
const PaginaCategorias = carregarPagina(() => import('./pages/PaginaCategorias'), 'PaginaCategorias');
const PaginaInscricoesCampeonato = carregarPagina(() => import('./pages/PaginaInscricoesCampeonato'), 'PaginaInscricoesCampeonato');
const PaginaRegistrarPartidas = carregarPagina(() => import('./pages/PaginaRegistrarPartidas1'), 'PaginaRegistrarPartidas');
const PaginaConsultaPartidas = carregarPagina(() => import('./pages/PaginaConsultaPartidas'), 'PaginaConsultaPartidas');
const PaginaPartidasCampeonato = carregarPagina(() => import('./pages/PaginaPartidasCampeonato'), 'PaginaPartidasCampeonato');
const PaginaPartidaDetalhe = carregarPagina(() => import('./pages/PaginaPartidaDetalhe'), 'PaginaPartidaDetalhe');
const PaginaEditarPartida = carregarPagina(() => import('./pages/PaginaEditarPartida'), 'PaginaEditarPartida');
const PaginaMinhasPartidas = carregarPagina(() => import('./pages/PaginaMinhasPartidas'), 'PaginaMinhasPartidas');
const PaginaMeuPerfil = carregarPagina(() => import('./pages/PaginaMeuPerfil'), 'PaginaMeuPerfil');
const PaginaMais = carregarPagina(() => import('./pages/PaginaMais'), 'PaginaMais');
const PaginaPontosQN = carregarPagina(() => import('./pages/PaginaPontosQN'), 'PaginaPontosQN');
const PaginaScouts = carregarPagina(() => import('./pages/PaginaScouts'), 'PaginaScouts');
const PaginaArenas = carregarPagina(() => import('./pages/PaginaArenas'), 'PaginaArenas');
const PaginaArenaPublica = carregarPagina(() => import('./pages/PaginaArenaPublica'), 'PaginaArenaPublica');
const MinhasArenasPage = carregarPagina(() => import('./pages/arena/MinhasArenasPage'), 'MinhasArenasPage');
const ArenaAdminDashboardPage = carregarPagina(() => import('./pages/arena/ArenaAdminDashboardPage'), 'ArenaAdminDashboardPage');
const PaginaPerfilUsuario = carregarPagina(() => import('./pages/PaginaPerfilUsuario'), 'PaginaPerfilUsuario');
const PaginaPrivacidade = carregarPagina(() => import('./pages/PaginaPrivacidade'), 'PaginaPrivacidade');
const PaginaTermosUso = carregarPagina(() => import('./pages/PaginaTermosUso'), 'PaginaTermosUso');
const PaginaPendenciasAtletas = carregarPagina(() => import('./pages/PaginaPendenciasAtletas'), 'PaginaPendenciasAtletas');
const PaginaUsuarios = carregarPagina(() => import('./pages/PaginaUsuarios'), 'PaginaUsuarios');
const PaginaConvitesCadastro = carregarPagina(() => import('./pages/PaginaConvitesCadastro'), 'PaginaConvitesCadastro');
const PaginaSolicitacoesAcessoAdmin = carregarPagina(() => import('./pages/PaginaSolicitacoesAcessoAdmin'), 'PaginaSolicitacoesAcessoAdmin');
const PaginaCadastroConvite = carregarPagina(() => import('./pages/PaginaCadastroConvite'), 'PaginaCadastroConvite');
const RedirecionamentoPartidas = carregarPagina(() => import('./pages/RedirecionamentoPartidas'), 'RedirecionamentoPartidas');
const FeedPartidasPage = carregarPagina(() => import('./pages/FeedPartidasPage'), 'FeedPartidasPage');

export default function App() {
  return (
    <>
      <AtualizacaoAplicativoModal />
      <Suspense fallback={<CarregandoRota />}>
      <Routes>
        <Route path="/cadastro/convite" element={<PaginaCadastroConvite />} />
        <Route path="/cadastro/convite/:identificadorPublico" element={<PaginaCadastroConvite />} />
        <Route element={<LayoutPrincipal />}>
          <Route path="/" element={<PaginaHome />} />
          <Route path="/login" element={<PaginaLogin />} />        
          {import.meta.env.DEV && (
            <Route path="/preview/perfil-onboarding" element={<PaginaMeuPerfil />} />
          )}
          <Route path="/privacidade" element={<PaginaPrivacidade />} />
          <Route path="/termos" element={<PaginaTermosUso />} />
          <Route path="/ranking" element={<PaginaRanking />} />
          <Route path="/ranking/liga" element={<RankingLiga />} />
          <Route path="/competicoes" element={<PaginaCompeticoes />} />
          <Route path="/arenas" element={<PaginaArenas />} />
          <Route path="/arenas/admin/:arenaId" element={<ArenaAdminDashboardPage />} />
          <Route path="/arenas/:slug" element={<PaginaArenaPublica />} />
          <Route path="/inscricoes" element={<PaginaInscricoesCampeonato />} />
          <Route path="/atletas" element={<PaginaAtletas />} />
          <Route path="/atletas/:atletaId" element={<PaginaAtletaDashboard />} />
          <Route path="/atletas/:atletaId/dashboard" element={<PaginaAtletaDashboard />} />
          <Route path="/duplas/:atleta1Id/:atleta2Id" element={<PaginaDuplaDashboard />} />
          <Route path="/grupos" element={<PaginaGrupos />} />
          <Route path="/grupos/:grupoId" element={<PaginaGrupoDashboard />} />
          <Route path="/grupos/:grupoId/atletas" element={<PaginaGrupoAtletas />} />
          <Route path="/grupos/:grupoId/configuracoes" element={<PaginaGrupoConfiguracoes />} />
          <Route path="/partidas" element={<RedirecionamentoPartidas />} />
          <Route path="/feed" element={<FeedPartidasPage />} />
          <Route path="/partidas/consulta" element={<PaginaConsultaPartidas />} />
          <Route path="/partidas/campeonato" element={<PaginaPartidasCampeonato />} />
        </Route>

        <Route
        element={
          <RotaProtegida>
            <LayoutPrincipal />
          </RotaProtegida>
        }
      >
        <Route path="/app" element={<PaginaHome />} />
        <Route path="/app/mais" element={<Navigate to="/mais" replace />} />
        <Route path="/app/feed" element={<FeedPartidasPage />} />
        <Route path="/app/registrar-partida" element={<Navigate to="/partidas/registrar" replace />} />
        <Route path="/app/meus-jogos" element={<Navigate to="/minhas-partidas" replace />} />
        <Route path="/app/minhas-partidas" element={<Navigate to="/minhas-partidas" replace />} />
        <Route
          path="/app/grupos/criar"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador, PERFIS_USUARIO.organizador, PERFIS_USUARIO.atleta]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaCriarGrupo />
            </RotaProtegida>
          }
        />
        <Route
          path="/app/partidas/:partidaId"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador, PERFIS_USUARIO.organizador, PERFIS_USUARIO.atleta]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaPartidaDetalhe />
            </RotaProtegida>
          }
        />
        <Route
          path="/app/partidas/:partidaId/editar"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador, PERFIS_USUARIO.organizador, PERFIS_USUARIO.atleta]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaEditarPartida />
            </RotaProtegida>
          }
        />
        <Route
          path="/minhas-partidas"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador, PERFIS_USUARIO.organizador, PERFIS_USUARIO.atleta]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaMinhasPartidas />
            </RotaProtegida>
          }
        />
        <Route
          path="/mais"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador, PERFIS_USUARIO.organizador, PERFIS_USUARIO.atleta]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaMais />
            </RotaProtegida>
          }
        />
        <Route
          path="/app/pontos-qn"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador, PERFIS_USUARIO.organizador, PERFIS_USUARIO.atleta]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaPontosQN />
            </RotaProtegida>
          }
        />
        <Route
          path="/app/scouts"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador, PERFIS_USUARIO.organizador, PERFIS_USUARIO.atleta]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaScouts />
            </RotaProtegida>
          }
        />
        <Route
          path="/minhas-arenas"
          element={
            <RotaProtegida
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <MinhasArenasPage />
            </RotaProtegida>
          }
        />
        <Route path="/minhas-partidas-registradas" element={<Navigate to="/minhas-partidas?filtro=registradas" replace />} />
        <Route
          path="/app/inicio"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaDashboard />
            </RotaProtegida>
          }
        />
        <Route
          path="/app/organizacao"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaDashboard />
            </RotaProtegida>
          }
        />
        <Route
          path="/admin"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaDashboard />
            </RotaProtegida>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaUsuarios />
            </RotaProtegida>
          }
        />
        <Route
          path="/admin/solicitacoes-acesso"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaSolicitacoesAcessoAdmin />
            </RotaProtegida>
          }
        />
        <Route
          path="/admin/convites"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaConvitesCadastro />
            </RotaProtegida>
          }
        />
        <Route
          path="/admin/atletas"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaAtletas />
            </RotaProtegida>
          }
        />
        <Route
          path="/admin/grupos"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaGrupos />
            </RotaProtegida>
          }
        />
        <Route
          path="/admin/competicoes"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaCompeticoes />
            </RotaProtegida>
          }
        />
        <Route
          path="/admin/categorias"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaCategorias />
            </RotaProtegida>
          }
        />
        <Route
          path="/admin/partidas"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaConsultaPartidas />
            </RotaProtegida>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaDashboard />
            </RotaProtegida>
          }
        />
        <Route
          path="/app/perfil"
          element={
            <RotaProtegida
              estadosPermitidos={[ESTADOS_ACESSO.primeiroAcesso, ESTADOS_ACESSO.cadastroIncompleto, ESTADOS_ACESSO.ativo]}
            >
              <PaginaMeuPerfil />
            </RotaProtegida>
          }
        />
        <Route path="/meu-perfil" element={<Navigate to="/app/perfil" replace />} />
        <Route
          path="/perfil-usuario"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaPerfilUsuario />
            </RotaProtegida>
          }
        />
        <Route
          path="/app/pendencias"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador, PERFIS_USUARIO.organizador, PERFIS_USUARIO.atleta]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaPendenciasAtletas />
            </RotaProtegida>
          }
        />
        <Route
          path="/pendencias"
          element={
            <Navigate to="/app/pendencias" replace />
          }
        />
        <Route
          path="/pendencias-atletas"
          element={<Navigate to="/pendencias" replace />}
        />
        <Route
          path="/duplas"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador, PERFIS_USUARIO.organizador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaDuplas />
            </RotaProtegida>
          }
        />
        <Route
          path="/ligas"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaLigas />
            </RotaProtegida>
          }
        />
        <Route
          path="/locais"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador, PERFIS_USUARIO.organizador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaLocais />
            </RotaProtegida>
          }
        />
        <Route
          path="/formatos-campeonato"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaFormatosCampeonato />
            </RotaProtegida>
          }
        />
        <Route
          path="/regras"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador, PERFIS_USUARIO.organizador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaRegrasCompeticao />
            </RotaProtegida>
          }
        />
        <Route
          path="/modelos-importacao"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaModelosImportacao />
            </RotaProtegida>
          }
        />
        <Route
          path="/campeonatos/novo"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador, PERFIS_USUARIO.organizador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaFormularioCampeonato />
            </RotaProtegida>
          }
        />
        <Route
          path="/campeonatos/:id/editar"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador, PERFIS_USUARIO.organizador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaFormularioCampeonato />
            </RotaProtegida>
          }
        />
        <Route
          path="/categorias"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador, PERFIS_USUARIO.organizador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaCategorias />
            </RotaProtegida>
          }
        />
        <Route
          path="/partidas/registrar"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador, PERFIS_USUARIO.organizador, PERFIS_USUARIO.atleta]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaRegistrarPartidas />
            </RotaProtegida>
          }
        />
        <Route
          path="/usuarios"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaUsuarios />
            </RotaProtegida>
          }
        />
        <Route
          path="/convites-cadastro"
          element={
            <RotaProtegida
              perfisPermitidos={[PERFIS_USUARIO.administrador]}
              estadosPermitidos={[ESTADOS_ACESSO.ativo]}
            >
              <PaginaConvitesCadastro />
            </RotaProtegida>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </>
  );
}
