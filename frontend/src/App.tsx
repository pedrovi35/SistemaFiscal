import { useEffect, useState } from 'react';
import { Calendar, FileText, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CalendarioFiscal from './components/CalendarioFiscal';
import ListaObrigacoes from './components/ListaObrigacoes';
import Clientes, { Cliente } from './components/Clientes';
import Impostos from './components/Impostos';
import Parcelamentos from './components/Parcelamentos';
import ObrigacaoModal from './components/ObrigacaoModal';
import CalculadoraFiscal from './components/CalculadoraFiscal';
import Relatorios from './components/Relatorios';
import ExportarDados from './components/ExportarDados';
import ImportarDados from './components/ImportarDados';
import Configuracoes from './components/Configuracoes';
import NotificacaoRealTime, { Notificacao } from './components/NotificacaoRealTime';
import StatsCard from './components/StatsCard';
import LoadingSpinner from './components/LoadingSpinner';
import BuscaGlobal from './components/BuscaGlobal';
import PainelAtalhos from './components/PainelAtalhos';
import { obrigacoesApi } from './services/api';
import socketService from './services/socket';
import { Obrigacao, FiltroObrigacoes, StatusObrigacao } from './types';
import { v4 as uuidv4 } from 'uuid';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const mockClientes: Cliente[] = [
	{ id: '1', nome: 'ACME Ltda', cnpj: '12.345.678/0001-90', email: 'contato@acme.com', telefone: '(11) 3333-4444', ativo: true },
	{ id: '2', nome: 'Beta Serviços', cnpj: '98.765.432/0001-10', email: 'beta@servicos.com', telefone: '(21) 9999-0000', ativo: true },
	{ id: '3', nome: 'Gamma Holding', cnpj: '55.444.333/0001-22', email: 'financeiro@gamma.com', telefone: '(31) 2222-3333', ativo: false },
];

function AppContent() {
  interface NotificacaoCentro {
    id: string;
    titulo: string;
    mensagem: string;
    tipo: 'info' | 'sucesso' | 'aviso' | 'erro';
    lida: boolean;
    timestamp: Date;
  }
  const [obrigacoes, setObrigacoes] = useState<Obrigacao[]>([]);
  const [obrigacoesFiltradas, setObrigacoesFiltradas] = useState<Obrigacao[]>([]);
  const [clientes] = useState<Cliente[]>(mockClientes);
  const [filtros, setFiltros] = useState<FiltroObrigacoes>({});
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [obrigacaoSelecionada, setObrigacaoSelecionada] = useState<Obrigacao | undefined>();
  const [dataInicial, setDataInicial] = useState<string>('');
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [notificacoesCentro, setNotificacoesCentro] = useState<NotificacaoCentro[]>([]);
  const [notificacoesCentroIgnoradas, setNotificacoesCentroIgnoradas] = useState<Set<string>>(new Set());
  const [calculadoraAberta, setCalculadoraAberta] = useState(false);
  const [exportarAberto, setExportarAberto] = useState(false);
  const [importarAberto, setImportarAberto] = useState(false);
  const [configuracoesAberto, setConfiguracoesAberto] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Verificar se é mobile (largura menor que 1024px)
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  // Atalhos de teclado
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrl: true,
      callback: () => abrirModalCriar()
    },
    {
      key: 'd',
      ctrl: true,
      callback: () => {
        // Toggle dark mode (será implementado no ThemeContext)
      }
    },
    {
      key: 'b',
      ctrl: true,
      callback: () => setSidebarCollapsed(!sidebarCollapsed)
    },
    {
      key: ',',
      ctrl: true,
      callback: () => setConfiguracoesAberto(true)
    }
  ]);

  // Função para navegar entre abas
  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    // Limpa filtros ao trocar de seção principal
    if (['calendario', 'dashboard', 'obrigacoes', 'clientes', 'impostos', 'parcelamentos', 'relatorios'].includes(tab)) {
      setFiltros({});
    }
  };

  // Carregar obrigações
  const carregarObrigacoes = async () => {
    try {
      setLoading(true);
      const dados = await obrigacoesApi.listarTodas();
      setObrigacoes(dados);
      setObrigacoesFiltradas(dados);
    } catch (error) {
      console.error('Erro ao carregar obrigações:', error);
      adicionarNotificacao('erro', 'Erro ao carregar obrigações');
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = async () => {
    try {
      if (Object.keys(filtros).length === 0) {
        setObrigacoesFiltradas(obrigacoes);
        return;
      }

      const dados = await obrigacoesApi.filtrar(filtros);
      setObrigacoesFiltradas(dados);
    } catch (error) {
      console.error('Erro ao filtrar:', error);
      adicionarNotificacao('erro', 'Erro ao aplicar filtros');
    }
  };

  // Adicionar notificação
  const adicionarNotificacao = (tipo: Notificacao['tipo'], mensagem: string) => {
    const notificacao: Notificacao = {
      id: uuidv4(),
      tipo,
      mensagem,
      timestamp: new Date()
    };
    setNotificacoes(prev => [...prev, notificacao]);
  };

  // Remover notificação
  const removerNotificacao = (id: string) => {
    setNotificacoes(prev => prev.filter(n => n.id !== id));
  };

  // Centro de Notificações - handlers
  const marcarNotificacaoCentroComoLida = (id: string) => {
    setNotificacoesCentro(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const removerNotificacaoCentro = (id: string) => {
    setNotificacoesCentro(prev => prev.filter(n => n.id !== id));
    setNotificacoesCentroIgnoradas(prev => new Set([...Array.from(prev), id]));
  };

  const limparTodasNotificacoesCentro = () => {
    setNotificacoesCentro(prev => {
      const ids = prev.map(n => n.id);
      setNotificacoesCentroIgnoradas(prevSet => new Set([...Array.from(prevSet), ...ids]));
      return [];
    });
  };

  // Recalcular notificações de prazo (só vencimentos) a partir das obrigações
  useEffect(() => {
    const hoje = new Date();
    const hojeMid = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const MS_DIA = 24 * 60 * 60 * 1000;

    // Map atual para preservar estado de leitura
    const lidasAtual: Record<string, boolean> = Object.fromEntries(
      notificacoesCentro.map(n => [n.id, n.lida])
    );

    const novas: NotificacaoCentro[] = obrigacoes
      .filter(o => o.status !== StatusObrigacao.CONCLUIDA && o.status !== StatusObrigacao.CANCELADA)
      .map(o => {
        const idBase = `prazo-${o.id}`;
        const dt = new Date(o.dataVencimento);
        if (isNaN(dt.getTime())) return null;
        const dtMid = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        const diffDias = Math.floor((dtMid.getTime() - hojeMid.getTime()) / MS_DIA);

        let titulo = '';
        let mensagem = '';
        let tipo: NotificacaoCentro['tipo'] = 'info';

        if (diffDias < 0) {
          tipo = 'erro';
          titulo = 'Obrigação atrasada';
          mensagem = `${o.titulo || 'Obrigação'} venceu em ${dtMid.toLocaleDateString()}`;
        } else if (diffDias === 0) {
          tipo = 'aviso';
          titulo = 'Vence hoje';
          mensagem = `${o.titulo || 'Obrigação'} vence hoje (${dtMid.toLocaleDateString()})`;
        } else if (diffDias <= 7) {
          tipo = 'aviso';
          titulo = 'Vencimento próximo';
          mensagem = `${o.titulo || 'Obrigação'} vence em ${diffDias} dia(s) (${dtMid.toLocaleDateString()})`;
        } else {
          return null; // Ignorar vencimentos além de 7 dias
        }

        const id = idBase;
        if (notificacoesCentroIgnoradas.has(id)) return null; // ignorada pelo usuário

        return {
          id,
          titulo,
          mensagem,
          tipo,
          lida: lidasAtual[id] || false,
          timestamp: new Date()
        } as NotificacaoCentro;
      })
      .filter(Boolean) as NotificacaoCentro[];

    setNotificacoesCentro(novas);
  }, [obrigacoes]);

  // Abrir modal para criar
  const abrirModalCriar = (data?: string) => {
    setObrigacaoSelecionada(undefined);
    setDataInicial(data || '');
    setModalAberto(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (obrigacao: Obrigacao) => {
    setObrigacaoSelecionada(obrigacao);
    setDataInicial('');
    setModalAberto(true);
  };

  // Fechar modal
  const fecharModal = () => {
    setModalAberto(false);
    setObrigacaoSelecionada(undefined);
    setDataInicial('');
  };

  // Salvar obrigação
  const salvarObrigacao = async (dados: Partial<Obrigacao>) => {
    try {
      console.log('💾 Salvando obrigação...', { 
        edicao: !!obrigacaoSelecionada, 
        id: obrigacaoSelecionada?.id,
        dados 
      });

      if (obrigacaoSelecionada) {
        console.log('📝 Atualizando obrigação existente:', obrigacaoSelecionada.id);
        const atualizada = await obrigacoesApi.atualizar(obrigacaoSelecionada.id, dados);
        console.log('✅ Obrigação atualizada:', atualizada);
        setObrigacoes(prev => prev.map(o => o.id === atualizada.id ? atualizada : o));
        adicionarNotificacao('sucesso', '✓ Obrigação atualizada com sucesso!');
      } else {
        console.log('✨ Criando nova obrigação');
        const nova = await obrigacoesApi.criar(dados);
        console.log('✅ Obrigação criada:', nova);
        setObrigacoes(prev => [...prev, nova]);
        adicionarNotificacao('sucesso', '✓ Obrigação criada com sucesso!');
      }
      fecharModal();
      await aplicarFiltros();
    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error);
      console.error('📋 Detalhes do erro:', {
        message: error.message,
        status: error.status,
        response: error.response?.data
      });
      adicionarNotificacao('erro', `✗ Erro ao salvar obrigação: ${error.message}`);
    }
  };

  // Atualizar data por drag & drop
  const atualizarData = async (obrigacaoId: string, novaData: string) => {
    try {
      // Garantir formato yyyy-MM-dd
      const dataFormatada = novaData.includes('T') ? novaData.split('T')[0] : novaData;
      await obrigacoesApi.atualizar(obrigacaoId, { dataVencimento: dataFormatada });
      adicionarNotificacao('sucesso', '✓ Data atualizada!');
      await carregarObrigacoes();
    } catch (error) {
      console.error('Erro ao atualizar data:', error);
      adicionarNotificacao('erro', '✗ Erro ao atualizar data');
    }
  };

  // Alterar status rapidamente
  const alterarStatusObrigacao = async (id: string, status: StatusObrigacao) => {
    try {
      const atualizada = await obrigacoesApi.atualizar(id, { status });
      setObrigacoes(prev => prev.map(o => o.id === id ? { ...o, status: atualizada.status } : o));
      adicionarNotificacao('sucesso', status === StatusObrigacao.CONCLUIDA ? '✓ Obrigação concluída!' : '✓ Status atualizado!');
      await aplicarFiltros();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      adicionarNotificacao('erro', '✗ Erro ao alterar status');
    }
  };

  // Deletar obrigação
  const deletarObrigacao = async (id: string) => {
    try {
      await obrigacoesApi.deletar(id);
      setObrigacoes(prev => prev.filter(o => o.id !== id));
      adicionarNotificacao('sucesso', '✓ Obrigação deletada com sucesso!');
      await aplicarFiltros();
    } catch (error) {
      console.error('Erro ao deletar obrigação:', error);
      adicionarNotificacao('erro', '✗ Erro ao deletar obrigação');
    }
  };

  // Configurar WebSocket
  useEffect(() => {
    socketService.connect();

    const removeCreated = socketService.on('obrigacao:created', (obrigacao: Obrigacao) => {
      setObrigacoes(prev => {
        if (prev.some(o => o.id === obrigacao.id)) return prev;
        return [...prev, obrigacao];
      });
      adicionarNotificacao('info', `📋 Nova obrigação: ${obrigacao.titulo}`);
    });

    const removeUpdated = socketService.on('obrigacao:updated', (obrigacao: Obrigacao) => {
      setObrigacoes(prev => prev.map(o => o.id === obrigacao.id ? obrigacao : o));
      adicionarNotificacao('info', `🔄 Atualizada: ${obrigacao.titulo}`);
    });

    const removeDeleted = socketService.on('obrigacao:deleted', (data: { id: string }) => {
      setObrigacoes(prev => prev.filter(o => o.id !== data.id));
      adicionarNotificacao('info', '🗑️ Obrigação removida');
    });

    socketService.registerUser('Usuário');

    return () => {
      removeCreated();
      removeUpdated();
      removeDeleted();
    };
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    carregarObrigacoes();
  }, []);

  // Aplicar filtros quando mudarem
  useEffect(() => {
    aplicarFiltros();
  }, [filtros, obrigacoes]);

  // Extrair valores únicos para filtros
    const clientesUnicos = Array.from(new Set(obrigacoes.map(o => o.cliente).filter(Boolean))) as string[];
  const empresas = Array.from(new Set(obrigacoes.map(o => o.empresa).filter(Boolean))) as string[];
  const responsaveis = Array.from(new Set(obrigacoes.map(o => o.responsavel).filter(Boolean))) as string[];

  // Calcular estatísticas
  const stats = {
    total: obrigacoesFiltradas.length,
    pendentes: obrigacoesFiltradas.filter(o => o.status === StatusObrigacao.PENDENTE).length,
    concluidas: obrigacoesFiltradas.filter(o => o.status === StatusObrigacao.CONCLUIDA).length,
    atrasadas: obrigacoesFiltradas.filter(o => o.status === StatusObrigacao.ATRASADA).length,
    esteMes: obrigacoesFiltradas.filter(o => {
      const data = new Date(o.dataVencimento);
      const hoje = new Date();
      return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
    }).length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" text="Carregando Sistema Fiscal..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex">
      {/* Sidebar */}
      <Sidebar
        onNavigate={handleNavigate}
        activeTab={activeTab}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        isCollapsed={sidebarCollapsed}
        stats={{
          total: stats.total,
          pendentes: stats.pendentes,
          concluidas: stats.concluidas,
          atrasadas: stats.atrasadas
        }}
        onAbrirCalculadora={() => setCalculadoraAberta(true)}
        onAbrirExportar={() => setExportarAberto(true)}
        onAbrirImportar={() => setImportarAberto(true)}
        onAbrirFiltros={() => alert('Os filtros já estão disponíveis na página!')}
        onAbrirDocumentacao={() => window.open('https://github.com', '_blank')}
      />

      {/* Main Content Area */}
      <div
        className={`
          flex-1 transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64 xl:ml-72'}
          max-w-full ml-0
        `}
      >
        {/* Header */}
        <Header
          onNovaObrigacao={() => abrirModalCriar()}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNavigate={handleNavigate}
          centroNotificacoesProps={{
            notificacoes: notificacoesCentro,
            onMarcarLida: marcarNotificacaoCentroComoLida,
            onRemover: removerNotificacaoCentro,
            onLimparTodas: limparTodasNotificacoesCentro
          }}
        />

        {/* Main Content */}
        <main className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8 animate-fadeIn">
            <StatsCard title="Total" value={stats.total} icon={Calendar} color="blue" />
            <StatsCard title="Pendentes" value={stats.pendentes} icon={Clock} color="yellow" />
            <StatsCard title="Concluídas" value={stats.concluidas} icon={CheckCircle2} color="green" />
            <StatsCard title="Atrasadas" value={stats.atrasadas} icon={AlertTriangle} color="red" />
            <StatsCard title="Este Mês" value={stats.esteMes} icon={FileText} color="purple" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Coluna principal */}
            <div className="lg:col-span-3 space-y-6">

              {/* Conteúdo baseado na aba selecionada */}
              {activeTab === 'dashboard' ? (
                <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                  <div className="card p-6">
                    <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="card-gradient p-6">
                        <h3 className="text-lg font-semibold mb-4">Resumo Geral</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Total de Obrigações</span>
                            <span className="text-2xl font-bold text-blue-600">{stats.total}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Pendentes</span>
                            <span className="text-2xl font-bold text-yellow-600">{stats.pendentes}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Concluídas</span>
                            <span className="text-2xl font-bold text-green-600">{stats.concluidas}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Atrasadas</span>
                            <span className="text-2xl font-bold text-red-600">{stats.atrasadas}</span>
                          </div>
                        </div>
                      </div>
                      <div className="card-gradient p-6">
                        <h3 className="text-lg font-semibold mb-4">Alertas Críticos</h3>
                        <div className="space-y-2">
                          {stats.atrasadas > 0 && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                              <span className="text-red-700 dark:text-red-400 font-semibold">
                                ⚠️ {stats.atrasadas} obrigação(ões) atrasada(s)
                              </span>
                            </div>
                          )}
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <span className="text-yellow-700 dark:text-yellow-400 font-semibold">
                              📋 {stats.pendentes} obrigação(ões) pendente(s)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'calendario' ? (
                <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                  <CalendarioFiscal
                    obrigacoes={obrigacoesFiltradas}
                    onEventClick={abrirModalEditar}
                    onDateSelect={abrirModalCriar}
                    onEventDrop={atualizarData}
                  />
                </div>
              ) : activeTab === 'obrigacoes' ? (
                <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                  <ListaObrigacoes
                    obrigacoes={obrigacoesFiltradas}
                    onCriar={() => abrirModalCriar()}
                    onEditar={abrirModalEditar}
                    onAlterarStatus={alterarStatusObrigacao}
                    onDeletar={deletarObrigacao}
                  />
                </div>
              ) : activeTab === 'clientes' ? (
                <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                  <Clientes />
                </div>
              ) : activeTab === 'impostos' ? (
                <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                  <Impostos clientes={clientes} />
                </div>
              ) : activeTab === 'parcelamentos' ? (
                <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                  <Parcelamentos clientes={clientes} />
                </div>
              ) : activeTab === 'relatorios' ? (
                <div className="animate-fadeIn">
                  <Relatorios obrigacoes={obrigacoes} />
                </div>
              ) : null}
            </div>

            {/* Sidebar Right - Informações */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Stats */}
              <div className="card p-6 animate-slideInRight" style={{ animationDelay: '0.1s' }}>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  Resumo Rápido
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Taxa Conclusão</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {stats.total > 0 ? Math.round((stats.concluidas / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Em Andamento</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {obrigacoesFiltradas.filter(o => o.status === StatusObrigacao.EM_ANDAMENTO).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {modalAberto && (
        <ObrigacaoModal
          obrigacao={obrigacaoSelecionada}
          dataInicial={dataInicial}
          onSave={salvarObrigacao}
          onClose={fecharModal}
          clientes={clientes.map(c => ({ id: c.id || '', nome: c.nome }))}
        />
      )}

      {/* Notificações */}
      <NotificacaoRealTime
        notificacoes={notificacoes}
        onRemover={removerNotificacao}
      />

      {/* Busca Global */}
      <BuscaGlobal
        obrigacoes={obrigacoes}
        onSelect={abrirModalEditar}
      />

      {/* Painel de Atalhos */}
      <PainelAtalhos />

      {/* Calculadora Fiscal */}
      {calculadoraAberta && (
        <CalculadoraFiscal
          onClose={() => setCalculadoraAberta(false)}
        />
      )}

      {/* Exportar Dados */}
      {exportarAberto && (
        <ExportarDados
          onClose={() => setExportarAberto(false)}
          dados={obrigacoesFiltradas}
        />
      )}

      {/* Importar Dados */}
      {importarAberto && (
        <ImportarDados
          onClose={() => setImportarAberto(false)}
          onImportComplete={(dados) => {
            console.log('Dados importados:', dados);
            adicionarNotificacao('sucesso', `✓ ${dados.length} registros importados!`);
          }}
        />
      )}

      {/* Configurações */}
      {configuracoesAberto && (
        <Configuracoes
          onClose={() => setConfiguracoesAberto(false)}
        />
      )}
      
      {/* Overlay para mobile quando sidebar está aberta */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
