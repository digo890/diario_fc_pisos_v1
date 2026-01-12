// ============================================
// Edge Function: preposto-validation
// ============================================
// Função PÚBLICA (sem autenticação JWT) para validação de preposto
// Rotas:
// - GET /:token - Buscar obra por token
// - POST /:token/review - Submeter review do preposto
// - GET /:token/formulario - Buscar formulário por token
// ============================================

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const app = new Hono();

// ============================================
// Configuração CORS (pública)
// ============================================
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger(console.log));

// ============================================
// Supabase Client
// ============================================
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// GET /:token - Buscar obra por token
// ============================================
app.get('/:token', async (c) => {
  const token = c.req.param('token');
  
  console.log('🔍 [PREPOSTO-VALIDATION] Buscando obra com token:', token);

  try {
    // Buscar lista de obras
    const { data: obrasData, error } = await supabase
      .from('kv_store_1ff231a2')
      .select('value')
      .eq('key', 'obras')
      .single();

    if (error) {
      console.error('❌ Erro ao buscar obras:', error);
      return c.json({ success: false, error: 'Erro ao buscar obras' }, 500);
    }

    if (!obrasData?.value) {
      console.error('❌ Nenhuma obra encontrada');
      return c.json({ success: false, error: 'Nenhuma obra encontrada' }, 404);
    }

    // Parse do array de obras
    const obrasArray = Array.isArray(obrasData.value) ? obrasData.value : [];
    
    console.log(`📊 Total de obras: ${obrasArray.length}`);
    
    // Buscar obra pelo preposto_token
    const obra = obrasArray.find((o: any) => o.preposto_token === token);

    if (!obra) {
      console.error('❌ Obra não encontrada para token:', token);
      return c.json({ success: false, error: 'Obra não encontrada' }, 404);
    }

    console.log('✅ Obra encontrada:', obra.nome_obra || obra.cliente);
    
    return c.json({
      success: true,
      data: obra,
    });
  } catch (err) {
    console.error('❌ Erro na busca:', err);
    return c.json({ success: false, error: 'Erro interno no servidor' }, 500);
  }
});

// ============================================
// POST /:token/review - Submeter review do preposto
// ============================================
app.post('/:token/review', async (c) => {
  const token = c.req.param('token');
  
  console.log('📝 [PREPOSTO-VALIDATION] Submetendo review com token:', token);

  try {
    const body = await c.req.json();
    const { status, observacoes, assinatura } = body;

    // Validar campos obrigatórios
    if (!status || !assinatura) {
      return c.json({ error: 'Status e assinatura são obrigatórios' }, 400);
    }

    // Buscar obra pelo token
    const { data: obras, error: fetchError } = await supabase
      .from('kv_store_1ff231a2')
      .select('value')
      .eq('key', 'obras')
      .single();

    if (fetchError || !obras?.value) {
      console.error('❌ Erro ao buscar obras:', fetchError);
      return c.json({ error: 'Erro ao buscar obras' }, 500);
    }

    const obrasArray = Array.isArray(obras.value) ? obras.value : [];
    const obraIndex = obrasArray.findIndex((o: any) => o.preposto_token === token);

    if (obraIndex === -1) {
      return c.json({ error: 'Obra não encontrada' }, 404);
    }

    // Atualizar obra com review do preposto
    obrasArray[obraIndex] = {
      ...obrasArray[obraIndex],
      preposto_status: status,
      preposto_observacoes: observacoes || '',
      preposto_assinatura: assinatura,
      preposto_validado_em: new Date().toISOString(),
    };

    // Salvar no banco
    const { error: updateError } = await supabase
      .from('kv_store_1ff231a2')
      .update({ value: obrasArray })
      .eq('key', 'obras');

    if (updateError) {
      console.error('❌ Erro ao atualizar obra:', updateError);
      return c.json({ error: 'Erro ao salvar review' }, 500);
    }

    console.log('✅ Review salvo com sucesso para obra:', obrasArray[obraIndex].nome_obra);

    return c.json({
      success: true,
      message: 'Review submetido com sucesso',
    });
  } catch (err) {
    console.error('❌ Erro ao processar review:', err);
    return c.json({ error: 'Erro interno no servidor' }, 500);
  }
});

// ============================================
// GET /:token/formulario - Buscar formulário por token
// ============================================
app.get('/:token/formulario', async (c) => {
  const token = c.req.param('token');
  
  console.log('📋 [PREPOSTO-VALIDATION] Buscando formulário com token:', token);

  try {
    // Buscar formulários
    const { data: formularios, error } = await supabase
      .from('kv_store_1ff231a2')
      .select('value')
      .eq('key', 'formularios')
      .single();

    if (error || !formularios?.value) {
      console.error('❌ Erro ao buscar formulários:', error);
      return c.json({ error: 'Erro ao buscar formulários' }, 500);
    }

    const formulariosArray = Array.isArray(formularios.value) ? formularios.value : [];
    
    // Buscar formulário pelo preposto_token
    const formulario = formulariosArray.find((f: any) => f.preposto_token === token);

    if (!formulario) {
      console.error('❌ Formulário não encontrado para token:', token);
      return c.json({ error: 'Formulário não encontrado' }, 404);
    }

    console.log('✅ Formulário encontrado');
    
    return c.json({
      success: true,
      data: formulario,
    });
  } catch (err) {
    console.error('❌ Erro na busca:', err);
    return c.json({ error: 'Erro interno no servidor' }, 500);
  }
});

// ============================================
// 404 Handler
// ============================================
app.notFound((c) => {
  console.error('❌ Rota não encontrada:', c.req.path);
  return c.json({ error: 'Rota não encontrada' }, 404);
});

// ============================================
// Start Server
// ============================================
Deno.serve(app.fetch);