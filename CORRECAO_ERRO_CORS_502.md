# 🔧 Correção de Erros CORS e 502 Bad Gateway

## 📋 Problema Identificado

O sistema está apresentando dois erros principais:

1. **Erro de CORS**: `Access to XMLHttpRequest has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present`
2. **Erro 502 Bad Gateway**: O servidor no Render não está respondendo

### Causas Identificadas

#### 1. Erro 502 Bad Gateway
O erro 502 indica que o servidor no Render não está respondendo. Isso pode acontecer por:

- **Cold Start**: O Render coloca serviços gratuitos em "sleep" após 15 minutos de inatividade. O primeiro acesso após o sleep pode levar até 60 segundos para iniciar.
- **Erro no Servidor**: O servidor pode estar falhando ao iniciar devido a:
  - Variáveis de ambiente não configuradas
  - Erro de conexão com o banco de dados
  - Erro no código que impede a inicialização
- **Problema de Configuração**: Build ou start command incorretos

#### 2. Erro de CORS
O erro de CORS aparece porque:

- Quando há um 502, o servidor não envia os headers CORS (não há resposta do servidor)
- A configuração de CORS pode não estar incluindo todos os headers necessários em todas as respostas
- O Socket.IO pode ter configuração de CORS diferente da API REST

## ✅ Correções Implementadas

### 1. Melhorias na Configuração de CORS

#### Middleware de CORS Manual
- ✅ Headers CORS são adicionados em **TODAS** as respostas, incluindo erros
- ✅ Cache de preflight aumentado para 24 horas (`Access-Control-Max-Age`)
- ✅ Headers CORS adicionados mesmo em rotas 404 e error handlers

#### Socket.IO CORS
- ✅ Configuração mais permissiva em produção para origens do Vercel
- ✅ Logs detalhados para debug
- ✅ Cache de preflight configurado

#### Error Handler
- ✅ Headers CORS adicionados mesmo em erros 500
- ✅ Mensagens de erro mais claras para problemas de CORS
- ✅ Retorna 403 com lista de origens permitidas quando há erro de CORS

### 2. Health Check Melhorado
- ✅ Health check sempre responde, mesmo em caso de erro
- ✅ Inclui informações sobre CORS e origens permitidas
- ✅ Headers CORS sempre presentes

### 3. Tratamento de Erros Robusto
- ✅ Todos os middlewares garantem headers CORS
- ✅ Logs detalhados para facilitar debug
- ✅ Tratamento específico para diferentes tipos de erro

## 🚀 Como Resolver o Problema

### Passo 1: Verificar se o Servidor está Online

1. Acesse: `https://sistemafiscal.onrender.com/health`
2. Se retornar JSON com `status: 'ok'`, o servidor está funcionando
3. Se retornar 502, o servidor está inativo (cold start)

### Passo 2: Verificar Variáveis de Ambiente no Render

No painel do Render, verifique se as seguintes variáveis estão configuradas:

```env
DATABASE_URL=postgresql://...
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://sistema-fiscal.vercel.app
```

**Importante**: A variável `CORS_ORIGIN` deve incluir `https://sistema-fiscal.vercel.app`

### Passo 3: Verificar Build e Start Commands

No Render, verifique:

- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && npm start`
- **Root Directory**: Deixe vazio ou configure como `backend`

### Passo 4: Prevenir Cold Start (Opcional mas Recomendado)

Para evitar que o servidor entre em sleep:

1. Use um serviço de ping automático como [UptimeRobot](https://uptimerobot.com)
2. Configure para fazer ping em `https://sistemafiscal.onrender.com/health` a cada 5 minutos
3. Isso mantém o servidor sempre ativo

### Passo 5: Verificar Logs no Render

1. Acesse o dashboard do Render
2. Vá em "Logs" do seu serviço
3. Verifique se há erros de inicialização
4. Procure por mensagens como:
   - `🌐 Origens CORS permitidas:` - Deve listar `https://sistema-fiscal.vercel.app`
   - `🚀 Servidor rodando na porta:` - Confirma que o servidor iniciou

### Passo 6: Verificar Frontend

No Vercel, verifique se as variáveis de ambiente estão configuradas:

```env
VITE_API_URL=https://sistemafiscal.onrender.com/api
VITE_SOCKET_URL=https://sistemafiscal.onrender.com
```

## 🔍 Diagnóstico

### Se o erro persistir:

1. **Teste o health check diretamente**:
   ```bash
   curl https://sistemafiscal.onrender.com/health
   ```

2. **Verifique os logs do Render**:
   - Procure por erros de conexão com o banco
   - Verifique se o servidor está iniciando corretamente
   - Confirme que as origens CORS estão sendo logadas

3. **Teste uma requisição simples**:
   ```bash
   curl -H "Origin: https://sistema-fiscal.vercel.app" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://sistemafiscal.onrender.com/api/clientes
   ```

4. **Verifique o console do navegador**:
   - Abra o DevTools (F12)
   - Vá na aba Network
   - Tente fazer uma requisição
   - Verifique os headers da resposta (ou falta deles)

## 📝 Checklist de Verificação

- [ ] Servidor responde em `/health`
- [ ] Variável `CORS_ORIGIN` configurada no Render
- [ ] Variável `DATABASE_URL` configurada e válida
- [ ] `VITE_API_URL` configurada no Vercel
- [ ] `VITE_SOCKET_URL` configurada no Vercel
- [ ] Build e Start commands corretos no Render
- [ ] Logs do Render não mostram erros de inicialização
- [ ] Health check retorna informações de CORS

## 🎯 Próximos Passos

1. **Fazer deploy das correções**:
   ```bash
   cd backend
   npm run build
   git add .
   git commit -m "Correção: Melhorias em CORS e tratamento de erros"
   git push
   ```

2. **Aguardar deploy no Render** (pode levar alguns minutos)

3. **Testar o health check** após o deploy

4. **Configurar UptimeRobot** para prevenir cold start

5. **Testar o frontend** após confirmar que o backend está online

## 📚 Referências

- [Render Documentation](https://render.com/docs)
- [CORS MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Socket.IO CORS](https://socket.io/docs/v4/handling-cors/)
- [Express CORS](https://expressjs.com/en/resources/middleware/cors.html)

## ⚠️ Notas Importantes

1. **Cold Start**: O primeiro acesso após o servidor entrar em sleep pode levar até 60 segundos. Isso é normal no plano gratuito do Render.

2. **CORS com Credentials**: Quando `credentials: true` está configurado, não é possível usar `Access-Control-Allow-Origin: *`. A origem deve ser especificada explicitamente.

3. **Socket.IO e CORS**: O Socket.IO tem sua própria configuração de CORS, separada da API REST. Ambas devem estar configuradas corretamente.

4. **Preflight Requests**: Requisições OPTIONS (preflight) devem ser respondidas imediatamente com status 200, antes de processar a requisição real.

