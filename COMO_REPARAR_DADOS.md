# 🔧 GUIA DE REPARO DE DADOS - Diário de Obras FC Pisos

**Versão:** 1.0.1  
**Data:** 12/01/2026  
**Sistema:** Reparo Automático de Inconsistências

---

## ⚠️ PROBLEMA DETECTADO

```
🐛 Inconsistência de dados na obra e46cb2bd-f1b3-4c0d-b937-44ff396f4785: 
   status=enviado_preposto mas formData não existe
```

### **O que causa isso?**
Uma obra está marcada como "Enviado ao Preposto" mas não tem formulário associado. Isso pode acontecer por:
- Sincronização interrompida
- Falha ao criar formulário
- Dados corrompidos no IndexedDB

---

## ✅ SOLUÇÕES DISPONÍVEIS

### **1️⃣ REPARO AUTOMÁTICO AO CLICAR (RECOMENDADO)**

**Como funciona:**
1. Abra o Admin Dashboard
2. Clique na obra com problema
3. O sistema detecta a inconsistência
4. **Repara automaticamente**:
   - Reverte status para "em_preenchimento"
   - Salva localmente e no backend
   - Recarrega os dados
5. Mostra mensagem de sucesso

**Sem esforço! Apenas clique na obra.** ✨

---

### **2️⃣ BOTÃO DE REPARO MANUAL (EMERGENCIAL)**

**Quando usar:**
- Quando o reparo automático falhar
- Para corrigir múltiplas obras de uma vez
- Para diagnóstico completo

**Como usar:**
1. Abra o Admin Dashboard
2. Clique no botão **🔧 (chave inglesa)** no header (ao lado do sino de notificações)
3. Aguarde o reparo executar
4. Verifique a mensagem de sucesso

**O que ele faz:**
- ✅ Detecta TODAS as inconsistências
- ✅ Corrige status de obras sem formulário
- ✅ Remove formulários órfãos (se houver)
- ✅ Recarrega dados automaticamente
- ✅ Mostra relatório de correções

---

### **3️⃣ REPARO AUTOMÁTICO AO CARREGAR (INVISÍVEL)**

**Como funciona:**
- Executa automaticamente ao abrir o dashboard
- Detecta e corrige inconsistências em segundo plano
- Sem intervenção do usuário

**Quando ocorre:**
- Sempre que o Admin Dashboard é carregado
- Após sincronização com backend
- Após criar/editar obras

---

## 📊 FLUXO DE REPARO

```
┌─────────────────────────────────────┐
│ Obra com status "enviado_preposto" │
│ mas SEM formulário                  │
└─────────────────┬───────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ Sistema DETECTA     │
        │ inconsistência      │
        └─────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ CORRIGE AUTOMÁTICO: │
        │ status →            │
        │ "em_preenchimento"  │
        └─────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ SALVA localmente    │
        │ + backend           │
        └─────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ RECARREGA dados     │
        │ ✅ PRONTO!          │
        └─────────────────────┘
```

---

## 🎯 EXEMPLO PRÁTICO

### **Cenário: Obra com status errado**

**Antes:**
```json
{
  "id": "e46cb2bd-f1b3-4c0d-b937-44ff396f4785",
  "cliente": "Cliente XYZ",
  "obra": "Obra ABC",
  "status": "enviado_preposto",  ❌ ERRADO
  "formulario": null               ❌ NÃO EXISTE
}
```

**Depois do reparo:**
```json
{
  "id": "e46cb2bd-f1b3-4c0d-b937-44ff396f4785",
  "cliente": "Cliente XYZ",
  "obra": "Obra ABC",
  "status": "em_preenchimento",   ✅ CORRIGIDO
  "formulario": null               ✅ OK (pode criar agora)
}
```

**Resultado:**
- ✅ Obra volta para estado seguro
- ✅ Encarregado pode preencher formulário
- ✅ Fluxo continua normalmente

---

## 🔧 ROTA DE REPARO ESPECIAL

O sistema agora usa uma **rota administrativa especial** (`/obras/:id/repair`) que:
- ✅ Bypassa validações de transição de status
- ✅ Permite reverter status "enviado_preposto" → "em_preenchimento"
- ✅ Exclusiva para administradores
- ✅ Registra logs de auditoria

**Backend:** `/supabase/functions/server/index.tsx`  
**Frontend:** `/src/app/utils/api.ts` (função `obraApi.repair()`)

---

## 🚨 CASOS ESPECIAIS

### **Caso 1: Obra já tinha formulário preenchido**
**Solução:** Não perde dados! O sistema só corrige o status se realmente não houver formulário.

### **Caso 2: Erro ao salvar no backend**
**Solução:** Salva localmente de qualquer forma. A rota de reparo é usada automaticamente.

### **Caso 3: Múltiplas obras com problema**
**Solução:** Use o botão de reparo manual (🔧) para corrigir todas de uma vez.

### **Caso 4: Backend rejeita transição de status**
**Solução:** Sistema usa automaticamente a rota `/repair` que bypassa validações.

---

## 📝 LOGS GERADOS

### **Console do navegador (F12):**

```
🔧 CORRIGINDO AUTOMATICAMENTE: enviado_preposto → em_preenchimento
✅ Status corrigido no backend também
🔧 1 inconsistência(s) corrigida(s) automaticamente
```

### **Toast (mensagem na tela):**

```
✅ Inconsistência corrigida! 
A obra foi revertida para "Em preenchimento". 
Você pode agora preencher o formulário.
```

---

## 🔍 COMO PREVENIR NO FUTURO

1. ✅ Sempre aguarde a sincronização completa antes de fechar o app
2. ✅ Não force o fechamento do navegador durante upload
3. ✅ Verifique se há conexão antes de enviar ao preposto
4. ✅ Use o botão de reparo (🔧) semanalmente para manutenção

---

## 🆘 SUPORTE

**Se o reparo falhar:**

1. Abra o console do navegador (F12)
2. Copie os logs de erro
3. Envie para o suporte técnico
4. Inclua:
   - ID da obra
   - Status atual
   - Mensagem de erro completa

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Após o reparo, verifique:

- [ ] Obra não aparece mais com erro no console
- [ ] Status da obra está correto
- [ ] É possível clicar na obra sem erro
- [ ] Encarregado consegue preencher formulário
- [ ] Sincronização com backend funcionando

---

**FIM DO GUIA** ✅
