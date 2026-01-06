/**
 * Utilitários de Performance
 * Debounce, throttle, memoization e otimização de re-renders
 */

/**
 * Debounce: Atrasa a execução até que pare de chamar
 * Útil para: inputs de busca, scroll handlers
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

/**
 * Throttle: Limita execuções a uma vez por período
 * Útil para: scroll events, resize handlers
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * RequestAnimationFrame throttle
 * Otimizado para animações e scroll
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      func.apply(this, args);
      rafId = null;
    });
  };
}

/**
 * Lazy load de imagem
 * Carrega imagens apenas quando visíveis no viewport
 */
export function lazyLoadImage(
  imgElement: HTMLImageElement,
  options?: IntersectionObserverInit
): () => void {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  }, options);

  imageObserver.observe(imgElement);

  // Retornar cleanup function
  return () => imageObserver.unobserve(imgElement);
}

/**
 * Cache simples em memória com TTL
 */
export class MemoryCache<T = any> {
  private cache = new Map<string, { value: T; expiry: number }>();

  set(key: string, value: T, ttl: number = 60000): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

/**
 * Preload de recursos críticos
 */
export function preloadResource(href: string, as: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Verificar se o dispositivo tem conexão lenta
 */
export function isSlowConnection(): boolean {
  const connection = (navigator as any).connection;
  if (!connection) return false;

  // 2G ou conexão lenta
  return (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.saveData === true
  );
}

/**
 * Verificar se o dispositivo tem memória limitada
 */
export function isLowEndDevice(): boolean {
  const memory = (performance as any).memory;
  if (!memory) return false;

  // Menos de 4GB de RAM
  const deviceMemory = (navigator as any).deviceMemory;
  return deviceMemory && deviceMemory < 4;
}

/**
 * Batch de atualizações para reduzir re-renders
 */
export function batchUpdates<T>(
  updates: Array<() => T>,
  delay: number = 16
): Promise<T[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const results = updates.map((update) => update());
      resolve(results);
    }, delay);
  });
}

/**
 * Deep comparison para evitar re-renders desnecessários
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 === null ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * Limitar tamanho de array mantendo os mais recentes
 */
export function limitArraySize<T>(array: T[], maxSize: number): T[] {
  if (array.length <= maxSize) return array;
  return array.slice(-maxSize);
}

/**
 * Web Worker para processamento pesado
 */
export function runInWorker<T>(
  workerFunc: () => T
): Promise<T> {
  return new Promise((resolve, reject) => {
    const blob = new Blob(
      [`self.onmessage = function() { self.postMessage((${workerFunc.toString()})()); }`],
      { type: 'application/javascript' }
    );
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };

    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };

    worker.postMessage(null);
  });
}

/**
 * Verificar visibilidade da página
 */
export function onPageVisible(callback: () => void): () => void {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      callback();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Cleanup
  return () =>
    document.removeEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * Idle callback para tarefas de baixa prioridade
 */
export function runWhenIdle(
  callback: () => void,
  options?: IdleRequestOptions
): number {
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(callback, options);
  } else {
    // Fallback para navegadores que não suportam
    return setTimeout(callback, 1) as unknown as number;
  }
}

export function cancelIdle(id: number): void {
  if ('cancelIdleCallback' in window) {
    cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}
