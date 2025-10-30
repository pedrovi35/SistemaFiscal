# 🗄️ Banco de Dados - Sistema Fiscal

Este documento contém os scripts SQL para criação do banco de dados do Sistema Fiscal, suportando **SQLite** (desenvolvimento), **MySQL** e **Supabase/PostgreSQL** (produção).

---

## 📋 Índice

- [SQLite (Desenvolvimento)](#sqlite-desenvolvimento)
- [MySQL (Produção)](#mysql-produção)
- [Supabase/PostgreSQL (Produção em Nuvem)](#supabasepostgresql-produção-em-nuvem)
- ⚡ [Script MySQL Completo](database_mysql.sql) - Para servidores MySQL
- ⚡ [Script Supabase Completo](database_supabase.sql) - Para Supabase/PostgreSQL
- 🐬 [Guia de Configuração MySQL](MYSQL_SETUP.md) - Configuração passo a passo
- 🐘 [Guia de Configuração Supabase](SUPABASE_SETUP.md) - Configuração passo a passo
- [Regras de Negócio](#regras-de-negócio)
- [Configuração do Backend](#configuração-do-backend)
- [Migração de Dados](#migração-de-dados)

---

## 🗃️ SQLite (Desenvolvimento)

### Script de Criação

```sql
-- ========================================
-- Sistema Fiscal - SQLite Database Schema
-- ========================================

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT 1,
    regime_tributario VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Obrigações
CREATE TABLE IF NOT EXISTS obrigacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_vencimento DATE NOT NULL,
    data_conclusao DATE,
    tipo VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    cliente_id INTEGER,
    empresa VARCHAR(255),
    responsavel VARCHAR(255),
    ajuste_data_util BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

-- Tabela de Impostos
CREATE TABLE IF NOT EXISTS impostos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_vencimento DATE,
    tipo VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    cliente_id INTEGER,
    responsavel VARCHAR(255),
    recorrencia VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

-- Tabela de Parcelamentos
CREATE TABLE IF NOT EXISTS parcelamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    imposto_id INTEGER,
    cliente_id INTEGER,
    parcela_atual INTEGER NOT NULL DEFAULT 1,
    total_parcelas INTEGER NOT NULL DEFAULT 1,
    valor_parcela DECIMAL(10, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    responsavel VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (imposto_id) REFERENCES impostos(id) ON DELETE SET NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

-- Tabela de Recorrências
CREATE TABLE IF NOT EXISTS recorrencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    obrigacao_id INTEGER NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    intervalo INTEGER,
    dia_do_mes INTEGER,
    mes_do_ano INTEGER,
    criada_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (obrigacao_id) REFERENCES obrigacoes(id) ON DELETE CASCADE
);

-- Tabela de Feriados
CREATE TABLE IF NOT EXISTS feriados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data DATE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    ano INTEGER,
    UNIQUE(data, ano)
);

-- Tabela de Histórico de Alterações
CREATE TABLE IF NOT EXISTS historico_alteracoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    obrigacao_id INTEGER NOT NULL,
    campo_alterado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    usuario VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (obrigacao_id) REFERENCES obrigacoes(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_obrigacoes_cliente ON obrigacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_status ON obrigacoes(status);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_data_vencimento ON obrigacoes(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_impostos_cliente ON impostos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_parcelamentos_cliente ON parcelamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_feriados_data ON feriados(data);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER IF NOT EXISTS update_obrigacoes_timestamp 
AFTER UPDATE ON obrigacoes
BEGIN
    UPDATE obrigacoes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_clientes_timestamp 
AFTER UPDATE ON clientes
BEGIN
    UPDATE clientes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Dados iniciais de exemplo (opcional)
INSERT OR IGNORE INTO clientes (nome, cnpj, email, telefone, ativo, regime_tributario) VALUES
('ACME Ltda', '12.345.678/0001-90', 'contato@acme.com', '(11) 3333-4444', 1, 'MEI'),
('Beta Serviços', '98.765.432/0001-10', 'beta@servicos.com', '(21) 9999-0000', 1, 'Simples Nacional'),
('Gamma Holding', '55.444.333/0001-22', 'financeiro@gamma.com', '(31) 2222-3333', 1, 'Lucro Presumido'),
('Delta Corporate', '66.777.888/0001-44', 'contato@delta.com', '(41) 8888-9999', 1, 'Lucro Real');
```

---

## 🐬 MySQL (Produção)

> **💡 Recomendação**: Use o arquivo [`database_mysql.sql`](database_mysql.sql) que contém o script completo e otimizado com views, procedures, triggers e eventos!

> **📖 Guia Completo**: Consulte o [MYSQL_SETUP.md](MYSQL_SETUP.md) para instruções detalhadas de instalação.

### Script de Criação (Resumido)

```sql
-- ========================================
-- Sistema Fiscal - MySQL Database Schema
-- ========================================

CREATE DATABASE IF NOT EXISTS sistema_fiscal;
USE sistema_fiscal;

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE,
    regime_tributario VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_clientes_ativo (ativo),
    INDEX idx_clientes_cnpj (cnpj)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Obrigações
CREATE TABLE IF NOT EXISTS obrigacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_vencimento DATE NOT NULL,
    data_conclusao DATE,
    tipo ENUM('FEDERAL', 'ESTADUAL', 'MUNICIPAL', 'TRABALHISTA', 'PREVIDENCIARIA', 'OUTRO') NOT NULL,
    status ENUM('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'ATRASADA', 'CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    cliente_id INT,
    empresa VARCHAR(255),
    responsavel VARCHAR(255),
    ajuste_data_util BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    INDEX idx_obrigacoes_cliente (cliente_id),
    INDEX idx_obrigacoes_status (status),
    INDEX idx_obrigacoes_data_vencimento (data_vencimento),
    INDEX idx_obrigacoes_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Impostos
CREATE TABLE IF NOT EXISTS impostos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_vencimento DATE,
    tipo VARCHAR(50) NOT NULL,
    status ENUM('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'ATRASADO') NOT NULL DEFAULT 'PENDENTE',
    cliente_id INT,
    responsavel VARCHAR(255),
    recorrencia ENUM('Mensal', 'Anual', 'Personalizado') DEFAULT 'Mensal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    INDEX idx_impostos_cliente (cliente_id),
    INDEX idx_impostos_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Parcelamentos
CREATE TABLE IF NOT EXISTS parcelamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    imposto_id INT,
    cliente_id INT,
    parcela_atual INT NOT NULL DEFAULT 1,
    total_parcelas INT NOT NULL DEFAULT 1,
    valor_parcela DECIMAL(10, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status ENUM('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'ATRASADO') NOT NULL DEFAULT 'PENDENTE',
    responsavel VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (imposto_id) REFERENCES impostos(id) ON DELETE SET NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    INDEX idx_parcelamentos_cliente (cliente_id),
    INDEX idx_parcelamentos_imposto (imposto_id),
    INDEX idx_parcelamentos_status (status),
    CHECK (parcela_atual > 0 AND total_parcelas > 0),
    CHECK (parcela_atual <= total_parcelas)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Recorrências
CREATE TABLE IF NOT EXISTS recorrencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    obrigacao_id INT NOT NULL,
    tipo ENUM('MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'PERSONALIZADO') NOT NULL,
    intervalo INT,
    dia_do_mes INT,
    mes_do_ano INT,
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (obrigacao_id) REFERENCES obrigacoes(id) ON DELETE CASCADE,
    INDEX idx_recorrencias_obrigacao (obrigacao_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Feriados
CREATE TABLE IF NOT EXISTS feriados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data DATE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    ano INT,
    UNIQUE KEY uk_feriado_data_ano (data, ano),
    INDEX idx_feriados_data (data),
    INDEX idx_feriados_ano (ano)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Histórico de Alterações
CREATE TABLE IF NOT EXISTS historico_alteracoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    obrigacao_id INT NOT NULL,
    campo_alterado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    usuario VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (obrigacao_id) REFERENCES obrigacoes(id) ON DELETE CASCADE,
    INDEX idx_historico_obrigacao (obrigacao_id),
    INDEX idx_historico_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dados iniciais de exemplo
INSERT INTO clientes (nome, cnpj, email, telefone, ativo, regime_tributario) VALUES
('ACME Ltda', '12.345.678/0001-90', 'contato@acme.com', '(11) 3333-4444', TRUE, 'MEI'),
('Beta Serviços', '98.765.432/0001-10', 'beta@servicos.com', '(21) 9999-0000', TRUE, 'Simples Nacional'),
('Gamma Holding', '55.444.333/0001-22', 'financeiro@gamma.com', '(31) 2222-3333', TRUE, 'Lucro Presumido'),
('Delta Corporate', '66.777.888/0001-44', 'contato@delta.com', '(41) 8888-9999', TRUE, 'Lucro Real')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);
```

---

## 🐘 Supabase/PostgreSQL (Produção em Nuvem)

> **💡 Recomendação**: Use o arquivo [`database_supabase.sql`](database_supabase.sql) que contém o script completo e otimizado com views, functions, triggers e extensões!

> **📖 Guia Completo**: Consulte o [SUPABASE_SETUP.md](SUPABASE_SETUP.md) para instruções detalhadas de instalação.

### Vantagens do Supabase

- 🚀 **Deploy Instantâneo**: Banco hospedado na nuvem
- 🔄 **Real-time**: WebSockets integrados nativamente
- 🔐 **Autenticação**: Sistema completo de autenticação
- 📊 **Dashboard**: Interface web para gerenciar dados
- 💾 **Backup Automático**: Backups diários automáticos
- 🌍 **Global**: CDN global para performance
- 📈 **Escalável**: Adapta-se ao crescimento do projeto
- 🆓 **Free Tier**: Plano gratuito generoso

### Script de Criação (Resumido)

```sql
-- ========================================
-- Sistema Fiscal - PostgreSQL/Supabase Schema
-- ========================================

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    -- ... outros campos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tipos ENUM para PostgreSQL
CREATE TYPE tipo_obrigacao AS ENUM ('FEDERAL', 'ESTADUAL', 'MUNICIPAL', 'TRABALHISTA', 'PREVIDENCIARIA', 'OUTRO');
CREATE TYPE status_obrigacao AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'ATRASADA', 'CANCELADA');

-- Tabela de Obrigações
CREATE TABLE IF NOT EXISTS obrigacoes (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    tipo tipo_obrigacao NOT NULL,
    status status_obrigacao NOT NULL DEFAULT 'PENDENTE',
    -- ... outros campos
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

-- Views, Functions e Triggers
-- ... (ver arquivo completo database_supabase.sql)
```

### Diferenças do MySQL

| Recurso | MySQL | PostgreSQL/Supabase |
|---------|-------|---------------------|
| ID Auto-increment | `AUTO_INCREMENT` | `SERIAL` |
| ENUM | `ENUM('A', 'B')` | `CREATE TYPE` |
| Upsert | `ON DUPLICATE KEY UPDATE` | `ON CONFLICT DO UPDATE` |
| Stored Procedures | `DELIMITER //` | `CREATE FUNCTION` |
| Triggers | Sintaxe específica | Pl/pgSQL |
| Show Tables | `SHOW TABLES` | `SELECT FROM information_schema` |

---

## 📐 Regras de Negócio

### 1. Clientes
- ✅ **CNPJ único**: Cada cliente deve ter um CNPJ único no sistema
- ✅ **Status ativo/inativo**: Controla se o cliente está ativo para novas obrigações
- ✅ **Regime tributário**: Define o regime fiscal do cliente (MEI, Simples Nacional, Lucro Presumido, Lucro Real)

### 2. Obrigações
- ✅ **Status automático**: Muda para "ATRASADA" quando a data de vencimento passa
- ✅ **Cliente opcional**: Obrigações podem existir sem cliente vinculado
- ✅ **Ajuste de data útil**: Automaticamente ajusta para o próximo dia útil se vencimento cair em feriado/fim de semana
- ✅ **Tipos permitidos**: Federal, Estadual, Municipal, Trabalhista, Previdenciária, Outro
- ✅ **Histórico automático**: Todas as alterações são registradas na tabela `historico_alteracoes`

### 3. Impostos
- ✅ **Vinculado a cliente**: Cada imposto deve ter um cliente associado
- ✅ **Recorrência**: Define a periodicidade do imposto (Mensal, Anual, Personalizado)
- ✅ **Status**: Pendente, Em Andamento, Concluído, Atrasado

### 4. Parcelamentos
- ✅ **Validação de parcelas**: A parcela atual não pode ser maior que o total de parcelas
- ✅ **Valor obrigatório**: Cada parcela deve ter um valor definido
- ✅ **Vinculação**: Pode estar vinculado a um imposto e/ou cliente
- ✅ **Progressão automática**: Sistema pode avançar a parcela automaticamente ao concluir

### 5. Feriados
- ✅ **Unicidade por ano**: Não pode haver duplicatas de feriados no mesmo ano
- ✅ **Integração BrasilAPI**: Feriados podem ser sincronizados com API externa

---

## ⚙️ Configuração do Backend

### SQLite (Desenvolvimento)

O SQLite já está configurado por padrão no backend. Nenhuma configuração adicional é necessária.

**Arquivo**: `backend/database/fiscal.db`

### MySQL (Produção)

#### 1. Instalar Dependências
```bash
cd backend
npm install mysql2
```

#### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` no diretório `backend/`:

```env
# Banco de Dados
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sistema_fiscal
DB_USER=seu_usuario
DB_PASSWORD=sua_senha

# Servidor
PORT=3001
NODE_ENV=production
```

#### 3. Modificar o Arquivo de Configuração

Atualize `backend/src/config/database.ts`:

```typescript
import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';

const dbType = process.env.DB_TYPE || 'sqlite';

export async function getDatabase() {
  if (dbType === 'mysql') {
    return await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'sistema_fiscal',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  } else {
    // SQLite (padrão)
    return new sqlite3.Database('database/fiscal.db');
  }
}
```

#### 4. Executar Script de Criação

```bash
# Conecte ao MySQL e execute o script
mysql -u seu_usuario -p < DATABASE.md  # Copie apenas a parte do MySQL
```

Ou crie um arquivo separado `database.sql` e execute:

```bash
mysql -u seu_usuario -p sistema_fiscal < database.sql
```

---

## 📊 Migração de Dados

### De SQLite para MySQL

```javascript
// Script de migração (backend/scripts/migrate-sqlite-to-mysql.js)
const sqlite3 = require('sqlite3');
const mysql = require('mysql2/promise');
const fs = require('fs');

async function migrate() {
  // Conectar ao SQLite
  const sqliteDb = new sqlite3.Database('database/fiscal.db');
  
  // Conectar ao MySQL
  const mysqlDb = await mysql.createConnection({
    host: 'localhost',
    user: 'seu_usuario',
    password: 'sua_senha',
    database: 'sistema_fiscal'
  });

  // Migrar Clientes
  sqliteDb.all('SELECT * FROM clientes', async (err, rows) => {
    if (err) throw err;
    
    for (const row of rows) {
      await mysqlDb.query(
        'INSERT INTO clientes (id, nome, cnpj, email, telefone, ativo, regime_tributario, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [row.id, row.nome, row.cnpj, row.email, row.telefone, row.ativo, row.regime_tributario, row.created_at, row.updated_at]
      );
    }
  });

  // Migrar Obrigações
  sqliteDb.all('SELECT * FROM obrigacoes', async (err, rows) => {
    if (err) throw err;
    
    for (const row of rows) {
      await mysqlDb.query(
        'INSERT INTO obrigacoes (id, titulo, descricao, data_vencimento, data_conclusao, tipo, status, cliente_id, empresa, responsavel, ajuste_data_util, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [row.id, row.titulo, row.descricao, row.data_vencimento, row.data_conclusao, row.tipo, row.status, row.cliente_id, row.empresa, row.responsavel, row.ajuste_data_util, row.created_at, row.updated_at]
      );
    }
  });

  // Repetir para outras tabelas...

  console.log('Migração concluída!');
  await mysqlDb.end();
  sqliteDb.close();
}

migrate();
```

### Executar Migração

```bash
cd backend
node scripts/migrate-sqlite-to-mysql.js
```

---

## 🔍 Queries Úteis

### Consultas Frequentes

```sql
-- Obrigações por cliente
SELECT c.nome, COUNT(o.id) as total_obrigacoes
FROM clientes c
LEFT JOIN obrigacoes o ON c.id = o.cliente_id
GROUP BY c.id, c.nome;

-- Obrigações atrasadas
SELECT * FROM obrigacoes
WHERE status = 'ATRASADA' OR (status = 'PENDENTE' AND data_vencimento < CURDATE());

-- Próximas obrigações (7 dias)
SELECT * FROM obrigacoes
WHERE data_vencimento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
AND status != 'CONCLUIDA';

-- Parcelamentos por cliente
SELECT c.nome, p.titulo, p.parcela_atual, p.total_parcelas, p.valor_parcela
FROM clientes c
JOIN parcelamentos p ON c.id = p.cliente_id
ORDER BY c.nome, p.data_vencimento;

-- Histórico de alterações recente
SELECT o.titulo, h.campo_alterado, h.valor_anterior, h.valor_novo, h.usuario, h.created_at
FROM historico_alteracoes h
JOIN obrigacoes o ON h.obrigacao_id = o.id
ORDER BY h.created_at DESC
LIMIT 50;
```

---

## 📝 Notas de Produção

### Segurança
- ✅ Use senhas fortes para o banco de dados
- ✅ Limite o acesso por IP no MySQL
- ✅ Use SSL/TLS para conexões remotas
- ✅ Faça backups regulares

### Performance
- ✅ Índices já criados nas colunas mais consultadas
- ✅ Use connection pooling para MySQL
- ✅ Configure cache no backend (Node-cache já implementado)
- ✅ Otimize queries complexas

### Backup
```bash
# SQLite
cp database/fiscal.db backup/fiscal_$(date +%Y%m%d).db

# MySQL
mysqldump -u usuario -p sistema_fiscal > backup/sistema_fiscal_$(date +%Y%m%d).sql
```

---

## 📞 Suporte

Para dúvidas ou problemas com o banco de dados:
- 📖 Leia a [documentação do projeto](../../README.md)
- 🐛 [Abra uma issue](../../issues) no GitHub
- 📧 Contate o administrador do sistema

---

**Desenvolvido com ❤️ para o Sistema Fiscal**

