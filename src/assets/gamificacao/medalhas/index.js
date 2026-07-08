import bronze from './bronze.png';
import prata from './prata.png';
import ouro from './ouro.png';
import platina from './platina.png';
import diamante from './diamante.png';
import bronzeBadge from './badges/bronze-badge.png';
import prataBadge from './badges/prata-badge.png';
import ouroBadge from './badges/ouro-badge.png';
import platinaBadge from './badges/platina-badge.png';
import diamanteBadge from './badges/diamante-badge.png';

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
