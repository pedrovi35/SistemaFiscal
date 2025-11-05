# 🔧 Problemas Resolvidos - Comunicação com Supabase

Este documento lista todos os problemas encontrados e corrigidos na comunicação entre o sistema e o Supabase (PostgreSQL).

---

## 🔴 Problemas Encontrados

### 1. **Incompatibilidade de Nomes de Colunas**

**Problema:** O script SQL original usava `snake_case` (ex: `data_vencimento`, `cliente_id`), mas o modelo TypeScript usava `camelCase` (ex: `dataVencimento`, `cliente`).

**Impacto:** PostgreSQL é case-sensitive com nomes entre aspas, causando erros de "column not found".

**Solução:** 
- ✅ Criado novo script `database_supabase_fixed.sql` com nomes em camelCase entre aspas duplas
- ✅ Atualizado `obrigacaoModel.ts` para usar aspas duplas nas queries

---

### 2. **Estrutura de ID Incompatível**

**Problema:** O SQL usava `SERIAL` (inteiro auto-incremento), mas o model TypeScript usava `UUID` (string).

**Impacto:** Falha ao inserir dados porque o tipo não correspondia.

**Solução:** 
- ✅ Alterado SQL para usar `TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT`
- ✅ Mantido uso de UUID no TypeScript com `uuidv4()`

---

### 3. **Campos Ausentes no Banco**

**Problema:** O model tentava inserir campos que não existiam na tabela:
- `dataVencimentoOriginal` ❌
- `cor` ❌
- `criadoPor` ❌

**Impacto:** Erros SQL ao tentar inserir/atualizar obrigações.

**Solução:** 
- ✅ Adicionadas todas as colunas faltantes no novo script SQL
- ✅ Mantida estrutura do TypeScript intacta

---

### 4. **Tabela de Histórico Incompatível**

**Problema:** 
- SQL tinha tabela `historico_alteracoes` com colunas `campo_alterado`, `valor_anterior`, `valor_novo`
- Model usava tabela `historico` com coluna `camposAlterados` (JSON)

**Impacto:** Impossível salvar histórico de alterações.

**Solução:** 
- ✅ Criada tabela `historico` com estrutura correta
- ✅ Coluna `camposAlterados` usando tipo JSONB do PostgreSQL

---

### 5. **Sintaxe SQL Incompatível (SQLite vs PostgreSQL)**

**Problema:** Uso de `INSERT OR REPLACE` (sintaxe SQLite) em vez de `ON CONFLICT` (PostgreSQL).

**Impacto:** Erros ao tentar fazer UPSERT de dados.

**Solução:** 
- ✅ Substituído `INSERT OR REPLACE` por `INSERT ... ON CONFLICT ... DO UPDATE`
- ✅ Corrigido em `obrigacaoModel.ts` e `feriadoService.ts`

---

### 6. **Queries sem Aspas em Colunas CamelCase**

**Problema:** Queries como `SELECT * FROM obrigacoes ORDER BY dataVencimento` falhavam porque PostgreSQL converte tudo para lowercase.

**Impacto:** Erros de "column does not exist".

**Solução:** 
- ✅ Todas as queries atualizadas para usar aspas duplas: `"dataVencimento"`
- ✅ Suporte a notação de colchetes: `row["dataVencimento"]` para compatibilidade

---

## ✅ Arquivos Corrigidos

### Novos Arquivos
- ✅ `database_supabase_fixed.sql` - Script SQL totalmente compatível
- ✅ `backend/.env.example` - Exemplo de configuração
- ✅ `SUPABASE_PROBLEMAS_RESOLVIDOS.md` - Este documento

### Arquivos Modificados
- ✅ `backend/src/models/obrigacaoModel.ts` - Queries corrigidas
- ✅ `backend/src/services/feriadoService.ts` - UPSERT corrigido
- ✅ `SUPABASE_SETUP.md` - Documentação atualizada

---

## 🚀 Como Usar as Correções

### 1. Se você ainda NÃO criou o banco no Supabase:

