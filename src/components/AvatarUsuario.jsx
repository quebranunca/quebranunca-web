import { useEffect, useState } from 'react';

const classesTamanho = {
  sm: 'avatar-usuario-sm',
  md: 'avatar-usuario-md',
  lg: 'avatar-usuario-lg',
  xl: 'avatar-usuario-xl'
};

export function obterIniciaisAvatar(nome) {
  const partes = String(nome || 'QNF')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!partes.length) {
    return 'QNF';
  }

  return partes
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

export function AvatarUsuario({
  nome,
  fotoPerfilUrl,
  tamanho = 'md',
  className = '',
  alt
}) {
  const [imagemComErro, setImagemComErro] = useState(false);
  const exibirImagem = Boolean(fotoPerfilUrl) && !imagemComErro;
  const classeTamanho = classesTamanho[tamanho] || classesTamanho.md;

  useEffect(() => {
    setImagemComErro(false);
  }, [fotoPerfilUrl]);

  return (
    <span className={`avatar-usuario ${classeTamanho} ${className}`.trim()} aria-label={nome ? `Avatar de ${nome}` : 'Avatar'}>
      {exibirImagem ? (
        <img
          src={fotoPerfilUrl}
          alt={alt ?? (nome ? `Foto de ${nome}` : 'Foto de perfil')}
          onError={() => setImagemComErro(true)}
        />
      ) : (
        <span className="avatar-usuario-iniciais">{obterIniciaisAvatar(nome)}</span>
      )}
    </span>
  );
}
