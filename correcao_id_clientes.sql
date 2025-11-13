-- ========================================
-- CORREÇÃO: Alterar tipo do ID da tabela clientes de INTEGER para TEXT (UUID)
-- ========================================
-- Este script corrige o problema de tipo de dados na coluna ID
-- Problema: invalid input syntax for type integer: "e13beee5-0609-4587-aca7-d14c2d5c87d9"
-- Solução: Converter coluna ID de INTEGER (SERIAL) para TEXT (UUID)
-- ========================================

BEGIN;

-- Passo 1: Verificar se há dados na tabela
DO $$
DECLARE
    total_registros INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_registros FROM clientes;
    RAISE NOTICE 'Total de registros na tabela clientes: %', total_registros;
END $$;

-- Passo 2: Verificar o tipo atual da coluna id
DO $$
DECLARE
    tipo_coluna TEXT;
BEGIN
    SELECT data_type INTO tipo_coluna
    FROM information_schema.columns
    WHERE table_name = 'clientes' AND column_name = 'id';
    RAISE NOTICE 'Tipo atual da coluna id: %', tipo_coluna;
END $$;

-- Passo 3: Remover foreign keys que referenciam clientes.id
-- (obrigacoes.cliente pode referenciar clientes.id)
DO $$
BEGIN
    -- Verificar e remover constraint se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'obrigacoes_cliente_fkey'
        AND table_name = 'obrigacoes'
    ) THEN
        ALTER TABLE obrigacoes DROP CONSTRAINT obrigacoes_cliente_fkey;
        RAISE NOTICE 'Constraint obrigacoes_cliente_fkey removida';
    END IF;
END $$;

-- Passo 4: Criar tabela temporária com o schema correto
CREATE TABLE clientes_temp (
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

RAISE NOTICE 'Tabela temporária clientes_temp criada';

-- Passo 5: Copiar dados existentes (se houver) convertendo ID para UUID
DO $$
DECLARE
    total_copiados INTEGER := 0;
BEGIN
    -- Se houver dados, copiar mantendo os IDs como texto
    INSERT INTO clientes_temp (id, nome, cnpj, email, telefone, ativo, "regimeTributario", "criadoEm", "atualizadoEm")
    SELECT 
        gen_random_uuid()::TEXT as id,  -- Gerar novo UUID para cada registro existente
        nome, 
        cnpj, 
        email, 
        telefone, 
        ativo, 
        "regimeTributario", 
        "criadoEm", 
        "atualizadoEm"
    FROM clientes;
    
    GET DIAGNOSTICS total_copiados = ROW_COUNT;
    RAISE NOTICE 'Registros copiados para tabela temporária: %', total_copiados;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Nenhum registro para copiar ou tabela não existe ainda';
END $$;

-- Passo 6: Remover tabela antiga
DROP TABLE IF EXISTS clientes CASCADE;
RAISE NOTICE 'Tabela clientes antiga removida';

-- Passo 7: Renomear tabela temporária
ALTER TABLE clientes_temp RENAME TO clientes;
RAISE NOTICE 'Tabela clientes_temp renomeada para clientes';

-- Passo 8: Recriar índices
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
RAISE NOTICE 'Índices recriados';

-- Passo 9: Recriar trigger para atualizadoEm
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."atualizadoEm" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON clientes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
RAISE NOTICE 'Trigger update_clientes_updated_at recriado';

-- Passo 10: Ajustar tabela obrigacoes se necessário
-- Verificar e ajustar coluna cliente para TEXT se ela existir e estiver como INTEGER
DO $$
DECLARE
    tipo_coluna_cliente TEXT;
BEGIN
    -- Verificar se a tabela obrigacoes existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'obrigacoes') THEN
        -- Verificar tipo da coluna cliente
        SELECT data_type INTO tipo_coluna_cliente
        FROM information_schema.columns
        WHERE table_name = 'obrigacoes' AND column_name = 'cliente';
        
        IF tipo_coluna_cliente IS NOT NULL THEN
            RAISE NOTICE 'Coluna obrigacoes.cliente existe com tipo: %', tipo_coluna_cliente;
            
            -- Se for INTEGER, converter para TEXT
            IF tipo_coluna_cliente = 'integer' THEN
                RAISE NOTICE 'Convertendo obrigacoes.cliente de INTEGER para TEXT...';
                
                -- Limpar valores existentes temporariamente
                UPDATE obrigacoes SET cliente = NULL WHERE cliente IS NOT NULL;
                
                -- Alterar tipo da coluna
                ALTER TABLE obrigacoes ALTER COLUMN cliente TYPE TEXT USING cliente::TEXT;
                
                RAISE NOTICE 'Coluna obrigacoes.cliente convertida para TEXT';
            END IF;
        END IF;
    END IF;
END $$;

-- Passo 11: Verificar resultado final
DO $$
DECLARE
    tipo_coluna TEXT;
    total_registros INTEGER;
BEGIN
    SELECT data_type INTO tipo_coluna
    FROM information_schema.columns
    WHERE table_name = 'clientes' AND column_name = 'id';
    
    SELECT COUNT(*) INTO total_registros FROM clientes;
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'CORREÇÃO CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Tipo da coluna clientes.id: %', tipo_coluna;
    RAISE NOTICE 'Total de registros na tabela: %', total_registros;
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Agora você pode cadastrar clientes usando UUID!';
END $$;

COMMIT;

-- ========================================
-- FIM DO SCRIPT
-- ========================================

