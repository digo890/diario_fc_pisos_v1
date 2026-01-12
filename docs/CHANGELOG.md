# 📝 CHANGELOG — Diário de Obras FC Pisos

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [1.0.0] - 2026-01-10

### 🔒 **SCHEMA CONGELADO**
Esta versão marca o **congelamento do schema V1.0.0** do formulário.

### ✨ Adicionado
- **34 campos** no formulário de serviços executados
- **3 campos multiselect** com opções dinâmicas:
  - Campo 13: Aplicação de Uretano (6 tipos de uretano)
  - Campo 14: Serviços de pintura (3 tipos)
  - Campo 15: Serviços de pintura de layout (8 tipos)
- **6 campos dualField** com dupla entrada de valores:
  - Campo 20: Remoção de Substrato Fraco (m² + Espessura)
  - Campo 21: Desbaste de Substrato (m² + Espessura)
  - Campo 22: Grauteamento (m² + Espessura)
  - Campo 23: Remoção e Reparo de Sub-Base (m² + Espessura)
  - Campo 24: Reparo com Concreto Uretânico (m² + Espessura)
  - Campo 30: Reparo de Revestimento em Piso (m² + Espessura)
- **24 campos simples** com validação numérica
- **Campos 33 e 34** novos:
  - Campo 33: Quantos botijões de gás foram utilizados?
  - Campo 34: Quantas bisnagas de selante foram utilizadas?

### 🔄 Modificado
- **Campo 12** renomeado: "Preparo de Substrato" → "Preparo de Substrato (fresagem e ancoragem)"
- **Campo 13** (Uretano para Paredes): atualizado para "Uretano para Paredes, base e pilares"
- **Campos 13, 14, 15** convertidos de dropdown para multiselect
- **Validação de percentual** adicionada aos campos 2 e 4 (limite 100%)

### 🗑️ Removido
- Campos obsoletos da versão beta removidos

### 🔧 Corrigido
- **PDF Generator**: Sincronizado com 34 campos, formatação correta de multiselect e dualField
- **Excel Generator**: Sincronizado com 34 campos, formatação correta de células
- **ViewRespostasModal**: Sincronizado com 34 campos, exibição correta de todos os tipos

### 🚀 Performance
- **React.memo** aplicado em ServicosSection
- **useMemo** para cálculos pesados
- **Batch loading** em listas grandes
- **Skeleton loading states** durante carregamento
- **Service Worker** para cache de assets

### 🛡️ Segurança
- Todas as **8 vulnerabilidades críticas** corrigidas
- Autenticação Supabase implementada
- Validação de entrada em todos os campos
- Sanitização de dados antes de exportar

### 📚 Documentação
- Schema V1.0.0 documentado e congelado
- Protocolo de auditoria criado
- Changelog iniciado

---

## [Unreleased]

### 🔮 Planejado para V1.1.0
- [ ] Remover código morto `isDropdown` (~200 linhas)
- [ ] Adicionar validação explícita de pipe `|` em campos
- [ ] Implementar testes automatizados de schema
- [ ] Adicionar script de validação automática

---

## Template para Próximas Versões

```markdown
## [X.Y.Z] - YYYY-MM-DD

### ✨ Adicionado
- Funcionalidade nova

### 🔄 Modificado
- Mudança em funcionalidade existente

### 🗑️ Removido
- Funcionalidade removida

### 🔧 Corrigido
- Correção de bug

### ⚠️ Breaking Changes
- Mudanças que quebram compatibilidade
```

---

## Convenções de Versionamento

### MAJOR (X.0.0)
Incrementa quando houver **breaking changes**:
- Remoção de campos obrigatórios
- Mudança de formato de salvamento incompatível
- Alteração de API pública

### MINOR (1.X.0)
Incrementa quando adicionar **funcionalidades compatíveis**:
- Adicionar novos campos (opcionais)
- Adicionar novas opções em multiselect
- Melhorias de performance

### PATCH (1.0.X)
Incrementa para **correções de bugs**:
- Correção de validação
- Correção de formatação em relatórios
- Correção de UI

---

## Links

- [Schema V1.0.0](/src/app/schema/SCHEMA_V1.0.0.ts)
- [Protocolo de Auditoria](/docs/AUDITORIA_SCHEMA.md)
- [README](/README.md)

---

**📅 Última atualização:** 10/01/2026  
**👤 Mantido por:** Equipe FC Pisos
