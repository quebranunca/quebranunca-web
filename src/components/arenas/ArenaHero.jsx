import { FaMapMarkerAlt } from 'react-icons/fa';
import { ArenaContatoActions } from './ArenaContatoActions';
import { resolverUrlRecurso } from '../../services/http';

function obterInicialArena(nome = '') {
  const primeiraLetra = nome.trim().split(' ')[0]?.[0];
  return primeiraLetra ? primeiraLetra.toUpperCase() : 'A';
}

function formatarLocalizacao(cidade, estado) {
  if (cidade && estado) {
    return `${cidade}, ${estado}`;
  }

  if (cidade) {
    return cidade;
  }

  if (estado) {
    return estado;
  }

  return 'Localização a definir';
}

export function ArenaHero({ arena }) {
  const capaUrl = resolverUrlRecurso(arena?.capaUrl);
  const logoUrl = resolverUrlRecurso(arena?.logoUrl);
  const localizacao = formatarLocalizacao(arena?.cidade, arena?.estado);

  return (
    <section className="arena-hero">
      <div
        className="arena-hero__banner"
        style={capaUrl ? { backgroundImage: `url(${capaUrl})` } : undefined}
      >
        <div className="arena-hero__banner-overlay" />
      </div>

      <div className="arena-hero__conteudo">
        <div className="arena-hero__logo-wrap">
          {logoUrl ? (
            <img src={logoUrl} alt={arena?.nome || 'Logo da arena'} className="arena-hero__logo" />
          ) : (
            <div className="arena-hero__logo-fallback" aria-hidden="true">
              {obterInicialArena(arena?.nome)}
            </div>
          )}
        </div>

        <div className="arena-hero__copy">
          <p className="arena-hero__tipo">{arena?.tipoArena || 'Arena'}</p>
          <h1>{arena?.nome || 'Arena pública'}</h1>
          <p className="arena-hero__localizacao">
            <FaMapMarkerAlt aria-hidden="true" />
            <span>{localizacao}</span>
          </p>

          {arena?.enderecoResumo && (
            <p className="arena-hero__endereco">{arena.enderecoResumo}</p>
          )}

          <div className="arena-hero__metadados">
            <span>{arena?.quantidadeEspacos ?? 0} {arena?.quantidadeEspacos === 1 ? 'espaço' : 'espaços'}</span>
            <span>{arena?.cidade || 'Cidade não informada'}</span>
            <span>{arena?.estado || 'Estado não informado'}</span>
          </div>
        </div>

        <ArenaContatoActions
          instagram={arena?.instagram}
          whatsapp={arena?.whatsapp}
          site={arena?.site}
        />
      </div>
    </section>
  );
}
