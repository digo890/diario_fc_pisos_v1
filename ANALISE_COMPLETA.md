# 📋 Análise Completa — Diário de Obras FC Pisos v1

> Documento de análise técnica gerado em 2026-06-11. Cobre arquitetura, segurança,
> confiabilidade de dados (offline-first) e dívida técnica, com plano de ação priorizado.

## Visão geral

PWA mobile-first **offline-first** para registro e validação de serviços em obras.

**Stack:** React 18 + TypeScript + Vite 6 + Tailwind 4 (frontend); Supabase Edge
Functions (Hono/Deno) + IndexedDB (persistência local). Três perfis de usuário:
Administrador, Encarregado e Preposto (valida via link público, sem login).

O projeto é funcional e arquiteturalmente sólido na intenção, mas tem **falhas de
segurança graves que o tornam inseguro para produção como está**, além de dívida
técnica considerável (≈0% de testes reais, componentes-monstro, 56 erros de TypeScript).

**Origem:** o `package.json` se chama `@figma/my-make-file` — o projeto nasceu de um
export do **Figma Make**, o que explica os ~46 componentes `shadcn/ui` gerados e não
utilizados.

---

## 🔴 Segurança (nota geral ≈ 4,5/10)

### Críticos — corrigir antes de qualquer produção

1. **JWT sem verificação de assinatura no fallback** — `supabase/functions/make-server-1ff231a2/index.ts:241-373`
   O caminho principal (`supabase.auth.getUser()`) é seguro, mas quando ele falha o
   código aceita o token apenas **decodificando o payload** e checando emissor,
   expiração e existência do usuário — sem verificar a assinatura criptográfica.
   Um token forjado com `iss` correto e o `sub`/`email` de um admin existente é aceito.
   **Impacto:** personificação de qualquer usuário (incluindo admin).

2. **KV store sem autorização** — `supabase/functions/make-server-1ff231a2/kv_store.tsx:15-18`
   Todas as operações usam `SERVICE_ROLE_KEY`, ignorando RLS. As policies RLS definidas
   em `supabase/migrations/002_create_all_tables.sql` são **código morto**, pois os dados
   vivem na tabela KV, não nas tabelas SQL. Token comprometido = acesso total.

3. **Endpoint de debug público exposto** — `supabase/functions/public-conferencia/index.tsx:134-183`
   `GET /debug/obra/:obraId` lista todos os formulários de uma obra sem autenticação.

### Altos

- **`GET /users` e `GET /obras` sem filtro por dono** — `index.ts:714-729`, `1067-1084`:
  encarregados enxergam dados de todos os usuários/obras.
- **Links públicos do preposto sem expiração nem revogação** — UUID v4 (entropia ok),
  mas o link vale para sempre; se vazar, assina para sempre.
- **CORS `*` no `public-conferencia`** (`index.tsx:102-105`) vs. CORS restrito no servidor
  principal — inconsistente.
- **Setup key fraca por padrão** (`"setup-fc-pisos-2024"`) para criar admin master — `index.ts:540-550`.
- **Rate limiting não-persistente** e baseado em `x-forwarded-for` (passível de spoofing).

### Segredos (boa notícia)

Não há service-role key vazada no git. A `anon key` e o project ID em
`src/config/supabase.ts` são públicos por design (ok). Os arquivos `envs.txt` /
`envs_remaining.txt` no repo contêm só **nomes** de variáveis (valores "Encrypted") —
devem ser removidos por higiene, mas não vazam segredos.

> ⚠️ O `docs/SECURITY.md` afirma "JWT validado", "RLS no banco" e "CORS restrito" — o que
> **não corresponde à implementação real**.

---

## 🟡 Arquitetura offline-first (frontend)

O pipeline de sincronização é a parte mais bem pensada do projeto:

- Escritas **locais primeiro** (IndexedDB), debounce de 600ms, fila persistente
  (`src/app/utils/syncQueue.ts`, 519 linhas) que sobrevive a reload.
