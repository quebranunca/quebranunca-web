import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PaginaPontosQN } from './PaginaPontosQN';
import { gamificacaoServico } from '../services/gamificacaoServico';

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    usuario: {
      id: 'usuario-1',
      nome: 'Primo',
      atletaId: 'atleta-1'
    }
  })
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: vi.fn()
  })
}));

vi.mock('../services/gamificacaoServico', () => ({
  gamificacaoServico: {
    obterResumo: vi.fn(),
    listarBeneficios: vi.fn(),
    listarExtrato: vi.fn(),
    listarResgates: vi.fn(),
    listarMissoes: vi.fn(),
    listarConquistas: vi.fn(),
    solicitarResgate: vi.fn()
  }
}));

function configurarApisComSucesso({
  beneficios = criarBeneficios(),
  saldoAtual = 0,
  extrato = []
} = {}) {
  gamificacaoServico.obterResumo.mockResolvedValue({
    pontuacao: {
      saldoAtual,
      totalAcumulado: saldoAtual,
      temAtletaVinculado: true
    },
    nivel: {
      nome: 'Bronze',
      progressoPercentual: 42,
      pontosRestantes: 580,
      pontosProximaFaixa: 1000
    }
  });
  gamificacaoServico.listarBeneficios.mockResolvedValue(beneficios);
  gamificacaoServico.listarExtrato.mockResolvedValue({ itens: extrato });
  gamificacaoServico.listarResgates.mockResolvedValue([]);
  gamificacaoServico.listarMissoes.mockResolvedValue([]);
  gamificacaoServico.listarConquistas.mockResolvedValue([]);
}

function criarBeneficios() {
  return [
    criarBeneficio('beneficio-500', 'R$ 5 off na loja', 500, {
      tipo: 1,
      tipoNome: 'Campanha promocional'
    }),
    criarBeneficio('beneficio-chaveiro', 'Chaveiro QuebraNunca', 2000, {
      tipo: 4,
      tipoNome: 'Produto',
      imagemUrl: 'pontos-qn/beneficio-chaveiro-qn.png'
    }),
    criarBeneficio('beneficio-bone', 'Boné QuebraNunca', 8000, {
      tipo: 4,
      tipoNome: 'Produto',
      imagemUrl: 'pontos-qn/beneficio-bone-qn.png'
    })
  ];
}

function criarBeneficio(id, titulo, pontosNecessarios, sobrescritas = {}) {
  return {
    id,
    titulo,
    descricao: `${titulo} para campanhas QuebraNunca.`,
    tipo: sobrescritas.tipo ?? 1,
    tipoNome: sobrescritas.tipoNome ?? 'Campanha promocional',
    pontosNecessarios,
    ativo: sobrescritas.ativo ?? true,
    quantidadeDisponivel: sobrescritas.quantidadeDisponivel ?? null,
    imagemUrl: sobrescritas.imagemUrl ?? null,
    destaque: Boolean(sobrescritas.destaque),
    saldoSuficiente: sobrescritas.saldoSuficiente ?? false,
    pontosFaltantes: sobrescritas.pontosFaltantes ?? pontosNecessarios
  };
}

function criarExtrato() {
  return [
    {
      id: 'extrato-1',
      pontos: 10,
      descricao: 'Participação em partida válida',
      tipoEventoNome: 'Participação',
      criadoEm: '2026-07-10T10:35:00Z'
    },
    {
      id: 'extrato-2',
      pontos: -500,
      descricao: 'Resgate de benefício',
      tipoEventoNome: 'Resgate',
      criadoEm: '2026-07-09T10:35:00Z'
    }
  ];
}

