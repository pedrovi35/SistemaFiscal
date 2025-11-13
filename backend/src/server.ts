import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from './config/database';
import routes from './routes';
import recorrenciaJob from './jobs/recorrenciaJob';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configurar origens permitidas
const allowedOrigins: string[] = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://sistema-fiscal.vercel.app',
  process.env.CORS_ORIGIN
].filter((origin): origin is string => Boolean(origin));

// Log das origens permitidas
console.log('🌐 Origens CORS permitidas:', allowedOrigins);

// Configuração especial para Render.com (evita problemas de cold start)
// IMPORTANTE: Em produção, SEMPRE permitir qualquer origem para evitar problemas de CORS com 502
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // CRÍTICO: SEMPRE permitir em produção para evitar problemas de CORS com 502 Bad Gateway
      // Quando o servidor está com cold start ou erro, o navegador precisa receber headers CORS
      if (process.env.NODE_ENV === 'production') {
        console.log(`✅ Socket.IO - Permitindo origem em produção: ${origin || 'sem origin'}`);
        return callback(null, true);
      }
      
      // Permitir requisições sem origin (apps mobile, Postman, etc)
      if (!origin) {
        console.log('✅ Socket.IO - Requisição sem origin permitida');
        return callback(null, true);
      }
      
      // Log para debug
      console.log(`🔍 Socket.IO - Verificando origem: ${origin}`);
      
      // Verificar se a origem está na lista permitida
      if (allowedOrigins.indexOf(origin) !== -1) {
        console.log(`✅ Socket.IO - Origem permitida: ${origin}`);
        return callback(null, true);
      }
      
      // Em desenvolvimento, permitir localhost e Vercel mesmo se não estiver na lista
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('vercel.app')) {
        console.log(`✅ Socket.IO - Permitindo origem conhecida: ${origin}`);
        return callback(null, true);
      }
      
      // Em desenvolvimento, bloquear origens não permitidas
      console.warn(`⚠️ Socket.IO - Origem bloqueada: ${origin}`);
      console.warn(`📋 Origens permitidas: ${allowedOrigins.join(', ')}`);
      return callback(new Error(`Origem ${origin} não permitida por CORS`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    // Adicionar maxAge para cache de preflight
    maxAge: 86400 // 24 horas
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  // Configurações para melhor compatibilidade com Render
  pingTimeout: 120000,     // 120s antes de considerar desconectado (aumentado para cold start)
  pingInterval: 25000,    // Envia ping a cada 25s
  upgradeTimeout: 60000,  // 60s para upgrade de transporte (aumentado)
  maxHttpBufferSize: 1e6, // 1MB de buffer
  allowUpgrades: true,    // Permitir upgrade de polling para websocket
  perMessageDeflate: false, // Desabilitar compressão para melhor performance
  // Configurações adicionais para evitar problemas de CORS e cold start
  connectTimeout: 120000,  // 120s para timeout de conexão (aumentado para cold start)
  serveClient: false,      // Não servir o cliente Socket.IO
  // Configurações críticas para Render
  cookie: {
    name: 'io',
    httpOnly: false,
    sameSite: 'lax',
    path: '/'
  }
});

const PORT = process.env.PORT || 3001;

