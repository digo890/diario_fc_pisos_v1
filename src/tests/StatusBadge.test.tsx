import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import StatusBadge, { resolveStatusColor } from '../app/components/StatusBadge';

describe('resolveStatusColor', () => {
  it('detecta a cor presente na string de status', () => {
    expect(resolveStatusColor('bg-blue-100 text-blue-700')).toBe('blue');
    expect(resolveStatusColor('bg-green-100 text-green-700')).toBe('green');
    expect(resolveStatusColor('bg-yellow-100 text-yellow-700')).toBe('yellow');
    expect(resolveStatusColor('bg-purple-100 text-purple-700')).toBe('purple');
    expect(resolveStatusColor('bg-orange-100 text-orange-700')).toBe('orange');
  });

  it('usa "gray" como padrão quando nenhuma cor conhecida aparece', () => {
    expect(resolveStatusColor('bg-slate-100 text-slate-700')).toBe('gray');
    expect(resolveStatusColor('')).toBe('gray');
  });
});

describe('StatusBadge', () => {
  it('renderiza o rótulo', () => {
    const { container } = render(<StatusBadge color="text-blue-700" label="Em andamento" />);
    expect(container.textContent).toContain('Em andamento');
  });

  it('aplica a classe de texto da cor detectada', () => {
    const { container } = render(<StatusBadge color="text-green-700" label="Concluída" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('text-green-600');
  });
});
