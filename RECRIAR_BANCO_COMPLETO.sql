-- ========================================
-- RECRIAÇÃO COMPLETA DO BANCO DE DADOS
-- Sistema Fiscal - PostgreSQL/Supabase
-- ========================================
-- Este script REMOVE tudo e RECRIA o banco corretamente
-- Versão: 3.0 - CORRIGIDA com UUIDs
-- ========================================

-- ========================================
-- PASSO 1: LIMPAR TUDO (Remover tabelas existentes)
-- ========================================
-- Remover triggers primeiro
DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
DROP TRIGGER IF EXISTS update_obrigacoes_updated_at ON obrigacoes;
DROP TRIGGER IF EXISTS tr_obrigacoes_historico_update ON obrigacoes;

-- Remover tabelas (CASCADE remove dependências)
DROP TABLE IF EXISTS historico CASCADE;
DROP TABLE IF EXISTS recorrencias CASCADE;
DROP TABLE IF EXISTS feriados CASCADE;
DROP TABLE IF EXISTS parcelamentos CASCADE;
DROP TABLE IF EXISTS impostos CASCADE;
DROP TABLE IF EXISTS obrigacoes CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;

-- Remover views
DROP VIEW IF EXISTS vw_obrigacoes_por_cliente CASCADE;
DROP VIEW IF EXISTS vw_proximas_obrigacoes CASCADE;
DROP VIEW IF EXISTS vw_parcelamentos_resumo CASCADE;

-- Remover tipos ENUM existentes
DROP TYPE IF EXISTS tipo_obrigacao CASCADE;
DROP TYPE IF EXISTS status_obrigacao CASCADE;
DROP TYPE IF EXISTS tipo_recorrencia_obrigacao CASCADE;
DROP TYPE IF EXISTS status_imposto CASCADE;
DROP TYPE IF EXISTS tipo_recorrencia CASCADE;

-- Remover funções existentes
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS sp_atualizar_obrigacoes_atrasadas() CASCADE;
DROP FUNCTION IF EXISTS sp_estatisticas_gerais() CASCADE;
DROP FUNCTION IF EXISTS log_obrigacao_changes() CASCADE;

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

DO $$ BEGIN
    RAISE NOTICE '✅ Banco de dados limpo com sucesso!';
END $$;

-- ========================================
-- PASSO 2: CRIAR TIPOS ENUM
-- ========================================
CREATE TYPE tipo_obrigacao AS ENUM (
    'FEDERAL', 
    'ESTADUAL', 
    'MUNICIPAL', 
    'TRABALHISTA', 
    'PREVIDENCIARIA', 
    'OUTRO'
);

CREATE TYPE status_obrigacao AS ENUM (
    'PENDENTE', 
    'EM_ANDAMENTO', 
    'CONCLUIDA', 
    'ATRASADA', 
    'CANCELADA'
);

CREATE TYPE tipo_recorrencia_obrigacao AS ENUM (
    'MENSAL', 
    'BIMESTRAL', 
    'TRIMESTRAL', 
    'SEMESTRAL', 
    'ANUAL', 
    'PERSONALIZADO'
);

DO $$ BEGIN
    RAISE NOTICE '✅ Tipos ENUM criados com sucesso!';
END $$;

-- ========================================
-- PASSO 3: CRIAR TABELA CLIENTES (CORRETO COM UUID)
-- ========================================
CREATE TABLE clientes (
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

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);

COMMENT ON TABLE clientes IS 'Armazena informações dos clientes do sistema';

DO $$ BEGIN
    RAISE NOTICE '✅ Tabela CLIENTES criada com UUID!';
END $$;

-- ========================================
-- PASSO 4: CRIAR TABELA OBRIGAÇÕES
-- ========================================
CREATE TABLE obrigacoes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    "dataVencimento" DATE NOT NULL,
    "dataVencimentoOriginal" DATE,
    tipo tipo_obrigacao NOT NULL,
    status status_obrigacao NOT NULL DEFAULT 'PENDENTE',
    cliente TEXT REFERENCES clientes(id) ON DELETE SET NULL,
    empresa VARCHAR(255),
    responsavel VARCHAR(255),
    "ajusteDataUtil" BOOLEAN DEFAULT TRUE,
    "preferenciaAjuste" VARCHAR(10) DEFAULT 'proximo',
    cor VARCHAR(50),
    "criadoEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "criadoPor" VARCHAR(255)
);

