import React, { useState } from 'react';
import { Bell, X, Check, Trash2, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'sucesso' | 'aviso' | 'erro';
  lida: boolean;
  timestamp: Date;
}

interface CentroNotificacoesProps {
  notificacoes: Notificacao[];
  onMarcarLida: (id: string) => void;
  onRemover: (id: string) => void;
  onLimparTodas: () => void;
}

const CentroNotificacoes: React.FC<CentroNotificacoesProps> = ({
  notificacoes,
  onMarcarLida,
  onRemover,
  onLimparTodas
}) => {
  const [aberto, setAberto] = useState(false);
  const [filtro, setFiltro] = useState<'todas' | 'nao-lidas'>('todas');

  const naoLidas = notificacoes.filter(n => !n.lida).length;
  const notificacoesFiltradas = filtro === 'nao-lidas'
    ? notificacoes.filter(n => !n.lida)
    : notificacoes;

  const getIconeTipo = (tipo: Notificacao['tipo']) => {
    const classes = 'w-10 h-10 rounded-full flex items-center justify-center';
    switch (tipo) {
      case 'sucesso':
        return <div className={`${classes} bg-green-100 dark:bg-green-900/30`}>✓</div>;
      case 'erro':
        return <div className={`${classes} bg-red-100 dark:bg-red-900/30`}>✗</div>;
      case 'aviso':
        return <div className={`${classes} bg-yellow-100 dark:bg-yellow-900/30`}>⚠</div>;
      default:
        return <div className={`${classes} bg-blue-100 dark:bg-blue-900/30`}>ℹ</div>;
    }
  };

  return (
    <div className="relative">
      {/* Botão de Notificações */}
      <button
        onClick={() => setAberto(!aberto)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hover:scale-110"
        title="Notificações"
      >
        <Bell size={20} className="text-gray-600 dark:text-gray-400" />
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {aberto && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setAberto(false)}
          />

          {/* Painel */}
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 animate-scaleIn">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  Notificações
                </h3>
                <button
                  onClick={() => setAberto(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Filtros e Ações */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setFiltro('todas')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filtro === 'todas'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Todas ({notificacoes.length})
                  </button>
                  <button
                    onClick={() => setFiltro('nao-lidas')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filtro === 'nao-lidas'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Não lidas ({naoLidas})
                  </button>
                </div>
                {notificacoes.length > 0 && (
                  <button
                    onClick={onLimparTodas}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                  >
                    Limpar todas
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Notificações */}
            <div className="max-h-96 overflow-y-auto">
              {notificacoesFiltradas.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Bell size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-medium">Nenhuma notificação</p>
                  <p className="text-xs mt-2">Você está em dia! 🎉</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notificacoesFiltradas.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 transition-colors ${
                        !notif.lida
                          ? 'bg-blue-50 dark:bg-blue-900/10'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex gap-3">
                        {getIconeTipo(notif.tipo)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`font-semibold text-sm ${
                              !notif.lida
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notif.titulo}
                            </h4>
                            {!notif.lida && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {notif.mensagem}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {format(notif.timestamp, "dd MMM 'às' HH:mm", { locale: ptBR })}
                            </span>
                            <div className="flex gap-1">
                              {!notif.lida && (
                                <button
                                  onClick={() => onMarcarLida(notif.id)}
                                  className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                  title="Marcar como lida"
                                >
                                  <Check size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => onRemover(notif.id)}
                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                title="Remover"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CentroNotificacoes;

