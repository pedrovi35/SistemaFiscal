import { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, FileText, Download, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Obrigacao, StatusObrigacao } from '../types';
import { obrigacoesApi } from '../services/api';

interface RelatoriosProps {
	obrigacoes?: Obrigacao[];
}

const Relatorios: React.FC<RelatoriosProps> = ({ obrigacoes: obrigacoesProp }) => {
	const [periodo, setPeriodo] = useState<'mensal' | 'anual'>('mensal');
	const [obrigacoes, setObrigacoes] = useState<Obrigacao[]>(obrigacoesProp || []);
	const [loading, setLoading] = useState(!obrigacoesProp);

	// Buscar obrigações se não foram passadas via props
	useEffect(() => {
		if (!obrigacoesProp) {
			carregarObrigacoes();
		}
	}, [obrigacoesProp]);

	const carregarObrigacoes = async () => {
		try {
			setLoading(true);
			const dados = await obrigacoesApi.listarTodas();
			setObrigacoes(dados);
		} catch (error) {
			console.error('Erro ao carregar obrigações:', error);
		} finally {
			setLoading(false);
		}
	};

	// Calcular estatísticas baseadas nas obrigações reais
	const estatisticas = useMemo(() => {
		const hoje = new Date();
		const mesAtual = hoje.getMonth();
		const anoAtual = hoje.getFullYear();
		const inicioMes = new Date(anoAtual, mesAtual, 1);
		const fimMes = new Date(anoAtual, mesAtual + 1, 0);
		const inicioAno = new Date(anoAtual, 0, 1);
		const fimAno = new Date(anoAtual, 11, 31);

		const filtrarPorPeriodo = (o: Obrigacao, inicio: Date, fim: Date) => {
			const dataVenc = new Date(o.dataVencimento);
			return dataVenc >= inicio && dataVenc <= fim;
		};

		const obrigacoesMes = obrigacoes.filter(o => filtrarPorPeriodo(o, inicioMes, fimMes));
		const obrigacoesAno = obrigacoes.filter(o => filtrarPorPeriodo(o, inicioAno, fimAno));

		const calcularStats = (lista: Obrigacao[]) => {
			const total = lista.length;
			const concluidas = lista.filter(o => o.status === StatusObrigacao.CONCLUIDA).length;
			const emAndamento = lista.filter(o => o.status === StatusObrigacao.EM_ANDAMENTO).length;
			const atrasadas = lista.filter(o => o.status === StatusObrigacao.ATRASADA).length;
			const pendentes = lista.filter(o => o.status === StatusObrigacao.PENDENTE).length;
			const taxaConclusao = total > 0 ? ((concluidas / total) * 100).toFixed(1) : '0.0';

			return { totalObrigacoes: total, concluidas, emAndamento, atrasadas, pendentes, taxaConclusao: parseFloat(taxaConclusao) };
		};

		return {
			mensal: calcularStats(obrigacoesMes),
			anual: calcularStats(obrigacoesAno)
		};
	}, [obrigacoes]);

	const stats = estatisticas[periodo];

	if (loading) {
		return (
			<div className="card p-6">
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
				</div>
			</div>
		);
	}

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
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
				{/* Total */}
				<div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
					<div className="flex items-center justify-between mb-3">
						<div className="p-3 bg-blue-500 rounded-lg">
							<FileText size={24} className="text-white" />
						</div>
						<span className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.totalObrigacoes}</span>
					</div>
					<p className="text-sm font-medium text-blue-900 dark:text-blue-300">Total</p>
				</div>

				{/* Concluídas */}
				<div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 p-6 rounded-xl border border-green-200 dark:border-green-800">
					<div className="flex items-center justify-between mb-3">
						<div className="p-3 bg-green-500 rounded-lg">
							<CheckCircle size={24} className="text-white" />
						</div>
						<span className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.concluidas}</span>
					</div>
					<p className="text-sm font-medium text-green-900 dark:text-green-300">✅ Concluídas</p>
				</div>

				{/* Pendentes */}
				<div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-900/10 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
					<div className="flex items-center justify-between mb-3">
						<div className="p-3 bg-gray-500 rounded-lg">
							<Clock size={24} className="text-white" />
						</div>
						<span className="text-2xl font-bold text-gray-700 dark:text-gray-400">{stats.pendentes}</span>
					</div>
					<p className="text-sm font-medium text-gray-900 dark:text-gray-300">⏳ Pendentes</p>
				</div>

				{/* Em Andamento */}
				<div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/10 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
					<div className="flex items-center justify-between mb-3">
						<div className="p-3 bg-yellow-500 rounded-lg">
							<TrendingUp size={24} className="text-white" />
						</div>
						<span className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.emAndamento}</span>
					</div>
					<p className="text-sm font-medium text-yellow-900 dark:text-yellow-300">🔄 Em Andamento</p>
				</div>

				{/* Atrasadas */}
				<div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 p-6 rounded-xl border border-red-200 dark:border-red-800">
					<div className="flex items-center justify-between mb-3">
						<div className="p-3 bg-red-500 rounded-lg">
							<AlertCircle size={24} className="text-white" />
						</div>
						<span className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.atrasadas}</span>
					</div>
					<p className="text-sm font-medium text-red-900 dark:text-red-300">⚠️ Atrasadas</p>
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

