import {
  badgesGamificacao,
  medalhasGamificacao
} from '../assets/gamificacao/medalhas/index.js';

const NIVEL_FALLBACK = 'bronze';

const NOMES_NIVEIS = Object.freeze({
  bronze: 'Bronze',
  prata: 'Prata',
  ouro: 'Ouro',
  platina: 'Platina',
  diamante: 'Diamante'
});

const ALIASES_NIVEIS = Object.freeze({
  bronze: 'bronze',
  'nivel-1': 'bronze',
  'nível-1': 'bronze',
  1: 'bronze',
  prata: 'prata',
  silver: 'prata',
  'nivel-2': 'prata',
  'nível-2': 'prata',
  2: 'prata',
  ouro: 'ouro',
  gold: 'ouro',
  'nivel-3': 'ouro',
  'nível-3': 'ouro',
  3: 'ouro',
  platina: 'platina',
  platinum: 'platina',
  'nivel-4': 'platina',
  'nível-4': 'platina',
  4: 'platina',
  diamante: 'diamante',
  diamond: 'diamante',
  'nivel-5': 'diamante',
  'nível-5': 'diamante',
  5: 'diamante'
});

function obterValorNivel(nivel) {
  if (nivel && typeof nivel === 'object') {
    return nivel.nome ?? nivel.nivel ?? nivel.chave ?? nivel.id ?? '';
  }

  return nivel;
}

export function normalizarNivelGamificacao(nivel) {
  const valor = obterValorNivel(nivel);
  const chave = String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return ALIASES_NIVEIS[chave] || NIVEL_FALLBACK;
}

export function obterNomeNivelGamificacao(nivel) {
  const chave = normalizarNivelGamificacao(nivel);
  return NOMES_NIVEIS[chave] || NOMES_NIVEIS[NIVEL_FALLBACK];
}

export function getMedalhaPorNivel(nivel) {
  const chave = normalizarNivelGamificacao(nivel);
  return medalhasGamificacao[chave] || medalhasGamificacao[NIVEL_FALLBACK];
}

export function getBadgePorNivel(nivel) {
  const chave = normalizarNivelGamificacao(nivel);
  return badgesGamificacao[chave] || badgesGamificacao[NIVEL_FALLBACK];
}
