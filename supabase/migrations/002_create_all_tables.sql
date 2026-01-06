-- ============================================================================
-- DIÁRIO DE OBRAS - FC PISOS
-- Schema completo com RLS (Row Level Security)
-- Data: 06 de Janeiro de 2026
-- ============================================================================

-- Limpar tabelas existentes (CUIDADO: isso apaga dados!)
DROP TABLE IF EXISTS validacoes_preposto CASCADE;
DROP TABLE IF EXISTS formularios CASCADE;
DROP TABLE IF EXISTS obras CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- TABELA: users
-- Descrição: Armazena os usuários do sistema (Administrador e Encarregado)
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Administrador', 'Encarregado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tipo ON users(tipo);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);

-- RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users
-- Todos podem ler todos os usuários (para listar encarregados)
CREATE POLICY "Todos podem ler usuários"
  ON users FOR SELECT
  USING (true);

-- Apenas administradores podem criar usuários
CREATE POLICY "Apenas admins podem criar usuários"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND tipo = 'Administrador'
    )
    OR NOT EXISTS (SELECT 1 FROM users) -- Permite primeiro usuário
  );

-- Apenas administradores podem atualizar usuários
CREATE POLICY "Apenas admins podem atualizar usuários"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND tipo = 'Administrador'
    )
  );

-- Apenas administradores podem deletar usuários
CREATE POLICY "Apenas admins podem deletar usuários"
  ON users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND tipo = 'Administrador'
    )
  );

-- ============================================================================
-- TABELA: obras
-- Descrição: Armazena as obras cadastradas no sistema
-- ============================================================================
CREATE TABLE obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cliente TEXT NOT NULL,
  cidade TEXT NOT NULL,
  encarregado_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'novo' CHECK (
    status IN (
      'novo',
      'em_preenchimento',
      'enviado_preposto',
      'aprovado',
      'reprovado',
      'enviado_admin',
      'concluido'
    )
  ),
  token TEXT UNIQUE, -- Token único para validação do preposto
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_obras_status ON obras(status);
CREATE INDEX idx_obras_encarregado ON obras(encarregado_id);
CREATE INDEX idx_obras_token ON obras(token);
CREATE INDEX idx_obras_created_by ON obras(created_by);

-- RLS (Row Level Security)
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para obras
-- Administradores podem ver todas as obras
-- Encarregados podem ver apenas suas obras
CREATE POLICY "Usuários podem ver obras relevantes"
  ON obras FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND (
        tipo = 'Administrador'
        OR (tipo = 'Encarregado' AND users.id = obras.encarregado_id)
      )
    )
  );

-- Apenas administradores podem criar obras
CREATE POLICY "Apenas admins podem criar obras"
  ON obras FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND tipo = 'Administrador'
    )
  );

-- Administradores podem atualizar todas as obras
-- Encarregados podem atualizar apenas suas obras
CREATE POLICY "Usuários podem atualizar obras relevantes"
  ON obras FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND (
        tipo = 'Administrador'
        OR (tipo = 'Encarregado' AND users.id = obras.encarregado_id)
      )
    )
  );

-- Apenas administradores podem deletar obras
CREATE POLICY "Apenas admins podem deletar obras"
  ON obras FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND tipo = 'Administrador'
    )
  );

-- ============================================================================
-- TABELA: formularios
-- Descrição: Armazena os formulários de diário de obras
-- ============================================================================
CREATE TABLE formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  respostas JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'em_preenchimento' CHECK (
    status IN (
      'em_preenchimento',
      'enviado_preposto',
      'aprovado',
      'reprovado',
      'enviado_admin',
      'concluido'
    )
  ),
  preenchido_por UUID REFERENCES users(id) ON DELETE SET NULL,
  preposto_nome TEXT,
  preposto_email TEXT,
  preposto_assinatura TEXT, -- Base64 da assinatura
  preposto_validado_em TIMESTAMPTZ,
  motivo_reprovacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: apenas um formulário por obra
  CONSTRAINT unique_formulario_por_obra UNIQUE (obra_id)
);

