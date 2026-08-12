import { describe, expect, it } from 'vitest';
import { criarPendenciasPerfil } from './pendenciasPerfil';

describe('criarPendenciasPerfil', () => {
  it('nao transforma dados complementares ou CPF em pendencias', () => {
    const pendencias = criarPendenciasPerfil({
      estadoAcesso: 'Ativo',
      usuario: { perfil: 3, atletaId: 'atleta-1' },
      atletaDetalhe: {
        nome: 'Gustavo',
        email: 'gustavo@example.test',
        nivel: 2,
        sexo: 1,
        dataNascimento: '1990-01-01',
        cpf: null,
        apelido: null,
        telefone: null,
        instagram: null,
        estado: null,
        cidade: null,
        bairro: null
      }
    });

    expect(pendencias).toEqual([]);
  });

  it('mantem alinhados os campos usados para considerar o perfil completo', () => {
    const pendencias = criarPendenciasPerfil({
      estadoAcesso: 'Ativo',
      usuario: { perfil: 3, atletaId: 'atleta-1' },
      atletaDetalhe: { nome: 'Gustavo', nivel: null, sexo: null, dataNascimento: null }
    });

    expect(pendencias.map((item) => item.id)).toEqual([
      'perfil-campo-dataNascimento',
      'perfil-campo-sexo',
      'perfil-campo-nivel'
    ]);
  });
});
