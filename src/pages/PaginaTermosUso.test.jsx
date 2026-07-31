import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PaginaTermosUso } from './PaginaTermosUso';

describe('PaginaTermosUso', () => {
  it('publica a versão vigente e as regras essenciais de uso', () => {
    render(<PaginaTermosUso />);

    expect(screen.getByRole('heading', { name: 'Termos de Uso' })).toBeInTheDocument();
    expect(screen.getByText(/Versão de 18 de maio de 2026/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Resultados e conteúdo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Privacidade e contato' })).toBeInTheDocument();
  });
});
