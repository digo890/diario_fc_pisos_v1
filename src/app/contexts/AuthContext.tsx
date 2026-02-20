import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '/utils/supabase/client';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { setAuthToken } from '../utils/api';
import { getUserById } from '../utils/database';
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
  // Ref para armazenar a promise de fetchUserData em andamento (Deduplicação)
  const fetchUserPromiseRef = useRef<{ token: string; promise: Promise<User | null> } | null>(null);

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

      // ✅ CORREÇÃO: Verificar se há sessão antes de tentar renovar
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) {
        safeLog('⚠️ Nenhuma sessão ativa para renovar. Usuário precisa fazer login novamente.');
        return;
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();

      if (error) {
        safeError('❌ Erro ao renovar sessão:', error.message);

        // ✅ CORREÇÃO: Só fazer logout se o erro for crítico (não Auth session missing)
        if (error.message !== 'Auth session missing!') {
          // Se falhar ao renovar, fazer logout
          await logout();
        }
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
    refreshTimeoutRef.current = setTimeout(
      async () => {
        safeLog('⏰ Renovação preventiva de token agendada');

        // ✅ VERIFICAR: Confirmar que ainda há sessão ativa antes de renovar
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          refreshSession();
        } else {
          safeLog('⚠️ Renovação cancelada - sem sessão ativa');
        }
      },
      45 * 60 * 1000
    ); // 45 minutos
  };

  // Função para buscar dados do usuário
  const fetchUserData = async (token: string): Promise<User | null> => {
    // 🚀 OTIMIZAÇÃO: In-flight Promise De-duplication por Token
    // Só reutiliza se for exatamente o mesmo token
    if (fetchUserPromiseRef.current && fetchUserPromiseRef.current.token === token) {
      safeLog('🔄 Reutilizando requisição /me em andamento...');
      return fetchUserPromiseRef.current.promise;
    }

    const fetchPromise = (async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              'X-User-Token': token,
              // 'Content-Type': 'application/json', // ❌ REMOVIDO: Evitar preflight em GET
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          safeError('❌ Erro ao buscar dados do usuário:', errorText);
          return null; // Non-200 responses are NOT treated as offline
        }

        const { data } = await response.json();
        return data;
      } catch (error) {
        // 🚨 CRITICAL FIX: Offline Fallback
        // If network fails, try to load user from local cache using ID from token
        try {
          // Decode JWT payload (part 2) to get 'sub' (User ID)
          // Format: header.payload.signature
          const payloadBase64 = token.split('.')[1];
          if (payloadBase64) {
            const payloadJson = atob(payloadBase64);
            const payload = JSON.parse(payloadJson);
            const userId = payload.sub;

            if (userId) {
              const cachedUser = await getUserById(userId);
              if (cachedUser) {
                // Return cached user silently (no new logging as requested)
                return cachedUser;
              }
            }
          }
        } catch (decodeError) {
          // Ignore decoding errors, fall through to main error handling
        }

        safeError('❌ Erro ao buscar dados do usuário (Network):', error);
        return null;
      } finally {
        // Limpar a referência APENAS se for a mesma promise que iniciou
        // (embora na prática seja sempre a mesma ref para o mesmo token)
        if (fetchUserPromiseRef.current?.token === token) {
          fetchUserPromiseRef.current = null;
        }
      }
    })();

    // Armazenar a promise e token na ref
    fetchUserPromiseRef.current = { token, promise: fetchPromise };

    return fetchPromise;
  };

  useEffect(() => {
    // Verificar se há sessão ativa
    const loadSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

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
            // ✅ CORREÇÃO: Agendar renovação preventiva ao carregar sessão existente
            scheduleTokenRefresh();
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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
      // 🆕 CORREÇÃO: Limpar timeout antes de desinscrever para evitar memory leak
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

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
          Authorization: `Bearer ${publicAnonKey}`,
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

        // ✅ CORREÇÃO: Agendar renovação preventiva após login
        scheduleTokenRefresh();
      } else {
        throw new Error('Sessão não criada');
      }
    } catch (err: any) {
      throw err;
    }
  };

  const logout = async () => {
    // 🆕 CORREÇÃO URGENTE #3: Limpar timeout de refresh ao fazer logout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    await supabase.auth.signOut();
    setCurrentUser(null);
    updateToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, login, logout, isLoading, accessToken, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  // Durante HMR (Hot Module Replacement), o context pode estar temporariamente undefined
  // Retornar valores padrão em vez de quebrar a aplicação
  if (!context) {
    // ⚠️ Em desenvolvimento, o HMR pode causar re-renderizações antes do Provider estar pronto
    if (import.meta.env.DEV) {
      // 🔧 SILENCIAR: Este warning é esperado durante HMR e não é um erro real
      // Apenas logar em modo debug se necessário
      if (import.meta.env.VITE_DEBUG_AUTH === 'true') {
        console.debug('🔄 useAuth: aguardando AuthProvider (HMR reload)');
      }

      // Retornar valores padrão seguros durante HMR
      return {
        currentUser: null,
        login: async () => {
          throw new Error('AuthProvider não inicializado');
        },
        logout: async () => {},
        isLoading: true,
        accessToken: null,
        refreshSession: async () => {},
      };
    }

    // Em produção, lançar erro
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
