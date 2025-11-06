-- ========================================
-- Migração: Corrigir Nomenclatura Snake Case
-- ========================================
-- Descrição: Adiciona constraint única em obrigacao_id para permitir ON CONFLICT
-- Data: 2024
-- ========================================

-- Adicionar constraint única em recorrencias.obrigacao_id
-- Isso permite usar ON CONFLICT(obrigacao_id) DO UPDATE
ALTER TABLE recorrencias 
DROP CONSTRAINT IF EXISTS uk_recorrencias_obrigacao_id;

ALTER TABLE recorrencias 
ADD CONSTRAINT uk_recorrencias_obrigacao_id UNIQUE (obrigacao_id);

-- Comentário explicativo
COMMENT ON CONSTRAINT uk_recorrencias_obrigacao_id ON recorrencias 
IS 'Garante que cada obrigação tem no máximo uma recorrência configurada';

-- ========================================
-- Verificação
-- ========================================

-- Verificar se a constraint foi criada
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE' 
  AND tc.table_name = 'recorrencias'
  AND tc.table_schema = 'public';

-- ========================================
-- FIM DA MIGRAÇÃO
-- ========================================

SELECT 'Migração concluída com sucesso!' AS status;

