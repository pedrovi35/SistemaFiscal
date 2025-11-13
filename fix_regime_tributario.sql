-- ========================================
-- Script de Correção: Adicionar coluna regimeTributario
-- ========================================
-- Este script adiciona a coluna regimeTributario na tabela clientes
-- se ela não existir. Execute este script no SQL Editor do Supabase.
-- ========================================

-- Adicionar coluna regimeTributario se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'clientes' 
        AND column_name = 'regimeTributario'
    ) THEN
        ALTER TABLE clientes ADD COLUMN "regimeTributario" VARCHAR(50);
        RAISE NOTICE '✅ Coluna regimeTributario adicionada com sucesso';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna regimeTributario já existe';
    END IF;
END $$;

-- Verificar se a coluna foi criada
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'clientes' 
AND column_name = 'regimeTributario';

-- Se a consulta acima retornar uma linha, a coluna foi criada com sucesso!

