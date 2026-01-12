# 🔒 PROTOCOLO DE AUDITORIA DE SCHEMA

## Objetivo
Garantir que **qualquer alteração no formulário** seja rastreada, validada e sincronizada em todos os componentes do sistema.

---

## 🚨 QUANDO EXECUTAR AUDITORIA

Execute auditoria COMPLETA sempre que:

- ✅ **Adicionar** um novo campo ao formulário
- ✅ **Remover** um campo existente
- ✅ **Renomear** um campo (label ou dataKey)
- ✅ **Alterar tipo** de campo (simple → dualField, etc)
- ✅ **Alterar unidade** de medida
- ✅ **Alterar opções** de multiselect
- ✅ **Alterar formato** de salvamento

---

## 📋 CHECKLIST DE AUDITORIA COMPLETA

### **FASE 1: Planejamento (antes de codificar)**

- [ ] Documentar **MOTIVO** da alteração
- [ ] Definir **NOVA VERSÃO** (V1.1.0, V1.2.0, V2.0.0)
  - **PATCH** (V1.0.X): correção de bugs sem alterar schema
  - **MINOR** (V1.X.0): adicionar campos mantendo compatibilidade
  - **MAJOR** (VX.0.0): mudanças que quebram compatibilidade
- [ ] Avaliar **IMPACTO** em dados existentes
- [ ] Definir estratégia de **MIGRAÇÃO** (se necessário)

---

### **FASE 2: Implementação do Schema**

- [ ] **Criar arquivo** `/src/app/schema/SCHEMA_V{nova_versao}.ts`
- [ ] **Copiar conteúdo** da versão anterior
- [ ] **Aplicar alterações** com comentários explicativos
- [ ] **Atualizar SCHEMA_STATS** (totalCampos, etc)
- [ ] **Congelar arrays** com `Object.freeze()`
- [ ] **Atualizar hash** do schema

---

### **FASE 3: Sincronização de Componentes**

#### ✅ **Arquivo 1: ServicosSection.tsx**
- [ ] Atualizar array `ETAPAS` (linhas 8-43)
- [ ] Verificar todos os campos têm:
  - `label` correto
  - `unit` ou `units` correto
  - `isDualField` ou `isMultiSelect` correto
  - `options` correto (se multiselect)
- [ ] Atualizar comentário de performance (linha 99)
- [ ] Testar renderização visual no navegador
- [ ] Testar salvamento de dados no IndexedDB

#### ✅ **Arquivo 2: pdfGenerator.ts**
- [ ] Atualizar array `todasEtapas` (linhas ~170-224)
- [ ] Verificar todos os campos têm:
  - `dataKey` = schema.dataKey
  - `label` = "{numero}. {schema.label}"
  - `unit` correto
  - `isMultiSelect` ou `isDualField` correto
- [ ] Testar exportação de PDF
- [ ] Verificar formatação de dualField e multiselect
- [ ] Verificar numeração sequencial (1-34, 1-35, etc)

#### ✅ **Arquivo 3: excelGenerator.ts**
- [ ] Atualizar array `ETAPAS` (linhas ~4-36)
- [ ] Verificar todos os campos têm:
  - `label` = schema.label
  - `unit` correto
  - `isDualField` ou `isMultiSelect` correto
  - `units` correto (se dualField)
- [ ] Testar exportação de Excel
- [ ] Verificar formatação de células
- [ ] Verificar numeração nas colunas

#### ✅ **Arquivo 4: ViewRespostasModal.tsx**
- [ ] Atualizar array `ETAPAS_COMPLETAS` (linhas ~20-54)
- [ ] Verificar todos os campos têm:
  - `label` = schema.label
  - `unit` correto
  - `isDualField` ou `isMultiSelect` correto
  - `units` correto (se dualField)
- [ ] Testar visualização no modal
- [ ] Verificar formatação de dualField e multiselect

---

### **FASE 4: Migração de Dados (se necessário)**

- [ ] Criar função em `/src/app/schema/migrations.ts`:
  ```typescript
  export function migrateFromV1_0_0ToV1_1_0(data: FormData): FormData {
    // Lógica de migração
    return migratedData;
  }
  ```
- [ ] Testar migração com dados reais de produção
- [ ] Adicionar logs de migração para debugging
- [ ] Implementar rollback em caso de erro

---

### **FASE 5: Validação Automática**

Execute o validador de integridade:

```typescript
import { validateSchemaIntegrity, ETAPAS_V1_1_0 } from './schema/SCHEMA_V1.1.0';
import { ETAPAS } from './components/form-sections/ServicosSection';

// Converter ETAPAS para formato compatível
const implementedFields = ETAPAS.map(e => ({
  label: e.label,
  unit: e.unit,
  isDualField: e.isDualField,
  isMultiSelect: e.isMultiSelect
}));

const validation = validateSchemaIntegrity(implementedFields);

if (!validation.isValid) {
  console.error('❌ SCHEMA INCONSISTENTE!');
  validation.errors.forEach(err => console.error(err));
} else {
  console.log('✅ Schema válido!');
}
```

