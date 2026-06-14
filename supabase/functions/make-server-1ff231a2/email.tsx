import { Resend } from 'npm:resend@4.0.0';

const apiKey = Deno.env.get('RESEND_API_KEY');

// Validar se a API key existe
if (!apiKey) {
  console.error('❌ RESEND_API_KEY não configurada!');
}

// 🔒 SEGURANÇA: nunca logar o valor (nem o prefixo) da chave — apenas se está presente.
console.log('🔑 RESEND_API_KEY:', apiKey ? 'configurada' : 'NÃO CONFIGURADA');

const resend = new Resend(apiKey);

// Remetente. Configurável via env (RESEND_FROM_EMAIL); o padrão usa o domínio
// verificado em fcpisos.com.br. Para testar sem domínio, use 'onboarding@resend.dev'.
const FROM_EMAIL =
  Deno.env.get('RESEND_FROM_EMAIL') || 'FC Pisos <administrativo@fcpisos.com.br>'; // Domínio verificado em fcpisos.com.br

// URL base do app, usada nos links dos emails. Configurável via env (APP_URL).
export const APP_URL =
  Deno.env.get('APP_URL') || 'https://diario-fc-pisos-v1.vercel.app';

// Email para desenvolvimento/testes
// No modo de teste do Resend, só é possível enviar para o email do proprietário da conta
const DEV_TEST_EMAIL =
  Deno.env.get('RESEND_DEV_TEST_EMAIL') || 'digoo890@gmail.com'; // Email verificado no Resend

