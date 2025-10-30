# 🐬 Guia de Configuração MySQL - Sistema Fiscal

Este guia irá ajudá-lo a configurar o MySQL como banco de dados para o Sistema Fiscal.

---

## 📋 Pré-requisitos

- MySQL 5.7+ ou MariaDB 10.3+
- Acesso de administrador ao MySQL
- Node.js instalado no sistema

---

## 🚀 Instalação Rápida

### 1. Criar o Banco de Dados

```bash
# No Windows (PowerShell ou CMD)
mysql -u root -p < database_mysql.sql

# No Linux/Mac
mysql -u root -p < database_mysql.sql
```

### 2. Instalar Dependências do Backend

```bash
cd backend
npm install mysql2
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
# Banco de Dados
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sistema_fiscal
DB_USER=root
DB_PASSWORD=sua_senha_aqui

# Servidor
PORT=3001
NODE_ENV=production
```

### 4. Modificar Configuração do Banco

O arquivo `backend/src/config/database.ts` precisa ser atualizado para suportar MySQL. Veja a seção de [Configuração Avançada](#configuração-avançada).

---

## 📝 Instruções Detalhadas

### Opção A: Via Linha de Comando

#### 1. Conectar ao MySQL

```bash
mysql -u root -p
```

#### 2. Executar o Script

```sql
SOURCE /caminho/para/o/projeto/database_mysql.sql;
```

Ou execute diretamente:

```bash
mysql -u root -p sistema_fiscal < database_mysql.sql
```

### Opção B: Via MySQL Workbench

1. Abra o MySQL Workbench
2. Conecte-se ao servidor MySQL
3. Vá em `File` → `Open SQL Script`
4. Selecione o arquivo `database_mysql.sql`
5. Execute o script (Ctrl+Shift+Enter)

### Opção C: Via phpMyAdmin

1. Acesse o phpMyAdmin
2. Clique em "Importar"
3. Selecione o arquivo `database_mysql.sql`
4. Clique em "Executar"

---

## ⚙️ Configuração Avançada

### Atualizar database.ts

Atualize o arquivo `backend/src/config/database.ts`:

```typescript
import sqlite3 from 'sqlite3';
import mysql from 'mysql2/promise';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const dbType = process.env.DB_TYPE || 'sqlite';

let db: any;

export async function getDatabase() {
  if (dbType === 'mysql') {
    // Conectar ao MySQL
    return await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'sistema_fiscal',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });
  } else {
    // SQLite (padrão para desenvolvimento)
    const DB_DIR = join(__dirname, '../../database');
    const DB_PATH = join(DB_DIR, 'fiscal.db');
    
    if (!existsSync(DB_DIR)) {
      mkdirSync(DB_DIR, { recursive: true });
    }
    
    return new sqlite3.Database(DB_PATH);
  }
}

// Exportar métodos promisificados
export default {
  run: async (sql: string, params: any[] = []) => {
    const connection = await getDatabase();
    if (dbType === 'mysql') {
      const [result] = await connection.execute(sql, params);
      return { changes: (result as any).affectedRows, lastID: (result as any).insertId };
    } else {
      return new Promise((resolve, reject) => {
        (connection as any).run(sql, params, function(err: any) {
          if (err) reject(err);
          else resolve({ changes: this.changes, lastID: this.lastID });
        });
      });
    }
  },
  get: async (sql: string, params: any[] = []) => {
    const connection = await getDatabase();
    if (dbType === 'mysql') {
      const [rows] = await connection.execute(sql, params);
      return (rows as any[])[0] || null;
    } else {
      return new Promise((resolve, reject) => {
        (connection as any).get(sql, params, (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }
  },
  all: async (sql: string, params: any[] = []) => {
    const connection = await getDatabase();
    if (dbType === 'mysql') {
      const [rows] = await connection.execute(sql, params);
      return rows as any[];
    } else {
      return new Promise((resolve, reject) => {
        (connection as any).all(sql, params, (err: any, rows: any) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
    }
  },
  exec: async (sql: string) => {
    const connection = await getDatabase();
    if (dbType === 'mysql') {
      await connection.query(sql);
    } else {
      return new Promise((resolve, reject) => {
        (connection as any).exec(sql, (err: any) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
    }
  }
};
```

---

## 🔍 Verificação

### Testar Conexão

Execute no MySQL:

```sql
USE sistema_fiscal;
SHOW TABLES;
```

Você deve ver 7 tabelas:
- clientes
- obrigacoes
- impostos
- parcelamentos
- recorrencias
- feriados
- historico_alteracoes

### Verificar Dados

```sql
-- Ver clientes inseridos
SELECT * FROM clientes;

-- Ver obrigações de exemplo
SELECT * FROM obrigacoes;

-- Ver estatísticas gerais
CALL sp_estatisticas_gerais();
```

---

## 🔧 Troubleshooting

### Erro: "Access denied for user"

**Solução**: Verifique as credenciais no arquivo `.env`

```env
DB_USER=seu_usuario
DB_PASSWORD=sua_senha_correta
```

### Erro: "Database does not exist"

**Solução**: Execute o script SQL novamente:

```bash
mysql -u root -p < database_mysql.sql
```

### Erro: "Unknown database 'sistema_fiscal'"

**Solução**: Certifique-se de que o script foi executado completamente:

```sql
CREATE DATABASE IF NOT EXISTS sistema_fiscal;
USE sistema_fiscal;
```

### Erro: "Event Scheduler is disabled"

**Solução**: Habilite o event scheduler:

```sql
SET GLOBAL event_scheduler = ON;
```

### Erro de Codificação (Acentos)

**Solução**: Verifique se o charset está correto:

```sql
-- Verificar charset do banco
SHOW VARIABLES LIKE 'character_set_database';

-- Deve retornar: utf8mb4
```

---

## 📊 Utilidades

### Views Criadas

```sql
-- Obrigações por cliente
SELECT * FROM vw_obrigacoes_por_cliente;

-- Próximas obrigações (30 dias)
SELECT * FROM vw_proximas_obrigacoes;

-- Parcelamentos resumidos
SELECT * FROM vw_parcelamentos_resumo;
```

### Stored Procedures

```sql
-- Atualizar obrigações atrasadas
CALL sp_atualizar_obrigacoes_atrasadas();

-- Obter obrigações por período
CALL sp_obrigacoes_por_periodo('2024-01-01', '2024-12-31');

-- Estatísticas gerais
CALL sp_estatisticas_gerais();
```

### Backup

```bash
# Backup completo
mysqldump -u root -p sistema_fiscal > backup_sistema_fiscal_$(date +%Y%m%d).sql

# Backup apenas estrutura
mysqldump -u root -p --no-data sistema_fiscal > backup_estrutura.sql

# Backup apenas dados
mysqldump -u root -p --no-create-info sistema_fiscal > backup_dados.sql
```

### Restaurar Backup

```bash
mysql -u root -p sistema_fiscal < backup_sistema_fiscal_20240101.sql
```

---

## 🔐 Segurança

### Criar Usuário Dedicado

```sql
-- Criar usuário específico para a aplicação
CREATE USER 'sistema_fiscal_user'@'localhost' IDENTIFIED BY 'senha_segura_aqui';

-- Dar permissões apenas no banco sistema_fiscal
GRANT ALL PRIVILEGES ON sistema_fiscal.* TO 'sistema_fiscal_user'@'localhost';

-- Aplicar permissões
FLUSH PRIVILEGES;
```

Atualize o `.env`:

```env
DB_USER=sistema_fiscal_user
DB_PASSWORD=senha_segura_aqui
```

### Firewall

Se o banco estiver em servidor remoto:

```bash
# Linux
sudo ufw allow 3306/tcp

# Windows
# Configurar regra no Windows Firewall
```

### SSL/TLS (Produção)

Para conexões seguras em produção, adicione SSL ao `.env`:

```env
DB_SSL=true
```

---

## 📈 Performance

### Otimizações Recomendadas

```sql
-- Verificar índices
SHOW INDEX FROM obrigacoes;

-- Analisar queries lentas
SELECT * FROM information_schema.PROCESSLIST WHERE time > 5;

-- Otimizar tabelas
OPTIMIZE TABLE obrigacoes;
OPTIMIZE TABLE parcelamentos;
```

### Connection Pooling

O arquivo de configuração já inclui connection pooling:

```typescript
connectionLimit: 10,
queueLimit: 0
```

Ajuste conforme necessário.

---

## 🔄 Migração SQLite → MySQL

Se você já tem dados no SQLite e quer migrar para MySQL, consulte a seção de **Migração de Dados** no arquivo [DATABASE.md](DATABASE.md).

---

## 📞 Suporte

Para mais informações:
- 📖 [Documentação Completa](DATABASE.md)
- 🐛 [Issues no GitHub](../../issues)
- 📧 Contate o administrador do sistema

---

**Desenvolvido com ❤️ para o Sistema Fiscal**

