import { RegistrarPartidaNovoContainer } from '../../containers/partidas/RegistrarPartidaNovoContainer';

export function EditarPartidaRegistradaModal({ partida, salvando, erro, onSalvar, onFechar }) {
  if (!partida) {
    return null;
  }

  return (
    <RegistrarPartidaNovoContainer
      modo="edicao"
      partidaInicial={partida}
      salvandoExterno={salvando}
      erroExterno={erro}
      onSalvarEdicao={onSalvar}
      onFechar={onFechar}
    />
  );
}
