# 🎯 INSTRUÇÕES RÁPIDAS DE DEBUG

## 🚀 PASSO A PASSO

### 1️⃣ Fazer Deploy
```
✅ Supabase Dashboard → Edge Functions
✅ Deploy Updates
✅ NÃO marcar "Verify JWT with legacy secret"
✅ Aguardar confirmação
```

### 2️⃣ Abrir Console de Logs
```
✅ Supabase: https://supabase.com/dashboard/project/cjwuooaappcnsqxgdpta/logs/edge-functions
✅ Frontend: DevTools → Console (F12)
```

### 3️⃣ Criar Obra Nova
```
✅ Login no app
✅ Criar NOVA obra (não usar antigas!)
✅ Preencher formulário completo
✅ Clicar "Enviar ao Preposto"
```

### 4️⃣ Coletar Logs do Frontend
**Procurar no Console do navegador:**
```
🔑 [DEBUG] UUID gerado para formulário: ?????
🔍 [DEBUG] Tipo do UUID: string, Tamanho: 36
📤 [DEBUG] Payload para criar formulário: {id: "????", obra_id: "..."}
✅ Formulário criado no backend com ID: ?????
🔑 [DEBUG] formularioId que será enviado no email: ?????
```

**📝 Anotar:** Qual é o UUID do formulário?

### 5️⃣ Coletar Logs do Backend (Email)
**Procurar nos logs da Edge Function:**
```
📧 Rota /emails/send-preposto-conferencia chamada
📤 Dados recebidos: { formularioId: "?????" }
🔍 [DEBUG] Tipo do formularioId recebido: string
🔍 [DEBUG] Tamanho do formularioId: 36
🔗 [DEBUG] Link gerado: https://diario-fc-pisos-v1.vercel.app/conferencia/?????
```

**📝 Comparar:** 
- ✅ O ID do frontend é o MESMO do backend?
- ✅ Se não, onde está mudando?

### 6️⃣ Abrir Email e Clicar no Link

### 7️⃣ Coletar Logs do Backend (Conferência)
**Procurar nos logs da Edge Function:**
```
🔍 [CONFERÊNCIA] Buscando formulário: ?????
🔍 [DEBUG] Tipo do formularioId: string
🔍 [DEBUG] Tamanho do formularioId: 36
🔍 [DEBUG] Buscando chave no KV: formulario:?????
🔍 [DEBUG] Resultado da busca: ENCONTRADO ou NÃO ENCONTRADO
```

**Se NÃO ENCONTRADO:**
```
🔍 [DEBUG] Total de formulários no banco: X
🔍 [DEBUG] IDs dos formulários existentes: [...]
```

### 8️⃣ Análise

**Compare os 3 IDs:**
```
ID Criado (frontend):  _______________________
ID Enviado (email):    _______________________
ID Buscado (link):     _______________________
```

**São todos iguais?**
- ✅ SIM → O formulário não foi salvo no banco (verificar SQL)
- ❌ NÃO → Descobrir onde o ID está mudando

---

## 🔍 VERIFICAÇÃO NO BANCO DE DADOS

**SQL Editor do Supabase:**
```sql
-- Ver últimos formulários criados
SELECT 
  key, 
  value->>'id' as id, 
  value->>'obra_id' as obra_id,
  value->>'created_at' as created_at
FROM kv_store_1ff231a2 
WHERE key LIKE 'formulario:%'
ORDER BY value->>'created_at' DESC
LIMIT 10;
```

**Verificar:**
- ✅ O ID do formulário criado aparece na lista?
- ✅ A chave é `formulario:${id}` ou tem algo diferente?

---

## 📋 CHECKLIST DE POSSÍVEIS PROBLEMAS

### ❌ PROBLEMA 1: IDs Diferentes
```
✅ Solução: Verificar se há código que sobrescreve formularioId
✅ Buscar: obra.validationToken (não deve mais existir!)
```

### ❌ PROBLEMA 2: Formulário Não Salvo
```
✅ Solução: Verificar logs de erro na criação
✅ Buscar: "Erro ao criar formulário"
```

### ❌ PROBLEMA 3: Timing (Email Antes de Salvar)
```
✅ Solução: Verificar se await está correto
✅ Buscar: ordem dos logs (criar → email)
```

### ❌ PROBLEMA 4: Chave Errada no Banco
```
✅ Solução: Verificar se key no SQL tem formato correto
✅ Formato esperado: formulario:abc-123-def-456
```

---

## 💬 FORMATO PARA ME ENVIAR OS DADOS

**Copie e preencha:**

```
=== FRONTEND LOGS ===
UUID gerado: _______________________
UUID enviado no email: _______________________

=== BACKEND LOGS (Email) ===
formularioId recebido: _______________________
Link gerado: _______________________

=== BACKEND LOGS (Conferência) ===
formularioId buscado: _______________________
Resultado: ENCONTRADO / NÃO ENCONTRADO
Total no banco: _______
IDs existentes: [...]

=== SQL QUERY ===
O ID aparece no banco? SIM / NÃO
Formato da chave: _______________________
```

Envie isso para eu analisar! 🚀
