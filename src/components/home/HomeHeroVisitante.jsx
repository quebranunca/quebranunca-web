export function HomeHeroVisitante({ resumoPlataforma }) {
  return (
    <article className="home-hero">
      <div className="home-hero-conteudo">
        <h2>Registre seus jogos, crie o grupo e monte seu ranking.</h2>
        <p>
          Acompanhe campeonatos, entre nas inscrições e veja rankings em tempo real.
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