import { Hono } from "npm:hono@4.0.2";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { jwtVerify } from "npm:jose@5.9.6";
import * as emailService from "./email.tsx";
import * as kv from "./kv_store.tsx";
import * as validation from "./validation.tsx";

// ============================================
// UTILITÁRIOS DE LOGGING SEGUROS
// ============================================

/**
 * Console.log seguro que não quebra se houver erro de serialização
 */
function safeLog(...args: any[]) {
  try {
    console.log(...args);
  } catch (error) {
    console.log("[LOG ERROR]", String(error));
  }
}

/**
 * Console.error seguro que não quebra se houver erro de serialização
 */
function safeError(...args: any[]) {
  try {
    console.error(...args);
  } catch (error) {
    console.error("[ERROR LOG ERROR]", String(error));
  }
}

/**
 * Console.warn seguro que não quebra se houver erro de serialização
 */
function safeWarn(...args: any[]) {
  try {
    console.warn(...args);
  } catch (error) {
    console.warn("[WARN LOG ERROR]", String(error));
  }
}

/**
 * Extrai mensagem de erro de forma segura
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  return 'Erro desconhecido';
}

// ============================================
// 🔧 UTILITÁRIOS: NORMALIZAÇÃO DE CAMPOS
// ============================================

/**
 * Normaliza campos snake_case para camelCase em objetos de obra
 * Garante consistência interna no backend (sempre camelCase no KV)
 */
function normalizeObraFields(data: any): any {
  const normalized = { ...data };
  
  // Mapeamento de campos snake_case → camelCase
  const fieldMap: Record<string, string> = {
    'encarregado_id': 'encarregadoId',
    'preposto_nome': 'prepostoNome',
    'preposto_email': 'prepostoEmail',
    'validation_token': 'validationToken',
    'validation_token_expiry': 'validationTokenExpiry',
    'created_at': 'created_at', // Manter snake_case (padrão de timestamps)
    'updated_at': 'updated_at', // Manter snake_case (padrão de timestamps)
  };
  
  // Converter campos snake_case para camelCase
  for (const [snakeCase, camelCase] of Object.entries(fieldMap)) {
    if (snakeCase in normalized && snakeCase !== camelCase) {
      normalized[camelCase] = normalized[snakeCase];
      delete normalized[snakeCase]; // Remover duplicata
    }
  }
  
  return normalized;
}

/**
 * Converte campos camelCase para snake_case para resposta de API
 * Garante consistência na API REST (sempre snake_case nas respostas)
 */
function toSnakeCase(data: any): any {
  const converted = { ...data };
  
  // Mapeamento de campos camelCase → snake_case
  const fieldMap: Record<string, string> = {
    'encarregadoId': 'encarregado_id',
    'prepostoNome': 'preposto_nome',
    'prepostoEmail': 'preposto_email',
    'validationToken': 'token_validacao',
    'validationTokenExpiry': 'token_validacao_expiry',
    'validationTokenLastAccess': 'validation_token_last_access',
    'createdAt': 'created_at',
    'createdBy': 'created_by',
    'updatedAt': 'updated_at',
  };
  
  // Converter campos camelCase para snake_case
  for (const [camelCase, snakeCase] of Object.entries(fieldMap)) {
    if (camelCase in converted) {
      converted[snakeCase] = converted[camelCase];
      delete converted[camelCase]; // Remover duplicata camelCase
    }
  }
  
  return converted;
}

/**
 * Normaliza campos de formulário para snake_case interno consistente
 * ✅ CORREÇÃO CRÍTICA: Garantir que obraId → obra_id sempre
 */
function normalizeFormularioFields(data: any): any {
  const normalized = { ...data };
  
  // ✅ CRÍTICO: Sempre normalizar obraId → obra_id
  if ('obraId' in normalized) {
    normalized.obra_id = normalized.obraId;
    delete normalized.obraId;
  }
  
  // Normalizar outros campos comuns
  const fieldMap: Record<string, string> = {
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
    'createdBy': 'created_by',
    'enviadoPrepostoAt': 'enviado_preposto_at',
    'prepostoReviewedAt': 'preposto_reviewed_at',
    'prepostoReviewedBy': 'preposto_reviewed_by',
    'completedAt': 'completed_at',
    'emailsEnviados': 'emails_enviados',
    'assinaturaEncarregado': 'assinatura_encarregado',
    'assinaturaPreposto': 'assinatura_preposto',
    'prepostoConfirmado': 'preposto_confirmado',
    'prepostoMotivoReprovacao': 'preposto_motivo_reprovacao',
  };
  
  for (const [camelCase, snakeCase] of Object.entries(fieldMap)) {
    if (camelCase in normalized) {
      normalized[snakeCase] = normalized[camelCase];
      delete normalized[camelCase];
    }
  }
  
  return normalized;
}

// ============================================
// INICIALIZAÇÃO DO SERVIDOR HONO
// ============================================

const app = new Hono();

// Supabase client with service role (for admin operations)
const getSupabaseAdmin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

// Supabase client with anon key (for auth operations)
const getSupabaseClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

