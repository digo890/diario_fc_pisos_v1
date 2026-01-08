# 🗑️ Script para Remover Usuários de Exemplo

## ⚠️ ATENÇÃO
Este script remove os usuários de exemplo "Administrador" e "João Silva" do banco de dados.

## 📋 Usuários a serem removidos:
1. **Administrador** (admin@fcpisos.com.br)
2. **João Silva** (joao@fcpisos.com.br)

## 🔧 Como remover do banco de dados Supabase:

### Opção 1: Via SQL Editor no Supabase Dashboard

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Execute o seguinte comando:

```sql
-- Remover usuários de exemplo do banco de dados
DELETE FROM users WHERE email IN ('admin@fcpisos.com.br', 'joao@fcpisos.com.br');
```

### Opção 2: Via Supabase Auth Dashboard

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Vá em **Authentication** > **Users**
3. Procure pelos usuários:
   - admin@fcpisos.com.br
   - joao@fcpisos.com.br
4. Clique nos 3 pontinhos (...) e selecione **Delete User**

## ✅ Verificação

Após executar, verifique se os usuários foram removidos:

```sql
SELECT * FROM users WHERE email IN ('admin@fcpisos.com.br', 'joao@fcpisos.com.br');
```

Resultado esperado: **0 registros**

## 📝 Notas Importantes

- ✅ Os usuários de exemplo não serão mais criados automaticamente
- ✅ O código foi atualizado para não criar seeds
- ✅ Usuários devem ser criados via interface de administração
- ⚠️ Se houver obras/formulários vinculados a esses usuários, eles serão desvinculados (SET NULL)

## 🔄 Limpeza do IndexedDB (Frontend)

Se você também quiser limpar os dados locais do navegador:

1. Abra o DevTools (F12)
2. Vá em **Application** > **Storage** > **IndexedDB**
3. Encontre o banco **DiarioObrasDB**
4. Delete os usuários com IDs:
   - `admin-1`
   - `enc-1`

Ou simplesmente execute no console do navegador:

```javascript
// Limpar todos os dados locais
indexedDB.deleteDatabase('DiarioObrasDB');
location.reload();
```

---

**✅ Após essas ações, o sistema estará limpo e pronto para uso em produção!**
