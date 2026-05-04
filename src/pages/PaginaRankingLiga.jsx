const rankingLiga = [
  {
    categoria: 'Masculino Estreante',
    ranking: [
      { posicao: 1, atleta: 'FOGUINHO', pontos: 105 },
      { posicao: 1, atleta: 'JOÃO', pontos: 105 },

      { posicao: 2, atleta: 'CAUÊ', pontos: 75 },
      { posicao: 2, atleta: 'FELIPE', pontos: 75 },

      { posicao: 3, atleta: 'GUSTAVO', pontos: 55 },
      { posicao: 3, atleta: 'CARLOS', pontos: 55 }
    ]
  },
  {
    categoria: 'Masculino Iniciante',
    ranking: [
      { posicao: 1, atleta: 'JOÃO', pontos: 105 },
      { posicao: 1, atleta: 'LUCAS', pontos: 105 },

      { posicao: 2, atleta: 'BRUNO', pontos: 75 },
      { posicao: 2, atleta: 'MIGUEL', pontos: 75 },

      { posicao: 3, atleta: 'NUNO', pontos: 55 },
      { posicao: 3, atleta: 'RODRIGO', pontos: 55 }
    ]
  },
  {
    categoria: 'Feminino Iniciante B',
    ranking: [
      { posicao: 1, atleta: 'ALICE', pontos: 105 },
      { posicao: 1, atleta: 'ALEXIA', pontos: 105 },

      { posicao: 2, atleta: 'YAS', pontos: 75 },
      { posicao: 2, atleta: 'RITINHA', pontos: 75 },

      { posicao: 3, atleta: 'PAULA', pontos: 55 },
      { posicao: 3, atleta: 'MICHELE', pontos: 55 }
    ]
  },
  {
    categoria: 'Feminino Iniciante C',
    ranking: [
      { posicao: 1, atleta: 'CINTHIA', pontos: 105 },
      { posicao: 1, atleta: 'TALIA', pontos: 105 },

      { posicao: 2, atleta: 'MARIA', pontos: 75 },
      { posicao: 2, atleta: 'VITORIA', pontos: 75 }
    ]
  },
  {
    categoria: 'Feminino Intermediário',
    ranking: [
      { posicao: 1, atleta: 'GABI DINIZ', pontos: 105 },
      { posicao: 1, atleta: 'CAROL TO', pontos: 105 },

      { posicao: 2, atleta: 'TAMY', pontos: 75 },
      { posicao: 2, atleta: 'INGRID', pontos: 75 }
    ]
  }
];

const categoriasLiga = {
  masculino: [
    'Estreante',
    'Iniciante',
    'Intermediário',
    'Amador'
  ],
  feminino: [
    'Estreante',
    'Iniciante B',
    'Iniciante C',
    'Intermediário',
    'Amador'
  ]
};
export function RankingLiga() {
  return (
    <main className="pagina-app">
      <section className="cabecalho-pagina">
        <h3>Ranking da Liga Praia-Grandense</h3>
        <p>Classificação individual por atleta em cada categoria</p>
      </section>

      <section className="ranking-liga-lista">
        {rankingLiga.map((item) => (
          <div className="cartao ranking-categoria" key={item.categoria}>
            <h2>{item.categoria}</h2>

            <div className="ranking-podio">
              {item.ranking.map((pos, index) => (
                <div
                  key={`${item.categoria}-${pos.atleta}-${index}`}
                  className={`home-ranking-atleta pos-${pos.posicao}`}
                >
                  <span>{pos.posicao}º</span>
                  <strong>{pos.atleta}</strong>
                  <p>{pos.pontos} pts</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
