import { Link } from 'react-router-dom';
import { montarUrlDashboardDupla } from '../../utils/atletaUtils';

export function DuplaLink({
  atleta1Id,
  atleta2Id,
  children,
  className = '',
  title,
  tag: Tag = 'span'
}) {
  const href = montarUrlDashboardDupla(atleta1Id, atleta2Id);

  if (!href) {
    return className ? <Tag className={className}>{children}</Tag> : <>{children}</>;
  }

  return (
    <Link
      to={href}
      className={`dupla-link ${className}`.trim()}
      title={title || 'Abrir dashboard da dupla'}
      onClick={(evento) => evento.stopPropagation()}
    >
      {children}
    </Link>
  );
}
