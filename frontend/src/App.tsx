import React, { useEffect, useState } from 'react';
import { Calendar, FileText, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import CalendarioFiscal from './components/CalendarioFiscal';
import ObrigacaoModal from './components/ObrigacaoModal';
import FiltrosPanel from './components/FiltrosPanel';
import NotificacaoRealTime, { Notificacao } from './components/NotificacaoRealTime';
import UsuariosOnline from './components/UsuariosOnline';
import StatsCard from './components/StatsCard';
import LoadingSpinner from './components/LoadingSpinner';
import BuscaGlobal from './components/BuscaGlobal';
import PainelAtalhos from './components/PainelAtalhos';
import { obrigacoesApi } from './services/api';
import socketService from './services/socket';
import { Obrigacao, FiltroObrigacoes, StatusObrigacao } from './types';
import { v4 as uuidv4 } from 'uuid';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function AppContent() {
  const [obrigacoes, setObrigacoes] = useState<Obrigacao[]>([]);
  const [obrigacoesFiltradas, setObrigacoesFiltradas] = useState<Obrigacao[]>([]);
  const [filtros, setFiltros] = useState<FiltroObrigacoes>({});
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [obrigacaoSelecionada, setObrigacaoSelecionada] = useState<Obrigacao | undefined>();
  const [dataInicial, setDataInicial] = useState<string>('');
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [usuariosOnline, setUsuariosOnline] = useState<any[]>([]);
  const [conectado, setConectado] = useState(false);

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
    }
  ]);

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
      if (obrigacaoSelecionada) {
        const atualizada = await obrigacoesApi.atualizar(obrigacaoSelecionada.id, dados);
        setObrigacoes(prev => prev.map(o => o.id === atualizada.id ? atualizada : o));
        adicionarNotificacao('sucesso', '✓ Obrigação atualizada com sucesso!');
      } else {
        const nova = await obrigacoesApi.criar(dados);
        setObrigacoes(prev => [...prev, nova]);
        adicionarNotificacao('sucesso', '✓ Obrigação criada com sucesso!');
      }
      fecharModal();
      await aplicarFiltros();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      adicionarNotificacao('erro', '✗ Erro ao salvar obrigação');
    }
  };

  // Atualizar data por drag & drop
  const atualizarData = async (obrigacaoId: string, novaData: string) => {
    try {
      await obrigacoesApi.atualizar(obrigacaoId, { dataVencimento: novaData });
      adicionarNotificacao('sucesso', '✓ Data atualizada!');
      await carregarObrigacoes();
    } catch (error) {
      console.error('Erro ao atualizar data:', error);
      adicionarNotificacao('erro', '✗ Erro ao atualizar data');
    }
  };

  // Configurar WebSocket
  useEffect(() => {
    socketService.connect();
    setConectado(socketService.isConnected());

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

    const removeUserConnected = socketService.on('user:connected', () => {
      adicionarNotificacao('info', '👤 Novo usuário conectado');
    });

    const removeUserDisconnected = socketService.on('user:disconnected', () => {
      adicionarNotificacao('info', '👋 Usuário desconectado');
    });

    const removeUsersList = socketService.on('users:list', (users: any[]) => {
      setUsuariosOnline(users);
    });

    socketService.registerUser('Usuário');

    return () => {
      removeCreated();
      removeUpdated();
      removeDeleted();
      removeUserConnected();
      removeUserDisconnected();
      removeUsersList();
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
  const clientes = Array.from(new Set(obrigacoes.map(o => o.cliente).filter(Boolean))) as string[];
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <Header onNovaObrigacao={() => abrirModalCriar()} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatsCard title="Total" value={stats.total} icon={Calendar} color="blue" />
          <StatsCard title="Pendentes" value={stats.pendentes} icon={Clock} color="yellow" />
          <StatsCard title="Concluídas" value={stats.concluidas} icon={CheckCircle2} color="green" />
          <StatsCard title="Atrasadas" value={stats.atrasadas} icon={AlertTriangle} color="red" />
          <StatsCard title="Este Mês" value={stats.esteMes} icon={FileText} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filtros */}
            <div className="animate-fadeIn">
              <FiltrosPanel
                filtros={filtros}
                onFiltrosChange={setFiltros}
                clientes={clientes}
                empresas={empresas}
                responsaveis={responsaveis}
              />
            </div>

            {/* Calendário */}
            <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              <CalendarioFiscal
                obrigacoes={obrigacoesFiltradas}
                onEventClick={abrirModalEditar}
                onDateSelect={abrirModalCriar}
                onEventDrop={atualizarData}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="animate-slideInRight">
              <UsuariosOnline usuarios={usuariosOnline} conectado={conectado} />
            </div>

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

      {/* Modal */}
      {modalAberto && (
        <ObrigacaoModal
          obrigacao={obrigacaoSelecionada}
          dataInicial={dataInicial}
          onSave={salvarObrigacao}
          onClose={fecharModal}
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
