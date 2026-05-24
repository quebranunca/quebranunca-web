import { Link } from 'react-router-dom';
import { useNavegacaoPerfilAtleta } from '../hooks/useNavegacaoPerfilAtleta';
import { obterNomeExibicaoAtleta, obterTituloAtleta } from '../utils/atletaUtils';

export function AtletaPerfilLink({
  atleta,
  atletaId,
  children,
  className = '',
  title,
  ariaLabel,
  state,
  onClick
}) {
  const { obterRotaPerfilAtleta } = useNavegacaoPerfilAtleta();
  const destino = obterRotaPerfilAtleta(atleta || atletaId);
  const nome = obterTituloAtleta(atleta) || obterNomeExibicaoAtleta(atleta) || 'atleta';

  if (!destino) {
    return className ? <span className={className}>{children}</span> : children;
  }

  return (
    <Link
      to={destino}
      state={state}
      className={`atleta-perfil-link ${className}`.trim()}
      title={title || `Abrir perfil de ${nome}`}
      aria-label={ariaLabel || `Abrir perfil de ${nome}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
