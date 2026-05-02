import { Link } from 'react-router-dom';
import { obterLinkHttp } from '../../utils/links';

export function HomeCategoriasCampeonato({ competicao, categorias }) {
  const linkInscricao = obterLinkHttp(competicao.link);
  const inscricoesAbertas = Boolean(competicao.inscricoesAbertas);

  if (categorias.length === 0) {
    return null;
  }

  return (
    <div className="home-card-categorias" aria-label={`Categorias de ${competicao.nome}`}>
      {categorias.map((categoria) => (
        <div key={categoria.id} className="home-card-categoria-item">
          <span>{categoria.nome}</span>
          {!inscricoesAbertas ? (
            <button
              type="button"
              className="botao-secundario botao-compacto home-card-categoria-acao"
              disabled
              title="As inscrições deste campeonato estão fechadas."
            >
              Inscrever dupla
            </button>
          ) : linkInscricao ? (
            <a
              href={linkInscricao}
              target="_blank"
              rel="noopener noreferrer"
              className="botao-secundario botao-compacto home-card-categoria-acao"
            >
              Inscrever dupla
            </a>
          ) : (
            <Link
              to={`/inscricoes?campeonatoId=${competicao.id}&categoriaId=${categoria.id}`}
              className="botao-secundario botao-compacto home-card-categoria-acao"
            >
              Inscrever dupla
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
