# 🔍 DEBUGGING - FORMULÁRIOS

> **Comandos úteis e técnicas para debugar problemas em formulários**

---

## 🛠️ FERRAMENTAS DO NAVEGADOR

### **1. Console (F12 → Console)**

#### **Ver estado atual do formulário:**
```javascript
// Cole no console do navegador enquanto edita formulário
console.log('📋 FormData atual:', formData);
```

#### **Verificar IndexedDB:**
```javascript
// Inspecionar banco de dados local
const db = await window.indexedDB.open('fc-pisos-db', 1);
console.log('💾 Database:', db);
```

#### **Listar todos os formulários salvos:**
```javascript
// Cole no console
(async () => {
  const dbRequest = indexedDB.open('fc-pisos-db', 1);
  dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['forms'], 'readonly');
    const objectStore = transaction.objectStore('forms');
    const request = objectStore.getAll();
    
    request.onsuccess = () => {
      console.log('📋 Formulários salvos:', request.result);
      console.log('🔢 Total:', request.result.length);
    };
  };
})();
```

#### **Inspecionar formulário específico:**
```javascript
// Substitua 'obra-id-aqui' pelo ID da obra
(async () => {
  const dbRequest = indexedDB.open('fc-pisos-db', 1);
  dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['forms'], 'readonly');
    const objectStore = transaction.objectStore('forms');
    const request = objectStore.get('obra-id-aqui');
    
    request.onsuccess = () => {
      console.log('📄 FormData:', request.result);
      console.log('🔑 Campos:', Object.keys(request.result));
      console.log('📊 Schema version:', request.result.schemaVersion);
    };
  };
})();
```

---

### **2. Application Tab (F12 → Application)**

#### **Inspecionar IndexedDB visualmente:**
1. Abrir DevTools (F12)
2. Ir para aba "Application"
3. Expandir "IndexedDB" no menu lateral
4. Expandir "fc-pisos-db"
5. Clicar em "forms"
6. Ver todos os formulários salvos

#### **Inspecionar Service Worker:**
1. Application → Service Workers
2. Ver status (ativo/inativo)
3. Opções:
   - **Update:** Forçar atualização do SW
   - **Unregister:** Desregistrar (útil para debug)
   - **Bypass for network:** Desabilitar cache temporariamente

#### **Inspecionar Cache:**
1. Application → Cache Storage
2. Ver caches criados pelo SW:
   - `fc-pisos-static-v1.1.0`
   - `fc-pisos-runtime-v1.1.0`
   - `fc-pisos-images-v1.1.0`

---

### **3. Network Tab (F12 → Network)**

#### **Monitorar sincronização com Supabase:**
1. Abrir Network tab
2. Filtrar por "make-server"
3. Enviar formulário
4. Ver requisições:
   - `POST /make-server-1ff231a2/forms` → Salvar form
   - `POST /make-server-1ff231a2/email/send` → Enviar email

#### **Ver dados enviados:**
1. Clicar na requisição
2. Aba "Payload" → Ver FormData enviado
3. Aba "Response" → Ver resposta do servidor
4. Aba "Headers" → Verificar Authorization token

---

## 🐛 PROBLEMAS COMUNS

### **PROBLEMA 1: Campo não aparece no formulário**

**Verificações:**
```javascript
// 1. Verificar se campo está no tipo
console.log('Campo no FormData?', 'nomedocampo' in formData);

// 2. Verificar valor atual
console.log('Valor:', formData.nomedocampo);

// 3. Verificar se componente está renderizando
console.log('Componente montado');
```

**Possíveis causas:**
- [ ] Campo não adicionado em `types/index.ts`
- [ ] Componente de input não foi adicionado
- [ ] Erro de sintaxe no JSX
- [ ] Renderização condicional impedindo exibição

**Solução:**
1. Verificar console para erros
2. Verificar que `updateFormData()` está sendo chamado
3. Adicionar `console.log()` no `onChange` do input

---

### **PROBLEMA 2: Valor não persiste ao salvar**

**Verificações:**
```javascript
// Antes de salvar
console.log('📝 Dados antes de salvar:', formData);

// Depois de recarregar
console.log('💾 Dados carregados:', formData);
```

**Possíveis causas:**
- [ ] `updateFormData()` não está atualizando estado
- [ ] Campo tem nome diferente no tipo vs. componente
- [ ] IndexedDB não está funcionando (modo privado?)
- [ ] Erro ao salvar no banco

**Solução:**
```javascript
// Adicionar log na função de salvar
const handleSave = async () => {
  console.log('💾 Salvando FormData:', formData);
  
  try {
    await saveFormData(formData);
    console.log('✅ Salvo com sucesso');
  } catch (error) {
    console.error('❌ Erro ao salvar:', error);
  }
};
```

---

### **PROBLEMA 3: Campo não aparece no PDF/Excel**

