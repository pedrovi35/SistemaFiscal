# 🐘 Guia de Configuração Supabase - Sistema Fiscal

Este guia irá ajudá-lo a configurar o Supabase (PostgreSQL) como banco de dados para o Sistema Fiscal.

⚠️ **IMPORTANTE:** Use o arquivo `database_supabase_fixed.sql` em vez do arquivo antigo `database_supabase.sql`. O novo script está totalmente compatível com o modelo TypeScript do sistema.

---

## 📋 Pré-requisitos

- Conta no Supabase ([criar conta gratuita](https://supabase.com))
- Projeto criado no Supabase
- Node.js instalado no sistema

---

## 🚀 Instalação Rápida

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha:
   - **Nome**: Sistema Fiscal
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha a região mais próxima (Brasil: South America - São Paulo)
5. Aguarde a criação do projeto (~2 minutos)

### 2. Executar Script SQL

1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo do arquivo **`database_supabase_fixed.sql`** ⚠️ (USE O ARQUIVO FIXED!)
4. Clique em **Run** (ou pressione Ctrl+Enter)

**OU** execute via linha de comando:

```bash
# Instalar CLI do Supabase
npm install -g supabase

# Login no Supabase
supabase login

# Vincular ao seu projeto
supabase link --project-ref seu-project-ref

# Executar script SQL (USE O FIXED!)
supabase db execute -f database_supabase_fixed.sql
```

### 3. Instalar Dependências do Backend

```bash
cd backend
npm install pg
```

### 4. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
# Banco de Dados Supabase (PostgreSQL)
DATABASE_URL=postgresql://postgres.seu-project-ref:sua-senha@aws-0-sa-east-1.pooler.supabase.com:5432/postgres

# Servidor
PORT=3001
NODE_ENV=production
CORS_ORIGIN=http://localhost:5173
```

**Onde encontrar a DATABASE_URL:**
1. No Supabase Dashboard → **Settings** → **Database**
2. Role até **Connection String** → **Connection pooling**
3. Selecione **Mode: Transaction**
4. Copie a URL de conexão
5. Substitua `[YOUR-PASSWORD]` pela senha do banco que você criou no passo 1

**Exemplo de DATABASE_URL:**
```
postgresql://postgres.abc123xyz:MinHaS3nh4F0rt3@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

---

## 📝 Instruções Detalhadas

### Opção A: Via Supabase Dashboard (Recomendado)

1. **Acesse o SQL Editor**
   - No menu lateral do Supabase
   - Clique em "SQL Editor"

2. **Criar Nova Query**
   - Clique em "New Query"
   - Dê um nome (ex: "Setup Sistema Fiscal")

3. **Cole e Execute o Script**
   - Copie todo o conteúdo de `database_supabase.sql`
   - Cole no editor
   - Clique em **Run** (ou Ctrl+Enter)

4. **Verificar Execução**
   - Deve aparecer "Success. No rows returned"
   - Verifique a aba "Table Editor" para ver as tabelas criadas

### Opção B: Via Supabase CLI

```bash
# 1. Instalar CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Inicializar projeto local (opcional)
supabase init

# 4. Vincular ao projeto remoto
supabase link --project-ref seu-project-ref

# 5. Executar script SQL
supabase db execute -f database_supabase.sql
```

### Opção C: Via Arquivo SQL

```bash
# Copiar arquivo para o projeto local do Supabase
cp database_supabase.sql supabase/migrations/YYYYMMDDHHMMSS_create_tables.sql

# Aplicar migração
supabase db push
```

---

## ⚙️ Configuração Avançada

### Atualizar database.ts

Atualize o arquivo `backend/src/config/database.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import sqlite3 from 'sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const dbType = process.env.DB_TYPE || 'sqlite';

let supabaseClient: any;

if (dbType === 'supabase') {
  supabaseClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );
}

export async function getDatabase() {
  if (dbType === 'supabase') {
    return supabaseClient;
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

// Wrapper para compatibilidade com SQLite
export default {
  run: async (sql: string, params: any[] = []) => {
    if (dbType === 'supabase') {
      // Para PostgreSQL, use query() diretamente
      const { error } = await supabaseClient.rpc('execute_sql', { sql_query: sql });
      if (error) throw error;
      return { changes: 1, lastID: 0 };
    } else {
      // SQLite
      return new Promise((resolve, reject) => {
        (getDatabase() as any).run(sql, params, function(err: any) {
          if (err) reject(err);
          else resolve({ changes: this.changes, lastID: this.lastID });
        });
      });
    }
  },
  get: async (table: string, filters: any = {}) => {
    if (dbType === 'supabase') {
      const { data, error } = await supabaseClient
        .from(table)
        .select('*')
        .match(filters)
        .single();
      if (error) throw error;
      return data;
    } else {
      // Implementar para SQLite
      return null;
    }
  },
  all: async (table: string, filters: any = {}) => {
    if (dbType === 'supabase') {
      const { data, error } = await supabaseClient
        .from(table)
        .select('*')
        .match(filters);
      if (error) throw error;
      return data || [];
    } else {
      // Implementar para SQLite
      return [];
    }
  }
};
```

---

## 🔍 Verificação

### Testar Conexão

Execute no SQL Editor do Supabase:

```sql
-- Ver tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Deve retornar 7 tabelas
```

### Verificar Dados

```sql
-- Ver clientes inseridos
SELECT * FROM clientes;

-- Ver obrigações de exemplo
SELECT * FROM obrigacoes;

-- Ver estatísticas gerais
SELECT * FROM sp_estatisticas_gerais();

-- Ver próximas obrigações
SELECT * FROM vw_proximas_obrigacoes;
```

### Testar via Dashboard

1. Acesse **Table Editor** no menu lateral
2. Deve ver todas as tabelas criadas
3. Clique em qualquer tabela para ver os dados

---

## 🎯 Recursos Específicos do Supabase

### 1. Real-time Subscriptions

```typescript
// Exemplo: Escutar mudanças em tempo real
const subscription = supabase
  .channel('obrigacoes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'obrigacoes' },
    (payload) => {
      console.log('Mudança detectada:', payload);
    }
  )
  .subscribe();
```

### 2. Autenticação (Row Level Security)

Se quiser habilitar autenticação de usuários:

```sql
-- Habilitar RLS
ALTER TABLE obrigacoes ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own obligations" 
ON obrigacoes FOR SELECT 
USING (auth.uid()::text = created_by);

-- Política: Usuários podem inserir suas próprias obrigações
CREATE POLICY "Users can insert own obligations" 
ON obrigacoes FOR INSERT 
WITH CHECK (auth.uid()::text = created_by);
```

### 3. Storage (para documentos)

```typescript
// Upload de arquivo
const { data, error } = await supabase.storage
  .from('documentos')
  .upload('relatorio.pdf', file);

// Download
const { data, error } = await supabase.storage
  .from('documentos')
  .download('relatorio.pdf');
```

### 4. Edge Functions

Para criar funções serverless:

```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { email, subject, body } = await req.json()
  // Enviar email
  return new Response(JSON.stringify({ success: true }))
})
```

---

## 🔧 Troubleshooting

### Erro: "relation does not exist"

**Solução**: Execute o script SQL novamente e verifique se todas as tabelas foram criadas.

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Erro: "column does not exist"

**Solução**: Verifique se os nomes das colunas estão corretos (PostgreSQL é case-sensitive).

### Erro de Conexão

**Solução**: Verifique:
1. URL do Supabase está correta
2. Chave API está correta
3. Firewall permite conexões do Supabase

### Erro: "permission denied"

**Solução**: Verifique permissões do usuário:

```sql
-- Ver permissões
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'obrigacoes';
```

### RLS Bloqueando Consultas

**Solução**: Se habilitou RLS, crie políticas adequadas ou desabilite temporariamente:

```sql
ALTER TABLE obrigacoes DISABLE ROW LEVEL SECURITY;
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

### Functions

```sql
-- Atualizar obrigações atrasadas
SELECT sp_atualizar_obrigacoes_atrasadas();

-- Obter obrigações por período
SELECT * FROM sp_obrigacoes_por_periodo('2024-01-01', '2024-12-31');

-- Estatísticas gerais
SELECT * FROM sp_estatisticas_gerais();
```

### Backup

O Supabase faz backup automático diariamente. Para backup manual:

```bash
# Via CLI
supabase db dump -f backup.sql

# Via Dashboard
Settings → Database → Backups → Manual Backup
```

---

## 🔐 Segurança

### 1. Variáveis de Ambiente

**NUNCA** commite as chaves do Supabase no Git:

```bash
# .env (adicionar ao .gitignore)
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# .env.example (exemplo seguro)
SUPABASE_KEY=your_supabase_key_here
```

### 2. Row Level Security

Para produção, sempre habilite RLS:

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE obrigacoes ENABLE ROW LEVEL SECURITY;
-- ... etc
```

### 3. API Keys

- Use `SUPABASE_KEY` (anon) no frontend
- Use `SUPABASE_SERVICE_KEY` apenas no backend
- Nunca exponha a service key publicamente

### 4. HTTPS

O Supabase já força HTTPS, mas configure domínio customizado em produção:

```
Settings → Authentication → URL Configuration
```

---

## 📈 Performance

### Índices

O script já cria índices otimizados. Verifique se foram criados:

```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Query Performance

Use `EXPLAIN ANALYZE` para otimizar queries:

```sql
EXPLAIN ANALYZE
SELECT * FROM obrigacoes WHERE cliente_id = 1;
```

### Connection Pooling

O Supabase já tem connection pooling ativado. Use:

```
postgresql://postgres.ytodollcittgwbcdjwfj:%5B15juca%40%5D@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
```

---

## 🔄 Migração SQLite → Supabase

Consulte a seção de **Migração de Dados** no arquivo [DATABASE.md](DATABASE.md).

---

## 💰 Custos

### Plano Gratuito (Hobby)

- ✅ 500 MB de banco de dados
- ✅ 2 GB de storage
- ✅ 2 GB de bandwidth
- ✅ API ilimitada

### Quando fazer upgrade:

- > 500 MB de dados
- Precisa de backup mais longo que 7 dias
- Precisa de mais de 1 projeto

---

## 📞 Suporte

- 📖 [Documentação Supabase](https://supabase.com/docs)
- 💬 [Discord Supabase](https://discord.supabase.com)
- 🐛 [Issues no GitHub](../../issues)
- 📧 Suporte por email (planos pagos)

---

## 🔗 Links Úteis

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [PostgREST API](https://postgrest.org/)

---

**Desenvolvido com ❤️ para o Sistema Fiscal**

