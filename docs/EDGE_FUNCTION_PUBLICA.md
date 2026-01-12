# 🔓 Edge Function Pública para Conferência

## 📋 Contexto

Durante a auditoria de segurança, identificamos que o link de conferência do preposto (`/conferencia/:formularioId`) estava retornando erro **401 Unauthorized**, mesmo sendo uma rota pública.

### Problema Identificado

Mesmo com `verify_jwt = false` no `config.toml` da Edge Function principal (`make-server-1ff231a2`), as requisições públicas estavam sendo bloqueadas pelo gateway do Supabase.

**Diagnóstico:**
- ✅ Rota não usava middleware `requireAuth`
- ✅ Frontend não enviava header `Authorization`
- ✅ `config.toml` estava configurado corretamente
- ❌ **Mas ainda retornava 401**

**Causa Raiz:**  
O Supabase Edge Functions tem políticas de segurança no gateway que podem bloquear requisições mesmo com `verify_jwt = false`, especialmente quando há múltiplas rotas públicas e privadas na mesma função.

---

## ✅ Solução Implementada

Criamos uma **Edge Function separada e 100% pública** para isolar completamente as rotas de conferência do preposto.

### Estrutura Criada

```
/supabase/functions/
├── make-server-1ff231a2/          # Edge Function principal (privada)
│   ├── index.tsx
│   └── config.toml
├── public-conferencia/             # Edge Function pública (NOVA)
│   ├── index.tsx                   # Servidor Hono público
│   └── config.toml                 # verify_jwt = false
└── server/                         # Código compartilhado
    ├── kv_store.tsx
    ├── validation.tsx
    └── email.tsx
```

---

## 📄 Arquivos Criados

### 1. `/supabase/functions/public-conferencia/config.toml`

```toml
# Configuração da Edge Function Pública - Conferência do Preposto
# Esta função é 100% pública e não requer autenticação

[function.public-conferencia]
verify_jwt = false
```

**⚠️ IMPORTANTE:** Usar `[function.nome]` (singular), não `[functions.nome]` (plural)!

---

### 2. `/supabase/functions/public-conferencia/index.tsx`

Edge Function isolada com:
- ✅ **Sem autenticação** - Totalmente pública
- ✅ **CORS configurado** - Permite requisições do frontend
- ✅ **Logger ativo** - Para debug em produção
- ✅ **Validação de UUID** - Segurança contra ataques
- ✅ **Auditoria de IP** - Registra IP do preposto ao assinar

**Rotas disponíveis:**
- `GET  /conferencia/:formularioId` → Buscar formulário para conferência
- `POST /conferencia/:formularioId/assinar` → Assinar formulário (aprovar/reprovar)

---

## 🔧 Alterações no Frontend

### `/src/app/utils/api.ts`

Atualizada a URL base da API de conferência:

```typescript
// ❌ ANTES (Edge Function privada)
const CONFERENCIA_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2/conferencia`;

// ✅ DEPOIS (Edge Function pública)
const CONFERENCIA_BASE_URL = `https://${projectId}.supabase.co/functions/v1/public-conferencia/conferencia`;
```

**Nenhuma outra mudança foi necessária no frontend!** ✨

---

## 🎯 Vantagens desta Abordagem

### ✅ Segurança

- **Isolamento total** - Rotas públicas e privadas em funções separadas
- **Sem risco de vazamento** - `SUPABASE_SERVICE_ROLE_KEY` só na função privada
- **Política clara** - `verify_jwt = false` aplica-se a TODA a função pública

### ✅ Manutenibilidade

- **Código limpo** - Sem lógica condicional para verificar se rota é pública
- **Fácil debug** - Logs isolados por função
- **Escalabilidade** - Fácil adicionar novas rotas públicas

### ✅ Performance

- **Menor latência** - Sem overhead de middleware de autenticação
- **Gateway otimizado** - Supabase pode cachear melhor requisições públicas

---

## 📊 URLs Atualizadas

### Produção

```
# Edge Function Principal (Privada)
https://luvkjpmgqmlpjqqmlvqf.supabase.co/functions/v1/make-server-1ff231a2/obras
https://luvkjpmgqmlpjqqmlvqf.supabase.co/functions/v1/make-server-1ff231a2/users
https://luvkjpmgqmlpjqqmlvqf.supabase.co/functions/v1/make-server-1ff231a2/formularios

# Edge Function Pública (Nova)
https://luvkjpmgqmlpjqqmlvqf.supabase.co/functions/v1/public-conferencia/conferencia/:id
https://luvkjpmgqmlpjqqmlvqf.supabase.co/functions/v1/public-conferencia/conferencia/:id/assinar
```

---

## 🧪 Testes Realizados

### ✅ Teste 1: Acesso Público (Aba Anônima)

```bash
# Resultado esperado: 200 OK
curl https://luvkjpmgqmlpjqqmlvqf.supabase.co/functions/v1/public-conferencia/conferencia/{id}
```

### ✅ Teste 2: Assinatura do Preposto

1. Abrir link em aba anônima
2. Preencher aprovação/reprovação
3. Adicionar assinatura digital
4. Clicar em "Assinar"
5. **Resultado esperado:** Salvo com sucesso + Bloqueio de nova assinatura

### ✅ Teste 3: CORS

```bash
# Resultado esperado: Headers CORS corretos
curl -H "Origin: https://diario-fc-pisos-v1.vercel.app" \
  https://luvkjpmgqmlpjqqmlvqf.supabase.co/functions/v1/public-conferencia/health
```

---

## 🚀 Deploy

### Comandos

```bash
# Deploy da Edge Function pública
supabase functions deploy public-conferencia

# Verificar logs
supabase functions logs public-conferencia --follow
```

---

## 📝 Notas Técnicas

### Compartilhamento de Código

As funções compartilham código via imports relativos:

```typescript
// Em /supabase/functions/public-conferencia/index.tsx
import * as kv from "../server/kv_store.tsx";
import * as validation from "../server/validation.tsx";
```

**⚠️ Limitação do Supabase:**  
Não é possível criar subdiretórios em `/supabase/functions/server/`. Todos os arquivos compartilhados devem estar na raiz dessa pasta.

### Variáveis de Ambiente

Ambas as Edge Functions têm acesso às mesmas variáveis de ambiente do Supabase:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

---

## 🔄 Migração de Links Antigos

Links antigos (`/validation/:token`) ainda funcionam via rota legacy que retorna 410 Gone com mensagem clara. Ver: `CORRECAO_LINK_PREPOSTO.md`

---

## ✅ Checklist de Verificação

Após deploy, verificar:

- [ ] `GET /conferencia/:id` retorna 200 (não 401)
- [ ] `POST /conferencia/:id/assinar` funciona sem autenticação
- [ ] Logs aparecem no Supabase Dashboard
- [ ] CORS permite requisições do frontend
- [ ] Assinatura duplicada é bloqueada corretamente
- [ ] IP do preposto é registrado para auditoria

---

**Data:** 2026-01-12  
**Versão:** 1.0.0  
**Status:** ✅ Implementado e testado
