import { useLocation, useNavigate } from 'react-router-dom';
import { AppHero } from '../components/AppHero';
import { RegistrarPartidaNovoContainer } from '../containers/partidas/RegistrarPartidaNovoContainer';
import { useAutenticacao } from '../hooks/useAutenticacao';
import '../components/partidas/registrar-partida-novo.css';

function normalizarDestinoInterno(origem) {
  if (!origem) {
    return '';
  }

  if (typeof origem === 'string') {
    const destino = origem.trim();
    return destino.startsWith('/') && !destino.startsWith('//') ? destino : '';
  }

  const pathname = typeof origem.pathname === 'string' ? origem.pathname : '';
  if (!pathname.startsWith('/') || pathname.startsWith('//')) {
    return '';
  }

  const search = typeof origem.search === 'string' && origem.search.startsWith('?') ? origem.search : '';
  const hash = typeof origem.hash === 'string' && origem.hash.startsWith('#') ? origem.hash : '';
  return `${pathname}${search}${hash}`;
}

function obterOrigemEstado(location) {
  return normalizarDestinoInterno(
    location.state?.origem ||
    location.state?.from ||
    location.state?.returnTo
  );
}

function obterDestinoFechamento(location) {
  const origemEstado = obterOrigemEstado(location);
  if (origemEstado) {
    return origemEstado;
  }

  const parametros = new URLSearchParams(location.search);
  const grupoId = parametros.get('grupoId');
  const categoriaId = parametros.get('categoriaId');

  if (grupoId) {
    return `/grupos/${grupoId}`;
  }

  if (categoriaId) {
    return `/partidas/consulta?categoriaId=${categoriaId}`;
  }

  return '/app';
}

export function PaginaRegistrarPartidas() {
  const navegar = useNavigate();
  const location = useLocation();
  const { usuario } = useAutenticacao();
  const parametros = new URLSearchParams(location.search);
  const contextoInicial = {
    competicaoId: parametros.get('competicaoId') || null,
    grupoId: parametros.get('grupoId') || null,
    categoriaId: parametros.get('categoriaId') || null
  };

  function fecharModal() {
    navegar(obterDestinoFechamento(location), { replace: true });
  }

  return (
    <section className="pagina registrar-partida-pagina">
      <AppHero
        title="Registrar partida"
        subtitle="Informe grupo, atletas e resultado."
        accountUser={usuario}
        autenticado={Boolean(usuario)}
        showBackButton
        onBack={fecharModal}
        variant="page"
      />

      <div className="registrar-partida-pagina__conteudo">
        <RegistrarPartidaNovoContainer
          onFechar={fecharModal}
          contextoInicial={contextoInicial}
          modoExibicao="pagina"
        />
      </div>
    </section>
  );
}
