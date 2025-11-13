-- ========================================
-- Script de Correção: Adicionar coluna regimeTributario
-- ========================================
-- Este script adiciona a coluna regimeTributario na tabela clientes
-- se ela não existir. Execute este script no SQL Editor do Supabase.
-- ========================================

-- Verificar se a tabela clientes existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'clientes'
    ) THEN
        RAISE EXCEPTION 'Tabela clientes não existe. Execute primeiro o script database_supabase_fixed.sql';
    END IF;
END $$;

-- Adicionar coluna regimeTributario se não existir
-- Usa comparação case-insensitive para garantir que encontre a coluna
DO $$ 
DECLARE
    col_exists BOOLEAN;
BEGIN
    -- Verificar se a coluna existe (comparação case-insensitive)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'clientes' 
        AND LOWER(column_name) = LOWER('regimeTributario')
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        BEGIN
            ALTER TABLE clientes ADD COLUMN "regimeTributario" VARCHAR(50);
            RAISE NOTICE '✅ Coluna regimeTributario adicionada com sucesso';
        EXCEPTION
            WHEN duplicate_column THEN
                RAISE NOTICE 'ℹ️ Coluna regimeTributario já existe (detectada durante criação)';
            WHEN OTHERS THEN
                RAISE EXCEPTION 'Erro ao criar coluna: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'ℹ️ Coluna regimeTributario já existe';
    END IF;
END $$;

-- Verificar se a coluna foi criada (mostra todas as colunas da tabela clientes)
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'clientes'
ORDER BY ordinal_position;

-- Se a coluna "regimeTributario" aparecer na lista acima, foi criada com sucesso!

