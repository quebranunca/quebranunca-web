import { Navigate, Route, Routes } from 'react-router-dom';
import { RotaProtegida } from './routes/RotaProtegida';
import { LayoutPrincipal } from './layouts/LayoutPrincipal';
import { PaginaLogin } from './pages/PaginaLogin';
import { PaginaHome } from './pages/PaginaHome';
import { PaginaDashboard } from './pages/PaginaDashboard';
import { PaginaAtletas } from './pages/PaginaAtletas';
import { PaginaAtletaDashboard } from './pages/PaginaAtletaDashboard';
import { PaginaDuplaDashboard } from './pages/PaginaDuplaDashboard';
import { PaginaDuplas } from './pages/PaginaDuplas';
import { PaginaLigas } from './pages/PaginaLigas';
import { PaginaLocais } from './pages/PaginaLocais';
import { PaginaFormatosCampeonato } from './pages/PaginaFormatosCampeonato';
import { PaginaRegrasCompeticao } from './pages/PaginaRegrasCompeticao';
import { PaginaModelosImportacao } from './pages/PaginaModelosImportacao';
import { PaginaCompeticoes } from './pages/PaginaCompeticoes';
import { PaginaFormularioCampeonato } from './pages/PaginaFormularioCampeonato';
import { PaginaGrupos } from './pages/PaginaGrupos';
import { PaginaGrupoDashboard } from './pages/PaginaGrupoDashboard';
import { PaginaGrupoAtletas } from './pages/PaginaGrupoAtletas';
import { PaginaGrupoConfiguracoes } from './pages/PaginaGrupoConfiguracoes';
import { PaginaRanking } from './pages/PaginaRanking';
import { RankingLiga } from './pages/PaginaRankingLiga';
import { PaginaCategorias } from './pages/PaginaCategorias';
import { PaginaInscricoesCampeonato } from './pages/PaginaInscricoesCampeonato';
import { PaginaRegistrarPartidas } from './pages/PaginaRegistrarPartidas1';
import { PaginaConsultaPartidas } from './pages/PaginaConsultaPartidas';
import { PaginaPartidasCampeonato } from './pages/PaginaPartidasCampeonato';
import { PaginaMinhasPartidas } from './pages/PaginaMinhasPartidas';
import { PaginaMeuPerfil } from './pages/PaginaMeuPerfil';
import { PaginaPontosQN } from './pages/PaginaPontosQN';
import { PaginaScouts } from './pages/PaginaScouts';
import { PaginaArenas } from './pages/PaginaArenas';
import { PaginaArenaPublica } from './pages/PaginaArenaPublica';
import { MinhasArenasPage } from './pages/arena/MinhasArenasPage';
import { ArenaAdminDashboardPage } from './pages/arena/ArenaAdminDashboardPage';
import { PaginaPerfilUsuario } from './pages/PaginaPerfilUsuario';
import { PaginaPrivacidade } from './pages/PaginaPrivacidade';
import { PaginaPendenciasAtletas } from './pages/PaginaPendenciasAtletas';
import { PaginaUsuarios } from './pages/PaginaUsuarios';
import { PaginaConvitesCadastro } from './pages/PaginaConvitesCadastro';
import { PaginaSolicitacoesAcessoAdmin } from './pages/PaginaSolicitacoesAcessoAdmin';
import { PaginaCadastroConvite } from './pages/PaginaCadastroConvite';
import { RedirecionamentoPartidas } from './pages/RedirecionamentoPartidas';
import { FeedPartidasPage } from './pages/FeedPartidasPage';
import { PERFIS_USUARIO } from './utils/perfis';
import { ESTADOS_ACESSO } from './utils/acesso';
import { AtualizacaoAplicativoModal } from './components/AtualizacaoAplicativoModal';

export default function App() {
  return (
    <>
      <AtualizacaoAplicativoModal />
      <Routes>
        <Route path="/cadastro/convite" element={<PaginaCadastroConvite />} />
        <Route path="/cadastro/convite/:identificadorPublico" element={<PaginaCadastroConvite />} />
        <Route element={<LayoutPrincipal />}>
          <Route path="/" element={<PaginaHome />} />
          <Route path="/login" element={<PaginaLogin />} />        
          <Route path="/privacidade" element={<PaginaPrivacidade />} />
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
        <Route path="/app/feed" element={<FeedPartidasPage />} />
        <Route path="/app/registrar-partida" element={<Navigate to="/partidas/registrar" replace />} />
        <Route path="/app/meus-jogos" element={<Navigate to="/minhas-partidas" replace />} />
        <Route path="/app/minhas-partidas" element={<Navigate to="/minhas-partidas" replace />} />
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
    </>
  );
}
