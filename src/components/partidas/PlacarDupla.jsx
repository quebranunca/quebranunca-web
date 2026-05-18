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

      <div className={`dupla-conteudo ${vencedor ? 'vencedor' : ''}`}>
        <div className="dupla-nome">
          <DuplaLink atleta1Id={atleta1Id} atleta2Id={atleta2Id}>
            {atletas}
          </DuplaLink>
        </div>

        <div className="dupla-placar">
          {placar}
        </div>
      </div>
    </div>
  );
}
