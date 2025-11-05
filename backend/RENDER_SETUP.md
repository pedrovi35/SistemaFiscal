# 🚀 Configuração para Deploy no Render

Este backend está configurado para usar **apenas Supabase (PostgreSQL)**. O SQLite foi completamente removido.

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Projeto criado no Supabase
3. Banco de dados inicializado usando o script `database_supabase.sql`

## 🔧 Configuração no Render

### 1. Criar um novo Web Service

1. Acesse o [Render Dashboard](https://dashboard.render.com)
2. Clique em "New" → "Web Service"
3. Conecte seu repositório GitHub

### 2. Configurar o Build

- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && npm start`
- **Root Directory**: Deixe vazio (ou configure como `backend` se necessário)

### 3. Variáveis de Ambiente (OBRIGATÓRIAS)

Adicione as seguintes variáveis de ambiente no painel do Render:

```
DATABASE_URL=postgresql://postgres:[SENHA]@[HOST]:5432/postgres
```

**Como obter a DATABASE_URL:**
1. No Supabase Dashboard, vá em **Settings** → **Database**
2. Role até **Connection string**
3. Selecione **URI** ou **Connection pooling**
4. Copie a URL completa

**Exemplo:**
```
DATABASE_URL=postgresql://postgres.ytodollcittgwbcdjwfj:%5B15juca%40%5D@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
```

### 4. Outras Variáveis (Opcionais)

```
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://seu-frontend.render.com
```

### 5. Verificar o Banco de Dados

Antes de fazer o deploy, certifique-se de que:
- ✅ O script `database_supabase.sql` foi executado no Supabase
- ✅ Todas as tabelas foram criadas corretamente
- ✅ A DATABASE_URL está correta e acessível

## 📝 Script SQL para Supabase

Execute o arquivo `database_supabase.sql` no SQL Editor do Supabase:
1. Acesse **SQL Editor** no dashboard do Supabase
2. Crie uma nova query
3. Cole o conteúdo do arquivo `database_supabase.sql`
4. Execute o script

## ⚠️ Importante

- **Não use SQLite**: O Render não suporta SQLite em ambientes serverless
- **Sempre configure DATABASE_URL**: O backend falhará ao iniciar sem esta variável
- **Use Connection Pooling**: Para melhor performance, use a URL de connection pooling do Supabase

## 🔍 Troubleshooting

### Erro: "DATABASE_URL não está definida"
- Verifique se a variável de ambiente está configurada no Render
- Certifique-se de que não há espaços extras na URL

### Erro: "Conexão ao PostgreSQL falhou"
- Verifique se a URL está correta
- Confirme que o banco de dados está acessível
- Verifique se o IP do Render está permitido no Supabase (geralmente não necessário com connection pooling)

### Erro: "relation does not exist"
- Execute o script `database_supabase.sql` no Supabase
- Verifique se as tabelas foram criadas corretamente

## 📚 Documentação Adicional

- [Render Docs](https://render.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)

