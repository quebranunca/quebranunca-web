import { HomeSecaoCabecalho } from './HomeSecaoCabecalho';
import { obterNomeExibicaoAtleta } from '../../utils/atletaUtils';

export function HomeDestaqueRanking({ destaqueRanking }) {
  return (
    <section className="home-grid-duas-colunas">
      <div className="home-secao">
        <HomeSecaoCabecalho
          titulo="Destaque do ranking"
          descricao={destaqueRanking.titulo}
          linkTexto="Ranking completo"
          linkPara="/ranking"
        />

        <div className="cartao-lista home-ranking-card">
          {destaqueRanking.atletas.length > 0 ? (
            destaqueRanking.atletas.map((atleta) => (
              <div key={atleta.atletaId} className="home-ranking-linha">
                <span>{atleta.posicao}º</span>
                <strong>{obterNomeExibicaoAtleta(atleta)}</strong>
                <small>{atleta.pontos} pts</small>
              </div>
            ))
          ) : (
            <p>Nenhuma pontuação publicada ainda.</p>
          )}
        </div>
      </div>
    </section>
  );
}
