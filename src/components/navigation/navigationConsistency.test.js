import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MAIN_NAVIGATION_ITEMS, obterMoreNavigationSections } from './navigationConfig';
import {
  ROTAS_APP_HEADER,
  obterItensNavegacao,
  obterItensNavegacaoPublica
} from '../../pages/navagacao';
import { ESTADOS_ACESSO } from '../../utils/acesso';
import { PERFIS_USUARIO } from '../../utils/perfis';

const APP_ROUTES_SOURCE = readFileSync(join(process.cwd(), 'src/App.jsx'), 'utf8');

const CAMINHOS_EXECUTAVEIS = new Set(
  [...APP_ROUTES_SOURCE.matchAll(/<Route\s+[^>]*path=(["'])(.*?)\1/g)]
    .map((match) => normalizarCaminho(match[2]))
    .filter((path) => path && path !== '*')
);

const ALIASES_E_REDIRECTS = new Map([
  ['/app/mais', 'Alias autenticado para /mais.'],
  ['/app/registrar-partida', 'Alias antigo para /partidas/registrar.'],
  ['/app/meus-jogos', 'Alias legado para /minhas-partidas.'],
  ['/app/minhas-partidas', 'Alias autenticado para /minhas-partidas.'],
  ['/minhas-partidas-registradas', 'Alias legado para /minhas-partidas?filtro=registradas.'],
  ['/app/inicio', 'Alias administrativo para o dashboard.'],
  ['/app/organizacao', 'Alias legado de organizacao para o dashboard.'],
  ['/dashboard', 'Alias legado para o dashboard administrativo.'],
  ['/meu-perfil', 'Alias legado para /app/perfil.'],
  ['/pendencias', 'Alias para /app/pendencias.'],
  ['/pendencias-atletas', 'Alias legado encadeado para pendencias.'],
  ['/usuarios', 'Alias administrativo legado para usuarios.'],
  ['/convites-cadastro', 'Alias administrativo legado para convites.']
]);

const EXCECOES_LEGADAS = new Map([
  [
    '/app/ranking-liga',
    [
      'Consumido por activePaths do bottom navigation e por ROTAS_APP_HEADER.',
      'Ainda nao existe rota executavel correspondente em App.jsx.',
      'Mantido como compatibilidade legada do ranking da liga; tarefa futura deve decidir entre criar rota, redirecionar ou remover a referencia.'
    ].join(' ')
  ],
  [
    '/competicoes/:id',
    [
      'Consumido por ROTAS_APP_HEADER como metadado contextual.',
      'Ainda nao existe rota executavel correspondente em App.jsx.',
      'Mantido em investigacao; tarefa futura deve alinhar o detalhe de competicao com o router ou remover o metadado.'
    ].join(' ')
  ]
]);

function normalizarCaminho(caminho) {
  if (!caminho) {
    return '';
  }

  if (ehCaminhoExterno(caminho)) {
    return caminho;
  }

  const [semQuery] = caminho.split(/[?#]/);
  const semBarraFinal = semQuery.length > 1 ? semQuery.replace(/\/+$/, '') : semQuery;

  return semBarraFinal || '/';
}

function ehCaminhoExterno(caminho) {
  return /^https?:\/\//.test(caminho);
}

function transformarRotaEmRegex(rota) {
  const partes = rota.split('/').filter(Boolean);
  const pattern = partes
    .map((parte) => {
      if (parte.startsWith(':')) {
        return '[^/]+';
      }

      return parte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');

  return new RegExp(`^/${pattern}$`);
}

const ROTAS_PARAMETRIZADAS = [...CAMINHOS_EXECUTAVEIS]
  .filter((path) => path.includes(':'))
  .map((path) => ({
    path,
    regex: transformarRotaEmRegex(path)
  }));

function classificarCaminho(caminhoBruto) {
  if (ehCaminhoExterno(caminhoBruto)) {
    return { tipo: 'externo' };
  }

  const caminho = normalizarCaminho(caminhoBruto);

  if (ALIASES_E_REDIRECTS.has(caminho)) {
    return { tipo: 'alias', detalhe: ALIASES_E_REDIRECTS.get(caminho) };
  }

  if (EXCECOES_LEGADAS.has(caminho)) {
    return { tipo: 'excecao-legada', detalhe: EXCECOES_LEGADAS.get(caminho) };
  }

  if (CAMINHOS_EXECUTAVEIS.has(caminho)) {
    return { tipo: 'rota-executavel' };
  }

  if (caminho.endsWith('/*')) {
    return classificarActivePathComCuringa(caminho);
  }

  const rotaParametrizada = ROTAS_PARAMETRIZADAS.find((rota) => rota.regex.test(caminho));
  if (rotaParametrizada) {
    return {
      tipo: 'rota-parametrizada',
      detalhe: `Corresponde a ${rotaParametrizada.path}.`
    };
  }

  return { tipo: 'inconsistente' };
}

function classificarActivePathComCuringa(caminho) {
  const base = caminho.replace(/\/\*$/, '');
  const baseClassificada = classificarCaminho(base);

  if (baseClassificada.tipo === 'inconsistente') {
    return { tipo: 'inconsistente' };
  }

  return {
    tipo: 'active-path-prefixo',
    detalhe: `Prefixo ativo baseado em ${base}.`
  };
}

function criarMensagemFalha({ caminho, origem, arquivo }) {
  return [
    `Path inconsistente: ${caminho}`,
    `Origem: ${origem}`,
    `Arquivo/configuracao: ${arquivo}`,
    'Crie a rota em App.jsx, corrija o caminho configurado ou adicione uma excecao legada explicita com justificativa.'
  ].join('\n');
}

function validarCaminho(configuracao) {
  const classificacao = classificarCaminho(configuracao.caminho);

  return {
    ...configuracao,
    classificacao,
    valido: classificacao.tipo !== 'inconsistente'
  };
}

function coletarCaminhosNavigationConfig() {
  const caminhosMainNavigation = MAIN_NAVIGATION_ITEMS.flatMap((item) => [
    {
      caminho: item.route,
      origem: `MAIN_NAVIGATION_ITEMS.${item.id}.route`,
      arquivo: 'src/components/navigation/navigationConfig.js'
    },
    ...(item.activePaths || []).map((activePath) => ({
      caminho: activePath,
      origem: `MAIN_NAVIGATION_ITEMS.${item.id}.activePaths`,
      arquivo: 'src/components/navigation/navigationConfig.js'
    }))
  ]);

  const caminhosMais = obterMoreNavigationSections({
    usuario: { perfil: PERFIS_USUARIO.administrador },
    estadoAcesso: ESTADOS_ACESSO.ativo
  }).flatMap((section) => (
    section.items
      .filter((item) => item.route)
      .map((item) => ({
        caminho: item.route,
        origem: `MORE_SECTIONS.${section.id}.${item.id}.route`,
        arquivo: 'src/components/navigation/navigationConfig.js'
      }))
  ));

  return [...caminhosMainNavigation, ...caminhosMais];
}

function coletarCaminhosNavagacao() {
  const caminhosHeader = ROTAS_APP_HEADER.map((rota) => ({
    caminho: rota.path,
    origem: `ROTAS_APP_HEADER.${rota.title}`,
    arquivo: 'src/pages/navagacao.js'
  }));

  const perfis = [
    PERFIS_USUARIO.administrador,
    PERFIS_USUARIO.organizador,
    PERFIS_USUARIO.atleta
  ];

  const caminhosDashboard = perfis.flatMap((perfil) => (
    obterItensNavegacao({ perfil }, ESTADOS_ACESSO.ativo)
      .map((item) => ({
        caminho: item.caminho,
        origem: `obterItensNavegacao.${item.nome}`,
        arquivo: 'src/pages/navagacao.js'
      }))
  ));

  const caminhosPublicos = obterItensNavegacaoPublica().map((item) => ({
    caminho: item.caminho,
    origem: `obterItensNavegacaoPublica.${item.nome}`,
    arquivo: 'src/pages/navagacao.js'
  }));

  return [...caminhosHeader, ...caminhosDashboard, ...caminhosPublicos];
}

function coletarCaminhosConfigurados() {
  return [
    ...coletarCaminhosNavigationConfig(),
    ...coletarCaminhosNavagacao()
  ];
}

describe('consistencia de rotas e navegacao', () => {
  it('aceita rota executavel declarada em App.jsx', () => {
    expect(classificarCaminho('/ranking')).toMatchObject({ tipo: 'rota-executavel' });
  });

  it('aceita alias ou redirect explicito', () => {
    expect(classificarCaminho('/app/registrar-partida')).toMatchObject({ tipo: 'alias' });
  });

  it('aceita caminho que corresponde a rota parametrizada', () => {
    expect(classificarCaminho('/grupos/grupo-1')).toMatchObject({ tipo: 'rota-parametrizada' });
  });

  it('aceita excecao legada explicita', () => {
    expect(classificarCaminho('/competicoes/:id')).toMatchObject({ tipo: 'excecao-legada' });
  });

  it('rejeita caminho inexistente', () => {
    expect(classificarCaminho('/rota-inexistente')).toMatchObject({ tipo: 'inconsistente' });
  });

  it('monta mensagem acionavel para caminho invalido', () => {
    expect(criarMensagemFalha({
      caminho: '/rota-inexistente',
      origem: 'config.fake',
      arquivo: 'src/fake.js'
    })).toContain('Path inconsistente: /rota-inexistente');
  });

  it('mantem classificados todos os paths atuais de navegacao e header', () => {
    const inconsistentes = coletarCaminhosConfigurados()
      .map(validarCaminho)
      .filter((resultado) => !resultado.valido);

    expect(
      inconsistentes.map(criarMensagemFalha).join('\n\n')
    ).toBe('');
  });
});
