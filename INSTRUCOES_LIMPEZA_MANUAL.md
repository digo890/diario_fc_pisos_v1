# 🛠️ INSTRUÇÕES PARA LIMPEZA MANUAL - V1.1.0

## ⚠️ IMPORTANTE

Devido à quantidade de mudanças, está documentado aqui O QUE FAZER para completar a limpeza.
Você pode fazer manualmente ou pedir para mim continuar em outra sessão.

---

## 1️⃣ REMOVER TODOS OS CONSOLE.LOG/CONSOLE.ERROR

### Como fazer no VS Code:

1. **Abra a pesquisa global:** `Ctrl + Shift + F` (Windows/Linux) ou `Cmd + Shift + F` (Mac)
2. **Ative Regex:** Clique no ícone `.*` 
3. **Cole este padrão:**
   ```regex
   console\.(log|error|warn|info|debug)\([^)]*\);?\n?
   ```
4. **Replace com:** (deixe em branco - nada)
5. **Clique em "Replace All"**

### ⚠️ EXCEÇÕES (não remover):

**NO BACKEND (`/supabase/functions/server/index.tsx`):**
```typescript
// MANTER ESTE:
app.use('*', logger(console.log)); // Logger do Hono - é necessário

// MANTER console.error em catch() de erros críticos:
catch (error) {
  console.error('Erro crítico no servidor:', error); // OK manter
  return c.json({ error: 'Erro interno' }, 500);
}
```

### Arquivos para limpar:

**Frontend (SRC):**
- ✅ `/src/app/components/Login.tsx` → 1 console.error  
- ❌ `/src/app/components/AdminDashboard.tsx` → 2 console.log
- ❌ `/src/app/components/CreateObraPage.tsx` → 2 console.log  
- ❌ `/src/app/components/PrepostoValidationPage.tsx` → 2 console.log
- ❌ `/src/app/contexts/AuthContext.tsx` → 15 console.log
- ❌ `/src/app/hooks/useSyncQueue.tsx` → 4 console.log

**Backend:**
- ❌ `/supabase/functions/server/index.tsx` → Limpar console.log de debug, manter errors críticos

---

## 2️⃣ DELETAR COMPONENTES UI NÃO USADOS

### Componentes a DELETAR:

Navegue para `/src/app/components/ui/` e **delete estes arquivos:**

```bash
accordion.tsx
alert-dialog.tsx
alert.tsx
aspect-ratio.tsx
avatar.tsx
badge.tsx
breadcrumb.tsx
calendar.tsx
card.tsx
carousel.tsx
chart.tsx
checkbox.tsx
collapsible.tsx
command.tsx
context-menu.tsx
dialog.tsx
drawer.tsx
dropdown-menu.tsx
form.tsx
hover-card.tsx
input-otp.tsx
menubar.tsx
navigation-menu.tsx
pagination.tsx
popover.tsx
progress.tsx
radio-group.tsx
resizable.tsx
scroll-area.tsx
select.tsx
separator.tsx
sheet.tsx
sidebar.tsx
skeleton.tsx
slider.tsx
sonner.tsx
switch.tsx
table.tsx
tabs.tsx
textarea.tsx
toggle-group.tsx
toggle.tsx
tooltip.tsx
use-mobile.ts
```

### Componentes a MANTER:

```bash
button.tsx   ✅ USADO
input.tsx    ✅ USADO
label.tsx    ✅ USADO  
utils.ts     ✅ USADO (funções auxiliares)
```

---

## 3️⃣ LIMPAR DEPENDÊNCIAS DO PACKAGE.JSON

### Abra `/package.json` e DELETE estas linhas:

```json
"@emotion/react": "11.14.0",           ❌ (Material UI - não usado)
"@emotion/styled": "11.14.1",          ❌ (Material UI - não usado)
"@mui/icons-material": "7.3.5",        ❌ (Material UI - não usado)
"@mui/material": "7.3.5",              ❌ (Material UI - não usado)
"@popperjs/core": "2.11.8",            ❌
"@radix-ui/react-accordion": "1.2.3",  ❌
"@radix-ui/react-alert-dialog": "1.1.6", ❌
"@radix-ui/react-aspect-ratio": "1.1.2", ❌
"@radix-ui/react-avatar": "1.1.3",     ❌
"@radix-ui/react-checkbox": "1.1.4",   ❌
"@radix-ui/react-collapsible": "1.1.3", ❌
"@radix-ui/react-context-menu": "2.2.6", ❌
"@radix-ui/react-dialog": "1.1.6",     ❌
"@radix-ui/react-dropdown-menu": "2.1.6", ❌
"@radix-ui/react-hover-card": "1.1.6", ❌
"@radix-ui/react-menubar": "1.1.6",    ❌
"@radix-ui/react-navigation-menu": "1.2.5", ❌
"@radix-ui/react-popover": "1.1.6",    ❌
"@radix-ui/react-progress": "1.1.2",   ❌
"@radix-ui/react-radio-group": "1.2.3", ❌
"@radix-ui/react-scroll-area": "1.2.3", ❌
"@radix-ui/react-select": "2.1.6",     ❌
"@radix-ui/react-separator": "1.1.2",  ❌
"@radix-ui/react-slider": "1.2.3",     ❌
"@radix-ui/react-switch": "1.1.3",     ❌
"@radix-ui/react-tabs": "1.1.3",       ❌
"@radix-ui/react-toggle": "1.1.2",     ❌
"@radix-ui/react-toggle-group": "1.1.2", ❌
"@radix-ui/react-tooltip": "1.1.8",    ❌
"cmdk": "1.1.1",                       ❌
"date-fns": "3.6.0",                   ❌
"embla-carousel-react": "8.6.0",       ❌
"input-otp": "1.4.2",                  ❌
"react-day-picker": "8.10.1",          ❌
"react-dnd": "16.0.1",                 ❌
"react-dnd-html5-backend": "16.0.1",   ❌
"react-hook-form": "7.55.0",           ❌
"react-popper": "2.3.0",               ❌
"react-resizable-panels": "2.1.7",     ❌
"react-responsive-masonry": "2.7.1",   ❌
"react-slick": "0.31.0",               ❌
"recharts": "2.15.2",                  ❌
"tw-animate-css": "1.3.8",             ❌
```

