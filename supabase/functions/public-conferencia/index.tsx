/**
 * Edge Function PÚBLICA - Conferência do Preposto
 * 
 * Esta Edge Function é 100% pública e não requer autenticação.
 * Permite que o preposto acesse e assine formulários via link direto.
 * 
 * Rotas disponíveis:
 * - GET  /conferencia/:formularioId         → Buscar formulário para conferência
 * - POST /conferencia/:formularioId/assinar → Assinar formulário (aprovar/reprovar)
 * - GET  /health                           → Health check
 *
 * @version 1.1.0
 * @security verify_jwt = false (configurado em config.toml)
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

// ============================================
// CORS — restrito a domínios conhecidos
// ============================================
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "https://yhuryekwwmonyjjezipw.supabase.co",
  "https://diario-fc-pisos-v1.vercel.app",
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  const custom = Deno.env.get("CUSTOM_DOMAIN");
  if (custom && origin === custom) return true;
  // Permitir previews da Vercel
  return origin.endsWith(".vercel.app");
}

function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin as string;
  }
  return headers;
}

// ============================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Validar UUID v4
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * 🔒 Verificar se o link público do preposto ainda é válido.
 *
 * Retorna um motivo de bloqueio (string) ou null se o link estiver válido.
 * - Link revogado pelo admin/encarregado → bloqueado.
 * - Link expirado (passou de linkPrepostoExpiraEm) → bloqueado.
 * - Formulários antigos sem linkPrepostoExpiraEm continuam válidos
 *   (retrocompatibilidade — links já enviados não são quebrados).
 */
function getMotivoBloqueioLink(formulario: any): string | null {
  if (formulario?.linkPrepostoRevogado === true) {
    return "Este link de conferência foi revogado. Solicite um novo ao responsável pela obra.";
  }
  const expiraEm = formulario?.linkPrepostoExpiraEm;
  if (typeof expiraEm === "number" && Date.now() > expiraEm) {
    return "Este link de conferência expirou. Solicite um novo ao responsável pela obra.";
  }
  return null;
}

/**
 * Buscar valor no KV Store
 */
async function kvGet(key: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("kv_store_1ff231a2")
      .select("value")
      .eq("key", key)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Não encontrado
      }
      throw error;
    }

    return data?.value || null;
  } catch (error) {
    console.error(`❌ Erro ao buscar KV (${key}):`, error);
    return null;
  }
}

/**
 * Salvar valor no KV Store
 */
async function kvSet(key: string, value: any): Promise<void> {
  try {
    const { error } = await supabase
      .from("kv_store_1ff231a2")
      .upsert({ key, value }, { onConflict: "key" });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(`❌ Erro ao salvar KV (${key}):`, error);
    throw error;
  }
}

