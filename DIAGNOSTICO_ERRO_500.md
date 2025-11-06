# 🚨 Diagnóstico Rápido - Erro 500

## ❌ Erro Atual

```
GET /api/obrigacoes 500 (Internal Server Error)
POST /api/obrigacoes 500 (Internal Server Error)
```

**Significa:** O backend NÃO consegue acessar o banco de dados.

---

## ✅ **PASSO A PASSO OBRIGATÓRIO**

### **1. VER LOGS DO RENDER (URGENTE!)**

1. Acesse: https://dashboard.render.com
2. Clique no seu serviço backend
3. Clique em **Logs**
4. **COPIE E ME ENVIE** os logs que aparecem

**O que procurar nos logs:**

```bash
# ✅ SE APARECER ISSO = BOM
🔍 Tentando conectar ao PostgreSQL...
🔗 URL: postgresql://postgres.****@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
✅ Conectado ao PostgreSQL (Supabase/Render)
🚀 Servidor rodando na porta: 3001

# ❌ SE APARECER ISSO = PROBLEMA
❌ Erro ao inicializar banco de dados: connect ECONNREFUSED
DATABASE_URL não está definida
column "obrigacaoId" does not exist
relation "obrigacoes" does not exist
```

---

## 🔧 **SOLUÇÕES RÁPIDAS**

### **Solução 1: Configurar DATABASE_URL**

**Se aparecer "DATABASE_URL não está definida" nos logs:**

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Settings** → **Database**
4. Role até **Connection pooling** (NÃO Transaction mode!)
5. Copie a URL que parece com isso:

```
postgresql://postgres.ytodollcittgwbcdjwfj:SuaSenha@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

6. No **Render**:
   - Dashboard → Seu serviço → **Environment**
   - Adicione/edite:
     - **Key:** `DATABASE_URL`
     - **Value:** *(cole a URL copiada)*
   - **Save Changes**

7. Aguarde 2-3 minutos para o Render reiniciar

---

### **Solução 2: Criar Tabelas no Supabase**

**Se aparecer "relation obrigacoes does not exist" nos logs:**

1. Acesse: https://app.supabase.com
2. Vá em **SQL Editor**
3. Clique em **New query**
4. Cole TODO o conteúdo do arquivo `database_supabase.sql`
5. Clique em **RUN**
6. Aguarde até aparecer "✅ Success"

---

### **Solução 3: Executar Migração Snake Case**

**Se aparecer "column obrigacaoId does not exist" nos logs:**

1. No **SQL Editor** do Supabase
2. Cole e execute:

```sql
ALTER TABLE recorrencias 
DROP CONSTRAINT IF EXISTS uk_recorrencias_obrigacao_id;

ALTER TABLE recorrencias 
ADD CONSTRAINT uk_recorrencias_obrigacao_id UNIQUE (obrigacao_id);
```

---

### **Solução 4: Reativar Projeto Pausado**

1. Acesse: https://app.supabase.com
2. Se aparecer **"Project Paused"**:
   - Clique em **Resume**
   - Aguarde 2-3 minutos
   - Teste novamente

---

## 🔍 **TESTE RÁPIDO DE CONEXÃO**

### **Opção 1: Teste Direto (psql)**

```bash
# Substitua pela sua URL
psql "postgresql://postgres.REF:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

# Se conectar, execute:
\dt

# Deve mostrar suas tabelas:
# obrigacoes
# recorrencias
# historico_alteracoes
# feriados
# clientes
```

### **Opção 2: Teste via Browser**

Use o **SQL Editor** do Supabase:

```sql
-- Deve retornar linhas (mesmo que 0)
SELECT COUNT(*) FROM obrigacoes;
SELECT COUNT(*) FROM recorrencias;
SELECT COUNT(*) FROM historico_alteracoes;
```

Se qualquer query der erro, a tabela não existe!

---

## 📋 **CHECKLIST COMPLETO**

Execute NA ORDEM:

- [ ] **1. Projeto Supabase está ativo?**
  - Não está pausado?
  - ✅ ou ❌

- [ ] **2. DATABASE_URL configurada no Render?**
  - Environment → DATABASE_URL existe?
  - ✅ ou ❌

- [ ] **3. URL é Connection Pooling?**
  - Contém `pooler.supabase.com`?
  - Porta é `5432` (não `6543`)?
  - ✅ ou ❌

- [ ] **4. Tabelas criadas no Supabase?**
  - Execute `\dt` ou `SELECT * FROM obrigacoes LIMIT 1`
  - ✅ ou ❌

- [ ] **5. Migração snake_case aplicada?**
  - Execute query de verificação (abaixo)
  - ✅ ou ❌

```sql
-- Verificar constraint
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'recorrencias' 
  AND constraint_type = 'UNIQUE';

-- Deve retornar: uk_recorrencias_obrigacao_id
```

- [ ] **6. Logs do Render mostram conexão OK?**
  - Aparece "✅ Conectado ao PostgreSQL"?
  - ✅ ou ❌

- [ ] **7. Fazer novo deploy** (se mudou DATABASE_URL)
  - Render → Manual Deploy → Deploy latest commit
  - ✅ ou ❌

---

## 🆘 **AINDA COM ERRO?**

### **Me envie as seguintes informações:**

1. **Logs do Render** (últimas 50 linhas)
2. **Resultado deste comando no SQL Editor do Supabase:**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

3. **Screenshot da configuração Environment no Render**
   - Mostre que DATABASE_URL existe (esconda a senha!)

4. **Mensagem de erro COMPLETA** que aparece nos logs

---

## ⚡ **SOLUÇÃO EXPRESS (SE ESTIVER COM PRESSA)**

Execute estes comandos **NA ORDEM**, no **SQL Editor do Supabase**:

```sql
-- 1. Ver se tabelas existem
\dt

-- 2. Se NÃO existirem, criar tudo:
-- Cole TODO o conteúdo de database_supabase.sql aqui
-- (não vou colar aqui porque são 500+ linhas)

-- 3. Adicionar constraint única
ALTER TABLE recorrencias 
ADD CONSTRAINT uk_recorrencias_obrigacao_id UNIQUE (obrigacao_id);

-- 4. Verificar
SELECT * FROM obrigacoes LIMIT 1;
```

Depois, no **Render**:

1. Environment → Verificar `DATABASE_URL`
2. Manual Deploy → Deploy latest commit
3. Logs → Procurar por "✅ Conectado"

---

## 💡 **DICA FINAL**

O erro 500 **SEMPRE** é problema de banco de dados quando:
- ✅ Frontend consegue chamar a API (200, 400, 404 são OK)
- ❌ Backend retorna 500 em TODAS as operações

**Root causes mais comuns:**
1. DATABASE_URL não configurada (90% dos casos)
2. Tabelas não criadas (5% dos casos)
3. Migração não aplicada (3% dos casos)
4. Projeto pausado (2% dos casos)

**1ª coisa a fazer:** VER OS LOGS DO RENDER! 🔍

Eles vão mostrar exatamente qual é o problema.

