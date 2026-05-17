import { useRef, useState } from 'react';
import { IoShareSocialSharp } from 'react-icons/io5';
import { useNotification } from '../../contexts/NotificationContext';
import { compartilharImagem } from '../../utils/compartilhamento';
import { extrairMensagemErro } from '../../utils/erros';
import { obterNomeExibicaoAtleta } from '../../utils/atletaUtils';
import { AtletaDashboardCompartilhavelCard } from './AtletaDashboardCompartilhavelCard';

export function CompartilharAtletaDashboardBotao({
  atleta,
  atletaRanking,
  grupoRanking,
  sequencia,
  url
}) {
  const { showNotification } = useNotification();
  const arteRef = useRef(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const nome = obterNomeExibicaoAtleta(atleta) || 'Atleta QuebraNunca';

  async function compartilhar() {
    if (carregando || !atleta) {
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      const resultado = await compartilharImagem({
        elemento: () => arteRef.current,
        nomeArquivo: `quebranunca-atleta-${atleta.id || atleta.atletaId || 'dashboard'}.png`,
        titulo: `Dashboard de ${nome}`,
        texto: `Confira o dashboard de ${nome} no QuebraNunca Futevôlei`,
        url
      });

      if (resultado === 'baixado') {
        showNotification({
          type: 'info',
          title: 'Imagem do dashboard gerada',
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
        title: 'Erro ao compartilhar dashboard',
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
        className="botao-compartilhar-partida botao-compartilhar-atleta-dashboard botao-compacto"
        onClick={compartilhar}
        disabled={carregando || !atleta}
        aria-label="Compartilhar dashboard do atleta"
        title="Compartilhar dashboard do atleta"
      >
        <IoShareSocialSharp aria-hidden="true" />
        {carregando ? 'Compartilhando...' : 'Compartilhar'}
      </button>

      {erro && <span className="compartilhar-partida-erro" role="alert">{erro}</span>}
      <div className="compartilhar-partida-render" aria-hidden="true">
        <AtletaDashboardCompartilhavelCard
          ref={arteRef}
          atleta={atleta}
          atletaRanking={atletaRanking}
          grupoRanking={grupoRanking}
          sequencia={sequencia}
        />
      </div>
    </>
  );
}
