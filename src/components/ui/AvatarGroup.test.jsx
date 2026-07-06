import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AvatarGroup } from './AvatarGroup';

afterEach(() => {
  cleanup();
});

describe('AvatarGroup', () => {
  it('renderiza dois avatares', () => {
    render(
      <AvatarGroup
        avatars={[
          { name: 'Gustavo Drager' },
          { name: 'Bruno Santos' }
        ]}
      />
    );

    expect(screen.getByText('G')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renderiza um avatar quando vier apenas um item', () => {
    render(<AvatarGroup avatars={[{ name: 'Gustavo Drager' }]} />);

    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('não quebra com lista vazia', () => {
    render(<AvatarGroup avatars={[]} />);

    expect(screen.getByText('Q')).toBeInTheDocument();
  });

  it('não quebra com null ou undefined', () => {
    const { rerender } = render(<AvatarGroup avatars={null} />);

    expect(screen.getByText('Q')).toBeInTheDocument();

    rerender(<AvatarGroup avatars={undefined} />);

    expect(screen.getByText('Q')).toBeInTheDocument();
  });

  it('usa Avatar internamente com fallback de uma letra', () => {
    const { container } = render(
      <AvatarGroup
        avatars={[
          { name: 'Long Beach Arena' },
          { name: 'Bruno Santos' }
        ]}
      />
    );

    expect(container.querySelectorAll('.avatar')).toHaveLength(2);
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByText('LB')).not.toBeInTheDocument();
  });
});
