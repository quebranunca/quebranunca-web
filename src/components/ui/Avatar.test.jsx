import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Avatar, obterLetraAvatar } from './Avatar';

afterEach(() => {
  cleanup();
});

describe('Avatar', () => {
  it.each([
    ['Gustavo Drager', 'G'],
    ['  Bruno Santos', 'B'],
    ['  ⚽ Geral', 'G'],
    ['Long Beach Arena', 'L'],
    ['QuebraNunca', 'Q'],
    ['', 'Q'],
    [null, 'Q'],
    [undefined, 'Q']
  ])('calcula fallback de uma letra para %s', (nome, esperado) => {
    expect(obterLetraAvatar(nome)).toBe(esperado);
  });

  it('renderiza imagem quando src é válido', () => {
    render(<Avatar name="Gustavo Drager" src="https://cdn.quebranunca.test/foto.jpg" />);

    expect(screen.getByAltText('Gustavo Drager')).toHaveAttribute(
      'src',
      'https://cdn.quebranunca.test/foto.jpg'
    );
    expect(screen.queryByText('G')).not.toBeInTheDocument();
  });

  it('usa fallback de uma letra quando não há src', () => {
    render(<Avatar name="Gustavo Drager" />);

    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('troca para fallback de uma letra quando a imagem dá erro', () => {
    render(<Avatar name="Gustavo Drager" src="https://cdn.quebranunca.test/quebrada.jpg" />);

    fireEvent.error(screen.getByAltText('Gustavo Drager'));

    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('nunca renderiza duas letras no fallback', () => {
    render(<Avatar name="Gustavo Drager" />);

    expect(screen.getByText('G')).toHaveTextContent(/^.$/u);
    expect(screen.queryByText('GD')).not.toBeInTheDocument();
  });

  it('aplica classe de tamanho corretamente', () => {
    const { container } = render(<Avatar name="Gustavo Drager" size="lg" />);

    expect(container.firstChild).toHaveClass('avatar--lg');
  });

  it('não quebra com props ausentes', () => {
    render(<Avatar />);

    expect(screen.getByText('Q')).toBeInTheDocument();
  });
});
