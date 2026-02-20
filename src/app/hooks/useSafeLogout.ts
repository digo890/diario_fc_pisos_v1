/**
 * 🔒 CORREÇÃO #7: Hook para Logout Seguro
 *
 * Verifica se há dados pendentes de sincronização antes de fazer logout
 * Protege contra perda silenciosa de dados
 *
 * @version 1.1.0
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { syncQueue } from '../utils/syncQueue';
import { safeLog } from '../utils/logSanitizer';

export function useSafeLogout() {
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  /**
   * Tenta fazer logout, verifica dados pendentes primeiro
   */
  const handleLogout = async () => {
    try {
      // Verificar se há dados pendentes na fila de sincronização
      const count = await syncQueue.getPendingCount();

      if (count > 0) {
        // Tem dados pendentes - mostrar confirmação
        safeLog(`⚠️ Logout bloqueado: ${count} operação(ões) pendente(s)`);
        setPendingCount(count);
        setShowLogoutConfirm(true);
      } else {
        // Sem dados pendentes - logout direto
        safeLog('✅ Logout seguro: sem dados pendentes');
        await logout();
      }
    } catch (error) {
      // Se falhar ao verificar, fazer logout mesmo assim (não bloquear)
      safeLog('⚠️ Erro ao verificar dados pendentes, fazendo logout...', error);
      await logout();
    }
  };

  /**
   * Força logout mesmo com dados pendentes
   */
  const forceLogout = async () => {
    safeLog(`⚠️ Logout forçado com ${pendingCount} operação(ões) pendente(s)`);
    setShowLogoutConfirm(false);
    await logout();
  };

  /**
   * Cancela logout
   */
  const cancelLogout = () => {
    safeLog('✅ Logout cancelado pelo usuário');
    setShowLogoutConfirm(false);
  };

  return {
    handleLogout,
    forceLogout,
    cancelLogout,
    showLogoutConfirm,
    pendingCount,
  };
}
