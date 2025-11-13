import { Request, Response } from 'express';
import clienteModel from '../models/clienteModel';

export class ClienteController {
  // GET /api/clientes
  async listarTodos(_req: Request, res: Response): Promise<void> {
    try {
      const clientes = await clienteModel.listarTodos();
      res.json(clientes);
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      res.status(500).json({ erro: 'Erro ao listar clientes' });
    }
  }

  // GET /api/clientes/ativos
  async listarAtivos(_req: Request, res: Response): Promise<void> {
    try {
      const clientes = await clienteModel.listarAtivos();
      res.json(clientes);
    } catch (error) {
      console.error('Erro ao listar clientes ativos:', error);
      res.status(500).json({ erro: 'Erro ao listar clientes ativos' });
    }
  }

  // GET /api/clientes/:id
  async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cliente = await clienteModel.buscarPorId(id);

      if (!cliente) {
        res.status(404).json({ erro: 'Cliente não encontrado' });
        return;
      }

      res.json(cliente);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      res.status(500).json({ erro: 'Erro ao buscar cliente' });
    }
  }

  // GET /api/clientes/cnpj/:cnpj
  async buscarPorCnpj(req: Request, res: Response): Promise<void> {
    try {
      const { cnpj } = req.params;
      const cliente = await clienteModel.buscarPorCnpj(cnpj);

      if (!cliente) {
        res.status(404).json({ erro: 'Cliente não encontrado' });
        return;
      }

      res.json(cliente);
    } catch (error) {
      console.error('Erro ao buscar cliente por CNPJ:', error);
      res.status(500).json({ erro: 'Erro ao buscar cliente por CNPJ' });
    }
  }

  // POST /api/clientes
  async criar(req: Request, res: Response): Promise<void> {
    try {
      const { nome, cnpj, email, telefone, ativo = true, regimeTributario } = req.body;

      // Validação básica
      if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
        res.status(400).json({ erro: 'Nome é obrigatório e deve ser uma string não vazia' });
        return;
      }

      // Limpar CNPJ (remover formatação) antes de verificar duplicidade
      const cnpjLimpo = cnpj ? cnpj.replace(/\D/g, '') : null;
      
      // Verificar se CNPJ já existe (apenas se foi fornecido)
      if (cnpjLimpo && cnpjLimpo.length > 0) {
        try {
          const clienteExistente = await clienteModel.buscarPorCnpj(cnpjLimpo);
          if (clienteExistente) {
            res.status(409).json({ erro: 'CNPJ já cadastrado' });
            return;
          }
        } catch (error: any) {
          // Se houver erro ao buscar, logar mas continuar (pode ser problema de conexão)
          console.warn('Aviso ao verificar CNPJ duplicado:', error.message);
        }
      }

      // Criar cliente com dados validados
      // Armazenar CNPJ sem formatação para facilitar buscas
      const cliente = await clienteModel.criar({
        nome: nome.trim(),
        cnpj: cnpjLimpo && cnpjLimpo.length > 0 ? cnpjLimpo : undefined,
        email: email?.trim() || undefined,
        telefone: telefone?.trim() || undefined,
        ativo: Boolean(ativo),
        regimeTributario: regimeTributario?.trim() || undefined
      });

      res.status(201).json(cliente);
    } catch (error: any) {
      console.error('Erro ao criar cliente:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        constraint: error.constraint,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });

      // Mensagens de erro mais específicas
      let mensagemErro = 'Erro ao criar cliente';
      let statusCode = 500;

      if (error.code === '23505') { // Violação de constraint única (PostgreSQL)
        mensagemErro = 'CNPJ já cadastrado';
        statusCode = 409;
      } else if (error.code === '23502') { // Violação de NOT NULL
        mensagemErro = 'Campo obrigatório não fornecido';
        statusCode = 400;
      } else if (error.message) {
        mensagemErro = error.message;
      }

      res.status(statusCode).json({ 
        erro: mensagemErro,
        ...(process.env.NODE_ENV === 'development' && { detalhes: error.detail })
      });
    }
  }

  // PUT /api/clientes/:id
  async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dados = req.body;

      // Verificar se cliente existe
      const clienteExistente = await clienteModel.buscarPorId(id);
      if (!clienteExistente) {
        res.status(404).json({ erro: 'Cliente não encontrado' });
        return;
      }

      // Se mudando CNPJ, verificar se já não existe
      if (dados.cnpj && dados.cnpj !== clienteExistente.cnpj) {
        const clienteComCnpj = await clienteModel.buscarPorCnpj(dados.cnpj);
        if (clienteComCnpj && clienteComCnpj.id !== id) {
          res.status(409).json({ erro: 'CNPJ já cadastrado para outro cliente' });
          return;
        }
      }

      const clienteAtualizado = await clienteModel.atualizar(id, dados);
      
      if (!clienteAtualizado) {
        res.status(404).json({ erro: 'Cliente não encontrado' });
        return;
      }

      res.json(clienteAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      res.status(500).json({ erro: 'Erro ao atualizar cliente' });
    }
  }

  // DELETE /api/clientes/:id (soft delete)
  async deletar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const sucesso = await clienteModel.deletar(id);

      if (!sucesso) {
        res.status(404).json({ erro: 'Cliente não encontrado' });
        return;
      }

      res.json({ mensagem: 'Cliente inativado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      res.status(500).json({ erro: 'Erro ao deletar cliente' });
    }
  }

  // DELETE /api/clientes/:id/permanente
  async deletarPermanente(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const sucesso = await clienteModel.deletarPermanente(id);

      if (!sucesso) {
        res.status(404).json({ erro: 'Cliente não encontrado' });
        return;
      }

      res.json({ mensagem: 'Cliente excluído permanentemente' });
    } catch (error) {
      console.error('Erro ao deletar cliente permanentemente:', error);
      res.status(500).json({ erro: 'Erro ao deletar cliente' });
    }
  }
}

export default new ClienteController();

