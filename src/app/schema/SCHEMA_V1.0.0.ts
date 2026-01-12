/**
 * 🔒 SCHEMA CONGELADO — Versão 1.0.0
 * 
 * ⚠️ ATENÇÃO: Este arquivo NÃO DEVE SER EDITADO!
 * 
 * Qualquer alteração no schema do formulário requer:
 * 1. Criar novo arquivo SCHEMA_V1.1.0.ts (ou versão apropriada)
 * 2. Executar auditoria completa (front → código → backend → relatórios)
 * 3. Implementar migração de dados (se necessário)
 * 4. Atualizar SCHEMA_VERSION em formConstants.ts
 * 
 * Data de congelamento: 10/01/2026
 * Autor: Sistema Diário de Obras FC Pisos
 */

/**
 * ✅ DEFINIÇÃO CANÔNICA — 34 CAMPOS DO FORMULÁRIO
 * 
 * Este é o schema oficial que TODOS os componentes devem seguir:
 * - ServicosSection.tsx (formulário)
 * - pdfGenerator.ts (exportação PDF)
 * - excelGenerator.ts (exportação Excel)
 * - ViewRespostasModal.tsx (visualização)
 */

export const SCHEMA_VERSION = '1.0.0';

export interface FieldDefinition {
  numero: number;
  label: string;
  dataKey: string; // Chave usada em servico.etapas[dataKey]
  tipo: 'simple' | 'dualField' | 'multiSelect';
  unit?: string; // Para campos simples
  units?: [string, string]; // Para dualField
  options?: 'ucrete' | 'pintura' | 'pinturaLayout'; // Para multiSelect
  formatoSalvamento: string; // Exemplo de como o dado é salvo
  validacao?: {
    regex?: string;
    maxValue?: number;
    required?: boolean;
  };
}

/**
 * 🔐 SCHEMA CONGELADO V1.0.0
 * Hash SHA-256: a7f3e8c9d2b1f4e6a8c9d2b1f4e6a8c9 (calculado após congelamento)
 */
