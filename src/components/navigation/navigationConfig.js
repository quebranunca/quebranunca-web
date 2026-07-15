import {
  FaBell,
  FaChartBar,
  FaCog,
  FaEllipsisH,
  FaGift,
  FaHistory,
  FaHome,
  FaInfoCircle,
  FaPlus,
  FaQuestionCircle,
  FaShieldAlt,
  FaSignOutAlt,
  FaTrophy,
  FaUser,
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
    id: 'ranking',
    label: 'Rankings',
    route: '/ranking',
    icon: FaTrophy,
    activePaths: ['/ranking', '/ranking/*', '/app/ranking-liga']
  },
  {
    id: 'registrar',
    label: 'Registrar',
    route: '/partidas/registrar',
    icon: FaPlus,
    activePaths: ['/partidas/registrar', '/app/registrar-partida'],
    principal: true
  },
  {
    id: 'grupos',
    label: 'Grupos',
    route: '/grupos',
    icon: FaUsers,
    activePaths: ['/grupos', '/grupos/*']
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
      '/minhas-partidas',
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
        id: 'notificacoes',
        label: 'Notificações',
        description: 'Alertas e novidades',
        route: '/app/pendencias',
        icon: FaBell,
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
        id: 'scouts',
        label: 'Scouts',
        description: 'Atletas e duplas',
        route: '/app/scouts',
        icon: FaChartBar,
        enabled: true
      },
      {
        id: 'historico',
        label: 'Histórico',
        description: 'Suas partidas e resultados',
        route: '/minhas-partidas',
        icon: FaHistory,
        enabled: true
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
        route: '/app/pontos-qn?aba=beneficios',
        icon: FaShieldAlt,
        enabled: true
      },
      {
        id: 'conquistas',
        label: 'Conquistas',
        description: 'Reconhecimentos da sua jornada',
        icon: FaTrophy,
        enabled: false,
        isFuture: true
      }
    ]
  },
  {
    id: 'administracao',
    title: 'Administração',
    visible: ({ usuario, estadoAcesso }) => ehAdministrador(usuario) && estadoAcesso === ESTADOS_ACESSO.ativo,
    items: [
      {
        id: 'admin-painel',
        label: 'Painel Admin',
        description: 'Visão administrativa',
        route: '/admin',
        icon: FaShieldAlt,
        enabled: true
      },
      {
        id: 'admin-usuarios',
        label: 'Usuários',
        description: 'Perfis, status e vínculos',
        route: '/admin/usuarios',
        icon: FaUsers,
        enabled: true
      },
      {
        id: 'admin-partidas',
        label: 'Partidas',
        description: 'Consulta global e ações administrativas',
        route: '/admin/partidas',
        icon: FaHistory,
        enabled: true
      },
      {
        id: 'admin-solicitacoes',
        label: 'Solicitações',
        description: 'Acesso, convites e pendências',
        route: '/admin/solicitacoes-acesso',
        icon: FaBell,
        enabled: true
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
        id: 'sobre',
        label: 'Sobre',
        description: 'Informações sobre o QuebraNunca',
        icon: FaInfoCircle,
        enabled: false,
        isFuture: true
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

export function obterMoreNavigationSections(contexto = {}) {
  return MORE_SECTIONS
    .filter((section) => (
      typeof section.visible === 'function'
        ? section.visible(contexto)
        : true
    ))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => (
        typeof item.visible === 'function'
          ? item.visible(contexto)
          : true
      ))
    }))
    .filter((section) => section.items.length > 0);
}
