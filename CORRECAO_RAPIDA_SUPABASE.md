# 🚀 CORREÇÃO RÁPIDA - Conectar Backend ao Supabase

## ⏱️ Tempo estimado: 5 minutos

---

## ❌ PROBLEMA IDENTIFICADO

O backend **NÃO ESTÁ CONECTADO** ao Supabase porque **FALTA O ARQUIVO `.env`** com a `DATABASE_URL`.

---

## ✅ SOLUÇÃO RÁPIDA (5 PASSOS)

### 1️⃣ Obter a DATABASE_URL do Supabase

1. Acesse: [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** (⚙️) → **Database**
4. Role até **"Connection String"**
5. Selecione **"URI"** (não escolha "Connection pooling" ainda)
6. Copie a URL completa (começa com `postgresql://`)

Exemplo:
```
postgresql://postgres.abc123xyz:minhaSenha123@db.abc123xyz.supabase.co:5432/postgres
```

⚠️ **IMPORTANTE**: Substitua `[YOUR-PASSWORD]` pela senha que você definiu ao criar o projeto!

---

### 2️⃣ Criar arquivo .env no backend

No terminal:

```bash
# Windows PowerShell
cd backend
New-Item -Path ".env" -ItemType File

# Windows CMD
cd backend
type nul > .env

# Linux/Mac
cd backend
touch .env
```

Ou crie manualmente o arquivo `.env` dentro da pasta `backend/`

---

### 3️⃣ Adicionar configurações ao .env

Abra o arquivo `backend/.env` e cole:

```env
DATABASE_URL=cole_aqui_a_url_do_supabase
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Exemplo preenchido**:
```env
DATABASE_URL=postgresql://postgres.abc123xyz:minhaSenha123@db.abc123xyz.supabase.co:5432/postgres
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

---

### 4️⃣ Garantir que as tabelas existem no Supabase

No Supabase Dashboard:

1. Vá em **SQL Editor** (menu lateral)
2. Clique em **New Query**
3. Cole o conteúdo do arquivo `database_supabase.sql` (na raiz do projeto)
4. Clique em **Run** (ou Ctrl+Enter)

Deve aparecer: **"Success. No rows returned"**

Verifique em **Table Editor** se as tabelas foram criadas:
- clientes
- obrigacoes
- recorrencias
- feriados
- parcelamentos
- impostos
- historico

---

### 5️⃣ Testar a conexão

No terminal:

```bash
cd backend
npm run dev
```

**✅ Sucesso - Deve aparecer**:
```
✅ Conectado ao PostgreSQL (Supabase)
ℹ️ Modo PostgreSQL (Supabase) ativo
ℹ️ Certifique-se de que as tabelas foram criadas usando o script database_supabase.sql
🚀 ========================================
🚀 Sistema Fiscal - Backend
🚀 ========================================
🚀 Servidor rodando na porta: 3001
🚀 URL: http://localhost:3001
🚀 Health: http://localhost:3001/health
🚀 WebSocket: ws://localhost:3001
🚀 Ambiente: development
🚀 ========================================
```

**❌ Erro - Se aparecer**:
```
❌ Erro ao inicializar banco de dados:
Error: DATABASE_URL não está definida
```

**Causa**: Arquivo `.env` não foi criado ou está em lugar errado.

**Solução**: Verifique se o arquivo `.env` está na pasta `backend/` (não na raiz do projeto!).

---

## 🧪 TESTAR SE ESTÁ FUNCIONANDO

### Teste 1: Health Check

Em outro terminal:

```bash
curl http://localhost:3001/health
```

**Resposta esperada**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-05T...",
  "service": "Sistema Fiscal API"
}
```

### Teste 2: Listar obrigações

```bash
curl http://localhost:3001/api/obrigacoes
```

**Resposta esperada**: Array (pode estar vazio `[]` ou com dados)

---

## 🔴 PROBLEMAS COMUNS

### Problema 1: "password authentication failed"

**Causa**: Senha incorreta na `DATABASE_URL`

**Solução**:
1. Vá no Supabase → Settings → Database
2. Clique em **Reset Database Password**
3. Defina nova senha
4. Atualize no arquivo `.env`

---

### Problema 2: "no pg_hba.conf entry for host"

**Causa**: IP bloqueado ou URL incorreta

**Solução**: Use a URL de **Connection Pooling**:

1. Supabase Dashboard → Settings → Database → Connection String
2. Selecione **"Connection pooling"**
3. Copie a URI (deve ter `pooler.supabase.com`)
4. Atualize no `.env`:

```env
DATABASE_URL=postgresql://postgres.abc123xyz:senha@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
```

---

### Problema 3: "relation 'obrigacoes' does not exist"

**Causa**: Tabelas não foram criadas no Supabase

**Solução**: Execute o script `database_supabase.sql` no SQL Editor (passo 4️⃣)

---

### Problema 4: Backend inicia mas frontend não conecta

**Causa**: CORS bloqueado ou URL incorreta no frontend

**Solução**:

1. Verifique o `.env` do backend:
```env
CORS_ORIGIN=http://localhost:5173
```

2. Verifique o arquivo `frontend/src/services/api.ts`:
```typescript
const API_URL = 'http://localhost:3001/api';
```

---

## 📁 ESTRUTURA DE ARQUIVOS

Após criar o `.env`, sua estrutura deve estar assim:

```
SistemaFiscal-main/
├── backend/
│   ├── .env              ← ARQUIVO CRIADO (NÃO COMMIT NO GIT!)
│   ├── ENV_TEMPLATE.txt  ← Template de exemplo
│   ├── package.json
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   └── server.ts
│   └── ...
├── frontend/
│   └── ...
└── database_supabase.sql
```

---

## ✅ CHECKLIST FINAL

- [ ] Projeto criado no Supabase
- [ ] `DATABASE_URL` copiada corretamente
- [ ] Senha substituída na URL (sem `[YOUR-PASSWORD]`)
- [ ] Arquivo `backend/.env` criado
- [ ] `DATABASE_URL` adicionada ao `.env`
- [ ] Script `database_supabase.sql` executado no Supabase
- [ ] Backend inicia sem erros (`npm run dev`)
- [ ] Endpoint `/health` responde OK
- [ ] Frontend conecta ao backend

---

## 📞 PRECISA DE MAIS AJUDA?

Consulte o arquivo **`PROBLEMAS_SUPABASE_ENCONTRADOS.md`** para documentação completa dos erros encontrados.

---

**Status Atual**: ⚠️ Backend não conectado (falta arquivo .env)

**Após correção**: ✅ Backend conectado ao Supabase

**Tempo total**: ⏱️ ~5 minutos

---

_Guia criado em: 2025-11-05_

