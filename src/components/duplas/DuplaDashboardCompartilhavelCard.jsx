import { forwardRef } from 'react';
import { CompartilhamentoCardBase } from '../compartilhamento/CompartilhamentoCardBase';
import { formatarNomeDupla, obterNomeExibicaoAtleta } from '../../utils/atletaUtils';

function formatarPercentual(valor) {
  return `${Number(valor || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

function formatarSaldo(valor) {
  const numero = Number(valor || 0);
  return numero > 0 ? `+${numero}` : String(numero);
}

function nomeAtleta(atleta) {
  return obterNomeExibicaoAtleta(atleta) || 'Atleta';
}

function nomeDupla(dupla) {
  return formatarNomeDupla(dupla) || dupla?.nome || [dupla?.atleta1, dupla?.atleta2].map(nomeAtleta).filter(Boolean).join(' • ') || 'Dupla QuebraNunca';
}

function MetricaArte({ rotulo, valor }) {
  return (
    <div className="arte-atleta-metrica">
      <span>{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

export const DuplaDashboardCompartilhavelCard = forwardRef(function DuplaDashboardCompartilhavelCard(
  { dashboard },
  ref
) {
  const dupla = dashboard?.dupla || {};
  const resumo = dashboard?.resumo || {};
  const nome = nomeDupla(dupla);

  return (
    <CompartilhamentoCardBase
      refProp={ref}
      etiqueta="DASHBOARD DA DUPLA"
      destaque={nome}
      subtitulo={dupla.categoriaPrincipal || 'Geral'}
      rodapeTitulo="Nossa dupla em números."
      className="arte-compartilhamento-atleta-card arte-compartilhamento-dupla-card"
    >
      <section className="arte-atleta-destaque">
        <span>{resumo.totalPartidas || 0} partidas juntas</span>
        <strong>{formatarPercentual(resumo.aproveitamento)} aproveitamento</strong>
      </section>

      <section className="arte-atleta-metricas">
        <MetricaArte rotulo="Partidas" valor={resumo.totalPartidas || 0} />
        <MetricaArte rotulo="Vitórias" valor={resumo.vitorias || 0} />
        <MetricaArte rotulo="Derrotas" valor={resumo.derrotas || 0} />
        <MetricaArte rotulo="Pontos pró" valor={resumo.pontosPro || 0} />
        <MetricaArte rotulo="Saldo" valor={formatarSaldo(resumo.saldoPontos)} />
        <MetricaArte rotulo="Sequência" valor={resumo.sequenciaAtual || 0} />
      </section>
    </CompartilhamentoCardBase>
  );
});
