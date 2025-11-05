# 🔴 PROBLEMAS DE CONFIGURAÇÃO SUPABASE ENCONTRADOS

## ❌ Erros Críticos Identificados

### 1. **FALTA ARQUIVO .env NO BACKEND**

**Problema**: O backend está configurado para ler `process.env.DATABASE_URL`, mas **NÃO EXISTE** arquivo `.env` na pasta `backend/`.

**Impacto**: O backend **NÃO CONSEGUE** se conectar ao Supabase porque a variável `DATABASE_URL` está **undefined**.

**Solução**: Criar arquivo `backend/.env` com:

```env
# DATABASE_URL do Supabase
# Obter em: Supabase Dashboard → Settings → Database → Connection String → URI
DATABASE_URL=postgresql://postgres:[SUA_SENHA]@db.[PROJECT_REF].supabase.co:5432/postgres

# Configurações do Servidor
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Como obter a DATABASE_URL no Supabase**:
1. Acesse [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** (⚙️) → **Database**
4. Role até **Connection String**
5. Copie a **URI** (formato: `postgresql://postgres:...`)
6. Substitua `[YOUR-PASSWORD]` pela senha do banco que você definiu ao criar o projeto

---

### 2. **DISCREPÂNCIA NA DOCUMENTAÇÃO**

**Problema**: O arquivo `SUPABASE_SETUP.md` menciona usar:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_KEY`
- `DB_TYPE=supabase`

Mas o código em `backend/src/config/database.ts` **USA APENAS**:
- `DATABASE_URL`

**Impacto**: Confusão na configuração. A documentação não corresponde ao código.

**Solução**: O código atual está correto (usando `DATABASE_URL`). A documentação precisa ser atualizada.

---

### 3. **DEPENDÊNCIA @supabase/supabase-js NÃO INSTALADA**

**Problema**: O `SUPABASE_SETUP.md` instrui instalar:
```bash
npm install pg @supabase/supabase-js
```

Mas no `package.json` **SÓ TEM `pg`**, falta `@supabase/supabase-js`.

**Impacto**: Para a implementação atual (usando apenas PostgreSQL com Pool), isso **NÃO É PROBLEMA**. Mas se futuramente quiser usar recursos específicos do Supabase (como Real-time, Storage, Auth), vai precisar instalar.

**Situação Atual**: 
- ✅ `pg` está instalado (versão 8.16.3)
- ❌ `@supabase/supabase-js` NÃO está instalado

**Solução**: Se quiser usar recursos avançados do Supabase, instale:
```bash
cd backend
npm install @supabase/supabase-js
```

---

### 4. **ERRO AO INICIAR O BACKEND SEM .env**

**Erro esperado**:
```
❌ Erro ao inicializar banco de dados:
Error: DATABASE_URL não está definida. Configure a variável de ambiente com a URL de conexão do Supabase.
Exemplo: postgresql://user:password@host:5432/database
```

**Causa**: Linha 51-55 do `database.ts` verifica se `DATABASE_URL` existe, e lança erro se não existir.

---

## ✅ SOLUÇÃO PASSO A PASSO

### Passo 1: Obter credenciais do Supabase

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto (ou crie um novo)
3. Vá em **Settings** → **Database**
4. Copie a **Connection String (URI)**

Exemplo:
```
postgresql://postgres.ytodollcittgwbcdjwfj:[SUA-SENHA]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
```

### Passo 2: Criar arquivo .env

Crie o arquivo `backend/.env`:

```env
DATABASE_URL=postgresql://postgres.ytodollcittgwbcdjwfj:[SUA-SENHA]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

⚠️ **IMPORTANTE**: Substitua `[SUA-SENHA]` pela senha real do banco!

### Passo 3: Verificar se o .env está sendo carregado

No arquivo `backend/src/server.ts`, linha 13, já tem:
```typescript
dotenv.config();
```

