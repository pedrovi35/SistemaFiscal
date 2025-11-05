-- ========================================
-- Migração: Adicionar coluna preferenciaAjuste na tabela obrigacoes
-- ========================================
-- Data: 2025-01-05
-- Descrição: Adiciona coluna para permitir ao usuário escolher se ajusta
--            a data para o dia útil anterior ou próximo quando cair em
--            final de semana ou feriado
-- ========================================

-- Verificar e adicionar coluna se não existir
DO $$ 
BEGIN
    -- Adicionar coluna preferenciaAjuste se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'obrigacoes' 
        AND column_name = 'preferenciaAjuste'
    ) THEN
        ALTER TABLE obrigacoes 
        ADD COLUMN "preferenciaAjuste" VARCHAR(10) DEFAULT 'proximo';
        
        RAISE NOTICE 'Coluna preferenciaAjuste adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna preferenciaAjuste já existe, pulando...';
    END IF;
END $$;

-- Adicionar comentário explicativo
COMMENT ON COLUMN obrigacoes."preferenciaAjuste" IS 
    'Define se ajusta para dia útil anterior ou próximo quando a data cair em fim de semana ou feriado: anterior ou proximo';

-- Atualizar registros existentes (opcional - define valor padrão para registros antigos)
UPDATE obrigacoes 
SET "preferenciaAjuste" = 'proximo' 
WHERE "preferenciaAjuste" IS NULL;

-- Verificar a migração
SELECT 
    'Migração concluída com sucesso!' AS status,
    COUNT(*) AS total_obrigacoes,
    COUNT(CASE WHEN "preferenciaAjuste" = 'proximo' THEN 1 END) AS com_ajuste_proximo,
    COUNT(CASE WHEN "preferenciaAjuste" = 'anterior' THEN 1 END) AS com_ajuste_anterior
FROM obrigacoes;

-- ========================================
-- FIM DA MIGRAÇÃO
-- ========================================

