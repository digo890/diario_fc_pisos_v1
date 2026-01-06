// ============================================
// API Service - Integração com Backend
// ============================================

import { projectId, publicAnonKey } from '/utils/supabase/info';
import { supabase } from '/utils/supabase/client';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2`;

// ============================================
// Token Management (Thread-Safe)
// ============================================

class TokenManager {
  private accessToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  setToken(token: string | null): void {
    this.accessToken = token;
  }

  getToken(): string | null {
    return this.accessToken;
  }

  clearToken(): void {
    this.accessToken = null;
  }

  async refreshToken(): Promise<string | null> {
    // Se já está renovando, aguardar
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push((token: string) => {
          resolve(token);
        });
      });
    }

    this.isRefreshing = true;

    try {
      console.log('🔄 Renovando token...');
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error || !session?.access_token) {
        console.error('❌ Erro ao renovar token:', error?.message);
        this.clearToken();
        this.isRefreshing = false;
        
        // Notificar assinantes sobre falha
        this.refreshSubscribers.forEach((callback) => callback(''));
        this.refreshSubscribers = [];
        
        return null;
      }

      const newToken = session.access_token;
      this.setToken(newToken);
      console.log('✅ Token renovado com sucesso');

      // Notificar assinantes sobre sucesso
      this.refreshSubscribers.forEach((callback) => callback(newToken));
      this.refreshSubscribers = [];
      this.isRefreshing = false;

      return newToken;
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      this.clearToken();
      this.isRefreshing = false;
      this.refreshSubscribers = [];
      return null;
    }
  }
}

const tokenManager = new TokenManager();

export const setAuthToken = (token: string | null) => {
  tokenManager.setToken(token);
};

export const getAuthToken = (): string | null => {
  return tokenManager.getToken();
};

export const clearAuthToken = () => {
  tokenManager.clearToken();
};

// ============================================
// HTTP Request Helper
// ============================================

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
  retryCount: number = 0
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const { requireAuth = true, ...fetchOptions } = options;

  // Sempre enviar publicAnonKey no Authorization para passar pelo CORS
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  // Adicionar token de usuário se disponível e necessário
  if (requireAuth) {
    const accessToken = tokenManager.getToken();
    if (accessToken) {
      headers['X-User-Token'] = accessToken;
    } else {
      console.warn('⚠️ Token não disponível para requisição autenticada');
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Se 401 e ainda não tentou renovar, renovar token e tentar novamente
    if (response.status === 401 && requireAuth && retryCount === 0) {
      console.warn('⚠️ Token inválido (401), tentando renovar...');
      
      const newToken = await tokenManager.refreshToken();
      
      if (newToken) {
        console.log('✅ Token renovado, tentando requisição novamente...');
        // Tentar novamente com novo token (retryCount = 1 para evitar loop infinito)
        return request<T>(endpoint, options, retryCount + 1);
      } else {
        console.error('❌ Falha ao renovar token, redirecionando para login...');
        // Se falhar ao renovar, forçar logout
        window.location.href = '/';
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`❌ Erro na requisição ${endpoint}:`, error.message || error);
    throw error;
  }
}

// ============================================
// API Response Types
// ============================================

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// Obra API
// ============================================

export const obraApi = {
  async list(): Promise<ApiResponse> {
    return request('/obras', { method: 'GET' });
  },

  async create(data: any): Promise<ApiResponse> {
    return request('/obras', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any): Promise<ApiResponse> {
    return request(`/obras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<ApiResponse> {
    return request(`/obras/${id}`, { method: 'DELETE' });
  },

  async getById(id: string): Promise<ApiResponse> {
    return request(`/obras/${id}`, { method: 'GET' });
  },
};

// ============================================
// User API
// ============================================

export const userApi = {
  async list(): Promise<ApiResponse> {
    return request('/users', { method: 'GET' });
  },

  async create(data: any): Promise<ApiResponse> {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any): Promise<ApiResponse> {
    return request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<ApiResponse> {
    return request(`/users/${id}`, { method: 'DELETE' });
  },

  async getMe(): Promise<ApiResponse> {
    return request('/auth/me', { method: 'GET' });
  },
};

// ============================================
// Form API
// ============================================

export const formApi = {
  async save(obraId: string, data: any): Promise<ApiResponse> {
    return request(`/forms/${obraId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async get(obraId: string): Promise<ApiResponse> {
    return request(`/forms/${obraId}`, { method: 'GET' });
  },

  async submitToPreposto(obraId: string): Promise<ApiResponse> {
    return request(`/forms/${obraId}/submit-preposto`, {
      method: 'POST',
    });
  },
};

// ============================================
// Validation API (Public - No Auth)
// ============================================

export const validationApi = {
  async getObraByToken(token: string): Promise<ApiResponse> {
    return request(`/validation/${token}`, {
      method: 'GET',
      requireAuth: false,
    });
  },

  async submitPrepostoReview(token: string, data: any): Promise<ApiResponse> {
    return request(`/validation/${token}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: false,
    });
  },
};