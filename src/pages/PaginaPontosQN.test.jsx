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

function configurarApisComSucesso({ beneficios = criarBeneficios(), saldoAtual = 0 } = {}) {
  gamificacaoServico.obterResumo.mockResolvedValue({
    pontuacao: {
      saldoAtual,
      totalAcumulado: 0,
      temAtletaVinculado: true
    },
    nivel: {
      nome: 'Bronze',
      progressoPercentual: 0,
      pontosRestantes: 500,
      pontosProximaFaixa: 500
    }
  });
  gamificacaoServico.listarBeneficios.mockResolvedValue(beneficios);
  gamificacaoServico.listarExtrato.mockResolvedValue({ itens: [] });
  gamificacaoServico.listarResgates.mockResolvedValue([]);
  gamificacaoServico.listarMissoes.mockResolvedValue([]);
  gamificacaoServico.listarConquistas.mockResolvedValue([]);
}

function configurarApisComErro() {
  const erro = new Error('API indisponível');
  gamificacaoServico.obterResumo.mockRejectedValue(erro);
  gamificacaoServico.listarBeneficios.mockRejectedValue(erro);
  gamificacaoServico.listarExtrato.mockRejectedValue(erro);
  gamificacaoServico.listarResgates.mockRejectedValue(erro);
  gamificacaoServico.listarMissoes.mockRejectedValue(erro);
  gamificacaoServico.listarConquistas.mockRejectedValue(erro);
}

