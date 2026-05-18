import { DuplaLink } from '../duplas/DuplaLink';

export function PlacarDupla({
  label,
  atletas,
  placar,
  vencedor = false,
  atleta1Id,
  atleta2Id
}) {
  return (
    <div className="dupla-linha">
      {label && <span className="dupla-label">{label}</span>}

      <DuplaLink
        atleta1Id={atleta1Id}
        atleta2Id={atleta2Id}
        className={`dupla-conteudo ${vencedor ? 'vencedor' : ''}`}
        tag="div"
      >
        <div className="dupla-nome">
          {atletas}
        </div>

        <div className="dupla-placar">
          {placar}
        </div>
      </DuplaLink>
    </div>
  );
}
