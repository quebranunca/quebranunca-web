function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ') : '';
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

function obterNomeItemDupla(item) {
  if (!item) {
    return '';
  }

  if (typeof item === 'string') {
    return normalizarTexto(item);
  }

  return obterNomeExibicaoAtletaPerfil(item)
    || normalizarTexto(item.apelidoAtleta)
    || normalizarTexto(item.nomeAtleta)
    || normalizarTexto(item.atletaNome)
    || normalizarTexto(item.nome);
}

function montarAtletasObjetoDupla(dupla) {
  if (!dupla || typeof dupla !== 'object') {
    return [];
  }

  if (Array.isArray(dupla.atletas)) {
    return dupla.atletas;
  }

  return [
    dupla.atleta1 || {
      nome: dupla.nomeAtleta1 || dupla.atleta1Nome,
      apelido: dupla.apelidoAtleta1 || dupla.atleta1Apelido
    },
    dupla.atleta2 || {
      nome: dupla.nomeAtleta2 || dupla.atleta2Nome,
      apelido: dupla.apelidoAtleta2 || dupla.atleta2Apelido
    }
  ];
}

export function formatarNomeDupla(atletas, fallback = '') {
  if (!atletas) {
    return fallback;
  }

  if (Array.isArray(atletas)) {
    const nomes = atletas
      .map(obterNomeItemDupla)
      .filter(Boolean);

    return nomes.length > 0 ? nomes.join(' • ') : fallback;
  }

  if (typeof atletas === 'string') {
    const nome = normalizarTexto(atletas);

    if (!nome) {
      return fallback;
    }

    const partes = nome
      .split(/\s*(?:\/|\+|•|&|\be\b)\s*/i)
      .map(normalizarTexto)
      .filter(Boolean);

    return partes.length > 1 ? formatarNomeDupla(partes, nome) : nome;
  }

  const nomesObjeto = montarAtletasObjetoDupla(atletas)
    .map(obterNomeItemDupla)
    .filter(Boolean);

  return nomesObjeto.length > 0
    ? nomesObjeto.join(' • ')
    : formatarNomeDupla(atletas.nome, fallback);
}

export function obterNomeExibicaoDupla(nomeDupla) {
  const nome = normalizarTexto(nomeDupla);

  if (!nome) {
    return '';
  }

  return formatarNomeDupla(nome, nome);
}

export function obterNomeExibicaoDuplaCampos(nomeAtleta1, apelidoAtleta1, nomeAtleta2, apelidoAtleta2) {
  return formatarNomeDupla([
    { nome: nomeAtleta1, apelido: apelidoAtleta1 },
    { nome: nomeAtleta2, apelido: apelidoAtleta2 }
  ]);
}

export function normalizarIdsDupla(atleta1Id, atleta2Id) {
  const ids = [atleta1Id, atleta2Id].filter(Boolean).map(String);
  return ids.length === 2 ? ids.sort((a, b) => a.localeCompare(b)).join('/') : '';
}

export function montarUrlDashboardDupla(atleta1Id, atleta2Id) {
  const ids = normalizarIdsDupla(atleta1Id, atleta2Id);
  return ids ? `/duplas/${ids}` : '';
}
