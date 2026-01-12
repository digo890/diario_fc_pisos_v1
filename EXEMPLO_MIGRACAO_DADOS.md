# 🔄 EXEMPLO PRÁTICO - MIGRAÇÃO DE DADOS

> **Cenário Real:** Você mudou a estrutura de um campo e precisa migrar dados antigos

---

## 📖 CENÁRIO 1: Mudar Tipo de Dados

### **Situação:**
O campo `temperaturaMin` era `string`, agora você quer `number`.

### **❌ SOLUÇÃO ERRADA (Quebra dados antigos):**
```typescript
// /src/app/types/index.ts
export interface FormData {
  temperaturaMin: number; // ❌ ISSO VAI QUEBRAR!
}
```

**Resultado:** Formulários antigos terão `temperaturaMin: "25"` (string), causando erros de tipo.

---

### **✅ SOLUÇÃO CORRETA (Compatível com dados antigos):**

#### **PASSO 1: Criar campo novo (não remover o antigo)**
```typescript
// /src/app/types/index.ts
export interface FormData {
  /**
   * @deprecated Usar temperaturaMin_v2 (number) a partir de v1.2.0
   * Mantido para compatibilidade com formulários antigos
   */
  temperaturaMin?: string;
  
  temperaturaMin_v2?: number; // ✅ NOVO CAMPO
}
```

#### **PASSO 2: Atualizar formulário para usar novo campo**
```typescript
// /src/app/components/form-sections/CondicoesAmbientaisSection.tsx

// Usar novo campo, mas com fallback para antigo
const tempMin = formData.temperaturaMin_v2 
  ?? (formData.temperaturaMin ? Number(formData.temperaturaMin) : undefined);

<NumberInput
  label="Temperatura Mínima (°C)"
  value={tempMin?.toString() || ''}
  onChange={(value) => {
    const numValue = value ? Number(value) : undefined;
    updateFormData({ 
      temperaturaMin_v2: numValue, // ✅ Salvar no novo
      temperaturaMin: value // ✅ Manter sincronizado com antigo
    });
  }}
  placeholder="Ex: 18"
/>
```

#### **PASSO 3: Atualizar visualização**
```typescript
// /src/app/components/ViewRespostasModal.tsx

const tempMin = formData.temperaturaMin_v2 
  ?? (formData.temperaturaMin ? Number(formData.temperaturaMin) : null);

{tempMin !== null && (
  <div>
    <p>Temperatura Mínima: {tempMin}°C</p>
  </div>
)}
```

#### **PASSO 4: Atualizar PDF/Excel**
```typescript
// /src/app/utils/pdfGenerator.ts

const tempMin = formData.temperaturaMin_v2 
  ?? (formData.temperaturaMin ? Number(formData.temperaturaMin) : null);

if (tempMin !== null) {
  doc.text(`Temperatura Mínima: ${tempMin}°C`, x, y);
}
```

#### **PASSO 5: Adicionar migração automática no carregamento**
```typescript
// /src/app/utils/database.ts

export const loadFormData = async (obraId: string): Promise<FormData | null> => {
  const db = await getDB();
  const data = await db.get('forms', obraId);
  
  if (!data) return null;
  
  // ✅ MIGRAÇÃO AUTOMÁTICA
  if (data.temperaturaMin && !data.temperaturaMin_v2) {
    data.temperaturaMin_v2 = Number(data.temperaturaMin);
    // Salvar migração
    await db.put('forms', data);
  }
  
  return data;
};
```

#### **RESULTADO:**
- ✅ Formulários novos usam `temperaturaMin_v2` (number)
- ✅ Formulários antigos migram automaticamente ao carregar
- ✅ Nada quebra durante a transição
- ✅ Após 2 versões, pode remover `temperaturaMin` (opcional)

---

## 📖 CENÁRIO 2: Renomear Campo

### **Situação:**
Você quer renomear `espessura` para `espessuraCamada` (mais descritivo).

### **❌ SOLUÇÃO ERRADA:**
```typescript
export interface FormData {
  espessuraCamada: string; // ❌ Onde está "espessura"?
}
```

**Resultado:** Todos os formulários antigos perdem o valor de "espessura".

