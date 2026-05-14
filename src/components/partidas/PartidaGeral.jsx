import { CompartilharPartidaBotao } from './CompartilharPartidaBotao';
import { PlacarDupla } from './PlacarDupla';

export function PartidaGeral({ partida }) {
  const ultimoJogo = partida?.ultimoJogo;

  if (!partida || !ultimoJogo) {
    return null;
  }

  const dupla1 = ultimoJogo.dupla1 || [];
  const dupla2 = ultimoJogo.dupla2 || [];

  const atletasDupla1 = dupla1
    .map((atleta) => atleta?.apelido || atleta?.nome)
    .filter(Boolean)
    .join(' e ');

  const atletasDupla2 = dupla2
    .map((atleta) => atleta?.apelido || atleta?.nome)
    .filter(Boolean)
    .join(' e ');

  return (
    <div className="home-ultimo-jogo">
      <div className="home-ultimo-jogo-acoes">
        <div className="grupo-resumo-informacoes">
          <span className="grupo-resumo-rotulo grupo-resumo-grupo-nome">
            {partida.nome}
          </span>

          <span className="grupo-resumo-rotulo">
            ({ultimoJogo.data})
          </span>
        </div>

        <CompartilharPartidaBotao partidaId={partida.partidaId} />
      </div>

      <PlacarDupla
        label="Sua dupla"
        atletas={atletasDupla1}
        placar={ultimoJogo.placarDupla1}
        vencedor={ultimoJogo.placarDupla1 > ultimoJogo.placarDupla2}
      />

      <PlacarDupla
        label="Adversários"
        atletas={atletasDupla2}
        placar={ultimoJogo.placarDupla2}
        vencedor={ultimoJogo.placarDupla2 > ultimoJogo.placarDupla1}
      />
    </div>
  );
}