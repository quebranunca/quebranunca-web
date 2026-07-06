import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaEnvelope,
  FaExclamationTriangle,
  FaGamepad,
  FaGlobeAmericas,
  FaLock,
  FaPlus,
  FaStar,
  FaTimes,
  FaTrash,
  FaUpload,
  FaUsers
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AvatarGrupo } from '../components/grupos/AvatarGrupo';
import { CriarGrupoFluxoModal } from '../components/grupos/CriarGrupoFluxoModal';
import { useNotification } from '../contexts/NotificationContext';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { gruposServico } from '../services/gruposServico';
import { ESTADOS_ACESSO } from '../utils/acesso';
import { comprimirImagemParaUpload, ehImagemNaoSuportada, ehImagemPermitida } from '../utils/compressaoImagem';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHora } from '../utils/formatacao';
import { obterNomeGrupoPartidaExibicao } from '../utils/partidas';
import { PERFIS_USUARIO, ehAtleta } from '../utils/perfis';

const estadoInicial = {
  nome: '',
  privacidade: 'Privado',
  imagemUrl: '',
  localPrincipal: '',
  diasDaSemana: []
};

const tamanhoMaximoImagemGrupoBytes = 2 * 1024 * 1024;

const opcoesPrivacidade = [
  {
    valor: 'Público',
    titulo: '🌎 Público',
    descricao: 'Qualquer atleta pode encontrar e solicitar participação.'
  },
  {
    valor: 'Privado',
    titulo: '🔒 Privado',
    descricao: 'Somente convidados podem participar.'
  }
];

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const dashboardVazio = {
  totais: {
    quantidadeGrupos: 0,
    quantidadeAtletas: 0,
    quantidadePartidas: 0,
    pendenciasGrupos: 0
  },
  grupos: [],
  gruposPublicos: []
};

function formatarUltimaAtividade(data) {
  if (!data) {
    return 'Sem atividade';
  }

  return formatarDataHora(data);
}

function obterIdGrupo(grupo) {
  return grupo.grupoId || grupo.id;
}

function obterQuantidade(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function textoSemAcento(valor) {
  return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function ehPrivacidadePublica(privacidade) {
  if (privacidade === true) {
    return true;
  }

  return textoSemAcento(privacidade).includes('public');
}

function ehGrupoPublico(grupo) {
  return grupo?.publico === true ||
    grupo?.ehPublico === true ||
    grupo?.isPublic === true ||
    ehPrivacidadePublica(grupo?.privacidade);
}

function obterPendenciasGrupo(grupo) {
  return obterQuantidade(
    grupo?.pendencias ??
    grupo?.quantidadePendencias ??
    grupo?.pendenciasAbertas ??
    grupo?.totalPendencias
  );
}

function pluralizar(quantidade, singular, plural = `${singular}s`) {
  return quantidade === 1 ? singular : plural;
}

function obterDataGrupo(grupo) {
  return grupo?.ultimaAtividade || grupo?.ultimaPartidaEm || grupo?.criadoEm || grupo?.dataCriacao || null;
}

function obterTimestampData(valor) {
  if (!valor) {
    return 0;
  }

  const data = new Date(valor).getTime();
  return Number.isFinite(data) ? data : 0;
}

function obterTimestampUltimoAcesso(grupo) {
  return Math.max(
    obterTimestampData(grupo?.ultimoAcessoEm),
    obterTimestampData(grupo?.ultimoAcessadoEm),
    obterTimestampData(grupo?.ultimoUsoEm),
    obterTimestampData(grupo?.ultimoGrupoAcessadoEm)
  );
}

function obterTimestampAtividadeGrupo(grupo) {
  return Math.max(
    obterTimestampData(grupo?.ultimaAtividade),
    obterTimestampData(grupo?.ultimaPartidaEm),
    obterTimestampData(grupo?.dataAtualizacao),
    obterTimestampData(grupo?.criadoEm),
    obterTimestampData(grupo?.dataCriacao)
  );
}

function ehGrupoPartidaAvulsa(grupo) {
  return obterNomeGrupoPartidaExibicao(grupo, '') === 'Partidas avulsas';
}

function ordenarGruposPorRelevancia(grupos) {
  return [...(grupos || [])]
    .filter((grupo) => !ehGrupoPartidaAvulsa(grupo))
    .sort((a, b) => {
      const ultimoAcesso = obterTimestampUltimoAcesso(b) - obterTimestampUltimoAcesso(a);
      if (ultimoAcesso !== 0) {
        return ultimoAcesso;
      }

      const ultimaAtividade = obterTimestampAtividadeGrupo(b) - obterTimestampAtividadeGrupo(a);
      if (ultimaAtividade !== 0) {
        return ultimaAtividade;
      }

      const partidas = obterQuantidade(b.quantidadePartidas) - obterQuantidade(a.quantidadePartidas);
      if (partidas !== 0) {
        return partidas;
      }

      return (a.nome || '').localeCompare(b.nome || '');
    });
}

function obterTextoUltimaPartida(grupo) {
  const possuiPartidas = obterQuantidade(grupo?.quantidadePartidas) > 0;
  const data = grupo?.ultimaPartidaEm || grupo?.ultimaAtividade;

  if (!possuiPartidas || !data) {
    return 'Sem partida recente';
  }

  return formatarUltimaAtividade(data);
}

function obterTextoUltimaAtividadeGrupo(grupo) {
  const data = grupo?.ultimaAtividade || grupo?.ultimaPartidaEm || grupo?.dataAtualizacao || grupo?.criadoEm || grupo?.dataCriacao;

  if (!data) {
    return 'Sem atividade recente';
  }

  return formatarUltimaAtividade(data);
}

function obterQuantidadeConvites(dashboard) {
  return obterQuantidade(
    dashboard?.convitesPendentes ??
    dashboard?.quantidadeConvitesPendentes ??
    dashboard?.totais?.convitesPendentes ??
    dashboard?.convites?.pendentes
  );
}

function obterListaDashboard(dashboard, chaves) {
  const lista = chaves
    .map((chave) => dashboard?.[chave])
    .find((valor) => Array.isArray(valor));

  return Array.isArray(lista) ? lista : [];
}

function obterDescricaoGrupo(grupo) {
  return normalizarNome(
    grupo?.descricao ||
    grupo?.resumo ||
    grupo?.sobre ||
    grupo?.mensagem ||
    ''
  );
}

function montarAtividadesRecentes(grupos) {
  return (grupos || []).slice(0, 4).flatMap((grupo) => {
    const grupoId = obterIdGrupo(grupo);
    const atividades = [];

    if (grupo.ultimaAtividade) {
      atividades.push({
        id: `${grupoId}-atividade`,
        grupoId,
        grupo,
        grupoNome: grupo.nome,
        descricao: obterQuantidade(grupo.quantidadePartidas) > 0 ? 'Nova partida registrada' : 'Grupo atualizado',
        data: grupo.ultimaAtividade,
        status: 'Ativo'
      });
    }

    if (obterPendenciasGrupo(grupo) > 0) {
      atividades.push({
        id: `${grupoId}-pendencia`,
        grupoId,
        grupo,
        grupoNome: grupo.nome,
        descricao: `${obterPendenciasGrupo(grupo)} ${pluralizar(obterPendenciasGrupo(grupo), 'pendência')} aberta`,
        data: obterDataGrupo(grupo),
        status: 'Pendente'
      });
    }

    if (!atividades.length) {
      atividades.push({
        id: `${grupoId}-grupo`,
        grupoId,
        grupo,
        grupoNome: grupo.nome,
        descricao: 'Grupo atualizado',
        data: obterDataGrupo(grupo),
        status: 'Grupo'
      });
    }

    return atividades;
  }).slice(0, 5);
}

function normalizarNome(nome) {
  return String(nome || '').trim().replace(/\s+/g, ' ');
}

function campoEditavel(elemento) {
  return elemento instanceof HTMLInputElement ||
    elemento instanceof HTMLTextAreaElement ||
    elemento instanceof HTMLSelectElement;
}

function aguardarRecalculoViewport() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.setTimeout(resolve, 90);
    });
  });
}

