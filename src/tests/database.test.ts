// Fornece um IndexedDB real (em memória) para o ambiente de teste.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import {
  saveBatchObras,
  saveBatchForms,
  saveBatchUsers,
  getObras,
  getAllForms,
  getUsers,
} from '../app/utils/database';

const makeForm = (obra_id: string | undefined, extra: Record<string, any> = {}) =>
  ({
    obra_id,
    clima: {},
    servicos: {},
    registros: {},
    status: 'novo',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'tester',
    ...extra,
  }) as any;

describe('saveBatch — gravação em lote atômica', () => {
  it('array vazio resolve sem erro e sem efeitos', async () => {
    await expect(saveBatchObras([])).resolves.toBeUndefined();
  });

  it('persiste todos os itens válidos numa única transação', async () => {
    await saveBatchObras([
      { id: 'o-a', cliente: 'A', updatedAt: 1 } as any,
      { id: 'o-b', cliente: 'B', updatedAt: 1 } as any,
    ]);
    const obras = await getObras();
    const ids = obras.map((o) => o.id);
    expect(ids).toContain('o-a');
    expect(ids).toContain('o-b');
  });

  it('rejeita o lote inteiro se algum item for inválido (sem id)', async () => {
    await expect(
      saveBatchObras([
        { id: 'o-valida', cliente: 'OK', updatedAt: 1 } as any,
        { cliente: 'SEM_ID', updatedAt: 1 } as any, // inválida
      ]),
    ).rejects.toThrow();
  });

  it('NÃO persiste nenhum item quando o lote é rejeitado por validação (atomicidade)', async () => {
    const antes = (await getObras()).map((o) => o.id);
    await saveBatchObras([
      { id: 'nao-deve-entrar', cliente: 'X', updatedAt: 1 } as any,
      { cliente: 'invalida' } as any,
    ]).catch(() => {});
    const depois = (await getObras()).map((o) => o.id);
    expect(depois).toEqual(antes);
    expect(depois).not.toContain('nao-deve-entrar');
  });

  it('saveBatchForms rejeita quando um formulário não tem obra_id', async () => {
    await expect(
      saveBatchForms([makeForm('obra-ok'), makeForm(undefined)]),
    ).rejects.toThrow(/obra_id/);
  });

  it('saveBatchForms persiste formulários válidos', async () => {
    await saveBatchForms([makeForm('obra-form-1'), makeForm('obra-form-2')]);
    const forms = await getAllForms();
    const ids = forms.map((f) => f.obra_id);
    expect(ids).toContain('obra-form-1');
    expect(ids).toContain('obra-form-2');
  });

  it('saveBatchUsers persiste usuários válidos', async () => {
    await saveBatchUsers([
      { id: 'u-1', nome: 'Ana', tipo: 'Encarregado', email: 'a@x.com' } as any,
    ]);
    const users = await getUsers();
    expect(users.map((u) => u.id)).toContain('u-1');
  });
});
