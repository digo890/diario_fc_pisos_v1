# 🛠️ GUIA DE DESENVOLVIMENTO — Diário de Obras FC Pisos

## 🎯 Visão Geral

Este é um **PWA mobile-first** para gestão de laudos de obra, com:
- ✅ Offline-first (IndexedDB + Service Worker)
- ✅ Material You Design
- ✅ Tema claro/escuro
- ✅ Autenticação Supabase
- ✅ Exportação PDF/Excel
- ✅ Assinatura digital
- ✅ Sistema de notificações

---

## 🚨 REGRA #1: NUNCA ALTERE O SCHEMA SEM AUDITORIA

**Antes de modificar qualquer campo do formulário**, leia:
👉 [`/docs/AUDITORIA_SCHEMA.md`](/docs/AUDITORIA_SCHEMA.md)

### ❌ NUNCA faça isso:
```typescript
// ServicosSection.tsx
const ETAPAS = [
  { label: 'Novo campo aqui', unit: 'm²' }, // ❌ SEM AUDITORIA!
  // ...
];
```

### ✅ SEMPRE faça isso:
1. Criar branch: `git checkout -b schema/v1.1.0-adicionar-campo-35`
2. Seguir protocolo de auditoria completo
3. Criar PR com relatório de auditoria
4. Revisão obrigatória antes de merge

---

## 📁 Estrutura de Arquivos Críticos

```
/src/app/
├── schema/
│   ├── SCHEMA_V1.0.0.ts          ← 🔒 CONGELADO - NÃO EDITAR
│   ├── SCHEMA_V1.1.0.ts          ← Próxima versão (quando houver)
│   └── migrations.ts             ← Migrações entre versões
│
├── components/
│   └── form-sections/
│       └── ServicosSection.tsx   ← ⚠️ AUDITORIA OBRIGATÓRIA
│
├── utils/
│   ├── pdfGenerator.ts           ← ⚠️ AUDITORIA OBRIGATÓRIA
│   ├── excelGenerator.ts         ← ⚠️ AUDITORIA OBRIGATÓRIA
│   └── db.ts                     ← IndexedDB
│
└── components/
    └── ViewRespostasModal.tsx    ← ⚠️ AUDITORIA OBRIGATÓRIA
```

---

## 🔐 Sistema de Versionamento de Schema

### Como Funciona

Cada versão do schema é **imutável** após congelamento:

```typescript
// SCHEMA_V1.0.0.ts
export const ETAPAS_V1_0_0 = Object.freeze([
  { numero: 1, label: 'Campo A', ... },
  { numero: 2, label: 'Campo B', ... },
  // ...34 campos
]);
```

### Quando Criar Nova Versão

| Alteração | Nova Versão | Breaking Change? |
|-----------|-------------|------------------|
| Adicionar campo opcional | V1.1.0 (MINOR) | ❌ Não |
| Remover campo | V2.0.0 (MAJOR) | ✅ Sim |
| Renomear campo | V2.0.0 (MAJOR) | ✅ Sim |
| Alterar tipo de campo | V2.0.0 (MAJOR) | ✅ Sim |
| Corrigir bug UI | V1.0.1 (PATCH) | ❌ Não |

---

## 🧪 Testes Obrigatórios

### Teste Local Antes de Commit

```bash
# 1. Verificar compilação
npm run build

# 2. Executar testes (quando implementados)
npm run test:schema

# 3. Validar schema
npm run validate-schema
```

### Teste Manual Obrigatório

Sempre que alterar formulário, PDF ou Excel:

1. ✅ Criar novo laudo
2. ✅ Preencher TODOS os campos
3. ✅ Salvar e reabrir
4. ✅ Exportar PDF
5. ✅ Exportar Excel
6. ✅ Abrir laudo antigo (testar migração)

---

## 📊 Formato de Dados

### Simple Field
```typescript
etapas['Temperatura Ambiente'] = "25"
```

### Dual Field
```typescript
etapas['Remoção de Substrato Fraco'] = "150|4"
//                                       ↑   ↑
//                                       m²  cm
```

### Multi Select
```typescript
etapas['Aplicação de Uretano'] = "Uretano argamassado 4mm:150|Uretano para rodapé:80"
//                                 ↑                        ↑   ↑
//                                 tipo                    valor tipo:valor
```