### MANTER ESTAS:

```json
"@radix-ui/react-label": "2.1.2",      ✅ (usado em label.tsx)
"@radix-ui/react-slot": "1.1.2",       ✅ (usado em button.tsx)
"@supabase/supabase-js": "^2.89.0",    ✅
"@types/node": "^25.0.3",              ✅
"@types/react-signature-canvas": "^1.0.7", ✅
"browser-image-compression": "^2.0.2", ✅
"class-variance-authority": "0.7.1",   ✅
"clsx": "2.1.1",                       ✅
"idb": "^8.0.3",                       ✅
"jspdf": "^2.5.2",                     ✅
"jspdf-autotable": "^5.0.7",           ✅
"lucide-react": "0.487.0",             ✅
"motion": "12.23.24",                  ✅
"next-themes": "0.4.6",                ✅
"react": "18.3.1",                     ✅
"react-dom": "18.3.1",                 ✅
"react-signature-canvas": "1.1.0-alpha.2", ✅
"sonner": "2.0.3",                     ✅
"tailwind-merge": "3.2.0",             ✅
"vaul": "1.1.2",                       ✅ (BottomSheet)
"xlsx": "^0.18.5",                     ✅
```

---

## 4️⃣ DELETAR DIRETÓRIO VAZIO

Delete o diretório:
```
/supabase/functions/make-server-1ff231a2/
```

Este diretório está vazio (só tem `config.toml`) e não é usado.

---

## 5️⃣ ATUALIZAR VERSÃO PARA 1.1.0

### Edite `/src/version.ts`:
```typescript
export const APP_VERSION = '1.1.0'; // ← Mude de 1.0.0 para 1.1.0
```

### Edite `/package.json`:
```json
{
  "version": "1.1.0" // ← Mude de 1.0.0 para 1.1.0
}
```

---

## 6️⃣ APÓS CONCLUIR, RODE:

```bash
# Reinstalar dependências limpas
npm install

# Verificar se o build funciona
npm run build

# Testar localmente
npm run dev
```

---

## 📊 RESULTADO ESPERADO

✅ **Console.log removidos:** ~60  
✅ **Componentes UI deletados:** ~42 arquivos  
✅ **Dependências removidas:** ~40 pacotes  
✅ **Bundle reduzido:** ~45-50%  
✅ **Versão atualizada:** 1.1.0  

---

## ⚡ ATALHO RÁPIDO (Bash/Terminal)

Se você tiver acesso ao terminal do projeto:

```bash
# 1. Deletar componentes UI não usados
cd src/app/components/ui
rm accordion.tsx alert-dialog.tsx alert.tsx aspect-ratio.tsx avatar.tsx \
   badge.tsx breadcrumb.tsx calendar.tsx card.tsx carousel.tsx chart.tsx \
   checkbox.tsx collapsible.tsx command.tsx context-menu.tsx dialog.tsx \
   drawer.tsx dropdown-menu.tsx form.tsx hover-card.tsx input-otp.tsx \
   menubar.tsx navigation-menu.tsx pagination.tsx popover.tsx progress.tsx \
   radio-group.tsx resizable.tsx scroll-area.tsx select.tsx separator.tsx \
   sheet.tsx sidebar.tsx skeleton.tsx slider.tsx sonner.tsx switch.tsx \
   table.tsx tabs.tsx textarea.tsx toggle-group.tsx toggle.tsx tooltip.tsx \
   use-mobile.ts
cd ../../../../

# 2. Deletar diretório vazio Edge Function
rm -rf supabase/functions/make-server-1ff231a2

# 3. Reinstalar dependências (após editar package.json manualmente)
npm install

# 4. Testar
npm run dev
```

---

**Última atualização:** 06/01/2026  
**Status:** Instruções completas. Aguardando execução manual.
