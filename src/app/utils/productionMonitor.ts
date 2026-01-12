/**
 * 🚨 PRODUCTION MONITORING SYSTEM
 * Captura e reporta erros críticos que só acontecem em produção
 * 
 * PROBLEMAS DETECTADOS:
 * - Edge Functions failures (500, timeout, auth)
 * - JWT/Auth errors (invalid token, expired, missing)
 * - RLS policy violations (permission denied)
 * - Query failures (syntax, data type, constraint)
 * - Missing secrets (env vars undefined)
 * - Network issues (offline, CORS, DNS)
 */

import { safeError, safeWarn, safeInfo } from './logSanitizer';

// ============================================
// TIPOS DE ERRO
// ============================================

export enum ErrorCategory {
  EDGE_FUNCTION = 'EDGE_FUNCTION',
  AUTH = 'AUTH',
  RLS = 'RLS',
  QUERY = 'QUERY',
  SECRET = 'SECRET',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN'
}

export interface ProductionError {
  category: ErrorCategory;
  timestamp: number;
  message: string;
  stack?: string;
  context?: {
    url?: string;
    method?: string;
    statusCode?: number;
    userId?: string;
    obraId?: string;
    // Dados adicionais específicos do erro
    [key: string]: any;
  };
}

// ============================================
// ARMAZENAMENTO LOCAL DE ERROS
// ============================================

const ERROR_STORAGE_KEY = 'production_errors';
const MAX_ERRORS_STORED = 50;

/**
 * Armazena erro no localStorage para análise posterior
 */
function storeError(error: ProductionError): void {
  try {
    const stored = localStorage.getItem(ERROR_STORAGE_KEY);
    const errors: ProductionError[] = stored ? JSON.parse(stored) : [];
    
    // Adicionar novo erro no início
    errors.unshift(error);
    
    // Limitar ao máximo de erros
    const trimmed = errors.slice(0, MAX_ERRORS_STORED);
    
    localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // Se localStorage falhar, apenas logar
    console.error('❌ Falha ao armazenar erro:', e);
  }
}

/**
 * Recupera todos os erros armazenados
 */
