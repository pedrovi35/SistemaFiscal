# 🔧 Correção CORS e 502 Bad Gateway - Socket.IO

## 📋 Problema Identificado

O sistema estava apresentando dois erros principais:

1. **Erro CORS**: `Access to XMLHttpRequest at 'https://sistemafiscal.onrender.com/socket.io/...' from origin 'https://sistema-fiscal.vercel.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`

2. **Erro 502 Bad Gateway**: `GET https://sistemafiscal.onrender.com/socket.io/... net::ERR_FAILED 502 (Bad Gateway)`

## 🔍 Análise do Problema

### Causas Identificadas

1. **CORS não configurado corretamente para Socket.IO**
   - O Socket.IO precisa de configuração CORS específica
   - Headers CORS não estavam sendo enviados em todas as respostas
   - Helmet estava bloqueando alguns headers necessários

2. **502 Bad Gateway**
   - Servidor Render em cold start (dormindo)
   - Servidor não respondendo corretamente
   - Timeout durante inicialização

3. **Falta de logging para debug**
   - Difícil identificar qual origem estava sendo bloqueada
   - Sem informações sobre requisições Socket.IO

## ✅ Correções Implementadas

### 1. Backend - Configuração CORS Melhorada (`backend/src/server.ts`)

#### 1.1. Middleware CORS Manual
Adicionado middleware que garante headers CORS em **todas** as respostas:

```typescript
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  // Se a origem está permitida, adicionar headers CORS
  if (!origin || allowedOrigins.indexOf(origin) !== -1) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Authorization, Content-Range, X-Content-Range');
    
    // Para requisições OPTIONS (preflight), responder imediatamente
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  
  next();
});
```

#### 1.2. Configuração Socket.IO Melhorada
- ✅ Logging detalhado de origens
- ✅ Headers CORS explícitos
- ✅ Tratamento de erros de conexão
- ✅ Timeout aumentado para cold start

```typescript
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        console.log('✅ Socket.IO - Requisição sem origin permitida');
        return callback(null, true);
      }
      
      console.log(`🔍 Socket.IO - Verificando origem: ${origin}`);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        console.log(`✅ Socket.IO - Origem permitida: ${origin}`);
        callback(null, true);
      } else {
        console.warn(`⚠️ Socket.IO - Origem bloqueada por CORS: ${origin}`);
        console.warn(`📋 Origens permitidas: ${allowedOrigins.join(', ')}`);
        callback(new Error(`Origem ${origin} não permitida por CORS`), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Type', 'Authorization']
  },
  // ... outras configurações
});
```

#### 1.3. Ajustes no Helmet
Desabilitadas políticas que interferem com Socket.IO:

```typescript
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,      // Desabilitado para Socket.IO
  crossOriginEmbedderPolicy: false   // Desabilitado para Socket.IO
}));
```

#### 1.4. Tratamento de Erros Socket.IO
Adicionado handler para erros de conexão:

```typescript
io.engine.on('connection_error', (err) => {
  console.error('❌ Erro de conexão Socket.IO:', err);
  console.error('📋 Detalhes:', {
    req: err.req?.headers,
    code: err.code,
    message: err.message,
    context: err.context
  });
});
```

#### 1.5. Logging Melhorado
- ✅ Log de origens permitidas na inicialização
- ✅ Log de cada requisição CORS
- ✅ Log de conexões Socket.IO com detalhes

### 2. Frontend - Tratamento de Erros Melhorado (`frontend/src/services/socket.ts`)

#### 2.1. Tratamento Específico de Erros
Diferentes tipos de erro agora têm mensagens específicas:

```typescript
this.socket.on('connect_error', (error) => {
  const errorMessage = error.message || String(error);
  
  if (errorMessage.includes('502') || errorMessage.includes('Bad Gateway')) {
    console.log('⏳ Servidor está iniciando (cold start do Render)...');
    console.log('⏳ Aguarde até 60 segundos para o servidor ficar online');
    console.log('💡 Dica: Configure um ping automático em https://uptimerobot.com');
  } else if (errorMessage.includes('CORS')) {
    console.error('🚫 Erro de CORS detectado');
    // ... instruções detalhadas
  }
  // ... outros tipos de erro
});
```

#### 2.2. Configuração Melhorada
- ✅ Verificação de URL configurada
- ✅ Logging de tentativas de conexão
- ✅ Retry logic melhorado
- ✅ Configuração de credenciais para CORS

```typescript
this.socket = io(SOCKET_URL, {
  transports: ['polling'],
  reconnection: true,
  reconnectionDelay: 5000,
  reconnectionDelayMax: 15000,
  reconnectionAttempts: Infinity,
  timeout: 60000,                 // 60s para cold start
  withCredentials: true,         // Necessário para CORS com credentials
  reconnectionDelayFactor: 1.5,  // Backoff exponencial
  randomizationFactor: 0.5       // Evitar thundering herd
});
```

## 🚀 Como Aplicar as Correções

### 1. Backend (Render.com)

1. **Fazer commit das alterações:**
   ```bash
   git add backend/src/server.ts
   git commit -m "fix: corrigir CORS e tratamento de erros Socket.IO"
   git push
   ```

