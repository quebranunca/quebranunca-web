import { toBlob } from 'html-to-image';

export function obterUrlAbsoluta(caminho = '') {
  if (typeof window === 'undefined') {
    return caminho;
  }

  if (!caminho) {
    return window.location.href;
  }

  return new URL(caminho, window.location.origin).href;
}

export function aguardarRenderizacaoCompartilhamento() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

export function baixarArquivo(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function gerarImagemCompartilhamento(elemento, opcoes = {}) {
  await aguardarRenderizacaoCompartilhamento();
  const alvo = typeof elemento === 'function' ? elemento() : elemento;
  const pixelRatio = opcoes.pixelRatio ?? 2;

  if (!alvo) {
    throw new Error('Não foi possível preparar a arte de compartilhamento.');
  }

  const blob = await toBlob(alvo, {
    cacheBust: true,
    pixelRatio,
    backgroundColor: '#08090b'
  });

  if (!blob) {
    throw new Error('Não foi possível gerar a imagem de compartilhamento.');
  }

  return blob;
}

export async function compartilharImagem({
  elemento,
  nomeArquivo,
  titulo,
  texto,
  url,
  pixelRatio
}) {
  const blob = await gerarImagemCompartilhamento(elemento, { pixelRatio });
  const arquivo = new File([blob], nomeArquivo, { type: 'image/png' });
  const link = obterUrlAbsoluta(url);

  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [arquivo] }))) {
    await navigator.share({
      files: [arquivo],
      title: titulo,
      text: texto,
      url: link
    });
    return 'compartilhado';
  }

  baixarArquivo(blob, nomeArquivo);
  return 'baixado';
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
