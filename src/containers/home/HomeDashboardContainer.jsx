import { useEffect, useState } from 'react';
import { dashboardServico } from '../../services/dashboardServico';
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

  return <HomeDashboard modulos={modulos} onAtualizar={carregarModulos} />;
}
