import {
  FaBell,
  FaChartBar,
  FaClipboardList,
  FaCog,
  FaEllipsisH,
  FaGift,
  FaHistory,
  FaHome,
  FaQuestionCircle,
  FaShieldAlt,
  FaShoppingBag,
  FaSignOutAlt,
  FaTrophy,
  FaUser,
  FaUserFriends,
  FaUsers
} from 'react-icons/fa';
import { ESTADOS_ACESSO } from '../../utils/acesso';
import { ehAdministrador } from '../../utils/perfis';

export const MAIN_NAVIGATION_ITEMS = [
  {
    id: 'home',
    label: 'Home',
    route: '/app',
    icon: FaHome,
    activePaths: ['/app']
  },
  {
    id: 'partidas',
    label: 'Partidas',
    route: '/minhas-partidas',
    icon: FaClipboardList,
    activePaths: ['/minhas-partidas', '/partidas', '/partidas/*', '/feed', '/app/feed']
  },
  {
    id: 'grupos',
    label: 'Grupos',
    route: '/grupos',
    icon: FaUsers,
    activePaths: ['/grupos', '/grupos/*']
  },
  {
    id: 'ranking',
    label: 'Ranking',
    route: '/ranking',
    icon: FaTrophy,
    activePaths: ['/ranking', '/ranking/*', '/app/ranking-liga']
  },
  {
    id: 'mais',
    label: 'Mais',
    route: '/mais',
    icon: FaEllipsisH,
    activePaths: [
      '/mais',
      '/app/perfil',
      '/app/pendencias',
      '/app/scouts',
      '/app/pontos-qn',
      '/minhas-arenas',
      '/admin',
      '/admin/*'
    ]
  }
];

const MORE_SECTIONS = [
  {
    id: 'minha-area',
    title: 'Minha área',
    items: [
      {
        id: 'perfil',
        label: 'Meu perfil',
        description: 'Veja e edite seus dados',
        route: '/app/perfil',
        icon: FaUser,
        enabled: true
      },
      {
        id: 'pendencias',
        label: 'Minhas pendências',
        description: 'Partidas e vínculos pendentes',
        route: '/app/pendencias',
        icon: FaClipboardList,
        enabled: true,
        badgeKey: 'pendencias'
      },
      {
        id: 'notificacoes',
        label: 'Notificações',
        description: 'Alertas e novidades',
        route: '/app/pendencias',
        icon: FaBell,
        enabled: true,
        badgeKey: 'pendencias'
      },
      {
        id: 'convites',
        label: 'Convites',
        description: 'Grupos e eventos',
        route: '/app/pendencias',
        icon: FaUserFriends,
        enabled: true,
        badgeKey: 'pendencias'
      }
    ]
  },
  {
    id: 'jogo',
    title: 'Jogo',
    items: [
      {
        id: 'historico',
        label: 'Histórico',
        description: 'Suas partidas e resultados',
        route: '/minhas-partidas',
        icon: FaHistory,
        enabled: true
      },
      {
        id: 'scouts',
        label: 'Scouts',
        description: 'Atletas e duplas',
        route: '/app/scouts',
        icon: FaChartBar,
        enabled: true
      },
      {
        id: 'duplas',
        label: 'Minhas duplas',
        description: 'Parcerias que mais jogou',
        icon: FaUserFriends,
        enabled: false,
        isFuture: true
      }
    ]
  },
  {
    id: 'quebranunca',
    title: 'QuebraNunca',
    items: [
      {
        id: 'pontos-qn',
        label: 'Pontos QN',
        description: 'Acompanhe e resgate benefícios',
        route: '/app/pontos-qn',
        icon: FaGift,
        enabled: true
      },
      {
        id: 'beneficios',
        label: 'Benefícios',
        description: 'Resgate benefícios da comunidade',
        route: '/app/pontos-qn',
        icon: FaShieldAlt,
        enabled: true
      },
      {
        id: 'loja',
        label: 'Loja',
        description: 'Produtos oficiais QuebraNunca',
        icon: FaShoppingBag,
        enabled: false,
        isFuture: true
      }
    ]
  },
  {
    id: 'suporte',
    title: 'Suporte',
    items: [
      {
        id: 'ajuda',
        label: 'Ajuda',
        description: 'Dúvidas e suporte',
        icon: FaQuestionCircle,
        enabled: false,
        isFuture: true
      },
      {
        id: 'configuracoes',
        label: 'Configurações',
        description: 'Preferências do app',
        route: '/app/perfil?aba=configuracoes',
        icon: FaCog,
        enabled: true
      },
      {
        id: 'admin',
        label: 'Administração',
        description: 'Controles globais da plataforma',
        route: '/admin',
        icon: FaShieldAlt,
        enabled: true,
        visible: ({ usuario, estadoAcesso }) => ehAdministrador(usuario) && estadoAcesso === ESTADOS_ACESSO.ativo
      },
      {
        id: 'sair',
        label: 'Sair',
        description: 'Encerrar sessão',
        icon: FaSignOutAlt,
        enabled: true,
        danger: true,
        action: 'logout'
      }
    ]
  }
];

export function obterMainNavigationItems() {
  return MAIN_NAVIGATION_ITEMS;
}

export function obterMoreNavigationSections({ usuario, estadoAcesso } = {}) {
  return MORE_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => (
        typeof item.visible === 'function'
          ? item.visible({ usuario, estadoAcesso })
          : true
      ))
    }))
    .filter((section) => section.items.length > 0);
}
