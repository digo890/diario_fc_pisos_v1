/**
 * 🔄 Hook para monitorar status da fila de sincronização
 */

import { useState, useEffect } from 'react';
import { syncQueue } from '../utils/syncQueue';

export interface SyncStatus {
  pendingCount: number;
  failedCount: number;
  isOnline: boolean;
  hasPendingOperations: boolean;
}

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    pendingCount: 0,
    failedCount: 0,
    isOnline: navigator.onLine,
    hasPendingOperations: false
  });

  const updateStatus = async () => {
    const pendingCount = await syncQueue.getPendingCount();
    const failedCount = await syncQueue.getFailedCount();

    setStatus({
      pendingCount,
      failedCount,
      isOnline: navigator.onLine,
      hasPendingOperations: pendingCount > 0 || failedCount > 0
    });
  };

  useEffect(() => {
    // Inicializar
    updateStatus();

    // Listener de mudanças na fila
    const unsubscribe = syncQueue.addListener(() => {
      updateStatus();
    });

    // Listeners de conectividade
    const handleOnline = () => {
      updateStatus();
    };

    const handleOffline = () => {
      updateStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const retryFailed = async () => {
    await syncQueue.retryFailedItems();
  };

  const processPending = async () => {
    await syncQueue.processQueue();
  };

  return {
    ...status,
    retryFailed,
    processPending
  };
}
