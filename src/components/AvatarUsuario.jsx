import { Avatar, obterLetraAvatar } from './ui/Avatar';

export function obterIniciaisAvatar(nome) {
  return obterLetraAvatar(nome);
}

export function obterFotoPerfilAvatar(item) {
  if (!item) {
    return '';
  }

  const fotoUrl = item.fotoPerfilUrl
    || item.FotoPerfilUrl
    || item.usuarioFotoPerfilUrl
    || item.atletaFotoPerfilUrl
    || item.imagemPerfilUrl
    || item.profileImageUrl
    || item.profilePhotoUrl
    || item.fotoUrl
    || item.urlFoto
    || item.avatarUrl
    || item.atleta?.fotoPerfilUrl
    || item.atleta?.avatarUrl
    || '';

  return typeof fotoUrl === 'string' ? fotoUrl.trim() : fotoUrl;
}

export function AvatarUsuario({
  nome,
  fotoPerfilUrl,
  tamanho = 'md',
  className = '',
  alt,
  crossOrigin,
  status,
  title
}) {
  return (
    <Avatar
      name={nome}
      src={fotoPerfilUrl}
      alt={alt ?? (nome ? `Foto de ${nome}` : 'Foto de perfil')}
      size={tamanho}
      type="user"
      status={status}
      className={className}
      title={title}
      crossOrigin={crossOrigin}
    />
  );
}
