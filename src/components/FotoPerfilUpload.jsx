import { useEffect, useRef, useState } from 'react';
import { FaCamera } from 'react-icons/fa';
import { AvatarUsuario } from './AvatarUsuario';
import { usuariosServico } from '../services/usuariosServico';
import {
  comprimirImagemParaUpload,
  ehImagemNaoSuportada,
  ehImagemPermitida
} from '../utils/compressaoImagem';
import { extrairMensagemErro } from '../utils/erros';

const tamanhoMaximoOriginalBytes = 20 * 1024 * 1024;

function validarArquivo(arquivo) {
  if (!arquivo) {
    return 'Escolha uma imagem JPG, PNG ou WEBP.';
  }

  if (ehImagemNaoSuportada(arquivo)) {
    return 'Fotos HEIC/HEIF ainda não são suportadas. Converta para JPG, PNG ou WEBP antes de enviar.';
  }

  if (!ehImagemPermitida(arquivo)) {
    return 'Escolha uma imagem JPG, PNG ou WEBP.';
  }

  if (arquivo.size > tamanhoMaximoOriginalBytes) {
    return 'A imagem original deve ter no máximo 20MB.';
  }

  return '';
}

export function FotoPerfilUpload({
  fotoPerfilUrl,
  nome,
  onFotoAtualizada
}) {
  const inputRef = useRef(null);
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [otimizando, setOtimizando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (!arquivoSelecionado) {
      setPreviewUrl('');
      return undefined;
    }

    const url = URL.createObjectURL(arquivoSelecionado);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [arquivoSelecionado]);

  function selecionarArquivo(evento) {
    const arquivo = evento.target.files?.[0] || null;
    evento.target.value = '';
    setMensagem('');

    const erroValidacao = validarArquivo(arquivo);
    if (erroValidacao) {
      setArquivoSelecionado(null);
      setErro(erroValidacao);
      return;
    }

    setArquivoSelecionado(arquivo);
    setErro('');
  }

  function cancelarSelecao() {
    if (salvando || otimizando) {
      return;
    }

    setArquivoSelecionado(null);
    setErro('');
    setMensagem('');
  }

  async function salvarFoto() {
    const erroValidacao = validarArquivo(arquivoSelecionado);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setOtimizando(true);
    setSalvando(false);
    setErro('');
    setMensagem('');

    try {
      const arquivoComprimido = await comprimirImagemParaUpload(arquivoSelecionado, {
        maxSizeMB: 1,
        maxWidthOrHeight: 800
      });

      setOtimizando(false);
      setSalvando(true);

      const resposta = await usuariosServico.atualizarFotoPerfil(arquivoComprimido);
      setArquivoSelecionado(null);
      setMensagem('Foto atualizada com sucesso.');
      onFotoAtualizada?.(resposta.fotoPerfilUrl);
    } catch (error) {
      setErro(extrairMensagemErro(error) || 'Não foi possível atualizar a foto. Tente novamente.');
    } finally {
      setOtimizando(false);
      setSalvando(false);
    }
  }

  const imagemExibida = previewUrl || fotoPerfilUrl;
  const temPreview = Boolean(previewUrl);
  const processando = salvando || otimizando;

  return (
    <div className="foto-perfil-upload">
      <div className="perfil-avatar-wrap">
        <AvatarUsuario
          nome={nome}
          fotoPerfilUrl={imagemExibida}
          tamanho="xl"
          className="perfil-avatar-premium"
        />

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="perfil-foto-input"
          onChange={selecionarArquivo}
        />

        <button
          type="button"
          className="perfil-camera"
          title="Alterar foto"
          aria-label="Alterar foto"
          disabled={processando}
          onClick={() => inputRef.current?.click()}
        >
          <FaCamera aria-hidden="true" />
        </button>
      </div>

      <div className="foto-perfil-upload-acoes">
        <button
          type="button"
          className="botao-secundario"
          disabled={processando}
          onClick={() => inputRef.current?.click()}
        >
          Alterar foto
        </button>

        {temPreview && (
          <>
            <button
              type="button"
              className="botao-primario"
              disabled={processando}
              onClick={salvarFoto}
            >
              {otimizando ? 'Otimizando imagem...' : salvando ? 'Salvando...' : 'Salvar foto'}
            </button>

            <button
              type="button"
              className="botao-terciario"
              disabled={processando}
              onClick={cancelarSelecao}
            >
              Cancelar
            </button>
          </>
        )}
      </div>

      {erro && <p className="foto-perfil-upload-mensagem erro">{erro}</p>}
      {mensagem && !erro && <p className="foto-perfil-upload-mensagem sucesso">{mensagem}</p>}
    </div>
  );
}
