import { useState } from 'react';
import { X, Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react';

interface ExportarDadosProps {
	onClose: () => void;
	dados: any[];
}

const ExportarDados: React.FC<ExportarDadosProps> = ({ onClose, dados }) => {
	const [formato, setFormato] = useState<'pdf' | 'excel' | 'json'>('excel');
	const [incluirFiltros, setIncluirFiltros] = useState(true);

	const exportarDados = () => {
		if (formato === 'json') {
			const dataStr = JSON.stringify(dados, null, 2);
			const dataBlob = new Blob([dataStr], { type: 'application/json' });
			const url = URL.createObjectURL(dataBlob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `obrigacoes-${new Date().toISOString().split('T')[0]}.json`;
			link.click();
			URL.revokeObjectURL(url);
			alert('✓ Dados exportados em JSON com sucesso!');
		} else if (formato === 'excel') {
			const cabecalhos = Object.keys(dados[0] || {});
			const linhas = [
				cabecalhos.join(','),
				...dados.map(row => cabecalhos.map(h => `"${row[h] || ''}"`).join(','))
			].join('\n');

			const BOM = '\uFEFF';
			const blob = new Blob([BOM + linhas], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `obrigacoes-${new Date().toISOString().split('T')[0]}.csv`;
			link.click();
			URL.revokeObjectURL(url);
			alert('✓ Dados exportados em CSV (compatível com Excel) com sucesso!');
		} else {
			alert('Exportação PDF em desenvolvimento. Por favor, use CSV/Excel por enquanto.');
		}
		onClose();
	};

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md animate-scaleIn">
				<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
							<Download size={24} className="text-green-600 dark:text-green-400" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900 dark:text-white">Exportar Dados</h2>
							<p className="text-sm text-gray-500 dark:text-gray-400">Escolha o formato</p>
						</div>
					</div>
					<button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
						<X size={20} className="text-gray-500 dark:text-gray-400" />
					</button>
				</div>

				<div className="p-6 space-y-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
							Formato de Exportação
						</label>
						<div className="grid grid-cols-3 gap-3">
							<button
								type="button"
								onClick={() => setFormato('excel')}
								className={`p-4 rounded-lg border-2 transition-all ${
									formato === 'excel'
										? 'border-green-600 bg-green-50 dark:bg-green-900/20'
										: 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
								}`}
							>
								<FileSpreadsheet size={24} className="mx-auto mb-2 text-green-600 dark:text-green-400" />
								<span className="text-sm font-medium text-gray-900 dark:text-white">CSV/Excel</span>
							</button>
							<button
								type="button"
								onClick={() => setFormato('pdf')}
								className={`p-4 rounded-lg border-2 transition-all ${
									formato === 'pdf'
										? 'border-red-600 bg-red-50 dark:bg-red-900/20'
										: 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
								}`}
							>
								<FileText size={24} className="mx-auto mb-2 text-red-600 dark:text-red-400" />
								<span className="text-sm font-medium text-gray-900 dark:text-white">PDF</span>
							</button>
							<button
								type="button"
								onClick={() => setFormato('json')}
								className={`p-4 rounded-lg border-2 transition-all ${
									formato === 'json'
										? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
										: 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
								}`}
							>
								<FileJson size={24} className="mx-auto mb-2 text-blue-600 dark:text-blue-400" />
								<span className="text-sm font-medium text-gray-900 dark:text-white">JSON</span>
							</button>
						</div>
					</div>

					<div className="flex items-center">
						<input
							type="checkbox"
							checked={incluirFiltros}
							onChange={(e) => setIncluirFiltros(e.target.checked)}
							className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
						/>
						<label className="ml-3 text-sm text-gray-700 dark:text-gray-300">
							Incluir filtros aplicados
						</label>
					</div>

					<div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
						<button type="button" onClick={onClose} className="btn-secondary px-6 py-2.5">
							Cancelar
						</button>
						<button onClick={exportarDados} className="btn-primary px-6 py-2.5 inline-flex items-center gap-2">
							<Download size={18} />
							Exportar
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ExportarDados;

