import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { ArteCompartilhamentoPartida } from './ArteCompartilhamentoPartida';

function criarDados(overrides = {}) {
  return {
    partidaId: 'partida-1',
    grupoNome: 'Fechadinho de Quinta',
    dataPartida: '2026-07-05T22:58:00-03:00',
    dupla1: [
      { atletaId: 'a1', nome: 'Professor Almeida', apelido: 'Professor' },
      { atletaId: 'a2', nome: 'Carlos Bilidoso', apelido: 'Bilidoso' }
    ],
    dupla2: [
      { atletaId: 'a3', nome: 'Gustavo Henrique Almeida Souza', apelido: 'Primo' },
      { atletaId: 'a4', nome: 'Carlos Eduardo', apelido: 'Casão' }
    ],
    placarDupla1: 21,
    placarDupla2: 18,
    duplaVencedora: 1,
    tipoRegistroResultado: 'PlacarDetalhado',
    registradoPor: 'Primo',
    ...overrides
  };
}

afterEach(() => {
  cleanup();
});

describe('ArteCompartilhamentoPartida', () => {
  it('renderiza story premium com placar real, vencedores e rodape compacto', () => {
    render(<ArteCompartilhamentoPartida dados={criarDados()} />);

    const vencedores = screen.getByRole('region', { name: /Vencedores da partida/i });
    const placar = screen.getByLabelText('Placar da partida');
    const metadados = screen.getByLabelText('Dados da partida');

    expect(within(vencedores).getByText('Professor')).toBeInTheDocument();
    expect(within(vencedores).getByText('Bilidoso')).toBeInTheDocument();
    expect(within(placar).getByText('21')).toBeInTheDocument();
    expect(within(placar).getByText('x')).toBeInTheDocument();
    expect(within(placar).getByText('18')).toBeInTheDocument();
    expect(within(metadados).getByText('Fechadinho de Quinta')).toBeInTheDocument();
    expect(within(metadados).getByText('05 Jul 2026 • 22:58')).toBeInTheDocument();
    expect(within(metadados).getByText('Primo')).toBeInTheDocument();
    expect(screen.getByText('O FUTEVÔLEI NÃO ACABA NA AREIA.')).toBeInTheDocument();
    expect(screen.getByText('app.quebranunca.com.br')).toBeInTheDocument();
  });

  it('nao renderiza placar falso em partida apenas com vencedor', () => {
    render(
      <ArteCompartilhamentoPartida
        dados={criarDados({
          tipoRegistroResultado: 'ApenasResultado',
          placarDupla1: 0,
          placarDupla2: 0
        })}
      />
    );

    expect(screen.queryByLabelText('Placar da partida')).not.toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(screen.getByText('VS')).toBeInTheDocument();
  });

  it('usa Partidas avulsas quando a partida nao possui grupo', () => {
    render(<ArteCompartilhamentoPartida dados={criarDados({ grupoNome: '' })} />);

    expect(screen.getByText('Partidas avulsas')).toBeInTheDocument();
  });
});
