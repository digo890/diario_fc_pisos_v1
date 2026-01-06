import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { setAuthToken } from '../utils/api';
import type { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Criar cliente Supabase
const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper para atualizar token
  const updateToken = (token: string | null) => {
    setAccessTokenState(token);
    setAuthToken(token); // Atualizar token no api.ts
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
          try {
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2/auth/me`,
              {
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                  'X-User-Token': session.access_token,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (response.ok) {
              const { data } = await response.json();
              setCurrentUser(data);
            }
          } catch (error) {
            // Silently fail - user will need to login again
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
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2/auth/me`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'X-User-Token': session.access_token,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            const { data } = await response.json();
            setCurrentUser(data);
          }
        } catch (error) {
          // Silently fail - user will need to login again
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
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading, accessToken }}>
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