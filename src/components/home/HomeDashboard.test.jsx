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

function criarModulo(dados, overrides = {}) {
  return {
    dados,
    carregando: false,
    erro: '',
    ...overrides
  };
}

function criarPartida(overrides = {}) {
  return {
    id: 'partida-1',
    resultado: 'W',
    dataPartida: new Date().toISOString(),
    grupo: 'Grupo Praia',
    parceiro: 'Duda',
    adversarios: 'Rafa e Leo',
    placarSuaDupla: 21,
    placarAdversarios: 18,
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
      sequenciaAtual: 2
    }),
    gamificacao: criarModulo({
      nivel: {
        nome: 'Bronze'
      }
    }),
    pendencias: criarModulo({
      total: 0,
      altaPrioridade: 0
    }),
    ultimasPartidas: criarModulo([criarPartida()]),
    conexoes: criarModulo({
      melhoresParceiros: [
        {
          atletaId: 'atleta-2',
          nome: 'Duda',
          partidas: 6,
          vitorias: 4,
          derrotas: 2,
          aproveitamento: 66
        }
      ],
      parceirosRecentes: []
    }),
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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HomeDashboard redesenhada', () => {
  it('renderiza Hero integrado sem saudação antiga', () => {
    renderizarHome();

    const hero = screen.getByRole('region', { name: /resumo principal da home/i });

    expect(within(hero).getByText('Primo')).toBeInTheDocument();
    expect(within(hero).getByText('Grupo Praia')).toBeInTheDocument();
    expect(within(hero).getByText('Faixa Bronze')).toBeInTheDocument();
    expect(within(hero).getByRole('link', { name: /editar perfil/i })).toBeInTheDocument();
    expect(screen.queryByText(/Boa tarde|Bom dia|Boa noite/i)).not.toBeInTheDocument();
  });

  it('mostra apenas os quatro scouts principais', () => {
    renderizarHome();

    const scouts = screen.getByLabelText(/Meus principais scouts/i);

    expect(within(scouts).getByText('Partidas')).toBeInTheDocument();
    expect(within(scouts).getByText('12')).toBeInTheDocument();
    expect(within(scouts).getByText('Vitórias')).toBeInTheDocument();
    expect(within(scouts).getByText('7')).toBeInTheDocument();
    expect(within(scouts).getByText('Aproveitamento')).toBeInTheDocument();
    expect(within(scouts).getByText('58%')).toBeInTheDocument();
    expect(within(scouts).getByText('Sequência')).toBeInTheDocument();
    expect(within(scouts).getByText('2')).toBeInTheDocument();
  });

  it('prioriza Registrar Partida e mantém Criar Grupo como ação secundária', async () => {
    const usuario = userEvent.setup();
    renderizarHome();

    const registrar = screen.getByRole('link', { name: /Registrar Partida/i });
    const criarGrupo = screen.getByRole('link', { name: /Criar Grupo/i });

    expect(registrar).toHaveClass('home-dashboard-cta-principal');
    expect(criarGrupo).toHaveClass('home-dashboard-cta-secundario');

    await usuario.click(registrar);
    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/partidas/registrar');
  });

  it('renderiza os destaques aprovados', () => {
    renderizarHome();

    expect(screen.getByRole('heading', { name: /Em destaque para você/i })).toBeInTheDocument();
    expect(screen.getByText('Ranking pessoal')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();
    expect(screen.getByText('Dupla do momento')).toBeInTheDocument();
    expect(screen.getByText('Duda')).toBeInTheDocument();
    expect(screen.getByText('Parceiros frequentes')).toBeInTheDocument();
    expect(screen.getByText('Últimos jogos')).toBeInTheDocument();
  });

  it('mostra atividade recente em timeline quando há partidas', () => {
    renderizarHome();

    const atividade = screen.getByRole('heading', { name: /Atividade recente/i }).closest('section');

    expect(atividade).toBeInTheDocument();
    expect(within(atividade).getByText('Você registrou uma partida')).toBeInTheDocument();
    expect(within(atividade).getByText('Hoje')).toBeInTheDocument();
    expect(within(atividade).getByText('21 x 18')).toBeInTheDocument();
    expect(within(atividade).getByText('Vitória')).toBeInTheDocument();
  });

  it('mostra empty state bonito quando não há partidas', () => {
    renderizarHome({
      modulos: criarModulos({
        ultimasPartidas: criarModulo([])
      })
    });

    expect(screen.getByText('Sua primeira partida vai aparecer aqui.')).toBeInTheDocument();
    expect(screen.getByText(/Registre um jogo/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Registrar agora/i })).toBeInTheDocument();
  });
});

describe('homeSectionsConfig', () => {
  it('reflete a nova prioridade da Home autenticada', () => {
    const secoesAtivas = homeSectionsConfig
      .filter((secao) => secao.enabled)
      .map((secao) => secao.type);

    expect(secoesAtivas).toEqual([
      HomeSectionType.Hero,
      HomeSectionType.Stats,
      HomeSectionType.PrimaryAction,
      HomeSectionType.SecondaryAction,
      HomeSectionType.Highlights,
      HomeSectionType.RecentActivity
    ]);
  });
});
