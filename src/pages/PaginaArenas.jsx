import { useEffect, useState } from 'react';
import { AppHero } from '../components/AppHero';
import { ArenasListPage } from '../components/arenas/ArenasListPage';
import '../components/arenas/arena-publico.css';
import { arenaService } from '../services/arenaService';
import { extrairMensagemErro } from '../utils/erros';

const estadoInicialFiltros = {
  termoBusca: '',
  cidade: '',
  estado: '',
  tipoArena: ''
};

export function PaginaArenas() {
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
