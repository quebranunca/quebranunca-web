const rankingsLiga = [
  ['3 Etapa Feminino', 'Carrega', 32, 'BIA FARIAS E FLAVIA', 'INGRID E GABI', 'INGRID E GABI'],
  ['3 Etapa Feminino', 'Iniciante B', 30, 'ALICE E ALEXIA', 'YAS E RITINHA', 'PAULA E MICHELE'],
  ['3 Etapa Feminino', 'Iniciante C', 16, 'CINTHIA E TALIA', 'MARIA E VITORIA', 'MARIA E VITORIA'],
  ['3 Etapa Feminino', 'Intermediario', 42, 'GABI DINIZ E CAROL TO', 'TAMY E INGRID', 'TAMY E INGRID'],
  ['InterRedes', 'Feminino Iniciante', 20, 'JULI E NICOLE - BOLA 7', 'PRI E ISABEL - LANCE LI', 'ANA E YASMIN - NANDO'],
  ['InterRedes', 'Masculino Estreante', 29, 'FOGUINHO E JOÃO - AR', 'CAUÊ E FELIPE - CAIÇAR', 'GUSTAVO E CARLOS - B'],
  ['InterRedes', 'Masculino Iniciante', 27, 'JOÃO E LUCAS - MATHE', 'BRUNO E MIGUEL - NAN', 'NUNO E RODRIGO - NAN'],
  ['InterRedes', 'Master AD7', 32, 'Paulin e Roger', 'Anda e Serginho', 'Jesus e André Otacil'],
  ['InterRedes', 'Misto Estreante', 42, 'ISABELLA E ENZO - CAN', 'LARISSA E MATHEUS - A', 'LARISSA E MATHEUS - A'],
  ['InterRedes', 'Misto Iniciante', 30, 'LAWANA E NONDA - CAIÇ', 'MARIA E HASSAN - MATH', 'PATTY E IURI - BR7']
];

export function RankingLiga() {
  return (
    <main className="pagina-app">
      <section className="cabecalho-pagina">
        <div>
          <p className="subtitulo-pagina">Liga Praiagrandense</p>
          <h1>Ranking da Liga</h1>
          <p className="texto-secundario">
            Resultados oficiais por campeonato e categoria.
          </p>
        </div>
      </section>

      <section className="cartao ranking-liga-card">
        <div className="ranking-liga-header">
          <div>
            <h2>Classificação por categoria</h2>
            <p>Informações fixas por enquanto.</p>
          </div>
        </div>

        <div className="ranking-liga-lista">
          {rankingsLiga.map((item, index) => {
            const [
              campeonato,
              categoria,
              atletasParticipantes,
              primeiroLugar,
              segundoLugar,
              terceiroLugar
            ] = item;

            return (
              <article className="ranking-liga-item" key={`${campeonato}-${categoria}`}>
                <div className="ranking-liga-topo">
                  <div>
                    <span className="ranking-liga-campeonato">{campeonato}</span>
                    <h3>{categoria}</h3>
                  </div>

                  <span className="ranking-liga-participantes">
                    {atletasParticipantes} atletas
                  </span>
                </div>

                <div className="ranking-liga-podio">
                  <div className="ranking-liga-posicao primeiro">
                    <span>1º lugar</span>
                    <strong>{primeiroLugar}</strong>
                  </div>

                  <div className="ranking-liga-posicao">
                    <span>2º lugar</span>
                    <strong>{segundoLugar}</strong>
                  </div>

                  <div className="ranking-liga-posicao">
                    <span>3º lugar</span>
                    <strong>{terceiroLugar}</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}