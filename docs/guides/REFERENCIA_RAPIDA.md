# ⚡ REFERÊNCIA RÁPIDA - MANUTENÇÃO DE FORMULÁRIOS

> **Consulta rápida para modificações comuns**

---

## 📝 ADICIONAR CAMPO SIMPLES

### **3 PASSOS ESSENCIAIS:**

#### **1. Tipo (types/index.ts):**
```typescript
export interface FormData {
  novoCampo?: string; // ⚠️ SEMPRE opcional
}
```

#### **2. Formulário (form-sections/*.tsx):**
```typescript
<input
  value={formData.novoCampo || ''}
  onChange={(e) => updateFormData({ novoCampo: e.target.value })}
/>
```

#### **3. Visualização (ViewRespostasModal.tsx):**
```typescript
{formData.novoCampo && (
  <p>Novo Campo: {formData.novoCampo}</p>
)}
```

**Opcional mas recomendado:**
- PDF: `pdfGenerator.ts`
- Excel: `excelGenerator.ts`

---

## 🔄 MUDAR TIPO DE DADOS

### **❌ NUNCA:**
```typescript
// ❌ ERRADO - Quebra dados antigos
temperaturaMin: number; // Era string
```

### **✅ SEMPRE:**
```typescript
// ✅ CORRETO - Compatível
temperaturaMin?: string; // Antigo (deprecado)
temperaturaMin_v2?: number; // Novo
```

**No código:**
```typescript
const temp = formData.temperaturaMin_v2 
  ?? (formData.temperaturaMin ? Number(formData.temperaturaMin) : undefined);
```

---

## 🏷️ RENOMEAR CAMPO

### **❌ NUNCA:**
```typescript
// ❌ ERRADO - Perde dados
espessuraCamada: string; // Cadê "espessura"?
```

### **✅ SEMPRE:**
```typescript
// ✅ CORRETO - Mantém ambos
espessura?: string; // @deprecated
espessuraCamada?: string; // Novo nome
```

**Sincronizar:**
```typescript
onChange={(value) => {
  updateFormData({
    espessuraCamada: value, // Novo
    espessura: value // Manter sincronizado
  });
}}
```

---

## 🗑️ REMOVER CAMPO

### **PROCESSO SEGURO (3 FASES):**

#### **FASE 1 - Depreciar:**
```typescript
/**
 * @deprecated Removido em v1.3.0
 */
ucrete?: string;
```

#### **FASE 2 - Ocultar UI (1 versão depois):**
```typescript
// Comentar input, mas manter tipo
{/* <input ... ucrete ... /> */}
```

#### **FASE 3 - Remover (2+ versões depois):**
```typescript
// Finalmente remover do tipo
// ucrete?: string; ← REMOVIDO
```

---

## 🎯 ONDE MODIFICAR CADA TIPO DE CAMPO

### **CONDIÇÕES AMBIENTAIS:**
```
types/index.ts (interface FormData)
   ↓
form-sections/CondicoesAmbientaisSection.tsx
   ↓
ViewRespostasModal.tsx
   ↓
pdfGenerator.ts
   ↓
excelGenerator.ts
```

### **DADOS DA OBRA:**
```
types/index.ts
   ↓
form-sections/DadosObraSection.tsx
   ↓
ViewRespostasModal.tsx
   ↓
pdfGenerator.ts
   ↓
excelGenerator.ts
```

### **SERVIÇOS:**
```
types/index.ts (interface ServicoData)
   ↓
form-sections/ServicosSection.tsx
   ↓
ViewRespostasModal.tsx (loop)
   ↓
pdfGenerator.ts (loop)
   ↓
excelGenerator.ts (loop)
```

---

## ✅ CHECKLIST MÍNIMO

Ao adicionar campo:

- [ ] `types/index.ts` → Campo opcional (`?`)
- [ ] `form-sections/*.tsx` → Input com valor padrão
- [ ] `ViewRespostasModal.tsx` → Renderização condicional
- [ ] Testar com formulário NOVO
- [ ] Testar com formulário ANTIGO (não deve quebrar)
- [ ] Console sem erros (F12)

---

## 🐛 DEBUGGING RÁPIDO

### **Campo não aparece:**
```javascript
console.log('FormData:', formData);
console.log('Campo:', formData.novoCampo);
```

### **Valor não salva:**
```javascript
console.log('Salvando:', formData);
// Verificar se updateFormData() está sendo chamado
```

### **Formulário antigo quebra:**
```typescript
// Sempre usar:
const valor = formData.campo || 'padrão';
{formData.campo && <Component />}
```

---

## 📦 ARQUIVOS CRÍTICOS

**NUNCA DELETAR:**
- `/src/app/types/index.ts` → Fonte da verdade
- `/src/app/utils/database.ts` → Salvar/carregar
- `/src/app/utils/dataSync.ts` → Sincronização
- `/supabase/functions/server/kv_store.tsx` → Backend

**MODIFICAR COM CUIDADO:**
- `/src/app/components/FormularioPage.tsx` → Lógica principal
- `/src/app/utils/pdfGenerator.ts` → Geração PDF
- `/src/app/utils/excelGenerator.ts` → Geração Excel

---

## 🚨 REGRAS DE OURO

1. ✅ **Novos campos = SEMPRE opcionais (`?`)**
2. ❌ **NUNCA mudar tipo diretamente (criar _v2)**
3. ❌ **NUNCA remover campo sem depreciar primeiro**
4. ❌ **NUNCA renomear direto (manter ambos)**
5. ✅ **SEMPRE testar com dados antigos**
6. ✅ **SEMPRE usar valores padrão (`|| ''`)**
7. ✅ **SEMPRE verificar console (F12)**
8. ✅ **SEMPRE fazer backup (git commit)**

---

## ⚡ FLUXO RÁPIDO - ADICIONAR CAMPO

```bash
# 1. Tipo
/src/app/types/index.ts → novoCampo?: string;

# 2. Formulário
/src/app/components/form-sections/*.tsx → <input ... />

# 3. Visualização
/src/app/components/ViewRespostasModal.tsx → {formData.novoCampo && ...}

# 4. PDF (opcional)
/src/app/utils/pdfGenerator.ts → doc.text(...)

# 5. Excel (opcional)
/src/app/utils/excelGenerator.ts → { Campo: ..., Valor: ... }

# 6. Testar
- Criar novo formulário
- Editar formulário antigo
- Baixar PDF/Excel
- Verificar console

# 7. Commit
git add .
git commit -m "feat: adicionar campo novoCampo"
```

---

**Versão:** 1.0 | **Sistema:** v1.0.0 | **Data:** 2026-01-12
