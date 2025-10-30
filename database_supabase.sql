-- ========================================
-- Sistema Fiscal - Script SQL Completo para PostgreSQL (Supabase)
-- ========================================
-- Versão: 1.0.0
-- Descrição: Script completo de criação do banco de dados PostgreSQL/Supabase para o Sistema Fiscal
-- Compatibilidade: PostgreSQL 12+ / Supabase
-- ========================================

-- Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para buscas com LIKE mais eficientes

-- ========================================
-- Tabela de Clientes
-- ========================================
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE,
    regime_tributario VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);

-- ========================================
-- Tabela de Obrigações
-- ========================================
DO $$ BEGIN
  CREATE TYPE tipo_obrigacao AS ENUM ('FEDERAL', 'ESTADUAL', 'MUNICIPAL', 'TRABALHISTA', 'PREVIDENCIARIA', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE status_obrigacao AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'ATRASADA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS obrigacoes (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_vencimento DATE NOT NULL,
    data_conclusao DATE,
    tipo tipo_obrigacao NOT NULL,
    status status_obrigacao NOT NULL DEFAULT 'PENDENTE',
    cliente_id INTEGER,
    empresa VARCHAR(255),
    responsavel VARCHAR(255),
    ajuste_data_util BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Índices para obrigações
CREATE INDEX IF NOT EXISTS idx_obrigacoes_cliente ON obrigacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_status ON obrigacoes(status);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_data_vencimento ON obrigacoes(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_tipo ON obrigacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_responsavel ON obrigacoes(responsavel);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_empresa ON obrigacoes(empresa);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_cliente_status ON obrigacoes(cliente_id, status);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_tipo_status ON obrigacoes(tipo, status);

-- Comentários nas colunas
COMMENT ON COLUMN obrigacoes.tipo IS 'Tipo de obrigação fiscal';
COMMENT ON COLUMN obrigacoes.status IS 'Status atual da obrigação';
COMMENT ON COLUMN obrigacoes.ajuste_data_util IS 'Se TRUE, ajusta automaticamente para dia útil se cair em feriado';

-- ========================================
-- Tabela de Impostos
-- ========================================
DO $$ BEGIN
  CREATE TYPE status_imposto AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'ATRASADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE tipo_recorrencia AS ENUM ('Mensal', 'Anual', 'Personalizado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS impostos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_vencimento DATE,
    tipo VARCHAR(50) NOT NULL,
    status status_imposto NOT NULL DEFAULT 'PENDENTE',
    cliente_id INTEGER,
    responsavel VARCHAR(255),
    recorrencia tipo_recorrencia DEFAULT 'Mensal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Índices para impostos
CREATE INDEX IF NOT EXISTS idx_impostos_cliente ON impostos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_impostos_status ON impostos(status);
CREATE INDEX IF NOT EXISTS idx_impostos_tipo ON impostos(tipo);
CREATE INDEX IF NOT EXISTS idx_impostos_data_vencimento ON impostos(data_vencimento);

-- ========================================
-- Tabela de Parcelamentos
-- ========================================
CREATE TABLE IF NOT EXISTS parcelamentos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    imposto_id INTEGER,
    cliente_id INTEGER,
    parcela_atual INTEGER NOT NULL DEFAULT 1,
    total_parcelas INTEGER NOT NULL DEFAULT 1,
    valor_parcela DECIMAL(15, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status status_imposto NOT NULL DEFAULT 'PENDENTE',
    responsavel VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (imposto_id) REFERENCES impostos(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_parcelas_validas CHECK (parcela_atual > 0 AND total_parcelas > 0),
    CONSTRAINT chk_parcela_atual_valida CHECK (parcela_atual <= total_parcelas)
);

-- Índices para parcelamentos
CREATE INDEX IF NOT EXISTS idx_parcelamentos_cliente ON parcelamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_parcelamentos_imposto ON parcelamentos(imposto_id);
CREATE INDEX IF NOT EXISTS idx_parcelamentos_status ON parcelamentos(status);
CREATE INDEX IF NOT EXISTS idx_parcelamentos_data_vencimento ON parcelamentos(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_parcelamentos_cliente_status ON parcelamentos(cliente_id, status);

-- ========================================
-- Tabela de Recorrências
-- ========================================
DO $$ BEGIN
  CREATE TYPE tipo_recorrencia_obrigacao AS ENUM ('MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'PERSONALIZADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS recorrencias (
    id SERIAL PRIMARY KEY,
    obrigacao_id INTEGER NOT NULL,
    tipo tipo_recorrencia_obrigacao NOT NULL,
    intervalo INTEGER,
    dia_do_mes INTEGER,
    mes_do_ano INTEGER,
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (obrigacao_id) REFERENCES obrigacoes(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para recorrências
CREATE INDEX IF NOT EXISTS idx_recorrencias_obrigacao ON recorrencias(obrigacao_id);
CREATE INDEX IF NOT EXISTS idx_recorrencias_tipo ON recorrencias(tipo);

-- ========================================
-- Tabela de Feriados
-- ========================================
CREATE TABLE IF NOT EXISTS feriados (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    ano INTEGER,
    CONSTRAINT uk_feriado_data_ano UNIQUE(data, ano)
);

-- Índices para feriados
CREATE INDEX IF NOT EXISTS idx_feriados_data ON feriados(data);
CREATE INDEX IF NOT EXISTS idx_feriados_ano ON feriados(ano);
CREATE INDEX IF NOT EXISTS idx_feriados_tipo ON feriados(tipo);

-- ========================================
-- Tabela de Histórico de Alterações
-- ========================================
CREATE TABLE IF NOT EXISTS historico_alteracoes (
    id SERIAL PRIMARY KEY,
    obrigacao_id INTEGER NOT NULL,
    campo_alterado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    usuario VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (obrigacao_id) REFERENCES obrigacoes(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para histórico
CREATE INDEX IF NOT EXISTS idx_historico_obrigacao ON historico_alteracoes(obrigacao_id);
CREATE INDEX IF NOT EXISTS idx_historico_created_at ON historico_alteracoes(created_at);
CREATE INDEX IF NOT EXISTS idx_historico_usuario ON historico_alteracoes(usuario);

-- ========================================
-- Triggers para updated_at automático
-- ========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clientes_updated_at') THEN
    CREATE TRIGGER update_clientes_updated_at 
      BEFORE UPDATE ON clientes 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_obrigacoes_updated_at') THEN
    CREATE TRIGGER update_obrigacoes_updated_at 
      BEFORE UPDATE ON obrigacoes 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_impostos_updated_at') THEN
    CREATE TRIGGER update_impostos_updated_at 
      BEFORE UPDATE ON impostos 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_parcelamentos_updated_at') THEN
    CREATE TRIGGER update_parcelamentos_updated_at 
      BEFORE UPDATE ON parcelamentos 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ========================================
-- Trigger para Histórico de Alterações
-- ========================================

CREATE OR REPLACE FUNCTION log_obrigacao_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar alteração no título
    IF OLD.titulo IS DISTINCT FROM NEW.titulo THEN
        INSERT INTO historico_alteracoes (obrigacao_id, campo_alterado, valor_anterior, valor_novo, usuario)
        VALUES (NEW.id, 'titulo', OLD.titulo, NEW.titulo, current_user);
    END IF;
    
    -- Registrar alteração no status
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO historico_alteracoes (obrigacao_id, campo_alterado, valor_anterior, valor_novo, usuario)
        VALUES (NEW.id, 'status', OLD.status::text, NEW.status::text, current_user);
    END IF;
    
    -- Registrar alteração na data de vencimento
    IF OLD.data_vencimento IS DISTINCT FROM NEW.data_vencimento THEN
        INSERT INTO historico_alteracoes (obrigacao_id, campo_alterado, valor_anterior, valor_novo, usuario)
        VALUES (NEW.id, 'data_vencimento', OLD.data_vencimento::text, NEW.data_vencimento::text, current_user);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_obrigacoes_historico_update') THEN
    CREATE TRIGGER tr_obrigacoes_historico_update
      AFTER UPDATE ON obrigacoes
      FOR EACH ROW EXECUTE FUNCTION log_obrigacao_changes();
  END IF;
END $$;

-- ========================================
-- Views Úteis
-- ========================================

-- View: Obrigações resumidas por cliente
CREATE OR REPLACE VIEW vw_obrigacoes_por_cliente AS
SELECT 
    c.id AS cliente_id,
    c.nome AS cliente_nome,
    c.cnpj AS cliente_cnpj,
    COUNT(o.id) AS total_obrigacoes,
    SUM(CASE WHEN o.status = 'PENDENTE' THEN 1 ELSE 0 END) AS obrigacoes_pendentes,
    SUM(CASE WHEN o.status = 'ATRASADA' THEN 1 ELSE 0 END) AS obrigacoes_atrasadas,
    SUM(CASE WHEN o.status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS obrigacoes_concluidas
FROM clientes c
LEFT JOIN obrigacoes o ON c.id = o.cliente_id
GROUP BY c.id, c.nome, c.cnpj;

-- View: Próximas obrigações (30 dias)
CREATE OR REPLACE VIEW vw_proximas_obrigacoes AS
SELECT 
    o.id,
    o.titulo,
    o.data_vencimento,
    o.status,
    o.tipo,
    o.responsavel,
    c.nome AS cliente_nome,
    (o.data_vencimento - CURRENT_DATE) AS dias_restantes
FROM obrigacoes o
LEFT JOIN clientes c ON o.cliente_id = c.id
WHERE o.data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND o.status NOT IN ('CONCLUIDA', 'CANCELADA')
ORDER BY o.data_vencimento ASC;

-- View: Parcelamentos resumidos
CREATE OR REPLACE VIEW vw_parcelamentos_resumo AS
SELECT 
    p.id,
    p.titulo,
    p.parcela_atual,
    p.total_parcelas,
    p.valor_parcela,
    p.data_vencimento,
    p.status,
    c.nome AS cliente_nome,
    i.titulo AS imposto_titulo,
    ROUND((p.parcela_atual::NUMERIC / NULLIF(p.total_parcelas, 0)) * 100, 2) AS percentual_pago
FROM parcelamentos p
LEFT JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN impostos i ON p.imposto_id = i.id;

-- ========================================
-- Functions (Equivalente a Stored Procedures)
-- ========================================

-- Function: Atualizar status de obrigações atrasadas
CREATE OR REPLACE FUNCTION sp_atualizar_obrigacoes_atrasadas()
RETURNS INTEGER AS $$
DECLARE
    registros_afetados INTEGER;
BEGIN
    UPDATE obrigacoes
    SET status = 'ATRASADA'
    WHERE data_vencimento < CURRENT_DATE
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
    id INTEGER,
    titulo VARCHAR,
    descricao TEXT,
    data_vencimento DATE,
    data_conclusao DATE,
    tipo tipo_obrigacao,
    status status_obrigacao,
    cliente_id INTEGER,
    empresa VARCHAR,
    responsavel VARCHAR,
    ajuste_data_util BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    cliente_nome VARCHAR,
    cliente_cnpj VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.titulo,
        o.descricao,
        o.data_vencimento,
        o.data_conclusao,
        o.tipo,
        o.status,
        o.cliente_id,
        o.empresa,
        o.responsavel,
        o.ajuste_data_util,
        o.created_at,
        o.updated_at,
        c.nome AS cliente_nome,
        c.cnpj AS cliente_cnpj
    FROM obrigacoes o
    LEFT JOIN clientes c ON o.cliente_id = c.id
    WHERE o.data_vencimento BETWEEN p_data_inicio AND p_data_fim
    ORDER BY o.data_vencimento ASC;
END;
$$ LANGUAGE plpgsql;

-- Function: Estatísticas gerais
CREATE OR REPLACE FUNCTION sp_estatisticas_gerais()
RETURNS TABLE (
    total_clientes_ativos BIGINT,
    obrigacoes_pendentes BIGINT,
    obrigacoes_atrasadas BIGINT,
    obrigacoes_concluidas BIGINT,
    parcelas_pendentes BIGINT,
    valor_total_pendente NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM clientes WHERE ativo = TRUE) AS total_clientes_ativos,
        (SELECT COUNT(*) FROM obrigacoes WHERE status = 'PENDENTE') AS obrigacoes_pendentes,
        (SELECT COUNT(*) FROM obrigacoes WHERE status = 'ATRASADA') AS obrigacoes_atrasadas,
        (SELECT COUNT(*) FROM obrigacoes WHERE status = 'CONCLUIDA') AS obrigacoes_concluidas,
        (SELECT COUNT(*) FROM parcelamentos WHERE status = 'PENDENTE') AS parcelas_pendentes,
        COALESCE((SELECT SUM(valor_parcela) FROM parcelamentos WHERE status = 'PENDENTE'), 0) AS valor_total_pendente;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Inserir Dados Iniciais de Exemplo
-- ========================================

-- Inserir clientes de exemplo
INSERT INTO clientes (nome, cnpj, email, telefone, ativo, regime_tributario) VALUES
('ACME Ltda', '12.345.678/0001-90', 'contato@acme.com', '(11) 3333-4444', TRUE, 'MEI'),
('Beta Serviços S.A.', '98.765.432/0001-10', 'beta@servicos.com', '(21) 9999-0000', TRUE, 'Simples Nacional'),
('Gamma Holding Ltda', '55.444.333/0001-22', 'financeiro@gamma.com', '(31) 2222-3333', TRUE, 'Lucro Presumido'),
('Delta Corporate S.A.', '66.777.888/0001-44', 'contato@delta.com', '(41) 8888-9999', TRUE, 'Lucro Real'),
('Epsilon Comércio ME', '11.222.333/0001-55', 'vendas@epsilon.com.br', '(47) 4444-5555', TRUE, 'MEI'),
('Zeta Consultoria', '99.888.777/0001-66', 'contato@zeta.com.br', '(85) 6666-7777', TRUE, 'Simples Nacional')
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
INSERT INTO obrigacoes (titulo, descricao, data_vencimento, tipo, status, cliente_id, responsavel, ajuste_data_util) VALUES
('Declaração Mensal MEI', 'Entrega obrigatória mensal para MEI', '2024-01-20', 'FEDERAL', 'CONCLUIDA', 1, 'João Silva', TRUE),
('GPS - Guia da Previdência Social', 'Guia de recolhimento mensal', '2024-02-10', 'PREVIDENCIARIA', 'PENDENTE', 1, 'João Silva', TRUE),
('DAS - Documento de Arrecadação', 'DAS Simples Nacional', '2024-02-20', 'FEDERAL', 'PENDENTE', 2, 'Maria Santos', TRUE),
('Declaração Anual', 'Declaração de Imposto de Renda', '2024-04-30', 'FEDERAL', 'PENDENTE', 3, 'Pedro Costa', TRUE),
('IPTU - Primeira Parcela', 'Primeira parcela do IPTU 2024', '2024-03-10', 'MUNICIPAL', 'PENDENTE', 5, 'Ana Lima', TRUE)
ON CONFLICT DO NOTHING;

-- Inserir impostos de exemplo
INSERT INTO impostos (titulo, descricao, data_vencimento, tipo, status, cliente_id, responsavel, recorrencia) VALUES
('ICMS', 'Imposto sobre Circulação de Mercadorias', '2024-02-20', 'ESTADUAL', 'PENDENTE', 2, 'Maria Santos', 'Mensal'),
('ISS', 'Imposto sobre Serviços', '2024-02-20', 'MUNICIPAL', 'PENDENTE', 2, 'Maria Santos', 'Mensal'),
('IRPJ', 'Imposto de Renda Pessoa Jurídica', '2024-03-31', 'FEDERAL', 'PENDENTE', 3, 'Pedro Costa', 'Mensal'),
('CSLL', 'Contribuição Social sobre Lucro Líquido', '2024-03-31', 'FEDERAL', 'PENDENTE', 4, 'Carlos Oliveira', 'Mensal')
ON CONFLICT DO NOTHING;

-- ========================================
-- Comentários nas Tabelas
-- ========================================

COMMENT ON TABLE clientes IS 'Armazena informações dos clientes do sistema';
COMMENT ON TABLE obrigacoes IS 'Armazena as obrigações fiscais dos clientes';
COMMENT ON TABLE impostos IS 'Armazena impostos e taxas dos clientes';
COMMENT ON TABLE parcelamentos IS 'Armazena parcelamentos de impostos';
COMMENT ON TABLE recorrencias IS 'Define recorrências para obrigações';
COMMENT ON TABLE feriados IS 'Cache de feriados nacionais e regionais';
COMMENT ON TABLE historico_alteracoes IS 'Registra histórico de alterações nas obrigações';

-- ========================================
-- Row Level Security (RLS) - Supabase
-- ========================================

-- Habilitar RLS nas tabelas (opcional para Supabase)
-- ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE obrigacoes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE impostos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE parcelamentos ENABLE ROW LEVEL SECURITY;

-- Exemplo de política RLS (ajustar conforme necessário)
-- CREATE POLICY "Users can view their own data" ON obrigacoes
--     FOR SELECT USING (auth.uid()::text = created_by);

-- ========================================
-- Finalização
-- ========================================

-- Mostrar informações do banco criado
SELECT 
    'Banco de dados criado com sucesso!' AS mensagem,
    current_database() AS banco_atual,
    NOW() AS criado_em;

-- Listar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ========================================
-- FIM DO SCRIPT
-- ========================================
