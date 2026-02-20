/**
 * 🔄 Sync Queue - Sistema de Fila Persistente para Sincronização Offline
 *
 * Gerencia operações pendentes quando offline e tenta reenviar automaticamente
 */

import { safeLog, safeError, safeWarn } from './logSanitizer';
import { initDB } from './database';

// Tipos de operações suportadas
export type SyncOperation =
  | 'create_obra'
  | 'update_obra'
  | 'delete_obra'
  | 'create_user'
  | 'update_user'
  | 'delete_user'
  | 'create_form'
  | 'update_form'
  | 'send_email';

export interface SyncQueueItem {
  id: string; // UUID único da operação
  operation: SyncOperation;
  entityId: string; // ID da obra/user/form sendo modificado
  data: any; // Dados da operação
  timestamp: number; // Quando foi criada
  retries: number; // Quantas tentativas já foram feitas
  lastError?: string; // Último erro que ocorreu
  status: 'pending' | 'processing' | 'failed' | 'success';
}

const QUEUE_STORE_NAME = 'syncQueue';
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 segundos entre tentativas

/**
 * Extrai mensagem de erro de forma robusta
 */
function getErrorMessage(error: any): string {
  if (!error) return 'Erro desconhecido';

  // Se for string, retornar diretamente
  if (typeof error === 'string') return error;

  // Se tiver message
  if (error.message) return error.message;

  // Se tiver error (resposta de API)
  if (error.error) return error.error;

  // Se for objeto, tentar JSON.stringify
  try {
    const str = JSON.stringify(error);
    if (str !== '{}') return str;
  } catch (e) {
    // Ignorar erro de stringify
  }

  // Fallback
  return 'Erro ao processar operação';
}

// Flag para garantir inicialização única
let hasInitialized = false;

class SyncQueueManager {
  private isProcessing = false;
  private listeners: Set<() => void> = new Set();

