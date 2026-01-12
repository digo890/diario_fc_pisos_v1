# 🔍 DEBUG: Erro 404 "Formulário não encontrado" na Conferência

## 📅 Data
12/01/2026

## 🚨 Problema
Após deploy, criar obra nova e enviar ao preposto, o link de conferência retorna erro "Formulário não encontrado".

## 🔧 Logs de Debug Adicionados

### 1️⃣ Backend - Rota de Email (`/emails/send-preposto-conferencia`)
**Arquivo:** `/supabase/functions/server/index.tsx` (linha ~1638)

```typescript
console.log("📤 Dados recebidos:", {
  prepostoEmail,
  obraNome,
  formularioId,
});
console.log("🔍 [DEBUG] Tipo do formularioId recebido:", typeof formularioId);
console.log("🔍 [DEBUG] Tamanho do formularioId:", formularioId?.length);

// ...

const linkConferencia = `https://diario-fc-pisos-v1.vercel.app/conferencia/${formularioId}`;
console.log("🔗 [DEBUG] Link gerado:", linkConferencia);
```

**O que verificar:**
- ✅ O `formularioId` é uma string válida?
- ✅ O tamanho é 36 caracteres (UUID padrão)?
- ✅ O link está correto?

---

### 2️⃣ Backend - Rota de Conferência (`/conferencia/:formularioId`)
**Arquivo:** `/supabase/functions/server/index.tsx` (linha ~1896)

```typescript
console.log("🔍 [CONFERÊNCIA] Buscando formulário:", formularioId);
console.log("🔍 [DEBUG] Tipo do formularioId:", typeof formularioId);
console.log("🔍 [DEBUG] Tamanho do formularioId:", formularioId?.length);

const chave = `formulario:${formularioId}`;
console.log("🔍 [DEBUG] Buscando chave no KV:", chave);
const formulario = await kv.get(chave);

console.log("🔍 [DEBUG] Resultado da busca:", formulario ? "ENCONTRADO" : "NÃO ENCONTRADO");

if (!formulario) {
  console.warn("⚠️ Formulário não encontrado:", formularioId);
  console.warn("⚠️ Chave buscada:", chave);
  
  // 🔍 DEBUG: Listar todos os formulários no banco
  try {
    const todosFormularios = await kv.getByPrefix("formulario:");
    console.log("🔍 [DEBUG] Total de formulários no banco:", todosFormularios?.length || 0);
    if (todosFormularios && todosFormularios.length > 0) {
      console.log("🔍 [DEBUG] IDs dos formulários existentes:", 
        todosFormularios.map((f: any) => f.id).slice(0, 5));
    }
  } catch (debugError) {
    console.error("❌ Erro ao buscar formulários para debug:", debugError);
  }
}
```

**O que verificar:**
- ✅ O `formularioId` recebido na URL é o mesmo enviado no email?
- ✅ A chave `formulario:${formularioId}` está correta?
- ✅ Existe algum formulário no banco?
- ✅ Os IDs dos formulários existentes batem com o ID buscado?

---

### 3️⃣ Frontend - Criação do Formulário
**Arquivo:** `/src/app/components/FormularioPage.tsx` (linha ~281)

```typescript
// Criar novo formulário
formularioId = crypto.randomUUID();
safeLog(`🔑 [DEBUG] UUID gerado para formulário: ${formularioId}`);
safeLog(`🔍 [DEBUG] Tipo do UUID: ${typeof formularioId}, Tamanho: ${formularioId.length}`);

const payload = {
  id: formularioId,
  obra_id: obra.id,
  ...updatedForm
};
safeLog(`📤 [DEBUG] Payload para criar formulário:`, { id: formularioId, obra_id: obra.id });

await formularioApi.create(payload);
safeLog(`✅ Formulário criado no backend com ID: ${formularioId}`);
```

**O que verificar:**
- ✅ O UUID foi gerado corretamente?
- ✅ Tem 36 caracteres?
- ✅ Foi enviado no payload?

---

### 4️⃣ Frontend - Envio do Email
**Arquivo:** `/src/app/components/FormularioPage.tsx` (linha ~317)

```typescript
safeLog('📧 Iniciando envio de email para preposto...');
safeLog(`🔑 [DEBUG] formularioId que será enviado no email: ${formularioId}`);
safeLog(`🔍 [DEBUG] Tipo: ${typeof formularioId}, Tamanho: ${formularioId?.length}`);

