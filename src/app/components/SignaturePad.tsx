import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
} from 'react';

/**
 * Captura de assinatura baseada em <canvas> nativo.
 *
 * Substitui a dependência alpha `react-signature-canvas@1.1.0-alpha.2`,
 * mantendo a mesma API imperativa usada pela aplicação:
 *   - isEmpty(): boolean
 *   - toDataURL(): string  (PNG, fundo transparente — assinatura compacta)
 *   - clear(): void
 *
 * O backing store do canvas é dimensionado conforme o tamanho exibido e o
 * devicePixelRatio, para traços nítidos e coordenadas corretas.
 */
export interface SignaturePadHandle {
  isEmpty: () => boolean;
  toDataURL: (type?: string) => string;
  clear: () => void;
}

interface SignaturePadProps {
  canvasProps?: {
    className?: string;
  };
  penColor?: string;
  penWidth?: number;
}

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ canvasProps, penColor = '#111827', penWidth = 2 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const drawingRef = useRef(false);
    const emptyRef = useRef(true);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    const getCtx = () => canvasRef.current?.getContext('2d') || null;

    // Dimensiona o backing store ao tamanho exibido (preserva traços já feitos
    // só quando o tamanho não muda — mudança de tamanho limpa, como na lib original).
    const setupCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);
      if (canvas.width === targetW && canvas.height === targetH) return;
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth;
      }
    }, [penColor, penWidth]);

    useEffect(() => {
      setupCanvas();
      const handleResize = () => setupCanvas();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [setupCanvas]);

    const pointFromEvent = (e: PointerEvent | React.PointerEvent) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e as PointerEvent).clientX - rect.left,
        y: (e as PointerEvent).clientY - rect.top,
      };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setupCanvas();
      canvas.setPointerCapture?.(e.pointerId);
      drawingRef.current = true;
      lastPointRef.current = pointFromEvent(e);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      const ctx = getCtx();
      const last = lastPointRef.current;
      if (!ctx || !last) return;
      const p = pointFromEvent(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastPointRef.current = p;
      emptyRef.current = false;
    };

    const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      lastPointRef.current = null;
      canvasRef.current?.releasePointerCapture?.(e.pointerId);
    };

    useImperativeHandle(
      ref,
      () => ({
        isEmpty: () => emptyRef.current,
        toDataURL: (type = 'image/png') => canvasRef.current?.toDataURL(type) || '',
        clear: () => {
          const canvas = canvasRef.current;
          const ctx = getCtx();
          if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          emptyRef.current = true;
          drawingRef.current = false;
          lastPointRef.current = null;
        },
      }),
      []
    );

    return (
      <canvas
        ref={canvasRef}
        className={canvasProps?.className}
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
        onPointerCancel={endStroke}
      />
    );
  }
);

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
