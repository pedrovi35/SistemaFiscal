import { useState } from 'react';
import { X, Settings, Bell, Moon, Sun, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ConfiguracoesProps {
	onClose: () => void;
}

const Configuracoes: React.FC<ConfiguracoesProps> = ({ onClose }) => {
	const { theme, toggleTheme } = useTheme();
	const [configs, setConfigs] = useState({
		notificacoes: true,
		email: true,
		sonoro: false,
		autoSave: true
	});

	const salvarConfiguracoes = () => {
		localStorage.setItem('configuracoes', JSON.stringify(configs));
		alert('✓ Configurações salvas com sucesso!');
		onClose();
	};

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
				<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
							<Settings size={24} className="text-gray-600 dark:text-gray-400" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900 dark:text-white">Configurações</h2>
							<p className="text-sm text-gray-500 dark:text-gray-400">Personalize o sistema</p>
						</div>
					</div>
					<button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
						<X size={20} className="text-gray-500 dark:text-gray-400" />
					</button>
				</div>

				<div className="p-6 space-y-6">
					{/* Aparência */}
					<div>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
							<Moon size={20} className="text-gray-600 dark:text-gray-400" />
							Aparência
						</h3>
						<div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-gray-900 dark:text-white">Modo Escuro</p>
									<p className="text-sm text-gray-600 dark:text-gray-400">Alternar entre tema claro e escuro</p>
								</div>
								<button
									onClick={toggleTheme}
									className={`p-3 rounded-lg transition-all ${theme === 'dark' ? 'bg-purple-600' : 'bg-gray-300'}`}
								>
									{theme === 'dark' ? (
										<Moon size={20} className="text-white" />
									) : (
										<Sun size={20} className="text-gray-600" />
									)}
								</button>
							</div>
						</div>
					</div>

					{/* Notificações */}
					<div>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
							<Bell size={20} className="text-gray-600 dark:text-gray-400" />
							Notificações
						</h3>
						<div className="space-y-3">
							{[{
								id: 'notificacoes',
								label: 'Notificações Push',
								description: 'Receber notificações em tempo real'
							}, {
								id: 'email',
								label: 'Notificações por Email',
								description: 'Enviar alertas por email'
							}, {
								id: 'sonoro',
								label: 'Alerta Sonoro',
								description: 'Tocar som nas notificações'
							}, {
								id: 'autoSave',
								label: 'Salvamento Automático',
								description: 'Salvar alterações automaticamente'
							}].map((item) => (
								<div key={item.id} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
									<div>
										<p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
									</div>
									<button
										onClick={() => setConfigs(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))}
										className={`p-1 w-12 rounded-full transition-all ${
											configs[item.id as keyof typeof configs] ? 'bg-green-500' : 'bg-gray-300'
										}`}
									>
										<div className={`w-5 h-5 rounded-full bg-white transition-transform ${
											configs[item.id as keyof typeof configs] ? 'translate-x-6' : 'translate-x-0'
										}`} />
									</button>
								</div>
							))}
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
						<button type="button" onClick={onClose} className="btn-secondary px-6 py-2.5">
							Cancelar
						</button>
						<button onClick={salvarConfiguracoes} className="btn-primary px-6 py-2.5 inline-flex items-center gap-2">
							<CheckCircle2 size={18} />
							Salvar Configurações
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Configuracoes;

