import { ehAdministrador, ehAtleta, ehGestorCompeticao } from '../utils/perfis';
import { ESTADOS_ACESSO } from '../utils/acesso';

const ITENS_NAVEGACAO_PUBLICA = [
  {
    caminho: '/',
    nome: 'Home'
  },
  {
    caminho: '/ranking',
    nome: 'Ranking'
  },
  {
    caminho: '/competicoes',
    nome: 'Competições'
  },
  {
    caminho: '/arenas',
    nome: 'Arenas'
  },
  {
    caminho: 'https://www.quebranunca.com/quebranunca',
    externo: true,
    nome: 'Loja'
  }
];

const ITENS_NAVEGACAO = [
  {
    caminho: '/app',
    nome: 'Home',
    mostrarNoDashboard: false,
    descricao: 'Veja campeonatos, inscrições abertas e rankings públicos.',
    visivel: () => true
  },
  {
    caminho: '/ranking',
    nome: 'Ranking',
    descricao: 'Consulte os pontos por liga e competição.',
    visivel: ({ gestorCompeticao, atleta, estadoAtivo }) => estadoAtivo && (gestorCompeticao || atleta)
  },
  {
    caminho: '/app/organizacao',
    nome: 'Painel',
    mostrarNoDashboard: false,
    descricao: 'Continue a operação das competições e dos jogos sob sua gestão.',
    visivel: () => false
  },
  {
    caminho: '/admin',
    nome: 'Admin',
    mostrarNoDashboard: false,
    descricao: 'Acesse o menu administrativo e controles globais da plataforma.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/admin/solicitacoes-acesso',
    nome: 'Solicitações de Acesso',
    descricao: 'Aprove, rejeite e envie convites para quem pediu acesso.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/app/perfil',
    nome: 'Meu Perfil',
    descricao: 'Atualize seus dados de acesso e o vínculo com atleta quando necessário.',
    visivel: () => true
  },
  {
    caminho: '/partidas/registrar',
    nome: 'Registrar Partidas',
    descricao: 'Cadastre confrontos, sorteie jogos e lance resultados.',
    visivel: ({ gestorCompeticao, atleta, estadoAtivo }) => estadoAtivo && (gestorCompeticao || atleta)
  },
  {
    caminho: '/grupos',
    nome: 'Grupos',
    descricao: 'Crie grupos, organize atletas e acompanhe os jogos lançados.',
    visivel: ({ organizador, atleta, estadoAtivo }) => estadoAtivo && (organizador || atleta)
  },
  {
    caminho: '/feed',
    nome: 'Feed',
    descricao: 'Acompanhe os jogos mais recentes da comunidade.',
    visivel: ({ gestorCompeticao, atleta, estadoAtivo }) => estadoAtivo && (gestorCompeticao || atleta)
  },
  {
    caminho: '/app/meus-jogos',
    nome: 'Meus Jogos',
    descricao: 'Todos os jogos vinculados ao seu atleta, com duplas, lados, placar e validação.',
    visivel: ({ gestorCompeticao, atleta, estadoAtivo }) => estadoAtivo && (gestorCompeticao || atleta)
  },
  {
    caminho: '/minhas-partidas-registradas',
    nome: 'Minhas Partidas Registradas',
    descricao: 'Veja e edite partidas que você cadastrou, mesmo quando não participou do jogo.',
    visivel: ({ gestorCompeticao, atleta, estadoAtivo }) => estadoAtivo && (gestorCompeticao || atleta)
  },
  {
    caminho: '/perfil-usuario',
    nome: 'Perfil Usuário',
    descricao: 'Consulte os dados do usuário autenticado e o vínculo atual com atleta.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/app/pendencias',
    nome: 'Pendências',
    descricao: 'Centralize aprovações de partidas e a regularização de atletas pendentes.',
    visivel: ({ estadoAtivo }) => estadoAtivo
  },
  {
    caminho: '/admin/atletas',
    nome: 'Atletas',
    descricao: 'Cadastre e organize os atletas do seu circuito.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/duplas',
    nome: 'Duplas',
    descricao: 'Monte as duplas com exatamente dois atletas.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/ligas',
    nome: 'Ligas',
    descricao: 'Cadastre as ligas que agrupam as competições.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/locais',
    nome: 'Locais',
    descricao: 'Cadastre e mantenha os locais disponíveis para suas competições.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/arenas',
    nome: 'Arenas',
    descricao: 'Consulte arenas públicas ativas.',
    visivel: () => true
  },
  {
    caminho: '/minhas-arenas',
    nome: 'Minhas Arenas',
    descricao: 'Acesse o dashboard administrativo das arenas que você gerencia.',
    visivel: ({ estadoAtivo }) => estadoAtivo
  },
  {
    caminho: '/formatos-campeonato',
    nome: 'Formatos',
    descricao: 'Gerencie formatos reutilizáveis para grupos, chaves e mata-mata.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/regras',
    nome: 'Regras',
    descricao: 'Crie regras reutilizáveis para partidas e pontuação.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/modelos-importacao',
    nome: 'Modelos',
    descricao: 'Baixe modelos CSV e execute importações em lote pelos fluxos já existentes.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/competicoes',
    nome: 'Competições',
    descricao: 'Veja e gerencie campeonatos, eventos e grupos disponíveis para o seu perfil.',
    visivel: ({ organizador, estadoAtivo }) => organizador && estadoAtivo
  },
  {
    caminho: '/admin/competicoes',
    nome: 'Competições',
    descricao: 'Gerencie campeonatos, eventos e competições globais.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/campeonatos/novo',
    nome: 'Novo Campeonato',
    descricao: 'Crie um campeonato e vincule categorias já cadastradas.',
    visivel: ({ gestorCompeticao, estadoAtivo }) => gestorCompeticao && estadoAtivo
  },
  {
    caminho: '/admin/grupos',
    nome: 'Grupos',
    descricao: 'Gerencie grupos, atletas vinculados e jogos lançados.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/admin/categorias',
    nome: 'Categorias',
    descricao: 'Defina gênero e nível técnico por competição.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/inscricoes',
    nome: 'Inscrições',
    descricao: 'Gerencie inscrições de duplas nas categorias de campeonatos.',
    visivel: ({ administrador }) => administrador
  },
  {
    caminho: '/admin/usuarios',
    nome: 'Usuários',
    descricao: 'Gerencie perfis, status e vínculo com atletas.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/admin/convites',
    nome: 'Convites',
    descricao: 'Crie e acompanhe convites fechados para novos organizadores.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/admin/partidas',
    nome: 'Partidas',
    descricao: 'Consulte e gerencie partidas registradas na plataforma.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  }
];

const CAMINHOS_MENU_ADMIN = [
  '/app',
  '/admin/partidas',
  '/admin/grupos',
  '/admin/atletas',
  '/ranking',
  '/admin/competicoes',
  '/arenas',
  '/admin'
];

const NOMES_MENU_ADMIN = {
  '/app': 'Início',
  '/admin': 'Administração'
};

export const TIPOS_TELA = {
  raiz: 'raiz',
  acao: 'acao',
  contexto: 'contexto'
};

export const ROTAS_APP_HEADER = [
  { path: '/', title: 'Home', tipoTela: TIPOS_TELA.raiz },
  { path: '/app', title: 'Home', tipoTela: TIPOS_TELA.raiz },
  { path: '/app/inicio', title: 'Painel', tipoTela: TIPOS_TELA.raiz },
  { path: '/app/organizacao', title: 'Painel', tipoTela: TIPOS_TELA.raiz },
  { path: '/admin', title: 'Painel Admin', tipoTela: TIPOS_TELA.raiz },
  { path: '/admin/usuarios', title: 'Usuários', tipoTela: TIPOS_TELA.raiz },
  { path: '/admin/solicitacoes-acesso', title: 'Solicitações', tipoTela: TIPOS_TELA.raiz },
  { path: '/admin/convites', title: 'Convites', tipoTela: TIPOS_TELA.raiz },
  { path: '/admin/atletas', title: 'Atletas', tipoTela: TIPOS_TELA.raiz },
  { path: '/admin/grupos', title: 'Grupos', tipoTela: TIPOS_TELA.raiz },
  { path: '/admin/competicoes', title: 'Competições', tipoTela: TIPOS_TELA.raiz },
  { path: '/admin/categorias', title: 'Categorias', tipoTela: TIPOS_TELA.raiz },
  { path: '/admin/partidas', title: 'Partidas', tipoTela: TIPOS_TELA.raiz },
  { path: '/dashboard', title: 'Painel', tipoTela: TIPOS_TELA.raiz },
  { path: '/app/perfil', title: 'Meu Perfil', tipoTela: TIPOS_TELA.raiz },
  { path: '/app/meus-jogos', title: 'Meus Jogos', tipoTela: TIPOS_TELA.acao },
  { path: '/minhas-partidas-registradas', title: 'Minhas Partidas Registradas', tipoTela: TIPOS_TELA.acao },
  { path: '/perfil-usuario', title: 'Perfil Usuário', tipoTela: TIPOS_TELA.raiz },
  { path: '/app/pendencias', title: 'Pendências', tipoTela: TIPOS_TELA.acao },
  { path: '/atletas', title: 'Atletas', tipoTela: TIPOS_TELA.raiz },
  { path: '/atletas/:atletaId', title: 'Atleta', tipoTela: TIPOS_TELA.contexto },
  { path: '/atletas/:atletaId/dashboard', title: 'Atleta', tipoTela: TIPOS_TELA.contexto },
  { path: '/duplas', title: 'Duplas', tipoTela: TIPOS_TELA.raiz },
  { path: '/ligas', title: 'Ligas', tipoTela: TIPOS_TELA.raiz },
  { path: '/locais', title: 'Locais', tipoTela: TIPOS_TELA.raiz },
  { path: '/arenas', title: 'Arenas', tipoTela: TIPOS_TELA.raiz },
  { path: '/minhas-arenas', title: 'Minhas Arenas', tipoTela: TIPOS_TELA.raiz },
  { path: '/arenas/admin/:arenaId', title: 'Dashboard da Arena', tipoTela: TIPOS_TELA.contexto },
  { path: '/arenas/:slug', title: 'Arena', tipoTela: TIPOS_TELA.contexto },
  { path: '/formatos-campeonato', title: 'Formatos', tipoTela: TIPOS_TELA.raiz },
  { path: '/regras', title: 'Regras', tipoTela: TIPOS_TELA.raiz },
  { path: '/modelos-importacao', title: 'Modelos', tipoTela: TIPOS_TELA.raiz },
  { path: '/competicoes', title: 'Competições', tipoTela: TIPOS_TELA.raiz },
  { path: '/competicoes/:id', title: 'Competição', tipoTela: TIPOS_TELA.contexto },
  { path: '/campeonatos/novo', title: 'Novo Campeonato', tipoTela: TIPOS_TELA.acao },
  { path: '/campeonatos/:id/editar', title: 'Editar Campeonato', tipoTela: TIPOS_TELA.contexto },
  { path: '/grupos', title: 'Grupos', tipoTela: TIPOS_TELA.raiz },
  { path: '/grupos/:grupoId/atletas', title: 'Atletas do Grupo', tipoTela: TIPOS_TELA.contexto },
  { path: '/categorias', title: 'Categorias', tipoTela: TIPOS_TELA.raiz },
  { path: '/inscricoes', title: 'Inscrições', tipoTela: TIPOS_TELA.acao },
  { path: '/partidas/registrar', title: 'Registrar Partida', tipoTela: TIPOS_TELA.acao },
  { path: '/app/registrar-partida', title: 'Registrar Partida', tipoTela: TIPOS_TELA.acao },
  { path: '/feed', title: 'Feed', tipoTela: TIPOS_TELA.acao },
  { path: '/app/feed', title: 'Feed', tipoTela: TIPOS_TELA.acao },
  { path: '/partidas/consulta', title: 'Consultar Partidas', tipoTela: TIPOS_TELA.contexto },
  { path: '/partidas/campeonato', title: 'Partidas de Campeonato', tipoTela: TIPOS_TELA.contexto },
  { path: '/usuarios', title: 'Usuários', tipoTela: TIPOS_TELA.raiz },
  { path: '/convites-cadastro', title: 'Convites', tipoTela: TIPOS_TELA.raiz },
  { path: '/ranking', title: 'Ranking', tipoTela: TIPOS_TELA.acao },
  { path: '/ranking/liga', title: 'Ranking da Liga', tipoTela: TIPOS_TELA.acao },
  { path: '/login', title: 'Entrar', tipoTela: TIPOS_TELA.raiz },
  { path: '/app/ranking-liga', title: 'Ranking da Liga', tipoTela: TIPOS_TELA.acao }
];

export function obterItensNavegacao(usuario, estadoAcesso, opcoes = {}) {
  const { incluirDashboard = true } = opcoes;
  const contexto = {
    administrador: ehAdministrador(usuario),
    organizador: !ehAdministrador(usuario) && ehGestorCompeticao(usuario),
    gestorCompeticao: ehGestorCompeticao(usuario),
    atleta: ehAtleta(usuario),
    estadoAtivo: estadoAcesso === ESTADOS_ACESSO.ativo
  };

  const itensVisiveis = ITENS_NAVEGACAO
    .filter((item) => item.visivel(contexto))
    .filter((item) => incluirDashboard || item.mostrarNoDashboard !== false);

  if (!contexto.administrador || !contexto.estadoAtivo) {
    return itensVisiveis;
  }

  return CAMINHOS_MENU_ADMIN
    .map((caminho) => itensVisiveis.find((item) => item.caminho === caminho))
    .filter(Boolean)
    .map((item) => ({
      ...item,
      nome: NOMES_MENU_ADMIN[item.caminho] || item.nome
    }));
}

export function obterItensNavegacaoPublica() {
  return ITENS_NAVEGACAO_PUBLICA;
}
