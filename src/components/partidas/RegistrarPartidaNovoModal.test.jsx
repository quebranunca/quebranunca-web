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
    atletaEsquerda: '   ',
    pontos: '18'
  },
  dupla2: {
    atletaDireita: 'Bruno',
    atletaEsquerda: 'Caio',
    pontos: '16'
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

const dadosValidos = {
  dupla1: {
    atletaDireita: 'Primo',
    atletaEsquerda: 'Gustavo',
    pontos: '18'
  },
  dupla2: {
    atletaDireita: 'Bruno',
    atletaEsquerda: 'Caio',
    pontos: '16'
  },
  resultado: {
    modo: 'PlacarDetalhado',
    duplaVencedora: ''
  }
};

const selecoesValidas = {
  'dupla1.atletaDireita': { id: 'a1', nome: 'Primo' },
  'dupla1.atletaEsquerda': { id: 'a2', nome: 'Gustavo' },
  'dupla2.atletaDireita': { id: 'a3', nome: 'Bruno' },
  'dupla2.atletaEsquerda': { id: 'a4', nome: 'Caio' }
};

const dadosComManualValido = {
  dupla1: {
    atletaDireita: 'Primo',
    atletaEsquerda: 'Ale 05',
    pontos: '18'
  },
  dupla2: {
    atletaDireita: 'Bruno',
    atletaEsquerda: 'Ze 07',
    pontos: '16'
  },
  resultado: {
    modo: 'PlacarDetalhado',
    duplaVencedora: ''
  }
};

const selecoesComManualValido = {
  'dupla1.atletaDireita': { id: 'a1', nome: 'Primo' },
  'dupla1.atletaEsquerda': null,
  'dupla2.atletaDireita': { id: 'a3', nome: 'Bruno' },
  'dupla2.atletaEsquerda': null
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
        dupla1: ['Primo', ''],
        dupla2: ['Bruno', 'Caio'],
        placar: { dupla1: '18', dupla2: '16' },
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
      onIrParaEtapa={vi.fn()}
      onCancelarDuplicidade={vi.fn()}
      onConfirmarDuplicidade={vi.fn()}
      onFechar={vi.fn()}
      {...props}
    />
  );
}

describe('RegistrarPartidaNovoModal - revisão', () => {
  it('renderiza como página sem dialog principal quando solicitado', () => {
    const { container } = renderizarModal({ modoExibicao: 'pagina' });

    const pagina = container.querySelector('.registrar-partida-novo-pagina');
    expect(pagina).not.toBeNull();
    expect(pagina).toHaveAttribute('data-modo-exibicao', 'pagina');
    expect(pagina).not.toHaveAttribute('aria-modal');
    expect(screen.queryByRole('dialog', { name: /Registrar partida/i })).not.toBeInTheDocument();
    expect(container.querySelector('.registrar-partida-novo-sobreposicao')).toBeNull();
  });

  it('não renderiza resumo parcial e mostra ação clara quando falta atleta preenchido', () => {
    const onIrParaEtapa = vi.fn();

    renderizarModal({ onIrParaEtapa });

    expect(screen.getByText('Volte e informe os quatro atletas da partida.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Informe os quatro atletas da partida.');
    expect(screen.getByRole('button', { name: 'Voltar para Dupla 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar para Dupla 2' })).toBeInTheDocument();
    expect(screen.queryByText('VENCEDORES')).not.toBeInTheDocument();
    expect(screen.queryByText('DATA E HORA')).not.toBeInTheDocument();
    expect(screen.queryByText('18')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar partida' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Voltar para Dupla 1' }));
    expect(onIrParaEtapa).toHaveBeenCalledWith('dupla1');
  });

  it('renderiza revisão com participantes manuais e habilita registrar', () => {
    renderizarModal({
      dados: dadosComManualValido,
      selecoes: selecoesComManualValido,
      resumo: {
        dupla1: ['Primo', 'Ale 05'],
        dupla2: ['Bruno', 'Ze 07'],
        placar: { dupla1: '18', dupla2: '16' },
        tipoRegistroResultado: 'PlacarDetalhado',
        duplaVencedora: '',
        data: new Date('2026-07-05T12:00:00.000Z'),
        contexto: { grupoId: null }
      }
    });

    expect(screen.queryByText('Volte e informe os quatro atletas da partida.')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('VENCEDORES')).toBeInTheDocument();
    expect(screen.getByText('Ale 05')).toBeInTheDocument();
    expect(screen.getByText('Ze 07')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar partida' })).toBeEnabled();
  });

  it('habilita continuar na Dupla 1 quando há texto manual preenchido', () => {
    renderizarModal({
      etapaAtual: etapas[1],
      indiceEtapa: 1,
      dados: {
        ...dadosValidos,
        dupla1: {
          ...dadosValidos.dupla1,
          atletaEsquerda: 'gusta'
        }
      },
      selecoes: {
        ...selecoesValidas,
        'dupla1.atletaEsquerda': null
      }
    });

    expect(screen.getByRole('heading', { name: 'Quem jogou na Dupla 1?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  it('bloqueia continuar na Dupla 1 quando texto manual repete participante', () => {
    renderizarModal({
      etapaAtual: etapas[1],
      indiceEtapa: 1,
      dados: {
        ...dadosValidos,
        dupla1: {
          ...dadosValidos.dupla1,
          atletaEsquerda: 'primo'
        }
      },
      selecoes: {
        ...selecoesValidas,
        'dupla1.atletaEsquerda': null
      }
    });

    expect(screen.getByRole('heading', { name: 'Quem jogou na Dupla 1?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  });

  it('habilita continuar na Dupla 1 somente com dois atletas selecionados', () => {
    renderizarModal({
      etapaAtual: etapas[1],
      indiceEtapa: 1,
      dados: dadosValidos,
      selecoes: selecoesValidas
    });

    expect(screen.getByRole('heading', { name: 'Quem jogou na Dupla 1?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  it('bloqueia Resultado com duplas incompletas sem renderizar vencedor parcial', () => {
    renderizarModal({
      etapaAtual: etapas[4],
      indiceEtapa: 4
    });

    expect(screen.getByText('Volte e informe os quatro atletas da partida.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar para Dupla 1' })).toBeInTheDocument();
    expect(screen.queryByText('Atleta pendente')).not.toBeInTheDocument();
    expect(screen.queryByText('Quem venceu?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
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

  it('exibe grupos retornados pela API sem duplicar cards', () => {
    const gruposRetornados = [
      { id: 'publico-1', nome: 'Arena Pública', quantidadeAtletas: 20, privacidade: 'Público' },
      { id: 'privado-1', nome: 'Meu Grupo Privado', quantidadeAtletas: 10, privacidade: 'Privado' },
      { id: 'criado-1', nome: 'Grupo Criado por Mim', quantidadeAtletas: 1, privacidade: 'Privado' },
      { id: 'publico-1', nome: 'Arena Pública', quantidadeAtletas: 20, privacidade: 'Público' }
    ];

    renderizarModal({
      etapaAtual: etapas[0],
      indiceEtapa: 0,
      gruposDisponiveis: gruposRetornados
    });

    expect(screen.getAllByRole('button', { name: /Arena Pública/i })).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Meu Grupo Privado/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Grupo Criado por Mim/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Privado de Terceiro/i })).not.toBeInTheDocument();
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
