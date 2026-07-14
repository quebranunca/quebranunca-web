import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaChartBar,
  FaChartLine,
  FaChevronRight,
  FaFire,
  FaFutbol,
  FaLayerGroup,
  FaMedal,
  FaShieldAlt,
  FaTrophy,
  FaUsers
} from 'react-icons/fa';
import { AppHero } from '../components/AppHero';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../components/AvatarUsuario';
import { Avatar } from '../components/ui/Avatar';
import { dashboardServico } from '../services/dashboardServico';
import { duplasServico } from '../services/duplasServico';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { extrairMensagemErro } from '../utils/erros';
import { formatarData } from '../utils/formatacao';
import { obterNomeGrupoPartidaExibicao } from '../utils/partidas';
import { obterRotaDetalhePartida } from '../utils/partidaRotas';
import '../components/home/home-dashboard.css';

const TIPO_ATLETA = 'atleta';
const TIPO_DUPLAS = 'duplas';

const ABA_VISAO_GERAL = 'visao-geral';
const ABA_JOGOS = 'jogos';
const ABA_CONEXOES = 'conexoes';
const ABA_GRUPOS = 'grupos';

const ABAS_SCOUT = [
  { id: ABA_VISAO_GERAL, label: 'Visão geral' },
  { id: ABA_JOGOS, label: 'Jogos' },
  { id: ABA_CONEXOES, label: 'Conexões' },
  { id: ABA_GRUPOS, label: 'Grupos' }
];

function obterTextoLimpo(...valores) {
  return valores
    .map((valor) => String(valor || '').trim())
    .find(Boolean) || '';
}

function obterNumero(valor, fallback = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : fallback;
}

function formatarNumero(valor) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(obterNumero(valor));
}

