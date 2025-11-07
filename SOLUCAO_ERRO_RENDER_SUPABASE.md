# Solução: Erro ECONNREFUSED no Render + Supabase

## 🔴 Problema
```
Error: connect ECONNREFUSED 3.131.201.192:5432
code: 'ECONNREFUSED'
```

O Render não consegue conectar ao Supabase usando a Connection Pooling URL.

---

## ✅ Soluções (em ordem de prioridade)

### **Solução 1: Usar Direct Connection URL** ⭐ RECOMENDADO

O Supabase oferece dois tipos de URLs:
- **Connection Pooling URL** (porta 5432 via pooler)
- **Direct Connection URL** (porta 5432 direta) ✅ Melhor para Render

#### Como obter a Direct Connection URL:

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **Database**
4. Na seção **Connection string**, selecione **URI** (não "Connection pooling")
5. Copie a URL que aparece (formato: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)

#### Configure no Render:

1. Acesse seu Web Service no Render
2. Vá em **Environment**
3. Edite a variável `DATABASE_URL`
4. Cole a **Direct Connection URL** (não a pooler.supabase.com)
5. Clique em **Save Changes**

**Exemplo de URL correta:**
```
postgresql://postgres.ffglsgaqhbtvdjntjgmq:[SUA-SENHA]@db.ffglsgaqhbtvdjntjgmq.supabase.co:5432/postgres
```

❌ **NÃO use** (pooler):
```
postgresql://postgres.ffglsgaqhbtvdjntjgmq:[SENHA]@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

---

### **Solução 2: Usar Transaction Mode (porta 6543)**

Se precisar usar o Connection Pooling:

1. Troque a porta de `5432` para `6543`
2. A URL fica:
```
postgresql://postgres.ffglsgaqhbtvdjntjgmq:[SUA-SENHA]@aws-1-us-east-2.pooler.supabase.com:6543/postgres
```

**Nota:** Transaction mode tem algumas limitações (não suporta prepared statements, etc.)

---

### **Solução 3: Adicionar IPv4 do Render na Whitelist**

O Render usa IPs dinâmicos, mas você pode verificar o IP atual:

1. No Supabase, vá em **Settings** → **Database** → **Connection pooling**
2. Em **Restrict connections to IPv4**, adicione os IPs que aparecem no erro:
   - `3.131.201.192`
   - `3.148.140.216`

⚠️ **Problema:** Os IPs do Render podem mudar, então essa solução não é ideal.

---

### **Solução 4: Desabilitar IPv4 Restrictions no Supabase**

1. Acesse o Dashboard do Supabase
2. Vá em **Settings** → **Database**
3. Role até **Connection pooling**
4. Certifique-se de que **não há restrições de IP ativas**
5. Se houver, desative ou configure para aceitar qualquer IP

---

## 🔧 Configuração Adicional no Backend

Nosso código já está configurado corretamente com:
- SSL habilitado (`rejectUnauthorized: false`)
- Timeout adequado (30 segundos)
- Pool de conexões (max: 20)

**Não precisa alterar o código!** Apenas a variável `DATABASE_URL`.

---

## 📋 Checklist de Verificação

- [ ] Está usando **Direct Connection URL** (não pooler)?
- [ ] A senha está correta na URL?
- [ ] O formato da URL está correto? (`postgresql://`)
- [ ] No Supabase, o projeto está ativo (não pausado)?
- [ ] Verificou as configurações de rede no Supabase?

---

## 🧪 Como Testar

Após configurar a URL correta no Render:

1. Force um novo deploy ou aguarde o redeploy automático
2. Verifique os logs no Render Dashboard
3. Você deve ver:
```
✅ Conectado ao PostgreSQL (Supabase/Render)
```

---

## 🆘 Se ainda não funcionar

### Opção A: Verificar se o Supabase está online

```bash
# Teste local (substitua pela sua URL)
psql "postgresql://postgres.ffglsgaqhbtvdjntjgmq:[SENHA]@db.ffglsgaqhbtvdjntjgmq.supabase.co:5432/postgres" -c "SELECT 1"
```

### Opção B: Verificar logs detalhados no Render

1. Acesse o Dashboard do Render
2. Vá na aba **Logs**
3. Procure por detalhes adicionais do erro
4. Verifique se há mensagens sobre SSL ou timeout

### Opção C: Testar com curl

No shell do Render (se disponível):
```bash
curl -v telnet://db.ffglsgaqhbtvdjntjgmq.supabase.co:5432
```

---

## 📝 Resumo da Solução Recomendada

1. ✅ Use **Direct Connection URL** do Supabase
2. ✅ Configure no Render: **Environment** → `DATABASE_URL`
3. ✅ Formato: `postgresql://postgres.[ref]:[senha]@db.[ref].supabase.co:5432/postgres`
4. ✅ Salve e aguarde o redeploy

---

## 📚 Links Úteis

- [Supabase - Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)
- [Render - Database Connections](https://render.com/docs/databases)
- [PostgreSQL SSL Connection](https://www.postgresql.org/docs/current/libpq-ssl.html)

---

## 💡 Dica Extra

Se estiver usando o plano gratuito do Supabase, o projeto pode pausar após inatividade. 
Certifique-se de que o projeto está ativo antes de fazer deploy no Render.

