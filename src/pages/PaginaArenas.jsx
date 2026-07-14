import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import { AppHero } from '../components/AppHero';
import { ArenasListPage } from '../components/arenas/ArenasListPage';
import '../components/arenas/arena-publico.css';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { arenaService } from '../services/arenaService';
import { extrairMensagemErro } from '../utils/erros';

const estadoInicialFiltros = {
  termoBusca: '',
  cidade: '',
  estado: '',
  tipoArena: ''
};

export function PaginaArenas() {
  const { token } = useAutenticacao();
  const [arenas, setArenas] = useState([]);
  const [filtros, setFiltros] = useState(estadoInicialFiltros);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregarArenas() {
      setCarregando(true);
      setErro('');

      try {
        const lista = await arenaService.listarArenas(filtros);
        if (ativo) {
          setArenas(lista || []);
        }
      } catch (error) {
        if (ativo) {
          setErro(extrairMensagemErro(error));
          setArenas([]);
        }
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
  }, [filtros]);

  function atualizarFiltros(parciais) {
    setFiltros((anterior) => ({ ...anterior, ...parciais }));
  }

  function limparFiltros() {
    setFiltros(estadoInicialFiltros);
  }

  return (
    <section className="pagina arenas-pagina">
      <AppHero
        title="Arenas"
        subtitle="Locais onde a comunidade joga."
        actions={Boolean(token) ? (
          <Link to="/minhas-arenas" className="botao-secundario botao-compacto" aria-label="Adicionar ou gerenciar arena">
            <FaPlus aria-hidden="true" />
            <span>Adicionar</span>
          </Link>
        ) : null}
        autenticado={Boolean(token)}
        showBackButton={Boolean(token)}
        variant="page"
      />

      <ArenasListPage
        arenas={arenas}
        carregando={carregando}
        erro={erro}
        filtros={filtros}
        onFiltrosChange={atualizarFiltros}
        onLimparFiltros={limparFiltros}
      />
    </section>
  );
}