Isso carrega o arquivo `.env` automaticamente. ✅

### Passo 4: Executar o script SQL no Supabase

Se ainda não executou, rode o script `database_supabase.sql`:

1. No Supabase Dashboard → **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo de `database_supabase.sql`
4. Clique em **Run**

### Passo 5: Testar a conexão

```bash
cd backend
npm run dev
```

Se tudo estiver correto, você verá:
```
✅ Conectado ao PostgreSQL (Supabase)
ℹ️ Modo PostgreSQL (Supabase) ativo
🚀 Servidor rodando na porta: 3001
```

---

## 🔍 COMO VERIFICAR SE ESTÁ CONECTANDO

### Teste 1: Verificar se o backend inicia

```bash
cd backend
npm run dev
```

**Sucesso**:
```
✅ Conectado ao PostgreSQL (Supabase)
🚀 Servidor rodando na porta: 3001
```

**Erro (sem .env)**:
```
❌ Erro ao inicializar banco de dados:
Error: DATABASE_URL não está definida
```

### Teste 2: Testar endpoint de saúde

```bash
# Em outro terminal
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

### Teste 3: Verificar se consegue buscar dados

```bash
curl http://localhost:3001/api/obrigacoes
```

**Sucesso**: Retorna array de obrigações (pode ser vazio `[]`)

**Erro**: Retorna erro de conexão

---

## 📝 CHECKLIST DE VERIFICAÇÃO

- [ ] Projeto criado no Supabase
- [ ] Script `database_supabase.sql` executado no SQL Editor
- [ ] Tabelas criadas corretamente (verificar em Table Editor)
- [ ] `DATABASE_URL` copiada do Supabase
- [ ] Senha substituída na `DATABASE_URL`
- [ ] Arquivo `backend/.env` criado com `DATABASE_URL`
- [ ] Dependência `pg` instalada (verificar `package.json`)
- [ ] Backend inicia sem erros (`npm run dev`)
- [ ] Endpoint `/health` responde
- [ ] Endpoint `/api/obrigacoes` responde

---

## 🔴 OUTROS ERROS POSSÍVEIS

### Erro: "no pg_hba.conf entry for host"

**Causa**: IP não autorizado no Supabase.

**Solução**:
1. Supabase Dashboard → **Settings** → **Database**
2. Role até **Connection pooling**
3. Use a URL de **Connection pooling** (com `pooler.supabase.com`)
4. Ou adicione seu IP em **Allowed IP addresses**

### Erro: "password authentication failed"

**Causa**: Senha incorreta na `DATABASE_URL`.

**Solução**: 
1. Vá em Supabase → **Settings** → **Database**
2. Clique em **Reset Database Password**
3. Defina nova senha
4. Atualize no `.env`

### Erro: "connect ECONNREFUSED"

**Causa**: URL incorreta ou firewall bloqueando.

**Solução**:
1. Verifique se a URL está correta
2. Teste a conexão: `telnet [host] 5432`
3. Verifique firewall/antivírus

### Erro: "relation 'obrigacoes' does not exist"

**Causa**: Tabelas não foram criadas no Supabase.

**Solução**: Execute o script `database_supabase.sql` no SQL Editor.

---

## 📞 PRÓXIMOS PASSOS

1. **Criar o arquivo `.env`** no backend (URGENTE)
2. **Atualizar SUPABASE_SETUP.md** para refletir o código atual
3. **Criar `.env.example`** como template
4. **Adicionar `.env` ao `.gitignore`** (se ainda não estiver)
5. **Testar conexão** seguindo os passos acima

---

**Status**: ⚠️ **BACKEND NÃO ESTÁ CONECTADO AO SUPABASE** por falta do arquivo `.env`

**Prioridade**: 🔴 **CRÍTICA** - Sistema não funciona sem isso

**Tempo estimado para correção**: ⏱️ 5-10 minutos

---

_Documento gerado em: 2025-11-05_

