import React, { useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventInput, EventClickArg, EventDropArg, DateClickArg } from '@fullcalendar/core';
import { Calendar, ClipboardList, Layers, Receipt, X } from 'lucide-react';
import {
	Obrigacao,
	CoresObrigacao,
	Imposto,
	Parcelamento,
	NomesStatusFinanceiro,
	NomesStatusObrigacao,
	StatusFinanceiro,
	StatusObrigacao
} from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarioFiscalProps {
  obrigacoes: Obrigacao[];
  impostos: Imposto[];
  parcelamentos: Parcelamento[];
  onEventClick: (obrigacao: Obrigacao) => void;
  onDateSelect: (data: string) => void;
  onEventDrop: (obrigacaoId: string, novaData: string) => void;
}

const CalendarioFiscal: React.FC<CalendarioFiscalProps> = ({
  obrigacoes,
  impostos,
  parcelamentos,
  onEventClick,
  onDateSelect,
  onEventDrop
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [view, setView] = useState<'dayGridMonth' | 'listWeek'>('dayGridMonth');
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);

  const COR_IMPOSTO = '#0ea5e9';
  const COR_PARCELAMENTO = '#ec4899';

  const classeStatusObrigacao: Record<StatusObrigacao, string> = {
    PENDENTE: 'status-pendente',
    EM_ANDAMENTO: 'status-em-andamento',
    CONCLUIDA: 'status-concluida',
    ATRASADA: 'status-atrasada',
    CANCELADA: 'status-cancelada'
  };

  const classeStatusFinanceiro: Record<StatusFinanceiro, string> = {
    PENDENTE: 'status-pendente',
    EM_ANDAMENTO: 'status-em-andamento',
    CONCLUIDO: 'status-concluida',
    ATRASADO: 'status-atrasada'
  };

  // Converter dados para eventos do FullCalendar
  const eventosObrigacoes: EventInput[] = obrigacoes.map(obrigacao => ({
    id: obrigacao.id,
    title: obrigacao.titulo,
    start: obrigacao.dataVencimento,
    backgroundColor: obrigacao.cor || CoresObrigacao[obrigacao.tipo],
    borderColor: obrigacao.cor || CoresObrigacao[obrigacao.tipo],
    extendedProps: {
      categoria: 'obrigacao',
      obrigacao
    },
    editable: true
  }));

  const eventosImpostos: EventInput[] = impostos.map(imposto => ({
    id: `imposto-${imposto.id}`,
    title: `Imposto: ${imposto.titulo}`,
    start: imposto.dataVencimento,
    backgroundColor: COR_IMPOSTO,
    borderColor: COR_IMPOSTO,
    extendedProps: {
      categoria: 'imposto',
      imposto
    },
    editable: false
  }));

  const eventosParcelamentos: EventInput[] = parcelamentos.map(parcelamento => ({
    id: `parcelamento-${parcelamento.id}`,
    title: `Parcelamento: ${parcelamento.titulo}`,
    start: parcelamento.dataVencimento,
    backgroundColor: COR_PARCELAMENTO,
    borderColor: COR_PARCELAMENTO,
    extendedProps: {
      categoria: 'parcelamento',
      parcelamento
    },
    editable: false
  }));

  const events: EventInput[] = [...eventosObrigacoes, ...eventosImpostos, ...eventosParcelamentos];

  const handleEventClick = (info: EventClickArg) => {
    const categoria = info.event.extendedProps.categoria as string | undefined;

    if (categoria === 'obrigacao') {
      const obrigacao = info.event.extendedProps.obrigacao as Obrigacao;
      onEventClick(obrigacao);
      return;
    }

    if (info.event.start) {
      const data = format(info.event.start, 'yyyy-MM-dd');
      abrirDetalhesDia(data);
    }
  };

  const handleDateClick = (info: DateClickArg) => {
    const data = format(info.date, 'yyyy-MM-dd');
    abrirDetalhesDia(data);
  };

  const handleEventDrop = (dropInfo: EventDropArg) => {
    if (dropInfo.event.extendedProps.categoria !== 'obrigacao') {
      return;
    }
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

  const abrirDetalhesDia = (data: string) => {
    setDataSelecionada(data);
    setDetalhesAbertos(true);
  };

  const fecharDetalhesDia = () => {
    setDetalhesAbertos(false);
    setDataSelecionada(null);
  };

  const normalizarData = (data: string) => {
    const dt = new Date(data);
    if (Number.isNaN(dt.getTime())) {
      return '';
    }
    return format(dt, 'yyyy-MM-dd');
  };

  const detalhesDia = useMemo(() => {
    if (!dataSelecionada) {
      return {
        obrigacoes: [] as Obrigacao[],
        impostos: [] as Imposto[],
        parcelamentos: [] as Parcelamento[]
      };
    }

    const comparar = (data: string) => normalizarData(data) === dataSelecionada;

    return {
      obrigacoes: obrigacoes.filter(o => comparar(o.dataVencimento)),
      impostos: impostos.filter(i => comparar(i.dataVencimento)),
      parcelamentos: parcelamentos.filter(p => comparar(p.dataVencimento))
    };
  }, [dataSelecionada, obrigacoes, impostos, parcelamentos]);

  const dataSelecionadaFormatada = useMemo(() => {
    if (!dataSelecionada) return '';
    const dt = new Date(`${dataSelecionada}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return dataSelecionada;
    return format(dt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }, [dataSelecionada]);

  const resumoTotal = detalhesDia.obrigacoes.length + detalhesDia.impostos.length + detalhesDia.parcelamentos.length;

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
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg hover:scale-105 transition-transform cursor-pointer">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COR_IMPOSTO }}></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Impostos</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg hover:scale-105 transition-transform cursor-pointer">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COR_PARCELAMENTO }}></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Parcelamentos</span>
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
          dateClick={handleDateClick}
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

      {detalhesAbertos && dataSelecionada && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-t-2xl">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar size={22} className="text-blue-600" />
                  Agenda do dia {dataSelecionadaFormatada}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {resumoTotal > 0
                    ? `${resumoTotal} atividade(s) planejada(s)`
                    : 'Nenhuma atividade cadastrada para este dia.'}
                </p>
              </div>
              <button
                onClick={fecharDetalhesDia}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all hover:scale-110"
                aria-label="Fechar detalhes do dia"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <section>
                <header className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      <ClipboardList size={18} />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Obrigações</h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{detalhesDia.obrigacoes.length} registro(s)</span>
                    </div>
                  </div>
                  {dataSelecionada && (
                    <button
                      onClick={() => {
                        onDateSelect(dataSelecionada);
                        fecharDetalhesDia();
                      }}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      Nova obrigação
                    </button>
                  )}
                </header>

                <div className="space-y-3">
                  {detalhesDia.obrigacoes.length === 0 ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300">
                      Nenhuma obrigação agendada para este dia.
                    </div>
                  ) : (
                    detalhesDia.obrigacoes.map(obrigacao => (
                      <div key={obrigacao.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h5 className="text-base font-semibold text-gray-900 dark:text-white">{obrigacao.titulo}</h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {obrigacao.tipo} • Cliente {obrigacao.cliente ?? 'não informado'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`badge ${classeStatusObrigacao[obrigacao.status]}`}>
                              {NomesStatusObrigacao[obrigacao.status]}
                            </span>
                            <button
                              onClick={() => {
                                onEventClick(obrigacao);
                                fecharDetalhesDia();
                              }}
                              className="btn-secondary px-3 py-1.5 text-sm"
                            >
                              Editar
                            </button>
                          </div>
                        </div>
                        {obrigacao.descricao && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                            {obrigacao.descricao}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section>
                <header className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Impostos</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{detalhesDia.impostos.length} registro(s)</span>
                  </div>
                </header>

                <div className="space-y-3">
                  {detalhesDia.impostos.length === 0 ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300">
                      Nenhum imposto previsto para este dia.
                    </div>
                  ) : (
                    detalhesDia.impostos.map(imposto => (
                      <div key={imposto.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h5 className="text-base font-semibold text-gray-900 dark:text-white">{imposto.titulo}</h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {imposto.recorrencia} • Cliente {imposto.cliente ?? 'não informado'}
                            </p>
                          </div>
                          <span className={`badge ${classeStatusFinanceiro[imposto.status]}`}>
                            {NomesStatusFinanceiro[imposto.status]}
                          </span>
                        </div>
                        {imposto.descricao && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{imposto.descricao}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section>
                <header className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Parcelamentos</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{detalhesDia.parcelamentos.length} registro(s)</span>
                  </div>
                </header>

                <div className="space-y-3">
                  {detalhesDia.parcelamentos.length === 0 ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300">
                      Nenhum parcelamento vence neste dia.
                    </div>
                  ) : (
                    detalhesDia.parcelamentos.map(parcelamento => (
                      <div key={parcelamento.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h5 className="text-base font-semibold text-gray-900 dark:text-white">{parcelamento.titulo}</h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Parcela {parcelamento.parcelaAtual}/{parcelamento.totalParcelas} • Cliente {parcelamento.cliente ?? 'não informado'}
                            </p>
                          </div>
                          <span className={`badge ${classeStatusFinanceiro[parcelamento.status]}`}>
                            {NomesStatusFinanceiro[parcelamento.status]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                          Valor da parcela: R$ {parcelamento.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        {parcelamento.descricao && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{parcelamento.descricao}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioFiscal;

