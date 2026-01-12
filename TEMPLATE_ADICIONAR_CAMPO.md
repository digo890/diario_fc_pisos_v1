# 📝 TEMPLATE - ADICIONAR NOVO CAMPO

> **Use este template como checklist ao adicionar novos campos**

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

<details>
<summary>📖 Código para CAMPO DE TEXTO</summary>

```typescript
import { ___Icon } from 'lucide-react'; // Escolher ícone apropriado

<div className="space-y-1">
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
    <___Icon className="w-4 h-4 text-[#FD5521]" />
    LABEL DO CAMPO
  </label>
  <input
    type="text"
    value={formData.nomedocampo || ''}
    onChange={(e) => updateFormData({ nomedocampo: e.target.value })}
    placeholder="PLACEHOLDER"
    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#FD5521] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
  />
</div>
```

</details>

<details>
<summary>📖 Código para CAMPO NUMÉRICO</summary>

```typescript
import { NumberInput } from '../NumberInput';
import { ___Icon } from 'lucide-react';

<NumberInput
  icon={___Icon}
  label="LABEL DO CAMPO"
  value={formData.nomedocampo || ''}
  onChange={(value) => updateFormData({ nomedocampo: value })}
  placeholder="Ex: 100"
  hint="Descrição opcional"
/>
```

</details>

<details>
<summary>📖 Código para CAMPO SELECT/DROPDOWN</summary>

```typescript
import { ___Icon } from 'lucide-react';

<div className="space-y-1">
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
    <___Icon className="w-4 h-4 text-[#FD5521]" />
    LABEL DO CAMPO
  </label>
  <select
    value={formData.nomedocampo || ''}
    onChange={(e) => updateFormData({ nomedocampo: e.target.value })}
    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#FD5521] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
  >
    <option value="">Selecione...</option>
    <option value="opcao1">Opção 1</option>
    <option value="opcao2">Opção 2</option>
    <option value="opcao3">Opção 3</option>
  </select>
</div>
```

</details>

<details>
<summary>📖 Código para CHECKBOX/TOGGLE</summary>

```typescript
import { ___Icon } from 'lucide-react';

<label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
  <input
    type="checkbox"
    checked={formData.nomedocampo || false}
    onChange={(e) => updateFormData({ nomedocampo: e.target.checked })}
    className="w-5 h-5 text-[#FD5521] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-[#FD5521] focus:ring-offset-0"
  />
  <div className="flex-1">
    <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
      <___Icon className="w-4 h-4 text-[#FD5521]" />
      LABEL DO CAMPO
    </span>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
      Descrição opcional
    </p>
  </div>
</label>
```

</details>

- [ ] Input/Select/Checkbox adicionado
- [ ] Ícone escolhido (Lucide React)
- [ ] Label definido
- [ ] Placeholder/descrição adicionados
- [ ] `updateFormData()` configurado corretamente
- [ ] Valor padrão tratado (|| '')
- [ ] Classes Tailwind aplicadas (dark mode)

---

### **3️⃣ PASSO 3: Adicionar na Visualização (Modal)**

**Arquivo:** `/src/app/components/ViewRespostasModal.tsx`

<details>
<summary>📖 Código para EXIBIR CAMPO</summary>

```typescript
import { ___Icon } from 'lucide-react';

{/* ADICIONAR na seção apropriada */}
{formData.nomedocampo && ( // ✅ Renderização condicional
  <div className="flex items-start gap-3">
    <___Icon className="w-5 h-5 text-[#FD5521] flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        LABEL DO CAMPO:
      </p>
      <p className="font-medium text-gray-900 dark:text-white">
        {formData.nomedocampo}
      </p>
    </div>
  </div>
)}
```

</details>

**Localização no arquivo:**
- Condições Ambientais: Linha ~375
- Dados da Obra: Linha ~420
- Serviços: Dentro do loop de serviços (~450)
- Observações: Linha ~550

- [ ] Campo adicionado na visualização
- [ ] Renderização condicional (`{formData.campo && ...}`)
- [ ] Ícone e formatação corretos
- [ ] Testado no modal de visualização

