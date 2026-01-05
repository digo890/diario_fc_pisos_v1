// ============================================
// SUPABASE CLIENT
// Cliente configurado para o app
// ============================================

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../config/supabase';

// Usar as credenciais do Figma Make (já configuradas automaticamente)
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = publicAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper para upload de imagens
export const uploadImage = async (
  file: File,
  bucket: string,
  path: string
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

// Helper para deletar imagem
export const deleteImage = async (
  bucket: string,
  path: string
): Promise<void> => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
};