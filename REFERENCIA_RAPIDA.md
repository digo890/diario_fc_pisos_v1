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
ViewRespostasModal.tsx (~linha 375)
   ↓
pdfGenerator.ts (~linha 80)
   ↓
excelGenerator.ts (~linha 30)
```

### **DADOS DA OBRA:**
```
types/index.ts
   ↓
form-sections/DadosObraSection.tsx
   ↓
ViewRespostasModal.tsx (~linha 420)
   ↓
pdfGenerator.ts (~linha 120)
   ↓
excelGenerator.ts (~linha 50)
```

### **SERVIÇOS:**
```
types/index.ts (interface ServicoData)
   ↓
form-sections/ServicosSection.tsx
   ↓
ViewRespostasModal.tsx (~linha 450, loop)
   ↓
pdfGenerator.ts (~linha 150, loop)
   ↓
excelGenerator.ts (~linha 80, loop)
```

### **ETAPAS (Checkboxes 1-37):**
```
form-sections/EtapasExecucaoSection.tsx (adicionar checkbox)
   ↓
ViewRespostasModal.tsx (renderiza automaticamente)
   ↓
pdfGenerator.ts (renderiza automaticamente)
```

### **REGISTROS (Condicionais com foto):**
```
form-sections/RegistrosSection.tsx (adicionar CondicionalField)
   ↓
ViewRespostasModal.tsx (renderiza automaticamente)
   ↓
pdfGenerator.ts (renderiza automaticamente)
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

### **PDF/Excel sem campo:**
```javascript
// Adicionar no gerador:
console.log('Gerando com:', formData.novoCampo);
```

### **Formulário antigo quebra:**
```typescript
// Sempre usar:
const valor = formData.campo || 'padrão';
{formData.campo && <Component />}
```

---

## 🔧 COMANDOS ÚTEIS (Console)

### **Ver FormData:**
```javascript
console.log(formData);
```

### **Listar formulários salvos:**
```javascript
indexedDB.open('fc-pisos-db').onsuccess = (e) => {
  const db = e.target.result;
  db.transaction(['forms']).objectStore('forms').getAll().onsuccess = (e) => {
    console.log('Formulários:', e.target.result);
  };
};
```

### **Limpar IndexedDB:**
```javascript
indexedDB.deleteDatabase('fc-pisos-db');
location.reload();
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

## 🎨 ÍCONES COMUNS

```typescript
import {
  // Clima
  Thermometer, Cloud, Wind, Droplets,
  
  // Medidas
  Ruler, Maximize2,
  
  // Tempo
  Clock, Calendar,
  
  // Outros
  MapPin, Camera, FileText, User
} from 'lucide-react';
```

**Ver todos:** https://lucide.dev/icons/

---

## 📚 DOCUMENTAÇÃO COMPLETA

Para casos complexos, consulte:

1. **`GUIA_MANUTENCAO_FORMULARIOS.md`**
   - Guia completo de manutenção
   - Tipos de alterações
   - Ordem de modificação
   - Compatibilidade

2. **`TEMPLATE_ADICIONAR_CAMPO.md`**
   - Template passo a passo
   - Código pronto para copiar
   - Checklist detalhado

3. **`EXEMPLO_MIGRACAO_DADOS.md`**
   - Migrações de dados
   - Versionamento de schema
   - Cenários reais

4. **`DEBUGGING_FORMULARIOS.md`**
   - Técnicas de debug
   - Scripts úteis
   - Problemas comuns

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

## 📞 PRECISA DE AJUDA?

**Antes de pedir ajuda:**
1. [ ] Consultou esta referência
2. [ ] Verificou console (F12)
3. [ ] Testou com dados antigos
4. [ ] Leu documentação completa

**Ao pedir ajuda, forneça:**
- Erro exato do console
- Código modificado
- Passos para reproduzir

---

**Versão:** 1.0 | **Última atualização:** 2026-01-09
