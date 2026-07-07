import { Link } from 'react-router-dom';
import {
  FaBolt,
  FaChartLine,
  FaClock,
  FaHistory,
  FaMedal,
  FaPlay,
  FaQuoteLeft,
  FaShieldAlt,
  FaTrophy,
  FaUsers
} from 'react-icons/fa';
import { AtletaPerfilLink } from '../AtletaPerfilLink';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../AvatarUsuario';
import { obterNomeExibicaoAtletaPerfil } from '../../utils/atletaUtils';
import heroFutevolei from '../../assets/home-futevolei-hero.jpg';

const estadoCriarConta = {
  mensagem: 'Use seu e-mail para entrar ou criar sua conta grátis.',
  origem: { pathname: '/app' }
};

const estatisticasFallback = {
  totalPartidas: 12,
  totalAtletas: 12,
  totalGrupos: 5
};

function textoSeguro(valor, fallback = '') {
  if (valor === null || valor === undefined) {
    return fallback;
  }

  const texto = String(valor).trim();
  return texto ? texto : fallback;
}

function numeroSeguro(valor, fallback = 0) {
  if (valor === null || valor === undefined || valor === '') {
    return fallback;
  }

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : fallback;
}

function formatarNumero(valor) {
  return new Intl.NumberFormat('pt-BR').format(numeroSeguro(valor));
}

function obterNumeroResumo(resumo, campo, fallback) {
  const valor = numeroSeguro(resumo?.[campo], 0);
  return valor > 0 ? valor : fallback;
}

function formatarTempo(minutos) {
  const valor = numeroSeguro(minutos, NaN);

  if (!Number.isFinite(valor) || valor < 1) {
    return 'agora';
  }

  if (valor < 60) {
    return `há ${Math.floor(valor)} min`;
  }

  const horas = Math.floor(valor / 60);
  if (horas < 24) {
    return `há ${horas}h`;
  }

  return `há ${Math.floor(horas / 24)}d`;
}

function obterNomePublicoAtleta(atleta) {
  return textoSeguro(obterNomeExibicaoAtletaPerfil(atleta), 'Atleta');
}

function obterNomeGrupoPublico(partida) {
  return textoSeguro(partida?.grupo, textoSeguro(partida?.campeonato, 'Partida avulsa'));
}

function obterTextoPlacar(partida) {
  const pontosDupla1 = partida?.pontosDupla1;
  const pontosDupla2 = partida?.pontosDupla2;

  if (pontosDupla1 === null || pontosDupla1 === undefined || pontosDupla2 === null || pontosDupla2 === undefined) {
    return 'Resultado registrado';
  }

  return `${numeroSeguro(pontosDupla1)} x ${numeroSeguro(pontosDupla2)}`;
}

