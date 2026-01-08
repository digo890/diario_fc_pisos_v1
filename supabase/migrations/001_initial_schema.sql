-- =====================================================
-- DIÁRIO DE OBRAS FC PISOS - SCHEMA INICIAL
-- =====================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: users
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Administrador', 'Encarregado')),
  email TEXT UNIQUE,
  telefone TEXT,
  senha TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para users
CREATE INDEX idx_users_tipo ON users(tipo);
CREATE INDEX idx_users_email ON users(email);

-- =====================================================
-- TABELA: obras
-- =====================================================
CREATE TABLE obras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente TEXT NOT NULL,
  obra TEXT NOT NULL,
  cidade TEXT NOT NULL,
  data TEXT NOT NULL,
  encarregado_id UUID REFERENCES users(id) ON DELETE SET NULL,
  preposto_nome TEXT,
  preposto_email TEXT,
  preposto_whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'em_preenchimento', 'enviado_preposto', 'reprovado_preposto', 'enviado_admin', 'concluido')),
  progress INTEGER DEFAULT 0,
  validation_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para obras
CREATE INDEX idx_obras_status ON obras(status);
CREATE INDEX idx_obras_encarregado ON obras(encarregado_id);
CREATE INDEX idx_obras_validation_token ON obras(validation_token);

-- =====================================================
-- TABELA: formularios
-- =====================================================
CREATE TABLE formularios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id UUID UNIQUE REFERENCES obras(id) ON DELETE CASCADE,
  
  -- Condições Ambientais
  clima JSONB DEFAULT '{}',
  temperatura_min TEXT,
  temperatura_max TEXT,
  umidade TEXT,
  
  -- Serviços Executados
  servicos JSONB DEFAULT '{}',
  
  -- Dados da Obra
  ucrete TEXT,
  horario_inicio TEXT,
  horario_termino TEXT,
  area TEXT,
  espessura TEXT,
  rodape TEXT,
  estado_substrato TEXT,
  estado_substrato_obs TEXT,
  
  -- Registros Importantes
  registros JSONB DEFAULT '{}',
  
  -- Observações
  observacoes TEXT,
  
  -- Assinaturas
  assinatura_encarregado TEXT,
  assinatura_preposto TEXT,
  
  -- Confirmação Preposto
  preposto_confirmado BOOLEAN DEFAULT FALSE,
  preposto_motivo_reprovacao TEXT,
  
  -- Metadata
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'em_preenchimento', 'enviado_preposto', 'reprovado_preposto', 'enviado_admin', 'concluido')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  enviado_preposto_at TIMESTAMPTZ,
  preposto_reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Índices para formularios
CREATE INDEX idx_formularios_obra ON formularios(obra_id);
CREATE INDEX idx_formularios_status ON formularios(status);

-- =====================================================
-- FUNÇÕES: Updated_at automático
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_obras_updated_at BEFORE UPDATE ON obras
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formularios_updated_at BEFORE UPDATE ON formularios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA (apenas para desenvolvimento/testes)
-- =====================================================
-- ✅ REMOVIDO: Dados de exemplo não são mais criados automaticamente
-- Os usuários devem ser criados via Supabase Auth no backend

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE formularios ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Permitir leitura de usuários" ON users FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de usuários" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de usuários" ON users FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de usuários" ON users FOR DELETE USING (true);

-- Políticas para obras
CREATE POLICY "Permitir leitura de obras" ON obras FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de obras" ON obras FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de obras" ON obras FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de obras" ON obras FOR DELETE USING (true);

-- Políticas para formularios
CREATE POLICY "Permitir leitura de formulários" ON formularios FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de formulários" ON formularios FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de formulários" ON formularios FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de formulários" ON formularios FOR DELETE USING (true);