function renderizarPagina(rota = '/app/pontos-qn') {
  return render(
    <MemoryRouter
      initialEntries={[rota]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <PaginaPontosQN />
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PaginaPontosQN simplificada', () => {
  it('renderiza as abas Resumo, Benefícios e Histórico sem aba principal Como ganhar', async () => {
    configurarApisComSucesso();
    renderizarPagina();

    const nav = await screen.findByRole('navigation', { name: /Seções de Pontos QN/i });

    expect(within(nav).getByRole('button', { name: 'Resumo' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Benefícios' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Histórico' })).toBeInTheDocument();
    expect(within(nav).queryByRole('button', { name: /Como ganhar/i })).not.toBeInTheDocument();
  });

  it('mostra no Resumo pontos disponíveis, faixa, progresso e Como ganhar compacto', async () => {
    configurarApisComSucesso({ saldoAtual: 420 });
    renderizarPagina();

    await screen.findByText(/Bora jogar e somar pontos/i);

    expect(screen.getByText('Pontos disponíveis')).toBeInTheDocument();
    expect(screen.getByText('Bronze')).toBeInTheDocument();
    expect(screen.getByText('420')).toBeInTheDocument();
    expect(screen.getByText('Faltam 580 pontos para a próxima faixa')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Como ganhar mais pontos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Registrar partida/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Participar de partida/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Confirmar pendência/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Compartilhar resultado/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sobre os Pontos QN' })).toBeInTheDocument();
    expect(screen.getByText(/Eles não são dinheiro, não têm saque/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Resumo do programa/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Atalhos/i })).not.toBeInTheDocument();
  });

  it('mantém deep link antigo de Como ganhar apontando para Resumo', async () => {
    configurarApisComSucesso();
    renderizarPagina('/app/pontos-qn?aba=como-ganhar');

    const nav = await screen.findByRole('navigation', { name: /Seções de Pontos QN/i });
    expect(within(nav).getByRole('button', { name: 'Resumo' })).toHaveClass('ativo');
    expect(screen.getByRole('heading', { name: 'Como ganhar mais pontos' })).toBeInTheDocument();
  });

  it('na aba Benefícios sem benefícios ativos não mostra filtros e exibe próximos benefícios em breve', async () => {
    configurarApisComSucesso({ beneficios: [] });
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.queryByRole('group', { name: /Filtros de benefícios/i })).not.toBeInTheDocument();
    expect(screen.getByText('Novos benefícios em breve')).toBeInTheDocument();
    expect(screen.getByText(/As próximas campanhas e brindes da comunidade aparecem aqui/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Boné QuebraNunca' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Chaveiro QuebraNunca' })).toBeInTheDocument();
    expect(screen.getAllByText('Em breve')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Ver como ganhar pontos' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resgatar' })).not.toBeInTheDocument();
  });

  it('trata benefícios inativos como indisponíveis para a vitrine ativa', async () => {
    configurarApisComSucesso({
      beneficios: [
        criarBeneficio('beneficio-inativo', 'Boné QuebraNunca', 8000, {
          ativo: false,
          tipo: 4
        })
      ]
    });
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.queryByRole('group', { name: /Filtros de benefícios/i })).not.toBeInTheDocument();
    expect(screen.getByText('Novos benefícios em breve')).toBeInTheDocument();
    expect(screen.queryByText('8.000 Pontos QN')).not.toBeInTheDocument();
  });

  it('na aba Benefícios com itens ativos mostra somente filtros de categorias com conteúdo', async () => {
    configurarApisComSucesso();
    const usuario = userEvent.setup();
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });
    const filtros = screen.getByRole('group', { name: /Filtros de benefícios/i });

    expect(within(filtros).getByRole('button', { name: 'Todos' })).toBeInTheDocument();
    expect(within(filtros).getByRole('button', { name: 'Campanhas' })).toBeInTheDocument();
    expect(within(filtros).getByRole('button', { name: 'Brindes' })).toBeInTheDocument();
    expect(within(filtros).queryByRole('button', { name: 'Produtos' })).not.toBeInTheDocument();
    expect(within(filtros).queryByRole('button', { name: 'Experiências' })).not.toBeInTheDocument();
    expect(within(filtros).queryByRole('button', { name: 'App' })).not.toBeInTheDocument();
    expect(within(filtros).queryByRole('button', { name: 'Descontos' })).not.toBeInTheDocument();

    expect(screen.getByText('Condição especial em campanha')).toBeInTheDocument();
    expect(screen.getByText('Chaveiro QuebraNunca')).toBeInTheDocument();
    expect(screen.getByText('Boné QuebraNunca')).toBeInTheDocument();

    await usuario.click(within(filtros).getByRole('button', { name: 'Brindes' }));

    expect(screen.getByText('Chaveiro QuebraNunca')).toBeInTheDocument();
    expect(screen.getByText('Boné QuebraNunca')).toBeInTheDocument();
    expect(screen.queryByText('Condição especial em campanha')).not.toBeInTheDocument();
  });

  it('não mostra filtros se houver benefícios ativos em apenas uma categoria', async () => {
    configurarApisComSucesso({
      beneficios: [
        criarBeneficio('beneficio-campanha', 'Cupom especial QuebraNunca', 500, {
          tipo: 1,
          tipoNome: 'Campanha promocional'
        })
      ]
    });
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.queryByRole('group', { name: /Filtros de benefícios/i })).not.toBeInTheDocument();
    expect(screen.getByText('Cupom especial QuebraNunca')).toBeInTheDocument();
  });

  it('usa imagemUrl, assets locais de boné/chaveiro e fallback visual conforme disponível', async () => {
    configurarApisComSucesso({
      beneficios: [
        criarBeneficio('beneficio-url', 'Experiência QuebraNunca', 1000, {
          tipo: 3,
          tipoNome: 'Experiência',
          imagemUrl: 'https://cdn.quebranunca.test/experiencia.png'
        }),
        criarBeneficio('beneficio-chaveiro-sem-url', 'Chaveiro QuebraNunca', 2000, {
          tipo: 4,
          tipoNome: 'Produto'
        }),
        criarBeneficio('beneficio-sem-imagem', 'Benefício da comunidade', 700, {
          tipo: 99,
          tipoNome: 'Outro'
        })
      ]
    });
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.getByRole('img', { name: 'Experiência QuebraNunca' })).toHaveAttribute('src', 'https://cdn.quebranunca.test/experiencia.png');
    expect(screen.getByRole('img', { name: 'Chaveiro QuebraNunca' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Benefício QN: Benefício da comunidade' })).toBeInTheDocument();
  });

  it('CTA Ver como ganhar pontos volta para Resumo e mostra a seção compacta', async () => {
    configurarApisComSucesso({ beneficios: [] });
    const usuario = userEvent.setup();
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });
    await usuario.click(screen.getByRole('button', { name: 'Ver como ganhar pontos' }));

    const nav = screen.getByRole('navigation', { name: /Seções de Pontos QN/i });
    expect(within(nav).getByRole('button', { name: 'Resumo' })).toHaveClass('ativo');
    expect(screen.getByRole('heading', { name: 'Como ganhar mais pontos' })).toBeInTheDocument();
  });

  it('não exibe linguagem financeira indevida na aba Benefícios', async () => {
    configurarApisComSucesso();
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.queryByText(/R\$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/100 QN = R\$ 1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cashback/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/carteira financeira/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/conversão/i)).not.toBeInTheDocument();
  });

  it('continua renderizando o Histórico focado no extrato', async () => {
    configurarApisComSucesso({ extrato: criarExtrato() });
    renderizarPagina('/app/pontos-qn?aba=historico');

    await screen.findByRole('heading', { name: 'Histórico de Pontos' });

    expect(screen.getByText('Participação em partida válida')).toBeInTheDocument();
    expect(screen.getByText('Participação · 10/07/2026')).toBeInTheDocument();
    expect(screen.getByText('+10')).toBeInTheDocument();
    expect(screen.getByText('Resgate de benefício')).toBeInTheDocument();
    expect(screen.getByText('-500')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Como ganhar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Benefícios QN/i })).not.toBeInTheDocument();
  });
});
