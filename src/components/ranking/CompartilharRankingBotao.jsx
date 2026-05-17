import { useState } from 'react';
import { IoShareSocialSharp } from 'react-icons/io5';
import { useNotification } from '../../contexts/NotificationContext';
import { compartilharLink } from '../../utils/compartilhamento';
import { extrairMensagemErro } from '../../utils/erros';

function montarTexto(contexto) {
  return contexto
    ? `Confira o ranking de ${contexto} no QuebraNunca Futevôlei`
    : 'Confira o ranking do QuebraNunca Futevôlei';
}

export function CompartilharRankingBotao({
  titulo = 'Ranking QuebraNunca',
  contexto,
  url
}) {
  const { showNotification } = useNotification();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function compartilhar() {
    if (carregando) {
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      const resultado = await compartilharLink({
        titulo,
        texto: montarTexto(contexto),
        url
      });

      if (resultado === 'copiado') {
        showNotification({
          type: 'success',
          title: 'Link do ranking copiado!',
          message: 'Agora é só enviar para a galera.',
          duration: 4000
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
        title: 'Erro ao compartilhar ranking',
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
        className="botao-compartilhar-partida botao-compartilhar-ranking botao-compacto"
        onClick={compartilhar}
        disabled={carregando}
        aria-label="Compartilhar ranking"
        title="Compartilhar ranking"
      >
        <IoShareSocialSharp aria-hidden="true" />
        {carregando ? 'Compartilhando...' : 'Compartilhar'}
      </button>

      {erro && <span className="compartilhar-partida-erro" role="alert">{erro}</span>}
    </>
  );
}
