/**
 * Edge Function Entry Point - Diário de Obras FC Pisos
 * 
 * Este é o entry point da Edge Function make-server-1ff231a2.
 * Importa e serve o aplicativo Hono principal.
 * 
 * Estrutura:
 * - /supabase/functions/make-server-1ff231a2/index.tsx ← VOCÊ ESTÁ AQUI (entry point)
 * - /supabase/functions/server/index.tsx ← Servidor principal (Hono app)
 * 
 * @version 1.0.0
 * @security verify_jwt = false (permite rotas públicas via config.toml)
 */

import "../server/index.tsx";

/**
 * IMPORTANTE: O servidor principal já chama Deno.serve(app.fetch) no final,
 * então não precisamos fazer nada aqui. Apenas importar é suficiente para
 * executar o código e iniciar o servidor.
 * 
 * A configuração verify_jwt = false no config.toml permite que rotas públicas
 * (como /validation/:token) funcionem sem autenticação.
 */