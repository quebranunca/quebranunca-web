import { describe, expect, it } from 'vitest';
import {
  getBadgePorNivel,
  getMedalhaPorNivel,
  normalizarNivelGamificacao,
  obterNomeNivelGamificacao
} from './gamificacaoMedalhas';

describe('gamificacaoMedalhas', () => {
  it('normaliza niveis conhecidos e aceita objetos de nivel', () => {
    expect(normalizarNivelGamificacao('Bronze')).toBe('bronze');
    expect(normalizarNivelGamificacao('Prata')).toBe('prata');
    expect(normalizarNivelGamificacao('Ouro')).toBe('ouro');
    expect(normalizarNivelGamificacao('Platina')).toBe('platina');
    expect(normalizarNivelGamificacao('Diamante')).toBe('diamante');
    expect(normalizarNivelGamificacao({ nome: 'Prata' })).toBe('prata');
  });

  it('usa Bronze como fallback seguro', () => {
    expect(normalizarNivelGamificacao('')).toBe('bronze');
    expect(normalizarNivelGamificacao('Sem faixa')).toBe('bronze');
    expect(obterNomeNivelGamificacao(null)).toBe('Bronze');
  });

  it('retorna assets de medalha e badge por nivel', () => {
    expect(getMedalhaPorNivel('Ouro')).toBeTruthy();
    expect(getBadgePorNivel('Diamante')).toBeTruthy();
    expect(getMedalhaPorNivel('nivel desconhecido')).toBe(getMedalhaPorNivel('Bronze'));
  });
});
