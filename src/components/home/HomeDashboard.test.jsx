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
      pontosMinimos: 0,
      pontosProximaFaixa: 500,
      progressoPercentual: 74,
      pontosRestantes: 130
    },
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
  it('renderiza identidade com nome completo, apelido e link para o perfil', () => {
    renderizarHome();

    const identidade = screen.getByRole('region', { name: /Identidade do usuário/i });

    expect(within(identidade).getByText('Gustavo Henrique Almeida Souza')).toBeInTheDocument();
    expect(within(identidade).getByText('Primo')).toBeInTheDocument();
    expect(within(identidade).getAllByRole('link', { name: /Abrir meu perfil/i }).length).toBeGreaterThan(0);
    expect(within(identidade).queryByRole('link', { name: /Editar perfil/i })).not.toBeInTheDocument();
    expect(within(identidade).queryByRole('button', { name: /Abrir pendências/i })).not.toBeInTheDocument();
    expect(within(identidade).queryByRole('button', { name: /Abrir menu do perfil/i })).not.toBeInTheDocument();
    expect(within(identidade).queryByRole('button', { name: /Sair/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Boa tarde|Bom dia|Boa noite|Continue evoluindo/i)).not.toBeInTheDocument();
  });

  it('nao exibe linha vazia de apelido quando apelido nao existe', () => {
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

    const identidade = screen.getByRole('region', { name: /Identidade do usuário/i });

    expect(within(identidade).getByText('Gustavo Henrique Almeida Souza')).toBeInTheDocument();
    expect(within(identidade).queryByText('Primo')).not.toBeInTheDocument();
  });

  it('mostra card de confirmacao de partida e dispara confirmar e nao fui eu', async () => {
    const usuario = userEvent.setup();
    const onConfirmar = vi.fn();
    const onNaoReconhecer = vi.fn();
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
      onConfirmarPendenciaPartida: onConfirmar,
      onNaoReconhecerPendenciaPartida: onNaoReconhecer,
      modulos: criarModulos({
        pendencias: criarModulo({
          total: 1,
          altaPrioridade: 1,
          confirmacaoPartidaMaisRecente: pendencia
        })
      })
    });

    const card = screen.getByRole('region', { name: /Confirmar partida/i });

    expect(within(card).getByText('PENDENTE')).toBeInTheDocument();
    expect(within(card).getByText('Você participou deste jogo?')).toBeInTheDocument();
    expect(within(card).getByText('Ajude a validar os dados e fortalecer o ranking da comunidade.')).toBeInTheDocument();
    expect(within(card).getByText('Beach Friends')).toBeInTheDocument();
    expect(within(card).getByText('Primo / Gustavo')).toBeInTheDocument();
    expect(within(card).getByText('Paulo / Renato')).toBeInTheDocument();
    expect(within(card).getByText('21 x 18')).toBeInTheDocument();
    expect(within(card).getByText('Registrado por Bruno')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Ver todas/i })).toHaveAttribute('href', '/app/pendencias');

    await usuario.click(within(card).getByRole('button', { name: /Não fui eu/i }));
    await usuario.click(within(card).getByRole('button', { name: /^Confirmar partida$/i }));

    expect(onConfirmar).toHaveBeenCalledWith('pendencia-1');
    expect(onNaoReconhecer).toHaveBeenCalledWith('pendencia-1');
  });

  it('nao renderiza card de pendencia quando nao ha confirmacao pendente', () => {
    renderizarHome();

    expect(screen.queryByRole('region', { name: /Confirmar partida/i })).not.toBeInTheDocument();
  });

  it('renderiza card de Evolucao QN com nivel, progresso, saldo e CTA', () => {
    renderizarHome();

    const card = screen.getByRole('region', { name: /Evolução QN/i });

    expect(within(card).getByText('Pontos QN')).toBeInTheDocument();
    expect(within(card).getByText('Bronze')).toBeInTheDocument();
    expect(within(card).getByText('370 / 500')).toBeInTheDocument();
    expect(within(card).getByText('Faltam 130 para a próxima faixa')).toBeInTheDocument();
    expect(within(card).getByText('2.470 Pontos QN')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Ver benefícios/i })).toHaveAttribute('href', '/app/pontos-qn');
  });

  it('mantem gamificacao separada de metricas esportivas', () => {
    renderizarHome();

    const card = screen.getByRole('region', { name: /Evolução QN/i });

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

    expect(screen.getByRole('region', { name: /Identidade do usuário/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Evolução QN/i })).toBeInTheDocument();
    expect(screen.getByText('Comece registrando ou confirmando partidas para evoluir.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Registrar partida/i })).toBeInTheDocument();
  });

  it('oculta fallback agressivo quando gamificacao falha e mantem a Home utilizavel', () => {
    renderizarHome({
      modulos: criarModulos({
        gamificacao: criarModulo(null, { erro: 'API indisponível' })
      })
    });

    expect(screen.queryByRole('region', { name: /Evolução QN/i })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Identidade do usuário/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Registrar partida/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Seu desempenho/i })).toBeInTheDocument();
  });

  it('mantem Registrar Partida e Criar Grupo com o mesmo componente visual principal', async () => {
    const usuario = userEvent.setup();
    renderizarHome();

    const registrar = screen.getByRole('link', { name: /Registrar partida/i });
    const criarGrupo = screen.getByRole('link', { name: /Criar grupo/i });

    expect(registrar).toHaveClass('home-dashboard-cta-principal');
    expect(criarGrupo).toHaveClass('home-dashboard-cta-principal');
    expect(screen.getByText('Salve seu jogo e atualize sua evolução.')).toBeInTheDocument();
    expect(screen.getByText('Crie um grupo e acompanhe ranking, histórico e scouts com sua galera.')).toBeInTheDocument();

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

  it('mostra ultimos jogos sem placar pendente ou 0 x 0 artificial', () => {
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

    const ultimosJogos = screen.getByRole('region', { name: /Últimos jogos/i });

    expect(within(ultimosJogos).getByRole('link', { name: /Ver histórico/i })).toBeInTheDocument();
    expect(within(ultimosJogos).getByText('Grupo Praia')).toBeInTheDocument();
    expect(within(ultimosJogos).getByText('Partida avulsa')).toBeInTheDocument();
    expect(within(ultimosJogos).getByText('21 x 18')).toBeInTheDocument();
    expect(within(ultimosJogos).getByText('Vitória')).toBeInTheDocument();
    expect(within(ultimosJogos).getByText('Derrota')).toBeInTheDocument();
    expect(within(ultimosJogos).queryByText('0 x 0')).not.toBeInTheDocument();
    expect(within(ultimosJogos).queryByText('Placar pendente')).not.toBeInTheDocument();
  });

  it('mostra estado vazio simples quando nao ha ultimos jogos', () => {
    renderizarHome({
      modulos: criarModulos({
        ultimasPartidas: criarModulo([])
      })
    });

    expect(screen.getByText('Você ainda não possui atividades.')).toBeInTheDocument();
    expect(screen.getByText('Registre sua primeira partida para iniciar seu histórico.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Registrar agora/i })).toBeInTheDocument();
  });

  it('respeita a ordem identidade, pendencias, gamificacao, desempenho, acoes e ultimos jogos', () => {
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

    const identidade = screen.getByRole('region', { name: /Identidade do usuário/i });
    const pendencias = screen.getByRole('region', { name: /Confirmar partida/i });
    const gamificacao = screen.getByRole('region', { name: /Evolução QN/i });
    const desempenho = screen.getByRole('region', { name: /Seu desempenho/i });
    const acoes = screen.getByRole('region', { name: /Ações principais/i });
    const ultimosJogos = screen.getByRole('region', { name: /Últimos jogos/i });

    esperarAntes(identidade, pendencias);
    esperarAntes(pendencias, gamificacao);
    esperarAntes(gamificacao, desempenho);
    esperarAntes(desempenho, acoes);
    esperarAntes(acoes, ultimosJogos);
  });
});

describe('homeSectionsConfig', () => {
  it('reflete a prioridade da nova Home autenticada', () => {
    const secoesAtivas = homeSectionsConfig
      .filter((secao) => secao.enabled)
      .map((secao) => secao.type);

    expect(secoesAtivas).toEqual([
      HomeSectionType.Identity,
      HomeSectionType.PendingConfirmation,
      HomeSectionType.Gamification,
      HomeSectionType.Performance,
      HomeSectionType.PrimaryAction,
      HomeSectionType.RecentMatches
    ]);
  });
});
