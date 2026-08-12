import { describe, expect, it } from 'vitest';
import { ESTADOS_ACESSO, obterEstadoAcessoUsuario } from './acesso';

describe('obterEstadoAcessoUsuario', () => {
  it('libera o acesso basico mesmo sem atleta vinculado', () => {
    expect(obterEstadoAcessoUsuario({ perfil: 3, atletaId: null })).toBe(ESTADOS_ACESSO.ativo);
  });

  it('preserva o primeiro acesso quando ele ainda precisa ser apresentado', () => {
    expect(obterEstadoAcessoUsuario(
      { perfil: 3, atletaId: null },
      { primeiroAcessoPendente: true }
    )).toBe(ESTADOS_ACESSO.primeiroAcesso);
  });
});
