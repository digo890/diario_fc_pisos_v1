import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

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
// USUÁRIOS
// ============================================

// Listar todos os usuários
app.get("/make-server-1ff231a2/users", async (c) => {
  try {
    const users = await kv.getByPrefix("user:");
    return c.json({ success: true, data: users });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Criar usuário
app.post("/make-server-1ff231a2/users", async (c) => {
  try {
    const body = await c.req.json();
    const userId = crypto.randomUUID();
    const user = {
      id: userId,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await kv.set(`user:${userId}`, user);
    return c.json({ success: true, data: user });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Buscar usuário por ID
app.get("/make-server-1ff231a2/users/:id", async (c) => {
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
app.put("/make-server-1ff231a2/users/:id", async (c) => {
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
app.delete("/make-server-1ff231a2/users/:id", async (c) => {
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