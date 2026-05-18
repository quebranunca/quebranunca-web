import { useEffect, useState } from 'react';
import { dashboardServico } from '../../services/dashboardServico';
import { HomeDashboard } from '../../components/home/HomeDashboard';
import { extrairMensagemErro } from '../../utils/erros';
import '../../components/home/home-dashboard.css';

export function HomeDashboardContainer() {
  const [dashboard, setDashboard] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function carregarDashboard(estaAtivo = () => true) {
    setCarregando(true);
    setErro('');

    try {
      const dados = await dashboardServico.obterDashboardAtleta();
      if (estaAtivo()) {
        setDashboard(dados);
      }
    } catch (falha) {
      if (estaAtivo()) {
        setErro(extrairMensagemErro(falha));
      }
    } finally {
      if (estaAtivo()) {
        setCarregando(false);
      }
    }
  }

  useEffect(() => {
    let ativo = true;
    carregarDashboard(() => ativo);

    return () => {
      ativo = false;
    };
  }, []);

  return <HomeDashboard dashboard={dashboard} carregando={carregando} erro={erro} onAtualizar={carregarDashboard} />;
}
