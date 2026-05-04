import { HomeCardCampeonato } from './HomeCardCampeonato';
import { HomeSecaoCabecalho } from './HomeSecaoCabecalho';

export function HomeProximosCampeonatos({ campeonatos, categoriasPorCompeticao }) {
  return (
    <section className="home-secao">
      <HomeSecaoCabecalho    />

      <div className="grade-cartoes home-grade">
        {campeonatos.map((competicao) => (
          <HomeCardCampeonato
            key={competicao.id}
            competicao={competicao}
            categorias={categoriasPorCompeticao[competicao.id] || []}
          />
        ))}
      </div>
    </section>
  );
}
