import { useEffect, useState } from 'react';
import { FaUser } from 'react-icons/fa';
import { resolverUrlRecurso } from '../services/http';

const classesTamanho = {
  sm: 'avatar-usuario-sm',
  md: 'avatar-usuario-md',
  lg: 'avatar-usuario-lg',
  xl: 'avatar-usuario-xl'
};

export function obterIniciaisAvatar(nome) {
  const partes = String(nome || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!partes.length) {
    return '?';
  }

  return partes
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
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
  crossOrigin
}) {
  const [imagemComErro, setImagemComErro] = useState(false);
  const urlImagem = resolverUrlRecurso(fotoPerfilUrl);
  const exibirImagem = Boolean(urlImagem) && !imagemComErro;
  const possuiNome = Boolean(String(nome || '').trim());
  const classeTamanho = classesTamanho[tamanho] || classesTamanho.md;

  useEffect(() => {
    setImagemComErro(false);
  }, [fotoPerfilUrl]);

  return (
    <span className={`avatar-usuario ${classeTamanho} ${className}`.trim()} aria-label={nome ? `Avatar de ${nome}` : 'Avatar'}>
      {exibirImagem ? (
        <img
          src={urlImagem}
          alt={alt ?? (nome ? `Foto de ${nome}` : 'Foto de perfil')}
          crossOrigin={crossOrigin}
          onError={() => setImagemComErro(true)}
        />
      ) : (
        <span className="avatar-usuario-iniciais">
          {possuiNome ? obterIniciaisAvatar(nome) : <FaUser aria-hidden="true" />}
        </span>
      )}
    </span>
  );
}
