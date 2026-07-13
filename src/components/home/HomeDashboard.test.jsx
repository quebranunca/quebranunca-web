import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { HomeDashboard } from './HomeDashboard';
import { HomeSectionType, homeSectionsConfig } from './homeSectionsConfig';

const autenticacaoMock = vi.hoisted(() => ({
  sair: vi.fn(),
  usuario: {
    id: 'usuario-1',
    nome: 'Gustavo Henrique Almeida Souza',
    apelido: 'Primo',
    atletaId: 'atleta-1',
    perfil: 3
  }
}));

vi.mock('../../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    usuario: autenticacaoMock.usuario,
    sair: autenticacaoMock.sair
  })
}));

function criarModulo(dados, overrides = {}) {
  return {
    dados,
    carregando: false,
    erro: '',
    ...overrides
  };
}

function criarUsuarioPadrao(overrides = {}) {
  return {
    id: 'usuario-1',
    nome: 'Gustavo Henrique Almeida Souza',
    apelido: 'Primo',
    atletaId: 'atleta-1',
    perfil: 3,
    ...overrides
  };
}

function criarPartida(overrides = {}) {
  return {
    id: 'partida-1',
    resultado: 'W',
    dataPartida: new Date().toISOString(),
    grupo: 'Grupo Praia',
    status: 'Encerrada',
    duplaAAtleta1Id: 'atleta-1',
    nomeDuplaAAtleta1: 'Primo',
    duplaAAtleta2Id: 'atleta-2',
    nomeDuplaAAtleta2: 'Gustavo',
    duplaBAtleta1Id: 'atleta-3',
    nomeDuplaBAtleta1: 'Rafa',
    duplaBAtleta2Id: 'atleta-4',
    nomeDuplaBAtleta2: 'Leo',
    placarSuaDupla: 21,
    placarAdversarios: 18,
    ...overrides
  };
}

function criarGamificacao(overrides = {}) {
  return {
    pontuacao: {
      saldoAtual: 2470,
      totalAcumulado: 370,
      totalResgatado: 0,
      temAtletaVinculado: true
    },
    nivel: {
      nome: 'Bronze',
      numero: 1,
      pontosMinimos: 0,
      pontosProximaFaixa: 500,
      progressoPercentual: 74,
      pontosRestantes: 130
    },
    proximosBeneficios: [
      {
        id: 'beneficio-1',
        titulo: 'Cupom Frete Grátis',
        pontosNecessarios: 500
      }
    ],
    ...overrides
  };
}

function criarModulos(overrides = {}) {
  return {
    perfil: criarModulo({
      atletaId: 'atleta-1',
      nomeCompleto: 'Gustavo Henrique Almeida Souza',
      nome: 'Gustavo Henrique Almeida Souza',
      apelido: 'Primo',
      categoriaPrincipal: 'Intermediario',
      posicaoRanking: 4
    }),
    resumo: criarModulo({
      totalPartidas: 12,
      vitorias: 7,
      derrotas: 5,
      aproveitamento: 58,
      sequenciaAtual: 2
    }),
    gamificacao: criarModulo(criarGamificacao()),
    pendencias: criarModulo({
      total: 0,
      altaPrioridade: 0
    }),
    ultimasPartidas: criarModulo([criarPartida()]),
    conexoes: criarModulo({
      melhoresParceiros: [],
      parceirosRecentes: []
    }),
    ...overrides
  };
}

function LocalizacaoAtual() {
  const location = useLocation();
  return <span data-testid="rota-atual">{location.pathname}</span>;
}