function formatarPercentual(valor) {
  const numero = obterNumero(valor);
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(numero)}%`;
}

function formatarSaldo(valor) {
  const numero = obterNumero(valor);
  return numero > 0 ? `+${formatarNumero(numero)}` : formatarNumero(numero);
}

function obterResultadoPartida(partida) {
  const resultado = String(partida?.resultado || '').toLowerCase();
  if (partida?.resultado === 'V' || partida?.resultado === 'W' || resultado.includes('vitória')) {
    return 'Vitória';
  }

  if (partida?.resultado === 'D' || partida?.resultado === 'L' || resultado.includes('derrota')) {
    return 'Derrota';
  }

  return partida?.resultado || 'Resultado';
}

function obterPlacarPartida(partida, modo = TIPO_ATLETA) {
  const pontosPro = modo === TIPO_DUPLAS ? partida?.placarDupla : partida?.placarSuaDupla;
  const pontosContra = partida?.placarAdversarios;

  if (
    pontosPro === null ||
    pontosPro === undefined ||
    pontosContra === null ||
    pontosContra === undefined ||
    partida?.possuiPlacarDetalhado === false
  ) {
    return 'Sem placar';
  }

  return `${pontosPro} x ${pontosContra}`;
}

function obterContextoPartida(partida) {
  return [
    partida?.grupoOuContexto,
    obterNomeGrupoPartidaExibicao(partida?.grupo, ''),
    partida?.categoria,
    partida?.competicao
  ].filter(Boolean)[0] || 'Partidas avulsas';
}

function obterNomeRelacao(relacao) {
  return obterTextoLimpo(relacao?.apelido, relacao?.nome, relacao?.nomeAtleta, 'Atleta QNF');
}

function obterNomeAtletaDupla(atleta) {
  return obterTextoLimpo(atleta?.apelido, atleta?.nome, 'Atleta');
}

function obterDataCurta(data) {
  return data ? formatarData(data) : 'Data a definir';
}

function prepararLista(valor) {
  return Array.isArray(valor) ? valor : [];
}

function obterEstatisticasPontos(origem) {
  return origem?.estatisticasPontos || {
    disponivel: false,
    partidasComPlacar: 0
  };
}

export function PaginaScouts() {
  const { usuario } = useAutenticacao();
  const [tipoAtivo, setTipoAtivo] = useState(TIPO_ATLETA);
  const [abaAtiva, setAbaAtiva] = useState(ABA_VISAO_GERAL);
  const [dashboard, setDashboard] = useState(null);
  const [jogos, setJogos] = useState(null);
  const [filtrosJogos, setFiltrosJogos] = useState({ resultado: '', tipoRegistro: '', periodo: '' });
  const [parceiroSelecionado, setParceiroSelecionado] = useState(null);
  const [dashboardDupla, setDashboardDupla] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoJogos, setCarregandoJogos] = useState(false);
  const [carregandoDupla, setCarregandoDupla] = useState(false);
  const [erro, setErro] = useState('');
  const [erroJogos, setErroJogos] = useState('');
  const [erroDupla, setErroDupla] = useState('');
  const possuiAtletaVinculado = Boolean(usuario?.atletaId);

  useEffect(() => {
    let ativo = true;

    async function carregarScouts() {
      if (!possuiAtletaVinculado) {
        setCarregando(false);
        setDashboard(null);
        return;
      }

      setCarregando(true);
      setErro('');

      try {
        const dados = await dashboardServico.obterDashboardAtleta();
        if (ativo) {
          setDashboard(dados);
        }
      } catch (falha) {
        if (ativo) {
          setErro(extrairMensagemErro(falha));
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarScouts();

    return () => {
      ativo = false;
    };
  }, [possuiAtletaVinculado]);

  useEffect(() => {
    let ativo = true;

    async function carregarJogos() {
      if (!possuiAtletaVinculado || tipoAtivo !== TIPO_ATLETA || abaAtiva !== ABA_JOGOS) {
        return;
      }

      setCarregandoJogos(true);
      setErroJogos('');

      try {
        const dados = await dashboardServico.listarJogosAtleta({
          pagina: 1,
          tamanhoPagina: 20,
          resultado: filtrosJogos.resultado || undefined,
          tipoRegistro: filtrosJogos.tipoRegistro || undefined,
          periodo: filtrosJogos.periodo || undefined
        });

        if (ativo) {
          setJogos(dados);
        }
      } catch (falha) {
        if (ativo) {
          setErroJogos(extrairMensagemErro(falha));
        }
      } finally {
        if (ativo) {
          setCarregandoJogos(false);
        }
      }
    }

    carregarJogos();

    return () => {
      ativo = false;
    };
  }, [abaAtiva, filtrosJogos, possuiAtletaVinculado, tipoAtivo]);

  useEffect(() => {
    let ativo = true;

    async function carregarDupla() {
      if (tipoAtivo !== TIPO_DUPLAS || !usuario?.atletaId || !parceiroSelecionado?.parceiroId) {
        setDashboardDupla(null);
        return;
      }

      setCarregandoDupla(true);
      setErroDupla('');

      try {
        const dados = await duplasServico.obterDashboard(usuario.atletaId, parceiroSelecionado.parceiroId);
        if (ativo) {
          setDashboardDupla(dados);
        }
      } catch (falha) {
        if (ativo) {
          setErroDupla(extrairMensagemErro(falha));
        }
      } finally {
        if (ativo) {
          setCarregandoDupla(false);
        }
      }
    }

    carregarDupla();

    return () => {
      ativo = false;
    };
  }, [parceiroSelecionado, tipoAtivo, usuario?.atletaId]);

  const perfil = dashboard?.perfil || {};
  const resumo = dashboard?.resumo || {};
  const ultimasPartidas = prepararLista(dashboard?.ultimasPartidas);
  const melhoresParceiros = prepararLista(dashboard?.melhoresParceiros);
  const rivaisMaisEnfrentados = prepararLista(dashboard?.rivaisMaisEnfrentados);
  const desempenhoPorGrupo = prepararLista(dashboard?.desempenhoPorGrupo);
  const evolucao = prepararLista(dashboard?.evolucao);
  const formaRecente = prepararLista(dashboard?.formaRecente);
  const duplasDisponiveis = prepararLista(dashboard?.duplasDisponiveis);
  const nomeCompleto = obterTextoLimpo(perfil.nome, usuario?.nomeCompleto, usuario?.nome, 'Atleta QuebraNunca');
  const apelido = obterTextoLimpo(perfil.apelido, usuario?.apelido);
  const subtitulo = [apelido, perfil.categoriaPrincipal].filter(Boolean).join(' • ');
  const fotoPerfilUrl = obterFotoPerfilAvatar(perfil) || obterFotoPerfilAvatar(usuario);

  const jogosAtleta = useMemo(() => jogos?.itens || ultimasPartidas, [jogos, ultimasPartidas]);

  function alternarTipo(novoTipo) {
    setTipoAtivo(novoTipo);
    setAbaAtiva(ABA_VISAO_GERAL);
  }

  function selecionarAba(novaAba) {
    setAbaAtiva(novaAba);
  }

  if (carregando) {
    return (
      <section className="pagina home-dashboard scouts-page" aria-busy="true">
        <AppHero
          title={tipoAtivo === TIPO_DUPLAS ? 'Scout da dupla' : 'Scout do atleta'}
          subtitle={tipoAtivo === TIPO_DUPLAS ? 'Desempenho completo das suas parcerias.' : 'Seu desempenho completo.'}
          badge={subtitulo || nomeCompleto}
          autenticado={Boolean(usuario)}
          showAvatar={false}
          variant="page"
        />
        <div className="home-dashboard-identidade-card home-dashboard-skeleton-card" />
        <div className="home-dashboard-scouts home-dashboard-skeleton-card" />
        <div className="home-dashboard-scouts home-dashboard-skeleton-card" />
      </section>
    );
  }

  if (erro) {
    return (
      <section className="pagina home-dashboard scouts-page">
        <AppHero
          title={tipoAtivo === TIPO_DUPLAS ? 'Scout da dupla' : 'Scout do atleta'}
          subtitle={tipoAtivo === TIPO_DUPLAS ? 'Desempenho completo das suas parcerias.' : 'Seu desempenho completo.'}
          badge={subtitulo || nomeCompleto}
          autenticado={Boolean(usuario)}
          showAvatar={false}
          variant="page"
        />
        <EmptyState
          icon={FaChartLine}
          title="Não foi possível carregar seus scouts."
          description={erro}
        />
      </section>
    );
  }

  if (!possuiAtletaVinculado) {
    return (
      <section className="pagina home-dashboard scouts-page">
        <AppHero
          title={tipoAtivo === TIPO_DUPLAS ? 'Scout da dupla' : 'Scout do atleta'}
          subtitle={tipoAtivo === TIPO_DUPLAS ? 'Desempenho completo das suas parcerias.' : 'Seu desempenho completo.'}
          badge={subtitulo || nomeCompleto}
          autenticado={Boolean(usuario)}
          showAvatar={false}
          variant="page"
        />
        <EmptyState
          icon={FaChartLine}
          title="Vincule seu atleta para ver seus scouts."
          description="As estatísticas esportivas dependem de um atleta conectado ao seu usuário."
          action={<Link to="/app/perfil">Abrir perfil</Link>}
        />
      </section>
    );
  }

  return (
    <section className="pagina home-dashboard scouts-page">
      <AppHero
        title={tipoAtivo === TIPO_DUPLAS ? 'Scout da dupla' : 'Scout do atleta'}
        subtitle={tipoAtivo === TIPO_DUPLAS ? 'Desempenho completo das suas parcerias.' : 'Seu desempenho completo.'}
        badge={subtitulo || nomeCompleto}
        autenticado={Boolean(usuario)}
        showAvatar={false}
        variant="page"
      />

      <header className="scouts-athlete-card">
        <AvatarUsuario
          nome={nomeCompleto}
          fotoPerfilUrl={fotoPerfilUrl}
          tamanho="lg"
          className="scouts-athlete-avatar"
        />
        <div className="scouts-athlete-text">
          <strong>{nomeCompleto}</strong>
          {subtitulo && <span>{subtitulo}</span>}
        </div>
        <EntitySelector active={tipoAtivo} onChange={alternarTipo} />
      </header>

      <ScoutTabs active={abaAtiva} onChange={selecionarAba} />

      {tipoAtivo === TIPO_ATLETA ? (
        <AtletaContent
          abaAtiva={abaAtiva}
          resumo={resumo}
          dashboard={dashboard}
          ultimasPartidas={ultimasPartidas}
          jogos={jogosAtleta}
          carregandoJogos={carregandoJogos}
          erroJogos={erroJogos}
          filtrosJogos={filtrosJogos}
          onFiltrosJogosChange={setFiltrosJogos}
          melhoresParceiros={melhoresParceiros}
          rivaisMaisEnfrentados={rivaisMaisEnfrentados}
          desempenhoPorGrupo={desempenhoPorGrupo}
          evolucao={evolucao}
          formaRecente={formaRecente}
          onVerTodosJogos={() => selecionarAba(ABA_JOGOS)}
          onVerConexoes={() => selecionarAba(ABA_CONEXOES)}
          onVerGrupos={() => selecionarAba(ABA_GRUPOS)}
        />
      ) : (
        <DuplasContent
          abaAtiva={abaAtiva}
          duplasDisponiveis={duplasDisponiveis}
          parceiroSelecionado={parceiroSelecionado}
          onSelecionarParceiro={setParceiroSelecionado}
          dashboardDupla={dashboardDupla}
          carregando={carregandoDupla}
          erro={erroDupla}
          onVerTodosJogos={() => selecionarAba(ABA_JOGOS)}
        />
      )}
    </section>
  );
}

function EntitySelector({ active, onChange }) {
  return (
    <div className="scouts-entity-selector" role="tablist" aria-label="Entidade analisada">
      <button
        type="button"
        className={active === TIPO_ATLETA ? 'ativo' : ''}
        onClick={() => onChange(TIPO_ATLETA)}
        role="tab"
        aria-selected={active === TIPO_ATLETA}
      >
        Atleta
      </button>
      <button
        type="button"
        className={active === TIPO_DUPLAS ? 'ativo' : ''}
        onClick={() => onChange(TIPO_DUPLAS)}
        role="tab"
        aria-selected={active === TIPO_DUPLAS}
      >
        Duplas
      </button>
    </div>
  );
}

function ScoutTabs({ active, onChange }) {
  return (
    <nav className="scouts-tabs" role="tablist" aria-label="Seções do scout">
      {ABAS_SCOUT.map((aba) => (
        <button
          key={aba.id}
          type="button"
          className={active === aba.id ? 'ativo' : ''}
          onClick={() => onChange(aba.id)}
          role="tab"
          aria-selected={active === aba.id}
        >
          {aba.label}
        </button>
      ))}
    </nav>
  );
}

function AtletaContent({
  abaAtiva,
  resumo,
  dashboard,
  ultimasPartidas,
  jogos,
  carregandoJogos,
  erroJogos,
  filtrosJogos,
  onFiltrosJogosChange,
  melhoresParceiros,
  rivaisMaisEnfrentados,
  desempenhoPorGrupo,
  evolucao,
  formaRecente,
  onVerTodosJogos,
  onVerConexoes,
  onVerGrupos
}) {
  if (abaAtiva === ABA_JOGOS) {
    return (
      <JogosTab
        jogos={jogos}
        carregando={carregandoJogos}
        erro={erroJogos}
        filtros={filtrosJogos}
        onFiltrosChange={onFiltrosJogosChange}
      />
    );
  }

  if (abaAtiva === ABA_CONEXOES) {
    return (
      <ConexoesTab
        parceiros={melhoresParceiros}
        adversarios={rivaisMaisEnfrentados}
      />
    );
  }

  if (abaAtiva === ABA_GRUPOS) {
    return <GruposTab grupos={desempenhoPorGrupo} />;
  }

  return (
    <>
      <PerformanceHero resumo={resumo} />
      <RecentForm forma={formaRecente} />
      <ScoreStats estatisticas={obterEstatisticasPontos(dashboard)} />
      <RecentMatches partidas={ultimasPartidas.slice(0, 3)} onVerTodos={onVerTodosJogos} />
      <ConnectionsPreview
        parceiros={melhoresParceiros.slice(0, 3)}
        adversarios={rivaisMaisEnfrentados.slice(0, 3)}
        onVerTodos={onVerConexoes}
      />
      <GroupsPreview grupos={desempenhoPorGrupo.slice(0, 3)} onVerTodos={onVerGrupos} />
      <EvolutionChart evolucao={evolucao} />
    </>
  );
}

function DuplasContent({
  abaAtiva,
  duplasDisponiveis,
  parceiroSelecionado,
  onSelecionarParceiro,
  dashboardDupla,
  carregando,
  erro,
  onVerTodosJogos
}) {
  return (
    <>
      <DoublesSelector
        duplas={duplasDisponiveis}
        parceiroSelecionado={parceiroSelecionado}
        onSelecionar={onSelecionarParceiro}
      />

      {!parceiroSelecionado && (
        <EmptyState
          compact
          icon={FaUsers}
          title="Selecione um parceiro para visualizar o scout da dupla."
          description="As duplas são derivadas das partidas registradas com você."
        />
      )}

      {parceiroSelecionado && carregando && (
        <div className="home-dashboard-scouts home-dashboard-skeleton-card" aria-busy="true" />
      )}

      {parceiroSelecionado && erro && (
        <EmptyState compact icon={FaChartLine} title="Não foi possível carregar a dupla." description={erro} />
      )}

      {parceiroSelecionado && dashboardDupla && abaAtiva === ABA_VISAO_GERAL && (
        <>
          <DuoHeader dupla={dashboardDupla.dupla} />
          <PerformanceHero resumo={dashboardDupla.resumo} />
          <RecentForm forma={prepararLista(dashboardDupla.formaRecente)} />
          <ScoreStats estatisticas={obterEstatisticasPontos(dashboardDupla)} />
          <RecentDuoMatches partidas={prepararLista(dashboardDupla.ultimasPartidas).slice(0, 3)} onVerTodos={onVerTodosJogos} />
          <DuoOpponentsPreview adversarios={prepararLista(dashboardDupla.melhoresAdversarios).slice(0, 3)} />
          <GroupsPreview grupos={prepararLista(dashboardDupla.grupos).slice(0, 3)} />
          <EvolutionChart evolucao={prepararLista(dashboardDupla.evolucao)} />
        </>
      )}

      {parceiroSelecionado && dashboardDupla && abaAtiva === ABA_JOGOS && (
        <DuoGamesTab jogos={prepararLista(dashboardDupla.ultimasPartidas)} />
      )}

      {parceiroSelecionado && dashboardDupla && abaAtiva === ABA_CONEXOES && (
        <DuoConnectionsTab adversarios={prepararLista(dashboardDupla.melhoresAdversarios)} />
      )}

      {parceiroSelecionado && dashboardDupla && abaAtiva === ABA_GRUPOS && (
        <GruposTab grupos={prepararLista(dashboardDupla.grupos)} />
      )}
    </>
  );
}

function PerformanceHero({ resumo }) {
  const jogos = resumo?.totalPartidas ?? 0;
  const aproveitamento = jogos > 0 ? formatarPercentual(resumo?.aproveitamento) : '—';
  const sequenciaTexto = resumo?.textoSequenciaAtual || montarSequenciaFallback(resumo);

  return (
    <section className="scouts-performance-card" aria-labelledby="scouts-aproveitamento-titulo">
      <div className="scouts-performance-main">
        <span id="scouts-aproveitamento-titulo">Aproveitamento</span>
        <strong>{aproveitamento}</strong>
        <small>{jogos > 0 ? sequenciaTexto : 'Registre partidas para iniciar seus scouts.'}</small>
      </div>
      <div className="scouts-performance-grid">
        <MetricValue icon={FaFutbol} label="Jogos" value={jogos} />
        <MetricValue icon={FaTrophy} label="Vitórias" value={resumo?.vitorias ?? 0} />
        <MetricValue icon={FaShieldAlt} label="Derrotas" value={resumo?.derrotas ?? 0} />
        <MetricValue icon={FaFire} label="Sequência" value={resumo?.sequenciaAtual ?? 0} />
      </div>
    </section>
  );
}

function MetricValue({ icon: Icone, label, value }) {
  return (
    <article className="scouts-metric-value">
      <Icone aria-hidden="true" />
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function RecentForm({ forma }) {
  if (!forma.length) {
    return null;
  }

  return (
    <section className="scouts-compact-card scouts-forma-recente" aria-label="Forma recente">
      <span>Forma recente</span>
      <div>
        {forma.slice(0, 5).map((resultado) => (
          <i
            key={resultado.partidaId}
            className={resultado.resultado === 'V' ? 'vitoria' : 'derrota'}
            aria-label={resultado.resultado === 'V' ? 'Vitória' : 'Derrota'}
          >
            {resultado.resultado}
          </i>
        ))}
      </div>
    </section>
  );
}

function ScoreStats({ estatisticas }) {
  if (!estatisticas?.disponivel) {
    return (
      <section className="scouts-compact-card" aria-labelledby="scouts-pontos-titulo">
        <SectionTitle id="scouts-pontos-titulo" title="Estatísticas de pontos" />
        <p className="home-dashboard-vazio">Estatísticas de pontos indisponíveis. As partidas recentes foram registradas apenas com vencedor.</p>
      </section>
    );
  }

  return (
    <section className="scouts-score-card" aria-labelledby="scouts-pontos-titulo">
      <SectionTitle
        id="scouts-pontos-titulo"
        title="Estatísticas de pontos"
        subtitle={`Baseadas em ${estatisticas.partidasComPlacar} partidas com placar.`}
      />
      <div className="scouts-score-grid">
        <MetricStat label="Pontos pró" value={estatisticas.pontosPro} />
        <MetricStat label="Pontos contra" value={estatisticas.pontosContra} />
        <MetricStat label="Saldo" value={formatarSaldo(estatisticas.saldo)} destaque />
      </div>
      <div className="scouts-score-details">
        <span>Média pró {formatarNumero(estatisticas.mediaPontosPro)}</span>
        <span>Média contra {formatarNumero(estatisticas.mediaPontosContra)}</span>
        <span>Jogos apertados {estatisticas.jogosDiferencaMinima ?? 0}</span>
      </div>
    </section>
  );
}

function MetricStat({ label, value, destaque = false }) {
  return (
    <article className={destaque ? 'destaque' : ''}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function RecentMatches({ partidas, onVerTodos }) {
  return (
    <section className="scouts-section-card" aria-labelledby="scouts-ultimos-titulo">
      <SectionTitle id="scouts-ultimos-titulo" title="Últimos jogos" actionLabel="Ver todos" onAction={onVerTodos} />
      {partidas.length ? (
        <div className="scouts-match-list">
          {partidas.map((partida) => (
            <MatchRow key={partida.id} partida={partida} />
          ))}
        </div>
      ) : (
        <EmptyInline icon={FaFutbol} text="Nenhuma partida encontrada para os filtros selecionados." />
      )}
    </section>
  );
}

function RecentDuoMatches({ partidas, onVerTodos }) {
  return (
    <section className="scouts-section-card" aria-labelledby="scouts-dupla-jogos-titulo">
      <SectionTitle id="scouts-dupla-jogos-titulo" title="Jogos da dupla" actionLabel="Ver todos" onAction={onVerTodos} />
      {partidas.length ? (
        <div className="scouts-match-list">
          {partidas.map((partida) => (
            <MatchRow key={partida.id} partida={partida} modo={TIPO_DUPLAS} />
          ))}
        </div>
      ) : (
        <EmptyInline icon={FaUsers} text="Esta dupla ainda não possui partidas registradas." />
      )}
    </section>
  );
}

function MatchRow({ partida, modo = TIPO_ATLETA }) {
  const resultado = obterResultadoPartida(partida);
  const venceu = resultado === 'Vitória';
  const contexto = obterContextoPartida(partida);
  const placar = obterPlacarPartida(partida, modo);

  return (
    <Link
      to={partida.id ? obterRotaDetalhePartida(partida) : '/minhas-partidas'}
      className="scouts-match-row"
    >
      <Avatar
        name={contexto}
        size="sm"
        type="group"
        className="home-dashboard-jogo-avatar"
        title={contexto}
      />
      <div>
        <strong>{contexto}</strong>
        <span>{resultado} · {placar}</span>
        <small>{obterDataCurta(partida.dataPartida)}</small>
      </div>
      <em className={venceu ? 'vitoria' : 'derrota'}>{resultado}</em>
      <FaChevronRight aria-hidden="true" />
    </Link>
  );
}

function ConnectionsPreview({ parceiros, adversarios, onVerTodos }) {
  return (
    <section className="scouts-section-card" aria-labelledby="scouts-conexoes-titulo">
      <SectionTitle id="scouts-conexoes-titulo" title="Conexões" actionLabel="Ver todos" onAction={onVerTodos} />
      <div className="scouts-connections-grid">
        <RelationBlock title="Principais parceiros" items={parceiros} empty="Este atleta ainda não possui parceiros registrados." />
        <RelationBlock title="Adversários frequentes" items={adversarios} empty="Este atleta ainda não enfrentou adversários vinculados." />
      </div>
    </section>
  );
}

function ConexoesTab({ parceiros, adversarios }) {
  return (
    <>
      <HighlightsGrid parceiros={parceiros} adversarios={adversarios} />
      <section className="scouts-section-card">
        <div className="scouts-connections-grid">
          <RelationBlock title="Principais parceiros" items={parceiros} empty="Este atleta ainda não possui parceiros registrados." expanded />
          <RelationBlock title="Adversários frequentes" items={adversarios} empty="Este atleta ainda não enfrentou adversários vinculados." expanded />
        </div>
      </section>
    </>
  );
}

function HighlightsGrid({ parceiros, adversarios }) {
  const parceiroMaisJogou = parceiros[0];
  const parceiroMaisVitorias = [...parceiros].sort((a, b) => (b.vitorias || 0) - (a.vitorias || 0))[0];
  const adversarioMaisEnfrentado = adversarios[0];
  const adversarioMaisVencido = [...adversarios].sort((a, b) => (b.vitorias || 0) - (a.vitorias || 0))[0];

  return (
    <section className="scouts-highlight-grid" aria-label="Destaques de conexões">
      <Highlight label="Mais jogos juntos" item={parceiroMaisJogou} />
      <Highlight label="Mais vitórias juntos" item={parceiroMaisVitorias} />
      <Highlight label="Mais enfrentado" item={adversarioMaisEnfrentado} />
      <Highlight label="Mais vencido" item={adversarioMaisVencido} />
    </section>
  );
}

function Highlight({ label, item }) {
  return (
    <article className="scouts-highlight-card">
      <span>{label}</span>
      {item ? (
        <>
          <strong>{obterNomeRelacao(item)}</strong>
          <small>{item.partidas || 0} jogos · {item.vitorias || 0}V</small>
        </>
      ) : (
        <small>Dados insuficientes</small>
      )}
    </article>
  );
}

function RelationBlock({ title, items, empty, expanded = false }) {
  const lista = expanded ? items : items.slice(0, 3);

  return (
    <div className="scouts-relation-block">
      <h3>{title}</h3>
      {lista.length ? (
        <div className="scouts-relation-list">
          {lista.map((item) => (
            <article key={item.atletaId || item.nome} className="scouts-relation-item">
              <AvatarUsuario
                nome={obterNomeRelacao(item)}
                fotoPerfilUrl={obterFotoPerfilAvatar(item)}
                tamanho="sm"
              />
              <div>
                <strong>{obterNomeRelacao(item)}</strong>
                <span>{item.partidas || 0} jogos · {item.vitorias || 0}V · {formatarPercentual(item.aproveitamento)}</span>
                {expanded && item.partidasComPlacar > 0 && (
                  <small>Saldo {formatarSaldo(item.saldoPontos)} · {item.partidasComPlacar} com placar</small>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="home-dashboard-vazio">{empty}</p>
      )}
    </div>
  );
}

function GroupsPreview({ grupos, onVerTodos }) {
  return (
    <section className="scouts-section-card" aria-labelledby="scouts-grupos-preview-titulo">
      <SectionTitle id="scouts-grupos-preview-titulo" title="Desempenho por grupo" actionLabel={onVerTodos ? 'Ver todos' : null} onAction={onVerTodos} />
      {grupos.length ? (
        <div className="scouts-groups-list">
          {grupos.map((grupo) => (
            <GroupRow key={grupo.grupoId || grupo.nome} grupo={grupo} />
          ))}
        </div>
      ) : (
        <p className="home-dashboard-vazio">Ainda não há dados suficientes. Jogue partidas vinculadas a um grupo para acompanhar seu desempenho.</p>
      )}
    </section>
  );
}

function GruposTab({ grupos }) {
  return (
    <section className="scouts-section-card" aria-labelledby="scouts-grupos-titulo">
      <SectionTitle id="scouts-grupos-titulo" title="Desempenho por grupo" />
      {grupos.length ? (
        <div className="scouts-groups-list expanded">
          {grupos.map((grupo) => (
            <GroupRow key={grupo.grupoId || grupo.nome} grupo={grupo} expanded />
          ))}
        </div>
      ) : (
        <p className="home-dashboard-vazio">Ainda não há dados suficientes. Jogue partidas vinculadas a um grupo para acompanhar seu desempenho.</p>
      )}
    </section>
  );
}

function GroupRow({ grupo, expanded = false }) {
  const estatisticas = grupo.estatisticasPontos || {};

  return (
    <article className="scouts-group-row">
      <Avatar name={grupo.nome || 'Grupo'} size="sm" type="group" />
      <div>
        <strong>{obterNomeGrupoPartidaExibicao(grupo.nome, 'Partidas avulsas')}</strong>
        <span>{grupo.jogos || 0} jogos · {grupo.vitorias || 0}V · {formatarPercentual(grupo.aproveitamento)}</span>
        {expanded && (
          <small>
            {grupo.posicaoRanking ? `#${grupo.posicaoRanking} no ranking · ` : ''}
            {estatisticas.disponivel ? `Saldo ${formatarSaldo(estatisticas.saldo)}` : 'Sem placar suficiente'}
          </small>
        )}
      </div>
      <em>{grupo.partidasAvulsas ? 'Avulsa' : 'Grupo'}</em>
    </article>
  );
}

