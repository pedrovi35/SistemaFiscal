import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, Play, Check, Plus, Edit2, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import ImpostoModal from './ImpostoModal';

interface ImpostoItem {
	id: string;
	titulo: string;
	tipo: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | 'TRABALHISTA' | 'PREVIDENCIARIA' | 'OUTRO';
	status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO';
	cliente?: string;
	recorrencia: 'Mensal' | 'Anual' | 'Personalizado';
	ajusteDataUtil?: boolean;
	preferenciaAjuste?: 'proximo' | 'anterior';
}

interface Cliente {
	id: string;
	nome: string;
}

interface ImpostosProps {
	clientes?: Cliente[];
}

const mockImpostos: ImpostoItem[] = [
	{ id: '1', titulo: 'IRPJ', tipo: 'FEDERAL', status: 'PENDENTE', cliente: 'ACME Ltda', recorrencia: 'Anual', ajusteDataUtil: true, preferenciaAjuste: 'proximo' },
	{ id: '2', titulo: 'PIS/COFINS', tipo: 'FEDERAL', status: 'EM_ANDAMENTO', cliente: 'Beta Serviços', recorrencia: 'Mensal', ajusteDataUtil: true, preferenciaAjuste: 'anterior' },
	{ id: '3', titulo: 'ISS', tipo: 'MUNICIPAL', status: 'ATRASADO', cliente: 'Gamma Holding', recorrencia: 'Mensal', ajusteDataUtil: false },
];

