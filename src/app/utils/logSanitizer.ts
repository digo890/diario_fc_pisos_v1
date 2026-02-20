/**
 * 🔒 Sanitização de Logs - Proteção de Dados Sensíveis
 * Remove informações sensíveis antes de logar para console
 * Sistema com níveis de log (DEBUG, INFO, WARN, ERROR)
 */

// ============================================
// CONFIGURAÇÃO DE AMBIENTE
// ============================================

/**
 * Detecta se está em modo de produção
 */
const isProduction = (): boolean => {
  // Vercel ou produção
  if (typeof window !== 'undefined') {
    return (
      window.location.hostname !== 'localhost' &&
      !window.location.hostname.includes('127.0.0.1') &&
      !window.location.hostname.includes('figma')
    );
  }
  return false;
};

/**
 * Níveis de log
 */
export enum LogLevel {
  DEBUG = 0, // Detalhes de desenvolvimento (desabilitado em produção)
  INFO = 1, // Informações gerais
  WARN = 2, // Avisos
  ERROR = 3, // Erros críticos
}

/**
 * Nível mínimo de log a ser exibido
 * Em produção: apenas WARN e ERROR
 * Em desenvolvimento: todos os níveis
 */
const MIN_LOG_LEVEL = isProduction() ? LogLevel.WARN : LogLevel.DEBUG;

// Lista de campos que contêm informações sensíveis
const SENSITIVE_FIELDS = [
  'email',
  'senha',
  'password',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'apiKey',
  'secret',
  'telefone',
  'phone',
  'cpf',
  'cnpj',
  'assinatura',
  'assinaturaEncarregado',
  'assinaturaPreposto',
  'prepostoEmail',
  'validationToken',
];

/**
 * Sanitiza um objeto removendo ou mascarando campos sensíveis
 * @param obj Objeto a ser sanitizado
 * @param maskValue Valor a ser usado para mascarar (padrão: '[REDACTED]')
 * @returns Objeto sanitizado
 */
export function sanitizeForLog(obj: any, maskValue: string = '[REDACTED]'): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Se não for objeto, retornar como está
  if (typeof obj !== 'object') {
    return obj;
  }

  // Se for array, sanitizar cada item
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForLog(item, maskValue));
  }

  // Criar cópia do objeto
  const sanitized: any = {};

  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;

    const lowerKey = key.toLowerCase();

    // Verificar se é campo sensível
    const isSensitive = SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()));

    if (isSensitive) {
      // Mascarar campo sensível
      if (typeof obj[key] === 'string' && obj[key].length > 0) {
        // Mostrar apenas primeiros e últimos caracteres para emails
        if (lowerKey.includes('email') && obj[key].includes('@')) {
          const parts = obj[key].split('@');
          const localPart = parts[0];
          const domain = parts[1];
          const masked =
            localPart.length > 2
              ? `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`
              : `***@${domain}`;
          sanitized[key] = masked;
        }
        // Mostrar apenas últimos dígitos para telefone
        else if (
          lowerKey.includes('telefone') ||
          lowerKey.includes('phone') ||
          lowerKey.includes('whatsapp')
        ) {
          const cleaned = obj[key].replace(/\D/g, '');
          sanitized[key] = cleaned.length > 4 ? `***${cleaned.slice(-4)}` : '***';
        }
        // Para outros campos, apenas marcar como redacted
        else {
          sanitized[key] = maskValue;
        }
      } else {
        sanitized[key] = maskValue;
      }
    } else {
      // Se não for sensível, sanitizar recursivamente se for objeto
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitized[key] = sanitizeForLog(obj[key], maskValue);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }

  return sanitized;
}

// ============================================
// FUNÇÕES DE LOG COM NÍVEIS
// ============================================

/**
 * Log de DEBUG (apenas desenvolvimento)
 * Usado para detalhes técnicos e debugging
 */
export function safeDebug(message: string, data?: any): void {
  if (MIN_LOG_LEVEL > LogLevel.DEBUG) return;

  if (data) {
    console.log(`[DEBUG] ${message}`, sanitizeForLog(data));
  } else {
    console.log(`[DEBUG] ${message}`);
  }
}

/**
 * Log de INFO (desenvolvimento + produção importante)
 * Usado para informações gerais do fluxo da aplicação
 */
export function safeInfo(message: string, data?: any): void {
  if (MIN_LOG_LEVEL > LogLevel.INFO) return;

  if (data) {
    console.log(`[INFO] ${message}`, sanitizeForLog(data));
  } else {
    console.log(`[INFO] ${message}`);
  }
}

/**
 * Versão safe do console.log que sanitiza automaticamente
 * DEPRECATED: Use safeDebug ou safeInfo
 */
export function safeLog(message: string, data?: any): void {
  // Manter compatibilidade - trata como INFO
  safeInfo(message, data);
}

/**
 * Versão safe do console.warn que sanitiza automaticamente
 */
export function safeWarn(message: string, data?: any): void {
  if (MIN_LOG_LEVEL > LogLevel.WARN) return;

  if (data) {
    console.warn(message, sanitizeForLog(data));
  } else {
    console.warn(message);
  }
}

/**
 * Versão safe do console.error que sanitiza automaticamente
 * MELHORADO: Extrai informações úteis de objetos Error
 */
export function safeError(message: string, data?: any): void {
  // Erros sempre são logados
  if (data) {
    // Se for um objeto Error nativo, extrair informações úteis
    if (data instanceof Error) {
      console.error(message, {
        name: data.name,
        message: data.message,
        stack: data.stack,
      });
    }
    // Se for um objeto com propriedades de erro
    else if (data && typeof data === 'object') {
      const errorInfo: any = {};

      // Capturar propriedades comuns de erro
      if (data.message) errorInfo.message = data.message;
      if (data.error) errorInfo.error = data.error;
      if (data.status) errorInfo.status = data.status;
      if (data.statusText) errorInfo.statusText = data.statusText;
      if (data.code) errorInfo.code = data.code;
      if (data.details) errorInfo.details = data.details;

      // Se não capturou nada útil, logar o objeto completo (sanitizado)
      if (Object.keys(errorInfo).length === 0) {
        console.error(message, sanitizeForLog(data));
      } else {
        console.error(message, errorInfo);
      }
    }
    // Para outros tipos, logar diretamente
    else {
      console.error(message, data);
    }
  } else {
    console.error(message);
  }
}
