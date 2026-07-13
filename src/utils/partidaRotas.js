export function obterRotaDetalhePartida(partidaOuId) {
  const partidaId = typeof partidaOuId === 'string'
    ? partidaOuId
    : partidaOuId?.id ?? partidaOuId?.partidaId;

  return partidaId ? `/app/partidas/${partidaId}` : '/minhas-partidas';
}