**Verificações:**
```javascript
// No gerador de PDF/Excel, adicionar:
console.log('📄 Gerando PDF com dados:', formData);
console.log('🔍 Campo específico:', formData.nomedocampo);
```

**Possíveis causas:**
- [ ] Campo não adicionado no gerador
- [ ] Condição `if (formData.campo)` está bloqueando
- [ ] Erro silencioso no gerador
- [ ] Campo com valor `undefined` ou `null`

**Solução:**
```javascript
// Adicionar logs detalhados
if (formData.nomedocampo) {
  console.log('✅ Adicionando campo ao PDF:', formData.nomedocampo);
  doc.text(`Campo: ${formData.nomedocampo}`, x, y);
} else {
  console.log('⚠️ Campo vazio, pulando');
}
```

---

### **PROBLEMA 4: Formulário antigo quebra ao carregar**

**Verificações:**
```javascript
// Ao carregar formulário
console.log('📋 FormData carregado:', formData);
console.log('🔢 Schema version:', formData.schemaVersion);
console.log('🔑 Campos presentes:', Object.keys(formData));
```

**Possíveis causas:**
- [ ] Campo novo não é opcional (`?`)
- [ ] Código tenta acessar propriedade de `undefined`
- [ ] Migração de dados não implementada
- [ ] TypeScript type mismatch

**Solução:**
```javascript
// Sempre usar valores padrão
const valor = formData.novoCampo || 'padrão';

// Renderização condicional
{formData.novoCampo && <Component />}

// Optional chaining
const nested = formData.servicos?.servico1?.horario;
```

---

### **PROBLEMA 5: Sincronização não funciona**

**Verificações:**
```javascript
// Ver status de sincronização
console.log('🌐 Online?', navigator.onLine);

// Ver fila de sincronização (se implementada)
const queue = await getSyncQueue();
console.log('📬 Fila:', queue);
```

**Possíveis causas:**
- [ ] Offline (modo avião)
- [ ] Token de autenticação expirado
- [ ] Erro no servidor (500)
- [ ] CORS bloqueando requisição

**Solução:**
1. Abrir Network tab
2. Ver se requisição está sendo enviada
3. Verificar status code (200 = sucesso)
4. Ver resposta de erro no console

---

### **PROBLEMA 6: Erro de TypeScript ao compilar**

**Erro comum:**
```
Property 'novoCampo' does not exist on type 'FormData'
```

**Solução:**
1. Verificar se campo foi adicionado em `/src/app/types/index.ts`
2. Reiniciar TypeScript server (VSCode: Ctrl+Shift+P → "Restart TS Server")
3. Verificar se tipo está correto (string vs number)

---

## 🧪 SCRIPTS DE TESTE

### **Teste 1: Criar FormData mock**

```javascript
// Cole no console para testar renderização
const mockFormData = {
  obraId: 'teste-123',
  schemaVersion: 3,
  clima: {
    manha: 'sol',
    tarde: 'nublado',
    noite: 'chuva'
  },
  temperaturaMin: '18',
  temperaturaMax: '28',
  umidade: '65',
  servicos: {
    servico1: {
      horario: '08:00 - 12:00',
      local: 'Área A',
      etapas: { etapa1: true, etapa2: false },
      fotos: []
    }
  },
  ucrete: '10kg',
  horarioInicio: '08:00',
  horarioTermino: '17:00',
  area: '100',
  espessura: '5',
  rodape: '10',
  estadoSubstrato: 'regular',
  estadoSubstratoObs: '',
  registros: {},
  observacoes: 'Teste de formulário',
  status: 'em_preenchimento',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  createdBy: 'user-123'
};

console.log('📋 FormData mock criado:', mockFormData);
```

---

### **Teste 2: Validar estrutura de FormData**

```javascript
// Verificar se FormData tem todos os campos necessários
const validarFormData = (data) => {
  const camposObrigatorios = [
    'obraId',
    'clima',
    'temperaturaMin',
    'temperaturaMax',
    'umidade',
    'servicos',
    'status',
    'createdAt'
  ];
  
  const camposFaltando = camposObrigatorios.filter(
    campo => !(campo in data)
  );
  
  if (camposFaltando.length > 0) {
    console.error('❌ Campos faltando:', camposFaltando);
    return false;
  }
  
  console.log('✅ FormData válido');
  return true;
};

// Usar:
validarFormData(formData);
```

---

### **Teste 3: Comparar FormData antes e depois**

```javascript
// Salvar snapshot antes de editar
const formDataAntes = JSON.parse(JSON.stringify(formData));

// ... fazer alterações ...

// Comparar diferenças
const formDataDepois = formData;

const diff = Object.keys(formDataDepois).filter(
  key => JSON.stringify(formDataAntes[key]) !== JSON.stringify(formDataDepois[key])
);

console.log('📊 Campos alterados:', diff);
diff.forEach(key => {
  console.log(`  ${key}:`, {
    antes: formDataAntes[key],
    depois: formDataDepois[key]
  });
});
```

