import { useEffect, useMemo, useState } from 'react';
import {
  getBadgePorNivel,
  getMedalhaPorNivel,
  obterNomeNivelGamificacao
} from '../../utils/gamificacaoMedalhas';
import './MedalhaNivel.css';

const TAMANHOS_SUPORTADOS = new Set(['sm', 'md', 'lg']);
const VARIANTES_SUPORTADAS = new Set(['medalha', 'badge']);

export function MedalhaNivel({
  nivel,
  variant = 'medalha',
  size = 'md',
  className = ''
}) {
  const varianteNormalizada = VARIANTES_SUPORTADAS.has(variant) ? variant : 'medalha';
  const tamanhoNormalizado = TAMANHOS_SUPORTADOS.has(size) ? size : 'md';
  const [falhaImagem, setFalhaImagem] = useState(false);
  const nomeNivel = obterNomeNivelGamificacao(nivel);
  const src = useMemo(
    () => varianteNormalizada === 'badge' ? getBadgePorNivel(nivel) : getMedalhaPorNivel(nivel),
    [nivel, varianteNormalizada]
  );
  const textoAlternativo = varianteNormalizada === 'badge'
    ? `Badge nível ${nomeNivel}`
    : `Medalha nível ${nomeNivel}`;
  const classes = [
    'medalha-nivel',
    `medalha-nivel-${varianteNormalizada}`,
    `medalha-nivel-${tamanhoNormalizado}`,
    className
  ].filter(Boolean).join(' ');

  useEffect(() => {
    setFalhaImagem(false);
  }, [src]);

  return (
    <span className={classes}>
      {!src || falhaImagem ? (
        <span className="medalha-nivel-fallback" role="img" aria-label={textoAlternativo}>
          {nomeNivel.charAt(0)}
        </span>
      ) : (
        <img
          src={src}
          alt={textoAlternativo}
          loading="lazy"
          decoding="async"
          onError={() => setFalhaImagem(true)}
        />
      )}
    </span>
  );
}
