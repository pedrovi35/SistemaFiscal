import React from 'react';
import { X, Calendar, Edit, Trash2 } from 'lucide-react';
import { Obrigacao, StatusObrigacao } from '../types';

interface ObrigacoesDoDiaProps {
  data: string;
  obrigacoes: Obrigacao[];
  onClose: () => void;
  onEditar: (obrigacao: Obrigacao) => void;
  onDeletar: (id: string) => void;
  onCriarNova: () => void;
}

const ObrigacoesDoDia: React.FC<ObrigacoesDoDiaProps> = ({
  data,
  obrigacoes,
  onClose,
  onEditar,
  onDeletar,
  onCriarNova
}) => {
  const dataFormatada = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getStatusIcon = (status: StatusObrigacao) => {
    switch (status) {
      case StatusObrigacao.CONCLUIDA:
        return '✅';
      case StatusObrigacao.EM_ANDAMENTO:
        return '🔄';
      case StatusObrigacao.ATRASADA:
        return '⚠️';
      case StatusObrigacao.CANCELADA:
        return '❌';
      default:
        return '📋';
    }
  };

  const getStatusColor = (status: StatusObrigacao) => {
    switch (status) {
      case StatusObrigacao.CONCLUIDA:
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case StatusObrigacao.EM_ANDAMENTO:
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case StatusObrigacao.ATRASADA:
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case StatusObrigacao.CANCELADA:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              📅 {dataFormatada}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {obrigacoes.length === 0 
                ? 'Nenhuma obrigação neste dia' 
                : `${obrigacoes.length} obrigação${obrigacoes.length > 1 ? 'ões' : ''}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-700 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:scale-110"
            title="Fechar (ESC)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de Obrigações */}
        <div className="overflow-y-auto flex-1 p-6 space-y-3 custom-scrollbar">
          {obrigacoes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Não há obrigações agendadas para este dia
              </p>
              <button
                onClick={onCriarNova}
                className="btn-primary px-6 py-3"
              >
                ✨ Criar Obrigação Neste Dia
              </button>
            </div>
          ) : (
            <>
              {obrigacoes.map((obrigacao) => (
                <div
                  key={obrigacao.id}
                  className={`border rounded-lg p-4 transition-all hover:shadow-md ${getStatusColor(obrigacao.status)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{getStatusIcon(obrigacao.status)}</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {obrigacao.titulo}
                        </h3>
                        {obrigacao.recorrencia && obrigacao.recorrencia.ativo !== false && (
                          <span 
                            className="text-xs bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-full flex items-center gap-1"
                            title="Recorrência automática ativa"
                          >
                            🔄 Recorrente
                          </span>
                        )}
                      </div>
                      
                      {obrigacao.descricao && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {obrigacao.descricao}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {obrigacao.cliente && (
                          <span className="flex items-center gap-1">
                            👤 {obrigacao.cliente}
                          </span>
                        )}
                        {obrigacao.empresa && (
                          <span className="flex items-center gap-1">
                            🏢 {obrigacao.empresa}
                          </span>
                        )}
                        {obrigacao.responsavel && (
                          <span className="flex items-center gap-1">
                            👔 {obrigacao.responsavel}
                          </span>
                        )}
                        <span className={`badge badge-${obrigacao.tipo.toLowerCase()}`}>
                          {obrigacao.tipo}
                        </span>
                      </div>

                      {/* Informações de Ajuste */}
                      {obrigacao.ajusteDataUtil && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="text-blue-600 dark:text-blue-400">
                            {obrigacao.preferenciaAjuste === 'proximo' ? '⏩' : '⏪'}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            Ajuste para {obrigacao.preferenciaAjuste === 'proximo' ? 'próximo' : 'anterior'} dia útil
                          </span>
                        </div>
                      )}

                      {/* Informações de Recorrência */}
                      {obrigacao.recorrencia && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                            🔄 Recorrência Configurada:
                          </p>
                          <div className="text-xs text-blue-600 dark:text-blue-400 space-y-0.5">
                            <p>• Periodicidade: <strong>{obrigacao.recorrencia.tipo}</strong></p>
                            {obrigacao.recorrencia.diaDoMes && (
                              <p>• Dia fixo de vencimento: <strong>Dia {obrigacao.recorrencia.diaDoMes}</strong></p>
                            )}
                            {obrigacao.recorrencia.diaGeracao && (
                              <p>• Geração automática: <strong>Dia {obrigacao.recorrencia.diaGeracao} de cada mês</strong></p>
                            )}
                            <p>• Status: <strong>{obrigacao.recorrencia.ativo !== false ? '✅ Ativa' : '⏸️ Pausada'}</strong></p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onEditar(obrigacao)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir "${obrigacao.titulo}"?`)) {
                            onDeletar(obrigacao.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {obrigacoes.length > 0 && (
          <div className="flex justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
            <button
              onClick={onCriarNova}
              className="btn-primary px-6 py-2.5"
            >
              ✨ Criar Nova Obrigação Neste Dia
            </button>
            <button
              onClick={onClose}
              className="btn-secondary px-6 py-2.5"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ObrigacoesDoDia;

