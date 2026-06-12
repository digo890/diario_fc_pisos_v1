# 🔧 CORREÇÃO CRÍTICA: userRole no Middleware de Autenticação

**Data:** 12/01/2026  
**Prioridade:** 🔴 CRÍTICA  
**Status:** ✅ RESOLVIDO

---

## 🐛 PROBLEMA DETECTADO

### **Erro:**
```
🛡️ [RLS] Apenas administradores podem reparar dados
Status: 403 Forbidden
```

### **Contexto:**
- Rota de reparo criada para administradores
- Backend validava: `if (userRole !== "Administrador")`
- **MAS:** `userRole` era `undefined` no contexto!

### **Causa Raiz:**
O middleware `requireAuth` não estava definindo a propriedade `userRole` no contexto do Hono. Ele apenas definia:
- ✅ `userId`
- ✅ `userEmail`
- ❌ `userRole` (FALTANDO!)

---

## ✅ SOLUÇÃO IMPLEMENTADA

### **Localização:**
`/supabase/functions/server/index.tsx` - Middleware `requireAuth`

### **Código Adicionado:**

```typescript
// Attach user to context
c.set("userId", user.id);
c.set("userEmail", user.email);

// 🔧 CORREÇÃO: Buscar role do usuário no KV
const userRecord = await kv.get(`user:${user.id}`);
if (userRecord) {
  c.set("userRole", userRecord.role);
  safeLog(`✅ [AUTH] Role do usuário: ${userRecord.role}`);
} else {
  safeWarn(`⚠️ [AUTH] Usuário ${user.id} não encontrado no KV`);
  c.set("userRole", "Encarregado"); // Default para segurança
}

await next();
```

### **O que foi feito:**

1. ✅ Busca o registro do usuário no KV usando `user:${userId}`
2. ✅ Extrai o campo `role` do registro
3. ✅ Define `userRole` no contexto com `c.set("userRole", userRecord.role)`
4. ✅ Adiciona log para auditoria
5. ✅ Define role padrão "Encarregado" se usuário não encontrado (segurança)

### **Aplicado em dois lugares:**

**Branch 1:** Quando `getUser()` funciona (linha ~235)
**Branch 2:** Quando usa método alternativo (linha ~210)

---

## 🔍 ANTES vs DEPOIS

### **ANTES:**

```typescript
// Middleware requireAuth
c.set("userId", user.id);
c.set("userEmail", user.email);
await next();

// Na rota /repair
const userRole = c.get("userRole"); // ❌ undefined
if (userRole !== "Administrador") {
  return c.json({ error: "Apenas administradores..." }, 403);
}
```

**Resultado:** ❌ Sempre retorna 403, mesmo para admins!

---

### **DEPOIS:**

```typescript
// Middleware requireAuth
c.set("userId", user.id);
c.set("userEmail", user.email);

// 🔧 NOVO
const userRecord = await kv.get(`user:${user.id}`);
c.set("userRole", userRecord.role); // ✅ "Administrador"

await next();

// Na rota /repair
const userRole = c.get("userRole"); // ✅ "Administrador"
if (userRole !== "Administrador") {
  return c.json({ error: "Apenas administradores..." }, 403);
}
```

**Resultado:** ✅ Funciona corretamente para admins!

---

## 🎯 IMPACTO DA CORREÇÃO

### **Rotas Afetadas:**

Esta correção beneficia TODAS as rotas que validam role, incluindo:

1. ✅ `/obras/:id/repair` - Reparo administrativo
2. ✅ `/obras` POST - Criação de obras (restrições por role)
3. ✅ `/obras/:id` PUT - Atualização de obras (validação de campos permitidos)
4. ✅ `/usuarios` POST/PUT/DELETE - Gestão de usuários (admin only)
5. ✅ Qualquer rota futura que precise validar role

### **Antes:**
- ❌ Validações de role NÃO funcionavam
- ❌ Backend sempre rejeitava operações administrativas
- ❌ Segurança comprometida (ou bloqueio total)

