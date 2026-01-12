# 💾 SNIPPETS DE CÓDIGO - COPIAR E COLAR

> **Código pronto para usar ao modificar formulários**

---

## 📝 SNIPPETS PARA ADICIONAR CAMPOS

### **1. Campo de Texto Simples**

```typescript
// ========================================
// 1️⃣ types/index.ts
// ========================================
export interface FormData {
  // ... campos existentes
  nomeDoCampo?: string; // ⚠️ SEMPRE opcional
}

// ========================================
// 2️⃣ form-sections/DadosObraSection.tsx (ou outra seção)
// ========================================
import { FileText } from 'lucide-react'; // Escolher ícone apropriado

// No JSX:
<div className="space-y-1">
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
    <FileText className="w-4 h-4 text-[#FD5521]" />
    Nome do Campo
  </label>
  <input
    type="text"
    value={formData.nomeDoCampo || ''}
    onChange={(e) => updateFormData({ nomeDoCampo: e.target.value })}
    placeholder="Ex: Digite aqui"
    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#FD5521] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
  />
  {/* Hint opcional */}
  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
    Descrição ou dica sobre o campo
  </p>
</div>

// ========================================
// 3️⃣ ViewRespostasModal.tsx
// ========================================
import { FileText } from 'lucide-react';

// Adicionar na seção apropriada (ex: Dados da Obra):
{formData.nomeDoCampo && (
  <div className="flex items-start gap-3">
    <FileText className="w-5 h-5 text-[#FD5521] flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Nome do Campo:
      </p>
      <p className="font-medium text-gray-900 dark:text-white">
        {formData.nomeDoCampo}
      </p>
    </div>
  </div>
)}

// ========================================
// 4️⃣ pdfGenerator.ts
// ========================================
// Adicionar na seção apropriada:
if (formData.nomeDoCampo) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nome do Campo: ${formData.nomeDoCampo}`, leftMargin, y);
  y += lineHeight;
  
  // Verificar quebra de página
  if (y > pageHeight - bottomMargin) {
    doc.addPage();
    y = topMargin;
  }
}

// ========================================
// 5️⃣ excelGenerator.ts
// ========================================
// Adicionar no array appropriado (ex: dadosObraData):
{
  Campo: 'Nome do Campo',
  Valor: formData.nomeDoCampo || 'N/A'
}
```

---

### **2. Campo Numérico**

```typescript
// ========================================
// 1️⃣ types/index.ts
// ========================================
export interface FormData {
  campoNumerico?: string; // String porque vem de input
}

// ========================================
// 2️⃣ form-sections/*.tsx
// ========================================
import { NumberInput } from '../NumberInput';
import { Hash } from 'lucide-react';

<NumberInput
  icon={Hash}
  label="Campo Numérico"
  value={formData.campoNumerico || ''}
  onChange={(value) => updateFormData({ campoNumerico: value })}
  placeholder="Ex: 100"
  hint="Valores entre 0 e 1000"
/>

// ========================================
// 3️⃣ ViewRespostasModal.tsx
// ========================================
{formData.campoNumerico && (
  <div className="flex items-start gap-3">
    <Hash className="w-5 h-5 text-[#FD5521] flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Campo Numérico:
      </p>
      <p className="font-medium text-gray-900 dark:text-white">
        {formData.campoNumerico}
      </p>
    </div>
  </div>
)}

// PDF e Excel: Igual ao campo de texto
```

---

### **3. Select/Dropdown**

```typescript
// ========================================
// 1️⃣ types/index.ts
// ========================================
export type OpcaoCampo = 'opcao1' | 'opcao2' | 'opcao3';

export interface FormData {
  campoSelect?: OpcaoCampo;
}

// ========================================
// 2️⃣ form-sections/*.tsx
// ========================================
import { List } from 'lucide-react';

<div className="space-y-1">
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
    <List className="w-4 h-4 text-[#FD5521]" />
    Campo Select
  </label>
  <select
    value={formData.campoSelect || ''}
    onChange={(e) => updateFormData({ campoSelect: e.target.value as OpcaoCampo })}
    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#FD5521] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
  >
    <option value="">Selecione uma opção...</option>
    <option value="opcao1">Opção 1</option>
    <option value="opcao2">Opção 2</option>
    <option value="opcao3">Opção 3</option>
  </select>
