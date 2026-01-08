// IndexedDB para persistência offline
import type { User, Obra, FormData } from '../types';

const DB_NAME = 'DiarioObrasDB';
const DB_VERSION = 2; // ✅ Incrementar versão para adicionar syncQueue

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

      // Store de formulários
      if (!database.objectStoreNames.contains('forms')) {
        const formStore = database.createObjectStore('forms', { keyPath: 'obraId' });
        formStore.createIndex('status', 'status', { unique: false });
        formStore.createIndex('createdBy', 'createdBy', { unique: false });
      }

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
    const request = store.put(form);

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
  
  if (users.length === 0) {
    // Criar admin padrão
    await saveUser({
      id: 'admin-1',
      nome: 'Administrador',
      tipo: 'Administrador',
      email: 'admin@fcpisos.com.br',
      telefone: '',
      createdAt: Date.now()
    });

    // Criar encarregado de exemplo
    await saveUser({
      id: 'enc-1',
      nome: 'João Silva',
      tipo: 'Encarregado',
      email: 'joao@fcpisos.com.br',
      telefone: '(11) 98765-4321',
      createdAt: Date.now()
    });
  }
};