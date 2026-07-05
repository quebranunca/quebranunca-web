import { describe, expect, it } from 'vitest';
import {
  obterAtletasConsolidadosPartida,
  placarDetalhadoEstaValidoRegistro,
  validarRevisaoPartida
} from './registroPartidaWizard';

const dadosBase = {
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

const selecoesBase = {
  'dupla1.atletaDireita': { id: 'a1', nome: 'Primo' },
  'dupla1.atletaEsquerda': { id: 'a2', nome: 'Gustavo' },
  'dupla2.atletaDireita': { id: 'a3', nome: 'Bruno' },
  'dupla2.atletaEsquerda': { id: 'a4', nome: 'Caio' }
};

describe('registroPartidaWizard', () => {
  it('bloqueia revisão com atleta digitado sem seleção consolidada', () => {
    const selecoes = {
      ...selecoesBase,
      'dupla1.atletaEsquerda': null
    };

    expect(validarRevisaoPartida({
      dados: {
        ...dadosBase,
        dupla1: {
          ...dadosBase.dupla1,
          atletaEsquerda: 'gusta'
        }
      },
      selecoes
    })).toBe('Informe os quatro atletas da partida.');

    expect(obterAtletasConsolidadosPartida(dadosBase, selecoes).dupla1).toHaveLength(1);
  });

  it('bloqueia revisão com placar detalhado incompleto', () => {
    const dados = {
      ...dadosBase,
      dupla2: {
        ...dadosBase.dupla2,
        pontos: null
      }
    };

    expect(placarDetalhadoEstaValidoRegistro(dados)).toBe(false);
    expect(validarRevisaoPartida({ dados, selecoes: selecoesBase })).toBe('Informe o resultado da partida.');
  });

  it('aceita partida avulsa com apenas vencedor sem renderizar placar obrigatório', () => {
    const dados = {
      ...dadosBase,
      dupla1: {
        ...dadosBase.dupla1,
        pontos: ''
      },
      dupla2: {
        ...dadosBase.dupla2,
        pontos: ''
      },
      resultado: {
        modo: 'ApenasResultado',
        duplaVencedora: '1'
      }
    };

    expect(validarRevisaoPartida({
      dados,
      selecoes: selecoesBase,
      contexto: { grupoId: null },
      grupo: null
    })).toBe('');
  });

  it('aguarda grupo selecionado antes de liberar a revisão', () => {
    expect(validarRevisaoPartida({
      dados: dadosBase,
      selecoes: selecoesBase,
      contexto: { grupoId: 'grupo-1' },
      grupo: null
    })).toBe('Aguarde o carregamento do grupo selecionado.');
  });
});
