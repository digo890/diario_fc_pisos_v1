# 🔐 Setup de Autenticação - FC Pisos

## ✅ Sistema de Autenticação Implementado

O sistema agora possui autenticação completa com Supabase Auth:

### 📋 O que foi implementado:

1. **Backend com Supabase Auth**
   - Rota `/auth/create-master` para criar usuário master
   - Rota `/auth/me` para obter dados do usuário logado
   - Middleware `requireAuth` protegendo rotas sensíveis
   - Integração completa com Supabase Auth

2. **Frontend com Login**
   - Tela de login com email e senha
   - **Botão "Primeira Configuração"** integrado na tela de login
   - Validação de credenciais
   - Mensagens de erro amigáveis
   - Auto-login após sessão ativa

3. **Gerenciamento de Sessão**
   - Persistência de sessão com Supabase
   - Auto-logout ao expirar token
   - Atualização automática de token nas requisições

---

## 🚀 Criar Usuário Master (MUITO FÁCIL!)

### Método Recomendado: Botão na Tela de Login ⭐

1. **Acesse o sistema:**
   ```
   https://seu-dominio.vercel.app
   ```

2. **Na tela de login, clique em:**
   ```
   "Primeira Configuração"
   ```
   (Botão localizado abaixo do formulário de login)

3. **Clique no botão laranja:**
   ```
   "Criar Usuário Master"
   ```

4. **Aguarde a confirmação** e o sistema automaticamente:
   - Cria o usuário master
   - Preenche os campos de login
   - Redireciona para a tela de login

5. **Clique em "Entrar"** e pronto! 🎉

### Credenciais Criadas:
```
📧 Email: digoo890@gmail.com
🔑 Senha: Klapaucius
👤 Tipo: Administrador
```

---

## 🔑 Fazer Login

1. Acesse o sistema: `https://seu-dominio.vercel.app`

2. Digite as credenciais:
   - **Email:** digoo890@gmail.com
   - **Senha:** Klapaucius

3. Clique em **"Entrar"**

---

## 👥 Adicionar Novos Usuários

Após fazer login como **Administrador**, você pode:

1. Acessar o **Dashboard de Administrador**
2. Ir em **"Gerenciar Usuários"**
3. Clicar em **"Adicionar Usuário"**
4. Preencher:
   - Nome
   - Email
   - Senha
   - Tipo (Administrador ou Encarregado)
5. Salvar

Os novos usuários receberão suas credenciais e poderão fazer login normalmente.

---

## 🔒 Segurança

### Tokens de Acesso

- **Frontend:** Usa `publicAnonKey` para operações públicas
- **Backend:** Valida `access_token` do Supabase Auth
- **Rotas Protegidas:** Requerem token válido

### Rotas Protegidas

Estas rotas requerem autenticação:

- `GET /users` - Listar usuários
- `POST /users` - Criar usuário
- `GET /users/:id` - Buscar usuário
- `PUT /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Deletar usuário
- `GET /auth/me` - Dados do usuário logado

### Rotas Públicas

Estas rotas NÃO requerem autenticação:

- `POST /auth/create-master` - Criar usuário master (apenas uma vez)
- `GET /health` - Health check
- `GET /formularios/token/:token` - Validação de preposto
- `POST /send-validation-email` - Envio de email

---

## 🛠️ Troubleshooting

### Erro: "Token inválido ou expirado"

**Solução:** Faça logout e login novamente.

```javascript
// No console do navegador
localStorage.clear();
location.reload();
```

### Erro: "User already registered"

**Solução:** O usuário master já foi criado. Use as credenciais:
- Email: digoo890@gmail.com
- Senha: Klapaucius

### Erro ao criar usuário

**Verifique:**
1. Se está logado como Administrador
2. Se o email não está duplicado
3. Se a senha tem pelo menos 6 caracteres

---

## 📝 Fluxo de Autenticação

```
┌─────────────┐
│   Login     │
│ (Email/Pwd) │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Supabase Auth   │
│ Valida Credenc. │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Gera Token JWT  │
│ (access_token)  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Frontend Recebe │
│ Token + Session │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Busca Dados do  │
│ Usuário (KV)    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Redireciona p/  │
│ Dashboard       │
└─────────────────┘
```

---

## 🎉 Pronto!

O sistema está configurado e pronto para uso com autenticação completa!

**Próximos passos:**
1. Criar usuário master (via `create-master.html`)
2. Fazer login no sistema
3. Adicionar outros administradores e encarregados
4. Começar a usar o sistema!