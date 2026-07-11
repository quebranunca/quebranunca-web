import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MedalhaNivel } from './MedalhaNivel';

afterEach(() => {
  cleanup();
});

describe('MedalhaNivel', () => {
  it('renderiza a medalha do nivel com alt acessivel', () => {
    render(<MedalhaNivel nivel="Ouro" size="lg" />);

    const imagem = screen.getByRole('img', { name: 'Medalha nível Ouro' });

    expect(imagem).toBeInTheDocument();
    expect(imagem).toHaveAttribute('loading', 'lazy');
  });

  it('renderiza badge e aplica fallback Bronze para nivel ausente', () => {
    render(<MedalhaNivel nivel="" variant="badge" size="sm" />);

    expect(screen.getByRole('img', { name: 'Badge nível Bronze' })).toBeInTheDocument();
  });

  it('mantem fallback visual quando a imagem falha', () => {
    render(<MedalhaNivel nivel="Platina" />);

    fireEvent.error(screen.getByRole('img', { name: 'Medalha nível Platina' }));

    expect(screen.getByRole('img', { name: 'Medalha nível Platina' })).toHaveTextContent('P');
  });

  it('renderiza fallback acessivel para Lenda QN quando nao ha asset final', () => {
    render(<MedalhaNivel nivel="Lenda QN" />);

    expect(screen.getByRole('img', { name: 'Medalha nível Lenda QN' })).toHaveTextContent('L');
  });
});
