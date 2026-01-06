/**
 * VirtualList - Lista virtualizada para performance
 * Renderiza apenas itens visíveis no viewport
 * Ideal para listas com centenas/milhares de itens
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { rafThrottle } from '../utils/performance';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number; // Quantos itens extras renderizar fora do viewport
  className?: string;
  emptyMessage?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
  emptyMessage = 'Nenhum item encontrado',
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calcular quais itens devem ser renderizados
  const visibleRange = useCallback(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);

    // Adicionar overscan
    const start = Math.max(0, startIndex - overscan);
    const end = Math.min(items.length, endIndex + overscan);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const { start, end } = visibleRange();

  // Handler de scroll otimizado com RAF
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = rafThrottle(() => {
      setScrollTop(container.scrollTop);
    });

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Altura total da lista
  const totalHeight = items.length * itemHeight;

  // Offset do primeiro item visível
  const offsetY = start * itemHeight;

  // Items visíveis
  const visibleItems = items.slice(start, end);

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: containerHeight }}>
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={start + index} style={{ height: itemHeight }}>
              {renderItem(item, start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * VirtualGrid - Grid virtualizado
 * Similar ao VirtualList mas para layouts em grade
 */

interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  gap?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  gap = 16,
  renderItem,
  className = '',
  emptyMessage = 'Nenhum item encontrado',
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calcular quantas colunas cabem
  const columnsCount = Math.floor((containerWidth + gap) / (itemWidth + gap));

  // Calcular quais linhas devem ser renderizadas
  const visibleRange = useCallback(() => {
    const rowHeight = itemHeight + gap;
    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = Math.ceil((scrollTop + containerHeight) / rowHeight);

    const start = Math.max(0, startRow - 2);
    const end = Math.min(Math.ceil(items.length / columnsCount), endRow + 2);

    return { start, end };
  }, [scrollTop, itemHeight, gap, containerHeight, items.length, columnsCount]);

  const { start, end } = visibleRange();

  // Handler de scroll otimizado
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = rafThrottle(() => {
      setScrollTop(container.scrollTop);
    });

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Altura total da grade
  const totalRows = Math.ceil(items.length / columnsCount);
  const totalHeight = totalRows * (itemHeight + gap);

  // Offset da primeira linha visível
  const offsetY = start * (itemHeight + gap);

  // Items visíveis
  const startIndex = start * columnsCount;
  const endIndex = end * columnsCount;
  const visibleItems = items.slice(startIndex, endIndex);

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: containerHeight }}>
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            display: 'grid',
            gridTemplateColumns: `repeat(${columnsCount}, ${itemWidth}px)`,
            gap: `${gap}px`,
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={startIndex + index}>{renderItem(item, startIndex + index)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtualList;