function EvolutionChart({ evolucao }) {
  const ultimosMeses = evolucao.slice(-6);

  return (
    <section className="scouts-section-card" aria-labelledby="scouts-grafico-titulo">
      <SectionTitle id="scouts-grafico-titulo" title="Evolução do aproveitamento" />
      {ultimosMeses.length ? (
        <div className="scouts-evolution-chart" aria-label="Evolução do aproveitamento por mês">
          {ultimosMeses.map((item) => {
            const possuiDados = item.possuiDados !== false && item.aproveitamentoDados !== null;
            const aproveitamento = possuiDados ? Math.max(0, Math.min(100, obterNumero(item.aproveitamentoDados ?? item.aproveitamento))) : null;
            const altura = aproveitamento === null ? 0 : Math.max(8, aproveitamento);
            return (
              <div key={`${item.ano}-${item.numeroMes || item.mes}`} className={!possuiDados ? 'sem-dados' : ''}>
                <span>{possuiDados ? formatarPercentual(aproveitamento) : '—'}</span>
                <div>
                  {possuiDados && <i style={{ height: `${altura}%` }} />}
                </div>
                <small>{item.mes}</small>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="home-dashboard-vazio">Evolução ainda não disponível.</p>
      )}
    </section>
  );
}

function JogosTab({ jogos, carregando, erro, filtros, onFiltrosChange }) {
  function atualizarFiltro(campo, valor) {
    onFiltrosChange((atual) => ({ ...atual, [campo]: valor }));
  }

  return (
    <section className="scouts-section-card" aria-labelledby="scouts-jogos-titulo">
      <SectionTitle id="scouts-jogos-titulo" title="Jogos" />
      <div className="scouts-filters" aria-label="Filtros de jogos">
        <select value={filtros.resultado} onChange={(evento) => atualizarFiltro('resultado', evento.target.value)} aria-label="Resultado">
          <option value="">Todos</option>
          <option value="vitorias">Vitórias</option>
          <option value="derrotas">Derrotas</option>
        </select>
        <select value={filtros.tipoRegistro} onChange={(evento) => atualizarFiltro('tipoRegistro', evento.target.value)} aria-label="Tipo de registro">
          <option value="">Todos registros</option>
          <option value="com-placar">Com placar</option>
          <option value="apenas-vencedor">Apenas vencedor</option>
        </select>
        <select value={filtros.periodo} onChange={(evento) => atualizarFiltro('periodo', evento.target.value)} aria-label="Período">
          <option value="">Todo período</option>
          <option value="30d">30 dias</option>
          <option value="90d">90 dias</option>
          <option value="ano">Ano atual</option>
        </select>
      </div>

      {carregando && <div className="home-dashboard-scouts home-dashboard-skeleton-card" aria-busy="true" />}
      {erro && <p className="home-dashboard-vazio">{erro}</p>}
      {!carregando && !erro && jogos.length > 0 && (
        <div className="scouts-match-list">
          {jogos.map((partida) => (
            <MatchRow key={partida.id} partida={partida} />
          ))}
        </div>
      )}
      {!carregando && !erro && jogos.length === 0 && (
        <EmptyInline icon={FaFutbol} text="Nenhuma partida encontrada para os filtros selecionados." />
      )}
    </section>
  );
}

function DoublesSelector({ duplas, parceiroSelecionado, onSelecionar }) {
  return (
    <section className="scouts-section-card scouts-doubles-selector" aria-labelledby="scouts-duplas-seletor">
      <SectionTitle id="scouts-duplas-seletor" title="Escolha a dupla" subtitle="Duplas derivadas das partidas em que você jogou junto." />
      {duplas.length ? (
        <div className="scouts-doubles-list">
          {duplas.map((dupla) => (
            <button
              key={dupla.parceiroId}
              type="button"
              className={parceiroSelecionado?.parceiroId === dupla.parceiroId ? 'ativo' : ''}
              onClick={() => onSelecionar(dupla)}
            >
              <AvatarUsuario nome={obterNomeRelacao(dupla)} fotoPerfilUrl={dupla.fotoPerfilUrl} tamanho="sm" />
              <span>
                <strong>{obterNomeRelacao(dupla)}</strong>
                <small>{dupla.jogos || 0} jogos · {dupla.vitorias || 0}V · {formatarPercentual(dupla.aproveitamento)}</small>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="home-dashboard-vazio">Nenhuma dupla encontrada. Registre partidas com parceiros para acompanhar esse scout.</p>
      )}
    </section>
  );
}

function DuoHeader({ dupla }) {
  const atletas = [dupla?.atleta1, dupla?.atleta2].filter(Boolean);

  return (
    <section className="scouts-duo-header" aria-label="Dupla selecionada">
      {atletas.map((atleta) => (
        <div key={atleta.atletaId}>
          <AvatarUsuario nome={obterNomeAtletaDupla(atleta)} tamanho="md" />
          <strong>{obterNomeAtletaDupla(atleta)}</strong>
        </div>
      ))}
    </section>
  );
}

function DuoGamesTab({ jogos }) {
  return (
    <section className="scouts-section-card" aria-labelledby="scouts-dupla-jogos-completos">
      <SectionTitle id="scouts-dupla-jogos-completos" title="Jogos da dupla" />
      {jogos.length ? (
        <div className="scouts-match-list">
          {jogos.map((partida) => (
            <MatchRow key={partida.id} partida={partida} modo={TIPO_DUPLAS} />
          ))}
        </div>
      ) : (
        <EmptyInline icon={FaUsers} text="Esta dupla ainda não possui partidas registradas." />
      )}
    </section>
  );
}

function DuoOpponentsPreview({ adversarios }) {
  return (
    <section className="scouts-section-card" aria-labelledby="scouts-dupla-conexoes-preview">
      <SectionTitle id="scouts-dupla-conexoes-preview" title="Principais adversários" />
      {adversarios.length ? (
        <div className="scouts-duo-opponents">
          {adversarios.map((adversario) => (
            <DuoOpponentRow key={adversario.atletas?.map((atleta) => atleta.atletaId).join('-')} adversario={adversario} />
          ))}
        </div>
      ) : (
        <p className="home-dashboard-vazio">Esta dupla ainda não possui adversários frequentes.</p>
      )}
    </section>
  );
}

function DuoConnectionsTab({ adversarios }) {
  return (
    <section className="scouts-section-card" aria-labelledby="scouts-dupla-conexoes">
      <SectionTitle id="scouts-dupla-conexoes" title="Conexões da dupla" />
      {adversarios.length ? (
        <div className="scouts-duo-opponents expanded">
          {adversarios.map((adversario) => (
            <DuoOpponentRow key={adversario.atletas?.map((atleta) => atleta.atletaId).join('-')} adversario={adversario} expanded />
          ))}
        </div>
      ) : (
        <p className="home-dashboard-vazio">Esta dupla ainda não possui duplas adversárias frequentes.</p>
      )}
    </section>
  );
}

function DuoOpponentRow({ adversario, expanded = false }) {
  const nomes = prepararLista(adversario.atletas).map(obterNomeAtletaDupla).join(' / ');

  return (
    <article className="scouts-duo-opponent-row">
      <div>
        <strong>{nomes || 'Dupla adversária'}</strong>
        <span>{adversario.partidas || 0} jogos · {adversario.vitorias || 0}V · {formatarPercentual(adversario.aproveitamento)}</span>
        {expanded && adversario.partidasComPlacar > 0 && (
          <small>Saldo {formatarSaldo(adversario.saldoPontos)} · {adversario.partidasComPlacar} com placar</small>
        )}
      </div>
      <em>{obterDataCurta(adversario.ultimaPartida)}</em>
    </article>
  );
}

function SectionTitle({ id, title, subtitle, actionLabel, onAction }) {
  return (
    <div className="scouts-section-title">
      <div>
        <h2 id={id}>{title}</h2>
        {subtitle && <span>{subtitle}</span>}
      </div>
      {actionLabel && (
        <button type="button" onClick={onAction}>
          {actionLabel}
          <FaChevronRight aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon: Icone, title, description, action, compact = false }) {
  return (
    <div className={compact ? 'home-dashboard-empty-state scouts-empty-compact' : 'home-dashboard-empty-state'}>
      <Icone aria-hidden="true" />
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

function EmptyInline({ icon: Icone, text }) {
  return (
    <div className="scouts-empty-inline">
      <Icone aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

function montarSequenciaFallback(resumo) {
  const quantidade = resumo?.sequenciaAtual ?? 0;
  const tipo = resumo?.tipoSequenciaAtual || 'vitoria';

  if (quantidade <= 0) {
    return 'Sem sequência';
  }

  if (tipo === 'derrota') {
    return quantidade === 1 ? '1 derrota seguida' : `${quantidade} derrotas seguidas`;
  }

  return quantidade === 1 ? '1 vitória seguida' : `${quantidade} vitórias seguidas`;
}
