import React from 'react';
import { Calendar, Plus, TrendingUp, Bell, Menu } from 'lucide-react';
import MenuDropdown from './MenuDropdown';

interface HeaderProps {
  onNovaObrigacao: () => void;
  onToggleSidebar?: () => void;
  onNavigate?: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onNovaObrigacao, onToggleSidebar, onNavigate }) => {

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo e Título */}
          <div className="flex items-center gap-4">
            {/* Menu Button - Mobile Only */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle menu"
              >
                <Menu size={24} className="text-gray-600 dark:text-gray-400" />
              </button>
            )}
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-50"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 sm:p-2 rounded-xl">
                <Calendar className="text-white" size={18} />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Sistema Fiscal
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 hidden md:block">
                Gestão Inteligente de Obrigações
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Stats Quick View */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-all">
              <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Em dia
              </span>
            </div>

            {/* Notifications */}
            <button
              className="relative p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hover:scale-110 group"
              title="Notificações"
            >
              <Bell size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></span>
            </button>

            {/* Nova Obrigação Button */}
            <button
              onClick={onNovaObrigacao}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <Plus size={20} className="relative z-10 group-hover:rotate-90 transition-transform duration-300" />
              <span className="hidden sm:inline relative z-10">Nova Obrigação</span>
            </button>

            {/* Menu Dropdown */}
            <MenuDropdown 
              onNovaObrigacao={onNovaObrigacao}
              onNavigate={onNavigate}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