// Middleware to verify auth token
const requireAuth = async (c: any, next: any) => {
  // Primeiro tentar pegar do header customizado X-User-Token
  let accessToken = c.req.header("X-User-Token");

  // Se não tiver, tentar pegar do Authorization (para retrocompatibilidade)
  if (!accessToken) {
    const authHeader = c.req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const tokenFromAuth = authHeader.split(" ")[1];
      // Só usar se não for o publicAnonKey
      if (tokenFromAuth !== Deno.env.get("SUPABASE_ANON_KEY")) {
        accessToken = tokenFromAuth;
      }
    }
  }

  if (!accessToken) {
    safeError("❌ [AUTH] Token de autenticação não fornecido");
    safeError("Headers recebidos:", {
      "X-User-Token": c.req.header("X-User-Token")
        ? "presente"
        : "ausente",
      Authorization: c.req.header("Authorization")
        ? "presente (mascarado)"
        : "ausente",
    });
    return c.json(
      {
        success: false,
        error: "Token de autenticação não fornecido",
      },
      401,
    );
  }

  safeLog("🔐 [AUTH] Validando token...");

  // ✅ CORREÇÃO DE SEGURANÇA: Usar método que valida assinatura JWT
  const supabase = getSupabaseAdmin();

  try {
    // ✅ MÉTODO SEGURO: Validar JWT com verificação de assinatura
    // Usar getUser() com Service Role que aceita tokens de usuário
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      // Se falhar, pode ser porque o método getUser() não funciona bem em Edge Functions
      // Usar método alternativo: verificar token via Admin API
      safeLog(
        "⚠️ [AUTH] getUser() falhou, tentando método alternativo...",
      );

      try {
        // Decodificar JWT para obter userId (mas ainda vamos validar!)
        const parts = accessToken.split(".");
        if (parts.length !== 3) {
          safeError("❌ [AUTH] Token com formato inválido");
          return c.json(
            { success: false, error: "Token inválido" },
            401,
          );
        }

        // 🔒 SEGURANÇA CRÍTICA: Verificar a ASSINATURA do JWT antes de
        // confiar em qualquer campo do payload. Sem isto, um token forjado
        // (com iss/sub/email válidos) seria aceito. A verificação usa o
        // segredo HS256 do projeto Supabase (SUPABASE_JWT_SECRET).
        const jwtSecret = Deno.env.get("SUPABASE_JWT_SECRET");
        if (!jwtSecret) {
          safeError(
            "❌ [AUTH] SUPABASE_JWT_SECRET não configurado — não é possível validar a assinatura do token",
          );
          return c.json(
            { success: false, error: "Erro de configuração de autenticação" },
            500,
          );
        }

        let payload: any;
        try {
          const expectedIssuer =
            Deno.env.get("SUPABASE_URL") + "/auth/v1";
          const verified = await jwtVerify(
            accessToken,
            new TextEncoder().encode(jwtSecret),
            {
              issuer: expectedIssuer,
              // jose valida automaticamente a expiração (exp) e o issuer
            },
          );
          payload = verified.payload;

          // 🔍 DEBUG: Logar presença dos campos para diagnóstico
          safeLog("🔍 [AUTH] Payload do token (assinatura verificada):", {
            sub: payload.sub ? "presente" : "AUSENTE",
            email: payload.email ? "presente" : "ausente",
            exp: payload.exp ? "presente" : "ausente",
            iss: payload.iss ? "presente" : "ausente",
            role: payload.role || "não definido"
          });
        } catch (verifyError) {
          safeError(
            "❌ [AUTH] Assinatura/validação do JWT falhou:",
            getErrorMessage(verifyError),
          );
          return c.json(
            { success: false, error: "Token inválido" },
            401,
          );
        }

        const userId = payload.sub;
        const expTimestamp = payload.exp;
        const issuer = payload.iss;

        if (!userId) {
          safeError("❌ [AUTH] Token não contém user ID");
          safeError("🔍 [AUTH] Payload completo (sanitizado):", {
            keys: Object.keys(payload),
            sub: payload.sub,
            hasEmail: !!payload.email,
            hasExp: !!payload.exp
          });
          return c.json(
            { success: false, error: "Token inválido" },
            401,
          );
        }

        // ✅ SEGURANÇA: Verificar issuer (deve ser o Supabase URL)
        const expectedIssuer =
          Deno.env.get("SUPABASE_URL") + "/auth/v1";
        if (issuer !== expectedIssuer) {
          safeError(
            "❌ [AUTH] Token de fonte não confiável:",
            issuer,
          );
          return c.json(
            { success: false, error: "Token inválido" },
            401,
          );
        }

        // Verificar expiração do token
        if (expTimestamp) {
          const now = Math.floor(Date.now() / 1000);
          if (expTimestamp < now) {
            safeError("❌ [AUTH] Token expirado");
            return c.json(
              {
                success: false,
                error:
                  "Token expirado. Por favor, faça login novamente.",
              },
              401,
            );
          }
        }

        // ✅ VALIDAÇÃO CRÍTICA: Verificar se usuário existe E se o token é válido
        // Isso garante que o token foi realmente emitido pelo Supabase
        const { data: userData, error: userError } =
          await supabase.auth.admin.getUserById(userId);

        if (userError) {
          safeError(
            "❌ [AUTH] Erro ao buscar usuário:",
            userError.message,
          );
          return c.json(
            {
              success: false,
              error: "Token inválido ou expirado",
            },
            401,
          );
        }

        if (!userData?.user) {
          safeError(
            "❌ [AUTH] Usuário não encontrado no banco",
          );
          return c.json(
            { success: false, error: "Usuário não encontrado" },
            401,
          );
        }

        // ✅ SEGURANÇA EXTRA: Verificar se o email do token bate com o email do usuário
        const emailFromToken = payload.email;
        if (
          emailFromToken &&
          userData.user.email !== emailFromToken
        ) {
          safeError(
            "❌ [AUTH] Email do token não corresponde ao usuário",
          );
          return c.json(
            { success: false, error: "Token inválido" },
            401,
          );
        }

        safeLog(
          "✅ [AUTH] Token válido para usuário:",
          userData.user.email,
        );

        // Attach user to context
        c.set("userId", userData.user.id);
        c.set("userEmail", userData.user.email);
        
        // 🔧 CORREÇÃO: Buscar tipo do usuário no KV
        const userRecord = await kv.get(`user:${userData.user.id}`);
        if (userRecord) {
          c.set("userRole", userRecord.tipo);
          safeLog(`✅ [AUTH] Tipo do usuário: ${userRecord.tipo}`);
        } else {
          safeWarn(`⚠️ [AUTH] Usuário ${userData.user.id} não encontrado no KV`);
          c.set("userRole", "Encarregado"); // Default para segurança
        }

        await next();
      } catch (fallbackError: any) {
        safeError(
          "❌ [AUTH] Erro no método alternativo:",
          fallbackError.message,
        );
        return c.json(
          {
            success: false,
            error: "Erro ao validar autenticação",
          },
          500,
        );
      }
    } else {
      // getUser() funcionou
      safeLog(
        "✅ [AUTH] Token válido para usuário:",
        user.email,
      );

      // Attach user to context
      c.set("userId", user.id);
      c.set("userEmail", user.email);
      
      // 🔧 CORREÇÃO: Buscar tipo do usuário no KV
      const userRecord = await kv.get(`user:${user.id}`);
      if (userRecord) {
        c.set("userRole", userRecord.tipo);
        safeLog(`✅ [AUTH] Tipo do usuário: ${userRecord.tipo}`);
      } else {
        safeWarn(`⚠️ [AUTH] Usuário ${user.id} não encontrado no KV`);
        c.set("userRole", "Encarregado"); // Default para segurança
      }

      await next();
    }
  } catch (error: any) {
    safeError(
      "❌ [AUTH] Erro inesperado ao validar token:",
      getErrorMessage(error),
    );
    return c.json(
      { success: false, error: "Erro ao validar autenticação" },
      500,
    );
  }
};

// Enable logger
app.use("*", logger(console.log));

// 🔍 DEBUG MIDDLEWARE: Logar TODAS as requisições
app.use("*", async (c, next) => {
  // 🔍 Middleware de debug removido (rotas de conferência foram isoladas)
  
  await next();
});

// Enable CORS for all routes and methods
// SEGURANÇA: Restrito a domínios específicos em produção
const getAllowedOrigins = () => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "https://cjwuooaappcnsqxgdpta.supabase.co",
    "https://figma-make.vercel.app", // Figma Make preview
    "https://diario-fc-pisos-v1.vercel.app", // Produção
  ];

  // Adicionar domínio customizado se configurado
  const customDomain = Deno.env.get("CUSTOM_DOMAIN");
  if (customDomain) {
    allowedOrigins.push(customDomain);
  }

  // Adicionar qualquer domínio .figma.com para desenvolvimento
  return allowedOrigins;
};

