/**
 * Utilitários de Validação e Sanitização
 * Protege contra XSS, SQL Injection e inputs inválidos
 */

// ============================================
// SANITIZAÇÃO DE STRINGS
// ============================================

/**
 * Remove caracteres perigosos de strings
 * Protege contra XSS básico
 */
export function sanitizeString(input: string | undefined | null): string {
  if (!input) return '';
  
  return String(input)
    // Remover tags HTML
    .replace(/<[^>]*>/g, '')
    // Remover scripts inline
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    // Remover caracteres de controle
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Trim
    .trim();
}

/**
 * Sanitiza HTML permitindo apenas tags seguras
 */
export function sanitizeHtml(input: string | undefined | null): string {
  if (!input) return '';
  
  const allowedTags = ['b', 'i', 'u', 'strong', 'em', 'br', 'p'];
  let sanitized = String(input);
  
  // Remover scripts
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remover event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remover tags não permitidas
  sanitized = sanitized.replace(/<(\/?)([\w]+)[^>]*>/gi, (match, slash, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      return `<${slash}${tag}>`;
    }
    return '';
  });
  
  return sanitized;
}

// ============================================
// VALIDAÇÃO DE EMAIL
// ============================================

export function isValidEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// ============================================
// VALIDAÇÃO DE SENHA
// ============================================

export function isValidPassword(password: string | undefined | null): boolean {
  if (!password) return false;
  
  // Mínimo 6 caracteres (padrão Supabase)
  return password.length >= 6 && password.length <= 72;
}

export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!password) {
    return { isValid: false, errors: ['Senha é obrigatória'] };
  }
  
  if (password.length < 6) {
    errors.push('Senha deve ter no mínimo 6 caracteres');
  }
  
  if (password.length > 72) {
    errors.push('Senha muito longa (máximo 72 caracteres)');
  }
  
  // Recomendações (warnings, não erros)
  if (!/[A-Z]/.test(password)) {
    errors.push('Recomendado: incluir letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Recomendado: incluir letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Recomendado: incluir número');
  }
  
  return {
    isValid: errors.filter(e => e.startsWith('Senha')).length === 0,
    errors,
  };
}

// ============================================
// VALIDAÇÃO DE UUID
// ============================================

