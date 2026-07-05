import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { RegistrarPartidaNovoModal } from './RegistrarPartidaNovoModal';

const etapas = [
  { id: 'grupo', titulo: 'Grupo', icone: 'group' },
  { id: 'dupla1', titulo: 'Dupla 1', icone: 'players' },
  { id: 'dupla2', titulo: 'Dupla 2', icone: 'players' },
  { id: 'tipo', titulo: 'Tipo', icone: 'score' },
  { id: 'resultado', titulo: 'Resultado', icone: 'score' },
  { id: 'revisao', titulo: 'Revisão', icone: 'summary' }
];

const dadosInvalidos = {
  dupla1: {
    atletaDireita: 'Primo',
    atletaEsquerda: 'gusta',
    pontos: '18'
  },
  dupla2: {
    atletaDireita: 'Bruno',
    atletaEsquerda: 'Caio',
    pontos: ''
  },
  resultado: {
    modo: 'PlacarDetalhado',
    duplaVencedora: ''
  }
};

const selecoesParciais = {
  'dupla1.atletaDireita': { id: 'a1', nome: 'Primo' },
  'dupla1.atletaEsquerda': null,
  'dupla2.atletaDireita': { id: 'a3', nome: 'Bruno' },
  'dupla2.atletaEsquerda': { id: 'a4', nome: 'Caio' }
};

beforeAll(() => {
  window.matchMedia = window.matchMedia || vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn()
  }));
});

afterEach(() => {
  cleanup();
});

function renderizarModal(props = {}) {
  const etapaAtual = etapas[5];

  return render(
    <RegistrarPartidaNovoModal
      aberto
      etapas={etapas}
      etapaAtual={etapaAtual}
      indiceEtapa={5}
      dados={dadosInvalidos}
      selecoes={selecoesParciais}
      resumo={{
        dupla1: ['Primo', 'gusta'],
        dupla2: ['Bruno', 'Caio'],
        placar: { dupla1: '18', dupla2: '' },
        tipoRegistroResultado: 'PlacarDetalhado',
        duplaVencedora: '',
        data: new Date('2026-07-05T12:00:00.000Z'),
        contexto: { grupoId: null }
      }}
      sucesso={null}
      sugestoes={{}}
      sugestoesRapidas={{}}
      campoBuscando=""
      erro=""
      salvando={false}
      duplicidade={null}
      regraPartida={null}
      carregandoRegraPartida={false}
      erroRegraPartida={false}
      grupo={null}
      carregandoGrupo={false}
      gruposDisponiveis={[]}
      carregandoGruposDisponiveis={false}
      erroGruposDisponiveis={false}
      seletorGrupoAberto={false}
      onCarregarGrupos={vi.fn()}
      onSelecionarGrupo={vi.fn()}
      onEscolherGrupo={vi.fn()}
      onRemoverGrupo={vi.fn()}
      onFecharSeletorGrupo={vi.fn()}
      onAlterarCampo={vi.fn()}
      onSelecionarAtleta={vi.fn()}
      onLimparSelecao={vi.fn()}
      onConfirmarEtapa={vi.fn((evento) => evento.preventDefault())}
      onVoltar={vi.fn()}
      onCancelarDuplicidade={vi.fn()}
      onConfirmarDuplicidade={vi.fn()}
      onFechar={vi.fn()}
      {...props}
    />
  );
}

describe('RegistrarPartidaNovoModal - revisão', () => {
  it('não renderiza resumo parcial quando há atleta sem seleção consolidada', () => {
    renderizarModal();

    expect(screen.getByRole('alert')).toHaveTextContent('Informe os quatro atletas da partida.');
    expect(screen.queryByText('VENCEDORES')).not.toBeInTheDocument();
    expect(screen.queryByText('DATA E HORA')).not.toBeInTheDocument();
    expect(screen.queryByText('18')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar partida' })).toBeDisabled();
  });
});

describe('RegistrarPartidaNovoModal - etapa Grupo', () => {
  const gruposDisponiveis = [
    { id: 'grupo-1', nome: 'Fechadinho de Quinta', quantidadeAtletas: 12, privacidade: 'Privado' },
    { id: 'grupo-2', nome: 'Beach Friends', quantidadeAtletas: 8, privacidade: 'Privado' },
    { id: 'geral', nome: 'Geral', quantidadeAtletas: 0, privacidade: 'Sistema' }
  ];

  it('separa Partida avulsa da lista de grupos reais', () => {
    const onSelecionarGrupo = vi.fn();
    const onRemoverGrupo = vi.fn();

    renderizarModal({
      etapaAtual: etapas[0],
      indiceEtapa: 0,
      gruposDisponiveis,
      onSelecionarGrupo,
      onRemoverGrupo
    });

    expect(screen.getByRole('heading', { name: 'Onde foi a partida?' })).toBeInTheDocument();
    expect(screen.getByText('Escolha como deseja registrar esta partida.')).toBeInTheDocument();

    const partidaAvulsa = screen.getByRole('button', { name: /Partida avulsa/i });
    expect(partidaAvulsa).toHaveAttribute('aria-pressed', 'true');
    expect(partidaAvulsa).toHaveTextContent('Registrar uma partida sem vinculá-la a um grupo.');

    expect(screen.getByText('MEUS GRUPOS')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fechadinho de Quinta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Beach Friends/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Partidas avulsas/i })).not.toBeInTheDocument();

    expect(screen.getByText('Sem grupo, sem problema.')).toBeInTheDocument();
    expect(screen.getByText(/poderá ser vinculada a um grupo futuramente/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: /Ver todos/i }));
    expect(onSelecionarGrupo).toHaveBeenCalledTimes(1);
  });

  it('permite alternar entre grupo e partida avulsa', () => {
    const onEscolherGrupo = vi.fn();
    const onRemoverGrupo = vi.fn();

    renderizarModal({
      etapaAtual: etapas[0],
      indiceEtapa: 0,
      grupo: gruposDisponiveis[0],
      gruposDisponiveis,
      onEscolherGrupo,
      onRemoverGrupo
    });

    expect(screen.getByRole('button', { name: /Partida avulsa/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /Fechadinho de Quinta/i })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Partida avulsa/i }));
    expect(onRemoverGrupo).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Beach Friends/i }));
    expect(onEscolherGrupo).toHaveBeenCalledWith(gruposDisponiveis[1]);
  });

  it('trata o grupo especial Geral como Partida avulsa visualmente', () => {
    renderizarModal({
      etapaAtual: etapas[0],
      indiceEtapa: 0,
      grupo: gruposDisponiveis[2],
      gruposDisponiveis
    });

    expect(screen.getByRole('button', { name: /Partida avulsa/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: /Partidas avulsas/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Geral/i })).not.toBeInTheDocument();
  });

  it('não mostra Partidas avulsas dentro do seletor Ver todos', () => {
    renderizarModal({
      etapaAtual: etapas[0],
      indiceEtapa: 0,
      gruposDisponiveis,
      seletorGrupoAberto: true
    });

    expect(screen.getByRole('dialog', { name: 'Selecionar grupo' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Fechadinho de Quinta/i })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /Partidas avulsas/i })).not.toBeInTheDocument();
  });
});
