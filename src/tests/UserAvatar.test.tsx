import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import UserAvatar, { getAvatarColor } from '../app/components/UserAvatar';

describe('UserAvatar', () => {
  it('getAvatarColor é determinístico para o mesmo id', () => {
    expect(getAvatarColor('user-123')).toBe(getAvatarColor('user-123'));
  });

  it('getAvatarColor retorna uma classe de cor válida da paleta', () => {
    const cor = getAvatarColor('abc');
    expect(cor.startsWith('bg-')).toBe(true);
  });

  it('renderiza a inicial do nome em maiúscula', () => {
    const { container } = render(<UserAvatar userId="u1" nome="ana" />);
    expect(container.textContent).toBe('A');
  });

  it('aplica a cor determinística no markup', () => {
    const { container } = render(<UserAvatar userId="u1" nome="Beto" />);
    const div = container.querySelector('div');
    expect(div?.className).toContain(getAvatarColor('u1'));
  });
});
