import { useLocation, useNavigate } from 'react-router-dom';
import { RegistrarPartidaNovoContainer } from '../containers/partidas/RegistrarPartidaNovoContainer';
import '../components/partidas/registrar-partida-novo.css';

function obterDestinoFechamento(location) {
  const parametros = new URLSearchParams(location.search);
  const grupoId = parametros.get('grupoId');
  const categoriaId = parametros.get('categoriaId');

  if (grupoId) {
    return `/partidas/consulta?grupoId=${grupoId}`;
  }

  if (categoriaId) {
    return `/partidas/consulta?categoriaId=${categoriaId}`;
  }

  return '/minhas-partidas?filtro=registradas';
}

export function PaginaRegistrarPartidas() {
  const navegar = useNavigate();
  const location = useLocation();
  const parametros = new URLSearchParams(location.search);
  const contextoInicial = {
    competicaoId: parametros.get('competicaoId') || null,
    grupoId: parametros.get('grupoId') || null,
    categoriaId: parametros.get('categoriaId') || null
  };

  function fecharModal() {
    navegar(obterDestinoFechamento(location), { replace: true });
  }

  return <RegistrarPartidaNovoContainer onFechar={fecharModal} contextoInicial={contextoInicial} />;
}