---

### **Teste 4: Simular sincronização**

```javascript
// Testar envio para servidor (sem realmente enviar)
const testarSincronizacao = async (formData) => {
  console.log('📤 Simulando envio para servidor...');
  
  try {
    // Validar dados localmente
    if (!formData.obraId) {
      throw new Error('obraId obrigatório');
    }
    
    // Serializar (como seria enviado)
    const payload = JSON.stringify(formData);
    console.log('📦 Payload size:', payload.length, 'bytes');
    
    // Simular resposta
    console.log('✅ Sincronização bem-sucedida (simulação)');
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
};

// Usar:
testarSincronizacao(formData);
```

---

## 📊 PERFORMANCE DEBUGGING

### **Medir tempo de carregamento:**

```javascript
// Adicionar no código
console.time('⏱️ Carregar FormData');
const data = await loadFormData(obraId);
console.timeEnd('⏱️ Carregar FormData');
```

### **Medir tempo de salvamento:**

```javascript
console.time('⏱️ Salvar FormData');
await saveFormData(formData);
console.timeEnd('⏱️ Salvar FormData');
```

### **Medir tempo de geração de PDF:**

```javascript
console.time('⏱️ Gerar PDF');
await generateFormPDF(obra, formData, users);
console.timeEnd('⏱️ Gerar PDF');
```

---

## 🔧 LIMPEZA DE DADOS

### **Limpar IndexedDB (resetar banco local):**

```javascript
// ⚠️ CUIDADO: Isso apaga TODOS os dados locais!
(async () => {
  const confirm = window.confirm('⚠️ APAGAR TODOS OS DADOS LOCAIS?');
  
  if (!confirm) return;
  
  indexedDB.deleteDatabase('fc-pisos-db');
  console.log('🗑️ IndexedDB limpo! Recarregue a página.');
  
  // Recarregar
  window.location.reload();
})();
```

### **Limpar apenas formulários:**

```javascript
(async () => {
  const dbRequest = indexedDB.open('fc-pisos-db', 1);
  dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['forms'], 'readwrite');
    const objectStore = transaction.objectStore('forms');
    const request = objectStore.clear();
    
    request.onsuccess = () => {
      console.log('🗑️ Todos os formulários deletados');
    };
  };
})();
```

### **Deletar formulário específico:**

```javascript
const deletarFormulario = async (obraId) => {
  const dbRequest = indexedDB.open('fc-pisos-db', 1);
  dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['forms'], 'readwrite');
    const objectStore = transaction.objectStore('forms');
    const request = objectStore.delete(obraId);
    
    request.onsuccess = () => {
      console.log(`🗑️ Formulário ${obraId} deletado`);
    };
  };
};

// Usar:
deletarFormulario('obra-123');
```

---

## 🚀 ATALHOS ÚTEIS

### **Recarregar sem cache:**
- **Windows/Linux:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

### **Abrir DevTools:**
- **Atalho:** `F12` ou `Ctrl + Shift + I`

### **Console rápido:**
- **Atalho:** `Ctrl + Shift + J`

### **Modo Incógnito (testar sem cache):**
- **Windows/Linux:** `Ctrl + Shift + N`
- **Mac:** `Cmd + Shift + N`

---

## 📋 CHECKLIST DE DEBUG

Quando algo não funciona:

1. **Console Limpo?**
   - [ ] Sem erros vermelhos
   - [ ] Sem warnings importantes

2. **Dados Corretos?**
   - [ ] FormData tem estrutura esperada
   - [ ] Campos têm valores corretos
   - [ ] Tipos estão corretos (string vs number)

3. **Network OK?**
   - [ ] Requisições retornam 200
   - [ ] Payload está sendo enviado
   - [ ] Resposta é válida

4. **IndexedDB OK?**
   - [ ] Banco aberto sem erros
   - [ ] Dados salvos corretamente
   - [ ] Transações sem erro

5. **TypeScript OK?**
   - [ ] Build sem erros
   - [ ] Tipos corretos
   - [ ] Imports corretos

6. **Service Worker OK?**
   - [ ] Registrado e ativo
   - [ ] Cache funcionando
   - [ ] Não bloqueando requisições

---

## 📞 QUANDO PEDIR AJUDA

Se após seguir este guia o problema persistir, forneça:

1. **Erro exato:** (copiar do console)
2. **Passos para reproduzir:** (1. fazer X, 2. clicar Y, 3. erro aparece)
3. **Dados usados:** (FormData mock que causa erro)
4. **Screenshots:** (se aplicável)
5. **Versão do sistema:** (package.json version)
6. **Navegador:** (Chrome, Firefox, Safari, etc.)

---

**Versão:** 1.0  
**Útil?** Adicione seus próprios scripts de debug aqui!
