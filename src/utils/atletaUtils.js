function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

const LIMITE_NOME_ATLETA_COMPLETO = 38;
const LIMITE_NOME_ATLETA_COMPACTO = 28;

function obterNomeAtleta(atleta) {
  return normalizarTexto(atleta?.nome) || normalizarTexto(atleta?.nomeAtleta);
}

function obterApelidoAtleta(atleta) {
  return normalizarTexto(atleta?.apelido) || normalizarTexto(atleta?.apelidoAtleta);
}

function limitarTexto(texto, limite) {
  if (!texto || texto.length <= limite) {
    return texto;
  }

  return `${texto.slice(0, limite - 3).trim()}...`;
}

export function obterNomeExibicaoAtleta(atleta) {
  if (!atleta) {
    return '';
  }

  const nome = obterNomeAtleta(atleta);
  const apelido = obterApelidoAtleta(atleta);

  if (!nome && !apelido) {
    return '';
  }

  const nomeComApelido = nome && apelido && nome !== apelido ? `${nome} (${apelido})` : '';

  if (nomeComApelido && nomeComApelido.length <= LIMITE_NOME_ATLETA_COMPLETO) {
    return nomeComApelido;
  }

  if (nome && nome.length <= LIMITE_NOME_ATLETA_COMPACTO) {
    return nome;
  }

  if (apelido) {
    return limitarTexto(apelido, LIMITE_NOME_ATLETA_COMPACTO);
  }

  return limitarTexto(nome, LIMITE_NOME_ATLETA_COMPACTO);
}

export function obterTituloAtleta(atleta) {
  if (!atleta) {
    return '';
  }

  const nome = obterNomeAtleta(atleta);
  const apelido = obterApelidoAtleta(atleta);

  if (nome && apelido && nome !== apelido) {
    return `${nome} (${apelido})`;
  }

  return nome || apelido || '';
}

export function obterNomeExibicaoAtletaPerfil(atleta) {
  if (!atleta) {
    return '';
  }

  return obterApelidoAtleta(atleta) || obterNomeAtleta(atleta) || '';
}

export function obterNomeExibicaoAtletaCampos(nome, apelido) {
  return obterNomeExibicaoAtleta({ nome, apelido });
}

export function obterNomeExibicaoDupla(nomeDupla) {
  const nome = normalizarTexto(nomeDupla);

  if (!nome) {
    return '';
  }

  const separador = nome.includes('/')
    ? '/'
    : nome.includes('+')
      ? '+'
      : nome.includes(' e ')
        ? ' e '
        : null;

  if (!separador) {
    return obterNomeExibicaoAtleta({ nome });
  }

  const atletas = nome
    .split(separador)
    .map((item) => obterNomeExibicaoAtleta({ nome: item }))
    .filter(Boolean);

  return atletas.length > 0 ? atletas.join(' e ') : nome;
}

export function obterNomeExibicaoDuplaCampos(nomeAtleta1, apelidoAtleta1, nomeAtleta2, apelidoAtleta2) {
  const atletas = [
    obterNomeExibicaoAtletaCampos(nomeAtleta1, apelidoAtleta1),
    obterNomeExibicaoAtletaCampos(nomeAtleta2, apelidoAtleta2)
  ].filter(Boolean);

  return atletas.join(' e ');
}

export function normalizarIdsDupla(atleta1Id, atleta2Id) {
  const ids = [atleta1Id, atleta2Id].filter(Boolean).map(String);
  return ids.length === 2 ? ids.sort((a, b) => a.localeCompare(b)).join('/') : '';
}

export function montarUrlDashboardDupla(atleta1Id, atleta2Id) {
  const ids = normalizarIdsDupla(atleta1Id, atleta2Id);
  return ids ? `/duplas/${ids}` : '';
}
