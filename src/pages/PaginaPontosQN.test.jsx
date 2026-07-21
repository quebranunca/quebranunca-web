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
  totalAcumulado = saldoAtual,
  nivel = criarNivelResumo(totalAcumulado),
  extrato = []
} = {}) {
  gamificacaoServico.obterResumo.mockResolvedValue({
    pontuacao: {
      saldoAtual,
      totalAcumulado,
      temAtletaVinculado: true
    },
    nivel,
    faixasMedalha: criarFaixasMedalha()
  });
  gamificacaoServico.listarBeneficios.mockResolvedValue(beneficios);
  gamificacaoServico.listarExtrato.mockResolvedValue({ itens: extrato });
  gamificacaoServico.listarResgates.mockResolvedValue([]);
  gamificacaoServico.listarMissoes.mockResolvedValue([]);
  gamificacaoServico.listarConquistas.mockResolvedValue([]);
}

function criarFaixasMedalha() {
  return [
    { nome: 'Bronze', pontosMinimos: 0, pontosProximaFaixa: 500 },
    { nome: 'Prata', pontosMinimos: 500, pontosProximaFaixa: 1500 },
    { nome: 'Ouro', pontosMinimos: 1500, pontosProximaFaixa: 4000 },
    { nome: 'Diamante', pontosMinimos: 4000, pontosProximaFaixa: 8000 },
    { nome: 'Lenda QN', pontosMinimos: 8000, pontosProximaFaixa: null }
  ];
}

function criarNivelResumo(totalAcumulado) {
  if (totalAcumulado >= 8000) {
    return {
      nome: 'Lenda QN',
      pontosMinimos: 8000,
      progressoPercentual: 100,
      pontosRestantes: 0,
      pontosProximaFaixa: null
    };
  }

  if (totalAcumulado >= 4000) {
    return {
      nome: 'Diamante',
      pontosMinimos: 4000,
      progressoPercentual: Math.floor(((totalAcumulado - 4000) / 4000) * 100),
      pontosRestantes: 8000 - totalAcumulado,
      pontosProximaFaixa: 8000
    };
  }

  if (totalAcumulado >= 1500) {
    return {
      nome: 'Ouro',
      pontosMinimos: 1500,
      progressoPercentual: Math.floor(((totalAcumulado - 1500) / 2500) * 100),
      pontosRestantes: 4000 - totalAcumulado,
      pontosProximaFaixa: 4000
    };
  }

  if (totalAcumulado >= 500) {
    return {
      nome: 'Prata',
      pontosMinimos: 500,
      progressoPercentual: Math.floor(((totalAcumulado - 500) / 1000) * 100),
      pontosRestantes: 1500 - totalAcumulado,
      pontosProximaFaixa: 1500
    };
  }

  return {
    nome: 'Bronze',
    pontosMinimos: 0,
    progressoPercentual: Math.floor((totalAcumulado / 500) * 100),
    pontosRestantes: 500 - totalAcumulado,
    pontosProximaFaixa: 500
  };
}

