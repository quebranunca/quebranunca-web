import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
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
