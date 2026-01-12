# 🛡️ GUIA DE MANUTENÇÃO SEGURA - FORMULÁRIOS
**Sistema: Diário de Obras FC Pisos v1.0.0**

> ⚠️ **ATENÇÃO:** Este guia garante que alterações nos formulários não quebrem o sistema.  
> Siga **TODOS** os passos na ordem correta.

---

## 📋 ÍNDICE
1. [Arquitetura do Formulário](#arquitetura)
2. [Checklist de Modificação](#checklist)
3. [Tipos de Alterações](#tipos-de-alteracoes)
4. [Ordem de Modificação](#ordem-de-modificacao)
5. [Compatibilidade com Dados Existentes](#compatibilidade)
6. [Testes Obrigatórios](#testes)
7. [Rollback de Emergência](#rollback)

---

## 🏗️ ARQUITETURA DO FORMULÁRIO {#arquitetura}

### **Mapa Completo de Dependências**

```
/src/app/types/index.ts (FONTE DA VERDADE)
         ↓
         ├─→ /src/app/components/FormularioPage.tsx (Estado principal)
         │         ↓
         │         ├─→ /src/app/components/form-sections/*.tsx (Seções do form)
         │         │         ↓
         │         │         ├─→ CondicoesAmbientaisSection.tsx
         │         │         ├─→ ServicosSection.tsx
         │         │         ├─→ DadosObraSection.tsx
         │         │         ├─→ EtapasExecucaoSection.tsx
         │         │         ├─→ RegistrosSection.tsx
         │         │         ├─→ ObservacoesSection.tsx
         │         │         └─→ PrepostoCheckSection.tsx
         │         │
         │         └─→ /src/app/utils/database.ts (Salvar no IndexedDB)
         │
         ├─→ /src/app/components/ViewRespostasModal.tsx (Visualização)
         │         ↓
         │         ├─→ /src/app/utils/pdfGenerator.ts (Exportar PDF)
         │         └─→ /src/app/utils/excelGenerator.ts (Exportar Excel)
         │
         ├─→ /src/app/components/PrepostoValidationPage.tsx (Validação Preposto)
         │
         ├─→ /src/app/utils/dataSync.ts (Sincronização Supabase)
         │
         └─→ /supabase/functions/server/index.tsx (Backend)
                   ↓
                   └─→ /supabase/functions/server/email.tsx (Emails)
```

---

## ✅ CHECKLIST DE MODIFICAÇÃO {#checklist}

### **ANTES DE COMEÇAR:**
- [ ] Fazer backup do código atual (`git commit` ou copiar arquivos)
- [ ] Ler este guia completamente
- [ ] Identificar o tipo de alteração (ver seção [Tipos de Alterações](#tipos-de-alteracoes))
- [ ] Verificar se há dados existentes no sistema

### **DURANTE A MODIFICAÇÃO:**
- [ ] Seguir a [Ordem de Modificação](#ordem-de-modificacao)
- [ ] Sempre adicionar campos como **opcionais** (com `?`) primeiro
- [ ] Nunca remover campos diretamente (depreciar primeiro)
- [ ] Atualizar TODOS os arquivos da dependência
- [ ] Garantir valores padrão para novos campos

### **DEPOIS DA MODIFICAÇÃO:**
- [ ] Executar [Testes Obrigatórios](#testes)
- [ ] Testar com dados antigos (se existirem)
- [ ] Verificar PDF e Excel
- [ ] Testar sincronização online/offline
- [ ] Testar validação do Preposto

---

## 🔧 TIPOS DE ALTERAÇÕES {#tipos-de-alteracoes}

### **1️⃣ ADICIONAR NOVO CAMPO (SEGURO)**
**Exemplo:** Adicionar campo "pressaoAtmosferica" em Condições Ambientais

**Impacto:** BAIXO  
**Risco de quebra:** ⚠️ BAIXO (se seguir as regras)

**Regras:**
- ✅ Sempre adicionar como **opcional** (`?`)
- ✅ Fornecer valor padrão no formulário
- ✅ Não exigir validação obrigatória inicialmente
- ✅ Verificar compatibilidade com dados antigos

---

### **2️⃣ MODIFICAR CAMPO EXISTENTE (ATENÇÃO)**
**Exemplo:** Mudar "temperaturaMin" de `string` para `number`

**Impacto:** MÉDIO  
**Risco de quebra:** 🔴 ALTO (pode quebrar dados existentes)

**Regras:**
- ⚠️ **NUNCA** mudar o tipo de dados diretamente
- ✅ Criar campo novo com sufixo `_v2` (ex: `temperaturaMin_v2`)
- ✅ Manter campo antigo por 1 versão (depreciar)
- ✅ Migrar dados antigos gradualmente
- ✅ Adicionar lógica de fallback: `formData.temperaturaMin_v2 ?? formData.temperaturaMin`

**Exemplo de Migração Segura:**
```typescript
// ❌ ERRADO - Quebra dados antigos
export interface FormData {
  temperaturaMin: number; // Era string!
}

// ✅ CORRETO - Compatibilidade retroativa
export interface FormData {
  temperaturaMin?: string; // Deprecado (manter por 1 versão)
  temperaturaMin_v2?: number; // Novo campo
}

// No componente:
const temp = formData.temperaturaMin_v2 
  ?? (formData.temperaturaMin ? Number(formData.temperaturaMin) : '');
```

---

### **3️⃣ REMOVER CAMPO (PERIGOSO)**
**Exemplo:** Remover campo "ucrete"

**Impacto:** ALTO  
**Risco de quebra:** 🔴 MUITO ALTO

**Regras:**
- 🚫 **NUNCA** remover campo diretamente
- ✅ **FASE 1:** Marcar como deprecado (comentário `@deprecated`)
- ✅ **FASE 2:** Tornar opcional (`?`)
- ✅ **FASE 3:** Ocultar do formulário (não remover do tipo)
- ✅ **FASE 4:** Após 2 versões, remover (se necessário)

**Exemplo de Deprecação Segura:**
```typescript
export interface FormData {
  /**
   * @deprecated Removido na v1.2.0. Use campo alternativo.
   * Mantido para compatibilidade com dados antigos.
   */
  ucrete?: string;
}
```

---

### **4️⃣ RENOMEAR CAMPO (MUITO PERIGOSO)**
**Exemplo:** Renomear "espessura" para "espessuraCamada"

**Impacto:** MUITO ALTO  
**Risco de quebra:** 🔴 CRÍTICO

**Regras:**
- 🚫 **NUNCA** renomear diretamente
- ✅ Criar campo novo com nome desejado
- ✅ Manter campo antigo (depreciar)
- ✅ Sincronizar ambos os campos no formulário
- ✅ Adicionar lógica de migração automática

**Exemplo:**
```typescript
export interface FormData {
  /** @deprecated Use espessuraCamada */
  espessura?: string;
  espessuraCamada?: string;
}

// No componente:
const handleChange = (value: string) => {
  setFormData({
    ...formData,
    espessuraCamada: value,
    espessura: value, // Manter sincronizado
  });
};
```

---

### **5️⃣ ADICIONAR CAMPOS CONDICIONAIS (MÉDIO)**
**Exemplo:** Adicionar "servico4" em ServicosSection

**Impacto:** MÉDIO  
**Risco de quebra:** ⚠️ MÉDIO

**Regras:**
- ✅ Adicionar como opcional no tipo
- ✅ Atualizar lógica de validação
- ✅ Verificar loops que iteram sobre serviços
- ✅ Atualizar PDF/Excel generators

---

## 🎯 ORDEM DE MODIFICAÇÃO {#ordem-de-modificacao}

### **SEMPRE SEGUIR ESTA ORDEM:**

```
1️⃣ /src/app/types/index.ts
   └─→ Atualizar interface FormData (FONTE DA VERDADE)

2️⃣ /src/app/components/form-sections/*.tsx
   └─→ Adicionar campo no formulário (UI)

3️⃣ /src/app/components/ViewRespostasModal.tsx
   └─→ Adicionar campo na visualização

4️⃣ /src/app/utils/pdfGenerator.ts
   └─→ Adicionar campo no PDF

5️⃣ /src/app/utils/excelGenerator.ts
   └─→ Adicionar campo no Excel

6️⃣ /src/app/utils/database.ts (Se necessário)
   └─→ Atualizar lógica de salvamento

7️⃣ /src/app/components/PrepostoValidationPage.tsx (Se afetar validação)
   └─→ Atualizar lógica de conferência do Preposto

8️⃣ /supabase/functions/server/email.tsx (Se afetar emails)
   └─→ Atualizar template de email

9️⃣ TESTES (Obrigatório)
   └─→ Executar checklist completo
```

---

## 🔄 COMPATIBILIDADE COM DADOS EXISTENTES {#compatibilidade}

### **REGRA DE OURO:**
> **NOVOS CAMPOS = SEMPRE OPCIONAIS (`?`)**

### **Exemplo Prático - Adicionar "ventoVelocidade":**

#### **1️⃣ Atualizar Tipo (index.ts):**
```typescript
export interface FormData {
  // Campos existentes
  temperaturaMin: string;
  temperaturaMax: string;
  umidade: string;
  
  // ✅ NOVO CAMPO - OPCIONAL
  ventoVelocidade?: string;
}
```

#### **2️⃣ Adicionar no Formulário (CondicoesAmbientaisSection.tsx):**
```typescript
<NumberInput
  label="Velocidade do Vento (km/h)"
  value={formData.ventoVelocidade || ''} // ✅ Valor padrão
  onChange={(value) => updateFormData({ ventoVelocidade: value })}
  placeholder="Ex: 15"
/>
```

#### **3️⃣ Atualizar Visualização (ViewRespostasModal.tsx):**
```typescript
{formData.ventoVelocidade && ( // ✅ Renderização condicional
  <div className="flex items-start gap-3">
    <Wind className="w-5 h-5 text-[#FD5521] flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">Vento:</p>
      <p className="font-medium text-gray-900 dark:text-white">
        {formData.ventoVelocidade} km/h
      </p>
    </div>
  </div>
)}
```

#### **4️⃣ Atualizar PDF (pdfGenerator.ts):**
```typescript
if (formData.ventoVelocidade) { // ✅ Verificar existência
  doc.text(`Vento: ${formData.ventoVelocidade} km/h`, leftMargin, y);
  y += lineHeight;
}
```

#### **5️⃣ Atualizar Excel (excelGenerator.ts):**
```typescript
{
  'Velocidade do Vento (km/h)': formData.ventoVelocidade || 'N/A' // ✅ Fallback
}
```

---

### **⚠️ DADOS ANTIGOS SEM O NOVO CAMPO:**

Quando um formulário antigo é carregado, `ventoVelocidade` será `undefined`.

**Como lidar:**
```typescript
// ✅ CORRETO - Sempre verificar
const vento = formData.ventoVelocidade || 'Não informado';

// ❌ ERRADO - Pode quebrar
const vento = formData.ventoVelocidade.toUpperCase(); // Error: Cannot read property 'toUpperCase' of undefined
```

---

## 🧪 TESTES OBRIGATÓRIOS {#testes}

### **CHECKLIST DE TESTES - Execute TODOS:**

#### **1️⃣ TESTE DE CRIAÇÃO:**
- [ ] Criar nova obra
- [ ] Preencher formulário com NOVO campo
- [ ] Salvar como rascunho (offline)
- [ ] Enviar para Preposto
- [ ] Verificar se campo aparece na visualização

#### **2️⃣ TESTE DE EDIÇÃO:**
- [ ] Editar formulário salvo
- [ ] Modificar NOVO campo
- [ ] Salvar novamente
- [ ] Verificar se alteração persistiu

#### **3️⃣ TESTE DE COMPATIBILIDADE:**
- [ ] **CRÍTICO:** Abrir formulário ANTIGO (sem o novo campo)
- [ ] Verificar se NÃO quebrou (sem erros no console)
- [ ] Editar e salvar formulário antigo
- [ ] Verificar se campo novo pode ser adicionado

#### **4️⃣ TESTE DE EXPORTAÇÃO:**
- [ ] Baixar PDF de formulário NOVO
- [ ] Baixar PDF de formulário ANTIGO
- [ ] Baixar Excel de formulário NOVO
- [ ] Baixar Excel de formulário ANTIGO
- [ ] Verificar se ambos funcionam

#### **5️⃣ TESTE DE VALIDAÇÃO PREPOSTO:**
- [ ] Enviar formulário para Preposto
- [ ] Abrir link de validação
- [ ] Verificar se campo aparece corretamente
- [ ] Aprovar/Reprovar
- [ ] Verificar se sincronizou

#### **6️⃣ TESTE DE SINCRONIZAÇÃO:**
- [ ] Criar formulário offline
- [ ] Conectar à internet
- [ ] Aguardar sincronização automática
- [ ] Verificar se NOVO campo foi enviado ao Supabase

#### **7️⃣ TESTE DE NOTIFICAÇÕES/EMAIL:**
- [ ] Enviar formulário
- [ ] Verificar email recebido
- [ ] Confirmar que NOVO campo aparece (se aplicável)

---

## 🚨 ROLLBACK DE EMERGÊNCIA {#rollback}

### **Se algo der errado:**

#### **Opção 1: Reverter Git (Recomendado)**
```bash
# Ver commits recentes
git log --oneline -5

# Reverter para commit anterior
git revert <commit-hash>

# Ou resetar (CUIDADO: perde mudanças)
git reset --hard <commit-hash>
```

#### **Opção 2: Tornar Campo Opcional**
Se o campo causou problemas, não remova! Torne opcional:

```typescript
// Era:
novoCapo: string;

// Agora:
novoCampo?: string;
```

Depois adicione valores padrão em TODOS os lugares:
```typescript
const valor = formData.novoCampo || '';
```

#### **Opção 3: Esconder do UI (Manter no Tipo)**
```typescript
// Em FormSection.tsx - Comentar o campo:
{/* TEMPORARIAMENTE DESABILITADO - Bug em investigação
<NumberInput
  label="Novo Campo"
  value={formData.novoCampo || ''}
  ...
/>
*/}
```

---

## 📌 RESUMO RÁPIDO

**REGRAS DE OURO:**

1. ✅ **Novos campos = SEMPRE opcionais (`?`)**
2. ✅ **Modificar tipo = Criar campo novo (_v2)**
3. ✅ **Remover campo = Depreciar primeiro**
4. ✅ **Renomear = Criar novo + manter antigo**
5. ✅ **Testar com dados antigos SEMPRE**
6. ✅ **Seguir ordem de modificação**
7. ✅ **Valores padrão em TUDO**
8. ✅ **Verificar PDF/Excel/Email**
9. ✅ **Fazer backup antes (git commit)**
10. ✅ **Quando em dúvida, pergunte!**

---

**Versão do Guia:** 1.0  
**Data:** 2026-01-12  
**Sistema:** v1.0.0
