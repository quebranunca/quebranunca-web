import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaCalendarCheck,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaExclamationTriangle,
  FaGamepad,
  FaPlus,
  FaStar,
  FaTimes,
  FaTrash,
  FaTrophy,
  FaUpload,
  FaUserPlus,
  FaUsers
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import heroFutevolei from '../assets/home-futevolei-hero.jpg';
import { LogoQNF } from '../components/branding/LogoQNF';
import { AvatarGrupo, obterImagemGrupoAvatar } from '../components/grupos/AvatarGrupo';
import { CriarGrupoFluxoModal } from '../components/grupos/CriarGrupoFluxoModal';
import { NotificacoesBotao } from '../components/NotificacoesBotao';
import { useNotification } from '../contexts/NotificationContext';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { gruposServico } from '../services/gruposServico';
import { resolverUrlRecurso } from '../services/http';
import { ESTADOS_ACESSO } from '../utils/acesso';
import { comprimirImagemParaUpload, ehImagemNaoSuportada, ehImagemPermitida } from '../utils/compressaoImagem';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHora } from '../utils/formatacao';
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
  grupos: []
};

const gruposPopularesPlaceholder = [
  {
    id: 'popular-praia-central',
    nome: 'Praia Central',
    quantidadeAtletas: 32,
    quantidadePartidas: 118
  },
  {
    id: 'popular-sol-e-rede',
    nome: 'Sol e Rede',
    quantidadeAtletas: 24,
    quantidadePartidas: 86
  },
  {
    id: 'popular-quebra-areia',
    nome: 'Quebra Areia',
    quantidadeAtletas: 18,
    quantidadePartidas: 54
  }
];

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

function pluralizar(quantidade, singular, plural = `${singular}s`) {
  return quantidade === 1 ? singular : plural;
}

function obterPerfilNoGrupo(grupo, podeGerenciarGrupo) {
  return grupo?.perfilUsuarioNoGrupo || grupo?.perfilNoGrupo || grupo?.papelUsuario || (podeGerenciarGrupo ? 'Administrador' : 'Membro');
}

function obterDataGrupo(grupo) {
  return grupo?.ultimaAtividade || grupo?.ultimaPartidaEm || grupo?.criadoEm || grupo?.dataCriacao || null;
}

function obterUltimaPartidaGrupo(grupo) {
  if (!grupo) {
    return null;
  }

  const listas = [
    grupo.ultimasPartidas,
    grupo.partidasRecentes,
    grupo.atividadeRecente
  ];

  const partidaEmLista = listas
    .filter(Array.isArray)
    .flat()
    .find((item) => item?.tipo === undefined || String(item?.tipo || '').toLowerCase().includes('partida'));

  return grupo.ultimaPartida || grupo.partidaRecente || partidaEmLista || null;
}

function obterPlacarPartida(partida) {
  if (!partida) {
    return 'Sem partida';
  }

  const placarA = partida.placarDupla1 ?? partida.placarTimeA ?? partida.placarEquipeA ?? partida.placarSuaDupla;
  const placarB = partida.placarDupla2 ?? partida.placarTimeB ?? partida.placarEquipeB ?? partida.placarAdversarios;

  if (placarA === null || placarA === undefined || placarB === null || placarB === undefined) {
    return partida.resultadoTexto || partida.resultado || 'Resultado pendente';
  }

  return `${placarA} x ${placarB}`;
}

function obterResultadoPartida(partida) {
  const resultado = String(partida?.resultado || partida?.status || '').trim();

  if (resultado === 'W' || /vit[oó]ria/i.test(resultado)) {
    return 'Vitória';
  }

  if (resultado === 'L' || /derrota/i.test(resultado)) {
    return 'Derrota';
  }

  return resultado || 'Pendente';
}

function obterTimesPartida(partida) {
  if (!partida) {
    return 'Times a definir';
  }

  const dupla1 = partida.dupla1Nome || partida.dupla1 || partida.timeA || partida.equipeA || partida.suaDupla || 'Dupla 1';
  const dupla2 = partida.dupla2Nome || partida.dupla2 || partida.timeB || partida.equipeB || partida.adversarios || 'Dupla 2';

  return `${dupla1} x ${dupla2}`;
}

