import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { getConfig, saveConfig, getUserById } from '../utils/database';

interface AuthContextType {
  currentUser: User | null;
  login: (userId: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário logado
    const loadUser = async () => {
      try {
        const userId = await getConfig('currentUserId');
        if (userId) {
          const user = await getUserById(userId);
          if (user) {
            setCurrentUser(user);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (userId: string) => {
    const user = await getUserById(userId);
    if (user) {
      setCurrentUser(user);
      await saveConfig('currentUserId', userId);
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    await saveConfig('currentUserId', null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading }}>
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
