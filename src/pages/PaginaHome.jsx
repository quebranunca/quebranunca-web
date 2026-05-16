import { HomeDashboardContainer } from '../containers/home/HomeDashboardContainer';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { PaginaHome as PaginaHomePublica } from './PaginaHome1';

export function PaginaHome() {
  const { token } = useAutenticacao();

  if (!token) {
    return <PaginaHomePublica />;
  }

  return <HomeDashboardContainer />;
}
