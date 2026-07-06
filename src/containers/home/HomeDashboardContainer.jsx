import { useEffect, useState } from 'react';
import { dashboardServico } from '../../services/dashboardServico';
import { EVENTO_PENDENCIAS_ATUALIZADAS, pendenciasServico } from '../../services/pendenciasServico';
import { HomeDashboard } from '../../components/home/HomeDashboard';
import { useNotification } from '../../contexts/NotificationContext';
import { extrairMensagemErro } from '../../utils/erros';
import '../../components/home/home-dashboard.css';

const estadoInicialModulo = Object.freeze({
  dados: null,
  carregando: true,
  erro: ''
});

function criarEstadoInicialModulos() {
  return {
    perfil: { ...estadoInicialModulo },
    pendencias: { ...estadoInicialModulo },
    resumo: { ...estadoInicialModulo },
    ultimasPartidas: { ...estadoInicialModulo }
  };
}

export function HomeDashboardContainer() {
  const [modulos, setModulos] = useState(criarEstadoInicialModulos);
  const [confirmandoPendenciaId, setConfirmandoPendenciaId] = useState(null);
  const [contestandoPendenciaId, setContestandoPendenciaId] = useState(null);
  const { showNotification } = useNotification();

  async function carregarModulo(chave, carregador, estaAtivo = () => true) {
    setModulos((anteriores) => ({
      ...anteriores,
      [chave]: {
        ...anteriores[chave],
        carregando: true,
        erro: ''
      }
    }));

    try {
      const dados = await carregador();
      if (estaAtivo()) {
        setModulos((anteriores) => ({
          ...anteriores,
          [chave]: { dados, carregando: false, erro: '' }
        }));
      }
    } catch (falha) {
      if (estaAtivo()) {
        setModulos((anteriores) => ({
          ...anteriores,
          [chave]: {
            ...anteriores[chave],
            carregando: false,
            erro: extrairMensagemErro(falha)
          }
        }));
      }
    }
  }

  function carregarModulos(estaAtivo = () => true) {
    const carregamentos = [
      carregarModulo('perfil', dashboardServico.obterPerfilAtleta, estaAtivo),
      carregarModulo('pendencias', pendenciasServico.obterResumo, estaAtivo),
      carregarModulo('resumo', dashboardServico.obterResumoAtleta, estaAtivo),
      carregarModulo('ultimasPartidas', dashboardServico.listarUltimasPartidasAtleta, estaAtivo)
    ];

    return Promise.allSettled(carregamentos);
  }

  useEffect(() => {
    let ativo = true;
    carregarModulos(() => ativo);

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    function atualizarPendencias() {
      carregarModulo('pendencias', pendenciasServico.obterResumo);
    }

    window.addEventListener(EVENTO_PENDENCIAS_ATUALIZADAS, atualizarPendencias);
    return () => window.removeEventListener(EVENTO_PENDENCIAS_ATUALIZADAS, atualizarPendencias);
  }, []);

  async function confirmarPendenciaPartida(pendenciaId) {
    if (!pendenciaId || confirmandoPendenciaId || contestandoPendenciaId) {
      return;
    }

    setConfirmandoPendenciaId(pendenciaId);
    try {
      await pendenciasServico.aprovarPartida(pendenciaId);
      showNotification({
        type: 'success',
        title: 'Partida confirmada',
        message: 'Partida confirmada.'
      });
      await carregarModulo('pendencias', pendenciasServico.obterResumo);
    } catch (falha) {
      showNotification({
        type: 'error',
        title: 'Erro ao confirmar partida',
        message: extrairMensagemErro(falha)
      });
    } finally {
      setConfirmandoPendenciaId(null);
    }
  }

  async function naoReconhecerPendenciaPartida(pendenciaId) {
    if (!pendenciaId || confirmandoPendenciaId || contestandoPendenciaId) {
      return;
    }

    setContestandoPendenciaId(pendenciaId);
    try {
      await pendenciasServico.contestarPartida(pendenciaId);
      showNotification({
        type: 'success',
        title: 'Partida não reconhecida',
        message: 'A partida saiu das suas pendências.'
      });
      await carregarModulo('pendencias', pendenciasServico.obterResumo);
    } catch (falha) {
      showNotification({
        type: 'error',
        title: 'Erro ao responder partida',
        message: extrairMensagemErro(falha)
      });
    } finally {
      setContestandoPendenciaId(null);
    }
  }

  return (
    <HomeDashboard
      modulos={modulos}
      onAtualizar={carregarModulos}
      onConfirmarPendenciaPartida={confirmarPendenciaPartida}
      onNaoReconhecerPendenciaPartida={naoReconhecerPendenciaPartida}
      confirmandoPendenciaId={confirmandoPendenciaId}
      contestandoPendenciaId={contestandoPendenciaId}
    />
  );
}