function criarEstiloImagemGrupo(grupo) {
  const imagem = resolverUrlRecurso(obterImagemGrupoAvatar(grupo));
  return { '--grupos-card-image': `url(${imagem || heroFutevolei})` };
}

function montarAtividadesRecentes(grupos) {
  return (grupos || []).slice(0, 4).flatMap((grupo) => {
    const grupoId = obterIdGrupo(grupo);
    const atividades = [];

    if (grupo.ultimaAtividade) {
      atividades.push({
        id: `${grupoId}-atividade`,
        icone: FaGamepad,
        titulo: 'Partida registrada',
        descricao: grupo.nome,
        data: grupo.ultimaAtividade,
        status: 'Ativo'
      });
    }

    if (obterQuantidade(grupo.pendencias) > 0) {
      atividades.push({
        id: `${grupoId}-pendencia`,
        icone: FaExclamationTriangle,
        titulo: 'Pendência aberta',
        descricao: `${obterQuantidade(grupo.pendencias)} ${pluralizar(obterQuantidade(grupo.pendencias), 'pendência')}`,
        data: obterDataGrupo(grupo),
        status: 'Pendente'
      });
    }

    if (!atividades.length) {
      atividades.push({
        id: `${grupoId}-grupo`,
        icone: FaUsers,
        titulo: 'Grupo ativo',
        descricao: grupo.nome,
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

function GruposHero({ autenticado, resumoPendencias }) {
  return (
    <header
      className="grupos-dashboard-hero"
      style={{ '--grupos-hero-image': `url(${heroFutevolei})` }}
      role="region"
      aria-label="Resumo de grupos"
    >
      <div className="grupos-dashboard-hero-acoes">
        {autenticado && <NotificacoesBotao autenticado resumo={resumoPendencias} />}
      </div>

      <div className="grupos-dashboard-hero-identidade">
        <span className="grupos-dashboard-hero-logo">
          <LogoQNF variante="light" textoAlternativo="QuebraNunca" />
        </span>
        <div>
          <span className="grupos-dashboard-hero-eyebrow">Sua galera no jogo</span>
          <h1>Grupos</h1>
          <p>Jogue com sua galera e acompanhe tudo em um só lugar.</p>
        </div>
      </div>
    </header>
  );
}

function GruposResumo({ totais }) {
  const itens = [
    { id: 'grupos', rotulo: 'Grupos', valor: obterQuantidade(totais.quantidadeGrupos), icone: FaUsers },
    { id: 'atletas', rotulo: 'Atletas', valor: obterQuantidade(totais.quantidadeAtletas), icone: FaUserPlus },
    { id: 'partidas', rotulo: 'Partidas', valor: obterQuantidade(totais.quantidadePartidas), icone: FaGamepad },
    { id: 'pendencias', rotulo: 'Pendências', valor: obterQuantidade(totais.pendenciasGrupos), icone: FaExclamationTriangle }
  ];

  return (
    <section className="grupos-dashboard-resumo" aria-label="Resumo dos grupos">
      <div className="grupos-dashboard-resumo-grid">
        {itens.map((item) => {
          const Icone = item.icone;
          return (
            <article key={item.id} className="grupos-dashboard-total">
              <Icone aria-hidden="true" />
              <strong>{item.valor}</strong>
              <span className="grupos-dashboard-total-rotulo">{item.rotulo}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function GrupoPrimeiroCard({ onCriarGrupo }) {
  return (
    <article className="grupos-dashboard-primeiro-card">
      <div>
        <span className="grupos-dashboard-card-icone"><FaUsers aria-hidden="true" /></span>
        <h2>Crie seu primeiro grupo</h2>
        <p>Organize sua turma. Acompanhe rankings, histórico, scouts e ranking de duplas.</p>
      </div>
      <div className="grupos-dashboard-primeiro-visual" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <button type="button" className="grupos-dashboard-cta grupos-dashboard-cta-principal" onClick={onCriarGrupo}>
        <span className="grupos-dashboard-cta-icone"><FaPlus aria-hidden="true" /></span>
        <span>
          <strong>Criar grupo</strong>
          <small>Comece com sua galera agora.</small>
        </span>
        <FaChevronRight aria-hidden="true" />
      </button>
    </article>
  );
}

function GruposAcoesVazio({ onCriarGrupo, onRegistrarAvulsa }) {
  return (
    <section className="grupos-dashboard-acoes-vazio" aria-label="Ações de grupos">
      <button type="button" className="grupos-dashboard-cta grupos-dashboard-cta-principal" onClick={onCriarGrupo}>
        <span className="grupos-dashboard-cta-icone"><FaPlus aria-hidden="true" /></span>
        <span>
          <strong>Criar Grupo</strong>
          <small>Ranking, histórico e scouts com sua turma.</small>
        </span>
        <FaChevronRight aria-hidden="true" />
      </button>

      <span className="grupos-dashboard-ou">OU</span>

      <button type="button" className="grupos-dashboard-cta grupos-dashboard-cta-secundario" onClick={onRegistrarAvulsa}>
        <span className="grupos-dashboard-cta-icone"><FaGamepad aria-hidden="true" /></span>
        <span>
          <strong>Registrar partida avulsa</strong>
          <small>Salve um jogo mesmo sem grupo.</small>
        </span>
        <FaChevronRight aria-hidden="true" />
      </button>
    </section>
  );
}

function GruposEmptyState() {
  return (
    <article className="grupos-dashboard-empty-premium" style={{ '--grupos-empty-image': `url(${heroFutevolei})` }}>
      <div>
        <span className="grupos-dashboard-card-icone"><FaStar aria-hidden="true" /></span>
        <h2>Você ainda não participa de nenhum grupo.</h2>
        <p>Criar um grupo permite:</p>
        <ul>
          <li>Ranking exclusivo</li>
          <li>Histórico do grupo</li>
          <li>Scouts dos atletas</li>
          <li>Ranking de duplas</li>
        </ul>
      </div>
    </article>
  );
}

function GruposPopulares() {
  return (
    <section className="grupos-dashboard-populares" aria-labelledby="grupos-populares-titulo">
      <div className="grupos-dashboard-section-title">
        <h2 id="grupos-populares-titulo">Grupos populares</h2>
        <button type="button">Ver todos <FaChevronRight aria-hidden="true" /></button>
      </div>
      <div className="grupos-dashboard-populares-lista">
        {gruposPopularesPlaceholder.map((grupo) => (
          <article key={grupo.id} className="grupos-dashboard-popular-card">
            <AvatarGrupo nome={grupo.nome} tamanho="md" />
            <strong>{grupo.nome}</strong>
            <span>{grupo.quantidadeAtletas} atletas</span>
            <span>{grupo.quantidadePartidas} partidas</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function GrupoAtualCard({ grupo, perfil, onAbrir }) {
  return (
    <article className="grupos-dashboard-grupo-atual" style={criarEstiloImagemGrupo(grupo)}>
      <div className="grupos-dashboard-grupo-atual-conteudo">
        <AvatarGrupo grupo={grupo} tamanho="xl" className="grupos-dashboard-grupo-atual-avatar" />
        <div>
          <span className="grupos-dashboard-privacidade">{grupo.privacidade || 'Grupo'}</span>
          <h2>{grupo.nome}</h2>
          <div className="grupos-dashboard-grupo-atual-meta">
            <span>{obterQuantidade(grupo.quantidadeAtletas)} atletas</span>
            <span>{obterQuantidade(grupo.quantidadePartidas)} partidas</span>
            <span>{perfil}</span>
          </div>
        </div>
      </div>
      <button type="button" className="grupos-dashboard-card-link" onClick={onAbrir}>
        Abrir grupo
        <FaChevronRight aria-hidden="true" />
      </button>
    </article>
  );
}

function GruposUltimaPartida({ grupo }) {
  const partida = obterUltimaPartidaGrupo(grupo);
  const resultado = obterResultadoPartida(partida);
  const classeResultado = resultado === 'Vitória' ? 'vitoria' : resultado === 'Derrota' ? 'derrota' : '';

  return (
    <section className="grupos-dashboard-ultima-partida" aria-labelledby="grupos-ultima-partida-titulo">
      <div className="grupos-dashboard-section-title">
        <h2 id="grupos-ultima-partida-titulo">Última partida</h2>
      </div>
      {partida ? (
        <article className="grupos-dashboard-partida-card">
          <span><FaClock aria-hidden="true" /> {formatarUltimaAtividade(partida.data || partida.dataPartida || partida.criadoEm)}</span>
          <strong>{obterTimesPartida(partida)}</strong>
          <div>
            <b>{obterPlacarPartida(partida)}</b>
            <em className={classeResultado}>{resultado}</em>
          </div>
        </article>
      ) : (
        <article className="grupos-dashboard-partida-card grupos-dashboard-partida-vazia">
          <span><FaClock aria-hidden="true" /> Sem partida recente</span>
          <strong>Registre um jogo para iniciar o histórico do grupo.</strong>
          <div>
            <b>0 x 0</b>
            <em>Pendente</em>
          </div>
        </article>
      )}
    </section>
  );
}

function GruposRegistrarPartidaCTA({ onRegistrar }) {
  return (
    <button type="button" className="grupos-dashboard-cta grupos-dashboard-cta-principal" onClick={onRegistrar}>
      <span className="grupos-dashboard-cta-icone"><FaPlus aria-hidden="true" /></span>
      <span>
        <strong>Registrar partida</strong>
        <small>Registre um novo jogo do grupo.</small>
      </span>
      <FaChevronRight aria-hidden="true" />
    </button>
  );
}

function GruposAcoesRapidas({ grupoId, navegar }) {
  return (
    <section className="grupos-dashboard-acoes-rapidas" aria-label="Ações rápidas">
      <button type="button" onClick={() => navegar(`/ranking?tipo=grupos&grupoId=${grupoId}`)}>
        <span><FaTrophy aria-hidden="true" /> Ver Ranking</span>
        <FaChevronRight aria-hidden="true" />
      </button>
      <button type="button" onClick={() => navegar(`/grupos/${grupoId}/atletas`)}>
        <span><FaUsers aria-hidden="true" /> Ver Atletas</span>
        <FaChevronRight aria-hidden="true" />
      </button>
    </section>
  );
}

function GruposAtividadeRecente({ atividades }) {
  return (
    <section className="grupos-dashboard-atividade-recente" aria-labelledby="grupos-atividade-titulo">
      <div className="grupos-dashboard-section-title">
        <h2 id="grupos-atividade-titulo">Atividade recente</h2>
      </div>
      <div className="grupos-dashboard-timeline">
        {atividades.length > 0 ? atividades.map((atividade) => {
          const Icone = atividade.icone;
          return (
            <article key={atividade.id} className="grupos-dashboard-timeline-item">
              <span className="grupos-dashboard-timeline-icone"><Icone aria-hidden="true" /></span>
              <div>
                <strong>{atividade.titulo}</strong>
                <p>{atividade.descricao}</p>
                <small>{formatarUltimaAtividade(atividade.data)}</small>
              </div>
              <em>{atividade.status}</em>
            </article>
          );
        }) : (
          <article className="grupos-dashboard-timeline-item">
            <span className="grupos-dashboard-timeline-icone"><FaCalendarCheck aria-hidden="true" /></span>
            <div>
              <strong>Nenhuma atividade recente</strong>
              <p>As movimentações do grupo aparecerão aqui.</p>
              <small>Agora</small>
            </div>
            <em>Novo</em>
          </article>
        )}
      </div>
    </section>
  );
}

function MeusGruposLista({ grupos, usuarioPodeGerenciar, onAbrir, onRegistrar, onEditar, onRemover }) {
  return (
    <section className="grupos-dashboard-meus-grupos" aria-labelledby="grupos-meus-grupos-titulo">
      <div className="grupos-dashboard-section-title">
        <h2 id="grupos-meus-grupos-titulo">Meus grupos</h2>
      </div>
      <div className="grupos-dashboard-meus-grupos-lista">
        {grupos.map((grupo) => {
          const grupoId = obterIdGrupo(grupo);
          const podeGerenciarGrupo = usuarioPodeGerenciar(grupo);
          return (
            <article key={grupoId} className="grupos-dashboard-meu-grupo-card">
              <button type="button" onClick={() => onAbrir(grupoId)}>
                <AvatarGrupo grupo={grupo} tamanho="md" />
                <span>
                  <strong>{grupo.nome}</strong>
                  <small>
                    {obterQuantidade(grupo.quantidadeAtletas)} atletas · {obterQuantidade(grupo.quantidadePartidas)} partidas · {obterPerfilNoGrupo(grupo, podeGerenciarGrupo)}
                  </small>
                </span>
                <FaChevronRight aria-hidden="true" />
              </button>
              <div className="grupos-dashboard-meu-grupo-acoes">
                <button type="button" onClick={() => onRegistrar(grupoId)}>Registrar</button>
                {podeGerenciarGrupo && (
                  <>
                    <button type="button" onClick={() => onEditar(grupo)}>Editar</button>
                    <button type="button" onClick={() => onRemover(grupoId)}>Remover</button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
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
    () => [...(dashboard.grupos || [])].sort((a, b) => {
      const dataA = a.ultimaAtividade ? new Date(a.ultimaAtividade).getTime() : 0;
      const dataB = b.ultimaAtividade ? new Date(b.ultimaAtividade).getTime() : 0;
      return dataB - dataA || (a.nome || '').localeCompare(b.nome || '');
    }),
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
        totais: dados?.totais || dashboardVazio.totais,
        grupos: Array.isArray(dados?.grupos) ? dados.grupos : []
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

  async function aoCriarGrupoFluxo() {
    await carregarDados();
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

  const totais = dashboard.totais || dashboardVazio.totais;
  const autenticado = Boolean(token);
  const resumoPendencias = { total: obterQuantidade(totais.pendenciasGrupos) };
  const possuiGrupos = gruposOrdenados.length > 0;
  const grupoAtual = gruposOrdenados[0] || null;
  const grupoAtualId = grupoAtual ? obterIdGrupo(grupoAtual) : null;
  const perfilGrupoAtual = grupoAtual ? obterPerfilNoGrupo(grupoAtual, podeGerenciar(grupoAtual)) : 'Membro';
  const atividadesRecentes = montarAtividadesRecentes(gruposOrdenados);

  return (
    <section className="pagina grupos-dashboard-pagina">
      <GruposHero autenticado={autenticado} resumoPendencias={resumoPendencias} />

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
          <GrupoPrimeiroCard onCriarGrupo={iniciarCriacaoGrupo} />
          <GruposResumo totais={totais} />
          <GruposAcoesVazio
            onCriarGrupo={iniciarCriacaoGrupo}
            onRegistrarAvulsa={() => navegarParaRegistro(null)}
          />
          <GruposEmptyState />
          <GruposPopulares />
        </>
      ) : (
        <>
          <GrupoAtualCard
            grupo={grupoAtual}
            perfil={perfilGrupoAtual}
            onAbrir={() => navegar(`/grupos/${grupoAtualId}`)}
          />
          <GruposResumo totais={totais} />
          <GruposUltimaPartida grupo={grupoAtual} />
          <GruposRegistrarPartidaCTA onRegistrar={() => navegarParaRegistro(grupoAtualId)} />
          <GruposAcoesRapidas grupoId={grupoAtualId} navegar={navegar} />
          <GruposAtividadeRecente atividades={atividadesRecentes} />
          <MeusGruposLista
            grupos={gruposOrdenados}
            usuarioPodeGerenciar={podeGerenciar}
            onAbrir={(grupoId) => navegar(`/grupos/${grupoId}`)}
            onRegistrar={navegarParaRegistro}
            onEditar={iniciarEdicao}
            onRemover={confirmarRemocaoGrupo}
          />
          <GruposPopulares />
        </>
      )}

      <CriarGrupoFluxoModal
        aberto={fluxoCriarAberto}
        onFechar={() => setFluxoCriarAberto(false)}
        onCriado={aoCriarGrupoFluxo}
        onAdicionarAtletas={(grupo) => {
          setFluxoCriarAberto(false);
          navegar(`/grupos/${grupo.id}/atletas`);
        }}
        onEntrarGrupo={(grupo) => {
          setFluxoCriarAberto(false);
          navegar(`/grupos/${grupo.id}/atletas`);
        }}
      />
    </section>
  );
}
