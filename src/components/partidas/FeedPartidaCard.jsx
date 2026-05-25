import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaCamera, FaChevronRight, FaPlayCircle, FaTrophy, FaUsers } from 'react-icons/fa';
import { AtletaPerfilLink } from '../AtletaPerfilLink';
import { AvatarUsuario } from '../AvatarUsuario';
import { CompartilharPartidaBotao } from './CompartilharPartidaBotao';
import { formatarData, formatarDataHora, formatarHora } from '../../utils/formatacao';
import { formatarNomeDupla } from '../../utils/atletaUtils';

function nomesDupla(dupla) {
  return formatarNomeDupla(dupla, 'Dupla a definir');
}

function NomesDuplaLinks({ dupla }) {
  if (!Array.isArray(dupla) || dupla.length === 0) {
    return nomesDupla(dupla);
  }

  return dupla.map((atleta, indice) => (
    <span key={atleta.atletaId || atleta.id || `${atleta.nome}-${indice}`}>
      {indice > 0 && ' • '}
      <AtletaPerfilLink atleta={atleta} className="atleta-nome-link">
        {formatarNomeDupla([atleta], atleta.nome || 'Atleta')}
      </AtletaPerfilLink>
    </span>
  ));
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

function obterFotoRegistrador(partida) {
  return partida?.criadoPorFotoPerfilUrl
    || partida?.usuarioFotoPerfilUrl
    || partida?.usuarioCriadorFotoPerfilUrl
    || '';
}

function obterTipoContexto(partida) {
  if (partida?.competicaoNome) {
    return 'Competição';
  }

  if (partida?.grupoNome) {
    return 'Grupo';
  }

  return 'Comunidade';
}

function obterDuplaVencedora(partida) {
  const placarDupla1 = Number(partida?.placarDupla1 ?? 0);
  const placarDupla2 = Number(partida?.placarDupla2 ?? 0);

  if (placarDupla1 === placarDupla2) {
    return null;
  }

  return placarDupla1 > placarDupla2 ? 1 : 2;
}

function FeedPartidaCardHome({ partida }) {
  const nomeRegistrador = partida.criadoPorNome || 'Usuário QNF';
  const contexto = obterContexto(partida);
  const duplaVencedora = obterDuplaVencedora(partida);

  return (
    <Link
      to={`/feed?partida=${partida.partidaId}`}
      className="feed-partida-card feed-partida-card-home"
      aria-label={`Ver partida registrada por ${nomeRegistrador}`}
    >
      <div className="feed-partida-home-topo">
        <AvatarUsuario
          nome={nomeRegistrador}
          fotoPerfilUrl={obterFotoRegistrador(partida)}
          tamanho="sm"
          className="feed-partida-registrador-avatar"
        />
        <div className="feed-partida-autoria">
          <strong title={nomeRegistrador}>{nomeRegistrador}</strong>
          <span>registrou uma partida</span>
        </div>
      </div>

      <p className="feed-partida-home-metadata">
        <time>{formatarData(partida.data)}</time>
        <span aria-hidden="true">•</span>
        <time>{formatarHora(partida.data)}</time>
        <span aria-hidden="true">•</span>
        <strong title={contexto}>{contexto}</strong>
      </p>

      <div className="feed-partida-home-placar" aria-label="Placar da partida">
        <div className={`feed-partida-home-linha${duplaVencedora === 1 ? ' vencedora' : ''}`}>
          <span title={nomesDupla(partida.dupla1)}>{nomesDupla(partida.dupla1)}</span>
          <strong>{partida.placarDupla1 ?? 0}</strong>
        </div>
        <div className={`feed-partida-home-linha${duplaVencedora === 2 ? ' vencedora' : ''}`}>
          <span title={nomesDupla(partida.dupla2)}>{nomesDupla(partida.dupla2)}</span>
          <strong>{partida.placarDupla2 ?? 0}</strong>
        </div>
      </div>

      <span className="feed-partida-home-acao">
        Ver mais partidas
        <FaChevronRight aria-hidden="true" />
      </span>
    </Link>
  );
}

export function FeedPartidaCard({ partida, variante = 'padrao' }) {
  if (variante === 'home') {
    return <FeedPartidaCardHome partida={partida} />;
  }

  const temMidia = Boolean(partida?.midiaUrl);
  const nomeRegistrador = partida.criadoPorNome || 'Usuário QNF';
  const contexto = obterContexto(partida);
  const classes = [
    'feed-partida-card',
    temMidia ? 'com-midia' : 'sem-midia'
  ].filter(Boolean).join(' ');

  return (
    <article className={classes}>
      {temMidia ? (
        <div className="feed-partida-midia">
          {ehVideo(partida.midiaTipo) ? (
            <video src={partida.midiaUrl} controls preload="metadata" />
          ) : (
            <img src={partida.midiaUrl} alt="Mídia da partida" loading="lazy" />
          )}
        </div>
      ) : (
        <div className="feed-partida-midia feed-partida-midia-placeholder" aria-hidden="true">
          <span>
            <FaCamera />
            <FaPlayCircle />
          </span>
        </div>
      )}

      <div className="feed-partida-social-topo">
        <AvatarUsuario
          nome={nomeRegistrador}
          fotoPerfilUrl={obterFotoRegistrador(partida)}
          tamanho="sm"
          className="feed-partida-registrador-avatar"
        />
        <div className="feed-partida-autoria">
          <strong title={nomeRegistrador}>{nomeRegistrador}</strong>
          <span>
            Registrou uma partida
          </span>
        </div>
        <small>
          <FaCalendarAlt aria-hidden="true" />
          {formatarDataHora(partida.data)}
        </small>
      </div>

      <div className="feed-partida-corpo">
        <div className="feed-partida-contexto">
          <span>
            {partida.competicaoNome ? <FaTrophy aria-hidden="true" /> : <FaUsers aria-hidden="true" />}
            {obterTipoContexto(partida)}
          </span>
          <strong title={contexto}>{contexto}</strong>
        </div>

        <div className="feed-partida-placar" aria-label="Placar da partida">
          <div className="feed-partida-dupla feed-partida-dupla-a">
            <div>
              <span>Dupla 1</span>
              <strong className="nome-dupla" title={nomesDupla(partida.dupla1)}>
                <NomesDuplaLinks dupla={partida.dupla1} />
              </strong>
            </div>
            <strong className="feed-partida-placar-numero">{partida.placarDupla1 ?? 0}</strong>
          </div>
          <span className="feed-partida-versus">x</span>
          <div className="feed-partida-dupla feed-partida-dupla-b">
            <strong className="feed-partida-placar-numero">{partida.placarDupla2 ?? 0}</strong>
            <div>
              <span>Dupla 2</span>
              <strong className="nome-dupla" title={nomesDupla(partida.dupla2)}>
                <NomesDuplaLinks dupla={partida.dupla2} />
              </strong>
            </div>
          </div>
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