</div>

// ========================================
// 3️⃣ ViewRespostasModal.tsx
// ========================================
// Opcional: Criar mapeamento para labels
const opcaoLabels: Record<OpcaoCampo, string> = {
  opcao1: 'Opção 1',
  opcao2: 'Opção 2',
  opcao3: 'Opção 3',
};

{formData.campoSelect && (
  <div className="flex items-start gap-3">
    <List className="w-5 h-5 text-[#FD5521] flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Campo Select:
      </p>
      <p className="font-medium text-gray-900 dark:text-white">
        {opcaoLabels[formData.campoSelect] || formData.campoSelect}
      </p>
    </div>
  </div>
)}
```

---

### **4. Checkbox/Toggle**

```typescript
// ========================================
// 1️⃣ types/index.ts
// ========================================
export interface FormData {
  campoCheckbox?: boolean;
}

// ========================================
// 2️⃣ form-sections/*.tsx
// ========================================
import { CheckSquare } from 'lucide-react';

<label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
  <input
    type="checkbox"
    checked={formData.campoCheckbox || false}
    onChange={(e) => updateFormData({ campoCheckbox: e.target.checked })}
    className="w-5 h-5 text-[#FD5521] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-[#FD5521] focus:ring-offset-0"
  />
  <div className="flex-1">
    <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
      <CheckSquare className="w-4 h-4 text-[#FD5521]" />
      Descrição do Checkbox
    </span>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
      Informação adicional sobre esta opção
    </p>
  </div>
</label>

// ========================================
// 3️⃣ ViewRespostasModal.tsx
// ========================================
{formData.campoCheckbox !== undefined && (
  <div className="flex items-start gap-3">
    <CheckSquare className="w-5 h-5 text-[#FD5521] flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Descrição do Checkbox:
      </p>
      <p className="font-medium text-gray-900 dark:text-white">
        {formData.campoCheckbox ? 'Sim' : 'Não'}
      </p>
    </div>
  </div>
)}

// ========================================
// 4️⃣ PDF
// ========================================
if (formData.campoCheckbox !== undefined) {
  doc.text(
    `Descrição: ${formData.campoCheckbox ? 'Sim' : 'Não'}`,
    leftMargin,
    y
  );
  y += lineHeight;
}
```

---

### **5. Textarea (Observações)**

```typescript
// ========================================
// 1️⃣ types/index.ts
// ========================================
export interface FormData {
  campoTextoLongo?: string;
}

// ========================================
// 2️⃣ form-sections/*.tsx
// ========================================
import { AlignLeft } from 'lucide-react';

<div className="space-y-1">
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
    <AlignLeft className="w-4 h-4 text-[#FD5521]" />
    Observações
  </label>
  <textarea
    value={formData.campoTextoLongo || ''}
    onChange={(e) => updateFormData({ campoTextoLongo: e.target.value })}
    placeholder="Digite suas observações aqui..."
    rows={4}
    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#FD5521] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
  />
  <div className="flex items-center justify-between">
    <p className="text-xs text-gray-500 dark:text-gray-400">
      Máximo 500 caracteres
    </p>
    <p className="text-xs text-gray-500 dark:text-gray-400">
      {(formData.campoTextoLongo || '').length}/500
    </p>
  </div>
</div>

// ========================================
// 3️⃣ ViewRespostasModal.tsx
// ========================================
{formData.campoTextoLongo && (
  <div className="flex items-start gap-3">
    <AlignLeft className="w-5 h-5 text-[#FD5521] flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Observações:
      </p>
      <p className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap">
        {formData.campoTextoLongo}
      </p>
    </div>
  </div>
)}
```

---

### **6. Campo de Data**

```typescript
// ========================================
// 1️⃣ types/index.ts
// ========================================
export interface FormData {
  campoData?: string; // Formato: YYYY-MM-DD
}

// ========================================
// 2️⃣ form-sections/*.tsx
// ========================================
import { Calendar } from 'lucide-react';

<div className="space-y-1">
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
    <Calendar className="w-4 h-4 text-[#FD5521]" />
    Data
  </label>
  <input
    type="date"
    value={formData.campoData || ''}
    onChange={(e) => updateFormData({ campoData: e.target.value })}
    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#FD5521] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
  />
</div>

