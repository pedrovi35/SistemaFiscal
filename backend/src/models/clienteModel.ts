import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Cliente {
  id: string;
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  regimeTributario?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export class ClienteModel {
  // Criar cliente
  async criar(cliente: Omit<Cliente, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Cliente> {
    const id = uuidv4();
    const agora = new Date().toISOString();

    await db.run(`
      INSERT INTO clientes (
        id, nome, cnpj, email, telefone, ativo, "regimeTributario", "criadoEm", "atualizadoEm"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      cliente.nome,
      cliente.cnpj || null,
      cliente.email || null,
      cliente.telefone || null,
      cliente.ativo ? 1 : 0,
      cliente.regimeTributario || null,
      agora,
      agora
    ]);

    const resultado = await this.buscarPorId(id);
    if (!resultado) {
      throw new Error('Erro ao criar cliente');
    }
    return resultado;
  }

  // Buscar por ID
  async buscarPorId(id: string): Promise<Cliente | undefined> {
    const cliente = await db.get('SELECT * FROM clientes WHERE id = ?', [id]) as any;

    if (!cliente) return undefined;

    return this.mapearCliente(cliente);
  }

  // Listar todos
  async listarTodos(): Promise<Cliente[]> {
    const clientes = await db.all('SELECT * FROM clientes ORDER BY nome ASC', []) as any[];

    return clientes.map(c => this.mapearCliente(c));
  }

  // Listar apenas ativos
  async listarAtivos(): Promise<Cliente[]> {
    const clientes = await db.all('SELECT * FROM clientes WHERE ativo = ? ORDER BY nome ASC', [1]) as any[];

    return clientes.map(c => this.mapearCliente(c));
  }

  // Buscar por CNPJ
  async buscarPorCnpj(cnpj: string): Promise<Cliente | undefined> {
    const cliente = await db.get('SELECT * FROM clientes WHERE cnpj = ?', [cnpj]) as any;

    if (!cliente) return undefined;

    return this.mapearCliente(cliente);
  }

  // Atualizar
  async atualizar(id: string, dados: Partial<Cliente>): Promise<Cliente | undefined> {
    const campos: string[] = [];
    const valores: any[] = [];

    const camposPermitidos = [
      'nome', 'cnpj', 'email', 'telefone', 'ativo', 'regimeTributario'
    ];

    for (const campo of camposPermitidos) {
      if (campo in dados) {
        if (campo === 'regimeTributario') {
          campos.push(`"${campo}" = ?`);
        } else {
          campos.push(`${campo} = ?`);
        }
        const valor = (dados as any)[campo];
        valores.push(campo === 'ativo' ? (valor ? 1 : 0) : valor);
      }
    }

    if (campos.length === 0) return this.buscarPorId(id);

    campos.push('"atualizadoEm" = ?');
    valores.push(new Date().toISOString());
    valores.push(id);

    const query = `UPDATE clientes SET ${campos.join(', ')} WHERE id = ?`;
    await db.run(query, valores);

    return this.buscarPorId(id);
  }

  // Deletar (soft delete - marca como inativo)
  async deletar(id: string): Promise<boolean> {
    const result = await db.run(
      'UPDATE clientes SET ativo = ?, "atualizadoEm" = ? WHERE id = ?',
      [0, new Date().toISOString(), id]
    ) as any;
    return result.changes > 0;
  }

  // Deletar permanentemente
  async deletarPermanente(id: string): Promise<boolean> {
    const result = await db.run('DELETE FROM clientes WHERE id = ?', [id]) as any;
    return result.changes > 0;
  }

  // Mapear cliente do banco
  private mapearCliente(row: any): Cliente {
    return {
      id: row.id,
      nome: row.nome,
      cnpj: row.cnpj || undefined,
      email: row.email || undefined,
      telefone: row.telefone || undefined,
      ativo: row.ativo === 1 || row.ativo === true,
      regimeTributario: row.regimeTributario || row["regimeTributario"] || undefined,
      criadoEm: row.criadoEm || row["criadoEm"],
      atualizadoEm: row.atualizadoEm || row["atualizadoEm"]
    };
  }
}

export default new ClienteModel();

