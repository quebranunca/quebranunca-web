export const STATUS_PARTIDA = {
  agendada: 1,
  encerrada: 2
};

export const STATUS_APROVACAO_PARTIDA = {
  pendente: 1,
  aprovada: 2,
  contestada: 3,
  pendenteDeVinculos: 4
};

export function obterNomeStatusPartida(status) {
  switch (Number(status)) {
    case STATUS_PARTIDA.agendada:
      return 'Agendada';
    case STATUS_PARTIDA.encerrada:
      return 'Encerrada';
    default:
      return 'Indefinida';
  }
}

export function obterClasseStatusPartida(status) {
  return Number(status) === STATUS_PARTIDA.encerrada ? 'tag-status-sucesso' : 'tag-status-alerta';
}

export function obterNomeStatusAprovacao(status) {
  switch (Number(status)) {
    case STATUS_APROVACAO_PARTIDA.pendente:
      return 'Pendente';
    case STATUS_APROVACAO_PARTIDA.aprovada:
      return 'Aprovada';
    case STATUS_APROVACAO_PARTIDA.contestada:
      return 'Contestada';
    case STATUS_APROVACAO_PARTIDA.pendenteDeVinculos:
      return 'Pendente de vínculos';
    default:
      return 'Indefinida';
  }
}

export function obterClasseStatusAprovacao(status) {
  switch (Number(status)) {
    case STATUS_APROVACAO_PARTIDA.aprovada:
      return 'tag-status-sucesso';
    case STATUS_APROVACAO_PARTIDA.contestada:
      return 'tag-status-erro';
    default:
      return 'tag-status-alerta';
  }
}

export function obterTextoStatusAprovacaoHome(status) {
  switch (Number(status)) {
    case STATUS_APROVACAO_PARTIDA.aprovada:
      return 'Partida aprovada';
    case STATUS_APROVACAO_PARTIDA.contestada:
      return 'Partida contestada';
    default:
      return 'Aguardando aprovação';
  }
}

export function obterAtletasPartida(partida, atletaLogadoId) {
  return {
    duplaA: [
      {
        id: partida.duplaAAtleta1Id,
        nome: partida.nomeDuplaAAtleta1,
        lado: 'Direita',
        destaque: partida.duplaAAtleta1Id === atletaLogadoId
      },
      {
        id: partida.duplaAAtleta2Id,
        nome: partida.nomeDuplaAAtleta2,
        lado: 'Esquerda',
        destaque: partida.duplaAAtleta2Id === atletaLogadoId
      }
    ],
    duplaB: [
      {
        id: partida.duplaBAtleta1Id,
        nome: partida.nomeDuplaBAtleta1,
        lado: 'Direita',
        destaque: partida.duplaBAtleta1Id === atletaLogadoId
      },
      {
        id: partida.duplaBAtleta2Id,
        nome: partida.nomeDuplaBAtleta2,
        lado: 'Esquerda',
        destaque: partida.duplaBAtleta2Id === atletaLogadoId
      }
    ]
  };
}

export function atletaEstaNaDuplaA(partida, atletaLogadoId) {
  return partida.duplaAAtleta1Id === atletaLogadoId || partida.duplaAAtleta2Id === atletaLogadoId;
}

export function atletaEstaNaDuplaB(partida, atletaLogadoId) {
  return partida.duplaBAtleta1Id === atletaLogadoId || partida.duplaBAtleta2Id === atletaLogadoId;
}

export function obterDuplasDoAtleta(partida, atletaLogadoId) {
  const atletas = obterAtletasPartida(partida, atletaLogadoId);
  const estaNaDuplaA = atletaEstaNaDuplaA(partida, atletaLogadoId);

  return {
    minhaDupla: estaNaDuplaA ? atletas.duplaA : atletas.duplaB,
    duplaAdversaria: estaNaDuplaA ? atletas.duplaB : atletas.duplaA
  };
}

export function partidaTemPlacarValido(partida) {
  const placarA = Number(partida.placarDuplaA);
  const placarB = Number(partida.placarDuplaB);

  return Number(partida.status) === STATUS_PARTIDA.encerrada
    && Number.isFinite(placarA)
    && Number.isFinite(placarB)
    && placarA >= 0
    && placarB >= 0
    && placarA !== placarB
    && Boolean(partida.duplaVencedoraId);
}

export function obterResultadoAtleta(partida, atletaLogadoId, opcoes = {}) {
  const {
    textoPendente = 'Jogo agendado',
    textoInvalido = 'Sem vencedora'
  } = opcoes;

  if (!partidaTemPlacarValido(partida)) {
    const texto = Number(partida.status) === STATUS_PARTIDA.encerrada ? textoInvalido : textoPendente;
    return { texto, classe: 'tag-status-alerta' };
  }

  const estaNaDuplaA = atletaEstaNaDuplaA(partida, atletaLogadoId);
  const estaNaDuplaB = atletaEstaNaDuplaB(partida, atletaLogadoId);
  const venceu = (estaNaDuplaA && partida.duplaVencedoraId === partida.duplaAId)
    || (estaNaDuplaB && partida.duplaVencedoraId === partida.duplaBId);

  return venceu
    ? { texto: 'Vitória', classe: 'tag-status-sucesso' }
    : { texto: 'Derrota', classe: 'tag-status-erro' };
}

export function ordenarPartidasRecentes(partidas) {
  return [...(partidas || [])].sort((a, b) => {
    const dataA = new Date(a.dataPartida || a.dataCriacao || 0).getTime();
    const dataB = new Date(b.dataPartida || b.dataCriacao || 0).getTime();
    return dataB - dataA;
  });
}