// ========================================
// 3️⃣ ViewRespostasModal.tsx
// ========================================
import { format } from 'date-fns';

{formData.campoData && (
  <div className="flex items-start gap-3">
    <Calendar className="w-5 h-5 text-[#FD5521] flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Data:
      </p>
      <p className="font-medium text-gray-900 dark:text-white">
        {format(new Date(formData.campoData), 'dd/MM/yyyy')}
      </p>
    </div>
  </div>
)}
```

---

### **7. Campo de Hora**

```typescript
// ========================================
// 1️⃣ types/index.ts
// ========================================
export interface FormData {
  campoHora?: string; // Formato: HH:MM
}

// ========================================
// 2️⃣ form-sections/*.tsx
// ========================================
import { Clock } from 'lucide-react';

<div className="space-y-1">
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
    <Clock className="w-4 h-4 text-[#FD5521]" />
    Horário
  </label>
  <input
    type="time"
    value={formData.campoHora || ''}
    onChange={(e) => updateFormData({ campoHora: e.target.value })}
    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#FD5521] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
  />
</div>
```

---

## 🔄 SNIPPETS PARA MIGRAÇÕES

### **1. Migração de Tipo de Dados**

```typescript
// ========================================
// types/index.ts
// ========================================
export interface FormData {
  /**
   * @deprecated Usar temperaturaMin_v2 (number) a partir de v1.2.0
   */
  temperaturaMin?: string;
  temperaturaMin_v2?: number; // Novo campo
}

// ========================================
// Componente
// ========================================
const temp = formData.temperaturaMin_v2 
  ?? (formData.temperaturaMin ? Number(formData.temperaturaMin) : undefined);

<NumberInput
  value={temp?.toString() || ''}
  onChange={(value) => {
    const numValue = value ? Number(value) : undefined;
    updateFormData({
      temperaturaMin_v2: numValue, // Novo
      temperaturaMin: value // Manter sincronizado
    });
  }}
/>

// ========================================
// utils/database.ts - Migração automática
// ========================================
export const loadFormData = async (obraId: string): Promise<FormData | null> => {
  const db = await getDB();
  const data = await db.get('forms', obraId);
  
  if (!data) return null;
  
  // Migração: string → number
  if (data.temperaturaMin && !data.temperaturaMin_v2) {
    data.temperaturaMin_v2 = Number(data.temperaturaMin);
    await db.put('forms', data);
    console.log('✅ Migrado: temperaturaMin → temperaturaMin_v2');
  }
  
  return data;
};
```

---

### **2. Sistema de Versionamento**

```typescript
// ========================================
// types/index.ts
// ========================================
export const CURRENT_SCHEMA_VERSION = 2;

export interface FormData {
  schemaVersion?: number; // undefined = v1
  // ... campos
}

// ========================================
// utils/migrations.ts (NOVO ARQUIVO)
// ========================================
import { FormData, CURRENT_SCHEMA_VERSION } from '../types';

type Migration = (data: any) => any;

const migrations: { [version: number]: Migration } = {
  2: (data: any) => {
    console.log('🔄 Migrando para v2...');
    
    // Exemplo: temperaturaMin string → number
    if (data.temperaturaMin && !data.temperaturaMin_v2) {
      data.temperaturaMin_v2 = Number(data.temperaturaMin);
    }
    
    data.schemaVersion = 2;
    return data;
  },
};

export const migrateFormData = (data: any): FormData => {
  const currentVersion = data.schemaVersion || 1;
  
  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    return data;
  }
  
  console.log(`🔄 Migrando de v${currentVersion} para v${CURRENT_SCHEMA_VERSION}`);
  
  let migratedData = { ...data };
  
  for (let version = currentVersion + 1; version <= CURRENT_SCHEMA_VERSION; version++) {
    if (migrations[version]) {
      migratedData = migrations[version](migratedData);
    }
  }
  
  return migratedData as FormData;
};

// ========================================
// utils/database.ts
// ========================================
import { migrateFormData } from './migrations';

export const loadFormData = async (obraId: string): Promise<FormData | null> => {
  const db = await getDB();
  const data = await db.get('forms', obraId);
  
  if (!data) return null;
  
  const migratedData = migrateFormData(data);
  
  if (migratedData.schemaVersion !== data.schemaVersion) {
    await db.put('forms', migratedData);
  }
  
  return migratedData;
};

