import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Supabase client with service role (for admin operations)
const getSupabaseAdmin = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Supabase client with anon key (for auth operations)
const getSupabaseClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
);

// Middleware to verify auth token
const requireAuth = async (c: any, next: any) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  
  if (!accessToken) {
    return c.json({ success: false, error: 'Token de autenticação não fornecido' }, 401);
  }

  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    console.error('Erro de autenticação:', error?.message);
    return c.json({ success: false, error: 'Token inválido ou expirado' }, 401);
  }

  // Attach user to context
  c.set('userId', user.id);
  c.set('userEmail', user.email);
  
  await next();
};

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-1ff231a2/health", (c) => {
  return c.json({ status: "ok" });
});

// ============================================
// AUTENTICAÇÃO
// ============================================

// Criar usuário master (apenas para inicialização)
app.post("/make-server-1ff231a2/auth/create-master", async (c) => {
  try {
    console.log('🔧 Rota /auth/create-master chamada');
    console.log('📦 Headers:', Object.fromEntries(c.req.raw.headers.entries()));
    
    const { email, password, nome } = await c.req.json();
    console.log('📤 Dados recebidos:', { email, nome });
    
    const supabase = getSupabaseAdmin();
    
    // Verificar se usuário já existe
    console.log('🔍 Verificando se usuário já existe...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === email);
    
    if (userExists) {
      console.log('⚠️ Usuário já existe, retornando sucesso');
      // Buscar dados do usuário existente
      const existingUser = existingUsers.users.find(u => u.email === email);
      let userData = await kv.get(`user:${existingUser.id}`);
      
      // Se não existe no KV, criar agora
      if (!userData) {
        console.log('💾 Criando entrada no KV para usuário existente...');
        userData = {
          id: existingUser.id,
          nome: existingUser.user_metadata?.nome || nome,
          email: existingUser.email,
          tipo: existingUser.user_metadata?.tipo || 'Administrador',
          ativo: true,
          created_at: existingUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await kv.set(`user:${existingUser.id}`, userData);
        console.log('✅ Entrada criada no KV');
      }
      
      return c.json({ 
        success: true, 
        message: 'Usuário já existe',
        data: userData
      });
    }
    
    // Criar usuário no Supabase Auth
    console.log('➕ Criando novo usuário no Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email (não temos servidor de email configurado)
      user_metadata: { 
        nome,
        tipo: 'Administrador'
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário no Supabase Auth:', authError);
      return c.json({ success: false, error: authError.message }, 500);
    }

    console.log('✅ Usuário criado no Auth:', authData.user.id);

    // Salvar dados do usuário no KV store
    const user = {
      id: authData.user.id,
      nome,
      email,
      tipo: 'Administrador',
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('💾 Salvando usuário no KV store...');
    await kv.set(`user:${authData.user.id}`, user);
    console.log('✅ Usuário salvo no KV store');

    return c.json({ 
      success: true, 
      message: 'Usuário master criado com sucesso',
      data: user 
    });
  } catch (error) {
    console.error('❌ Erro ao criar usuário master:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Obter dados do usuário logado
app.get("/make-server-1ff231a2/auth/me", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const userEmail = c.get('userEmail');
    
    console.log('🔍 Buscando dados do usuário:', userId);
    
    let user = await kv.get(`user:${userId}`);
    
    // Se o usuário não existe no KV store, criar entrada baseada nos dados do Auth
    if (!user) {
      console.log('⚠️ Usuário não encontrado no KV store, criando entrada...');
      
      const supabase = getSupabaseAdmin();
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      
      if (authUser?.user) {
        user = {
          id: authUser.user.id,
          nome: authUser.user.user_metadata?.nome || 'Usuário',
          email: authUser.user.email || userEmail,
          tipo: authUser.user.user_metadata?.tipo || 'Administrador',
          ativo: true,
          created_at: authUser.user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        await kv.set(`user:${userId}`, user);
        console.log('✅ Usuário criado no KV store:', user);
      } else {
        return c.json({ success: false, error: 'Usuário não encontrado no Auth' }, 404);
      }
    }

    return c.json({ success: true, data: user });
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// USUÁRIOS (protegidas com auth)
// ============================================

// Listar todos os usuários
app.get("/make-server-1ff231a2/users", requireAuth, async (c) => {
  try {
    const users = await kv.getByPrefix("user:");
    return c.json({ success: true, data: users });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Criar usuário
app.post("/make-server-1ff231a2/users", requireAuth, async (c) => {
  try {
    const body = await c.req.json();
    const { nome, email, senha, tipo } = body;
    
    const supabase = getSupabaseAdmin();
    
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { 
        nome,
        tipo
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário no Supabase Auth:', authError);
      return c.json({ success: false, error: authError.message }, 500);
    }

    // Salvar no KV store
    const user = {
      id: authData.user.id,
      nome,
      email,
      tipo,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    await kv.set(`user:${authData.user.id}`, user);
    
    return c.json({ success: true, data: user });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Buscar usuário por ID
app.get("/make-server-1ff231a2/users/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param("id");
    const user = await kv.get(`user:${id}`);
    if (!user) {
      return c.json({ success: false, error: "Usuário não encontrado" }, 404);
    }
    return c.json({ success: true, data: user });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Atualizar usuário
app.put("/make-server-1ff231a2/users/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const user = await kv.get(`user:${id}`);
    if (!user) {
      return c.json({ success: false, error: "Usuário não encontrado" }, 404);
    }
    const updatedUser = {
      ...user,
      ...body,
      updated_at: new Date().toISOString(),
    };
    await kv.set(`user:${id}`, updatedUser);
    return c.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Deletar usuário
app.delete("/make-server-1ff231a2/users/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`user:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// OBRAS
// ============================================

// Listar todas as obras
app.get("/make-server-1ff231a2/obras", async (c) => {
  try {
    const obras = await kv.getByPrefix("obra:");
    return c.json({ success: true, data: obras });
  } catch (error) {
    console.error("Erro ao listar obras:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Criar obra
app.post("/make-server-1ff231a2/obras", async (c) => {
  try {
    const body = await c.req.json();
    const obraId = crypto.randomUUID();
    const obra = {
      id: obraId,
      ...body,
      token_validacao: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await kv.set(`obra:${obraId}`, obra);
    return c.json({ success: true, data: obra });
  } catch (error) {
    console.error("Erro ao criar obra:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Buscar obra por ID
app.get("/make-server-1ff231a2/obras/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const obra = await kv.get(`obra:${id}`);
    if (!obra) {
      return c.json({ success: false, error: "Obra não encontrada" }, 404);
    }
    return c.json({ success: true, data: obra });
  } catch (error) {
    console.error("Erro ao buscar obra:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Atualizar obra
app.put("/make-server-1ff231a2/obras/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const obra = await kv.get(`obra:${id}`);
    if (!obra) {
      return c.json({ success: false, error: "Obra não encontrada" }, 404);
    }
    const updatedObra = {
      ...obra,
      ...body,
      updated_at: new Date().toISOString(),
    };
    await kv.set(`obra:${id}`, updatedObra);
    return c.json({ success: true, data: updatedObra });
  } catch (error) {
    console.error("Erro ao atualizar obra:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Deletar obra
app.delete("/make-server-1ff231a2/obras/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`obra:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar obra:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// FORMULÁRIOS
// ============================================

// Listar todos os formulários
app.get("/make-server-1ff231a2/formularios", async (c) => {
  try {
    const formularios = await kv.getByPrefix("formulario:");
    return c.json({ success: true, data: formularios });
  } catch (error) {
    console.error("Erro ao listar formulários:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Criar formulário
app.post("/make-server-1ff231a2/formularios", async (c) => {
  try {
    const body = await c.req.json();
    const formularioId = crypto.randomUUID();
    const formulario = {
      id: formularioId,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await kv.set(`formulario:${formularioId}`, formulario);
    return c.json({ success: true, data: formulario });
  } catch (error) {
    console.error("Erro ao criar formulário:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Buscar formulário por ID
app.get("/make-server-1ff231a2/formularios/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const formulario = await kv.get(`formulario:${id}`);
    if (!formulario) {
      return c.json({ success: false, error: "Formulário não encontrado" }, 404);
    }
    return c.json({ success: true, data: formulario });
  } catch (error) {
    console.error("Erro ao buscar formulário:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Buscar formulário por token de validação
app.get("/make-server-1ff231a2/formularios/token/:token", async (c) => {
  try {
    const token = c.req.param("token");
    const formularios = await kv.getByPrefix("formulario:");
    const formulario = formularios.find((f: any) => f.token_validacao === token);
    if (!formulario) {
      return c.json({ success: false, error: "Formulário não encontrado" }, 404);
    }
    return c.json({ success: true, data: formulario });
  } catch (error) {
    console.error("Erro ao buscar formulário por token:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Atualizar formulário
app.put("/make-server-1ff231a2/formularios/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const formulario = await kv.get(`formulario:${id}`);
    if (!formulario) {
      return c.json({ success: false, error: "Formulário não encontrado" }, 404);
    }
    const updatedFormulario = {
      ...formulario,
      ...body,
      updated_at: new Date().toISOString(),
    };
    await kv.set(`formulario:${id}`, updatedFormulario);
    return c.json({ success: true, data: updatedFormulario });
  } catch (error) {
    console.error("Erro ao atualizar formulário:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Deletar formulário
app.delete("/make-server-1ff231a2/formularios/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`formulario:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar formulário:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// ENVIO DE EMAIL (Mock - para testar)
// ============================================

app.post("/make-server-1ff231a2/send-validation-email", async (c) => {
  try {
    const body = await c.req.json();
    const { email, token, cliente, obra } = body;
    
    // Por enquanto, apenas log (você pode integrar Resend depois)
    console.log("📧 Email de validação:", {
      para: email,
      token,
      cliente,
      obra,
      link: `${c.req.header('origin')}/validacao/${token}`
    });
    
    return c.json({ 
      success: true, 
      message: "Email enviado com sucesso (mock)",
      link: `/validacao/${token}`
    });
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

Deno.serve(app.fetch);