function esperarAntes(elementoAnterior, elementoPosterior) {
  expect(
    elementoAnterior.compareDocumentPosition(elementoPosterior) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
}

function renderizarHome({
  modulos = criarModulos(),
  rota = '/app',
  onConfirmarPendenciaPartida,
  onNaoReconhecerPendenciaPartida,
  confirmandoPendenciaId,
  contestandoPendenciaId
} = {}) {
  return render(
    <MemoryRouter
      initialEntries={[rota]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <HomeDashboard
        modulos={modulos}
        carregando={false}
        erro=""
        onConfirmarPendenciaPartida={onConfirmarPendenciaPartida}
        onNaoReconhecerPendenciaPartida={onNaoReconhecerPendenciaPartida}
        confirmandoPendenciaId={confirmandoPendenciaId}
        contestandoPendenciaId={contestandoPendenciaId}
      />
      <LocalizacaoAtual />
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  autenticacaoMock.sair.mockReset();
  autenticacaoMock.usuario = criarUsuarioPadrao();
});

describe('HomeDashboard nova experiencia', () => {
  it('renderiza o hero visual com saudacao, notificacoes e avatar da conta', () => {
    renderizarHome();

    const hero = screen.getByTestId('home-dashboard-hero');

    expect(hero.getAttribute('style')).toContain('home-hero-futevolei');
    expect(within(hero).getByText(/Bo(m|a) (dia|tarde|noite)/i)).toBeInTheDocument();
    expect(within(hero).getByRole('heading', { name: 'Gustavo' })).toBeInTheDocument();
    expect(within(hero).getByText('Primo • Bronze')).toBeInTheDocument();
    expect(within(hero).getByRole('button', { name: /Abrir pendências/i })).toBeInTheDocument();
    expect(within(hero).getByRole('button', { name: /Abrir menu da conta/i })).toBeInTheDocument();
  });

  it('remove o card de perfil redundante da Home', () => {
    renderizarHome();

    expect(screen.queryByRole('region', { name: /Identidade do usuário/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Abrir meu perfil/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Gustavo Henrique Almeida Souza')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Pontos QN/i })).toBeInTheDocument();
  });

  it('continua renderizando o dashboard quando apelido nao existe', () => {
    autenticacaoMock.usuario = criarUsuarioPadrao({ apelido: '' });

    renderizarHome({
      modulos: criarModulos({
        perfil: criarModulo({
          atletaId: 'atleta-1',
          nomeCompleto: 'Gustavo Henrique Almeida Souza',
          nome: 'Gustavo Henrique Almeida Souza',
          apelido: ''
        })
      })
    });

    expect(screen.queryByRole('region', { name: /Identidade do usuário/i })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Pontos QN/i })).toBeInTheDocument();
  });

  it('mostra resumo compacto de pendencias com link para a lista completa', () => {
    const pendencia = {
      id: 'pendencia-1',
      tipo: 3,
      partidaId: 'partida-duplicada',
      nomeGrupo: 'Beach Friends',
      dataPartida: new Date().toISOString(),
      nomeDuplaAAtleta1: 'Primo',
      nomeDuplaAAtleta2: 'Gustavo',
      nomeDuplaBAtleta1: 'Paulo',
      nomeDuplaBAtleta2: 'Renato',
      placarDuplaA: 21,
      placarDuplaB: 18,
      nomeCriadoPorUsuario: 'Bruno'
    };

    renderizarHome({
      modulos: criarModulos({
        pendencias: criarModulo({
          total: 3,
          altaPrioridade: 1,
          confirmacaoPartidaMaisRecente: pendencia
        })
      })
    });

    const card = screen.getByRole('region', { name: /Pendências/i });

    expect(within(card).getByText('PENDENTE')).toBeInTheDocument();
    expect(within(card).getByText('Você possui 3 pendências')).toBeInTheDocument();
    expect(within(card).getByText('Beach Friends • Primo / Gustavo')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Ver todas/i })).toHaveAttribute('href', '/app/pendencias');
    expect(within(card).queryByRole('button', { name: /Confirmar partida/i })).not.toBeInTheDocument();
  });

  it('nao renderiza card de pendencia quando nao ha confirmacao pendente', () => {
    renderizarHome();

    expect(screen.queryByRole('region', { name: /Pendências/i })).not.toBeInTheDocument();
  });

  it('renderiza card principal com Pontos QN, progresso, recompensa e CTA', () => {
    renderizarHome();

    const card = screen.getByRole('region', { name: /Pontos QN/i });

    expect(within(card).getAllByText('Pontos QN').length).toBeGreaterThan(0);
    expect(within(card).queryByRole('img', { name: 'Badge nível Bronze' })).not.toBeInTheDocument();
    expect(within(card).getByRole('img', { name: 'Medalha nível Bronze' })).toBeInTheDocument();
    expect(within(card).getByText('Bronze')).toBeInTheDocument();
    expect(within(card).getByText('Nível 1')).toBeInTheDocument();
    expect(within(card).getByText('370 / 500 QN')).toBeInTheDocument();
    expect(within(card).getByText('Faltam 130 QN para Prata')).toBeInTheDocument();
    expect(within(card).getByText('2.470')).toBeInTheDocument();
    expect(within(card).getByText('QN')).toBeInTheDocument();
    expect(within(card).getByText('Próxima recompensa')).toBeInTheDocument();
    expect(within(card).getByText('Cupom Frete Grátis')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Ver benefícios/i })).toHaveAttribute('href', '/app/pontos-qn');
  });

  it('mantem a area de Pontos QN separada das metricas esportivas', () => {
    renderizarHome();

    const card = screen.getByRole('region', { name: /Pontos QN/i });

    expect(within(card).queryByText(/Vitórias/i)).not.toBeInTheDocument();
    expect(within(card).queryByText(/Derrotas/i)).not.toBeInTheDocument();
    expect(within(card).queryByText(/Aproveitamento/i)).not.toBeInTheDocument();
    expect(within(card).queryByText(/Ranking/i)).not.toBeInTheDocument();
    expect(within(card).queryByText(/Scout/i)).not.toBeInTheDocument();
  });

  it('continua renderizando a Home quando gamificacao esta ausente', () => {
    renderizarHome({
      modulos: criarModulos({
        gamificacao: criarModulo(null)
      })
    });

    expect(screen.getByRole('region', { name: /Pontos QN/i })).toBeInTheDocument();
    expect(screen.getByText('Comece registrando ou confirmando partidas para evoluir.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Registrar partida/i })).toBeInTheDocument();
  });

  it('mostra fallback discreto quando gamificacao falha e mantem a Home utilizavel', () => {
    renderizarHome({
      modulos: criarModulos({
        gamificacao: criarModulo(null, { erro: 'API indisponível' })
      })
    });

    expect(screen.getByRole('region', { name: /Pontos QN/i })).toBeInTheDocument();
    expect(screen.getByText('Pontos QN indisponíveis agora.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Registrar partida/i })).toBeInTheDocument();
    expect(screen.getByText('Seu desempenho')).toBeInTheDocument();
  });

  it('mantem Registrar Partida como CTA principal e Criar Grupo como acao secundaria', async () => {
    const usuario = userEvent.setup();
    renderizarHome();

    const registrar = screen.getByRole('link', { name: /Registrar partida/i });
    const criarGrupo = screen.getByRole('link', { name: /Criar grupo/i });

    expect(registrar).toHaveClass('home-dashboard-cta-principal');
    expect(criarGrupo).toHaveClass('home-dashboard-cta-secundario');
    expect(screen.getByText('Salve seu jogo e atualize sua evolução.')).toBeInTheDocument();
    expect(screen.getByText('Ranking, histórico e scouts.')).toBeInTheDocument();

    await usuario.click(registrar);
    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/partidas/registrar');
  });

  it('mostra Seu desempenho com as quatro metricas principais', () => {
    renderizarHome();

    const desempenho = screen.getByRole('region', { name: /Seu desempenho/i });

    expect(within(desempenho).getByRole('link', { name: /Ver detalhes/i })).toHaveAttribute('href', '/app/scouts');
    expect(within(desempenho).getByText('Partidas')).toBeInTheDocument();
    expect(within(desempenho).getByText('12')).toBeInTheDocument();
    expect(within(desempenho).getByText('Vitórias')).toBeInTheDocument();
    expect(within(desempenho).getByText('7')).toBeInTheDocument();
    expect(within(desempenho).getByText('Aproveitamento')).toBeInTheDocument();
    expect(within(desempenho).getByText('58%')).toBeInTheDocument();
    expect(within(desempenho).getByText('Sequência')).toBeInTheDocument();
    expect(within(desempenho).getByText('2')).toBeInTheDocument();
  });

  it('mostra apenas o ultimo jogo sem placar pendente ou 0 x 0 artificial', () => {
    renderizarHome({
      modulos: criarModulos({
        ultimasPartidas: criarModulo([
          criarPartida(),
          criarPartida({
            id: 'partida-2',
            resultado: 'L',
            grupo: '',
            placarSuaDupla: null,
            placarAdversarios: null
          })
        ])
      })
    });

    const ultimoJogo = screen.getByRole('region', { name: /Último jogo/i });

    expect(within(ultimoJogo).getByRole('link', { name: /Ver histórico/i })).toBeInTheDocument();
    expect(within(ultimoJogo).getAllByText('Grupo Praia').length).toBeGreaterThan(0);
    expect(within(ultimoJogo).queryByText('Partida avulsa')).not.toBeInTheDocument();
    expect(within(ultimoJogo).getByLabelText('Resultado com placar')).toBeInTheDocument();
    expect(within(ultimoJogo).getByText('21')).toBeInTheDocument();
    expect(within(ultimoJogo).getByText('x')).toBeInTheDocument();
    expect(within(ultimoJogo).getByText('18')).toBeInTheDocument();
    expect(within(ultimoJogo).getByText('Primo / Gustavo')).toBeInTheDocument();
    expect(within(ultimoJogo).getByText('Rafa / Leo')).toBeInTheDocument();
    expect(within(ultimoJogo).getByText('Vitória')).toBeInTheDocument();
    expect(within(ultimoJogo).getByText('Confirmada')).toBeInTheDocument();
    expect(within(ultimoJogo).getByText('4 atletas')).toBeInTheDocument();
    expect(within(ultimoJogo).queryByText('Derrota')).not.toBeInTheDocument();
    expect(within(ultimoJogo).queryByText('0 x 0')).not.toBeInTheDocument();
    expect(within(ultimoJogo).queryByText('Placar pendente')).not.toBeInTheDocument();
  });

  it('usa layout proprio para ultimo jogo sem placar e com vencedor', () => {
    renderizarHome({
      modulos: criarModulos({
        ultimasPartidas: criarModulo([
          criarPartida({
            placarSuaDupla: null,
            placarAdversarios: null
          })
        ])
      })
    });

    const ultimoJogo = screen.getByRole('region', { name: /Último jogo/i });

    expect(within(ultimoJogo).getByLabelText('Resultado sem placar')).toBeInTheDocument();
    expect(within(ultimoJogo).getByText('Dupla vencedora')).toBeInTheDocument();
    expect(within(ultimoJogo).getByText('Sem placar')).toBeInTheDocument();
    expect(within(ultimoJogo).getByText('Primo / Gustavo')).toBeInTheDocument();
    expect(within(ultimoJogo).getByText('Rafa / Leo')).toBeInTheDocument();
    expect(within(ultimoJogo).getByLabelText('Dupla vencedora')).toBeInTheDocument();
    expect(within(ultimoJogo).queryByText('Vitória sem placar')).not.toBeInTheDocument();
    expect(within(ultimoJogo).queryByText('0 x 0')).not.toBeInTheDocument();
    expect(within(ultimoJogo).queryByLabelText('Resultado com placar')).not.toBeInTheDocument();
  });

  it('mostra estado vazio simples quando nao ha ultimos jogos', () => {
    renderizarHome({
      modulos: criarModulos({
        ultimasPartidas: criarModulo([])
      })
    });

    expect(screen.getByText('Você ainda não registrou nenhum jogo.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Registrar agora/i })).toBeInTheDocument();
  });

  it('respeita a ordem Pontos QN, desempenho, pendencias, acoes e ultimo jogo', () => {
    const pendencia = {
      id: 'pendencia-ordem',
      tipo: 3,
      partidaId: 'partida-ordem',
      nomeGrupo: 'Beach Friends',
      dataPartida: new Date().toISOString(),
      nomeDuplaAAtleta1: 'Primo',
      nomeDuplaAAtleta2: 'Gustavo',
      nomeDuplaBAtleta1: 'Paulo',
      nomeDuplaBAtleta2: 'Renato',
      placarDuplaA: 21,
      placarDuplaB: 18,
      nomeCriadoPorUsuario: 'Bruno'
    };

    renderizarHome({
      modulos: criarModulos({
        pendencias: criarModulo({
          total: 1,
          altaPrioridade: 1,
          confirmacaoPartidaMaisRecente: pendencia
        })
      })
    });

    const principal = screen.getByRole('region', { name: /Pontos QN/i });
    const desempenho = screen.getByRole('region', { name: /Seu desempenho/i });
    const pendencias = screen.getByRole('region', { name: /Pendências/i });
    const acoes = screen.getByRole('region', { name: /Ações principais/i });
    const ultimoJogo = screen.getByRole('region', { name: /Último jogo/i });

    esperarAntes(principal, desempenho);
    esperarAntes(desempenho, pendencias);
    esperarAntes(pendencias, acoes);
    esperarAntes(acoes, ultimoJogo);
  });
});

describe('homeSectionsConfig', () => {
  it('reflete a prioridade da nova Home autenticada', () => {
    const secoesAtivas = homeSectionsConfig
      .filter((secao) => secao.enabled)
      .map((secao) => secao.type);

    expect(secoesAtivas).toEqual([
      HomeSectionType.Gamification,
      HomeSectionType.Performance,
      HomeSectionType.PendingConfirmation,
      HomeSectionType.PrimaryAction,
      HomeSectionType.RecentMatches
    ]);
  });
});
