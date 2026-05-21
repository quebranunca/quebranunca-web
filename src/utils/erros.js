export function extrairMensagemErro(erro) {
  if (erro?.response?.data?.erro) {
    return erro.response.data.erro;
  }

  if (erro?.response?.data?.message) {
    return erro.response.data.message;
  }

  if (erro?.message) {
    return erro.message;
  }

  return 'Ocorreu um erro inesperado.';
}

export function ehConfirmacaoDuplicidadePartida(erro) {
  return erro?.response?.status === 409 &&
    erro?.response?.data?.codigo === 'PARTIDA_DUPLICADA_CONFIRMAR';
}

export function extrairConfirmacaoDuplicidadePartida(erro) {
  const dados = erro?.response?.data || {};

  return {
    codigo: dados.codigo || 'PARTIDA_DUPLICADA_CONFIRMAR',
    mensagem: dados.mensagem || dados.erro || 'Já existe uma partida registrada hoje com os mesmos atletas e o mesmo placar.',
    correlationId: dados.correlationId
  };
}