---

### **✅ SOLUÇÃO CORRETA:**

#### **PASSO 1: Adicionar novo campo sem remover o antigo**
```typescript
// /src/app/types/index.ts
export interface FormData {
  /**
   * @deprecated Usar espessuraCamada a partir de v1.2.0
   */
  espessura?: string;
  
  espessuraCamada?: string; // ✅ NOVO NOME
}
```

#### **PASSO 2: Sincronizar ambos os campos no formulário**
```typescript
// /src/app/components/form-sections/DadosObraSection.tsx

<NumberInput
  label="Espessura da Camada (mm)"
  value={formData.espessuraCamada || formData.espessura || ''}
  onChange={(value) => {
    updateFormData({
      espessuraCamada: value, // ✅ Novo campo
      espessura: value // ✅ Manter antigo sincronizado
    });
  }}
/>
```

#### **PASSO 3: Usar novo campo preferencial em todo código**
```typescript
// Visualização, PDF, Excel:
const espessura = formData.espessuraCamada || formData.espessura;

if (espessura) {
  // ... usar valor
}
```

#### **PASSO 4: Migração automática**
```typescript
// /src/app/utils/database.ts

export const loadFormData = async (obraId: string): Promise<FormData | null> => {
  const db = await getDB();
  const data = await db.get('forms', obraId);
  
  if (!data) return null;
  
  // ✅ Migrar nome antigo para novo
  if (data.espessura && !data.espessuraCamada) {
    data.espessuraCamada = data.espessura;
    await db.put('forms', data);
  }
  
  return data;
};
```

#### **PASSO 5: Após 2 versões, depreciar completamente**
```typescript
// v1.4.0 - Pode remover "espessura" do tipo (mas não precisa)
export interface FormData {
  espessuraCamada?: string;
  // espessura?: string; ← Removido (ou manter comentado)
}
```

---

## 📖 CENÁRIO 3: Dividir Campo em Múltiplos

### **Situação:**
O campo `endereco` era apenas texto, agora você quer separar em `rua`, `numero`, `bairro`, `cidade`.

### **✅ SOLUÇÃO:**

#### **PASSO 1: Adicionar novos campos**
```typescript
export interface FormData {
  /**
   * @deprecated Separado em rua, numero, bairro, cidade a partir de v1.3.0
   */
  endereco?: string;
  
  // Novos campos específicos
  enderecoRua?: string;
  enderecoNumero?: string;
  enderecoBairro?: string;
  enderecoCidade?: string;
}
```

#### **PASSO 2: Tentar parsear endereço antigo (best effort)**
```typescript
// /src/app/utils/database.ts

const parseEnderecoAntigo = (endereco: string) => {
  // Tentar dividir (exemplo básico)
  const partes = endereco.split(',').map(p => p.trim());
  return {
    rua: partes[0] || '',
    numero: partes[1] || '',
    bairro: partes[2] || '',
    cidade: partes[3] || '',
  };
};

export const loadFormData = async (obraId: string): Promise<FormData | null> => {
  const db = await getDB();
  const data = await db.get('forms', obraId);
  
  if (!data) return null;
  
  // Migração de endereço
  if (data.endereco && !data.enderecoRua) {
    const parsed = parseEnderecoAntigo(data.endereco);
    data.enderecoRua = parsed.rua;
    data.enderecoNumero = parsed.numero;
    data.enderecoBairro = parsed.bairro;
    data.enderecoCidade = parsed.cidade;
    await db.put('forms', data);
  }
  
  return data;
};
```

#### **PASSO 3: Formulário usa campos separados**
```typescript
<div className="grid grid-cols-2 gap-4">
  <input
    label="Rua"
    value={formData.enderecoRua || ''}
    onChange={(e) => updateFormData({ enderecoRua: e.target.value })}
  />
  <input
    label="Número"
    value={formData.enderecoNumero || ''}
    onChange={(e) => updateFormData({ enderecoNumero: e.target.value })}
  />
</div>
```

---

## 📖 CENÁRIO 4: Adicionar Sistema de Versionamento

### **Implementação Completa de Schema Versioning:**

