import { ehAdministrador } from './perfis';

export function podeEditarPartida(partida, usuario) {
  if (!partida?.id || !usuario?.id) {
    return false;
  }

  return ehAdministrador(usuario) || partida.criadoPorUsuarioId === usuario.id;
}
