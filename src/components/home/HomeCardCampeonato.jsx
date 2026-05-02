import { formatarData } from '../../utils/formatacao';
import { HomeCategoriasCampeonato } from './HomeCategoriasCampeonato';

function obterNomeLocal(competicao) {
  return competicao?.nomeLocal ||
    competicao?.localNome ||
    competicao?.local?.nome ||
    (competicao?.localId ? 'Local cadastrado' : '');
}

export function HomeCardCampeonato({ competicao, categorias = [] }) {
  const nomeLocal = obterNomeLocal(competicao);

  return (
    <article className="cartao-lista home-card-campeonato">
      <div className="home-card-topo">
        <div className="home-card-topo-resumo">
          <span className={`tag-status ${competicao.inscricoesAbertas ? 'tag-status-sucesso' : 'tag-status-alerta'}`}>
            {competicao.inscricoesAbertas ? 'Inscrições abertas' : 'Inscrições fechadas'}
          </span>
        </div>
      </div>
      <h3>{competicao.nome}</h3>
      {competicao.descricao && <p>{competicao.descricao}</p>}
      <div className="home-card-detalhes">
        <span>Início: {formatarData(competicao.dataInicio)}</span>
        <span>Local: {nomeLocal || 'A definir'}</span>
      </div>
      <HomeCategoriasCampeonato competicao={competicao} categorias={categorias} />
    </article>
  );
}
