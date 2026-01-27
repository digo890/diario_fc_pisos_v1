/**
 * 🔒 Log Sanitizer para Backend (Deno)
 * Remove dados sensíveis antes de log para proteção LGPD/GDPR
 */

// Padrões de dados sensíveis
const SENSITIVE_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  password: /senha|password|pwd|pass/i,
  token: /token|jwt|bearer|authorization/i,
  phone: /(\+55\s?)?(\(?\d{2}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}/g,
  cpf: /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g,
  creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
};

/**
 * Mascara dados sensíveis em string
 */
function maskSensitiveData(data: any): any {
  if (typeof data === 'string') {
    let masked = data;
    
    // Mascarar emails
    masked = masked.replace(SENSITIVE_PATTERNS.email, (email) => {
      const [user, domain] = email.split('@');
      const maskedUser = user.length > 2 ? user[0] + '***' + user[user.length - 1] : '***';
      return `${maskedUser}@${domain}`;
    });
    
    // Mascarar telefones
    masked = masked.replace(SENSITIVE_PATTERNS.phone, '(**) ****-****');
    
    // Mascarar CPFs
    masked = masked.replace(SENSITIVE_PATTERNS.cpf, '***.***.**-**');
    
    // Mascarar cartões de crédito
    masked = masked.replace(SENSITIVE_PATTERNS.creditCard, '**** **** **** ****');
    
    return masked;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item));
  }
  
  if (data && typeof data === 'object') {
    const masked: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Mascarar chaves sensíveis completamente
      if (
        SENSITIVE_PATTERNS.password.test(key) ||
        SENSITIVE_PATTERNS.token.test(key) ||
        key === 'authorization' ||
        key === 'x-user-token'
      ) {
        masked[key] = '***REDACTED***';
      } else {
        masked[key] = maskSensitiveData(value);
      }
    }
    
    return masked;
  }
  
  return data;
}

/**
 * Log seguro (INFO)
 */
export function safeLog(message: string, data?: any) {
  if (data !== undefined) {
    console.log(message, maskSensitiveData(data));
  } else {
    console.log(maskSensitiveData(message));
  }
}

/**
 * Log seguro (ERROR)
 */
export function safeError(message: string, error?: any) {
  if (error !== undefined) {
    console.error(message, maskSensitiveData(error));
  } else {
    console.error(maskSensitiveData(message));
  }
}

/**
 * Log seguro (WARN)
 */
export function safeWarn(message: string, data?: any) {
  if (data !== undefined) {
    console.warn(message, maskSensitiveData(data));
  } else {
    console.warn(maskSensitiveData(message));
  }
}