### Multi Select com Dual Field (dentro)
```typescript
etapas['Aplicação de Uretano'] = "Uretano para muretas:80|30"
//                                                        ↑  ↑
//                                                        ml cm
```

---

## 🎨 Convenções de Código

### Nomenclatura

```typescript
// ✅ BOM
const ETAPAS_V1_0_0 = [ /* ... */ ];
const updateEtapaValue = (key, value) => { /* ... */ };

// ❌ RUIM
const etapas = [ /* ... */ ];
const updateVal = (k, v) => { /* ... */ };
```

### Comentários

```typescript
// ✅ BOM - Explica o PORQUÊ
// Limitamos a 100% porque é uma porcentagem
if (unit === '%' && value > 100) return '100';

// ❌ RUIM - Explica o QUE (óbvio)
// Retorna 100
return '100';
```

### Performance

```typescript
// ✅ BOM - Memoizado
const servicosHabilitados = useMemo(() => {
  return calcularServicos(data);
}, [data]);

// ❌ RUIM - Recalcula a cada render
const servicosHabilitados = calcularServicos(data);
```

---

## 🐛 Debugging

### IndexedDB
```javascript
// Abrir DevTools → Application → IndexedDB → fcpisos-db
// Visualizar tabela 'formularios'
```

### Service Worker
```javascript
// DevTools → Application → Service Workers
// Clicar em "Unregister" para forçar atualização
```

### Logs Úteis
```typescript
console.log('📊 Salvando dados:', formData);
console.log('🔍 Validação schema:', validateSchemaIntegrity(ETAPAS));
```

---

## 🚀 Deploy

### Checklist Pré-Deploy

- [ ] Todos os testes passando
- [ ] Validação de schema OK
- [ ] CHANGELOG.md atualizado
- [ ] Versão incrementada em `package.json`
- [ ] PR aprovado por revisor
- [ ] Branch atualizado com `main`

### Processo de Deploy

```bash
# 1. Merge para main
git checkout main
git merge schema/v1.1.0

# 2. Tag de versão
git tag v1.1.0
git push origin v1.1.0

# 3. Deploy automático via CI/CD
# (ou manual via Figma Make)
```

---

## 🆘 Problemas Comuns

### "Campo não aparece no PDF"
✅ Verificar se `dataKey` está correto em `pdfGenerator.ts`

### "Dados não salvam"
✅ Verificar `updateEtapaValue` em `ServicosSection.tsx`

### "Erro ao abrir laudo antigo"
✅ Implementar migração em `migrations.ts`

### "Numeração errada nos campos"
✅ Verificar `numero` em todos os 4 arquivos (ServicosSection, PDF, Excel, Modal)

---

## 📚 Documentação Adicional

- [Protocolo de Auditoria](/docs/AUDITORIA_SCHEMA.md)
- [Changelog](/docs/CHANGELOG.md)
- [Schema V1.0.0](/src/app/schema/SCHEMA_V1.0.0.ts)

---

## 💡 Dicas de Produtividade

### VSCode Extensions Recomendadas
- ESLint
- Prettier
- TypeScript Error Translator
- GitLens

### Snippets Úteis

```json
{
  "Novo Campo Schema": {
    "prefix": "schema-field",
    "body": [
      "{",
      "  numero: ${1:35},",
      "  label: '${2:Nome do Campo}',",
      "  dataKey: '${2:Nome do Campo}',",
      "  tipo: '${3|simple,dualField,multiSelect|}',",
      "  unit: '${4:m²}',",
      "  formatoSalvamento: '\"${5:exemplo}\"',",
      "  validacao: { regex: '^[0-9.,/-]+$' }",
      "},"
    ]
  }
}
```

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit com mensagem clara (`git commit -m 'feat: adiciona campo X'`)
4. Push (`git push origin feature/nova-funcionalidade`)
5. Abra Pull Request

### Formato de Commit

```
tipo(escopo): descrição curta

[corpo opcional]

[rodapé opcional]
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

---

**🎉 Feliz codificação!**

Se tiver dúvidas, abra uma issue ou consulte a documentação.
