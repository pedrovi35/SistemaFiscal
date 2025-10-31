import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export interface Notificacao {
  id: string;
  tipo: 'sucesso' | 'erro' | 'info' | 'aviso';
  mensagem: string;
  timestamp: Date;
}

interface NotificacaoRealTimeProps {
  notificacoes: Notificacao[];
  onRemover: (id: string) => void;
}

const NotificacaoRealTime: React.FC<NotificacaoRealTimeProps> = ({ 
  notificacoes, 
  onRemover 
}) => {
  // Auto remover notificações após 5 segundos
  useEffect(() => {
    notificacoes.forEach(notif => {
      const timer = setTimeout(() => {
        onRemover(notif.id);
      }, 5000);

      return () => clearTimeout(timer);
    });
  }, [notificacoes, onRemover]);

  const getIcon = (tipo: Notificacao['tipo']) => {
    switch (tipo) {
      case 'sucesso':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'erro':
        return <XCircle className="text-red-500" size={20} />;
      case 'aviso':
        return <AlertCircle className="text-yellow-500" size={20} />;
      default:
        return <AlertCircle className="text-blue-500" size={20} />;
    }
  };

  const getEstilo = (tipo: Notificacao['tipo']) => {
    switch (tipo) {
      case 'sucesso':
        return 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 shadow-lg';
      case 'erro':
        return 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 shadow-lg';
      case 'aviso':
        return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 shadow-lg';
      default:
        return 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-lg';
    }
  };

  if (notificacoes.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-md">
      {notificacoes.map((notif, index) => (
        <div
          key={notif.id}
          className={`${getEstilo(notif.tipo)} border-2 rounded-xl backdrop-blur-sm p-4 flex items-start gap-3 animate-slideInRight`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {getIcon(notif.tipo)}
          <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{notif.mensagem}</p>
          <button
            onClick={() => onRemover(notif.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all hover:scale-110 hover:rotate-90"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificacaoRealTime;

