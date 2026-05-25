import { HomeSecaoCabecalho } from './HomeSecaoCabecalho';
import { AtletaPerfilLink } from '../AtletaPerfilLink';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../AvatarUsuario';
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
                <AvatarUsuario
                  nome={obterNomeExibicaoAtleta(atleta)}
                  fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
                  tamanho="sm"
                  className="grupo-ranking-avatar"
                />
                <AtletaPerfilLink atleta={atleta} className="atleta-nome-link">
                  <strong>{obterNomeExibicaoAtleta(atleta)}</strong>
                </AtletaPerfilLink>
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
