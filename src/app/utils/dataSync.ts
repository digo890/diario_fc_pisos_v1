/**
 * 🔄 Data Sync - Merge Inteligente de Dados Backend/Local
 * Resolve race conditions entre backend e IndexedDB local
 */

import type { Obra, User } from '../types';
import { saveObra, saveUser, getObras, getUsers, getAllForms } from './database';
import { obraApi, userApi } from './api';
import { safeLog, safeWarn } from './logSanitizer';

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
 */
function getMostRecent<T extends TimestampedData>(
  local: T | undefined,
  remote: T
): T {
  if (!local) return remote;

  // Comparar por updatedAt primeiro (se existir)
  const localUpdated = local.updatedAt || local.createdAt || 0;
  const remoteUpdated = remote.updatedAt || remote.createdAt || 0;

  // Retornar a versão mais recente
  return remoteUpdated > localUpdated ? remote : local;
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

/**
 * 🧹 Limpa todo o IndexedDB (cache descartável)
 */
async function clearAllLocalData(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('DiarioObrasDB');
    request.onsuccess = () => {
      safeLog('🧹 IndexedDB limpo completamente');
      resolve();
    };
    request.onerror = () => {
      safeWarn('⚠️ Erro ao limpar IndexedDB:', request.error);
      reject(request.error);
    };
  });
}

/**
 * 🔄 Re-sincroniza todos os dados do backend
 */
async function resyncFromBackend(): Promise<void> {
  try {
    safeLog('🔄 Re-sincronizando dados do backend...');
    
    // Buscar dados do backend
    const [obrasResponse, usersResponse] = await Promise.all([
      obraApi.list(),
      userApi.list(),
    ]);

    if (!obrasResponse.success || !usersResponse.success) {
      throw new Error('Erro ao buscar dados do backend');
    }

    // Normalizar e salvar
    const obras = (obrasResponse.data || []).map(normalizeObraFromBackend);
    const users = (usersResponse.data || []).map(normalizeUserFromBackend);

    for (const obra of obras) {
      await saveObra(obra);
    }

    for (const user of users) {
      await saveUser(user);
    }

    safeLog(`✅ Re-sincronização completa: ${obras.length} obras, ${users.length} usuários`);
  } catch (error) {
    safeWarn('⚠️ Erro ao re-sincronizar do backend:', error);
    throw error;
  }
}

/**
 * 🔍 Verifica inconsistências no cache local
 */
async function detectInconsistencies(): Promise<boolean> {
  try {
    const obras = await getObras();
    const forms = await getAllForms();

    // Verificar obras com status que requerem formulário
    const statusesComFormulario = ['enviado_preposto', 'reprovado_preposto', 'concluido'];
    
    for (const obra of obras) {
      if (statusesComFormulario.includes(obra.status)) {
        const form = forms.find(f => f.obraId === obra.id);
        if (!form) {
          safeWarn(`⚠️ Inconsistência: obra ${obra.id} (${obra.status}) sem formulário`);
          return true; // Inconsistência detectada
        }
      }
    }

    return false; // Tudo ok
  } catch (error) {
    safeWarn('⚠️ Erro ao verificar inconsistências:', error);
    return true; // Em caso de erro, considerar inconsistente
  }
}

/**
 * 🛡️ Garante que o cache local está consistente com o backend
 * 
 * Estratégia: drop-and-resync
 * - IndexedDB é tratado como cache descartável
 * - Ao detectar inconsistência, limpa tudo e re-sincroniza
 * - Executa apenas em DEV ou via query param ?sanity-check=true
 * 
 * @param options Opções de configuração
 */
export async function ensureLocalDataIsConsistent(options = {
  strategy: 'drop-and-resync'
}): Promise<void> {
  // Verificar se deve executar
  const urlParams = new URLSearchParams(window.location.search);
  const isDev = import.meta.env.DEV;
  const forceSanityCheck = urlParams.has('sanity-check');

  if (!isDev && !forceSanityCheck) {
    return; // Pular em produção (a menos que forçado via query param)
  }

  try {
    safeLog('🔍 Verificando consistência do cache local...');

    // Detectar inconsistências
    const hasInconsistencies = await detectInconsistencies();

    if (hasInconsistencies) {
      safeWarn('⚠️ Inconsistências detectadas. Limpando cache e re-sincronizando...');
      
      // Estratégia: limpar tudo e re-sincronizar
      await clearAllLocalData();
      await resyncFromBackend();
      
      safeLog('✅ Cache limpo e re-sincronizado do backend');
    } else {
      safeLog('✅ Cache local está consistente');
    }
  } catch (error) {
    safeWarn('⚠️ Erro ao verificar consistência do cache:', error);
    // Não bloquear o app se o sanity check falhar
  }
}
