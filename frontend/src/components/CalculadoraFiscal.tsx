import { useState } from 'react';
import { X, Calculator, TrendingUp, Clock, DollarSign } from 'lucide-react';

interface CalculadoraFiscalProps {
	onClose: () => void;
}

const CalculadoraFiscal: React.FC<CalculadoraFiscalProps> = ({ onClose }) => {
	const [tipoCalculo, setTipoCalculo] = useState<'multa' | 'juros' | 'prazo'>('multa');
	const [valor, setValor] = useState('');
	const [percentual, setPercentual] = useState('');
	const [resultado, setResultado] = useState<number | null>(null);

	const calcular = () => {
		const valorNum = parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.'));
		const percentualNum = parseFloat(percentual);

		if (!valorNum || !percentualNum) {
			alert('Preencha todos os campos!');
			return;
		}

		if (tipoCalculo === 'multa') {
			setResultado(valorNum * (percentualNum / 100));
		} else if (tipoCalculo === 'juros') {
			setResultado(valorNum * (percentualNum / 100));
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl animate-scaleIn">
				<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
							<Calculator size={24} className="text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900 dark:text-white">Calculadora Fiscal</h2>
							<p className="text-sm text-gray-500 dark:text-gray-400">Calcule prazos e multas fiscais</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						<X size={20} className="text-gray-500 dark:text-gray-400" />
					</button>
				</div>

				<div className="p-6 space-y-6">
					{/* Tipo de Cálculo */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
							Tipo de Cálculo
						</label>
						<div className="grid grid-cols-3 gap-3">
							<button
								onClick={() => setTipoCalculo('multa')}
								className={`px-4 py-3 rounded-lg border-2 transition-all ${
									tipoCalculo === 'multa'
										? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
										: 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
								}`}
							>
								<Clock size={20} className="mx-auto mb-2 text-gray-600 dark:text-gray-400" />
								<span className="text-sm font-medium text-gray-900 dark:text-white">Multa</span>
							</button>
							<button
								onClick={() => setTipoCalculo('juros')}
								className={`px-4 py-3 rounded-lg border-2 transition-all ${
									tipoCalculo === 'juros'
										? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
										: 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
								}`}
							>
								<TrendingUp size={20} className="mx-auto mb-2 text-gray-600 dark:text-gray-400" />
								<span className="text-sm font-medium text-gray-900 dark:text-white">Juros</span>
							</button>
							<button
								onClick={() => setTipoCalculo('prazo')}
								className={`px-4 py-3 rounded-lg border-2 transition-all ${
									tipoCalculo === 'prazo'
										? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
										: 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
								}`}
							>
								<Clock size={20} className="mx-auto mb-2 text-gray-600 dark:text-gray-400" />
								<span className="text-sm font-medium text-gray-900 dark:text-white">Prazo</span>
							</button>
						</div>
					</div>

					{/* Campos de Input */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Valor Base (R$)
							</label>
							<input
								type="text"
								value={valor}
								onChange={(e) => {
									const valor = e.target.value.replace(/[^\d,]/g, '');
									const formatted = valor.replace(/^(\d+)(\d{2})$/, 'R$ $1,$2');
									setValor(formatted);
								}}
								className="input-primary w-full"
								placeholder="0,00"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								{tipoCalculo === 'multa' ? 'Percentual da Multa (%)' : 'Taxa de Juros (%)'}
							</label>
							<input
								type="number"
								value={percentual}
								onChange={(e) => setPercentual(e.target.value)}
								className="input-primary w-full"
								placeholder="0"
								step="0.01"
							/>
						</div>
					</div>

					{/* Botão Calcular */}
					<button
						onClick={calcular}
						className="w-full btn-primary py-3"
					>
						Calcular
					</button>

					{/* Resultado */}
					{resultado !== null && (
						<div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 animate-fadeIn">
							<div className="flex items-center gap-3 mb-3">
								<DollarSign size={24} className="text-green-600 dark:text-green-400" />
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resultado</h3>
							</div>
							<p className="text-3xl font-bold text-green-700 dark:text-green-300">
								R$ {resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default CalculadoraFiscal;

