import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import routes from './routes';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
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

// Middleware para adicionar io ao request
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).io = io;
  next();
});

// Rotas
app.use('/api', routes);

// Rota de health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Sistema Fiscal API'
  });
});

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

io.on('connection', (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id}`);

  // Adicionar usuário
  usuariosConectados.set(socket.id, { id: socket.id });

  // Notificar outros usuários
  socket.broadcast.emit('user:connected', {
    userId: socket.id,
    timestamp: new Date().toISOString()
  });

  // Enviar lista de usuários conectados
  socket.emit('users:list', Array.from(usuariosConectados.values()));

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
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido. Encerrando servidor...');
  httpServer.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
});

// Iniciar
iniciar();

export { app, io };

