import React, { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventInput, EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import { Calendar } from 'lucide-react';
import { Obrigacao, CoresObrigacao } from '../types';
import { format } from 'date-fns';

interface CalendarioFiscalProps {
  obrigacoes: Obrigacao[];
  onEventClick: (obrigacao: Obrigacao) => void;
  onDateSelect: (data: string) => void;
  onEventDrop: (obrigacaoId: string, novaData: string) => void;
}

const CalendarioFiscal: React.FC<CalendarioFiscalProps> = ({
  obrigacoes,
  onEventClick,
  onDateSelect,
  onEventDrop
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [view, setView] = useState<'dayGridMonth' | 'listWeek'>('dayGridMonth');

  // Converter obrigações para eventos do FullCalendar
  const events: EventInput[] = obrigacoes.map(obrigacao => ({
    id: obrigacao.id,
    title: obrigacao.titulo,
    start: obrigacao.dataVencimento,
    backgroundColor: obrigacao.cor || CoresObrigacao[obrigacao.tipo],
    borderColor: obrigacao.cor || CoresObrigacao[obrigacao.tipo],
    extendedProps: {
      obrigacao
    },
    editable: true
  }));

  const handleEventClick = (info: EventClickArg) => {
    const obrigacao = info.event.extendedProps.obrigacao as Obrigacao;
    onEventClick(obrigacao);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const data = format(selectInfo.start, 'yyyy-MM-dd');
    onDateSelect(data);
    
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

  const mudarVisao = (novaVisao: 'dayGridMonth' | 'listWeek') => {
    setView(novaVisao);
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(novaVisao);
    }
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
        
        <div className="flex gap-2">
          <button
            onClick={() => mudarVisao('dayGridMonth')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              view === 'dayGridMonth'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            📅 Mês
          </button>
          <button
            onClick={() => mudarVisao('listWeek')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              view === 'listWeek'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            📋 Lista
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

      {/* Calendário */}
      <div className="calendar-container">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
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
          eventClick={handleEventClick}
          selectable={true}
          select={handleDateSelect}
          editable={true}
          eventDrop={handleEventDrop}
          height="auto"
          dayMaxEvents={3}
          eventDisplay="block"
          displayEventTime={false}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
        />
      </div>
    </div>
  );
};

export default CalendarioFiscal;