export function getStoredErrors(): ProductionError[] {
  try {
    const stored = localStorage.getItem(ERROR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('❌ Falha ao recuperar erros:', e);
    return [];
  }
}

/**
 * Limpa erros armazenados
 */
export function clearStoredErrors(): void {
  try {
    localStorage.removeItem(ERROR_STORAGE_KEY);
  } catch (e) {
    console.error('❌ Falha ao limpar erros:', e);
  }
}

// ============================================
// DETECÇÃO INTELIGENTE DE CATEGORIA
// ============================================

/**
 * Classifica erro baseado na mensagem e contexto
 */
function categorizeError(error: any, context?: any): ErrorCategory {
  const errorMsg = (error?.message || String(error)).toLowerCase();
  
  // 1. EDGE FUNCTION ERRORS
  if (
    errorMsg.includes('edge function') ||
    errorMsg.includes('function invocation') ||
    errorMsg.includes('deno') ||
    errorMsg.includes('serverless') ||
    (context?.statusCode && context.statusCode >= 500) ||
    errorMsg.includes('timeout') ||
    errorMsg.includes('function error')
  ) {
    return ErrorCategory.EDGE_FUNCTION;
  }
  
  // 2. AUTH ERRORS
  if (
    errorMsg.includes('jwt') ||
    errorMsg.includes('token') ||
    errorMsg.includes('unauthorized') ||
    errorMsg.includes('authentication') ||
    errorMsg.includes('invalid credentials') ||
    errorMsg.includes('session') ||
    errorMsg.includes('login') ||
    errorMsg.includes('access denied') ||
    (context?.statusCode === 401)
  ) {
    return ErrorCategory.AUTH;
  }
  
  // 3. RLS ERRORS
  if (
    errorMsg.includes('rls') ||
    errorMsg.includes('row level security') ||
    errorMsg.includes('policy') ||
    errorMsg.includes('permission denied') ||
    errorMsg.includes('insufficient privileges') ||
    (context?.statusCode === 403)
  ) {
    return ErrorCategory.RLS;
  }
  
  // 4. QUERY ERRORS
  if (
    errorMsg.includes('query') ||
    errorMsg.includes('sql') ||
    errorMsg.includes('syntax error') ||
    errorMsg.includes('column') ||
    errorMsg.includes('relation') ||
    errorMsg.includes('constraint') ||
    errorMsg.includes('foreign key') ||
    errorMsg.includes('unique violation') ||
    errorMsg.includes('not null')
  ) {
    return ErrorCategory.QUERY;
  }
  
  // 5. SECRET/ENV ERRORS
  if (
    errorMsg.includes('env') ||
    errorMsg.includes('environment variable') ||
    errorMsg.includes('undefined') && (
      errorMsg.includes('key') ||
      errorMsg.includes('secret') ||
      errorMsg.includes('api_key') ||
      errorMsg.includes('supabase')
    )
  ) {
    return ErrorCategory.SECRET;
  }
  
  // 6. NETWORK ERRORS
  if (
    errorMsg.includes('network') ||
    errorMsg.includes('fetch') ||
    errorMsg.includes('cors') ||
    errorMsg.includes('dns') ||
    errorMsg.includes('offline') ||
    errorMsg.includes('connection') ||
    errorMsg.includes('timeout')
  ) {
    return ErrorCategory.NETWORK;
  }
  
  return ErrorCategory.UNKNOWN;
}

// ============================================
// REPORTER DE ERROS
// ============================================

/**
 * Reporta erro de produção com contexto completo
 */
export function reportProductionError(
  error: any,
  context?: {
    url?: string;
    method?: string;
    statusCode?: number;
    userId?: string;
    obraId?: string;
    [key: string]: any;
  }
): void {
  const category = categorizeError(error, context);
  
  const productionError: ProductionError = {
    category,
    timestamp: Date.now(),
    message: error?.message || String(error),
    stack: error?.stack,
    context
  };
  
  // Armazenar para análise
  storeError(productionError);
  
  // Log estruturado por categoria
  const emoji = {
    [ErrorCategory.EDGE_FUNCTION]: '🔥',
    [ErrorCategory.AUTH]: '🔐',
    [ErrorCategory.RLS]: '🛡️',
    [ErrorCategory.QUERY]: '📊',
    [ErrorCategory.SECRET]: '🔑',
    [ErrorCategory.NETWORK]: '🌐',
    [ErrorCategory.UNKNOWN]: '❓'
  }[category];
  
  safeError(
    `${emoji} [${category}] ${productionError.message}`,
    {
      timestamp: new Date(productionError.timestamp).toISOString(),
      context: productionError.context,
      stack: productionError.stack?.split('\n').slice(0, 5).join('\n') // Primeiras 5 linhas
    }
  );
  
  // Sugestões específicas por categoria
  provideSuggestion(category, productionError);
}

/**
 * Fornece sugestões de debug baseado na categoria
 */
function provideSuggestion(category: ErrorCategory, error: ProductionError): void {
  const suggestions: Record<ErrorCategory, string> = {
    [ErrorCategory.EDGE_FUNCTION]: 
      '💡 SUGESTÃO: Verifique logs da Edge Function em supabase.com/dashboard → Edge Functions → Logs',
    
    [ErrorCategory.AUTH]: 
      '💡 SUGESTÃO: Verifique JWT token, sessão expirada ou credenciais inválidas. Tente fazer logout/login.',
    
    [ErrorCategory.RLS]: 
      '💡 SUGESTÃO: Verifique políticas RLS em supabase.com/dashboard → Authentication → Policies. Usuário pode não ter permissão.',
    
    [ErrorCategory.QUERY]: 
      '💡 SUGESTÃO: Verifique schema do banco, tipos de dados e constraints. Query pode estar desatualizada.',
    
    [ErrorCategory.SECRET]: 
      '💡 SUGESTÃO: Verifique se variáveis de ambiente estão configuradas em supabase.com/dashboard → Edge Functions → Secrets',
    
    [ErrorCategory.NETWORK]: 
      '💡 SUGESTÃO: Verifique conexão, CORS, DNS ou se backend está acessível. Tente recarregar a página.',
    
    [ErrorCategory.UNKNOWN]: 
      '💡 SUGESTÃO: Erro desconhecido. Verifique stack trace completo para mais detalhes.'
  };
  
  safeWarn(suggestions[category]);
}

// ============================================
// WRAPPERS PARA APIs
// ============================================

/**
 * Wrapper para fetch que captura erros automaticamente
 */
export async function monitoredFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // Capturar erros HTTP
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read response body');
      
      reportProductionError(
        new Error(`HTTP ${response.status}: ${response.statusText}`),
        {
          url,
          method: options?.method || 'GET',
          statusCode: response.status,
          responseBody: errorBody.substring(0, 500) // Primeiros 500 chars
        }
      );
    }
    
    return response;
  } catch (error) {
    reportProductionError(error, {
      url,
      method: options?.method || 'GET'
    });
    throw error;
  }
}

