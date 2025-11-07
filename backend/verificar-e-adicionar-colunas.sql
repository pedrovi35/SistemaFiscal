-- ========================================
-- Script para Adicionar Colunas Faltantes no Banco de Dados
-- ========================================
-- Descrição: Adiciona data_vencimento_original e preferencia_ajuste
--            na tabela obrigacoes de forma segura
-- ========================================

-- Adicionar data_vencimento_original
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'obrigacoes' 
        AND column_name = 'data_vencimento_original'
    ) THEN
        ALTER TABLE obrigacoes 
        ADD COLUMN data_vencimento_original DATE;
        
        -- Preencher com valor de data_vencimento para registros existentes
        UPDATE obrigacoes 
        SET data_vencimento_original = data_vencimento 
        WHERE data_vencimento_original IS NULL;
        
        RAISE NOTICE 'Coluna data_vencimento_original adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna data_vencimento_original já existe.';
    END IF;
END $$;

-- Adicionar preferencia_ajuste
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'obrigacoes' 
        AND column_name = 'preferencia_ajuste'
    ) THEN
        ALTER TABLE obrigacoes 
        ADD COLUMN preferencia_ajuste VARCHAR(10) DEFAULT 'proximo';
        
        -- Atualizar registros existentes
        UPDATE obrigacoes 
        SET preferencia_ajuste = 'proximo' 
        WHERE preferencia_ajuste IS NULL;
        
        RAISE NOTICE 'Coluna preferencia_ajuste adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna preferencia_ajuste já existe.';
    END IF;
END $$;

-- Adicionar comentários nas colunas
COMMENT ON COLUMN obrigacoes.data_vencimento_original IS 
    'Data de vencimento original antes do ajuste para dia útil';

COMMENT ON COLUMN obrigacoes.preferencia_ajuste IS 
    'Define se ajusta para dia útil anterior ou próximo: anterior ou proximo';

-- Verificar resultado
SELECT 
    'Migração concluída com sucesso!' AS status,
    COUNT(*) AS total_obrigacoes,
    COUNT(data_vencimento_original) AS com_data_original,
    COUNT(CASE WHEN preferencia_ajuste = 'proximo' THEN 1 END) AS com_ajuste_proximo,
    COUNT(CASE WHEN preferencia_ajuste = 'anterior' THEN 1 END) AS com_ajuste_anterior
FROM obrigacoes;

