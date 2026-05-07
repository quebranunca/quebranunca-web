import { obterNomeExibicaoAtleta, obterNomeExibicaoDupla } from '../../utils/atletaUtils';

function formatarAtletaPlacar(atleta) {
  if (typeof atleta === 'string') {
    return obterNomeExibicaoAtleta({ nome: atleta }) || atleta;
  }

  return obterNomeExibicaoAtleta(atleta) || '';
}

export function PlacarDupla({
  label,
  atletas,
  placar,
  vencedor = false
}) {
  return (
    <div className="dupla-linha">
      {label && <span className="dupla-label">{label}</span>}

      <div className={`dupla-conteudo ${vencedor ? 'vencedor' : ''}`}>
        <div className="dupla-nome">
          {Array.isArray(atletas)
            ? atletas.map(formatarAtletaPlacar).filter(Boolean).join(' e ')
            : obterNomeExibicaoDupla(atletas) || atletas
          }
        </div>

        <div className="dupla-placar">
          {placar}
        </div>
      </div>
    </div>
  );
}
