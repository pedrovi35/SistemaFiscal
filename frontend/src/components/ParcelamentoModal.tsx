import { useState } from 'react';
import { X, Calendar, DollarSign, User, Users, FileText } from 'lucide-react';
import { Parcelamento as ParcelamentoModel } from '../types';

interface ParcelamentoModalProps {
	parcelamento?: ParcelamentoModel;
	onSave: (dados: Partial<ParcelamentoModel>) => Promise<void> | void;
	onClose: () => void;
	clientes?: Array<{ id: string; nome: string }>;
}

const ParcelamentoModal: React.FC<ParcelamentoModalProps> = ({ parcelamento, onSave, onClose, clientes = [] }) => {
	const [formData, setFormData] = useState<Partial<ParcelamentoModel>>({
		titulo: parcelamento?.titulo || '',
		descricao: parcelamento?.descricao || '',
		imposto: parcelamento?.imposto || '',
		parcelaAtual: parcelamento?.parcelaAtual || 1,
		totalParcelas: parcelamento?.totalParcelas || 1,
		valorParcela: parcelamento?.valorParcela || 0,
		dataVencimento: parcelamento?.dataVencimento || '',
		status: parcelamento?.status || 'PENDENTE',
		cliente: parcelamento?.cliente || '',
		responsavel: parcelamento?.responsavel || ''
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
			<div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-t-xl sticky top-0 z-10">
					<h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
						{parcelamento ? '✏️ Editar Parcelamento' : '✨ Novo Parcelamento'}
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
							Título do Parcelamento *
						</label>
						<input
							type="text"
							value={formData.titulo}
							onChange={(e) => handleChange('titulo', e.target.value)}
							className="input-primary"
							placeholder="Ex: Parcelamento IRPJ - 2024"
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
							placeholder="Detalhes sobre o parcelamento..."
						/>
					</div>

					{/* Imposto e Data Vencimento */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								<FileText className="inline mr-1" size={16} />
								Imposto *
							</label>
							<input
								type="text"
								value={formData.imposto}
								onChange={(e) => handleChange('imposto', e.target.value)}
								className="input-primary"
								placeholder="Ex: IRPJ"
								required
							/>
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

					{/* Parcelas */}
					<div className="grid grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Parcela Atual *
							</label>
							<input
								type="number"
								value={formData.parcelaAtual}
								onChange={(e) => handleChange('parcelaAtual', parseInt(e.target.value))}
								className="input-primary"
								min="1"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Total de Parcelas *
							</label>
							<input
								type="number"
								value={formData.totalParcelas}
								onChange={(e) => handleChange('totalParcelas', parseInt(e.target.value))}
								className="input-primary"
								min="1"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								<DollarSign className="inline mr-1" size={16} />
								Valor da Parcela (R$) *
							</label>
							<input
								type="number"
								value={formData.valorParcela}
								onChange={(e) => handleChange('valorParcela', parseFloat(e.target.value))}
								className="input-primary"
								step="0.01"
								min="0"
								required
							/>
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

					<div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
						<button type="button" onClick={onClose} className="btn-secondary px-6 py-2.5">
							Cancelar
						</button>
						<button type="submit" className="btn-primary px-6 py-2.5">
							{parcelamento ? 'Salvar Alterações' : 'Cadastrar Parcelamento'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ParcelamentoModal;

