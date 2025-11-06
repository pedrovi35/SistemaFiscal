import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Calendar, FileText } from 'lucide-react';
import { Obrigacao } from '../types';

interface BuscaGlobalProps {
  obrigacoes: Obrigacao[];
  onSelect: (obrigacao: Obrigacao) => void;
}

const BuscaGlobal: React.FC<BuscaGlobalProps> = ({ obrigacoes, onSelect }) => {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<Obrigacao[]>([]);
  const [indiceAtivo, setIndiceAtivo] = useState(0);

  // Atalho Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setAberto(true);
      }
      if (e.key === 'Escape') {
        setAberto(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Buscar obrigações
  useEffect(() => {
    if (busca.trim() === '') {
      setResultados([]);
      return;
    }

    const termo = busca.toLowerCase();
    const filtrados = obrigacoes.filter(o => 
      (o.titulo || '').toLowerCase().includes(termo) ||
      (o.descricao || '').toLowerCase().includes(termo) ||
      (o.cliente || '').toLowerCase().includes(termo) ||
      (o.empresa || '').toLowerCase().includes(termo) ||
      (o.responsavel || '').toLowerCase().includes(termo)
    );

    setResultados(filtrados.slice(0, 8)); // Limitar a 8 resultados
    setIndiceAtivo(0);
  }, [busca, obrigacoes]);

  // Navegação com teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceAtivo(prev => Math.min(prev + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceAtivo(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && resultados[indiceAtivo]) {
      handleSelect(resultados[indiceAtivo]);
    }
  }, [resultados, indiceAtivo]);

  const handleSelect = (obrigacao: Obrigacao) => {
    onSelect(obrigacao);
    setAberto(false);
    setBusca('');
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl animate-scaleIn">
        {/* Input de Busca */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar obrigações... (Cmd+K)"
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-lg"
            autoFocus
          />
          <button
            onClick={() => setAberto(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Resultados */}
        <div className="max-h-96 overflow-y-auto p-2">
          {busca === '' ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">Digite para buscar obrigações</p>
              <p className="text-xs mt-2">Busque por título, cliente, empresa ou responsável</p>
            </div>
          ) : resultados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">Nenhuma obrigação encontrada</p>
              <p className="text-xs mt-2">Tente buscar por outro termo</p>
            </div>
          ) : (
            <div className="space-y-1">
              {resultados.map((obrigacao, index) => (
                <button
                  key={obrigacao.id}
                  onClick={() => handleSelect(obrigacao)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    index === indiceAtivo
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate mb-1">
                        {obrigacao.titulo}
                      </h4>
                      {obrigacao.descricao && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                          {obrigacao.descricao}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(obrigacao.dataVencimento).toLocaleDateString('pt-BR')}
                        </span>
                        {obrigacao.cliente && (
                          <span className="truncate">👤 {obrigacao.cliente}</span>
                        )}
                        {obrigacao.empresa && (
                          <span className="truncate">🏢 {obrigacao.empresa}</span>
                        )}
                    </div>
                  </div>
                  <span className={`badge badge-${obrigacao.tipo ? obrigacao.tipo.toLowerCase() : 'outro'} shrink-0`}>
                    {obrigacao.tipo || 'OUTRO'}
                  </span>
                </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer com Dicas */}
        <div className="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">↑</kbd>
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">↓</kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">Enter</kbd>
              Selecionar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">Esc</kbd>
              Fechar
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {resultados.length} resultado{resultados.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BuscaGlobal;

