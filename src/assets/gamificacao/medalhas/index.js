import bronze from './bronze.webp';
import prata from './prata.webp';
import ouro from './ouro.webp';
import platina from './platina.webp';
import diamante from './diamante.webp';
import bronzeBadge from './badges/bronze-badge.webp';
import prataBadge from './badges/prata-badge.webp';
import ouroBadge from './badges/ouro-badge.webp';
import platinaBadge from './badges/platina-badge.webp';
import diamanteBadge from './badges/diamante-badge.webp';

// TODO: substituir os placeholders PNG pelas artes finais aprovadas, mantendo estes nomes.
export {
  bronze,
  prata,
  ouro,
  platina,
  diamante,
  bronzeBadge,
  prataBadge,
  ouroBadge,
  platinaBadge,
  diamanteBadge
};

export const medalhasGamificacao = Object.freeze({
  bronze,
  prata,
  ouro,
  platina,
  diamante
});

export const badgesGamificacao = Object.freeze({
  bronze: bronzeBadge,
  prata: prataBadge,
  ouro: ouroBadge,
  platina: platinaBadge,
  diamante: diamanteBadge
});
