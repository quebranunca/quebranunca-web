import { useMemo } from 'react';
import { ArenaCard } from './ArenaCard';
import { ArenaEmptyState } from './ArenaEmptyState';

const TIPOS_ARENA = [
  { valor: '', rotulo: 'Todos os tipos' },
  { valor: 1, rotulo: 'Praia' },
  { valor: 2, rotulo: 'Rede na praia' },
  { valor: 3, rotulo: 'Arena privada' },
  { valor: 4, rotulo: 'Clube' },
  { valor: 5, rotulo: 'Escola' },
  { valor: 6, rotulo: 'Centro de treinamento' },
  { valor: 7, rotulo: 'Espaço de associados' },
  { valor: 8, rotulo: 'Local temporário' },
  { valor: 9, rotulo: 'Outro' }
];

function obterTiposDisponiveis(arenas) {
  const valores = new Set([0]);

  arenas.forEach((arena) => {
    if (arena?.tipoArena !== undefined && arena?.tipoArena !== null) {
      valores.add(Number(arena.tipoArena));
    }
  });

  return TIPOS_ARENA.filter((tipo) => tipo.valor === '' || valores.has(Number(tipo.valor)));
}

export function ArenasListPage({ arenas, carregando, erro, filtros, onFiltrosChange, onLimparFiltros }) {
  const tiposDisponiveis = useMemo(() => obterTiposDisponiveis(arenas), [arenas]);

  if (carregando) {
    return (
      <section className="arena-page__estado">
        <p>Carregando arenas públicas...</p>
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

  return (
    <div className="arena-lista-page">
      <div className="arena-page__filtros">
        <label className="campo-largo">
          <span>Buscar arena</span>
          <input
            type="search"
            placeholder="Nome, cidade ou tipo"
            value={filtros.termoBusca}
            onChange={(evento) => onFiltrosChange({ termoBusca: evento.target.value })}
          />
        </label>

        <label className="campo-largo">
          <span>Cidade</span>
          <input
            type="text"
            placeholder="Ex.: Rio de Janeiro"
            value={filtros.cidade}
            onChange={(evento) => onFiltrosChange({ cidade: evento.target.value })}
          />
        </label>

        <label className="campo-largo">
          <span>Estado</span>
          <input
            type="text"
            placeholder="Ex.: RJ"
            value={filtros.estado}
            onChange={(evento) => onFiltrosChange({ estado: evento.target.value })}
          />
        </label>

        <label className="campo-largo">
          <span>Tipo de arena</span>
          <select
            value={filtros.tipoArena}
            onChange={(evento) => onFiltrosChange({ tipoArena: evento.target.value })}
          >
            {tiposDisponiveis.map((tipo) => (
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.rotulo}
              </option>
            ))}
          </select>
        </label>

        <div className="arena-page__acoes-filtros">
          <button type="button" className="botao-secundario" onClick={onLimparFiltros}>
            Limpar filtros
          </button>
        </div>
      </div>

      {arenas.length === 0 ? (
        <ArenaEmptyState
          titulo="Nenhuma arena encontrada"
          descricao="Tente ajustar os filtros ou volte mais tarde para ver novas arenas públicas."
        />
      ) : (
        <div className="arena-lista-grid">
          {arenas.map((arena) => (
            <ArenaCard key={arena.id} arena={arena} />
          ))}
        </div>
      )}
    </div>
  );
}
