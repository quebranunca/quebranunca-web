import { Avatar } from '../ui/Avatar';

export function obterImagemGrupoAvatar(grupo) {
  if (!grupo) {
    return '';
  }

  const imagem = grupo.imagemUrl
    || grupo.ImagemUrl
    || grupo.fotoUrl
    || grupo.avatarUrl
    || grupo.urlImagem
    || '';

  return typeof imagem === 'string' ? imagem.trim() : imagem;
}

export function AvatarGrupo({
  grupo,
  nome,
  imagemUrl,
  tamanho = 'md',
  className = '',
  alt,
  crossOrigin,
  status,
  title
}) {
  const nomeGrupo = nome || grupo?.nome || grupo?.Nome || '';

  return (
    <Avatar
      name={nomeGrupo}
      src={imagemUrl || obterImagemGrupoAvatar(grupo)}
      alt={alt ?? (nomeGrupo ? `Foto do grupo ${nomeGrupo}` : 'Foto do grupo')}
      size={tamanho}
      type="group"
      status={status}
      className={`avatar-grupo ${className}`.trim()}
      title={title}
      crossOrigin={crossOrigin}
    />
  );
}
