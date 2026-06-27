import { describe, expect, it } from 'vitest';
import { ESTADOS_ACESSO } from '../utils/acesso';
import { PERFIS_USUARIO } from '../utils/perfis';
import { obterItensNavegacao } from './navagacao';

function obterNomesMenu(perfil) {
  return obterItensNavegacao(
    { perfil },
    ESTADOS_ACESSO.ativo
  ).map((item) => item.nome);
}

describe('navagacao', () => {
  it('mostra Meus Jogos para atleta sem duplicar com Minhas Partidas Registradas', () => {
    const nomes = obterNomesMenu(PERFIS_USUARIO.atleta);

    expect(nomes).toContain('Meus Jogos');
    expect(nomes).not.toContain('Minhas Partidas Registradas');
  });

  it('mostra Minhas Partidas Registradas para organizador sem expor Meus Jogos', () => {
    const nomes = obterNomesMenu(PERFIS_USUARIO.organizador);

    expect(nomes).toContain('Minhas Partidas Registradas');
    expect(nomes).not.toContain('Meus Jogos');
  });

  it('usa o menu administrativo de partidas para administrador', () => {
    const nomes = obterNomesMenu(PERFIS_USUARIO.administrador);

    expect(nomes).toContain('Partidas');
    expect(nomes).not.toContain('Meus Jogos');
    expect(nomes).not.toContain('Minhas Partidas Registradas');
  });
});