// ========================================
// Ao criar novo formulário
// ========================================
import { CURRENT_SCHEMA_VERSION } from '../types';

const newFormData: FormData = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  obraId: obra.id,
  // ... outros campos
};
```

---

## 🧪 SNIPPETS PARA DEBUG

### **1. Inspecionar FormData no Console**

```javascript
// Cole no console do navegador (F12)
console.log('📋 FormData atual:', formData);
console.log('🔑 Campos:', Object.keys(formData));
console.log('📊 Schema version:', formData.schemaVersion);
```

---

### **2. Listar Formulários no IndexedDB**

```javascript
// Cole no console
(async () => {
  const dbRequest = indexedDB.open('fc-pisos-db', 1);
  dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['forms'], 'readonly');
    const objectStore = transaction.objectStore('forms');
    const request = objectStore.getAll();
    
    request.onsuccess = () => {
      console.table(request.result);
      console.log('🔢 Total de formulários:', request.result.length);
    };
  };
})();
```

---

### **3. Validar Estrutura de FormData**

```javascript
// Cole no console
const validarFormData = (data) => {
  const camposObrigatorios = [
    'obraId', 'clima', 'servicos', 'status', 'createdAt'
  ];
  
  const faltando = camposObrigatorios.filter(c => !(c in data));
  
  if (faltando.length > 0) {
    console.error('❌ Campos faltando:', faltando);
    return false;
  }
  
  console.log('✅ FormData válido');
  return true;
};

validarFormData(formData);
```

---

### **4. Comparar Antes/Depois**

```javascript
// Cole no console ANTES de fazer alterações
window.formDataSnapshot = JSON.parse(JSON.stringify(formData));

// Depois de fazer alterações, compare:
const antes = window.formDataSnapshot;
const depois = formData;

const diff = Object.keys(depois).filter(
  key => JSON.stringify(antes[key]) !== JSON.stringify(depois[key])
);

console.log('📊 Campos alterados:', diff);
diff.forEach(key => {
  console.log(`  ${key}:`, { antes: antes[key], depois: depois[key] });
});
```

---

### **5. Limpar IndexedDB**

```javascript
// ⚠️ CUIDADO: Apaga todos os dados locais!
if (confirm('⚠️ APAGAR TODOS OS DADOS LOCAIS?')) {
  indexedDB.deleteDatabase('fc-pisos-db');
  console.log('🗑️ Banco deletado. Recarregando...');
  location.reload();
}
```

---

## 📝 SNIPPETS PARA VALIDAÇÃO

### **1. Validação de Campo Obrigatório**

```typescript
// FormularioPage.tsx ou componente de seção

const validarFormulario = (): boolean => {
  if (!formData.campoObrigatorio) {
    toast.error('Campo Obrigatório é obrigatório');
    return false;
  }
  
  return true;
};

