import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaChevronRight, FaUserCircle } from 'react-icons/fa';
import { CompartilharPartidaBotao } from './CompartilharPartidaBotao';
import { formatarDataHora } from '../../utils/formatacao';

function nomesDupla(dupla) {
  return [dupla?.atleta1Nome, dupla?.atleta2Nome].filter(Boolean).join(' / ') || 'Dupla a definir';
}

function obterContexto(partida) {
  return [
    partida.grupoNome,
    partida.competicaoNome,
    partida.categoriaNome
  ].filter(Boolean).join(' • ') || 'Geral';
}

function ehVideo(midiaTipo) {
  return String(midiaTipo || '').toLowerCase() === 'video';
}

export function FeedPartidaCard({ partida }) {
  const temMidia = Boolean(partida?.midiaUrl);

  return (
    <article className={`feed-partida-card ${temMidia ? 'com-midia' : 'sem-midia'}`}>
      {temMidia && (
        <div className="feed-partida-midia">
          {ehVideo(partida.midiaTipo) ? (
            <video src={partida.midiaUrl} controls preload="metadata" />
          ) : (
            <img src={partida.midiaUrl} alt="Mídia da partida" loading="lazy" />
          )}
        </div>
      )}

      <div className="feed-partida-corpo">
        <div className="feed-partida-topo">
          <span>{obterContexto(partida)}</span>
          <small>
            <FaCalendarAlt aria-hidden="true" />
            {formatarDataHora(partida.data)}
          </small>
        </div>

        <div className="feed-partida-placar">
          <div>
            <span>Dupla 1</span>
            <strong>{nomesDupla(partida.dupla1)}</strong>
          </div>
          <strong className="feed-partida-placar-numero">{partida.placarDupla1 ?? 0}</strong>
          <span className="feed-partida-versus">x</span>
          <strong className="feed-partida-placar-numero">{partida.placarDupla2 ?? 0}</strong>
          <div>
            <span>Dupla 2</span>
            <strong>{nomesDupla(partida.dupla2)}</strong>
          </div>
        </div>

        <div className="feed-partida-registrador">
          <FaUserCircle aria-hidden="true" />
          <span>Registrada por {partida.criadoPorNome || 'Usuário QNF'}</span>
        </div>

        <div className="feed-partida-acoes">
          <CompartilharPartidaBotao partidaId={partida.partidaId} url={`/feed?partida=${partida.partidaId}`} />
          <Link to="/partidas/consulta" className="botao-secundario botao-compacto">
            Detalhes
            <FaChevronRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
