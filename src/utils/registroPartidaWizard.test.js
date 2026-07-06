import { describe, expect, it } from 'vitest';
import {
  obterAtletasConsolidadosPartida,
  placarDetalhadoEstaValidoRegistro,
  validarDuplaConsolidada,
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
  it('valida a dupla com atleta selecionado ou texto manual preenchido', () => {
    expect(validarDuplaConsolidada(dadosBase, selecoesBase, 'dupla1', 'Dupla 1')).toBe('');

    expect(validarDuplaConsolidada(
      {
        ...dadosBase,
        dupla1: {
          ...dadosBase.dupla1,
          atletaEsquerda: 'gusta'
        }
      },
      {
        ...selecoesBase,
        'dupla1.atletaEsquerda': null
      },
      'dupla1',
      'Dupla 1'
    )).toBe('');

    expect(validarDuplaConsolidada(
      {
        ...dadosBase,
        dupla1: {
          ...dadosBase.dupla1,
          atletaEsquerda: '   '
        }
      },
      {
        ...selecoesBase,
        'dupla1.atletaEsquerda': null
      },
      'dupla1',
      'Dupla 1'
    )).toBe('Informe os dois atletas da Dupla 1.');
  });

  it('aceita revisão com atleta digitado sem seleção consolidada', () => {
    const selecoes = {
      ...selecoesBase,
      'dupla1.atletaEsquerda': null
    };
    const dados = {
      ...dadosBase,
      dupla1: {
        ...dadosBase.dupla1,
        atletaEsquerda: 'Ale 05'
      }
    };

    expect(validarRevisaoPartida({
      dados,
      selecoes
    })).toBe('');

    const atletas = obterAtletasConsolidadosPartida(dados, selecoes);
    expect(atletas.dupla1).toHaveLength(2);
    expect(atletas.dupla1[1]).toMatchObject({ id: null, nome: 'Ale 05' });
  });

  it('bloqueia participante manual vazio ou repetido', () => {
    expect(validarRevisaoPartida({
      dados: {
        ...dadosBase,
        dupla1: {
          ...dadosBase.dupla1,
          atletaEsquerda: '   '
        }
      },
      selecoes: {
        ...selecoesBase,
        'dupla1.atletaEsquerda': null
      }
    })).toBe('Informe os quatro atletas da partida.');

    expect(validarRevisaoPartida({
      dados: {
        ...dadosBase,
        dupla1: {
          ...dadosBase.dupla1,
          atletaEsquerda: 'primo'
        }
      },
      selecoes: {
        ...selecoesBase,
        'dupla1.atletaEsquerda': null
      }
    })).toBe('Informe os quatro atletas da partida.');

    expect(validarRevisaoPartida({
      dados: {
        ...dadosBase,
        dupla2: {
          ...dadosBase.dupla2,
          atletaEsquerda: 'Gustavo'
        }
      },
      selecoes: {
        ...selecoesBase,
        'dupla2.atletaEsquerda': null
      }
    })).toBe('Não é permitido repetir atleta na mesma partida.');
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
