/**
 * 🔐 Session Check Hook
 * 
 * Verifica se a sessão do usuário ainda é válida antes de ações críticas.
 * Não tenta "prever" expiração - apenas detecta e reage.
 */

import { useState } from 'react';
import { supabase } from '/utils/supabase/client';
import { safeLog, safeWarn } from '../utils/logSanitizer';

interface SessionCheckResult {
  isValid: boolean;
  message?: string;
}

export function useSessionCheck() {
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Verifica se sessão é válida
   * Retorna: { isValid: boolean, message?: string }
   */
  const checkSession = async (): Promise<SessionCheckResult> => {
    setIsChecking(true);
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        safeWarn('⚠️ Erro ao verificar sessão:', error);
        return {
          isValid: false,
          message: 'Erro ao verificar sessão. Tente fazer login novamente.'
        };
      }
      
      if (!session) {
        safeWarn('⚠️ Sessão expirada ou inválida');
        return {
          isValid: false,
          message: 'Sua sessão expirou. Faça login novamente para continuar. Seus dados estão salvos.'
        };
      }
      
      safeLog('✅ Sessão válida');
      return { isValid: true };
      
    } catch (error) {
      safeWarn('⚠️ Exceção ao verificar sessão:', error);
      return {
        isValid: false,
        message: 'Não foi possível verificar sua sessão. Tente fazer login novamente.'
      };
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkSession,
    isChecking
  };
}