// ============================================
// SERVIDOR HTTP NATIVO
// ============================================

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  let path = url.pathname;

  // REMOVER o prefixo /public-conferencia se existir
  path = path.replace(/^\/public-conferencia/, "") || "/";

  console.log(`📥 ${req.method} ${path}`);

  // CORS headers (restrito a domínios conhecidos)
  const corsHeaders = buildCorsHeaders(req);

  // Handle OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // ============================================
  // ROTAS
  // ============================================

  // Health check
  if (path === "/health" && req.method === "GET") {
    return new Response(
      JSON.stringify({
        status: "ok",
        service: "public-conferencia",
        version: "1.1.0",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Rota raiz
  if (path === "/" && req.method === "GET") {
    return new Response(
      JSON.stringify({
        message: "Edge Function pública - Conferência do Preposto",
        version: "1.0.0",
        routes: [
          "GET /health",
          "GET /conferencia/:formularioId",
          "POST /conferencia/:formularioId/assinar",
        ],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 📋 GET /conferencia/:formularioId - Buscar formulário para conferência
  if (path.startsWith("/conferencia/") && req.method === "GET" && !path.includes("/assinar")) {
    try {
      const formularioId = path.split("/conferencia/")[1]?.split("/")[0];

      console.log("=".repeat(60));
      console.log("🔍 [CONFERÊNCIA PÚBLICA] Buscando formulário:", formularioId);
      console.log("=".repeat(60));

      // 1️⃣ Validar UUID
      if (!isValidUUID(formularioId)) {
        console.warn("⚠️ ID inválido:", formularioId);
        return new Response(
          JSON.stringify({ success: false, error: "Link inválido" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // 2️⃣ Buscar formulário no KV Store
      const chave = `formulario:${formularioId}`;
      console.log("🔍 Buscando chave:", chave);
      
      const formulario = await kvGet(chave);

      // 🔍 DEBUG: Se não encontrou, listar formulários existentes
      if (!formulario) {
        console.warn("⚠️ Formulário não encontrado:", formularioId);
        console.warn("🔍 [DEBUG] Tentando listar formulários existentes...");
        
        try {
          // Buscar todos os formulários para debug
          const { data: allFormularios, error: listError } = await supabase
            .from("kv_store_1ff231a2")
            .select("key")
            .like("key", "formulario:%")
            .limit(10);
          
          if (listError) {
            console.error("❌ Erro ao listar formulários:", listError);
          } else {
            console.log("📋 Formulários encontrados no banco:", allFormularios?.length || 0);
            if (allFormularios && allFormularios.length > 0) {
              console.log("🔑 Primeiras chaves:", allFormularios.map(f => f.key).slice(0, 5));
            } else {
              console.log("⚠️ NENHUM formulário encontrado no banco!");
            }
          }
        } catch (debugError) {
          console.error("❌ Erro no debug:", debugError);
        }
        
        return new Response(
          JSON.stringify({
            success: false,
            error: "Formulário não encontrado",
            debug: {
              formularioId,
              chave,
              message: "Verifique os logs do Supabase para mais detalhes"
            }
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("✅ Formulário encontrado:", formulario.id);

      // 2.5️⃣ 🔒 Verificar validade do link (revogado/expirado)
      const motivoBloqueioGet = getMotivoBloqueioLink(formulario);
      if (motivoBloqueioGet) {
        console.warn("🔒 Link bloqueado:", motivoBloqueioGet);
        return new Response(
          JSON.stringify({ success: false, error: motivoBloqueioGet }),
          {
            status: 410, // Gone
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // 3️⃣ Buscar dados da obra
      const obra = await kvGet(`obra:${formulario.obra_id}`);

      if (!obra) {
        console.warn("⚠️ Obra não encontrada:", formulario.obra_id);
        console.warn("🔍 [DEBUG] Tentando listar obras existentes...");
        
        try {
          // Buscar todas as obras para debug
          const { data: allObras, error: listError } = await supabase
            .from("kv_store_1ff231a2")
            .select("key, value")
            .like("key", "obra:%")
            .limit(10);
          
          if (listError) {
            console.error("❌ Erro ao listar obras:", listError);
          } else {
            console.log("📋 Obras encontradas no banco:", allObras?.length || 0);
            if (allObras && allObras.length > 0) {
              console.log("🔑 Primeiras chaves de obras:", allObras.map(o => o.key).slice(0, 5));
              console.log("📊 Primeira obra (exemplo):", JSON.stringify(allObras[0]?.value, null, 2));
            } else {
              console.log("⚠️ NENHUMA obra encontrada no banco!");
            }
          }
          
          // Mostrar o obra_id que estamos buscando
          console.log("🔍 Buscando obra_id:", formulario.obra_id);
          console.log("🔍 Chave tentada:", `obra:${formulario.obra_id}`);
          
        } catch (debugError) {
          console.error("❌ Erro no debug de obras:", debugError);
        }
        
        return new Response(
          JSON.stringify({
            success: false,
            error: "Obra não encontrada",
            debug: {
              formularioId: formulario.id,
              obraId: formulario.obra_id,
              chaveObra: `obra:${formulario.obra_id}`,
              message: "Verifique os logs do Supabase para mais detalhes"
            }
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("✅ Obra encontrada:", obra.nome);
      console.log("=".repeat(60));

      // 4️⃣ Retornar dados
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            formulario,
            obra,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error: any) {
      console.error("❌ Erro ao buscar formulário:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Erro ao buscar formulário",
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // ✍️ POST /conferencia/:formularioId/assinar - Assinar formulário
  if (path.includes("/conferencia/") && path.includes("/assinar") && req.method === "POST") {
    try {
      const formularioId = path.split("/conferencia/")[1]?.split("/assinar")[0];
      const body = await req.json();

      console.log("=".repeat(60));
      console.log("✍️ [CONFERÊNCIA PÚBLICA] Assinando formulário:", formularioId);
      console.log("📝 Dados recebidos:", {
        aprovado: body.aprovado,
        temAssinatura: !!body.assinatura,
        temMotivo: !!body.motivo,
      });
      console.log("=".repeat(60));

      // 1️⃣ Validar UUID
      if (!isValidUUID(formularioId)) {
        console.warn("⚠️ ID inválido:", formularioId);
        return new Response(
          JSON.stringify({ success: false, error: "Link inválido" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // 🛡️ VALIDAÇÕES DE SEGURANÇA (ANTES de buscar do banco)
      
      // Validação 1: Nome completo (3-100 caracteres)
      const nomeCompleto = body.nomeCompleto?.trim() || "";
      if (nomeCompleto.length < 3 || nomeCompleto.length > 100) {
        console.warn("⚠️ Nome inválido - comprimento:", nomeCompleto.length);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Nome completo deve ter entre 3 e 100 caracteres",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Validação 2: Tamanho da assinatura (<150KB)
      if (body.assinatura && body.assinatura.length >= 150000) {
        console.warn("⚠️ Assinatura muito grande:", body.assinatura.length, "caracteres");
        return new Response(
          JSON.stringify({
            success: false,
            error: "Assinatura muito grande",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Validação 3: Motivo da reprovação (≥10 caracteres quando reprovado)
      if (body.aprovado === false) {
        const motivo = body.motivo?.trim() || "";
        if (motivo.length < 10) {
          console.warn("⚠️ Motivo muito curto:", motivo.length, "caracteres");
          return new Response(
            JSON.stringify({
              success: false,
              error: "Motivo da reprovação deve ter pelo menos 10 caracteres",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // 2️⃣ Buscar formulário
      const chave = `formulario:${formularioId}`;
      const formulario = await kvGet(chave);

      if (!formulario) {
        console.warn("⚠️ Formulário não encontrado:", formularioId);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Formulário não encontrado",
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // 3️⃣ Verificar se já foi assinado
      if (formulario.prepostoConfirmado === true) {
        console.warn("⚠️ Formulário já foi assinado anteriormente");
        return new Response(
          JSON.stringify({
            success: false,
            error: "Este formulário já foi assinado anteriormente",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // 3.5️⃣ 🔒 Verificar validade do link (revogado/expirado)
      const motivoBloqueioAssinar = getMotivoBloqueioLink(formulario);
      if (motivoBloqueioAssinar) {
        console.warn("🔒 Assinatura bloqueada:", motivoBloqueioAssinar);
        return new Response(
          JSON.stringify({ success: false, error: motivoBloqueioAssinar }),
          {
            status: 410, // Gone
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // 🚨 RATE LIMITING - Proteção contra spam
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                       req.headers.get("x-real-ip") || 
                       "unknown";
      const rateLimitKey = `ratelimit:assinar:${clientIp}:${formularioId}`;
      
      try {
        const tentativas = (await kvGet(rateLimitKey)) || 0;
        
        console.log(`🔒 [RATE LIMIT] IP: ${clientIp} | Tentativas: ${tentativas}/5`);
        
        if (tentativas >= 5) {
          console.warn(`⚠️ [RATE LIMIT] IP ${clientIp} bloqueado - ${tentativas} tentativas`);
          return new Response(
            JSON.stringify({
              success: false,
              error: "Muitas tentativas. Aguarde ou entre em contato.",
            }),
            {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        // Incrementar contador de tentativas
        await kvSet(rateLimitKey, tentativas + 1);
        console.log(`✅ [RATE LIMIT] Contador incrementado: ${tentativas + 1}/5`);
        
      } catch (error) {
        // Fail-safe: se kvGet/kvSet falhar, permitir assinatura
        console.warn("⚠️ [RATE LIMIT] Erro ao verificar limite, permitindo assinatura:", error);
      }

      // 4️⃣ Validar dados recebidos
      if (body.aprovado === undefined) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Campo 'aprovado' é obrigatório",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!body.assinatura) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Assinatura é obrigatória",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!body.nomeCompleto || !body.nomeCompleto.trim()) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Nome completo é obrigatório",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!body.aprovado && !body.motivo) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Motivo da reprovação é obrigatório",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // 5️⃣ Atualizar formulário
      const now = new Date().toISOString();
      const updatedFormulario = {
        ...formulario,
        prepostoConfirmado: true,
        assinaturaPreposto: body.assinatura,
        nomeCompletoPreposto: body.nomeCompleto.trim(),
        dataAssinaturaPreposto: now,
        statusPreposto: body.aprovado ? "aprovado" : "reprovado",
        motivoReprovacaoPreposto: body.motivo || null,
        ipAssinaturaPreposto: clientIp,
        updatedAt: Date.now(), // ✅ CORREÇÃO: Usar camelCase e timestamp numérico (consistente com FormData)
      };

      // 6️⃣ Salvar formulário no KV Store
      await kvSet(chave, updatedFormulario);

      // 7️⃣ Atualizar status da obra
      const obra = await kvGet(`obra:${formulario.obra_id}`);
      if (obra) {
        const updatedObra = {
          ...obra,
          status: body.aprovado ? "concluido" : "reprovado_preposto",
          updatedAt: Date.now(), // ✅ CORREÇÃO: camelCase e timestamp numérico (consistente com Obra interface)
        };
        await kvSet(`obra:${formulario.obra_id}`, updatedObra);
        console.log(`✅ Obra atualizada para status: ${updatedObra.status}`);
      } else {
        console.warn(`⚠️ Obra ${formulario.obra_id} não encontrada para atualizar status`);
      }

      console.log("✅ Formulário assinado com sucesso!");
      console.log("📊 Status:", body.aprovado ? "APROVADO" : "REPROVADO");
      console.log("🕒 Data/Hora:", now);
      console.log("🌐 IP:", clientIp);
      console.log("=".repeat(60));

      // 8️⃣ Retornar sucesso
      return new Response(
        JSON.stringify({
          success: true,
          message: body.aprovado
            ? "Formulário aprovado com sucesso!"
            : "Formulário reprovado com sucesso!",
          data: {
            id: formularioId,
            status: updatedFormulario.statusPreposto,
            dataAssinatura: now,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error: any) {
      console.error("❌ Erro ao assinar formulário:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Erro ao assinar formulário",
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // 404 - Rota não encontrada
  console.warn("⚠️ Rota não encontrada:", path);
  return new Response(
    JSON.stringify({
      error: "Rota não encontrada",
      path: path,
      method: req.method,
      availableRoutes: [
        "GET /health",
        "GET /conferencia/:formularioId",
        "POST /conferencia/:formularioId/assinar",
      ],
    }),
    {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});

console.log("🚀 Edge Function pública iniciada - Conferência do Preposto v1.0.0");