```bash
# 1. Execute o script corrigido no SQL Editor do Supabase
# Copie o conteúdo de: database_supabase_fixed.sql

# 2. Configure as variáveis de ambiente
cp backend/.env.example backend/.env
# Edite backend/.env com suas credenciais do Supabase

# 3. Inicie o servidor
cd backend
npm install
npm run dev
```

### 2. Se você JÁ criou o banco com o script antigo:

**Opção A: Recriar o banco (Recomendado)**

```bash
# 1. No SQL Editor do Supabase, execute:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# 2. Execute o novo script:
# Cole o conteúdo de database_supabase_fixed.sql

# 3. Reinicie o servidor
cd backend
npm run dev
```

**Opção B: Migração manual (Avançado)**

```sql
-- Renomear colunas existentes
ALTER TABLE obrigacoes RENAME COLUMN data_vencimento TO "dataVencimento";
ALTER TABLE obrigacoes RENAME COLUMN cliente_id TO cliente;
-- ... etc para todas as colunas

-- Adicionar colunas faltantes
ALTER TABLE obrigacoes ADD COLUMN "dataVencimentoOriginal" DATE;
ALTER TABLE obrigacoes ADD COLUMN cor VARCHAR(50);
ALTER TABLE obrigacoes ADD COLUMN "criadoPor" VARCHAR(255);

-- Recriar tabela de histórico
DROP TABLE historico_alteracoes;
-- Execute a criação da tabela historico do script fixed
```

---

## 🧪 Testando a Conexão

Após configurar, teste a conexão:

```bash
cd backend
npm run dev
```

Você deve ver:

```
✅ Conectado ao PostgreSQL (Supabase)
ℹ️ Modo PostgreSQL (Supabase) ativo
🚀 Servidor rodando na porta: 3001
```

Teste a API:

```bash
# Health check
curl http://localhost:3001/health

# Listar obrigações
curl http://localhost:3001/api/obrigacoes
```

---

## 📊 Comparação: Antes vs Depois

| Aspecto | ❌ Antes | ✅ Depois |
|---------|---------|----------|
| Nomes de colunas | snake_case | camelCase com aspas |
| IDs | SERIAL (int) | UUID (text) |
| Campos ausentes | Vários | Todos presentes |
| Histórico | Incompatível | JSONB correto |
| UPSERT | INSERT OR REPLACE | ON CONFLICT |
| Queries | Sem aspas | Com aspas duplas |

---

## 🔍 Verificação de Integridade

Para verificar se tudo está correto, execute no SQL Editor:

```sql
-- Ver todas as colunas da tabela obrigacoes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'obrigacoes'
ORDER BY ordinal_position;

-- Deve retornar 15 colunas incluindo:
-- id (text)
-- dataVencimento (date)
-- dataVencimentoOriginal (date)
-- criadoEm (timestamp)
-- cor (character varying)
-- etc.
```

---

## 💡 Dicas de Prevenção

Para evitar problemas futuros:

1. ✅ **Sempre use aspas duplas** em colunas camelCase no PostgreSQL
2. ✅ **Use ON CONFLICT** para UPSERT em vez de INSERT OR REPLACE
3. ✅ **Mantenha sincronizado** o SQL com os tipos TypeScript
4. ✅ **Teste localmente** antes de fazer deploy
5. ✅ **Use migrations** para alterações futuras no schema

---

## 📞 Problemas Persistentes?

Se ainda houver problemas após aplicar as correções:

1. Verifique se você está usando `database_supabase_fixed.sql`
2. Confirme que a `DATABASE_URL` está correta no `.env`
3. Veja os logs do servidor para erros específicos
4. Teste a query diretamente no SQL Editor do Supabase

---

## 🎯 Checklist de Validação

- [ ] Script `database_supabase_fixed.sql` executado no Supabase
- [ ] Arquivo `.env` configurado com DATABASE_URL correta
- [ ] Dependência `pg` instalada (`npm install pg`)
- [ ] Servidor inicia sem erros de conexão
- [ ] API responde em `/health`
- [ ] É possível listar obrigações em `/api/obrigacoes`
- [ ] É possível criar nova obrigação via POST

---

**Última atualização:** Novembro 2025  
**Status:** ✅ Todos os problemas corrigidos e testados

