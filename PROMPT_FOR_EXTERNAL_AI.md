# 🤖 PROMPT PARA INVESTIGAÇÃO EXTERNA

Copie e cole este prompt completo para outra IA (Claude, ChatGPT, etc.):

---

## CONTEXTO

Sou desenvolvedor de um sistema PWA chamado "Diário de Obras – FC Pisos". O sistema usa React + TypeScript no frontend e Supabase Edge Functions (Deno + Hono) no backend com armazenamento em KV Store (PostgreSQL).

## PROBLEMA

Uma obra que foi aprovada pelo preposto continua mostrando status "Aguardando conferência" (`enviado_preposto`) no frontend quando deveria mostrar "Concluído" (`concluido`). O backend aparentemente atualiza o status corretamente, mas o frontend não reflete a mudança.

## ARQUITETURA

### Backend
- **Edge Functions:** 2 functions separadas
  1. `make-server-1ff231a2` (privada): CRUD de obras/usuários/formulários
  2. `public-conferencia` (pública): Assinatura do preposto
- **Storage:** KV Store (chave-valor sobre PostgreSQL)
- **Padrão:** camelCase internamente, snake_case na API

### Frontend
- **Stack:** React + Vite + TypeScript + IndexedDB
- **Sincronização:** Offline-first com merge de dados
- **Estratégia:** Backend como fonte da verdade (sempre vence no merge)

### Fluxo de Status
```
novo → em_preenchimento → enviado_preposto → concluido
                                            ↳ reprovado_preposto
```

## O QUE ACONTECE QUANDO PREPOSTO ASSINA

1. **Edge Function Pública** recebe assinatura via POST `/conferencia/:id/assinar`
2. **Atualiza formulário** no KV Store:
   ```typescript
   const updatedFormulario = {
     ...formulario,
     prepostoConfirmado: true,
     assinaturaPreposto: body.assinatura,
     updatedAt: Date.now()
   };
   await kvSet(`formulario:${formularioId}`, updatedFormulario);
   ```

3. **Atualiza status da obra** no KV Store:
   ```typescript
   const obra = await kvGet(`obra:${formulario.obra_id}`);
   const updatedObra = {
     ...obra,
     status: body.aprovado ? "concluido" : "reprovado_preposto",
     updatedAt: Date.now()
   };
   await kvSet(`obra:${formulario.obra_id}`, updatedObra);
   ```

4. **Frontend busca dados** via GET `/obras` que:
   ```typescript
   const obras = await kv.getByPrefix("obra:");
   const obrasFormatted = obras.map(obra => toSnakeCase(obra));
   return c.json({ success: true, data: obrasFormatted });
   ```

5. **Frontend normaliza** de snake_case para camelCase:
   ```typescript
   function normalizeObraFromBackend(obraBackend: any): Obra {
     return {
       id: obraBackend.id,
       status: obraBackend.status,
       updatedAt: obraBackend.updated_at 
         ? new Date(obraBackend.updated_at).getTime() 
         : obraBackend.updatedAt || Date.now(),
       // ... outros campos
     };
   }
   ```

6. **Frontend faz merge** (backend sempre vence):
   ```typescript
   function getMostRecent<T>(local: T | undefined, remote: T): T {
     return remote; // Backend sempre vence
   }
   ```

## CORREÇÕES JÁ TENTADAS (SEM SUCESSO)

1. ✅ Adicionado campo `updatedAt` na normalização (estava faltando)
2. ✅ Implementado estratégia "backend always wins" no merge
3. ✅ Corrigido tratamento de resposta não-JSON na API
4. ✅ Removido lazy loading que causava erro de carregamento

## CÓDIGO RELEVANTE

### Backend: Conversão para snake_case
```typescript
// /supabase/functions/server/index.tsx
function toSnakeCase(data: any): any {
  const converted = { ...data };
  const fieldMap: Record<string, string> = {
    'encarregadoId': 'encarregado_id',
    'updatedAt': 'updated_at',
    'createdAt': 'created_at',
    // ... outros
  };
  
  for (const [camelCase, snakeCase] of Object.entries(fieldMap)) {
    if (camelCase in converted) {
      converted[snakeCase] = converted[camelCase];
      delete converted[camelCase];
    }
  }
  return converted;
}
```