function GruposHomeHeader({ autenticado, podeCriarGrupo, onCriarGrupo }) {
  return (
    <header className="grupos-home-header">
      <div className="grupos-home-header-titulo">
        <span className="grupos-home-header-icone" aria-hidden="true">
          <FaUsers />
        </span>
        <div>
          <h1>Grupos</h1>
          <p>Sua comunidade de partidas</p>
        </div>
      </div>

      <div className="grupos-home-header-acoes">
        <button
          type="button"
          className="grupos-home-novo-botao"
          onClick={onCriarGrupo}
          disabled={!podeCriarGrupo && autenticado}
          aria-label="+ Novo grupo"
        >
          <FaPlus aria-hidden="true" />
          <span>Novo grupo</span>
        </button>
      </div>
    </header>
  );
}

function GruposHomeSecaoTitulo({ id, titulo, destaque, acao, onAcao }) {
  return (
    <div className="grupos-home-secao-titulo">
      <h2 id={id}>
        {titulo}
        {destaque && <FaStar aria-hidden="true" />}
      </h2>
      {acao && (
        <button type="button" onClick={onAcao}>
          {acao}
        </button>
      )}
    </div>
  );
}

function GrupoPrivacidadeBadge({ privacidade }) {
  const publico = ehPrivacidadePublica(privacidade);
  const Icone = publico ? FaGlobeAmericas : FaLock;

  return (
    <span className="grupos-home-badge">
      <Icone aria-hidden="true" />
      {publico ? 'Público' : 'Privado'}
    </span>
  );
}

function GrupoHomeMetricas({ grupo, compacto = false }) {
  const metricas = [
    { id: 'atletas', rotulo: 'Atletas', valor: obterQuantidade(grupo?.quantidadeAtletas), icone: FaUsers },
    { id: 'partidas', rotulo: 'Partidas', valor: obterQuantidade(grupo?.quantidadePartidas), icone: FaGamepad }
  ];
  const pendencias = obterPendenciasGrupo(grupo);

  if (pendencias > 0) {
    metricas.push({ id: 'pendencias', rotulo: 'Pendências', valor: pendencias, icone: FaExclamationTriangle });
  }

  return (
    <div
      className={`grupos-home-metricas grupos-home-metricas-${metricas.length} ${compacto ? 'grupos-home-metricas-compactas' : ''} ${metricas.length === 2 ? 'grupos-home-metricas-duas' : ''}`}
      aria-label="Indicadores do grupo"
    >
      {metricas.map((metrica) => {
        const Icone = metrica.icone;
        return (
          <span key={metrica.id}>
            <Icone aria-hidden="true" />
            <strong>{metrica.valor}</strong>
            <small>{metrica.rotulo}</small>
          </span>
        );
      })}
    </div>
  );
}

