// ============================================
// SUPABASE UTILITIES
// ============================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

// Usar as credenciais do Figma Make (já configuradas automaticamente)
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = publicAnonKey;

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Helper para gerar token único de validação
export const generateValidationToken = (): string => {
  return crypto.randomUUID();
};