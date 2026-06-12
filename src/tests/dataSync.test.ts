import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock da camada de IndexedDB — mergeObras/mergeUsers persistem em lote.
const saveBatchObras = vi.fn().mockResolvedValue(undefined);
const saveBatchUsers = vi.fn().mockResolvedValue(undefined);
vi.mock('../app/utils/database', () => ({
  saveObra: vi.fn().mockResolvedValue(undefined),
  saveUser: vi.fn().mockResolvedValue(undefined),
  saveBatchObras: (...args: any[]) => saveBatchObras(...args),
  saveBatchUsers: (...args: any[]) => saveBatchUsers(...args),
}));

import {
  normalizeFormularioFromBackend,
  detectConflicts,
  mergeObras,
  mergeUsers,
} from '../app/utils/dataSync';

beforeEach(() => {
  saveBatchObras.mockClear();
  saveBatchUsers.mockClear();
});

describe('normalizeFormularioFromBackend', () => {
  it('preserva o id do backend (necessário para o link público e revogação)', () => {
    const result = normalizeFormularioFromBackend({
      id: 'form-123',
      obra_id: 'obra-1',
    });
    expect(result.id).toBe('form-123');
    expect(result.obra_id).toBe('obra-1');
  });

  it('preserva os campos de controle do link do preposto', () => {
    const expira = Date.now() + 1000;
    const result = normalizeFormularioFromBackend({
      id: 'f1',
      obra_id: 'o1',
      linkPrepostoExpiraEm: expira,
      linkPrepostoRevogado: true,
      linkPrepostoRevogadoEm: 123,
    });
    expect(result.linkPrepostoExpiraEm).toBe(expira);
    expect(result.linkPrepostoRevogado).toBe(true);
    expect(result.linkPrepostoRevogadoEm).toBe(123);
  });

  it('aceita obra_id em camelCase (obraId) como fallback', () => {
    const result = normalizeFormularioFromBackend({ id: 'f1', obraId: 'o9' });
    expect(result.obra_id).toBe('o9');
  });

  it('converte campos snake_case do backend para camelCase', () => {
    const result = normalizeFormularioFromBackend({
      id: 'f1',
      obra_id: 'o1',
      preposto_confirmado: true,
      nome_completo_preposto: 'João',
      status_preposto: 'aprovado',
    });
    expect(result.prepostoConfirmado).toBe(true);
    expect(result.nomeCompletoPreposto).toBe('João');
    expect(result.statusPreposto).toBe('aprovado');
  });

  it('usa status "novo" como padrão quando ausente', () => {
    const result = normalizeFormularioFromBackend({ id: 'f1', obra_id: 'o1' });
    expect(result.status).toBe('novo');
  });
});

describe('detectConflicts', () => {
  it('não há conflito quando não existe versão local', () => {
    expect(detectConflicts(undefined, { id: 'x', updatedAt: 100 })).toBe(false);
  });

  it('detecta conflito quando ambos foram atualizados em janela < 5s', () => {
    const local = { id: 'x', updatedAt: 1000 };
    const remote = { id: 'x', updatedAt: 3000 };
    expect(detectConflicts(local, remote)).toBe(true);
  });

  it('não há conflito quando a diferença é >= 5s', () => {
    const local = { id: 'x', updatedAt: 1000 };
    const remote = { id: 'x', updatedAt: 7000 };
    expect(detectConflicts(local, remote)).toBe(false);
  });

  it('não há conflito quando os timestamps são idênticos (diff = 0)', () => {
    const local = { id: 'x', updatedAt: 1000 };
    const remote = { id: 'x', updatedAt: 1000 };
    expect(detectConflicts(local, remote)).toBe(false);
  });
});

describe('mergeObras (estratégia backend-vence)', () => {
  it('o backend sobrescreve o local quando tem updatedAt maior', async () => {
    const local = [{ id: 'o1', cliente: 'LOCAL', updatedAt: 100 } as any];
    const remote = [{ id: 'o1', cliente: 'REMOTO', updated_at: '2026-01-01T00:00:00Z' }];

    const result = await mergeObras(local, remote);
    const o1 = result.find((o) => o.id === 'o1');
    expect(o1?.cliente).toBe('REMOTO');
  });

  it('mantém obras que existem apenas localmente', async () => {
    const local = [{ id: 'só-local', cliente: 'X', updatedAt: 100 } as any];
    const remote: any[] = [];

    const result = await mergeObras(local, remote);
    expect(result.find((o) => o.id === 'só-local')).toBeDefined();
  });

  it('persiste em lote as obras vindas do backend', async () => {
    await mergeObras([], [{ id: 'o1', cliente: 'A' }]);
    expect(saveBatchObras).toHaveBeenCalledTimes(1);
    expect(saveBatchObras.mock.calls[0][0]).toHaveLength(1);
  });

  it('não chama persistência em lote quando não há obras remotas', async () => {
    await mergeObras([{ id: 'x', updatedAt: 1 } as any], []);
    expect(saveBatchObras).not.toHaveBeenCalled();
  });
});

describe('mergeUsers (estratégia backend-vence)', () => {
  it('normaliza e mescla usuários do backend', async () => {
    const result = await mergeUsers([], [{ id: 'u1', nome: 'Ana', tipo: 'Encarregado' }]);
    const u1 = result.find((u) => u.id === 'u1');
    expect(u1?.nome).toBe('Ana');
    expect(saveBatchUsers).toHaveBeenCalledTimes(1);
  });
});
