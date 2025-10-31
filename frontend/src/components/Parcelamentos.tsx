import { useMemo, useState } from 'react';
import { Clock, CheckCircle2, AlertTriangle, Play, Check, Plus, Edit2 } from 'lucide-react';
import ParcelamentoModal from './ParcelamentoModal';

interface ParcelamentoItem {
	id: string;
	titulo: string;
	imposto: string;
	parcelaAtual: number;
	totalParcelas: number;
	valorParcela: number;
	dataVencimento: string;
	status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO';
}

const mockParcelamentos: ParcelamentoItem[] = [
	{ id: '1', titulo: 'Parcelamento IRPJ', imposto: 'IRPJ', parcelaAtual: 3, totalParcelas: 12, valorParcela: 1200, dataVencimento: '2024-02-15', status: 'PENDENTE' },
	{ id: '2', titulo: 'Parcelamento ISS', imposto: 'ISS', parcelaAtual: 6, totalParcelas: 10, valorParcela: 800, dataVencimento: '2024-02-20', status: 'EM_ANDAMENTO' },
	{ id: '3', titulo: 'Parcelamento PIS/COFINS', imposto: 'PIS/COFINS', parcelaAtual: 10, totalParcelas: 10, valorParcela: 500, dataVencimento: '2024-02-25', status: 'CONCLUIDO' },
];

const Parcelamentos: React.FC = () => {
	const [parcelamentos, setParcelamentos] = useState<ParcelamentoItem[]>(mockParcelamentos);
	const [filtro, setFiltro] = useState<'TODOS' | 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO'>('TODOS');
	const [modalAberto, setModalAberto] = useState(false);
	const [parcelamentoSelecionado, setParcelamentoSelecionado] = useState<ParcelamentoItem | undefined>();
	
	const lista = useMemo(() => parcelamentos.filter(p => filtro === 'TODOS' ? true : p.status === filtro), [filtro, parcelamentos]);

	const abrirModalNovo = () => {
		setParcelamentoSelecionado(undefined);
		setModalAberto(true);
	};

	const abrirModalEditar = (parcelamento: ParcelamentoItem) => {
		setParcelamentoSelecionado(parcelamento);
		setModalAberto(true);
	};

	const fecharModal = () => {
		setModalAberto(false);
		setParcelamentoSelecionado(undefined);
	};

	const salvarParcelamento = async (dados: Partial<ParcelamentoItem>) => {
		try {
			if (parcelamentoSelecionado?.id) {
				setParcelamentos(prev => prev.map(p => p.id === parcelamentoSelecionado.id ? { ...p, ...dados } as ParcelamentoItem : p));
				alert('✓ Parcelamento atualizado com sucesso!');
			} else {
				const novoParcelamento: ParcelamentoItem = { ...dados as ParcelamentoItem, id: Date.now().toString() };
				setParcelamentos(prev => [...prev, novoParcelamento]);
				alert('✓ Parcelamento criado com sucesso!');
			}
			fecharModal();
		} catch (error) {
			console.error('Erro ao salvar parcelamento:', error);
			alert('✗ Erro ao salvar parcelamento');
		}
	};

	const alterarStatus = async (id: string, novoStatus: ParcelamentoItem['status']) => {
		try {
			setParcelamentos(prev => prev.map(p => p.id === id ? { ...p, status: novoStatus } : p));
			alert('✓ Status da parcela alterado com sucesso!');
		} catch (error) {
			console.error('Erro ao alterar status:', error);
			alert('✗ Erro ao alterar status');
		}
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
								<td className="px-4 py-3">R$ {p.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
								<td className="px-4 py-3"><span className={`badge ${p.status === 'PENDENTE' ? 'status-pendente' : p.status === 'EM_ANDAMENTO' ? 'status-em-andamento' : p.status === 'CONCLUIDO' ? 'status-concluida' : 'status-atrasada'}`}>{p.status}</span></td>
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
					clientes={[]}
				/>
			)}
		</div>
	);
};

export default Parcelamentos;
