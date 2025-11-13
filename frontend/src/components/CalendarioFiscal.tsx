import React, { useRef, useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventInput, EventClickArg, DateSelectArg, EventDropArg, EventContentArg } from '@fullcalendar/core';
import { Calendar, Clock, FileText } from 'lucide-react';
import { Obrigacao, CoresObrigacao, StatusObrigacao, TipoObrigacao } from '../types';
import { format } from 'date-fns';
import ObrigacoesDoDia from './ObrigacoesDoDia';
import { gerarTodosEventosRecorrentes, isEventoVirtual } from '../utils/recorrenciaUtils';

interface CalendarioFiscalProps {
  obrigacoes: Obrigacao[];
  onEventClick: (obrigacao: Obrigacao) => void;
  onDateSelect: (data: string) => void;
  onEventDrop: (obrigacaoId: string, novaData: string) => void;
  onDeletarObrigacao: (id: string) => void;
}

const CalendarioFiscal: React.FC<CalendarioFiscalProps> = ({
  obrigacoes,
  onEventClick,
  onDateSelect,
  onEventDrop,
  onDeletarObrigacao
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'listWeek'>('dayGridMonth');
  const [modalDiaAberto, setModalDiaAberto] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState<string>('');
  const [obrigacoesDoDia, setObrigacoesDoDia] = useState<Obrigacao[]>([]);
  const [mostrarRecorrencias, setMostrarRecorrencias] = useState<boolean>(true);

  // Gerar eventos recorrentes futuros (memoizado para performance)
  const obrigacoesComRecorrencias = useMemo(() => {
    if (!mostrarRecorrencias) {
      return obrigacoes;
    }
    // Aumentar para 24 meses para mostrar recorrências futuras por mais tempo
    return gerarTodosEventosRecorrentes(obrigacoes, 24); // Gerar 24 meses no futuro
  }, [obrigacoes, mostrarRecorrencias]);

  // Função para obter ícone baseado no status
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

  // Função para obter classe de cor baseada no status
  const getStatusClass = (status: StatusObrigacao) => {
    switch (status) {
      case StatusObrigacao.CONCLUIDA:
        return 'opacity-60';
      case StatusObrigacao.ATRASADA:
        return 'ring-2 ring-red-500 ring-offset-1';
      case StatusObrigacao.EM_ANDAMENTO:
        return 'ring-2 ring-blue-400 ring-offset-1';
      default:
        return '';
    }
  };

  // Renderização customizada de eventos (estilo Google Calendar)
  const renderEventContent = (eventInfo: EventContentArg) => {
    const obrigacao = eventInfo.event.extendedProps.obrigacao as Obrigacao;
    const isVirtual = eventInfo.event.extendedProps.isVirtual as boolean;
    const isListView = view === 'listWeek';
    const isWeekView = view === 'timeGridWeek';

    if (isListView) {
      return (
        <div className={`flex items-center gap-3 p-2 w-full ${isVirtual ? 'opacity-70' : ''}`}>
          <span className="text-lg">{getStatusIcon(obrigacao.status)}</span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate flex items-center gap-1">
              {obrigacao.titulo}
              {isVirtual && (
                <span className="text-[10px] bg-purple-500/20 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-semibold" title="Ocorrência futura agendada - será criada automaticamente pela recorrência">
                  ⏱️ Agendada
                </span>
              )}
            </div>
            {obrigacao.cliente && (
              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                👤 {obrigacao.cliente}
              </div>
            )}
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">
            {obrigacao.tipo}
          </span>
        </div>
      );
    }

    return (
      <div className={`fc-event-custom ${getStatusClass(obrigacao.status)} ${isVirtual ? 'opacity-60 border-2 border-dashed' : ''} overflow-hidden h-full flex items-center gap-1.5 px-2 py-1`}>
        <span className="text-xs flex-shrink-0">{getStatusIcon(obrigacao.status)}</span>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1">
            <div className="font-semibold text-xs truncate leading-tight">{obrigacao.titulo}</div>
            {isVirtual && (
              <span className="text-[10px] bg-purple-500/30 text-purple-700 dark:text-purple-200 px-1 py-0.5 rounded flex-shrink-0 font-semibold" title="Ocorrência futura agendada - será criada automaticamente">
                ⏱️ Agendada
              </span>
            )}
            {obrigacao.recorrencia && obrigacao.recorrencia.ativo !== false && !isVirtual && (
              <span className="text-[10px] bg-green-500/20 text-green-700 dark:text-green-300 px-1 py-0.5 rounded flex-shrink-0 font-semibold" title="Recorrência automática ativa - gera novas ocorrências automaticamente">
                🔄 Automática
              </span>
            )}
          </div>
          {(isWeekView || eventInfo.view.type === 'dayGridMonth') && obrigacao.cliente && (
            <div className="text-[10px] opacity-90 truncate leading-tight">
              👤 {obrigacao.cliente}
            </div>
          )}
          {obrigacao.ajusteDataUtil && (
            <div className="text-[9px] opacity-75 flex items-center gap-0.5 leading-tight mt-0.5">
              {obrigacao.preferenciaAjuste === 'proximo' ? '⏩' : '⏪'}
              <span>Ajuste</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Função helper para formatar data para formato ISO correto (yyyy-MM-dd)
  const formatarDataParaCalendario = (data: string): string => {
    if (!data) return '';
    // Se já está no formato correto (yyyy-MM-dd), retorna
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
    // Se está no formato ISO (com hora), extrai apenas a data
    return data.split('T')[0];
  };

  // Converter obrigações para eventos do FullCalendar (incluindo recorrências futuras)
  const events: EventInput[] = obrigacoesComRecorrencias.map((obrigacao: Obrigacao) => {
    const cor = obrigacao.cor || CoresObrigacao[obrigacao.tipo as TipoObrigacao] || CoresObrigacao[TipoObrigacao.OUTRO];
    const isVirtual = isEventoVirtual(obrigacao);
    
    return {
    id: obrigacao.id,
    title: obrigacao.titulo,
    start: formatarDataParaCalendario(obrigacao.dataVencimento), // Sempre formato yyyy-MM-dd
      allDay: true,
      backgroundColor: isVirtual ? `${cor}99` : cor, // Mais transparente se for virtual
      borderColor: isVirtual ? cor : cor,
      textColor: '#ffffff',
      classNames: [
        'event-custom',
        `status-${obrigacao.status ? obrigacao.status.toLowerCase() : 'pendente'}`,
        obrigacao.ajusteDataUtil ? 'event-with-adjustment' : '',
        isVirtual ? 'event-recorrencia-futura' : ''
      ],
    extendedProps: {
        obrigacao,
        cliente: obrigacao.cliente,
        tipo: obrigacao.tipo,
        status: obrigacao.status,
        isVirtual
    },
    editable: !isVirtual // Eventos virtuais não são editáveis
    };
  });

  const handleEventClick = (info: EventClickArg) => {
    const obrigacao = info.event.extendedProps.obrigacao as Obrigacao;
    const isVirtual = info.event.extendedProps.isVirtual as boolean;
    
    if (isVirtual) {
      // Mostrar alerta para eventos virtuais
      const confirmar = window.confirm(
        `Esta é uma ocorrência futura da obrigação "${obrigacao.titulo}".\n\n` +
        `Data de vencimento: ${new Date(obrigacao.dataVencimento).toLocaleDateString('pt-BR')}\n\n` +
        `Esta obrigação será criada automaticamente pelo sistema.\n\n` +
        `Deseja visualizar a obrigação original?`
      );
      
      if (confirmar) {
        // Encontrar a obrigação original
        // Garantir que id seja string (pode vir como número do backend)
        const idString = String(obrigacao.id || '');
        const idOriginal = idString.split('-recorrencia-')[0];
        const obrigacaoOriginal = obrigacoes.find(o => String(o.id) === idOriginal);
        if (obrigacaoOriginal) {
          onEventClick(obrigacaoOriginal);
        }
      }
    } else {
      onEventClick(obrigacao);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const data = format(selectInfo.start, 'yyyy-MM-dd');
    
    // Buscar obrigações deste dia (incluindo recorrências futuras se estiver ativo)
    let obrigacoesDia: Obrigacao[] = [];
    
    if (mostrarRecorrencias) {
      // Incluir recorrências futuras
      obrigacoesDia = obrigacoesComRecorrencias.filter((o: Obrigacao) => {
        const dataObrigacao = formatarDataParaCalendario(o.dataVencimento);
        return dataObrigacao === data;
      });
    } else {
      // Apenas obrigações reais
      obrigacoesDia = obrigacoes.filter((o: Obrigacao) => {
        const dataObrigacao = formatarDataParaCalendario(o.dataVencimento);
        return dataObrigacao === data;
      });
    }
    
    // Abrir modal mostrando obrigações do dia
    setDataSelecionada(data);
    setObrigacoesDoDia(obrigacoesDia);
    setModalDiaAberto(true);
    
    // Limpar seleção
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.unselect();
    }
  };

  const handleEventDrop = (dropInfo: EventDropArg) => {
    const obrigacaoId = dropInfo.event.id;
    const novaData = format(dropInfo.event.start!, 'yyyy-MM-dd');
    
    onEventDrop(obrigacaoId, novaData);
  };

  const mudarVisao = (novaVisao: 'dayGridMonth' | 'timeGridWeek' | 'listWeek') => {
    setView(novaVisao);
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(novaVisao);
    }
  };

  // Tooltip ao passar o mouse
  const handleEventMouseEnter = (info: any) => {
    const obrigacao = info.event.extendedProps.obrigacao as Obrigacao;
    const tooltip = document.createElement('div');
    tooltip.className = 'fc-tooltip';
    tooltip.innerHTML = `
      <div class="bg-gray-900 dark:bg-gray-800 text-white p-3 rounded-lg shadow-xl border border-gray-700 min-w-[250px] animate-fadeIn">
        <div class="flex items-start gap-2 mb-2">
          <span class="text-lg">${getStatusIcon(obrigacao.status)}</span>
          <div class="flex-1">
            <div class="font-bold text-sm mb-1">${obrigacao.titulo}</div>
            <div class="text-xs opacity-75">${obrigacao.tipo}</div>
          </div>
        </div>
        ${obrigacao.descricao ? `<div class="text-xs mb-2 opacity-90">${obrigacao.descricao}</div>` : ''}
        <div class="space-y-1 text-xs">
          ${obrigacao.cliente ? `<div class="flex items-center gap-1"><span>👤</span> ${obrigacao.cliente}</div>` : ''}
          ${obrigacao.responsavel ? `<div class="flex items-center gap-1"><span>👔</span> ${obrigacao.responsavel}</div>` : ''}
          <div class="flex items-center gap-1">
            <span>📅</span> ${new Date(obrigacao.dataVencimento).toLocaleDateString('pt-BR')}
          </div>
          ${obrigacao.ajusteDataUtil ? `
            <div class="flex items-center gap-1 text-blue-300">
              <span>${obrigacao.preferenciaAjuste === 'proximo' ? '⏩' : '⏪'}</span>
              Ajuste ${obrigacao.preferenciaAjuste === 'proximo' ? 'próximo' : 'anterior'} dia útil
            </div>
          ` : ''}
        </div>
      </div>
    `;
    tooltip.style.position = 'absolute';
    tooltip.style.zIndex = '9999';
    tooltip.style.pointerEvents = 'none';
    document.body.appendChild(tooltip);

    const updatePosition = (e: MouseEvent) => {
      tooltip.style.left = (e.clientX + 15) + 'px';
      tooltip.style.top = (e.clientY + 15) + 'px';
    };

    updatePosition(info.jsEvent);
    info.el.addEventListener('mousemove', updatePosition);
    info.el.addEventListener('mouseleave', () => {
      tooltip.remove();
    });
  };

  return (
    <div className="card p-6">
      {/* Controles */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl">
            <Calendar size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Calendário de Obrigações</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Arraste e solte para reorganizar</p>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap items-center">
          {/* Toggle de Recorrências */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 rounded-lg border border-green-200 dark:border-green-800">
            <input
              type="checkbox"
              id="toggle-recorrencias"
              checked={mostrarRecorrencias}
              onChange={(e) => setMostrarRecorrencias(e.target.checked)}
              className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="toggle-recorrencias" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-2">
              <span className="text-lg">🔄</span>
              <span>Recorrências Agendadas (24 meses)</span>
              {mostrarRecorrencias && (
                <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                  Ativo
                </span>
              )}
            </label>
          </div>
          
          <button
            onClick={() => mudarVisao('dayGridMonth')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              view === 'dayGridMonth'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Calendar size={16} />
            Mês
          </button>
          <button
            onClick={() => mudarVisao('timeGridWeek')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              view === 'timeGridWeek'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Clock size={16} />
            Semana
          </button>
          <button
            onClick={() => mudarVisao('listWeek')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              view === 'listWeek'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FileText size={16} />
            Lista
          </button>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg hover:scale-105 transition-transform cursor-pointer">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: CoresObrigacao.FEDERAL }}></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Federal</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg hover:scale-105 transition-transform cursor-pointer">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: CoresObrigacao.ESTADUAL }}></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estadual</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg hover:scale-105 transition-transform cursor-pointer">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: CoresObrigacao.MUNICIPAL }}></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Municipal</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg hover:scale-105 transition-transform cursor-pointer">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: CoresObrigacao.TRABALHISTA }}></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trabalhista</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg hover:scale-105 transition-transform cursor-pointer">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: CoresObrigacao.PREVIDENCIARIA }}></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Previdenciária</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg hover:scale-105 transition-transform cursor-pointer">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: CoresObrigacao.OUTRO }}></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Outro</span>
        </div>
      </div>

      {/* Legenda de Status */}
      <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <span className="text-lg">📋</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Pendente</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-lg">🔄</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Em Andamento</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
          <span className="text-lg">✅</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Concluída</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border border-red-200 dark:border-red-800">
          <span className="text-lg">⚠️</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Atrasada</span>
        </div>
        {mostrarRecorrencias && (
          <>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <span className="text-lg">⏱️</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Recorrência Agendada (24 meses)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-lg">🔄</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Recorrência Automática Ativa</span>
            </div>
          </>
        )}
      </div>

      {/* Calendário */}
      <div className="calendar-container-improved">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          locale="pt-br"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          buttonText={{
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            list: 'Lista'
          }}
          events={events}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          eventMouseEnter={handleEventMouseEnter}
          selectable={true}
          select={handleDateSelect}
          editable={true}
          eventDrop={handleEventDrop}
          height="auto"
          dayMaxEvents={4}
          moreLinkText={(num) => `+${num} mais`}
          eventDisplay="block"
          displayEventTime={false}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={true}
          weekends={true}
          nowIndicator={true}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          views={{
            dayGridMonth: {
              dayMaxEvents: 4
            },
            timeGridWeek: {
              dayMaxEvents: false,
              allDaySlot: true,
              slotDuration: '01:00:00'
            },
            listWeek: {
              listDayFormat: { weekday: 'long', day: 'numeric', month: 'long' }
            }
          }}
        />
      </div>

      {/* Modal de Obrigações do Dia */}
      {modalDiaAberto && (
        <ObrigacoesDoDia
          data={dataSelecionada}
          obrigacoes={obrigacoesDoDia}
          impostos={[]} 
          parcelamentos={[]}
          onClose={() => setModalDiaAberto(false)}
          onEditar={(obrigacao) => {
            setModalDiaAberto(false);
            onEventClick(obrigacao);
          }}
          onDeletar={(id) => {
            onDeletarObrigacao(id);
            setModalDiaAberto(false);
          }}
          onCriarNova={() => {
            setModalDiaAberto(false);
            onDateSelect(dataSelecionada);
          }}
        />
      )}
    </div>
  );
};

export default CalendarioFiscal;

