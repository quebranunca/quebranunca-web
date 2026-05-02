import { Link } from 'react-router-dom';
import { formatarData } from '../../utils/formatacao';
import { HomeSecaoCabecalho } from './HomeSecaoCabecalho';

export function HomeRankingsRealizados({ campeonatos }) {
  return (
    <section className="home-secao">
      <HomeSecaoCabecalho
        titulo="Rankings de campeonatos realizados"
        descricao="Consulte a classificação dos campeonatos encerrados."
        linkTexto="Ver todos"
        linkPara="/ranking?tipo=competicao"
      />

      <div className="grade-cartoes home-grade">
        {campeonatos.map((competicao) => (
          <Link
            key={competicao.id}
            to={`/ranking?tipo=competicao&competicaoId=${competicao.id}`}
            className="cartao-lista home-lista-link home-ranking-link"
          >
            <strong>{competicao.nome}</strong>
            <span>Encerrado em {formatarData(competicao.dataFim)}</span>
            <small>Ver ranking do campeonato</small>
          </Link>
        ))}
        {campeonatos.length === 0 && (
          <article className="cartao-lista">
            <p>Nenhum campeonato realizado com ranking disponível ainda.</p>
          </article>
        )}
      </div>
    </section>
  );
}
