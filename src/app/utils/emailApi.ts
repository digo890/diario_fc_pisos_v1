import { projectId, publicAnonKey } from '/utils/supabase/info';
import { getAuthToken } from './api';
import { retryWithBackoff } from './retryHelper';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2`;

interface SendPrepostoEmailParams {
  prepostoEmail: string;
  prepostoNome: string;
  formularioId: string; // ✅ CORRIGIDO: Era obraId
  obraNome: string;
  cliente: string;
  cidade: string;
  encarregadoNome: string;
}

interface SendAdminNotificacaoParams {
  adminEmail: string;
  adminNome: string;
  obraNome: string;
  cliente: string;
  prepostoNome: string;
  aprovado: boolean;
}

interface SendEncarregadoNovaObraParams {
  encarregadoEmail: string;
  encarregadoNome: string;
  obraNome: string;
  cliente: string;
  cidade: string;
  prepostoNome: string;
  obraId: string; // Adicionado para deep linking
}

/**
 * Envia email ao preposto com link de conferência do formulário
 */
export async function sendPrepostoConferenciaEmail(params: SendPrepostoEmailParams) {
  try {
    // ✅ CORREÇÃO: Usar retry automático em envio de email
    const result = await retryWithBackoff(async () => {
      const accessToken = getAuthToken();
      if (!accessToken) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await fetch(`${API_URL}/emails/send-preposto-conferencia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-User-Token': accessToken,
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro ao enviar email');
      }

      return data;
    });

    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao enviar email ao preposto após 3 tentativas:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envia email ao administrador notificando sobre assinatura do preposto
 */
export async function sendAdminNotificacaoEmail(params: SendAdminNotificacaoParams) {
  try {
    // ✅ CORREÇÃO: Usar retry automático em envio de email
    await retryWithBackoff(async () => {
      const accessToken = getAuthToken();
      if (!accessToken) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await fetch(`${API_URL}/emails/send-admin-notificacao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-User-Token': accessToken,
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro ao enviar email');
      }

      return data;
    });

    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao enviar email ao admin após 3 tentativas:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envia email ao encarregado notificando sobre nova obra atribuída
 */
export async function sendEncarregadoNovaObraEmail(params: SendEncarregadoNovaObraParams) {
  try {
    // ✅ CORREÇÃO: Usar retry automático em envio de email
    await retryWithBackoff(async () => {
      const accessToken = getAuthToken();
      if (!accessToken) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await fetch(`${API_URL}/emails/send-encarregado-nova-obra`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-User-Token': accessToken,
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro ao enviar email');
      }

      return data;
    });

    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao enviar email ao encarregado após 3 tentativas:', error);
    return { success: false, error: error.message };
  }
}