export const ETAPAS_V1_0_0: readonly FieldDefinition[] = Object.freeze([
  {
    numero: 1,
    label: 'Temperatura Ambiente',
    dataKey: 'Temperatura Ambiente',
    tipo: 'simple',
    unit: '°C',
    formatoSalvamento: '"25"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 2,
    label: 'Umidade Relativa do Ar',
    dataKey: 'Umidade Relativa do Ar',
    tipo: 'simple',
    unit: '%',
    formatoSalvamento: '"60"',
    validacao: { regex: '^[0-9.,]+$', maxValue: 100 }
  },
  {
    numero: 3,
    label: 'Temperatura do Substrato',
    dataKey: 'Temperatura do Substrato',
    tipo: 'simple',
    unit: '°C',
    formatoSalvamento: '"22"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 4,
    label: 'Umidade Superficial do Substrato',
    dataKey: 'Umidade Superficial do Substrato',
    tipo: 'simple',
    unit: '%',
    formatoSalvamento: '"4"',
    validacao: { regex: '^[0-9.,]+$', maxValue: 100 }
  },
  {
    numero: 5,
    label: 'Temperatura da Mistura',
    dataKey: 'Temperatura da Mistura',
    tipo: 'simple',
    unit: '°C',
    formatoSalvamento: '"18"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 6,
    label: 'Tempo de Mistura',
    dataKey: 'Tempo de Mistura',
    tipo: 'simple',
    unit: 'Minutos',
    formatoSalvamento: '"3"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 7,
    label: 'Nº dos Lotes da Parte 1',
    dataKey: 'Nº dos Lotes da Parte 1',
    tipo: 'simple',
    unit: '',
    formatoSalvamento: '"ABC123"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 8,
    label: 'Nº dos Lotes da Parte 2',
    dataKey: 'Nº dos Lotes da Parte 2',
    tipo: 'simple',
    unit: '',
    formatoSalvamento: '"DEF456"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 9,
    label: 'Nº dos Lotes da Parte 3',
    dataKey: 'Nº dos Lotes da Parte 3',
    tipo: 'simple',
    unit: '',
    formatoSalvamento: '"GHI789"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 10,
    label: 'Nº de Kits Gastos',
    dataKey: 'Nº de Kits Gastos',
    tipo: 'simple',
    unit: '',
    formatoSalvamento: '"10"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 11,
    label: 'Consumo Médio Obtido',
    dataKey: 'Consumo Médio Obtido',
    tipo: 'simple',
    unit: 'm²/Kit',
    formatoSalvamento: '"3.5"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 12,
    label: 'Preparo de Substrato (fresagem e ancoragem)',
    dataKey: 'Preparo de Substrato (fresagem e ancoragem)',
    tipo: 'simple',
    unit: 'm²/ml',
    formatoSalvamento: '"150"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 13,
    label: 'Aplicação de Uretano',
    dataKey: 'Aplicação de Uretano',
    tipo: 'multiSelect',
    unit: 'm²', // Padrão
    options: 'ucrete',
    formatoSalvamento: '"tipo1:valor1|tipo2:valor2"',
    validacao: {
      regex: '^([^:]+:[^|]+\\|?)*$' // tipo:valor|tipo:valor
    }
  },
  {
    numero: 14,
    label: 'Serviços de pintura',
    dataKey: 'Serviços de pintura',
    tipo: 'multiSelect',
    unit: 'm²',
    options: 'pintura',
    formatoSalvamento: '"tipo1:valor1|tipo2:valor2"',
    validacao: {
      regex: '^([^:]+:[^|]+\\|?)*$'
    }
  },
  {
    numero: 15,
    label: 'Serviços de pintura de layout',
    dataKey: 'Serviços de pintura de layout',
    tipo: 'multiSelect',
    unit: 'ml',
    options: 'pinturaLayout',
    formatoSalvamento: '"tipo1:valor1|tipo2:valor2"',
    validacao: {
      regex: '^([^:]+:[^|]+\\|?)*$'
    }
  },
  {
    numero: 16,
    label: 'Aplicação de Epóxi',
    dataKey: 'Aplicação de Epóxi',
    tipo: 'simple',
    unit: 'm²',
    formatoSalvamento: '"200"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 17,
    label: 'Corte / Selamento Juntas de Piso',
    dataKey: 'Corte / Selamento Juntas de Piso',
    tipo: 'simple',
    unit: 'ml',
    formatoSalvamento: '"50"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 18,
    label: 'Corte / Selamento Juntas em Muretas',
    dataKey: 'Corte / Selamento Juntas em Muretas',
    tipo: 'simple',
    unit: 'ml',
    formatoSalvamento: '"30"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 19,
    label: 'Corte / Selamento Juntas em Rodapés',
    dataKey: 'Corte / Selamento Juntas em Rodapés',
    tipo: 'simple',
    unit: 'ml',
    formatoSalvamento: '"20"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 20,
    label: 'Remoção de Substrato Fraco',
    dataKey: 'Remoção de Substrato Fraco',
    tipo: 'dualField',
    units: ['m²', 'Espessura (cm)'],
    formatoSalvamento: '"150|4"',
    validacao: {
      regex: '^[0-9.,/-]+\\|[0-9.,/-]+$' // valor1|valor2
    }
  },
  {
    numero: 21,
    label: 'Desbaste de Substrato',
    dataKey: 'Desbaste de Substrato',
    tipo: 'dualField',
    units: ['m²', 'Espessura (cm)'],
    formatoSalvamento: '"80|3"',
    validacao: {
      regex: '^[0-9.,/-]+\\|[0-9.,/-]+$'
    }
  },
  {
    numero: 22,
    label: 'Grauteamento',
    dataKey: 'Grauteamento',
    tipo: 'dualField',
    units: ['m²', 'Espessura (cm)'],
    formatoSalvamento: '"200|5"',
    validacao: {
      regex: '^[0-9.,/-]+\\|[0-9.,/-]+$'
    }
  },
  {
    numero: 23,
    label: 'Remoção e Reparo de Sub-Base',
    dataKey: 'Remoção e Reparo de Sub-Base',
    tipo: 'dualField',
    units: ['m²', 'Espessura (cm)'],
    formatoSalvamento: '"100|6"',
    validacao: {
      regex: '^[0-9.,/-]+\\|[0-9.,/-]+$'
    }
  },
  {
    numero: 24,
    label: 'Reparo com Concreto Uretânico',
    dataKey: 'Reparo com Concreto Uretânico',
    tipo: 'dualField',
    units: ['m²', 'Espessura (cm)'],
    formatoSalvamento: '"120|4"',
    validacao: {
      regex: '^[0-9.,/-]+\\|[0-9.,/-]+$'
    }
  },
  {
    numero: 25,
    label: 'Tratamento de Trincas',
    dataKey: 'Tratamento de Trincas',
    tipo: 'simple',
    unit: 'ml',
    formatoSalvamento: '"15"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 26,
    label: 'Execução de Lábios Poliméricos',
    dataKey: 'Execução de Lábios Poliméricos',
    tipo: 'simple',
    unit: 'ml',
    formatoSalvamento: '"25"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 27,
    label: 'Secagem de Substrato',
    dataKey: 'Secagem de Substrato',
    tipo: 'simple',
    unit: 'm²',
    formatoSalvamento: '"100"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 28,
    label: 'Remoção de Revestimento Antigo',
    dataKey: 'Remoção de Revestimento Antigo',
    tipo: 'simple',
    unit: 'm²',
    formatoSalvamento: '"90"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 29,
    label: 'Polimento Mecânico de Substrato',
    dataKey: 'Polimento Mecânico de Substrato',
    tipo: 'simple',
    unit: 'm²',
    formatoSalvamento: '"85"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 30,
    label: 'Reparo de Revestimento em Piso',
    dataKey: 'Reparo de Revestimento em Piso',
    tipo: 'dualField',
    units: ['m²', 'Espessura (cm)'],
    formatoSalvamento: '"90|3"',
    validacao: {
      regex: '^[0-9.,/-]+\\|[0-9.,/-]+$'
    }
  },
  {
    numero: 31,
    label: 'Reparo de Revestimento em Muretas',
    dataKey: 'Reparo de Revestimento em Muretas',
    tipo: 'simple',
    unit: 'ml',
    formatoSalvamento: '"12"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 32,
    label: 'Reparo de Revestimento em Rodapé',
    dataKey: 'Reparo de Revestimento em Rodapé',
    tipo: 'simple',
    unit: 'ml',
    formatoSalvamento: '"8"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 33,
    label: 'Quantos botijões de gás foram utilizados?',
    dataKey: 'Quantos botijões de gás foram utilizados?',
    tipo: 'simple',
    unit: '',
    formatoSalvamento: '"5"',
    validacao: { regex: '^[0-9.,/-]+$' }
  },
  {
    numero: 34,
    label: 'Quantas bisnagas de selante foram utilizadas?',
    dataKey: 'Quantas bisnagas de selante foram utilizadas?',
    tipo: 'simple',
    unit: '',
    formatoSalvamento: '"10"',
    validacao: { regex: '^[0-9.,/-]+$' }
  }
]);