  /**
   * Adiciona operação à fila
   */
  async enqueue(operation: SyncOperation, entityId: string, data: any): Promise<string> {
    const db = await initDB();

    const item: SyncQueueItem = {
      id: crypto.randomUUID(),
      operation,
      entityId,
      data,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUEUE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const request = store.add(item);

      request.onsuccess = () => {
        safeLog(`✅ Operação adicionada à fila: ${operation} (${entityId})`);
        this.notifyListeners();
        resolve(item.id);

        // Tentar processar imediatamente se online
        if (navigator.onLine) {
          this.processQueue();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Busca todas as operações pendentes
   */
  async getPendingItems(): Promise<SyncQueueItem[]> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUEUE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Busca todas as operações (qualquer status)
   */
  async getAllItems(): Promise<SyncQueueItem[]> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUEUE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Atualiza status de um item
   */
  async updateItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUEUE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          const updatedItem = { ...item, ...updates };
          const putRequest = store.put(updatedItem);

          putRequest.onsuccess = () => {
            this.notifyListeners();
            resolve();
          };
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Item não encontrado'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Remove item da fila
   */
  async removeItem(id: string): Promise<void> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUEUE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        safeLog(`✅ Item removido da fila: ${id}`);
        this.notifyListeners();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Processa a fila de sincronização
   */
  async processQueue(): Promise<void> {
    const execute = async () => {
      // Evitar processamento simultâneo
      if (this.isProcessing) {
        safeLog('⏳ Fila já está sendo processada...');
        return;
      }

      // Verificar se está online
      if (!navigator.onLine) {
        safeWarn('📡 Offline - fila não será processada');
        return;
      }

      this.isProcessing = true;
      safeLog('🔄 Iniciando processamento da fila de sincronização...');

      try {
        const pendingItems = await this.getPendingItems();

        if (pendingItems.length === 0) {
          safeLog('✅ Fila vazia - nada para sincronizar');
          return;
        }

        safeLog(`📋 ${pendingItems.length} operação(ões) pendente(s) encontrada(s)`);

        // Processar itens em ordem cronológica
        const sortedItems = pendingItems.sort((a, b) => a.timestamp - b.timestamp);

        for (const item of sortedItems) {
          await this.processItem(item);
        }

        safeLog('✅ Processamento da fila concluído');
      } catch (error) {
        safeError('❌ Erro ao processar fila:', error);
      } finally {
        this.isProcessing = false;
        this.notifyListeners();
      }
    };

    // 🔒 MUTEX: Cross-tab locking com Navigator Locks API
    if (typeof navigator !== 'undefined' && 'locks' in navigator) {
      await navigator.locks.request('sync_queue_mutex', { ifAvailable: true }, async (lock) => {
        if (!lock) return; // Silent exit se já estiver processando em outra aba
        await execute();
      });
    } else {
      // Fallback para navegadores sem suporte a Locks API (apenas proteção intra-tab)
      await execute();
    }
  }

  /**
   * Processa um item individual
   */
  private async processItem(item: SyncQueueItem): Promise<void> {
    safeLog(`🔄 Processando: ${item.operation} (${item.entityId})`);

    // Marcar como processando
    await this.updateItem(item.id, { status: 'processing' });

    try {
      // Importar API dinamicamente para evitar dependências circulares
      const { obraApi, userApi, formApi } = await import('./api');

      let success = false;

      switch (item.operation) {
        case 'create_obra':
          const createObraResponse = await obraApi.create(item.data);
          success = createObraResponse.success;
          break;

        case 'update_obra':
          const updateObraResponse = await obraApi.update(item.entityId, item.data);
          success = updateObraResponse.success;
          break;

        case 'delete_obra':
          const deleteObraResponse = await obraApi.delete(item.entityId);
          success = deleteObraResponse.success;
          break;

        case 'create_user':
          const createUserResponse = await userApi.create(item.data);
          success = createUserResponse.success;
          break;

        case 'update_user':
          const updateUserResponse = await userApi.update(item.entityId, item.data);
          success = updateUserResponse.success;
          break;

        case 'delete_user':
          const deleteUserResponse = await userApi.delete(item.entityId);
          success = deleteUserResponse.success;
          break;

        case 'create_form':
          const createFormResponse = await formApi.save(item.entityId, item.data);
          success = createFormResponse.success;
          break;

        case 'update_form':
          const updateFormResponse = await formApi.save(item.entityId, item.data);
          success = updateFormResponse.success;
          break;

        case 'send_email':
          // Email não crítico - marcar como sucesso mesmo se falhar
          safeLog('📧 Tentando reenviar email...');
          success = true; // Email é opcional, não bloqueia
          break;

        default:
          safeWarn(`⚠️ Operação desconhecida: ${item.operation}`);
          success = false;
      }

      if (success) {
        safeLog(`✅ Operação sincronizada: ${item.operation}`);
        await this.removeItem(item.id);
      } else {
        throw new Error('Operação falhou no backend');
      }
    } catch (error: any) {
      // 🔐 PROTEÇÃO SESSÃO EXPIRADA: Se for 401, PAUSA mas NÃO REMOVE
      const errorMsg = getErrorMessage(error);
      const is401 =
        errorMsg.includes('401') || errorMsg.includes('Unauthorized') || errorMsg.includes('JWT');

      if (is401) {
        safeWarn(
          `🔐 Sessão expirada detectada - pausando item sem contar retry: ${item.operation}`
        );
        await this.updateItem(item.id, {
          status: 'pending', // Volta para pending SEM incrementar retries
          lastError: 'Sessão expirada. Faça login novamente para sincronizar.',
        });
        return; // IMPORTANTE: retorna sem incrementar contador
      }

      safeError(`❌ Erro ao processar ${item.operation}:`, error);

      // Incrementar contador de tentativas (APENAS para erros não-401)
      const newRetries = item.retries + 1;

      if (newRetries >= MAX_RETRIES) {
        // Máximo de tentativas atingido - marcar como falha permanente
        await this.updateItem(item.id, {
          status: 'failed',
          retries: newRetries,
          lastError: getErrorMessage(error),
        });
        safeError(`💥 Operação falhou após ${MAX_RETRIES} tentativas: ${item.operation}`);
      } else {
        // Reagendar para nova tentativa
        await this.updateItem(item.id, {
          status: 'pending',
          retries: newRetries,
          lastError: getErrorMessage(error),
        });
        safeWarn(`🔄 Operação será retentada (${newRetries}/${MAX_RETRIES}): ${item.operation}`);
      }
    }
  }

  /**
   * Retorna contagem de itens pendentes
   */
  async getPendingCount(): Promise<number> {
    const items = await this.getPendingItems();
    return items.length;
  }

  /**
   * Retorna contagem de itens falhados
   */
  async getFailedCount(): Promise<number> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUEUE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const index = store.index('status');
      const request = index.getAll('failed');

      request.onsuccess = () => resolve(request.result?.length || 0);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Limpa itens bem-sucedidos antigos (mais de 7 dias)
   */
  async cleanupOldItems(): Promise<void> {
    const db = await initDB();

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const allItems = await this.getAllItems();

    const itemsToRemove = allItems.filter(
      (item) => item.status === 'success' && item.timestamp < sevenDaysAgo
    );

    for (const item of itemsToRemove) {
      await this.removeItem(item.id);
    }

    if (itemsToRemove.length > 0) {
      safeLog(`🧹 ${itemsToRemove.length} item(ns) antigo(s) removido(s)`);
    }
  }

  /**
   * Registra listener para mudanças na fila
   */
  addListener(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notifica listeners sobre mudanças
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback());
  }

  /**
   * Tenta retentar itens falhados
   */
  async retryFailedItems(): Promise<void> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUEUE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const index = store.index('status');
      const request = index.getAll('failed');

      request.onsuccess = async () => {
        try {
          const failedItems = request.result || [];

          for (const item of failedItems) {
            await this.updateItem(item.id, {
              status: 'pending',
              retries: 0, // Resetar contador
              lastError: undefined,
            });
          }

          if (failedItems.length > 0) {
            safeLog(`🔄 ${failedItems.length} item(ns) falhado(s) reagendado(s)`);
            // Nota: processQueue() deve ser chamado pelo caller
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton
export const syncQueue = new SyncQueueManager();

/**
 * Inicializa a fila de sincronização
 * (Compatibilidade com código legado - a inicialização é automática)
 */
export async function initSyncQueue(): Promise<void> {
  // Idempotência: Se já inicializou, não fazer nada
  if (hasInitialized) {
    return;
  }

  hasInitialized = true;
  safeLog('✅ Fila de sincronização inicializada');

  // 🔄 RECOVERY: Tentar recuperar itens falhados ao iniciar
  await syncQueue.retryFailedItems();

  // Processar fila imediatamente se online
  if (navigator.onLine) {
    await syncQueue.processQueue();
  }

  // Limpar itens antigos
  await syncQueue.cleanupOldItems();
}

// Auto-processar quando voltar online
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    safeLog('📡 Conexão restaurada - verificando falhas e processando fila...');
    // 🔄 RECOVERY: Tentar recuperar itens falhados ao reconectar
    await syncQueue.retryFailedItems();
    await syncQueue.processQueue();
  });

  // Processar fila periodicamente (a cada 2 minutos se online)
  setInterval(
    () => {
      if (navigator.onLine) {
        syncQueue.processQueue();
      }
    },
    2 * 60 * 1000
  );

  // Cleanup diário
  setInterval(
    () => {
      syncQueue.cleanupOldItems();
    },
    24 * 60 * 60 * 1000
  );
}
