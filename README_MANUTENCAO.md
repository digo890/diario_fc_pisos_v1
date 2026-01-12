# 📚 DOCUMENTAÇÃO DE MANUTENÇÃO - DIÁRIO DE OBRAS FC PISOS

> **Sistema completo de guias para manutenção segura do formulário**

---

## 🎯 INÍCIO RÁPIDO

**Precisa fazer uma alteração no formulário?**

### **👉 COMECE AQUI:**

1. **Adicionar campo simples?** → Leia [`REFERENCIA_RAPIDA.md`](./REFERENCIA_RAPIDA.md)
2. **Mudança complexa?** → Leia [`GUIA_MANUTENCAO_FORMULARIOS.md`](./GUIA_MANUTENCAO_FORMULARIOS.md)
3. **Primeiro campo?** → Use [`TEMPLATE_ADICIONAR_CAMPO.md`](./TEMPLATE_ADICIONAR_CAMPO.md)
4. **Mudar estrutura?** → Leia [`EXEMPLO_MIGRACAO_DADOS.md`](./EXEMPLO_MIGRACAO_DADOS.md)
5. **Algo quebrou?** → Consulte [`DEBUGGING_FORMULARIOS.md`](./DEBUGGING_FORMULARIOS.md)

---

## 📖 GUIAS DISPONÍVEIS

### **1️⃣ REFERÊNCIA RÁPIDA** ⚡
**Arquivo:** [`REFERENCIA_RAPIDA.md`](./REFERENCIA_RAPIDA.md)

**Use quando:**
- Precisar de uma consulta rápida
- Já souber o que fazer, só precisar lembrar como
- Quiser comandos prontos para copiar

**Contém:**
- ✅ Checklist mínimo
- ⚡ Fluxo rápido de 7 passos
- 🔧 Comandos úteis do console
- 🎨 Ícones comuns
- 🐛 Debugging básico

**Tempo de leitura:** ~5 minutos

---

### **2️⃣ GUIA DE MANUTENÇÃO COMPLETO** 📘
**Arquivo:** [`GUIA_MANUTENCAO_FORMULARIOS.md`](./GUIA_MANUTENCAO_FORMULARIOS.md)

**Use quando:**
- For fazer mudança complexa
- Precisar entender a arquitetura
- Quiser evitar quebrar dados antigos
- Não tiver certeza de como proceder

**Contém:**
- 🏗️ Arquitetura completa do formulário
- ✅ Checklist detalhado de modificação
- 🔧 5 tipos de alterações (adicionar, modificar, remover, renomear, condicional)
- 🎯 Ordem correta de modificação (9 passos)
- 🔄 Compatibilidade com dados existentes
- 🧪 Testes obrigatórios (7 cenários)
- 🚨 Rollback de emergência
- 📚 Exemplos práticos passo a passo
- 🎓 Dicas avançadas

**Tempo de leitura:** ~30 minutos  
**⭐ RECOMENDADO:** Leia pelo menos uma vez antes de fazer alterações

---

### **3️⃣ TEMPLATE ADICIONAR CAMPO** 📝
**Arquivo:** [`TEMPLATE_ADICIONAR_CAMPO.md`](./TEMPLATE_ADICIONAR_CAMPO.md)

**Use quando:**
- For adicionar um novo campo
- Quiser um passo a passo detalhado
- Preferir seguir uma checklist

**Contém:**
- 📋 Formulário de planejamento
- ✅ Checklist de implementação (6 passos)
- 📖 Código pronto para texto, número, select, checkbox
- 🧪 7 testes obrigatórios
- 🔍 Troubleshooting
- 🎨 Lista de ícones comuns
- ✅ Checklist final

**Tempo de leitura:** ~15 minutos  
**Modo de uso:** Imprimir ou abrir lado a lado ao codificar

---

### **4️⃣ EXEMPLOS DE MIGRAÇÃO** 🔄
**Arquivo:** [`EXEMPLO_MIGRACAO_DADOS.md`](./EXEMPLO_MIGRACAO_DADOS.md)

