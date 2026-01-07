import { useState, useEffect, useRef } from 'react';
import { getUsers } from '../utils/database';
import type { User } from '../types';

/**
 * 🚀 PERFORMANCE: Hook com cache em memória para usuários
 * 
 * Evita múltiplas queries ao IndexedDB mantendo os dados em memória
 * TTL (Time To Live) de 5 minutos - após isso, recarrega automaticamente
 */

interface CacheEntry {
  data: User[];
  timestamp: number;
}

// Cache global compartilhado entre todas as instâncias do hook
let globalCache: CacheEntry | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export const useUsersCache = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadUsers();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadUsers = async () => {
    // Verificar se o cache está válido
    const now = Date.now();
    if (globalCache && (now - globalCache.timestamp) < CACHE_TTL) {
      // Cache válido - usar dados em memória
      setUsers(globalCache.data);
      setLoading(false);
      return;
    }

    // Cache inválido ou não existe - buscar do IndexedDB
    try {
      const usersData = await getUsers();
      
      if (isMounted.current) {
        setUsers(usersData);
        setLoading(false);
        
        // Atualizar cache global
        globalCache = {
          data: usersData,
          timestamp: now
        };
      }
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      if (isMounted.current) {
        setUsers([]);
        setLoading(false);
      }
    }
  };

  // Função para forçar recarregamento (útil após criar/editar/deletar usuário)
  const refreshUsers = async () => {
    globalCache = null; // Invalidar cache
    setLoading(true);
    await loadUsers();
  };

  // Função helper para buscar usuário por ID (usa cache em memória)
  const getUserById = (id: string): User | undefined => {
    return users.find(u => u.id === id);
  };

  // Função helper para buscar nome do usuário
  const getUserName = (id: string): string => {
    const user = getUserById(id);
    return user?.nome || 'N/A';
  };

  return {
    users,
    loading,
    refreshUsers,
    getUserById,
    getUserName
  };
};

// Função utilitária para invalidar o cache manualmente (útil após operações CRUD)
export const invalidateUsersCache = () => {
  globalCache = null;
};
