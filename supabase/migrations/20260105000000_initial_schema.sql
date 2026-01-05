-- ============================================
-- DIÁRIO DE OBRAS - FC PISOS
-- Schema do Banco de Dados
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: users
-- Armazena administradores e encarregados
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Administrador', 'Encarregado')),
  email TEXT UNIQUE,
  telefone TEXT,
  senha TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_users_tipo ON users(tipo);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- TABELA: obras
-- Armazena informações das obras
-- ============================================
CREATE TABLE IF NOT EXISTS obras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente TEXT NOT NULL,
  obra TEXT NOT NULL,
  cidade TEXT NOT NULL,
  data DATE NOT NULL,
  encarregado_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Dados do Preposto (não é mais usuário, apenas contato)
  preposto_nome TEXT,
  preposto_email TEXT,
  preposto_whatsapp TEXT,
  
  -- Status e progresso
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN (
    'novo',
    'em_preenchimento',
    'enviado_preposto',
    'reprovado_preposto',
    'enviado_admin',
    'concluido'
  )),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Token único para validação do preposto
  validation_token TEXT UNIQUE,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_obras_status ON obras(status);
CREATE INDEX idx_obras_encarregado ON obras(encarregado_id);
CREATE INDEX idx_obras_validation_token ON obras(validation_token);
CREATE INDEX idx_obras_created_by ON obras(created_by);

-- ============================================
-- TABELA: formularios
-- Armazena os formulários preenchidos
-- ============================================
CREATE TABLE IF NOT EXISTS formularios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id UUID UNIQUE NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  
  -- Condições Ambientais
  clima_manha TEXT,
  clima_tarde TEXT,
  clima_noite TEXT,
  temperatura_min TEXT,
  temperatura_max TEXT,
  umidade TEXT,
  
  -- Serviços Executados (JSON com até 3 serviços)
  servicos JSONB DEFAULT '{}'::jsonb,
  
  -- Dados da Obra
  ucrete TEXT,
  horario_inicio TEXT,
  horario_termino TEXT,
  area TEXT,
  espessura TEXT,
  rodape TEXT,
  estado_substrato TEXT,
  estado_substrato_obs TEXT,
  
  -- Registros Importantes (JSON com 20 itens condicionais)
  registros JSONB DEFAULT '{}'::jsonb,
  
  -- Observações
  observacoes TEXT,
  
  -- Assinaturas (URLs ou base64)
  assinatura_encarregado TEXT,
  assinatura_preposto TEXT,
  
  -- Confirmação do Preposto
  preposto_confirmado BOOLEAN DEFAULT false,
  preposto_motivo_reprovacao TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN (
    'novo',
    'em_preenchimento',
    'enviado_preposto',
    'reprovado_preposto',
    'enviado_admin',
    'concluido'
  )),
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  enviado_preposto_at TIMESTAMPTZ,
  preposto_reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX idx_formularios_obra ON formularios(obra_id);
CREATE INDEX idx_formularios_status ON formularios(status);
CREATE INDEX idx_formularios_created_by ON formularios(created_by);

-- ============================================
-- TABELA: fotos
-- Armazena referências às fotos no Supabase Storage
-- ============================================
CREATE TABLE IF NOT EXISTS fotos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formulario_id UUID REFERENCES formularios(id) ON DELETE CASCADE,
  servico_numero INTEGER CHECK (servico_numero IN (1, 2, 3)),
  tipo TEXT, -- 'etapa' ou 'registro'
  referencia TEXT, -- qual etapa/registro
  storage_path TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_fotos_formulario ON fotos(formulario_id);

-- ============================================
-- FUNÇÕES: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_obras_updated_at BEFORE UPDATE ON obras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formularios_updated_at BEFORE UPDATE ON formularios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE formularios ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;

-- Políticas para USERS
CREATE POLICY "Usuários podem ver todos os outros usuários"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem criar usuários"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND tipo = 'Administrador'
    )
  );

CREATE POLICY "Apenas admins podem atualizar usuários"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND tipo = 'Administrador'
    )
  );

CREATE POLICY "Apenas admins podem deletar usuários"
  ON users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND tipo = 'Administrador'
    )
  );

-- Políticas para OBRAS
CREATE POLICY "Todos podem ver obras relacionadas a eles"
  ON obras FOR SELECT
  USING (true);

CREATE POLICY "Admins e encarregados podem criar obras"
  ON obras FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins e encarregados podem atualizar obras"
  ON obras FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Apenas admins podem deletar obras"
  ON obras FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND tipo = 'Administrador'
    )
  );

-- Políticas para FORMULÁRIOS
CREATE POLICY "Todos podem ver formulários"
  ON formularios FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem criar formulários"
  ON formularios FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários autenticados podem atualizar formulários"
  ON formularios FOR UPDATE
  USING (true);

-- Políticas para FOTOS
CREATE POLICY "Todos podem ver fotos"
  ON fotos FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir fotos"
  ON fotos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- SEED DATA: Usuários Iniciais
-- ============================================
INSERT INTO users (id, nome, tipo, email, telefone) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Administrador', 'Administrador', 'admin@fcpisos.com.br', ''),
  ('22222222-2222-2222-2222-222222222222', 'João Silva', 'Encarregado', 'joao@fcpisos.com.br', '(11) 98765-4321')
ON CONFLICT (id) DO NOTHING;
