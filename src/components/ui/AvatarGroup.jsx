import { Avatar } from './Avatar';
import './avatar.css';

function normalizarAvatares(avatars) {
  return Array.isArray(avatars) ? avatars.filter(Boolean).slice(0, 2) : [];
}

export function AvatarGroup({
  avatars,
  size = 'sm',
  type = 'athlete',
  className = '',
  title,
  ariaLabel
}) {
  const itens = normalizarAvatares(avatars);

  if (!itens.length) {
    return (
      <span
        className={`avatar-group avatar-group--empty ${className}`.trim()}
        role="group"
        aria-label={ariaLabel || 'Sem atletas'}
      >
        <Avatar name="QuebraNunca" size={size} type={type} />
      </span>
    );
  }

  const nomes = itens
    .map((item) => String(item.name || item.nome || '').trim())
    .filter(Boolean)
    .join(' e ');

  return (
    <span
      className={`avatar-group ${className}`.trim()}
      role="group"
      aria-label={ariaLabel || title || nomes || 'Avatares da dupla'}
      title={title || nomes || undefined}
    >
      {itens.map((item, index) => (
        <Avatar
          key={item.id || item.atletaId || item.name || item.nome || index}
          name={item.name || item.nome}
          src={item.src || item.fotoPerfilUrl || item.avatarUrl}
          alt={item.alt}
          size={size}
          type={item.type || type}
          status={item.status}
          className="avatar-group__item"
        />
      ))}
    </span>
  );
}

export default AvatarGroup;
