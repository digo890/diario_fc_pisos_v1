import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Criar cliente Supabase com configurações otimizadas
const supabaseClient = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'diario-obras-fc-pisos',
      },
    },
  }
);

// Export único
export const supabase = supabaseClient;
export const getSupabaseClient = () => supabaseClient;
