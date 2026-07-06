export const CAMPOS_ATLETAS_PARTIDA = [
  'dupla1.atletaDireita',
  'dupla1.atletaEsquerda',
  'dupla2.atletaDireita',
  'dupla2.atletaEsquerda'
];

const CAMPOS_ATLETAS_POR_DUPLA = {
  dupla1: ['dupla1.atletaDireita', 'dupla1.atletaEsquerda'],
  dupla2: ['dupla2.atletaDireita', 'dupla2.atletaEsquerda']
};

export function limparTextoRegistro(valor) {
  return String(valor || '').trim().replace(/\s+/g, ' ');
}

export function obterValorCampoRegistro(dados, caminho) {
  return caminho.split('.').reduce((valor, parte) => valor?.[parte], dados) ?? '';
}

function normalizarTexto(valor) {
  return limparTextoRegistro(valor).toLocaleLowerCase('pt-BR');
}

function obterIdAtletaRegistro(atleta) {
  return atleta?.id || atleta?.atletaId || atleta?.usuarioAtletaId || null;
}

function obterNomeAtletaRegistro(atleta) {
  return limparTextoRegistro(
    atleta?.apelido ||
    atleta?.apelidoAtleta ||
    atleta?.nome ||
    atleta?.nomeAtleta ||
    atleta?.atletaNome ||
    atleta?.nomeCompleto
  );
}

export function obterAtletaConsolidadoRegistro(dados, selecoes, campo, { exigirSelecao = true } = {}) {
  const selecao = selecoes?.[campo] || null;
  const id = obterIdAtletaRegistro(selecao);
  const nomeSelecao = obterNomeAtletaRegistro(selecao);
  const nomeDigitado = limparTextoRegistro(obterValorCampoRegistro(dados, campo));
  const nome = nomeSelecao || (!exigirSelecao ? nomeDigitado : '');

  if (exigirSelecao && (!id || !nome)) {
    return null;
  }

  if (!nome) {
    return null;
  }

  return {
    id,
    nome,
    fotoPerfilUrl: selecao?.fotoPerfilUrl || selecao?.avatarUrl || '',
    selecao
  };
}

export function obterAtletasConsolidadosPartida(dados, selecoes, opcoes = {}) {
  const dupla1 = [
    obterAtletaConsolidadoRegistro(dados, selecoes, 'dupla1.atletaDireita', opcoes),
    obterAtletaConsolidadoRegistro(dados, selecoes, 'dupla1.atletaEsquerda', opcoes)
  ].filter(Boolean);
  const dupla2 = [
    obterAtletaConsolidadoRegistro(dados, selecoes, 'dupla2.atletaDireita', opcoes),
    obterAtletaConsolidadoRegistro(dados, selecoes, 'dupla2.atletaEsquerda', opcoes)
  ].filter(Boolean);

  return {
    dupla1,
    dupla2,
    todos: [...dupla1, ...dupla2]
  };
}

export function validarDuplaConsolidada(dados, selecoes, prefixo, rotulo, opcoes = {}) {
  const campos = CAMPOS_ATLETAS_POR_DUPLA[prefixo] || [];
  const atletas = campos.map((campo) => obterAtletaConsolidadoRegistro(dados, selecoes, campo, opcoes));

  if (campos.length !== 2 || atletas.some((atleta) => !atleta)) {
    return `Informe os dois atletas da ${rotulo}.`;
  }

  const ids = atletas.map((atleta) => atleta.id).filter(Boolean).map(String);
  if (ids.length > 0 && new Set(ids).size !== ids.length) {
    return `Não é permitido repetir atleta na ${rotulo}.`;
  }

  const nomes = atletas.map((atleta) => normalizarTexto(atleta.nome));
  if (new Set(nomes).size !== nomes.length) {
    return `Não é permitido repetir atleta na ${rotulo}.`;
  }

  return '';
}

