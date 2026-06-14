// IndexedDB real (em memória) para o ambiente de teste.
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do módulo de API (importado dinamicamente dentro de processItem).
const { obraApi, userApi, formApi } = vi.hoisted(() => ({
  obraApi: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  userApi: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  formApi: { save: vi.fn() },
}));
vi.mock('../app/utils/api', () => ({ obraApi, userApi, formApi }));

import { syncQueue } from '../app/utils/syncQueue';

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });
}

async function clearQueue() {
  const items = await syncQueue.getAllItems();
  for (const it of items) await syncQueue.removeItem(it.id);
}

const ok = { success: true };
const fail = { success: false };

beforeEach(async () => {
  vi.clearAllMocks();
  // Padrão: todas as operações de API têm sucesso (cada teste sobrescreve).
  obraApi.create.mockResolvedValue(ok);
  obraApi.update.mockResolvedValue(ok);
  obraApi.delete.mockResolvedValue(ok);
  userApi.create.mockResolvedValue(ok);
  userApi.update.mockResolvedValue(ok);
  userApi.delete.mockResolvedValue(ok);
  formApi.save.mockResolvedValue(ok);
  setOnline(true);
  await clearQueue();
});

describe('syncQueue — enfileiramento', () => {
  it('enqueue cria um item pendente com retries 0', async () => {
    setOnline(false); // evita auto-processamento ao enfileirar
    const id = await syncQueue.enqueue('create_obra', 'obra-1', { cliente: 'X' });
    expect(typeof id).toBe('string');

    const pendentes = await syncQueue.getPendingItems();
    expect(pendentes).toHaveLength(1);
    expect(pendentes[0]).toMatchObject({
      operation: 'create_obra',
      entityId: 'obra-1',
      status: 'pending',
      retries: 0,
    });
  });
});

describe('syncQueue — processamento com sucesso', () => {
  it('sincroniza e remove o item da fila', async () => {
    setOnline(false);
    await syncQueue.enqueue('create_obra', 'obra-1', { cliente: 'X' });
    setOnline(true);

    await syncQueue.processQueue();

    expect(obraApi.create).toHaveBeenCalledWith({ cliente: 'X' });
    expect(await syncQueue.getAllItems()).toHaveLength(0);
  });

  it('roteia cada operação para a API correta', async () => {
    setOnline(false);
    await syncQueue.enqueue('update_obra', 'obra-9', { nome: 'N' });
    await syncQueue.enqueue('delete_user', 'user-7', {});
    await syncQueue.enqueue('update_form', 'obra-3', { area: '10' });
    setOnline(true);

    await syncQueue.processQueue();

    expect(obraApi.update).toHaveBeenCalledWith('obra-9', { nome: 'N' });
    expect(userApi.delete).toHaveBeenCalledWith('user-7');
    expect(formApi.save).toHaveBeenCalledWith('obra-3', { area: '10' });
    expect(await syncQueue.getAllItems()).toHaveLength(0);
  });

  it('send_email é tratado como sucesso sem chamar API', async () => {
    setOnline(false);
    await syncQueue.enqueue('send_email', 'form-1', { to: 'a@b.com' });
    setOnline(true);

    await syncQueue.processQueue();

    expect(await syncQueue.getAllItems()).toHaveLength(0);
  });

  it('processa em ordem cronológica (menor timestamp primeiro)', async () => {
    const ordem: string[] = [];
    obraApi.create.mockImplementation(async (data: any) => {
      ordem.push(data.tag);
      return ok;
    });

    setOnline(false);
    const idA = await syncQueue.enqueue('create_obra', 'a', { tag: 'A' });
    const idB = await syncQueue.enqueue('create_obra', 'b', { tag: 'B' });
    // Força B mais antigo que A
    await syncQueue.updateItem(idA, { timestamp: 2000 });
    await syncQueue.updateItem(idB, { timestamp: 1000 });
    setOnline(true);

    await syncQueue.processQueue();
    expect(ordem).toEqual(['B', 'A']);
  });
});

describe('syncQueue — falhas e retries', () => {
  it('reagenda com retry e marca como failed após o máximo de tentativas', async () => {
    obraApi.create.mockResolvedValue(fail); // backend rejeita

    setOnline(false);
    await syncQueue.enqueue('create_obra', 'obra-1', { cliente: 'X' });
    setOnline(true);

    // 1ª tentativa → pending (retries 1)
    await syncQueue.processQueue();
    let items = await syncQueue.getAllItems();
    expect(items[0]).toMatchObject({ status: 'pending', retries: 1 });

    // 2ª → retries 2
    await syncQueue.processQueue();
    items = await syncQueue.getAllItems();
    expect(items[0].retries).toBe(2);

    // 3ª → failed
    await syncQueue.processQueue();
    expect(await syncQueue.getFailedCount()).toBe(1);
    expect(await syncQueue.getPendingCount()).toBe(0);
  });

  it('🔐 401 (sessão expirada) NÃO incrementa o contador de retries', async () => {
    obraApi.create.mockRejectedValue(new Error('401 Unauthorized'));

    setOnline(false);
    await syncQueue.enqueue('create_obra', 'obra-1', { cliente: 'X' });
    setOnline(true);

    // Várias passagens não devem aumentar retries nem marcar como failed
    await syncQueue.processQueue();
    await syncQueue.processQueue();
    await syncQueue.processQueue();

    const items = await syncQueue.getAllItems();
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('pending');
    expect(items[0].retries).toBe(0);
    expect(await syncQueue.getFailedCount()).toBe(0);
  });

  it('não processa quando offline', async () => {
    setOnline(false);
    await syncQueue.enqueue('create_obra', 'obra-1', { cliente: 'X' });

    await syncQueue.processQueue(); // continua offline

    expect(obraApi.create).not.toHaveBeenCalled();
    expect(await syncQueue.getPendingCount()).toBe(1);
  });
});

describe('syncQueue — recuperação e limpeza', () => {
  it('retryFailedItems volta itens failed para pending com retries 0', async () => {
    setOnline(false);
    const id = await syncQueue.enqueue('create_obra', 'obra-1', { cliente: 'X' });
    await syncQueue.updateItem(id, { status: 'failed', retries: 3, lastError: 'erro' });

    await syncQueue.retryFailedItems();

    const items = await syncQueue.getAllItems();
    expect(items[0]).toMatchObject({ status: 'pending', retries: 0 });
    expect(items[0].lastError).toBeUndefined();
  });

  it('cleanupOldItems remove sucessos antigos e preserva os recentes', async () => {
    setOnline(false);
    const antigo = await syncQueue.enqueue('create_obra', 'velha', {});
    const recente = await syncQueue.enqueue('create_obra', 'nova', {});
    const oitoDias = Date.now() - 8 * 24 * 60 * 60 * 1000;
    await syncQueue.updateItem(antigo, { status: 'success', timestamp: oitoDias });
    await syncQueue.updateItem(recente, { status: 'success', timestamp: Date.now() });

    await syncQueue.cleanupOldItems();

    const restantes = await syncQueue.getAllItems();
    expect(restantes).toHaveLength(1);
    expect(restantes[0].entityId).toBe('nova');
  });
});
