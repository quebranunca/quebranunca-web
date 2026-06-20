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

function configurarApisComSucesso({ beneficios = criarBeneficios() } = {}) {
  gamificacaoServico.obterResumo.mockResolvedValue({
    pontuacao: {
      saldoAtual: 0,
      totalAcumulado: 0,
      temAtletaVinculado: true
    },
    nivel: {
      nome: 'Bronze',
      progressoPercentual: 0,
      pontosRestantes: 500,
      pontosProximaFaixa: 500
    },
    atividade: {
      partidasNoMes: 0,
      sequenciaSemanal: 0,
      posicaoRanking: null
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
    criarBeneficio('beneficio-2000', 'R$ 20 off na loja', 2000),
    criarBeneficio('beneficio-3000', 'R$ 30 off na loja', 3000),
    criarBeneficio('beneficio-5000', 'R$ 50 off na loja', 5000)
  ];
}

function criarBeneficio(id, titulo, pontosNecessarios) {
  return {
    id,
    titulo,
    descricao: `${titulo} para campanhas QuebraNunca.`,
    tipo: 1,
    tipoNome: 'Desconto na loja',
    pontosNecessarios,
    ativo: true,
    destaque: pontosNecessarios === 500,
    saldoSuficiente: false,
    pontosFaltantes: pontosNecessarios
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
    expect(screen.getAllByText(/100 QN = R\$ 1/i)).not.toHaveLength(0);
    expect(screen.getByText(/1000 QN = R\$ 10/i)).toBeInTheDocument();
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

  it('mostra benefícios iniciais de desconto por QN', async () => {
    configurarApisComSucesso();
    renderizarPagina('/app/pontos-qn?aba=como-ganhar');

    await screen.findByRole('heading', { name: /Benefícios de referência/i });
    const beneficios = screen.getByRole('heading', { name: /Benefícios de referência/i }).closest('section');
    expect(beneficios).not.toBeNull();

    expect(within(beneficios).getByText('500 QN')).toBeInTheDocument();
    expect(within(beneficios).getByText('R$ 5 off')).toBeInTheDocument();
    expect(within(beneficios).getByText('1.000 QN')).toBeInTheDocument();
    expect(within(beneficios).getByText('R$ 10 off')).toBeInTheDocument();
    expect(within(beneficios).getByText('5.000 QN')).toBeInTheDocument();
    expect(within(beneficios).getByText('R$ 50 off')).toBeInTheDocument();
  });

  it('mostra regras importantes e proteção contra conversão em dinheiro', async () => {
    configurarApisComSucesso();
    renderizarPagina('/app/pontos-qn?aba=como-ganhar');

    await screen.findByRole('heading', { name: /Regras importantes/i });

    expect(screen.getByText(/Partidas duplicadas ou inválidas não geram pontos/i)).toBeInTheDocument();
    expect(screen.getByText(/QN não pode ser convertido em dinheiro/i)).toBeInTheDocument();
    expect(screen.getByText(/Cupom com QN cobre até 30% do pedido/i)).toBeInTheDocument();
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
    await usuario.click(screen.getByRole('button', { name: /Como ganhar/i }));

    expect(await screen.findByRole('heading', { name: /Como ganhar Pontos QN/i })).toBeInTheDocument();
  });
});
