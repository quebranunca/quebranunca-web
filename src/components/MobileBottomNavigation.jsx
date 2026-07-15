import { NavLink, matchPath, useLocation } from 'react-router-dom';
import { obterMainNavigationItems } from './navigation/navigationConfig';
import { criarNavegacaoRegistroPartida, obterOrigemAtualParaRegistro } from '../utils/partidaRotas';

function itemAtivo(pathname, caminhos) {
  return caminhos.some((caminho) => matchPath({
    path: caminho,
    end: !caminho.includes('*') && caminho === '/app'
  }, pathname));
}

export function MobileBottomNavigation() {
  const location = useLocation();
  const itens = obterMainNavigationItems();
  const navegacaoRegistro = criarNavegacaoRegistroPartida({
    origem: obterOrigemAtualParaRegistro(location)
  });

  return (
    <nav className="mobile-bottom-navigation" aria-label="Navegação principal">
      {itens.map((item) => {
        const Icone = item.icon;
        const ativo = itemAtivo(location.pathname, item.activePaths || [item.route]);

        return (
          <NavLink
            key={item.id}
            to={item.id === 'registrar' ? navegacaoRegistro.to : item.route}
            state={item.id === 'registrar' ? navegacaoRegistro.state : undefined}
            end={item.route === '/app'}
            className={() => `mobile-bottom-item ${item.principal ? 'principal' : ''} ${ativo ? 'ativo' : ''}`.trim()}
            aria-label={item.principal ? 'Registrar partida' : item.label}
          >
            <Icone aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
