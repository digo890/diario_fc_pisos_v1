import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-1ff231a2`;

interface SendPrepostoEmailParams {
  prepostoEmail: string;
  prepostoNome: string;
  obraId: string;
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
    console.log('📧 Enviando email ao preposto:', params.prepostoEmail);
    
    const response = await fetch(`${API_URL}/emails/send-preposto-conferencia`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro ao enviar email');
    }

    console.log('✅ Email enviado ao preposto com sucesso');
    return { success: true, link: data.link };
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
    console.log('📧 Enviando email ao admin:', params.adminEmail);
    
    const response = await fetch(`${API_URL}/emails/send-admin-notificacao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro ao enviar email');
    }

    console.log('✅ Email enviado ao admin com sucesso');
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
    console.log('📧 Enviando email ao encarregado:', params.encarregadoEmail);
    
    const response = await fetch(`${API_URL}/emails/send-encarregado-nova-obra`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro ao enviar email');
    }

    console.log('✅ Email enviado ao encarregado com sucesso');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao enviar email ao encarregado:', error);
    return { success: false, error: error.message };
  }
}