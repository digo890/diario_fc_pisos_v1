# 📌 Guia de Versionamento - Diário de Obras FC Pisos

## 🎯 Versão Atual: **1.0.0**

---

## 📖 Como funciona o versionamento (SemVer)

O sistema usa **Versionamento Semântico** no formato: `MAJOR.MINOR.PATCH`

```
1.0.0
│ │ │
│ │ └─── PATCH: Correções de bugs e ajustes pequenos
│ └─────── MINOR: Novas funcionalidades compatíveis
└────────── MAJOR: Mudanças grandes/incompatíveis
```

---

## 🔢 Quando incrementar cada número

### **PATCH** (1.0.0 → 1.0.1)
Correções de bugs, ajustes visuais, melhorias de performance
- ✅ Corrigir erro no formulário
- ✅ Ajustar cor de um botão
- ✅ Melhorar validação de campo
- ✅ Corrigir problema de sincronização

### **MINOR** (1.0.0 → 1.1.0)
Novas funcionalidades que não quebram o sistema atual
- ✅ Adicionar novo tipo de relatório
- ✅ Criar novo campo no formulário
- ✅ Adicionar filtro de busca
- ✅ Implementar notificações push

### **MAJOR** (1.0.0 → 2.0.0)
Mudanças grandes que podem quebrar compatibilidade
- ✅ Reformulação completa da interface
- ✅ Mudança no modelo de dados
- ✅ Nova arquitetura do sistema
- ✅ Remoção de funcionalidades antigas

---

## 🛠️ Como atualizar a versão

### **1. Edite o arquivo `/src/version.ts`:**

```typescript
export const APP_VERSION = '1.1.0'; // ← Mude aqui
export const APP_NAME = 'Diário de Obras – FC Pisos';
```

### **2. Atualize o `package.json`:**

```json
{
  "version": "1.1.0" // ← Mude aqui também
}
```

### **3. Pronto! A versão aparecerá automaticamente na tela de login.**

---

## 📋 Histórico de Versões

### **v1.0.0** (06/01/2026) - LANÇAMENTO OFICIAL 🎉
Primeira versão estável em produção com:
- ✅ Sistema completo de autenticação (login/cadastro)
- ✅ Gestão de obras e formulários
- ✅ Fluxo de aprovação com Preposto
- ✅ Sistema de status e notificações
- ✅ Exportação PDF/Excel
- ✅ Tema claro/escuro (Material You)
- ✅ Offline-first com IndexedDB
- ✅ PWA mobile-first
- ✅ Integração Supabase + Edge Functions
- ✅ Sistema de emails (Resend)

---

## 💡 Dicas

1. **Sempre atualize os 2 arquivos** (`version.ts` + `package.json`)
2. **Documente mudanças importantes** neste arquivo
3. **Use PATCH para 90% das atualizações** (pequenas correções)
4. **MINOR para novas features** visíveis ao usuário
5. **MAJOR só em mudanças radicais** (raramente)

---

## 🚀 Próximas versões planejadas

- **v1.1.0**: [A definir quando você adicionar novas features]
- **v1.2.0**: [A definir]
- **v2.0.0**: [Grandes mudanças futuras]

---

**Última atualização:** 06/01/2026
