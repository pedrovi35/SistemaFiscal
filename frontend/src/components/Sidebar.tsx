import React, { useState } from 'react';
import {
  Calendar,
  FileText,
  BarChart3,
  Download,
  Upload,
  Search,
  BookOpen,
  Calculator,
  Users,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  TrendingUp,
  Archive,
  Info
} from 'lucide-react';

interface SidebarProps {
  onNavigate: (tab: string) => void;
  activeTab: string;
  onToggleSidebar: () => void;
  isCollapsed: boolean;
  stats?: {
    total: number;
    pendentes: number;
    concluidas: number;
    atrasadas: number;
  };
  onAbrirCalculadora?: () => void;
  onAbrirExportar?: () => void;
  onAbrirImportar?: () => void;
  onAbrirDocumentacao?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  color?: string;
}

interface ToolItem {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  onClick: () => void;
  color?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  onNavigate,
  activeTab,
  onToggleSidebar,
  isCollapsed,
  stats,
  onAbrirCalculadora,
  onAbrirExportar,
  onAbrirImportar,
  onAbrirDocumentacao
}) => {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'text-blue-600' },
    { id: 'calendario', label: 'Calendário', icon: Calendar, color: 'text-purple-600' },
    { id: 'obrigacoes', label: 'Obrigações', icon: FileText, color: 'text-green-600', badge: stats?.total },
    { id: 'clientes', label: 'Clientes', icon: Users, color: 'text-teal-600' },
    { id: 'impostos', label: 'Impostos', icon: BarChart3, color: 'text-indigo-600' },
    { id: 'parcelamentos', label: 'Parcelamentos', icon: Archive, color: 'text-gray-600' },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3, color: 'text-indigo-600' }
  ];

  const toolItems: ToolItem[] = [
    {
      id: 'calculadora',
      label: 'Calculadora Fiscal',
      icon: Calculator,
      description: 'Calcule prazos e multas fiscais',
      onClick: () => {
        if (onAbrirCalculadora) {
          onAbrirCalculadora();
        } else {
          alert('Calculadora Fiscal em breve!');
        }
      },
      color: 'text-blue-600'
    },
    {
      id: 'exportar',
      label: 'Exportar Dados',
      icon: Download,
      description: 'Exporte obrigações em PDF/Excel',
      onClick: () => {
        if (onAbrirExportar) {
          onAbrirExportar();
        } else {
          alert('Funcionalidade de exportação em breve!');
        }
      },
      color: 'text-green-600'
    },
    {
      id: 'importar',
      label: 'Importar Dados',
      icon: Upload,
      description: 'Importe obrigações de arquivos',
      onClick: () => {
        if (onAbrirImportar) {
          onAbrirImportar();
        } else {
          alert('Funcionalidade de importação em breve!');
        }
      },
      color: 'text-purple-600'
    },
    {
      id: 'busca_rapida',
      label: 'Busca Rápida',
      icon: Search,
      description: 'Busque obrigações rapidamente',
      onClick: () => {
        // Disparar busca global
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
          bubbles: true
        });
        window.dispatchEvent(event);
      },
      color: 'text-pink-600'
    },
    {
      id: 'documentacao',
      label: 'Documentação',
      icon: BookOpen,
      description: 'Guia de uso do sistema',
      onClick: () => {
        if (onAbrirDocumentacao) {
          onAbrirDocumentacao();
        } else {
          window.open('https://github.com', '_blank');
        }
      },
      color: 'text-teal-600'
    }
  ];

  const quickStats = [
    {
      label: 'Concluídas',
      value: stats?.concluidas || 0,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: 'Taxa',
      value: stats?.total ? `${Math.round(((stats.concluidas || 0) / stats.total) * 100)}%` : '0%',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    }
  ];

  return (
    <aside
      className={`
        fixed left-0 top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] z-30
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64 sm:w-72'}
        overflow-hidden flex flex-col
        shadow-lg
        ${isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0'}
      `}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggleSidebar}
        className={`
          absolute -right-3 top-8 z-30
          w-6 h-6 rounded-full
          bg-white dark:bg-gray-800
          border-2 border-gray-300 dark:border-gray-600
          flex items-center justify-center
          hover:bg-gray-100 dark:hover:bg-gray-700
          transition-all duration-200
          shadow-md hover:shadow-lg
          ${isCollapsed ? 'rotate-180' : ''}
        `}
        aria-label={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight size={14} className="text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronLeft size={14} className="text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {/* Logo/Minimal Header */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-50"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Calendar className="text-white" size={20} />
                </div>
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Menu</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Navegação</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-2">
          <div className={isCollapsed ? 'space-y-1' : 'space-y-1 mb-4'}>
            {!isCollapsed && (
              <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Navegação
              </p>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-300 group relative overflow-hidden
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-[1.02]'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-[1.02]'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                    active:scale-[0.98]
                  `}
                  title={isCollapsed ? item.label : ''}
                >
                  {/* Ripple Effect */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-purple-600/10 transition-all duration-300"></div>
                  )}
                  
                  {/* Active Indicator */}
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full animate-fadeIn"></div>
                  )}
                  
                  <Icon
                    size={20}
                    className={`
                      ${isActive ? 'text-white' : item.color || 'text-gray-600 dark:text-gray-400'}
                      flex-shrink-0 relative z-10
                      ${isActive ? 'animate-pulse' : 'group-hover:scale-110 group-hover:rotate-3'}
                      transition-transform duration-300
                    `}
                  />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left font-medium relative z-10">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className={`
                            px-2 py-0.5 rounded-full text-xs font-bold relative z-10
                            transition-all duration-300
                            ${isActive
                              ? 'bg-white/20 text-white animate-bounce'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
                            }
                          `}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Quick Stats */}
        {!isCollapsed && stats && (
          <div className="mx-2 mb-4 p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-gray-600 dark:text-gray-400" />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Resumo Rápido</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickStats.map((stat, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg ${stat.bg} text-center`}
                >
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools Section */}
        <div className="px-2 mb-4">
          {!isCollapsed && (
            <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Ferramentas
            </p>
          )}
          <div className="space-y-1">
            {toolItems.map((tool) => {
              const Icon = tool.icon;
              const isExpanded = expandedTool === tool.id && !isCollapsed;

              return (
                <div key={tool.id}>
                  <button
                    onClick={() => {
                      if (isCollapsed) {
                        tool.onClick();
                      } else {
                        setExpandedTool(isExpanded ? null : tool.id);
                        tool.onClick();
                      }
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-300 group relative overflow-hidden
                      text-gray-700 dark:text-gray-300
                      hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-[1.02]
                      ${isCollapsed ? 'justify-center' : ''}
                      active:scale-[0.98]
                    `}
                    title={isCollapsed ? tool.label : ''}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-purple-600/10 transition-all duration-300"></div>
                    
                    <Icon
                      size={20}
                      className={`
                        ${tool.color || 'text-gray-600 dark:text-gray-400'}
                        flex-shrink-0 relative z-10
                        group-hover:scale-110 group-hover:rotate-3
                        transition-transform duration-300
                      `}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left font-medium text-sm relative z-10">{tool.label}</span>
                        <Info 
                          size={14} 
                          className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors relative z-10"
                        />
                      </>
                    )}
                  </button>
                  {isExpanded && (
                    <div className="mt-1 ml-11 mr-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-fadeIn">
                      <p className="text-xs text-gray-600 dark:text-gray-400">{tool.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Help & Support */}
        {!isCollapsed && (
          <div className="px-2 mb-2">
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', {
                  key: '/',
                  ctrlKey: true,
                  bubbles: true
                });
                window.dispatchEvent(event);
              }}
              className="
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                bg-gradient-to-r from-purple-50 to-pink-50
                dark:from-purple-900/20 dark:to-pink-900/20
                border border-purple-200 dark:border-purple-800
                text-purple-700 dark:text-purple-300
                hover:from-purple-100 hover:to-pink-100
                dark:hover:from-purple-900/30 dark:hover:to-pink-900/30
                transition-all duration-300
                group relative overflow-hidden
                hover:scale-[1.02] shadow-sm hover:shadow-md
                active:scale-[0.98]
              "
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 transition-all duration-300"></div>
              <HelpCircle 
                size={20} 
                className="text-purple-600 dark:text-purple-400 relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" 
              />
              <span className="flex-1 text-left font-medium text-sm relative z-10">Ajuda & Atalhos</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Info size={14} />
            <span>Pressione <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">B</kbd> para toggle</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

