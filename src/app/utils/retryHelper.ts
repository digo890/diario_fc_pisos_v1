/**
 * 🔄 Helper para retry automático com backoff exponencial
 */

/**
 * Executa uma função com retry automático
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000,
  exponentialBackoff: boolean = true,
  onRetry?: (attempt: number, error: any) => void
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Se for o último attempt, lançar o erro
      if (attempt === maxAttempts) {
        throw error;
      }

      // Calcular delay (com ou sem backoff exponencial)
      const delay = exponentialBackoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;

      if (onRetry) {
        onRetry(attempt, error);
      }

      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Retry failed');
}