/**
 * 🚦 Rate Limiter - Controle de Frequência de Ações
 * Previne cliques múltiplos acidentais em botões críticos
 */

interface RateLimitConfig {
  key: string; // Identificador único da ação
  limitMs: number; // Intervalo mínimo entre ações (ms)
}

// Armazena última execução de cada ação
const lastExecutionTime = new Map<string, number>();

/**
 * Verifica se uma ação pode ser executada (rate limiting)
 * @param config Configuração do rate limit
 * @returns { allowed: boolean, remainingMs: number }
 */
export function checkRateLimit(config: RateLimitConfig): {
  allowed: boolean;
  remainingMs: number;
} {
  const now = Date.now();
  const lastTime = lastExecutionTime.get(config.key) || 0;
  const timeSinceLastExecution = now - lastTime;

  if (timeSinceLastExecution >= config.limitMs) {
    // Permitido, atualizar timestamp
    lastExecutionTime.set(config.key, now);
    return { allowed: true, remainingMs: 0 };
  }

  // Bloqueado, retornar tempo restante
  const remainingMs = config.limitMs - timeSinceLastExecution;
  return { allowed: false, remainingMs };
}

/**
 * Hook React para rate limiting
 */
export function useRateLimit(key: string, limitMs: number) {
  return (callback: () => void | Promise<void>) => {
    const { allowed, remainingMs } = checkRateLimit({ key, limitMs });

    if (!allowed) {
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      return {
        success: false,
        message: `Aguarde ${remainingSeconds}s para executar esta ação novamente`,
        remainingMs,
      };
    }

    callback();
    return { success: true };
  };
}

/**
 * Limpa histórico de rate limiting (útil para testes)
 */
export function clearRateLimitHistory(key?: string) {
  if (key) {
    lastExecutionTime.delete(key);
  } else {
    lastExecutionTime.clear();
  }
}
