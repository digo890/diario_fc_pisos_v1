// ============================================
// Hook de Sincronização - IndexedDB ↔ Supabase
// ============================================

import { useEffect, useState } from 'react';
import { userApi, obraApi, formularioApi } from '../utils/api';
import * as db from '../utils/database';

interface UseSyncDataProps {
  accessToken: string | null;
  enabled?: boolean;
}

export function useSyncData({ accessToken, enabled = true }: UseSyncDataProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar dados locais com a nuvem
  const syncToCloud = async () => {
    if (!navigator.onLine) {
      console.log('📴 Offline - sincronização adiada');
      return;
    }

    if (!accessToken) {
      console.log('🔐 Sem token de autenticação - sincronização bloqueada');
      return;
    }

    try {
      setIsSyncing(true);
      setError(null);

      console.log('☁️ Iniciando sincronização com a nuvem...');

      // 1. Sincronizar usuários
      const localUsers = await db.getUsers();
      for (const user of localUsers) {
        try {
          if (user.syncStatus === 'pending') {
            await userApi.create(user);
            await db.saveUser({ ...user, syncStatus: 'synced' });
          }
        } catch (err) {
          console.error('Erro ao sincronizar usuário:', err);
        }
      }

      // 2. Sincronizar obras
      const localObras = await db.getObras();
      for (const obra of localObras) {
        try {
          if (obra.syncStatus === 'pending') {
            await obraApi.create(obra);
            await db.saveObra({ ...obra, syncStatus: 'synced' });
          }
        } catch (err) {
          console.error('Erro ao sincronizar obra:', err);
        }
      }

      // 3. Sincronizar formulários
      const localFormularios = await db.getObras(); // Formulários estão vinculados às obras
      for (const obra of localFormularios) {
        try {
          const formulario = await db.getFormByObraId(obra.id);
          if (formulario && formulario.syncStatus === 'pending') {
            await formularioApi.create(formulario);
            await db.saveForm({ ...formulario, syncStatus: 'synced' });
          }
        } catch (err) {
          console.error('Erro ao sincronizar formulário:', err);
        }
      }

      setLastSync(new Date());
      console.log('✅ Sincronização concluída!');
    } catch (err: any) {
      console.error('❌ Erro na sincronização:', err);
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Baixar dados da nuvem
  const syncFromCloud = async () => {
    if (!navigator.onLine) {
      console.log('📴 Offline - usando dados locais');
      return;
    }

    if (!accessToken) {
      console.log('🔐 Sem token de autenticação - sincronização bloqueada');
      return;
    }

    try {
      setIsSyncing(true);
      setError(null);

      console.log('⬇️ Baixando dados da nuvem...');

      // 1. Baixar usuários
      const { data: cloudUsers } = await userApi.list();
      if (cloudUsers && Array.isArray(cloudUsers)) {
        for (const user of cloudUsers) {
          const existingUser = await db.getUserById(user.id);
          if (!existingUser) {
            await db.saveUser({ ...user, syncStatus: 'synced' });
          }
        }
      }

      // 2. Baixar obras
      const { data: cloudObras } = await obraApi.list();
      if (cloudObras && Array.isArray(cloudObras)) {
        for (const obra of cloudObras) {
          const existingObra = await db.getObraById(obra.id);
          if (!existingObra) {
            await db.saveObra({ ...obra, syncStatus: 'synced' });
          }
        }
      }

      // 3. Baixar formulários
      const { data: cloudFormularios } = await formularioApi.list();
      if (cloudFormularios && Array.isArray(cloudFormularios)) {
        for (const formulario of cloudFormularios) {
          const existingFormulario = await db.getFormByObraId(formulario.obraId);
          if (!existingFormulario) {
            await db.saveForm({ ...formulario, syncStatus: 'synced' });
          }
        }
      }

      setLastSync(new Date());
      console.log('✅ Download concluído!');
    } catch (err: any) {
      console.error('❌ Erro ao baixar dados:', err);
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sincronização bidirecional
  const sync = async () => {
    await syncToCloud();
    await syncFromCloud();
  };

  // Auto-sync quando voltar online
  useEffect(() => {
    if (!enabled || !accessToken) return;

    const handleOnline = () => {
      console.log('🌐 Conexão restaurada - sincronizando...');
      syncToCloud();
      syncFromCloud();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, enabled]);

  // Auto-sync inicial (só quando autenticado)
  useEffect(() => {
    if (enabled && accessToken && navigator.onLine) {
      console.log('🔄 Executando sincronização inicial (usuário autenticado)');
      syncToCloud();
      syncFromCloud();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, enabled]);

  return {
    isSyncing,
    lastSync,
    error,
    sync,
    syncToCloud,
    syncFromCloud,
  };
}