# 📱 Diário de Obras – FC Pisos

Sistema PWA mobile-first para gestão e acompanhamento de obras em canteiro.

## 🎯 Sobre o Sistema

O Diário de Obras é uma aplicação Progressive Web App (PWA) desenvolvida para a FC Pisos, permitindo o registro, validação e acompanhamento completo de serviços executados em obras. O sistema opera em modo offline-first, sincronizando automaticamente quando há conexão disponível.

### Características Principais

- ✅ **PWA Offline-First**: Funciona sem internet, sincroniza automaticamente
- 🎨 **Material You Design**: Interface moderna com tema claro/escuro
- 📧 **Notificações por Email**: Integração com Resend para envio automático
- 📊 **Dashboard Completo**: Visualização de resultados e métricas
- 📄 **Exportação PDF/Excel**: Gera relatórios completos
- 🔐 **Autenticação Supabase**: Sistema seguro de login e permissões
- 📱 **Mobile-First**: Otimizado para uso em canteiro de obras

## 👥 Perfis de Usuário

### 1. Administrador
- Visualiza resultados e métricas
- Gerencia obras e usuários
- Aprova formulários validados
- Recebe notificações de formulários aprovados

### 2. Encarregado
- Preenche formulários de obra
- Envia para validação do preposto
- Gerencia múltiplas obras
- Auto-save automático a cada 3 segundos

### 3. Preposto (Sem Login)
- Acessa via link único por obra
- Valida formulário preenchido
- Aprova ou reprova com assinatura digital
- Não precisa criar conta no sistema

## 🔄 Fluxo de Status

```
novo → em_preenchimento → enviado_preposto → aprovado_preposto → enviado_admin → concluido
                                           → reprovado_preposto ↩
```

## 🚀 Deploy e Configuração

### Pré-requisitos

- Node.js 18+
- Conta Supabase (gratuita)
- Conta Resend para emails (gratuita até 3000 emails/mês)

### 1. Configurar Supabase

```bash
# 1. Criar projeto no Supabase
# 2. Copiar as credenciais:
#    - SUPABASE_URL
#    - SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
```

### 2. Deploy da Edge Function

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref <SEU_PROJECT_ID>

# Deploy da função
supabase functions deploy server --no-verify-jwt
```

### 3. Configurar Secrets no Supabase

No dashboard do Supabase, em Edge Functions → Secrets, adicionar:

```bash
RESEND_API_KEY=re_...
```

### 4. Deploy do Frontend

#### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel
```

#### Variáveis de Ambiente no Vercel

Não são necessárias! As credenciais do Supabase estão em `/utils/supabase/info.tsx` (arquivo público gerado pelo Figma Make).

### 5. Criar Primeiro Usuário Admin

```bash
# Usar a rota especial para criar o primeiro admin
POST https://<SEU_PROJECT_ID>.supabase.co/functions/v1/make-server-1ff231a2/auth/create-master

# Body JSON:
{
  "email": "admin@fcpisos.com.br",
  "password": "suaSenhaSegura",
  "nome": "Administrador"
}
```

## 🗄️ Estrutura de Dados

O sistema usa IndexedDB localmente para cache offline e Supabase KV Store no backend.

### Stores do IndexedDB

- **users**: Cadastro de usuários
- **obras**: Informações das obras
- **forms**: Formulários preenchidos
- **config**: Configurações locais

### Backend (Supabase KV)

Chaves com prefixos:
- `user:<id>` - Dados de usuários
- `obra:<id>` - Dados de obras
- `form:<obraId>` - Formulários

## 📧 Sistema de Emails

O sistema envia 3 tipos de emails automaticamente:

### 1. Nova Obra Criada
**Para**: Encarregado designado
**Quando**: Admin cria nova obra
**Conteúdo**: Dados da obra e link para preencher formulário

### 2. Formulário para Conferência
**Para**: Preposto (cliente)
**Quando**: Encarregado envia formulário
**Conteúdo**: Link único para validação

### 3. Formulário Validado
**Para**: Todos os administradores
**Quando**: Preposto aprova formulário
**Conteúdo**: Confirmação e dados da validação

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar dev server
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 📦 Tecnologias Utilizadas

- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Estilização
- **Vite** - Build tool
- **Supabase** - Backend (Auth + Storage + Edge Functions)
- **IndexedDB** - Cache offline
- **Motion** - Animações
- **Recharts** - Gráficos
- **jsPDF + xlsx** - Exportação de relatórios
- **Resend** - Envio de emails

## 🎨 Design System

- **Cor Principal**: #FD5521 (Laranja FC Pisos)
- **Tema**: Material You adaptado
- **Tipografia**: System fonts otimizadas
- **Ícones**: Lucide React
- **Componentes**: Custom + shadcn/ui (selecionados)

## 🔐 Segurança

- ✅ Autenticação JWT via Supabase Auth
- ✅ Tokens únicos não-adivinháveis para validação de preposto
- ✅ Service Role Key apenas no backend (Edge Functions)
- ✅ CORS configurado adequadamente
- ✅ Sem exposição de credenciais no frontend

## 📱 PWA Features

- ✅ Installable (prompt de instalação)
- ✅ Funciona offline
- ✅ Auto-sync quando volta online
- ✅ Service Worker para cache
- ✅ Manifesto configurado

## 📞 Suporte

Para questões sobre o sistema, entre em contato com a equipe de desenvolvimento.

## 📄 Licença

© 2025 FC Pisos. Todos os direitos reservados.
