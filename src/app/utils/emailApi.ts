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
 * Erro de envio de email que sinaliza se vale a pena tentar novamente.
 * Erros permanentes (validação, autenticação, 4xx) não devem ser repetidos,
 * tanto para não desperdiçar tentativas quanto para evitar o risco de enviar
 * o mesmo email duas vezes quando o servidor já o processou.
 */
class EmailError extends Error {
  retriable: boolean;
  constructor(message: string, retriable: boolean) {
    super(message);
    this.name = 'EmailError';
    this.retriable = retriable;
  }
}

/**
 * Faz o POST para um endpoint de email com retry apenas em falhas transitórias
 * (rede ou 5xx). Centraliza a lógica compartilhada pelos envios.
 */
async function postEmail(endpoint: string, params: unknown) {
  return retryWithBackoff(
    async () => {
      const accessToken = getAuthToken();
      if (!accessToken) {
        // Falta de autenticação é permanente — não adianta repetir.
        throw new EmailError('Usuário não autenticado', false);
      }

      let response: Response;
      try {
        response = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Token': accessToken,
          },
          body: JSON.stringify(params),
        });
      } catch (networkError: any) {
        // Falha de rede é transitória — vale tentar novamente.
        throw new EmailError(networkError?.message || 'Falha de rede ao enviar email', true);
      }

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        // Resposta sem corpo JSON válido.
      }

      if (!response.ok || !data?.success) {
        const message = data?.error || `Erro ao enviar email (HTTP ${response.status})`;
        // Transitórios (vale repetir): 5xx e 429 (rate limit) / 408 (timeout).
        // Demais 4xx são permanentes.
        const retriable =
          response.status >= 500 || response.status === 429 || response.status === 408;
        throw new EmailError(message, retriable);
      }

      return data;
    },
    3,
    1000,
    true,
    undefined,
    (error) => (error instanceof EmailError ? error.retriable : true),
  );
}

/**
 * Envia email ao preposto com link de conferência do formulário
 */
export async function sendPrepostoConferenciaEmail(params: SendPrepostoEmailParams) {
  try {
    await postEmail('/emails/send-preposto-conferencia', params);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao enviar email ao preposto:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envia email ao administrador notificando sobre assinatura do preposto
 */
export async function sendAdminNotificacaoEmail(params: SendAdminNotificacaoParams) {
  try {
    await postEmail('/emails/send-admin-notificacao', params);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao enviar email ao admin:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envia email ao encarregado notificando sobre nova obra atribuída
 */
export async function sendEncarregadoNovaObraEmail(params: SendEncarregadoNovaObraParams) {
  try {
    await postEmail('/emails/send-encarregado-nova-obra', params);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao enviar email ao encarregado:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Dispara um email de teste para o próprio administrador autenticado.
 * Útil para verificar rapidamente se a integração com o Resend está ativa.
 * Requer que o usuário logado seja administrador (validado no backend).
 */
export async function sendTestEmail() {
  try {
    const data = await postEmail('/emails/test', {});
    return { success: true, message: data?.message };
  } catch (error: any) {
    console.error('❌ Erro ao enviar email de teste:', error);
    return { success: false, error: error.message };
  }
}
