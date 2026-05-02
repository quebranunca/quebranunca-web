import { HomeCardCampeonato } from './HomeCardCampeonato';
import { HomeSecaoCabecalho } from './HomeSecaoCabecalho';

export function HomeProximosCampeonatos({ campeonatos, categoriasPorCompeticao }) {
  return (
    <section className="home-secao">
      <HomeSecaoCabecalho
        titulo="Próximos campeonatos"
        descricao="Eventos programados ou em andamento."
      />

      <div className="grade-cartoes home-grade">
        {campeonatos.map((competicao) => (
          <HomeCardCampeonato
            key={competicao.id}
            competicao={competicao}
            categorias={categoriasPorCompeticao[competicao.id] || []}
          />
        ))}
        {campeonatos.length === 0 && (
          <article className="cartao-lista">
            <h3>Nenhum campeonato próximo</h3>
            <p>Assim que houver campeonato cadastrado, ele aparecerá aqui.</p>
          </article>
        )}
      </div>
    </section>
  );
}
