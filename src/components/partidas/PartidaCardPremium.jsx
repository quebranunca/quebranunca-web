import { FaChevronRight, FaExclamationCircle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { DuplaLink } from '../duplas/DuplaLink';
import { formatarNomeDupla } from '../../utils/atletaUtils';
import { formatarDataHoraCurta } from '../../utils/formatacao';
import {
  obterNomeStatusAprovacao,
  STATUS_APROVACAO_PARTIDA
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

export function PartidaCardPremium({
  className = '',
  contexto,
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
      className={`minhas-partidas-card-premium ${podeAbrirDetalhes ? 'minhas-partidas-card-clicavel' : ''} ${className}`.trim()}
      {...propriedadesCard}
    >
      <div className="minhas-partidas-card-topo-premium">
        <div>
          <strong>{contexto || 'Partida avulsa'}</strong>
          <small>
            {dataPartida ? formatarDataHoraCurta(dataPartida) : 'Data a definir'}
          </small>
        </div>

        <div className="minhas-partidas-badges">
          {badgesExibicao.map((badge, indice) => (
            <span key={`${badge.texto}-${indice}`} className={`minhas-partidas-badge ${badge.classe || 'neutro'}`}>
              {badge.texto}
            </span>
          ))}
        </div>
      </div>

      <div className="minhas-partidas-placar-premium">
        <LinhaPlacar {...duplaA} />
        {exibirVersus && <span className="minhas-partidas-versus">vs</span>}
        <LinhaPlacar {...duplaB} />
      </div>

      {avisoPendencias && (
        <p className="minhas-partidas-pendencias-aviso">
          <FaExclamationCircle aria-hidden="true" />
          <span>{avisoPendencias}</span>
        </p>
      )}

      <div className="minhas-partidas-card-acoes" onClick={(evento) => evento.stopPropagation()}>
        {acaoPrincipal}
        {acaoCompartilhar}
        {detalhesHref && !detalhesDesabilitado ? (
          <Link to={detalhesHref} className="botao-secundario botao-compacto minhas-partidas-detalhes" aria-label="Abrir detalhes da partida" title="Abrir detalhes">
            <FaChevronRight aria-hidden="true" />
          </Link>
        ) : !detalhesDesabilitado ? (
          <button type="button" className="botao-secundario botao-compacto minhas-partidas-detalhes" onClick={abrirDetalhes} aria-label="Abrir detalhes da partida" title="Abrir detalhes">
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
      className={`minhas-partidas-linha-placar ${destaque ? 'minha-dupla' : ''} ${vencedora ? 'vencedora' : ''}`}
      tag="div"
    >
      <div>
        {label && <span>{label}</span>}
        <strong className="nome-dupla">{nomesAtletas}</strong>
      </div>
      {mostrarPlacar ? (
        <strong className="minhas-partidas-placar-numero">{placar ?? '-'}</strong>
      ) : vencedora ? (
        <span className="minhas-partidas-vencedora-chip">Vencedora</span>
      ) : null}
    </DuplaLink>
  );
}

PartidaCardPremium.LinhaPlacar = LinhaPlacar;
