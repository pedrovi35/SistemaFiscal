# 🔧 Troubleshooting: Erro de Conexão PostgreSQL

## ❌ Erros Comuns

### 1. `Error: connect ECONNREFUSED [IP]:5432`

```
Error: connect ECONNREFUSED 3.131.201.192:5432
```

**Significa:** O banco de dados PostgreSQL recusou a conexão.

---

## 🔍 Causas e Soluções

### ✅ **Causa 1: URL Incorreta ou Expirada**

O Supabase pode ter mudado o IP do servidor. Use sempre a **Connection Pooling URL**.

**Solução:**

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Settings** → **Database**
4. Role até **Connection String**
5. Copie a **Connection pooling URL** (NÃO a Transaction mode!)

```
✅ CORRETO (Connection Pooling):
postgresql://postgres.REF:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres

❌ ERRADO (Transaction Mode):
postgresql://postgres.REF:SENHA@db.REF.supabase.co:5432/postgres
```

---

### ✅ **Causa 2: IP do Render não está na Whitelist**

Por padrão, o Supabase bloqueia conexões de IPs desconhecidos.

**Solução:**

1. No Supabase, vá em **Settings** → **Database**
2. Role até **Connection pooling**
3. Em **Restrict access to trusted IP addresses**:
   - **Opção A** (Recomendado): Desabilite temporariamente para testar
   - **Opção B**: Adicione os IPs do Render (veja abaixo)

**IPs do Render (adicionar à whitelist):**
```
Render usa IPs dinâmicos, então é melhor:
- Desabilitar a restrição de IP no Supabase, OU
- Usar autenticação forte (senha complexa)
```

---

### ✅ **Causa 3: Variável DATABASE_URL não configurada**

**Solução no Render:**

1. Acesse o dashboard do Render
2. Clique no seu serviço (backend)
3. Vá em **Environment**
4. Adicione/verifique:
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://postgres.REF:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`

5. Clique em **Save Changes**
6. O Render irá **reiniciar automaticamente** o serviço

---

### ✅ **Causa 4: Firewall do Supabase bloqueando**

Se você acabou de criar o projeto no Supabase:

**Solução:**

1. Supabase → **Settings** → **Database**
2. Procure por **Network Restrictions**
3. Certifique-se de que está configurado para **Allow all**

---

### ✅ **Causa 5: Projeto Supabase Pausado**

Projetos gratuitos do Supabase pausam após 1 semana de inatividade.

**Solução:**

1. Acesse https://app.supabase.com
2. Vá no seu projeto
3. Se aparecer **"Project Paused"**, clique em **Resume**
4. Aguarde 2-3 minutos para o banco subir
5. Teste novamente

---

## 🧪 Como Testar a Conexão

### Opção 1: Usar `psql` (Terminal)

```bash
psql "postgresql://postgres.REF:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
```

Se conectar, a URL está correta!

### Opção 2: Usar código Node.js

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.REF:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erro:', err);
  } else {
    console.log('Sucesso!', res.rows[0]);
  }
  pool.end();
});
```

---

## 📋 Checklist de Verificação

Execute este checklist na ordem:

- [ ] **1. Projeto Supabase está ativo?**
  - Acesse https://app.supabase.com
  - Verifique se não está pausado

- [ ] **2. DATABASE_URL está configurada no Render?**
  - Render → Environment → DATABASE_URL

- [ ] **3. Usando Connection Pooling URL?**
  - Deve conter `pooler.supabase.com`
  - **NÃO** `db.XXX.supabase.co`

- [ ] **4. Senha está correta?**
  - Copie novamente do Supabase se necessário
  - Cuidado com caracteres especiais

- [ ] **5. Restrição de IP desabilitada?**
  - Supabase → Settings → Database → Network

- [ ] **6. SSL configurado?**
  - Backend deve ter `ssl: { rejectUnauthorized: false }`

- [ ] **7. Tabelas criadas?**
  - Execute `database_supabase.sql` no SQL Editor

---

## 🔄 Passo a Passo Completo

### **Configurar Supabase (Primeira vez)**

```bash
# 1. Criar projeto no Supabase
# 2. Copiar Connection Pooling URL

# 3. No SQL Editor do Supabase, executar:
-- Cole todo o conteúdo de database_supabase.sql

# 4. Desabilitar restrição de IP (opcional para testes)
Settings → Database → Disable IP restrictions
```

### **Configurar Render**

```bash
# 1. No Render Dashboard:
Environment → Add Environment Variable

Key: DATABASE_URL
Value: postgresql://postgres.REF:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres

# 2. Salvar (Render reinicia automaticamente)

# 3. Ver logs:
Logs → Procurar por "✅ Conectado ao PostgreSQL"
```

---

## 📊 Logs Úteis

### ✅ **Conexão Bem-Sucedida**

```
🔍 Tentando conectar ao PostgreSQL...
🔗 URL: postgresql://postgres.ytodollcittgwbcdjwfj:****@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
⏳ Testando conexão com SELECT 1...
🔌 Nova conexão estabelecida no pool
✅ Conectado ao PostgreSQL (Supabase/Render)
ℹ️ Modo PostgreSQL ativo
```

### ❌ **Erro de Conexão**

```
❌ Erro ao inicializar banco de dados: connect ECONNREFUSED 3.131.201.192:5432
📋 Detalhes do erro: {
  code: 'ECONNREFUSED',
  errno: -111,
  syscall: 'connect',
  address: '3.131.201.192',
  port: 5432
}

💡 DICA: Erro de conexão recusada. Verifique:
   1. A DATABASE_URL está correta?
   2. Está usando Connection Pooling URL do Supabase?
   3. O firewall não está bloqueando a porta 5432?
   4. O IP do Render está na whitelist do Supabase?
```

---

## 🆘 Ainda com Problemas?

### Teste Local Primeiro

```bash
# No seu computador:
cd backend
cp ENV_TEMPLATE.txt .env

# Editar .env e adicionar:
DATABASE_URL=postgresql://postgres.REF:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres

# Testar:
npm run dev
```

Se funcionar localmente, o problema é na configuração do Render.

### URLs de Exemplo

**✅ Connection Pooling (USE ESTE):**
```
postgresql://postgres.ytodollcittgwbcdjwfj:SuaSenha123@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

**❌ Transaction Mode (NÃO USE):**
```
postgresql://postgres.ytodollcittgwbcdjwfj:SuaSenha123@db.ytodollcittgwbcdjwfj.supabase.co:5432/postgres
```

**❌ Session Mode (NÃO USE):**
```
postgresql://postgres.ytodollcittgwbcdjwfj:SuaSenha123@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

---

## 💡 Dicas Adicionais

1. **Sempre use Connection Pooling URL**
   - Porta `5432` (não `6543`)
   - Host contém `pooler.supabase.com`

2. **Caracteres especiais na senha?**
   - Encode com: `encodeURIComponent(senha)`
   - Exemplo: `P@ssw0rd!` → `P%40ssw0rd%21`

3. **Timeout?**
   - O código agora tem timeout de 30s
   - Se ainda timeout, pode ser firewall

4. **Projeto pausou?**
   - Projetos gratuitos pausam após 1 semana
   - Acorde o projeto no dashboard Supabase

---

## ✅ Resultado Esperado

Quando tudo estiver correto, você verá nos logs do Render:

```
✅ Conectado ao PostgreSQL (Supabase/Render)
🚀 Servidor rodando na porta: 3001
```

E o frontend conseguirá criar obrigações sem erro 500!