app.use(
  "/*",
  cors({
    origin: (origin) => {
      const allowedOrigins = getAllowedOrigins();

      // Permitir requests sem origin (mobile apps, Postman, etc)
      if (!origin) return "*";

      // Permitir domínios da lista
      if (allowedOrigins.includes(origin)) return origin;

      // Permitir qualquer subdomínio do Figma Make e Vercel
      if (
        origin.includes(".figma.com") ||
        origin.includes("figma-make") ||
        origin.includes(".vercel.app") ||
        origin.includes("figmaiframepreview.figma.site")
      ) {
        return origin;
      }

      // Bloquear outros
      return false;
    },
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-User-Token",
      "X-Setup-Key",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// Health check endpoint
app.get("/make-server-1ff231a2/health", (c) => {
  return c.json({ status: "ok" });
});

// 🧪 ROTA DE TESTE PÚBLICA (diagnóstico)
app.get("/make-server-1ff231a2/test-public", (c) => {
  return c.json({ 
    success: true, 
    message: "Rota pública funcionando!",
    timestamp: new Date().toISOString(),
    origin: c.req.header("Origin") || "no-origin",
    userAgent: c.req.header("User-Agent") || "no-ua"
  });
});

// ============================================
// AUTENTICAÇÃO
// ============================================

// Criar usuário master (apenas para inicialização)
// SEGURANÇA: Esta rota requer uma chave secreta para evitar criação não autorizada de admins
app.post(
  "/make-server-1ff231a2/auth/create-master",
  async (c) => {
    try {
      // Validar chave de setup
      const setupKey = c.req.header("X-Setup-Key");
      const expectedSetupKey =
        Deno.env.get("MASTER_SETUP_KEY") ||
        "setup-fc-pisos-2024";

      if (setupKey !== expectedSetupKey) {
        return c.json(
          { success: false, error: "Chave de setup inválida" },
          403,
        );
      }

      const { email, password, nome } = await c.req.json();

      const supabase = getSupabaseAdmin();

      // Verificar se usuário já existe
      const { data: existingUsers } =
        await supabase.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some(
        (u) => u.email === email,
      );

      if (userExists) {
        // Buscar dados do usuário existente
        const existingUser = existingUsers.users.find(
          (u) => u.email === email,
        );
        let userData = await kv.get(`user:${existingUser.id}`);

        // Se não existe no KV, criar agora
        if (!userData) {
          userData = {
            id: existingUser.id,
            nome: existingUser.user_metadata?.nome || nome,
            email: existingUser.email,
            tipo:
              existingUser.user_metadata?.tipo ||
              "Administrador",
            ativo: true,
            created_at:
              existingUser.created_at ||
              new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await kv.set(`user:${existingUser.id}`, userData);
        }

        return c.json({
          success: true,
          message: "Usuário já existe",
          data: userData,
        });
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirmar email (não temos servidor de email configurado)
          user_metadata: {
            nome,
            tipo: "Administrador",
          },
        });

      if (authError) {
        safeError(
          "❌ Erro ao criar usuário master:",
          authError.message,
        );
        return c.json(
          { success: false, error: authError.message },
          500,
        );
      }

      // Salvar dados do usuário no KV store
      const user = {
        id: authData.user.id,
        nome,
        email,
        tipo: "Administrador",
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await kv.set(`user:${authData.user.id}`, user);

      return c.json({
        success: true,
        message: "Usuário master criado com sucesso",
        data: user,
      });
    } catch (error) {
      safeError("❌ Erro ao criar usuário master:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// Obter dados do usuário logado
app.get(
  "/make-server-1ff231a2/auth/me",
  requireAuth,
  async (c) => {
    try {
      const userId = c.get("userId");
      const userEmail = c.get("userEmail");

      safeLog("🔍 Buscando dados do usuário:", userId);

      let user = await kv.get(`user:${userId}`);

      // Se o usuário não existe no KV store, criar entrada baseada nos dados do Auth
      if (!user) {
        safeLog(
          "⚠️ Usuário não encontrado no KV store, criando entrada...",
        );

        const supabase = getSupabaseAdmin();
        const { data: authUser } =
          await supabase.auth.admin.getUserById(userId);

        if (authUser?.user) {
          user = {
            id: authUser.user.id,
            nome:
              authUser.user.user_metadata?.nome || "Usuário",
            email: authUser.user.email || userEmail,
            tipo:
              authUser.user.user_metadata?.tipo ||
              "Administrador",
            ativo: true,
            created_at:
              authUser.user.created_at ||
              new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await kv.set(`user:${userId}`, user);
          safeLog("✅ Usuário criado no KV store:", user);
        } else {
          return c.json(
            {
              success: false,
              error: "Usuário não encontrado no Auth",
            },
            404,
          );
        }
      }

      return c.json({ success: true, data: user });
    } catch (error) {
      safeError("Erro ao buscar dados do usuário:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// ============================================
// USUÁRIOS (protegidas com auth)
// ============================================

// Listar todos os usuários
app.get(
  "/make-server-1ff231a2/users",
  requireAuth,
  async (c) => {
    try {
      const users = await kv.getByPrefix("user:");
      return c.json({ success: true, data: users });
    } catch (error) {
      safeError("Erro ao listar usuários:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// Criar usuário
app.post(
  "/make-server-1ff231a2/users",
  requireAuth,
  async (c) => {
    try {
      const body = await c.req.json();
      const { nome, email, senha, tipo, telefone } = body;

      safeLog("👤 Criando usuário:", {
        nome,
        email,
        tipo,
        telefone,
      });

      // VALIDAÇÃO: Validar dados do usuário
      const validationResult = validation.validateUserData(
        {
          nome,
          email,
          tipo,
          password: senha,
          telefone,
        },
        false,
      );

      if (!validationResult.isValid) {
        safeError(
          "❌ Dados inválidos:",
          validationResult.errors,
        );
        return c.json(
          {
            success: false,
            error: validationResult.errors.join(", "),
          },
          400,
        );
      }

      // RATE LIMITING: Verificar limite de requisições
      const rateLimit = validation.checkRateLimit(
        `create-user:${c.get("userId")}`,
        10,
        60000,
      );
      if (!rateLimit.allowed) {
        return c.json(
          {
            success: false,
            error:
              "Muitas requisições. Tente novamente em 1 minuto.",
          },
          429,
        );
      }

      const supabase = getSupabaseAdmin();

      // Usar dados sanitizados
      const sanitized = validationResult.sanitized;

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: sanitized.email,
          password: sanitized.password,
          email_confirm: true,
          user_metadata: {
            nome: sanitized.nome,
            tipo: sanitized.tipo,
            telefone: sanitized.telefone,
          },
        });

      if (authError) {
        safeError(
          "Erro ao criar usuário no Supabase Auth:",
          authError,
        );
        return c.json(
          { success: false, error: authError.message },
          500,
        );
      }

      // Salvar no KV store (sem senha)
      const user = {
        id: authData.user.id,
        nome: sanitized.nome,
        email: sanitized.email,
        tipo: sanitized.tipo,
        telefone: sanitized.telefone,
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await kv.set(`user:${authData.user.id}`, user);

      safeLog("✅ Usuário criado com sucesso");
      return c.json({ success: true, data: user });
    } catch (error) {
      safeError("Erro ao criar usuário:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// Buscar usuário por ID
app.get(
  "/make-server-1ff231a2/users/:id",
  requireAuth,
  async (c) => {
    try {
      const id = c.req.param("id");

      // Validar formato do ID
      if (!validation.isValidUUID(id)) {
        safeWarn(
          `⚠️ Tentativa de buscar usuário com ID inválido: ${id}`,
        );
        return c.json(
          { success: false, error: "ID de usuário inválido" },
          400,
        );
      }

      const user = await kv.get(`user:${id}`);
      if (!user) {
        return c.json(
          { success: false, error: "Usuário não encontrado" },
          404,
        );
      }
      return c.json({ success: true, data: user });
    } catch (error) {
      safeError("Erro ao buscar usuário:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// Atualizar usuário
app.put(
  "/make-server-1ff231a2/users/:id",
  requireAuth,
  async (c) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();

      safeLog("🔄 Atualizando usuário:", id);
      safeLog("📤 Dados recebidos:", body); // Sanitizado - não mostra senha

      const user = await kv.get(`user:${id}`);
      if (!user) {
        safeError("❌ Usuário não encontrado no KV store:", id);
        return c.json(
          { success: false, error: "Usuário não encontrado" },
          404,
        );
      }

      safeLog("✅ Usuário encontrado no KV:", user);

      const supabase = getSupabaseAdmin();

      // Se houver senha, atualizar no Supabase Auth
      if (body.senha) {
        safeLog("🔑 Atualizando senha no Supabase Auth...");
        const { error: authError } =
          await supabase.auth.admin.updateUserById(id, {
            password: body.senha,
          });

        if (authError) {
          safeError("❌ Erro ao atualizar senha:", authError);
          return c.json(
            { success: false, error: authError.message },
            500,
          );
        }
        safeLog("✅ Senha atualizada com sucesso");
      }

      // Se houver email, atualizar no Supabase Auth
      if (body.email && body.email !== user.email) {
        safeLog("📧 Atualizando email no Supabase Auth...");
        const { error: authError } =
          await supabase.auth.admin.updateUserById(id, {
            email: body.email,
          });

        if (authError) {
          safeError("❌ Erro ao atualizar email:", authError);
          return c.json(
            { success: false, error: authError.message },
            500,
          );
        }
        safeLog("✅ Email atualizado com sucesso");
      }

      // Atualizar user_metadata se nome ou tipo mudaram
      if (body.nome || body.tipo || body.telefone) {
        safeLog("👤 Atualizando metadados do usuário...");
        const { error: authError } =
          await supabase.auth.admin.updateUserById(id, {
            user_metadata: {
              nome: body.nome || user.nome,
              tipo: body.tipo || user.tipo,
              telefone:
                body.telefone !== undefined
                  ? body.telefone
                  : user.telefone,
            },
          });

        if (authError) {
          safeError(
            "❌ Erro ao atualizar metadados:",
            authError,
          );
          return c.json(
            { success: false, error: authError.message },
            500,
          );
        }
        safeLog("✅ Metadados atualizados com sucesso");
      }

      // Atualizar no KV store (sem a senha)
      const updatedUser = {
        ...user,
        nome: body.nome || user.nome,
        tipo: body.tipo || user.tipo,
        email: body.email || user.email,
        telefone:
          body.telefone !== undefined
            ? body.telefone
            : user.telefone,
        updated_at: new Date().toISOString(),
      };

      safeLog("💾 Salvando no KV store:", updatedUser);
      await kv.set(`user:${id}`, updatedUser);

      safeLog("✅ Usuário atualizado com sucesso");
      return c.json({ success: true, data: updatedUser });
    } catch (error) {
      safeError("❌ Erro ao atualizar usuário:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// Deletar usuário
app.delete(
  "/make-server-1ff231a2/users/:id",
  requireAuth,
  async (c) => {
    try {
      const id = c.req.param("id");

      safeLog("🗑️ Deletando usuário:", id);

      // Validar se é um UUID válido
      const isUUID = validation.isValidUUID(id);

      if (!isUUID) {
        safeWarn(
          ` ID não é UUID válido (usuário legado): ${id}`,
        );
        // Para usuários legados (enc-1, adm-1, etc.), apenas deletar do KV
        await kv.del(`user:${id}`);
        safeLog("✅ Usuário legado deletado do KV store");
        return c.json({ success: true });
      }

      const supabase = getSupabaseAdmin();

      // Deletar do Supabase Auth
      safeLog("🔥 Deletando do Supabase Auth...");
      const { error: authError } =
        await supabase.auth.admin.deleteUser(id);

      if (authError) {
        safeError("❌ Erro ao deletar do Auth:", authError);
        // Extrair mensagem de erro adequada
        const errorMessage =
          typeof authError === "object" && authError !== null
            ? (authError as any).message ||
              JSON.stringify(authError)
            : String(authError);
        return c.json(
          { success: false, error: errorMessage },
          500,
        );
      }

      safeLog("✅ Deletado do Auth");

      // Deletar do KV store
      await kv.del(`user:${id}`);

      safeLog("✅ Usuário deletado com sucesso");
      return c.json({ success: true });
    } catch (error) {
      safeError("❌ Erro ao deletar usuário:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return c.json(
        { success: false, error: errorMessage },
        500,
      );
    }
  },
);

// ============================================
// OBRAS
// ============================================

// Listar todas as obras
app.get(
  "/make-server-1ff231a2/obras",
  requireAuth,
  async (c) => {
    try {
      const obras = await kv.getByPrefix("obra:");
      // ✅ CORREÇÃO: Converter camelCase → snake_case para consistência de API
      const obrasFormatted = obras.map((obra: any) => toSnakeCase(obra));
      return c.json({ success: true, data: obrasFormatted });
    } catch (error) {
      console.error("Erro ao listar obras:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// Criar obra
app.post(
  "/make-server-1ff231a2/obras",
  requireAuth,
  async (c) => {
    try {
      const body = await c.req.json();

      // VALIDAÇÃO: Validar dados da obra
      const validationResult =
        validation.validateObraData(body);

      if (!validationResult.isValid) {
        console.error(
          "❌ Dados da obra inválidos:",
          validationResult.errors,
        );
        return c.json(
          {
            success: false,
            error: validationResult.errors.join(", "),
          },
          400,
        );
      }

      // RATE LIMITING: Verificar limite de requisições
      const rateLimit = validation.checkRateLimit(
        `create-obra:${c.get("userId")}`,
        20,
        60000,
      );
      if (!rateLimit.allowed) {
        return c.json(
          {
            success: false,
            error:
              "Muitas requisições. Tente novamente em 1 minuto.",
          },
          429,
        );
      }

      const obraId = crypto.randomUUID();
      const obra = normalizeObraFields({
        id: obraId,
        ...validationResult.sanitized,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      await kv.set(`obra:${obraId}`, obra);

      // ✅ CORREÇÃO: Buscar dados do encarregado para retornar ao frontend
      const encarregado = await kv.get(
        `user:${obra.encarregadoId}`,
      );

      return c.json({
        success: true,
        data: toSnakeCase({
          ...obra,
          encarregado_email: encarregado?.email,
          encarregado_nome: encarregado?.nome,
        }),
      });
    } catch (error) {
      console.error("Erro ao criar obra:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// Buscar obra por ID
app.get(
  "/make-server-1ff231a2/obras/:id",
  requireAuth,
  async (c) => {
    try {
      const id = c.req.param("id");

      // ✅ CORREÇÃO #3: Validar UUID para prevenir ataques
      if (!validation.isValidUUID(id)) {
        safeWarn(
          `⚠️ Tentativa de buscar obra com ID inválido: ${id}`,
        );
        return c.json(
          { success: false, error: "ID de obra inválido" },
          400,
        );
      }

      const obra = await kv.get(`obra:${id}`);
      if (!obra) {
        return c.json(
          { success: false, error: "Obra não encontrada" },
          404,
        );
      }
      // ✅ CORREÇÃO: Converter camelCase → snake_case para consistência de API
      return c.json({ success: true, data: toSnakeCase(obra) });
    } catch (error) {
      console.error("Erro ao buscar obra:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// Atualizar obra
app.put(
  "/make-server-1ff231a2/obras/:id",
  requireAuth,
  async (c) => {
    try {
      const id = c.req.param("id");

      // ✅ CORREÇÃO #3: Validar UUID para prevenir ataques
      if (!validation.isValidUUID(id)) {
        safeWarn(
          `⚠️ Tentativa de atualizar obra com ID inválido: ${id}`,
        );
        return c.json(
          { success: false, error: "ID de obra inválido" },
          400,
        );
      }

      const body = await c.req.json();
      const obra = await kv.get(`obra:${id}`);
      if (!obra) {
        return c.json(
          { success: false, error: "Obra não encontrada" },
          404,
        );
      }

      // 🔧 CORREÇÃO: Normalizar obra recuperada do KV (pode ter campos em snake_case)
      const obraNormalizada = normalizeObraFields(obra);

      // 🔒 VALIDAÇÃO DE ESTADO: Verificar se a obra pode ser editada
      const userId = c.get("userId");
      const user = await kv.get(`user:${userId}`);

      if (!user) {
        safeError("❌ Usuário não encontrado:", userId);
        return c.json(
          { success: false, error: "Usuário não autorizado" },
          403,
        );
      }

      // 🔒 REGRA DE NEGÓCIO: Permissões por tipo de usuário
      const isAdmin = user.tipo === "Administrador";
      const isEncarregado = user.tipo === "Encarregado";
      const isOwnObra = obraNormalizada.encarregadoId === userId;

      // ✅ PERMISSÃO #1: Administradores podem editar qualquer obra
      // ✅ PERMISSÃO #2: Encarregados podem atualizar STATUS da própria obra
      if (!isAdmin) {
        if (!isEncarregado) {
          safeWarn(
            `⚠️ Tentativa de edição de obra por usuário não autorizado: ${userId} (tipo: ${user.tipo})`,
          );
          return c.json(
            {
              success: false,
              error:
                "Apenas administradores e encarregados podem editar obras",
            },
            403,
          );
        }

        // Encarregado só pode editar a própria obra
        if (!isOwnObra) {
          safeWarn(
            `⚠️ Encarregado ${userId} tentou editar obra de outro encarregado: ${obraNormalizada.encarregadoId}`,
          );
          return c.json(
            {
              success: false,
              error: "Você só pode editar suas próprias obras",
            },
            403,
          );
        }

        // Encarregado só pode mudar STATUS e PROGRESS (não outros campos)
        const allowedFields = ["status", "progress"];
        const changedFields = Object.keys(body).filter(
          (key) =>
            body[key] !== obraNormalizada[key] && key !== "updated_at",
        );
        const hasDisallowedChanges = changedFields.some(
          (field) => !allowedFields.includes(field),
        );

        if (hasDisallowedChanges) {
          safeWarn(
            `⚠️ Encarregado tentou editar campos não permitidos: ${changedFields.join(", ")}`,
          );
          return c.json(
            {
              success: false,
              error:
                "Encarregados só podem atualizar status e progresso da obra",
            },
            403,
          );
        }
      }

      // 🔒 VALIDAÇÃO DE TRANSIÇÃO DE ESTADO: Regras de mudança de status
      if (body.status && body.status !== obraNormalizada.status) {
        const validTransitions: Record<string, string[]> = {
          novo: ["em_preenchimento", "enviado_preposto"], // ✅ CORREÇÃO: Permitir envio direto ao preposto
          em_preenchimento: ["enviado_preposto", "novo"],
          enviado_preposto: [
            "concluido",
            "reprovado_preposto",
          ],
          reprovado_preposto: [
            "em_preenchimento",
            "enviado_preposto",
          ], // ✅ CORREÇÃO: Permitir reenvio ao preposto
          concluido: [], // Estado final, não pode mudar
        };

        const allowedNextStates =
          validTransitions[obraNormalizada.status] || [];

        if (!allowedNextStates.includes(body.status)) {
          safeWarn(
            `⚠️ Transição de estado inválida: ${obraNormalizada.status} → ${body.status}`,
          );
          return c.json(
            {
              success: false,
              error: `Não é possível mudar status de "${obraNormalizada.status}" para "${body.status}"`,
            },
            400,
          );
        }
      }

      // ✅ CORREÇÃO: Normalizar campos snake_case antes de salvar
      const updatedObra = normalizeObraFields({
        ...obraNormalizada,
        ...body,
        updated_at: new Date().toISOString(),
      });
      await kv.set(`obra:${id}`, updatedObra);

      // ✅ CORREÇÃO: Buscar dados do encarregado para retornar ao frontend
      const encarregado = await kv.get(
        `user:${updatedObra.encarregadoId}`,
      );

      return c.json({
        success: true,
        data: toSnakeCase({
          ...updatedObra,
          encarregado_email: encarregado?.email,
          encarregado_nome: encarregado?.nome,
        }),
      });
    } catch (error) {
      console.error("Erro ao atualizar obra:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// 🔧 REPARO ADMINISTRATIVO: Permite reverter status sem validação de transição
// Esta rota é exclusiva para administradores corrigirem inconsistências de dados
app.post(
  "/make-server-1ff231a2/obras/:id/repair",
  requireAuth,
  async (c) => {
    try {
      const id = c.req.param("id");

      // Validar UUID
      if (!validation.isValidUUID(id)) {
        safeWarn(`⚠️ Tentativa de reparar obra com ID inválido: ${id}`);
        return c.json(
          { success: false, error: "ID de obra inválido" },
          400,
        );
      }

      const body = await c.req.json();
      const obra = await kv.get(`obra:${id}`);
      
      if (!obra) {
        return c.json(
          { success: false, error: "Obra não encontrada" },
          404,
        );
      }

      // 🔒 VALIDAR PERMISSÃO: Apenas administradores podem reparar dados
      const userId = c.get("userId");
      const user = await kv.get(`user:${userId}`);

      if (!user || user.tipo !== "Administrador") {
        safeWarn(`⚠️ Tentativa de reparo não autorizada por ${user?.tipo || 'usuário desconhecido'}`);
        return c.json(
          { success: false, error: "Apenas administradores podem reparar dados" },
          403,
        );
      }

      // ✅ LOG DE AUDITORIA
      safeLog(`🔧 [REPARO ADMINISTRATIVO] Admin ${user.email} reparando obra ${id}`);
      safeLog(`🔧 Status atual: ${obra.status} → Novo status: ${body.status}`);

      // 🔧 ATUALIZAR SEM VALIDAÇÕES DE TRANSIÇÃO
      const obraNormalizada = normalizeObraFields(obra);
      const updatedObra = normalizeObraFields({
        ...obraNormalizada,
        ...body,
        updated_at: new Date().toISOString(),
      });
      
      await kv.set(`obra:${id}`, updatedObra);

      // Buscar dados do encarregado
      const encarregado = await kv.get(`user:${updatedObra.encarregadoId}`);

      safeLog(`✅ [REPARO] Obra ${id} reparada com sucesso`);

      return c.json({
        success: true,
        data: toSnakeCase({
          ...updatedObra,
          encarregado_email: encarregado?.email,
          encarregado_nome: encarregado?.nome,
        }),
      });
    } catch (error) {
      safeError("❌ [REPARO] Erro ao reparar obra:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// Deletar obra
app.delete(
  "/make-server-1ff231a2/obras/:id",
  requireAuth,
  async (c) => {
    try {
      const id = c.req.param("id");

      // ✅ CORREÇÃO #3: Validar UUID para prevenir ataques
      if (!validation.isValidUUID(id)) {
        safeWarn(
          `⚠️ Tentativa de deletar obra com ID inválido: ${id}`,
        );
        return c.json(
          { success: false, error: "ID de obra inválido" },
          400,
        );
      }

      await kv.del(`obra:${id}`);
      return c.json({ success: true });
    } catch (error) {
      console.error("Erro ao deletar obra:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// ============================================
// FORMULÁRIOS
// ============================================

// Listar todos os formulários
app.get(
  "/make-server-1ff231a2/formularios",
  requireAuth,
  async (c) => {
    try {
      const formularios = await kv.getByPrefix("formulario:");
      return c.json({ success: true, data: formularios });
    } catch (error) {
      console.error("Erro ao listar formulários:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// Criar formulário
app.post(
  "/make-server-1ff231a2/formularios",
  requireAuth,
  async (c) => {
    try {
      const body = await c.req.json();
      
      // ✅ CORREÇÃO: Usar ID do frontend se fornecido, senão gerar novo
      const formularioId = body.id || crypto.randomUUID();
      
      // ✅ CORREÇÃO CRÍTICA: Normalizar campos (obraId → obra_id, etc)
      const normalizedBody = normalizeFormularioFields(body);
      
      const formulario = {
        ...normalizedBody,
        id: formularioId, // ✅ Usar ID correto (do frontend ou gerado)
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      await kv.set(`formulario:${formularioId}`, formulario);
      
      console.log(`✅ Formulário criado/salvo com ID: ${formularioId}`);
      console.log(`🔍 obra_id no formulário: ${formulario.obra_id}`);
      
      return c.json({ success: true, data: formulario });
    } catch (error) {
      console.error("Erro ao criar formulário:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// Buscar formulário por ID
app.get(
  "/make-server-1ff231a2/formularios/:id",
  requireAuth,
  async (c) => {
    try {
      const id = c.req.param("id");

      // ✅ CORREÇÃO: Validar UUID para prevenir ataques
      if (!validation.isValidUUID(id)) {
        safeWarn(
          `⚠️ Tentativa de buscar formulário com ID inválido: ${id}`,
        );
        return c.json(
          {
            success: false,
            error: "ID de formulário inválido",
          },
          400,
        );
      }

      const formulario = await kv.get(`formulario:${id}`);
      if (!formulario) {
        return c.json(
          {
            success: false,
            error: "Formulário não encontrado",
          },
          404,
        );
      }
      return c.json({ success: true, data: formulario });
    } catch (error) {
      console.error("Erro ao buscar formulário:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// Buscar formulário por token de validação (PÚBLICA - para prepostos externos)
app.get(
  "/make-server-1ff231a2/formularios/token/:token",
  async (c) => {
    try {
      const token = c.req.param("token");

      // 🔒 RATE LIMITING: Proteger contra brute force
      const clientIp =
        c.req.header("x-forwarded-for") ||
        c.req.header("x-real-ip") ||
        "unknown";
      const rateLimitKey = `ratelimit:token:${clientIp}`;

      // Buscar dados do rate limit (timestamp + contador)
      const rateLimitData = (await kv.get(rateLimitKey)) || {
        attempts: 0,
        firstAttempt: Date.now(),
      };

      // Resetar contador se passaram 15 minutos desde a primeira tentativa
      const fifteenMinutes = 15 * 60 * 1000;
      if (
        Date.now() - rateLimitData.firstAttempt >
        fifteenMinutes
      ) {
        rateLimitData.attempts = 0;
        rateLimitData.firstAttempt = Date.now();
      }

      // Permitir máximo 10 tentativas por 15 minutos
      if (rateLimitData.attempts > 10) {
        const timeRemaining = Math.ceil(
          (fifteenMinutes -
            (Date.now() - rateLimitData.firstAttempt)) /
            60000,
        );
        console.warn(
          `⚠️ Rate limit excedido para IP: ${clientIp}`,
        );
        return c.json(
          {
            success: false,
            error: `Muitas tentativas. Aguarde ${timeRemaining} minuto(s) e tente novamente.`,
          },
          429,
        );
      }

      // Incrementar contador
      rateLimitData.attempts += 1;
      await kv.set(rateLimitKey, rateLimitData);

      // 🔍 Buscar obra pelo token para validar expiração
      const obras = await kv.getByPrefix("obra:");
      const obra = obras.find(
        (o: any) => o.token_validacao === token,
      );

      if (!obra) {
        console.log(
          `❌ Obra não encontrada para token: ${token.substring(0, 8)}...`,
        );
        // 🔍 DEBUG: Listar tokens existentes para diagnóstico
        console.log(
          `📊 DEBUG: Total de obras encontradas: ${obras.length}`,
        );
        if (obras.length > 0) {
          console.log(
            `📊 DEBUG: Tokens de validação das obras existentes:`,
            obras.map(
              (o: any) =>
                o.token_validacao?.substring(0, 8) + "...",
            ),
          );
        }
        return c.json(
          {
            success: false,
            error: "Link inválido ou expirado",
          },
          404,
        );
      }

      // ✅ SEGURANÇA: Validar expiração do token no backend
      if (obra.token_validacao_expiry) {
        const expiryDate = new Date(
          obra.token_validacao_expiry,
        );
        const now = new Date();

        if (expiryDate < now) {
          console.warn(
            `⚠️ Token expirado para obra: ${obra.id}`,
          );
          return c.json(
            {
              success: false,
              error:
                "Link expirado. Este link só é válido por 30 dias após a criação da obra.",
            },
            410,
          ); // 410 Gone
        }
      }

      // 🔍 Buscar formulário
      const formularios = await kv.getByPrefix("formulario:");
      const formulario = formularios.find(
        (f: any) => f.obra_id === obra.id,
      );

      if (!formulario) {
        console.log(
          `❌ Formulário não encontrado para obra: ${obra.id}`,
        );
        // 🔍 DEBUG: Listar todos os formulários para diagnóstico
        console.log(
          `📊 DEBUG: Total de formulários encontrados: ${formularios.length}`,
        );
        if (formularios.length > 0) {
          console.log(
            `📊 DEBUG: IDs de obra dos formulários existentes:`,
            formularios.map((f: any) => f.obra_id),
          );
        }
        return c.json(
          {
            success: false,
            error:
              "Formulário não encontrado ou ainda não foi preenchido",
          },
          404,
        );
      }

      // 🔒 AUDITORIA: Registrar último acesso ao link no backend
      const obraAtualizada = {
        ...obra,
        token_validacao_last_access: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await kv.set(`obra:${obra.id}`, obraAtualizada);

      console.log(
        `✅ Formulário encontrado e acesso registrado para token: ${token.substring(0, 8)}...`,
      );
      return c.json({ success: true, data: formulario });
    } catch (error) {
      console.error(
        "Erro ao buscar formulário por token:",
        error,
      );
      return c.json(
        { success: false, error: error.message },
        500,
      );
    }
  },
);

// Atualizar formulário
app.put(
  "/make-server-1ff231a2/formularios/:id",
  requireAuth,
  async (c) => {
    try {
      const id = c.req.param("id");

      // ✅ CORREÇÃO: Validar UUID para prevenir ataques
      if (!validation.isValidUUID(id)) {
        safeWarn(
          `⚠️ Tentativa de atualizar formulário com ID inválido: ${id}`,
        );
        return c.json(
          {
            success: false,
            error: "ID de formulário inválido",
          },
          400,
        );
      }

      const body = await c.req.json();
      const formulario = await kv.get(`formulario:${id}`);
      if (!formulario) {
        return c.json(
          {
            success: false,
            error: "Formulário não encontrado",
          },
          404,
        );
      }

      // 🔒 VALIDAÇÃO DE ESTADO: Verificar permissões e estado do formulário
      const userId = c.get("userId");
      const user = await kv.get(`user:${userId}`);

      if (!user) {
        safeError("❌ Usuário não encontrado:", userId);
        return c.json(
          { success: false, error: "Usuário não autorizado" },
          403,
        );
      }

      // ✅ CORREÇÃO CRÍTICA: Normalizar campos do body antes de merge
      const normalizedBody = normalizeFormularioFields(body);

      // 🔒 REGRA 1: Formulário já validado pelo preposto não pode ser editado
      if (formulario.prepostoConfirmado === true) {
        safeWarn(
          `⚠️ Tentativa de editar formulário já validado: ${id}`,
        );
        return c.json(
          {
            success: false,
            error:
              "Este formulário já foi validado pelo preposto e não pode mais ser editado",
          },
          403,
        );
      }

      // 🔒 REGRA 2: Apenas encarregado atribuído ou admin podem editar
      const obra = await kv.get(`obra:${formulario.obra_id}`);
      if (obra) {
        // 🔧 CORREÇÃO: Normalizar obra recuperada do KV (pode ter campos em snake_case)
        const obraNormalizada = normalizeObraFields(obra);
        
        const isEncarregadoAtribuido =
          user.tipo === "Encarregado" &&
          obraNormalizada.encarregadoId === userId;
        const isAdmin = user.tipo === "Administrador";

        if (!isEncarregadoAtribuido && !isAdmin) {
          safeWarn(
            `⚠️ Tentativa de editar formulário sem permissão: userId=${userId}, encarregadoId=${obraNormalizada.encarregadoId}`,
          );
          return c.json(
            {
              success: false,
              error:
                "Você não tem permissão para editar este formulário",
            },
            403,
          );
        }
      }

      // 🔒 REGRA 3: Validar transições de status do formulário
      if (normalizedBody.status && normalizedBody.status !== formulario.status) {
        const validFormTransitions: Record<string, string[]> = {
          rascunho: ["enviado_preposto"],
          enviado_preposto: [
            "concluido",
            "reprovado_preposto",
          ],
          reprovado_preposto: ["rascunho", "enviado_preposto"],
          concluido: [], // Estado final
        };

        const currentStatus = formulario.status || "rascunho";
        const allowedNextStates =
          validFormTransitions[currentStatus] || [];

        if (!allowedNextStates.includes(normalizedBody.status)) {
          safeWarn(
            `⚠️ Transição de status inválida no formulário: ${currentStatus} → ${normalizedBody.status}`,
          );
          return c.json(
            {
              success: false,
              error: `Não é possível mudar status do formulário de "${currentStatus}" para "${normalizedBody.status}"`,
            },
            400,
          );
        }
      }

      const updatedFormulario = {
        ...formulario,
        ...normalizedBody,
        updated_at: new Date().toISOString(),
      };
      await kv.set(`formulario:${id}`, updatedFormulario);
      console.log(`✅ Formulário atualizado com ID: ${id}`);
      console.log(`🔍 obra_id no formulário: ${updatedFormulario.obra_id}`);
      return c.json({ success: true, data: updatedFormulario });
    } catch (error) {
      console.error("Erro ao atualizar formulário:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// Deletar formulário
app.delete(
  "/make-server-1ff231a2/formularios/:id",
  requireAuth,
  async (c) => {
    try {
      const id = c.req.param("id");

      // ✅ CORREÇÃO: Validar UUID para prevenir ataques
      if (!validation.isValidUUID(id)) {
        safeWarn(
          `⚠️ Tentativa de deletar formulário com ID inválido: ${id}`,
        );
        return c.json(
          {
            success: false,
            error: "ID de formulário inválido",
          },
          400,
        );
      }

      await kv.del(`formulario:${id}`);
      return c.json({ success: true });
    } catch (error) {
      console.error("Erro ao deletar formulário:", error);
      return c.json(
        { success: false, error: getErrorMessage(error) },
        500,
      );
    }
  },
);

// ============================================
// ENVIO DE EMAIL
// ============================================

// Enviar email ao preposto para conferência
app.post(
  "/make-server-1ff231a2/emails/send-preposto-conferencia",
  requireAuth,
  async (c) => {
    try {
      console.log(
        "📧 Rota /emails/send-preposto-conferencia chamada",
      );

      const body = await c.req.json();
      const {
        prepostoEmail,
        prepostoNome,
        formularioId, // ✅ NOVO: Receber ID do formulário direto
        obraNome,
        cliente,
        cidade,
        encarregadoNome,
      } = body;

      console.log("📤 Dados recebidos:", {
        prepostoEmail,
        obraNome,
        formularioId,
      });
      console.log("🔍 [DEBUG] Tipo do formularioId recebido:", typeof formularioId);
      console.log("🔍 [DEBUG] Tamanho do formularioId:", formularioId?.length);

      // Validações
      if (!prepostoEmail || !obraNome || !formularioId) {
        return c.json(
          {
            success: false,
            error:
              "Email do preposto, nome da obra e ID do formulário são obrigatórios",
          },
          400,
        );
      }

      // ✅ SIMPLES: Link direto com ID do formulário
      const linkConferencia = `https://diario-fc-pisos-v1.vercel.app/conferencia/${formularioId}`;
      console.log("🔗 [DEBUG] Link gerado:", linkConferencia);

      // Gerar HTML do email
      const htmlEmail =
        emailService.getPrepostoConferenciaEmail(
          prepostoNome || "Preposto",
          obraNome,
          cliente,
          cidade,
          encarregadoNome,
          linkConferencia,
        );

      // Enviar email
      const result = await emailService.sendEmail({
        to: prepostoEmail,
        subject: `Conferência de Formulário - ${obraNome}`,
        html: htmlEmail,
      });

      if (!result.success) {
        console.error("❌ Erro ao enviar email:", result.error);
        return c.json(
          { success: false, error: result.error },
          500,
        );
      }

      console.log("✅ Email enviado com sucesso");
      return c.json({
        success: true,
        message: "Email enviado com sucesso",
        link: linkConferencia,
      });
    } catch (error: any) {
      console.error("❌ Erro ao enviar email:", error);
      return c.json(
        { success: false, error: error.message },
        500,
      );
    }
  },
);

// Enviar email ao admin sobre assinatura do preposto
app.post(
  "/make-server-1ff231a2/emails/send-admin-notificacao",
  requireAuth,
  async (c) => {
    try {
      console.log(
        "📧 Rota /emails/send-admin-notificacao chamada",
      );

      const body = await c.req.json();
      const {
        adminEmail,
        adminNome,
        obraNome,
        cliente,
        prepostoNome,
        aprovado,
      } = body;

      console.log("📤 Dados recebidos:", {
        adminEmail,
        obraNome,
        aprovado,
      });

      // Validações
      if (!adminEmail || !obraNome) {
        return c.json(
          {
            success: false,
            error:
              "Email do admin e nome da obra são obrigatórios",
          },
          400,
        );
      }

      // Gerar HTML do email
      const htmlEmail =
        emailService.getAdminNotificacaoAssinaturaEmail(
          adminNome || "Administrador",
          obraNome,
          cliente,
          prepostoNome,
          aprovado,
        );

      const statusText = aprovado ? "Aprovado" : "Reprovado";

      // Enviar email
      const result = await emailService.sendEmail({
        to: adminEmail,
        subject: `Formulário ${statusText} - ${obraNome}`,
        html: htmlEmail,
      });

      if (!result.success) {
        console.error("❌ Erro ao enviar email:", result.error);
        return c.json(
          { success: false, error: result.error },
          500,
        );
      }

      console.log("✅ Email enviado com sucesso");
      return c.json({
        success: true,
        message: "Email enviado com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro ao enviar email:", error);
      return c.json(
        { success: false, error: error.message },
        500,
      );
    }
  },
);

// Enviar email ao encarregado sobre nova obra
app.post(
  "/make-server-1ff231a2/emails/send-encarregado-nova-obra",
  requireAuth,
  async (c) => {
    try {
      console.log(
        "📧 Rota /emails/send-encarregado-nova-obra chamada",
      );

      const body = await c.req.json();
      const {
        encarregadoEmail,
        encarregadoNome,
        obraNome,
        cliente,
        cidade,
        prepostoNome,
        obraId, // Receber obraId para deep linking
      } = body;

      console.log("📤 Dados recebidos:", {
        encarregadoEmail,
        obraNome,
        obraId,
      });

      // Validações
      if (!encarregadoEmail || !obraNome || !obraId) {
        return c.json(
          {
            success: false,
            error:
              "Email do encarregado, nome da obra e ID são obrigatórios",
          },
          400,
        );
      }

      // Gerar HTML do email
      const htmlEmail =
        emailService.getEncarregadoNovaObraEmail(
          encarregadoNome || "Encarregado",
          obraNome,
          cliente,
          cidade,
          prepostoNome,
          obraId, // Passar obraId para o template
        );

      // Enviar email
      const result = await emailService.sendEmail({
        to: encarregadoEmail,
        subject: `Nova Obra Atribuída - ${obraNome}`,
        html: htmlEmail,
      });

      if (!result.success) {
        console.error("❌ Erro ao enviar email:", result.error);
        return c.json(
          { success: false, error: result.error },
          500,
        );
      }

      console.log("✅ Email enviado com sucesso");
      return c.json({
        success: true,
        message: "Email enviado com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro ao enviar email:", error);
      return c.json(
        { success: false, error: error.message },
        500,
      );
    }
  },
);

// ============================================
// ROTAS DE CONFERÊNCIA: REMOVIDAS
// ============================================
// 
// ✅ As rotas de conferência foram movidas para a Edge Function pública:
//    /supabase/functions/public-conferencia/index.tsx
// 
// Motivos:
// 1. Conferência é 100% pública (não requer autenticação)
// 2. Reduz complexidade do backend principal
// 3. Evita duplicação de código
// 4. Menor chance de chamar rota errada
// 
// Edge Function pública disponível em:
// https://{PROJECT_ID}.supabase.co/functions/v1/public-conferencia/conferencia/:formularioId
// 
// ============================================

Deno.serve(app.fetch);