2. **Verificar variáveis de ambiente no Render:**
   - Acesse: https://dashboard.render.com
   - Vá em: Seu serviço → Environment
   - Verifique se `CORS_ORIGIN` está configurada:
     ```
     CORS_ORIGIN=https://sistema-fiscal.vercel.app
     ```

3. **Aguardar deploy automático** (ou fazer deploy manual)

4. **Verificar logs do Render:**
   - Deve aparecer: `🌐 Origens CORS permitidas: [...]`
   - Deve aparecer logs de conexões Socket.IO

### 2. Frontend (Vercel)

1. **Fazer commit das alterações:**
   ```bash
   git add frontend/src/services/socket.ts
   git commit -m "fix: melhorar tratamento de erros Socket.IO"
   git push
   ```

2. **Verificar variáveis de ambiente no Vercel:**
   - Acesse: https://vercel.com/dashboard
   - Vá em: Seu projeto → Settings → Environment Variables
   - Verifique se estão configuradas:
     ```
     VITE_API_URL=https://sistemafiscal.onrender.com
     VITE_SOCKET_URL=https://sistemafiscal.onrender.com
     ```

3. **Aguardar deploy automático** (ou fazer deploy manual)

## 🧪 Como Testar

### 1. Teste de CORS

Abra o console do navegador e verifique:

```javascript
// Deve aparecer:
✅ Conectado ao servidor via Socket.IO (polling)
🔗 Transport: polling
```

### 2. Teste de Health Check

Acesse no navegador:
```
https://sistemafiscal.onrender.com/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "service": "Sistema Fiscal API",
  "socket": {
    "connected": 0,
    "ready": true
  }
}
```

### 3. Teste de Socket.IO

No console do navegador, após carregar a aplicação:
- ✅ Deve conectar automaticamente
- ✅ Não deve aparecer erros de CORS
- ✅ Se aparecer 502, deve mostrar mensagem explicativa

## 🔍 Troubleshooting

### Erro CORS ainda aparece

1. **Verificar variável CORS_ORIGIN no Render:**
   - Deve ser exatamente: `https://sistema-fiscal.vercel.app`
   - Sem barra no final
   - Sem espaços

2. **Verificar logs do Render:**
   - Deve aparecer a origem sendo verificada
   - Verificar se está sendo bloqueada

3. **Limpar cache do navegador:**
   - Ctrl+Shift+Delete
   - Limpar cache e cookies

### Erro 502 ainda aparece

1. **Servidor em cold start:**
   - Aguardar até 60 segundos
   - O frontend tentará reconectar automaticamente

2. **Configurar ping automático:**
   - Use https://uptimerobot.com
   - Configure ping a cada 5 minutos em: `https://sistemafiscal.onrender.com/health`
   - Isso mantém o servidor ativo

3. **Verificar status do Render:**
   - Acesse: https://dashboard.render.com
   - Verifique se o serviço está "Live"

### Socket.IO não conecta

1. **Verificar URL no frontend:**
   - Console deve mostrar: `🔗 Tentando conectar ao Socket.IO: https://...`
   - Verificar se a URL está correta

2. **Verificar variáveis no Vercel:**
   - `VITE_SOCKET_URL` deve estar configurada
   - Fazer novo build após alterar variáveis

3. **Verificar logs do backend:**
   - Deve aparecer: `✅ Cliente conectado: ...`
   - Deve aparecer: `📋 Transport: polling`

## 📊 Melhorias Implementadas

### Backend
- ✅ Middleware CORS manual garantindo headers em todas as respostas
- ✅ Logging detalhado para debug
- ✅ Tratamento de erros Socket.IO
- ✅ Configuração Helmet ajustada
- ✅ Health check com informações Socket.IO

### Frontend
- ✅ Tratamento específico para cada tipo de erro
- ✅ Mensagens de erro mais claras e acionáveis
- ✅ Retry logic melhorado
- ✅ Verificação de configuração
- ✅ Logging de tentativas de conexão

## 🎯 Próximos Passos (Opcional)

1. **Configurar UptimeRobot:**
   - Ping a cada 5 minutos
   - URL: `https://sistemafiscal.onrender.com/health`
   - Isso evita cold start

2. **Monitoramento:**
   - Adicionar métricas de conexões Socket.IO
   - Alertas para erros CORS

3. **Documentação:**
   - Adicionar guia de troubleshooting
   - Documentar variáveis de ambiente

## 📝 Notas Importantes

- ⚠️ **CORS_ORIGIN** deve ser configurada no Render
- ⚠️ **VITE_SOCKET_URL** deve ser configurada no Vercel
- ⚠️ Servidor Render pode ter cold start (até 60s)
- ✅ Frontend reconecta automaticamente
- ✅ Logs detalhados facilitam debug

## ✅ Status

- [x] CORS corrigido no backend
- [x] Tratamento de erros melhorado no frontend
- [x] Logging adicionado
- [x] Documentação criada
- [ ] Testes em produção (após deploy)

---

**Data da Correção:** 2024
**Versão:** 1.0.0

