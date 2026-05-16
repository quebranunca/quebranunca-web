import { useEffect, useState } from 'react';
import { dashboardServico } from '../../services/dashboardServico';
import { HomeDashboard } from '../../components/home/HomeDashboard';
import { extrairMensagemErro } from '../../utils/erros';
import '../../components/home/home-dashboard.css';

export function HomeDashboardContainer() {
  const [dashboard, setDashboard] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregarDashboard() {
      try {
        setCarregando(true);
        setErro('');
        const dados = await dashboardServico.obterDashboardAtleta();
        if (ativo) {
          setDashboard(dados);
        }
      } catch (falha) {
        if (ativo) {
          setErro(extrairMensagemErro(falha));
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarDashboard();

    return () => {
      ativo = false;
    };
  }, []);

  return <HomeDashboard dashboard={dashboard} carregando={carregando} erro={erro} />;
}