#### **PASSO 1: Adicionar versão ao FormData**
```typescript
// /src/app/types/index.ts

export const CURRENT_SCHEMA_VERSION = 3; // ✅ Incrementar ao mudar estrutura

export interface FormData {
  schemaVersion?: number; // undefined = v1, 1 = v1, 2 = v2, etc.
  
  // ... campos
}
```

#### **PASSO 2: Criar sistema de migrações**
```typescript
// /src/app/utils/migrations.ts

import { FormData, CURRENT_SCHEMA_VERSION } from '../types';

type Migration = (data: any) => any;

const migrations: { [version: number]: Migration } = {
  // Migração v1 → v2
  2: (data: any) => {
    console.log('🔄 Migrando de v1 para v2...');
    
    // Exemplo: temperaturaMin string → number
    if (data.temperaturaMin && typeof data.temperaturaMin === 'string') {
      data.temperaturaMin_v2 = Number(data.temperaturaMin);
    }
    
    data.schemaVersion = 2;
    return data;
  },
  
  // Migração v2 → v3
  3: (data: any) => {
    console.log('🔄 Migrando de v2 para v3...');
    
    // Exemplo: renomear espessura → espessuraCamada
    if (data.espessura && !data.espessuraCamada) {
      data.espessuraCamada = data.espessura;
    }
    
    data.schemaVersion = 3;
    return data;
  },
};

/**
 * Migra dados para a versão mais recente
 */
export const migrateFormData = (data: any): FormData => {
  const currentVersion = data.schemaVersion || 1;
  
  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    return data; // Já está atualizado
  }
  
  console.log(`🔄 Migrando FormData de v${currentVersion} para v${CURRENT_SCHEMA_VERSION}`);
  
  let migratedData = { ...data };
  
  // Aplicar migrações sequencialmente
  for (let version = currentVersion + 1; version <= CURRENT_SCHEMA_VERSION; version++) {
    if (migrations[version]) {
      migratedData = migrations[version](migratedData);
    }
  }
  
  return migratedData as FormData;
};
```

#### **PASSO 3: Aplicar migrações ao carregar**
```typescript
// /src/app/utils/database.ts

import { migrateFormData } from './migrations';

export const loadFormData = async (obraId: string): Promise<FormData | null> => {
  const db = await getDB();
  const data = await db.get('forms', obraId);
  
  if (!data) return null;
  
  // ✅ Migrar automaticamente
  const migratedData = migrateFormData(data);
  
  // Salvar se foi migrado
  if (migratedData.schemaVersion !== data.schemaVersion) {
    await db.put('forms', migratedData);
    console.log('✅ FormData migrado e salvo');
  }
  
  return migratedData;
};
```

#### **PASSO 4: Definir versão ao criar novo formulário**
```typescript
// /src/app/components/FormularioPage.tsx

import { CURRENT_SCHEMA_VERSION } from '../types';

const criarNovoFormulario = (): FormData => {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION, // ✅ Versão atual
    obraId: obra.id,
    clima: {},
    // ... outros campos
  };
};
```

#### **RESULTADO:**
- ✅ Cada formulário sabe sua versão de schema
- ✅ Migrações aplicadas automaticamente ao carregar
- ✅ Migrações salvas no IndexedDB
- ✅ Fácil rastrear mudanças entre versões

---

## 📖 CENÁRIO 5: Remover Campo Deprecado

### **Situação:**
Você deprecou `ucrete` há 2 versões e agora quer remover.

### **✅ CHECKLIST ANTES DE REMOVER:**

- [ ] Campo está marcado `@deprecated` há pelo menos 2 versões
- [ ] Nenhum código de produção ainda o utiliza
- [ ] Migração de dados foi implementada
- [ ] Todos os formulários antigos foram migrados

### **PASSO 1: Verificar uso no código**
```bash
# Buscar referências ao campo
grep -r "ucrete" src/
```

Se retornar apenas o tipo e comentários deprecados, é seguro remover.

### **PASSO 2: Remover do tipo**
```typescript
// /src/app/types/index.ts

export interface FormData {
  // ucrete?: string; ← REMOVIDO (era @deprecated)
  
  // Outros campos...
}
```