const emailResult = await sendPrepostoConferenciaEmail({
  prepostoEmail: obra.prepostoEmail,
  prepostoNome: obra.prepostoNome || 'Preposto',
  formularioId, // ✅ Agora garantidamente definido
  obraNome: obra.obra,
  cliente: obra.cliente,
  cidade: obra.cidade,
  encarregadoNome: currentUser?.nome || 'Encarregado',
});
```

**O que verificar:**
- ✅ O `formularioId` enviado é o mesmo que foi criado?
- ✅ Não é `undefined`?

---

## 🎯 Passos para Debugar

### 1️⃣ Faça o Deploy
```bash
# Supabase Dashboard
# Deploy da Edge Function (sem "Verify JWT with legacy secret")
```

### 2️⃣ Abra o Console de Logs
```
Supabase Dashboard → Edge Functions → Logs
```

### 3️⃣ Crie uma Obra Nova
- ✅ Preencha o formulário completo
- ✅ Clique em "Enviar ao Preposto"

### 4️⃣ Monitore os Logs do Frontend
**Console do Navegador:**
```
🔑 [DEBUG] UUID gerado para formulário: abc-123-def-456
🔍 [DEBUG] Tipo do UUID: string, Tamanho: 36
📤 [DEBUG] Payload para criar formulário: {id: "abc-123-def-456", obra_id: "..."}
✅ Formulário criado no backend com ID: abc-123-def-456
🔑 [DEBUG] formularioId que será enviado no email: abc-123-def-456
🔍 [DEBUG] Tipo: string, Tamanho: 36
✅ Email enviado com sucesso ao preposto
```

### 5️⃣ Monitore os Logs do Backend (Email)
**Supabase Edge Function Logs:**
```
📧 Rota /emails/send-preposto-conferencia chamada
📤 Dados recebidos: {
  prepostoEmail: "preposto@example.com",
  obraNome: "Obra Teste",
  formularioId: "abc-123-def-456"
}
🔍 [DEBUG] Tipo do formularioId recebido: string
🔍 [DEBUG] Tamanho do formularioId: 36
🔗 [DEBUG] Link gerado: https://diario-fc-pisos-v1.vercel.app/conferencia/abc-123-def-456
✅ Email enviado com sucesso
```

### 6️⃣ Clique no Link do Email

### 7️⃣ Monitore os Logs do Backend (Conferência)
**Supabase Edge Function Logs:**
```
🔍 [CONFERÊNCIA] Buscando formulário: abc-123-def-456
🔍 [DEBUG] Tipo do formularioId: string
🔍 [DEBUG] Tamanho do formularioId: 36
🔍 [DEBUG] Buscando chave no KV: formulario:abc-123-def-456
🔍 [DEBUG] Resultado da busca: ENCONTRADO ✅
✅ Formulário e obra encontrados
```

**OU (se der erro):**
```
🔍 [CONFERÊNCIA] Buscando formulário: abc-123-def-456
🔍 [DEBUG] Tipo do formularioId: string
🔍 [DEBUG] Tamanho do formularioId: 36
🔍 [DEBUG] Buscando chave no KV: formulario:abc-123-def-456
🔍 [DEBUG] Resultado da busca: NÃO ENCONTRADO ❌
⚠️ Formulário não encontrado: abc-123-def-456
⚠️ Chave buscada: formulario:abc-123-def-456
🔍 [DEBUG] Total de formulários no banco: 5
🔍 [DEBUG] IDs dos formulários existentes: ["xyz-789", "def-456", ...]
```

---

## 🔍 Cenários Possíveis

### ✅ CENÁRIO 1: UUID Diferente
```
CRIADO:  formulario:abc-123-def-456
BUSCADO: formulario:xyz-789-ghi-012
```
**Causa:** O formulário está sendo criado com um ID, mas o email está enviando outro.

**Solução:** Verificar se há alguma lógica que sobrescreve o `formularioId` antes do email.

---

### ✅ CENÁRIO 2: Formulário Não Foi Salvo
```
CRIADO:  (erro ao criar)
BUSCADO: formulario:abc-123-def-456
```
**Causa:** A chamada `formularioApi.create()` falhou silenciosamente.

**Solução:** Verificar logs do backend na criação.

---

### ✅ CENÁRIO 3: Timing Issue
```
EMAIL ENVIADO: 10:00:00
FORMULÁRIO CRIADO: 10:00:01 (1 segundo depois!)
```
**Causa:** O email está sendo enviado ANTES do formulário ser salvo no banco.

**Solução:** Garantir que await está correto.

---

### ✅ CENÁRIO 4: Chave Errada
```
CRIADO:  formulario:abc-123-def-456
BUSCADO: obra:abc-123-def-456 (prefixo errado!)
```
**Causa:** Bug no código que monta a chave.

**Solução:** Revisar código de busca.

---

## 📊 Verificação no Supabase Database

```sql
-- Ver todos os formulários
SELECT key, value->>'id' as id, value->>'obra_id' as obra_id 
FROM kv_store_1ff231a2 
WHERE key LIKE 'formulario:%'
ORDER BY value->>'created_at' DESC
LIMIT 10;

-- Buscar um formulário específico
SELECT * 
FROM kv_store_1ff231a2 
WHERE key = 'formulario:abc-123-def-456';
```

---

## 🚀 Próximos Passos

1. ✅ Fazer deploy com logs
2. ✅ Criar obra nova
3. ✅ Coletar todos os logs (frontend + backend)
4. ✅ Comparar IDs em cada etapa
5. ✅ Identificar onde está a discrepância

---

## 📝 Notas

- ✅ Todos os logs começam com emojis para facilitar busca
- ✅ Logs incluem tipo e tamanho para detectar problemas de conversão
- ✅ Logs do backend incluem listagem de todos os formulários se não encontrar
- ✅ Logs do frontend incluem payload completo

---

## 🔗 Links Úteis

- **Supabase Logs:** https://supabase.com/dashboard/project/cjwuooaappcnsqxgdpta/logs/edge-functions
- **Database:** https://supabase.com/dashboard/project/cjwuooaappcnsqxgdpta/database/tables
- **Frontend Console:** DevTools → Console (filtrar por "[DEBUG]")
