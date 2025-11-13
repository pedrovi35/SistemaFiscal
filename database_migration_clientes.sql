-- ========================================
-- Migração: Garantir estrutura correta da tabela clientes
-- ========================================
-- Este script garante que a tabela clientes tenha a estrutura correta
-- para salvar clientes quando cadastrar e atualizar quando editar
-- ========================================

-- Verificar e criar tabela se não existir
CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(255),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE,
    "regimeTributario" VARCHAR(50),
    "criadoEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar colunas se não existirem (para bancos já existentes)
DO $$ 
BEGIN
    -- Adicionar coluna criadoEm se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clientes' AND column_name = 'criadoEm') THEN
        ALTER TABLE clientes ADD COLUMN "criadoEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Adicionar coluna atualizadoEm se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clientes' AND column_name = 'atualizadoEm') THEN
        ALTER TABLE clientes ADD COLUMN "atualizadoEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Adicionar coluna regimeTributario se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clientes' AND column_name = 'regimeTributario') THEN
        ALTER TABLE clientes ADD COLUMN "regimeTributario" VARCHAR(50);
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);

-- Criar trigger para atualizar atualizadoEm automaticamente
CREATE OR REPLACE FUNCTION atualizar_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW."atualizadoEm" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_atualizado_em_clientes ON clientes;
CREATE TRIGGER trigger_atualizar_atualizado_em_clientes
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_atualizado_em();

-- Comentários
COMMENT ON TABLE clientes IS 'Armazena informações dos clientes do sistema';
COMMENT ON COLUMN clientes.id IS 'ID único do cliente (UUID)';
COMMENT ON COLUMN clientes.nome IS 'Nome completo ou razão social do cliente';
COMMENT ON COLUMN clientes.cnpj IS 'CNPJ do cliente (único)';
COMMENT ON COLUMN clientes.email IS 'Email de contato do cliente';
COMMENT ON COLUMN clientes.telefone IS 'Telefone de contato do cliente';
COMMENT ON COLUMN clientes.ativo IS 'Indica se o cliente está ativo no sistema';
COMMENT ON COLUMN clientes."regimeTributario" IS 'Regime tributário do cliente (MEI, Simples Nacional, etc)';
COMMENT ON COLUMN clientes."criadoEm" IS 'Data e hora de criação do registro';
COMMENT ON COLUMN clientes."atualizadoEm" IS 'Data e hora da última atualização do registro';