---

### **4️⃣ PASSO 4: Adicionar no Gerador de PDF**

**Arquivo:** `/src/app/utils/pdfGenerator.ts`

<details>
<summary>📖 Código para ADICIONAR NO PDF</summary>

```typescript
// Localizar a seção apropriada (ex: Condições Ambientais, Dados da Obra, etc)

if (formData.nomedocampo) { // ✅ Verificar se existe
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `LABEL DO CAMPO: ${formData.nomedocampo}`,
    leftMargin,
    y
  );
  y += lineHeight;
  
  // Verificar quebra de página
  if (y > pageHeight - bottomMargin) {
    doc.addPage();
    y = topMargin;
  }
}
```

</details>

**Seções no PDF:**
- Condições Ambientais: Após "Umidade" (~linha 80)
- Dados da Obra: Após "Estado do Substrato" (~linha 120)
- Serviços: Dentro do loop de cada serviço (~linha 150)

- [ ] Campo adicionado no PDF
- [ ] Verificação de existência (`if (formData.campo)`)
- [ ] Label formatado corretamente
- [ ] Posição `y` incrementada
- [ ] Quebra de página verificada

---

### **5️⃣ PASSO 5: Adicionar no Gerador de Excel**

**Arquivo:** `/src/app/utils/excelGenerator.ts`

<details>
<summary>📖 Código para ADICIONAR NO EXCEL</summary>

```typescript
// Localizar o array worksheetData da seção apropriada

const worksheetData = [
  // ... campos existentes
  
  // ✅ ADICIONAR:
  {
    Campo: 'LABEL DO CAMPO',
    Valor: formData.nomedocampo || 'N/A' // ✅ Fallback
  },
];
```

</details>

**Seções no Excel:**
- Condições Ambientais: Array `condicoesData` (~linha 30)
- Dados da Obra: Array `dadosObraData` (~linha 50)
- Serviços: Dentro do loop de serviços (~linha 80)

- [ ] Campo adicionado no Excel
- [ ] Label no campo "Campo"
- [ ] Valor com fallback (|| 'N/A')
- [ ] Ordem lógica mantida

---

### **6️⃣ PASSO 6: Testar Completamente**

#### **Teste 1: Criar Novo Formulário**
- [ ] Abrir formulário novo
- [ ] Localizar campo adicionado
- [ ] Preencher valor
- [ ] Salvar como rascunho
- [ ] Reabrir e verificar se valor persistiu

#### **Teste 2: Visualização**
- [ ] Clicar em "Ver Respostas"
- [ ] Verificar se campo aparece
- [ ] Verificar formatação e ícone

#### **Teste 3: PDF**
- [ ] Baixar PDF do formulário
- [ ] Verificar se campo aparece no PDF
- [ ] Verificar formatação e posição

#### **Teste 4: Excel**
- [ ] Baixar Excel do formulário
- [ ] Abrir no Excel/Google Sheets
- [ ] Verificar se campo aparece na coluna correta

#### **Teste 5: Compatibilidade com Dados Antigos**
- [ ] **CRÍTICO:** Criar formulário SEM preencher o novo campo
- [ ] Salvar
- [ ] Reabrir
- [ ] Verificar que NÃO quebrou (sem erros no console)
- [ ] Baixar PDF/Excel e verificar que funciona

#### **Teste 6: Validação Preposto (Se aplicável)**
- [ ] Enviar formulário para Preposto
- [ ] Abrir link de validação
- [ ] Verificar se campo aparece
- [ ] Aprovar/Reprovar
- [ ] Verificar sincronização

#### **Teste 7: Sincronização Online/Offline**
- [ ] Criar formulário offline (modo avião)
- [ ] Preencher novo campo
- [ ] Conectar à internet
- [ ] Aguardar sincronização (ícone verde)
- [ ] Verificar no Admin Dashboard

---

## 🎯 VALIDAÇÕES OPCIONAIS

### **Se o campo for OBRIGATÓRIO:**

