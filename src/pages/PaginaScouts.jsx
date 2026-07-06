import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaChartBar,
  FaChartLine,
  FaChevronRight,
  FaFire,
  FaFutbol,
  FaMedal,
  FaShieldAlt,
  FaTrophy,
  FaUsers
} from 'react-icons/fa';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../components/AvatarUsuario';
import { Avatar } from '../components/ui/Avatar';
import { dashboardServico } from '../services/dashboardServico';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { extrairMensagemErro } from '../utils/erros';
import { formatarData } from '../utils/formatacao';
import { obterNomeGrupoPartidaExibicao } from '../utils/partidas';
import '../components/home/home-dashboard.css';

const ABA_ATLETA = 'atleta';
const ABA_DUPLAS = 'duplas';

function obterTextoLimpo(...valores) {
  return valores
    .map((valor) => String(valor || '').trim())
    .find(Boolean) || '';
}

function obterNumero(valor, fallback = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : fallback;
}

function formatarPercentual(valor) {
  const numero = obterNumero(valor);
  return `${Number.isInteger(numero) ? numero : numero.toFixed(1)}%`;
}

function formatarSaldo(valor) {
  const numero = obterNumero(valor);
  return numero > 0 ? `+${numero}` : String(numero);
}

function obterResultadoPartida(partida) {
  if (partida?.resultado === 'W' || String(partida?.resultado || '').toLowerCase().includes('vitória')) {
    return 'Vitória';
  }

  if (partida?.resultado === 'L' || String(partida?.resultado || '').toLowerCase().includes('derrota')) {
    return 'Derrota';
  }

  return partida?.resultado || 'Resultado';
}

function obterPlacarPartida(partida) {
  const placarSuaDupla = partida?.placarSuaDupla;
  const placarAdversarios = partida?.placarAdversarios;

  if (
    placarSuaDupla === null ||
    placarSuaDupla === undefined ||
    placarAdversarios === null ||
    placarAdversarios === undefined ||
    (Number(placarSuaDupla) === 0 && Number(placarAdversarios) === 0)
  ) {
    return '';
  }

  return `${placarSuaDupla} x ${placarAdversarios}`;
}

function obterContextoPartida(partida) {
  return [
    obterNomeGrupoPartidaExibicao(partida?.grupo, ''),
    partida?.categoria,
    partida?.competicao
  ].filter(Boolean)[0] || 'Partida avulsa';
}

function obterNomeRelacao(relacao) {
  return obterTextoLimpo(relacao?.apelido, relacao?.nome, 'Atleta QNF');
}

function prepararDesempenhoPorGrupo(dashboard) {
  const origem = dashboard?.desempenhoPorGrupo || dashboard?.grupos || dashboard?.resumoPorGrupo;
  return Array.isArray(origem) ? origem : [];
}

function obterMetricasResumo(resumo) {
  return [
    { id: 'jogos', rotulo: 'Jogos', valor: resumo.totalPartidas ?? 0, icone: FaFutbol },
    { id: 'vitorias', rotulo: 'Vitórias', valor: resumo.vitorias ?? 0, icone: FaTrophy },
    { id: 'derrotas', rotulo: 'Derrotas', valor: resumo.derrotas ?? 0, icone: FaShieldAlt },
    { id: 'aproveitamento', rotulo: 'Aproveitamento', valor: formatarPercentual(resumo.aproveitamento), icone: FaChartLine },
    { id: 'sequencia', rotulo: 'Sequência', valor: resumo.sequenciaAtual ?? 0, icone: FaFire }
  ];
}

function obterMetricasDesempenhoGeral(resumo) {
  return [
    { id: 'pontos-pro', rotulo: 'Pontos Pró', valor: resumo.pontosPro ?? resumo.totalPontosPro ?? '-', icone: FaMedal },
    { id: 'pontos-contra', rotulo: 'Pontos Contra', valor: resumo.pontosContra ?? resumo.totalPontosContra ?? '-', icone: FaShieldAlt },
    { id: 'saldo', rotulo: 'Saldo', valor: formatarSaldo(resumo.saldoPontos ?? 0), icone: FaChartBar }
  ];
}

