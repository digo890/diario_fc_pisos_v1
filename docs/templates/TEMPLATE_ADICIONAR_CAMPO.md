# 📝 TEMPLATE - ADICIONAR NOVO CAMPO

> **Use este template como checklist ao adicionar novos campos ao formulário**

---

## 📋 INFORMAÇÕES DO CAMPO

**Nome do campo:** `_____________________`  
**Tipo:** `[ ] string  [ ] number  [ ] boolean  [ ] outro: _______`  
**Seção:** `[ ] Condições Ambientais  [ ] Dados da Obra  [ ] Serviços  [ ] Registros  [ ] Observações`  
**Obrigatório?** `[ ] Não (RECOMENDADO)  [ ] Sim (adicionar validação)`  
**Label/Rótulo:** `_____________________`  
**Placeholder:** `_____________________`  
**Valor padrão:** `_____________________`

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **1️⃣ PASSO 1: Atualizar Interface TypeScript**

**Arquivo:** `/src/app/types/index.ts`

```typescript
export interface FormData {
  // ... campos existentes
  
  // ✅ ADICIONAR AQUI:
  nomedocampo?: string; // ⚠️ SEMPRE OPCIONAL (?)
}
```

- [ ] Campo adicionado na interface `FormData`
- [ ] Tipo definido corretamente
- [ ] Marcado como opcional (`?`)
- [ ] Comentário adicionado (se necessário)

---

### **2️⃣ PASSO 2: Adicionar Input no Formulário**

**Arquivo:** `/src/app/components/form-sections/___Section.tsx`

#### Para campos de texto/número:
```typescript
<NumberInput
  label="Nome do Campo"
  value={formData.nomedocampo || ''}
  onChange={(value) => updateFormData({ nomedocampo: value })}
  placeholder="Ex: valor"
/>
```

- [ ] Input adicionado no formulário
- [ ] Label definido
- [ ] onChange atualiza formData
- [ ] Valor padrão definido (`|| ''`)

---

### **3️⃣ PASSO 3: Adicionar na Visualização**

**Arquivo:** `/src/app/components/ViewRespostasModal.tsx`

```typescript
{formData.nomedocampo && (
  <div className="flex items-start gap-3">
    <Icon className="w-5 h-5 text-[#FD5521] flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Nome do Campo:
      </p>
      <p className="font-medium text-gray-900 dark:text-white">
        {formData.nomedocampo}
      </p>
    </div>
  </div>
)}
```

- [ ] Campo adicionado na visualização
- [ ] Renderização condicional (`&&`)
- [ ] Ícone apropriado escolhido
- [ ] Estilos corretos aplicados

---

### **4️⃣ PASSO 4: Adicionar no PDF**

**Arquivo:** `/src/app/utils/pdfGenerator.ts`

```typescript
if (formData.nomedocampo) {
  doc.text(`Nome do Campo: ${formData.nomedocampo}`, leftMargin, y);
  y += lineHeight;
}
```

- [ ] Campo adicionado no gerador de PDF
- [ ] Verificação de existência (`if`)
- [ ] Posicionamento correto (y += lineHeight)

---

### **5️⃣ PASSO 5: Adicionar no Excel**

**Arquivo:** `/src/app/utils/excelGenerator.ts`

```typescript
{
  'Nome do Campo': formData.nomedocampo || 'N/A'
}
```

- [ ] Campo adicionado no gerador de Excel
- [ ] Fallback definido (`|| 'N/A'`)

---

## 🧪 TESTES

- [ ] Criar novo formulário e preencher campo
- [ ] Salvar e verificar persistência
- [ ] Visualizar formulário preenchido
- [ ] Baixar PDF e verificar campo
- [ ] Baixar Excel e verificar campo
- [ ] Abrir formulário antigo (sem o campo) e verificar que não quebrou

---

**Data de criação:** 2026-01-12  
**Versão:** 1.0.0
