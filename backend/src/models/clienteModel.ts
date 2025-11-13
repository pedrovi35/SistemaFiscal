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
    try {
      const id = uuidv4();
      const agora = new Date().toISOString();

      // Validar e limpar dados
      const nome = (cliente.nome || '').trim();
      if (!nome) {
        throw new Error('Nome é obrigatório');
      }

      // Converter strings vazias para null e limpar valores
      const cnpj = cliente.cnpj?.trim() || null;
      const email = cliente.email?.trim() || null;
      const telefone = cliente.telefone?.trim() || null;
      const regimeTributario = cliente.regimeTributario?.trim() || null;
      
      // PostgreSQL usa BOOLEAN, não INTEGER (1/0)
      const ativo = cliente.ativo !== undefined ? Boolean(cliente.ativo) : true;

      await db.run(`
        INSERT INTO clientes (
          id, nome, cnpj, email, telefone, ativo, "regimeTributario", "criadoEm", "atualizadoEm"
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        nome,
        cnpj,
        email,
        telefone,
        ativo, // PostgreSQL BOOLEAN (true/false)
        regimeTributario,
        agora,
        agora
      ]);

      const resultado = await this.buscarPorId(id);
      if (!resultado) {
        throw new Error('Cliente criado mas não foi possível recuperar os dados');
      }
      return resultado;
    } catch (error: any) {
      console.error('Erro detalhado ao criar cliente:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        constraint: error.constraint,
        table: error.table,
        column: error.column,
        dadosRecebidos: {
          nome: cliente.nome,
          cnpj: cliente.cnpj,
          email: cliente.email,
          telefone: cliente.telefone,
          ativo: cliente.ativo,
          regimeTributario: cliente.regimeTributario
        }
      });
      throw error;
    }
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
    // PostgreSQL usa BOOLEAN, não INTEGER
    const clientes = await db.all('SELECT * FROM clientes WHERE ativo = ? ORDER BY nome ASC', [true]) as any[];

    return clientes.map(c => this.mapearCliente(c));
  }

  // Buscar por CNPJ
  async buscarPorCnpj(cnpj: string): Promise<Cliente | undefined> {
    // Limpar CNPJ (remover formatação) para busca
    // O CNPJ é armazenado sem formatação no banco
    const cnpjLimpo = cnpj ? cnpj.replace(/\D/g, '') : null;
    if (!cnpjLimpo || cnpjLimpo.length === 0) return undefined;

    const cliente = await db.get('SELECT * FROM clientes WHERE cnpj = ?', [cnpjLimpo]) as any;

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
        // PostgreSQL usa BOOLEAN, não INTEGER
        if (campo === 'ativo') {
          valores.push(Boolean(valor));
        } else if (typeof valor === 'string') {
          // Limpar strings vazias
          valores.push(valor.trim() || null);
        } else {
          valores.push(valor);
        }
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
    // PostgreSQL usa BOOLEAN
    const result = await db.run(
      'UPDATE clientes SET ativo = ?, "atualizadoEm" = ? WHERE id = ?',
      [false, new Date().toISOString(), id]
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

