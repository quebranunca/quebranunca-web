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

  campo.scrollIntoView?.({
    block: 'center',
    inline: 'nearest',
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
