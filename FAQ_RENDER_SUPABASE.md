# ❓ FAQ - Deploy Render + Supabase

## Perguntas Frequentes sobre Deploy

---

### 1. ❓ Por que recebo erro ECONNREFUSED no Render?

**Resposta:**
O erro `ECONNREFUSED` geralmente ocorre quando você está usando a **Connection Pooling URL** do Supabase ao invés da **Direct Connection URL**.

**Solução:**
- Use a Direct Connection URL (formato: `db.[projeto].supabase.co`)
- NÃO use a Pooling URL (formato: `pooler.supabase.com`)

📖 [Ver guia completo](./RENDER_DEPLOYMENT_GUIDE.md)

---

### 2. ❓ Qual URL do Supabase devo usar?

**Resposta:**
Existem 3 tipos de URLs no Supabase:

| Tipo | Usar no Render? | Formato |
|------|-----------------|---------|
| **Direct Connection** | ✅ SIM (Recomendado) | `db.xxx.supabase.co:5432` |
| **Session Pooling** | ✅ SIM (Alternativa) | `pooler.supabase.com:5432` |
| **Transaction Pooling** | ⚠️ Pode funcionar | `pooler.supabase.com:6543` |

**Recomendação:** Use sempre **Direct Connection**.

---

### 3. ❓ Como obtenho a Direct Connection URL?

