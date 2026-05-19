import { CompartilharPartidaBotao } from './CompartilharPartidaBotao';
import { PlacarDupla } from './PlacarDupla';
import { formatarNomeDupla } from '../../utils/atletaUtils';

export function PartidaGeral({ partida }) {
  const ultimoJogo = partida?.ultimoJogo;

  const atletasDupla1 = ultimoJogo?.dupla1?.length
  ? formatarNomeDupla(ultimoJogo.dupla1)
  : 'Esquerda e Direita';

  const atletasDupla2 = ultimoJogo?.dupla2?.length
  ? formatarNomeDupla(ultimoJogo.dupla2)
  : 'Esquerda e Direita'

  const placarDupla1 = ultimoJogo?.placarDupla1 || 0;
  const placarDupla2 = ultimoJogo?.placarDupla2 || 0;

  return (
    <div>
      <span className="grupo-resumo-grupo-nome-fora">
        última partida.
      </span>
      <div className="home-ultimo-jogo">
        <div className="div-partida-ultimo-jogo">
          <div className="grupo-resumo-informacoes">
            <span className="grupo-resumo-rotulo grupo-resumo-grupo-nome">
              {partida?.nome || ''}
            </span>

            <span className="grupo-resumo-rotulo">
              {ultimoJogo?.data ? `(${ultimoJogo.data})` : ''}
            </span>
          </div>

          {partida?.partidaId && (
            <CompartilharPartidaBotao partidaId={partida.partidaId} />
          )}
        </div>

        <PlacarDupla
          label="Sua dupla"
          atletas={atletasDupla1}
          placar={placarDupla1}
          vencedor={placarDupla1 > placarDupla2}
        />

        <PlacarDupla
          label="Adversários"
          atletas={atletasDupla2}
          placar={placarDupla2}
          vencedor={placarDupla2 > placarDupla1}
        />
      </div>
    </div>
  );
}
