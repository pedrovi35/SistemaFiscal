import { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ImportarDadosProps {
	onClose: () => void;
	onImportComplete?: (dados: any[]) => void;
}

const ImportarDados: React.FC<ImportarDadosProps> = ({ onClose, onImportComplete }) => {
	const [arquivo, setArquivo] = useState<File | null>(null);
	const [mensagem, setMensagem] = useState({ tipo: 'info' as 'info' | 'sucesso' | 'erro', texto: '' });

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.type === 'application/json' || file.name.endsWith('.json')) {
				setArquivo(file);
				setMensagem({ tipo: 'info', texto: `Arquivo selecionado: ${file.name}` });
			} else if (file.name.endsWith('.csv')) {
				setArquivo(file);
				setMensagem({ tipo: 'info', texto: `Arquivo selecionado: ${file.name}` });
			} else {
				setMensagem({ tipo: 'erro', texto: 'Formato não suportado. Use JSON ou CSV.' });
			}
		}
	};

	const importarDados = async () => {
		if (!arquivo) {
			setMensagem({ tipo: 'erro', texto: 'Selecione um arquivo primeiro!' });
			return;
		}

		try {
			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const content = e.target?.result as string;
					let dados;

					if (arquivo.name.endsWith('.json')) {
						dados = JSON.parse(content);
						setMensagem({ tipo: 'sucesso', texto: `✓ Importados ${Array.isArray(dados) ? dados.length : 0} registros!` });
					} else if (arquivo.name.endsWith('.csv')) {
						const linhas = content.split('\n').filter(l => l.trim());
						const cabecalhos = linhas[0].split(',').map(h => h.replace(/"/g, ''));
						dados = linhas.slice(1).map(linha => {
							const valores = linha.split(',');
							const obj: any = {};
							cabecalhos.forEach((h, i) => {
								obj[h] = valores[i]?.replace(/"/g, '') || '';
							});
							return obj;
						});
						setMensagem({ tipo: 'sucesso', texto: `✓ Importados ${dados.length} registros!` });
					}

					if (dados && onImportComplete) {
						onImportComplete(dados);
					}

					setTimeout(() => onClose(), 2000);
				} catch (error) {
					setMensagem({ tipo: 'erro', texto: 'Erro ao processar arquivo. Verifique o formato.' });
				}
			};
			reader.readAsText(arquivo);
		} catch (error) {
			setMensagem({ tipo: 'erro', texto: 'Erro ao ler arquivo' });
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md animate-scaleIn">
				<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
							<Upload size={24} className="text-purple-600 dark:text-purple-400" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900 dark:text-white">Importar Dados</h2>
							<p className="text-sm text-gray-500 dark:text-gray-400">JSON ou CSV</p>
						</div>
					</div>
					<button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
						<X size={20} className="text-gray-500 dark:text-gray-400" />
					</button>
				</div>

				<div className="p-6 space-y-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Selecionar Arquivo
						</label>
						<div className="relative">
							<input
								type="file"
								accept=".json,.csv"
								onChange={handleFileChange}
								className="hidden"
								id="file-input"
							/>
							<label
								htmlFor="file-input"
								className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
							>
								<Upload size={32} className="text-gray-400 dark:text-gray-500 mb-2" />
								<span className="text-sm text-gray-600 dark:text-gray-400">
									Clique para selecionar ou arraste aqui
								</span>
								<span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
									JSON ou CSV
								</span>
							</label>
						</div>
					</div>

					{mensagem.texto && (
						<div
							className={`p-4 rounded-lg border flex items-center gap-3 animate-fadeIn ${
								mensagem.tipo === 'sucesso'
									? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
									: mensagem.tipo === 'erro'
									? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
									: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
							}`}
						>
							{mensagem.tipo === 'sucesso' ? (
								<CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
							) : mensagem.tipo === 'erro' ? (
								<AlertCircle size={20} className="text-red-600 dark:text-red-400" />
							) : (
								<FileText size={20} className="text-blue-600 dark:text-blue-400" />
							)}
							<span className={`text-sm font-medium ${
								mensagem.tipo === 'sucesso'
									? 'text-green-700 dark:text-green-300'
									: mensagem.tipo === 'erro'
									? 'text-red-700 dark:text-red-300'
									: 'text-blue-700 dark:text-blue-300'
							}`}>
								{mensagem.texto}
							</span>
						</div>
					)}

					<div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
						<button type="button" onClick={onClose} className="btn-secondary px-6 py-2.5">
							Cancelar
						</button>
						<button onClick={importarDados} className="btn-primary px-6 py-2.5 inline-flex items-center gap-2">
							<Upload size={18} />
							Importar
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ImportarDados;

