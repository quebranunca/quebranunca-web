import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { HomeDashboard } from './HomeDashboard';
import { HomeSectionType, homeSectionsConfig } from './homeSectionsConfig';

vi.mock('../../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    usuario: {
      id: 'usuario-1',
      nome: 'Primo',
      atletaId: 'atleta-1',
      perfil: 3
    }
  })
}));

vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: vi.fn()
  })
}));

vi.mock('../../services/partidaFeedServico', () => ({
  partidaFeedServico: {
    listar: vi.fn().mockResolvedValue({ itens: [] })
  }
}));

function criarModulo(dados, overrides = {}) {
  return {
    dados,
    carregando: false,
    erro: '',
    ...overrides
  };
}

function criarModulos(overrides = {}) {
  return {
    perfil: criarModulo({
      atletaId: 'atleta-1',
      nome: 'Primo',
      categoriaPrincipal: 'Intermediario',
      posicaoRanking: 4
    }),
    resumo: criarModulo({
      totalPartidas: 12,
      vitorias: 7,
      derrotas: 5,
      aproveitamento: 58,
      sequenciaAtual: 0
    }),
    gamificacao: criarModulo({
      pontuacao: {
        saldoAtual: 0,
        temAtletaVinculado: true
      },
      nivel: {
        nome: 'Bronze',
        progressoPercentual: 0,
        pontosProximaFaixa: 500,
        pontosRestantes: 500
      },
      proximosBeneficios: []
    }),
    pendencias: criarModulo({
      total: 9,
      altaPrioridade: 0
    }),
    insights: criarModulo([]),
    ultimasPartidas: criarModulo([]),
    conexoes: criarModulo({
      melhoresParceiros: [],
      rivaisMaisEnfrentados: [],
      parceirosRecentes: [],
      rivaisRecentes: []
    }),
    frequencia: criarModulo([
      { data: '2026-06-15', quantidade: 8 }
    ]),
    ...overrides
  };
}

function LocalizacaoAtual() {
  const location = useLocation();
  return <span data-testid="rota-atual">{location.pathname}</span>;
}

function renderizarHome({ modulos = criarModulos(), rota = '/app' } = {}) {
  return render(
    <MemoryRouter
      initialEntries={[rota]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <HomeDashboard modulos={modulos} carregando={false} erro="" />
      <LocalizacaoAtual />
    </MemoryRouter>
  );
}

function obterCardPrincipal() {
  return screen.getByRole('region', { name: /card principal da home/i });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HomeDashboard - Card 1 consolidado', () => {
  it('renderiza Seu momento, Pontos QN, Pendências e ações no Card 1', () => {
    renderizarHome();

    const card = obterCardPrincipal();

    expect(within(card).getByText(/Seu momento/i)).toBeInTheDocument();
    expect(within(card).getByText('Primo')).toBeInTheDocument();
    expect(within(card).getByText('Intermediario • #4 no ranking')).toBeInTheDocument();
    expect(within(card).getByText('8 jogos esta semana')).toBeInTheDocument();
    expect(within(card).getByText(/Pontos QN/i)).toBeInTheDocument();
    expect(within(card).getByText('0 pontos')).toBeInTheDocument();
    expect(within(card).getByText('Faixa Bronze')).toBeInTheDocument();
    expect(within(card).getByText(/Pendências/i)).toBeInTheDocument();
    expect(within(card).getByText('9 ações aguardando')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Ranking/i })).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Registrar Partida/i })).toBeInTheDocument();
  });

  it('não renderiza Pontos QN e Pendências como seções duplicadas fora do Card 1', () => {
    renderizarHome();

    expect(screen.getAllByText(/Pontos QN/i)).toHaveLength(1);
    expect(screen.getAllByText(/Pendências/i)).toHaveLength(1);
  });

  it('mantém fallback de Pontos QN quando a gamificação falha', () => {
    renderizarHome({
      modulos: criarModulos({
        gamificacao: criarModulo(null, {
          erro: 'Falha ao carregar gamificação.'
        })
      })
    });

    const card = obterCardPrincipal();

    expect(within(card).getByText(/Pontos QN/i)).toBeInTheDocument();
    expect(within(card).getByText(/Seus pontos aparecem aqui/i)).toBeInTheDocument();
    expect(within(card).getByText(/começar a somar/i)).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Ver pontos/i })).toBeInTheDocument();
  });

  it('mostra saldo zero, faixa Bronze e CTA de Pontos QN', () => {
    renderizarHome();

    const card = obterCardPrincipal();

    expect(within(card).getByText('0 pontos')).toBeInTheDocument();
    expect(within(card).getByText('Faixa Bronze')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Ver pontos/i })).toBeInTheDocument();
  });

  it('mostra pendências com ações e texto reduzido', () => {
    renderizarHome();

    const card = obterCardPrincipal();

    expect(within(card).getByText('9 ações aguardando')).toBeInTheDocument();
    expect(within(card).getByText('Ajude a manter seu histórico confiável.')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Resolver agora/i })).toBeInTheDocument();
  });

  it('mostra estado positivo quando não há pendências', () => {
    renderizarHome({
      modulos: criarModulos({
        pendencias: criarModulo({ total: 0, altaPrioridade: 0 })
      })
    });

    const card = obterCardPrincipal();

    expect(within(card).getByText('Tudo em dia')).toBeInTheDocument();
    expect(within(card).getByText('Nenhuma ação aguardando no momento.')).toBeInTheDocument();
    expect(within(card).queryByRole('link', { name: /Resolver agora/i })).not.toBeInTheDocument();
  });

  it.each([
    ['Ver pontos', '/app/pontos-qn'],
    ['Resolver agora', '/app/pendencias'],
    ['Registrar Partida', '/partidas/registrar'],
    ['Ranking', '/ranking']
  ])('navega pelo CTA %s para %s', async (rotulo, destino) => {
    const usuario = userEvent.setup();
    renderizarHome();

    await usuario.click(within(obterCardPrincipal()).getByRole('link', { name: new RegExp(rotulo, 'i') }));

    expect(screen.getByTestId('rota-atual')).toHaveTextContent(destino);
  });
});

describe('homeSectionsConfig', () => {
  it('não renderiza PontosQN e PendingActions como seções independentes', () => {
    const secoesAtivas = homeSectionsConfig
      .filter((secao) => secao.enabled)
      .map((secao) => secao.type);

    expect(secoesAtivas[0]).toBe(HomeSectionType.Hero);
    expect(secoesAtivas[1]).toBe(HomeSectionType.Stats);
    expect(secoesAtivas).not.toContain(HomeSectionType.PontosQN);
    expect(secoesAtivas).not.toContain(HomeSectionType.PendingActions);
  });
});
