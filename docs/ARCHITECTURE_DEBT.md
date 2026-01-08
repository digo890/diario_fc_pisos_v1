# 🏗️ Dívida Técnica de Arquitetura - v1.1.0

## 🟡 Problema 2.3: Edge Functions com Múltiplas Responsabilidades

**Status:** 🔍 Mapeado - Refatoração Futura  
**Prioridade:** Média  
**Impacto:** Manutenção, Testes, Diagnóstico

---

## 📋 SITUAÇÃO ATUAL

As Edge Functions em `/supabase/functions/server/index.tsx` violam o **Single Responsibility Principle (SRP)**, fazendo múltiplas operações em cada endpoint:

### ❌ Problemas Identificados:

| Endpoint | Responsabilidades Acumuladas |
|----------|------------------------------|
| `POST /users` | Validação + Rate Limiting + Auth + KV Store + Formatação |
| `PUT /users/:id` | Busca + Validação + Update Auth (senha) + Update Auth (email) + Update Auth (metadata) + Update KV + Formatação |
| `POST /obras` | Validação + Rate Limiting + Geração UUID + Geração Token + Cálculo Expiração + Persistência + Formatação |
| `GET /formularios/token/:token` | Rate Limiting + Busca Obra + Validação Token + Busca Formulário + Auditoria + Formatação |
| `PUT /formularios/:id` | Validação UUID + Busca Formulário + Verificação Permissões + Validação Estado + Validação Transição + Update + Formatação |

---

## 🚨 IMPACTOS

### 1. **Dificuldade em Testes**
```typescript
// ❌ ATUAL: Impossível testar validação isoladamente
// Preciso mockar: auth, kv, rate limiting, validação

// ✅ IDEAL: Testar cada camada separadamente
describe('UserValidation', () => {
  it('should reject invalid email', () => {
    // Testar só validação, sem infraestrutura
  });
});
```

### 2. **Diagnóstico de Erros Complexo**
```typescript
// ❌ ATUAL: Erro em qualquer passo quebra tudo
// Mensagem genérica: "Erro ao criar usuário"

// ✅ IDEAL: Erro específico por camada
// "Erro na validação: email inválido"
// "Erro no Auth: usuário já existe"
// "Erro no KV Store: timeout"
```

### 3. **Manutenção Difícil**
```typescript
// ❌ ATUAL: Mudar validação afeta lógica de persistência
// Funções grandes (100+ linhas) difíceis de ler

// ✅ IDEAL: Camadas independentes
// Mudar validação não afeta persistência
// Funções pequenas (<30 linhas)
```

---

## 🎯 ARQUITETURA IDEAL (FUTURA)

### **Camadas Separadas:**

```
┌─────────────────────────────────────────┐
│   CONTROLLERS (Rotas HTTP)              │
│   - Recebe request                      │
│   - Chama serviços                      │
│   - Retorna response                    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   SERVICES (Lógica de Negócio)          │
│   - UserService                         │
│   - ObraService                         │
│   - FormularioService                   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   REPOSITORIES (Acesso a Dados)         │
│   - UserRepository (Auth + KV)          │
│   - ObraRepository (KV)                 │
│   - FormularioRepository (KV)           │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   VALIDATORS (Validação)                │
│   - validateUserData()                  │
│   - validateObraData()                  │
│   - validateFormularioData()            │
└─────────────────────────────────────────┘
```

---

## 📦 EXEMPLO: Refatoração de POST /users

### ❌ ANTES (Atual):

```typescript
app.post("/users", requireAuth, async (c) => {
  // 150+ linhas fazendo tudo:
  // - Validação
  // - Rate limiting
  // - Criar no Auth
  // - Salvar no KV
  // - Formatar resposta
});
```

### ✅ DEPOIS (Ideal):

```typescript
// ============================================
// 1. CONTROLLER (20 linhas)
// ============================================
app.post("/users", requireAuth, async (c) => {
  const body = await c.req.json();
  const userId = c.get('userId');
  
  const result = await userService.createUser(body, userId);
  
  if (!result.success) {
    return c.json(result, result.statusCode);
  }
  
  return c.json(result, 201);
});

// ============================================
// 2. SERVICE (30 linhas)
// ============================================
class UserService {
  async createUser(data: any, requesterId: string) {
    // Validar
    const validation = userValidator.validate(data);
    if (!validation.isValid) {
      return { success: false, error: validation.errors, statusCode: 400 };
    }
    
    // Rate limiting
    const rateLimit = rateLimiter.check(`create-user:${requesterId}`);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Too many requests', statusCode: 429 };
    }
    
    // Criar usuário
    const user = await userRepository.create(validation.sanitized);
    
    return { success: true, data: user, statusCode: 201 };
  }
}

// ============================================
// 3. REPOSITORY (40 linhas)
// ============================================
class UserRepository {
  async create(data: UserData) {
    // Criar no Auth
    const authData = await this.createInAuth(data);
    
    // Salvar no KV
    const user = await this.saveToKV(authData, data);
    
    return user;
  }
  
  private async createInAuth(data: UserData) {
    const supabase = getSupabaseAdmin();
    const { data: authData, error } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { nome: data.nome, tipo: data.tipo }
    });
    
    if (error) throw new AuthError(error.message);
    return authData;
  }
  
  private async saveToKV(authData: any, userData: UserData) {
    const user = {
      id: authData.user.id,
      nome: userData.nome,
      email: userData.email,
      tipo: userData.tipo,
      ativo: true,
      created_at: new Date().toISOString(),
    };
    
    await kv.set(`user:${user.id}`, user);
    return user;
  }
}

// ============================================
// 4. VALIDATOR (20 linhas)
// ============================================
class UserValidator {
  validate(data: any) {
    const errors: string[] = [];
    
    if (!data.nome) errors.push('Nome obrigatório');
    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Email inválido');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: this.sanitize(data)
    };
  }
  
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  private sanitize(data: any) {
    return {
      nome: data.nome.trim(),
      email: data.email.toLowerCase().trim(),
      tipo: data.tipo,
      telefone: data.telefone?.trim()
    };
  }
}
```