**Use quando:**
- Precisar mudar tipo de dados (string → number)
- Quiser renomear campo
- Precisar dividir campo (ex: endereco → rua, numero, cidade)
- Quiser remover campo deprecado
- Precisar implementar versionamento de schema

**Contém:**
- 📖 5 cenários reais detalhados:
  1. Mudar tipo de dados
  2. Renomear campo
  3. Dividir campo em múltiplos
  4. Sistema de versionamento
  5. Remover campo deprecado
- 🔧 Código completo de migrações
- 🧪 Scripts de teste
- 📊 Registro de histórico de migrações
- ✅ Checklist de migração segura
- 🚨 Quando NÃO migrar

**Tempo de leitura:** ~25 minutos  
**⭐ CRÍTICO:** Leia antes de mudar estrutura de dados

---

### **5️⃣ DEBUGGING** 🔍
**Arquivo:** [`DEBUGGING_FORMULARIOS.md`](./DEBUGGING_FORMULARIOS.md)

**Use quando:**
- Algo não estiver funcionando
- Precisar inspecionar dados
- Quiser verificar o que está acontecendo
- Precisar limpar cache/dados

**Contém:**
- 🛠️ Ferramentas do navegador (Console, Application, Network)
- 🐛 6 problemas comuns com soluções:
  1. Campo não aparece
  2. Valor não persiste
  3. PDF/Excel sem campo
  4. Formulário antigo quebra
  5. Sincronização falha
  6. Erro de TypeScript
- 🧪 Scripts de teste prontos
- 📊 Performance debugging
- 🔧 Limpeza de dados
- 🚀 Atalhos úteis
- 📋 Checklist de debug
- 📞 Como pedir ajuda

**Tempo de leitura:** ~20 minutos  
**Modo de uso:** Consultar quando tiver problemas

---

## 🗺️ FLUXOGRAMA DE DECISÃO

```
┌─────────────────────────────────────┐
│   Preciso modificar formulário?     │
└────────────┬────────────────────────┘
             │
             ▼
      ┌──────────────┐
      │ Tipo de      │
      │ modificação? │
      └──┬───────────┘
         │
    ┌────┴─────┬─────────────┬──────────────┬─────────────┐
    │          │             │              │             │
    ▼          ▼             ▼              ▼             ▼
┌────────┐ ┌──────┐   ┌─────────┐   ┌──────────┐  ┌───────────┐
│Adicionar│ │Mudar │   │Renomear │   │ Remover  │  │  Debug?   │
│ campo  │ │ tipo │   │ campo   │   │  campo   │  │           │
└───┬────┘ └──┬───┘   └────┬────┘   └────┬─────┘  └─────┬─────┘
    │         │            │             │              │
    ▼         │            │             │              ▼
┌────────────┐│            │             │        ┌──────────────┐
│Primeira    ││            │             │        │ DEBUGGING_   │
│vez?        ││            │             │        │ FORMULARIOS  │
└─┬────────┬─┘│            │             │        └──────────────┘
  │        │  │            │             │
 SIM      NÃO │            │             │
  │        │  │            │             │
  ▼        ▼  ▼            ▼             ▼
┌─────┐ ┌──────────┐ ┌──────────────────────────┐
│TEMP │ │REFEREN.  │ │  EXEMPLO_MIGRACAO_DADOS  │
│LATE │ │RAPIDA    │ │                          │
└─────┘ └──────────┘ └──────────────────────────┘
  │        │              │
  │        │              │
  └────────┴──────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │ Precisa mais   │
         │ detalhes?      │
         └────┬───────────┘
              │
             SIM
              │
              ▼
    ┌──────────────────┐
    │  GUIA_MANUTENCAO │
    │  (Completo)      │
    └──────────────────┘
```

---

## 🎓 NÍVEIS DE CONHECIMENTO

### **INICIANTE** 🌱
**Você nunca modificou o formulário antes**

