import imageCompression from 'browser-image-compression';

const extensoesImagemPermitidas = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const extensoesImagemNaoSuportadas = new Set(['.heic', '.heif']);
const tiposImagemPermitidos = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function obterExtensaoArquivo(arquivo) {
  const nome = arquivo?.name || '';
  const indice = nome.lastIndexOf('.');
  return indice >= 0 ? nome.slice(indice).toLowerCase() : '';
}

export function obterNomeArquivoJpeg(nomeOriginal) {
  const nome = nomeOriginal || 'imagem.jpg';
  const indice = nome.lastIndexOf('.');
  const base = indice >= 0 ? nome.slice(0, indice) : nome;
  return `${base || 'imagem'}.jpg`;
}

export function ehImagemPermitida(arquivo) {
  const extensao = obterExtensaoArquivo(arquivo);
  return tiposImagemPermitidos.has(arquivo?.type) || extensoesImagemPermitidas.has(extensao);
}

export function ehImagemNaoSuportada(arquivo) {
  return extensoesImagemNaoSuportadas.has(obterExtensaoArquivo(arquivo));
}

export async function comprimirImagemParaUpload(
  arquivo,
  {
    maxSizeMB,
    maxWidthOrHeight
  }
) {
  let imagemComprimida;
  try {
    imagemComprimida = await imageCompression(arquivo, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      initialQuality: 0.84,
      fileType: 'image/jpeg'
    });
  } catch {
    throw new Error('Não foi possível otimizar a imagem. Tente enviar uma imagem JPG, PNG ou WEBP menor.');
  }

  return new File(
    [imagemComprimida],
    obterNomeArquivoJpeg(arquivo.name),
    {
      type: 'image/jpeg',
      lastModified: Date.now()
    }
  );
}