const Impostos: React.FC<ImpostosProps> = ({ clientes = [] }) => {
	const [impostos, setImpostos] = useState<ImpostoItem[]>(mockImpostos);
	const [aba, setAba] = useState<'TODOS' | 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO'>('TODOS');
	const [modalAberto, setModalAberto] = useState(false);
	const [impostoSelecionado, setImpostoSelecionado] = useState<ImpostoItem | undefined>();

	const contadores = useMemo(() => ({
		TODOS: impostos.length,
		PENDENTE: impostos.filter(i => i.status === 'PENDENTE').length,
		EM_ANDAMENTO: impostos.filter(i => i.status === 'EM_ANDAMENTO').length,
		CONCLUIDO: impostos.filter(i => i.status === 'CONCLUIDO').length,
		ATRASADO: impostos.filter(i => i.status === 'ATRASADO').length,
	}), [impostos]);

	const lista = useMemo(() => impostos.filter(i => aba === 'TODOS' ? true : i.status === aba), [aba, impostos]);

	const abrirModalNovo = () => {
		setImpostoSelecionado(undefined);
		setModalAberto(true);
	};

	const abrirModalEditar = (imposto: ImpostoItem) => {
		setImpostoSelecionado(imposto);
		setModalAberto(true);
	};

	const fecharModal = () => {
		setModalAberto(false);
		setImpostoSelecionado(undefined);
	};

	const salvarImposto = async (dados: Partial<ImpostoItem>) => {
		try {
			if (impostoSelecionado?.id) {
				setImpostos(prev => prev.map(i => i.id === impostoSelecionado.id ? { ...i, ...dados } as ImpostoItem : i));
				alert('✓ Imposto atualizado com sucesso!');
			} else {
				const novoImposto: ImpostoItem = { ...dados as ImpostoItem, id: Date.now().toString() };
				setImpostos(prev => [...prev, novoImposto]);
				alert('✓ Imposto criado com sucesso!');
			}
			fecharModal();
		} catch (error) {
			console.error('Erro ao salvar imposto:', error);
			alert('✗ Erro ao salvar imposto');
		}
	};

	const alterarStatus = async (id: string, novoStatus: ImpostoItem['status']) => {
		try {
			setImpostos(prev => prev.map(i => i.id === id ? { ...i, status: novoStatus } : i));
			alert('✓ Status alterado com sucesso!');
		} catch (error) {
			console.error('Erro ao alterar status:', error);
			alert('✗ Erro ao alterar status');
		}
	};

	return (
		<div className="card p-4">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-bold">Impostos</h2>
				<button onClick={abrirModalNovo} className="btn-primary inline-flex items-center gap-2"><Plus size={16} /> Novo Imposto</button>
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
					const ativo = aba === tab.id;
					const count = contadores[tab.id as keyof typeof contadores];
					return (
						<button key={tab.id} onClick={() => setAba(tab.id)} className={`px-3 py-1.5 rounded-full text-sm border transition-all ${ativo ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
							<span className="inline-flex items-center gap-2">
								{Icon && (tab as any).color ? <Icon size={16} className={`${ativo ? 'text-white' : (tab as any).color}`} /> : null}
								<span>{tab.label}</span>
								<span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ativo ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>{count}</span>
							</span>
						</button>
					);
				})}
			</div>
			<div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 -mx-2 sm:mx-0">
				<table className="w-full text-xs sm:text-sm">
					<thead className="bg-gray-50 dark:bg-gray-800">
						<tr className="text-left text-gray-600 dark:text-gray-300">
							<th className="px-4 py-3">Nome</th>
							<th className="px-4 py-3">Cliente</th>
							<th className="px-4 py-3">Recorrência</th>
							<th className="px-4 py-3">Ajuste de Data</th>
							<th className="px-4 py-3">Status</th>
							<th className="px-4 py-3 text-right">Ações</th>
						</tr>
					</thead>
					<tbody>
						{lista.map(i => (
							<tr key={i.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
								<td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{i.titulo}</td>
								<td className="px-4 py-3 text-gray-600 dark:text-gray-400">{i.cliente || '-'}</td>
								<td className="px-4 py-3">
									<span className="inline-flex items-center gap-1">
										<Calendar size={14} className="text-gray-400" />
										{i.recorrencia}
									</span>
								</td>
								<td className="px-4 py-3">
									{i.ajusteDataUtil ? (
										<div className="inline-flex items-center gap-1">
											<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800" title={`Ajusta para dia útil ${i.preferenciaAjuste === 'proximo' ? 'seguinte' : 'anterior'}`}>
												{i.preferenciaAjuste === 'proximo' ? (
													<>
														<ArrowRight size={12} />
														<span>Próximo</span>
													</>
												) : (
													<>
														<ArrowLeft size={12} />
														<span>Anterior</span>
													</>
												)}
											</span>
										</div>
									) : (
										<span className="text-xs text-gray-400 dark:text-gray-500">-</span>
									)}
								</td>
								<td className="px-4 py-3"><span className={`badge ${i.status === 'PENDENTE' ? 'status-pendente' : i.status === 'EM_ANDAMENTO' ? 'status-em-andamento' : i.status === 'CONCLUIDO' ? 'status-concluida' : 'status-atrasada'}`}>{i.status}</span></td>
								<td className="px-4 py-3">
									<div className="flex justify-end gap-2">
										<button onClick={() => abrirModalEditar(i)} className="btn-secondary px-3 py-1.5 inline-flex items-center gap-1"><Edit2 size={14} /> Editar</button>
										{(i.status === 'PENDENTE' || i.status === 'ATRASADO') && (
											<button onClick={() => alterarStatus(i.id, 'EM_ANDAMENTO')} className="btn-secondary px-3 py-1.5 inline-flex items-center gap-1">
												<Play size={14} /> Iniciar
											</button>
										)}
										{i.status !== 'CONCLUIDO' && (
											<button onClick={() => alterarStatus(i.id, 'CONCLUIDO')} className="btn-success px-3 py-1.5 inline-flex items-center gap-1">
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
			<ImpostoModal
				imposto={impostoSelecionado}
				onSave={salvarImposto}
				onClose={fecharModal}
				clientes={clientes}
			/>
		)}
		</div>
	);
};

export default Impostos;
