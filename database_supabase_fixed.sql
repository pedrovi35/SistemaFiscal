-- ========================================
-- Sistema Fiscal - Script SQL Corrigido para PostgreSQL (Supabase)
-- ========================================
-- Versão: 2.0.0
-- Descrição: Script compatível com o modelo TypeScript
-- Compatibilidade: PostgreSQL 12+ / Supabase
-- ========================================

-- Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ========================================
-- Remover tabelas existentes (se houver)
-- ========================================
DROP TABLE IF EXISTS historico CASCADE;
DROP TABLE IF EXISTS recorrencias CASCADE;
DROP TABLE IF EXISTS feriados CASCADE;
DROP TABLE IF EXISTS parcelamentos CASCADE;
DROP TABLE IF EXISTS impostos CASCADE;
DROP TABLE IF EXISTS obrigacoes CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;

-- Remover tipos existentes
DROP TYPE IF EXISTS tipo_obrigacao CASCADE;
DROP TYPE IF EXISTS status_obrigacao CASCADE;
DROP TYPE IF EXISTS tipo_recorrencia_obrigacao CASCADE;

-- ========================================
-- Criar tipos ENUM
-- ========================================
CREATE TYPE tipo_obrigacao AS ENUM ('FEDERAL', 'ESTADUAL', 'MUNICIPAL', 'TRABALHISTA', 'PREVIDENCIARIA', 'OUTRO');
CREATE TYPE status_obrigacao AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'ATRASADA', 'CANCELADA');
CREATE TYPE tipo_recorrencia_obrigacao AS ENUM ('MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'PERSONALIZADO');

-- ========================================
-- Tabela de Clientes
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

CREATE INDEX idx_clientes_ativo ON clientes(ativo);
CREATE INDEX idx_clientes_cnpj ON clientes(cnpj);
CREATE INDEX idx_clientes_nome ON clientes(nome);

COMMENT ON TABLE clientes IS 'Armazena informações dos clientes do sistema';

-- ========================================
-- Tabela de Obrigações
-- ========================================
CREATE TABLE obrigacoes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    "dataVencimento" DATE NOT NULL,
    "dataVencimentoOriginal" DATE,
    tipo tipo_obrigacao NOT NULL,
    status status_obrigacao NOT NULL DEFAULT 'PENDENTE',
    cliente TEXT,
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
CREATE INDEX idx_obrigacoes_cliente ON obrigacoes(cliente);
CREATE INDEX idx_obrigacoes_status ON obrigacoes(status);
CREATE INDEX idx_obrigacoes_data_vencimento ON obrigacoes("dataVencimento");
CREATE INDEX idx_obrigacoes_tipo ON obrigacoes(tipo);
CREATE INDEX idx_obrigacoes_responsavel ON obrigacoes(responsavel);
CREATE INDEX idx_obrigacoes_empresa ON obrigacoes(empresa);
CREATE INDEX idx_obrigacoes_cliente_status ON obrigacoes(cliente, status);
CREATE INDEX idx_obrigacoes_tipo_status ON obrigacoes(tipo, status);

COMMENT ON TABLE obrigacoes IS 'Armazena as obrigações fiscais dos clientes';
COMMENT ON COLUMN obrigacoes.tipo IS 'Tipo de obrigação fiscal';
COMMENT ON COLUMN obrigacoes.status IS 'Status atual da obrigação';
COMMENT ON COLUMN obrigacoes."ajusteDataUtil" IS 'Se TRUE, ajusta automaticamente para dia útil se cair em feriado';
COMMENT ON COLUMN obrigacoes."preferenciaAjuste" IS 'Define se ajusta para dia útil anterior ou próximo: anterior ou proximo';

-- ========================================
-- Tabela de Recorrências
-- ========================================
CREATE TABLE recorrencias (
    id SERIAL PRIMARY KEY,
    "obrigacaoId" TEXT NOT NULL,
    tipo tipo_recorrencia_obrigacao NOT NULL,
    intervalo INTEGER,
    "diaDoMes" INTEGER,
    "dataFim" DATE,
    "proximaOcorrencia" DATE,
    "criadaEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("obrigacaoId") REFERENCES obrigacoes(id) ON DELETE CASCADE,
    CONSTRAINT uk_recorrencia_obrigacao UNIQUE ("obrigacaoId")
);

CREATE INDEX idx_recorrencias_obrigacao ON recorrencias("obrigacaoId");
CREATE INDEX idx_recorrencias_tipo ON recorrencias(tipo);

COMMENT ON TABLE recorrencias IS 'Define recorrências para obrigações';

-- ========================================
-- Tabela de Feriados
-- ========================================
CREATE TABLE feriados (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    ano INTEGER,
    CONSTRAINT uk_feriado_data_ano UNIQUE(data, ano)
);

CREATE INDEX idx_feriados_data ON feriados(data);
CREATE INDEX idx_feriados_ano ON feriados(ano);
CREATE INDEX idx_feriados_tipo ON feriados(tipo);

COMMENT ON TABLE feriados IS 'Cache de feriados nacionais e regionais';

-- ========================================
-- Tabela de Histórico
-- ========================================
CREATE TABLE historico (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "obrigacaoId" TEXT NOT NULL,
    usuario VARCHAR(255),
    tipo VARCHAR(50) NOT NULL,
    "camposAlterados" JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("obrigacaoId") REFERENCES obrigacoes(id) ON DELETE CASCADE
);

CREATE INDEX idx_historico_obrigacao ON historico("obrigacaoId");
CREATE INDEX idx_historico_timestamp ON historico(timestamp);
CREATE INDEX idx_historico_usuario ON historico(usuario);

COMMENT ON TABLE historico IS 'Registra histórico de alterações nas obrigações';

-- ========================================
-- Triggers para atualizadoEm automático
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
CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON clientes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_obrigacoes_updated_at 
    BEFORE UPDATE ON obrigacoes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Views Úteis
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

-- ========================================
-- Functions (Stored Procedures)
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

-- Function: Obter obrigações por período
CREATE OR REPLACE FUNCTION sp_obrigacoes_por_periodo(
    p_data_inicio DATE,
    p_data_fim DATE
)
RETURNS TABLE (
    id TEXT,
    titulo VARCHAR,
    descricao TEXT,
    "dataVencimento" DATE,
    tipo tipo_obrigacao,
    status status_obrigacao,
    cliente TEXT,
    empresa VARCHAR,
    responsavel VARCHAR,
    "ajusteDataUtil" BOOLEAN,
    "criadoEm" TIMESTAMP,
    "atualizadoEm" TIMESTAMP,
    "clienteNome" VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.titulo,
        o.descricao,
        o."dataVencimento",
        o.tipo,
        o.status,
        o.cliente,
        o.empresa,
        o.responsavel,
        o."ajusteDataUtil",
        o."criadoEm",
        o."atualizadoEm",
        c.nome AS "clienteNome"
    FROM obrigacoes o
    LEFT JOIN clientes c ON o.cliente = c.id
    WHERE o."dataVencimento" BETWEEN p_data_inicio AND p_data_fim
    ORDER BY o."dataVencimento" ASC;
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

-- ========================================
-- Inserir Dados Iniciais de Exemplo
-- ========================================

-- Inserir clientes de exemplo
INSERT INTO clientes (id, nome, cnpj, email, telefone, ativo, "regimeTributario") VALUES
('cliente-1-uuid', 'ACME Ltda', '12.345.678/0001-90', 'contato@acme.com', '(11) 3333-4444', TRUE, 'MEI'),
('cliente-2-uuid', 'Beta Serviços S.A.', '98.765.432/0001-10', 'beta@servicos.com', '(21) 9999-0000', TRUE, 'Simples Nacional'),
('cliente-3-uuid', 'Gamma Holding Ltda', '55.444.333/0001-22', 'financeiro@gamma.com', '(31) 2222-3333', TRUE, 'Lucro Presumido'),
('cliente-4-uuid', 'Delta Corporate S.A.', '66.777.888/0001-44', 'contato@delta.com', '(41) 8888-9999', TRUE, 'Lucro Real'),
('cliente-5-uuid', 'Epsilon Comércio ME', '11.222.333/0001-55', 'vendas@epsilon.com.br', '(47) 4444-5555', TRUE, 'MEI'),
('cliente-6-uuid', 'Zeta Consultoria', '99.888.777/0001-66', 'contato@zeta.com.br', '(85) 6666-7777', TRUE, 'Simples Nacional')
ON CONFLICT (cnpj) DO UPDATE SET nome = EXCLUDED.nome;

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
('2024-12-25', 'Natal', 'nacional', 2024)
ON CONFLICT (data, ano) DO UPDATE SET nome = EXCLUDED.nome;

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
('2025-12-25', 'Natal', 'nacional', 2025)
ON CONFLICT (data, ano) DO UPDATE SET nome = EXCLUDED.nome;

-- Inserir obrigações de exemplo
INSERT INTO obrigacoes (id, titulo, descricao, "dataVencimento", "dataVencimentoOriginal", tipo, status, cliente, responsavel, "ajusteDataUtil", "preferenciaAjuste") VALUES
('obrigacao-1-uuid', 'Declaração Mensal MEI', 'Entrega obrigatória mensal para MEI', '2025-01-20', '2025-01-20', 'FEDERAL', 'PENDENTE', 'cliente-1-uuid', 'João Silva', TRUE, 'proximo'),
('obrigacao-2-uuid', 'GPS - Guia da Previdência Social', 'Guia de recolhimento mensal', '2025-02-10', '2025-02-10', 'PREVIDENCIARIA', 'PENDENTE', 'cliente-1-uuid', 'João Silva', TRUE, 'anterior'),
('obrigacao-3-uuid', 'DAS - Documento de Arrecadação', 'DAS Simples Nacional', '2025-02-20', '2025-02-20', 'FEDERAL', 'PENDENTE', 'cliente-2-uuid', 'Maria Santos', TRUE, 'proximo'),
('obrigacao-4-uuid', 'Declaração Anual', 'Declaração de Imposto de Renda', '2025-04-30', '2025-04-30', 'FEDERAL', 'PENDENTE', 'cliente-3-uuid', 'Pedro Costa', TRUE, 'anterior'),
('obrigacao-5-uuid', 'IPTU - Primeira Parcela', 'Primeira parcela do IPTU 2025', '2025-03-10', '2025-03-10', 'MUNICIPAL', 'PENDENTE', 'cliente-5-uuid', 'Ana Lima', TRUE, 'proximo')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- Finalização
-- ========================================

-- Mostrar informações do banco criado
SELECT 
    'Banco de dados criado com sucesso!' AS mensagem,
    current_database() AS "bancoAtual",
    NOW() AS "criadoEm";

-- Listar tabelas criadas
SELECT table_name AS "nomeTabela"
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ========================================
-- FIM DO SCRIPT
-- ========================================

