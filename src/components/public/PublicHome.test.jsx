import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicHome } from './PublicHome';

vi.mock('../../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    usuario: null
  })
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderizar(ui) {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      {ui}
    </MemoryRouter>
  );
}

function criarDashboard(overrides = {}) {
  return {
    resumo: {
      totalPartidas: 12,
      totalAtletas: 12,
      totalGrupos: 5
    },
    ultimasPartidas: [
      {
        id: 'partida-1',
        grupo: 'Panela das 6',
        dupla1: 'Primo / Ale 05',
        dupla2: 'Gui / Leo',
        pontosDupla1: 18,
        pontosDupla2: 16,
        vencedor: 'Primo / Ale 05',
        minutosAtras: 8
      }
    ],
    ranking: Array.from({ length: 6 }, (_, indice) => ({
      atletaId: `atleta-${indice + 1}`,
      posicao: indice + 1,
      nome: `Atleta ${indice + 1}`,
      apelido: '',
      jogos: 10 - indice,
      pontos: 120 - indice
    })),
    insights: ['Grupos ativos registram partidas com mais consistência.'],
    ...overrides
  };
}

describe('PublicHome', () => {
  it('renderiza a landing premium com CTAs, imagem preparada e seções principais', () => {
    const { container } = renderizar(<PublicHome dashboard={criarDashboard()} />);

    expect(screen.getByRole('heading', { name: /Transforme suas partidas em ranking, scouts e história\./i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Criar conta grátis/i })[0]).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /Ver rankings/i })).toHaveAttribute('href', '/ranking');
    expect(screen.getByRole('heading', { name: /Do jogo ao ranking em três passos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Tudo que o grupo precisa para evoluir/i })).toBeInTheDocument();
    expect(screen.queryByText(/Campeonatos em andamento/i)).not.toBeInTheDocument();
    expect(container.querySelector('.public-hero')).toHaveStyle('--public-hero-image: url(/src/assets/home-futevolei-hero.jpg)');
  });

  it('mostra números, últimas partidas e apenas o Top 5 do ranking geral', () => {
    renderizar(<PublicHome dashboard={criarDashboard()} />);

    expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/partidas registradas/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Panela das 6/i)).toBeInTheDocument();
    expect(screen.getAllByText('18 x 16').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('heading', { name: /Ranking geral/i })).toBeInTheDocument();
    expect(screen.getByText('Atleta 5')).toBeInTheDocument();
    expect(screen.queryByText('Atleta 6')).not.toBeInTheDocument();
  });

  it('usa fallbacks seguros e não renderiza null, undefined ou NaN com dados vazios', () => {
    const { container } = renderizar(
      <PublicHome
        dashboard={criarDashboard({
          resumo: {},
          ultimasPartidas: [
            {
              id: 'partida-sem-dados',
              grupo: '',
              dupla1: null,
              dupla2: undefined,
              pontosDupla1: null,
              pontosDupla2: undefined,
              vencedor: '',
              minutosAtras: null
            }
          ],
          ranking: [],
          insights: []
        })}
      />
    );

    expect(screen.getByText(/Partida avulsa/i)).toBeInTheDocument();
    expect(screen.getByText(/Dupla A/i)).toBeInTheDocument();
    expect(screen.getByText(/Dupla B/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Resultado registrado/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/O ranking aparece conforme os atletas registram partidas/i)).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/null|undefined|NaN/i);
  });
});

describe('PublicHeader', () => {
  it('mantém header compacto e drawer com navegação pública sem destacar campeonatos', async () => {
    const usuario = userEvent.setup();
    renderizar(<PublicHeader />);

    expect(screen.getAllByLabelText('QuebraNunca').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('link', { name: /Entrar/i })).toHaveAttribute('href', '/login');

    await usuario.click(screen.getByRole('button', { name: /Abrir navegação/i }));

    const drawer = screen.getByRole('complementary', { hidden: true });
    expect(drawer).toHaveClass('aberto');
    expect(within(drawer).getByText('Início')).toBeInTheDocument();
    expect(within(drawer).getByText('Rankings')).toBeInTheDocument();
    expect(within(drawer).getByText('Grupos')).toBeInTheDocument();
    expect(within(drawer).getByText('Arenas')).toBeInTheDocument();
    expect(within(drawer).getByText('Campeonatos')).toBeInTheDocument();
    expect(within(drawer).getByText('Em breve')).toBeInTheDocument();
    expect(within(drawer).getByText('Criar conta grátis')).toBeInTheDocument();
  });
});
