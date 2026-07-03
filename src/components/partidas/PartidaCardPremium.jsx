import { FaCalendarAlt, FaChevronRight } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { DuplaLink } from '../duplas/DuplaLink';
import { formatarNomeDupla } from '../../utils/atletaUtils';
import { formatarDataHoraCurta } from '../../utils/formatacao';
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
  className = '',
  contexto,
  status,
  dataPartida,
  resultado,
  statusAprovacao,
  badges,
  avisoPendencias,
  duplaA,
  duplaB,
  acaoPrincipal = null,
  acaoCompartilhar = null,
  detalhesHref,
  onDetalhes,
  detalhesDesabilitado = false
}) {
  const navegar = useNavigate();
  const resultadoTexto = normalizarResultado(resultado);
  const podeAbrirDetalhes = !detalhesDesabilitado && Boolean(detalhesHref || onDetalhes);
  const badgesExibicao = Array.isArray(badges) && badges.length > 0
    ? badges
    : [
      { texto: resultadoTexto, classe: obterClasseResultado(resultadoTexto) },
      { texto: obterNomeStatusAprovacao(statusAprovacao), classe: obterClasseValidacao(statusAprovacao) }
    ];
  const exibirVersus = duplaA?.mostrarPlacar === false && duplaB?.mostrarPlacar === false;

  function abrirDetalhes() {
    if (!podeAbrirDetalhes) {
      return;
    }

    if (detalhesHref) {
      navegar(detalhesHref);
      return;
    }

    if (onDetalhes) {
      onDetalhes();
    }
  }

  function aoTeclarCard(evento) {
    if (!podeAbrirDetalhes) {
      return;
    }

    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      abrirDetalhes();
    }
  }

  const propriedadesCard = {
    role: podeAbrirDetalhes ? 'link' : undefined,
    tabIndex: podeAbrirDetalhes ? 0 : undefined,
    onClick: podeAbrirDetalhes ? abrirDetalhes : undefined,
    onKeyDown: aoTeclarCard
  };

  return (
    <article
      className={`meus-jogos-card-premium ${podeAbrirDetalhes ? 'meus-jogos-card-clicavel' : ''} ${className}`.trim()}
      {...propriedadesCard}
    >
      <div className="meus-jogos-card-topo-premium">
        <div>
          <span>{contexto || 'Partida avulsa'}</span>
          <strong>{obterStatusPartida(status)}</strong>
          <small>
            <FaCalendarAlt aria-hidden="true" />
            {dataPartida ? formatarDataHoraCurta(dataPartida) : 'Data a definir'}
          </small>
        </div>

        <div className="meus-jogos-badges">
          {badgesExibicao.map((badge, indice) => (
            <span key={`${badge.texto}-${indice}`} className={`meus-jogos-badge ${badge.classe || 'neutro'}`}>
              {badge.texto}
            </span>
          ))}
        </div>
      </div>

      <div className="meus-jogos-placar-premium">
        <LinhaPlacar {...duplaA} />
        {exibirVersus && <span className="meus-jogos-versus">vs</span>}
        <LinhaPlacar {...duplaB} />
      </div>

      {avisoPendencias && (
        <p className="meus-jogos-pendencias-aviso">{avisoPendencias}</p>
      )}

      <div className="meus-jogos-card-acoes" onClick={(evento) => evento.stopPropagation()}>
        {acaoPrincipal}
        {acaoCompartilhar}
        {detalhesHref && !detalhesDesabilitado ? (
          <Link to={detalhesHref} className="botao-secundario botao-compacto meus-jogos-detalhes">
            Detalhes
            <FaChevronRight aria-hidden="true" />
          </Link>
        ) : !detalhesDesabilitado ? (
          <button type="button" className="botao-secundario botao-compacto meus-jogos-detalhes" onClick={abrirDetalhes}>
            Detalhes
            <FaChevronRight aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function LinhaPlacar({ label, atletas, placar, mostrarPlacar = true, destaque, vencedora, atleta1Id, atleta2Id }) {
  const nomesAtletas = formatarNomeDupla(atletas, 'A definir');

  return (
    <DuplaLink
      atleta1Id={atleta1Id}
      atleta2Id={atleta2Id}
      className={`meus-jogos-linha-placar ${destaque ? 'minha-dupla' : ''} ${vencedora ? 'vencedora' : ''}`}
      tag="div"
    >
      <div>
        <span>{label}</span>
        <strong className="nome-dupla">{nomesAtletas}</strong>
      </div>
      {mostrarPlacar ? (
        <strong className="meus-jogos-placar-numero">{placar ?? '-'}</strong>
      ) : vencedora ? (
        <span className="meus-jogos-vencedora-chip">Vencedora</span>
      ) : null}
    </DuplaLink>
  );
}

PartidaCardPremium.LinhaPlacar = LinhaPlacar;
