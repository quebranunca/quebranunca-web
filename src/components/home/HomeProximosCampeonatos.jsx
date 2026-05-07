import { HomeCardCampeonato } from './HomeCardCampeonato';
import { HomeSecaoCabecalho } from './HomeSecaoCabecalho';

export function HomeProximosCampeonatos({ campeonatos, categoriasPorCompeticao }) {
  return (
    <section className="home-secao">
      <HomeSecaoCabecalho   
        titulo="Próximos Campeonatos"
        descricao="Fique por dentro dos próximos campeonatos e prepare-se para competir!"
        linkTexto="Competições"
        linkPara="/competicoes"
      />

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
