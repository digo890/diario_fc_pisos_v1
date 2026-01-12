// ============================================
// Edge Function: preposto-validation
// ============================================
// Função PÚBLICA (sem autenticação JWT) para validação de preposto
// Rotas:
// - GET /preposto-validation/:token - Buscar obra por token
// - POST /preposto-validation/:token/review - Submeter review do preposto
// - GET /preposto-validation/:token/formulario - Buscar formulário por token
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
// GET /preposto-validation/:token - Buscar obra por token
// ============================================
app.get('/preposto-validation/:token', async (c) => {
  const token = c.req.param('token');
  
  console.log('🔍 [PREPOSTO-VALIDATION] Buscando obra com token:', token);

  try {
    // Buscar TODAS as obras (key começa com 'obra:')
    const { data: obrasData, error } = await supabase
      .from('kv_store_1ff231a2')
      .select('key, value')
      .like('key', 'obra:%');

    if (error) {
      console.error('❌ Erro ao buscar obras:', error);
      return c.json({ success: false, error: 'Erro ao buscar obras' }, 500);
    }

    if (!obrasData || obrasData.length === 0) {
      console.error('❌ Nenhuma obra encontrada');
      return c.json({ success: false, error: 'Nenhuma obra encontrada' }, 404);
    }

    console.log(`📊 Total de obras: ${obrasData.length}`);
    
    // Buscar obra pelo token_validacao (não preposto_token!)
    const obraRecord = obrasData.find((record: any) => record.value?.token_validacao === token);

    if (!obraRecord) {
      return c.json({ error: 'Obra não encontrada' }, 404);
    }

    console.log('✅ Obra encontrada:', obraRecord.value.nome_obra || obraRecord.value.cliente);
    
    return c.json({
      success: true,
      data: obraRecord.value,
    });
  } catch (err) {
    console.error('❌ Erro na busca:', err);
    return c.json({ success: false, error: 'Erro interno no servidor' }, 500);
  }
});

// ============================================
// POST /preposto-validation/:token/review - Submeter review do preposto
// ============================================
app.post('/preposto-validation/:token/review', async (c) => {
  const token = c.req.param('token');
  
  console.log('📝 [PREPOSTO-VALIDATION] Submetendo review com token:', token);

  try {
    const body = await c.req.json();
    const { status, observacoes, assinatura } = body;

    // Validar campos obrigatórios
    if (!status || !assinatura) {
      return c.json({ error: 'Status e assinatura são obrigatórios' }, 400);
    }

    // Buscar TODAS as obras
    const { data: obrasData, error: fetchError } = await supabase
      .from('kv_store_1ff231a2')
      .select('key, value')
      .like('key', 'obra:%');

    if (fetchError || !obrasData || obrasData.length === 0) {
      console.error('❌ Erro ao buscar obras:', fetchError);
      return c.json({ error: 'Erro ao buscar obras' }, 500);
    }

    // Encontrar a obra pelo token
    const obraRecord = obrasData.find((record: any) => record.value?.preposto_token === token);

    if (!obraRecord) {
      return c.json({ error: 'Obra não encontrada' }, 404);
    }

    // Atualizar obra com review do preposto
    const obraAtualizada = {
      ...obraRecord.value,
      preposto_status: status,
      preposto_observacoes: observacoes || '',
      preposto_assinatura: assinatura,
      preposto_validado_em: new Date().toISOString(),
    };

    // Salvar no banco (update individual)
    const { error: updateError } = await supabase
      .from('kv_store_1ff231a2')
      .update({ value: obraAtualizada })
      .eq('key', obraRecord.key);

    if (updateError) {
      console.error('❌ Erro ao atualizar obra:', updateError);
      return c.json({ error: 'Erro ao salvar review' }, 500);
    }

    console.log('✅ Review salvo com sucesso para obra:', obraAtualizada.nome_obra);

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
// GET /preposto-validation/:token/formulario - Buscar formulário por token
// ============================================
app.get('/preposto-validation/:token/formulario', async (c) => {
  const token = c.req.param('token');
  
  console.log('📋 [PREPOSTO-VALIDATION] Buscando formulário com token:', token);

  try {
    // Buscar TODOS os formulários (key começa com 'formulario:')
    const { data: formulariosData, error } = await supabase
      .from('kv_store_1ff231a2')
      .select('key, value')
      .like('key', 'formulario:%');

    if (error || !formulariosData || formulariosData.length === 0) {
      console.error('❌ Erro ao buscar formulários:', error);
      return c.json({ error: 'Erro ao buscar formulários' }, 500);
    }

    console.log(`📊 Total de formulários: ${formulariosData.length}`);
    
    // Buscar formulário pelo token_validacao (não preposto_token!)
    const formularioRecord = formulariosData.find((record: any) => record.value?.token_validacao === token);

    if (!formularioRecord) {
      console.error('❌ Formulário não encontrado para token:', token);
      return c.json({ error: 'Formulário não encontrado' }, 404);
    }

    console.log('✅ Formulário encontrado');
    
    return c.json({
      success: true,
      data: formularioRecord.value,
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