export function validarAtletasConsolidados(dados, selecoes, opcoes = {}) {
  const erroDupla1 = validarDuplaConsolidada(dados, selecoes, 'dupla1', 'Dupla 1', opcoes);
  const erroDupla2 = validarDuplaConsolidada(dados, selecoes, 'dupla2', 'Dupla 2', opcoes);

  if (erroDupla1 || erroDupla2) {
    return 'Informe os quatro atletas da partida.';
  }

  const atletas = obterAtletasConsolidadosPartida(dados, selecoes, opcoes);

  if (atletas.dupla1.length !== 2 || atletas.dupla2.length !== 2 || atletas.todos.length !== 4) {
    return 'Informe os quatro atletas da partida.';
  }

  const ids = atletas.todos.map((atleta) => atleta.id).filter(Boolean).map(String);
  if (ids.length > 0 && new Set(ids).size !== ids.length) {
    return 'Não é permitido repetir atleta na mesma partida.';
  }

  const nomes = atletas.todos.map((atleta) => normalizarTexto(atleta.nome));
  if (new Set(nomes).size !== nomes.length) {
    return 'Não é permitido repetir atleta na mesma partida.';
  }

  return '';
}

export function obterNumeroRegraPartida(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

export function placarDetalhadoEstaValidoRegistro(dados, regraPartida = null) {
  if (dados.resultado?.modo !== 'PlacarDetalhado') {
    return false;
  }

  return !validarResultadoRegistro(dados, regraPartida);
}

export function validarResultadoRegistro(dados, regraPartida = null) {
  const modo = dados.resultado?.modo || '';

  if (modo === 'ApenasResultado') {
    return dados.resultado?.duplaVencedora ? '' : 'Informe o resultado da partida.';
  }

  if (modo !== 'PlacarDetalhado') {
    return 'Informe o resultado da partida.';
  }

  const pontosA = dados.dupla1?.pontos;
  const pontosB = dados.dupla2?.pontos;
  const placarAInformado = pontosA !== '' && pontosA !== null && pontosA !== undefined;
  const placarBInformado = pontosB !== '' && pontosB !== null && pontosB !== undefined;

  if (!placarAInformado || !placarBInformado) {
    return 'Informe o resultado da partida.';
  }

  const placarA = Number(pontosA);
  const placarB = Number(pontosB);
  const pontosMinimos = obterNumeroRegraPartida(regraPartida?.pontosMinimosPartida);
  const diferencaMinima = obterNumeroRegraPartida(regraPartida?.diferencaMinimaPartida);
  const permiteEmpate = regraPartida?.permiteEmpate === true;

  if (!Number.isFinite(placarA) || !Number.isFinite(placarB) || placarA < 0 || placarB < 0) {
    return 'Informe pontos numéricos maiores ou iguais a zero.';
  }

  if (!permiteEmpate && placarA === placarB) {
    return 'Não existe empate no futevôlei.';
  }

  if (pontosMinimos !== null && Math.max(placarA, placarB) < pontosMinimos) {
    return `A dupla vencedora precisa atingir pelo menos ${pontosMinimos} pontos.`;
  }

  if (diferencaMinima !== null && Math.abs(placarA - placarB) < diferencaMinima) {
    return `A diferença mínima precisa ser de ${diferencaMinima} pontos.`;
  }

  return '';
}

export function validarContextoRevisaoPartida({ contexto, grupo }) {
  if (contexto?.grupoId && !grupo?.id) {
    return 'Aguarde o carregamento do grupo selecionado.';
  }

  return '';
}

export function validarRevisaoPartida({
  dados,
  selecoes,
  regraPartida = null,
  contexto = {},
  grupo = null,
  exigirSelecaoAtletas = true
}) {
  return validarContextoRevisaoPartida({ contexto, grupo })
    || validarAtletasConsolidados(dados, selecoes, { exigirSelecao: exigirSelecaoAtletas })
    || validarResultadoRegistro(dados, regraPartida);
}
