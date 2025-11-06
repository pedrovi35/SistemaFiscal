# 🌐 Configuração do CORS

Este documento explica como configurar corretamente o CORS (Cross-Origin Resource Sharing) no Sistema Fiscal para permitir que o frontend se comunique com o backend.

## 📋 O que é CORS?

CORS é um mecanismo de segurança que controla quais domínios externos podem fazer requisições ao seu servidor. É essencial configurá-lo corretamente para que o frontend hospedado no Vercel (ou outro domínio) consiga acessar a API do backend.

## ⚙️ Configuração Atual

O servidor já está configurado para usar a variável de ambiente `CORS_ORIGIN`:

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

## 🔧 Como Configurar

### 1️⃣ Desenvolvimento Local

No arquivo `.env` do backend:

```env
CORS_ORIGIN=http://localhost:5173
```

### 2️⃣ Produção (Vercel)

No arquivo `.env` do backend (ou nas variáveis de ambiente do serviço de hospedagem):

```env
CORS_ORIGIN=https://sistema-fiscal.vercel.app
```

**⚠️ IMPORTANTE:**
- **NÃO** inclua barra (`/`) no final da URL
- Use a URL **exata** do seu frontend no Vercel
- Exemplo correto: `https://sistema-fiscal.vercel.app`
- Exemplo **incorreto**: `https://sistema-fiscal.vercel.app/`

### 3️⃣ Múltiplos Domínios (Avançado)

Se você precisa permitir múltiplos domínios (local + produção), modifique o `server.ts`:

```typescript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://sistema-fiscal.vercel.app',
  'https://seu-dominio-customizado.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

## 🌐 Configuração do WebSocket

O Socket.IO também precisa da configuração do CORS:

```typescript
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});
```

Esta configuração já está implementada no servidor.

## 🔄 Socket.IO - Configuração de Polling

### Por que usar Polling?

O Socket.IO no frontend está configurado para usar **apenas polling** (ao invés de WebSocket puro) para garantir compatibilidade máxima com plataformas de hospedagem:

- ✅ **Vercel**: Não suporta WebSocket nativamente em planos gratuitos
- ✅ **Render (Free Tier)**: WebSocket pode ter timeout em 30s de inatividade
- ✅ **Cloudflare**: Pode bloquear WebSocket em alguns planos
- ✅ **Netlify**: Não suporta WebSocket em planos gratuitos

### Configuração no Frontend

O arquivo `frontend/src/services/socket.ts` já está configurado:

```typescript
const socket = io(SOCKET_URL, {
  transports: ['polling'],          // Força usar apenas polling
  reconnection: true,
  reconnectionDelay: 3000,          // Tenta reconectar a cada 3s
  reconnectionDelayMax: 10000,      // Máximo de 10s entre tentativas
  reconnectionAttempts: Infinity,   // Tenta reconectar indefinidamente
  timeout: 20000                    // Timeout de 20s para conexão inicial
});
```

### Diferença entre Polling e WebSocket

| Característica | Polling | WebSocket |
|----------------|---------|-----------|
| Compatibilidade | ✅ Universal | ⚠️ Requer suporte específico |
| Latência | ~100-200ms | ~10-50ms |
| Consumo de recursos | Médio | Baixo |
| Ideal para | Produção (Vercel/Render) | Desenvolvimento local |

### Performance

O polling HTTP long-polling usado pelo Socket.IO é **suficientemente rápido** para a maioria dos casos de uso:

- ✅ Notificações em tempo real
- ✅ Atualizações de status
- ✅ Sincronização de dados
- ⚠️ Pode não ser ideal para: jogos em tempo real, vídeo conferência

### Alternar para WebSocket (Opcional)

Se você quiser usar WebSocket em desenvolvimento (mais rápido), pode criar um arquivo `.env` no frontend:

```env
# frontend/.env
VITE_SOCKET_URL=http://localhost:3001
```

E modificar temporariamente o `socket.ts`:

```typescript
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'], // Tenta WebSocket primeiro
  // ... resto da configuração
});
```

**⚠️ Importante**: Em produção com Vercel, mantenha `transports: ['polling']`

## 🚀 Deploy no Render/Railway/Heroku

Ao fazer deploy do backend, configure a variável de ambiente:

### Render
1. Acesse o dashboard do seu serviço
2. Vá em **Environment**
3. Adicione a variável:
   - **Key:** `CORS_ORIGIN`
   - **Value:** `https://sistema-fiscal.vercel.app`

### Railway
1. Acesse o projeto
2. Vá em **Variables**
3. Adicione:
   - **Variable:** `CORS_ORIGIN`
   - **Value:** `https://sistema-fiscal.vercel.app`

### Heroku
```bash
heroku config:set CORS_ORIGIN=https://sistema-fiscal.vercel.app
```

## ✅ Verificando se está Funcionando

### 1. No Console do Navegador

Abra o DevTools (F12) e veja se há erros de CORS. Se tiver algo como:

```
Access to fetch at 'http://api.com' from origin 'https://sistema-fiscal.vercel.app' 
has been blocked by CORS policy
```

Significa que o CORS **NÃO** está configurado corretamente.

### 2. Teste com cURL

```bash
curl -H "Origin: https://sistema-fiscal.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     --verbose \
     https://sua-api.com/api/clientes
```

A resposta deve incluir:
```
Access-Control-Allow-Origin: https://sistema-fiscal.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Credentials: true
```

### 3. Verificar Logs do Backend

Ao iniciar o servidor, deve aparecer:

```
🚀 Sistema Fiscal - Backend
🚀 Servidor rodando na porta: 3001
🚀 Ambiente: production
```

## 🔒 Segurança

### ✅ Boas Práticas

1. **Nunca** use `origin: '*'` em produção
2. Sempre especifique os domínios permitidos
3. Use `credentials: true` apenas se necessário
4. Configure HTTPS em produção

### ❌ Evite

```typescript
// ❌ NÃO FAÇA ISSO EM PRODUÇÃO
app.use(cors({ origin: '*' }));
```

```typescript
// ❌ NÃO INCLUA BARRA NO FINAL
CORS_ORIGIN=https://sistema-fiscal.vercel.app/
```

## 🐛 Troubleshooting

### Erro: "CORS policy: No 'Access-Control-Allow-Origin'"

**Solução:**
1. Verifique se a variável `CORS_ORIGIN` está definida
2. Confirme que a URL está **exata** (sem barra no final)
3. Reinicie o servidor backend após alterar `.env`

### Erro: "CORS policy: The value of the 'Access-Control-Allow-Credentials'"

**Solução:**
- Certifique-se de que `credentials: true` está configurado tanto no backend quanto no frontend

### Frontend não consegue fazer requisições

**Checklist:**
- [ ] `CORS_ORIGIN` configurada corretamente
- [ ] URL sem barra no final
- [ ] Servidor backend rodando
- [ ] Backend acessível pela internet (se em produção)
- [ ] Protocolo correto (http vs https)

## 📚 Recursos Adicionais

- [MDN - CORS](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS)
- [Express CORS Middleware](https://expressjs.com/en/resources/middleware/cors.html)
- [Socket.IO CORS](https://socket.io/docs/v4/handling-cors/)

## 🆘 Precisa de Ajuda?

Se ainda estiver com problemas:

1. Verifique os logs do backend
2. Verifique o console do navegador (F12)
3. Confirme que as URLs estão corretas
4. Teste com cURL conforme exemplos acima

