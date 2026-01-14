# 🔍 DIAGNÓSTICO TÉCNICO - Status de Obra não Atualiza no Frontend

## 📋 SUMÁRIO EXECUTIVO

**Problema:** Uma obra do cliente "FC Pisos" que foi aprovada pelo preposto continua mostrando status "Aguardando conferência" (enviado_preposto) no frontend quando deveria mostrar "Concluído" (concluido).

**Impacto:** Dados desatualizados no dashboard administrativo, violando o princípio "backend como fonte da verdade".

**Status:** Não resolvido após múltiplas tentativas de correção.

---

## 🏗️ ARQUITETURA DO SISTEMA

### Stack Tecnológica
- **Frontend:** React + TypeScript + Vite + IndexedDB
- **Backend:** Supabase Edge Functions (Deno) + Hono + KV Store (PostgreSQL)
- **Autenticação:** Supabase Auth (JWT tokens)
- **Sincronização:** Estratégia offline-first com merge de dados

### Fluxo de Status da Obra
```
novo → em_preenchimento → enviado_preposto → concluido
                                            ↳ reprovado_preposto
```

### Edge Functions
1. **`make-server-1ff231a2`** (Privada) - CRUD de obras/usuários/formulários
2. **`public-conferencia`** (Pública) - Assinatura do preposto

---

## 🔄 FLUXO DO PROBLEMA

### Quando o preposto assina o formulário:

1. ✅ **Edge Function pública** (`/public-conferencia`) recebe assinatura
2. ✅ **Backend atualiza formulário** (linha 464-482):
   ```typescript
   const updatedFormulario = {
     ...formulario,
     prepostoConfirmado: true,
     assinaturaPreposto: body.assinatura,
     statusPreposto: body.aprovado ? "aprovado" : "reprovado",
     updatedAt: Date.now()
   };
   await kvSet(`formulario:${formularioId}`, updatedFormulario);
   ```

3. ✅ **Backend atualiza status da obra** (linha 484-496):
   ```typescript
   const obra = await kvGet(`obra:${formulario.obra_id}`);
   if (obra) {
     const updatedObra = {
       ...obra,
       status: body.aprovado ? "concluido" : "reprovado_preposto",
       updatedAt: Date.now()
     };
     await kvSet(`obra:${formulario.obra_id}`, updatedObra);
   }
   ```

4. ❌ **Frontend não reflete a mudança** mesmo após sincronização

---

## 🛠️ CORREÇÕES JÁ APLICADAS (SEM SUCESSO)

### ✅ Correção #1: Normalização de `updatedAt`
**Arquivo:** `/src/app/utils/dataSync.ts:21-46`
```typescript
function normalizeObraFromBackend(obraBackend: any): Obra {
  return {
    // ... outros campos
    updatedAt: obraBackend.updated_at 
      ? new Date(obraBackend.updated_at).getTime() 
      : obraBackend.updatedAt || Date.now(), // ✅ Campo adicionado
  };
}
```

### ✅ Correção #2: Estratégia "Backend Always Wins"
**Arquivo:** `/src/app/utils/dataSync.ts:80-86`
```typescript
function getMostRecent<T extends TimestampedData>(
  local: T | undefined,
  remote: T
): T {
  // Backend SEMPRE vence (fonte da verdade)
  return remote;
}
```

### ✅ Correção #3: Tratamento de Resposta Não-JSON
**Arquivo:** `/src/app/utils/api.ts:126-190`
- Adicionada verificação de `content-type`
- Parseamento seguro de JSON
- Tratamento de erros de autenticação

### ✅ Correção #4: Remoção de Lazy Loading
**Arquivo:** `/src/app/components/AdminDashboard.tsx:16`
- Removido lazy loading de `NotificationDrawer`
- Importação direta para evitar erro de carregamento dinâmico

---

## 🔍 PONTOS DE INVESTIGAÇÃO

### 1️⃣ **Conversão de Campos (camelCase ↔ snake_case)**

**Backend → Frontend:**
```typescript
// /supabase/functions/server/index.tsx:100-126
function toSnakeCase(data: any): any {
  const fieldMap: Record<string, string> = {
    'updatedAt': 'updated_at',  // ✅ Existe
    'encarregadoId': 'encarregado_id',
    // ... outros
  };
}
```

