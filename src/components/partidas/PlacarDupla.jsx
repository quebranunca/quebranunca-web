import { DuplaLink } from '../duplas/DuplaLink';
import { formatarNomeDupla } from '../../utils/atletaUtils';

export function PlacarDupla({
  label,
  atletas,
  placar,
  vencedor = false,
  atleta1Id,
  atleta2Id
}) {
  const nomesAtletas = formatarNomeDupla(atletas);
  const textoAtletas = nomesAtletas || (Array.isArray(atletas) ? 'A definir' : atletas || 'A definir');

  return (
    <div className="dupla-linha">
      {label && <span className="dupla-label">{label}</span>}

      <DuplaLink
        atleta1Id={atleta1Id}
        atleta2Id={atleta2Id}
        className={`dupla-conteudo ${vencedor ? 'vencedor' : ''}`}
        tag="div"
      >
        <div className="dupla-nome nome-dupla">
          {textoAtletas}
        </div>

        <div className="dupla-placar">
          {placar}
        </div>
      </DuplaLink>
    </div>
  );
}
