import { Link } from 'react-router-dom';

export function HomePendencias({ totalPendencias }) {
  if (totalPendencias <= 0) {
    return null;
  }

  return (
    <section className="home-secao">
      <article className="cartao-lista">
        <div className="linha-entre">
          <div>
            <h3>Pendências</h3>
            <p>
              {totalPendencias === 1
                ? 'Você tem 1 pendência aguardando.'
                : `Você tem ${totalPendencias} pendências aguardando.`}
            </p>
          </div>
          <span className="tag-status tag-status-alerta">Ação necessária</span>
        </div>
        <div className="acoes-item home-usuario-acoes">
          <Link to="/app/pendencias" className="botao-primario">
            Ver pendências
          </Link>
        </div>
      </article>
    </section>
  );
}
