/**
 * Edge Function Pública - Conferência do Preposto
 * 
 * Esta Edge Function é 100% pública e não requer autenticação.
 * Permite que o preposto acesse e assine formulários via link direto.
 * 
 * Rotas disponíveis:
 * - GET  /conferencia/:formularioId         → Buscar formulário para conferência
 * - POST /conferencia/:formularioId/assinar → Assinar formulário (aprovar/reprovar)
 * 
 * @version 1.0.0
 * @security verify_jwt = false (configurado em config.toml)
 */

import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "../server/kv_store.tsx";
import * as validation from "../server/validation.tsx";

// Criar aplicação Hono
const app = new Hono();

// ============================================
// CONFIGURAÇÃO DE CORS
// ============================================

const getAllowedOrigins = () => {
  const allowedOrigins = [
    "https://diario-fc-pisos-v1.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ];

  // Adicionar qualquer domínio .figma.com para desenvolvimento
  return allowedOrigins;
};

// ============================================
// MIDDLEWARES
// ============================================

// Logger para debug
app.use("*", logger(console.log));

// CORS para permitir requisições do frontend
app.use(
  "/*",
  cors({
    origin: (origin) => {
      const allowedOrigins = getAllowedOrigins();

      // Permitir requisições sem origin (mobile apps, Postman, etc)
      if (!origin) {
        return "*";
      }

      // Se a origem está na lista de permitidos, retorná-la
      if (allowedOrigins.includes(origin)) {
        return origin;
      }

      // Permitir qualquer subdomínio .figma.com
      if (origin.endsWith(".figma.com")) {
        return origin;
      }

      // Caso contrário, bloquear
      console.warn("⚠️ Origem bloqueada por CORS:", origin);
      return allowedOrigins[0]; // Retornar primeira origem válida
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-User-Token"],
    credentials: true,
  }),
);

// ============================================
// ROTAS DE SAÚDE
// ============================================

app.get("/health", (c) => {
  return c.json({ 
    status: "ok",
    service: "public-conferencia",
    version: "1.0.0",
    public: true,
  });
});

// ============================================
// ROTAS DE CONFERÊNCIA (100% PÚBLICAS)
// ============================================

// 📋 Buscar formulário para conferência (PÚBLICO)
app.get("/conferencia/:formularioId", async (c) => {
  // 🔍 DEBUG: Logar requisição
  console.log("=" .repeat(60));
  console.log("🔍 [CONFERÊNCIA PÚBLICA] Nova requisição");
  console.log("=" .repeat(60));
  console.log("📋 Headers:", {
    origin: c.req.header("Origin") || "NENHUM",
    userAgent: c.req.header("User-Agent") || "NENHUM",
  });
  console.log("=" .repeat(60));

  try {
    const formularioId = c.req.param("formularioId");

    console.log("🔍 Buscando formulário:", formularioId);

    // 1️⃣ SEGURANÇA: Validar UUID para prevenir ataques
    if (!validation.isValidUUID(formularioId)) {
      console.warn("⚠️ ID inválido:", formularioId);
      return c.json(
        { success: false, error: "Link inválido" },
        400,
      );
    }

    // 2️⃣ Buscar formulário
    const chave = `formulario:${formularioId}`;
    console.log("🔍 Buscando chave no KV:", chave);
    const formulario = await kv.get(chave);

    console.log("🔍 Resultado:", formulario ? "ENCONTRADO" : "NÃO ENCONTRADO");

    if (!formulario) {
      console.warn("⚠️ Formulário não encontrado:", formularioId);

      // 🔍 DEBUG: Listar formulários no banco
      try {
        const todosFormularios = await kv.getByPrefix("formulario:");
        console.log("🔍 Total de formulários no banco:", todosFormularios?.length || 0);
        if (todosFormularios && todosFormularios.length > 0) {
          console.log(
            "🔍 IDs existentes:",
            todosFormularios.map((f: any) => f.id).slice(0, 5),
          );
        }
      } catch (debugError) {
        console.error("❌ Erro ao buscar formulários para debug:", debugError);
      }

      return c.json(
        { success: false, error: "Formulário não encontrado" },
        404,
      );
    }

    // 3️⃣ Buscar dados da obra
    const obra = await kv.get(`obra:${formulario.obra_id}`);

    if (!obra) {
      console.warn("⚠️ Obra não encontrada:", formulario.obra_id);
      return c.json(
        { success: false, error: "Obra não encontrada" },
        404,
      );
    }

    console.log("✅ Formulário e obra encontrados");

    return c.json({
      success: true,
      data: {
        formulario,
        obra,
      },
    });
  } catch (error: any) {
    console.error("❌ Erro ao buscar formulário:", error);
    return c.json(
      { success: false, error: "Erro ao buscar formulário" },
      500,
    );
  }
});

// ✍️ Assinar formulário (PÚBLICO)
app.post("/conferencia/:formularioId/assinar", async (c) => {
  try {
    const formularioId = c.req.param("formularioId");
    const body = await c.req.json();

    console.log("✍️ [CONFERÊNCIA PÚBLICA] Assinando formulário:", formularioId);
    console.log("📝 Dados recebidos:", {
      aprovado: body.aprovado,
      temAssinatura: !!body.assinatura,
      temMotivo: !!body.motivo,
    });

    // 1️⃣ SEGURANÇA: Validar UUID
    if (!validation.isValidUUID(formularioId)) {
      console.warn("⚠️ ID inválido:", formularioId);
      return c.json(
        { success: false, error: "Link inválido" },
        400,
      );
    }

    // 2️⃣ Buscar formulário
    const formulario = await kv.get(`formulario:${formularioId}`);

    if (!formulario) {
      console.warn("⚠️ Formulário não encontrado:", formularioId);
      return c.json(
        { success: false, error: "Formulário não encontrado" },
        404,
      );
    }

    // 3️⃣ TRAVA DE STATUS: Verificar se já foi assinado
    if (formulario.prepostoConfirmado === true) {
      console.warn("⚠️ Formulário já foi assinado anteriormente");
      return c.json(
        {
          success: false,
          error: "Este formulário já foi assinado anteriormente",
        },
        400,
      );
    }

    // 4️⃣ Buscar obra
    const obra = await kv.get(`obra:${formulario.obra_id}`);

    if (!obra) {
      console.warn("⚠️ Obra não encontrada:", formulario.obra_id);
      return c.json(
        { success: false, error: "Obra não encontrada" },
        404,
      );
    }

    // 5️⃣ Validar dados recebidos
    if (body.aprovado === undefined) {
      return c.json(
        { success: false, error: "Campo 'aprovado' é obrigatório" },
        400,
      );
    }

    if (!body.assinatura) {
      return c.json(
        { success: false, error: "Assinatura é obrigatória" },
        400,
      );
    }

    if (!body.aprovado && !body.motivo) {
      return c.json(
        { success: false, error: "Motivo da reprovação é obrigatório" },
        400,
      );
    }

    // 6️⃣ Atualizar formulário
    const now = new Date().toISOString();
    const clientIp = c.req.header("x-forwarded-for") || 
                     c.req.header("x-real-ip") || 
                     "unknown";

    const updatedFormulario = {
      ...formulario,
      prepostoConfirmado: true,
      assinaturaPreposto: body.assinatura,
      prepostoMotivoReprovacao: body.aprovado ? null : body.motivo,
      prepostoReviewedAt: now,
      prepostoReviewedBy: obra.preposto_nome,
      prepostoReviewedIp: clientIp, // 🔒 Auditoria
      status: body.aprovado ? "enviado_admin" : "reprovado_preposto",
      updated_at: now,
    };

    await kv.set(`formulario:${formularioId}`, updatedFormulario);
    console.log("✅ Formulário atualizado");

    // 7️⃣ Atualizar status da obra
    const updatedObra = {
      ...obra,
      status: body.aprovado ? "enviado_admin" : "reprovado_preposto",
      updated_at: now,
    };

    await kv.set(`obra:${obra.id}`, updatedObra);
    console.log("✅ Obra atualizada");

    console.log("✅ Assinatura registrada com sucesso");

    return c.json({
      success: true,
      data: {
        formulario: updatedFormulario,
        obra: updatedObra,
      },
    });
  } catch (error: any) {
    console.error("❌ Erro ao assinar formulário:", error);
    return c.json(
      { success: false, error: "Erro ao processar assinatura" },
      500,
    );
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================

console.log("🚀 Edge Function pública iniciada: public-conferencia");
console.log("📋 Rotas disponíveis:");
console.log("   GET  /conferencia/:formularioId");
console.log("   POST /conferencia/:formularioId/assinar");

Deno.serve(app.fetch);
