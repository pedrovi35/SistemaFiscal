import { useState } from 'react';
import { X, Calendar, User, Users, Info } from 'lucide-react';
import { TipoRecorrencia, NomesTipoRecorrencia, Recorrencia } from '../types';

interface Imposto {
	id?: string;
	titulo: string;
	descricao?: string;
	dataVencimento?: string;
	tipo: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | 'TRABALHISTA' | 'PREVIDENCIARIA' | 'OUTRO';
	status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO';
	cliente?: string;
	responsavel?: string;
	recorrencia?: Recorrencia;
	ajusteDataUtil?: boolean;
	preferenciaAjuste?: 'proximo' | 'anterior';
}

interface ImpostoModalProps {
	imposto?: Imposto;
	onSave: (dados: Partial<Imposto>) => Promise<void> | void;
	onClose: () => void;
	clientes?: Array<{ id: string; nome: string }>;
}

const ImpostoModal: React.FC<ImpostoModalProps> = ({ imposto, onSave, onClose, clientes = [] }) => {
	// Função helper para converter data ISO para formato yyyy-MM-dd
	const formatarDataParaInput = (data: string | undefined): string => {
		if (!data) return '';
		// Se já está no formato correto (yyyy-MM-dd), retorna
		if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
		// Se está no formato ISO (com hora), extrai apenas a data
		return data.split('T')[0];
	};

	const [mostrarRecorrencia, setMostrarRecorrencia] = useState(!!imposto?.recorrencia);
	const [recorrencia, setRecorrencia] = useState<Partial<Recorrencia>>(
		imposto?.recorrencia || {
			tipo: TipoRecorrencia.MENSAL,
			ativo: true
		}
	);
	
	const [formData, setFormData] = useState<Partial<Imposto>>({
		titulo: imposto?.titulo || '',
		descricao: imposto?.descricao || '',
		dataVencimento: formatarDataParaInput(imposto?.dataVencimento) || '',
		tipo: imposto?.tipo || 'FEDERAL',
		status: imposto?.status || 'PENDENTE',
		cliente: imposto?.cliente || '',
		responsavel: imposto?.responsavel || '',
		ajusteDataUtil: imposto?.ajusteDataUtil ?? true,
		preferenciaAjuste: imposto?.preferenciaAjuste || 'proximo'
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		// Garantir que as datas estão no formato correto yyyy-MM-dd
		const dataVencimentoFormatada = formatarDataParaInput(formData.dataVencimento);
		
		// Se tem recorrência, extrair o dia da data de vencimento automaticamente
		let recorrenciaFinal = mostrarRecorrencia ? { ...recorrencia } : undefined;
		if (recorrenciaFinal && dataVencimentoFormatada) {
			const dia = new Date(dataVencimentoFormatada + 'T00:00:00').getDate();
			recorrenciaFinal.diaDoMes = dia;
		}
		
		// Garantir que todos os campos necessários estão presentes
		const dadosCompletos = {
			...formData,
			dataVencimento: dataVencimentoFormatada,
			dataVencimentoOriginal: dataVencimentoFormatada,
			ajusteDataUtil: formData.ajusteDataUtil ?? true,
			preferenciaAjuste: formData.preferenciaAjuste || 'proximo',
			recorrencia: recorrenciaFinal as Recorrencia | undefined
		};
		
		await onSave(dadosCompletos);
	};

	const handleChange = (field: string, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }));
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
						{imposto ? '✏️ Editar Imposto' : '✨ Novo Imposto'}
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
					<form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
					{/* Seção: Informações Básicas */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
							<div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
								<Info size={18} className="text-blue-600 dark:text-blue-400" />
							</div>
							Informações Básicas
						</h3>
						
						{/* Título */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Nome do Imposto *
							</label>
							<input
								type="text"
								value={formData.titulo}
								onChange={(e) => handleChange('titulo', e.target.value)}
								className="input-primary"
								placeholder="Ex: IRPJ, ISS, PIS/COFINS"
								required
							/>
						</div>

						{/* Descrição */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Descrição
							</label>
							<textarea
								value={formData.descricao}
								onChange={(e) => handleChange('descricao', e.target.value)}
								rows={3}
								className="input-primary"
								placeholder="Detalhes sobre o imposto..."
							/>
						</div>
					</div>

					{/* Seção: Classificação e Prazos */}
					<div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
							<div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
								<Calendar size={18} className="text-purple-600 dark:text-purple-400" />
							</div>
							Classificação e Prazos
						</h3>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Tipo *
								</label>
								<select
									value={formData.tipo}
									onChange={(e) => handleChange('tipo', e.target.value)}
									className="input-primary"
									required
								>
									<option value="FEDERAL">🏛️ Federal</option>
									<option value="ESTADUAL">🏢 Estadual</option>
									<option value="MUNICIPAL">🏙️ Municipal</option>
									<option value="TRABALHISTA">👷 Trabalhista</option>
									<option value="PREVIDENCIARIA">🏥 Previdenciária</option>
									<option value="OUTRO">📋 Outro</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									<Calendar className="inline mr-1" size={16} />
									Data de Vencimento *
								</label>
								<input
									type="date"
									value={formData.dataVencimento}
									onChange={(e) => handleChange('dataVencimento', e.target.value)}
									className="input-primary"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Status
								</label>
								<select
									value={formData.status}
									onChange={(e) => handleChange('status', e.target.value)}
									className="input-primary"
								>
									<option value="PENDENTE">⏳ Pendente</option>
									<option value="EM_ANDAMENTO">🔄 Em Andamento</option>
									<option value="CONCLUIDO">✅ Concluído</option>
									<option value="ATRASADO">⚠️ Atrasado</option>
								</select>
							</div>
						</div>
					</div>

					{/* Seção: Responsabilidade */}
					<div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
							<div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
								<Users size={18} className="text-green-600 dark:text-green-400" />
							</div>
							Responsabilidade
						</h3>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									<User className="inline mr-1" size={16} />
									Cliente *
								</label>
								<select
									value={formData.cliente}
									onChange={(e) => handleChange('cliente', e.target.value)}
									className="input-primary"
								>
									<option value="">Selecione um cliente</option>
									{clientes.map(cliente => (
										<option key={cliente.id} value={cliente.nome}>{cliente.nome}</option>
									))}
								</select>
								<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
									Identifica qual cliente este imposto pertence
								</p>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									<Users className="inline mr-1" size={16} />
									Responsável
								</label>
								<input
									type="text"
									value={formData.responsavel}
									onChange={(e) => handleChange('responsavel', e.target.value)}
									className="input-primary"
									placeholder="Nome do responsável"
								/>
								<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
									Pessoa responsável pelo acompanhamento
								</p>
							</div>
						</div>

					</div>

					{/* Ajuste de Data */}
					<div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-6">
						<div className="flex items-center">
							<input
								type="checkbox"
								checked={!!formData.ajusteDataUtil}
								onChange={(e) => handleChange('ajusteDataUtil', e.target.checked)}
								className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							/>
							<label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
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
										value={formData.preferenciaAjuste || 'proximo'}
										onChange={(e) => handleChange('preferenciaAjuste', e.target.value)}
										className="input-primary"
									>
										<option value="proximo">⏩ Próximo dia útil (segunda)</option>
										<option value="anterior">⏪ Dia útil anterior (sexta)</option>
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
										<li>O imposto será criado automaticamente na periodicidade definida</li>
										<li>Use o "Dia Fixo de Vencimento" para definir quando o imposto vence</li>
										<li>Use o "Dia de Geração" para definir quando criar o imposto</li>
										<li>Se cair em sábado, domingo ou feriado, ajusta automaticamente</li>
									</ul>
								</div>

								{/* Campos de recorrência */}
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

								{/* Configuração de Dia de Geração */}
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										🗓️ Dia de Geração Automática
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
										💡 O sistema criará o próximo imposto neste dia do mês. O vencimento será sempre no dia <strong>{formData.dataVencimento ? new Date(formData.dataVencimento + 'T00:00:00').getDate() : '___'}</strong> (baseado na Data de Vencimento acima)
									</p>
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
									</div>
								</div>

								{/* Exemplo Visual */}
								<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
									<p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
										✨ Exemplo de Funcionamento:
									</p>
									<div className="text-xs text-green-600 dark:text-green-300 space-y-1">
										{recorrencia.tipo === TipoRecorrencia.MENSAL && (
											<p>• <strong>Mensal:</strong> Cria um novo imposto todo mês, mantendo a mesma data de vencimento</p>
										)}
										{recorrencia.tipo === TipoRecorrencia.TRIMESTRAL && (
											<p>• <strong>Trimestral:</strong> Cria um novo imposto a cada 3 meses</p>
										)}
										{recorrencia.tipo === TipoRecorrencia.SEMESTRAL && (
											<p>• <strong>Semestral:</strong> Cria um novo imposto a cada 6 meses</p>
										)}
										{recorrencia.tipo === TipoRecorrencia.ANUAL && (
											<p>• <strong>Anual:</strong> Cria um novo imposto todo ano</p>
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
					<button type="button" onClick={onClose} className="btn-secondary px-6 py-2.5">
						Cancelar
					</button>
					<button type="button" onClick={handleSubmit} className="btn-primary px-6 py-2.5">
						{imposto ? '💾 Salvar Alterações' : '✨ Cadastrar Imposto'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ImpostoModal;

