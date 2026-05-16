import { Link } from 'react-router-dom';
import {
  FaBolt,
  FaChartLine,
  FaFire,
  FaMapMarkerAlt,
  FaMedal,
  FaPlay,
  FaShieldAlt,
  FaTrophy,
  FaUsers
} from 'react-icons/fa';
import { PlacarDupla } from '../partidas/PlacarDupla';

const mensagemRegistro = 'Para registrar sua partida, entre ou crie sua conta rapidinho.';

function obterNome(nome, apelido) {
  return apelido || nome || 'Atleta';
}

function formatarTempo(minutos) {
  if (!Number.isFinite(Number(minutos))) {
    return 'agora';
  }

  if (minutos < 1) {
    return 'agora';
  }

  if (minutos < 60) {
    return `há ${minutos} min`;
  }

  const horas = Math.floor(minutos / 60);
  if (horas < 24) {
    return `há ${horas}h`;
  }

  return `há ${Math.floor(horas / 24)}d`;
}

function obterIcone(id) {
  const icones = {
    partidas: FaPlay,
    atletas: FaUsers,
    grupos: FaShieldAlt,
    campeonatos: FaTrophy,
    hoje: FaBolt,
    online: FaFire,
    cidades: FaMapMarkerAlt,
    media: FaChartLine,
    sequencia: FaFire,
    disputada: FaMedal,
    elastica: FaBolt
  };

  return icones[id] || FaChartLine;
}

function PublicStatCard({ metrica }) {
  const Icone = obterIcone(metrica.id);

  return (
    <article className="public-stat-card">
      <span className="public-stat-icon"><Icone /></span>
      <strong>{metrica.valor}</strong>
      <span>{metrica.rotulo}</span>
      {metrica.complemento && <small>{metrica.complemento}</small>}
    </article>
  );
}

function PublicHero({ dashboard }) {
  const partidas = dashboard?.ultimasPartidas || [];
  const ranking = dashboard?.ranking || [];

  return (
    <section className="public-hero">
      <div className="public-hero-copy">
        <span className="public-kicker">QNF live dashboard</span>
        <h1>Transforme suas partidas em ranking, estatísticas e história.</h1>
        <p>A plataforma do futevôlei para atletas, grupos e campeonatos.</p>

        <div className="public-hero-actions">
          <Link to="/login" state={{ mensagem: mensagemRegistro }} className="botao-primario">
            Registrar Partida
          </Link>
          <Link to="/login" className="botao-secundario">
            Entrar
          </Link>
        </div>
      </div>

      <div className="public-hero-live" aria-label="Movimento da plataforma">
        <article className="public-floating-card public-floating-card-score">
          <span>Última partida</span>
          <strong>
            {partidas[0]
              ? `${partidas[0].pontosDupla1} x ${partidas[0].pontosDupla2}`
              : '18 x 16'}
          </strong>
          <small>{partidas[0]?.grupo || partidas[0]?.campeonato || 'Grupo Geral'}</small>
        </article>
        <article className="public-floating-card public-floating-card-ranking">
          <span>Ranking ativo</span>
          <strong>{ranking[0] ? `#1 ${obterNome(ranking[0].nome, ranking[0].apelido)}` : '#1 QNF'}</strong>
          <small>{ranking[0] ? `${ranking[0].aproveitamento}% aproveitamento` : 'Atletas em evolução'}</small>
        </article>
        <article className="public-floating-card public-floating-card-community">
          <span>Hoje</span>
          <strong>{dashboard?.resumo?.partidasHoje || 0}</strong>
          <small>partidas movimentando o ranking</small>
        </article>
      </div>
    </section>
  );
}

