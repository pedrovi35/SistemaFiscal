import React, { useState } from 'react';
import { X, Calendar, User, Users } from 'lucide-react';
import { 
  Obrigacao, 
  TipoObrigacao, 
  StatusObrigacao, 
  TipoRecorrencia,
  NomesTipoObrigacao,
  NomesStatusObrigacao,
  NomesTipoRecorrencia,
  Recorrencia
} from '../types';

interface ObrigacaoModalProps {
  obrigacao?: Obrigacao;
  dataInicial?: string;
  onSave: (obrigacao: Partial<Obrigacao>) => void;
  onClose: () => void;
  clientes?: Array<{ id: string; nome: string }>;
}

const ObrigacaoModal: React.FC<ObrigacaoModalProps> = ({ 
  obrigacao, 
  dataInicial,
  onSave, 
  onClose,
  clientes = []
}) => {
  // Função helper para converter data ISO para formato yyyy-MM-dd
  const formatarDataParaInput = (data: string | undefined): string => {
    if (!data) return '';
    // Se já está no formato correto (yyyy-MM-dd), retorna
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
    // Se está no formato ISO (com hora), extrai apenas a data
    return data.split('T')[0];
  };

  const [formData, setFormData] = useState<Partial<Obrigacao>>(() => {
    // Valores padrão
    const defaults: Partial<Obrigacao> = {
      titulo: '',
      descricao: '',
      tipo: TipoObrigacao.FEDERAL,
      status: StatusObrigacao.PENDENTE,
      cliente: '',
      empresa: '',
      responsavel: '',
      ajusteDataUtil: true,
      preferenciaAjuste: 'proximo'
    };
    
    // Se há obrigação, mesclar com defaults e formatar datas
    if (obrigacao) {
      return {
        ...defaults,
        ...obrigacao,
        dataVencimento: formatarDataParaInput(obrigacao.dataVencimento),
        dataVencimentoOriginal: formatarDataParaInput(obrigacao.dataVencimentoOriginal)
      };
    }
    
    // Se não há obrigação, usar dataInicial
    return {
      ...defaults,
      dataVencimento: formatarDataParaInput(dataInicial) || ''
    };
  });

  const [mostrarRecorrencia, setMostrarRecorrencia] = useState(!!obrigacao?.recorrencia);
  const [recorrencia, setRecorrencia] = useState<Partial<Recorrencia>>(
    obrigacao?.recorrencia || {
      tipo: TipoRecorrencia.MENSAL,
      ativo: true
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 ObrigacaoModal - Preparando dados para salvar...');
    console.log('📋 Form Data:', formData);
    console.log('🔄 Recorrência?', mostrarRecorrencia, recorrencia);
    
    // Garantir que as datas estão no formato correto yyyy-MM-dd
    const dataVencimentoFormatada = formatarDataParaInput(formData.dataVencimento);
    const dataVencimentoOriginalFormatada = formatarDataParaInput(formData.dataVencimentoOriginal) || dataVencimentoFormatada;
    
    const dados: Partial<Obrigacao> = {
      ...formData,
      dataVencimento: dataVencimentoFormatada,
      dataVencimentoOriginal: dataVencimentoOriginalFormatada,
      recorrencia: mostrarRecorrencia ? recorrencia as Recorrencia : undefined
    };

    console.log('💾 Dados finais a serem salvos:', dados);
    console.log('🎯 Chamando onSave...');
    
    onSave(dados);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleRecorrenciaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRecorrencia(prev => ({
      ...prev,
      [name]: (name === 'intervalo') ? parseInt(value) || undefined : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixo */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-t-xl flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {obrigacao ? '✏️ Editar Obrigação' : '✨ Nova Obrigação'}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-700 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:scale-110 shadow-md hover:shadow-lg"
            title="Fechar (ESC)"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Form - Com Scroll */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit} id="obrigacao-form" className="p-4 sm:p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título *
            </label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
              className="input-primary"
              placeholder="Ex: DARF - Imposto de Renda"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows={3}
              className="input-primary"
              placeholder="Detalhes adicionais sobre a obrigação..."
            />
          </div>

          {/* Data e Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline mr-1" size={16} />
                Data de Vencimento *
              </label>
              <input
                type="date"
                name="dataVencimento"
                value={formData.dataVencimento}
                onChange={handleChange}
                required
                className="input-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo *
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                required
                className="input-primary"
              >
                {Object.entries(NomesTipoObrigacao).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input-primary"
            >
              {Object.entries(NomesStatusObrigacao).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>

          {/* Cliente e Responsável */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="inline mr-1" size={16} />
                Cliente
              </label>
              <select
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                className="input-primary"
              >
                <option value="">Selecione um cliente</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.nome}>{cliente.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Users className="inline mr-1" size={16} />
                Responsável
              </label>
              <input
                type="text"
                name="responsavel"
                value={formData.responsavel}
                onChange={handleChange}
                className="input-primary"
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          {/* Ajuste de Data */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="ajusteDataUtil"
                checked={!!formData.ajusteDataUtil}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Ajustar automaticamente se cair em feriado/fim de semana
              </label>
            </div>

            {formData.ajusteDataUtil && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preferência de Ajuste
                  </label>
                  <select
                    name="preferenciaAjuste"
                    value={formData.preferenciaAjuste || 'proximo'}
                    onChange={handleChange}
                    className="input-primary"
                  >
                    <option value="proximo">Dia útil seguinte (segunda)</option>
                    <option value="anterior">Dia útil anterior (sexta)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Recorrência Automática */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={mostrarRecorrencia}
                onChange={(e) => setMostrarRecorrencia(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                🔄 Configurar Recorrência Automática
              </label>
            </div>

            {mostrarRecorrencia && (
              <div className="space-y-6 pl-6 bg-blue-50 dark:bg-gray-900/50 rounded-lg p-4">
                {/* Informação sobre recorrência */}
                <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="font-semibold mb-1">ℹ️ Como funciona:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                    <li>A obrigação será criada automaticamente na periodicidade definida</li>
                    <li>Use o "Dia Fixo de Vencimento" para definir quando a obrigação vence</li>
                    <li>Use o "Dia de Geração" para definir quando criar a obrigação</li>
                    <li>Se cair em sábado, domingo ou feriado, ajusta automaticamente</li>
                  </ul>
                </div>

                {/* Tipo de Recorrência e Intervalo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      📅 Periodicidade *
                    </label>
                    <select
                      name="tipo"
                      value={recorrencia.tipo}
                      onChange={handleRecorrenciaChange}
                      className="input-primary"
                    >
                      {Object.entries(NomesTipoRecorrencia).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {recorrencia.tipo === TipoRecorrencia.MENSAL && 'Gera todo mês'}
                      {recorrencia.tipo === TipoRecorrencia.TRIMESTRAL && 'Gera a cada 3 meses'}
                      {recorrencia.tipo === TipoRecorrencia.SEMESTRAL && 'Gera a cada 6 meses'}
                      {recorrencia.tipo === TipoRecorrencia.ANUAL && 'Gera todo ano'}
                    </p>
                  </div>

                  {recorrencia.tipo === TipoRecorrencia.CUSTOMIZADA && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Intervalo (meses)
                      </label>
                      <input
                        type="number"
                        name="intervalo"
                        value={recorrencia.intervalo || ''}
                        onChange={handleRecorrenciaChange}
                        min="1"
                        placeholder="Ex: 4"
                        className="input-primary"
                      />
                    </div>
                  )}
                </div>

                {/* Configurações de Dias */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      📍 Dia Fixo de Vencimento *
                    </label>
                    <input
                      type="number"
                      name="diaDoMes"
                      value={recorrencia.diaDoMes || ''}
                      onChange={handleRecorrenciaChange}
                      min="1"
                      max="31"
                      placeholder="Ex: 20"
                      className="input-primary"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      A obrigação sempre vencerá neste dia
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      🗓️ Dia de Geração
                    </label>
                    <input
                      type="number"
                      name="diaGeracao"
                      value={recorrencia.diaGeracao || 1}
                      onChange={handleRecorrenciaChange}
                      min="1"
                      max="31"
                      placeholder="1"
                      className="input-primary"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Dia do mês que o sistema criará a obrigação
                    </p>
                  </div>
                </div>

                {/* Status de Recorrência */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status Inicial
                    </label>
                    <div className="flex items-center h-10">
                      <input
                        type="checkbox"
                        checked={recorrencia.ativo !== false}
                        onChange={(e) => setRecorrencia(prev => ({ ...prev, ativo: e.target.checked }))}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {recorrencia.ativo !== false ? '✅ Ativa' : '⏸️ Pausada'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Você pode pausar/retomar depois
                    </p>
                  </div>
                </div>

                {/* Exemplo Visual */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                    ✨ Exemplo de Funcionamento:
                  </p>
                  <div className="text-xs text-green-600 dark:text-green-300 space-y-1">
                    {recorrencia.tipo === TipoRecorrencia.MENSAL && (
                      <p>• <strong>Mensal:</strong> Cria uma nova obrigação todo mês, mantendo a mesma data de vencimento</p>
                    )}
                    {recorrencia.tipo === TipoRecorrencia.TRIMESTRAL && (
                      <p>• <strong>Trimestral:</strong> Cria uma nova obrigação a cada 3 meses</p>
                    )}
                    {recorrencia.tipo === TipoRecorrencia.SEMESTRAL && (
                      <p>• <strong>Semestral:</strong> Cria uma nova obrigação a cada 6 meses</p>
                    )}
                    {recorrencia.tipo === TipoRecorrencia.ANUAL && (
                      <p>• <strong>Anual:</strong> Cria uma nova obrigação todo ano</p>
                    )}
                    <p className="text-xs italic mt-2">* Se o dia cair em fim de semana ou feriado, será ajustado automaticamente</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          </form>
        </div>

        {/* Footer - Fixo */}
        <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-6 py-2.5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="obrigacao-form"
            className="btn-primary px-6 py-2.5"
          >
            {obrigacao ? '💾 Salvar Alterações' : '✨ Criar Obrigação'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ObrigacaoModal;

