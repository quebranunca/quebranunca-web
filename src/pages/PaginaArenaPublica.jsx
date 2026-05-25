import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArenaPublicProfilePage } from '../components/arenas/ArenaPublicProfilePage';
import '../components/arenas/arena-publico.css';
import { arenaService } from '../services/arenaService';
import { extrairMensagemErro } from '../utils/erros';

export function PaginaArenaPublica() {
  const { slug } = useParams();
  const [arena, setArena] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [naoEncontrada, setNaoEncontrada] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarArena() {
      setCarregando(true);
      setErro('');
      setNaoEncontrada(false);

      try {
        const dados = await arenaService.obterArenaPorSlug(slug);
        if (ativo) {
          setArena(dados);
        }
      } catch (error) {
        if (!ativo) {
          return;
        }

        if (error?.response?.status === 404) {
          setNaoEncontrada(true);
          return;
        }

        setErro(extrairMensagemErro(error));
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarArena();

    return () => {
      ativo = false;
    };
  }, [slug]);

  return (
    <section className="pagina">
      <div className="cabecalho-pagina">
        <h2>Perfil público da arena</h2>
        <p>Conheça o espaço, a localização e os recursos públicos de cada arena da comunidade.</p>
      </div>

      <ArenaPublicProfilePage
        arena={arena}
        carregando={carregando}
        erro={erro}
        naoEncontrada={naoEncontrada}
      />
    </section>
  );
}
