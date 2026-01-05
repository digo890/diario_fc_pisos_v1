# ⚡ Quick Start - FC Pisos

## 🎯 Como Usar o Sistema (3 Passos)

### 1️⃣ Criar Usuário Master (Primeira Vez)

Ao acessar o sistema pela primeira vez:

1. Abra: `https://seu-dominio.vercel.app`
2. Clique em **"Primeira Configuração"** (abaixo do formulário)
3. Clique em **"Criar Usuário Master"**
4. Aguarde a confirmação ✅

**Pronto!** O sistema criou automaticamente:
- 📧 Email: `digoo890@gmail.com`
- 🔑 Senha: `Klapaucius`

---

### 2️⃣ Fazer Login

Os campos serão preenchidos automaticamente após criar o usuário master.

Apenas clique em **"Entrar"** 🚀

---

### 3️⃣ Usar o Sistema

Após o login, você terá acesso ao **Dashboard de Administrador** onde pode:

✅ **Gerenciar Usuários**
- Adicionar novos administradores
- Adicionar encarregados
- Editar/desativar usuários

✅ **Gerenciar Obras**
- Cadastrar novas obras
- Gerar links de validação
- Acompanhar status

✅ **Gerenciar Formulários**
- Visualizar formulários preenchidos
- Aprovar/reprovar
- Exportar dados

---

## 🔄 Adicionar Novos Usuários

1. No Dashboard → **"Gerenciar Usuários"**
2. Clique em **"+ Adicionar Usuário"**
3. Preencha:
   ```
   Nome: João Silva
   Email: joao@empresa.com
   Senha: senha123
   Tipo: Encarregado (ou Administrador)
   ```
4. Salve

O novo usuário poderá fazer login com as credenciais cadastradas.

---

## 🏗️ Adicionar Nova Obra

1. No Dashboard → **"Gerenciar Obras"**
2. Clique em **"+ Nova Obra"**
3. Preencha:
   ```
   Nome: Reforma Shopping ABC
   Cliente: Empresa XYZ
   Endereço: Rua Exemplo, 123
   Preposto: João Silva
   Email Preposto: joao.preposto@empresa.com
   ```
4. Salve

O sistema irá:
- ✅ Gerar um token único de validação
- ✅ Criar link para o preposto validar: `/validar/{token}`
- ✅ Você pode enviar esse link por WhatsApp ou email

---

## 📋 Fluxo de Trabalho Completo

```
1. ADMIN: Cadastra obra + dados do preposto
          ↓
2. SISTEMA: Gera link único de validação
          ↓
3. ADMIN: Envia link ao cliente (WhatsApp/Email)
          ↓
4. ENCARREGADO: Acessa obra, preenche formulário
          ↓
5. ENCARREGADO: Envia para validação do preposto
          ↓
6. PREPOSTO: Acessa link único (sem login)
          ↓
7. PREPOSTO: Valida/assina digitalmente
          ↓
8. SISTEMA: Notifica admin de aprovação
          ↓
9. ADMIN: Revisa e finaliza
```

---

## 💡 Dicas Importantes

### 🔐 Segurança
- Troque a senha do usuário master após primeiro login
- Não compartilhe credenciais de administrador
- Use senhas fortes para novos usuários

### 📱 PWA (App Mobile)
- O sistema pode ser instalado como app no celular
- Chrome: "Adicionar à tela inicial"
- Safari: "Adicionar à Tela de Início"

### 🌐 Modo Offline
- O sistema funciona offline (IndexedDB)
- Sincroniza automaticamente quando online
- Ícone de status de conexão sempre visível

### 🌓 Tema Claro/Escuro
- Botão de alternância no topo do dashboard
- Preferência salva automaticamente

---

## 🆘 Suporte

### Problema: Esqueci a senha
**Solução:** Apenas um administrador pode redefinir senhas de outros usuários.

### Problema: Link de validação não funciona
**Verifique:**
1. Token está completo na URL
2. Formulário foi enviado pelo encarregado
3. Link não expirou

### Problema: Sistema não sincroniza
**Verifique:**
1. Conexão com internet
2. Ícone de status de conexão (canto superior)
3. Tente fazer logout e login novamente

---

## 📞 Contato

Para mais informações, consulte:
- `SETUP_AUTH.md` - Documentação completa de autenticação
- `README.md` - Documentação geral do sistema

---

**Pronto para começar! 🚀**
