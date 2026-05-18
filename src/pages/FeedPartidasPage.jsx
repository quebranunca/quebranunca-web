import { useEffect, useState } from 'react';
import { FaRedo } from 'react-icons/fa';
import { FeedPartidaCard } from '../components/partidas/FeedPartidaCard';
import { partidaFeedServico } from '../services/partidaFeedServico';
import { extrairMensagemErro } from '../utils/erros';
import '../components/partidas/feed-partidas.css';

const tamanhoPagina = 10;

export function FeedPartidasPage() {
  const [itens, setItens] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState('');
  const [temMais, setTemMais] = useState(true);

  async function carregarFeed(proximaPagina = 1, acumular = false) {
    if (acumular) {
      setCarregandoMais(true);
    } else {
      setCarregando(true);
    }
    setErro('');

    try {
      const resposta = await partidaFeedServico.listar({ page: proximaPagina, pageSize: tamanhoPagina });
      const novosItens = resposta.itens || [];
      setItens((atuais) => (acumular ? [...atuais, ...novosItens] : novosItens));
      setPagina(resposta.page || proximaPagina);
      setTemMais(novosItens.length === tamanhoPagina);
    } catch (falha) {
      setErro(extrairMensagemErro(falha));
    } finally {
      setCarregando(false);
      setCarregandoMais(false);
    }
  }

  useEffect(() => {
    carregarFeed();
  }, []);

  return (
    <section className="pagina feed-partidas-page">
      <header className="feed-partidas-header">
        <div>
          <span>Feed QNF</span>
          <h1>Últimos jogos</h1>
          <p>Partidas registradas pela comunidade, com ou sem mídia.</p>
        </div>
        <button type="button" className="botao-secundario botao-compacto" onClick={() => carregarFeed()} disabled={carregando}>
          <FaRedo aria-hidden="true" />
          Atualizar
        </button>
      </header>

      {carregando && <p className="feed-partidas-estado">Carregando feed...</p>}
      {erro && !carregando && <p className="texto-erro feed-partidas-estado">{erro}</p>}
      {!carregando && !erro && itens.length === 0 && (
        <p className="feed-partidas-estado">As próximas partidas registradas aparecerão aqui.</p>
      )}

      <div className="feed-partidas-lista">
        {itens.map((partida) => (
          <FeedPartidaCard key={partida.partidaId} partida={partida} />
        ))}
      </div>

      {!carregando && !erro && temMais && (
        <button
          type="button"
          className="botao-secundario feed-partidas-carregar"
          onClick={() => carregarFeed(pagina + 1, true)}
          disabled={carregandoMais}
        >
          {carregandoMais ? 'Carregando...' : 'Carregar mais'}
        </button>
      )}
    </section>
  );
}