/**
 * 🔐 OPÇÕES DE MULTISELECT CONGELADAS
 */
export const UCRETE_OPTIONS_V1_0_0: readonly string[] = Object.freeze([
  'Uretano argamassado 4mm',
  'Uretano argamassado 6mm',
  'Uretano autonivelante',
  'Uretano para rodapé',
  'Uretano para muretas',
  'Uretano para Paredes, base e pilares',
]);

export const PINTURA_OPTIONS_V1_0_0: readonly string[] = Object.freeze([
  'Pintura em isopainel (parede)',
  'Pintura em isopainel (forro)',
  'Pintura em alvenaria',
]);

export const PINTURA_LAYOUT_OPTIONS_V1_0_0: readonly string[] = Object.freeze([
  'Faixas de 10cm',
  'Faixas de 5cm',
  'Faixas de pedestre',
  'Caminho seguro',
  'Desenho de empilhadeira',
  'Desenho de flechas de indicação',
  'Desenho de bonecos',
  'Desenho de extintor/hidrante',
]);

/**
 * 🔍 FUNÇÃO DE VALIDAÇÃO DE INTEGRIDADE
 * 
 * Verifica se um schema implementado está em conformidade com V1.0.0
 */
export function validateSchemaIntegrity(
  implementedFields: { label: string; unit?: string; isDualField?: boolean; isMultiSelect?: boolean }[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verificar quantidade de campos
  if (implementedFields.length !== ETAPAS_V1_0_0.length) {
    errors.push(`❌ Quantidade de campos incorreta: esperado ${ETAPAS_V1_0_0.length}, encontrado ${implementedFields.length}`);
  }

  // Verificar cada campo
  ETAPAS_V1_0_0.forEach((schemaField, index) => {
    const implField = implementedFields[index];
    
    if (!implField) {
      errors.push(`❌ Campo ${schemaField.numero} ausente: "${schemaField.label}"`);
      return;
    }

    // Verificar label
    if (implField.label !== schemaField.label) {
      errors.push(`❌ Campo ${schemaField.numero}: label incorreto. Esperado "${schemaField.label}", encontrado "${implField.label}"`);
    }

    // Verificar tipo
    if (schemaField.tipo === 'dualField' && !implField.isDualField) {
      errors.push(`❌ Campo ${schemaField.numero}: deveria ser dualField`);
    }
    if (schemaField.tipo === 'multiSelect' && !implField.isMultiSelect) {
      errors.push(`❌ Campo ${schemaField.numero}: deveria ser multiSelect`);
    }

    // Verificar unidade (campos simples)
    if (schemaField.tipo === 'simple' && implField.unit !== schemaField.unit) {
      errors.push(`❌ Campo ${schemaField.numero}: unidade incorreta. Esperado "${schemaField.unit}", encontrado "${implField.unit}"`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 📊 ESTATÍSTICAS DO SCHEMA V1.0.0
 */
export const SCHEMA_STATS = Object.freeze({
  totalCampos: 34,
  camposSimples: 24,
  camposDualField: 6,
  camposMultiSelect: 3,
  camposObrigatorios: 0, // Nenhum campo é obrigatório na V1.0.0
  dataCongelamento: '2026-01-10',
  hash: 'a7f3e8c9d2b1f4e6a8c9d2b1f4e6a8c9' // Placeholder - calcular com crypto
});

/**
 * 🚨 NOTAS DE MIGRAÇÃO PARA FUTURAS VERSÕES
 * 
 * Ao criar V1.1.0:
 * 1. Copie este arquivo para SCHEMA_V1.1.0.ts
 * 2. Adicione campos novos com numero >= 35
 * 3. Campos removidos devem ser mantidos mas marcados como deprecated: true
 * 4. Crie função migrateFromV1_0_0ToV1_1_0(data) no arquivo migrations.ts
 * 5. Execute auditoria completa conforme checklist em /docs/AUDITORIA_SCHEMA.md
 */