export function PaginaScouts() {
  const { usuario } = useAutenticacao();
  const [abaAtiva, setAbaAtiva] = useState(ABA_ATLETA);
  const [dashboard, setDashboard] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
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

  const perfil = dashboard?.perfil || {};
  const resumo = dashboard?.resumo || {};
  const ultimasPartidas = Array.isArray(dashboard?.ultimasPartidas) ? dashboard.ultimasPartidas : [];
  const melhoresParceiros = Array.isArray(dashboard?.melhoresParceiros) ? dashboard.melhoresParceiros : [];
  const rivaisMaisEnfrentados = Array.isArray(dashboard?.rivaisMaisEnfrentados) ? dashboard.rivaisMaisEnfrentados : [];
  const desempenhoPorGrupo = useMemo(() => prepararDesempenhoPorGrupo(dashboard), [dashboard]);
  const evolucao = Array.isArray(dashboard?.evolucao) ? dashboard.evolucao : [];
  const rankingDupla = dashboard?.rankingDupla || null;
  const nomeCompleto = obterTextoLimpo(perfil.nome, usuario?.nomeCompleto, usuario?.nome, 'Atleta QuebraNunca');
  const apelido = obterTextoLimpo(perfil.apelido, usuario?.apelido);
  const fotoPerfilUrl = obterFotoPerfilAvatar(perfil) || obterFotoPerfilAvatar(usuario);

  if (carregando) {
    return (
      <section className="pagina home-dashboard scouts-dashboard" aria-busy="true">
        <div className="home-dashboard-identidade-card home-dashboard-skeleton-card" />
        <div className="home-dashboard-scouts home-dashboard-skeleton-card" />
        <div className="home-dashboard-scouts home-dashboard-skeleton-card" />
      </section>
    );
  }

  if (erro) {
    return (
      <section className="pagina home-dashboard scouts-dashboard">
        <div className="home-dashboard-empty-state">
          <FaChartLine aria-hidden="true" />
          <strong>Não foi possível carregar seus scouts.</strong>
          <p>{erro}</p>
        </div>
      </section>
    );
  }

  if (!possuiAtletaVinculado) {
    return (
      <section className="pagina home-dashboard scouts-dashboard">
        <div className="home-dashboard-empty-state">
          <FaChartLine aria-hidden="true" />
          <strong>Vincule seu atleta para ver seus scouts.</strong>
          <p>As estatísticas esportivas dependem de um atleta conectado ao seu usuário.</p>
          <Link to="/app/perfil">Abrir perfil</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pagina home-dashboard scouts-dashboard">
      <header className="home-dashboard-identidade-card scouts-dashboard-topo">
        <AvatarUsuario
          nome={nomeCompleto}
          fotoPerfilUrl={fotoPerfilUrl}
          tamanho="xl"
          className="home-dashboard-avatar"
        />
        <div className="home-dashboard-identidade-texto">
          <h1>{nomeCompleto}</h1>
          {apelido && <p>{apelido}</p>}
        </div>
        <div className="scouts-dashboard-toggle" role="tablist" aria-label="Tipo de scout">
          <button
            type="button"
            className={abaAtiva === ABA_ATLETA ? 'ativo' : ''}
            onClick={() => setAbaAtiva(ABA_ATLETA)}
            role="tab"
            aria-selected={abaAtiva === ABA_ATLETA}
          >
            Atleta
          </button>
          <button
            type="button"
            className={abaAtiva === ABA_DUPLAS ? 'ativo' : ''}
            onClick={() => setAbaAtiva(ABA_DUPLAS)}
            role="tab"
            aria-selected={abaAtiva === ABA_DUPLAS}
          >
            Duplas
          </button>
        </div>
      </header>

      <ScoutSummary metricas={obterMetricasResumo(resumo)} />
      <ScoutGeneralPerformance metricas={obterMetricasDesempenhoGeral(resumo)} />
      <ScoutHistory partidas={ultimasPartidas} />
      <ScoutRelations titulo="Parceiros mais frequentes" itens={melhoresParceiros} vazio="Ainda não há parceiros recorrentes." />
      <ScoutRelations titulo="Adversários mais enfrentados" itens={rivaisMaisEnfrentados} vazio="Ainda não há adversários recorrentes." />
      <ScoutGroupPerformance grupos={desempenhoPorGrupo} />

      {abaAtiva === ABA_DUPLAS && (
        <ScoutDoublesRanking ranking={rankingDupla} parceiros={melhoresParceiros} ultimasPartidas={ultimasPartidas} />
      )}

      <ScoutChart evolucao={evolucao} />
    </section>
  );
}

function ScoutSummary({ metricas }) {
  return (
    <section className="home-dashboard-scouts scouts-dashboard-card" aria-labelledby="scouts-resumo-titulo">
      <div className="home-dashboard-section-title">
        <h2 id="scouts-resumo-titulo">Resumo</h2>
      </div>
      <div className="home-dashboard-scouts-grid scouts-dashboard-resumo-grid">
        {metricas.map((metrica) => {
          const Icone = metrica.icone;
          return (
            <article key={metrica.id} className="home-dashboard-scout-card">
              <Icone aria-hidden="true" />
              <strong>{metrica.valor}</strong>
              <span>{metrica.rotulo}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ScoutGeneralPerformance({ metricas }) {
  return (
    <section className="home-dashboard-scouts scouts-dashboard-card" aria-labelledby="scouts-desempenho-titulo">
      <div className="home-dashboard-section-title">
        <h2 id="scouts-desempenho-titulo">Desempenho Geral</h2>
      </div>
      <div className="scouts-dashboard-mini-grid">
        {metricas.map((metrica) => {
          const Icone = metrica.icone;
          return (
            <article key={metrica.id} className="scouts-dashboard-mini-card">
              <Icone aria-hidden="true" />
              <span>{metrica.rotulo}</span>
              <strong>{metrica.valor}</strong>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ScoutHistory({ partidas }) {
  return (
    <section className="home-dashboard-atividade" aria-labelledby="scouts-ultimos-titulo">
      <div className="home-dashboard-section-title">
        <h2 id="scouts-ultimos-titulo">Últimos Jogos</h2>
        <Link to="/minhas-partidas">
          Ver todos
          <FaChevronRight aria-hidden="true" />
        </Link>
      </div>

      {partidas.length > 0 ? (
        <div className="home-dashboard-timeline">
          {partidas.slice(0, 5).map((partida) => {
            const resultado = obterResultadoPartida(partida);
            const venceu = resultado === 'Vitória';
            const contexto = obterContextoPartida(partida);
            const placar = obterPlacarPartida(partida);

            return (
              <Link
                key={partida.id}
                to={partida.id ? `/minhas-partidas?partidaId=${partida.id}` : '/minhas-partidas'}
                className="home-dashboard-timeline-item"
              >
                <Avatar
                  name={contexto}
                  size="sm"
                  type="group"
                  className="home-dashboard-jogo-avatar"
                  title={contexto}
                />
                <div className="home-dashboard-timeline-conteudo">
                  <div>
                    <strong>{contexto}</strong>
                    <span>{partida.dataPartida ? formatarData(partida.dataPartida) : 'Data a definir'}</span>
                  </div>
                </div>
                <em className={venceu ? 'vitoria' : 'derrota'}>{resultado}</em>
                {placar && <strong className="home-dashboard-jogo-placar">{placar}</strong>}
                <FaChevronRight aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="home-dashboard-empty-state">
          <FaFutbol aria-hidden="true" />
          <strong>Nenhum jogo encontrado.</strong>
          <p>Registre uma partida para iniciar seus scouts.</p>
        </div>
      )}
    </section>
  );
}

function ScoutRelations({ titulo, itens, vazio }) {
  return (
    <section className="home-dashboard-scouts scouts-dashboard-card" aria-labelledby={`scouts-${titulo.replace(/\s+/g, '-').toLowerCase()}`}>
      <div className="home-dashboard-section-title">
        <h2 id={`scouts-${titulo.replace(/\s+/g, '-').toLowerCase()}`}>{titulo}</h2>
      </div>

      {itens.length > 0 ? (
        <div className="scouts-dashboard-relacoes">
          {itens.slice(0, 5).map((item) => (
            <article key={item.atletaId || item.nome} className="scouts-dashboard-relacao-item">
              <AvatarUsuario
                nome={obterNomeRelacao(item)}
                fotoPerfilUrl={obterFotoPerfilAvatar(item)}
                tamanho="sm"
              />
              <div>
                <strong>{obterNomeRelacao(item)}</strong>
                <span>{item.partidas || 0} jogos · {item.vitorias || 0}V · {formatarPercentual(item.aproveitamento)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="home-dashboard-vazio">{vazio}</p>
      )}
    </section>
  );
}

function ScoutGroupPerformance({ grupos }) {
  return (
    <section className="home-dashboard-scouts scouts-dashboard-card" aria-labelledby="scouts-grupos-titulo">
      <div className="home-dashboard-section-title">
        <h2 id="scouts-grupos-titulo">Desempenho por Grupo</h2>
      </div>

      {grupos.length > 0 ? (
        <div className="scouts-dashboard-grupos">
          {grupos.slice(0, 6).map((grupo) => (
            <article key={grupo.grupoId || grupo.id || grupo.nome || grupo.nomeGrupo} className="scouts-dashboard-grupo-item">
              <strong>{obterNomeGrupoPartidaExibicao(grupo.nome || grupo.nomeGrupo, 'Partidas avulsas')}</strong>
              <span>{grupo.jogos || grupo.totalPartidas || 0} jogos</span>
              <span>{grupo.vitorias || 0} vitórias</span>
              <em>{formatarPercentual(grupo.aproveitamento)}</em>
            </article>
          ))}
        </div>
      ) : (
        <p className="home-dashboard-vazio">Desempenho por grupo ainda não disponível para este atleta.</p>
      )}
    </section>
  );
}

function ScoutDoublesRanking({ ranking, parceiros, ultimasPartidas }) {
  return (
    <section className="home-dashboard-scouts scouts-dashboard-card" aria-labelledby="scouts-duplas-titulo">
      <div className="home-dashboard-section-title">
        <h2 id="scouts-duplas-titulo">Ranking da Dupla</h2>
      </div>

      {ranking ? (
        <div className="scouts-dashboard-dupla-ranking">
          <span>Posição</span>
          <strong>{ranking.posicao ? `#${ranking.posicao}` : '-'}</strong>
          <span>Pontos</span>
          <strong>{ranking.pontos ?? 0}</strong>
          <span>Jogos</span>
          <strong>{ranking.jogos ?? 0}</strong>
          <span>Vitórias</span>
          <strong>{ranking.vitorias ?? 0}</strong>
          <span>Aproveitamento</span>
          <strong>{formatarPercentual(ranking.aproveitamento)}</strong>
        </div>
      ) : (
        <p className="home-dashboard-vazio">Ranking de dupla ainda não disponível para o painel atual.</p>
      )}

      {parceiros.length > 0 && (
        <div className="scouts-dashboard-duplas-frequentes" aria-label="Duplas frequentes">
          {parceiros.slice(0, 3).map((parceiro) => (
            <article key={parceiro.atletaId || parceiro.nome} className="scouts-dashboard-dupla-card">
              <AvatarUsuario nome={obterNomeRelacao(parceiro)} fotoPerfilUrl={obterFotoPerfilAvatar(parceiro)} tamanho="sm" />
              <div>
                <strong>{obterNomeRelacao(parceiro)}</strong>
                <span>{parceiro.partidas || 0} jogos · {parceiro.vitorias || 0} vitórias</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {ultimasPartidas.length === 0 && (
        <p className="home-dashboard-vazio">Últimos jogos da dupla aparecem quando houver partidas vinculadas.</p>
      )}
    </section>
  );
}

function ScoutChart({ evolucao }) {
  const ultimosMeses = evolucao.slice(-6);

  return (
    <section className="home-dashboard-scouts scouts-dashboard-card" aria-labelledby="scouts-grafico-titulo">
      <div className="home-dashboard-section-title">
        <h2 id="scouts-grafico-titulo">Evolução do aproveitamento</h2>
      </div>

      {ultimosMeses.length > 0 ? (
        <div className="scouts-dashboard-chart" aria-label="Evolução do aproveitamento por mês">
          {ultimosMeses.map((item) => {
            const aproveitamento = Math.max(0, Math.min(100, obterNumero(item.aproveitamento)));
            const altura = Math.max(12, aproveitamento);
            return (
              <div key={`${item.ano}-${item.numeroMes || item.mes}`}>
                <span>{formatarPercentual(aproveitamento)}</span>
                <div>
                  <i style={{ height: `${altura}%` }} />
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