1. Leia [`GUIA_MANUTENCAO_FORMULARIOS.md`](./GUIA_MANUTENCAO_FORMULARIOS.md) completo
2. Pratique com [`TEMPLATE_ADICIONAR_CAMPO.md`](./TEMPLATE_ADICIONAR_CAMPO.md)
3. Mantenha [`REFERENCIA_RAPIDA.md`](./REFERENCIA_RAPIDA.md) aberta ao codificar
4. Use [`DEBUGGING_FORMULARIOS.md`](./DEBUGGING_FORMULARIOS.md) quando tiver problemas

**Tempo total de estudo:** ~1h30min

---

### **INTERMEDIÁRIO** 🌿
**Você já adicionou campos simples**

1. Releia seção "Tipos de Alterações" no [`GUIA_MANUTENCAO_FORMULARIOS.md`](./GUIA_MANUTENCAO_FORMULARIOS.md)
2. Leia [`EXEMPLO_MIGRACAO_DADOS.md`](./EXEMPLO_MIGRACAO_DADOS.md) antes de mudar estrutura
3. Use [`REFERENCIA_RAPIDA.md`](./REFERENCIA_RAPIDA.md) para consultas rápidas
4. Consulte [`DEBUGGING_FORMULARIOS.md`](./DEBUGGING_FORMULARIOS.md) quando necessário

**Tempo de revisão:** ~30min

---

### **AVANÇADO** 🌳
**Você já fez migrações de dados**

1. Use [`REFERENCIA_RAPIDA.md`](./REFERENCIA_RAPIDA.md) como consulta principal
2. Consulte [`EXEMPLO_MIGRACAO_DADOS.md`](./EXEMPLO_MIGRACAO_DADOS.md) para padrões de migração
3. Documente suas próprias migrações seguindo o histórico
4. Contribua com novos exemplos nesta documentação

**Você pode:** Pular guias básicos e ir direto ao código

---

## 📊 TABELA DE REFERÊNCIA RÁPIDA

| Tarefa | Arquivo Principal | Tempo | Dificuldade |
|--------|------------------|-------|-------------|
| Adicionar campo texto/número | TEMPLATE | 10min | ⭐ Fácil |
| Adicionar campo select | TEMPLATE | 15min | ⭐ Fácil |
| Adicionar checkbox | TEMPLATE | 10min | ⭐ Fácil |
| Adicionar etapa (1-37) | REFERENCIA | 5min | ⭐ Fácil |
| Adicionar registro condicional | REFERENCIA | 5min | ⭐ Fácil |
| Mudar tipo de dados | MIGRACAO | 30min | ⭐⭐⭐ Difícil |
| Renomear campo | MIGRACAO | 25min | ⭐⭐⭐ Difícil |
| Remover campo | MIGRACAO | 20min | ⭐⭐ Médio |
| Debug campo não aparece | DEBUGGING | 5min | ⭐ Fácil |
| Debug valor não salva | DEBUGGING | 10min | ⭐⭐ Médio |
| Implementar versionamento | MIGRACAO | 60min | ⭐⭐⭐⭐ Muito Difícil |

---

## 🚨 AVISOS IMPORTANTES

### **⚠️ ANTES DE COMEÇAR:**

1. **SEMPRE faça backup:**
   ```bash
   git add .
   git commit -m "backup antes de modificar formulário"
   ```

2. **SEMPRE teste com dados antigos:**
   - Não assuma que só dados novos existem
   - Formulários salvos podem ser de versões antigas

3. **NUNCA:**
   - ❌ Remover campos diretamente
   - ❌ Mudar tipos sem criar campo novo
   - ❌ Renomear sem manter campo antigo
   - ❌ Assumir que campos existem (usar `formData.campo?.propriedade`)

4. **SEMPRE:**
   - ✅ Campos novos são opcionais (`?`)
   - ✅ Usar valores padrão (`|| ''`)
   - ✅ Renderização condicional (`{campo && ...}`)
   - ✅ Verificar console (F12) por erros

---

## 🗂️ ESTRUTURA DO PROJETO

### **Arquivos que você VAI modificar:**

