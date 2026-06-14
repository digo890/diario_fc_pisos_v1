/**
 * Badge de status: ponto colorido (SVG) + rótulo.
 *
 * Extraído do AdminDashboard para isolar a lógica de cor, que era ~60 linhas
 * de ternários inline. A cor é derivada da string `color` do status (ex.:
 * "...text-blue-700..."). As classes Tailwind são LITERAIS de propósito — o
 * JIT do Tailwind precisa vê-las inteiras (não funciona montar dinamicamente).
 */

type ColorName = 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'gray';

const DOT: Record<ColorName, { fill: string; stroke: string; text: string }> = {
  blue: { fill: 'fill-blue-600', stroke: 'stroke-blue-600', text: 'text-blue-600' },
  green: { fill: 'fill-green-600', stroke: 'stroke-green-600', text: 'text-green-600' },
  yellow: { fill: 'fill-yellow-600', stroke: 'stroke-yellow-600', text: 'text-yellow-600' },
  purple: { fill: 'fill-purple-600', stroke: 'stroke-purple-600', text: 'text-purple-600' },
  orange: { fill: 'fill-orange-600', stroke: 'stroke-orange-600', text: 'text-orange-600' },
  // Padrão (mantém o comportamento original: ponto gray-400, texto gray-600).
  gray: { fill: 'fill-gray-400', stroke: 'stroke-gray-400', text: 'text-gray-600' },
};

// Ordem preservada do encadeamento de ternários original.
const ORDER: ColorName[] = ['blue', 'green', 'yellow', 'purple', 'orange'];

export function resolveStatusColor(color: string): ColorName {
  return ORDER.find((c) => color.includes(c)) ?? 'gray';
}

interface StatusBadgeProps {
  /** String de cor do status (ex.: retorno de getStatusDisplay*). */
  color: string;
  label: string;
}

export default function StatusBadge({ color, label }: StatusBadgeProps) {
  const c = DOT[resolveStatusColor(color)];
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-2.5 h-2.5">
        <svg className="absolute inset-0" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="5" className={c.fill} />
          <circle
            cx="9"
            cy="9"
            r="7"
            className={c.stroke}
            strokeOpacity="0.24"
            strokeWidth="4"
          />
        </svg>
      </div>
      <span className={`font-medium text-base leading-normal ${c.text}`}>{label}</span>
    </div>
  );
}
