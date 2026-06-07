import { MinhaPartidaRegistradaCard } from './MinhaPartidaRegistradaCard';

export function MinhasPartidasRegistradasLista({ partidas, onEditar, onExcluir, partidaExcluindoId, podeExcluir = false }) {
  return (
    <div className="lista-cartoes minhas-partidas-registradas-lista scroll-discreto scroll-fade">
      {partidas.map((partida) => (
        <MinhaPartidaRegistradaCard
          key={partida.id}
          partida={partida}
          onEditar={onEditar}
          onExcluir={onExcluir}
          podeExcluir={podeExcluir}
          excluindo={partidaExcluindoId === partida.id}
        />
      ))}
    </div>
  );
}
