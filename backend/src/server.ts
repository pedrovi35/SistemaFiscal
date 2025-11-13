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
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
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
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  // Configurações para melhor compatibilidade com Render
  pingTimeout: 60000,      // 60s antes de considerar desconectado
  pingInterval: 25000,     // Envia ping a cada 25s
  upgradeTimeout: 30000,   // 30s para upgrade de transporte
  maxHttpBufferSize: 1e6,  // 1MB de buffer
  allowUpgrades: true,     // Permitir upgrade de polling para websocket
  perMessageDeflate: false, // Desabilitar compressão para melhor performance
  // Configurações adicionais para evitar problemas de CORS
  connectTimeout: 60000,   // 60s para timeout de conexão
  serveClient: false       // Não servir o cliente Socket.IO
});

const PORT = process.env.PORT || 3001;

// Middleware de CORS manual para garantir headers em todas as respostas
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

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Desabilitar alguns recursos do Helmet que podem interferir com Socket.IO
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) {
      console.log('✅ CORS - Requisição sem origin permitida');
      return callback(null, true);
    }
    
    // Log para debug
    console.log(`🔍 CORS - Verificando origem: ${origin}`);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ CORS - Origem permitida: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS - Origem bloqueada: ${origin}`);
      console.warn(`📋 Origens permitidas: ${allowedOrigins.join(', ')}`);
      callback(new Error(`Origem ${origin} não permitida por CORS`), false);
    }
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

// Tratar requisições OPTIONS (preflight)
app.options('*', cors());

// Rotas
app.use('/api', routes);

// Rota de health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Sistema Fiscal API',
    socket: {
      connected: io.engine.clientsCount,
      ready: true
    }
  });
});

// Nota: Socket.IO gerencia suas próprias rotas em /socket.io/*
// Não é necessário criar rotas manuais para Socket.IO

// Rota 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Erro:', err);
  res.status(500).json({ 
    erro: 'Erro interno do servidor',
    mensagem: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// WebSocket - Gerenciar conexões
const usuariosConectados = new Map<string, { id: string; nome?: string }>();

// Tratamento de erros do Socket.IO
io.engine.on('connection_error', (err) => {
  console.error('❌ Erro de conexão Socket.IO:', err);
  console.error('📋 Detalhes:', {
    req: err.req?.headers,
    code: err.code,
    message: err.message,
    context: err.context
  });
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

