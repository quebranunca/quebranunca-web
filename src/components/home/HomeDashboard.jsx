import { Link } from 'react-router-dom';
import { FaBolt, FaChartLine, FaFire, FaMedal, FaShieldAlt, FaTrophy, FaUserFriends } from 'react-icons/fa';
import { PlacarDupla } from '../partidas/PlacarDupla';
import { RegistrarPartidaNovo } from '../partidas/RegistrarPartidaNovo';

function nomeAtleta(nome, apelido) {
  return apelido || nome || 'Atleta';
}

function formatarData(valor) {
  if (!valor) {
    return '';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(valor));
}

function obterIcone(id) {
  switch (id) {
    case 'vitorias':
      return <FaTrophy aria-hidden="true" />;
    case 'aproveitamento':
      return <FaChartLine aria-hidden="true" />;
    case 'sequencia':
      return <FaFire aria-hidden="true" />;
    case 'parceiro':
      return <FaUserFriends aria-hidden="true" />;
    case 'rival':
      return <FaShieldAlt aria-hidden="true" />;
    default:
      return <FaMedal aria-hidden="true" />;
  }
}

function obterNivelHeatmap(quantidade) {
  if (!quantidade) return 0;
  if (quantidade === 1) return 1;
  if (quantidade === 2) return 2;
  return 3;
}

export function HomeDashboard({ dashboard, carregando, erro }) {
  if (carregando) {
    return (
      <section className="pagina home-dashboard">
        <div className="cartao home-dashboard-estado">Carregando dashboard...</div>
      </section>
    );
  }

  if (erro) {
    return (
      <section className="pagina home-dashboard">
        <div className="cartao home-dashboard-estado">
          <strong>Não foi possível carregar seu dashboard.</strong>
          <p>{erro}</p>
        </div>
      </section>
    );
  }

  if (!dashboard) {
    return (
      <section className="pagina home-dashboard">
        <div className="cartao home-dashboard-estado">Registre partidas para montar seu dashboard.</div>
      </section>
    );
  }

  const perfil = dashboard.perfil;
  const resumo = dashboard.resumo;

  return (
    <section className="pagina home-dashboard">
      <header className="home-dashboard-hero">
        <div className="home-dashboard-atleta">
          <div className="home-dashboard-avatar">
            {nomeAtleta(perfil.nome, perfil.apelido).charAt(0).toUpperCase()}
          </div>
          <div>
            <span>Atleta</span>
            <h2>{nomeAtleta(perfil.nome, perfil.apelido)}</h2>
            <p>{perfil.categoriaPrincipal} {perfil.posicaoRanking ? `| #${perfil.posicaoRanking} no ranking` : ''}</p>
          </div>
        </div>

        <div className="home-dashboard-hero-metricas">
          <div>
            <span>Aproveitamento</span>
            <strong>{perfil.aproveitamento}%</strong>
          </div>
          <div className="home-dashboard-sequencia">
            <FaFire aria-hidden="true" />
            <strong>{perfil.textoSequencia}</strong>
          </div>
        </div>

        <RegistrarPartidaNovo />
      </header>

      <section className="home-dashboard-stats" aria-label="Estatísticas principais">
        {dashboard.metricas.map((metrica) => (
          <article key={metrica.id} className={`home-dashboard-stat ${metrica.destaque ? 'destaque' : ''}`}>
            <span className="home-dashboard-stat-icone">{obterIcone(metrica.id)}</span>
            <span>{metrica.rotulo}</span>
            <strong>{metrica.valor}</strong>
            {metrica.complemento && <small>{metrica.complemento}</small>}
          </article>
        ))}
      </section>

      <section className="home-dashboard-bloco">
        <div className="home-dashboard-bloco-cabecalho">
          <div>
            <span>Evolução</span>
            <h3>Últimos meses</h3>
          </div>
        </div>
        <div className="home-dashboard-evolucao">
          {dashboard.evolucao.map((item) => (
            <div key={`${item.ano}-${item.numeroMes}`} className="home-dashboard-evolucao-item">
              <div className="home-dashboard-barra">
                <span style={{ height: `${Math.max(8, Math.min(100, item.aproveitamento || item.partidas * 14))}%` }} />
              </div>
              <strong>{item.aproveitamento}%</strong>
              <small>{item.mes}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="home-dashboard-bloco">
        <div className="home-dashboard-bloco-cabecalho">
          <div>
            <span>Últimas partidas</span>
            <h3>Seu ritmo recente</h3>
          </div>
          <Link to="/app/meus-jogos">Ver jogos</Link>
        </div>
        <div className="home-dashboard-partidas">
          {dashboard.ultimasPartidas.length === 0 ? (
            <p className="texto-ajuda">Nenhuma partida registrada no seu histórico.</p>
          ) : dashboard.ultimasPartidas.map((partida) => (
            <article key={partida.id} className="home-dashboard-partida">
              <div className={`home-dashboard-resultado ${partida.resultado === 'W' ? 'vitoria' : 'derrota'}`}>
                {partida.resultado}
              </div>
              <div className="home-dashboard-partida-conteudo">
                <div className="home-dashboard-partida-topo">
                  <strong>{partida.parceiro}</strong>
                  <span>{formatarData(partida.dataPartida)}</span>
                </div>
                <PlacarDupla
                  label="Sua dupla"
                  atletas={`Você e ${partida.parceiro}`}
                  placar={partida.placarSuaDupla}
                  vencedor={partida.resultado === 'W'}
                />
                <PlacarDupla
                  label="Adversários"
                  atletas={partida.adversarios}
                  placar={partida.placarAdversarios}
                  vencedor={partida.resultado !== 'W'}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-dashboard-duas-colunas">
        <DashboardRelacoes titulo="Melhores parceiros" itens={dashboard.melhoresParceiros} />
        <DashboardRelacoes titulo="Rivais mais enfrentados" itens={dashboard.rivaisMaisEnfrentados} />
      </section>

      <section className="home-dashboard-bloco">
        <div className="home-dashboard-bloco-cabecalho">
          <div>
            <span>Frequência</span>
            <h3>Dias jogados</h3>
          </div>
        </div>
        <div className="home-dashboard-heatmap">
          {dashboard.heatmap.map((dia) => (
            <span
              key={dia.data}
              className={`nivel-${obterNivelHeatmap(dia.quantidade)}`}
              title={`${dia.data}: ${dia.quantidade} jogo(s)`}
            />
          ))}
        </div>
      </section>

      <section className="home-dashboard-bloco">
        <div className="home-dashboard-bloco-cabecalho">
          <div>
            <span>Insights</span>
            <h3>Leitura rápida</h3>
          </div>
        </div>
        <div className="home-dashboard-insights">
          {dashboard.insights.map((insight) => (
            <p key={insight}><FaBolt aria-hidden="true" /> {insight}</p>
          ))}
        </div>
      </section>
    </section>
  );
}

function DashboardRelacoes({ titulo, itens }) {
  return (
    <section className="home-dashboard-bloco">
      <div className="home-dashboard-bloco-cabecalho">
        <div>
          <span>Conexões</span>
          <h3>{titulo}</h3>
        </div>
      </div>
      <div className="home-dashboard-relacoes">
        {itens.length === 0 ? (
          <p className="texto-ajuda">Sem dados suficientes.</p>
        ) : itens.map((item) => (
          <article key={item.atletaId} className="home-dashboard-relacao">
            <strong>{nomeAtleta(item.nome, item.apelido)}</strong>
            <span>{item.partidas} jogos</span>
            <small>{item.aproveitamento}% aproveitamento</small>
          </article>
        ))}
      </div>
    </section>
  );
}
