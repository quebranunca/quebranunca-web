import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBell,
  FaBolt,
  FaChartLine,
  FaChevronRight,
  FaEdit,
  FaFire,
  FaGamepad,
  FaMedal,
  FaPlus,
  FaShieldAlt,
  FaTrophy,
  FaUserFriends
} from 'react-icons/fa';
import logoLiga from '../../assets/logo-liga.svg';
import { useAutenticacao } from '../../hooks/useAutenticacao';
import { useInView } from '../../hooks/useInView';
import { useNotification } from '../../contexts/NotificationContext';
import { partidasServico } from '../../services/partidasServico';
import { partidaFeedServico } from '../../services/partidaFeedServico';
import { extrairMensagemErro } from '../../utils/erros';
import { formatarData } from '../../utils/formatacao';
import { podeEditarPartida } from '../../utils/permissoesPartida';
import { NotificacoesBotao } from '../NotificacoesBotao';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../AvatarUsuario';
import { EditarPartidaRegistradaModal } from '../partidas/EditarPartidaRegistradaModal';
import { FeedPartidaCard } from '../partidas/FeedPartidaCard';
import { PartidaCardPremium } from '../partidas/PartidaCardPremium';
import { HomeSectionType, homeSectionsConfig } from './homeSectionsConfig';
import { montarUrlDashboardDupla, obterNomeExibicaoAtletaPerfil, obterTituloAtleta } from '../../utils/atletaUtils';
import { montarRotaPerfilAtleta } from '../../utils/perfilAtleta';
import '../partidas/feed-partidas.css';

const HOME_NAVIGATION = Object.freeze({
  ranking: '/ranking',
  feed: '/feed',
  meusJogos: '/app/meus-jogos',
  registrarPartida: '/partidas/registrar'
  // TODO: adicionar destino de insights quando existir tela de análise completa.
});

const feedHomeHabilitado = homeSectionsConfig.some(
  (secao) => secao.type === HomeSectionType.Feed && secao.enabled
);

const secoesHomeLazy = new Set([
  HomeSectionType.Feed,
  HomeSectionType.Connections,
  HomeSectionType.Frequency
]);

const skeletonsHomePorSecao = Object.freeze({
  [HomeSectionType.Hero]: {
    eyebrow: 'Seu momento',
    titulo: 'Preparando seu painel',
    variante: 'hero'
  },
  [HomeSectionType.PendingActions]: {
    eyebrow: 'Pendências',
    titulo: 'Ações abertas',
    variante: 'pending'
  },
  [HomeSectionType.Stats]: {
    eyebrow: 'Resumo',
    titulo: 'Estatísticas rápidas',
    variante: 'stats'
  },
  [HomeSectionType.Insights]: {
    eyebrow: 'Insights',
    titulo: 'Leitura rápida',
    variante: 'insights',
    linhas: 3
  },
  [HomeSectionType.RecentMatches]: {
    eyebrow: 'Últimas partidas',
    titulo: 'Seu ritmo recente',
    variante: 'matches',
    linhas: 2
  },
  [HomeSectionType.Feed]: {
    eyebrow: 'Feed',
    titulo: 'Jogos da comunidade',
    variante: 'feed',
    linhas: 3
  },
  [HomeSectionType.Connections]: {
    eyebrow: 'Conexões',
    titulo: 'Quem joga com você',
    variante: 'connections',
    linhas: 2
  },
  [HomeSectionType.Frequency]: {
    eyebrow: 'Frequência',
    titulo: 'Ritmo da semana',
    variante: 'frequency',
    linhas: 1
  }
});

function nomeAtleta(item) {
  return obterNomeExibicaoAtletaPerfil(item) || 'Atleta';
}

function tituloAtleta(item) {
  return obterTituloAtleta(item) || nomeAtleta(item);
}

function formatarPercentual(valor) {
  const numero = Number(valor ?? 0);
  return `${Number.isInteger(numero) ? numero : numero.toFixed(1)}%`;
}

function obterIconeInsight(insight) {
  const texto = insight.toLowerCase();

  if (texto.includes('sequência') || texto.includes('vitória')) {
    return <FaFire aria-hidden="true" />;
  }

  if (texto.includes('ranking') || texto.includes('posição')) {
    return <FaChartLine aria-hidden="true" />;
  }

  if (texto.includes('parceiro')) {
    return <FaUserFriends aria-hidden="true" />;
  }

  return <FaBolt aria-hidden="true" />;
}

function obterNivelHeatmap(quantidade) {
  if (!quantidade) return 0;
  if (quantidade === 1) return 1;
  if (quantidade === 2) return 2;
  return 3;
}

function obterContextoPartidaHome(partida) {
  return partida?.grupo || partida?.categoria || partida?.competicao || 'Geral';
}

function obterResultadoPartidaHome(partida) {
  if (partida?.resultado === 'W') {
    return 'Vitória';
  }

  if (partida?.resultado === 'L') {
    return 'Derrota';
  }

  return partida?.resultado || 'Pendente';
}

function atletaEstaNaDuplaHome(partida, atletaId, lado) {
  if (!partida || !atletaId) {
    return false;
  }

  const prefixo = lado === 'A' ? 'duplaA' : 'duplaB';
  return partida[`${prefixo}Atleta1Id`] === atletaId || partida[`${prefixo}Atleta2Id`] === atletaId;
}

