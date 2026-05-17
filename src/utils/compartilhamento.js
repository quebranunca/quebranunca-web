export function obterUrlAbsoluta(caminho = '') {
  if (typeof window === 'undefined') {
    return caminho;
  }

  if (!caminho) {
    return window.location.href;
  }

  return new URL(caminho, window.location.origin).href;
}

async function copiarTexto(texto) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(texto);
    return;
  }

  const input = document.createElement('textarea');
  input.value = texto;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

export async function compartilharLink({ titulo, texto, url }) {
  const link = obterUrlAbsoluta(url);

  if (navigator.share) {
    await navigator.share({
      title: titulo,
      text: texto,
      url: link
    });
    return 'compartilhado';
  }

  await copiarTexto(link);
  return 'copiado';
}