/**
 * Wrapper para operações do Supabase
 */
export async function monitoredSupabaseQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  try {
    const result = await queryFn();
    return result;
  } catch (error) {
    reportProductionError(error, {
      queryName,
      operation: 'supabase_query'
    });
    throw error;
  }
}

// ============================================
// HEALTH CHECK
// ============================================

export interface HealthCheckResult {
  overall: 'healthy' | 'degraded' | 'down';
  checks: {
    edgeFunctions: boolean;
    auth: boolean;
    database: boolean;
    storage: boolean;
  };
  errors: ProductionError[];
  timestamp: number;
}

/**
 * Executa health check completo do backend
 */
export async function checkBackendHealth(): Promise<HealthCheckResult> {
  const errors = getStoredErrors();
  const recentErrors = errors.filter(e => Date.now() - e.timestamp < 5 * 60 * 1000); // Últimos 5min
  
  const result: HealthCheckResult = {
    overall: 'healthy',
    checks: {
      edgeFunctions: true,
      auth: true,
      database: true,
      storage: true
    },
    errors: recentErrors,
    timestamp: Date.now()
  };
  
  // Analisar erros recentes
  for (const error of recentErrors) {
    switch (error.category) {
      case ErrorCategory.EDGE_FUNCTION:
        result.checks.edgeFunctions = false;
        break;
      case ErrorCategory.AUTH:
        result.checks.auth = false;
        break;
      case ErrorCategory.RLS:
      case ErrorCategory.QUERY:
        result.checks.database = false;
        break;
    }
  }
  
  // Determinar status geral
  const failedChecks = Object.values(result.checks).filter(v => !v).length;
  if (failedChecks >= 2) {
    result.overall = 'down';
  } else if (failedChecks === 1) {
    result.overall = 'degraded';
  }
  
  return result;
}

// ============================================
// DIAGNÓSTICO AUTOMÁTICO
// ============================================

/**
 * Gera relatório de diagnóstico completo
 */
export function generateDiagnosticReport(): string {
  const errors = getStoredErrors();
  
  if (errors.length === 0) {
    return '✅ Nenhum erro registrado! Sistema funcionando normalmente.';
  }
  
  // Agrupar por categoria
  const byCategory = errors.reduce((acc, error) => {
    acc[error.category] = (acc[error.category] || 0) + 1;
    return acc;
  }, {} as Record<ErrorCategory, number>);
  
  let report = '🚨 RELATÓRIO DE ERROS DE PRODUÇÃO\n\n';
  report += `Total de erros: ${errors.length}\n`;
  report += `Período: ${new Date(errors[errors.length - 1].timestamp).toLocaleString()} - ${new Date(errors[0].timestamp).toLocaleString()}\n\n`;
  
  report += '📊 ERROS POR CATEGORIA:\n';
  Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, count]) => {
      const percentage = ((count / errors.length) * 100).toFixed(1);
      report += `  ${category}: ${count} (${percentage}%)\n`;
    });
  
  report += '\n🔥 ERROS MAIS RECENTES:\n';
  errors.slice(0, 5).forEach((error, i) => {
    report += `\n${i + 1}. [${error.category}] ${new Date(error.timestamp).toLocaleString()}\n`;
    report += `   ${error.message}\n`;
    if (error.context) {
      report += `   Contexto: ${JSON.stringify(error.context, null, 2)}\n`;
    }
  });
  
  return report;
}

// ============================================
// EXPORT PARA ANÁLISE EXTERNA
// ============================================

/**
 * Exporta erros como JSON para análise
 */
export function exportErrorsAsJSON(): string {
  const errors = getStoredErrors();
  return JSON.stringify(errors, null, 2);
}

/**
 * Exporta erros como CSV
 */
export function exportErrorsAsCSV(): string {
  const errors = getStoredErrors();
  
  if (errors.length === 0) {
    return 'timestamp,category,message,statusCode,url\n';
  }
  
  const header = 'timestamp,category,message,statusCode,url\n';
  const rows = errors.map(error => {
    const timestamp = new Date(error.timestamp).toISOString();
    const category = error.category;
    const message = `"${error.message.replace(/"/g, '""')}"`;
    const statusCode = error.context?.statusCode || '';
    const url = error.context?.url || '';
    
    return `${timestamp},${category},${message},${statusCode},${url}`;
  }).join('\n');
  
  return header + rows;
}
