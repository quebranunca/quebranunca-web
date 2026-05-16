import { HomeDashboardContainer } from '../containers/home/HomeDashboardContainer';
import { PublicHomeContainer } from '../containers/home/PublicHomeContainer';
import { useAutenticacao } from '../hooks/useAutenticacao';

export function PaginaHome() {
  const { token } = useAutenticacao();

  if (!token) {
    return <PublicHomeContainer />;
  }

  return <HomeDashboardContainer />;
}
