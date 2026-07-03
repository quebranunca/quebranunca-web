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
  it('mostra Minhas Partidas para atleta sem duplicar rotas antigas', () => {
    const nomes = obterNomesMenu(PERFIS_USUARIO.atleta);

    expect(nomes).toContain('Minhas Partidas');
    expect(nomes).not.toContain('Meus Jogos');
    expect(nomes).not.toContain('Minhas Partidas Registradas');
  });

  it('mostra Minhas Partidas para organizador sem expor nomes antigos', () => {
    const nomes = obterNomesMenu(PERFIS_USUARIO.organizador);

    expect(nomes).toContain('Minhas Partidas');
    expect(nomes).not.toContain('Minhas Partidas Registradas');
    expect(nomes).not.toContain('Meus Jogos');
  });

  it('usa o menu administrativo de partidas para administrador', () => {
    const nomes = obterNomesMenu(PERFIS_USUARIO.administrador);

    expect(nomes).toContain('Partidas');
    expect(nomes).not.toContain('Meus Jogos');
    expect(nomes).not.toContain('Minhas Partidas');
    expect(nomes).not.toContain('Minhas Partidas Registradas');
  });
});
