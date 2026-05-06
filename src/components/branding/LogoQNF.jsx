import { useState } from 'react';

const LOGOS = {
  light: {
    svg: '/branding/logo-qnf-light.svg',
    png: '/branding/logo-qnf-light.png'
  },
  dark: {
    svg: '/branding/logo-qnf-dark.svg',
    png: '/branding/logo-qnf-dark.png'
  }
};

export function LogoQNF({ variante = 'light', className = '', textoAlternativo = 'QuebraNunca Futevôlei' }) {
  const [formato, setFormato] = useState('svg');
  const logo = LOGOS[variante] || LOGOS.light;
  const src = formato === 'svg' ? logo.svg : logo.png;

  if (!src) {
    return (
      <span className={`logo-qnf logo-qnf-fallback ${className}`.trim()} aria-label={textoAlternativo}>
        QN
      </span>
    );
  }

  return (
    <img
      className={`logo-qnf ${className}`.trim()}
      src={src}
      alt={textoAlternativo}
      onError={() => setFormato((atual) => (atual === 'svg' ? 'png' : ''))}
    />
  );
}