function PublicLiveMatches({ partidas }) {
  return (
    <section className="public-section public-live-section">
      <div className="public-section-header">
        <span>Ao vivo</span>
        <h2>Últimas partidas registradas</h2>
      </div>

      <div className="public-live-list">
        {(partidas || []).length === 0 ? (
          <article className="public-empty-card">Nenhuma partida registrada ainda.</article>
        ) : (
          partidas.map((partida) => (
            <article key={partida.id} className="public-live-card">
              <div className="public-live-card-top">
                <span>{partida.grupo || partida.campeonato || 'Grupo Geral'}</span>
                <strong>{formatarTempo(partida.minutosAtras)}</strong>
              </div>
              <PlacarDupla
                atletas={partida.dupla1}
                placar={partida.pontosDupla1}
                vencedor={partida.vencedor === partida.dupla1}
              />
              <PlacarDupla
                atletas={partida.dupla2}
                placar={partida.pontosDupla2}
                vencedor={partida.vencedor === partida.dupla2}
              />
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function PublicRanking({ ranking }) {
  return (
    <section className="public-section">
      <div className="public-section-header">
        <span>Top 10</span>
        <h2>Ranking geral</h2>
      </div>

      <div className="public-ranking-list">
        {(ranking || []).map((atleta) => (
          <article key={atleta.atletaId} className="public-ranking-row">
            <strong className="public-ranking-position">{atleta.posicao}</strong>
            <span className="public-avatar">{obterNome(atleta.nome, atleta.apelido).charAt(0)}</span>
            <div>
              <strong>{obterNome(atleta.nome, atleta.apelido)}</strong>
              <span>{atleta.vitorias}V · {atleta.derrotas}D · {atleta.aproveitamento}%</span>
            </div>
            <em>{atleta.sequenciaAtual > 0 ? `${atleta.sequenciaAtual}W` : `${atleta.pontos} pts`}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

function PublicHorizontalCards({ id, titulo, marcador, itens, renderItem, vazio }) {
  return (
    <section id={id} className="public-section">
      <div className="public-section-header">
        <span>{marcador}</span>
        <h2>{titulo}</h2>
      </div>
      <div className="public-horizontal-scroll">
        {(itens || []).length === 0 ? (
          <article className="public-empty-card">{vazio}</article>
        ) : (
          itens.map(renderItem)
        )}
      </div>
    </section>
  );
}

export function PublicHome({ dashboard, carregando, erro }) {
  const metricas = dashboard?.metricas || [];

  return (
    <section className="public-home">
      <PublicHero dashboard={dashboard} />

      {erro && <div className="public-alert">{erro}</div>}
      {carregando && <div className="public-alert">Carregando movimento da plataforma...</div>}

      <section className="public-stats-grid" aria-label="Números da plataforma">
        {metricas.slice(0, 7).map((metrica) => (
          <PublicStatCard key={metrica.id} metrica={metrica} />
        ))}
      </section>

      <PublicLiveMatches partidas={dashboard?.ultimasPartidas || []} />

      <div className="public-two-columns">
        <PublicRanking ranking={dashboard?.ranking || []} />

        <PublicHorizontalCards
          titulo="Atletas em destaque"
          marcador="Destaques"
          itens={dashboard?.atletasDestaque || []}
          vazio="Os destaques aparecem conforme a comunidade registra partidas."
          renderItem={(atleta) => (
            <article key={`${atleta.atletaId}-${atleta.destaque}`} className="public-highlight-card">
              <span className="public-avatar">{obterNome(atleta.nome, atleta.apelido).charAt(0)}</span>
              <strong>{obterNome(atleta.nome, atleta.apelido)}</strong>
              <small>{atleta.destaque}</small>
              <em>{atleta.valor} {atleta.complemento}</em>
            </article>
          )}
        />
      </div>

      <PublicHorizontalCards
        id="grupos"
        titulo="Grupos em destaque"
        marcador="Comunidades"
        itens={dashboard?.grupos || []}
        vazio="Os grupos mais ativos aparecem aqui."
        renderItem={(grupo) => (
          <article key={grupo.grupoId} className="public-group-card">
            <strong>{grupo.nome}</strong>
            <span>{grupo.partidas} partidas</span>
            <small>{grupo.atletas} atletas em jogos recentes</small>
          </article>
        )}
      />

      <PublicHorizontalCards
        titulo="Campeonatos em andamento"
        marcador="Eventos"
        itens={dashboard?.campeonatos || []}
        vazio="Os campeonatos cadastrados aparecem aqui."
        renderItem={(campeonato) => (
          <article key={campeonato.campeonatoId} className="public-championship-card">
            <span>{campeonato.status}</span>
            <strong>{campeonato.nome}</strong>
            <small>{campeonato.local || 'Local a definir'}</small>
            <em>{campeonato.partidas} partidas registradas</em>
          </article>
        )}
      />

      <div className="public-two-columns">
        <section className="public-section">
          <div className="public-section-header">
            <span>Regiões</span>
            <h2>Cidades mais ativas</h2>
          </div>
          <div className="public-region-list">
            {(dashboard?.regioes || []).map((regiao) => (
              <article key={`${regiao.cidade}-${regiao.estado || ''}`}>
                <strong>{regiao.cidade}{regiao.estado ? `/${regiao.estado}` : ''}</strong>
                <span>{regiao.partidas} partidas</span>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section">
          <div className="public-section-header">
            <span>Insights</span>
            <h2>Movimento da comunidade</h2>
          </div>
          <div className="public-insights-list">
            {(dashboard?.insights || []).map((insight) => (
              <article key={insight}>{insight}</article>
            ))}
          </div>
        </section>
      </div>

      <section className="public-community-section">
        <div>
          <span>Comunidade</span>
          <h2>Seu jogo já vale história.</h2>
          <p>Registre partidas, acompanhe evolução, entre nos rankings e leve seu grupo para dentro do QNF.</p>
        </div>
        <div className="public-hero-actions">
          <Link to="/login" state={{ mensagem: mensagemRegistro }} className="botao-primario">
            Registrar partida
          </Link>
          <Link to="/login" className="botao-secundario">
            Entrar
          </Link>
        </div>
      </section>
    </section>
  );
}
