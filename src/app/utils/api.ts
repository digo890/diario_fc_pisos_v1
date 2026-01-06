// ============================================
// API Service - Integração com Backend
// ============================================

import { projectId, publicAnonKey } from '/utils/supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2`;

// Token de acesso (será definido pelo AuthContext)
let accessToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  accessToken = token;
};

// Helper para fazer requisições
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  // Usar accessToken se disponível para autenticação do usuário
  // Sempre enviar publicAnonKey no Authorization para passar pelo CORS
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
    ...(accessToken ? { 'X-User-Token': accessToken } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro: ${response.status}`);
  }

  return response.json();
}

// ============================================
// USUÁRIOS
// ============================================

export const userApi = {
  list: () => request<any>('/users'),
  create: (data: any) => request<any>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  get: (id: string) => request<any>(`/users/${id}`),
  update: (id: string, data: any) => request<any>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => request<any>(`/users/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// OBRAS
// ============================================

export const obraApi = {
  list: () => request<any>('/obras'),
  create: (data: any) => request<any>('/obras', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  get: (id: string) => request<any>(`/obras/${id}`),
  update: (id: string, data: any) => request<any>(`/obras/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => request<any>(`/obras/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// FORMULÁRIOS
// ============================================

export const formularioApi = {
  list: () => request<any>('/formularios'),
  create: (data: any) => request<any>('/formularios', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  get: (id: string) => request<any>(`/formularios/${id}`),
  getByToken: (token: string) => request<any>(`/formularios/token/${token}`),
  update: (id: string, data: any) => request<any>(`/formularios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => request<any>(`/formularios/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// EMAIL
// ============================================

export const emailApi = {
  sendValidation: (data: {
    email: string;
    token: string;
    cliente: string;
    obra: string;
  }) => request<any>('/send-validation-email', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthCheck = () => request<any>('/health');