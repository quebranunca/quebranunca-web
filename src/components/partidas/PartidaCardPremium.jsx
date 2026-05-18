import { FaCalendarAlt, FaChevronRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { DuplaLink } from '../duplas/DuplaLink';
import { formatarDataHora } from '../../utils/formatacao';
import {
  obterNomeStatusAprovacao,
  STATUS_APROVACAO_PARTIDA,
  STATUS_PARTIDA
} from '../../utils/partidas';

function obterClasseResultado(resultado) {
  if (resultado === 'Vitória') {
    return 'vitoria';
  }

  if (resultado === 'Derrota') {
    return 'derrota';
  }

  return 'pendente';
}

function obterClasseValidacao(statusAprovacao) {
  switch (Number(statusAprovacao)) {
    case STATUS_APROVACAO_PARTIDA.aprovada:
      return 'validado';
    case STATUS_APROVACAO_PARTIDA.contestada:
      return 'derrota';
    default:
      return 'pendente';
  }
}

function normalizarResultado(resultado) {
  if (resultado === 'W') {
    return 'Vitória';
  }

  if (resultado === 'L') {
    return 'Derrota';
  }

  return resultado || 'Pendente';
}

function obterStatusPartida(status) {
  if (typeof status === 'string' && status.trim()) {
    return status;
  }

  return Number(status) === STATUS_PARTIDA.encerrada ? 'Encerrada' : 'Pendente';
}

export function PartidaCardPremium({
  contexto,
  status,
  dataPartida,
  resultado,
  statusAprovacao,
  duplaA,
  duplaB,
  acaoCompartilhar = null,
  detalhesHref,
  onDetalhes
}) {
  const resultadoTexto = normalizarResultado(resultado);

  return (
    <article className="meus-jogos-card-premium">
      <div className="meus-jogos-card-topo-premium">
        <div>
          <span>{contexto || 'Geral'}</span>
          <strong>{obterStatusPartida(status)}</strong>
          <small>
            <FaCalendarAlt aria-hidden="true" />
            {dataPartida ? formatarDataHora(dataPartida) : 'Data a definir'}
          </small>
        </div>

        <div className="meus-jogos-badges">
          <span className={`meus-jogos-badge ${obterClasseResultado(resultadoTexto)}`}>
            {resultadoTexto}
          </span>
          <span className={`meus-jogos-badge ${obterClasseValidacao(statusAprovacao)}`}>
            {obterNomeStatusAprovacao(statusAprovacao)}
          </span>
        </div>
      </div>

      <div className="meus-jogos-placar-premium">
        <LinhaPlacar {...duplaA} />
        <LinhaPlacar {...duplaB} />
      </div>

      <div className="meus-jogos-card-acoes">
        {acaoCompartilhar}
        {detalhesHref ? (
          <Link to={detalhesHref} className="botao-secundario botao-compacto meus-jogos-detalhes">
            Detalhes
            <FaChevronRight aria-hidden="true" />
          </Link>
        ) : (
          <button type="button" className="botao-secundario botao-compacto meus-jogos-detalhes" onClick={onDetalhes}>
            Detalhes
            <FaChevronRight aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
}

function LinhaPlacar({ label, atletas, placar, destaque, vencedora, atleta1Id, atleta2Id }) {
  return (
    <DuplaLink
      atleta1Id={atleta1Id}
      atleta2Id={atleta2Id}
      className={`meus-jogos-linha-placar ${destaque ? 'minha-dupla' : ''} ${vencedora ? 'vencedora' : ''}`}
      tag="div"
    >
      <div>
        <span>{label}</span>
        <strong>{atletas || 'A definir'}</strong>
      </div>
      <strong className="meus-jogos-placar-numero">{placar ?? '-'}</strong>
    </DuplaLink>
  );
}
