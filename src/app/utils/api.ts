// ============================================
// API Service - Integração com Backend
// ============================================

import { projectId, publicAnonKey } from '/utils/supabase/info';
import { supabase } from '/utils/supabase/client';
import { reportProductionError } from './productionMonitor'; // 🚨 MONITOR DE PRODUÇÃO

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
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error || !session?.access_token) {
        this.clearToken();
        this.isRefreshing = false;
        
        // Notificar assinantes sobre falha
        this.refreshSubscribers.forEach((callback) => callback(''));
        this.refreshSubscribers = [];
        
        return null;
      }

      const newToken = session.access_token;
      this.setToken(newToken);

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

  // Construir headers dinamicamente
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  // ✅ CORREÇÃO: Apenas enviar Authorization se for requisição autenticada
  // Para rotas públicas (preposto), não enviar nenhum token
  if (requireAuth) {
    console.log('🔐 [API] Requisição AUTENTICADA:', endpoint);
    // Sempre enviar publicAnonKey no Authorization para passar pelo CORS
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
    
    // Adicionar token de usuário se disponível
    const accessToken = tokenManager.getToken();
    if (accessToken) {
      headers['X-User-Token'] = accessToken;
      console.log('✅ [API] Token de usuário adicionado ao header X-User-Token');
    } else {
      console.warn('⚠️ [API] Token não disponível para requisição autenticada');
    }
  } else {
    // 🔍 DEBUG: Confirmar que não está enviando auth em rotas públicas
    console.log('='.repeat(80));
    console.log('🌐 [API] REQUISIÇÃO PÚBLICA (SEM AUTH)');
    console.log('📍 Endpoint:', endpoint);
    console.log('📍 URL completa:', url);
    console.log('📍 Headers que SERÃO enviados:', headers);
    console.log('='.repeat(80));
  }

  try {
    console.log('📤 [API] Enviando requisição para:', url);
    console.log('📤 [API] Método:', fetchOptions.method || 'GET');
    console.log('📤 [API] Headers finais:', headers);
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    console.log('📥 [API] Resposta recebida - Status:', response.status);

    // Se 401 e ainda não tentou renovar, renovar token e tentar novamente
    if (response.status === 401 && requireAuth && retryCount === 0) {
      console.warn('⚠️ [API] Token inválido (401), tentando renovar...');
      
      // 🚨 MONITOR: Reportar erro de autenticação
      reportProductionError(
        new Error('Token inválido ou expirado (401)'),
        {
          url,
          method: fetchOptions.method || 'GET',
          statusCode: 401
        }
      );
      
      const newToken = await tokenManager.refreshToken();
      
      if (newToken) {
        console.log('✅ [API] Token renovado, tentando requisição novamente...');
        // Tentar novamente com novo token (retryCount = 1 para evitar loop infinito)
        return request<T>(endpoint, options, retryCount + 1);
      } else {
        console.error('❌ [API] Falha ao renovar token, redirecionando para login...');
        // Se falhar ao renovar, forçar logout
        window.location.href = '/';
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
    }

    const data = await response.json();

    if (!response.ok) {
      // 🚨 MONITOR: Reportar erro HTTP
      const errorMsg = data.error || `HTTP error! status: ${response.status}`;
      reportProductionError(
        new Error(errorMsg),
        {
          url,
          method: fetchOptions.method || 'GET',
          statusCode: response.status,
          responseBody: JSON.stringify(data).substring(0, 500)
        }
      );
      throw new Error(errorMsg);
    }

    return data;
  } catch (error: any) {
    console.error(`❌ Erro na requisição ${endpoint}:`, error.message || error);
    
    // 🚨 MONITOR: Reportar qualquer erro não tratado
    reportProductionError(error, {
      url,
      method: fetchOptions.method || 'GET',
      endpoint
    });
    
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
// Formulário API (Backend Real)
// ============================================

export const formularioApi = {
  async list(): Promise<ApiResponse> {
    return request('/formularios', { method: 'GET' });
  },

  async create(data: any): Promise<ApiResponse> {
    return request('/formularios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any): Promise<ApiResponse> {
    return request(`/formularios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<ApiResponse> {
    return request(`/formularios/${id}`, { method: 'DELETE' });
  },

  async getById(id: string): Promise<ApiResponse> {
    return request(`/formularios/${id}`, { method: 'GET' });
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

  // ✅ CORREÇÃO: Rota correta para buscar FORMULÁRIO por token
  async getByToken(token: string): Promise<ApiResponse> {
    return request(`/validation/${token}/formulario`, { 
      method: 'GET',
      requireAuth: false // Rota pública para preposto
    });
  },
};