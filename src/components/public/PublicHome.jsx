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
import { AtletaPerfilLink } from '../AtletaPerfilLink';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../AvatarUsuario';
import { PlacarDupla } from '../partidas/PlacarDupla';
import { obterNomeExibicaoAtletaPerfil } from '../../utils/atletaUtils';

const estadoCriarConta = {
  mensagem: 'Use seu e-mail para entrar ou criar sua conta grátis.',
  origem: { pathname: '/app' }
};

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

function obterNomePublicoAtleta(atleta) {
  return obterNomeExibicaoAtletaPerfil(atleta) || 'Atleta';
}

function obterNumeroSeguro(valor, fallback = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : fallback;
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

function PublicHero() {
  return (
    <section className="public-hero">
      <div className="public-hero-copy">
        <span className="public-kicker">FUTEVÔLEI EM TEMPO REAL</span>
        <h1>Transforme suas partidas em ranking, scouts e história.</h1>
        <p>Registre partidas, acompanhe sua evolução e veja o desempenho do seu grupo em tempo real.</p>

        <div className="public-hero-actions">
          <Link to="/login" state={estadoCriarConta} className="botao-primario">
            Criar conta grátis
          </Link>
          <Link to="/ranking" className="botao-secundario">
            Ver rankings
          </Link>
        </div>
      </div>

      <div className="public-hero-live" aria-label="Movimento da plataforma">
        <article className="public-floating-card public-floating-card-score">
          <span>Última partida</span>
          <strong>18 x 16</strong>
          <small>Resultado registrado</small>
        </article>
        <article className="public-floating-card public-floating-card-ranking">
          <span>Ranking</span>
          <strong>#1 do grupo</strong>
          <small>Ranking atualizado automaticamente</small>
        </article>
        <article className="public-floating-card public-floating-card-community">
          <span>Scout</span>
          <strong>+12%</strong>
          <small>Evolução acompanhada em tempo real</small>
        </article>
      </div>
    </section>
  );
}

const passosComoFunciona = [
  {
    numero: '1',
    titulo: 'Registre a partida',
    texto: 'Lance o resultado do seu jogo em poucos toques.',
    Icone: FaPlay
  },
  {
    numero: '2',
    titulo: 'Veja seus scouts',
    texto: 'Acompanhe aproveitamento, sequência e evolução.',
    Icone: FaChartLine
  },
  {
    numero: '3',
    titulo: 'Suba no ranking',
    texto: 'Compare seu desempenho com atletas e duplas do grupo.',
    Icone: FaTrophy
  }
];

function PublicHowItWorks() {
  return (
    <section id="como-funciona" className="public-how-section" aria-labelledby="public-how-title">
      <div className="public-section-header public-how-header">
        <span>Como funciona</span>
        <h2 id="public-how-title">Do jogo ao ranking em três passos</h2>
      </div>

      <div className="public-how-steps">
        {passosComoFunciona.map(({ numero, titulo, texto, Icone }, indice) => (
          <article key={numero} className="public-how-card">
            <span className="public-how-number">{numero}</span>
            <span className="public-how-icon"><Icone /></span>
            <strong>{titulo}</strong>
            <p>{texto}</p>
            {indice < passosComoFunciona.length - 1 && (
              <span className="public-how-connector" aria-hidden="true" />
            )}
          </article>
        ))}
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
            <AtletaPerfilLink atleta={atleta} ariaLabel={`Abrir perfil de ${obterNomePublicoAtleta(atleta)}`}>
              <AvatarUsuario
                nome={obterNomePublicoAtleta(atleta)}
                fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
                tamanho="sm"
                className="public-avatar"
              />
            </AtletaPerfilLink>
            <div>
              <AtletaPerfilLink atleta={atleta} className="atleta-nome-link">
                <strong>{obterNomePublicoAtleta(atleta)}</strong>
              </AtletaPerfilLink>
              <span>{obterNumeroSeguro(atleta.vitorias)}V · {obterNumeroSeguro(atleta.derrotas)}D · {obterNumeroSeguro(atleta.aproveitamento)}%</span>
            </div>
            <em>{obterNumeroSeguro(atleta.sequenciaAtual) > 0 ? `${obterNumeroSeguro(atleta.sequenciaAtual)}W` : `${obterNumeroSeguro(atleta.pontos)} pts`}</em>
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
      <PublicHero />
      <PublicHowItWorks />

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
              <AtletaPerfilLink atleta={atleta} ariaLabel={`Abrir perfil de ${obterNomePublicoAtleta(atleta)}`}>
                <AvatarUsuario
                  nome={obterNomePublicoAtleta(atleta)}
                  fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
                  tamanho="sm"
                  className="public-avatar"
                />
              </AtletaPerfilLink>
              <AtletaPerfilLink atleta={atleta} className="atleta-nome-link">
                <strong>{obterNomePublicoAtleta(atleta)}</strong>
              </AtletaPerfilLink>
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
          <Link to="/login" state={estadoCriarConta} className="botao-primario">
            Criar conta grátis
          </Link>
          <Link to="/login" className="botao-secundario">
            Entrar
          </Link>
        </div>
      </section>
    </section>
  );
}
