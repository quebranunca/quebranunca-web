import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PaginaPrivacidade } from './PaginaPrivacidade';

describe('PaginaPrivacidade', () => {
  it('publica a versão vigente, o contato e os direitos essenciais', () => {
    render(<PaginaPrivacidade />);

    expect(screen.getByRole('heading', { name: 'Política de Privacidade' })).toBeInTheDocument();
    expect(screen.getByText(/Versão de 31 de julho de 2026/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'contato@quebranunca.com.br' })).toHaveAttribute(
      'href',
      'mailto:contato@quebranunca.com.br'
    );
    expect(screen.getByRole('heading', { name: 'Compartilhamento e fornecedores' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Seus direitos' })).toBeInTheDocument();
    expect(screen.getByText(/revisão de decisões automatizadas/i)).toBeInTheDocument();
  });
});
