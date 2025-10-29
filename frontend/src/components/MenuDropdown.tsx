import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Users,
  Settings,
  LogOut,
  Bell,
  FileText,
  BarChart3,
  Download,
  Upload,
  HelpCircle,
  Moon,
  Sun,
  Search,
  Home,
  Calendar,
  ChevronDown,
  ExternalLink,
  BookOpen,
  MessageSquare,
  CreditCard,
  Shield,
  Archive,
  X
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  onClick?: () => void;
  divider?: boolean;
  badge?: string | number;
  color?: string;
  disabled?: boolean;
  submenu?: MenuItem[];
}

interface MenuDropdownProps {
  onNovaObrigacao: () => void;
  onNavigate?: (tab: string) => void;
}

const MenuDropdown: React.FC<MenuDropdownProps> = ({ onNovaObrigacao, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveSubmenu(null);
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      shortcut: 'Ctrl+D',
      onClick: () => {
        onNavigate?.('dashboard');
        setIsOpen(false);
      },
      color: 'text-blue-600'
    },
    {
      id: 'calendario',
      label: 'Calendário',
      icon: Calendar,
      shortcut: 'Ctrl+C',
      onClick: () => {
        onNavigate?.('calendario');
        setIsOpen(false);
      },
      color: 'text-purple-600'
    },
    {
      id: 'nova-obrigacao',
      label: 'Nova Obrigação',
      icon: FileText,
      shortcut: 'Ctrl+N',
      onClick: () => {
        onNovaObrigacao();
        setIsOpen(false);
      },
      color: 'text-green-600'
    },
    {
      id: 'obrigacoes',
      label: 'Obrigações',
      icon: FileText,
      onClick: () => {
        onNavigate?.('obrigacoes');
        setIsOpen(false);
      },
      color: 'text-green-600'
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: Users,
      onClick: () => {
        onNavigate?.('clientes');
        setIsOpen(false);
      },
      color: 'text-teal-600'
    },
    {
      id: 'impostos',
      label: 'Impostos',
      icon: FileText,
      onClick: () => {
        onNavigate?.('impostos');
        setIsOpen(false);
      },
      color: 'text-indigo-600'
    },
    {
      id: 'parcelamentos',
      label: 'Parcelamentos',
      icon: Archive,
      onClick: () => {
        onNavigate?.('parcelamentos');
        setIsOpen(false);
      },
      color: 'text-gray-600'
    },
    { id: 'divider1', label: '', icon: X, divider: true },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: BarChart3,
      onClick: () => {
        onNavigate?.('relatorios');
        setIsOpen(false);
      },
      color: 'text-indigo-600',
      submenu: [
        {
          id: 'relatorio-mensal',
          label: 'Relatório Mensal',
          icon: FileText,
          onClick: () => {
            onNavigate?.('relatorios');
            setIsOpen(false);
          }
        },
        {
          id: 'relatorio-anual',
          label: 'Relatório Anual',
          icon: BarChart3,
          onClick: () => {
            onNavigate?.('relatorios');
            setIsOpen(false);
          }
        }
      ]
    },
    {
      id: 'exportar',
      label: 'Exportar',
      icon: Download,
      color: 'text-blue-600',
      submenu: [
        {
          id: 'export-pdf',
          label: 'Exportar PDF',
          icon: FileText,
          onClick: () => {
            alert('Exportação PDF em desenvolvimento');
            setIsOpen(false);
          }
        },
        {
          id: 'export-excel',
          label: 'Exportar CSV/Excel',
          icon: Download,
          onClick: () => {
            alert('Use a ferramenta Exportar da sidebar para CSV/Excel');
            setIsOpen(false);
          }
        }
      ]
    },
    {
      id: 'importar',
      label: 'Importar',
      icon: Upload,
      color: 'text-green-600',
      onClick: () => {
        alert('Use a ferramenta Importar da sidebar');
        setIsOpen(false);
      }
    },
    { id: 'divider2', label: '', icon: X, divider: true },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
      shortcut: 'Ctrl+,',
      onClick: () => {
        const event = new KeyboardEvent('keydown', {
          key: ',',
          ctrlKey: true,
          bubbles: true
        });
        window.dispatchEvent(event);
        setIsOpen(false);
      },
      color: 'text-gray-600'
    },
    {
      id: 'perfil',
      label: 'Meu Perfil',
      icon: User,
      onClick: () => {
        const nome = prompt('Digite seu nome:') || 'Usuário';
        alert(`✓ Perfil atualizado! Bem-vindo, ${nome}!`);
        setIsOpen(false);
      },
      color: 'text-blue-600'
    },
    {
      id: 'tema',
      label: theme === 'dark' ? 'Modo Claro' : 'Modo Escuro',
      icon: theme === 'dark' ? Sun : Moon,
      onClick: () => {
        toggleTheme();
        setIsOpen(false);
      },
      color: 'text-yellow-600'
    },
    { id: 'divider3', label: '', icon: X, divider: true },
    {
      id: 'ajuda',
      label: 'Ajuda e Suporte',
      icon: HelpCircle,
      shortcut: 'Ctrl+/',
      onClick: () => {
        const event = new KeyboardEvent('keydown', {
          key: '/',
          ctrlKey: true,
          bubbles: true
        });
        window.dispatchEvent(event);
        setIsOpen(false);
      },
      color: 'text-purple-600'
    },
    {
      id: 'documentacao',
      label: 'Documentação',
      icon: BookOpen,
      onClick: () => {
        alert('Documentação em breve!');
        setIsOpen(false);
      },
      color: 'text-teal-600'
    },
    {
      id: 'sair',
      label: 'Sair',
      icon: LogOut,
      onClick: () => {
        if (confirm('Tem certeza que deseja sair?')) {
          alert('Logout em breve!');
          setIsOpen(false);
        }
      },
      color: 'text-red-600'
    }
  ];

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;

    if (item.submenu) {
      setActiveSubmenu(activeSubmenu === item.id ? null : item.id);
    } else if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-3 py-2 rounded-lg
          bg-gradient-to-r from-blue-600 to-purple-600
          text-white font-medium
          hover:from-blue-700 hover:to-purple-700
          active:scale-95
          transition-all duration-200
          shadow-lg hover:shadow-xl
          relative overflow-hidden
          group
        "
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        <div className="relative flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <span className="hidden sm:inline">Menu</span>
          <ChevronDown
            size={16}
            className={`text-white transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute right-0 top-full mt-2 w-72
            bg-white dark:bg-gray-800
            rounded-xl shadow-2xl
            border border-gray-200 dark:border-gray-700
            overflow-hidden
            z-50
            animate-slideDown
            backdrop-blur-sm
          "
          style={{
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* Header do Menu */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <p className="font-semibold">Sistema Fiscal</p>
                <p className="text-xs text-white/80">Menu de Navegação</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="max-h-[500px] overflow-y-auto scrollbar-thin p-2">
            {menuItems.map((item) => {
              if (item.divider) {
                return (
                  <div
                    key={item.id}
                    className="my-2 h-px bg-gray-200 dark:bg-gray-700"
                  />
                );
              }

              const Icon = item.icon;
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isSubmenuOpen = activeSubmenu === item.id;

              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => handleItemClick(item)}
                    disabled={item.disabled}
                    className={`
                      w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200 group
                      ${item.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                      }
                      ${isSubmenuOpen ? 'bg-gray-100 dark:bg-gray-700' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Icon
                        size={18}
                        className={`
                          ${item.color || 'text-gray-600 dark:text-gray-400'}
                          flex-shrink-0
                          group-hover:scale-110 transition-transform
                        `}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-left flex-1">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.badge && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                          {item.badge}
                        </span>
                      )}
                      {item.shortcut && (
                        <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded border border-gray-300 dark:border-gray-600">
                          {item.shortcut.replace('Ctrl+', '⌃')}
                        </kbd>
                      )}
                      {hasSubmenu && (
                        <ChevronDown
                          size={14}
                          className={`
                            text-gray-400 transition-transform duration-200
                            ${isSubmenuOpen ? 'rotate-180' : ''}
                          `}
                        />
                      )}
                    </div>
                  </button>

                  {/* Submenu */}
                  {hasSubmenu && isSubmenuOpen && (
                    <div
                      className="
                        mt-1 ml-4 space-y-1
                        border-l-2 border-gray-200 dark:border-gray-700 pl-2
                        animate-fadeIn
                      "
                    >
                      {item.submenu!.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <button
                            key={subItem.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (subItem.onClick) {
                                subItem.onClick();
                              }
                            }}
                            className="
                              w-full flex items-center gap-3 px-3 py-2 rounded-lg
                              text-sm text-gray-600 dark:text-gray-400
                              hover:bg-gray-50 dark:hover:bg-gray-800
                              hover:text-gray-900 dark:hover:text-gray-200
                              transition-all duration-200
                            "
                          >
                            <SubIcon size={16} className="flex-shrink-0" />
                            <span className="text-left">{subItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer do Menu */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Pressione <kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 border rounded">Esc</kbd> para fechar
            </p>
          </div>
        </div>
      )}

      {/* Backdrop (para mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default MenuDropdown;

