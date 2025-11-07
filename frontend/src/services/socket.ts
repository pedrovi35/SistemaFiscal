import { io, Socket } from 'socket.io-client';
import { Obrigacao } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      // Força usar apenas polling para máxima compatibilidade com Vercel/Render
      transports: ['polling'],
      reconnection: true,
      reconnectionDelay: 5000,        // Tenta reconectar a cada 5s (aumentado para cold start)
      reconnectionDelayMax: 15000,    // Máximo de 15s entre tentativas
      reconnectionAttempts: Infinity, // Tenta reconectar indefinidamente
      timeout: 60000,                 // Timeout de 60s para conexão inicial (cold start do Render)
      autoConnect: true,
      forceNew: false,
      // Configurações adicionais para melhor estabilidade
      upgrade: false,                 // Não tentar upgrade para WebSocket
      rememberUpgrade: false,
      rejectUnauthorized: false       // Aceitar certificados auto-assinados em dev
    });

    this.socket.on('connect', () => {
      console.log('✅ Conectado ao servidor via Socket.IO (polling)');
      console.log(`🔗 Transport: ${this.socket?.io.engine.transport.name}`);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Desconectado do servidor Socket.IO');
      console.log(`📋 Motivo: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão Socket.IO:', error.message);
      
      // Se for erro 502, pode ser cold start do Render
      if (error.message.includes('502') || error.message.includes('Bad Gateway')) {
        console.log('⏳ Servidor está iniciando (cold start)... Aguarde até 60s');
      } else if (error.message.includes('CORS')) {
        console.error('🚫 Erro de CORS - Verifique as configurações do backend');
      }
      
      console.log('🔄 Tentando reconectar...');
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconectado após ${attemptNumber} tentativa(s)`);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Tentativa de reconexão #${attemptNumber}`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Erro ao reconectar:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Falha ao reconectar após múltiplas tentativas');
    });

    // Configurar listeners padrão
    this.setupDefaultListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupDefaultListeners() {
    if (!this.socket) return;

    // Obrigação criada
    this.socket.on('obrigacao:created', (obrigacao: Obrigacao) => {
      this.emit('obrigacao:created', obrigacao);
    });

    // Obrigação atualizada
    this.socket.on('obrigacao:updated', (obrigacao: Obrigacao) => {
      this.emit('obrigacao:updated', obrigacao);
    });

    // Obrigação deletada
    this.socket.on('obrigacao:deleted', (data: { id: string }) => {
      this.emit('obrigacao:deleted', data);
    });

    // Usuário conectado
    this.socket.on('user:connected', (data: any) => {
      this.emit('user:connected', data);
    });

    // Usuário desconectado
    this.socket.on('user:disconnected', (data: any) => {
      this.emit('user:disconnected', data);
    });

    // Lista de usuários
    this.socket.on('users:list', (users: any[]) => {
      this.emit('users:list', users);
    });

    // Obrigação sendo editada
    this.socket.on('obrigacao:being-edited', (data: any) => {
      this.emit('obrigacao:being-edited', data);
    });

    // Obrigação parou de ser editada
    this.socket.on('obrigacao:editing-stopped', (data: any) => {
      this.emit('obrigacao:editing-stopped', data);
    });

    // Mudança em obrigação
    this.socket.on('obrigacao:changed', (data: any) => {
      this.emit('obrigacao:changed', data);
    });
  }

  // Registrar usuário
  registerUser(nome: string) {
    if (this.socket) {
      this.socket.emit('user:register', { nome });
    }
  }

  // Notificar que está editando
  notifyEditing(obrigacaoId: string, usuario: string) {
    if (this.socket) {
      this.socket.emit('obrigacao:editing', { obrigacaoId, usuario });
    }
  }

  // Notificar que parou de editar
  notifyStopEditing(obrigacaoId: string) {
    if (this.socket) {
      this.socket.emit('obrigacao:stop-editing', { obrigacaoId });
    }
  }

  // Emitir mudança
  emitChange(data: any) {
    if (this.socket) {
      this.socket.emit('obrigacao:change', data);
    }
  }

  // Adicionar listener customizado
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Retornar função para remover listener
    return () => {
      this.off(event, callback);
    };
  }

  // Remover listener
  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  // Emitir evento local
  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Verificar se está conectado
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton
const socketService = new SocketService();

export default socketService;