---

### **FASE 6: Testes Manuais**

#### **Teste 1: Criação de Novo Laudo**
- [ ] Abrir formulário
- [ ] Preencher TODOS os campos (incluindo novos)
- [ ] Salvar laudo
- [ ] Reabrir laudo
- [ ] Verificar se todos os dados foram salvos corretamente

#### **Teste 2: Abertura de Laudo Antigo**
- [ ] Abrir laudo criado na versão anterior
- [ ] Verificar se migração automática funcionou
- [ ] Verificar se campos antigos ainda aparecem
- [ ] Verificar se campos novos estão vazios (correto)

#### **Teste 3: Exportação PDF**
- [ ] Exportar laudo novo
- [ ] Exportar laudo antigo migrado
- [ ] Verificar numeração sequencial
- [ ] Verificar formatação de dualField e multiselect
- [ ] Verificar unidades de medida

#### **Teste 4: Exportação Excel**
- [ ] Exportar laudo novo
- [ ] Exportar laudo antigo migrado
- [ ] Abrir arquivo no Excel/Google Sheets
- [ ] Verificar todas as colunas estão presentes
- [ ] Verificar formatação de células

#### **Teste 5: Visualização**
- [ ] Abrir modal de visualização
- [ ] Verificar todos os campos aparecem
- [ ] Verificar formatação de dualField e multiselect
- [ ] Verificar campos vazios aparecem como "-"

---

### **FASE 7: Documentação**

- [ ] Atualizar `/docs/CHANGELOG.md` com:
  - Versão nova
  - Data de release
  - Lista de alterações
  - Breaking changes (se houver)
- [ ] Atualizar `/README.md` se necessário
- [ ] Criar PR com título: `[SCHEMA V{nova_versao}] {descrição}`
- [ ] Marcar PR com label `schema-change`
- [ ] Anexar relatório de auditoria ao PR

---

## 📊 TEMPLATE DE RELATÓRIO DE AUDITORIA

```markdown
# AUDITORIA DE SCHEMA — V{nova_versao}

## 📅 Data
{data}

## 🎯 Motivo da Alteração
{descrição do motivo}

## 🔄 Alterações Realizadas

### Campos Adicionados
- Campo 35: {label} ({tipo}) — {motivo}
- Campo 36: {label} ({tipo}) — {motivo}

### Campos Removidos
- Campo X: {label} — {motivo}

### Campos Modificados
- Campo Y: {alteração} — {motivo}

## ✅ Checklist de Sincronização

- [x] ServicosSection.tsx atualizado
- [x] pdfGenerator.ts atualizado
- [x] excelGenerator.ts atualizado
- [x] ViewRespostasModal.tsx atualizado
- [x] Migração implementada (se aplicável)
- [x] Testes manuais executados
- [x] Validação automática passou

## 🧪 Resultados dos Testes

### Teste 1: Criação de Novo Laudo
✅ Passou

### Teste 2: Abertura de Laudo Antigo
✅ Passou

### Teste 3: Exportação PDF
✅ Passou

### Teste 4: Exportação Excel
✅ Passou

### Teste 5: Visualização
✅ Passou

## 🐛 Problemas Identificados
{lista de problemas ou "Nenhum"}

## ✅ Conclusão
Schema V{nova_versao} está pronto para deploy.

---
Auditoria realizada por: {nome}
Revisado por: {nome}
Aprovado em: {data}
```

---

## 🚨 REGRAS DE OURO

1. **NUNCA** edite arquivos `SCHEMA_V*.ts` depois de congelados
2. **SEMPRE** execute auditoria COMPLETA antes de deploy
3. **SEMPRE** teste com dados reais de produção
4. **SEMPRE** implemente migração se alterar formato de dados
5. **SEMPRE** documente breaking changes
6. **NUNCA** faça deploy sem passar em TODOS os testes

---

## 🔧 Ferramentas de Apoio

### Script de Validação Rápida
```bash
# Executar validador automático
npm run validate-schema

# Gerar diff entre versões
npm run schema-diff v1.0.0 v1.1.0

# Executar testes de integração
npm run test:schema
```

---

## 📚 Histórico de Auditorias

| Versão | Data | Auditor | Alterações | Status |
|--------|------|---------|------------|--------|
| V1.0.0 | 10/01/2026 | Sistema | Schema inicial congelado | ✅ Aprovado |
| V1.1.0 | {data} | {nome} | {resumo} | 🔄 Em andamento |

---

**🔒 Este protocolo é OBRIGATÓRIO para qualquer alteração de schema.**
