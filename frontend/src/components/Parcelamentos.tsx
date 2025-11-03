import { useMemo, useState } from 'react';
import { Clock, CheckCircle2, AlertTriangle, Play, Check, Plus, Edit2 } from 'lucide-react';
import ParcelamentoModal from './ParcelamentoModal';
import { NomesStatusFinanceiro, Parcelamento, StatusFinanceiro } from '../types';

interface ParcelamentosProps {
	parcelamentos: Parcelamento[];
	onSave: (dados: Partial<Parcelamento>, id?: string) => Promise<void> | void;
	onAlterarStatus: (id: string, status: StatusFinanceiro) => Promise<void> | void;
	clientes?: Array<{ id: string; nome: string }>;
}

const classeStatus: Record<StatusFinanceiro, string> = {
	PENDENTE: 'status-pendente',
	EM_ANDAMENTO: 'status-em-andamento',
	CONCLUIDO: 'status-concluida',
	ATRASADO: 'status-atrasada'
};

const Parcelamentos: React.FC<ParcelamentosProps> = ({ parcelamentos, onSave, onAlterarStatus, clientes = [] }) => {
	const [filtro, setFiltro] = useState<'TODOS' | StatusFinanceiro>('TODOS');
	const [modalAberto, setModalAberto] = useState(false);
	const [parcelamentoSelecionado, setParcelamentoSelecionado] = useState<Parcelamento | undefined>();

	const formatadorData = useMemo(() => new Intl.DateTimeFormat('pt-BR'), []);
	const formatadorMoeda = useMemo(() => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }), []);
	
	const lista = useMemo(
		() => parcelamentos.filter(p => (filtro === 'TODOS' ? true : p.status === filtro)),
		[filtro, parcelamentos]
	);

	const abrirModalNovo = () => {
		setParcelamentoSelecionado(undefined);
		setModalAberto(true);
	};

	const abrirModalEditar = (parcelamento: Parcelamento) => {
		setParcelamentoSelecionado(parcelamento);
		setModalAberto(true);
	};

	const fecharModal = () => {
		setModalAberto(false);
		setParcelamentoSelecionado(undefined);
	};

	const salvarParcelamento = async (dados: Partial<Parcelamento>) => {
		try {
			await onSave(dados, parcelamentoSelecionado?.id);
			fecharModal();
		} catch (error) {
			console.error('Erro ao salvar parcelamento:', error);
		}
	};

	const alterarStatus = async (id: string, novoStatus: StatusFinanceiro) => {
		try {
			await onAlterarStatus(id, novoStatus);
		} catch (error) {
			console.error('Erro ao alterar status:', error);
		}
	};

	const formatarData = (data: string) => {
		const dt = new Date(data);
		if (Number.isNaN(dt.getTime())) {
			return '-';
		}
		return formatadorData.format(dt);
	};

	return (
		<div className="card p-4">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-bold">Parcelamentos</h2>
				<button onClick={abrirModalNovo} className="btn-primary inline-flex items-center gap-2"><Plus size={16} /> Novo Parcelamento</button>
			</div>
			<div className="flex flex-wrap gap-2 mb-4">
				{([
					{ id: 'TODOS' as const, label: 'Todos' },
					{ id: 'PENDENTE' as const, label: 'Pendentes', icon: Clock, color: 'text-yellow-600' },
					{ id: 'EM_ANDAMENTO' as const, label: 'Em Andamento', icon: Play, color: 'text-blue-600' },
					{ id: 'CONCLUIDO' as const, label: 'Concluídos', icon: CheckCircle2, color: 'text-green-600' },
					{ id: 'ATRASADO' as const, label: 'Atrasados', icon: AlertTriangle, color: 'text-red-600' },
				] as const).map(tab => {
					const Icon = (tab as any).icon;
					const ativo = filtro === tab.id;
					return (
						<button key={tab.id} onClick={() => setFiltro(tab.id)} className={`px-3 py-1.5 rounded-full text-sm border transition-all ${ativo ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
							<span className="inline-flex items-center gap-2">
								{Icon && (tab as any).color ? <Icon size={16} className={`${ativo ? 'text-white' : (tab as any).color}`} /> : null}
								<span>{tab.label}</span>
							</span>
						</button>
					);
				})}
			</div>
			<div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 -mx-2 sm:mx-0">
				<table className="w-full text-xs sm:text-sm">
					<thead className="bg-gray-50 dark:bg-gray-800">
						<tr className="text-left text-gray-600 dark:text-gray-300">
							<th className="px-4 py-3">Título</th>
							<th className="px-4 py-3">Imposto</th>
							<th className="px-4 py-3">Parcela</th>
							<th className="px-4 py-3">Valor</th>
							<th className="px-4 py-3">Vencimento</th>
							<th className="px-4 py-3">Status</th>
							<th className="px-4 py-3 text-right">Ações</th>
						</tr>
					</thead>
					<tbody>
						{lista.map(p => (
							<tr key={p.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
								<td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.titulo}</td>
								<td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.imposto}</td>
								<td className="px-4 py-3">{p.parcelaAtual}/{p.totalParcelas}</td>
								<td className="px-4 py-3">{formatadorMoeda.format(p.valorParcela)}</td>
								<td className="px-4 py-3">{formatarData(p.dataVencimento)}</td>
								<td className="px-4 py-3"><span className={`badge ${classeStatus[p.status]}`}>{NomesStatusFinanceiro[p.status]}</span></td>
								<td className="px-4 py-3">
									<div className="flex justify-end gap-2">
										<button onClick={() => abrirModalEditar(p)} className="btn-secondary px-3 py-1.5 inline-flex items-center gap-1"><Edit2 size={14} /> Editar</button>
										{(p.status === 'PENDENTE' || p.status === 'ATRASADO') && (
											<button onClick={() => alterarStatus(p.id, 'EM_ANDAMENTO')} className="btn-secondary px-3 py-1.5 inline-flex items-center gap-1">
												<Play size={14} /> Iniciar
											</button>
										)}
										{p.status !== 'CONCLUIDO' && (
											<button onClick={() => alterarStatus(p.id, 'CONCLUIDO')} className="btn-success px-3 py-1.5 inline-flex items-center gap-1">
												<Check size={14} /> Concluir
											</button>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Modal */}
			{modalAberto && (
				<ParcelamentoModal
					parcelamento={parcelamentoSelecionado}
					onSave={salvarParcelamento}
					onClose={fecharModal}
					clientes={clientes}
				/>
			)}
		</div>
	);
};

export default Parcelamentos;