function GrupoPrincipalHomeCard({ grupo, onAbrir }) {
  return (
    <section className="grupos-home-principal" aria-labelledby="grupos-principal-titulo">
      <GruposHomeSecaoTitulo titulo="Seu grupo principal" destaque />
      <button
        type="button"
        className="grupos-home-principal-card"
        onClick={onAbrir}
        aria-label={`Abrir grupo ${grupo.nome}`}
      >
        <div className="grupos-home-principal-topo">
          <AvatarGrupo grupo={grupo} tamanho="xl" className="grupos-home-principal-avatar" />
          <div>
            <h2 id="grupos-principal-titulo">{grupo.nome}</h2>
            <GrupoPrivacidadeBadge privacidade={grupo.privacidade} />
          </div>
          <FaChevronRight aria-hidden="true" />
        </div>

        <GrupoHomeMetricas grupo={grupo} />

        <div className="grupos-home-ultima-linha">
          <span className="grupos-home-ultima-icone" aria-hidden="true">
            <FaClock />
          </span>
          <span>
            <small>Última atividade</small>
            <strong>{obterTextoUltimaAtividadeGrupo(grupo)}</strong>
          </span>
          <span className="grupos-home-abrir-cta">
            Abrir grupo
            <FaChevronRight aria-hidden="true" />
          </span>
        </div>
      </button>
    </section>
  );
}

function GrupoPrincipalVazioCard({ onCriarGrupo }) {
  return (
    <section className="grupos-home-principal" aria-labelledby="grupos-principal-vazio-titulo">
      <GruposHomeSecaoTitulo titulo="Seu grupo principal" destaque />
      <article className="grupos-home-principal-card grupos-home-principal-vazio">
        <span className="grupos-dashboard-card-icone"><FaUsers aria-hidden="true" /></span>
        <div>
          <h2 id="grupos-principal-vazio-titulo">Crie seu primeiro grupo</h2>
          <p>Organize sua turma para acompanhar ranking, histórico e scouts sem procurar informação em várias telas.</p>
        </div>
        <button type="button" className="grupos-home-abrir-cta" onClick={onCriarGrupo}>
          Criar grupo
          <FaChevronRight aria-hidden="true" />
        </button>
      </article>
    </section>
  );
}

