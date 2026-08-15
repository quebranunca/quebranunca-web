const NIVEL_FALLBACK = 'bronze';

const NOMES_NIVEIS = Object.freeze({
  bronze: 'Bronze',
  prata: 'Prata',
  ouro: 'Ouro',
  platina: 'Platina',
  diamante: 'Diamante',
  lenda: 'Lenda QN'
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
  5: 'diamante',
  lenda: 'lenda',
  'lenda-qn': 'lenda',
  legend: 'lenda',
  'nivel-6': 'lenda',
  'nível-6': 'lenda',
  6: 'lenda'
});

const medalhasGamificacaoLoaders = Object.freeze({
  bronze: () => import('../assets/gamificacao/medalhas/bronze.webp'),
  prata: () => import('../assets/gamificacao/medalhas/prata.webp'),
  ouro: () => import('../assets/gamificacao/medalhas/ouro.webp'),
  platina: () => import('../assets/gamificacao/medalhas/platina.webp'),
  diamante: () => import('../assets/gamificacao/medalhas/diamante.webp')
});

const badgesGamificacaoLoaders = Object.freeze({
  bronze: () => import('../assets/gamificacao/medalhas/badges/bronze-badge.webp'),
  prata: () => import('../assets/gamificacao/medalhas/badges/prata-badge.webp'),
  ouro: () => import('../assets/gamificacao/medalhas/badges/ouro-badge.webp'),
  platina: () => import('../assets/gamificacao/medalhas/badges/platina-badge.webp'),
  diamante: () => import('../assets/gamificacao/medalhas/badges/diamante-badge.webp')
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

function obterLoaderSeguro(loaders, chave) {
  return loaders[chave] || (chave === NIVEL_FALLBACK ? loaders[NIVEL_FALLBACK] : null);
}

async function carregarAsset(loader) {
  if (!loader) {
    return null;
  }

  const modulo = await loader();
  return modulo?.default || null;
}

export function getMedalhaLoaderPorNivel(nivel) {
  const chave = normalizarNivelGamificacao(nivel);
  return obterLoaderSeguro(medalhasGamificacaoLoaders, chave);
}

export function getBadgeLoaderPorNivel(nivel) {
  const chave = normalizarNivelGamificacao(nivel);
  return obterLoaderSeguro(badgesGamificacaoLoaders, chave);
}

export async function getMedalhaPorNivel(nivel) {
  return carregarAsset(getMedalhaLoaderPorNivel(nivel));
}

export async function getBadgePorNivel(nivel) {
  return carregarAsset(getBadgeLoaderPorNivel(nivel));
}
