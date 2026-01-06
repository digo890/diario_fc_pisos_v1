/**
 * Sistema de Fila de Sincronização Offline
 * Gerencia sincronização de dados quando a conexão é restaurada
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SyncQueueSchema extends DBSchema {
  syncQueue: {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      entity: 'obra' | 'user' | 'formulario';
      data: any;
      timestamp: number;
      retries: number;
      lastError?: string;
    };
  };
}

const DB_NAME = 'syncQueueDB';
const STORE_NAME = 'syncQueue';
const DB_VERSION = 1;
const MAX_RETRIES = 3;

let db: IDBPDatabase<SyncQueueSchema> | null = null;

/**
 * Inicializa o banco de dados da fila de sincronização
 */
export async function initSyncQueue(): Promise<IDBPDatabase<SyncQueueSchema>> {
  if (db) return db;

  db = await openDB<SyncQueueSchema>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('entity', 'entity');
        console.log('✅ Store syncQueue criado');
      }
    },
  });

  return db;
}

/**
 * Adiciona uma operação à fila de sincronização
 */
export async function addToSyncQueue(
  type: 'create' | 'update' | 'delete',
  entity: 'obra' | 'user' | 'formulario',
  data: any
): Promise<void> {
  const database = await initSyncQueue();
  
  const queueItem = {
    id: `${entity}_${type}_${Date.now()}_${Math.random()}`,
    type,
    entity,
    data,
    timestamp: Date.now(),
    retries: 0,
  };

  await database.put(STORE_NAME, queueItem);
  
  console.log(`📤 Adicionado à fila de sincronização: ${entity} (${type})`, queueItem);
}

/**
 * Obtém todos os itens da fila de sincronização
 */
export async function getSyncQueue(): Promise<any[]> {
  const database = await initSyncQueue();
  const items = await database.getAll(STORE_NAME);
  return items.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Obtém contagem de itens pendentes na fila
 */
export async function getSyncQueueCount(): Promise<number> {
  const database = await initSyncQueue();
  const count = await database.count(STORE_NAME);
  return count;
}

/**
 * Remove um item da fila de sincronização
 */
export async function removeFromSyncQueue(id: string): Promise<void> {
  const database = await initSyncQueue();
  await database.delete(STORE_NAME, id);
  console.log(`✅ Removido da fila de sincronização: ${id}`);
}

/**
 * Incrementa o contador de tentativas de um item
 */
export async function incrementRetry(id: string, error: string): Promise<void> {
  const database = await initSyncQueue();
  const item = await database.get(STORE_NAME, id);
  
  if (item) {
    item.retries += 1;
    item.lastError = error;
    await database.put(STORE_NAME, item);
    
    // Se excedeu o máximo de tentativas, remove da fila
    if (item.retries >= MAX_RETRIES) {
      console.error(`❌ Item ${id} excedeu ${MAX_RETRIES} tentativas. Removendo da fila.`);
      await removeFromSyncQueue(id);
    }
  }
}

/**
 * Limpa toda a fila de sincronização
 */
export async function clearSyncQueue(): Promise<void> {
  const database = await initSyncQueue();
  await database.clear(STORE_NAME);
  console.log('🗑️ Fila de sincronização limpa');
}

/**
 * Processa a fila de sincronização
 */
export async function processSyncQueue(
  syncFunction: (item: any) => Promise<void>
): Promise<{ success: number; failed: number }> {
  const queue = await getSyncQueue();
  
  let success = 0;
  let failed = 0;

  console.log(`🔄 Processando ${queue.length} itens da fila de sincronização...`);

  for (const item of queue) {
    try {
      await syncFunction(item);
      await removeFromSyncQueue(item.id);
      success++;
    } catch (error: any) {
      console.error(`❌ Erro ao sincronizar item ${item.id}:`, error);
      await incrementRetry(item.id, error.message || 'Erro desconhecido');
      failed++;
    }
  }

  console.log(`✅ Sincronização concluída: ${success} sucessos, ${failed} falhas`);

  return { success, failed };
}

/**
 * Verifica se há itens pendentes na fila
 */
export async function hasPendingSyncs(): Promise<boolean> {
  const count = await getSyncQueueCount();
  return count > 0;
}
