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
    caminho: '/app/organizacao',
    nome: 'Painel',
    mostrarNoDashboard: false,
    descricao: 'Continue a operação das competições e dos jogos sob sua gestão.',
    visivel: () => false
  },
  {
    caminho: '/admin',
    nome: 'Painel Admin',
    mostrarNoDashboard: false,
    descricao: 'Acesse atalhos administrativos e parametrizações globais.',
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
    caminho: '/app/meus-jogos',
    nome: 'Meus Jogos',
    descricao: 'Todos os jogos vinculados ao seu atleta, com duplas, lados, placar e validação.',
    visivel: ({ gestorCompeticao, atleta, estadoAtivo }) => estadoAtivo && (gestorCompeticao || atleta)
  },
  {
    caminho: '/ranking',
    nome: 'Ranking',
    descricao: 'Consulte os pontos por liga e competição.',
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
    caminho: '/atletas',
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
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/grupos',
    nome: 'Grupos',
    descricao: 'Crie grupos, organize atletas e acompanhe os jogos lançados.',
    visivel: ({ gestorCompeticao, atleta, estadoAtivo }) => estadoAtivo && (gestorCompeticao || atleta)
  },
  {
    caminho: '/categorias',
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
    caminho: '/usuarios',
    nome: 'Usuários',
    descricao: 'Gerencie perfis, status e vínculo com atletas.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  },
  {
    caminho: '/convites-cadastro',
    nome: 'Convites',
    descricao: 'Crie e acompanhe convites fechados para novos organizadores.',
    visivel: ({ administrador, estadoAtivo }) => administrador && estadoAtivo
  }
];

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
  { path: '/dashboard', title: 'Painel', tipoTela: TIPOS_TELA.raiz },
  { path: '/app/perfil', title: 'Meu Perfil', tipoTela: TIPOS_TELA.raiz },
  { path: '/app/meus-jogos', title: 'Meus Jogos', tipoTela: TIPOS_TELA.acao },
  { path: '/perfil-usuario', title: 'Perfil Usuário', tipoTela: TIPOS_TELA.raiz },
  { path: '/app/pendencias', title: 'Pendências', tipoTela: TIPOS_TELA.acao },
  { path: '/atletas', title: 'Atletas', tipoTela: TIPOS_TELA.raiz },
  { path: '/duplas', title: 'Duplas', tipoTela: TIPOS_TELA.raiz },
  { path: '/ligas', title: 'Ligas', tipoTela: TIPOS_TELA.raiz },
  { path: '/locais', title: 'Locais', tipoTela: TIPOS_TELA.raiz },
  { path: '/formatos-campeonato', title: 'Formatos', tipoTela: TIPOS_TELA.raiz },
  { path: '/regras', title: 'Regras', tipoTela: TIPOS_TELA.raiz },
  { path: '/modelos-importacao', title: 'Modelos', tipoTela: TIPOS_TELA.raiz },
  { path: '/competicoes', title: 'Competições', tipoTela: TIPOS_TELA.raiz },
  { path: '/competicoes/:id', title: 'Competição', tipoTela: TIPOS_TELA.contexto },
  { path: '/grupos', title: 'Grupos', tipoTela: TIPOS_TELA.raiz },
  { path: '/grupos/:grupoId/atletas', title: 'Atletas do Grupo', tipoTela: TIPOS_TELA.contexto },
  { path: '/categorias', title: 'Categorias', tipoTela: TIPOS_TELA.raiz },
  { path: '/inscricoes', title: 'Inscrições', tipoTela: TIPOS_TELA.acao },
  { path: '/partidas/registrar', title: 'Registrar Partida', tipoTela: TIPOS_TELA.acao },
  { path: '/app/registrar-partida', title: 'Registrar Partida', tipoTela: TIPOS_TELA.acao },
  { path: '/partidas/consulta', title: 'Consultar Partidas', tipoTela: TIPOS_TELA.contexto },
  { path: '/partidas/campeonato', title: 'Partidas de Campeonato', tipoTela: TIPOS_TELA.contexto },
  { path: '/usuarios', title: 'Usuários', tipoTela: TIPOS_TELA.raiz },
  { path: '/convites-cadastro', title: 'Convites', tipoTela: TIPOS_TELA.raiz },
  { path: '/ranking', title: 'Ranking', tipoTela: TIPOS_TELA.acao },
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

  return ITENS_NAVEGACAO
    .filter((item) => item.visivel(contexto))
    .filter((item) => incluirDashboard || item.mostrarNoDashboard !== false);
}

export function obterItensNavegacaoPublica() {
  return ITENS_NAVEGACAO_PUBLICA;
}
