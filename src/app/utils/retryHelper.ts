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
  onRetry?: (attempt: number, error: any) => void,
  // Predicado opcional: retorne `false` para abortar imediatamente (erro
  // permanente, ex.: validação 4xx ou usuário não autenticado), evitando
  // retentativas inúteis e o risco de efeitos colaterais duplicados.
  shouldRetry?: (error: any) => boolean
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Se for o último attempt ou o erro não for transitório, lançar o erro
      if (attempt === maxAttempts || (shouldRetry && !shouldRetry(error))) {
        throw error;
      }

      // Calcular delay (com ou sem backoff exponencial)
      const delay = exponentialBackoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;

      if (onRetry) {
        onRetry(attempt, error);
      }

      // Aguardar antes de tentar novamente
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Retry failed');
}
