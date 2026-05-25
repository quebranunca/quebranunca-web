import { FaMapMarkedAlt } from 'react-icons/fa';
import { ArenaSection } from './ArenaSection';
import { ArenaEstruturaBadges } from './ArenaEstruturaBadges';
import { ArenaHero } from './ArenaHero';

function montarMapaUrl(arena) {
  if (arena?.latitude !== undefined && arena?.longitude !== undefined && arena?.latitude !== null && arena?.longitude !== null) {
    return `https://www.google.com/maps?q=${arena.latitude},${arena.longitude}`;
  }

  if (arena?.endereco) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(arena.endereco)}`;
  }

  if (arena?.cidade && arena?.estado) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${arena.cidade}, ${arena.estado}`)}`;
  }

  return '';
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

function possuiEstrutura(arena) {
  return Boolean(
    arena?.possuiIluminacao ||
    arena?.possuiEstacionamento ||
    arena?.possuiVestiario ||
    arena?.possuiDucha ||
    arena?.possuiBarRestaurante ||
    arena?.possuiLoja ||
    arena?.possuiCobertura
  );
}

export function ArenaPublicProfilePage({ arena, carregando, erro, naoEncontrada }) {
  const mapaUrl = montarMapaUrl(arena);
  const mostrarEstrutura = possuiEstrutura(arena);

  if (carregando) {
    return (
      <section className="arena-page__estado">
        <p>Carregando perfil público da arena...</p>
      </section>
    );
  }

  if (erro) {
    return (
      <section className="arena-page__estado arena-page__estado--erro">
        <p>{erro}</p>
      </section>
    );
  }

  if (naoEncontrada) {
    return (
      <section className="arena-page__estado arena-page__estado--vaga">
        <p>Arena não encontrada.</p>
      </section>
    );
  }

  return (
    <div className="arena-profile-page">
      <ArenaHero arena={arena} />

      <div className="arena-profile-grid">
        <ArenaSection
          titulo="Sobre"
          descricao={`Tipo: ${formatarTipoArena(arena?.tipoArena)}`}
        >
          <div className="arena-profile__sobre">
            <p>{arena?.descricao || 'A arena ainda não divulgou uma descrição pública.'}</p>
            <div className="arena-profile__sobre-meta">
              <span>{arena?.cidade || 'Cidade a definir'}</span>
              <span>{arena?.estado || 'Estado a definir'}</span>
              <span>{arena?.enderecoResumo || 'Endereço resumido em breve.'}</span>
            </div>
          </div>
        </ArenaSection>

        {mostrarEstrutura && (
          <ArenaSection
            titulo="Estrutura"
          >
            <ArenaEstruturaBadges arena={arena} />
          </ArenaSection>
        )}

        <ArenaSection
          titulo="Localização"
          descricao="Endereço público da arena e acesso rápido ao mapa."
        >
          <div className="arena-profile__localizacao">
            <p>{arena?.endereco || arena?.enderecoResumo || 'Endereço público em breve.'}</p>
            <p>{arena?.cidade || 'Cidade'}{arena?.estado ? `, ${arena.estado}` : ''}</p>
            {mapaUrl && (
              <a
                href={mapaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="botao-secundario arena-profile__mapa"
              >
                <FaMapMarkedAlt aria-hidden="true" />
                <span>Abrir mapa</span>
              </a>
            )}
          </div>
        </ArenaSection>

        <ArenaSection
          titulo="Aulas"
          placeholder={<p>Em breve, esta arena poderá divulgar aulas e turmas por aqui.</p>}
        />

        <ArenaSection
          titulo="Professores"
          placeholder={<p>Em breve, os professores vinculados a esta arena aparecerão aqui.</p>}
        />

        <ArenaSection
          titulo="Campeonatos"
          placeholder={<p>Eventos e campeonatos realizados nesta arena aparecerão aqui.</p>}
        />

        <ArenaSection
          titulo="Ranking local"
          placeholder={<p>O ranking local da arena será exibido quando houver partidas vinculadas.</p>}
        />

        <ArenaSection
          titulo="Fotos"
          placeholder={<p>Fotos da arena serão exibidas aqui.</p>}
        >
          <div className="arena-profile__fotos-placeholder">
            <span>Galeria pública em construção</span>
          </div>
        </ArenaSection>
      </div>
    </div>
  );
}
