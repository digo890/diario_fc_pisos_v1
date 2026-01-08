# 📚 Documentação Técnica - Diário de Obras FC Pisos

Esta pasta contém toda a documentação técnica de referência do projeto.

---

## 📂 **ESTRUTURA**

```
/docs/
├── README.md                    # Este arquivo (índice)
├── SECURITY.md                  # Segurança e correções implementadas
├── ARCHITECTURE_DEBT.md         # Dívida técnica mapeada
├── AUDITORIA_COMPLETA.md        # Auditoria completa do sistema
├── SERVICE_WORKER_GUIDE.md      # Guia do Service Worker
├── VERSIONAMENTO.md             # Sistema de versionamento
├── CLEANUP_REPORT.md            # Relatório de limpeza de código
├── ATTRIBUTIONS.md              # Atribuições de bibliotecas
└── changelogs/                  # Histórico de mudanças
    ├── 3.1_LOGS.md              # Limpeza de logs
    ├── 3.2_CLEANUP.md           # Limpeza de dependências
    └── UX_SYNC_AUTOHIDE.md      # Melhoria UX do indicador
```

---

## 📖 **DOCUMENTOS PRINCIPAIS**

### **🔒 [SECURITY.md](./SECURITY.md)**
Documentação completa de segurança:
- Correções implementadas
- Variáveis de ambiente
- Arquitetura de segurança
- Rotas protegidas vs públicas
- Checklist de deploy

### **🏗️ [ARCHITECTURE_DEBT.md](./ARCHITECTURE_DEBT.md)**
Dívida técnica mapeada para refatoração futura:
- Edge Functions com múltiplas responsabilidades
- Arquitetura ideal proposta
- Plano de refatoração
- Comparação antes/depois

### **🔍 [AUDITORIA_COMPLETA.md](./AUDITORIA_COMPLETA.md)**
Auditoria completa do sistema v1.1.0:
- Problemas identificados
- Correções implementadas
- Melhorias de performance
- Service Worker

### **⚙️ [SERVICE_WORKER_GUIDE.md](./SERVICE_WORKER_GUIDE.md)**
Guia técnico do Service Worker:
- Estratégias de cache
- Configuração
- Debugging
- Otimizações

### **📦 [VERSIONAMENTO.md](./VERSIONAMENTO.md)**
Sistema de versionamento do projeto:
- Semântica de versões
- Como versionar
- Histórico

### **🧹 [CLEANUP_REPORT.md](./CLEANUP_REPORT.md)**
Relatório de limpeza de código:
- Dependências removidas
- Componentes analisados
- Economia de bundle size
- Recomendações

---

## 📝 **CHANGELOGS**

### **[3.1 - Sistema de Logs](./changelogs/3.1_LOGS.md)**
- Removidos 110+ console.log desnecessários
- Implementado sistema com níveis (DEBUG, INFO, WARN, ERROR)
- Logs contextuais por ambiente

### **[3.2 - Limpeza de Dependências](./changelogs/3.2_CLEANUP.md)**
- Removida dependência `vaul` (30KB)
- Análise completa de 47 componentes UI
- 100% das dependências em uso ativo

### **[UX - Auto-hide Sync Status](./changelogs/UX_SYNC_AUTOHIDE.md)**
- Indicador de sincronização com auto-hide
- Animações suaves
- Interface mais limpa

---

## 🎯 **PARA DESENVOLVEDORES**

### **Começando:**
1. Leia o [README principal](../README.md) para visão geral
2. Revise [SECURITY.md](./SECURITY.md) antes de deploy
3. Consulte [SERVICE_WORKER_GUIDE.md](./SERVICE_WORKER_GUIDE.md) para cache

### **Adicionando Features:**
1. Verifique [ARCHITECTURE_DEBT.md](./ARCHITECTURE_DEBT.md) para evitar dívida
2. Use [CLEANUP_REPORT.md](./CLEANUP_REPORT.md) para escolher componentes
3. Siga padrões de logging conforme [changelog 3.1](./changelogs/3.1_LOGS.md)

### **Antes de Deploy:**
1. Revise checklist em [SECURITY.md](./SECURITY.md)
2. Atualize [VERSIONAMENTO.md](./VERSIONAMENTO.md)
3. Crie changelog na pasta `/changelogs/`

---

## 📌 **LINKS ÚTEIS**

- [README Principal](../README.md) - Documentação para usuários
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Resend Dashboard](https://resend.com/dashboard)

---

**Última atualização:** 2026-01-08  
**Versão:** 1.1.0  
**Mantenedor:** Equipe de Desenvolvimento FC Pisos
