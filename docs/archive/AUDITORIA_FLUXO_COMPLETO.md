# 🔍 AUDITORIA COMPLETA DO FLUXO - Diário de Obras FC Pisos

**Data:** 12/01/2026  
**Versão:** 1.0.0  
**Autor:** Sistema de Auditoria Automatizada

---

## 📊 RESUMO EXECUTIVO

✅ **Status Geral:** Sistema funcional com 4 problemas identificados  
⚠️ **Problemas Críticos:** 2  
⚠️ **Problemas Médios:** 2  
✅ **Código Morto:** Identificado e documentado

---

## 🎯 FLUXO ESPERADO (Admin → Encarregado → Preposto)

### **1️⃣ ADMIN CRIA OBRA**
```
POST /make-server-1ff231a2/obras
→ Salva: obra:${id} no KV Store
→ Status inicial: "novo"
→ Gera: validationToken (UUID)
```

### **2️⃣ ENCARREGADO PREENCHE FORMULÁRIO**
```
POST /make-server-1ff231a2/formularios
→ Salva: formulario:${id} no KV Store
→ formulario.obra_id = obra.id
→ Status da obra: "em_preenchimento" (atualizado no frontend)
```

### **3️⃣ ENCARREGADO ENVIA PARA PREPOSTO**
```
PUT /make-server-1ff231a2/obras/:id
→ obra.status = "enviado_preposto"

POST /make-server-1ff231a2/emails/send-preposto-conferencia
→ Envia email com link: /conferencia/${formularioId}
→ Link usa o ID do FORMULÁRIO, não da obra
```

### **4️⃣ PREPOSTO CONFERE E ASSINA**
```
GET /conferencia/${formularioId} (Edge Function pública)
→ Busca formulario:${id}
→ Busca obra:${formulario.obra_id}
→ Exibe dados para conferência

POST /conferencia/${formularioId}/assinar (Edge Function pública)
→ Atualiza formulario:
   - prepostoConfirmado: true
   - statusPreposto: "aprovado" | "reprovado"
   - assinaturaPreposto: base64
   - dataAssinaturaPreposto: ISO string
   
→ Atualiza obra:
   - SE aprovado: obra.status = "concluido"
   - SE reprovado: obra.status = "reprovado_preposto"
```

### **5️⃣ ADMIN VISUALIZA RESULTADO**
```
GET /make-server-1ff231a2/obras
→ Admin vê obra com status atualizado
→ Pode baixar PDF/Excel com assinatura do preposto
```

---

## 🐛 PROBLEMAS IDENTIFICADOS

### **❌ PROBLEMA #1: INCONSISTÊNCIA DE NOMENCLATURA (CRÍTICO)**

**Descrição:** Backend usa snake_case mas Edge Function pública e frontend usam camelCase.

**Locais afetados:**
- `/supabase/functions/server/index.tsx` → usa `preposto_confirmado`, `encarregado_id`
- `/supabase/functions/public-conferencia/index.tsx` → usa `prepostoConfirmado`, `obra_id`
- Frontend → usa `prepostoConfirmado`, `encarregadoId`

**Impacto:**
- 🔴 **ALTO** - Pode causar bugs de leitura/escrita
- Dados podem não ser encontrados se a nomenclatura não bater

**Exemplo do problema:**
```typescript
// Backend salva:
formulario.preposto_confirmado = true

// Edge Function pública lê:
if (formulario.prepostoConfirmado) { ... } // ❌ Sempre false!
```

**Solução:**
1. Padronizar TUDO para camelCase (recomendado para JavaScript/TypeScript)
2. Ou criar funções de conversão snake_case ↔ camelCase

---

### **❌ PROBLEMA #2: STATUS "aprovado_preposto" NUNCA É SETADO (CRÍTICO)**

**Descrição:** AdminDashboard verifica `obra.status === 'aprovado_preposto'` mas esse status nunca é setado.

**Locais afetados:**
- `/src/app/components/AdminDashboard.tsx` linha 116, 135
- Edge Function pública seta `obra.status = "concluido"` quando aprovado

**Código problemático:**
```typescript
// AdminDashboard.tsx linha 116
if (obra.status === 'enviado_preposto' || obra.status === 'aprovado_preposto' || 
    obra.status === 'reprovado_preposto' || obra.status === 'enviado_admin' || obra.status === 'concluido') {
  // Esta condição com 'aprovado_preposto' NUNCA será verdadeira!
}
```

**Solução:**
- Remover referências a `'aprovado_preposto'` no AdminDashboard
- Ou alterar Edge Function para setar `'aprovado_preposto'` em vez de `'concluido'`

---

### **⚠️ PROBLEMA #3: STATUS DUPLICADOS (MÉDIO)**

**Descrição:** Existem `obra.status` E `formulario.status`, não está claro qual é a fonte da verdade.

**Onde são usados:**
- `obra.status` → usado no AdminDashboard, filtros, getStatusDisplay
- `formulario.status` → validado no backend (linha 1558-1586)

