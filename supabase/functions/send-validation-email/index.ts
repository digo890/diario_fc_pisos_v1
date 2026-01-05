// ============================================
// EDGE FUNCTION: Enviar Email de Validação
// Envia email para o preposto com link único
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface RequestBody {
  obraId: string;
  prepostoNome: string;
  prepostoEmail: string;
  validationToken: string;
  cliente: string;
  obra: string;
  cidade: string;
  data: string;
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { prepostoNome, prepostoEmail, validationToken, cliente, obra, cidade, data } = body;

    // Construir URL de validação
    const baseUrl = req.headers.get('origin') || 'https://seu-app.vercel.app';
    const validationUrl = `${baseUrl}/validar/${validationToken}`;

    // Enviar email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'FC Pisos <noreply@fcpisos.com.br>',
        to: [prepostoEmail],
        subject: `Validação de Diário de Obra - ${cliente}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f5f5f5;
                }
                .container {
                  background-color: white;
                  border-radius: 16px;
                  padding: 40px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo {
                  width: 80px;
                  height: 80px;
                  background-color: #FD5521;
                  border-radius: 16px;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: 24px;
                  font-weight: bold;
                  margin-bottom: 16px;
                }
                h1 {
                  color: #FD5521;
                  font-size: 24px;
                  margin: 0 0 8px 0;
                }
                .subtitle {
                  color: #666;
                  font-size: 14px;
                }
                .info-box {
                  background-color: #f9f9f9;
                  border-radius: 12px;
                  padding: 20px;
                  margin: 24px 0;
                }
                .info-row {
                  display: flex;
                  justify-content: space-between;
                  padding: 8px 0;
                  border-bottom: 1px solid #eee;
                }
                .info-row:last-child {
                  border-bottom: none;
                }
                .info-label {
                  color: #666;
                  font-size: 14px;
                }
                .info-value {
                  color: #333;
                  font-weight: 600;
                  font-size: 14px;
                }
                .button {
                  display: inline-block;
                  background-color: #FD5521;
                  color: white;
                  text-decoration: none;
                  padding: 16px 32px;
                  border-radius: 12px;
                  font-weight: 600;
                  margin: 24px 0;
                  text-align: center;
                }
                .button:hover {
                  background-color: #E54A1D;
                }
                .instructions {
                  background-color: #FFF4E6;
                  border-left: 4px solid #FD5521;
                  padding: 16px;
                  margin: 24px 0;
                  border-radius: 8px;
                }
                .footer {
                  text-align: center;
                  color: #999;
                  font-size: 12px;
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 1px solid #eee;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">FC</div>
                  <h1>Validação de Diário de Obra</h1>
                  <p class="subtitle">Sua conferência é necessária</p>
                </div>

                <p>Olá, <strong>${prepostoNome}</strong>!</p>

                <p>Foi criado um novo Diário de Obra que precisa da sua validação. Por favor, revise as informações e confirme se tudo está correto.</p>

                <div class="info-box">
                  <div class="info-row">
                    <span class="info-label">Cliente</span>
                    <span class="info-value">${cliente}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Obra</span>
                    <span class="info-value">${obra}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Cidade</span>
                    <span class="info-value">${cidade}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Data</span>
                    <span class="info-value">${new Date(data).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div class="instructions">
                  <strong>📋 Como validar:</strong>
                  <ol style="margin: 8px 0 0 0; padding-left: 20px;">
                    <li>Clique no botão abaixo para acessar o formulário</li>
                    <li>Revise cuidadosamente todas as informações</li>
                    <li>Aprove ou reprove com sua assinatura digital</li>
                  </ol>
                </div>

                <div style="text-align: center;">
                  <a href="${validationUrl}" class="button">
                    Acessar Formulário para Validação
                  </a>
                </div>

                <p style="font-size: 14px; color: #666; margin-top: 24px;">
                  <strong>Importante:</strong> Este link é único e exclusivo para você. Não compartilhe com outras pessoas.
                </p>

                <div class="footer">
                  <p><strong>FC Pisos</strong></p>
                  <p>Este é um email automático, não responda.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      throw new Error(`Erro ao enviar email: ${error}`);
    }

    const result = await emailResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email enviado com sucesso',
        emailId: result.id,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 400,
      }
    );
  }
});