### **PASSO 3: Manter migração (para formulários muito antigos)**
```typescript
// /src/app/utils/migrations.ts

// Na migração da versão que removeu o campo:
4: (data: any) => {
  console.log('🔄 Migrando de v3 para v4...');
  
  // Remover campo antigo se ainda existir
  if (data.ucrete) {
    delete data.ucrete;
    console.log('🗑️ Campo "ucrete" removido (deprecado)');
  }
  
  data.schemaVersion = 4;
  return data;
},
```

---

## 🛡️ TESTES DE MIGRAÇÃO

### **Script de Teste Manual:**

```typescript
// Criar arquivo temporário: /src/app/utils/testMigrations.ts

import { migrateFormData } from './migrations';

// Simular dados antigos (v1)
const dadosV1 = {
  // schemaVersion não definido = v1
  obraId: 'teste123',
  temperaturaMin: '25', // string (antigo)
  espessura: '10', // nome antigo
  ucrete: 'Sim', // campo deprecado
  // ... outros campos
};

// Testar migração
console.log('📦 Dados v1:', dadosV1);

const dadosMigrados = migrateFormData(dadosV1);

console.log('✅ Dados migrados:', dadosMigrados);
console.log('🔢 Versão final:', dadosMigrados.schemaVersion);

// Verificar:
// - temperaturaMin_v2 deve ser number
// - espessuraCamada deve ter valor de espessura
// - ucrete deve estar removido
// - schemaVersion deve ser CURRENT_SCHEMA_VERSION
```

### **Executar teste:**
```typescript
// Temporariamente importar no App.tsx
import './utils/testMigrations';

// Abrir console do navegador (F12)
// Verificar logs de migração
```

---

## 📊 REGISTRO DE MIGRAÇÕES (Manter histórico)

```typescript
// /src/app/utils/MIGRATION_HISTORY.md

# Histórico de Migrações - FormData Schema

## v1.0.0 → v1.1.0 (Schema v1 → v2)
**Data:** 2026-01-15
**Alterações:**
- `temperaturaMin`: string → number (novo campo: temperaturaMin_v2)
- `temperaturaMax`: string → number (novo campo: temperaturaMax_v2)

**Migração:**
- Converte strings para numbers
- Mantém campos antigos por compatibilidade

---

## v1.1.0 → v1.2.0 (Schema v2 → v3)
**Data:** 2026-02-10
**Alterações:**
- `espessura` → `espessuraCamada` (renomeado)
- `rodape` → `rodapeAltura` (renomeado)

**Migração:**
- Copia valores para novos nomes
- Campos antigos marcados @deprecated

---

## v1.2.0 → v1.3.0 (Schema v3 → v4)
**Data:** 2026-03-05
**Alterações:**
- `ucrete` removido (deprecado desde v1.0.0)
- `endereco` dividido em rua/numero/bairro/cidade

**Migração:**
- Remove ucrete completamente
- Tenta parsear endereco em partes
```

---

## ✅ CHECKLIST DE MIGRAÇÃO SEGURA

Antes de fazer deploy de uma migração:

- [ ] Migração testada localmente com dados antigos
- [ ] Migração testada com dados de todas as versões anteriores
- [ ] Rollback plan definido
- [ ] Backup de produção realizado (se aplicável)
- [ ] Logs de migração implementados
- [ ] Usuários avisados sobre possíveis mudanças
- [ ] Teste em ambiente de staging primeiro
- [ ] Migração é **idempotente** (pode rodar múltiplas vezes sem problemas)
- [ ] Migração preserva dados originais (não deleta sem copiar)
- [ ] Documentação atualizada (MIGRATION_HISTORY)

---

## 🚨 QUANDO NÃO MIGRAR

**NÃO implemente migrações se:**
- Sistema ainda não tem dados de produção
- Mudança é apenas cosmética (labels, UI)
- É possível fazer mudança sem quebrar estrutura
- Mudança pode ser feita com campos opcionais apenas

**SEMPRE migre se:**
- Sistema já tem formulários salvos
- Mudança afeta tipos de dados
- Mudança remove/renomeia campos
- Mudança afeta sincronização Supabase

---

**Dúvidas?** Consulte `GUIA_MANUTENCAO_FORMULARIOS.md`
