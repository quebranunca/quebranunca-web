import { useRef, useState } from 'react';
import { IoShareSocialSharp } from 'react-icons/io5';
import { useNotification } from '../../contexts/NotificationContext';
import { gamificacaoServico } from '../../services/gamificacaoServico';
import { compartilharImagem } from '../../utils/compartilhamento';
import { extrairMensagemErro } from '../../utils/erros';
import { RankingCompartilhavelCard } from './RankingCompartilhavelCard';

function montarTexto(contexto) {
  return contexto
    ? `Confira o ranking de ${contexto} no QuebraNunca Futevôlei`
    : 'Confira o ranking do QuebraNunca Futevôlei';
}

async function registrarPontuacaoCompartilhamento() {
  try {
    await gamificacaoServico.registrarCompartilhamento({
      tipo: 2,
      origem: 'web'
    });
  } catch {
    // Compartilhar não depende da pontuação de gamificação.
  }
}

export function CompartilharRankingBotao({
  titulo = 'Ranking QuebraNunca',
  contexto,
  url,
  ranking = []
}) {
  const { showNotification } = useNotification();
  const arteRef = useRef(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function compartilhar() {
    if (carregando) {
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      const resultado = await compartilharImagem({
        elemento: () => arteRef.current,
        nomeArquivo: 'quebranunca-ranking.png',
        titulo,
        texto: montarTexto(contexto),
        url
      });
      await registrarPontuacaoCompartilhamento();

      if (resultado === 'baixado') {
        showNotification({
          type: 'info',
          title: 'Imagem do ranking gerada',
          message: 'Compartilhamento direto não é suportado neste dispositivo. A imagem foi baixada para você postar.',
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
      <div className="compartilhar-partida-render" aria-hidden="true">
        <RankingCompartilhavelCard ref={arteRef} ranking={ranking} contexto={contexto} />
      </div>
    </>
  );
}
