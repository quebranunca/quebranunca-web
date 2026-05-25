import { useEffect, useState } from 'react';
import { dashboardServico } from '../../services/dashboardServico';
import { EVENTO_PENDENCIAS_ATUALIZADAS, pendenciasServico } from '../../services/pendenciasServico';
import { HomeDashboard } from '../../components/home/HomeDashboard';
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
    insights: { ...estadoInicialModulo },
    ultimasPartidas: { ...estadoInicialModulo },
    conexoes: { ...estadoInicialModulo },
    frequencia: { ...estadoInicialModulo }
  };
}

export function HomeDashboardContainer() {
  const [modulos, setModulos] = useState(criarEstadoInicialModulos);

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
      carregarModulo('insights', dashboardServico.obterInsightsAtleta, estaAtivo),
      carregarModulo('ultimasPartidas', dashboardServico.listarUltimasPartidasAtleta, estaAtivo),
      carregarModulo('conexoes', dashboardServico.obterConexoesAtleta, estaAtivo),
      carregarModulo('frequencia', dashboardServico.obterFrequenciaAtleta, estaAtivo)
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

  return <HomeDashboard modulos={modulos} onAtualizar={carregarModulos} />;
}
