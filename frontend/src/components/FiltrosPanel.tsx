import React from 'react';
import { Filter, X } from 'lucide-react';
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

const FiltrosPanel: React.FC<FiltrosPanelProps> = ({
  filtros,
  onFiltrosChange,
  clientes,
  empresas,
  responsaveis
}) => {
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

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Filter size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros Avançados</h3>
        </div>
        {temFiltrosAtivos && (
          <button
            onClick={limparFiltros}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 hover:scale-105 transition-transform"
          >
            <X size={16} />
            Limpar Filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Empresa
          </label>
          <select
            value={filtros.empresa || ''}
            onChange={(e) => handleChange('empresa', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">Todas</option>
            {empresas.map(empresa => (
              <option key={empresa} value={empresa}>{empresa}</option>
            ))}
          </select>
        </div>

        {/* Responsável */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Responsável
          </label>
          <select
            value={filtros.responsavel || ''}
            onChange={(e) => handleChange('responsavel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">Todos</option>
            {responsaveis.map(resp => (
              <option key={resp} value={resp}>{resp}</option>
            ))}
          </select>
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo
          </label>
          <select
            value={filtros.tipo || ''}
            onChange={(e) => handleChange('tipo', e.target.value as TipoObrigacao)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(NomesTipoObrigacao).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filtros.status || ''}
            onChange={(e) => handleChange('status', e.target.value as StatusObrigacao)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(NomesStatusObrigacao).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FiltrosPanel;

