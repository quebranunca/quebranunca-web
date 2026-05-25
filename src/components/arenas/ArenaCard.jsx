import { Link } from 'react-router-dom';
import { FaInstagram, FaMapMarkerAlt, FaWhatsapp } from 'react-icons/fa';
import { resolverUrlRecurso } from '../../services/http';

function obterInicialArena(nome = '') {
  const primeiraLetra = nome.trim().split(' ')[0]?.[0];
  return primeiraLetra ? primeiraLetra.toUpperCase() : 'A';
}

function formatarTipoArena(tipoArena) {
  const rotulos = {
    1: 'Praia',
    2: 'Rede na praia',
    3: 'Arena privada',
    4: 'Clube',
    5: 'Escola',
    6: 'Centro de treinamento',
    7: 'Espaço de associados',
    8: 'Local temporário',
    9: 'Outro'
  };

  if (typeof tipoArena === 'string') {
    return tipoArena;
  }

  return rotulos[Number(tipoArena)] || 'Arena';
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

export function ArenaCard({ arena }) {
  const capaUrl = resolverUrlRecurso(arena?.capaUrl);
  const logoUrl = resolverUrlRecurso(arena?.logoUrl);
  const localizacao = formatarLocalizacao(arena?.cidade, arena?.estado);

  return (
    <article className="arena-card">
      <div
        className="arena-card__capa"
        style={capaUrl ? { backgroundImage: `url(${capaUrl})` } : undefined}
      >
        <div className="arena-card__capa-overlay" />
        {logoUrl ? (
          <img src={logoUrl} alt={arena?.nome || 'Logo da arena'} className="arena-card__logo" />
        ) : (
          <div className="arena-card__logo-fallback" aria-hidden="true">
            {obterInicialArena(arena?.nome)}
          </div>
        )}
      </div>

      <div className="arena-card__conteudo">
        <div>
          <p className="arena-card__tipo">{formatarTipoArena(arena?.tipoArena)}</p>
          <h3>{arena?.nome || 'Arena pública'}</h3>
        </div>

        <p className="arena-card__localizacao">
          <FaMapMarkerAlt aria-hidden="true" />
          <span>{localizacao}</span>
        </p>

        <p className="arena-card__endereco">{arena?.enderecoResumo || 'Endereço a definir'}</p>

        <div className="arena-card__metadados">
          <span>{arena?.quantidadeEspacos ?? 0} {arena?.quantidadeEspacos === 1 ? 'espaço' : 'espaços'}</span>
          <span>{arena?.descricaoResumo || 'Descrição pública em breve.'}</span>
        </div>

        <div className="arena-card__contatos">
          {arena?.instagram && (
            <span>
              <FaInstagram aria-hidden="true" />
              {arena.instagram}
            </span>
          )}

          {arena?.whatsapp && (
            <span>
              <FaWhatsapp aria-hidden="true" />
              {arena.whatsapp}
            </span>
          )}
        </div>

        <div className="arena-card__footer">
          <Link
            to={`/arenas/${arena?.slug}`}
            className="botao-primario arena-card__botao"
            aria-label={`Ver arena ${arena?.nome || ''}`}
          >
            Ver arena
          </Link>
        </div>
      </div>
    </article>
  );
}
