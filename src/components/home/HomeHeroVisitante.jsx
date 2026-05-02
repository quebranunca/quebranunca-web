export function HomeHeroVisitante({ resumoPlataforma }) {
  return (
    <article className="cartao home-hero">
      <div className="home-hero-conteudo">
        <h2>Registre seus jogos, crie o grupo e monte seu ranking.</h2>
        <p>
          Acompanhe os próximos campeonatos, entre nas inscrições abertas e consulte os rankings dos torneios já realizados.
        </p>
      </div>
      <div className="home-hero-resumo" aria-label="Resumo da plataforma">
        <div>
          <span>{resumoPlataforma.atletas}</span>
          <small>Atletas</small>
        </div>
        <div>
          <span>{resumoPlataforma.jogos}</span>
          <small>Jogos</small>
        </div>
        <div>
          <span>{resumoPlataforma.grupos}</span>
          <small>Grupos</small>
        </div>
      </div>
    </article>
  );
}
