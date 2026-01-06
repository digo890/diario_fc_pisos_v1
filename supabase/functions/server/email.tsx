import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Configure aqui o domínio do seu email
// Se você não verificou domínio ainda, use: 'onboarding@resend.dev'
const FROM_EMAIL = 'onboarding@resend.dev'; // Altere para 'FC Pisos <noreply@seudominio.com.br>' depois

// Email para desenvolvimento/testes (variável de ambiente)
// Configure DEV_TEST_EMAIL nas variáveis de ambiente do Supabase se precisar redirecionar emails em dev
const DEV_TEST_EMAIL = Deno.env.get('DEV_TEST_EMAIL');

// Detecta se estamos em modo de desenvolvimento (sem domínio verificado)
const isDevelopmentMode = FROM_EMAIL === 'onboarding@resend.dev';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    // Em modo de desenvolvimento, só redireciona se DEV_TEST_EMAIL estiver configurado
    const actualTo = (isDevelopmentMode && DEV_TEST_EMAIL) ? DEV_TEST_EMAIL : to;
    const actualSubject = (isDevelopmentMode && DEV_TEST_EMAIL)
      ? `[TESTE - Destinatário: ${to}] ${subject}`
      : subject;
    
    console.log('📧 Enviando email...');
    console.log('📍 Modo:', isDevelopmentMode ? 'DESENVOLVIMENTO' : 'PRODUÇÃO');
    console.log('👤 Destinatário original:', to);
    console.log('📬 Destinatário real:', actualTo);
    console.log('📝 Assunto:', actualSubject);
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: actualTo,
      subject: actualSubject,
      html,
    });

    if (error) {
      console.error('❌ Erro ao enviar email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email enviado com sucesso:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Erro ao enviar email:', error);
    return { success: false, error: error.message };
  }
}

// Template de email para o preposto conferir o formulário
export function getPrepostoConferenciaEmail(
  prepostoNome: string,
  obraNome: string,
  cliente: string,
  cidade: string,
  encarregadoNome: string,
  linkConferencia: string
): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conferência de Formulário - FC Pisos</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #EDEFE4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #EDEFE4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FD5521 0%, #E54A1D 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                FC Pisos
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Diário de Obras
              </p>
            </td>
          </tr>
          
          <!-- Corpo -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1F2937; font-size: 24px; font-weight: 600;">
                Olá ${prepostoNome},
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4B5563; font-size: 16px; line-height: 1.6;">
                O formulário da obra <strong style="color: #1F2937;">${obraNome}</strong> foi preenchido pelo encarregado <strong style="color: #1F2937;">${encarregadoNome}</strong> e está aguardando sua conferência e assinatura.
              </p>
              
              <!-- Card com informações da obra -->
              <div style="background-color: #F9FAFB; border-left: 4px solid #FD5521; padding: 20px; margin: 25px 0; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px; font-weight: 500;">
                  DETALHES DA OBRA
                </p>
                <p style="margin: 8px 0; color: #1F2937; font-size: 15px;">
                  <strong>Cliente:</strong> ${cliente}
                </p>
                <p style="margin: 8px 0; color: #1F2937; font-size: 15px;">
                  <strong>Obra:</strong> ${obraNome}
                </p>
                <p style="margin: 8px 0; color: #1F2937; font-size: 15px;">
                  <strong>Cidade:</strong> ${cidade}
                </p>
                <p style="margin: 8px 0; color: #1F2937; font-size: 15px;">
                  <strong>Encarregado:</strong> ${encarregadoNome}
                </p>
              </div>
              
              <p style="margin: 25px 0 30px 0; color: #4B5563; font-size: 16px; line-height: 1.6;">
                Clique no botão abaixo para acessar o formulário, conferir as informações e assinar digitalmente:
              </p>
              
              <!-- Botão -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="${linkConferencia}" 
                       style="display: inline-block; background-color: #FD5521; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(253, 85, 33, 0.3);">
                      Acessar Formulário
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                Ou copie e cole o link abaixo no seu navegador:
              </p>
              <p style="margin: 8px 0 0 0; color: #FD5521; font-size: 13px; word-break: break-all;">
                ${linkConferencia}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">
                Atenciosamente,<br>
                <strong style="color: #1F2937;">Equipe FC Pisos</strong>
              </p>
              <p style="margin: 20px 0 0 0; color: #9CA3AF; font-size: 12px;">
                Este é um email automático, por favor não responda.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Template de email notificando administrador sobre assinatura do preposto
