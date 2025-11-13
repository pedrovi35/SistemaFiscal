import React, { useState, useEffect } from 'react';
import { Command, X } from 'lucide-react';

interface Atalho {
  tecla: string;
  descricao: string;
  categoria: string;
}

const atalhos: Atalho[] = [
  { tecla: 'Cmd/Ctrl + K', descricao: 'Busca global', categoria: 'Navegação' },
  { tecla: 'Cmd/Ctrl + N', descricao: 'Nova obrigação', categoria: 'Ações' },
  { tecla: 'Cmd/Ctrl + B', descricao: 'Toggle sidebar (Expandir/Recolher)', categoria: 'Visualização' },
  { tecla: 'Cmd/Ctrl + /', descricao: 'Ver atalhos', categoria: 'Ajuda' },
  { tecla: 'Cmd/Ctrl + D', descricao: 'Toggle dark mode', categoria: 'Tema' },
  { tecla: 'Esc', descricao: 'Fechar modal/dialog', categoria: 'Navegação' },
  { tecla: '↑ ↓', descricao: 'Navegar listas', categoria: 'Navegação' },
  { tecla: 'Enter', descricao: 'Confirmar/Selecionar', categoria: 'Ações' },
  { tecla: 'Cmd/Ctrl + S', descricao: 'Salvar', categoria: 'Ações' },
  { tecla: 'Cmd/Ctrl + E', descricao: 'Exportar', categoria: 'Ações' },
];

const PainelAtalhos: React.FC = () => {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setAberto(true);
      }
      if (e.key === 'Escape' && aberto) {
        setAberto(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aberto]);

  if (!aberto) return null;

  const categorias = Array.from(new Set(atalhos.map(a => a.categoria)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
              <Command size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Atalhos de Teclado
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use estes atalhos para navegar mais rápido
              </p>
            </div>
          </div>
          <button
            onClick={() => setAberto(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all hover:scale-110 hover:rotate-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-6">
            {categorias.map(categoria => (
              <div key={categoria}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  {categoria}
                </h3>
                <div className="space-y-2">
                  {atalhos
                    .filter(a => a.categoria === categoria)
                    .map((atalho, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {atalho.descricao}
                        </span>
                        <div className="flex gap-1">
                          {(typeof atalho.tecla === 'string' ? atalho.tecla : String(atalho.tecla || ''))
                            .split(' + ')
                            .map((tecla, i) => (
                              <React.Fragment key={i}>
                                {i > 0 && <span className="text-gray-400 mx-1">+</span>}
                                <kbd className="px-3 py-1.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm">
                                  {tecla}
                                </kbd>
                              </React.Fragment>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Command size={14} />
            <span>Pressione</span>
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
              Cmd/Ctrl + /
            </kbd>
            <span>para abrir este painel a qualquer momento</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PainelAtalhos;