**Adicionar validação em:** `/src/app/components/FormularioPage.tsx`

```typescript
const validarFormulario = (): boolean => {
  // ... validações existentes
  
  if (!formData.nomedocampo) {
    toast.error('LABEL DO CAMPO é obrigatório');
    return false;
  }
  
  return true;
};
```

### **Se o campo tiver FORMATO ESPECÍFICO:**

```typescript
// Exemplo: Validar email
if (formData.nomedocampo && !formData.nomedocampo.includes('@')) {
  toast.error('Email inválido');
  return false;
}

// Exemplo: Validar número
if (formData.nomedocampo && isNaN(Number(formData.nomedocampo))) {
  toast.error('Valor deve ser numérico');
  return false;
}

// Exemplo: Validar faixa
if (formData.nomedocampo && (Number(formData.nomedocampo) < 0 || Number(formData.nomedocampo) > 100)) {
  toast.error('Valor deve estar entre 0 e 100');
  return false;
}
```

---

## 🔍 TROUBLESHOOTING

### **Problema: Campo não aparece no formulário**
- [ ] Verificar se adicionou o input na seção correta
- [ ] Verificar se `updateFormData()` está correto
- [ ] Verificar console do navegador (F12) para erros

### **Problema: Valor não persiste ao salvar**
- [ ] Verificar se campo está na interface `FormData` (`types/index.ts`)
- [ ] Verificar se `updateFormData()` está sendo chamado no onChange
- [ ] Verificar no IndexedDB (F12 → Application → IndexedDB → forms)

### **Problema: Campo não aparece no PDF/Excel**
- [ ] Verificar se adicionou no arquivo correto (`pdfGenerator.ts` / `excelGenerator.ts`)
- [ ] Verificar se há verificação de existência (`if (formData.campo)`)
- [ ] Verificar console ao gerar PDF/Excel

### **Problema: Formulários antigos quebram**
- [ ] Campo deve ser OPCIONAL (`?`) no tipo
- [ ] Usar operador de coalescência nula: `formData.campo || ''`
- [ ] Renderização condicional: `{formData.campo && ...}`

---

## 📊 ÍCONES COMUNS (Lucide React)

```typescript
import {
  // Temperatura/Clima
  Thermometer, Cloud, Wind, Droplets, Gauge,
  
  // Medidas
  Ruler, Scale, Maximize2, Move,
  
  // Tempo
  Clock, Calendar, Timer,
  
  // Localização
  MapPin, Navigation, Compass,
  
  // Ferramentas
  Wrench, Tool, Hammer, Settings,
  
  // Status
  CheckCircle, AlertCircle, XCircle, Info,
  
  // Pessoas
  User, Users, UserCheck,
  
  // Documentos
  FileText, File, Folder, ClipboardList,
  
  // Comunicação
  Mail, Phone, MessageSquare,
  
  // Outros
  Camera, Image, Trash2, Edit, Eye, Download
} from 'lucide-react';
```

Ver todos em: https://lucide.dev/icons/

---

## ✅ CHECKLIST FINAL

Antes de considerar concluído:

- [ ] Campo adicionado em `types/index.ts` (opcional `?`)
- [ ] Input adicionado na seção apropriada
- [ ] Visualização adicionada no `ViewRespostasModal.tsx`
- [ ] PDF atualizado (`pdfGenerator.ts`)
- [ ] Excel atualizado (`excelGenerator.ts`)
- [ ] Todos os 7 testes executados com sucesso
- [ ] Sem erros no console (F12)
- [ ] Compatibilidade com formulários antigos verificada
- [ ] Código commitado no Git

---

## 🎉 PRONTO!

Se todos os itens estão ✅, seu novo campo foi adicionado com sucesso!

**Próximos passos:**
1. Testar em diferentes dispositivos (mobile/desktop)
2. Verificar tema claro/escuro
3. Fazer deploy (se necessário)

---

**Dúvidas?** Consulte o `GUIA_MANUTENCAO_FORMULARIOS.md`