-- Índices para obrigações
CREATE INDEX IF NOT EXISTS idx_obrigacoes_cliente ON obrigacoes(cliente);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_status ON obrigacoes(status);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_data_vencimento ON obrigacoes("dataVencimento");
CREATE INDEX IF NOT EXISTS idx_obrigacoes_tipo ON obrigacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_responsavel ON obrigacoes(responsavel);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_empresa ON obrigacoes(empresa);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_cliente_status ON obrigacoes(cliente, status);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_tipo_status ON obrigacoes(tipo, status);

COMMENT ON TABLE obrigacoes IS 'Armazena as obrigações fiscais dos clientes';
COMMENT ON COLUMN obrigacoes.tipo IS 'Tipo de obrigação fiscal';
COMMENT ON COLUMN obrigacoes.status IS 'Status atual da obrigação';
COMMENT ON COLUMN obrigacoes."ajusteDataUtil" IS 'Se TRUE, ajusta automaticamente para dia útil se cair em feriado';
COMMENT ON COLUMN obrigacoes."preferenciaAjuste" IS 'Define se ajusta para dia útil anterior ou próximo: anterior ou proximo';

DO $$ BEGIN
    RAISE NOTICE '✅ Tabela OBRIGAÇÕES criada!';
END $$;

-- ========================================
-- PASSO 5: CRIAR TABELA RECORRÊNCIAS
-- ========================================
CREATE TABLE recorrencias (
    id SERIAL PRIMARY KEY,
    "obrigacaoId" TEXT NOT NULL REFERENCES obrigacoes(id) ON DELETE CASCADE,
    tipo tipo_recorrencia_obrigacao NOT NULL,
    intervalo INTEGER,
    "diaDoMes" INTEGER,
    "dataFim" DATE,
    "proximaOcorrencia" DATE,
    "criadaEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_recorrencia_obrigacao UNIQUE ("obrigacaoId")
);

CREATE INDEX IF NOT EXISTS idx_recorrencias_obrigacao ON recorrencias("obrigacaoId");
CREATE INDEX IF NOT EXISTS idx_recorrencias_tipo ON recorrencias(tipo);

COMMENT ON TABLE recorrencias IS 'Define recorrências para obrigações';

DO $$ BEGIN
    RAISE NOTICE '✅ Tabela RECORRÊNCIAS criada!';
END $$;

-- ========================================
-- PASSO 6: CRIAR TABELA FERIADOS
-- ========================================
CREATE TABLE feriados (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    ano INTEGER,
    CONSTRAINT uk_feriado_data_ano UNIQUE(data, ano)
);

CREATE INDEX IF NOT EXISTS idx_feriados_data ON feriados(data);
CREATE INDEX IF NOT EXISTS idx_feriados_ano ON feriados(ano);
CREATE INDEX IF NOT EXISTS idx_feriados_tipo ON feriados(tipo);

COMMENT ON TABLE feriados IS 'Cache de feriados nacionais e regionais';

DO $$ BEGIN
    RAISE NOTICE '✅ Tabela FERIADOS criada!';
END $$;

