import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
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
import { useNotification } from '../../contexts/NotificationContext';
import { partidasServico } from '../../services/partidasServico';
import { extrairMensagemErro } from '../../utils/erros';
import { podeEditarPartida } from '../../utils/permissoesPartida';
import { NotificacoesBotao } from '../NotificacoesBotao';
import { EditarPartidaRegistradaModal } from '../partidas/EditarPartidaRegistradaModal';
import { PartidaCardPremium } from '../partidas/PartidaCardPremium';

function nomeAtleta(nome, apelido) {
  return apelido || nome || 'Atleta';
}

function obterIniciais(nome) {
  const partes = String(nome || 'QNF').trim().split(/\s+/).filter(Boolean);

  if (!partes.length) {
    return 'QNF';
  }

  return partes.slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
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

export function HomeDashboard({ dashboard, carregando, erro, onAtualizar }) {
  const { usuario } = useAutenticacao();
  const { showNotification } = useNotification();
  const [insightsExpandidos, setInsightsExpandidos] = useState(false);
  const [partidaEmEdicao, setPartidaEmEdicao] = useState(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');

  if (carregando) {
    return <HomeEstado titulo="Carregando seu painel..." />;
  }

  if (erro) {
    return <HomeEstado titulo="Não foi possível carregar sua Home." mensagem={erro} />;
  }

  if (!dashboard) {
    return <HomeEstado titulo="Registre partidas para montar sua Home." />;
  }

  const perfil = dashboard.perfil || {};
  const resumo = dashboard.resumo || {};
  const heatmap = dashboard.heatmap || [];
  const ultimasPartidas = (dashboard.ultimasPartidas || []).slice(0, 3);
  const melhoresParceiros = dashboard.melhoresParceiros || [];
  const rivaisMaisEnfrentados = dashboard.rivaisMaisEnfrentados || [];
  const insights = dashboard.insights || [];
  const insightsVisiveis = insightsExpandidos ? insights : insights.slice(0, 3);
  const nomePrincipal = nomeAtleta(perfil.nome, perfil.apelido);
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
        categoria={perfil.categoriaPrincipal}
        posicaoRanking={perfil.posicaoRanking}
        saudacao={saudacao}
      />

      <header className="home-dashboard-hero">
        <div className="home-dashboard-atleta-card">
          <div className="home-dashboard-avatar">{obterIniciais(nomePrincipal)}</div>

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

        <div className="home-dashboard-momento-badge">
          <FaFire aria-hidden="true" />
          <span>{badgeMomento}</span>
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
          ) : (
            insightsVisiveis.map((insight) => (
              <p key={insight}>
                {obterIconeInsight(insight)}
                <span>{insight}</span>
              </p>
            ))
          )}
        </div>

        {insights.length > 3 && (
          <button
            type="button"
            className="home-dashboard-link-botao"
            onClick={() => setInsightsExpandidos((valor) => !valor)}
          >
            {insightsExpandidos ? 'Ver menos' : 'Ver todos'}
          </button>
        )}
      </section>

      <section className="home-dashboard-bloco">
        <CabecalhoHome
          eyebrow="Últimas partidas"
          titulo="Seu ritmo recente"
          acao={<Link to="/app/meus-jogos">Ver todas</Link>}
        />

        {ultimasPartidas.length === 0 ? (
          <p className="home-dashboard-vazio">Suas últimas partidas aparecerão aqui.</p>
        ) : (
          <div className="meus-jogos-lista-premium">
            {ultimasPartidas.map((partida) => (
              <PartidaHomeCard
                key={partida.id}
                partida={partida}
                onEditar={podeEditarPartida(partida, usuario) ? () => abrirEdicao(partida) : null}
              />
            ))}
          </div>
        )}
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
          descricao={
            totalDiasJogados > 0
              ? `${totalJogosPeriodo} partida(s) em ${totalDiasJogados} dia(s) no período.`
              : 'Registre partidas para acompanhar sua frequência.'
          }
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

function HomeDashboardHeader({ nome, categoria, posicaoRanking, saudacao }) {
  const [compacto, setCompacto] = useState(false);
  const resumoAtleta = [
    categoria,
    posicaoRanking ? `#${posicaoRanking} no ranking` : ''
  ].filter(Boolean).join(' • ');

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
          <span>{resumoAtleta || 'QuebraNunca Futevôlei'}</span>
        </div>
      </div>

      <div className="home-dashboard-topo-acoes">
        <NotificacoesBotao autenticado />
        <div className="home-dashboard-topo-avatar" aria-hidden="true">
          {obterIniciais(nome)}
        </div>
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
function PartidaHomeCard({ partida, onEditar }) {
  const resultado = obterResultadoPartidaHome(partida);

  return (
    <PartidaCardPremium
      contexto={obterContextoPartidaHome(partida)}
      status={partida.status || 'Encerrada'}
      dataPartida={partida.dataPartida}
      resultado={resultado}
      statusAprovacao={partida.statusAprovacao}
      duplaA={{
        label: 'Sua dupla',
        atletas: partida.parceiro ? `Você e ${partida.parceiro}` : 'Sua dupla',
        placar: partida.placarSuaDupla ?? 0,
        destaque: true,
        vencedora: resultado === 'Vitória'
      }}
      duplaB={{
        label: 'Adversários',
        atletas: partida.adversarios || 'Adversários',
        placar: partida.placarAdversarios ?? 0,
        destaque: false,
        vencedora: resultado === 'Derrota'
      }}
      acaoCompartilhar={
        onEditar ? (
          <button
            type="button"
            className="botao-secundario botao-compacto botao-editar-partida-discreto"
            onClick={onEditar}
            aria-label="Editar partida"
            title="Editar partida"
          >
            <FaEdit aria-hidden="true" />
            Editar
          </button>
        ) : null
      }
      detalhesHref="/app/meus-jogos"
    />
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
        ) : (
          itens.slice(0, 6).map((item) => (
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
                <span>
                  {item.partidas} {tipo === 'parceiro' ? 'jogos juntos' : 'jogos enfrentados'}
                </span>
                <small>{item.aproveitamento}% aproveitamento</small>
              </div>
              <FaChevronRight aria-hidden="true" />
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