### **Depois:**
- ✅ Validações de role funcionam corretamente
- ✅ Administradores têm acesso às funções administrativas
- ✅ Encarregados continuam restritos
- ✅ Segurança restaurada

---

## 🔐 SEGURANÇA

### **Fallback Seguro:**

Se o usuário não for encontrado no KV, o sistema define role como `"Encarregado"`:

```typescript
c.set("userRole", "Encarregado"); // Default para segurança
```

**Por que "Encarregado" e não "Administrador"?**
- ✅ Princípio do menor privilégio
- ✅ Se algo der errado, o usuário tem MENOS permissões, não MAIS
- ✅ Previne escalação de privilégios em caso de bug

---

## 📊 LOGS GERADOS

### **Sucesso (Administrador):**
```
🔐 [AUTH] Validando token...
✅ [AUTH] Token válido para usuário: admin@example.com
✅ [AUTH] Role do usuário: Administrador
```

### **Sucesso (Encarregado):**
```
🔐 [AUTH] Validando token...
✅ [AUTH] Token válido para usuário: encarregado@example.com
✅ [AUTH] Role do usuário: Encarregado
```

### **Usuário não encontrado no KV:**
```
🔐 [AUTH] Validando token...
✅ [AUTH] Token válido para usuário: user@example.com
⚠️ [AUTH] Usuário abc123 não encontrado no KV
```

---

## 🧪 TESTES

### **Teste 1: Administrador tenta reparar**

**Pré-condição:** Usuário logado é admin

```bash
POST /obras/:id/repair
X-User-Token: <admin-token>
```

**Resultado esperado:** ✅ 200 OK

---

### **Teste 2: Encarregado tenta reparar**

**Pré-condição:** Usuário logado é encarregado

```bash
POST /obras/:id/repair
X-User-Token: <encarregado-token>
```

**Resultado esperado:** ❌ 403 Forbidden

---

### **Teste 3: Usuário não autenticado**

```bash
POST /obras/:id/repair
# Sem token
```

**Resultado esperado:** ❌ 401 Unauthorized

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Após deploy, verificar:

- [ ] Administrador consegue usar rota `/repair`
- [ ] Encarregado é bloqueado na rota `/repair` (403)
- [ ] Log mostra role corretamente
- [ ] Outras rotas com validação de role funcionam
- [ ] Sem erros 500 em nenhuma rota

---

## 📝 COMMIT MESSAGE SUGERIDA

```
fix(auth): define userRole no middleware requireAuth

- Middleware agora busca role do usuário no KV
- Define userRole no contexto do Hono
- Permite validações de role funcionarem corretamente
- Adiciona fallback seguro (Encarregado) se usuário não encontrado
- Corrige erro 403 na rota /obras/:id/repair para admins
- Adiciona logs de auditoria

BREAKING: Rotas que dependem de userRole agora funcionam corretamente
```

---

## 🚀 DEPLOY

### **Arquivos Modificados:**
1. `/supabase/functions/server/index.tsx`

### **Comandos:**
```bash
# Deploy da Edge Function
npx supabase functions deploy make-server-1ff231a2

# Verificar deploy
npx supabase functions list

# Ver logs em tempo real
npx supabase functions logs make-server-1ff231a2 --tail
```

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- `/SOLUCAO_REPARO_STATUS.md` - Contexto da rota de reparo
- `/CORRECOES_APLICADAS.md` - Histórico completo de correções
- `/COMO_REPARAR_DADOS.md` - Guia do usuário

---

## 🎓 LIÇÕES APRENDIDAS

### **1. Sempre definir contexto completo no middleware**
Não basta definir `userId`. Se outras partes do código precisam de `userRole`, o middleware deve fornecer.

### **2. Testar validações de autorização**
Um bug no middleware pode quebrar TODAS as validações de role.

### **3. Logs são essenciais**
Sem o log mostrando o role, seria muito mais difícil identificar o problema.

### **4. Fallback seguro**
Quando em dúvida, dar MENOS permissões, nunca MAIS.

---

**FIM DO DOCUMENTO** ✅

**Status:** Correção implementada e pronta para deploy!
