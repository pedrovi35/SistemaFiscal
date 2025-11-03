import { useState } from 'react';
import { X, Calendar, User, Users } from 'lucide-react';
import { Imposto as ImpostoModel } from '../types';

interface ImpostoModalProps {
	imposto?: ImpostoModel;
	onSave: (dados: Partial<ImpostoModel>) => Promise<void> | void;
	onClose: () => void;
	clientes?: Array<{ id: string; nome: string }>;
}

const ImpostoModal: React.FC<ImpostoModalProps> = ({ imposto, onSave, onClose, clientes = [] }) => {
	const [formData, setFormData] = useState<Partial<ImpostoModel>>({
		titulo: imposto?.titulo || '',
		descricao: imposto?.descricao || '',
		dataVencimento: imposto?.dataVencimento || '',
		tipo: imposto?.tipo || 'FEDERAL',
		status: imposto?.status || 'PENDENTE',
		cliente: imposto?.cliente || '',
		responsavel: imposto?.responsavel || '',
		recorrencia: imposto?.recorrencia || 'Mensal'
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onSave(formData);
	};

	const handleChange = (field: string, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl animate-scaleIn">
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-t-xl">
					<h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
						{imposto ? '✏️ Editar Imposto' : '✨ Novo Imposto'}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all hover:scale-110 hover:rotate-90"
					>
						<X size={24} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-6 space-y-6">
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

					{/* Data de Vencimento e Tipo */}
					<div className="grid grid-cols-2 gap-4">
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
								Tipo *
							</label>
							<select
								value={formData.tipo}
								onChange={(e) => handleChange('tipo', e.target.value)}
								className="input-primary"
								required
							>
								<option value="FEDERAL">Federal</option>
								<option value="ESTADUAL">Estadual</option>
								<option value="MUNICIPAL">Municipal</option>
								<option value="TRABALHISTA">Trabalhista</option>
								<option value="PREVIDENCIARIA">Previdenciária</option>
								<option value="OUTRO">Outro</option>
							</select>
						</div>
					</div>

					{/* Status */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Status
						</label>
						<select
							value={formData.status}
							onChange={(e) => handleChange('status', e.target.value)}
							className="input-primary"
						>
							<option value="PENDENTE">Pendente</option>
							<option value="EM_ANDAMENTO">Em Andamento</option>
							<option value="CONCLUIDO">Concluído</option>
							<option value="ATRASADO">Atrasado</option>
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
								value={formData.cliente}
								onChange={(e) => handleChange('cliente', e.target.value)}
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
								value={formData.responsavel}
								onChange={(e) => handleChange('responsavel', e.target.value)}
								className="input-primary"
								placeholder="Nome do responsável"
							/>
						</div>
					</div>

					{/* Recorrência */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Recorrência *
						</label>
						<select
							value={formData.recorrencia}
							onChange={(e) => handleChange('recorrencia', e.target.value)}
							className="input-primary"
							required
						>
							<option value="Mensal">Mensal</option>
							<option value="Anual">Anual</option>
							<option value="Personalizado">Personalizado</option>
						</select>
					</div>

					<div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
						<button type="button" onClick={onClose} className="btn-secondary px-6 py-2.5">
							Cancelar
						</button>
						<button type="submit" className="btn-primary px-6 py-2.5">
							{imposto ? 'Salvar Alterações' : 'Cadastrar Imposto'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ImpostoModal;