// No botão de enviar:
const handleSubmit = () => {
  if (!validarFormulario()) return;
  
  // Continuar com envio...
};
```

---

### **2. Validação de Formato de Email**

```typescript
const validarEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validarFormulario = (): boolean => {
  if (formData.email && !validarEmail(formData.email)) {
    toast.error('Email inválido');
    return false;
  }
  
  return true;
};
```

---

### **3. Validação de Faixa Numérica**

```typescript
const validarFormulario = (): boolean => {
  const valor = Number(formData.campoNumerico);
  
  if (isNaN(valor)) {
    toast.error('Valor deve ser numérico');
    return false;
  }
  
  if (valor < 0 || valor > 100) {
    toast.error('Valor deve estar entre 0 e 100');
    return false;
  }
  
  return true;
};
```

---

### **4. Validação Condicional**

```typescript
const validarFormulario = (): boolean => {
  // Se campo A está preenchido, campo B é obrigatório
  if (formData.estadoSubstrato === 'irregular' && !formData.estadoSubstratoObs) {
    toast.error('Descreva o estado irregular do substrato');
    return false;
  }
  
  return true;
};
```

---

## 🎨 ÍCONES COMUNS (Lucide React)

```typescript
import {
  // Clima e Ambiente
  Thermometer,      // Temperatura
  Cloud,            // Clima
  CloudRain,        // Chuva
  Sun,              // Sol
  Moon,             // Noite
  Wind,             // Vento
  Droplets,         // Umidade
  Gauge,            // Pressão
  
  // Tempo
  Clock,            // Hora
  Calendar,         // Data
  Timer,            // Cronômetro
  
  // Medidas e Dimensões
  Ruler,            // Régua
  Maximize2,        // Área
  Scale,            // Peso/Balança
  Move,             // Movimento
  
  // Localização
  MapPin,           // Local
  Navigation,       // Navegação
  Compass,          // Bússola
  
  // Documentos e Texto
  FileText,         // Arquivo texto
  File,             // Arquivo
  Folder,           // Pasta
  ClipboardList,    // Lista
  AlignLeft,        // Texto longo
  
  // Ferramentas e Construção
  Wrench,           // Chave inglesa
  Tool,             // Ferramenta
  Hammer,           // Martelo
  Settings,         // Configurações
  
  // Checklist e Status
  CheckSquare,      // Checkbox
  CheckCircle,      // Check
  Circle,           // Círculo
  AlertCircle,      // Alerta
  XCircle,          // Erro
  Info,             // Informação
  
  // Ações
  Plus,             // Adicionar
  Minus,            // Remover
  Edit,             // Editar
  Trash2,           // Deletar
  Save,             // Salvar
  Send,             // Enviar
  Download,         // Baixar
  Upload,           // Upload
  
  // Mídia
  Camera,           // Câmera
  Image,            // Imagem
  Eye,              // Ver
  
  // Pessoas
  User,             // Usuário
  Users,            // Usuários
  UserCheck,        // Usuário aprovado
  
  // Comunicação
  Mail,             // Email
  Phone,            // Telefone
  MessageSquare,    // Mensagem
  
  // Outros
  Hash,             // Número #
  List,             // Lista
  Grid,             // Grade
  MoreVertical,     // Menu vertical
} from 'lucide-react';
```

**Ver todos os ícones:** https://lucide.dev/icons/

---

## 🎯 SNIPPET COMPLETO - ADICIONAR CAMPO DO ZERO

```typescript
// ============================================================
// EXEMPLO COMPLETO: Adicionar campo "pressaoAtmosferica"
// ============================================================

// ========================================
// 1️⃣ types/index.ts
// ========================================
export interface FormData {
  // ... campos existentes
  pressaoAtmosferica?: string; // ⚠️ OPCIONAL
}

// ========================================
// 2️⃣ form-sections/CondicoesAmbientaisSection.tsx
// ========================================
import { Gauge } from 'lucide-react';
import { NumberInput } from '../NumberInput';

// No JSX, após o campo de umidade:
<NumberInput
  icon={Gauge}
  label="Pressão Atmosférica (hPa)"
  value={formData.pressaoAtmosferica || ''}
  onChange={(value) => updateFormData({ pressaoAtmosferica: value })}
  placeholder="Ex: 1013"
  hint="Valores normais: 980-1050 hPa"
/>

// ========================================
// 3️⃣ ViewRespostasModal.tsx
// ========================================
// Adicionar após o campo de Umidade (~linha 385):
{formData.pressaoAtmosferica && (
  <div className="flex items-start gap-3">
    <Gauge className="w-5 h-5 text-[#FD5521] flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Pressão Atmosférica:
      </p>
      <p className="font-medium text-gray-900 dark:text-white">
        {formData.pressaoAtmosferica} hPa
      </p>
    </div>
  </div>
)}

// ========================================
// 4️⃣ pdfGenerator.ts
// ========================================
// Adicionar na seção de Condições Ambientais (~linha 90):
if (formData.pressaoAtmosferica) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Pressão Atmosférica: ${formData.pressaoAtmosferica} hPa`, leftMargin, y);
  y += lineHeight;
  
  if (y > pageHeight - bottomMargin) {
    doc.addPage();
    y = topMargin;
  }
}

// ========================================
// 5️⃣ excelGenerator.ts
// ========================================
// Adicionar no array condicoesData (~linha 35):
{
  Campo: 'Pressão Atmosférica (hPa)',
  Valor: formData.pressaoAtmosferica || 'N/A'
}

// ========================================
// ✅ PRONTO! Campo adicionado em 5 arquivos
// ========================================
```

---

**Dica:** Salve este arquivo nos favoritos para acesso rápido! 🚀
