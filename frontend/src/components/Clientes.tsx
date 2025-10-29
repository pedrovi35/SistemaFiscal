import { useMemo, useState } from 'react';
import { Search, Plus, Edit2, Mail, Phone, Building2 } from 'lucide-react';
import ClienteModal from './ClienteModal';

export type RegimeTributario = 'MEI' | 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real';

export interface Cliente {
	id?: string;
	nome: string;
	cnpj: string;
	email?: string;
	telefone?: string;
	ativo: boolean;
	regimeTributario?: RegimeTributario;
}

interface ClientesProps {
	clientes?: Cliente[];
}

const mockClientes: Cliente[] = [
	{ id: '1', nome: 'ACME Ltda', cnpj: '12.345.678/0001-90', email: 'contato@acme.com', telefone: '(11) 3333-4444', ativo: true, regimeTributario: 'MEI' },
	{ id: '2', nome: 'Beta Serviços', cnpj: '98.765.432/0001-10', email: 'beta@servicos.com', telefone: '(21) 9999-0000', ativo: true, regimeTributario: 'Simples Nacional' },
	{ id: '3', nome: 'Gamma Holding', cnpj: '55.444.333/0001-22', email: 'financeiro@gamma.com', telefone: '(31) 2222-3333', ativo: true, regimeTributario: 'Lucro Presumido' },
	{ id: '4', nome: 'Delta Corporate', cnpj: '66.777.888/0001-44', email: 'contato@delta.com', telefone: '(41) 8888-9999', ativo: true, regimeTributario: 'Lucro Real' },
];

const Clientes: React.FC<ClientesProps> = ({ clientes: propClientes = mockClientes }) => {
	const [clientes, setClientes] = useState<Cliente[]>(propClientes);
	const [busca, setBusca] = useState('');
	const [modalAberto, setModalAberto] = useState(false);
	const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | undefined>();

	const lista = useMemo(() => {
		const q = busca.toLowerCase();
		return clientes.filter(c => c.nome.toLowerCase().includes(q) || c.cnpj.replace(/\D/g, '').includes(q.replace(/\D/g, '')));
	}, [clientes, busca]);

	const abrirModalNovo = () => {
		setClienteSelecionado(undefined);
		setModalAberto(true);
	};

	const abrirModalEditar = (cliente: Cliente) => {
		setClienteSelecionado(cliente);
		setModalAberto(true);
	};

	const fecharModal = () => {
		setModalAberto(false);
		setClienteSelecionado(undefined);
	};

	const salvarCliente = async (dados: Partial<Cliente>) => {
		try {
			if (clienteSelecionado?.id) {
				// Atualizar cliente existente
				setClientes(prev => prev.map(c => c.id === clienteSelecionado.id ? { ...c, ...dados } as Cliente : c));
				alert('✓ Cliente atualizado com sucesso!');
			} else {
				// Criar novo cliente
				const novoCliente: Cliente = {
					...dados as Cliente,
					id: Date.now().toString()
				};
				setClientes(prev => [...prev, novoCliente]);
				alert('✓ Cliente criado com sucesso!');
			}
			fecharModal();
		} catch (error) {
			console.error('Erro ao salvar cliente:', error);
			alert('✗ Erro ao salvar cliente');
		}
	};

	return (
		<div className="card p-4">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-bold">Clientes</h2>
				<button onClick={abrirModalNovo} className="btn-primary inline-flex items-center gap-2"><Plus size={16} /> Novo Cliente</button>
			</div>
			<div className="flex items-center gap-2 mb-4">
				<div className="relative">
					<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
					<input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou CNPJ" className="input-primary pl-9 w-80" />
				</div>
			</div>
			<div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 -mx-2 sm:mx-0">
				<table className="w-full text-xs sm:text-sm">
					<thead className="bg-gray-50 dark:bg-gray-800">
						<tr className="text-left text-gray-600 dark:text-gray-300">
							<th className="px-4 py-3">Nome</th>
							<th className="px-4 py-3">CNPJ</th>
							<th className="px-4 py-3">Regime Tributário</th>
							<th className="px-4 py-3">Contato</th>
							<th className="px-4 py-3">Status</th>
							<th className="px-4 py-3 text-right">Ações</th>
						</tr>
					</thead>
					<tbody>
						{lista.map(c => (
							<tr key={c.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
								<td className="px-4 py-3 font-medium text-gray-900 dark:text-white flex items-center gap-2"><Building2 size={16} className="text-blue-600" /> {c.nome}</td>
								<td className="px-4 py-3">{c.cnpj}</td>
								<td className="px-4 py-3">
									{c.regimeTributario && (
										<span className={`badge ${
											c.regimeTributario === 'MEI' ? 'status-pendente' :
											c.regimeTributario === 'Simples Nacional' ? 'badge-federal' :
											c.regimeTributario === 'Lucro Presumido' ? 'badge-estadual' :
											'badge-municipal'
										}`}>
											{c.regimeTributario}
										</span>
									)}
								</td>
								<td className="px-4 py-3 flex items-center gap-4 text-gray-600 dark:text-gray-300">
									<span className="inline-flex items-center gap-1"><Mail size={14} /> {c.email || '-'}</span>
									<span className="inline-flex items-center gap-1"><Phone size={14} /> {c.telefone || '-'}</span>
								</td>
								<td className="px-4 py-3">
									<span className={`badge ${c.ativo ? 'status-concluida' : 'status-cancelada'}`}>{c.ativo ? 'Ativo' : 'Inativo'}</span>
								</td>
								<td className="px-4 py-3">
									<div className="flex justify-end">
										<button onClick={() => abrirModalEditar(c)} className="btn-secondary px-3 py-1.5 inline-flex items-center gap-1"><Edit2 size={14} /> Editar</button>
									</div>
								</td>
							</tr>
						))}
						{lista.length === 0 && (
							<tr>
								<td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">Nenhum cliente encontrado.</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* Modal */}
			{modalAberto && (
				<ClienteModal
					cliente={clienteSelecionado}
					onSave={salvarCliente}
					onClose={fecharModal}
				/>
			)}
		</div>
	);
};

export default Clientes;