function obterIdsDuplasPartidaHome(partida, atletaId) {
  const usuarioNaDuplaA = atletaEstaNaDuplaHome(partida, atletaId, 'A');
  const prefixoMinhaDupla = usuarioNaDuplaA ? 'duplaA' : 'duplaB';
  const prefixoAdversarios = usuarioNaDuplaA ? 'duplaB' : 'duplaA';

  return {
    minhaDupla: [
      partida?.[`${prefixoMinhaDupla}Atleta1Id`],
      partida?.[`${prefixoMinhaDupla}Atleta2Id`]
    ],
    adversarios: [
      partida?.[`${prefixoAdversarios}Atleta1Id`],
      partida?.[`${prefixoAdversarios}Atleta2Id`]
    ]
  };
}

function obterDestinoResumoRapido(itemId, atletaId, usuario) {
  if (itemId === 'aproveitamento' && atletaId) {
    return montarRotaPerfilAtleta(atletaId, usuario);
  }

  if (['partidas', 'vitorias', 'sequencia'].includes(itemId)) {
    return HOME_NAVIGATION.meusJogos;
  }

  return '';
}

function obterDestinoConexao(item, tipo, atletaId, usuario) {
  if (tipo === 'parceiro') {
    return montarUrlDashboardDupla(atletaId, item?.atletaId);
  }

  if (item?.atletaId) {
    return montarRotaPerfilAtleta(item.atletaId, usuario);
  }

  return '';
}

function obterSaudacao() {
  const hora = new Date().getHours();

  if (hora < 12) {
    return 'Bom dia';
  }

  if (hora < 18) {
    return 'Boa tarde';
  }

  return 'Boa noite';
}

function obterBadgeMomento(resumo, perfil, totalJogosPeriodo) {
  const sequencia = Number(resumo?.sequenciaAtual ?? 0);

  if (sequencia >= 2) {
    return `${sequencia} vitórias seguidas`;
  }

  if (totalJogosPeriodo > 0) {
    return `${totalJogosPeriodo} jogo${totalJogosPeriodo > 1 ? 's' : ''} esta semana`;
  }

  return perfil?.textoSequencia || 'Pronto para o próximo jogo';
}

function HomeEstado({ titulo, mensagem }) {
  return (
    <section className="pagina home-dashboard">
      <div className="cartao home-dashboard-estado">
        <strong>{titulo}</strong>
        {mensagem && <p>{mensagem}</p>}
      </div>
    </section>
  );
}

function obterEstadoModulo(modulos, chave, dadosPadrao = null) {
  return modulos?.[chave] || {
    dados: dadosPadrao,
    carregando: false,
    erro: ''
  };
}

function obterDadosModulo(modulo, fallback) {
  return modulo?.dados ?? fallback;
}

function moduloCarregandoSemDados(modulo) {
  return Boolean(modulo?.carregando && !modulo?.dados);
}

