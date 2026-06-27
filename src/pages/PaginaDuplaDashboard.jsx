import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaChartLine, FaGamepad, FaMedal, FaTrophy } from 'react-icons/fa';
import { CompartilharDuplaDashboardBotao } from '../components/duplas/CompartilharDuplaDashboardBotao';
import { PlacarDupla } from '../components/partidas/PlacarDupla';
import { AvatarUsuario } from '../components/AvatarUsuario';
import { duplasServico } from '../services/duplasServico';
import { formatarNomeDupla } from '../utils/atletaUtils';
import { extrairMensagemErro } from '../utils/erros';
import { formatarDataHora } from '../utils/formatacao';

function formatarPercentual(valor) {
  return `${Number(valor || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

function formatarSaldo(valor) {
  const numero = Number(valor || 0);
  return numero > 0 ? `+${numero}` : String(numero);
}

function formatarDupla(atletas) {
  return formatarNomeDupla(atletas);
}

export function PaginaDuplaDashboard() {
  const { atleta1Id, atleta2Id } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarDashboard();
  }, [atleta1Id, atleta2Id]);

  async function carregarDashboard() {
    setCarregando(true);
    setErro('');

    try {
      const dados = await duplasServico.obterDashboard(atleta1Id, atleta2Id);
      setDashboard(dados);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  const resumo = dashboard?.resumo;
  const dupla = dashboard?.dupla;
  const nomeDupla = formatarNomeDupla(dupla, dupla?.nome || 'Dupla');
  const semPartidas = !carregando && !erro && dashboard && Number(resumo?.totalPartidas || 0) === 0;
  const maiorMes = useMemo(() => {
    return [...(dashboard?.evolucao || [])].sort((a, b) => Number(b.partidas || 0) - Number(a.partidas || 0))[0];
  }, [dashboard]);

  if (carregando) {
    return <section className="pagina atleta-dashboard dupla-dashboard"><div className="ranking-estado">Carregando dashboard da dupla...</div></section>;
  }

  if (erro) {
    return <section className="pagina atleta-dashboard dupla-dashboard"><p className="texto-erro">{erro}</p></section>;
  }

  if (!dashboard) {
    return <section className="pagina atleta-dashboard dupla-dashboard"><div className="ranking-estado">Dupla não encontrada.</div></section>;
  }

  return (
    <section className="pagina atleta-dashboard dupla-dashboard">
      <header className="atleta-dashboard-hero">
        <AvatarUsuario
          nome={nomeDupla}
          tamanho="lg"
          className="atleta-dashboard-avatar dupla-dashboard-avatar"
          alt=""
        />
        <div className="atleta-dashboard-identidade">
          <span>Dashboard da dupla</span>
          <h2>{nomeDupla}</h2>
          <p>{dupla.categoriaPrincipal || 'Geral'} · {resumo.totalPartidas} partidas juntas</p>
          <div className="atleta-dashboard-identidade-acoes">
            <CompartilharDuplaDashboardBotao dashboard={dashboard} />
          </div>
        </div>
        <div className="atleta-dashboard-pontos">
          <strong>{formatarPercentual(resumo.aproveitamento)}</strong>
          <span>aproveitamento</span>
        </div>
      </header>

      <section className="atleta-dashboard-resumo dupla-dashboard-resumo">
        <DashboardMetrica icone={<FaGamepad />} rotulo="Partidas juntos" valor={resumo.totalPartidas} />
        <DashboardMetrica icone={<FaTrophy />} rotulo="Vitórias" valor={resumo.vitorias} />
        <DashboardMetrica icone={<FaChartLine />} rotulo="Aproveitamento" valor={formatarPercentual(resumo.aproveitamento)} />
        <DashboardMetrica icone={<FaMedal />} rotulo="Sequência atual" valor={resumo.sequenciaAtual} />
        <DashboardMetrica icone={<FaGamepad />} rotulo="Derrotas" valor={resumo.derrotas} />
        <DashboardMetrica icone={<FaChartLine />} rotulo="Saldo de pontos" valor={formatarSaldo(resumo.saldoPontos)} />
      </section>

      {semPartidas && (
        <section className="atleta-dashboard-bloco">
          <h3>Sem partidas juntos</h3>
          <p className="texto-ajuda">Essa dupla ainda não possui partidas válidas para consolidar estatísticas.</p>
        </section>
      )}

      <section className="dupla-dashboard-grid">
        <article className="atleta-dashboard-bloco">
          <h3>Últimas partidas</h3>
          {dashboard.ultimasPartidas.length === 0 ? (
            <p className="texto-ajuda">Nenhuma partida recente para exibir.</p>
          ) : (
            <div className="atleta-dashboard-jogos">
              {dashboard.ultimasPartidas.map((partida) => (
                <PartidaDuplaCard key={partida.id} partida={partida} dupla={dupla} />
              ))}
            </div>
          )}
        </article>

        <article className="atleta-dashboard-bloco">
          <h3>Rivais mais enfrentados</h3>
          {dashboard.melhoresAdversarios.length === 0 ? (
            <p className="texto-ajuda">Ainda não há adversários recorrentes.</p>
          ) : (
            <div className="dupla-dashboard-lista">
              {dashboard.melhoresAdversarios.map((adversario) => (
                <div key={adversario.atletas.map((atleta) => atleta.atletaId).join('-')} className="dupla-dashboard-rival">
                  <strong className="nome-dupla">{formatarDupla(adversario.atletas)}</strong>
                  <span>{adversario.partidas} jogos · {adversario.vitorias}V/{adversario.derrotas}D · {formatarPercentual(adversario.aproveitamento)}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="dupla-dashboard-grid">
        <article className="atleta-dashboard-bloco">
          <h3>Evolução da dupla</h3>
          <div className="dupla-dashboard-evolucao" aria-label="Evolução mensal">
            {dashboard.evolucao.map((item) => {
              const altura = maiorMes?.partidas ? Math.max(12, Math.round((item.partidas / maiorMes.partidas) * 100)) : 12;
              return (
                <div key={`${item.ano}-${item.numeroMes}`}>
                  <span>{item.partidas}</span>
                  <div style={{ height: `${altura}%` }} />
                  <small>{item.mes}</small>
                  <strong>{formatarPercentual(item.aproveitamento)}</strong>
                </div>
              );
            })}
          </div>
        </article>

        <article className="atleta-dashboard-bloco">
          <h3>Insights</h3>
          <div className="dupla-dashboard-insights">
            {dashboard.insights.map((insight) => (
              <p key={insight}>{insight}</p>
            ))}
          </div>
        </article>
      </section>
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

function PartidaDuplaCard({ partida, dupla }) {
  const venceu = partida.resultado === 'Vitória';
  const contexto = partida.competicao || partida.grupo || partida.categoria || 'Partida';

  return (
    <article className="atleta-dashboard-jogo">
      <div className="atleta-dashboard-jogo-topo">
        <div>
          <strong>{contexto}</strong>
          <span>{partida.categoria || partida.grupo || 'Geral'}</span>
        </div>
        <span>{partida.dataPartida ? formatarDataHora(partida.dataPartida) : 'Data a definir'}</span>
      </div>

      <div className="atleta-dashboard-placar">
        <PlacarDupla
          label="Dupla"
          atletas={formatarNomeDupla(dupla, dupla?.nome || 'Dupla')}
          placar={partida.placarDupla}
          vencedor={venceu}
          atleta1Id={dupla?.atleta1?.atletaId}
          atleta2Id={dupla?.atleta2?.atletaId}
        />
        <PlacarDupla
          label="Adversários"
          atletas={formatarDupla(partida.adversarios) || 'A definir'}
          placar={partida.placarAdversarios}
          vencedor={!venceu}
          atleta1Id={partida.adversarios?.[0]?.atletaId}
          atleta2Id={partida.adversarios?.[1]?.atletaId}
        />
      </div>

      <div className="atleta-dashboard-jogo-rodape">
        <span className={venceu ? 'vitoria' : 'derrota'}>{partida.resultado}</span>
        <strong>{partida.placarDupla} x {partida.placarAdversarios}</strong>
      </div>
    </article>
  );
}
