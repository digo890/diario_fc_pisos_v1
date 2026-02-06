// IndexedDB para persistência offline
import type { User, Obra, FormData } from '../types';
import { safeLog, safeWarn } from './logSanitizer';

const DB_NAME = 'DiarioObrasDB';
const DB_VERSION = 3; // ✅ Incrementar versão para corrigir keyPath obra_id

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction;

      // Store de usuários
      if (!database.objectStoreNames.contains('users')) {
        const userStore = database.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('tipo', 'tipo', { unique: false });
      }

      // Store de obras
      if (!database.objectStoreNames.contains('obras')) {
        const obraStore = database.createObjectStore('obras', { keyPath: 'id' });
        obraStore.createIndex('status', 'status', { unique: false });
        obraStore.createIndex('encarregadoId', 'encarregadoId', { unique: false });
      }

      // ✅ MIGRAÇÃO V3: Recriar store de formulários com keyPath correto
      if (database.objectStoreNames.contains('forms')) {
        // Deletar store antiga com keyPath 'obraId' (errado)
        database.deleteObjectStore('forms');
        console.log('🔄 Migração V3: Store "forms" deletada (keyPath antigo: obraId)');
      }
      // Criar nova store com keyPath 'obra_id' (correto)
      const formStore = database.createObjectStore('forms', { keyPath: 'obra_id' });
      formStore.createIndex('status', 'status', { unique: false });
      formStore.createIndex('createdBy', 'createdBy', { unique: false });
      console.log('✅ Migração V3: Store "forms" criada (keyPath novo: obra_id)');

      // Store de configurações
      if (!database.objectStoreNames.contains('config')) {
        database.createObjectStore('config', { keyPath: 'key' });
      }

      // ✅ Store de fila de sincronização
      if (!database.objectStoreNames.contains('syncQueue')) {
        const syncStore = database.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('status', 'status', { unique: false });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('entityId', 'entityId', { unique: false });
      }
    };
  });
};

// ===== USERS =====
export const getUsers = async (): Promise<User[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveUser = async (user: User): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.put(user);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const saveBatchUsers = async (users: User[]): Promise<void> => {
  if (users.length === 0) return;
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');

    let error: DOMException | null = null;

    users.forEach(user => {
      try {
        const request = store.put(user);
        // 🚨 CRITICAL FIX: Capturar erros assíncronos de escrita (ex: ConstraintError)
        request.onerror = () => {
          safeWarn(`❌ Falha ao salvar usuário ${user.id}:`, request.error);
          error = request.error;
        };
      } catch (e) {
        error = e as DOMException;
      }
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(error || transaction.error);
  });
};

export const deleteUser = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// ===== OBRAS =====
export const getObras = async (): Promise<Obra[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['obras'], 'readonly');
    const store = transaction.objectStore('obras');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getObraById = async (id: string): Promise<Obra | undefined> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['obras'], 'readonly');
    const store = transaction.objectStore('obras');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveObra = async (obra: Obra): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['obras'], 'readwrite');
    const store = transaction.objectStore('obras');
    const request = store.put(obra);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const saveBatchObras = async (obras: Obra[]): Promise<void> => {
  if (obras.length === 0) return;
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['obras'], 'readwrite');
    const store = transaction.objectStore('obras');

    let error: DOMException | null = null;

    obras.forEach(obra => {
      try {
        const request = store.put(obra);
        // 🚨 CRITICAL FIX: Capturar erros assíncronos de escrita
        request.onerror = () => {
          safeWarn(`❌ Falha ao salvar obra ${obra.id}:`, request.error);
          error = request.error;
        };
      } catch (e) {
        error = e as DOMException;
      }
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(error || transaction.error);
  });
};

export const deleteObra = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['obras'], 'readwrite');
    const store = transaction.objectStore('obras');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// ===== FORMS =====
export const getFormByObraId = async (obraId: string): Promise<FormData | undefined> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['forms'], 'readonly');
    const store = transaction.objectStore('forms');
    const request = store.get(obraId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// 🚀 PERFORMANCE: Batch loading - busca todos os formulários de uma vez
export const getAllForms = async (): Promise<FormData[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['forms'], 'readonly');
    const store = transaction.objectStore('forms');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const saveForm = async (form: FormData): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['forms'], 'readwrite');
    const store = transaction.objectStore('forms');

    // ✅ CORREÇÃO: KeyPath agora é obra_id (não precisa mais normalizar)
    if (!form.obra_id) {
      const error = new Error('FormData deve ter obra_id definido');
      safeWarn(`❌ Erro ao salvar formulário: obra_id ausente`, error);
      reject(error);
      return;
    }

    safeLog(`💾 Salvando formulário no IndexedDB:`, {
      obra_id: form.obra_id,
      formId: (form as any).id,
      status: form.status
    });

    const request = store.put(form);

    request.onsuccess = () => {
      safeLog(`✅ Formulário salvo no IndexedDB com chave: ${form.obra_id}`);
      resolve();
    };
    request.onerror = () => {
      safeWarn(`❌ Erro ao salvar formulário no IndexedDB:`, request.error);
      reject(request.error);
    };
  });
};

// 🆕 CORREÇÃO URGENTE #1: Deletar formulário associado a uma obra
export const deleteForm = async (obraId: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['forms'], 'readwrite');
    const store = transaction.objectStore('forms');
    const request = store.delete(obraId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// ===== CONFIG =====
export const getConfig = async (key: string): Promise<any> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['config'], 'readonly');
    const store = transaction.objectStore('config');
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
};

export const saveConfig = async (key: string, value: any): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['config'], 'readwrite');
    const store = transaction.objectStore('config');
    const request = store.put({ key, value });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Inicializar dados de exemplo
export const seedInitialData = async (): Promise<void> => {
  const users = await getUsers();

  // ✅ REMOVIDO: Não criar mais usuários de exemplo automaticamente
  // Os usuários devem ser criados via interface de administração
  if (users.length === 0) {
    console.log('ℹ️ Nenhum usuário encontrado. Use a interface de administração para criar usuários.');
  }
};