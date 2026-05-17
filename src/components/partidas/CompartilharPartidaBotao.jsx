import { useRef, useState } from 'react';
import { toBlob } from 'html-to-image';
import { useNotification } from '../../contexts/NotificationContext';
import { partidasServico } from '../../services/partidasServico';
import { obterUrlAbsoluta } from '../../utils/compartilhamento';
import { extrairMensagemErro } from '../../utils/erros';
import { ArteCompartilhamentoPartida } from './ArteCompartilhamentoPartida';
import { IoShareSocialSharp } from 'react-icons/io5';

function aguardarRenderizacao() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

function baixarArquivo(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function obterUrlPartida(partidaId, url) {
  if (url) {
    return obterUrlAbsoluta(url);
  }

  if (typeof window === 'undefined') {
    return '';
  }

  return obterUrlAbsoluta(`${window.location.pathname}${window.location.search || ''}`);
}

export function CompartilharPartidaBotao({ partidaId, url }) {
  const { showNotification } = useNotification();
  const arteRef = useRef(null);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function compartilhar() {
    if (!partidaId || carregando) {
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      const dadosCompartilhamento = await partidasServico.obterCompartilhamento(partidaId);
      setDados(dadosCompartilhamento);
      await aguardarRenderizacao();

      const blob = await toBlob(arteRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#08090b'
      });

      if (!blob) {
        throw new Error('Não foi possível gerar a imagem da partida.');
      }

      const nomeArquivo = `quebranunca-partida-${partidaId}.png`;
      const arquivo = new File([blob], nomeArquivo, { type: 'image/png' });

      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [arquivo] }))) {
        await navigator.share({
          files: [arquivo],
          title: 'Partida registrada no QuebraNunca',
          text: 'Partida registrada no QuebraNunca Futevôlei',
          url: obterUrlPartida(partidaId, url)
        });
        return;
      }

      baixarArquivo(blob, nomeArquivo);
      showNotification({
        type: 'info',
        title: 'Imagem gerada',
        message: 'Compartilhamento direto não é suportado neste dispositivo. A imagem foi baixada para você postar pelo Instagram.',
        duration: 5000
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }

      const mensagem = extrairMensagemErro(error);
      setErro(mensagem);
      showNotification({
        type: 'error',
        title: 'Erro ao compartilhar',
        message: mensagem,
        duration: 5000
      });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="botao-compartilhar-partida botao-compacto"
        onClick={compartilhar}
        disabled={carregando}
        aria-label="Compartilhar partida"
        title="Compartilhar partida"
      >
        <IoShareSocialSharp aria-hidden="true" />
        {carregando ? 'Gerando...' : 'Compartilhar'}
      </button>

      {erro && <span className="compartilhar-partida-erro" role="alert">{erro}</span>}

      <div className="compartilhar-partida-render" aria-hidden="true">
        {dados && <ArteCompartilhamentoPartida ref={arteRef} dados={dados} />}
      </div>
    </>
  );
}
