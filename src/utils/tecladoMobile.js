export const dominiosEmailRapidos = ['@gmail.com', '@hotmail.com', '@outlook.com'];

export function appendEmailDomain(valor, dominio) {
  const email = String(valor || '').trim();
  const usuario = email.split('@')[0];

  if (!usuario || !dominio) {
    return email;
  }

  return `${usuario}${dominio}`;
}

export function deveExibirAtalhosEmail(valor) {
  const email = String(valor || '').trim();
  if (!email) {
    return false;
  }

  const indiceArroba = email.indexOf('@');
  if (indiceArroba === -1) {
    return true;
  }

  const dominio = email.slice(indiceArroba + 1);
  return !dominio.includes('.');
}

export function focusNextField(ref) {
  window.setTimeout(() => {
    const campo = ref?.current;
    focarSemScrollNativo(campo);
    scrollCampoParaAreaVisivel(campo);
  }, 0);
}

export function scrollFocusedInputIntoView(evento) {
  window.setTimeout(() => {
    scrollCampoParaAreaVisivel(evento?.currentTarget);
  }, 120);
}

export function focusCampoSemPular(ref) {
  window.setTimeout(() => {
    const campo = ref?.current;
    focarSemScrollNativo(campo);
    scrollCampoParaAreaVisivel(campo);
  }, 120);
}

function scrollCampoParaAreaVisivel(campo) {
  if (!campo) {
    return;
  }

  const container = encontrarContainerRolavel(campo);

  if (container) {
    centralizarNoContainer(campo, container);
    return;
  }

  campo.scrollIntoView?.({
    block: 'center',
    inline: 'nearest',
    behavior: 'smooth'
  });
}

function encontrarContainerRolavel(campo) {
  let atual = campo.parentElement;

  while (atual && atual !== document.body) {
    const estilos = window.getComputedStyle(atual);
    const permiteScroll = /(auto|scroll)/.test(`${estilos.overflowY}${estilos.overflow}`);

    if (permiteScroll && atual.scrollHeight > atual.clientHeight) {
      return atual;
    }

    atual = atual.parentElement;
  }

  return null;
}

function centralizarNoContainer(campo, container) {
  const area = container.getBoundingClientRect();
  const retanguloCampo = campo.getBoundingClientRect();
  const visualViewport = window.visualViewport;
  const topoVisivel = visualViewport ? Math.max(area.top, visualViewport.offsetTop) : area.top;
  const alturaVisivel = visualViewport
    ? Math.min(area.bottom, visualViewport.offsetTop + visualViewport.height) - topoVisivel
    : area.height;
  const centroCampo = retanguloCampo.top + retanguloCampo.height / 2;
  const centroVisivel = topoVisivel + Math.max(alturaVisivel, retanguloCampo.height) / 2;
  const deslocamento = centroCampo - centroVisivel;

  container.scrollBy({
    top: deslocamento,
    behavior: 'smooth'
  });
}

function focarSemScrollNativo(campo) {
  if (!campo) {
    return;
  }

  try {
    campo.focus({ preventScroll: true });
  } catch {
    campo.focus();
  }
}

export function aoPressionarEnterParaProximo(evento, acao) {
  if (evento.key !== 'Enter') {
    return;
  }

  evento.preventDefault();
  acao?.();
}
