import { useState } from 'react';
import { X, Calendar, User, Users, Info } from 'lucide-react';

interface Imposto {
	id?: string;
	titulo: string;
	descricao?: string;
	dataVencimento?: string;
	tipo: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | 'TRABALHISTA' | 'PREVIDENCIARIA' | 'OUTRO';
	status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO';
	cliente?: string;
	responsavel?: string;
	recorrencia: 'Mensal' | 'Anual' | 'Personalizado';
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
	const [formData, setFormData] = useState<Partial<Imposto>>({
		titulo: imposto?.titulo || '',
		descricao: imposto?.descricao || '',
		dataVencimento: imposto?.dataVencimento || '',
		tipo: imposto?.tipo || 'FEDERAL',
		status: imposto?.status || 'PENDENTE',
		cliente: imposto?.cliente || '',
		responsavel: imposto?.responsavel || '',
		recorrencia: imposto?.recorrencia || 'Mensal',
		ajusteDataUtil: imposto?.ajusteDataUtil ?? true,
		preferenciaAjuste: imposto?.preferenciaAjuste || 'proximo'
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		// Garantir que todos os campos necessários estão presentes
		const dadosCompletos = {
			...formData,
			dataVencimentoOriginal: formData.dataVencimento,
			ajusteDataUtil: formData.ajusteDataUtil ?? true,
			preferenciaAjuste: formData.preferenciaAjuste || 'proximo'
		};
		
		await onSave(dadosCompletos);
	};

	const handleChange = (field: string, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }));
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

						{/* Recorrência */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								🔄 Recorrência *
							</label>
							<select
								value={formData.recorrencia}
								onChange={(e) => handleChange('recorrencia', e.target.value)}
								className="input-primary"
								required
							>
								<option value="Mensal">📅 Mensal</option>
								<option value="Anual">🗓️ Anual</option>
								<option value="Personalizado">⚙️ Personalizado</option>
							</select>
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
										<option value="proximo">Dia útil seguinte (segunda)</option>
										<option value="anterior">Dia útil anterior (sexta)</option>
									</select>
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