export function isValidUUID(uuid: string | undefined | null): boolean {
  if (!uuid) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ============================================
// VALIDAÇÃO DE TIPOS DE USUÁRIO
// ============================================

const VALID_USER_TYPES = ['Administrador', 'Encarregado'] as const;
type UserType = typeof VALID_USER_TYPES[number];

export function isValidUserType(tipo: string | undefined | null): tipo is UserType {
  if (!tipo) return false;
  return VALID_USER_TYPES.includes(tipo as any);
}

// ============================================
// VALIDAÇÃO DE STATUS
// ============================================

/**
 * ✅ CORREÇÃO: Status atualizados para v1.0.0
 * Separados por entidade (Obra vs Formulário)
 */
const VALID_OBRA_STATUS = [
  'novo',
  'em_preenchimento',
  'enviado_preposto',
  'reprovado_preposto',
  'concluido',
] as const;

const VALID_FORMULARIO_STATUS = [
  'rascunho',
  'enviado_preposto',
  'reprovado_preposto',
  'concluido',
] as const;

export function isValidObraStatus(status: string | undefined | null): boolean {
  if (!status) return false;
  return VALID_OBRA_STATUS.includes(status as any);
}

export function isValidFormularioStatus(status: string | undefined | null): boolean {
  if (!status) return false;
  return VALID_FORMULARIO_STATUS.includes(status as any);
}

// ============================================
// VALIDAÇÃO DE TELEFONE
// ============================================

export function sanitizePhone(phone: string | undefined | null): string {
  if (!phone) return '';
  
  // Remover tudo exceto números
  return phone.replace(/\D/g, '');
}

export function isValidPhone(phone: string | undefined | null): boolean {
  if (!phone) return true; // Telefone é opcional
  
  const cleaned = sanitizePhone(phone);
  // Validar telefone brasileiro (10 ou 11 dígitos)
  return cleaned.length >= 10 && cleaned.length <= 11;
}

// ============================================
// VALIDAÇÃO DE OBRA
// ============================================

export interface ObraValidation {
  cliente?: string;
  obra?: string;
  preposto_nome?: string;
  preposto_email?: string;
  preposto_telefone?: string;
  [key: string]: any;
}

export function validateObraData(data: ObraValidation): {
  isValid: boolean;
  errors: string[];
  sanitized: ObraValidation;
} {
  const errors: string[] = [];
  const sanitized: ObraValidation = {};
  
  // Cliente (obrigatório)
  if (!data.cliente || sanitizeString(data.cliente).length === 0) {
    errors.push('Nome do cliente é obrigatório');
  } else {
    sanitized.cliente = sanitizeString(data.cliente);
    if (sanitized.cliente.length > 200) {
      errors.push('Nome do cliente muito longo (máximo 200 caracteres)');
    }
  }
  
  // Obra (obrigatório)
  if (!data.obra || sanitizeString(data.obra).length === 0) {
    errors.push('Nome da obra é obrigatório');
  } else {
    sanitized.obra = sanitizeString(data.obra);
    if (sanitized.obra.length > 200) {
      errors.push('Nome da obra muito longo (máximo 200 caracteres)');
    }
  }
  
  // ✅ CORREÇÃO: Aceitar tanto prepostoNome quanto preposto_nome
  const prepostoNome = data.prepostoNome || data.preposto_nome;
  if (prepostoNome) {
    sanitized.prepostoNome = sanitizeString(prepostoNome);
  }
  
  // ✅ CORREÇÃO: Aceitar tanto prepostoEmail quanto preposto_email
  const prepostoEmail = data.prepostoEmail || data.preposto_email;
  if (prepostoEmail) {
    if (!isValidEmail(prepostoEmail)) {
      errors.push('Email do preposto inválido');
    } else {
      sanitized.prepostoEmail = sanitizeString(prepostoEmail).toLowerCase();
    }
  }
  
  // ✅ CORREÇÃO: Aceitar tanto prepostoWhatsapp/prepostoTelefone quanto preposto_whatsapp/preposto_telefone
  const prepostoTelefone = data.prepostoWhatsapp || data.prepostoTelefone || data.preposto_whatsapp || data.preposto_telefone;
  if (prepostoTelefone) {
    if (!isValidPhone(prepostoTelefone)) {
      errors.push('Telefone do preposto inválido');
    } else {
      sanitized.prepostoWhatsapp = sanitizePhone(prepostoTelefone);
    }
  }
  
  // Copiar outros campos (sanitizados) usando camelCase
  for (const key in data) {
    if (!sanitized.hasOwnProperty(key) && typeof data[key] === 'string') {
      sanitized[key] = sanitizeString(data[key]);
    } else if (!sanitized.hasOwnProperty(key)) {
      sanitized[key] = data[key];
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

// ============================================
// VALIDAÇÃO DE USUÁRIO
// ============================================

export interface UserValidation {
  email: string;
  nome: string;
  tipo: string;
  password?: string;
  telefone?: string;
}

export function validateUserData(data: UserValidation, isUpdate = false): {
  isValid: boolean;
  errors: string[];
  sanitized: UserValidation;
} {
  const errors: string[] = [];
  const sanitized: any = {};
  
  // Email (obrigatório)
  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Email inválido');
  } else {
    sanitized.email = sanitizeString(data.email).toLowerCase();
  }
  
  // Nome (obrigatório)
  if (!data.nome || sanitizeString(data.nome).length === 0) {
    errors.push('Nome é obrigatório');
  } else {
    sanitized.nome = sanitizeString(data.nome);
    if (sanitized.nome.length > 100) {
      errors.push('Nome muito longo (máximo 100 caracteres)');
    }
  }
  
  // Tipo (obrigatório)
  if (!isValidUserType(data.tipo)) {
    errors.push('Tipo de usuário inválido (deve ser Administrador ou Encarregado)');
  } else {
    sanitized.tipo = data.tipo;
  }
  
  // Senha (obrigatória em criação, opcional em atualização)
  if (!isUpdate && data.password) {
    if (!isValidPassword(data.password)) {
      errors.push('Senha inválida (mínimo 6 caracteres)');
    } else {
      sanitized.password = data.password; // Não sanitizar senha
    }
  } else if (!isUpdate && !data.password) {
    errors.push('Senha é obrigatória');
  } else if (isUpdate && data.password) {
    // Se está atualizando e forneceu senha, validar
    if (!isValidPassword(data.password)) {
      errors.push('Senha inválida (mínimo 6 caracteres)');
    } else {
      sanitized.password = data.password;
    }
  }
  
  // Telefone (opcional)
  if (data.telefone) {
    if (!isValidPhone(data.telefone)) {
      errors.push('Telefone inválido');
    } else {
      sanitized.telefone = sanitizePhone(data.telefone);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

// ============================================
// RATE LIMITING (Simple in-memory)
// ============================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests = 100,
  windowMs = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  // Se não existe ou expirou, criar novo
  if (!record || record.resetAt < now) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  // Se excedeu o limite
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  // Incrementar contador
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

// Limpar registros antigos periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // A cada 1 minuto