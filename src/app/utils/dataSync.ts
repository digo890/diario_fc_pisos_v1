/**
 * 🔄 Data Sync - Merge Inteligente de Dados Backend/Local
 * Resolve race conditions entre backend e IndexedDB local
 */

import type { Obra, User } from '../types';
import { saveObra, saveUser } from './database';
import { safeLog } from './logSanitizer';

interface TimestampedData {
  id: string;
  createdAt?: number;
  updatedAt?: number;
  [key: string]: any;
}

/**
 * Normaliza dados de obra do backend (snake_case) para frontend (camelCase)
 */
function normalizeObraFromBackend(obraBackend: any): Obra {
  return {
    id: obraBackend.id,
    cliente: obraBackend.cliente,
    obra: obraBackend.obra,
    cidade: obraBackend.cidade,
    data: obraBackend.data,
    encarregadoId: obraBackend.encarregado_id || obraBackend.encarregadoId,
    prepostoNome: obraBackend.preposto_nome || obraBackend.prepostoNome,
    prepostoEmail: obraBackend.preposto_email || obraBackend.prepostoEmail,
    prepostoWhatsapp: obraBackend.preposto_whatsapp || obraBackend.prepostoWhatsapp,
    status: obraBackend.status,
    progress: obraBackend.progress || 0,
    createdAt: obraBackend.created_at 
      ? new Date(obraBackend.created_at).getTime() 
      : obraBackend.createdAt || Date.now(),
    // ✅ CORREÇÃO CRÍTICA: Remover fallback Date.now() que mascara problemas
    // Se updatedAt não existir, deixar undefined (backend deve vencer no merge)
    updatedAt: obraBackend.updated_at 
      ? new Date(obraBackend.updated_at).getTime() 
      : obraBackend.updatedAt,
    createdBy: obraBackend.created_by || obraBackend.createdBy || '',
    validationToken: obraBackend.token_validacao || obraBackend.validationToken,
    validationTokenExpiry: obraBackend.token_validacao_expiry 
      ? new Date(obraBackend.token_validacao_expiry).getTime() 
      : obraBackend.validationTokenExpiry,
    validationTokenLastAccess: obraBackend.validation_token_last_access 
      ? new Date(obraBackend.validation_token_last_access).getTime() 
      : obraBackend.validationTokenLastAccess,
  };
}

/**
 * Normaliza dados de usuário do backend (snake_case) para frontend (camelCase)
 */
function normalizeUserFromBackend(userBackend: any): User {
  return {
    id: userBackend.id,
    nome: userBackend.nome,
    tipo: userBackend.tipo,
    email: userBackend.email,
    telefone: userBackend.telefone,
    createdAt: userBackend.created_at 
      ? new Date(userBackend.created_at).getTime() 
      : userBackend.createdAt || Date.now(),
  };
}

/**
 * Compara timestamps e retorna a versão mais recente
 * 
 * ✅ CORREÇÃO v1.0.0: Backend SEMPRE vence (fonte da verdade)
 * Razão: Backend pode não ter updatedAt, então comparação por timestamp é falha.
 * Estratégia: Cache local serve apenas para exibição rápida, backend é autoritativo.
 */
function getMostRecent<T extends TimestampedData>(
  local: T | undefined,
  remote: T
): T {
  // ✅ SEMPRE retornar versão do backend (fonte da verdade)
  // IndexedDB é cache descartável, não fonte de verdade
  return remote;
}

/**
 * Merge inteligente de obras (backend + local)
 * @param localObras Obras do IndexedDB
 * @param remoteObras Obras do backend (em snake_case)
 * @returns Array de obras merged (em camelCase)
 */
export async function mergeObras(
  localObras: Obra[],
  remoteObras: any[]
): Promise<Obra[]> {
  const merged = new Map<string, Obra>();

  // Adicionar todas as obras locais ao mapa
  localObras.forEach(obra => {
    merged.set(obra.id, obra);
  });

  // Merge com obras remotas (mais recentes sobrescrevem)
  for (const remoteObraRaw of remoteObras) {
    // ✅ CORREÇÃO: Normalizar dados do backend (snake_case → camelCase)
    const remoteObra = normalizeObraFromBackend(remoteObraRaw);
    
    const localObra = merged.get(remoteObra.id);
    const mostRecent = getMostRecent(localObra, remoteObra);
    
    merged.set(remoteObra.id, mostRecent);
    
    // Salvar versão mais recente no IndexedDB
    await saveObra(mostRecent);
  }

  // Converter mapa para array
  return Array.from(merged.values());
}

/**
 * Merge inteligente de usuários (backend + local)
 * @param localUsers Usuários do IndexedDB
 * @param remoteUsers Usuários do backend (em snake_case)
 * @returns Array de usuários merged (em camelCase)
 */
export async function mergeUsers(
  localUsers: User[],
  remoteUsers: any[]
): Promise<User[]> {
  const merged = new Map<string, User>();

  // Adicionar todos os usuários locais ao mapa
  localUsers.forEach(user => {
    merged.set(user.id, user);
  });

  // Merge com usuários remotos (mais recentes sobrescrevem)
  for (const remoteUserRaw of remoteUsers) {
    // ✅ CORREÇÃO: Normalizar dados do backend (snake_case → camelCase)
    const remoteUser = normalizeUserFromBackend(remoteUserRaw);
    
    const localUser = merged.get(remoteUser.id);
    const mostRecent = getMostRecent(localUser, remoteUser);
    
    merged.set(remoteUser.id, mostRecent);
    
    // Salvar versão mais recente no IndexedDB
    await saveUser(mostRecent);
  }

  // Converter mapa para array
  return Array.from(merged.values());
}

/**
 * Detecta conflitos entre versões local e remota
 */
export function detectConflicts<T extends TimestampedData>(
  local: T | undefined,
  remote: T
): boolean {
  if (!local) return false;

  const localUpdated = local.updatedAt || local.createdAt || 0;
  const remoteUpdated = remote.updatedAt || remote.createdAt || 0;

  // Conflito se ambos foram atualizados recentemente (diferença < 5 segundos)
  const timeDiff = Math.abs(localUpdated - remoteUpdated);
  return timeDiff < 5000 && timeDiff > 0;
}