function PublicHero() {
  return (
    <section
      className="public-hero"
      style={{ '--public-hero-image': `url(${heroFutevolei})` }}
    >
      <div className="public-hero-copy">
        <span className="public-kicker">FUTEVÔLEI EM TEMPO REAL</span>
        <h1>
          Transforme suas partidas em{' '}
          <span>ranking, scouts e história.</span>
        </h1>
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

      <div className="public-hero-live" aria-label="Resumo ilustrativo da plataforma">
        <article className="public-floating-card">
          <span>Última partida</span>
          <strong>18 x 16</strong>
          <small>Resultado registrado</small>
        </article>
        <article className="public-floating-card">
          <span>Ranking do grupo</span>
          <strong>#1 do grupo</strong>
          <small>Atualizado automaticamente</small>
        </article>
        <article className="public-floating-card">
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
        <span>COMO FUNCIONA</span>
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

const destaquesPlataforma = [
  {
    titulo: 'Rankings individuais e de duplas',
    texto: 'Compare seu desempenho com atletas do seu grupo.',
    Icone: FaMedal
  },
  {
    titulo: 'Scouts completos',
    texto: 'Veja aproveitamento, sequência, parceiros e adversários.',
    Icone: FaChartLine
  },
  {
    titulo: 'Histórico de partidas',
    texto: 'Todos os seus jogos registrados em um só lugar.',
    Icone: FaHistory
  },
  {
    titulo: 'Grupos e comunidade',
    texto: 'Conecte-se com atletas e leve seu grupo para o próximo nível.',
    Icone: FaUsers
  }
];

function PublicPlatformHighlights() {
  return (
    <section className="public-section public-feature-section" aria-labelledby="public-features-title">
      <div className="public-section-header">
        <span>PLATAFORMA</span>
        <h2 id="public-features-title">Tudo que o grupo precisa para evoluir</h2>
      </div>

      <div className="public-feature-list">
        {destaquesPlataforma.map(({ titulo, texto, Icone }) => (
          <article key={titulo} className="public-feature-card">
            <span className="public-feature-icon"><Icone /></span>
            <div>
              <strong>{titulo}</strong>
              <p>{texto}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PublicCommunityNumbers({ resumo }) {
  const estatisticas = [
    {
      valor: obterNumeroResumo(resumo, 'totalPartidas', estatisticasFallback.totalPartidas),
      rotulo: 'partidas registradas'
    },
    {
      valor: obterNumeroResumo(resumo, 'totalAtletas', estatisticasFallback.totalAtletas),
      rotulo: 'atletas no ranking'
    },
    {
      valor: obterNumeroResumo(resumo, 'totalGrupos', estatisticasFallback.totalGrupos),
      rotulo: 'grupos ativos'
    }
  ];

  return (
    <section className="public-section public-numbers-section" aria-labelledby="public-numbers-title">
      <div className="public-section-header">
        <span>COMUNIDADE</span>
        <h2 id="public-numbers-title">Movimento que já está acontecendo</h2>
      </div>

      <div className="public-stats-grid" aria-label="Números da comunidade">
        {estatisticas.map((estatistica) => (
          <article key={estatistica.rotulo} className="public-stat-card">
            <strong>{formatarNumero(estatistica.valor)}</strong>
            <span>{estatistica.rotulo}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function PublicLiveMatches({ partidas }) {
  const partidasValidas = Array.isArray(partidas) ? partidas.slice(0, 3) : [];

  return (
    <section className="public-section public-live-section" aria-labelledby="public-live-title">
      <div className="public-section-header">
        <span>AO VIVO</span>
        <h2 id="public-live-title">Últimas partidas registradas</h2>
      </div>

      {partidasValidas.length === 0 ? (
        <article className="public-empty-card">As próximas partidas registradas pela comunidade aparecem aqui.</article>
      ) : (
        <div className="public-live-list">
          {partidasValidas.map((partida, indice) => (
            <article key={partida.id || `partida-${indice}`} className="public-live-card">
              <div className="public-live-card-top">
                <span>{obterNomeGrupoPublico(partida)}</span>
                <strong><FaClock aria-hidden="true" /> {formatarTempo(partida.minutosAtras)}</strong>
              </div>
              <div className="public-live-score">
                <span>{textoSeguro(partida.dupla1, 'Dupla A')}</span>
                <strong>{obterTextoPlacar(partida)}</strong>
                <span>{textoSeguro(partida.dupla2, 'Dupla B')}</span>
              </div>
              <small>{partida.vencedor ? `Vencedor: ${textoSeguro(partida.vencedor, 'informado')}` : 'Resultado confirmado'}</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PublicRanking({ ranking }) {
  const topRanking = Array.isArray(ranking) ? ranking.slice(0, 5) : [];

  return (
    <section className="public-section public-ranking-section" aria-labelledby="public-ranking-title">
      <div className="public-section-header">
        <span>TOP 5</span>
        <h2 id="public-ranking-title">Ranking geral</h2>
      </div>

      {topRanking.length === 0 ? (
        <article className="public-empty-card">O ranking aparece conforme os atletas registram partidas.</article>
      ) : (
        <div className="public-ranking-list">
          {topRanking.map((atleta, indice) => {
            const nomeAtleta = obterNomePublicoAtleta(atleta);
            const pontos = numeroSeguro(atleta.pontos);

            return (
              <article key={atleta.atletaId || `${nomeAtleta}-${indice}`} className="public-ranking-row">
                <strong className="public-ranking-position">#{numeroSeguro(atleta.posicao, indice + 1)}</strong>
                <AtletaPerfilLink atleta={atleta} ariaLabel={`Abrir perfil de ${nomeAtleta}`}>
                  <AvatarUsuario
                    nome={nomeAtleta}
                    fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
                    tamanho="sm"
                    className="public-avatar"
                  />
                </AtletaPerfilLink>
                <div className="public-ranking-athlete">
                  <AtletaPerfilLink atleta={atleta} className="atleta-nome-link">
                    <strong>{nomeAtleta}</strong>
                  </AtletaPerfilLink>
                  <span>{numeroSeguro(atleta.jogos)} jogos registrados</span>
                </div>
                <em>{formatarNumero(pontos)} pts</em>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PublicCommunityInsight({ insights }) {
  const insight = Array.isArray(insights) && insights.length > 0
    ? textoSeguro(insights[0], 'Cada resultado registrado fortalece o histórico do atleta e dá mais clareza para o grupo evoluir junto.')
    : 'Cada resultado registrado fortalece o histórico do atleta e dá mais clareza para o grupo evoluir junto.';

  return (
    <section className="public-insight-section" aria-label="Insight da comunidade">
      <span className="public-insight-icon"><FaQuoteLeft aria-hidden="true" /></span>
      <div>
        <span>COMUNIDADE</span>
        <p>{insight}</p>
      </div>
    </section>
  );
}

function PublicFinalCTA() {
  return (
    <section className="public-community-section">
      <div>
        <span>ENTRE EM QUADRA</span>
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
  );
}

export function PublicHome({ dashboard, carregando, erro }) {
  return (
    <section className="public-home">
      <PublicHero />
      <PublicHowItWorks />
      <PublicPlatformHighlights />

      {erro && <div className="public-alert">Não foi possível carregar dados ao vivo agora. A página segue disponível.</div>}
      {carregando && <div className="public-alert">Carregando movimento da plataforma...</div>}

      <PublicCommunityNumbers resumo={dashboard?.resumo} />
      <PublicLiveMatches partidas={dashboard?.ultimasPartidas} />
      <PublicRanking ranking={dashboard?.ranking} />
      <PublicCommunityInsight insights={dashboard?.insights} />
      <PublicFinalCTA />
    </section>
  );
}
