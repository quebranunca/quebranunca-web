import { forwardRef } from 'react';
import { CompartilhamentoCardBase } from '../compartilhamento/CompartilhamentoCardBase';
import { obterNomeExibicaoAtleta } from '../../utils/atletaUtils';

function formatarPontos(valor) {
  const numero = Number(valor || 0);
  return Number.isInteger(numero)
    ? String(numero)
    : numero.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

function calcularAproveitamento(atletaRanking) {
  if (!atletaRanking?.jogos) {
    return 0;
  }

  return Math.round((Number(atletaRanking.vitorias || 0) / Number(atletaRanking.jogos)) * 100);
}

function MetricaArte({ rotulo, valor }) {
  return (
    <div className="arte-atleta-metrica">
      <span>{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

export const AtletaDashboardCompartilhavelCard = forwardRef(function AtletaDashboardCompartilhavelCard(
  { atleta, atletaRanking, grupoRanking, sequencia },
  ref
) {
  const nome = obterNomeExibicaoAtleta(atleta) || 'Atleta QuebraNunca';
  const aproveitamento = calcularAproveitamento(atletaRanking);

  return (
    <CompartilhamentoCardBase
      refProp={ref}
      etiqueta="DASHBOARD DO ATLETA"
      destaque={nome}
      subtitulo={grupoRanking?.nomeCompeticao || 'Ranking geral'}
      rodapeTitulo="Meu jogo em números."
      className="arte-compartilhamento-atleta-card"
    >
      <section className="arte-atleta-destaque">
        <span>{atletaRanking?.posicao ? `#${atletaRanking.posicao} no ranking` : 'Atleta QuebraNunca'}</span>
        <strong>{formatarPontos(atletaRanking?.pontos)} pts</strong>
      </section>

      <section className="arte-atleta-metricas">
        <MetricaArte rotulo="Jogos" valor={atletaRanking?.jogos || 0} />
        <MetricaArte rotulo="Vitórias" valor={atletaRanking?.vitorias || 0} />
        <MetricaArte rotulo="Derrotas" valor={atletaRanking?.derrotas || 0} />
        <MetricaArte rotulo="Aproveitamento" valor={`${aproveitamento}%`} />
        <MetricaArte rotulo="Sequência" valor={sequencia || '-'} />
        <MetricaArte rotulo="Pendentes" valor={formatarPontos(atletaRanking?.pontosPendentes)} />
      </section>
    </CompartilhamentoCardBase>
  );
});