function criarBeneficios() {
  return [
    criarBeneficio('beneficio-500', 'R$ 5 off na loja', 500),
    criarBeneficio('beneficio-1000', 'R$ 10 off na loja', 1000),
    criarBeneficio('beneficio-chaveiro', 'Chaveiro QuebraNunca', 2000, {
      tipo: 4,
      tipoNome: 'Produto',
      imagemUrl: 'pontos-qn/beneficio-chaveiro-qn.png'
    }),
    criarBeneficio('beneficio-2000', 'R$ 20 off na loja', 2000),
    criarBeneficio('beneficio-3000', 'R$ 30 off na loja', 3000),
    criarBeneficio('beneficio-5000', 'R$ 50 off na loja', 5000),
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
    tipoNome: sobrescritas.tipoNome ?? 'Desconto na loja',
    pontosNecessarios,
    ativo: sobrescritas.ativo ?? true,
    quantidadeDisponivel: sobrescritas.quantidadeDisponivel ?? null,
    imagemUrl: sobrescritas.imagemUrl ?? null,
    destaque: pontosNecessarios === 500,
    saldoSuficiente: sobrescritas.saldoSuficiente ?? false,
    pontosFaltantes: sobrescritas.pontosFaltantes ?? pontosNecessarios
  };
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

describe('PaginaPontosQN - regras oficiais', () => {
  it('mostra a seção informativa pelo deep link como-ganhar', async () => {
    configurarApisComSucesso();
    renderizarPagina('/app/pontos-qn?aba=como-ganhar');

    expect(await screen.findByRole('heading', { name: /Como ganhar Pontos QN/i })).toBeInTheDocument();
    expect(screen.getByText(/Pontos QN são pontos promocionais/i)).toBeInTheDocument();
    expect(screen.getByText(/Benefícios promocionais/i)).toBeInTheDocument();
    expect(screen.getByText(/Use seus Pontos QN para desbloquear benefícios da comunidade/i)).toBeInTheDocument();
    expect(screen.queryByText(/100 QN = R\$ 1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/1000 QN = R\$ 10/i)).not.toBeInTheDocument();
  });

  it('lista formas ativas de ganhar Pontos QN', async () => {
    configurarApisComSucesso();
    renderizarPagina('/app/pontos-qn?aba=como-ganhar');

    await screen.findByRole('heading', { name: /Como ganhar Pontos QN/i });

    expect(screen.getByText('Participar de partida válida')).toBeInTheDocument();
    expect(screen.getAllByText('+10 QN').length).toBeGreaterThan(0);
    expect(screen.getByText('Registrar uma partida')).toBeInTheDocument();
    expect(screen.getAllByText('+5 QN').length).toBeGreaterThan(0);
    expect(screen.getByText('Vitória')).toBeInTheDocument();
    expect(screen.getByText('+3 QN')).toBeInTheDocument();
    expect(screen.getByText('Confirmar/aprovar partida')).toBeInTheDocument();
    expect(screen.getByText('+2 QN')).toBeInTheDocument();
  });

  it('mostra benefícios de referência sem equivalência financeira', async () => {
    configurarApisComSucesso();
    renderizarPagina('/app/pontos-qn?aba=como-ganhar');

    await screen.findByRole('heading', { name: /Benefícios de referência/i });
    const beneficios = screen.getByRole('heading', { name: /Benefícios de referência/i }).closest('section');
    expect(beneficios).not.toBeNull();

    expect(within(beneficios).getByText('500 QN')).toBeInTheDocument();
    expect(within(beneficios).getByText('Condição especial em campanha')).toBeInTheDocument();
    expect(within(beneficios).getByText('1.000 QN')).toBeInTheDocument();
    expect(within(beneficios).getByText('Benefício promocional QN')).toBeInTheDocument();
    expect(within(beneficios).getAllByText('2.000 QN').length).toBeGreaterThan(0);
    expect(within(beneficios).getByText('Chaveiro QuebraNunca')).toBeInTheDocument();
    expect(within(beneficios).getByText('5.000 QN')).toBeInTheDocument();
    expect(within(beneficios).getByText('Condição especial QuebraNunca')).toBeInTheDocument();
    expect(within(beneficios).getByText('8.000 QN')).toBeInTheDocument();
    expect(within(beneficios).getByText('Boné QuebraNunca')).toBeInTheDocument();
    expect(within(beneficios).queryByText(/R\$/i)).not.toBeInTheDocument();
    expect(within(beneficios).queryByText(/100 QN = R\$ 1/i)).not.toBeInTheDocument();
  });

  it('renderiza a aba Benefícios com categorias finais e lista única de cards', async () => {
    configurarApisComSucesso();
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.getByText(/Use seus Pontos QN para desbloquear campanhas, brindes e vantagens da comunidade/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Todos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Campanhas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Brindes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Produtos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Experiências' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'App' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Descontos' })).not.toBeInTheDocument();

    expect(screen.getByText('Chaveiro QuebraNunca')).toBeInTheDocument();
    expect(screen.getByText('Boné QuebraNunca')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Chaveiro QuebraNunca' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Boné QuebraNunca' })).toBeInTheDocument();

    const chaveiroCard = screen.getByText('Chaveiro QuebraNunca').closest('article');
    const boneCard = screen.getByText('Boné QuebraNunca').closest('article');
    expect(within(chaveiroCard).getAllByText('2.000 Pontos QN')).toHaveLength(1);
    expect(within(boneCard).getAllByText('8.000 Pontos QN')).toHaveLength(1);
    expect(within(chaveiroCard).getAllByText('Pontos insuficientes')).toHaveLength(1);
    expect(within(boneCard).getAllByText('Pontos insuficientes')).toHaveLength(1);
    expect(within(chaveiroCard).getByText('Faltam 2.000 pontos')).toBeInTheDocument();

    expect(screen.getByText('Condição especial em campanha')).toBeInTheDocument();
    expect(screen.getByText('Condição especial QuebraNunca')).toBeInTheDocument();
    expect(screen.queryByText('R$ 5 off na loja')).not.toBeInTheDocument();
    expect(screen.queryByText('R$ 50 off na loja')).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$/i)).not.toBeInTheDocument();
    const listaBeneficios = document.querySelector('.pontosqn-beneficios-grid');
    expect(listaBeneficios.querySelectorAll('.pontosqn-beneficio-card')).toHaveLength(7);
    expect(screen.queryByText(/Seu saldo/i)).not.toBeInTheDocument();
  });

  it('não apresenta Pontos QN como dinheiro, cashback ou carteira financeira', async () => {
    configurarApisComSucesso();
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.getByText(/campanhas, brindes e vantagens da comunidade/i)).toBeInTheDocument();
    expect(screen.queryByText(/100 QN = R\$ 1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cashback/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/carteira/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/saldo financeiro/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/crédito financeiro/i)).not.toBeInTheDocument();
  });

  it('remove métricas esportivas da aba Pontos QN', async () => {
    configurarApisComSucesso();
    renderizarPagina('/app/pontos-qn');

    await screen.findByText(/Bora jogar e somar pontos/i);

    expect(screen.queryByText('Partidas no mês')).not.toBeInTheDocument();
    expect(screen.queryByText('Sequência')).not.toBeInTheDocument();
    expect(screen.queryByText('Ranking')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Resumo do programa/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Como ganhar mais pontos/i })).toBeInTheDocument();
  });

  it('filtra Brindes por boné e chaveiro mesmo quando a API não envia imagemUrl', async () => {
    configurarApisComSucesso({
      beneficios: [
        criarBeneficio('beneficio-chaveiro-sem-url', 'Chaveiro QuebraNunca', 2000, {
          tipo: 4,
          tipoNome: 'Produto'
        }),
        criarBeneficio('beneficio-bone-sem-url', 'Boné QuebraNunca', 8000, {
          tipo: 4,
          tipoNome: 'Produto'
        }),
        criarBeneficio('beneficio-campanha', 'Cupom especial QuebraNunca', 500, {
          tipo: 1,
          tipoNome: 'Campanha promocional'
        })
      ]
    });
    const usuario = userEvent.setup();
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });
    await usuario.click(screen.getByRole('button', { name: 'Brindes' }));

    const chaveiroCard = screen.getByText('Chaveiro QuebraNunca').closest('article');
    const boneCard = screen.getByText('Boné QuebraNunca').closest('article');

    expect(screen.queryByText('Cupom especial QuebraNunca')).not.toBeInTheDocument();
    expect(within(chaveiroCard).getByRole('img', { name: 'Chaveiro QuebraNunca' })).toBeInTheDocument();
    expect(within(boneCard).getByRole('img', { name: 'Boné QuebraNunca' })).toBeInTheDocument();
    expect(within(chaveiroCard).getAllByText('2.000 Pontos QN')).toHaveLength(1);
    expect(within(boneCard).getAllByText('8.000 Pontos QN')).toHaveLength(1);
  });

  it('filtra Campanhas pelo tipo estável sem depender do texto público Descontos', async () => {
    configurarApisComSucesso();
    const usuario = userEvent.setup();
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });
    await usuario.click(screen.getByRole('button', { name: 'Campanhas' }));

    expect(screen.getByText('Condição especial em campanha')).toBeInTheDocument();
    expect(screen.getByText('Condição especial QuebraNunca')).toBeInTheDocument();
    expect(screen.queryByText('Chaveiro QuebraNunca')).not.toBeInTheDocument();
    expect(screen.queryByText('Boné QuebraNunca')).not.toBeInTheDocument();
    expect(screen.queryByText(/Descontos/i)).not.toBeInTheDocument();
  });

  it('mantém Produtos separado de Brindes quando o item físico não é boné ou chaveiro', async () => {
    configurarApisComSucesso({
      beneficios: [
        criarBeneficio('beneficio-produto', 'Produto QuebraNunca em campanha', 1500, {
          tipo: 4,
          tipoNome: 'Produto'
        }),
        criarBeneficio('beneficio-chaveiro', 'Chaveiro QuebraNunca', 2000, {
          tipo: 4,
          tipoNome: 'Produto'
        })
      ]
    });
    const usuario = userEvent.setup();
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });
    await usuario.click(screen.getByRole('button', { name: 'Produtos' }));

    const produtoCard = screen.getByText('Produto QuebraNunca em campanha').closest('article');
    expect(produtoCard).not.toBeNull();
    expect(within(produtoCard).getByText('Produtos')).toBeInTheDocument();
    expect(screen.queryByText('Chaveiro QuebraNunca')).not.toBeInTheDocument();
  });

  it('mostra fallback visual quando o benefício não possui imagem mapeada', async () => {
    configurarApisComSucesso({
      beneficios: [
        criarBeneficio('beneficio-sem-imagem', 'Benefício da comunidade', 700, {
          tipo: 99,
          tipoNome: 'Outro'
        })
      ]
    });
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.getByRole('img', { name: 'Benefício QN: Benefício da comunidade' })).toBeInTheDocument();
    expect(screen.getByText('Benefício da comunidade')).toBeInTheDocument();
  });

  it('diferencia resgate disponível, pontos insuficientes e benefício indisponível', async () => {
    configurarApisComSucesso({
      beneficios: [
        criarBeneficio('beneficio-disponivel', 'Benefício disponível', 100, {
          saldoSuficiente: true,
          pontosFaltantes: 0
        }),
        criarBeneficio('beneficio-insuficiente', 'Benefício insuficiente', 500, {
          saldoSuficiente: false,
          pontosFaltantes: 300
        }),
        criarBeneficio('beneficio-sem-estoque', 'Benefício sem estoque', 200, {
          saldoSuficiente: true,
          quantidadeDisponivel: 0
        })
      ]
    });
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.getByRole('button', { name: 'Resgatar' })).toBeInTheDocument();
    expect(screen.getByText('Pontos insuficientes')).toBeInTheDocument();
    expect(screen.getByText('Faltam 300 pontos')).toBeInTheDocument();
    expect(screen.getAllByText('Indisponível no momento').length).toBeGreaterThan(0);
  });

  it('mostra estado vazio geral e leva para Como ganhar pontos', async () => {
    configurarApisComSucesso({ beneficios: [] });
    const usuario = userEvent.setup();
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });

    expect(screen.getByText('Novos benefícios em breve')).toBeInTheDocument();
    expect(screen.getByText(/Continue jogando e acumulando Pontos QN/i)).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Ver como ganhar pontos' }));

    expect(await screen.findByRole('heading', { name: /Como ganhar Pontos QN/i })).toBeInTheDocument();
  });

  it('mostra estado vazio de categoria e permite voltar para Todos', async () => {
    configurarApisComSucesso({
      beneficios: [
        criarBeneficio('beneficio-campanha', 'Cupom especial QuebraNunca', 500, {
          tipo: 1,
          tipoNome: 'Campanha promocional'
        })
      ]
    });
    const usuario = userEvent.setup();
    renderizarPagina('/app/pontos-qn?aba=beneficios');

    await screen.findByRole('heading', { name: /Benefícios QN/i });
    await usuario.click(screen.getByRole('button', { name: 'App' }));

    expect(screen.getByText('Nenhum benefício nesta categoria')).toBeInTheDocument();
    expect(screen.getByText(/Tente outro filtro/i)).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Ver todos' }));

    expect(screen.getByText('Cupom especial QuebraNunca')).toBeInTheDocument();
  });

  it('mostra regras importantes e proteção contra conversão em dinheiro', async () => {
    configurarApisComSucesso();
    renderizarPagina('/app/pontos-qn?aba=como-ganhar');

    await screen.findByRole('heading', { name: /Regras importantes/i });

    expect(screen.getByText(/Partidas duplicadas ou inválidas não geram pontos/i)).toBeInTheDocument();
    expect(screen.getByText(/QN não pode ser convertido em dinheiro/i)).toBeInTheDocument();
    expect(screen.getByText(/Campanhas com QN têm limite e regras próprias/i)).toBeInTheDocument();
  });

  it('mantém a aba informativa acessível quando a API está indisponível', async () => {
    configurarApisComErro();
    renderizarPagina('/app/pontos-qn?aba=como-ganhar');

    expect(await screen.findByRole('heading', { name: /Como ganhar Pontos QN/i })).toBeInTheDocument();
    expect(screen.getByText(/Eles não são dinheiro/i)).toBeInTheDocument();
  });

  it('navega para a aba Como ganhar pelo botão da página', async () => {
    configurarApisComSucesso();
    const usuario = userEvent.setup();
    renderizarPagina('/app/pontos-qn');

    await screen.findByText(/Bora jogar e somar pontos/i);
    const tabs = screen.getByRole('navigation', { name: /Seções de Pontos QN/i });
    await usuario.click(within(tabs).getByRole('button', { name: /Como ganhar/i }));

    expect(await screen.findByRole('heading', { name: /Como ganhar Pontos QN/i })).toBeInTheDocument();
  });
});