function criarBeneficios() {
  return [
    criarBeneficio('beneficio-500', 'Cupom 10% OFF', 300, {
      tipo: 1,
      tipoNome: 'Desconto',
      percentualDesconto: 10
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
    percentualDesconto: sobrescritas.percentualDesconto ?? null,
    ativo: sobrescritas.ativo ?? true,
    quantidadeDisponivel: sobrescritas.quantidadeDisponivel ?? null,
    imagemUrl: sobrescritas.imagemUrl ?? null,
    destaque: Boolean(sobrescritas.destaque),
    saldoSuficiente: sobrescritas.saldoSuficiente ?? false,
    pontosFaltantes: sobrescritas.pontosFaltantes ?? pontosNecessarios,
    emBreve: sobrescritas.emBreve ?? false,
    status: sobrescritas.status,
    statusNome: sobrescritas.statusNome,
    disponibilidade: sobrescritas.disponibilidade,
    situacao: sobrescritas.situacao
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
    configurarApisComSucesso({ saldoAtual: 55, totalAcumulado: 120 });
    renderizarPagina();

    await screen.findByRole('heading', { name: 'Pontos QN' });
    expect(screen.getByText('Evolua, conquiste benefícios e acompanhe seu progresso.')).toBeInTheDocument();

    expect(screen.getByText('Pontos disponíveis')).toBeInTheDocument();
    expect(screen.getByText('Bronze · 120 Pontos QN acumulados')).toBeInTheDocument();
    expect(screen.getByText('55')).toBeInTheDocument();
    expect(screen.getByText('Faltam 380 Pontos QN para Prata')).toBeInTheDocument();
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

  it('renderiza as medalhas QN oficiais e explica que resgate nao reduz medalha', async () => {
    configurarApisComSucesso({ saldoAtual: 55, totalAcumulado: 120 });
    renderizarPagina();

    await screen.findByRole('heading', { name: 'Medalhas QN' });

    expect(screen.getByText(/total acumulado de Pontos QN/i)).toBeInTheDocument();
    expect(screen.getByText(/Resgatar benefícios não reduz sua medalha/i)).toBeInTheDocument();
    expect(screen.getByText('Bronze')).toBeInTheDocument();
    expect(screen.getByText('Prata')).toBeInTheDocument();
    expect(screen.getByText('Ouro')).toBeInTheDocument();
    expect(screen.getByText('Diamante')).toBeInTheDocument();
    expect(screen.getByText('Lenda QN')).toBeInTheDocument();
    expect(screen.getByText('A partir de 0 Pontos QN')).toBeInTheDocument();
    expect(screen.getByText('A partir de 500 Pontos QN')).toBeInTheDocument();
    expect(screen.getByText('A partir de 1.500 Pontos QN')).toBeInTheDocument();
    expect(screen.getByText('A partir de 4.000 Pontos QN')).toBeInTheDocument();
    expect(screen.getByText('A partir de 8.000 Pontos QN')).toBeInTheDocument();
    expect(screen.getByLabelText('Bronze: Medalha atual')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Faltam 380 Pontos QN')).toBeInTheDocument();
  });

  it('destaca a medalha pelo total acumulado, nao pelo saldo disponível', async () => {
    configurarApisComSucesso({ saldoAtual: 55, totalAcumulado: 1500 });
    renderizarPagina();

    await screen.findByRole('heading', { name: 'Medalhas QN' });

    expect(screen.getByText('Ouro · 1.500 Pontos QN acumulados')).toBeInTheDocument();
    expect(screen.getByText('55')).toBeInTheDocument();
    expect(screen.getByLabelText('Ouro: Medalha atual')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByLabelText('Bronze: Alcançada')).toBeInTheDocument();
    expect(screen.getByLabelText('Prata: Alcançada')).toBeInTheDocument();
    expect(screen.getByText('Faltam 2.500 Pontos QN')).toBeInTheDocument();
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

  it('trata benefícios inativos como fora da vitrine publicável', async () => {
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

  it('mostra benefício com pontos suficientes com ação Resgatar habilitada', async () => {
    configurarApisComSucesso({
      saldoAtual: 1000,
      beneficios: [
        criarBeneficio('beneficio-resgatavel', 'Brinde QuebraNunca', 500, {
          tipo: 2,
          tipoNome: 'Brinde',
          saldoSuficiente: true,
          pontosFaltantes: 0,
          quantidadeDisponivel: 3
        })
      ]
    });
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.getByText('Brinde QuebraNunca')).toBeInTheDocument();
    expect(screen.getByText('500 Pontos QN')).toBeInTheDocument();
    expect(screen.getByText('Disponível')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resgatar' })).toBeEnabled();
    expect(screen.queryByText('Novos benefícios em breve')).not.toBeInTheDocument();
  });

  it('mostra o saldo disponível dentro da vitrine e oferece atalho para ganhar mais', async () => {
    configurarApisComSucesso({ saldoAtual: 1250 });
    const usuario = userEvent.setup();
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.getByLabelText('1.250 Pontos QN disponíveis para resgate')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Como ganhar mais' }));
    expect(screen.getByRole('heading', { name: 'Como ganhar mais pontos' })).toBeInTheDocument();
  });

  it('mantém benefício com pontos insuficientes visível e não permite resgate', async () => {
    const usuario = userEvent.setup();
    configurarApisComSucesso({
      saldoAtual: 500,
      beneficios: [
        criarBeneficio('beneficio-caro', 'Boné QuebraNunca', 2000, {
          tipo: 2,
          tipoNome: 'Brinde',
          saldoSuficiente: false,
          pontosFaltantes: 1500
        })
      ]
    });
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.getByText('Boné QuebraNunca')).toBeInTheDocument();
    expect(screen.getByText('2.000 Pontos QN')).toBeInTheDocument();
    expect(screen.getByText('Pontos insuficientes')).toBeInTheDocument();
    expect(screen.getByText('Faltam 1.500 pontos')).toBeInTheDocument();

    const cta = screen.getByRole('button', { name: 'Faltam 1.500 pontos' });
    expect(cta).toBeDisabled();
    await usuario.click(cta);
    expect(gamificacaoServico.solicitarResgate).not.toHaveBeenCalled();
    expect(screen.queryByText('Novos benefícios em breve')).not.toBeInTheDocument();
  });

  it('mantém benefício sem estoque visível e bloqueia o resgate', async () => {
    configurarApisComSucesso({
      saldoAtual: 3000,
      beneficios: [
        criarBeneficio('beneficio-sem-estoque', 'Chaveiro QuebraNunca', 1000, {
          tipo: 2,
          tipoNome: 'Brinde',
          saldoSuficiente: true,
          pontosFaltantes: 0,
          quantidadeDisponivel: 0
        })
      ]
    });
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.getByText('Chaveiro QuebraNunca')).toBeInTheDocument();
    expect(screen.getByText('1.000 Pontos QN')).toBeInTheDocument();
    expect(screen.getAllByText('Indisponível no momento')).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Indisponível no momento' })).toBeDisabled();
    expect(screen.queryByText('Novos benefícios em breve')).not.toBeInTheDocument();
  });

  it('mantém benefício em breve publicável visível sem permitir resgate', async () => {
    configurarApisComSucesso({
      saldoAtual: 3000,
      beneficios: [
        criarBeneficio('beneficio-em-breve', 'Experiência em breve', 1500, {
          tipo: 3,
          tipoNome: 'Experiência',
          saldoSuficiente: true,
          pontosFaltantes: 0,
          emBreve: true
        })
      ]
    });
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.getByText('Experiência em breve')).toBeInTheDocument();
    expect(screen.getByText('1.500 Pontos QN')).toBeInTheDocument();
    expect(screen.getAllByText('Em breve')).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Em breve' })).toBeDisabled();
    expect(screen.queryByText('Novos benefícios em breve')).not.toBeInTheDocument();
  });

  it('na aba Benefícios com itens ativos mostra somente filtros de categorias com conteúdo', async () => {
    configurarApisComSucesso();
    const usuario = userEvent.setup();
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });
    const filtros = screen.getByRole('group', { name: /Filtros de benefícios/i });

    expect(within(filtros).getByRole('button', { name: 'Todos' })).toBeInTheDocument();
    expect(within(filtros).getByRole('button', { name: 'Descontos' })).toBeInTheDocument();
    expect(within(filtros).getByRole('button', { name: 'Produtos' })).toBeInTheDocument();
    expect(within(filtros).queryByRole('button', { name: 'Brindes' })).not.toBeInTheDocument();
    expect(within(filtros).queryByRole('button', { name: 'Experiências' })).not.toBeInTheDocument();
    expect(within(filtros).queryByRole('button', { name: 'App' })).not.toBeInTheDocument();

    expect(screen.getByText('Cupom 10% OFF')).toBeInTheDocument();
    expect(screen.getByText('10% OFF')).toBeInTheDocument();
    expect(screen.getByText('Chaveiro QuebraNunca')).toBeInTheDocument();
    expect(screen.getByText('Boné QuebraNunca')).toBeInTheDocument();

    await usuario.click(within(filtros).getByRole('button', { name: 'Produtos' }));

    expect(screen.getByText('Chaveiro QuebraNunca')).toBeInTheDocument();
    expect(screen.getByText('Boné QuebraNunca')).toBeInTheDocument();
    expect(screen.queryByText('Cupom 10% OFF')).not.toBeInTheDocument();
  });

  it('inclui nos filtros categorias com benefícios visíveis mesmo sem resgate disponível', async () => {
    configurarApisComSucesso({
      saldoAtual: 0,
      beneficios: [
        criarBeneficio('beneficio-campanha', 'Campanha da comunidade', 500, {
          tipo: 1,
          tipoNome: 'Campanha promocional',
          saldoSuficiente: false
        }),
        criarBeneficio('beneficio-brinde', 'Boné QuebraNunca', 5000, {
          tipo: 2,
          tipoNome: 'Brinde',
          saldoSuficiente: false,
          pontosFaltantes: 5000
        })
      ]
    });
    const usuario = userEvent.setup();
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });
    const filtros = screen.getByRole('group', { name: /Filtros de benefícios/i });

    expect(within(filtros).getByRole('button', { name: 'Todos' })).toBeInTheDocument();
    expect(within(filtros).getByRole('button', { name: 'Descontos' })).toBeInTheDocument();
    expect(within(filtros).getByRole('button', { name: 'Produtos' })).toBeInTheDocument();
    expect(within(filtros).queryByRole('button', { name: 'Brindes' })).not.toBeInTheDocument();

    await usuario.click(within(filtros).getByRole('button', { name: 'Produtos' }));

    expect(screen.getByText('Boné QuebraNunca')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Faltam 5.000 pontos' })).toBeDisabled();
  });

  it('benefício com tipo legado Brinde continua visível em Todos e em Produtos', async () => {
    configurarApisComSucesso({
      saldoAtual: 0,
      beneficios: [
        criarBeneficio('beneficio-campanha', 'Campanha da comunidade', 500, {
          tipo: 1,
          tipoNome: 'Campanha promocional'
        }),
        criarBeneficio('beneficio-legado-brinde', 'Chaveiro QuebraNunca', 2000, {
          tipo: 2,
          tipoNome: 'Brinde',
          saldoSuficiente: false,
          pontosFaltantes: 2000
        })
      ]
    });
    const usuario = userEvent.setup();
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.getByText('Chaveiro QuebraNunca')).toBeInTheDocument();
    const filtros = screen.getByRole('group', { name: /Filtros de benefícios/i });
    expect(within(filtros).queryByRole('button', { name: 'Brindes' })).not.toBeInTheDocument();

    await usuario.click(within(filtros).getByRole('button', { name: 'Produtos' }));

    expect(screen.getByText('Chaveiro QuebraNunca')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Faltam 2.000 pontos' })).toBeDisabled();
  });

  it('mantém cupons percentuais em Descontos e produtos físicos em Produtos', async () => {
    configurarApisComSucesso({
      saldoAtual: 1000,
      beneficios: [
        criarBeneficio('cupom-10', 'Cupom 10% OFF', 300, {
          tipo: 1,
          tipoNome: 'Desconto',
          percentualDesconto: 10,
          saldoSuficiente: true,
          pontosFaltantes: 0
        }),
        criarBeneficio('cupom-20', 'Cupom 20% OFF', 600, {
          tipo: 1,
          tipoNome: 'Desconto',
          percentualDesconto: 20,
          saldoSuficiente: true,
          pontosFaltantes: 0
        }),
        criarBeneficio('beneficio-bone', 'Boné QuebraNunca', 1500, {
          tipo: 4,
          tipoNome: 'Produto',
          saldoSuficiente: false,
          pontosFaltantes: 500
        })
      ]
    });
    const usuario = userEvent.setup();
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.getByText('Cupom 10% OFF')).toBeInTheDocument();
    expect(screen.getByText('Cupom 20% OFF')).toBeInTheDocument();
    expect(screen.getByText('10% OFF')).toBeInTheDocument();
    expect(screen.getByText('20% OFF')).toBeInTheDocument();
    expect(screen.getByText('Boné QuebraNunca')).toBeInTheDocument();

    const filtros = screen.getByRole('group', { name: /Filtros de benefícios/i });
    expect(within(filtros).queryByRole('button', { name: 'Brindes' })).not.toBeInTheDocument();

    await usuario.click(within(filtros).getByRole('button', { name: 'Descontos' }));

    expect(screen.getByText('Cupom 10% OFF')).toBeInTheDocument();
    expect(screen.getByText('Cupom 20% OFF')).toBeInTheDocument();
    expect(screen.queryByText('Boné QuebraNunca')).not.toBeInTheDocument();

    await usuario.click(within(filtros).getByRole('button', { name: 'Produtos' }));

    expect(screen.getByText('Boné QuebraNunca')).toBeInTheDocument();
    expect(screen.queryByText('Cupom 10% OFF')).not.toBeInTheDocument();
    expect(screen.queryByText('Cupom 20% OFF')).not.toBeInTheDocument();
  });

  it('está preparado para exibir desconto de 30% quando a API publicar o benefício', async () => {
    configurarApisComSucesso({
      saldoAtual: 1000,
      beneficios: [
        criarBeneficio('cupom-30', 'Cupom 30% OFF', 1000, {
          tipo: 1,
          tipoNome: 'Desconto',
          percentualDesconto: 30,
          saldoSuficiente: true,
          pontosFaltantes: 0
        })
      ]
    });
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.getByText('Cupom 30% OFF')).toBeInTheDocument();
    expect(screen.getByText('30% OFF')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resgatar' })).toBeEnabled();
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

  it('exibe descontos percentuais sem linguagem de conversão financeira', async () => {
    configurarApisComSucesso();
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.queryByText(/R\$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/100 QN = R\$ 1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cashback/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/carteira financeira/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/conversão/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/comprar/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Resgatar|Faltam|Pontos insuficientes/i).length).toBeGreaterThan(0);
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
