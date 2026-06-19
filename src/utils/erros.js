const CODIGO_DUPLICIDADE_PARTIDA_CONFIRMAR = 'PARTIDA_DUPLICADA_CONFIRMAR';
const MENSAGEM_SERVICO_INDISPONIVEL = 'Não foi possível carregar agora. Tente novamente em instantes.';

export function extrairMensagemErro(erro) {
  if (erro?.response?.data?.erro) {
    return erro.response.data.erro;
  }

  if (erro?.response?.data?.message) {
    return erro.response.data.message;
  }

  if (erro?.code === 'ERR_NETWORK' || erro?.message === 'Network Error') {
    return MENSAGEM_SERVICO_INDISPONIVEL;
  }

  if (erro?.code === 'ECONNABORTED' || erro?.message?.toLowerCase().includes('timeout')) {
    return MENSAGEM_SERVICO_INDISPONIVEL;
  }

  if (erro?.message) {
    return erro.message;
  }

  return 'Ocorreu um erro inesperado.';
}

export function ehConfirmacaoDuplicidadePartida(erro) {
  return erro?.response?.status === 409 &&
    erro?.response?.data?.codigo === CODIGO_DUPLICIDADE_PARTIDA_CONFIRMAR;
}

export function extrairConfirmacaoDuplicidadePartida(erro) {
  const dados = erro?.response?.data || {};

  return {
    codigo: dados.codigo || CODIGO_DUPLICIDADE_PARTIDA_CONFIRMAR,
    mensagem: dados.mensagem || dados.erro || 'Já existe uma partida registrada hoje com os mesmos atletas e o mesmo placar.',
    correlationId: dados.correlationId
  };
}

export function ehResultadoConfirmacaoDuplicidadePartida(resultado) {
  const duplicidade = resultado?.duplicidade || {};

  return resultado?.status === 'RequerConfirmacaoDuplicidade' ||
    resultado?.codigo === CODIGO_DUPLICIDADE_PARTIDA_CONFIRMAR ||
    duplicidade.codigo === CODIGO_DUPLICIDADE_PARTIDA_CONFIRMAR ||
    duplicidade.requerConfirmacao === true;
}

export function extrairConfirmacaoDuplicidadePartidaResultado(resultado) {
  const duplicidade = resultado?.duplicidade || {};

  return {
    codigo: duplicidade.codigo || resultado?.codigo || CODIGO_DUPLICIDADE_PARTIDA_CONFIRMAR,
    mensagem: duplicidade.mensagem ||
      resultado?.mensagem ||
      duplicidade.erro ||
      resultado?.erro ||
      'Já existe uma partida registrada hoje com os mesmos atletas e o mesmo placar.',
    correlationId: duplicidade.correlationId || resultado?.correlationId
  };
}
