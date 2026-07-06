import { useEffect, useMemo, useState } from 'react';
import { resolverUrlRecurso } from '../../services/http';
import './avatar.css';

const TAMANHOS_AVATAR = {
  xs: 'avatar--xs',
  sm: 'avatar--sm',
  md: 'avatar--md',
  lg: 'avatar--lg',
  xl: 'avatar--xl'
};

const TIPOS_AVATAR = new Set(['athlete', 'user', 'group', 'default']);

const STATUS_AVATAR = {
  pending: 'avatar--pending',
  pendente: 'avatar--pending',
  confirmed: 'avatar--confirmed',
  confirmado: 'avatar--confirmed'
};

function normalizarStatus(status) {
  return String(status || '').trim().toLowerCase();
}

function obterTextoStatus(status) {
  const statusNormalizado = normalizarStatus(status);

  if (statusNormalizado === 'pending' || statusNormalizado === 'pendente') {
    return 'Status pendente';
  }

  if (statusNormalizado === 'confirmed' || statusNormalizado === 'confirmado') {
    return 'Status confirmado';
  }

  return '';
}

export function obterLetraAvatar(name) {
  const texto = String(name ?? '').trimStart();
  const letra = Array.from(texto).find((caractere) => /\p{L}/u.test(caractere));

  return letra ? letra.toLocaleUpperCase('pt-BR') : 'Q';
}

export function Avatar({
  name,
  src,
  alt,
  size = 'md',
  type = 'default',
  status = 'default',
  className = '',
  title,
  crossOrigin
}) {
  const [imagemComErro, setImagemComErro] = useState(false);
  const urlImagem = useMemo(() => resolverUrlRecurso(src), [src]);
  const exibirImagem = Boolean(urlImagem) && !imagemComErro;
  const nomeAcessivel = String(name ?? '').trim() || 'Avatar QuebraNunca';
  const classeTamanho = TAMANHOS_AVATAR[size] || TAMANHOS_AVATAR.md;
  const tipoNormalizado = TIPOS_AVATAR.has(type) ? type : 'default';
  const statusNormalizado = normalizarStatus(status);
  const classeStatus = STATUS_AVATAR[statusNormalizado] || '';
  const textoStatus = obterTextoStatus(statusNormalizado);

  useEffect(() => {
    setImagemComErro(false);
  }, [urlImagem]);

  const classes = [
    'avatar',
    'avatar-usuario',
    classeTamanho,
    `avatar--${tipoNormalizado}`,
    exibirImagem ? 'avatar--image' : 'avatar--fallback',
    classeStatus,
    className
  ].filter(Boolean).join(' ');

  const atributosFallback = exibirImagem
    ? {}
    : {
        role: 'img',
        'aria-label': nomeAcessivel
      };

  return (
    <span
      className={classes}
      title={title ?? nomeAcessivel}
      data-avatar-type={tipoNormalizado}
      data-avatar-status={statusNormalizado || undefined}
      {...atributosFallback}
    >
      {exibirImagem ? (
        <img
          src={urlImagem}
          alt={alt ?? nomeAcessivel}
          crossOrigin={crossOrigin}
          onError={() => setImagemComErro(true)}
        />
      ) : (
        <span className="avatar__fallback avatar-usuario-iniciais">
          {obterLetraAvatar(name)}
        </span>
      )}

      {textoStatus && (
        <>
          <span className="avatar__status" aria-hidden="true" />
          <span className="sr-only">{textoStatus}</span>
        </>
      )}
    </span>
  );
}

export default Avatar;
