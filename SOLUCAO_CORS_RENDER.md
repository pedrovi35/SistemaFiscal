# 🔧 Solução para Erros de CORS e Socket.IO no Render

## 📋 Problema Identificado

Você está enfrentando os seguintes erros ao tentar conectar o frontend (Vercel) com o backend (Render):

### Erros Observados:

```
❌ Access to XMLHttpRequest at 'https://sistemafiscal.onrender.com/socket.io/...' 
   from origin 'https://sistema-fiscal.vercel.app' has been blocked by CORS policy: 
   No 'Access-Control-Allow-Origin' header is present on the requested resource.

❌ GET https://sistemafiscal.onrender.com/socket.io/... 502 (Bad Gateway)

❌ POST https://sistemafiscal.onrender.com/socket.io/... 400 (Bad Request)
```

---

## 🔍 Causa do Problema

### 1. **Cold Start do Render (Plano Gratuito)**

O Render.com no plano gratuito coloca o serviço em **hibernação** após **15 minutos de inatividade**. Quando uma requisição chega:

- ⏳ O servidor demora **30-60 segundos** para iniciar
- ❌ Durante esse tempo, retorna **erro 502 (Bad Gateway)**
- ❌ Socket.IO tenta conectar antes do servidor estar pronto
- ❌ Resulta em erros de CORS e timeout

### 2. **Timeout Curto no Socket.IO**

A configuração anterior tinha timeout de apenas **20 segundos**, insuficiente para o cold start do Render.

### 3. **Configuração de CORS**

O Socket.IO precisa de configuração específica de CORS para funcionar corretamente com requisições cross-origin.

---

## ✅ Soluções Implementadas

### 🔧 **1. Backend - Melhorias no Socket.IO** (`backend/src/server.ts`)

```typescript
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`⚠️ Socket.IO - Origem bloqueada: ${origin}`);
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  // Configurações para Render
  pingTimeout: 60000,      // 60s antes de considerar desconectado
  pingInterval: 25000,     // Envia ping a cada 25s
  upgradeTimeout: 30000,   // 30s para upgrade
  maxHttpBufferSize: 1e6,  // 1MB buffer
  allowUpgrades: true,
  perMessageDeflate: false
});
```

**Benefícios:**
- ✅ Timeout maior para cold start
- ✅ Ping mais frequente mantém conexão viva
- ✅ CORS configurado dinamicamente
- ✅ Melhor tratamento de erros

### 🔧 **2. Frontend - Timeout e Retry Melhorados** (`frontend/src/services/socket.ts`)

```typescript
this.socket = io(SOCKET_URL, {
  transports: ['polling'],
  reconnection: true,
  reconnectionDelay: 5000,        // 5s entre tentativas (aumentado)
  reconnectionDelayMax: 15000,    // Máximo 15s
  reconnectionAttempts: Infinity,
  timeout: 60000,                 // 60s para cold start do Render
  autoConnect: true,
  forceNew: false,
  upgrade: false,                 // Não tentar WebSocket
  rememberUpgrade: false,
  rejectUnauthorized: false
});
```

**Benefícios:**
- ✅ Timeout de **60 segundos** para cold start
- ✅ Retry mais espaçado (5s ao invés de 3s)
- ✅ Melhor tratamento de erros 502 e CORS
- ✅ Não tenta upgrade para WebSocket (mais estável)

### 🔧 **3. Mensagens de Erro Mais Claras**

```typescript
this.socket.on('connect_error', (error) => {
  if (error.message.includes('502') || error.message.includes('Bad Gateway')) {
    console.log('⏳ Servidor está iniciando (cold start)... Aguarde até 60s');
  } else if (error.message.includes('CORS')) {
    console.error('🚫 Erro de CORS - Verifique as configurações do backend');
  }
  console.log('🔄 Tentando reconectar...');
});
```

---

## 🚀 Como Aplicar as Correções

### **Passo 1: Recompilar o Backend**

