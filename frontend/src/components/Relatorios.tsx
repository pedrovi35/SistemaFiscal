import { useState } from 'react';
import { BarChart3, TrendingUp, FileText, Download, Calendar } from 'lucide-react';

const Relatorios: React.FC = () => {
	const [periodo, setPeriodo] = useState<'mensal' | 'anual'>('mensal');

	const estatisticas = {
		mensal: {
			totalObrigacoes: 45,
			concluidas: 38,
			emAndamento: 5,
			atrasadas: 2,
			taxaConclusao: 84.4
		},
		anual: {
			totalObrigacoes: 540,
			concluidas: 456,
			emAndamento: 60,
			atrasadas: 24,
			taxaConclusao: 84.4
		}
	};

	const stats = estatisticas[periodo];

	return (
		<div className="card p-6">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h2>
				<button className="btn-primary inline-flex items-center gap-2">
					<Download size={16} />
					Exportar Relatório
				</button>
			</div>

			{/* Seleção de Período */}
			<div className="mb-6 flex gap-3">
				<button
					onClick={() => setPeriodo('mensal')}
					className={`px-4 py-2 rounded-lg font-medium transition-all ${
						periodo === 'mensal'
							? 'bg-blue-600 text-white shadow-lg'
							: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
					}`}
				>
					<Calendar size={16} className="inline mr-2" />
					Mensal
				</button>
				<button
					onClick={() => setPeriodo('anual')}
					className={`px-4 py-2 rounded-lg font-medium transition-all ${
						periodo === 'anual'
							? 'bg-blue-600 text-white shadow-lg'
							: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
					}`}
				>
					<FileText size={16} className="inline mr-2" />
					Anual
				</button>
			</div>

			{/* Cards de Estatísticas */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				<div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
					<div className="flex items-center justify-between mb-3">
						<div className="p-3 bg-blue-500 rounded-lg">
							<FileText size={24} className="text-white" />
						</div>
						<span className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.totalObrigacoes}</span>
					</div>
					<p className="text-sm font-medium text-blue-900 dark:text-blue-300">Total de Obrigações</p>
				</div>

				<div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 p-6 rounded-xl border border-green-200 dark:border-green-800">
					<div className="flex items-center justify-between mb-3">
						<div className="p-3 bg-green-500 rounded-lg">
							<TrendingUp size={24} className="text-white" />
						</div>
						<span className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.concluidas}</span>
					</div>
					<p className="text-sm font-medium text-green-900 dark:text-green-300">Concluídas</p>
				</div>

				<div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/10 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
					<div className="flex items-center justify-between mb-3">
						<div className="p-3 bg-yellow-500 rounded-lg">
							<BarChart3 size={24} className="text-white" />
						</div>
						<span className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.emAndamento}</span>
					</div>
					<p className="text-sm font-medium text-yellow-900 dark:text-yellow-300">Em Andamento</p>
				</div>

				<div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 p-6 rounded-xl border border-red-200 dark:border-red-800">
					<div className="flex items-center justify-between mb-3">
						<div className="p-3 bg-red-500 rounded-lg">
							<FileText size={24} className="text-white" />
						</div>
						<span className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.atrasadas}</span>
					</div>
					<p className="text-sm font-medium text-red-900 dark:text-red-300">Atrasadas</p>
				</div>
			</div>

			{/* Taxa de Conclusão */}
			<div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
				<div className="flex items-center gap-4">
					<div className="p-4 bg-purple-500 rounded-xl">
						<TrendingUp size={32} className="text-white" />
					</div>
					<div>
						<h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-1">Taxa de Conclusão</h3>
						<p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{stats.taxaConclusao}%</p>
						<p className="text-sm text-purple-600 dark:text-purple-400">Taxa de conclusão no prazo</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Relatorios;