- Mutex entre abas via **Navigator Locks API**; processamento em ordem cronológica; até 3 retentativas.
- 401 não incrementa retry (espera re-login); merge com estratégia "backend sempre vence"
  (`src/app/utils/dataSync.ts`).

### Riscos concretos de perda de dados / UX

- **Falha parcial silenciosa em batch** — `src/app/utils/database.ts:295-324`: se 1 de N
  formulários falha ao gravar, a transação resolve como sucesso. **(corrigir primeiro)**
- **Sem timeout nas chamadas `fetch`** — `src/app/utils/api.ts:103-203`: em rede ruim a
  requisição trava indefinidamente. Falta `AbortController`.
- **Reversão no submit offline** — `src/app/components/FormularioPage.tsx:319-332`: reverte
  edições locais ao falhar, gerando confusão (dado não some, mas o usuário não sabe).
- **401 silencioso na fila** — item fica "pending" para sempre sem avisar o usuário de que
  está deslogado.
- **Cache do AdminDashboard não invalida** entre abas.

---

## 🟠 Qualidade de código e dívida técnica

| Métrica | Estado atual |
|---|---|
| Erros de TypeScript | **56** (31 por `node_modules` ausente; ~21 lacunas reais de tipos) |
| Cobertura de testes | **≈0%** — 1 teste trivial, apesar de Vitest configurado |
| "God classes" | `AdminDashboard.tsx` (1.336), `ServicosSection.tsx` (1.239), `pdfGenerator.ts` (935) |
| Código morto | ~46 componentes `shadcn/ui` não importados (herança do Figma Make) |
| Duplicação | `logSanitizer` existe em 3 lugares |
| Higiene do repo | ~12 `.md` de debug soltos na raiz, `tsc_output.txt`, `envs*.txt`, nome `@figma/...` |

**Lacunas de tipos reais** (`src/app/types/index.ts`): faltam exports `DiarioData`,
`EtapasExecucao`, `RegistrosSubstrato`; props `onBlur` ausentes em form-sections;
integração `chart.tsx`/recharts. Dependência `react-signature-canvas@1.1.0-alpha.2`
(**alpha em produção**, usada nas assinaturas).

---

## ✅ Plano de ação priorizado

### P0 — antes de produção (segurança)

1. Verificar assinatura do JWT no fallback (ou remover o fallback inteiro).
2. Remover `GET /debug/obra/:obraId`.
3. Restringir CORS do `public-conferencia` a domínios conhecidos.
4. Adicionar filtro de autorização em `GET /users` e `GET /obras`.
5. Adicionar expiração + revogação aos links públicos do preposto.

### P0 — confiabilidade de dados

6. Corrigir falha parcial silenciosa no batch do IndexedDB (rejeitar se qualquer item falhar).
7. Adicionar `AbortController` com timeout (~30s) em todas as chamadas `fetch`.

### P1 — saúde do projeto

8. `npm ci` + corrigir as ~21 lacunas reais de tipos.
9. Escrever testes para `syncQueue.ts` / `dataSync.ts` / `database.ts`.
10. Alinhar `docs/SECURITY.md` com a realidade; remover arquivos de debug/`envs*.txt`;
    renomear o pacote.

### P2 — manutenibilidade

Quebrar `AdminDashboard` e `ServicosSection`; remover componentes `shadcn` não usados;
substituir o `react-signature-canvas` alpha; avaliar migração do padrão KV para tabelas
SQL com RLS de fato.

---

## Status das correções

| # | Item | Status |
|---|------|--------|
| 1 | JWT — verificação de assinatura | ⬜ pendente |
| 2 | Remover endpoint de debug | ⬜ pendente |
| 3 | CORS do public-conferencia | ⬜ pendente |
| 4 | Autorização em GET /users e /obras | ⬜ pendente |
| 5 | Expiração/revogação de links | ⬜ pendente |
| 6 | Falha parcial em batch IndexedDB | ⬜ pendente |
| 7 | Timeout nas chamadas fetch | ⬜ pendente |
