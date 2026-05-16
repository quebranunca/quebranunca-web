import { useEffect, useState } from 'react';
import { dashboardServico } from '../../services/dashboardServico';
import { PublicHome } from '../../components/public/PublicHome';
import '../../components/public/public-home.css';

export function PublicHomeContainer() {
  const [dashboard, setDashboard] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregarDashboard() {
      setCarregando(true);
      setErro('');

      try {
        const dados = await dashboardServico.obterDashboardPublico();
        if (ativo) {
          setDashboard(dados);
        }
      } catch {
        if (ativo) {
          setErro('Não foi possível carregar o movimento da plataforma agora.');
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

  return <PublicHome dashboard={dashboard} carregando={carregando} erro={erro} />;
}
