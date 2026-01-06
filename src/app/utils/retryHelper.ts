/**
 * Utility para retry de operações assíncronas
 * Útil para requisições de rede que podem falhar temporariamente
 */

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Executa uma função assíncrona com retry automático
 * @param fn Função a ser executada
 * @param options Opções de configuração do retry
 * @returns Resultado da função ou throw do último erro
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    exponentialBackoff = true,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Se foi a última tentativa, lançar o erro
      if (attempt === maxAttempts) {
        break;
      }

      // Calcular delay com backoff exponencial se habilitado
      const currentDelay = exponentialBackoff
        ? delayMs * Math.pow(2, attempt - 1)
        : delayMs;

      // Callback de retry
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }

  throw lastError;
}

/**
 * Verifica se um erro é temporário e pode ser retentado
 * @param error Erro a ser verificado
 * @returns true se o erro é temporário
 */
export function isRetryableError(error: any): boolean {
  // Erros de rede
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return true;
  }

  // Timeout
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return true;
  }

  // HTTP 5xx (server errors)
  if (error.status >= 500 && error.status < 600) {
    return true;
  }

  // HTTP 429 (rate limit)
  if (error.status === 429) {
    return true;
  }

  // Offline
  if (!navigator.onLine) {
    return true;
  }

  return false;
}

/**
 * Wrapper para fetch com retry automático
 * @param url URL para fazer requisição
 * @param options Opções de fetch + retry
 * @returns Response ou throw
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & RetryOptions = {}
): Promise<Response> {
  const { maxAttempts, delayMs, exponentialBackoff, onRetry, ...fetchOptions } = options;

  return withRetry(
    async () => {
      const response = await fetch(url, fetchOptions);

      // Se o erro não for retryable, lançar imediatamente
      if (!response.ok && !isRetryableError({ status: response.status })) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    },
    { maxAttempts, delayMs, exponentialBackoff, onRetry }
  );
}
