import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { render } from '@testing-library/react';
import SignaturePad, { type SignaturePadHandle } from '../app/components/SignaturePad';

describe('SignaturePad (substituto do react-signature-canvas)', () => {
  it('expõe a API imperativa esperada (isEmpty, clear, toDataURL)', () => {
    const ref = createRef<SignaturePadHandle>();
    render(<SignaturePad ref={ref} />);
    expect(typeof ref.current?.isEmpty).toBe('function');
    expect(typeof ref.current?.clear).toBe('function');
    expect(typeof ref.current?.toDataURL).toBe('function');
  });

  it('começa vazio', () => {
    const ref = createRef<SignaturePadHandle>();
    render(<SignaturePad ref={ref} />);
    expect(ref.current?.isEmpty()).toBe(true);
  });

  it('clear() não lança e mantém o estado vazio', () => {
    const ref = createRef<SignaturePadHandle>();
    render(<SignaturePad ref={ref} />);
    expect(() => ref.current?.clear()).not.toThrow();
    expect(ref.current?.isEmpty()).toBe(true);
  });

  it('renderiza um elemento <canvas> com a className fornecida', () => {
    const { container } = render(
      <SignaturePad canvasProps={{ className: 'w-full h-48 bg-white' }} />
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas?.className).toContain('w-full');
  });
});
