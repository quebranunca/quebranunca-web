import { MinhaPartidaRegistradaCard } from './MinhaPartidaRegistradaCard';

export function MinhasPartidasRegistradasLista({ partidas, onEditar, onExcluir, partidaExcluindoId }) {
  return (
    <div className="lista-cartoes minhas-partidas-registradas-lista scroll-discreto scroll-fade">
      {partidas.map((partida) => (
        <MinhaPartidaRegistradaCard
          key={partida.id}
          partida={partida}
          onEditar={onEditar}
          onExcluir={onExcluir}
          excluindo={partidaExcluindoId === partida.id}
        />
      ))}
    </div>
  );
}
