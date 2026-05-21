export const dominiosEmailRapidos = ['@gmail.com', '@hotmail.com', '@outlook.com'];

export function blurActiveElement() {
  if (typeof document === 'undefined') {
    return;
  }

  const elementoAtivo = document.activeElement;
  if (elementoAtivo && typeof elementoAtivo.blur === 'function') {
    elementoAtivo.blur();
  }
}

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
    ref?.current?.focus?.();
  }, 0);
}

export function scrollFocusedInputIntoView(evento) {
  window.setTimeout(() => {
    evento?.currentTarget?.scrollIntoView?.({
      block: 'center',
      inline: 'nearest',
      behavior: 'smooth'
    });
  }, 120);
}

export function aoPressionarEnterParaProximo(evento, acao) {
  if (evento.key !== 'Enter') {
    return;
  }

  evento.preventDefault();
  acao?.();
}