**Status possíveis da obra:**
- `"novo"` → Obra criada
- `"em_preenchimento"` → Encarregado começou a preencher
- `"enviado_preposto"` → Aguardando conferência
- `"reprovado_preposto"` → Preposto reprovou
- `"concluido"` → Preposto aprovou
- `"enviado_admin"` → ??? (não encontrado no fluxo)
- `"aprovado_preposto"` → ❌ Código morto

**Status possíveis do formulário (backend linha 1559-1567):**
- `"rascunho"` → Formulário não enviado
- `"enviado_preposto"` → Enviado para conferência
- `"reprovado_preposto"` → Reprovado
- `"enviado_admin"` → ??? 
- `"concluido"` → Finalizado

**Solução:**
- Decidir: `obra.status` é a fonte da verdade?
- Remover `formulario.status` se não for necessário
- Ou sincronizar sempre que um mudar

---

### **⚠️ PROBLEMA #4: STATUS "enviado_admin" SEM USO CLARO (MÉDIO)**

**Descrição:** Status `"enviado_admin"` aparece em vários lugares mas não é setado em nenhum lugar do fluxo.

**Locais onde aparece:**
- AdminDashboard linha 117, 135, 242, 588
- diarioHelpers.ts linha 68, 94
- Backend index.tsx linha 1562, 1566

**Hipótese:**
- Pode ser um status intermediário planejado mas não implementado
- Ou pode ser código de uma versão anterior

**Solução:**
- Documentar quando esse status deve ser usado
- Ou remover se não for mais necessário

---

## ✅ VALIDAÇÃO DE TRANSIÇÕES DE STATUS

### **STATUS DA OBRA:**
```
novo
  ↓
em_preenchimento
  ↓
enviado_preposto
  ↓ (aprovado)    ↓ (reprovado)
concluido       reprovado_preposto
                  ↓ (corrigido)
                em_preenchimento (loop)
```

### **STATUS DO FORMULÁRIO (Backend):**
```
rascunho
  ↓
enviado_preposto
  ↓ (aprovado)    ↓ (reprovado)
enviado_admin?  reprovado_preposto
  ↓                ↓
concluido       rascunho (loop)
```

**⚠️ ATENÇÃO:** As transições do formulário não estão sincronizadas com as da obra!

---

## 🧹 CÓDIGO MORTO IDENTIFICADO

### **1. Status "aprovado_preposto" no AdminDashboard**
```typescript
// AdminDashboard.tsx linha 116
if (obra.status === 'aprovado_preposto' || ...) {
  // ❌ Esta condição NUNCA será verdadeira
}
```

**Ação:** Remover ou implementar corretamente

---

### **2. Possível código morto em diarioHelpers.ts**
```typescript
// diarioHelpers.ts linha 68
case 'enviado_admin':
  return {
    label: 'Validado',
    color: 'bg-green-100 ...'
  };
```

**Ação:** Verificar se é usado ou remover

---

## 🔧 OTIMIZAÇÕES RECOMENDADAS

### **1. PADRONIZAR NOMENCLATURA**
**Prioridade:** 🔴 ALTA  
**Esforço:** Médio  
**Impacto:** Alto

Converter todo o backend para usar camelCase consistente com frontend.

---

### **2. UNIFICAR STATUS**
**Prioridade:** 🟡 MÉDIA  
**Esforço:** Baixo  
**Impacto:** Médio

Decidir se `obra.status` ou `formulario.status` é a fonte da verdade e remover o outro.

---

### **3. ADICIONAR WEBSOCKETS/POLLING**
**Prioridade:** 🟢 BAIXA  
**Esforço:** Alto  
**Impacto:** Médio

Para que admin receba notificação em tempo real quando preposto assina.

---

### **4. CRIAR DOCUMENTAÇÃO DE ESTADOS**
**Prioridade:** 🟡 MÉDIA  
**Esforço:** Baixo  
**Impacto:** Alto

Documento central com todos os status possíveis e suas transições.

---

## 📝 CHECKLIST DE CORREÇÕES

### **Correções Imediatas (Críticas):**
- [ ] Padronizar nomenclatura (snake_case → camelCase) no backend
- [ ] Corrigir status "aprovado_preposto" no AdminDashboard
- [ ] Testar fluxo completo: Admin → Encarregado → Preposto → Admin

### **Correções Médio Prazo:**
- [ ] Decidir sobre `obra.status` vs `formulario.status`
- [ ] Documentar quando usar "enviado_admin"
- [ ] Remover código morto identificado

### **Melhorias Futuras:**
- [ ] Adicionar notificações em tempo real
- [ ] Criar testes automatizados do fluxo completo
- [ ] Adicionar logs de auditoria para todas as mudanças de status

---

## 🎯 CONCLUSÃO

O sistema está **funcional** mas tem **2 problemas críticos** que podem causar bugs:

1. ❌ Inconsistência de nomenclatura entre backend e Edge Function
2. ❌ Status "aprovado_preposto" que nunca é setado mas é verificado

**Recomendação:** Corrigir os 2 problemas críticos antes de deploy em produção.

**Tempo estimado de correção:** 2-3 horas

---

**Fim da Auditoria** ✅
