# 🔒 Segurança — Diário de Obras FC Pisos

> Este documento descreve o **estado real** da segurança do sistema: o que já está
> implementado, as limitações conhecidas e os pré-requisitos de deploy. Ele é
> mantido honesto de propósito — não afirma garantias que o código não cumpre.

---

## ✅ Controles implementados

### 1. Autenticação — validação de JWT com assinatura
- O middleware `requireAuth` valida o token primariamente via
  `supabase.auth.getUser()` (valida a assinatura no servidor de Auth).
- No caminho de fallback, o token é verificado **criptograficamente** com
  `jose.jwtVerify` usando `SUPABASE_JWT_SECRET` (HS256), validando também emissor e
  expiração. Se o segredo não estiver configurado, a requisição é **rejeitada**
  (HTTP 500) em vez de aceitar o token sem verificação.
- ⚠️ Projetos que usam chaves de assinatura **assimétricas** (ES256/JWKS) precisam
  que o caminho principal (`getUser()`) funcione; nesse caso o fallback HS256
  rejeita por segurança.

### 2. Autorização por papel
- `GET /users`: administradores recebem todos os usuários; demais perfis recebem
  apenas o próprio registro (evita enumeração de usuários).
- `GET /obras`: administradores veem todas as obras; encarregados veem apenas as
  obras atribuídas a si (`encarregadoId === userId`).
- Edição de obra/formulário valida dono (encarregado atribuído) ou administrador.

### 3. CORS restrito
- `make-server-1ff231a2`: allowlist de domínios conhecidos (localhost, produção,
  subdomínios `*.vercel.app` e `*.figma.com`, `CUSTOM_DOMAIN`).
- `public-conferencia`: allowlist equivalente (localhost, produção,
  `*.vercel.app`, `CUSTOM_DOMAIN`). **Não usa mais `*`.**

### 4. Links públicos do preposto — expiração e revogação
- O link é carimbado com validade ao ser enviado
  (`linkPrepostoExpiraEm`, padrão 30 dias, configurável por
  `LINK_PREPOSTO_VALIDADE_DIAS`).
- Endpoint protegido `POST /formularios/:id/revogar-link` (admin ou encarregado
  dono) marca o link como revogado.
- A função pública bloqueia (HTTP 410) acesso e assinatura de links expirados ou
  revogados.

### 5. Proteção da rota `/auth/create-master`
- Exige header `X-Setup-Key`, validado contra `MASTER_SETUP_KEY`.
- ⚠️ **Limitação:** há um valor padrão fraco de fallback (`setup-fc-pisos-2024`).
  Em produção, **configure `MASTER_SETUP_KEY` com um valor forte** e remova a
  dependência do padrão.

### 6. Rate limiting
- Rotas públicas de assinatura: 5 tentativas por IP por janela.
- ⚠️ **Limitação:** o contador é mantido no KV / memória e **não é totalmente
  resistente** a reinícios da função nem a spoofing de `x-forwarded-for`.

### 7. Logs sanitizados
- Headers e dados sensíveis não são logados integralmente; presença de campos de
  auth é logada como "presente/ausente".

### 8. Remoção de endpoint de debug público
- O endpoint `GET /debug/obra/:obraId` (que listava formulários sem autenticação)
  foi **removido**.

---

## ⚠️ Limitações conhecidas (riscos residuais)

| Item | Descrição | Mitigação recomendada |
|------|-----------|------------------------|
| **RLS não é efetiva** | Os dados ficam numa tabela KV (`kv_store_1ff231a2`) acessada com `SERVICE_ROLE_KEY`. As policies RLS definidas nas migrações SQL **não se aplicam** ao KV. A autorização é feita no código das Edge Functions, não no banco. | Migrar para tabelas SQL com RLS, ou manter a checagem de autorização rigorosa em todos os endpoints. |
| **Setup key padrão fraca** | Fallback `setup-fc-pisos-2024`. | Definir `MASTER_SETUP_KEY` forte em produção. |
| **Rate limiting frágil** | Não persistente; IP via header. | Persistir contadores; validar proxy. |
| **Sem auditoria** | Não há trilha de auditoria das ações sensíveis. | Adicionar log estruturado/auditoria. |
| **Sanitização de HTML parcial** | A sanitização de entrada não cobre todas as tags. | Usar allowlist estrita / biblioteca dedicada. |

---

## 🔐 Variáveis de ambiente

### Backend (Supabase Edge Functions)
```bash
# Já fornecidas pela plataforma Supabase
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL

# Necessárias / recomendadas
SUPABASE_JWT_SECRET        # 🔴 OBRIGATÓRIA p/ o fallback de auth verificar assinatura
RESEND_API_KEY             # envio de emails
MASTER_SETUP_KEY           # 🟠 defina um valor FORTE (não use o padrão)
CUSTOM_DOMAIN              # (opcional) domínio extra permitido no CORS
LINK_PREPOSTO_VALIDADE_DIAS # (opcional) validade do link do preposto (padrão: 30)
```

---

## 📋 Checklist de deploy

- [ ] `SUPABASE_JWT_SECRET` configurada (senão o fallback de auth retorna 500)
- [ ] `MASTER_SETUP_KEY` configurada com valor forte
- [ ] `CUSTOM_DOMAIN` configurado, se aplicável
- [ ] Redeploy das Edge Functions `make-server-1ff231a2` e `public-conferencia`
- [ ] Primeiro admin criado e login testado
- [ ] Teste de um link de preposto (acesso, expiração e revogação)

---

## 🗺️ Inventário de rotas

### Públicas (sem auth)
```
GET  /make-server-1ff231a2/health
POST /make-server-1ff231a2/auth/create-master      (requer X-Setup-Key)

# Edge function public-conferencia (verify_jwt = false)
GET  /public-conferencia/health
GET  /public-conferencia/conferencia/:formularioId     (bloqueia link expirado/revogado)
POST /public-conferencia/conferencia/:formularioId/assinar (rate-limited; bloqueia expirado/revogado)
```

### Protegidas (requireAuth)
```
GET    /make-server-1ff231a2/auth/me
GET    /make-server-1ff231a2/users                 (admin: todos; outros: só o próprio)
POST   /make-server-1ff231a2/users
GET    /make-server-1ff231a2/users/:id
PUT    /make-server-1ff231a2/users/:id
DELETE /make-server-1ff231a2/users/:id
GET    /make-server-1ff231a2/obras                 (admin: todas; encarregado: só as suas)
POST   /make-server-1ff231a2/obras
GET    /make-server-1ff231a2/obras/:id
PUT    /make-server-1ff231a2/obras/:id
DELETE /make-server-1ff231a2/obras/:id
GET    /make-server-1ff231a2/formularios
POST   /make-server-1ff231a2/formularios
GET    /make-server-1ff231a2/formularios/:id
PUT    /make-server-1ff231a2/formularios/:id
DELETE /make-server-1ff231a2/formularios/:id
POST   /make-server-1ff231a2/formularios/:id/revogar-link
POST   /make-server-1ff231a2/emails/*
```

---

## ⚡ Próximos passos recomendados

- Migrar do padrão KV para tabelas SQL com RLS efetiva.
- Persistir rate limiting e endurecer a obtenção de IP do cliente.
- Adicionar auditoria de ações sensíveis e logging estruturado por nível.
- Testes de segurança automatizados (auth, autorização, expiração de link).

---

**Última atualização:** Junho 2026