```bash
cd backend
npm run build
```

### **Passo 2: Fazer Deploy no Render**

Opção A - **Push para o Git (Recomendado)**:
```bash
git add .
git commit -m "fix: Melhorar configuração CORS e Socket.IO para Render"
git push origin main
```

O Render vai detectar automaticamente e fazer o redeploy.

Opção B - **Deploy Manual**:
1. Acesse o [Dashboard do Render](https://dashboard.render.com)
2. Selecione seu serviço
3. Clique em **"Manual Deploy"** > **"Deploy latest commit"**

### **Passo 3: Verificar Variáveis de Ambiente no Render**

No dashboard do Render, vá em **Environment** e confirme:

```env
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://sistema-fiscal.vercel.app
DATABASE_URL=(sua URL do banco)
```

⚠️ **IMPORTANTE**: Não coloque `/` no final da `CORS_ORIGIN`

### **Passo 4: Rebuild do Frontend (se necessário)**

```bash
cd frontend
npm run build
```

Se estiver usando Vercel, faça commit e push:

```bash
git add .
git commit -m "fix: Aumentar timeout Socket.IO para cold start"
git push origin main
```

---

## 🧪 Como Testar

### **1. Teste Rápido - Health Check**

Abra no navegador:
```
https://sistemafiscal.onrender.com/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2025-11-07T...",
  "service": "Sistema Fiscal API"
}
```

Se retornar **502**, aguarde 30-60s e tente novamente (cold start).

### **2. Teste de CORS**

No console do navegador (F12) do frontend:

```javascript
fetch('https://sistemafiscal.onrender.com/health', {
  method: 'GET',
  headers: {
    'Origin': 'https://sistema-fiscal.vercel.app'
  }
}).then(r => r.json()).then(console.log);
```

Deve retornar o JSON sem erros de CORS.

### **3. Teste de Socket.IO**

Abra o frontend e observe o console. Você deve ver:

```
⏳ Servidor está iniciando (cold start)... Aguarde até 60s
🔄 Tentando reconectar...
🔄 Tentativa de reconexão #1
🔄 Tentativa de reconexão #2
✅ Conectado ao servidor via Socket.IO (polling)
🔗 Transport: polling
```

---

## 📊 Cronograma de Conexão Esperado

### **Primeiro Acesso (Cold Start):**

| Tempo | Evento |
|-------|--------|
| 0s    | Frontend tenta conectar |
| 0-5s  | Erro 502 (servidor iniciando) |
| 5s    | Primeira tentativa de reconexão |
| 10s   | Segunda tentativa |
| 15s   | Terceira tentativa |
| 30-60s| **Servidor pronto** ✅ |
| 60s   | Conexão estabelecida 🎉 |

### **Acessos Subsequentes (Servidor Ativo):**

| Tempo | Evento |
|-------|--------|
| 0s    | Frontend tenta conectar |
| 1-2s  | **Conexão estabelecida** ✅ |

---

## 🐛 Troubleshooting

### **Problema: Ainda recebo erro 502 após 60s**

**Possíveis causas:**
1. Servidor não está rodando no Render
2. Erro no código impedindo o startup
3. Variáveis de ambiente faltando

**Solução:**
```bash
# Verificar logs no Render
1. Acesse Dashboard > Seu Serviço
2. Clique em "Logs"
3. Procure por erros em vermelho
```

### **Problema: Erro de CORS persiste**

**Verificações:**
1. ✅ `CORS_ORIGIN=https://sistema-fiscal.vercel.app` (sem `/`)
2. ✅ Backend recompilado e deployed
3. ✅ Frontend usando a URL correta do backend
4. ✅ Navegador sem cache (Ctrl+Shift+R)

**Teste manual:**
```bash
curl -H "Origin: https://sistema-fiscal.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://sistemafiscal.onrender.com/socket.io/
```

Deve retornar headers:
```
Access-Control-Allow-Origin: https://sistema-fiscal.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

### **Problema: Desconexões frequentes**

**Possível causa:** Render está colocando o serviço em hibernação.

**Soluções:**

1. **Grátis: Usar Ping Service** (mantém servidor acordado)
   - Use [UptimeRobot](https://uptimerobot.com) ou [Cron-job.org](https://cron-job.org)
   - Configure ping a cada 5-10 minutos para `/health`

2. **Grátis: Aceitar o cold start**
   - Usuários aguardam 60s na primeira conexão
   - Depois conexão fica estável

3. **Pago: Upgrade para plano Starter do Render ($7/mês)**
   - Servidor sempre ativo
   - Sem cold start
   - Melhor performance

---

## 💡 Dicas para Melhor Experiência

### **1. Adicionar Indicador de Loading**

No frontend, adicione um componente que mostre:

```tsx
{!socketConnected && (
  <div className="fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded">
    ⏳ Conectando ao servidor... (pode levar até 60s)
  </div>
)}
```

### **2. Cache de Dados**

Use localStorage para manter dados enquanto o servidor inicia:

```typescript
// Salvar no localStorage
localStorage.setItem('obrigacoes', JSON.stringify(obrigacoes));

// Carregar do localStorage
const cached = localStorage.getItem('obrigacoes');
if (cached) {
  setObrigacoes(JSON.parse(cached));
}
```

### **3. Modo Offline**

Implemente funcionalidade offline:
- ✅ Permitir visualização de dados em cache
- ✅ Mostrar badge "Modo Offline"
- ✅ Sincronizar quando reconectar

---

## 📈 Monitoramento

### **Logs a Observar no Backend:**

```bash
✅ Cliente conectado: [socket-id]
⚠️ Socket.IO - Origem bloqueada: [url]
❌ Cliente desconectado: [socket-id]
```

### **Logs a Observar no Frontend:**

```bash
✅ Conectado ao servidor via Socket.IO (polling)
⏳ Servidor está iniciando (cold start)... Aguarde até 60s
🔄 Tentando reconectar...
```

---

## 🎯 Resumo das Mudanças

| Arquivo | Mudança | Motivo |
|---------|---------|--------|
| `backend/src/server.ts` | Timeout 60s no Socket.IO | Cold start do Render |
| `backend/src/server.ts` | CORS dinâmico | Melhor controle de origens |
| `backend/src/server.ts` | pingInterval 25s | Manter conexão viva |
| `frontend/src/services/socket.ts` | Timeout 60s | Aguardar cold start |
| `frontend/src/services/socket.ts` | reconnectionDelay 5s | Retry mais espaçado |
| `frontend/src/services/socket.ts` | Mensagens de erro | Melhor UX |

---

## ✅ Checklist Final

Antes de testar, confirme:

- [ ] Backend recompilado (`npm run build`)
- [ ] Código commitado e pushed para o Git
- [ ] Deploy feito no Render
- [ ] Variável `CORS_ORIGIN` configurada corretamente
- [ ] Frontend atualizado (se necessário)
- [ ] Cache do navegador limpo (Ctrl+Shift+R)

---

## 🆘 Precisa de Ajuda?

Se ainda tiver problemas:

1. **Verificar logs do Render:**
   - Dashboard > Logs
   - Procure por erros em vermelho

2. **Verificar console do navegador:**
   - F12 > Console
   - Veja mensagens de erro

3. **Testar health check:**
   - `https://sistemafiscal.onrender.com/health`
   - Deve retornar JSON

4. **Compartilhar logs:**
   - Copie os logs do Render
   - Copie os erros do console
   - Abra uma issue no GitHub

---

## 📚 Referências

- [Render Free Tier Limitations](https://render.com/docs/free#free-web-services)
- [Socket.IO CORS Documentation](https://socket.io/docs/v4/handling-cors/)
- [Vercel Deployment](https://vercel.com/docs)

---

**Data:** 07/11/2025  
**Status:** ✅ Implementado  
**Versão:** 1.0