// Detecta se estamos em modo de desenvolvimento (sem domínio verificado)
const isDevelopmentMode = FROM_EMAIL === 'onboarding@resend.dev';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    // Verificar se a API key está configurada
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY não está configurada nas variáveis de ambiente');
      return { 
        success: false, 
        error: 'RESEND_API_KEY não configurada. Por favor, configure a chave da API do Resend.' 
      };
    }

    // Em modo de desenvolvimento com Resend em teste, redirecionar todos os emails
    const actualTo = isDevelopmentMode ? DEV_TEST_EMAIL : to;
    const actualSubject = isDevelopmentMode
      ? `[DEV - Para: ${to}] ${subject}`
      : subject;
    
    if (isDevelopmentMode) {
      console.log('⚠️  MODO DE DESENVOLVIMENTO ATIVO');
      console.log('📧 O Resend está em modo de teste e só permite enviar para:', DEV_TEST_EMAIL);
      console.log('💡 Para enviar para outros emails, verifique um domínio em https://resend.com/domains');
    }
    
    console.log('📧 Enviando email...');
    console.log('📍 Modo:', isDevelopmentMode ? 'DESENVOLVIMENTO (Resend em teste)' : 'PRODUÇÃO');
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
      console.error('❌ Erro do Resend:', error);
      
      // Mensagem mais específica para token inválido
      if (error.message?.includes('Invalid') || error.message?.includes('invalid')) {
        return { 
          success: false, 
          error: 'Token do Resend inválido ou expirado. Por favor, atualize o RESEND_API_KEY com uma chave válida.' 
        };
      }
      
      return { success: false, error: error.message || 'Erro desconhecido ao enviar email' };
    }

    console.log('✅ Email enviado com sucesso:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Exceção ao enviar email:', error);
    return { 
      success: false, 
      error: error.message || 'Erro inesperado ao enviar email'
    };
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
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Conferência de Formulário - FC Pisos</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #EDEFE4; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <!-- Preheader (texto invisível que aparece no preview) -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Formulário da obra ${obraNome} aguarda sua conferência e assinatura digital.
  </div>
  
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color: #EDEFE4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
          <!-- Header com fallback para Outlook -->
          <tr>
            <td style="background-color: #FD5521; background-image: linear-gradient(135deg, #FD5521 0%, #E54A1D 100%); padding: 40px 30px; text-align: center;">
              <!--[if gte mso 9]>
              <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:120px;">
                <v:fill type="gradient" color="#FD5521" color2="#E54A1D" angle="135" />
                <v:textbox inset="0,0,0,0">
              <![endif]-->
              <div>
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; line-height: 1.2;">
                  FC Pisos
                </h1>
                <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                  Diário de Obras
                </p>
              </div>
              <!--[if gte mso 9]>
                </v:textbox>
              </v:rect>
              <![endif]-->
            </td>
          </tr>
          
          <!-- Corpo -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1F2937; font-size: 24px; font-weight: 600; line-height: 1.3;">
                Olá ${prepostoNome},
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4B5563; font-size: 16px; line-height: 1.6;">
                O formulário da obra <strong style="color: #1F2937;">${obraNome}</strong> foi preenchido pelo encarregado <strong style="color: #1F2937;">${encarregadoNome}</strong> e está aguardando sua conferência e assinatura.
              </p>
              
              <!-- Card com informações da obra -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color: #F9FAFB; border-left: 4px solid #FD5521; margin: 25px 0; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Detalhes da Obra
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                      <tr>
                        <td style="padding: 6px 0; color: #1F2937; font-size: 15px; line-height: 1.5;">
                          <strong>Cliente:</strong> ${cliente}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #1F2937; font-size: 15px; line-height: 1.5;">
                          <strong>Obra:</strong> ${obraNome}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #1F2937; font-size: 15px; line-height: 1.5;">
                          <strong>Cidade:</strong> ${cidade}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #1F2937; font-size: 15px; line-height: 1.5;">
                          <strong>Encarregado:</strong> ${encarregadoNome}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 25px 0 30px 0; color: #4B5563; font-size: 16px; line-height: 1.6;">
                Clique no botão abaixo para acessar o formulário, conferir as informações e assinar digitalmente:
              </p>
              
              <!-- Botão com fallback para Outlook -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${linkConferencia}" style="height:52px;v-text-anchor:middle;width:220px;" arcsize="23%" strokecolor="#FD5521" fillcolor="#FD5521">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Acessar Formulário</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${linkConferencia}" 
                       style="display: inline-block; background-color: #FD5521; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; text-align: center; mso-hide: all;">
                      Acessar Formulário
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 8px 0; color: #6B7280; font-size: 14px; line-height: 1.5;">
                Ou copie e cole o link abaixo no seu navegador:
              </p>
              <p style="margin: 0; padding: 12px; background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; color: #FD5521; font-size: 13px; word-wrap: break-word; overflow-wrap: break-word;">
                <a href="${linkConferencia}" style="color: #FD5521; text-decoration: none;">${linkConferencia}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px; line-height: 1.5;">
                Atenciosamente,<br>
                <strong style="color: #1F2937;">Equipe FC Pisos</strong>
              </p>
              <p style="margin: 20px 0 0 0; color: #9CA3AF; font-size: 12px; line-height: 1.4;">
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
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Formulário ${statusText.charAt(0).toUpperCase() + statusText.slice(1)} - FC Pisos</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #EDEFE4; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Preposto ${prepostoNome} ${statusText} o formulário da obra ${obraNome}
  </div>
  
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color: #EDEFE4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
          <!-- Header com fallback para Outlook -->
          <tr>
            <td style="background-color: #FD5521; background-image: linear-gradient(135deg, #FD5521 0%, #E54A1D 100%); padding: 40px 30px; text-align: center;">
              <!--[if gte mso 9]>
              <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:120px;">
                <v:fill type="gradient" color="#FD5521" color2="#E54A1D" angle="135" />
                <v:textbox inset="0,0,0,0">
              <![endif]-->
              <div>
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; line-height: 1.2;">
                  FC Pisos
                </h1>
                <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                  Diário de Obras
                </p>
              </div>
              <!--[if gte mso 9]>
                </v:textbox>
              </v:rect>
              <![endif]-->
            </td>
          </tr>
          
          <!-- Corpo -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1F2937; font-size: 24px; font-weight: 600; line-height: 1.3;">
                Olá ${adminNome},
              </h2>
              
              <!-- Badge de status -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 25px 0;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color: ${statusColor}; border-radius: 20px; display: inline-block;">
                      <tr>
                        <td style="padding: 12px 24px; color: #ffffff; font-size: 18px; font-weight: 600; text-align: center;">
                          ${emoji} Formulário ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; color: #4B5563; font-size: 16px; line-height: 1.6; text-align: center;">
                O preposto <strong style="color: #1F2937;">${prepostoNome}</strong> ${statusText} o formulário da obra <strong style="color: #1F2937;">${obraNome}</strong>.
              </p>
              
              <!-- Card com informações da obra -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color: #F9FAFB; border-left: 4px solid ${statusColor}; margin: 25px 0; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Detalhes da Obra
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                      <tr>
                        <td style="padding: 6px 0; color: #1F2937; font-size: 15px; line-height: 1.5;">
                          <strong>Cliente:</strong> ${cliente}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #1F2937; font-size: 15px; line-height: 1.5;">
                          <strong>Obra:</strong> ${obraNome}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #1F2937; font-size: 15px; line-height: 1.5;">
                          <strong>Preposto:</strong> ${prepostoNome}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 15px; line-height: 1.5;">
                          <strong style="color: #1F2937;">Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 25px 0 0 0; color: #4B5563; font-size: 16px; line-height: 1.6; text-align: center;">
                Acesse o sistema para visualizar os detalhes completos.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px; line-height: 1.5;">
                Atenciosamente,<br>
                <strong style="color: #1F2937;">Equipe FC Pisos</strong>
              </p>
              <p style="margin: 20px 0 0 0; color: #9CA3AF; font-size: 12px; line-height: 1.4;">
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
  // URL base do app (configurável via env APP_URL)
  const appLink = APP_URL;
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Nova Obra Atribuída - FC Pisos</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #EDEFE4; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Nova obra atribuída: ${obraNome} - ${cliente}
  </div>
  
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color: #EDEFE4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
          <!-- Header com fallback para Outlook -->
          <tr>
            <td style="background-color: #FD5521; background-image: linear-gradient(135deg, #FD5521 0%, #E54A1D 100%); padding: 40px 30px; text-align: center;">
              <!--[if gte mso 9]>
              <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:120px;">
                <v:fill type="gradient" color="#FD5521" color2="#E54A1D" angle="135" />
                <v:textbox inset="0,0,0,0">
              <![endif]-->
              <div>
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; line-height: 1.2;">
                  FC Pisos
                </h1>
                <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                  Diário de Obras
                </p>
              </div>
              <!--[if gte mso 9]>
                </v:textbox>
              </v:rect>
              <![endif]-->
            </td>
          </tr>
          
          <!-- Corpo -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1F2937; font-size: 24px; font-weight: 600; line-height: 1.3;">
                Olá ${encarregadoNome},
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4B5563; font-size: 16px; line-height: 1.6;">
                Uma nova obra foi atribuída a você no sistema Diário de Obras da FC Pisos.
              </p>
              
              <!-- Card com informações da obra -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color: #F9FAFB; border-left: 4px solid #FD5521; margin: 25px 0; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Detalhes da Obra
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                      <tr>
                        <td style="padding: 6px 0; color: #1F2937; font-size: 15px; line-height: 1.5;">
                          <strong>Cliente:</strong> ${cliente}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #1F2937; font-size: 15px; line-height: 1.5;">
                          <strong>Obra:</strong> ${obraNome}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #1F2937; font-size: 15px; line-height: 1.5;">
                          <strong>Cidade:</strong> ${cidade}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #1F2937; font-size: 15px; line-height: 1.5;">
                          <strong>Preposto:</strong> ${prepostoNome}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 25px 0 30px 0; color: #4B5563; font-size: 16px; line-height: 1.6;">
                Clique no botão abaixo para acessar o sistema. A nova obra estará disponível na sua lista:
              </p>
              
              <!-- Botão com fallback para Outlook -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${appLink}" style="height:50px;v-text-anchor:middle;width:200px;" arcsize="20%" strokecolor="#FD5521" fillcolor="#FD5521">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Acessar Sistema</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${appLink}" 
                       style="display: inline-block; background-color: #FD5521; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 16px; font-weight: 600; text-align: center; mso-hide: all;">
                      Acessar Sistema
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 8px 0; color: #6B7280; font-size: 14px; line-height: 1.5;">
                Ou copie e cole o link abaixo no seu navegador:
              </p>
              <p style="margin: 0; padding: 12px; background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; color: #FD5521; font-size: 13px; word-wrap: break-word; overflow-wrap: break-word;">
                <a href="${appLink}" style="color: #FD5521; text-decoration: none;">${appLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px; line-height: 1.5;">
                Atenciosamente,<br>
                <strong style="color: #1F2937;">Equipe FC Pisos</strong>
              </p>
              <p style="margin: 16px 0 0 0; color: #9CA3AF; font-size: 12px; line-height: 1.4;">
                Este é um email transacional do sistema Diário de Obras.<br>
                Você recebeu esta mensagem porque uma nova obra foi atribuída a você.
              </p>
              <p style="margin: 16px 0 0 0; font-size: 12px; line-height: 1.4;">
                <a href="mailto:administrativo@fcpisos.com.br" style="color: #FD5521; text-decoration: none;">administrativo@fcpisos.com.br</a>
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

// Template simples usado pela rota de teste de envio (/emails/test).
// Serve apenas para confirmar que a integração com o Resend está operacional.
export function getTesteEnvioEmail(destinatario: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Teste de Envio - FC Pisos</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #EDEFE4;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color: #EDEFE4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background-color: #FD5521; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">FC Pisos</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">Diário de Obras</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1F2937; font-size: 22px; font-weight: 600;">✅ Teste de envio bem-sucedido</h2>
              <p style="margin: 0 0 16px 0; color: #4B5563; font-size: 16px; line-height: 1.6;">
                Se você está lendo este email, a integração de envio de emails (Resend) do sistema está funcionando corretamente.
              </p>
              <p style="margin: 0; color: #6B7280; font-size: 14px; line-height: 1.5;">
                Destinatário: <strong style="color: #1F2937;">${destinatario}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px; line-height: 1.4;">
                Email automático de teste do sistema Diário de Obras.
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