import { Link } from 'react-router-dom';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { resolverUrlRecurso } from '../../services/http';
import { ArenaStatusBadge } from './ArenaStatusBadge';
import { ArenaVisibilityBadge } from './ArenaVisibilityBadge';

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

export function ArenaAdminCard({ arena }) {
  const capaUrl = resolverUrlRecurso(arena?.capaUrl);
  const logoUrl = resolverUrlRecurso(arena?.logoUrl);
  const localizacao = formatarLocalizacao(arena?.cidade, arena?.estado);
  const podeVerPublico = Boolean(arena?.publica && arena?.ativa && arena?.slug);

  return (
    <article className="arena-admin-card">
      <div
        className="arena-admin-card__capa"
        style={capaUrl ? { backgroundImage: `url(${capaUrl})` } : undefined}
      >
        <div className="arena-admin-card__capa-overlay" />
        {logoUrl ? (
          <img src={logoUrl} alt={arena?.nome || 'Logo da arena'} className="arena-admin-card__logo" />
        ) : (
          <div className="arena-admin-card__logo-fallback" aria-hidden="true">
            {obterInicialArena(arena?.nome)}
          </div>
        )}
      </div>

      <div className="arena-admin-card__conteudo">
        <div>
          <p className="arena-card__tipo">{formatarTipoArena(arena?.tipoArena)}</p>
          <h3>{arena?.nome || 'Arena'}</h3>
        </div>

        <p className="arena-admin-card__localizacao">
          <FaMapMarkerAlt aria-hidden="true" />
          <span>{localizacao}</span>
        </p>

        <p className="arena-admin-card__endereco">{arena?.enderecoResumo || 'Endereço resumido em breve.'}</p>

        <div className="arena-admin-card__badges">
          <ArenaStatusBadge ativa={arena?.ativa} />
          <ArenaVisibilityBadge publica={arena?.publica} />
        </div>

        <div className="arena-admin-card__metadados">
          <span>{arena?.quantidadeEspacos ?? 0} {arena?.quantidadeEspacos === 1 ? 'espaço' : 'espaços'}</span>
          <span>{arena?.cidade || 'Cidade não informada'}</span>
          <span>{arena?.estado || 'Estado não informado'}</span>
        </div>

        <div className="arena-admin-card__acoes">
          <Link
            to={`/arenas/admin/${arena?.id}`}
            className="botao-primario arena-admin-card__botao"
            aria-label={`Gerenciar arena ${arena?.nome || ''}`}
          >
            Gerenciar
          </Link>

          {podeVerPublico && (
            <Link
              to={`/arenas/${arena?.slug}`}
              className="botao-secundario arena-admin-card__botao"
              aria-label={`Ver perfil público de ${arena?.nome || ''}`}
            >
              Ver perfil público
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