**Frontend → Backend:**
```typescript
// /src/app/utils/dataSync.ts:21-46
function normalizeObraFromBackend(obraBackend: any): Obra {
  updatedAt: obraBackend.updated_at 
    ? new Date(obraBackend.updated_at).getTime() 
    : obraBackend.updatedAt || Date.now()
}
```

**⚠️ SUSPEITA:** Pode haver inconsistência na resposta da API `/obras`

---

### 2️⃣ **Edge Function Pública vs Privada**

**Edge Function Pública** (`public-conferencia`) atualiza a obra:
```typescript
// /supabase/functions/public-conferencia/index.tsx:489
status: body.aprovado ? "concluido" : "reprovado_preposto"
```

**Edge Function Privada** (`make-server-1ff231a2`) lista as obras:
```typescript
// /supabase/functions/server/index.tsx:1059-1062
app.get("/make-server-1ff231a2/obras", requireAuth, async (c) => {
  const obras = await kv.getByPrefix("obra:");
  const obrasFormatted = obras.map((obra: any) => toSnakeCase(obra));
  return c.json({ success: true, data: obrasFormatted });
});
```

**⚠️ SUSPEITA:** KV Store pode estar retornando dados antigos (cache?)

---

### 3️⃣ **IndexedDB vs Backend (Race Condition)**

**Estratégia atual:**
- Backend SEMPRE vence no merge
- IndexedDB é cache descartável

**Código de merge:**
```typescript
// /src/app/utils/dataSync.ts:93-118
export async function mergeObras(
  localObras: Obra[],
  remoteObras: any[]
): Promise<Obra[]> {
  // ...
  for (const remoteObraRaw of remoteObras) {
    const remoteObra = normalizeObraFromBackend(remoteObraRaw);
    const mostRecent = getMostRecent(localObra, remoteObra); // Sempre retorna remoteObra
    await saveObra(mostRecent); // Salva no IndexedDB
  }
}
```

**⚠️ SUSPEITA:** Frontend pode estar lendo do IndexedDB ANTES do merge completar

---

### 4️⃣ **Tipo de Dados `updatedAt`**

**Backend salva:**
```typescript
updatedAt: Date.now() // Number (timestamp em ms)
```

**Backend converte na API:**
```typescript
'updatedAt': 'updated_at' // String? Number? ISO?
```

**Frontend espera:**
```typescript
updatedAt?: number; // Timestamp em ms
```

**⚠️ SUSPEITA:** Conversão de tipo pode estar corrompendo o valor

---

## 📊 DADOS DE TESTE

### Obra Problemática
- **Cliente:** FC Pisos
- **Status Backend (esperado):** `concluido`
- **Status Frontend (atual):** `enviado_preposto`

### Script de Diagnóstico (não executado ainda)
```javascript
fetch('https://cjwuooaappcnsqxgdpta.supabase.co/functions/v1/make-server-1ff231a2/obras', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
    'X-User-Token': localStorage.getItem('userToken')
  }
})
.then(r => r.json())
.then(data => {
  const fcPisosObra = data.data.find(o => o.cliente.toLowerCase().includes('fc pisos'));
  console.log('🔍 Backend:', fcPisosObra);
})
```

---

## 🎯 HIPÓTESES PRINCIPAIS

### Hipótese A: Backend não está atualizando
**Probabilidade:** BAIXA (logs confirmam atualização)

### Hipótese B: API retorna dados em formato errado
**Probabilidade:** MÉDIA
- `toSnakeCase()` pode não estar convertendo `updatedAt` corretamente
- Tipo do campo pode estar errado (String vs Number)

### Hipótese C: Frontend lê cache antes do merge
**Probabilidade:** ALTA
- IndexedDB pode estar sendo lido antes da sincronização
- React pode estar usando estado desatualizado

### Hipótese D: KV Store tem cache interno
**Probabilidade:** BAIXA
- KV Store usa PostgreSQL (ACID compliant)
- Mas edge function pode ter cache em memória

### Hipótese E: Normalização está quebrando
**Probabilidade:** ALTA
- Conversão `obraBackend.updated_at` pode estar falhando
- Fallback `obraBackend.updatedAt` pode não existir
- `Date.now()` no fallback mascara o problema

