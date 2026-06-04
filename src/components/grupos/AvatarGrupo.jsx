import { useEffect, useState } from 'react';
import { FaUsers } from 'react-icons/fa';
import { resolverUrlRecurso } from '../../services/http';
import { obterIniciaisAvatar } from '../AvatarUsuario';

const classesTamanho = {
  sm: 'avatar-usuario-sm',
  md: 'avatar-usuario-md',
  lg: 'avatar-usuario-lg',
  xl: 'avatar-usuario-xl'
};

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
  crossOrigin
}) {
  const [imagemComErro, setImagemComErro] = useState(false);
  const nomeGrupo = nome || grupo?.nome || grupo?.Nome || '';
  const urlImagem = resolverUrlRecurso(imagemUrl || obterImagemGrupoAvatar(grupo));
  const exibirImagem = Boolean(urlImagem) && !imagemComErro;
  const classeTamanho = classesTamanho[tamanho] || classesTamanho.md;
  const possuiNome = Boolean(String(nomeGrupo || '').trim());

  useEffect(() => {
    setImagemComErro(false);
  }, [urlImagem]);

  return (
    <span className={`avatar-usuario avatar-grupo ${classeTamanho} ${className}`.trim()} aria-label={nomeGrupo ? `Avatar do grupo ${nomeGrupo}` : 'Avatar do grupo'}>
      {exibirImagem ? (
        <img
          src={urlImagem}
          alt={alt ?? (nomeGrupo ? `Foto do grupo ${nomeGrupo}` : 'Foto do grupo')}
          crossOrigin={crossOrigin}
          onError={() => setImagemComErro(true)}
        />
      ) : (
        <span className="avatar-usuario-iniciais avatar-grupo-fallback">
          {possuiNome ? obterIniciaisAvatar(nomeGrupo) : <FaUsers aria-hidden="true" />}
        </span>
      )}
    </span>
  );
}