---

## 📊 COMPARAÇÃO: Antes vs Depois

| Métrica | Antes | Depois |
|---------|-------|--------|
| **Linhas por função** | 150+ | 20-40 |
| **Responsabilidades** | 5-7 | 1-2 |
| **Testabilidade** | ❌ Difícil | ✅ Fácil |
| **Reusabilidade** | ❌ Baixa | ✅ Alta |
| **Diagnóstico** | ❌ Genérico | ✅ Específico |
| **Manutenção** | ❌ Complexa | ✅ Simples |

---

## 🗂️ ESTRUTURA DE ARQUIVOS (PROPOSTA)

```
/supabase/functions/server/
├── index.tsx                    # Hono app + rotas (controllers)
├── config.toml
├── kv_store.tsx                 # Mantido como está
├── logSanitizer.ts              # Mantido como está
│
├── controllers/                 # NOVO: Controllers HTTP
│   ├── userController.ts
│   ├── obraController.ts
│   └── formularioController.ts
│
├── services/                    # NOVO: Lógica de negócio
│   ├── userService.ts
│   ├── obraService.ts
│   ├── formularioService.ts
│   └── emailService.ts          # Mover de email.tsx
│
├── repositories/                # NOVO: Acesso a dados
│   ├── userRepository.ts
│   ├── obraRepository.ts
│   └── formularioRepository.ts
│
├── validators/                  # NOVO: Validações
│   ├── userValidator.ts
│   ├── obraValidator.ts
│   └── formularioValidator.ts
│
├── middleware/                  # NOVO: Middlewares
│   ├── authMiddleware.ts
│   └── rateLimitMiddleware.ts
│
└── utils/                       # NOVO: Utilitários
    ├── errors.ts                # Custom errors
    └── types.ts                 # Tipos compartilhados
```

---

## ✅ BENEFÍCIOS DA REFATORAÇÃO

### 1. **Testes Isolados**
```typescript
// Testar validação sem infraestrutura
test('UserValidator.validate() rejects invalid email', () => {
  const result = userValidator.validate({ email: 'invalid' });
  expect(result.isValid).toBe(false);
});

// Testar repository mockando Auth
test('UserRepository.create() calls Supabase Auth', async () => {
  const mockAuth = jest.fn();
  const repo = new UserRepository(mockAuth);
  await repo.create({ email: 'test@test.com', ... });
  expect(mockAuth).toHaveBeenCalled();
});
```

### 2. **Erros Específicos**
```typescript
// ❌ ANTES:
"Erro ao criar usuário" // 🤷 Qual erro?

// ✅ DEPOIS:
"ValidationError: Email inválido"
"AuthError: Usuário já existe no Supabase Auth"
"KVStoreError: Timeout ao salvar dados"
```

### 3. **Reuso de Código**
```typescript
// Validador usado em múltiplos lugares
userValidator.validate(data); // POST /users
userValidator.validate(data); // PUT /users/:id
userValidator.validate(data); // POST /auth/signup
```

### 4. **Fácil Manutenção**
```typescript
// Mudar apenas o validador
// Não toca em controllers, services ou repositories
class UserValidator {
  validate(data: any) {
    // Nova regra: nome deve ter pelo menos 3 caracteres
    if (data.nome.length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }
  }
}
```

---

## ⚠️ QUANDO REFATORAR?

**NÃO AGORA** - Aguardar:

1. ✅ **Deploy da v1.1.0** (estabilidade)
2. ✅ **Feedback de produção** (1-2 semanas)
3. ✅ **Testes de carga** (identificar gargalos)

**REFATORAR QUANDO:**

- [ ] Precisar adicionar muitas features novas
- [ ] Dificuldade em diagnosticar bugs de produção
- [ ] Necessidade de testes automatizados
- [ ] Equipe crescer (mais desenvolvedores)

---

## 🎯 PLANO DE REFATORAÇÃO (FUTURO)

### **Fase 1: Extrair Validators** (1 semana)
- Criar `/validators/` com validações isoladas
- Substituir chamadas inline por validators
- Testes unitários para cada validator

### **Fase 2: Extrair Repositories** (1 semana)
- Criar `/repositories/` para acesso a dados
- Isolar Auth e KV Store
- Testes com mocks

### **Fase 3: Extrair Services** (1 semana)
- Criar `/services/` com lógica de negócio
- Orquestrar validators + repositories
- Testes de integração

### **Fase 4: Simplificar Controllers** (3 dias)
- Controllers chamam apenas services
- Máximo 20 linhas por endpoint
- Tratamento de erros unificado

### **Fase 5: Adicionar Testes** (1 semana)
- Cobertura de testes > 80%
- CI/CD com testes automáticos

---

## 📚 REFERÊNCIAS

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Layered Architecture Pattern](https://www.oreilly.com/library/view/software-architecture-patterns/9781491971437/ch01.html)

---

**Criado em:** 2026-01-08  
**Versão:** 1.1.0  
**Autor:** Auditoria Técnica v1.1.0
