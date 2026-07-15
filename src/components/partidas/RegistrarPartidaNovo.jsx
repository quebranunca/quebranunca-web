import { Link, useLocation } from 'react-router-dom';
import { criarNavegacaoRegistroPartida, obterOrigemAtualParaRegistro } from '../../utils/partidaRotas';
import './registrar-partida-novo.css';

export function RegistrarPartidaNovo({ className = 'botao-primario', children = 'Registrar partida' }) {
  const location = useLocation();
  const navegacaoRegistro = criarNavegacaoRegistroPartida({
    origem: obterOrigemAtualParaRegistro(location)
  });

  return (
    <Link to={navegacaoRegistro.to} state={navegacaoRegistro.state} className={className}>
      {children}
    </Link>
  );
}
