import { Link } from 'react-router-dom';
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

export function ArenaAdminHeader({ arena, onEditar }) {
  const capaUrl = resolverUrlRecurso(arena?.capaUrl);
  const logoUrl = resolverUrlRecurso(arena?.logoUrl);
  const localizacao = formatarLocalizacao(arena?.cidade, arena?.estado);
  const podeVerPublico = Boolean(arena?.publica && arena?.ativa && arena?.slug);

  return (
    <section className="arena-admin-header">
      <div
        className="arena-admin-header__banner"
        style={capaUrl ? { backgroundImage: `url(${capaUrl})` } : undefined}
      >
        <div className="arena-admin-header__banner-overlay" />
      </div>

      <div className="arena-admin-header__conteudo">
        <div className="arena-admin-header__topo">
          {logoUrl ? (
            <img src={logoUrl} alt={arena?.nome || 'Logo da arena'} className="arena-admin-header__logo" />
          ) : (
            <div className="arena-admin-header__logo-fallback" aria-hidden="true">
              {obterInicialArena(arena?.nome)}
            </div>
          )}

          <div>
            <p className="arena-admin-header__tipo">{formatarTipoArena(arena?.tipoArena)}</p>
            <h2>{arena?.nome || 'Arena'}</h2>
          </div>
        </div>

        <div className="arena-admin-header__meta">
          <span>{localizacao}</span>
          <span>{arena?.enderecoResumo || 'Endereço resumido em breve.'}</span>
        </div>

        <div className="arena-admin-header__status-row">
          <ArenaStatusBadge ativa={arena?.ativa} />
          <ArenaVisibilityBadge publica={arena?.publica} />
        </div>

        <div className="arena-admin-header__acoes">
          {podeVerPublico && (
            <Link
              to={`/arenas/${arena?.slug}`}
              className="botao-secundario"
              aria-label={`Ver perfil público de ${arena?.nome || 'arena'}`}
            >
              Ver perfil público
            </Link>
          )}

          <button
            type="button"
            className="botao-primario"
            onClick={onEditar}
          >
            Editar dados
          </button>
        </div>
      </div>
    </section>
  );
}