---

## 🔧 PRÓXIMOS PASSOS SUGERIDOS

### 1. **Verificar resposta RAW do backend**
```javascript
// No console do navegador
fetch('https://cjwuooaappcnsqxgdpta.supabase.co/functions/v1/make-server-1ff231a2/obras', {
  headers: {
    'Authorization': 'Bearer [TOKEN]',
    'X-User-Token': localStorage.getItem('userToken')
  }
})
.then(r => r.text()) // Não parsear JSON ainda
.then(text => console.log('RAW:', text))
```

### 2. **Adicionar logs na normalização**
```typescript
function normalizeObraFromBackend(obraBackend: any): Obra {
  console.log('🔍 NORMALIZANDO:', {
    id: obraBackend.id,
    status: obraBackend.status,
    updated_at_snake: obraBackend.updated_at,
    updatedAt_camel: obraBackend.updatedAt,
    tipo_updated_at: typeof obraBackend.updated_at
  });
  // ... resto do código
}
```

### 3. **Verificar KV Store diretamente**
```sql
-- No Supabase SQL Editor
SELECT key, value->>'status', value->>'updatedAt', value->>'updated_at'
FROM kv_store_1ff231a2
WHERE key LIKE 'obra:%'
  AND value->>'cliente' ILIKE '%FC Pisos%';
```

### 4. **Forçar limpeza de cache no frontend**
```javascript
// No console
localStorage.clear();
indexedDB.deleteDatabase('DiarioObrasDB');
location.reload();
```

### 5. **Adicionar sanity check na leitura**
```typescript
// Após carregar obras do backend
const obras = await obraApi.list();
console.log('📊 OBRAS DO BACKEND:', obras.data.map(o => ({
  id: o.id,
  cliente: o.cliente,
  status: o.status,
  updated_at: o.updated_at,
  updatedAt: o.updatedAt
})));
```

---

## 📁 ARQUIVOS RELEVANTES

### Backend
- `/supabase/functions/public-conferencia/index.tsx` (Assinatura do preposto)
- `/supabase/functions/server/index.tsx` (API principal)
- `/supabase/functions/server/kv_store.tsx` (Abstração do KV)

### Frontend
- `/src/app/utils/dataSync.ts` (Merge de dados)
- `/src/app/utils/api.ts` (Cliente HTTP)
- `/src/app/components/AdminDashboard.tsx` (UI)
- `/src/app/types/index.ts` (Definições de tipo)

### Tipos
```typescript
// /src/app/types/index.ts:17-39
export interface Obra {
  id: string;
  cliente: string;
  status: FormStatus; // 'novo' | 'em_preenchimento' | 'enviado_preposto' | 'reprovado_preposto' | 'concluido'
  updatedAt?: number; // Timestamp em ms
  // ... outros campos
}
```

---

## 🚨 LOGS DE ERRO RECENTES

```
❌ Erro na requisição /obras: Unexpected token 'N', "Network co"... is not valid JSON
⚠️ Erro ao buscar dados do backend, usando cache local: {}
```

**Interpretação:** Token JWT expirado ou problema de rede. Resolvido após logout/login.

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Backend está salvando `status: "concluido"` no KV Store
- [ ] Backend está salvando `updatedAt` como Number (timestamp)
- [ ] API `/obras` está retornando `updated_at` ou `updatedAt`
- [ ] Função `toSnakeCase()` está convertendo `updatedAt → updated_at`
- [ ] Função `normalizeObraFromBackend()` está lendo `updated_at` ou `updatedAt`
- [ ] Frontend está executando merge ANTES de renderizar
- [ ] IndexedDB está sendo atualizado com dados do backend
- [ ] React state está sendo atualizado após sincronização

---

## 🎓 CONCLUSÃO

O problema está em algum ponto da cadeia:
```
Backend KV Store → Edge Function → API Response → Frontend Normalization → IndexedDB → React State → UI
```

A investigação deve focar em **verificar a resposta RAW do backend** para determinar se o problema está na origem dos dados ou no processamento frontend.

---

**Autor:** Sistema de Diagnóstico Automatizado  
**Data:** 2026-01-14  
**Versão:** 1.0.0  
**Status:** Aguardando investigação externa