// Middleware especial para Socket.IO - garantir CORS ANTES de qualquer processamento
// CRÍTICO: Este middleware deve ser executado ANTES do Socket.IO processar a requisição
app.use('/socket.io', (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  
  // SEMPRE adicionar headers CORS para Socket.IO (crítico para evitar erro de CORS com 502)
  // Em produção, SEMPRE permitir qualquer origem do Vercel
  if (process.env.NODE_ENV === 'production') {
    // Em produção, sempre permitir a origem da requisição
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  } else if (origin) {
    // Em desenvolvimento, verificar se está na lista ou é conhecida
    if (origin.includes('vercel.app') || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') ||
        allowedOrigins.indexOf(origin) !== -1) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // Mesmo em desenvolvimento, permitir para evitar erro de CORS
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  } else {
    // Sem origin, permitir qualquer origem
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  // Sempre adicionar todos os headers CORS necessários
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Para requisições OPTIONS (preflight), responder imediatamente com 200
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Middleware de CORS manual para garantir headers em TODAS as respostas (incluindo erros)
// Este middleware deve ser o PRIMEIRO para garantir que headers CORS estejam sempre presentes
app.use((req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  
  // Em produção, ser mais permissivo com origens do Vercel
  const isVercelOrigin = origin && origin.includes('vercel.app');
  const isAllowedOrigin = !origin || allowedOrigins.indexOf(origin) !== -1;
  const shouldAllow = isAllowedOrigin || (process.env.NODE_ENV === 'production' && isVercelOrigin);
  
  // SEMPRE adicionar headers CORS para evitar erro de CORS quando servidor está com problema
  // Isso é crítico para evitar que o navegador bloqueie antes mesmo de chegar ao servidor
  if (shouldAllow || process.env.NODE_ENV === 'production') {
    if (origin && (isAllowedOrigin || isVercelOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      // Para requisições sem origin (Postman, mobile, etc), permitir qualquer origem
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (process.env.NODE_ENV === 'production') {
      // Em produção, permitir origem mesmo se não estiver na lista (para evitar bloqueios)
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Authorization, Content-Range, X-Content-Range');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight por 24h
    
    // Para requisições OPTIONS (preflight), responder imediatamente
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  } else {
    // Em desenvolvimento, logar mas ainda adicionar headers para evitar erro de CORS
    console.warn(`⚠️ CORS - Origem não na lista: ${origin}`);
    console.warn(`📋 Origens permitidas: ${allowedOrigins.join(', ')}`);
    
    // Mesmo assim, adicionar headers para evitar erro de CORS no navegador
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
});

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Desabilitar alguns recursos do Helmet que podem interferir com Socket.IO
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  // Permitir que Socket.IO funcione corretamente
  crossOriginOpenerPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    // SEMPRE permitir em produção para evitar problemas de CORS
    if (process.env.NODE_ENV === 'production') {
      console.log(`✅ CORS - Permitindo origem em produção: ${origin || 'sem origin'}`);
      return callback(null, true);
    }
    
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) {
      console.log('✅ CORS - Requisição sem origin permitida');
      return callback(null, true);
    }
    
    // Log para debug
    console.log(`🔍 CORS - Verificando origem: ${origin}`);
    
    // Verificar se está na lista permitida
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ CORS - Origem permitida: ${origin}`);
      return callback(null, true);
    }
    
    // Em desenvolvimento, permitir localhost e Vercel mesmo se não estiver na lista
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('vercel.app')) {
      console.log(`✅ CORS - Permitindo origem conhecida: ${origin}`);
      return callback(null, true);
    }
    
    // Em desenvolvimento, bloquear origens não permitidas
    console.warn(`⚠️ CORS - Origem bloqueada: ${origin}`);
    console.warn(`📋 Origens permitidas: ${allowedOrigins.join(', ')}`);
    return callback(new Error(`Origem ${origin} não permitida por CORS`), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting básico
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

// Middleware de logging (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Middleware para adicionar io ao request
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).io = io;
  next();
});

// Middleware específico para /api - garantir CORS antes de processar
app.use('/api', (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  
  // SEMPRE adicionar headers CORS para API REST (crítico para evitar erro de CORS com 502)
  if (process.env.NODE_ENV === 'production') {
    // Em produção, sempre permitir a origem da requisição
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  } else if (origin) {
    // Em desenvolvimento, verificar se está na lista ou é conhecida
    if (origin.includes('vercel.app') || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') ||
        allowedOrigins.indexOf(origin) !== -1) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // Mesmo em desenvolvimento, permitir para evitar erro de CORS
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  } else {
    // Sem origin, permitir qualquer origem
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  // Sempre adicionar todos os headers CORS necessários
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Authorization, Content-Range, X-Content-Range');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Para requisições OPTIONS (preflight), responder imediatamente
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Tratar requisições OPTIONS (preflight)
app.options('*', cors());

// Rotas
app.use('/api', routes);

// Rota de health check - SEMPRE responder mesmo se houver problemas
app.get('/health', (req: Request, res: Response) => {
  const origin = req.headers.origin;
  
  // SEMPRE adicionar headers CORS no health check (crítico para diagnóstico)
  const isVercelOrigin = origin && origin.includes('vercel.app');
  const isAllowedOrigin = !origin || allowedOrigins.indexOf(origin) !== -1;
  
  if (origin && (isAllowedOrigin || isVercelOrigin || process.env.NODE_ENV === 'production')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // Mesmo se não estiver na lista, adicionar header para evitar erro de CORS
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  try {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'Sistema Fiscal API',
      environment: process.env.NODE_ENV || 'development',
      socket: {
        connected: io.engine.clientsCount,
        ready: true
      },
      cors: {
        allowedOrigins: allowedOrigins,
        currentOrigin: origin || 'none'
      }
    });
  } catch (error) {
    // Mesmo em caso de erro, retornar algo
    res.status(200).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      message: 'Health check com erro, mas servidor está respondendo'
    });
  }
});

// Rota de health check específica para Socket.IO
// Útil para verificar se o Socket.IO está funcionando antes de tentar conectar
app.get('/socket.io/health', (req: Request, res: Response) => {
  const origin = req.headers.origin;
  
  // SEMPRE adicionar headers CORS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  res.json({
    status: 'ok',
    service: 'Socket.IO',
    timestamp: new Date().toISOString(),
    connected: io.engine.clientsCount,
    ready: true
  });
});

// Nota: Socket.IO gerencia suas próprias rotas em /socket.io/*
// Não é necessário criar rotas manuais para Socket.IO

// Rota 404 - Garantir headers CORS
app.use((req: Request, res: Response) => {
  const origin = req.headers.origin;
  
  // SEMPRE adicionar headers CORS mesmo em 404
  const isVercelOrigin = origin && origin.includes('vercel.app');
  const isAllowedOrigin = !origin || allowedOrigins.indexOf(origin) !== -1;
  
  if (origin && (isAllowedOrigin || isVercelOrigin || process.env.NODE_ENV === 'production')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // Mesmo se não estiver na lista, adicionar header para evitar erro de CORS
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Error handler - GARANTIR que headers CORS sejam adicionados mesmo em erros
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const origin = req.headers.origin;
  
  // SEMPRE adicionar headers CORS mesmo em caso de erro (crítico!)
  const isVercelOrigin = origin && origin.includes('vercel.app');
  const isAllowedOrigin = !origin || allowedOrigins.indexOf(origin) !== -1;
  
  if (origin && (isAllowedOrigin || isVercelOrigin || process.env.NODE_ENV === 'production')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // Mesmo se não estiver na lista, adicionar header para evitar erro de CORS
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  console.error('❌ Erro:', err);
  
  // Se for erro de CORS, retornar 403 com mensagem clara
  if (err.message && err.message.includes('CORS')) {
    res.status(403).json({ 
      erro: 'Acesso negado por CORS',
      mensagem: `Origem ${origin || 'desconhecida'} não está permitida`,
      origensPermitidas: allowedOrigins
    });
  } else {
    res.status(500).json({ 
      erro: 'Erro interno do servidor',
      mensagem: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// WebSocket - Gerenciar conexões
const usuariosConectados = new Map<string, { id: string; nome?: string }>();

// Tratamento de erros do Socket.IO com headers CORS
// CRÍTICO: Garantir que headers CORS sejam sempre enviados, mesmo em erros
io.engine.on('connection_error', (err) => {
  console.error('❌ Erro de conexão Socket.IO:', err);
  console.error('📋 Detalhes:', {
    req: err.req?.headers,
    code: err.code,
    message: err.message,
    context: err.context
  });
  
  // Garantir que headers CORS sejam adicionados mesmo em erros
  if (err.req && err.req.headers) {
    const origin = err.req.headers.origin as string | undefined;
    const res = err.req.res;
    
    if (res && !res.headersSent) {
      // SEMPRE adicionar headers CORS em produção
      if (process.env.NODE_ENV === 'production') {
        if (origin) {
          res.setHeader('Access-Control-Allow-Origin', origin);
        } else {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
      } else if (origin) {
        // Em desenvolvimento, permitir se for conhecida
        if (origin.includes('vercel.app') || 
            origin.includes('localhost') || 
            origin.includes('127.0.0.1') ||
            allowedOrigins.indexOf(origin) !== -1) {
          res.setHeader('Access-Control-Allow-Origin', origin);
        } else {
          // Mesmo assim, permitir para evitar erro de CORS
          res.setHeader('Access-Control-Allow-Origin', origin);
        }
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      
      // Sempre adicionar todos os headers CORS
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Authorization');
    }
  }
});

// Tratamento adicional para erros de upgrade (polling -> websocket)
io.engine.on('upgrade_error', (err) => {
  console.error('❌ Erro de upgrade Socket.IO:', err);
  
  // Garantir headers CORS mesmo em erro de upgrade
  if (err.req && err.req.headers) {
    const origin = err.req.headers.origin as string | undefined;
    const res = err.req.res;
    
    if (res && !res.headersSent) {
      if (process.env.NODE_ENV === 'production') {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
      } else if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }
});

io.on('connection', (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id}`);
  console.log(`📋 Transport: ${socket.conn.transport.name}`);
  console.log(`🌐 Origin: ${socket.handshake.headers.origin || 'N/A'}`);

  // Adicionar usuário
  usuariosConectados.set(socket.id, { id: socket.id });

  // Notificar outros usuários
  socket.broadcast.emit('user:connected', {
    userId: socket.id,
    timestamp: new Date().toISOString()
  });

  // Enviar lista de usuários conectados
  socket.emit('users:list', Array.from(usuariosConectados.values()));
  
  // Tratar erros de conexão
  socket.on('error', (error) => {
    console.error(`Erro no socket ${socket.id}:`, error);
  });

  // Registrar nome do usuário
  socket.on('user:register', (data: { nome: string }) => {
    const user = usuariosConectados.get(socket.id);
    if (user) {
      user.nome = data.nome;
      usuariosConectados.set(socket.id, user);
      io.emit('users:list', Array.from(usuariosConectados.values()));
    }
  });

  // Notificar edição em andamento
  socket.on('obrigacao:editing', (data: { obrigacaoId: string; usuario: string }) => {
    socket.broadcast.emit('obrigacao:being-edited', {
      obrigacaoId: data.obrigacaoId,
      usuario: data.usuario,
      userId: socket.id
    });
  });

  // Notificar fim de edição
  socket.on('obrigacao:stop-editing', (data: { obrigacaoId: string }) => {
    socket.broadcast.emit('obrigacao:editing-stopped', {
      obrigacaoId: data.obrigacaoId,
      userId: socket.id
    });
  });

  // Sincronizar mudanças em tempo real
  socket.on('obrigacao:change', (data: any) => {
    socket.broadcast.emit('obrigacao:changed', {
      ...data,
      userId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Desconexão
  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
    usuariosConectados.delete(socket.id);
    
    // Notificar outros usuários
    socket.broadcast.emit('user:disconnected', {
      userId: socket.id,
      timestamp: new Date().toISOString()
    });

    io.emit('users:list', Array.from(usuariosConectados.values()));
  });
});

// Inicializar banco de dados e servidor
async function iniciar() {
  try {
    // Inicializar banco
    await initializeDatabase();

    // Iniciar job de recorrência automática
    recorrenciaJob.iniciar();

    // Iniciar servidor
    httpServer.listen(PORT, () => {
      console.log('');
      console.log('🚀 ========================================');
      console.log('🚀 Sistema Fiscal - Backend');
      console.log('🚀 ========================================');
      console.log(`🚀 Servidor rodando na porta: ${PORT}`);
      console.log(`🚀 URL: http://localhost:${PORT}`);
      console.log(`🚀 Health: http://localhost:${PORT}/health`);
      console.log(`🚀 WebSocket: ws://localhost:${PORT}`);
      console.log(`🚀 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log('🚀 ========================================');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
async function shutdown() {
  console.log('🛑 Encerrando servidor...');
  recorrenciaJob.parar();
  httpServer.close(async () => {
    await closeDatabase();
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Iniciar
iniciar();

export { app, io };

