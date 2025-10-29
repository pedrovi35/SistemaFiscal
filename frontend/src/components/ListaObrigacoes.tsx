import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, Filter, Search, ArrowUpDown, Play, Check, Edit2, Eye } from 'lucide-react';
import { Obrigacao, StatusObrigacao } from '../types';

interface ListaObrigacoesProps {
	obrigacoes: Obrigacao[];
	onCriar: () => void;
	onEditar: (o: Obrigacao) => void;
	onAlterarStatus: (id: string, status: StatusObrigacao) => Promise<void> | void;
}

type AbaStatus = 'todos' | 'pendentes' | 'em_andamento' | 'concluidas' | 'atrasadas';

const statusToBadge: Record<AbaStatus, { label: string; icon: React.ElementType; color: string }> = {
	todos: { label: 'Todos', icon: Eye, color: 'text-gray-600' },
	pendentes: { label: 'Pendentes', icon: Clock, color: 'text-yellow-600' },
	em_andamento: { label: 'Em Andamento', icon: Play, color: 'text-blue-600' },
	concluidas: { label: 'Concluídas', icon: CheckCircle2, color: 'text-green-600' },
	atrasadas: { label: 'Atrasadas', icon: AlertTriangle, color: 'text-red-600' },
};

const ListaObrigacoes: React.FC<ListaObrigacoesProps> = ({ obrigacoes, onCriar, onEditar, onAlterarStatus }) => {
	const [aba, setAba] = useState<AbaStatus>('todos');
	const [busca, setBusca] = useState('');
	const [clienteFiltro, setClienteFiltro] = useState('');
	const [ordenacao, setOrdenacao] = useState<'vencimento' | 'titulo'>('vencimento');

	const contadores = useMemo(() => {
		return {
			todos: obrigacoes.length,
			pendentes: obrigacoes.filter(o => o.status === StatusObrigacao.PENDENTE).length,
			em_andamento: obrigacoes.filter(o => o.status === StatusObrigacao.EM_ANDAMENTO).length,
			concluidas: obrigacoes.filter(o => o.status === StatusObrigacao.CONCLUIDA).length,
			atrasadas: obrigacoes.filter(o => o.status === StatusObrigacao.ATRASADA).length,
		};
	}, [obrigacoes]);

	const clientes = useMemo(() => Array.from(new Set(obrigacoes.map(o => o.cliente).filter(Boolean))) as string[], [obrigacoes]);

	const listaFiltrada = useMemo(() => {
		let lista = [...obrigacoes];
		if (aba !== 'todos') {
			const map: Record<AbaStatus, StatusObrigacao | undefined> = {
				todos: undefined,
				pendentes: StatusObrigacao.PENDENTE,
				em_andamento: StatusObrigacao.EM_ANDAMENTO,
				concluidas: StatusObrigacao.CONCLUIDA,
				atrasadas: StatusObrigacao.ATRASADA,
			};
			const statusAlvo = map[aba];
			if (statusAlvo) lista = lista.filter(o => o.status === statusAlvo);
		}
		if (clienteFiltro) lista = lista.filter(o => (o.cliente || '').toLowerCase().includes(clienteFiltro.toLowerCase()));
		if (busca) {
			const q = busca.toLowerCase();
			lista = lista.filter(o =>
				(o.titulo || '').toLowerCase().includes(q) ||
				(o.empresa || '').toLowerCase().includes(q) ||
				(o.responsavel || '').toLowerCase().includes(q)
			);
		}
		lista.sort((a, b) => {
			if (ordenacao === 'vencimento') return new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime();
			return (a.titulo || '').localeCompare(b.titulo || '');
		});
		return lista;
	}, [obrigacoes, aba, clienteFiltro, busca, ordenacao]);

	return (
		<div className="card p-4">
			<div className="flex flex-col gap-4">
				{/* Abas de status */}
				<div className="flex flex-wrap gap-2">
					{(Object.keys(statusToBadge) as AbaStatus[]).map((key) => {
						const { label, icon: Icon, color } = statusToBadge[key];
						const ativo = aba === key;
						const count = contadores[key];
						return (
							<button
								key={key}
								onClick={() => setAba(key)}
								className={`px-3 py-1.5 rounded-full text-sm border transition-all ${ativo ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
								title={label}
							>
								<span className="inline-flex items-center gap-2">
									<Icon size={16} className={`${ativo ? 'text-white' : color}`} />
									<span>{label}</span>
									<span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ativo ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>{count}</span>
								</span>
							</button>
						);
					})}
				</div>

				{/* Filtros e ações */}
				<div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="relative">
							<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<input
								value={busca}
								onChange={e => setBusca(e.target.value)}
								placeholder="Buscar por título, empresa ou responsável..."
								className="input-primary pl-9 w-72"
							/>
						</div>
						<div className="relative">
							<Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<select
								value={clienteFiltro}
								onChange={e => setClienteFiltro(e.target.value)}
								className="input-primary pl-9 w-56"
							>
								<option value="">Todos os clientes</option>
								{clientes.map(c => (
									<option key={c} value={c}>{c}</option>
								))}
							</select>
						</div>
						<button
							onClick={() => setOrdenacao(ordenacao === 'vencimento' ? 'titulo' : 'vencimento')}
							className="btn-secondary inline-flex items-center gap-2"
							title="Alternar ordenação"
						>
							<ArrowUpDown size={16} />
							<span>Ordenar por {ordenacao === 'vencimento' ? 'Vencimento' : 'Título'}</span>
						</button>
					</div>

					<button onClick={onCriar} className="btn-primary">Nova Obrigação</button>
				</div>

				{/* Lista */}
				<div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
					<table className="w-full text-sm">
						<thead className="bg-gray-50 dark:bg-gray-800">
							<tr className="text-left text-gray-600 dark:text-gray-300">
								<th className="px-4 py-3">Título</th>
								<th className="px-4 py-3">Cliente</th>
								<th className="px-4 py-3">Empresa</th>
								<th className="px-4 py-3">Responsável</th>
								<th className="px-4 py-3">Vencimento</th>
								<th className="px-4 py-3">Status</th>
								<th className="px-4 py-3 text-right">Ações</th>
							</tr>
						</thead>
						<tbody>
							{listaFiltrada.map((o) => (
								<tr key={o.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
									<td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{o.titulo}</td>
									<td className="px-4 py-3">{o.cliente || '-'}</td>
									<td className="px-4 py-3">{o.empresa || '-'}</td>
									<td className="px-4 py-3">{o.responsavel || '-'}</td>
									<td className="px-4 py-3">{new Date(o.dataVencimento).toLocaleDateString()}</td>
									<td className="px-4 py-3">
										<span className={`badge ${
											o.status === StatusObrigacao.PENDENTE ? 'status-pendente' :
											o.status === StatusObrigacao.EM_ANDAMENTO ? 'status-em-andamento' :
											o.status === StatusObrigacao.CONCLUIDA ? 'status-concluida' :
											o.status === StatusObrigacao.ATRASADA ? 'status-atrasada' : 'status-cancelada'
										}`}>{o.status}</span>
									</td>
									<td className="px-4 py-3">
										<div className="flex justify-end gap-2">
											<button
												onClick={() => onEditar(o)}
												className="btn-secondary px-3 py-1.5 flex items-center gap-1"
												title="Editar"
											>
												<Edit2 size={14} />
												<span>Editar</span>
											</button>
											{o.status !== StatusObrigacao.EM_ANDAMENTO && o.status !== StatusObrigacao.CONCLUIDA && (
												<button
													onClick={() => onAlterarStatus(o.id, StatusObrigacao.EM_ANDAMENTO)}
													className="btn-secondary px-3 py-1.5 flex items-center gap-1"
													title="Iniciar"
												>
													<Play size={14} />
													<span>Iniciar</span>
												</button>
											)}
											{o.status !== StatusObrigacao.CONCLUIDA && (
												<button
													onClick={() => onAlterarStatus(o.id, StatusObrigacao.CONCLUIDA)}
													className="btn-success px-3 py-1.5 flex items-center gap-1"
													title="Concluir"
												>
													<Check size={14} />
													<span>Concluir</span>
												</button>
											)}
										</div>
									</td>
								</tr>
							))}
							{listaFiltrada.length === 0 && (
								<tr>
									<td className="px-4 py-6 text-center text-gray-500 dark:text-gray-400" colSpan={7}>Nenhuma obrigação encontrada.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default ListaObrigacoes;
