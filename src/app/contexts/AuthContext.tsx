import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '/utils/supabase/client';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { setAuthToken } from '../utils/api';
import { safeLog, safeError } from '../utils/logSanitizer';
import type { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  accessToken: string | null;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper para atualizar token
  const updateToken = (token: string | null) => {
    setAccessTokenState(token);
    setAuthToken(token); // Atualizar token no api.ts
    
    if (token) {
      safeLog('✅ Token atualizado com sucesso');
    }
  };

  // Função para renovar sessão
  const refreshSession = async () => {
    try {
      safeLog('🔄 Renovando sessão...');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        safeError('❌ Erro ao renovar sessão:', error.message);
        // Se falhar ao renovar, fazer logout
        await logout();
        return;
      }

      if (session?.access_token) {
        safeLog('✅ Sessão renovada com sucesso');
        updateToken(session.access_token);
        
        // Agendar próxima renovação (50 minutos - token expira em 1h)
        scheduleTokenRefresh();
      }
    } catch (error) {
      safeError('❌ Erro ao renovar sessão:', error);
    }
  };

  // Agendar renovação preventiva do token
  const scheduleTokenRefresh = () => {
    // Limpar timeout anterior se existir
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // ✅ CORREÇÃO: Renovar a cada 45 minutos (token expira em 1h)
    // Isso garante renovação preventiva antes da expiração
    refreshTimeoutRef.current = setTimeout(() => {
      safeLog('⏰ Renovação preventiva de token agendada');
      refreshSession();
    }, 45 * 60 * 1000); // 45 minutos
  };

  // Função para buscar dados do usuário
  const fetchUserData = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2/auth/me`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        safeError('❌ Erro ao buscar dados do usuário:', errorText);
        return null;
      }

      const { data } = await response.json();
      return data;
    } catch (error) {
      safeError('❌ Erro ao buscar dados do usuário:', error);
      return null;
    }
  };

  useEffect(() => {
    // Verificar se há sessão ativa
    const loadSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setIsLoading(false);
          return;
        }

        if (session?.access_token) {
          updateToken(session.access_token);
          
          // Buscar dados do usuário
          const userData = await fetchUserData(session.access_token);
          if (userData) {
            setCurrentUser(userData);
          }
        }
      } catch (error) {
        // Silently fail - user will need to login again
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        updateToken(null);
      } else if (session?.access_token) {
        updateToken(session.access_token);
        
        // Buscar dados do usuário
        const userData = await fetchUserData(session.access_token);
        if (userData) {
          setCurrentUser(userData);
          // ✅ CORREÇÃO: Agendar renovação preventiva
          scheduleTokenRefresh();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Traduzir mensagens de erro comuns
        if (error.message === 'Invalid login credentials') {
          throw new Error('Email ou senha inválidos');
        }
        throw new Error(error.message);
      }

      if (data.session?.access_token) {
        updateToken(data.session.access_token);
        
        // Buscar dados do usuário
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2/auth/me`;
        
        const headers = {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-User-Token': data.session.access_token,
          'Content-Type': 'application/json',
        };
        
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          const errorText = await response.text();
          
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || 'Erro ao buscar dados do usuário');
          } catch {
            throw new Error('Erro ao buscar dados do usuário');
          }
        }

        const responseText = await response.text();
        const { data: userData } = JSON.parse(responseText);
        setCurrentUser(userData);
      } else {
        throw new Error('Sessão não criada');
      }
    } catch (err: any) {
      throw err;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    updateToken(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading, accessToken, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

// ============================================
// Fast Refresh - Garantir compatibilidade
// ============================================

// Marcar componentes para preservação durante Fast Refresh
if (import.meta.hot) {
  import.meta.hot.accept();
}

// Adicionar display name para melhor debugging
AuthProvider.displayName = 'AuthProvider';
AuthContext.displayName = 'AuthContext';