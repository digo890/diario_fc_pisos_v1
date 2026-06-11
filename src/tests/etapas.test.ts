import { describe, it, expect } from 'vitest';
import { ETAPAS } from '../app/schema/etapas';

describe('ETAPAS (fonte única das etapas de execução)', () => {
  it('contém exatamente 34 itens (1-34)', () => {
    expect(ETAPAS).toHaveLength(34);
  });

  it('todos os itens têm label não vazio e único', () => {
    const labels = ETAPAS.map((e) => e.label);
    expect(labels.every((l) => typeof l === 'string' && l.length > 0)).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('mantém os 3 itens multiselect com suas options (contrato da tela de entrada)', () => {
    const multi = ETAPAS.filter((e) => e.isMultiSelect);
    expect(multi.map((e) => e.label)).toEqual([
      'Aplicação de Uretano',
      'Serviços de pintura',
      'Serviços de pintura de layout',
    ]);
    expect(multi.map((e) => e.options)).toEqual(['ucrete', 'pintura', 'pinturaLayout']);
  });

  it('itens dual-field têm exatamente 2 unidades', () => {
    const dual = ETAPAS.filter((e) => e.isDualField);
    expect(dual.length).toBeGreaterThan(0);
    expect(dual.every((e) => e.units?.length === 2)).toBe(true);
  });

  it('nenhum item é dropdown (branch legado morto, mas o tipo permite)', () => {
    expect(ETAPAS.some((e) => e.isDropdown)).toBe(false);
  });
});
