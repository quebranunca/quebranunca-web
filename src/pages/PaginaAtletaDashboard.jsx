import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { FaChartLine, FaGamepad, FaMedal, FaTrophy } from 'react-icons/fa';
import { CompartilharAtletaDashboardBotao } from '../components/atleta/CompartilharAtletaDashboardBotao';
import { PlacarDupla } from '../components/partidas/PlacarDupla';
import { atletasServico } from '../services/atletasServico';
import { rankingServico } from '../services/rankingServico';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHora } from '../utils/formatacao';
import { obterNomeExibicaoAtleta } from '../utils/atletaUtils';

const abas = [
  { valor: 'resumo', rotulo: 'Resumo' },
  { valor: 'jogos', rotulo: 'Jogos' },
  { valor: 'estatisticas', rotulo: 'Estatísticas' }
];

function formatarPontuacao(valor) {
  const numero = Number(valor || 0);
  return Number.isInteger(numero)
    ? String(numero)
    : numero.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

function calcularAproveitamento(atleta) {
  if (!atleta?.jogos) {
    return 0;
  }

  return Math.round((Number(atleta.vitorias || 0) / Number(atleta.jogos)) * 100);
}

function obterStatusVisual(atleta) {
  if (atleta?.possuiUsuarioVinculado && !atleta?.cadastroPendente) {
    return { texto: 'Ativo', classe: 'ativo' };
  }

  if (atleta?.temEmail) {
    return { texto: 'Pendente', classe: 'pendente' };
  }

  return { texto: 'Sem conta', classe: 'sem-conta' };
}

function obterIniciais(atleta) {
  const nome = obterNomeExibicaoAtleta(atleta);
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase() || 'Q';
}

function extrairDetalhePartida(partida) {
  const confronto = String(partida.confronto || '').replace(/^Pontuação por colocação:\s*/i, '').trim();
  const match = confronto.match(/^(.*?)\s+(\d+)\s+x\s+(\d+)\s+(.*)$/);

  if (!match) {
    return {
      confronto,
      duplaA: [],
      duplaB: [],
      placarA: null,
      placarB: null
    };
  }

  return {
    confronto,
    duplaA: match[1].split('/').map((nome) => nome.trim()).filter(Boolean),
    duplaB: match[4].split('/').map((nome) => nome.trim()).filter(Boolean),
    placarA: Number(match[2]),
    placarB: Number(match[3])
  };
}

function obterSequencia(partidas) {
  const ultimas = [...(partidas || [])]
    .sort((a, b) => new Date(b.dataPartida) - new Date(a.dataPartida))
    .slice(0, 5);

  if (ultimas.length === 0) {
    return '-';
  }

  return ultimas
    .map((partida) => String(partida.resultado || '').toLowerCase().includes('vitória') ? 'V' : 'D')
    .join(' ');
}

function encontrarAtletaNoRanking(ranking, atletaId) {
  for (const grupo of ranking || []) {
    const atleta = (grupo.atletas || []).find((item) => item.atletaId === atletaId);
    if (atleta) {
      return { atleta, grupo };
    }
  }

  return { atleta: null, grupo: null };
}

export function PaginaAtletaDashboard() {
  const { atletaId } = useParams();
  const location = useLocation();
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [atletaRanking, setAtletaRanking] = useState(location.state?.atletaRanking || null);
  const [grupoRanking, setGrupoRanking] = useState(location.state?.grupoRanking || null);
  const [atletaDetalhe, setAtletaDetalhe] = useState(null);
  const [carregando, setCarregando] = useState(!location.state?.atletaRanking);
  const [erro, setErro] = useState('');

  const atleta = atletaRanking || atletaDetalhe;
  const status = obterStatusVisual(atletaRanking || atletaDetalhe);
  const aproveitamento = calcularAproveitamento(atletaRanking);
  const partidas = useMemo(
    () => [...(atletaRanking?.partidas || [])].sort((a, b) => new Date(b.dataPartida) - new Date(a.dataPartida)),
    [atletaRanking]
  );
  const sequencia = obterSequencia(partidas);
  const mediaPontos = partidas.length > 0
    ? formatarPontuacao(partidas.reduce((total, partida) => total + Number(partida.pontos || 0), 0) / partidas.length)
    : '0';

  useEffect(() => {
    carregarAtleta();
  }, [atletaId]);

  async function carregarAtleta() {
    setCarregando(true);
    setErro('');

    try {
      const [dadosAtleta, rankingGeral] = await Promise.all([
        atletasServico.obterPorId(atletaId),
        atletaRanking ? Promise.resolve([]) : rankingServico.listarAtletasGeral()
      ]);

      setAtletaDetalhe(dadosAtleta);
      if (!atletaRanking) {
        const encontrado = encontrarAtletaNoRanking(rankingGeral, atletaId);
        setAtletaRanking(encontrado.atleta);
        setGrupoRanking(encontrado.grupo);
      }
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return <section className="pagina atleta-dashboard"><div className="ranking-estado">Carregando atleta...</div></section>;
  }

  if (erro) {
    return <section className="pagina atleta-dashboard"><p className="texto-erro">{erro}</p></section>;
  }

  if (!atleta) {
    return <section className="pagina atleta-dashboard"><div className="ranking-estado">Atleta não encontrado.</div></section>;
  }

  return (
    <section className="pagina atleta-dashboard">
      <header className="atleta-dashboard-hero">
        <div className="atleta-dashboard-avatar">{obterIniciais(atleta)}</div>
        <div className="atleta-dashboard-identidade">
          <span>Atleta</span>
          <h2>{obterNomeExibicaoAtleta(atleta)}</h2>
          <p>{grupoRanking?.nomeCompeticao || 'Ranking geral'} {atletaRanking?.posicao ? `• #${atletaRanking.posicao}` : ''}</p>
          <div className="atleta-dashboard-identidade-acoes">
            <span className={`ranking-status-dot ${status.classe}`}>{status.texto}</span>
            <CompartilharAtletaDashboardBotao
              atleta={atleta}
              atletaRanking={atletaRanking}
              grupoRanking={grupoRanking}
              sequencia={sequencia}
            />
          </div>
        </div>
        <div className="atleta-dashboard-pontos">
          <strong>{formatarPontuacao(atletaRanking?.pontos)}</strong>
          <span>pontos</span>
        </div>
      </header>

      <section className="atleta-dashboard-resumo">
        <DashboardMetrica icone={<FaGamepad />} rotulo="Jogos" valor={atletaRanking?.jogos || 0} />
        <DashboardMetrica icone={<FaTrophy />} rotulo="Vitórias" valor={atletaRanking?.vitorias || 0} />
        <DashboardMetrica icone={<FaChartLine />} rotulo="Aproveitamento" valor={`${aproveitamento}%`} />
        <DashboardMetrica icone={<FaMedal />} rotulo="Sequência" valor={sequencia} />
      </section>

      <nav className="ranking-tabs atleta-dashboard-tabs" aria-label="Dashboard do atleta">
        {abas.map((aba) => (
          <button
            key={aba.valor}
            type="button"
            className={abaAtiva === aba.valor ? 'ativo' : ''}
            onClick={() => setAbaAtiva(aba.valor)}
          >
            {aba.rotulo}
          </button>
        ))}
      </nav>

      {abaAtiva === 'resumo' && (
        <section className="atleta-dashboard-bloco">
          <h3>Resumo competitivo</h3>
          <div className="atleta-dashboard-stats-grid">
            <span><strong>{formatarPontuacao(atletaRanking?.pontosPendentes)}</strong> pontos pendentes</span>
            <span><strong>{mediaPontos}</strong> média de pontos</span>
            <span><strong>{atletaRanking?.derrotas || 0}</strong> derrotas</span>
            <span><strong>{atletaRanking?.posicao ? `#${atletaRanking.posicao}` : '-'}</strong> ranking atual</span>
          </div>
        </section>
      )}

      {abaAtiva === 'jogos' && (
        <section className="atleta-dashboard-bloco">
          <h3>Jogos</h3>
          {partidas.length === 0 ? (
            <p className="texto-ajuda">Nenhuma partida detalhada no ranking atual.</p>
          ) : (
            <div className="atleta-dashboard-jogos">
              {partidas.map((partida) => (
                <PartidaRankingCard key={partida.partidaId} partida={partida} />
              ))}
            </div>
          )}
        </section>
      )}

      {abaAtiva === 'estatisticas' && (
        <section className="atleta-dashboard-bloco">
          <h3>Estatísticas</h3>
          <div className="atleta-dashboard-stats-grid">
            <span><strong>{atletaRanking?.jogos || 0}</strong> total de jogos</span>
            <span><strong>{atletaRanking?.vitorias || 0}</strong> total de vitórias</span>
            <span><strong>{aproveitamento}%</strong> aproveitamento</span>
            <span><strong>{mediaPontos}</strong> média de pontos</span>
            <span><strong>{atletaRanking?.posicao ? `#${atletaRanking.posicao}` : '-'}</strong> ranking atual</span>
          </div>
        </section>
      )}
    </section>
  );
}

function DashboardMetrica({ icone, rotulo, valor }) {
  return (
    <article>
      <span>{icone}</span>
      <small>{rotulo}</small>
      <strong>{valor}</strong>
    </article>
  );
}

function PartidaRankingCard({ partida }) {
  const detalhe = extrairDetalhePartida(partida);
  const duplaAVenceu = detalhe.placarA !== null && detalhe.placarB !== null && detalhe.placarA > detalhe.placarB;
  const duplaBVenceu = detalhe.placarA !== null && detalhe.placarB !== null && detalhe.placarB > detalhe.placarA;

  return (
    <article className="atleta-dashboard-jogo">
      <div className="atleta-dashboard-jogo-topo">
        <div>
          <strong>{partida.nomeCompeticao}</strong>
          <span>{partida.nomeCategoria}</span>
        </div>
        <span>{formatarDataHora(partida.dataPartida)}</span>
      </div>

      {detalhe.placarA === null || detalhe.placarB === null ? (
        <p>{detalhe.confronto}</p>
      ) : (
        <div className="atleta-dashboard-placar">
          <PlacarDupla
            label="Dupla 1"
            atletas={detalhe.duplaA.length > 0 ? detalhe.duplaA : 'A definir'}
            placar={detalhe.placarA}
            vencedor={duplaAVenceu}
          />
          <PlacarDupla
            label="Dupla 2"
            atletas={detalhe.duplaB.length > 0 ? detalhe.duplaB : 'A definir'}
            placar={detalhe.placarB}
            vencedor={duplaBVenceu}
          />
        </div>
      )}

      <div className="atleta-dashboard-jogo-rodape">
        <span className={String(partida.resultado || '').toLowerCase().includes('vitória') ? 'vitoria' : 'derrota'}>
          {partida.resultado}
        </span>
        <strong>{formatarPontuacao(partida.pontos)} pts</strong>
      </div>
    </article>
  );
}
