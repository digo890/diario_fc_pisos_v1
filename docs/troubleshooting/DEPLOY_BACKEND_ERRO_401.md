# 🚀 INSTRUÇÕES DE DEPLOY - Resolução do Erro 401

## ❌ Problema

Erro 401 na rota `/conferencia/:formularioId` porque o backend (Edge Function) não foi atualizado em produção.

## ✅ Solução

### 1️⃣ Deploy da Edge Function (OBRIGATÓRIO)

```bash
# 1. Login no Supabase CLI
supabase login

# 2. Linkar o projeto
supabase link --project-ref cjwuooaappcnsqxgdpta

# 3. Deploy da função server
supabase functions deploy server --no-verify-jwt
```

### 2️⃣ Verificar Deploy

Após o deploy, acesse os logs da função:
```
https://supabase.com/dashboard/project/cjwuooaappcnsqxgdpta/functions/server/logs
```

### 3️⃣ Testar Novamente

1. Criar uma NOVA obra (importante, pois as antigas não terão formulário no backend)
2. Preencher o formulário
3. Enviar para o preposto
4. Abrir o link de conferência

---

## 📝 Por que isso é necessário?

- O **frontend** (Vercel) foi atualizado ✅
- O **backend** (Supabase Edge Function) NÃO foi atualizado ❌

Quando o preposto tenta acessar `/conferencia/:formularioId`, ele está acessando o código ANTIGO que ainda não tem essa rota implementada, por isso retorna 401.

---

## 🔍 Como Verificar se o Backend Está Atualizado

### Opção 1: Teste Direto

Abra no navegador (sem autenticação):
```
https://cjwuooaappcnsqxgdpta.supabase.co/functions/v1/make-server-1ff231a2/conferencia/test-123
```

**Resposta esperada:**
- Código antigo: `401 Unauthorized`
- Código novo: `400 Bad Request` (porque "test-123" não é UUID válido)

### Opção 2: Logs do Supabase

Acesse os logs e veja se aparece:
```
🔍 [CONFERÊNCIA] Buscando formulário: ...
```

Se não aparecer essa mensagem, o backend não foi atualizado.

---

## ⚠️ IMPORTANTE

**Obras antigas não funcionarão!**

As obras criadas ANTES do deploy do backend não terão o formulário salvo no backend (só local). Você precisa:

1. Criar uma NOVA obra após o deploy
2. OU re-enviar as obras antigas para o preposto (o sistema vai criar o formulário no backend)

---

## 🆘 Se Ainda Assim Não Funcionar

1. Verifique se a função está ativa no Supabase Dashboard
2. Verifique os logs da Edge Function para ver erros
3. Teste com `curl`:

```bash
curl -X GET \
  "https://cjwuooaappcnsqxgdpta.supabase.co/functions/v1/make-server-1ff231a2/conferencia/test-123" \
  -H "Content-Type: application/json"
```

Resposta esperada: `{"success":false,"error":"Link inválido"}` (400)

Se retornar 401, o backend ainda não foi atualizado.

---

**Data:** 12/01/2026  
**Versão:** 1.0.0  
**Tipo:** Troubleshooting - Deploy
