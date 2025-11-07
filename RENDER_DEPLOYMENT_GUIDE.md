# 🚀 Guia de Deploy no Render

## ⚡ Solução Rápida para Erro ECONNREFUSED

### 1️⃣ Obter a URL Correta do Supabase

1. Acesse [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** (⚙️) → **Database**
4. Na seção **Connection string**:
   - ⚠️ **NÃO** selecione "Connection pooling"
   - ✅ Selecione **"URI"** ou **"Session mode"**
5. Copie a URL que aparece

**Formato correto:**
```
postgresql://postgres.[ID]:[SENHA]@db.[ID].supabase.co:5432/postgres
```

### 2️⃣ Testar Localmente (RECOMENDADO)

Antes de configurar no Render, teste se a URL funciona:

```bash
cd backend
node testar-url-supabase.js "cole-sua-url-aqui"
```

Se o teste passar ✅, prossiga para o Render.

### 3️⃣ Configurar no Render

1. Acesse [Render Dashboard](https://dashboard.render.com/)
2. Selecione seu Web Service
3. Clique em **Environment** (menu lateral esquerdo)
4. Encontre a variável `DATABASE_URL`
5. Clique em **Edit** (✏️)
6. Cole a URL do Supabase
7. Clique em **Save Changes**

O Render fará redeploy automático.

### 4️⃣ Verificar Deploy

1. Aguarde o deploy terminar (1-3 minutos)
2. Verifique os **Logs** no Render
3. Procure por: `✅ Conectado ao PostgreSQL (Supabase/Render)`

---

## 🔍 Comparação de URLs

### ❌ URL ERRADA (Pooling - causa ECONNREFUSED)
```
postgresql://postgres.xxx:[senha]@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

### ✅ URL CORRETA (Direct Connection)
```
postgresql://postgres.xxx:[senha]@db.xxx.supabase.co:5432/postgres
```

**Diferença:** `pooler.supabase.com` vs `db.xxx.supabase.co`

---

## 📋 Checklist de Verificação

Antes de fazer deploy, certifique-se:

- [ ] Usou **Direct Connection URL** (não pooling)
- [ ] Testou a URL localmente com `testar-url-supabase.js`
- [ ] A senha está correta na URL
- [ ] O projeto Supabase está **ativo** (não pausado)
- [ ] As tabelas foram criadas (`database_supabase.sql`)

---

## 🆘 Problemas Comuns

### Erro: "password authentication failed"
- ✅ Verifique se a senha na URL está correta
- ✅ No Supabase: Settings → Database → Reset Database Password

### Erro: "ECONNREFUSED"
- ✅ Use Direct Connection URL
- ✅ Verifique se o projeto Supabase não está pausado
- ✅ Teste localmente primeiro

### Erro: "relation does not exist"
- ✅ Execute o script `database_supabase.sql` no Supabase SQL Editor

### Deploy trava em "Building..."
- ✅ Verifique se o `package.json` está correto
- ✅ Certifique-se que `NODE_VERSION` está configurada (18 ou superior)

---

## 🛠️ Variáveis de Ambiente Necessárias

No Render, configure estas variáveis em **Environment**:

| Variável | Valor | Obrigatório |
|----------|-------|-------------|
| `DATABASE_URL` | URL do Supabase | ✅ Sim |
| `NODE_ENV` | `production` | ✅ Sim |
| `PORT` | (automático no Render) | Não |
| `CORS_ORIGIN` | URL do frontend | ✅ Sim |

**Exemplo CORS_ORIGIN:**
```
https://sistema-fiscal.vercel.app
```

---

## 📊 Fluxo de Deploy

```mermaid
graph TD
    A[Obter URL do Supabase] --> B[Testar localmente]
    B --> C{Teste passou?}
    C -->|Não| D[Verificar URL/Senha]
    D --> B
    C -->|Sim| E[Configurar no Render]
    E --> F[Aguardar deploy]
    F --> G{Deploy OK?}
    G -->|Não| H[Verificar logs]
    G -->|Sim| I[✅ Sistema funcionando]
```

---

## 🔗 Links Úteis

- [Solução Completa (detalhes)](./SOLUCAO_ERRO_RENDER_SUPABASE.md)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Render Dashboard](https://dashboard.render.com/)
- [Documentação Supabase - Connecting](https://supabase.com/docs/guides/database/connecting-to-postgres)

---

## 💡 Dica Pro

Se estiver testando mudanças frequentes, use o Render CLI:

```bash
# Instalar
npm install -g render

# Ver logs em tempo real
render logs -t
```

---

## 📞 Suporte

Se o problema persistir após seguir este guia:

1. Execute o teste local e copie o output completo
2. Copie os logs do Render
3. Verifique o arquivo [SOLUCAO_ERRO_RENDER_SUPABASE.md](./SOLUCAO_ERRO_RENDER_SUPABASE.md)

---

**Última atualização:** Novembro 2025

