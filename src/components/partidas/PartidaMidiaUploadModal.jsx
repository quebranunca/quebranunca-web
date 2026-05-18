import { useEffect, useRef, useState } from 'react';
import { FaImage, FaTimes, FaUpload, FaVideo } from 'react-icons/fa';
import { partidaMidiaServico } from '../../services/partidaMidiaServico';
import { extrairMensagemErro } from '../../utils/erros';
import './feed-partidas.css';

const tiposImagem = new Set(['image/jpeg', 'image/png', 'image/webp']);
const tiposVideo = new Set(['video/mp4', 'video/quicktime', 'video/webm']);
const tamanhoMaximoImagemBytes = 5 * 1024 * 1024;
const tamanhoMaximoVideoBytes = 50 * 1024 * 1024;

function obterTipoArquivo(arquivo) {
  const nome = arquivo?.name || '';
  const extensao = nome.slice(nome.lastIndexOf('.')).toLowerCase();

  if (tiposImagem.has(arquivo?.type) || ['.jpg', '.jpeg', '.png', '.webp'].includes(extensao)) {
    return 'Imagem';
  }

  if (tiposVideo.has(arquivo?.type) || ['.mp4', '.mov', '.webm'].includes(extensao)) {
    return 'Video';
  }

  return '';
}

function validarArquivo(arquivo) {
  if (!arquivo) {
    return 'Escolha uma foto ou vídeo da partida.';
  }

  const tipo = obterTipoArquivo(arquivo);
  if (!tipo) {
    return 'Envie JPG, PNG, WEBP, MP4, MOV ou WEBM.';
  }

  if (tipo === 'Imagem' && arquivo.size > tamanhoMaximoImagemBytes) {
    return 'A imagem deve ter no máximo 5MB.';
  }

  if (tipo === 'Video' && arquivo.size > tamanhoMaximoVideoBytes) {
    return 'O vídeo deve ter no máximo 50MB.';
  }

  return '';
}

export function PartidaMidiaUploadModal({
  aberto,
  partidaId,
  onFechar,
  onConcluido
}) {
  const inputRef = useRef(null);
  const [arquivo, setArquivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!arquivo) {
      setPreviewUrl('');
      return undefined;
    }

    const url = URL.createObjectURL(arquivo);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  if (!aberto) {
    return null;
  }

  const tipoArquivo = arquivo ? obterTipoArquivo(arquivo) : '';

  function selecionarArquivo(evento) {
    const proximoArquivo = evento.target.files?.[0] || null;
    evento.target.value = '';

    const erroValidacao = validarArquivo(proximoArquivo);
    if (erroValidacao) {
      setArquivo(null);
      setErro(erroValidacao);
      return;
    }

    setArquivo(proximoArquivo);
    setErro('');
  }

  async function enviar() {
    const erroValidacao = validarArquivo(arquivo);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setEnviando(true);
    setErro('');

    try {
      const resposta = await partidaMidiaServico.enviar(partidaId, arquivo);
      onConcluido?.(resposta);
      onFechar?.();
    } catch (falha) {
      setErro(extrairMensagemErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="modal-sobreposicao partida-midia-upload-sobreposicao" role="presentation">
      <section className="modal-conteudo partida-midia-upload-modal" role="dialog" aria-modal="true" aria-labelledby="partida-midia-upload-titulo">
        <header className="partida-midia-upload-header">
          <div>
            <span>Partida registrada</span>
            <h3 id="partida-midia-upload-titulo">Adicionar foto ou vídeo</h3>
          </div>
          <button type="button" className="registrar-partida-novo-icone-botao" onClick={onFechar} disabled={enviando} aria-label="Fechar">
            <FaTimes aria-hidden="true" />
          </button>
        </header>

        <div className="partida-midia-upload-corpo">
          <button
            type="button"
            className={`partida-midia-dropzone ${previewUrl ? 'com-preview' : ''}`}
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
              onChange={selecionarArquivo}
            />

            {previewUrl && tipoArquivo === 'Imagem' && <img src={previewUrl} alt="Prévia da mídia da partida" />}
            {previewUrl && tipoArquivo === 'Video' && <video src={previewUrl} controls preload="metadata" />}

            {!previewUrl && (
              <span className="partida-midia-dropzone-vazio">
                <FaUpload aria-hidden="true" />
                <strong>Selecionar arquivo</strong>
                <small>Imagem até 5MB ou vídeo até 50MB</small>
              </span>
            )}
          </button>

          {arquivo && (
            <div className="partida-midia-arquivo">
              {tipoArquivo === 'Video' ? <FaVideo aria-hidden="true" /> : <FaImage aria-hidden="true" />}
              <span>{arquivo.name}</span>
            </div>
          )}

          {erro && <p className="texto-erro partida-midia-upload-erro">{erro}</p>}
        </div>

        <footer className="partida-midia-upload-acoes">
          <button type="button" className="botao-secundario" onClick={onFechar} disabled={enviando}>
            Agora não
          </button>
          <button type="button" className="botao-primario" onClick={enviar} disabled={enviando || !arquivo}>
            {enviando ? 'Enviando...' : 'Salvar mídia'}
          </button>
        </footer>
      </section>
    </div>
  );
}
