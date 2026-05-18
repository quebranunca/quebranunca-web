import { useRef, useState } from 'react';
import { IoShareSocialSharp } from 'react-icons/io5';
import { useNotification } from '../../contexts/NotificationContext';
import { compartilharImagem } from '../../utils/compartilhamento';
import { extrairMensagemErro } from '../../utils/erros';
import { DuplaDashboardCompartilhavelCard } from './DuplaDashboardCompartilhavelCard';

function normalizarNomeArquivo(valor) {
  return String(valor || 'dupla')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function CompartilharDuplaDashboardBotao({ dashboard, url }) {
  const { showNotification } = useNotification();
  const arteRef = useRef(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const nome = dashboard?.dupla?.nome || 'Dupla QuebraNunca';

  async function compartilhar() {
    if (carregando || !dashboard) {
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      const resultado = await compartilharImagem({
        elemento: () => arteRef.current,
        nomeArquivo: `quebranunca-dupla-${normalizarNomeArquivo(nome)}.png`,
        titulo: `Dashboard da dupla ${nome}`,
        texto: `Confira o dashboard da dupla ${nome} no QuebraNunca Futevôlei`,
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
        disabled={carregando || !dashboard}
        aria-label="Compartilhar dashboard da dupla"
        title="Compartilhar dashboard da dupla"
      >
        <IoShareSocialSharp aria-hidden="true" />
        {carregando ? 'Compartilhando...' : 'Compartilhar'}
      </button>

      {erro && <span className="compartilhar-partida-erro" role="alert">{erro}</span>}
      <div className="compartilhar-partida-render" aria-hidden="true">
        <DuplaDashboardCompartilhavelCard ref={arteRef} dashboard={dashboard} />
      </div>
    </>
  );
}
