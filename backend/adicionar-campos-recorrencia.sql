-- ========================================
-- Migração: Adicionar Campos de Recorrência Automática
-- ========================================
-- Data: 07/11/2025
-- Descrição: Adiciona campos para suportar geração automática de obrigações recorrentes
-- ========================================

-- Adicionar campo 'ativo' (permite pausar/retomar recorrência)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recorrencias' 
        AND column_name = 'ativo'
    ) THEN
        ALTER TABLE recorrencias 
        ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
        
        UPDATE recorrencias SET ativo = TRUE WHERE ativo IS NULL;
        
        RAISE NOTICE 'Coluna ativo adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna ativo já existe.';
    END IF;
END $$;

-- Adicionar campo 'dia_geracao' (dia do mês para gerar a obrigação, padrão: 1)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recorrencias' 
        AND column_name = 'dia_geracao'
    ) THEN
        ALTER TABLE recorrencias 
        ADD COLUMN dia_geracao INTEGER DEFAULT 1;
        
        UPDATE recorrencias SET dia_geracao = 1 WHERE dia_geracao IS NULL;
        
        RAISE NOTICE 'Coluna dia_geracao adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna dia_geracao já existe.';
    END IF;
END $$;

-- Adicionar campo 'data_fim' (quando parar a recorrência)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recorrencias' 
        AND column_name = 'data_fim'
    ) THEN
        ALTER TABLE recorrencias 
        ADD COLUMN data_fim DATE;
        
        RAISE NOTICE 'Coluna data_fim adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna data_fim já existe.';
    END IF;
END $$;

-- Adicionar campo 'ultima_geracao' (data da última geração automática)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recorrencias' 
        AND column_name = 'ultima_geracao'
    ) THEN
        ALTER TABLE recorrencias 
        ADD COLUMN ultima_geracao DATE;
        
        RAISE NOTICE 'Coluna ultima_geracao adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna ultima_geracao já existe.';
    END IF;
END $$;

-- Adicionar campo 'proxima_ocorrencia' (próxima data de criação)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recorrencias' 
        AND column_name = 'proxima_ocorrencia'
    ) THEN
        ALTER TABLE recorrencias 
        ADD COLUMN proxima_ocorrencia DATE;
        
        RAISE NOTICE 'Coluna proxima_ocorrencia adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna proxima_ocorrencia já existe.';
    END IF;
END $$;

-- Adicionar comentários nas colunas
COMMENT ON COLUMN recorrencias.ativo IS 
    'Indica se a recorrência está ativa (permite pausar/retomar)';

COMMENT ON COLUMN recorrencias.dia_geracao IS 
    'Dia do mês para gerar automaticamente a obrigação (padrão: 1 = primeiro dia do mês)';

COMMENT ON COLUMN recorrencias.data_fim IS 
    'Data limite para parar a geração automática de obrigações recorrentes';

COMMENT ON COLUMN recorrencias.ultima_geracao IS 
    'Data da última geração automática realizada';

COMMENT ON COLUMN recorrencias.proxima_ocorrencia IS 
    'Próxima data prevista para criação da obrigação';

-- Verificar resultado
SELECT 
    'Migração concluída com sucesso!' AS status,
    COUNT(*) AS total_recorrencias,
    COUNT(CASE WHEN ativo = TRUE THEN 1 END) AS recorrencias_ativas,
    COUNT(CASE WHEN ativo = FALSE THEN 1 END) AS recorrencias_pausadas,
    COUNT(CASE WHEN dia_geracao IS NOT NULL THEN 1 END) AS com_dia_geracao,
    COUNT(CASE WHEN ultima_geracao IS NOT NULL THEN 1 END) AS com_ultima_geracao
FROM recorrencias;

-- Exibir estrutura atual da tabela
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'recorrencias'
ORDER BY ordinal_position;

