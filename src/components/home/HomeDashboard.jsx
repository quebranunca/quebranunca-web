import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBolt,
  FaChartLine,
  FaChevronRight,
  FaFire,
  FaGamepad,
  FaMedal,
  FaPlus,
  FaShieldAlt,
  FaTrophy,
  FaUserFriends
} from 'react-icons/fa';
import { PlacarDupla } from '../partidas/PlacarDupla';

function nomeAtleta(nome, apelido) {
  return apelido || nome || 'Atleta';
}

function obterIniciais(nome) {
  const partes = String(nome || 'QNF')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!partes.length) {
    return 'QNF';
  }

  return partes
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
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

export function HomeDashboard({ dashboard, carregando, erro }) {
  const [insightsExpandidos, setInsightsExpandidos] = useState(false);

  if (carregando) {
    return <HomeEstado titulo="Carregando seu painel..." />;
  }

  if (erro) {
    return <HomeEstado titulo="Não foi possível carregar sua Home." mensagem={erro} />;
  }

  if (!dashboard) {
    return <HomeEstado titulo="Registre partidas para montar sua Home." />;
  }

  const perfil = dashboard.perfil;
  const resumo = dashboard.resumo || {};
  const heatmap = dashboard.heatmap || [];
  const ultimasPartidas = (dashboard.ultimasPartidas || []).slice(0, 3);
  const melhoresParceiros = dashboard.melhoresParceiros || [];
  const rivaisMaisEnfrentados = dashboard.rivaisMaisEnfrentados || [];
  const insights = dashboard.insights || [];
  const insightsVisiveis = insightsExpandidos ? insights : insights.slice(0, 3);
  const nomePrincipal = nomeAtleta(perfil.nome, perfil.apelido);

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

    return {
      ...diaSemana,
      total
    };
  });

  const maiorTotalDiaSemana = Math.max(
    ...frequenciaPorDiaSemana.map((dia) => dia.total),
    1
  );

  const totalDiasJogados = heatmap.filter((dia) => dia.quantidade > 0).length;
  const totalJogosPeriodo = heatmap.reduce((total, dia) => total + dia.quantidade, 0);

  const resumoRapido = [
    {
      id: 'partidas',
      rotulo: 'Partidas',
      valor: resumo.totalPartidas ?? 0,
      complemento: 'registradas',
      icone: FaGamepad
    },
    {
      id: 'vitorias',
      rotulo: 'Vitórias',
      valor: resumo.vitorias ?? 0,
      complemento: `${resumo.derrotas ?? 0} derrotas`,
      icone: FaTrophy
    },
    {
      id: 'aproveitamento',
      rotulo: 'Aproveitamento',
      valor: `${resumo.aproveitamento ?? perfil.aproveitamento ?? 0}%`,
      complemento: 'no histórico',
      icone: FaChartLine
    },
    {
      id: 'sequencia',
      rotulo: 'Sequência',
      valor: resumo.sequenciaAtual ?? 0,
      complemento: perfil.textoSequencia || 'ritmo atual',
      icone: FaFire
    }
  ];

  return (
    <section className="pagina home-dashboard">
      <header className="home-dashboard-hero">
        <div className="home-dashboard-atleta-card">
          <div className="home-dashboard-avatar">
            {obterIniciais(nomePrincipal)}
          </div>

          <div className="home-dashboard-atleta-info">
            <span>Seu momento</span>
            <h1>{nomePrincipal}</h1>
            <p>
              {perfil.categoriaPrincipal}
              {perfil.posicaoRanking ? ` • #${perfil.posicaoRanking} no ranking` : ''}
            </p>
          </div>

          <span className="home-dashboard-status">
            <span aria-hidden="true" />
            Ativo
          </span>
        </div>

        <div className="home-dashboard-hero-acoes">
          <Link to="/ranking" className="home-dashboard-ranking-link">
            <FaMedal aria-hidden="true" />
            Ranking
          </Link>
          <Link to="/partidas/registrar" className="botao-primario home-dashboard-registrar">
            <FaPlus aria-hidden="true" />
            Registrar
          </Link>
        </div>
      </header>

      <section className="home-dashboard-resumo" aria-label="Resumo rápido">
        {resumoRapido.map((item) => {
          const Icone = item.icone;
          return (
            <article key={item.id} className="home-dashboard-mini-card">
              <Icone aria-hidden="true" />
              <span>{item.rotulo}</span>
              <strong>{item.valor}</strong>
              <small>{item.complemento}</small>
            </article>
          );
        })}
      </section>

      <section className="home-dashboard-bloco home-dashboard-insights-bloco">
        <CabecalhoHome eyebrow="Insights" titulo="Leitura rápida" />

        <div className="home-dashboard-insights">
          {insightsVisiveis.length === 0 ? (
            <p className="home-dashboard-vazio">Registre mais partidas para gerar insights.</p>
          ) : insightsVisiveis.map((insight) => (
            <p key={insight}>
              {obterIconeInsight(insight)}
              <span>{insight}</span>
            </p>
          ))}
        </div>

        {insights.length > 3 && (
          <button
            type="button"
            className="home-dashboard-link-botao"
            onClick={() => setInsightsExpandidos((valor) => !valor)}
          >
            {insightsExpandidos ? 'Ver menos insights' : 'Ver mais insights'}
          </button>
        )}
      </section>

      <section className="home-dashboard-bloco">
        <CabecalhoHome
          eyebrow="Últimas partidas"
          titulo="Seu ritmo recente"
          acao={<Link to="/app/meus-jogos">Ver todas</Link>}
        />

        <div className="home-dashboard-partidas">
          {ultimasPartidas.length === 0 ? (
            <p className="home-dashboard-vazio">Nenhuma partida registrada no seu histórico.</p>
          ) : ultimasPartidas.map((partida) => (
            <article key={partida.id} className="home-dashboard-partida">
              <div className={`home-dashboard-resultado ${partida.resultado === 'W' ? 'vitoria' : 'derrota'}`}>
                <strong>{partida.resultado === 'W' ? 'V' : 'D'}</strong>                
              </div>

              <div className="home-dashboard-partida-conteudo">
                <div className="home-dashboard-partida-topo">
                  <strong>{partida.placarSuaDupla} x {partida.placarAdversarios}</strong>
                  <span>{formatarData(partida.dataPartida)}</span>
                </div>

                <div className="home-dashboard-placar">
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
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-dashboard-bloco">
        <CabecalhoHome eyebrow="Conexões" titulo="Quem joga com você" />

        <div className="home-dashboard-conexoes-grid">
          <DashboardRelacoes
            titulo="Parceiros"
            itens={melhoresParceiros}
            tipo="parceiro"
            icone={FaUserFriends}
            vazio="Sem parceiros suficientes."
          />
          <DashboardRelacoes
            titulo="Rivais"
            itens={rivaisMaisEnfrentados}
            tipo="rival"
            icone={FaShieldAlt}
            vazio="Sem rivais suficientes."
          />
        </div>
      </section>

      <section className="home-dashboard-bloco home-dashboard-frequencia">
        <CabecalhoHome
          eyebrow="Frequência"
          titulo="Ritmo da semana"
          descricao={totalDiasJogados > 0
            ? `${totalJogosPeriodo} partida(s) em ${totalDiasJogados} dia(s) no período.`
            : 'Registre partidas para acompanhar sua frequência.'}
        />

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
      </section>
    </section>
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

function DashboardRelacoes({ titulo, itens, tipo, icone: Icone, vazio }) {
  return (
    <section className="home-dashboard-relacao-grupo">
      <div className="home-dashboard-relacao-grupo-titulo">
        <Icone aria-hidden="true" />
        <h3>{titulo}</h3>
      </div>

      <div className="home-dashboard-relacoes">
        {itens.length === 0 ? (
          <p className="home-dashboard-vazio">{vazio}</p>
        ) : itens.slice(0, 6).map((item) => (
          <Link
            key={item.atletaId}
            to={`/atletas/${item.atletaId}/dashboard`}
            className="home-dashboard-relacao"
          >
            <div className="home-dashboard-relacao-avatar">
              {obterIniciais(nomeAtleta(item.nome, item.apelido))}
            </div>
            <div>
              <strong>{nomeAtleta(item.nome, item.apelido)}</strong>
              <span>{item.partidas} {tipo === 'parceiro' ? 'jogos juntos' : 'jogos enfrentados'}</span>
              <small>{item.aproveitamento}% aproveitamento</small>
            </div>
            <FaChevronRight aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