export function HomeDashboard({ modulos, dashboard, carregando, erro, onAtualizar }) {
  const { usuario } = useAutenticacao();
  const { showNotification } = useNotification();
  const [insightsExpandidos, setInsightsExpandidos] = useState(false);
  const [partidaEmEdicao, setPartidaEmEdicao] = useState(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');
  const [feedPartidas, setFeedPartidas] = useState([]);
  const [feedCarregando, setFeedCarregando] = useState(true);
  const [feedErro, setFeedErro] = useState('');
  const [feedLiberado, setFeedLiberado] = useState(!feedHomeHabilitado);

  useEffect(() => {
    let ativo = true;

    async function carregarFeed() {
      if (!feedHomeHabilitado) {
        setFeedCarregando(false);
        return;
      }

      if (!feedLiberado) {
        return;
      }

      setFeedCarregando(true);
      setFeedErro('');

      try {
        const resposta = await partidaFeedServico.listar({ page: 1, pageSize: 3 });
        if (ativo) {
          setFeedPartidas(resposta.itens || []);
        }
      } catch (falha) {
        if (ativo) {
          setFeedErro(extrairMensagemErro(falha));
        }
      } finally {
        if (ativo) {
          setFeedCarregando(false);
        }
      }
    }

    carregarFeed();

    return () => {
      ativo = false;
    };
  }, [feedLiberado]);

  if (carregando) {
    return <HomeDashboardSkeleton />;
  }

  if (erro && !modulos) {
    return <HomeEstado titulo="Não foi possível carregar sua Home." mensagem={erro} />;
  }

  if (!modulos && !dashboard) {
    return <HomeEstado titulo="Registre partidas para montar sua Home." />;
  }

  const perfilModulo = obterEstadoModulo(modulos, 'perfil', dashboard?.perfil || null);
  const pendenciasModulo = obterEstadoModulo(modulos, 'pendencias', null);
  const resumoModulo = obterEstadoModulo(modulos, 'resumo', dashboard?.resumo || null);
  const insightsModulo = obterEstadoModulo(modulos, 'insights', dashboard?.insights || []);
  const ultimasPartidasModulo = obterEstadoModulo(modulos, 'ultimasPartidas', dashboard?.ultimasPartidas || []);
  const conexoesModulo = obterEstadoModulo(modulos, 'conexoes', {
    melhoresParceiros: dashboard?.melhoresParceiros || [],
    rivaisMaisEnfrentados: dashboard?.rivaisMaisEnfrentados || [],
    parceirosRecentes: dashboard?.parceirosRecentes || [],
    rivaisRecentes: dashboard?.rivaisRecentes || []
  });
  const frequenciaModulo = obterEstadoModulo(modulos, 'frequencia', dashboard?.heatmap || []);
  const perfil = obterDadosModulo(perfilModulo, {});
  const resumoPendencias = obterDadosModulo(pendenciasModulo, null);
  const resumo = obterDadosModulo(resumoModulo, {});
  const heatmap = obterDadosModulo(frequenciaModulo, []);
  const ultimasPartidas = (obterDadosModulo(ultimasPartidasModulo, []) || []).slice(0, 3);
  const conexoes = obterDadosModulo(conexoesModulo, {}) || {};
  const melhoresParceiros = conexoes.melhoresParceiros || [];
  const rivaisMaisEnfrentados = conexoes.rivaisMaisEnfrentados || [];
  const parceirosRecentes = conexoes.parceirosRecentes || [];
  const rivaisRecentes = conexoes.rivaisRecentes || [];
  const insights = obterDadosModulo(insightsModulo, []) || [];
  const insightsVisiveis = insightsExpandidos ? insights : insights.slice(0, 3);
  const nomePrincipal = nomeAtleta({
    nome: perfil.nome || usuario?.nome,
    apelido: perfil.apelido || usuario?.apelido
  });
  const fotoPerfilUrl = obterFotoPerfilAvatar(perfil) || obterFotoPerfilAvatar(usuario);
  const saudacao = obterSaudacao();

  const diasSemana = [
    { indice: 1, nome: 'Seg' },
    { indice: 2, nome: 'Ter' },
    { indice: 3, nome: 'Qua' },
    { indice: 4, nome: 'Qui' },
    { indice: 5, nome: 'Sex' },
    { indice: 6, nome: 'Sáb' },
    { indice: 0, nome: 'Dom' }
  ];

  const frequenciaPorDiaSemana = diasSemana.map((diaSemana) => {
    const total = heatmap
      .filter((dia) => {
        const data = new Date(`${dia.data}T00:00:00`);
        return data.getDay() === diaSemana.indice;
      })
      .reduce((soma, dia) => soma + dia.quantidade, 0);

    return { ...diaSemana, total };
  });

  const maiorTotalDiaSemana = Math.max(
    ...frequenciaPorDiaSemana.map((dia) => dia.total),
    1
  );

  const totalDiasJogados = heatmap.filter((dia) => dia.quantidade > 0).length;
  const totalJogosPeriodo = heatmap.reduce((total, dia) => total + dia.quantidade, 0);
  const badgeMomento = obterBadgeMomento(resumo, perfil, totalJogosPeriodo);
  const resumoRapido = [
    {
      id: 'partidas',
      rotulo: 'Partidas',
      valor: resumo.totalPartidas ?? 0,
      complemento: 'registradas',
      icone: FaGamepad,
      destino: obterDestinoResumoRapido('partidas', perfil.atletaId, usuario)
    },
    {
      id: 'vitorias',
      rotulo: 'Vitórias',
      valor: resumo.vitorias ?? 0,
      complemento: `${resumo.derrotas ?? 0} derrotas`,
      icone: FaTrophy,
      destino: obterDestinoResumoRapido('vitorias', perfil.atletaId, usuario)
    },
    {
      id: 'aproveitamento',
      rotulo: 'Aproveitamento',
      valor: `${resumo.aproveitamento ?? perfil.aproveitamento ?? 0}%`,
      complemento: 'no histórico',
      icone: FaChartLine,
      destino: obterDestinoResumoRapido('aproveitamento', perfil.atletaId, usuario)
    },
    {
      id: 'sequencia',
      rotulo: 'Sequência',
      valor: resumo.sequenciaAtual ?? 0,
      complemento: perfil.textoSequencia || 'ritmo atual',
      icone: FaFire,
      destino: obterDestinoResumoRapido('sequencia', perfil.atletaId, usuario)
    }
  ];

  const renderizadoresSecoes = {
    [HomeSectionType.Hero]: () => moduloCarregandoSemDados(perfilModulo) ? (
      <HomeSecaoSkeleton sectionType={HomeSectionType.Hero} />
    ) : (
      <HomeHeroSection
        nomePrincipal={nomePrincipal}
        fotoPerfilUrl={fotoPerfilUrl}
        perfil={perfil}
        badgeMomento={badgeMomento}
        perfilDestino={montarRotaPerfilAtleta(perfil.atletaId || usuario?.atletaId, usuario)}
        erro={perfilModulo.erro}
      />
    ),
    [HomeSectionType.PendingActions]: () => moduloCarregandoSemDados(pendenciasModulo) ? null : (
      <HomePendenciasOperacionaisSection
        resumo={resumoPendencias}
        erro={pendenciasModulo.erro}
      />
    ),
    [HomeSectionType.Stats]: () => moduloCarregandoSemDados(resumoModulo) ? (
      <HomeSecaoSkeleton sectionType={HomeSectionType.Stats} />
    ) : (
      <HomeResumoRapidoSection itens={resumoRapido} erro={resumoModulo.erro} />
    ),
    [HomeSectionType.Insights]: () => moduloCarregandoSemDados(insightsModulo) ? (
      <HomeSecaoSkeleton sectionType={HomeSectionType.Insights} />
    ) : (
      <HomeInsightsSection
        insights={insights}
        insightsVisiveis={insightsVisiveis}
        insightsExpandidos={insightsExpandidos}
        onAlternarInsights={() => setInsightsExpandidos((valor) => !valor)}
        erro={insightsModulo.erro}
      />
    ),
    [HomeSectionType.RecentMatches]: () => moduloCarregandoSemDados(ultimasPartidasModulo) ? (
      <HomeSecaoSkeleton sectionType={HomeSectionType.RecentMatches} />
    ) : (
      <HomeUltimasPartidasSection
        ultimasPartidas={ultimasPartidas}
        perfil={perfil}
        usuario={usuario}
        onAbrirEdicao={abrirEdicao}
        erro={ultimasPartidasModulo.erro}
      />
    ),
    [HomeSectionType.Feed]: () => (
      <HomeFeedSection
        feedCarregando={feedCarregando}
        feedErro={feedErro}
        feedPartidas={feedPartidas}
      />
    ),
    [HomeSectionType.Connections]: () => moduloCarregandoSemDados(conexoesModulo) ? (
      <HomeSecaoSkeleton sectionType={HomeSectionType.Connections} />
    ) : (
      <HomeConexoesSection
        melhoresParceiros={melhoresParceiros}
        rivaisMaisEnfrentados={rivaisMaisEnfrentados}
        parceirosRecentes={parceirosRecentes}
        rivaisRecentes={rivaisRecentes}
        atletaId={perfil.atletaId}
        usuario={usuario}
        erro={conexoesModulo.erro}
      />
    ),
    [HomeSectionType.Frequency]: () => moduloCarregandoSemDados(frequenciaModulo) ? (
      <HomeSecaoSkeleton sectionType={HomeSectionType.Frequency} />
    ) : (
      <HomeFrequenciaSection
        frequenciaPorDiaSemana={frequenciaPorDiaSemana}
        maiorTotalDiaSemana={maiorTotalDiaSemana}
        totalDiasJogados={totalDiasJogados}
        totalJogosPeriodo={totalJogosPeriodo}
        erro={frequenciaModulo.erro}
      />
    )
  };

  function abrirEdicao(partida) {
    setErroEdicao('');
    setPartidaEmEdicao(partida);
  }

  function fecharEdicao() {
    if (!salvandoEdicao) {
      setErroEdicao('');
      setPartidaEmEdicao(null);
    }
  }

  async function salvarEdicao(dados) {
    if (!partidaEmEdicao) {
      return;
    }

    setSalvandoEdicao(true);
    setErroEdicao('');

    try {
      const partidaAtualizada = await partidasServico.atualizarBasica(partidaEmEdicao.id, dados);
      await onAtualizar?.();
      showNotification({
        type: 'success',
        title: 'Partida atualizada',
        message: 'Partida atualizada com sucesso.'
      });
      return partidaAtualizada;
    } catch (falha) {
      const mensagem = extrairMensagemErro(falha);
      setErroEdicao(mensagem);
      showNotification({
        type: 'error',
        title: 'Erro ao editar partida',
        message: mensagem
      });
      throw falha;
    } finally {
      setSalvandoEdicao(false);
    }
  }

  return (
    <section className="pagina home-dashboard">
      <HomeDashboardHeader
        nome={nomePrincipal}
        saudacao={saudacao}
        resumoPendencias={resumoPendencias}
      />

      {homeSectionsConfig
        .filter((secao) => secao.enabled)
        .map((secao) => {
          const renderizarSecao = renderizadoresSecoes[secao.type];
          if (!renderizarSecao) {
            return null;
          }

          const conteudo = renderizarSecao();

          if (!secoesHomeLazy.has(secao.type)) {
            return (
              <Fragment key={secao.type}>
                {conteudo}
              </Fragment>
            );
          }

          return (
            <HomeLazySection
              key={secao.type}
              sectionType={secao.type}
              onVisible={
                secao.type === HomeSectionType.Feed
                  ? () => setFeedLiberado(true)
                  : undefined
              }
            >
              {conteudo}
            </HomeLazySection>
          );
        })}

      {partidaEmEdicao && (
        <EditarPartidaRegistradaModal
          partida={partidaEmEdicao}
          salvando={salvandoEdicao}
          erro={erroEdicao}
          onSalvar={salvarEdicao}
          onFechar={fecharEdicao}
        />
      )}
    </section>
  );
}

function HomeDashboardSkeleton() {
  return (
    <section className="pagina home-dashboard home-dashboard-carregando" aria-busy="true">
      <div className="home-dashboard-topo-premium home-dashboard-topo-skeleton" aria-hidden="true">
        <div className="home-dashboard-topo-identidade">
          <HomeSkeletonLinha className="home-dashboard-skeleton-logo" />
          <div>
            <HomeSkeletonLinha largura="10rem" altura="0.9rem" />
          </div>
        </div>

        <div className="home-dashboard-topo-acoes">
          <HomeSkeletonLinha className="home-dashboard-skeleton-icone" />
          <HomeSkeletonLinha className="home-dashboard-skeleton-avatar-mini" />
        </div>
      </div>

      {homeSectionsConfig
        .filter((secao) => secao.enabled)
        .map((secao) => (
          <HomeSecaoSkeleton key={secao.type} sectionType={secao.type} />
        ))}
    </section>
  );
}

function HomeLazySection({ sectionType, children, onVisible }) {
  const { ref, inView } = useInView({ rootMargin: '360px 0px 220px' });
  const [deveRenderizar, setDeveRenderizar] = useState(false);

  useEffect(() => {
    if (inView && !deveRenderizar) {
      setDeveRenderizar(true);
      onVisible?.();
    }
  }, [deveRenderizar, inView, onVisible]);

  return (
    <div
      ref={ref}
      className={`home-dashboard-lazy ${deveRenderizar ? 'visivel' : ''}`}
    >
      {deveRenderizar ? children : <HomeSecaoSkeleton sectionType={sectionType} />}
    </div>
  );
}

function HomeSecaoSkeleton({ sectionType }) {
  const config = skeletonsHomePorSecao[sectionType] || {
    eyebrow: 'Seção',
    titulo: 'Carregando',
    variante: 'lista',
    linhas: 2
  };
  const variante = config.variante || 'lista';

  return (
    <section
      className={`home-dashboard-bloco home-dashboard-skeleton home-dashboard-skeleton-${sectionType} home-dashboard-skeleton-${variante}`}
      aria-hidden="true"
    >
      <div className="home-dashboard-skeleton-cabecalho">
        <span>{config.eyebrow}</span>
        <HomeSkeletonLinha as="strong" largura="min(13rem, 72%)" altura="1.05rem" />
      </div>
      <HomeSkeletonConteudo config={config} sectionType={sectionType} />
    </section>
  );
}

function HomeSkeletonConteudo({ config, sectionType }) {
  if (config.variante === 'hero') {
    return (
      <>
        <div className="home-dashboard-skeleton-hero-identidade">
          <HomeSkeletonLinha className="home-dashboard-skeleton-avatar" />
          <div>
            <HomeSkeletonLinha largura="58%" altura="1.55rem" />
            <HomeSkeletonLinha largura="72%" altura="0.82rem" />
          </div>
        </div>
        <HomeSkeletonLinha className="home-dashboard-skeleton-pill" largura="48%" altura="1.85rem" />
        <div className="home-dashboard-skeleton-acoes">
          <HomeSkeletonLinha altura="2.55rem" />
          <HomeSkeletonLinha altura="2.55rem" />
        </div>
      </>
    );
  }

  if (config.variante === 'stats') {
    return (
      <div className="home-dashboard-skeleton-stats-grid">
        {Array.from({ length: 4 }).map((_, indice) => (
          <div key={indice} className="home-dashboard-skeleton-stat-card">
            <HomeSkeletonLinha className="home-dashboard-skeleton-icone-pequeno" />
            <HomeSkeletonLinha largura="66%" altura="0.68rem" />
            <HomeSkeletonLinha largura="46%" altura="1.35rem" />
            <HomeSkeletonLinha largura="78%" altura="0.58rem" />
          </div>
        ))}
      </div>
    );
  }

  if (config.variante === 'frequency') {
    return (
      <div className="home-dashboard-skeleton-frequencia-grid">
        {Array.from({ length: 7 }).map((_, indice) => (
          <div key={indice} className="home-dashboard-skeleton-frequencia-coluna">
            <HomeSkeletonLinha
              className="home-dashboard-skeleton-barra"
              altura={`${36 + ((indice % 4) * 14)}%`}
            />
            <HomeSkeletonLinha largura="1.55rem" altura="0.58rem" />
          </div>
        ))}
      </div>
    );
  }

  if (config.variante === 'connections') {
    return (
      <div className="home-dashboard-skeleton-conexoes-grid">
        {['parceiros', 'rivais'].map((grupo) => (
          <div key={grupo} className="home-dashboard-skeleton-relacao-grupo">
            <HomeSkeletonLinha largura="42%" altura="0.82rem" />
            <HomeSkeletonLista linhas={2} sectionType={sectionType} />
          </div>
        ))}
      </div>
    );
  }

  return <HomeSkeletonLista linhas={config.linhas || 2} sectionType={sectionType} />;
}

function HomeSkeletonLista({ linhas, sectionType }) {
  return (
    <div className="home-dashboard-skeleton-lista">
      {Array.from({ length: linhas }).map((_, indice) => (
        <HomeSkeletonLinha key={`${sectionType}-${indice}`} />
      ))}
    </div>
  );
}

function HomeSkeletonLinha({
  as: Elemento = 'span',
  className = '',
  largura,
  altura
}) {
  const estilo = {
    ...(largura ? { width: largura } : {}),
    ...(altura ? { height: altura } : {})
  };

  return (
    <Elemento
      className={`home-dashboard-skeleton-linha ${className}`.trim()}
      style={estilo}
    />
  );
}

function HomeModuloErro({ mensagem = 'Não foi possível carregar este módulo agora.' }) {
  return <p className="home-dashboard-vazio home-dashboard-modulo-erro">{mensagem}</p>;
}

function HomeHeroSection({ nomePrincipal, fotoPerfilUrl, perfil, badgeMomento, perfilDestino, erro }) {
  const identidade = (
    <>
      <AvatarUsuario
        nome={nomePrincipal}
        fotoPerfilUrl={fotoPerfilUrl}
        tamanho="xl"
        className="home-dashboard-avatar"
      />

      <div className="home-dashboard-atleta-info">
        <span>Seu momento</span>
        <h1>{nomePrincipal}</h1>
        <p>
          {perfil.categoriaPrincipal}
          {perfil.posicaoRanking ? ` • #${perfil.posicaoRanking} no ranking` : ''}
        </p>
      </div>
    </>
  );

  return (
    <header className="home-dashboard-hero">
      {erro && <HomeModuloErro mensagem="Não foi possível carregar seu resumo agora." />}
      {perfilDestino ? (
        <Link
          to={perfilDestino}
          className="home-dashboard-atleta-card home-dashboard-atleta-card-link"
          aria-label={`Abrir perfil de ${nomePrincipal}`}
        >
          {identidade}
        </Link>
      ) : (
        <div className="home-dashboard-atleta-card">
          {identidade}
        </div>
      )}

      <div className="home-dashboard-momento-badge">
        <FaFire aria-hidden="true" />
        <span>{badgeMomento}</span>
      </div>

      <div className="home-dashboard-hero-acoes">
        <Link to={HOME_NAVIGATION.ranking} className="home-dashboard-ranking-link">
          <FaMedal aria-hidden="true" />
          Ranking
        </Link>
        <Link to={HOME_NAVIGATION.registrarPartida} className="botao-primario home-dashboard-registrar">
          <FaPlus aria-hidden="true" />
          Registrar
        </Link>
      </div>
    </header>
  );
}

function HomeResumoRapidoSection({ itens, erro }) {
  if (erro) {
    return (
      <section className="home-dashboard-resumo" aria-label="Resumo rápido">
        <HomeModuloErro mensagem="Não foi possível carregar suas estatísticas agora." />
      </section>
    );
  }

  return (
    <section className="home-dashboard-resumo" aria-label="Resumo rápido">
      {itens.map((item) => {
        const Icone = item.icone;
        const Conteudo = (
          <>
            <Icone aria-hidden="true" />
            <span>{item.rotulo}</span>
            <strong>{item.valor}</strong>
            <small>{item.complemento}</small>
          </>
        );

        if (item.destino) {
          return (
            <Link
              key={item.id}
              to={item.destino}
              className="home-dashboard-mini-card home-dashboard-mini-card-link"
              aria-label={`Abrir ${item.rotulo.toLowerCase()}`}
            >
              {Conteudo}
            </Link>
          );
        }

        return (
          <article key={item.id} className="home-dashboard-mini-card">
            {Conteudo}
          </article>
        );
      })}
    </section>
  );
}

function HomeInsightsSection({
  insights,
  insightsVisiveis,
  insightsExpandidos,
  onAlternarInsights,
  erro
}) {
  return (
    <section className="home-dashboard-bloco home-dashboard-insights-bloco">
      <CabecalhoHome eyebrow="Insights" titulo="Leitura rápida" />

      <div className="home-dashboard-insights">
        {erro ? (
          <HomeModuloErro mensagem="Não foi possível carregar seus insights agora." />
        ) : insightsVisiveis.length === 0 ? (
          <p className="home-dashboard-vazio">Registre mais partidas para gerar insights.</p>
        ) : (
          insightsVisiveis.map((insight) => (
            <p key={insight}>
              {obterIconeInsight(insight)}
              <span>{insight}</span>
            </p>
          ))
        )}
      </div>

      {!erro && insights.length > 3 && (
        <button
          type="button"
          className="home-dashboard-link-botao"
          onClick={onAlternarInsights}
        >
          {insightsExpandidos ? 'Ver menos' : 'Ver todos'}
        </button>
      )}
    </section>
  );
}

function HomeUltimasPartidasSection({ ultimasPartidas, perfil, usuario, onAbrirEdicao, erro }) {
  return (
    <section className="home-dashboard-bloco home-dashboard-ultimas-partidas">
      <CabecalhoHome
        eyebrow="Últimas partidas"
        titulo="Seu ritmo recente"
        descricao="Histórico pessoal para conferir resultado, dupla e próximos ajustes."
        acao={<Link to={HOME_NAVIGATION.meusJogos}>Ver todas</Link>}
      />

      {erro ? (
        <HomeModuloErro mensagem="Não foi possível carregar suas últimas partidas agora." />
      ) : ultimasPartidas.length === 0 ? (
        <p className="home-dashboard-vazio">Suas últimas partidas aparecerão aqui.</p>
      ) : (
        <div className="meus-jogos-lista-premium">
          {ultimasPartidas.map((partida) => (
            <PartidaHomeCard
              key={partida.id}
              partida={partida}
              atletaId={perfil.atletaId}
              onEditar={
                podeEditarPartida(partida, usuario)
                  ? () => onAbrirEdicao(partida)
                  : null
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

function HomeFeedSection({ feedCarregando, feedErro, feedPartidas }) {
  return (
    <section className="home-dashboard-bloco home-dashboard-feed-comunidade">
      <CabecalhoHome
        eyebrow="Feed"
        titulo="Jogos da comunidade"
        descricao="Partidas publicadas por atletas e grupos para acompanhar, compartilhar e descobrir."
        acao={<Link to={HOME_NAVIGATION.feed}>Abrir feed</Link>}
      />

      {feedCarregando && (
        <HomeSkeletonLista linhas={3} sectionType={HomeSectionType.Feed} />
      )}
      {feedErro && !feedCarregando && (
        <p className="home-dashboard-vazio">Não foi possível carregar o feed agora.</p>
      )}
      {!feedCarregando && !feedErro && feedPartidas.length === 0 && (
        <p className="home-dashboard-vazio">As partidas registradas aparecerão aqui.</p>
      )}
      {!feedCarregando && !feedErro && feedPartidas.length > 0 && (
        <div className="feed-partidas-lista">
          {feedPartidas.map((partida) => (
            <FeedPartidaCard key={partida.partidaId} partida={partida} variante="home" />
          ))}
        </div>
      )}
    </section>
  );
}

function HomeConexoesSection({
  melhoresParceiros,
  rivaisMaisEnfrentados,
  parceirosRecentes,
  rivaisRecentes,
  atletaId,
  usuario,
  erro
}) {
  return (
    <section className="home-dashboard-bloco">
      <CabecalhoHome
        eyebrow="Conexões"
        titulo="Duplas e rivalidades"
        descricao="Relações calculadas a partir das suas partidas válidas."
      />

      {erro ? (
        <HomeModuloErro mensagem="Não foi possível carregar suas conexões agora." />
      ) : (
        <div className="home-dashboard-conexoes-grid">
          <DashboardRelacoes
            titulo="Parceiros"
            itens={melhoresParceiros}
            recentes={parceirosRecentes}
            tipo="parceiro"
            icone={FaUserFriends}
            vazio="Registre partidas com parceiros para acompanhar sua química de dupla."
            atletaId={atletaId}
            usuario={usuario}
          />
          <DashboardRelacoes
            titulo="Rivais"
            itens={rivaisMaisEnfrentados}
            recentes={rivaisRecentes}
            tipo="rival"
            icone={FaShieldAlt}
            vazio="Quando você enfrentar adversários, as rivalidades aparecerão aqui."
            atletaId={atletaId}
            usuario={usuario}
          />
        </div>
      )}
    </section>
  );
}

function HomeFrequenciaSection({
  frequenciaPorDiaSemana,
  maiorTotalDiaSemana,
  totalDiasJogados,
  totalJogosPeriodo,
  erro
}) {
  return (
    <section className="home-dashboard-bloco home-dashboard-frequencia">
      <CabecalhoHome
        eyebrow="Frequência"
        titulo="Ritmo da semana"
        descricao={
          totalDiasJogados > 0
            ? `${totalJogosPeriodo} partida(s) em ${totalDiasJogados} dia(s) no período.`
            : 'Registre partidas para acompanhar sua frequência.'
        }
        acao={<Link to={HOME_NAVIGATION.meusJogos}>Ver histórico</Link>}
      />

      {erro ? (
        <HomeModuloErro mensagem="Não foi possível carregar sua frequência agora." />
      ) : (
      <div className="home-dashboard-grafico-frequencia">
        <div className="home-dashboard-grafico-barras">
          {frequenciaPorDiaSemana.map((dia) => {
            const altura = dia.total > 0
              ? Math.max(14, (dia.total / maiorTotalDiaSemana) * 100)
              : 0;

            return (
              <div key={dia.nome} className="home-dashboard-grafico-coluna">
                <div className="home-dashboard-grafico-area-barra">
                  <span
                    className={`home-dashboard-grafico-barra nivel-${obterNivelHeatmap(dia.total)}`}
                    style={{ height: `${altura}%` }}
                    title={`${dia.total} jogo(s)`}
                  />
                </div>
                <strong>{dia.nome}</strong>
                <span>{dia.total}</span>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </section>
  );
}

function HomePendenciasOperacionaisSection({ resumo, erro }) {
  const total = Number(resumo?.total || 0);
  if (erro || total <= 0) {
    return null;
  }

  const altaPrioridade = Number(resumo?.altaPrioridade || 0);
  const descricao = altaPrioridade > 0
    ? `${altaPrioridade} ${altaPrioridade === 1 ? 'ação prioritária aguarda' : 'ações prioritárias aguardam'} sua confirmação.`
    : 'Ações rápidas ajudam a manter o histórico das partidas confiável.';

  return (
    <section className="home-dashboard-pendencias" aria-label="Pendências abertas">
      <div className="home-dashboard-pendencias-icone" aria-hidden="true">
        <FaBell />
      </div>
      <div className="home-dashboard-pendencias-texto">
        <span>Pendências</span>
        <strong>{total === 1 ? '1 ação aguardando' : `${total} ações aguardando`}</strong>
        <p>{descricao}</p>
      </div>
      <Link to="/app/pendencias" className="botao-primario home-dashboard-pendencias-cta">
        Resolver agora
      </Link>
    </section>
  );
}

function HomeDashboardHeader({ nome, saudacao, resumoPendencias }) {
  const [compacto, setCompacto] = useState(false);

  useEffect(() => {
    const areaRolagem = document.querySelector('.conteudo-principal') || window;

    function aoScroll() {
      const posicao = areaRolagem === window
        ? window.scrollY
        : areaRolagem.scrollTop;

      setCompacto(posicao > 18);
    }

    aoScroll();
    areaRolagem.addEventListener('scroll', aoScroll, { passive: true });

    return () => areaRolagem.removeEventListener('scroll', aoScroll);
  }, []);

  return (
    <div className={`home-dashboard-topo-premium ${compacto ? 'compacto' : ''}`}>
      <div className="home-dashboard-topo-identidade">
        <img src={logoLiga} alt="QuebraNunca" />
        <div>
          <strong>{saudacao}, {nome}</strong>
        </div>
      </div>

      <div className="home-dashboard-topo-acoes">
        <NotificacoesBotao autenticado resumo={resumoPendencias} />
      </div>
    </div>
  );
}

function CabecalhoHome({ eyebrow, titulo, descricao, acao }) {
  return (
    <div className="home-dashboard-bloco-cabecalho">
      <div>
        <span>{eyebrow}</span>
        <h2>{titulo}</h2>
        {descricao && <p>{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}
function PartidaHomeCard({ partida, atletaId, onEditar }) {
  const resultado = obterResultadoPartidaHome(partida);
  const idsDuplas = obterIdsDuplasPartidaHome(partida, atletaId);

  return (
    <PartidaCardPremium
      className="partida-home-card-compacto"
      contexto={obterContextoPartidaHome(partida)}
      status={partida.status || 'Encerrada'}
      dataPartida={partida.dataPartida}
      resultado={resultado}
      statusAprovacao={partida.statusAprovacao}
      duplaA={{
        label: 'Sua dupla',
        atletas: partida.parceiro ? `Você e ${partida.parceiro}` : 'Sua dupla',
        atleta1Id: idsDuplas.minhaDupla[0],
        atleta2Id: idsDuplas.minhaDupla[1],
        placar: partida.placarSuaDupla ?? 0,
        destaque: true,
        vencedora: resultado === 'Vitória'
      }}
      duplaB={{
        label: 'Adversários',
        atletas: partida.adversarios || 'Adversários',
        atleta1Id: idsDuplas.adversarios[0],
        atleta2Id: idsDuplas.adversarios[1],
        placar: partida.placarAdversarios ?? 0,
        destaque: false,
        vencedora: resultado === 'Derrota'
      }}
      acaoCompartilhar={
        onEditar ? (
          <button
            type="button"
            className="botao-secundario botao-compacto botao-editar-partida-discreto"
            onClick={(evento) => {
              evento.stopPropagation();
              onEditar();
            }}
            aria-label="Editar partida"
            title="Editar partida"
          >
            <FaEdit aria-hidden="true" />
            Editar
          </button>
        ) : null
      }
      detalhesHref={HOME_NAVIGATION.meusJogos}
    />
  );
}

function DashboardRelacoes({ titulo, itens, recentes, tipo, icone: Icone, vazio, atletaId, usuario }) {
  const principal = itens[0] || null;
  const listaRecentes = (recentes || []).filter((item) => item.atletaId !== principal?.atletaId).slice(0, 5);

  return (
    <section className="home-dashboard-relacao-grupo">
      <div className="home-dashboard-relacao-grupo-titulo">
        <Icone aria-hidden="true" />
        <h3>{titulo}</h3>
      </div>

      <div className="home-dashboard-relacoes">
        {itens.length === 0 ? (
          <p className="home-dashboard-vazio">{vazio}</p>
        ) : (
          <>
            <DashboardRelacaoCard
              item={principal}
              tipo={tipo}
              atletaId={atletaId}
              usuario={usuario}
              destaque
            />
            {listaRecentes.length > 0 && (
              <div className="home-dashboard-relacoes-recentes">
                <span>{tipo === 'parceiro' ? 'Parceiros recentes' : 'Rivais recentes'}</span>
                <div>
                  {listaRecentes.map((item) => (
                    <DashboardRelacaoCard
                      key={item.atletaId || item.nome}
                      item={item}
                      tipo={tipo}
                      atletaId={atletaId}
                      usuario={usuario}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function DashboardRelacaoCard({ item, tipo, atletaId, usuario, destaque = false }) {
  if (!item) {
    return null;
  }

  const destino = obterDestinoConexao(item, tipo, atletaId, usuario);
  const nome = nomeAtleta(item);
  const titulo = tituloAtleta(item);
  const rotuloPartidas = tipo === 'parceiro' ? 'jogos juntos' : 'jogos enfrentados';
  const rotuloAproveitamento = tipo === 'parceiro' ? 'aproveitamento juntos' : 'aproveitamento contra';
  const ultimaPartida = item.ultimaPartida ? formatarData(item.ultimaPartida) : '';
  const classes = [
    'home-dashboard-relacao',
    destino ? 'home-dashboard-relacao-link' : '',
    destaque ? 'home-dashboard-relacao-destaque' : ''
  ].filter(Boolean).join(' ');
  const conteudo = (
    <>
      <AvatarUsuario
        nome={nome}
        fotoPerfilUrl={obterFotoPerfilAvatar(item)}
        tamanho={destaque ? 'md' : 'sm'}
        className="home-dashboard-relacao-avatar"
      />
      <div className="home-dashboard-relacao-conteudo">
        {destaque && (
          <span className="home-dashboard-relacao-kicker">
            {tipo === 'parceiro' ? 'Mais frequente' : 'Rival mais frequente'}
          </span>
        )}
        <strong title={titulo}>{nome}</strong>
        <span>
          {item.partidas} {rotuloPartidas} · {item.vitorias}V/{item.derrotas ?? Math.max((item.partidas ?? 0) - (item.vitorias ?? 0), 0)}D
        </span>
        <small>
          {formatarPercentual(item.aproveitamento)} {rotuloAproveitamento}
          {ultimaPartida ? ` · último em ${ultimaPartida}` : ''}
        </small>
      </div>
      {destino && <FaChevronRight aria-hidden="true" />}
    </>
  );

  return destino ? (
    <Link
      to={destino}
      className={classes}
      aria-label={`Abrir ${tipo === 'parceiro' ? 'dashboard da dupla com' : 'dashboard de'} ${titulo}`}
    >
      {conteudo}
    </Link>
  ) : (
    <article className={classes}>
      {conteudo}
    </article>
  );
}
