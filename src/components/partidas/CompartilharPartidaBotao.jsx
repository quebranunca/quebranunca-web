import { useRef, useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { gamificacaoServico } from '../../services/gamificacaoServico';
import { partidasServico } from '../../services/partidasServico';
import { compartilharImagem, obterUrlAbsoluta } from '../../utils/compartilhamento';
import { extrairMensagemErro } from '../../utils/erros';
import { ArteCompartilhamentoPartida } from './ArteCompartilhamentoPartida';
import { IoShareSocialSharp } from 'react-icons/io5';

function obterUrlPartida(partidaId, url) {
  if (url) {
    return obterUrlAbsoluta(url);
  }

  if (typeof window === 'undefined') {
    return '';
  }

  return obterUrlAbsoluta(`${window.location.pathname}${window.location.search || ''}`);
}

async function registrarPontuacaoCompartilhamento(partidaId) {
  try {
    await gamificacaoServico.registrarCompartilhamento({
      tipo: 1,
      partidaId,
      origem: 'web'
    });
  } catch {
    // Compartilhar não depende da pontuação de gamificação.
  }
}

export function CompartilharPartidaBotao({
  partidaId,
  url,
  className = 'botao-compartilhar-partida botao-compacto',
  texto = 'Compartilhar',
  ariaLabel = 'Compartilhar partida',
  title = 'Compartilhar partida'
}) {
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

      const nomeArquivo = `quebranunca-partida-${partidaId}.png`;
      const resultado = await compartilharImagem({
        elemento: () => arteRef.current,
        nomeArquivo,
        titulo: 'Partida registrada no QuebraNunca',
        texto: 'Partida registrada no QuebraNunca Futevôlei',
        url: obterUrlPartida(partidaId, url),
        pixelRatio: 1
      });
      await registrarPontuacaoCompartilhamento(partidaId);

      if (resultado === 'baixado') {
        showNotification({
          type: 'info',
          title: 'Imagem gerada',
          message: 'Compartilhamento direto não é suportado neste dispositivo. A imagem foi baixada para você postar pelo Instagram.',
          duration: 5000
        });
      }
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
        className={className}
        onClick={compartilhar}
        disabled={carregando}
        aria-label={ariaLabel}
        title={title}
      >
        <IoShareSocialSharp aria-hidden="true" />
        {carregando ? 'Gerando...' : texto}
      </button>

      {erro && <span className="compartilhar-partida-erro" role="alert">{erro}</span>}

      <div className="compartilhar-partida-render" aria-hidden="true">
        {dados && <ArteCompartilhamentoPartida ref={arteRef} dados={dados} />}
      </div>
    </>
  );
}