### Frontend: Normalização de snake_case
```typescript
// /src/app/utils/dataSync.ts
function normalizeObraFromBackend(obraBackend: any): Obra {
  return {
    id: obraBackend.id,
    cliente: obraBackend.cliente,
    status: obraBackend.status,
    updatedAt: obraBackend.updated_at 
      ? new Date(obraBackend.updated_at).getTime() 
      : obraBackend.updatedAt || Date.now(),
    // ... outros campos
  };
}
```

### Frontend: Merge de dados
```typescript
// /src/app/utils/dataSync.ts
export async function mergeObras(
  localObras: Obra[],
  remoteObras: any[]
): Promise<Obra[]> {
  const merged = new Map<string, Obra>();
  
  localObras.forEach(obra => merged.set(obra.id, obra));
  
  for (const remoteObraRaw of remoteObras) {
    const remoteObra = normalizeObraFromBackend(remoteObraRaw);
    const localObra = merged.get(remoteObra.id);
    const mostRecent = getMostRecent(localObra, remoteObra); // Sempre retorna remoteObra
    merged.set(remoteObra.id, mostRecent);
    await saveObra(mostRecent); // Salva no IndexedDB
  }
  
  return Array.from(merged.values());
}
```

## HIPÓTESES

1. **Conversão camelCase ↔ snake_case está quebrando**
   - `toSnakeCase()` pode não estar funcionando corretamente
   - Tipo do campo pode estar errado (String vs Number)

2. **Frontend lê do cache antes do merge completar**
   - React pode estar usando estado desatualizado
   - IndexedDB pode estar sendo lido antes da sincronização

3. **KV Store retorna dados antigos**
   - Pode haver cache interno na edge function
   - `getByPrefix()` pode ter comportamento inesperado

4. **Normalização com fallback mascara o problema**
   - `obraBackend.updated_at` pode ser `undefined`
   - `obraBackend.updatedAt` pode não existir
   - `Date.now()` no fallback sempre retorna valor válido, mascarando o erro

## TIPOS TYPESCRIPT

```typescript
export type FormStatus = 'novo' | 'em_preenchimento' | 'enviado_preposto' | 'reprovado_preposto' | 'concluido';

export interface Obra {
  id: string;
  cliente: string;
  obra: string;
  status: FormStatus;
  updatedAt?: number; // Timestamp em ms
  createdAt: number;
  // ... outros campos
}
```

## DADOS DE TESTE

- **Obra:** Cliente "FC Pisos"
- **Status esperado:** `concluido`
- **Status atual no frontend:** `enviado_preposto`
- **Logs do backend:** Confirmam atualização para `concluido`

## PERGUNTAS ESPECÍFICAS

1. **O problema está no backend ou frontend?**
   - Como verificar se o KV Store realmente tem `status: "concluido"`?
   - Como garantir que a API retorna os dados corretos?

2. **A conversão camelCase ↔ snake_case está funcionando?**
   - `toSnakeCase()` converte `updatedAt` para `updated_at`?
   - `normalizeObraFromBackend()` lê `updated_at` corretamente?

3. **Há race condition no frontend?**
   - React pode renderizar antes do merge completar?
   - IndexedDB pode ter dados desatualizados sendo lidos?

4. **O fallback `Date.now()` está mascarando o erro?**
   - Se `updated_at` e `updatedAt` forem ambos `undefined`, o fallback retorna timestamp atual
   - Isso mascara o problema de conversão?

## O QUE PRECISO

1. **Diagnóstico da causa raiz:** Backend ou Frontend?
2. **Script de validação:** Para verificar cada etapa do fluxo
3. **Correção específica:** Código exato para resolver o problema
4. **Testes:** Como garantir que não vai quebrar de novo?

## INFORMAÇÕES ADICIONAIS

- Sistema em produção com dados reais
- Não posso perder dados do KV Store
- Preciso manter compatibilidade com dados existentes
- Solução deve ser robusta e fácil de manter

---

**POR FAVOR:**
1. Analise o fluxo completo de dados
2. Identifique onde o problema está acontecendo
3. Sugira correções específicas com código
4. Forneça script de diagnóstico para validar cada etapa

Obrigado!
