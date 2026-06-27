import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AvatarUsuario, obterIniciaisAvatar } from './AvatarUsuario';

afterEach(() => {
  cleanup();
});

describe('AvatarUsuario', () => {
  it.each([
    ['Gustavo Drager', 'GD'],
    ['Vanessa', 'V'],
    ['Álvaro Núñez', 'ÁN'],
    ['Maria de Souza', 'MS'],
    ['', 'QN'],
    [null, 'QN']
  ])('gera iniciais estáveis para %s', (nome, esperado) => {
    expect(obterIniciaisAvatar(nome)).toBe(esperado);
  });

  it('exibe foto quando fotoPerfilUrl é válido', () => {
    render(<AvatarUsuario nome="Gustavo Drager" fotoPerfilUrl="https://cdn.quebranunca.test/foto.jpg" />);

    expect(screen.getByAltText('Foto de Gustavo Drager')).toHaveAttribute(
      'src',
      'https://cdn.quebranunca.test/foto.jpg'
    );
    expect(screen.queryByText('GD')).not.toBeInTheDocument();
  });

  it('exibe iniciais quando não há foto', () => {
    render(<AvatarUsuario nome="Gustavo Drager" />);

    expect(screen.getByText('GD')).toBeInTheDocument();
  });

  it('exibe fallback padrão quando não há nome válido', () => {
    render(<AvatarUsuario nome="  " />);

    expect(screen.getByText('QN')).toBeInTheDocument();
  });

  it('volta para iniciais quando a foto falha ao carregar', () => {
    render(<AvatarUsuario nome="Gustavo Drager" fotoPerfilUrl="https://cdn.quebranunca.test/quebrada.jpg" />);

    fireEvent.error(screen.getByAltText('Foto de Gustavo Drager'));

    expect(screen.getByText('GD')).toBeInTheDocument();
  });
});