**Resposta:**
1. Acesse [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Settings → Database
4. Em "Connection string", selecione **"URI"** (não "Connection pooling")
5. Copie a URL completa

**Exemplo da URL correta:**
```
postgresql://postgres.abc123:[senha]@db.abc123.supabase.co:5432/postgres
```

---

### 4. ❓ Como testo se a URL está correta antes de configurar no Render?

**Resposta:**
Use o script de teste fornecido:

```bash
cd backend
node testar-url-supabase.js "sua-url-completa-aqui"
```

O script irá:
- ✅ Verificar o formato da URL
- ✅ Testar a conexão
- ✅ Executar uma query de teste
- ✅ Verificar se as tabelas existem

---

### 5. ❓ O teste local passou, mas ainda dá erro no Render. O que fazer?

**Possíveis causas:**

1. **URL diferente no Render**
   - Verifique se você colou exatamente a mesma URL que testou

2. **Projeto Supabase pausado**
   - No plano gratuito, projetos pausam após inatividade
   - Acesse o Dashboard do Supabase e ative o projeto

3. **Variável de ambiente não salva**
   - Após editar `DATABASE_URL`, clique em "Save Changes"
   - Aguarde o redeploy completar

4. **Typo na variável**
   - Certifique-se de que a variável se chama exatamente `DATABASE_URL` (maiúsculas)

---

### 6. ❓ Posso usar a porta 6543 ao invés de 5432?

**Resposta:**
Sim, mas com limitações.

- **Porta 5432**: Session mode (recomendado)
  - Suporta prepared statements
  - Melhor performance
  - Conexões mais estáveis

- **Porta 6543**: Transaction mode
  - Algumas limitações SQL
  - Útil se 5432 não funcionar

**Recomendação:** Use a porta 5432 com Direct Connection.

---

### 7. ❓ Meu projeto Supabase está pausado. Como ativo?

**Resposta:**
1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Se estiver pausado, verá um aviso no topo
4. Clique em "Restore project" ou "Unpause"
5. Aguarde alguns minutos para ativação

**Dica:** No plano gratuito, projetos pausam após 7 dias de inatividade.

---

### 8. ❓ Como sei se meu deploy no Render foi bem-sucedido?

**Resposta:**
Verifique os logs do Render:

1. Acesse seu Web Service no Render
2. Clique em "Logs" no menu lateral
3. Procure por estas mensagens:

```
✅ Conectado ao PostgreSQL (Supabase/Render)
🚀 Servidor rodando na porta: 3001
```

Se ver essas mensagens, o deploy foi bem-sucedido! ✅

---

### 9. ❓ Preciso criar as tabelas manualmente no Supabase?

**Resposta:**
Sim! O sistema não cria tabelas automaticamente.

**Como criar:**
1. Acesse o Dashboard do Supabase
2. SQL Editor (menu lateral)
3. Nova query
4. Cole o conteúdo do arquivo `database_supabase.sql`
5. Execute (Run)

📖 [Ver script SQL](./database_supabase.sql)

---

### 10. ❓ Recebi erro "relation does not exist". O que significa?

**Resposta:**
Significa que uma ou mais tabelas não existem no banco de dados.

**Solução:**
1. Execute o script `database_supabase.sql` no Supabase SQL Editor
2. Verifique se todas as tabelas foram criadas:
   - `clientes`
   - `obrigacoes`
   - `obrigacoes_executadas`
   - `feriados`

---

### 11. ❓ Posso usar MySQL ao invés de Supabase no Render?

**Resposta:**
Sim, mas precisa configurar:

1. Configure um servidor MySQL (ex: PlanetScale, Railway)
2. Obtenha a URL de conexão MySQL
3. Configure `DATABASE_URL` no Render
4. Execute o script `database_supabase.sql` adaptado para MySQL

📖 [Ver guia MySQL](./MYSQL_SETUP.md)

---

### 12. ❓ Como vejo quais variáveis de ambiente estão configuradas?

**Resposta:**
No Render Dashboard:
1. Seu Web Service → Environment
2. Você verá todas as variáveis
3. Os valores ficam ocultos por segurança (••••)

**Variáveis necessárias:**
- `DATABASE_URL` - URL do banco de dados
- `NODE_ENV` - `production`
- `CORS_ORIGIN` - URL do frontend (ex: Vercel)

---

### 13. ❓ O deploy funcionou, mas o frontend não conecta. O que fazer?

**Possíveis causas:**

1. **CORS não configurado**
   - Configure `CORS_ORIGIN` no Render com a URL do seu frontend

2. **URL do backend incorreta no frontend**
   - Verifique o arquivo `.env` do frontend
   - Deve apontar para a URL do Render (ex: `https://seu-app.onrender.com`)

3. **Backend em cold start**
   - No plano gratuito do Render, apps "dormem" após inatividade
   - Primeira requisição pode levar 30-60 segundos

---

### 14. ❓ Quanto tempo leva um deploy no Render?

**Tempo médio:**
- Build: 1-2 minutos
- Deploy: 30-60 segundos
- **Total: 2-3 minutos**

Se demorar mais de 5 minutos, verifique os logs para erros.

---

### 15. ❓ Como faço redeploy manualmente no Render?

**Resposta:**
1. Acesse seu Web Service
2. Clique no botão "Manual Deploy" (canto superior direito)
3. Selecione "Clear build cache & deploy"
4. Aguarde o processo terminar

---

### 16. ❓ O plano gratuito do Render tem limitações?

**Resposta:**
Sim, no plano gratuito:

- ⏰ **Cold starts**: App "dorme" após 15 min de inatividade
- 🐌 **Performance**: Recursos limitados
- 💾 **Disco**: 512MB de armazenamento
- 🔄 **Build time**: 500 horas/mês de build

**Para produção:** Considere o plano pago ($7/mês).

---

### 17. ❓ Como evito cold starts no plano gratuito?

**Opções:**

1. **Usar serviço de ping:**
   - [UptimeRobot](https://uptimerobot.com) (gratuito)
   - Ping a cada 5 minutos
   - Mantém app ativo

2. **Upgrade para plano pago:**
   - $7/mês
   - Sem cold starts
   - Melhor performance

---

### 18. ❓ Posso ver logs de erros em tempo real?

**Resposta:**
Sim! Duas formas:

**1. No Dashboard:**
- Render Dashboard → Seu serviço → Logs
- Atualize a página para ver logs novos

**2. Via CLI:**
```bash
# Instalar Render CLI
npm install -g render

# Ver logs em tempo real
render logs -t
```

---

### 19. ❓ Como faço backup do banco de dados no Supabase?

**Resposta:**
1. Dashboard do Supabase → Database
2. "Backups" (menu lateral)
3. Backups automáticos (últimos 7 dias no plano gratuito)
4. Para backup manual: SQL Editor → Export

**Recomendação:** Exporte dados regularmente para segurança.

---

### 20. ❓ Onde encontro mais ajuda?

**Documentação do projeto:**
- 📖 [README principal](./README.md)
- 🚀 [Guia de Deploy Rápido](./RENDER_DEPLOYMENT_GUIDE.md)
- 🔧 [Solução Detalhada](./SOLUCAO_ERRO_RENDER_SUPABASE.md)
- 📊 [Diagrama Visual](./DIAGRAMA_SOLUCAO_RENDER.md)

**Documentação oficial:**
- [Render Docs](https://render.com/docs)
- [Supabase Docs](https://supabase.com/docs)

**Comunidades:**
- [Render Community](https://community.render.com/)
- [Supabase Discord](https://discord.supabase.com/)

---

## 📝 Resumo dos Comandos Mais Usados

```bash
# Testar conexão com Supabase
node backend/testar-url-supabase.js "sua-url"

# Build local do backend
cd backend && npm run build

# Build local do frontend
cd frontend && npm run build

# Instalar Render CLI
npm install -g render

# Ver logs do Render em tempo real
render logs -t
```

---

## 🎯 Checklist de Deploy Completo

```
Preparação:
[ ] Node.js 18+ instalado
[ ] Projeto no GitHub
[ ] Conta no Render
[ ] Conta no Supabase

Supabase:
[ ] Projeto criado
[ ] Tabelas criadas (database_supabase.sql)
[ ] Direct Connection URL copiada

Teste Local:
[ ] URL testada com testar-url-supabase.js
[ ] Teste passou com sucesso

Render:
[ ] Web Service criado
[ ] DATABASE_URL configurada
[ ] NODE_ENV configurada
[ ] CORS_ORIGIN configurada
[ ] Deploy concluído
[ ] Logs verificados
[ ] Sistema funcionando
```

---

**Atualizado em:** Novembro 2025  
**Versão:** 1.0

💡 **Dica:** Marque esta página como favorita para consulta rápida!