```
/src/app/
  ├── types/
  │   └── index.ts ⭐ FONTE DA VERDADE (sempre começar aqui)
  │
  ├── components/
  │   ├── form-sections/
  │   │   ├── CondicoesAmbientaisSection.tsx
  │   │   ├── DadosObraSection.tsx
  │   │   ├── ServicosSection.tsx
  │   │   ├── EtapasExecucaoSection.tsx
  │   │   └── RegistrosSection.tsx
  │   │
  │   └── ViewRespostasModal.tsx
  │
  └── utils/
      ├── pdfGenerator.ts
      └── excelGenerator.ts
```

### **Arquivos que você NÃO DEVE modificar:**

```
/supabase/functions/server/
  └── kv_store.tsx ⛔ PROTEGIDO

/src/app/utils/
  ├── database.ts ⚠️ Modificar com MUITO cuidado
  └── dataSync.ts ⚠️ Modificar com MUITO cuidado
```

---

## 📞 SUPORTE E CONTRIBUIÇÃO

### **Encontrou um problema nesta documentação?**
- Corrija e faça commit
- Adicione exemplos que faltam
- Melhore explicações confusas

### **Descobriu uma solução nova?**
- Adicione em [`DEBUGGING_FORMULARIOS.md`](./DEBUGGING_FORMULARIOS.md)
- Compartilhe no histórico de migrações
- Atualize a [`REFERENCIA_RAPIDA.md`](./REFERENCIA_RAPIDA.md)

### **Precisa de ajuda?**

**ANTES de pedir:**
1. Leia o guia apropriado
2. Verifique console (F12)
3. Teste com dados antigos
4. Tente debugar com [`DEBUGGING_FORMULARIOS.md`](./DEBUGGING_FORMULARIOS.md)

**AO pedir ajuda, forneça:**
- Erro exato (screenshot ou cópia do console)
- Código modificado
- Passos para reproduzir
- Versão do sistema (package.json)
- FormData de exemplo que causa erro

---

## ✅ CHECKLIST GERAL

Antes de fazer deploy de alterações no formulário:

- [ ] Leu documentação apropriada
- [ ] Fez backup (git commit)
- [ ] Modificou arquivos na ordem correta
- [ ] Campos novos são opcionais (`?`)
- [ ] Usou valores padrão (`|| ''`)
- [ ] Testou com formulário NOVO
- [ ] Testou com formulário ANTIGO
- [ ] Testou PDF/Excel
- [ ] Testou sincronização
- [ ] Console sem erros (F12)
- [ ] Código commitado
- [ ] Documentação atualizada (se necessário)

---

## 🎯 OBJETIVOS DESTA DOCUMENTAÇÃO

1. ✅ **Prevenir quebra de dados antigos**
2. ✅ **Facilitar manutenção por qualquer desenvolvedor**
3. ✅ **Documentar padrões e boas práticas**
4. ✅ **Acelerar desenvolvimento de novas features**
5. ✅ **Reduzir bugs em produção**

---

## 📈 VERSIONAMENTO

**Versão da Documentação:** 1.0  
**Data de Criação:** 2026-01-09  
**Última Atualização:** 2026-01-09  
**Sistema:** Diário de Obras FC Pisos v1.1.0  

**Histórico de Mudanças:**
- v1.0 (2026-01-09): Criação inicial completa

---

## 📚 ÍNDICE DE ARQUIVOS

1. **`README_MANUTENCAO.md`** (este arquivo) - Índice geral
2. **`REFERENCIA_RAPIDA.md`** - Consulta rápida
3. **`GUIA_MANUTENCAO_FORMULARIOS.md`** - Guia completo
4. **`TEMPLATE_ADICIONAR_CAMPO.md`** - Template passo a passo
5. **`EXEMPLO_MIGRACAO_DADOS.md`** - Exemplos de migração
6. **`DEBUGGING_FORMULARIOS.md`** - Guia de debugging

---

## 🎉 BOA SORTE!

**Esta documentação foi criada para você!**

- 📖 Leia com calma
- 🧪 Teste suas mudanças
- 🚀 Deploy com confiança
- 🤝 Contribua com melhorias

**Lembre-se:** Código limpo e bem documentado é código que dura.

---

**Criado com ❤️ para FC Pisos Diário de Obras**
