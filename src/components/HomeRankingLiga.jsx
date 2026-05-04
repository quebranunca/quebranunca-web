import { useNavigate } from 'react-router-dom';

const rankingPreview = [
  {
    categoria: 'Masculino Estreante',
    atletas: [
      { posicao: 1, nome: 'FOGUINHO', pontos: 105 },
      { posicao: 1, nome: 'JOÃO', pontos: 105 },
      { posicao: 2, nome: 'CAUÊ', pontos: 75 },
      { posicao: 2, nome: 'FELIPE', pontos: 75 },
      { posicao: 3, nome: 'GUSTAVO', pontos: 55 },
      { posicao: 3, nome: 'CARLOS', pontos: 55 }
    ]
  },
  {
    categoria: 'Masculino Iniciante',
    atletas: [
      { posicao: 1, nome: 'JOÃO', pontos: 105 },
      { posicao: 1, nome: 'LUCAS', pontos: 105 },
      { posicao: 2, nome: 'BRUNO', pontos: 75 },
      { posicao: 2, nome: 'MIGUEL', pontos: 75 },
      { posicao: 3, nome: 'NUNO', pontos: 55 },
      { posicao: 3, nome: 'RODRIGO', pontos: 55 }
    ]
  },
  {
    categoria: 'Feminino Iniciante B',
    atletas: [
      { posicao: 1, nome: 'ALICE', pontos: 105 },
      { posicao: 1, nome: 'ALEXIA', pontos: 105 },
      { posicao: 2, nome: 'YAS', pontos: 75 },
      { posicao: 2, nome: 'RITINHA', pontos: 75 },
      { posicao: 3, nome: 'PAULA', pontos: 55 },
      { posicao: 3, nome: 'MICHELE', pontos: 55 }
    ]
  }
];

export function HomeRankingLiga() {
  const navigate = useNavigate();

  function irParaRanking() {
    navigate('/ranking/liga');
  }

  return (
    <article className="cartao-lista home-resumo-usuario">
      <div className="home-ranking-header">
        <div>
          <span className="badge-liga">Liga</span>
          <h3>Ranking da Liga Praia-Grandense</h3>
          <p>Top 3 individual por categoria</p>
        </div>
      </div>

      <div className="home-ranking-scroll">
        {rankingPreview.map((categoria) => (
          <section
            className="home-ranking-categoria"
            key={categoria.categoria}
          >
            <div className="home-ranking-categoria-header">
              <strong>{categoria.categoria}</strong>
            </div>

            <div className="home-ranking-atletas">
              {categoria.atletas.map((atleta, index) => (
                <button
                  type="button"
                  className={`home-ranking-atleta pos-${atleta.posicao}`}
                  key={`${categoria.categoria}-${atleta.nome}-${index}`}
                  onClick={irParaRanking}
                >
                  <span className="home-ranking-posicao">
                    {atleta.posicao}º
                  </span>

                  <span className="home-ranking-nome">
                    {atleta.nome}
                  </span>

                  <strong className="home-ranking-pontos">
                    {atleta.pontos} pts
                  </strong>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <button
        type="button"
        className="botao-primario home-ranking-cta"
        onClick={irParaRanking}
      >
        Ver ranking completo
      </button>
    </article>
  );
}