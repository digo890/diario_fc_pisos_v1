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

interface SyncStatus {
  isPending: boolean;
  count: number;
  isSyncing: boolean;
  lastSync: Date | null;
  lastError: string | null;
}

export function useSyncQueue() {
  const [status, setStatus] = useState<SyncStatus>({
    isPending: false,
    count: 0,
    isSyncing: false,
    lastSync: null,
    lastError: null,
  });

  const [isOnline, setIsOnline] = useState(true);

  // Atualizar contagem de itens pendentes
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getSyncQueueCount();
      const pending = await hasPendingSyncs();
      
      setStatus(prev => ({
        ...prev,
        count,
        isPending: pending,
      }));
    } catch (error) {
      console.error('Erro ao atualizar contagem de sync:', error);
    }
  }, []);

  // Sincronizar itens da fila com o backend
  const syncWithBackend = useCallback(async () => {
    if (!isOnline) {
      return;
    }

    setStatus(prev => ({ ...prev, isSyncing: true, lastError: null }));

    try {
      const result = await processSyncQueue(async (item) => {
        const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2`;
        
        let endpoint = '';
        let method = 'POST';
        let body: any = null;

        // Determinar endpoint e método baseado no tipo e entidade
        if (item.entity === 'obra') {
          if (item.type === 'create') {
            endpoint = `${baseUrl}/obras`;
            method = 'POST';
            body = item.data;
          } else if (item.type === 'update') {
            endpoint = `${baseUrl}/obras/${item.data.id}`;
            method = 'PUT';
            body = item.data;
          } else if (item.type === 'delete') {
            endpoint = `${baseUrl}/obras/${item.data.id}`;
            method = 'DELETE';
          }
        } else if (item.entity === 'user') {
          if (item.type === 'create') {
            endpoint = `${baseUrl}/users`;
            method = 'POST';
            body = item.data;
          } else if (item.type === 'update') {
            endpoint = `${baseUrl}/users/${item.data.id}`;
            method = 'PUT';
            body = item.data;
          } else if (item.type === 'delete') {
            endpoint = `${baseUrl}/users/${item.data.id}`;
            method = 'DELETE';
          }
        } else if (item.entity === 'formulario') {
          if (item.type === 'create' || item.type === 'update') {
            endpoint = `${baseUrl}/formularios`;
            method = 'POST';
            body = item.data;
          }
        }

        if (!endpoint) {
          throw new Error(`Endpoint não definido para ${item.entity} ${item.type}`);
        }

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: body ? JSON.stringify(body) : null,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `Erro HTTP ${response.status}`);
        }

        console.log(`✅ Item sincronizado: ${item.entity} ${item.type}`);
      });

      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date(),
        lastError: result.failed > 0 ? `${result.failed} itens falharam` : null,
      }));

      await updatePendingCount();

      if (result.success > 0) {
        console.log(`✅ ${result.success} itens sincronizados com sucesso`);
      }
    } catch (error: any) {
      console.error('❌ Erro ao sincronizar:', error);
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastError: error.message || 'Erro desconhecido',
      }));
    }
  }, [isOnline, updatePendingCount]);

  // Detectar mudanças no status online/offline
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conexão restaurada.');
      setIsOnline(true);
      setTimeout(() => {
        syncWithBackend();
      }, 1000);
    };

    const handleOffline = () => {
      console.log('📡 Conexão perdida. Modo offline ativado.');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncWithBackend]);

  // Atualizar contagem periodicamente
  useEffect(() => {
    updatePendingCount();

    const interval = setInterval(() => {
      updatePendingCount();
    }, 10000); // Atualizar a cada 10 segundos

    return () => clearInterval(interval);
  }, [updatePendingCount]);

  // Sincronizar automaticamente quando voltar online
  useEffect(() => {
    if (isOnline && status.isPending && !status.isSyncing) {
      syncWithBackend();
    }
  }, [isOnline, status.isPending, status.isSyncing, syncWithBackend]);

  return {
    ...status,
    isOnline,
    sync: syncWithBackend,
    updateCount: updatePendingCount,
  };
}
