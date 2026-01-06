/**
 * Hook React para gerenciar sincronização offline
 * Fornece estado e funções para sincronização automática
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getSyncQueueCount,
  processSyncQueue,
  hasPendingSyncs,
} from '../utils/syncQueue';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface UseSyncQueueReturn {
  isPending: boolean;
  count: number;
  isSyncing: boolean;
  isOnline: boolean;
  lastError: string | null;
  sync: () => Promise<void>;
}

export function useSyncQueue(): UseSyncQueueReturn {
  const [isPending, setIsPending] = useState(false);
  const [count, setCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastError, setLastError] = useState<string | null>(null);

  // Atualizar estado de rede
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Verificar fila de sincronização
  const checkQueue = useCallback(async () => {
    try {
      const pending = await hasPendingSyncs();
      const queueCount = await getSyncQueueCount();
      
      setIsPending(pending);
      setCount(queueCount);
    } catch (error) {
      console.error('Erro ao verificar fila de sincronização:', error);
    }
  }, []);

  // Sincronizar fila
  const sync = useCallback(async () => {
    if (isSyncing || !isOnline) return;

    try {
      setIsSyncing(true);
      setLastError(null);

      await processSyncQueue(
        `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2`,
        publicAnonKey
      );

      await checkQueue();
    } catch (error: any) {
      console.error('Erro ao sincronizar:', error);
      setLastError(error.message || 'Erro ao sincronizar');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline, checkQueue]);

  // Verificar fila periodicamente
  useEffect(() => {
    checkQueue();

    const interval = setInterval(checkQueue, 10000); // A cada 10 segundos

    return () => clearInterval(interval);
  }, [checkQueue]);

  // Sincronizar automaticamente quando ficar online
  useEffect(() => {
    if (isOnline && isPending && !isSyncing) {
      sync();
    }
  }, [isOnline, isPending, isSyncing, sync]);

  return {
    isPending,
    count,
    isSyncing,
    isOnline,
    lastError,
    sync,
  };
}