export function getAdminNotificacaoAssinaturaEmail(
  adminNome: string,
  obraNome: string,
  cliente: string,
  prepostoNome: string,
  aprovado: boolean
): string {
  const statusText = aprovado ? 'aprovado' : 'reprovado';
  const statusColor = aprovado ? '#10B981' : '#EF4444';
  const emoji = aprovado ? '✅' : '❌';
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Formulário ${statusText.charAt(0).toUpperCase() + statusText.slice(1)} - FC Pisos</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #EDEFE4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #EDEFE4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FD5521 0%, #E54A1D 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                FC Pisos
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Diário de Obras
              </p>
            </td>
          </tr>
          
          <!-- Corpo -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1F2937; font-size: 24px; font-weight: 600;">
                Olá ${adminNome},
              </h2>
              
              <!-- Badge de status -->
              <div style="text-align: center; margin: 25px 0;">
                <span style="display: inline-block; background-color: ${statusColor}; color: #ffffff; padding: 12px 24px; border-radius: 20px; font-size: 18px; font-weight: 600;">
                  ${emoji} Formulário ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}
                </span>
              </div>
              
              <p style="margin: 20px 0; color: #4B5563; font-size: 16px; line-height: 1.6; text-align: center;">
                O preposto <strong style="color: #1F2937;">${prepostoNome}</strong> ${statusText} o formulário da obra <strong style="color: #1F2937;">${obraNome}</strong>.
              </p>
              
              <!-- Card com informações da obra -->
              <div style="background-color: #F9FAFB; border-left: 4px solid ${statusColor}; padding: 20px; margin: 25px 0; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px; font-weight: 500;">
                  DETALHES DA OBRA
                </p>
                <p style="margin: 8px 0; color: #1F2937; font-size: 15px;">
                  <strong>Cliente:</strong> ${cliente}
                </p>
                <p style="margin: 8px 0; color: #1F2937; font-size: 15px;">
                  <strong>Obra:</strong> ${obraNome}
                </p>
                <p style="margin: 8px 0; color: #1F2937; font-size: 15px;">
                  <strong>Preposto:</strong> ${prepostoNome}
                </p>
                <p style="margin: 8px 0; color: #1F2937; font-size: 15px;">
                  <strong>Status:</strong> <span style="color: ${statusColor};">${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</span>
                </p>
              </div>
              
              <p style="margin: 25px 0 0 0; color: #4B5563; font-size: 16px; line-height: 1.6; text-align: center;">
                Acesse o sistema para visualizar os detalhes completos.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">
                Atenciosamente,<br>
                <strong style="color: #1F2937;">Sistema FC Pisos</strong>
              </p>
              <p style="margin: 20px 0 0 0; color: #9CA3AF; font-size: 12px;">
                Este é um email automático, por favor não responda.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Template de email notificando encarregado sobre nova obra atribuída
export function getEncarregadoNovaObraEmail(
  encarregadoNome: string,
  obraNome: string,
  cliente: string,
  cidade: string,
  prepostoNome: string,
  obraId: string // Mantido por compatibilidade, mas não usado no link
): string {
  // Link estático para o sistema (sempre o mesmo)
  const appLink = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'https://your-app-url.com';
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova Obra Atribuída - FC Pisos</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #EDEFE4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #EDEFE4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FD5521 0%, #E54A1D 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                FC Pisos
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Diário de Obras
              </p>
            </td>
          </tr>
          
          <!-- Corpo -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1F2937; font-size: 24px; font-weight: 600;">
                Olá ${encarregadoNome},
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4B5563; font-size: 16px; line-height: 1.6;">
                Uma nova obra foi atribuída a você no sistema Diário de Obras da FC Pisos.
              </p>
              
              <!-- Card com informações da obra -->
              <div style="background-color: #F9FAFB; border-left: 4px solid #FD5521; padding: 20px; margin: 25px 0; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px; font-weight: 500;">
                  DETALHES DA OBRA
                </p>
                <p style="margin: 8px 0; color: #1F2937; font-size: 15px;">
                  <strong>Cliente:</strong> ${cliente}
                </p>
                <p style="margin: 8px 0; color: #1F2937; font-size: 15px;">
                  <strong>Obra:</strong> ${obraNome}
                </p>
                <p style="margin: 8px 0; color: #1F2937; font-size: 15px;">
                  <strong>Cidade:</strong> ${cidade}
                </p>
                <p style="margin: 8px 0; color: #1F2937; font-size: 15px;">
                  <strong>Preposto:</strong> ${prepostoNome}
                </p>
              </div>
              
              <!-- Botão de ação -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${appLink}" style="display: inline-block; background: linear-gradient(135deg, #FD5521 0%, #E54A1D 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(253, 85, 33, 0.3);">
                      Acessar Sistema
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 25px 0 0 0; color: #4B5563; font-size: 16px; line-height: 1.6;">
                Clique no botão acima para acessar o sistema. A nova obra estará disponível na sua lista de obras.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">
                Atenciosamente,<br>
                <strong style="color: #1F2937;">Equipe FC Pisos</strong>
              </p>
              <p style="margin: 20px 0 0 0; color: #9CA3AF; font-size: 12px;">
                Este é um email automático, por favor não responda.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}