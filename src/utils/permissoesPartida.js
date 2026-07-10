import { ehAdministrador } from './perfis';

export function podeEditarPartida(partida, usuario) {
  if (!partida?.id || !usuario?.id) {
    return false;
  }

  if (typeof partida.podeEditar === 'boolean') {
    return partida.podeEditar;
  }

  return ehAdministrador(usuario) || partida.criadoPorUsuarioId === usuario.id;
}

export function podeExcluirPartida(partida, usuario) {
  if (!partida?.id || !usuario?.id) {
    return false;
  }

  if (typeof partida.podeExcluirDefinitivamente === 'boolean') {
    return partida.podeExcluirDefinitivamente;
  }

  return ehAdministrador(usuario);
}
