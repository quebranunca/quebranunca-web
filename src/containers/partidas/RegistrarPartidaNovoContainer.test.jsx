import { describe, expect, it, vi } from 'vitest';
import {
  criarPayloadRegistroPartida,
  obterAtletaSelecaoId
} from './RegistrarPartidaNovoContainer';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

describe('criarPayloadRegistroPartida', () => {
  it('usa o atletaId, e não o id do vínculo, ao normalizar um membro de grupo', () => {
    expect(obterAtletaSelecaoId({
      id: '8c5ee4e8-a457-4c7e-8362-6320dc04ba92',
      atletaId: 'dfa7b52f-e03c-4112-81a0-64bbaf75869f'
    })).toBe('dfa7b52f-e03c-4112-81a0-64bbaf75869f');
  });

  it('preserva um atleta selecionado e três nomes manuais no registro de grupo', () => {
    const atletaId = 'c9fc958e-8206-4a75-a98e-60c85444d600';
    const grupoId = 'ae7cdf7b-9a6f-48e5-87fd-6513416d8be4';
    const dados = {
      dupla1: {
        atletaDireita: 'AuditQN',
        atletaEsquerda: 'Jogador Manual 1',
        pontos: ''
      },
      dupla2: {
        atletaDireita: 'Jogador Manual 2',
        atletaEsquerda: 'Jogador Manual 3',
        pontos: ''
      },
      resultado: {
        modo: 'ApenasResultado',
        duplaVencedora: '1'
      }
    };
    const selecoes = {
      'dupla1.atletaDireita': { id: atletaId, nome: 'AuditQN' },
      'dupla1.atletaEsquerda': null,
      'dupla2.atletaDireita': null,
      'dupla2.atletaEsquerda': null
    };

    const payload = criarPayloadRegistroPartida(
      dados,
      selecoes,
      { atletaId },
      { id: atletaId, nome: 'Auditoria Beta QN', apelido: 'AuditQN' },
      { grupoId }
    );

    expect(payload).toMatchObject({
      grupoId,
      duplaAAtleta1Id: atletaId,
      duplaAAtleta1Nome: 'AuditQN',
      duplaAAtleta2Id: null,
      duplaAAtleta2Nome: 'Jogador Manual 1',
      duplaBAtleta1Id: null,
      duplaBAtleta1Nome: 'Jogador Manual 2',
      duplaBAtleta2Id: null,
      duplaBAtleta2Nome: 'Jogador Manual 3',
      placarDuplaA: null,
      placarDuplaB: null,
      duplaVencedora: 1,
      tipoRegistroResultado: 'ApenasResultado'
    });
  });
});