-- Índices
CREATE INDEX idx_formularios_obra ON formularios(obra_id);
CREATE INDEX idx_formularios_status ON formularios(status);
CREATE INDEX idx_formularios_preenchido_por ON formularios(preenchido_por);

-- RLS (Row Level Security)
ALTER TABLE formularios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para formularios
-- Administradores podem ver todos os formulários
-- Encarregados podem ver apenas formulários de suas obras
CREATE POLICY "Usuários podem ver formulários relevantes"
  ON formularios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN obras o ON o.id = formularios.obra_id
      WHERE u.auth_user_id = auth.uid()
      AND (
        u.tipo = 'Administrador'
        OR (u.tipo = 'Encarregado' AND u.id = o.encarregado_id)
      )
    )
  );

-- Encarregados podem criar formulários para suas obras
-- Administradores podem criar para qualquer obra
CREATE POLICY "Usuários podem criar formulários"
  ON formularios FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN obras o ON o.id = formularios.obra_id
      WHERE u.auth_user_id = auth.uid()
      AND (
        u.tipo = 'Administrador'
        OR (u.tipo = 'Encarregado' AND u.id = o.encarregado_id)
      )
    )
  );

-- Encarregados podem atualizar formulários de suas obras
-- Administradores podem atualizar qualquer formulário
CREATE POLICY "Usuários podem atualizar formulários relevantes"
  ON formularios FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN obras o ON o.id = formularios.obra_id
      WHERE u.auth_user_id = auth.uid()
      AND (
        u.tipo = 'Administrador'
        OR (u.tipo = 'Encarregado' AND u.id = o.encarregado_id)
      )
    )
  );

-- Apenas administradores podem deletar formulários
CREATE POLICY "Apenas admins podem deletar formulários"
  ON formularios FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND tipo = 'Administrador'
    )
  );

-- ============================================================================
-- TABELA: validacoes_preposto
-- Descrição: Log de validações feitas pelos prepostos (clientes)
-- ============================================================================
CREATE TABLE validacoes_preposto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  acao TEXT NOT NULL CHECK (acao IN ('aprovado', 'reprovado')),
  motivo_reprovacao TEXT,
  preposto_nome TEXT NOT NULL,
  preposto_email TEXT,
  assinatura_base64 TEXT NOT NULL,
  validado_em TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Índices
CREATE INDEX idx_validacoes_formulario ON validacoes_preposto(formulario_id);
CREATE INDEX idx_validacoes_obra ON validacoes_preposto(obra_id);
CREATE INDEX idx_validacoes_token ON validacoes_preposto(token);

-- RLS (Row Level Security)
ALTER TABLE validacoes_preposto ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para validacoes_preposto
-- Apenas administradores e encarregados das obras podem ver validações
CREATE POLICY "Usuários podem ver validações relevantes"
  ON validacoes_preposto FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN obras o ON o.id = validacoes_preposto.obra_id
      WHERE u.auth_user_id = auth.uid()
      AND (
        u.tipo = 'Administrador'
        OR (u.tipo = 'Encarregado' AND u.id = o.encarregado_id)
      )
    )
  );

-- Qualquer um pode inserir validações (acesso público via token)
CREATE POLICY "Acesso público pode criar validações"
  ON validacoes_preposto FOR INSERT
  WITH CHECK (true);

-- Apenas administradores podem deletar validações
CREATE POLICY "Apenas admins podem deletar validações"
  ON validacoes_preposto FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND tipo = 'Administrador'
    )
  );

-- ============================================================================
-- FUNÇÕES E TRIGGERS
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_obras_updated_at
  BEFORE UPDATE ON obras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formularios_updated_at
  BEFORE UPDATE ON formularios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar token único para obras
