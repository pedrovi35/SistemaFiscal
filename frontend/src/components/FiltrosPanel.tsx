import React, { useEffect, useMemo, useState } from 'react';
import { Filter, X, Star, Save, Trash2, Calendar as CalendarIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { 
  FiltroObrigacoes, 
  TipoObrigacao, 
  StatusObrigacao,
  NomesTipoObrigacao,
  NomesStatusObrigacao
} from '../types';

interface FiltrosPanelProps {
  filtros: FiltroObrigacoes;
  onFiltrosChange: (filtros: FiltroObrigacoes) => void;
  clientes: string[];
  empresas: string[];
  responsaveis: string[];
}

type Preset = {
  id: string;
  nome: string;
  filtros: FiltroObrigacoes;
};

const FiltrosPanel: React.FC<FiltrosPanelProps> = ({
  filtros,
  onFiltrosChange,
  clientes,
  empresas,
  responsaveis
}) => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetNome, setPresetNome] = useState('');
  const [aberto, setAberto] = useState(false);

  const handleChange = (campo: keyof FiltroObrigacoes, valor: any) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor || undefined
    });
  };

  const limparFiltros = () => {
    onFiltrosChange({});
  };

  const temFiltrosAtivos = Object.values(filtros).some(v => v !== undefined && v !== '');
  const numFiltrosAtivos = Object.values(filtros).filter(v => v !== undefined && v !== '').length;

  // Abre automaticamente quando algum filtro é aplicado
  useEffect(() => {
    if (temFiltrosAtivos) setAberto(true);
  }, [temFiltrosAtivos]);

  const hojeISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const addDiasISO = (dias: number) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return d.toISOString().slice(0, 10);
  };
  const inicioMesISO = (offsetMeses = 0) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offsetMeses, 1);
    return d.toISOString().slice(0, 10);
  };
  const fimMesISO = (offsetMeses = 0) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offsetMeses + 1, 0);
    return d.toISOString().slice(0, 10);
  };

  const aplicarPeriodo = (inicio?: string, fim?: string) => {
    onFiltrosChange({
      ...filtros,
      dataInicio: inicio,
      dataFim: fim
    });
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('filtros_presets');
      if (raw) setPresets(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('filtros_presets', JSON.stringify(presets));
    } catch {}
  }, [presets]);

  const salvarPreset = () => {
    if (!presetNome.trim()) return;
    const novo: Preset = { id: `${Date.now()}`, nome: presetNome.trim(), filtros };
    setPresets(prev => [...prev, novo]);
    setPresetNome('');
  };

  const aplicarPreset = (id: string) => {
    const p = presets.find(pr => pr.id === id);
    if (p) onFiltrosChange({ ...p.filtros });
  };

  const removerPreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="card p-6">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between mb-4 group"
        aria-expanded={aberto}
        aria-controls="filtros-conteudo"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Filter size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Filtros Avançados
              {numFiltrosAtivos > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  {numFiltrosAtivos} ativos
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Clique para {aberto ? 'recolher' : 'expandir'}
            </p>
          </div>
        </div>
        <div className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200 transition-colors">
          {aberto ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </button>

      {temFiltrosAtivos && (
        <div className="flex justify-end mb-2">
          <button
            onClick={limparFiltros}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 hover:scale-105 transition-transform"
          >
            <X size={16} />
            Limpar Filtros
          </button>
        </div>
      )}

      {/* Conteúdo recolhível */}
      {aberto && (
        <>
      {/* Atalhos estratégicos de período */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <CalendarIcon size={14} /> Períodos rápidos:
        </span>
        <button className="btn-chip" onClick={() => aplicarPeriodo(hojeISO, hojeISO)}>Hoje</button>
        <button className="btn-chip" onClick={() => aplicarPeriodo(hojeISO, addDiasISO(7))}>Próx. 7 dias</button>
        <button className="btn-chip" onClick={() => aplicarPeriodo(hojeISO, addDiasISO(15))}>Próx. 15 dias</button>
        <button className="btn-chip" onClick={() => aplicarPeriodo(hojeISO, addDiasISO(30))}>Próx. 30 dias</button>
        <button className="btn-chip" onClick={() => aplicarPeriodo(inicioMesISO(0), fimMesISO(0))}>Este mês</button>
        <button className="btn-chip" onClick={() => aplicarPeriodo(inicioMesISO(1), fimMesISO(1))}>Próximo mês</button>
      </div>

      {/* Linha de datas e presets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Início</label>
          <input
            type="date"
            value={filtros.dataInicio || ''}
            onChange={(e) => handleChange('dataInicio', e.target.value)}
            className="input-primary text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fim</label>
          <input
            type="date"
            value={filtros.dataFim || ''}
            onChange={(e) => handleChange('dataFim', e.target.value)}
            className="input-primary text-sm"
          />
        </div>

        <div className="lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Star size={14} className="text-yellow-500" /> Presets
          </label>
          <div className="flex gap-2">
            <input
              value={presetNome}
              onChange={(e) => setPresetNome(e.target.value)}
              placeholder="Nome do preset"
              className="input-primary text-sm flex-1"
            />
            <button onClick={salvarPreset} className="btn-secondary inline-flex items-center gap-1">
              <Save size={14} /> Salvar
            </button>
            {presets.length > 0 && (
              <select className="input-primary text-sm w-56" onChange={(e) => e.target.value && aplicarPreset(e.target.value)}>
                <option value="">Aplicar preset...</option>
                {presets.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            )}
            {presets.length > 0 && (
              <button
                onClick={() => presets.length && removerPreset(presets[presets.length - 1].id)}
                className="btn-danger inline-flex items-center gap-1"
                title="Remover último preset"
              >
                <Trash2 size={14} /> Remover
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cliente
          </label>
          <select
            value={filtros.cliente || ''}
            onChange={(e) => handleChange('cliente', e.target.value)}
            className="input-primary text-sm"
          >
            <option value="">Todos</option>
            {clientes.map(cliente => (
              <option key={cliente} value={cliente}>{cliente}</option>
            ))}
          </select>
        </div>

        {/* Empresa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Empresa
          </label>
          <select
            value={filtros.empresa || ''}
            onChange={(e) => handleChange('empresa', e.target.value)}
            className="input-primary text-sm"
          >
            <option value="">Todas</option>
            {empresas.map(empresa => (
              <option key={empresa} value={empresa}>{empresa}</option>
            ))}
          </select>
        </div>

        {/* Responsável */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Responsável
          </label>
          <select
            value={filtros.responsavel || ''}
            onChange={(e) => handleChange('responsavel', e.target.value)}
            className="input-primary text-sm"
          >
            <option value="">Todos</option>
            {responsaveis.map(resp => (
              <option key={resp} value={resp}>{resp}</option>
            ))}
          </select>
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo
          </label>
          <select
            value={filtros.tipo || ''}
            onChange={(e) => handleChange('tipo', e.target.value as TipoObrigacao)}
            className="input-primary text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(NomesTipoObrigacao).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={filtros.status || ''}
            onChange={(e) => handleChange('status', e.target.value as StatusObrigacao)}
            className="input-primary text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(NomesStatusObrigacao).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default FiltrosPanel;

