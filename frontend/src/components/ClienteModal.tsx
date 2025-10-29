import { useState } from 'react';
import { X } from 'lucide-react';

type RegimeTributario = 'MEI' | 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real';

interface Cliente {
	id?: string;
	nome: string;
	cnpj: string;
	email?: string;
	telefone?: string;
	ativo: boolean;
	regimeTributario?: RegimeTributario;
}

interface ClienteModalProps {
	cliente?: Cliente;
	onSave: (dados: Partial<Cliente>) => Promise<void> | void;
	onClose: () => void;
}

const ClienteModal: React.FC<ClienteModalProps> = ({ cliente, onSave, onClose }) => {
	const [formData, setFormData] = useState<Partial<Cliente>>({
		nome: cliente?.nome || '',
		cnpj: cliente?.cnpj || '',
		email: cliente?.email || '',
		telefone: cliente?.telefone || '',
		ativo: cliente?.ativo ?? true,
		regimeTributario: cliente?.regimeTributario || 'Simples Nacional'
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
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-t-xl">
					<h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
						{cliente ? '✏️ Editar Cliente' : '✨ Novo Cliente'}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all hover:scale-110 hover:rotate-90"
						aria-label="Fechar"
					>
						<X size={24} />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-6 space-y-6">
					{/* Nome */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Nome da Empresa *
						</label>
						<input
							type="text"
							value={formData.nome}
							onChange={(e) => handleChange('nome', e.target.value)}
							className="input-primary w-full"
							placeholder="Digite o nome da empresa"
							required
						/>
					</div>

					{/* CNPJ */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							CNPJ *
						</label>
						<input
							type="text"
							value={formData.cnpj}
							onChange={(e) => {
								const value = e.target.value.replace(/\D/g, '');
								const formatted = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
								handleChange('cnpj', formatted);
							}}
							className="input-primary w-full"
							placeholder="00.000.000/0000-00"
							maxLength={18}
							required
						/>
					</div>

					{/* Regime Tributário */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Regime Tributário *
						</label>
						<select
							value={formData.regimeTributario}
							onChange={(e) => handleChange('regimeTributario', e.target.value)}
							className="input-primary w-full"
							required
						>
							<option value="MEI">MEI (Microempreendedor Individual)</option>
							<option value="Simples Nacional">Simples Nacional</option>
							<option value="Lucro Presumido">Lucro Presumido</option>
							<option value="Lucro Real">Lucro Real</option>
						</select>
					</div>

					{/* Grid para email e telefone */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Email */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								E-mail
							</label>
							<input
								type="email"
								value={formData.email}
								onChange={(e) => handleChange('email', e.target.value)}
								className="input-primary w-full"
								placeholder="contato@empresa.com"
							/>
						</div>

						{/* Telefone */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Telefone
							</label>
							<input
								type="text"
								value={formData.telefone}
								onChange={(e) => {
									const value = e.target.value.replace(/\D/g, '');
									const formatted = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
									handleChange('telefone', formatted);
								}}
								className="input-primary w-full"
								placeholder="(00) 00000-0000"
								maxLength={15}
							/>
						</div>
					</div>

					{/* Status */}
					<div>
						<label className="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								checked={formData.ativo}
								onChange={(e) => handleChange('ativo', e.target.checked)}
								className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Cliente Ativo
							</span>
						</label>
					</div>

					{/* Actions */}
					<div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
						<button
							type="button"
							onClick={onClose}
							className="btn-secondary px-6 py-2.5"
						>
							Cancelar
						</button>
						<button
							type="submit"
							className="btn-primary px-6 py-2.5"
						>
							{cliente ? 'Salvar Alterações' : 'Cadastrar Cliente'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ClienteModal;