CREATE OR REPLACE FUNCTION generate_obra_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token IS NULL THEN
    NEW.token := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar token ao criar obra
CREATE TRIGGER generate_token_on_insert
  BEFORE INSERT ON obras
  FOR EACH ROW
  EXECUTE FUNCTION generate_obra_token();

-- Função para sincronizar status entre obra e formulário
CREATE OR REPLACE FUNCTION sync_obra_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando formulário muda de status, atualiza a obra
  UPDATE obras
  SET status = NEW.status,
      updated_at = NOW()
  WHERE id = NEW.obra_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar status
CREATE TRIGGER sync_status_on_formulario_update
  AFTER UPDATE OF status ON formularios
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION sync_obra_status();

-- ============================================================================
-- VIEWS (Opcional - para facilitar consultas)
-- ============================================================================

-- View: Obras com informações do encarregado
CREATE OR REPLACE VIEW vw_obras_completas AS
SELECT 
  o.id,
  o.nome,
  o.cliente,
  o.cidade,
  o.status,
  o.token,
  o.created_at,
  o.updated_at,
  u.id as encarregado_id,
  u.nome as encarregado_nome,
  u.email as encarregado_email,
  c.nome as criado_por_nome
FROM obras o
LEFT JOIN users u ON o.encarregado_id = u.id
LEFT JOIN users c ON o.created_by = c.id;

-- View: Formulários com informações da obra
CREATE OR REPLACE VIEW vw_formularios_completos AS
SELECT 
  f.id,
  f.obra_id,
  f.respostas,
  f.status,
  f.preposto_nome,
  f.preposto_email,
  f.preposto_validado_em,
  f.motivo_reprovacao,
  f.created_at,
  f.updated_at,
  o.nome as obra_nome,
  o.cliente as obra_cliente,
  o.cidade as obra_cidade,
  o.token as obra_token,
  u.nome as preenchido_por_nome,
  u.email as preenchido_por_email
FROM formularios f
JOIN obras o ON f.obra_id = o.id
LEFT JOIN users u ON f.preenchido_por = u.id;

-- ============================================================================
-- DADOS INICIAIS (Opcional)
-- ============================================================================

-- Comentar esta seção se não quiser dados de exemplo
-- INSERT INTO users (email, nome, tipo) VALUES
-- ('admin@fcpisos.com', 'Administrador Master', 'Administrador'),
-- ('encarregado@fcpisos.com', 'João Silva', 'Encarregado');

-- ============================================================================
-- PERMISSÕES
-- ============================================================================

-- Conceder permissões para authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON obras TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON formularios TO authenticated;
GRANT SELECT, INSERT, DELETE ON validacoes_preposto TO authenticated;

-- Conceder permissões para anon users (acesso público limitado)
GRANT SELECT ON validacoes_preposto TO anon;
GRANT INSERT ON validacoes_preposto TO anon;

-- ============================================================================
-- COMENTÁRIOS (Documentação)
-- ============================================================================

COMMENT ON TABLE users IS 'Usuários do sistema (Administrador e Encarregado)';
COMMENT ON TABLE obras IS 'Obras cadastradas no sistema';
COMMENT ON TABLE formularios IS 'Formulários de diário de obras';
COMMENT ON TABLE validacoes_preposto IS 'Log de validações feitas pelos prepostos (clientes)';

COMMENT ON COLUMN obras.token IS 'Token único para validação pública do preposto';
COMMENT ON COLUMN formularios.respostas IS 'JSON com todas as respostas do formulário';
COMMENT ON COLUMN formularios.preposto_assinatura IS 'Base64 da assinatura digital do preposto';

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================

-- Verificar tabelas criadas
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'obras', 'formularios', 'validacoes_preposto')
ORDER BY tablename;

-- Verificar RLS ativo
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'obras', 'formularios', 'validacoes_preposto')
ORDER BY tablename;

-- Listar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
