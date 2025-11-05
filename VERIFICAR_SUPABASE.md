# 🔴 PROJETO SUPABASE NÃO ESTÁ ACESSÍVEL

## Problema Identificado

O servidor `db.ffglsgaqhbtvdjntjgmq.supabase.co` **não está respondendo**.

```
❌ Erro: getaddrinfo ENOTFOUND
❌ Ping falhou: não pôde encontrar o host
```

---

## ✅ COMO RESOLVER - PASSO A PASSO

### 1️⃣ Verificar se o Projeto Está Ativo

1. Acesse: **https://app.supabase.com**
2. Faça login na sua conta
3. Verifique o status do projeto na lista:
   - ✅ **Verde/Ativo** → Projeto funcionando
   - ⏸️ **Pausado** → Precisa reativar
   - 🔴 **Inativo** → Projeto foi encerrado

**Se o projeto estiver PAUSADO:**
- Clique no projeto
- Clique em **"Resume Project"** ou **"Reativar Projeto"**
- Aguarde 2-3 minutos para o projeto inicializar

---

### 2️⃣ Obter as Credenciais Corretas

#### A) Obter DATABASE_URL

No Dashboard do Supabase:

1. Selecione seu projeto
2. Vá em **Settings** (⚙️) no menu lateral
3. Clique em **Database**
4. Role até **"Connection String"**
5. **IMPORTANTE**: Selecione **"URI"** (não escolha Java, Python, etc)
6. Copie a URL completa

**A URL deve ter este formato:**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

**Ou para Connection Pooling (RECOMENDADO):**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
```

**Substitua `[YOUR-PASSWORD]` pela senha real!**

---

#### B) Obter SUPABASE_URL

1. No menu lateral, vá em **Settings** → **API**
2. Copie a **"Project URL"**

**Formato:**
```
https://[PROJECT_REF].supabase.co
```

---

#### C) Obter SUPABASE_KEY (Anon)

1. Mesma tela (Settings → API)
2. Copie a **"anon public"** key
3. É uma chave JWT (começa com `eyJ...`)

---

#### D) Obter SUPABASE_SERVICE_ROLE_KEY

1. Mesma tela (Settings → API)
2. Role até **"service_role"**
3. Clique em **"Reveal"** ou **"Show"**
4. Copie a chave completa
5. ⚠️ **NUNCA** exponha esta chave publicamente!

---

### 3️⃣ Atualizar o Arquivo .env

Com as credenciais corretas em mãos, atualize `backend/.env`:

```env
# Banco de Dados (use a Connection Pooling URL se disponível)
DATABASE_URL=postgresql://postgres.[REF]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres

# URL do Projeto
SUPABASE_URL=https://[PROJECT_REF].supabase.co

# Chave Anon (pública)
SUPABASE_KEY=eyJ...sua_chave_anon_aqui

# Chave Service Role (privada - NUNCA EXPONHA!)
SUPABASE_SERVICE_ROLE_KEY=eyJ...sua_chave_service_role_aqui

# Configurações
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

---

### 4️⃣ Testar a Conexão Novamente

```powershell
cd backend
node test-connection.js
```

**Deve aparecer:**
```
✅ Conexão bem-sucedida!
📊 Banco de dados: postgres
🐘 Versão: PostgreSQL 15.x
```

---

## 🔍 VERIFICAR SE AS TABELAS EXISTEM

Se a conexão funcionar mas não houver tabelas, você precisa executar o script SQL:

### Opção A: Via Supabase Dashboard (Mais Fácil)

1. No Supabase → **SQL Editor**
2. Clique em **"New Query"**
3. Cole o conteúdo do arquivo `database_supabase.sql` ou `database_supabase_fixed.sql`
4. Clique em **"Run"** (ou Ctrl+Enter)

### Opção B: Via Código

Crie as tabelas programaticamente se necessário.

---

## 🆘 AINDA NÃO FUNCIONA?

### Problema: URL Incorreta

**Sintomas:**
- `ENOTFOUND`
- `ping` não encontra o host

**Solução:**
- Copie novamente a DATABASE_URL do Supabase Dashboard
- Certifique-se de que é a **Connection String → URI**
- Verifique se não há espaços extras no .env

---

### Problema: Senha Incorreta

**Sintomas:**
- `password authentication failed`

**Solução:**
1. Supabase → Settings → Database
2. Clique em **"Reset Database Password"**
3. Defina nova senha
4. Atualize no `.env`

---

### Problema: Firewall/Antivírus

**Sintomas:**
- Timeout ao conectar
- Conexão recusada

**Solução:**
1. Desabilite temporariamente o firewall/antivírus
2. Teste novamente
3. Se funcionar, adicione exceção para Node.js

---

### Problema: Projeto Supabase Grátis Expirou

**Sintomas:**
- Projeto não aparece no dashboard
- Mensagem de projeto inativo

**Solução:**
- Projetos gratuitos do Supabase são pausados após 1 semana de inatividade
- Reative o projeto ou crie um novo
- Configure as credenciais do novo projeto

---

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] Projeto Supabase está **ATIVO** (não pausado)
- [ ] DATABASE_URL copiada corretamente do dashboard
- [ ] Senha substituída (sem `[YOUR-PASSWORD]`)
- [ ] SUPABASE_URL está correta
- [ ] SUPABASE_KEY copiada corretamente
- [ ] SUPABASE_SERVICE_ROLE_KEY copiada corretamente
- [ ] Arquivo `backend/.env` foi salvo
- [ ] Teste de conexão foi executado
- [ ] Ping no servidor funciona

---

## 🚀 PRÓXIMOS PASSOS

1. **URGENTE**: Verifique se o projeto Supabase está ativo
2. Copie as credenciais corretas do dashboard
3. Atualize o arquivo `backend/.env`
4. Teste a conexão: `node test-connection.js`
5. Se funcionar, execute: `npm start`
6. Acesse: http://localhost:3001/health

---

## 📞 URLs ÚTEIS

- **Supabase Dashboard**: https://app.supabase.com
- **Documentação**: https://supabase.com/docs
- **Status do Supabase**: https://status.supabase.com

---

_Criado em: 2025-11-05_

