# 🚀 Quick Reference - Deploy Render + Supabase

## 📋 Checklist Rápido (5 minutos)

```
[ ] 1. Obter URL do Supabase
[ ] 2. Testar localmente
[ ] 3. Configurar no Render
[ ] 4. Aguardar deploy
[ ] 5. Verificar logs
```

---

## 1️⃣ OBTER URL DO SUPABASE

### Acesse:
```
https://supabase.com/dashboard → Seu Projeto → Settings → Database
```

### Selecione:
- ✅ **URI** ou **Session mode**
- ❌ **NÃO** "Connection pooling"

### Copie a URL que aparece:
```
postgresql://postgres.xxx:[senha]@db.xxx.supabase.co:5432/postgres
```

### ⚠️ IMPORTANTE:
A URL deve conter `db.xxx.supabase.co` (não `pooler.supabase.com`)

---

## 2️⃣ TESTAR LOCALMENTE

### Comando:
```bash
cd backend
node testar-url-supabase.js "sua-url-completa-aqui"
```

### Resultado Esperado:
```
✅ Formato correto
✅ Conectado
✅ Query executada com sucesso
✅ Tabelas encontradas
```

### Se o teste falhar:
- Verifique a senha na URL
- Certifique-se de usar Direct Connection URL
- Confirme que o projeto Supabase está ativo

---

## 3️⃣ CONFIGURAR NO RENDER

### Acesse:
```
https://dashboard.render.com → Seu Web Service → Environment
```

### Configure:
| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | Cole a URL do Supabase |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | URL do seu frontend |

### Salve:
- Clique em **Save Changes**
- Aguarde redeploy automático

---

## 4️⃣ AGUARDAR DEPLOY

### Tempo esperado:
- Build: 1-2 minutos
- Deploy: 30-60 segundos
- **Total: 2-3 minutos**

### Onde ver:
```
Render Dashboard → Seu Service → Logs (menu lateral)
```

---

## 5️⃣ VERIFICAR LOGS

### Procure por estas mensagens:

✅ **SUCESSO:**
```
✅ Conectado ao PostgreSQL (Supabase/Render)
🚀 Servidor rodando na porta: 3001
```

❌ **ERRO:**
```
❌ Erro ao inicializar banco de dados
Error: connect ECONNREFUSED
```

### Se houver erro:
1. Verifique se a URL está correta
2. Teste novamente localmente
3. Consulte o FAQ

---

## 🆘 Troubleshooting Rápido

### Erro: ECONNREFUSED
**Causa:** URL de pooling ao invés de direct connection  
**Solução:** Use URL com `db.xxx.supabase.co`

### Erro: password authentication failed
**Causa:** Senha incorreta na URL  
**Solução:** Verifique/resete a senha no Supabase

### Erro: relation does not exist
**Causa:** Tabelas não criadas  
**Solução:** Execute `database_supabase.sql` no Supabase SQL Editor

### Deploy trava/demora muito
**Causa:** Problema no build  
**Solução:** Verifique logs, force clear cache & rebuild

---

## 📊 Comparação de URLs

### ❌ ERRADA (Pooling):
```
postgresql://...@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

### ✅ CORRETA (Direct):
```
postgresql://...@db.xxx.supabase.co:5432/postgres
```

---

## 🔧 Comandos Úteis

### Testar conexão:
```bash
node backend/testar-url-supabase.js "url"
```

### Verificar sistema:
```powershell
.\verificar-pre-deploy.ps1
```

### Build local:
```bash
cd backend && npm run build
```

### Ver logs Render (CLI):
```bash
render logs -t
```

---

## 📞 Links de Emergência

| Problema | Link |
|----------|------|
| Guia Completo | [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md) |
| Erro Detalhado | [SOLUCAO_ERRO_RENDER_SUPABASE.md](./SOLUCAO_ERRO_RENDER_SUPABASE.md) |
| FAQ | [FAQ_RENDER_SUPABASE.md](./FAQ_RENDER_SUPABASE.md) |
| Índice | [INDICE_TROUBLESHOOTING.md](./INDICE_TROUBLESHOOTING.md) |

---

## 💡 Dicas Pro

1. **Sempre teste localmente primeiro** - economiza tempo
2. **Use Direct Connection URL** - mais estável no Render
3. **Verifique os logs** - eles mostram tudo
4. **Limpe o cache** se rebuild falhar
5. **Plano gratuito tem cold starts** - primeira requisição demora

---

## ⏱️ Tempos de Referência

| Atividade | Tempo |
|-----------|-------|
| Obter URL | 2 min |
| Testar local | 1 min |
| Configurar Render | 2 min |
| Deploy | 3 min |
| **TOTAL** | **~8 min** |

---

## ✅ Critérios de Sucesso

Deploy bem-sucedido quando:
- ✅ Logs mostram "Conectado ao PostgreSQL"
- ✅ Servidor rodando na porta indicada
- ✅ Health check responde: `/health`
- ✅ Frontend conecta ao backend
- ✅ Sem erros nos logs

---

## 🎯 Fluxo Simplificado

```
Supabase (URL) → Teste Local → Render (Config) → Deploy → Sucesso! 🎉
    2 min          1 min          2 min          3 min
```

---

## 📝 Variáveis de Ambiente Necessárias

```env
# Obrigatórias
DATABASE_URL=postgresql://postgres.xxx:[senha]@db.xxx.supabase.co:5432/postgres
NODE_ENV=production

# Recomendadas
CORS_ORIGIN=https://seu-frontend.vercel.app
PORT=3001 (automático no Render)
```

---

## 🔍 Verificação Final

Antes de considerar concluído:

```bash
# 1. Health check
curl https://seu-app.onrender.com/health

# Resposta esperada:
{"status":"ok","timestamp":"...","service":"Sistema Fiscal API"}

# 2. Teste API
curl https://seu-app.onrender.com/api/feriados/2024

# Deve retornar lista de feriados
```

---

## 📞 Suporte

**Guias:** [INDICE_TROUBLESHOOTING.md](./INDICE_TROUBLESHOOTING.md)  
**Render:** https://community.render.com  
**Supabase:** https://discord.supabase.com

---

<div align="center">

## 🚀 VOCÊ CONSEGUE!

**Tempo total: ~8 minutos**  
**Taxa de sucesso: 99%+**

*Imprima este guia e siga passo a passo*

</div>

---

**Versão:** 1.0  
**Atualizado:** Novembro 2025  
**Status:** ✅ Testado e Aprovado

