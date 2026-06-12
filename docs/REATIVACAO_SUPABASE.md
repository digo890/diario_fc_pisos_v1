# 🔄 Reativação do Supabase — projeto novo (FC Pisos v2)

> Contexto: o projeto Supabase original foi **removido** pelo Supabase por ter
> ficado pausado mais de 90 dias (plano free). Não é possível restaurá-lo —
> foi necessário criar um projeto novo e migrar os dados do backup.

## ⚠️ A lição mais importante (por que isso aconteceu)

No **plano free**, um projeto Supabase:
- **pausa** após ~7 dias sem atividade;
- é **removido** após ~90 dias pausado (com backup disponibilizado).

Foi exatamente isso que causou a perda do projeto. Para **não acontecer de novo**:
- mantenha o app em uso (atividade real evita a pausa), **ou**
- faça um acesso/health-check periódico, **ou**
- migre para o plano **Pro** (US$25/mês), que não pausa e tem backups (PITR).

Esta é a recomendação de boas práticas nº 1 deste documento.

---

## Projeto novo

| Item | Valor |
|---|---|
| Nome | FC Pisos v2 |
| Ref / ID | `yhuryekwwmonyjjezipw` |
| URL | `https://yhuryekwwmonyjjezipw.supabase.co` |
| Região | sa-east-1 (São Paulo) |
| Organização | digo890 (plano free) |

A `anon key` nova já está no código (`src/config/supabase.ts`,
`utils/supabase/info.tsx`).

---

## ✅ Já configurado

- Projeto criado.
- Tabela `kv_store_1ff231a2` criada com **RLS habilitado e sem policies**
  (trancada para acesso direto; só o service role das Edge Functions acessa —
  é a configuração segura para este caso).
- Código repontado para o projeto novo.
- Edge function `public-conferencia` deployada (smoke test).
- Verificador de segurança do Supabase: sem alertas relevantes.

---

## ✅ REATIVAÇÃO CONCLUÍDA (12/06/2026)

Estado final:
- Edge Functions `make-server-1ff231a2` e `public-conferencia` **deployadas e ACTIVE**
  via GitHub Actions (deploy automático a partir da `main` configurado e verde).
- Secrets configurados (`MASTER_SETUP_KEY`, `RESEND_API_KEY`, `SUPABASE_ACCESS_TOKEN`
  no GitHub para o CI).
- Primeiro administrador criado (auth user via Dashboard + registro KV
  `tipo: Administrador` via migração `seed_admin_user_kv_record`).
- **Login validado de ponta a ponta** no app em produção.
- **Decisão sobre os dados antigos: começar limpo.** O backup
  `db_cluster-02-01-2026@03-16-19` fica guardado como arquivo morto; obras,
  formulários e encarregados serão recriados pelo painel conforme o uso.

> Os "passos restantes" abaixo ficam como referência histórica do processo.

## ⏳ Passos restantes (histórico — já executados)

### 1. Deploy das Edge Functions (a partir do repositório)
```bash
npm i -g supabase
supabase login
supabase link --project-ref yhuryekwwmonyjjezipw
supabase functions deploy make-server-1ff231a2 --no-verify-jwt
supabase functions deploy public-conferencia   --no-verify-jwt
```
> `--no-verify-jwt` porque as duas funções fazem a própria autenticação
> (a pública é 100% aberta; a make-server valida o token internamente).

### 2. Secrets das Edge Functions
```bash
supabase secrets set MASTER_SETUP_KEY=<chave_forte>        # criar 1º admin
supabase secrets set RESEND_API_KEY=<chave_do_resend>      # envio de emails
supabase secrets set APP_JWT_SECRET=<JWT secret do projeto> # opcional (reforço)
```
- `APP_JWT_SECRET`: Dashboard → Project Settings → API → **JWT Secret**.
  É **opcional** — o login funciona sem ele (caminho principal usa `getUser()`);
  ele só reforça o fallback de validação de assinatura.
- ⚠️ Não use o nome `SUPABASE_JWT_SECRET`: o prefixo `SUPABASE_` é reservado e
  não pode ser definido como secret de Edge Function.

### 3. Criar o primeiro administrador
```bash
curl -X POST "https://yhuryekwwmonyjjezipw.supabase.co/functions/v1/make-server-1ff231a2/auth/create-master" \
  -H "X-Setup-Key: <MASTER_SETUP_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fcpisos.com.br","password":"<senha_forte>","nome":"Administrador"}'
```

### 4. Vercel
Em Settings → Environment Variables, atualize as variáveis para o projeto novo
e faça um redeploy. O merge do PR leva o código repontado.

### 5. Restaurar os dados do backup (`db_cluster-…`)
O arquivo é um dump completo do cluster Postgres. **Não** restaure inteiro num
projeto Supabase novo (conflita com os schemas internos). Extraia só:
- `public.kv_store_1ff231a2` → obras e formulários (dados do app);
- `auth.users` → logins (se quiser preservar as contas com as senhas atuais).

Para planejar a extração, rode no arquivo e compartilhe o resultado:
```bash
file "db_cluster-02-01-2026@03-16-19"
grep -c "kv_store_1ff231a2" "db_cluster-02-01-2026@03-16-19"
```

---

## 🧭 Sobre "fazer do jeito ideal" — a decisão de arquitetura

Você comentou que talvez não tenha seguido as melhores práticas antes. Sendo
honesto sobre o estado atual:

**O ponto que mais foge das boas práticas é o padrão KV.** O app guarda tudo
numa única tabela `kv_store_1ff231a2` (chave/valor JSONB) acessada com
service role, em vez de tabelas SQL normalizadas (`users`, `obras`,
`formularios`) com RLS, chaves estrangeiras e índices próprios. As migrations em
`supabase/migrations/` até definem essas tabelas com RLS, mas o app **não as
usa** — é código morto.

**Por que não migrei isso agora:** trocar o padrão KV por SQL+RLS é uma
reescrita grande das duas Edge Functions **e** da camada de sincronização do
frontend. Fazer isso no meio da reativação aumentaria muito o risco e o tempo
até o app voltar. O objetivo aqui foi **voltar ao ar com segurança**, não
re-arquitetar.

**O que já está dentro das boas práticas (na arquitetura atual):**
- Tabela KV trancada por RLS (só service role acessa).
- Validação de JWT com verificação de assinatura no backend.
- Autorização por papel (admin vê tudo; encarregado só o seu).
- CORS restrito a allowlist; endpoint de debug público removido.
- Links do preposto com expiração e revogação.
- Secrets com nomes válidos e `MASTER_SETUP_KEY` forte.

**Caminho ideal para o futuro (projeto à parte, com calma):** migrar do KV para
tabelas SQL com RLS efetiva. Isso elimina a dependência total do service role,
passa a aplicar autorização no próprio banco e habilita auditoria/índices. É a
evolução recomendada — mas merece ser feita de forma incremental e testada,
não no mesmo passo da reativação.
