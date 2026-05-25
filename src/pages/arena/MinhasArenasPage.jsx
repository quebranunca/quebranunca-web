import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArenaAdminCard } from '../../components/arenas/ArenaAdminCard';
import { arenaService } from '../../services/arenaService';
import '../../components/arenas/arena-publico.css';

function extrairMensagemErro(erro) {
  return erro?.response?.data?.mensagem || erro?.response?.data?.message || erro?.message || 'Não foi possível carregar as arenas.';
}

export function MinhasArenasPage() {
  const [arenas, setArenas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregarArenas() {
      setCarregando(true);
      setErro('');

      try {
        const dados = await arenaService.listarMinhasArenas();
        if (!ativo) {
          return;
        }

        setArenas(Array.isArray(dados) ? dados : []);
      } catch (error) {
        if (!ativo) {
          return;
        }

        setErro(extrairMensagemErro(error));
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarArenas();

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className="pagina-arena-admin">
      <section className="arena-admin-page__cabecalho">
        <div>
          <p className="arena-admin-page__breadcrumb">Painel de administração</p>
          <h1>Minhas arenas</h1>
          <p className="arena-admin-page__descricao">
            Acompanhe as arenas que você administra e acesse rapidamente o dashboard de cada uma.
          </p>
        </div>

        <div className="arena-admin-page__acoes">
          <Link to="/arenas" className="botao-secundario">
            Ver catálogo público
          </Link>
        </div>
      </section>

      {carregando && (
        <section className="arena-admin-page__estado arena-admin-page__estado--carregando">
          <p>Carregando arenas...</p>
        </section>
      )}

      {!carregando && erro && (
        <section className="arena-admin-page__estado arena-admin-page__estado--erro">
          <h2>Não foi possível carregar as arenas</h2>
          <p>{erro}</p>
        </section>
      )}

      {!carregando && !erro && arenas.length === 0 && (
        <section className="arena-admin-page__estado arena-admin-page__estado--vazio">
          <h2>Nenhuma arena para gerenciar</h2>
          <p>Você ainda não tem acessos de administração em arenas. Peça acesso ao responsável ou atualize o vínculo com a arena.</p>
        </section>
      )}

      {!carregando && !erro && arenas.length > 0 && (
        <section className="arena-admin-page__grid">
          {arenas.map((arena) => (
            <ArenaAdminCard key={arena.id} arena={arena} />
          ))}
        </section>
      )}
    </div>
  );
}