-- ========================================
-- PASSO 7: CRIAR TABELA HISTÓRICO
-- ========================================
CREATE TABLE historico (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "obrigacaoId" TEXT NOT NULL REFERENCES obrigacoes(id) ON DELETE CASCADE,
    usuario VARCHAR(255),
    tipo VARCHAR(50) NOT NULL,
    "camposAlterados" JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historico_obrigacao ON historico("obrigacaoId");
CREATE INDEX IF NOT EXISTS idx_historico_timestamp ON historico(timestamp);
CREATE INDEX IF NOT EXISTS idx_historico_usuario ON historico(usuario);

COMMENT ON TABLE historico IS 'Registra histórico de alterações nas obrigações';

DO $$ BEGIN
    RAISE NOTICE '✅ Tabela HISTÓRICO criada!';
END $$;

-- ========================================
-- PASSO 8: CRIAR TRIGGERS
-- ========================================

-- Função para atualizar atualizadoEm
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."atualizadoEm" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas
DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON clientes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_obrigacoes_updated_at ON obrigacoes;
CREATE TRIGGER update_obrigacoes_updated_at 
    BEFORE UPDATE ON obrigacoes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN
    RAISE NOTICE '✅ Triggers criados!';
END $$;

-- ========================================
-- PASSO 9: CRIAR VIEWS
-- ========================================

-- View: Obrigações resumidas por cliente
CREATE OR REPLACE VIEW vw_obrigacoes_por_cliente AS
SELECT 
    c.id AS "clienteId",
    c.nome AS "clienteNome",
    c.cnpj AS "clienteCnpj",
    COUNT(o.id) AS "totalObrigacoes",
    SUM(CASE WHEN o.status = 'PENDENTE' THEN 1 ELSE 0 END) AS "obrigacoesPendentes",
    SUM(CASE WHEN o.status = 'ATRASADA' THEN 1 ELSE 0 END) AS "obrigacoesAtrasadas",
    SUM(CASE WHEN o.status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS "obrigacoesConcluidas"
FROM clientes c
LEFT JOIN obrigacoes o ON c.id = o.cliente
GROUP BY c.id, c.nome, c.cnpj;

-- View: Próximas obrigações (30 dias)
CREATE OR REPLACE VIEW vw_proximas_obrigacoes AS
SELECT 
    o.id,
    o.titulo,
    o."dataVencimento",
    o.status,
    o.tipo,
    o.responsavel,
    c.nome AS "clienteNome",
    (o."dataVencimento" - CURRENT_DATE) AS "diasRestantes"
FROM obrigacoes o
LEFT JOIN clientes c ON o.cliente = c.id
WHERE o."dataVencimento" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND o.status NOT IN ('CONCLUIDA', 'CANCELADA')
ORDER BY o."dataVencimento" ASC;

DO $$ BEGIN
    RAISE NOTICE '✅ Views criadas!';
END $$;

-- ========================================
-- PASSO 10: CRIAR FUNCTIONS
-- ========================================

-- Function: Atualizar status de obrigações atrasadas
CREATE OR REPLACE FUNCTION sp_atualizar_obrigacoes_atrasadas()
RETURNS INTEGER AS $$
DECLARE
    registros_afetados INTEGER;
BEGIN
    UPDATE obrigacoes
    SET status = 'ATRASADA'
    WHERE "dataVencimento" < CURRENT_DATE
        AND status IN ('PENDENTE', 'EM_ANDAMENTO');
    
    GET DIAGNOSTICS registros_afetados = ROW_COUNT;
    RETURN registros_afetados;
END;
$$ LANGUAGE plpgsql;

-- Function: Estatísticas gerais
CREATE OR REPLACE FUNCTION sp_estatisticas_gerais()
RETURNS TABLE (
    "totalClientesAtivos" BIGINT,
    "obrigacoesPendentes" BIGINT,
    "obrigacoesAtrasadas" BIGINT,
    "obrigacoesConcluidas" BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM clientes WHERE ativo = TRUE) AS "totalClientesAtivos",
        (SELECT COUNT(*) FROM obrigacoes WHERE status = 'PENDENTE') AS "obrigacoesPendentes",
        (SELECT COUNT(*) FROM obrigacoes WHERE status = 'ATRASADA') AS "obrigacoesAtrasadas",
        (SELECT COUNT(*) FROM obrigacoes WHERE status = 'CONCLUIDA') AS "obrigacoesConcluidas";
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    RAISE NOTICE '✅ Functions criadas!';
END $$;

-- ========================================
-- PASSO 11: INSERIR DADOS DE EXEMPLO
-- ========================================

-- Inserir feriados nacionais 2024
INSERT INTO feriados (data, nome, tipo, ano) VALUES
('2024-01-01', 'Confraternização Universal', 'nacional', 2024),
('2024-02-12', 'Carnaval', 'nacional', 2024),
('2024-02-13', 'Carnaval', 'nacional', 2024),
('2024-02-14', 'Quarta-feira de Cinzas', 'nacional', 2024),
('2024-03-29', 'Sexta-feira Santa', 'nacional', 2024),
('2024-04-21', 'Tiradentes', 'nacional', 2024),
('2024-05-01', 'Dia do Trabalho', 'nacional', 2024),
('2024-09-07', 'Independência do Brasil', 'nacional', 2024),
('2024-10-12', 'Nossa Senhora Aparecida', 'nacional', 2024),
('2024-11-02', 'Finados', 'nacional', 2024),
('2024-11-15', 'Proclamação da República', 'nacional', 2024),
('2024-11-20', 'Consciência Negra', 'nacional', 2024),
('2024-12-25', 'Natal', 'nacional', 2024)
ON CONFLICT (data, ano) DO NOTHING;

-- Inserir feriados nacionais 2025
INSERT INTO feriados (data, nome, tipo, ano) VALUES
('2025-01-01', 'Confraternização Universal', 'nacional', 2025),
('2025-03-03', 'Carnaval', 'nacional', 2025),
('2025-03-04', 'Carnaval', 'nacional', 2025),
('2025-03-05', 'Quarta-feira de Cinzas', 'nacional', 2025),
('2025-04-18', 'Sexta-feira Santa', 'nacional', 2025),
('2025-04-21', 'Tiradentes', 'nacional', 2025),
('2025-05-01', 'Dia do Trabalho', 'nacional', 2025),
('2025-09-07', 'Independência do Brasil', 'nacional', 2025),
('2025-10-12', 'Nossa Senhora Aparecida', 'nacional', 2025),
('2025-11-02', 'Finados', 'nacional', 2025),
('2025-11-15', 'Proclamação da República', 'nacional', 2025),
('2025-11-20', 'Consciência Negra', 'nacional', 2025),
('2025-12-25', 'Natal', 'nacional', 2025)
ON CONFLICT (data, ano) DO NOTHING;

DO $$ BEGIN
    RAISE NOTICE '✅ Feriados inseridos!';
END $$;

-- ========================================
-- PASSO 12: VERIFICAÇÃO FINAL
-- ========================================

DO $$
DECLARE
    tipo_id_clientes TEXT;
    tipo_id_obrigacoes TEXT;
    total_tabelas INTEGER;
BEGIN
    -- Verificar tipo da coluna id em clientes
    SELECT data_type INTO tipo_id_clientes
    FROM information_schema.columns
    WHERE table_name = 'clientes' AND column_name = 'id';
    
    -- Verificar tipo da coluna id em obrigacoes
    SELECT data_type INTO tipo_id_obrigacoes
    FROM information_schema.columns
    WHERE table_name = 'obrigacoes' AND column_name = 'id';
    
    -- Contar tabelas criadas
    SELECT COUNT(*) INTO total_tabelas
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '🎉 BANCO DE DADOS RECRIADO COM SUCESSO!';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tabelas criadas: %', total_tabelas;
    RAISE NOTICE '✅ Tipo da coluna clientes.id: % (deve ser TEXT)', tipo_id_clientes;
    RAISE NOTICE '✅ Tipo da coluna obrigacoes.id: % (deve ser TEXT)', tipo_id_obrigacoes;
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '🚀 SISTEMA PRONTO PARA USO!';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Agora você pode:';
    RAISE NOTICE '1. Cadastrar clientes usando UUID';
    RAISE NOTICE '2. Criar obrigações fiscais';
    RAISE NOTICE '3. Configurar recorrências';
    RAISE NOTICE '4. Visualizar o calendário';
    RAISE NOTICE '';
END $$;

-- Listar todas as tabelas criadas
SELECT 
    table_name AS "Tabela Criada",
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS "Colunas"
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ========================================
-- FIM DO SCRIPT
-- ========================================

