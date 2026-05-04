import { useNavigate } from 'react-router-dom';

const rankingPreview = [
  {
    campeonato: '3 Etapa Feminino',
    categoria: 'Carrega',
    primeiro: 'BIA FARIAS E FLAVIA'
  },
  {
    campeonato: 'InterRedes',
    categoria: 'Masculino Estreante',
    primeiro: 'FOGUINHO E JOÃO - AR'
  },
  {
    campeonato: 'InterRedes',
    categoria: 'Misto Iniciante',
    primeiro: 'LAWANA E NONDA - CAIÇ'
  }
];

export function HomeRankingLiga() {
  const navigate = useNavigate();

  function irParaRanking() {
    navigate('/ranking/liga');
  }

  return (
    <article className="cartao home-ranking-liga">
      <div className="home-ranking-header">
        <div>
          <span className="badge-liga">Liga</span>
          <h2>Ranking da Liga</h2>
          <p>Confira os últimos resultados</p>
        </div>
      </div>

      <div className="home-ranking-lista">
        {rankingPreview.map((item, index) => (
          <div className="home-ranking-item" key={index}>
            <div className="home-ranking-info">
              <span className="home-ranking-campeonato">
                {item.campeonato}
              </span>
              <strong>{item.categoria}</strong>
            </div>

            <div className="home-ranking-primeiro">
              <span>1º</span>
              <p>{item.primeiro}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="botao-primario home-ranking-cta"
        onClick={irParaRanking}
      >
        Ver ranking completo
      </button>
    </article>
  );
}