function MeusGruposHomeLista({ grupos, temGrupoPrincipal = false, onAbrir, onVerTodos }) {
  return (
    <section className="grupos-home-meus" aria-labelledby="grupos-home-meus-titulo">
      <GruposHomeSecaoTitulo id="grupos-home-meus-titulo" titulo="Meus grupos" acao={grupos.length > 2 ? 'Ver todos' : null} onAcao={onVerTodos} />

      {grupos.length === 0 ? (
        <article className="grupos-home-card-vazio">
          <strong>{temGrupoPrincipal ? 'Você ainda tem só o grupo principal.' : 'Você ainda não participa de grupos.'}</strong>
          <p>{temGrupoPrincipal ? 'Quando participar de outros grupos, eles aparecerão aqui.' : 'Crie um grupo ou explore grupos públicos para começar.'}</p>
        </article>
      ) : (
        <div className="grupos-home-meus-lista" id="grupos-home-meus-lista">
          {grupos.map((grupo) => {
            const grupoId = obterIdGrupo(grupo);
            return (
              <button
                type="button"
                key={grupoId}
                className="grupos-home-grupo-card"
                onClick={() => onAbrir(grupoId)}
                aria-label={`Abrir grupo ${grupo.nome}`}
              >
                <div className="grupos-home-grupo-topo">
                  <AvatarGrupo grupo={grupo} tamanho="md" />
                  <div>
                    <strong>{grupo.nome}</strong>
                    <GrupoPrivacidadeBadge privacidade={grupo.privacidade} />
                  </div>
                  <FaChevronRight aria-hidden="true" />
                </div>

                <GrupoHomeMetricas grupo={grupo} compacto />

                <div className="grupos-home-grupo-ultima">
                  <span>
                    <small>Última partida</small>
                    <strong>{obterTextoUltimaPartida(grupo)}</strong>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function GruposHomeAcoesRapidas({ convitesPendentes, onCriarGrupo, onExplorarPublicos, onAbrirConvites }) {
  const acoes = [
    { id: 'criar', titulo: 'Criar grupo', icone: FaPlus, onClick: onCriarGrupo },
    { id: 'explorar', titulo: 'Explorar públicos', detalhe: 'Grupos públicos', icone: FaGlobeAmericas, onClick: onExplorarPublicos },
    { id: 'convites', titulo: 'Convites', icone: FaEnvelope, badge: convitesPendentes, onClick: onAbrirConvites }
  ];

  return (
    <section className="grupos-home-acoes" aria-labelledby="grupos-home-acoes-titulo">
      <GruposHomeSecaoTitulo id="grupos-home-acoes-titulo" titulo="Ações rápidas" />
      <div className="grupos-home-acoes-grid">
        {acoes.map((acao) => {
          const Icone = acao.icone;
          return (
            <button type="button" key={acao.id} className="grupos-home-acao-card" onClick={acao.onClick}>
              {acao.badge > 0 && <span className="grupos-home-acao-badge">{acao.badge}</span>}
              <Icone aria-hidden="true" />
              <span>
                <strong>{acao.titulo}</strong>
                {acao.detalhe && <small>{acao.detalhe}</small>}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function GruposHomeAtividadeRecente({ atividades, onAbrirGrupo }) {
  return (
    <section className="grupos-home-atividade" aria-labelledby="grupos-home-atividade-titulo">
      <GruposHomeSecaoTitulo id="grupos-home-atividade-titulo" titulo="Atividade recente" acao={atividades.length > 0 ? 'Ver todas' : null} onAcao={() => onAbrirGrupo?.(atividades[0]?.grupoId)} />

      <div className="grupos-home-atividade-lista">
        {atividades.length > 0 ? atividades.map((atividade) => {
          return (
            <button
              type="button"
              key={atividade.id}
              className="grupos-home-atividade-item"
              onClick={() => onAbrirGrupo?.(atividade.grupoId)}
            >
              <AvatarGrupo
                grupo={atividade.grupo}
                nome={atividade.grupoNome}
                tamanho="sm"
                className="grupos-home-atividade-avatar"
              />
              <span>
                <strong>{atividade.grupoNome}</strong>
                <small>{atividade.descricao}</small>
              </span>
              <time>{formatarUltimaAtividade(atividade.data)}</time>
              <FaChevronRight aria-hidden="true" />
            </button>
          );
        }) : (
          <article className="grupos-home-card-vazio">
            <strong>Nenhuma atividade recente</strong>
            <p>Partidas, pendências e movimentações dos grupos aparecerão aqui.</p>
          </article>
        )}
      </div>
    </section>
  );
}

function GruposHomePublicos({ grupos, onAbrir }) {
  return (
    <section className="grupos-home-publicos" id="grupos-publicos" aria-labelledby="grupos-publicos-titulo">
      <GruposHomeSecaoTitulo id="grupos-publicos-titulo" titulo="Explorar públicos" />
      {grupos.length === 0 ? (
        <article className="grupos-home-card-vazio">
          <strong>Nenhum grupo público disponível agora.</strong>
          <p>Quando houver grupos públicos disponíveis para você, eles aparecerão aqui.</p>
        </article>
      ) : (
        <div className="grupos-home-publicos-lista">
          {grupos.map((grupo) => {
            const grupoId = obterIdGrupo(grupo);
            const descricao = obterDescricaoGrupo(grupo) || 'Grupo público aberto para novos atletas.';

            return (
              <article key={grupoId} className="grupos-home-publico-card">
                <div className="grupos-home-publico-topo">
                  <AvatarGrupo grupo={grupo} nome={grupo.nome} tamanho="md" />
                  <div>
                    <strong>{grupo.nome}</strong>
                    <GrupoPrivacidadeBadge privacidade="Público" />
                  </div>
                </div>
                <p>{descricao}</p>
                <div className="grupos-home-publico-metricas" aria-label="Indicadores do grupo público">
                  <span><FaUsers aria-hidden="true" /> {obterQuantidade(grupo.quantidadeAtletas)}</span>
                  <span><FaGamepad aria-hidden="true" /> {obterQuantidade(grupo.quantidadePartidas)}</span>
                  {obterPendenciasGrupo(grupo) > 0 && (
                    <span><FaExclamationTriangle aria-hidden="true" /> {obterPendenciasGrupo(grupo)}</span>
                  )}
                </div>
                <button type="button" className="grupos-home-publico-entrar" onClick={() => onAbrir(grupoId)}>
                  Entrar
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function PaginaGrupos() {
  const navegar = useNavigate();
  const { token, usuario, estadoAcesso } = useAutenticacao();
  const { showNotification, closeNotification } = useNotification();
  const usuarioAtivo = estadoAcesso === ESTADOS_ACESSO.ativo;
  const usuarioAdministrador = Number(usuario?.perfil) === PERFIS_USUARIO.administrador;
  const usuarioOrganizador = Number(usuario?.perfil) === PERFIS_USUARIO.organizador;
  const usuarioAtleta = ehAtleta(usuario);
  const podeCriarGrupo = usuarioAtivo && (usuarioAdministrador || usuarioOrganizador || usuarioAtleta);

  const [dashboard, setDashboard] = useState(dashboardVazio);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [formularioOriginal, setFormularioOriginal] = useState(estadoInicial);
  const [grupoEdicaoId, setGrupoEdicaoId] = useState(null);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [modalConfirmacaoSaidaAberto, setModalConfirmacaoSaidaAberto] = useState(false);
  const [fluxoCriarAberto, setFluxoCriarAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [arquivoImagemGrupo, setArquivoImagemGrupo] = useState(null);
  const [previewImagemGrupo, setPreviewImagemGrupo] = useState('');
  const [removerImagemGrupo, setRemoverImagemGrupo] = useState(false);
  const inputImagemGrupoRef = useRef(null);
  const modalEdicaoRef = useRef(null);
  const nomeNormalizado = normalizarNome(formulario.nome);
  const localPrincipalNormalizado = normalizarNome(formulario.localPrincipal);
  const temDadosAlterados = grupoEdicaoId ? (
    nomeNormalizado !== normalizarNome(formularioOriginal.nome) ||
    formulario.privacidade !== formularioOriginal.privacidade ||
    localPrincipalNormalizado !== normalizarNome(formularioOriginal.localPrincipal) ||
    JSON.stringify(formulario.diasDaSemana || []) !== JSON.stringify(formularioOriginal.diasDaSemana || []) ||
    Boolean(arquivoImagemGrupo || previewImagemGrupo)
    || removerImagemGrupo
  ) : (
    nomeNormalizado !== '' ||
    formulario.privacidade !== estadoInicial.privacidade ||
    localPrincipalNormalizado !== estadoInicial.localPrincipal ||
    formulario.diasDaSemana.length > 0 ||
    Boolean(arquivoImagemGrupo || previewImagemGrupo)
  );

  const gruposOrdenados = useMemo(
    () => ordenarGruposPorRelevancia(dashboard.grupos),
    [dashboard.grupos]
  );

  useEffect(() => {
    carregarDados();
  }, [token, usuario?.id]);

  useEffect(() => {
    if (!formularioAberto) {
      return undefined;
    }

    document.documentElement.classList.add('grupos-edicao-modal-aberto');
    document.body.classList.add('grupos-edicao-modal-aberto');

    return () => {
      document.documentElement.classList.remove('grupos-edicao-modal-aberto');
      document.body.classList.remove('grupos-edicao-modal-aberto');
    };
  }, [formularioAberto]);

  useEffect(() => {
    if (!formularioAberto) {
      return undefined;
    }

    const viewport = window.visualViewport;
    const modal = modalEdicaoRef.current;
    let rafId = 0;

    function atualizarViewport() {
      if (!modal) {
        return;
      }

      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const offset = viewport
          ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
          : 0;
        const tecladoAberto = offset > 90;
        modal.dataset.tecladoAberto = tecladoAberto ? 'true' : 'false';
      });
    }

    atualizarViewport();
    viewport?.addEventListener('resize', atualizarViewport);
    viewport?.addEventListener('scroll', atualizarViewport);
    window.addEventListener('orientationchange', atualizarViewport);
    document.addEventListener('focusin', atualizarViewport);
    document.addEventListener('focusout', atualizarViewport);

    return () => {
      window.cancelAnimationFrame(rafId);
      viewport?.removeEventListener('resize', atualizarViewport);
      viewport?.removeEventListener('scroll', atualizarViewport);
      window.removeEventListener('orientationchange', atualizarViewport);
      document.removeEventListener('focusin', atualizarViewport);
      document.removeEventListener('focusout', atualizarViewport);
    };
  }, [formularioAberto]);

  async function carregarDados() {
    setCarregando(true);
    setErroCarregamento(false);

    try {
      if (!token) {
        setDashboard(dashboardVazio);
        return;
      }

      const dados = await gruposServico.obterDashboard();
      setDashboard({
        ...dados,
        totais: dados?.totais || dashboardVazio.totais,
        grupos: Array.isArray(dados?.grupos) ? dados.grupos : [],
        gruposPublicos: obterListaDashboard(dados, ['gruposPublicos', 'publicos', 'gruposDisponiveis', 'gruposParaExplorar'])
      });
    } catch (error) {
      setDashboard(dashboardVazio);
      setErroCarregamento(true);
      showNotification({
        type: 'error',
        title: 'Erro ao carregar grupos',
        message: extrairMensagemErro(error)
      });
    } finally {
      setCarregando(false);
    }
  }

  function atualizarCampo(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function rolarCampoParaVisivel(evento) {
    window.setTimeout(() => {
      evento.currentTarget.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    }, 120);
  }

  async function fecharTecladoEdicaoAntesDaAcao() {
    const ativo = document.activeElement;
    if (campoEditavel(ativo) && modalEdicaoRef.current?.contains(ativo)) {
      ativo.blur();
      await aguardarRecalculoViewport();
    }
  }

  function alternarDiaSemana(dia) {
    setFormulario((anterior) => {
      const diasAtuais = Array.isArray(anterior.diasDaSemana) ? anterior.diasDaSemana : [];
      const selecionado = diasAtuais.includes(dia);
      return {
        ...anterior,
        diasDaSemana: selecionado
          ? diasAtuais.filter((item) => item !== dia)
          : diasSemana.filter((item) => [...diasAtuais, dia].includes(item))
      };
    });
  }

  useEffect(() => {
    return () => {
      if (previewImagemGrupo) {
        URL.revokeObjectURL(previewImagemGrupo);
      }
    };
  }, [previewImagemGrupo]);

  function podeGerenciar(grupo) {
    if (!usuarioAtivo) {
      return false;
    }

    if (usuarioAdministrador) {
      return true;
    }

    return grupo.usuarioOrganizadorId === usuario?.id;
  }

  function abrirNovoGrupo() {
    setFluxoCriarAberto(true);
  }

  function iniciarCriacaoGrupo() {
    if (!podeCriarGrupo) {
      navegar('/login');
      return;
    }

    abrirNovoGrupo();
  }

  async function iniciarEdicao(grupo) {
    const grupoId = obterIdGrupo(grupo);

    try {
      const dadosGrupo = await gruposServico.obterPorId(grupoId);
      setGrupoEdicaoId(grupoId);
      const dadosFormulario = {
        nome: dadosGrupo.nome || '',
        privacidade: dadosGrupo.privacidade === 'Público' ? 'Público' : 'Privado',
        imagemUrl: dadosGrupo.imagemUrl || '',
        localPrincipal: dadosGrupo.localPrincipal || '',
        diasDaSemana: Array.isArray(dadosGrupo.diasDaSemana) ? dadosGrupo.diasDaSemana : []
      };
      setFormulario(dadosFormulario);
      setFormularioOriginal(dadosFormulario);
      setArquivoImagemGrupo(null);
      setPreviewImagemGrupo('');
      setRemoverImagemGrupo(false);
      setFormularioAberto(true);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao abrir grupo',
        message: extrairMensagemErro(error)
      });
    }
  }

  async function aoCriarGrupoFluxo(grupo) {
    await carregarDados();
    const grupoId = obterIdGrupo(grupo || {});

    showNotification({
      type: 'success',
      title: 'Grupo criado',
      message: 'O grupo foi criado com sucesso.'
    });

    setFluxoCriarAberto(false);

    if (grupoId) {
      navegar(`/grupos/${grupoId}`);
    }
  }

  function limparFormulario() {
    if (salvando) return;

    // Se há dados alterados, pedir confirmação
    if (temDadosAlterados) {
      setModalConfirmacaoSaidaAberto(true);
      return;
    }

    limparFormularioSemConfirmacao();
  }

  function limparFormularioSemConfirmacao() {
    setGrupoEdicaoId(null);
    setFormulario(estadoInicial);
    setFormularioOriginal(estadoInicial);
    setFormularioAberto(false);
    setModalConfirmacaoSaidaAberto(false);
    setArquivoImagemGrupo(null);
    setPreviewImagemGrupo('');
    setRemoverImagemGrupo(false);
    if (inputImagemGrupoRef.current) {
      inputImagemGrupoRef.current.value = '';
    }
  }

  async function selecionarImagemGrupo(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) {
      return;
    }

    if (ehImagemNaoSuportada(arquivo)) {
      showNotification({
        type: 'error',
        title: 'Formato não suportado',
        message: 'Envie uma imagem JPG, PNG ou WEBP.'
      });
      evento.target.value = '';
      return;
    }

    if (!ehImagemPermitida(arquivo)) {
      showNotification({
        type: 'error',
        title: 'Formato inválido',
        message: 'A foto do grupo deve ser uma imagem JPG, PNG ou WEBP.'
      });
      evento.target.value = '';
      return;
    }

    if (arquivo.size > tamanhoMaximoImagemGrupoBytes) {
      showNotification({
        type: 'error',
        title: 'Imagem muito grande',
        message: 'A foto do grupo deve ter no máximo 2MB.'
      });
      evento.target.value = '';
      return;
    }

    if (previewImagemGrupo) {
      URL.revokeObjectURL(previewImagemGrupo);
    }

    setArquivoImagemGrupo(arquivo);
    setPreviewImagemGrupo(URL.createObjectURL(arquivo));
    setRemoverImagemGrupo(false);
  }

  function marcarRemocaoImagemGrupo() {
    if (previewImagemGrupo) {
      URL.revokeObjectURL(previewImagemGrupo);
    }

    setArquivoImagemGrupo(null);
    setPreviewImagemGrupo('');
    setRemoverImagemGrupo(Boolean(formulario.imagemUrl));
    if (inputImagemGrupoRef.current) {
      inputImagemGrupoRef.current.value = '';
    }
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    await fecharTecladoEdicaoAntesDaAcao();
    setSalvando(true);

    try {
      const nome = normalizarNome(formulario.nome);
      if (!nome) {
        showNotification({
          type: 'error',
          title: 'Nome obrigatório',
          message: 'Informe o nome do grupo para salvar.'
        });
        return;
      }

      const dados = {
        nome,
        publico: formulario.privacidade === 'Público',
        localPrincipal: localPrincipalNormalizado || null,
        diasDaSemana: formulario.diasDaSemana
      };

      if (grupoEdicaoId) {
        await gruposServico.atualizar(grupoEdicaoId, dados);
        if (arquivoImagemGrupo) {
          const imagemParaUpload = await comprimirImagemParaUpload(arquivoImagemGrupo, {
            maxSizeMB: 2,
            maxWidthOrHeight: 900
          });
          await gruposServico.atualizarImagem(grupoEdicaoId, imagemParaUpload);
        } else if (removerImagemGrupo) {
          await gruposServico.removerImagem(grupoEdicaoId);
        }
        showNotification({
          type: 'success',
          title: 'Grupo atualizado',
          message: 'As alterações foram salvas com sucesso.'
        });
      } else {
        await gruposServico.criar(dados);
        showNotification({
          type: 'success',
          title: 'Grupo criado',
          message: 'O grupo foi criado com sucesso.'
        });
      }

      limparFormularioSemConfirmacao();
      await carregarDados();
    } catch (error) {
      showNotification({
        type: 'error',
        title: grupoEdicaoId ? 'Erro ao atualizar grupo' : 'Erro ao criar grupo',
        message: extrairMensagemErro(error)
      });
    } finally {
      setSalvando(false);
    }
  }

  async function removerGrupo(id) {
    try {
      await gruposServico.remover(id);
      showNotification({
        type: 'success',
        title: 'Grupo removido',
        message: 'O grupo foi removido com sucesso.'
      });
      await carregarDados();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao remover grupo',
        message: extrairMensagemErro(error)
      });
    }
  }

  function confirmarRemocaoGrupo(id) {
    showNotification({
      type: 'warning',
      title: 'Remover grupo?',
      message: 'Esta ação remove o grupo selecionado.',
      autoClose: false,
      actions: (
        <>
          <button type="button" className="botao-secundario" onClick={closeNotification}>
            Cancelar
          </button>
          <button
            type="button"
            className="botao-perigo"
            onClick={() => {
              closeNotification();
              removerGrupo(id);
            }}
          >
            Remover
          </button>
        </>
      )
    });
  }

  function navegarParaRegistro(grupoId) {
    if (!usuarioAtivo) {
      navegar('/login');
      return;
    }

    navegar(grupoId ? `/partidas/registrar?grupoId=${grupoId}` : '/partidas/registrar');
  }

  function rolarParaMeusGrupos() {
    document.getElementById('grupos-home-meus-lista')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function rolarParaPublicos() {
    document.getElementById('grupos-publicos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const totais = dashboard.totais || dashboardVazio.totais;
  const autenticado = Boolean(token);
  const possuiGrupos = gruposOrdenados.length > 0;
  const grupoAtual = gruposOrdenados[0] || null;
  const grupoAtualId = grupoAtual ? obterIdGrupo(grupoAtual) : null;
  const outrosGrupos = grupoAtualId ? gruposOrdenados.filter((grupo) => obterIdGrupo(grupo) !== grupoAtualId) : [];
  const idsMeusGrupos = new Set(gruposOrdenados.map(obterIdGrupo).filter(Boolean));
  const gruposPublicos = ordenarGruposPorRelevancia(dashboard.gruposPublicos)
    .filter((grupo) => ehGrupoPublico({ privacidade: 'Público', ...grupo }))
    .filter((grupo) => !idsMeusGrupos.has(obterIdGrupo(grupo)))
    .slice(0, 6);
  const convitesPendentes = obterQuantidadeConvites(dashboard);
  const atividadesRecentes = montarAtividadesRecentes(gruposOrdenados);

  return (
    <section className="pagina grupos-dashboard-pagina">
      <GruposHomeHeader
        autenticado={autenticado}
        podeCriarGrupo={podeCriarGrupo}
        onCriarGrupo={iniciarCriacaoGrupo}
      />

      {podeCriarGrupo && formularioAberto && (
        <div className="modal-sobreposicao grupos-edicao-sobreposicao" role="presentation" onClick={limparFormulario}>
          <article
            className="modal-conteudo grupos-edicao-modal"
            ref={modalEdicaoRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="grupos-edicao-titulo"
            onClick={(evento) => evento.stopPropagation()}
          >
            <header className="grupos-edicao-header">
              <button
                type="button"
                className="grupos-edicao-icone-botao"
                onClick={limparFormulario}
                disabled={salvando}
                aria-label="Voltar"
                title="Voltar"
              >
                <FaChevronLeft aria-hidden="true" />
              </button>
              <div>
                <strong id="grupos-edicao-titulo">Editar grupo</strong>
                <p>Atualize as informações básicas do grupo.</p>
              </div>
              <button
                type="button"
                className="grupos-edicao-icone-botao"
                onClick={limparFormulario}
                disabled={salvando}
                aria-label="Fechar"
                title="Fechar"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </header>

            <form id="grupos-edicao-formulario" className="grupos-edicao-formulario" onSubmit={aoSubmeter}>
              <section className="grupos-edicao-avatar-bloco" aria-label="Foto do grupo">
                <AvatarGrupo
                  nome={formulario.nome}
                  imagemUrl={previewImagemGrupo || (removerImagemGrupo ? '' : formulario.imagemUrl)}
                  tamanho="xl"
                  className="grupos-edicao-avatar"
                />
                <div className="grupos-edicao-avatar-info">
                  <strong>Foto do grupo</strong>
                  <span>Opcional. Use uma imagem JPG, PNG ou WEBP de até 2MB.</span>
                  <div className="grupos-edicao-avatar-acoes">
                    <input
                      ref={inputImagemGrupoRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={selecionarImagemGrupo}
                    />
                    <button type="button" className="botao-secundario" onClick={() => inputImagemGrupoRef.current?.click()} disabled={salvando}>
                      <FaUpload aria-hidden="true" /> Alterar foto
                    </button>
                    {(formulario.imagemUrl || previewImagemGrupo) && !removerImagemGrupo && (
                      <button type="button" className="botao-texto-perigo" onClick={marcarRemocaoImagemGrupo} disabled={salvando}>
                        <FaTrash aria-hidden="true" /> Remover foto
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <label className="grupos-edicao-campo">
                <span>Nome do grupo</span>
                <input
                  value={formulario.nome}
                  onChange={(evento) => atualizarCampo('nome', evento.target.value)}
                  onFocus={rolarCampoParaVisivel}
                  required
                  autoFocus
                />
              </label>

              <fieldset className="grupos-edicao-visibilidade">
                <legend>Quem pode encontrar este grupo?</legend>
                <div>
                  {opcoesPrivacidade.map((opcao) => {
                    const selecionada = formulario.privacidade === opcao.valor;

                    return (
                      <button
                        type="button"
                        key={opcao.valor}
                        className={selecionada ? 'selecionada' : undefined}
                        onClick={() => atualizarCampo('privacidade', opcao.valor)}
                        aria-pressed={selecionada}
                      >
                        <strong>{opcao.titulo}</strong>
                        <span>{opcao.descricao}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label className="grupos-edicao-campo">
                <span>Local principal</span>
                <input
                  value={formulario.localPrincipal}
                  onChange={(evento) => atualizarCampo('localPrincipal', evento.target.value)}
                  onBlur={(evento) => atualizarCampo('localPrincipal', normalizarNome(evento.target.value))}
                  onFocus={rolarCampoParaVisivel}
                  placeholder="Ex.: Praia do Forte"
                  maxLength="200"
                />
              </label>

              <fieldset className="grupos-edicao-dias">
                <legend>Quando o grupo normalmente joga?</legend>
                <div>
                  {diasSemana.map((dia) => {
                    const selecionado = formulario.diasDaSemana.includes(dia);

                    return (
                      <button
                        type="button"
                        key={dia}
                        className={selecionado ? 'selecionado' : undefined}
                        onClick={() => alternarDiaSemana(dia)}
                        aria-pressed={selecionado}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

            </form>

            <footer className="grupos-edicao-acoes">
              <button type="button" className="botao-secundario" onClick={limparFormulario} disabled={salvando}>
                Cancelar
              </button>
              <button
                type="submit"
                form="grupos-edicao-formulario"
                className="botao-primario"
                disabled={salvando}
                onPointerDown={() => {
                  const ativo = document.activeElement;
                  if (campoEditavel(ativo) && modalEdicaoRef.current?.contains(ativo)) {
                    ativo.blur();
                  }
                }}
              >
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </footer>

            {modalConfirmacaoSaidaAberto && (
              <div className="grupos-edicao-confirmacao-backdrop" role="presentation">
                <section className="grupos-edicao-confirmacao" role="dialog" aria-modal="true">
                  <div className="grupos-edicao-confirmacao-topo">
                    <h3>Deseja sair sem salvar?</h3>
                    <p>As alterações não salvas serão perdidas.</p>
                  </div>

                  <div className="grupos-edicao-confirmacao-acoes">
                    <button
                      type="button"
                      className="botao-secundario"
                      onClick={() => setModalConfirmacaoSaidaAberto(false)}
                    >
                      Continuar editando
                    </button>
                    <button
                      type="button"
                      className="botao-perigo"
                      onClick={limparFormularioSemConfirmacao}
                    >
                      Sair
                    </button>
                  </div>
                </section>
              </div>
            )}
          </article>
        </div>
      )}

      {carregando ? (
        <article className="cartao-lista grupos-dashboard-estado">
          <p>Carregando grupos...</p>
        </article>
      ) : erroCarregamento ? (
        <article className="cartao-lista grupos-dashboard-estado">
          <h3>Não foi possível carregar seus grupos agora</h3>
          <p>Tente novamente em instantes.</p>
          <button type="button" className="botao-secundario" onClick={carregarDados}>
            Recarregar
          </button>
        </article>
      ) : !possuiGrupos ? (
        <>
          <GrupoPrincipalVazioCard onCriarGrupo={iniciarCriacaoGrupo} />
          <MeusGruposHomeLista
            grupos={[]}
            temGrupoPrincipal={false}
            onAbrir={(grupoId) => navegar(`/grupos/${grupoId}`)}
            onVerTodos={rolarParaMeusGrupos}
          />
          <GruposHomeAcoesRapidas
            convitesPendentes={convitesPendentes}
            onCriarGrupo={iniciarCriacaoGrupo}
            onExplorarPublicos={rolarParaPublicos}
            onAbrirConvites={() => navegar('/app/pendencias')}
          />
          <GruposHomeAtividadeRecente atividades={[]} onAbrirGrupo={(grupoId) => grupoId && navegar(`/grupos/${grupoId}`)} />
          <GruposHomePublicos grupos={gruposPublicos} onAbrir={(grupoId) => navegar(`/grupos/${grupoId}`)} />
        </>
      ) : (
        <>
          <GrupoPrincipalHomeCard
            grupo={grupoAtual}
            onAbrir={() => navegar(`/grupos/${grupoAtualId}`)}
          />
          <MeusGruposHomeLista
            grupos={outrosGrupos}
            temGrupoPrincipal={Boolean(grupoAtual)}
            onAbrir={(grupoId) => navegar(`/grupos/${grupoId}`)}
            onVerTodos={rolarParaMeusGrupos}
          />
          <GruposHomeAcoesRapidas
            convitesPendentes={convitesPendentes}
            onCriarGrupo={iniciarCriacaoGrupo}
            onExplorarPublicos={rolarParaPublicos}
            onAbrirConvites={() => navegar('/app/pendencias')}
          />
          <GruposHomeAtividadeRecente
            atividades={atividadesRecentes}
            onAbrirGrupo={(grupoId) => grupoId && navegar(`/grupos/${grupoId}`)}
          />
          <GruposHomePublicos grupos={gruposPublicos} onAbrir={(grupoId) => navegar(`/grupos/${grupoId}`)} />
        </>
      )}

      <CriarGrupoFluxoModal
        aberto={fluxoCriarAberto}
        onFechar={() => setFluxoCriarAberto(false)}
        onCriado={aoCriarGrupoFluxo}
      />
    </section>
  );
}
