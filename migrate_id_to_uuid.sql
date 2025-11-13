-- ========================================
-- Migração: Alterar coluna id de INTEGER para TEXT (UUID)
-- ========================================
-- Este script altera a coluna id da tabela clientes de SERIAL/INTEGER
-- para TEXT para suportar UUIDs. Execute este script no SQL Editor do Supabase.
-- 
-- ⚠️ ATENÇÃO: Este script irá:
-- 1. Gerar novos UUIDs para todos os registros existentes
-- 2. Atualizar referências na tabela obrigacoes (se existir)
-- 3. Remover a coluna id antiga e criar uma nova como TEXT
-- 
-- ⚠️ BACKUP: Faça backup do banco antes de executar!
-- ========================================

-- Verificar o tipo atual da coluna id
DO $$ 
DECLARE
    current_type TEXT;
    row_count INTEGER;
BEGIN
    SELECT data_type INTO current_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clientes'
    AND column_name = 'id';
    
    SELECT COUNT(*) INTO row_count FROM clientes;
    
    RAISE NOTICE 'Tipo atual da coluna id: %', current_type;
    RAISE NOTICE 'Registros existentes na tabela clientes: %', row_count;
    
    IF current_type = 'integer' OR current_type = 'bigint' THEN
        RAISE NOTICE '⚠️ Coluna id é INTEGER. Iniciando migração para TEXT...';
        
        -- Se houver registros, criar mapeamento de IDs antigos para novos
        IF row_count > 0 THEN
            -- Criar tabela temporária para mapeamento
            CREATE TEMP TABLE IF NOT EXISTS id_mapping (
                old_id INTEGER,
                new_id TEXT
            );
            
            -- Gerar novos UUIDs e mapear
            INSERT INTO id_mapping (old_id, new_id)
            SELECT id, gen_random_uuid()::TEXT FROM clientes;
            
            -- Atualizar referências na tabela obrigacoes (se existir e tiver coluna cliente)
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'obrigacoes'
                AND column_name = 'cliente'
            ) THEN
                UPDATE obrigacoes o
                SET cliente = m.new_id
                FROM id_mapping m
                WHERE o.cliente::TEXT = m.old_id::TEXT;
                
                RAISE NOTICE '✅ Referências na tabela obrigacoes atualizadas';
            END IF;
        END IF;
        
        -- Criar nova coluna temporária
        ALTER TABLE clientes ADD COLUMN id_new TEXT;
        
        -- Copiar novos IDs do mapeamento ou gerar novos
        IF row_count > 0 THEN
            UPDATE clientes c
            SET id_new = m.new_id
            FROM id_mapping m
            WHERE c.id = m.old_id;
        END IF;
        
        -- Remover a constraint de chave primária
        ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_pkey;
        
        -- Remover a constraint de foreign key se existir (obrigacoes)
        ALTER TABLE obrigacoes DROP CONSTRAINT IF EXISTS obrigacoes_cliente_fkey;
        
        -- Remover a coluna antiga
        ALTER TABLE clientes DROP COLUMN id;
        
        -- Renomear a nova coluna
        ALTER TABLE clientes RENAME COLUMN id_new TO id;
        
        -- Recriar a chave primária
        ALTER TABLE clientes ADD PRIMARY KEY (id);
        
        -- Adicionar default para novos registros
        ALTER TABLE clientes ALTER COLUMN id SET DEFAULT gen_random_uuid()::TEXT;
        
        -- Limpar tabela temporária
        DROP TABLE IF EXISTS id_mapping;
        
        RAISE NOTICE '✅ Migração concluída: coluna id agora é TEXT (UUID)';
    ELSIF current_type = 'text' OR current_type = 'character varying' THEN
        RAISE NOTICE 'ℹ️ Coluna id já é TEXT. Nenhuma migração necessária.';
    ELSE
        RAISE EXCEPTION 'Tipo de coluna id desconhecido: %', current_type;
    END IF;
END $$;

-- Verificar o tipo final da coluna id
SELECT 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'clientes'
AND column_name = 'id';

-- Se data_type for 'text' ou 'character varying', a migração foi bem-sucedida!

