import { useMemo, useState } from 'react';
import { BarChart3, TrendingUp, FileText, Download, Calendar, ClipboardList, Receipt, Layers } from 'lucide-react';
import {
	Obrigacao,
	Imposto,
	Parcelamento,
	StatusObrigacao,
	StatusFinanceiro,
	NomesStatusObrigacao,
	NomesStatusFinanceiro
} from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RelatoriosProps {
	obrigacoes: Obrigacao[];
	impostos: Imposto[];
	parcelamentos: Parcelamento[];
}

const Relatorios: React.FC<RelatoriosProps> = ({ obrigacoes, impostos, parcelamentos }) => {
	const [periodo, setPeriodo] = useState<'mensal' | 'anual'>('mensal');
	const hoje = new Date();
	const mesAtual = hoje.getMonth();
	const anoAtual = hoje.getFullYear();
	const formatadorData = useMemo(() => new Intl.DateTimeFormat('pt-BR'), []);
	const formatadorMoeda = useMemo(() => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }), []);

	const dentroDoPeriodo = (dataString: string) => {
		const data = new Date(dataString);
		if (Number.isNaN(data.getTime())) {
			return false;
		}
		if (periodo === 'mensal') {
			return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
		}
		return data.getFullYear() === anoAtual;
	};

	const ordenarPorData = <T,>(lista: T[], extrairData: (item: T) => string) =>
		[...lista].sort((a, b) => {
			const dataA = new Date(extrairData(a)).getTime();
			const dataB = new Date(extrairData(b)).getTime();
			return dataA - dataB;
		});

	const obrigacoesPeriodo = useMemo(
		() => ordenarPorData(obrigacoes.filter(o => dentroDoPeriodo(o.dataVencimento)), o => o.dataVencimento),
		[obrigacoes, periodo]
	);

	const impostosPeriodo = useMemo(
		() => ordenarPorData(impostos.filter(i => dentroDoPeriodo(i.dataVencimento)), i => i.dataVencimento),
		[impostos, periodo]
	);

	const parcelamentosPeriodo = useMemo(
		() => ordenarPorData(parcelamentos.filter(p => dentroDoPeriodo(p.dataVencimento)), p => p.dataVencimento),
		[parcelamentos, periodo]
	);

	const stats = useMemo(() => {
		const total = obrigacoesPeriodo.length;
		const concluidas = obrigacoesPeriodo.filter(o => o.status === StatusObrigacao.CONCLUIDA).length;
		const emAndamento = obrigacoesPeriodo.filter(o => o.status === StatusObrigacao.EM_ANDAMENTO).length;
		const pendentes = obrigacoesPeriodo.filter(o => o.status === StatusObrigacao.PENDENTE).length;
		const atrasadas = obrigacoesPeriodo.filter(o => o.status === StatusObrigacao.ATRASADA).length;
		const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;
		return {
			total,
			concluidas,
			emAndamento,
			pendentes,
			atrasadas,
			taxaConclusao
		};
	}, [obrigacoesPeriodo]);

	const totalImpostos = impostosPeriodo.length;
	const totalParcelamentos = parcelamentosPeriodo.length;
	const valorParcelasNoPeriodo = parcelamentosPeriodo.reduce((acc, parcela) => acc + parcela.valorParcela, 0);
	const labelPeriodo = periodo === 'mensal' ? 'no mês' : 'no ano';
	const classeStatusObrigacao: Record<StatusObrigacao, string> = {
		PENDENTE: 'status-pendente',
		EM_ANDAMENTO: 'status-em-andamento',
		CONCLUIDA: 'status-concluida',
		ATRASADA: 'status-atrasada',
		CANCELADA: 'status-cancelada'
	};
	const classeStatusFinanceiro: Record<StatusFinanceiro, string> = {
		PENDENTE: 'status-pendente',
		EM_ANDAMENTO: 'status-em-andamento',
		CONCLUIDO: 'status-concluida',
		ATRASADO: 'status-atrasada'
	};

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
				<span className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.total}</span>
					</div>
			<p className="text-sm font-medium text-blue-900 dark:text-blue-300">Obrigações {labelPeriodo}</p>
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
					<p className="text-sm text-purple-600 dark:text-purple-400">Taxa de conclusão {labelPeriodo}</p>
					</div>
				</div>
			</div>

		{/* Listas detalhadas */}
		<div className="mt-8 space-y-5">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
					<ClipboardList size={20} className="text-blue-600" />
					Listas detalhadas
				</h3>
				<p className="text-sm text-gray-600 dark:text-gray-400">
					Resumo das atividades registradas {labelPeriodo}
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-900 shadow-sm">
					<header className="flex items-center justify-between mb-4">
						<div>
							<h4 className="text-lg font-semibold text-gray-900 dark:text-white">Obrigações</h4>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								{stats.total} registradas • {stats.pendentes} pendentes
							</p>
						</div>
						<span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
							{periodo === 'mensal' ? 'Mensal' : 'Anual'}
						</span>
					</header>
					<div className="space-y-3 max-h-72 overflow-y-auto pr-1">
						{obrigacoesPeriodo.length === 0 ? (
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Nenhuma obrigação encontrada {labelPeriodo}.
							</p>
						) : (
							obrigacoesPeriodo.map(obrigacao => (
								<div key={obrigacao.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="font-semibold text-gray-900 dark:text-white">{obrigacao.titulo}</p>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												{formatadorData.format(new Date(obrigacao.dataVencimento))} • {obrigacao.tipo}
											</p>
										</div>
										<span className={`badge ${classeStatusObrigacao[obrigacao.status]}`}>
											{NomesStatusObrigacao[obrigacao.status]}
										</span>
									</div>
									{obrigacao.cliente && (
										<p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Cliente: {obrigacao.cliente}</p>
									)}
									{obrigacao.responsavel && (
										<p className="text-xs text-gray-500 dark:text-gray-400">Responsável: {obrigacao.responsavel}</p>
									)}
								</div>
							))
						)}
					</div>
				</div>

				<div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-900 shadow-sm">
					<header className="flex items-center justify-between mb-4">
						<div>
							<h4 className="text-lg font-semibold text-gray-900 dark:text-white">Impostos</h4>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								{totalImpostos} registro(s) {labelPeriodo}
							</p>
						</div>
						<span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
							{totalImpostos > 0 ? `${totalImpostos} itens` : 'Sem registros'}
						</span>
					</header>
					<div className="space-y-3 max-h-72 overflow-y-auto pr-1">
						{impostosPeriodo.length === 0 ? (
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Nenhum imposto encontrado {labelPeriodo}.
							</p>
						) : (
							impostosPeriodo.map(imposto => (
								<div key={imposto.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="font-semibold text-gray-900 dark:text-white">{imposto.titulo}</p>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												Vencimento: {formatadorData.format(new Date(imposto.dataVencimento))}
											</p>
										</div>
										<span className={`badge ${classeStatusFinanceiro[imposto.status]}`}>
											{NomesStatusFinanceiro[imposto.status]}
										</span>
									</div>
									<p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
										Recorrência: {imposto.recorrencia} • Tipo: {imposto.tipo}
									</p>
									{imposto.cliente && (
										<p className="text-xs text-gray-500 dark:text-gray-400">Cliente: {imposto.cliente}</p>
									)}
								</div>
							))
						)}
					</div>
				</div>

				<div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-900 shadow-sm">
					<header className="flex items-center justify-between mb-4">
						<div>
							<h4 className="text-lg font-semibold text-gray-900 dark:text-white">Parcelamentos</h4>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								{totalParcelamentos} registro(s) {labelPeriodo}
							</p>
						</div>
						<span className="text-xs font-semibold px-3 py-1 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
							{formatadorMoeda.format(valorParcelasNoPeriodo)}
						</span>
					</header>
					<div className="space-y-3 max-h-72 overflow-y-auto pr-1">
						{parcelamentosPeriodo.length === 0 ? (
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Nenhum parcelamento encontrado {labelPeriodo}.
							</p>
						) : (
							parcelamentosPeriodo.map(parcelamento => (
								<div key={parcelamento.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="font-semibold text-gray-900 dark:text-white">{parcelamento.titulo}</p>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												Parcela {parcelamento.parcelaAtual}/{parcelamento.totalParcelas} • Vence em {formatadorData.format(new Date(parcelamento.dataVencimento))}
											</p>
										</div>
										<span className={`badge ${classeStatusFinanceiro[parcelamento.status]}`}>
											{NomesStatusFinanceiro[parcelamento.status]}
										</span>
									</div>
									<p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
										Valor da parcela: {formatadorMoeda.format(parcelamento.valorParcela)}
									</p>
									{parcelamento.cliente && (
										<p className="text-xs text-gray-500 dark:text-gray-400">Cliente: {parcelamento.cliente}</p>
									)}
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
		</div>
	);
};

export default Relatorios;

