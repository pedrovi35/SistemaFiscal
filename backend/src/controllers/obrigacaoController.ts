import { Request, Response } from 'express';
import obrigacaoModel from '../models/obrigacaoModel';
import recorrenciaService from '../services/recorrenciaService';
import feriadoService from '../services/feriadoService';
import { Obrigacao, FiltroObrigacoes } from '../types';
import { parseISO } from 'date-fns';

export class ObrigacaoController {
  // GET /api/obrigacoes
  async listarTodas(req: Request, res: Response) {
    try {
      const obrigacoes = obrigacaoModel.listarTodas();
      res.json(obrigacoes);
    } catch (error) {
      console.error('Erro ao listar obrigações:', error);
      res.status(500).json({ erro: 'Erro ao listar obrigações' });
    }
  }

  // GET /api/obrigacoes/:id
  async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const obrigacao = obrigacaoModel.buscarPorId(id);

      if (!obrigacao) {
        return res.status(404).json({ erro: 'Obrigação não encontrada' });
      }

      res.json(obrigacao);
    } catch (error) {
      console.error('Erro ao buscar obrigação:', error);
      res.status(500).json({ erro: 'Erro ao buscar obrigação' });
    }
  }

  // GET /api/obrigacoes/filtrar
  async filtrar(req: Request, res: Response) {
    try {
      const filtro: FiltroObrigacoes = {
        cliente: req.query.cliente as string,
        empresa: req.query.empresa as string,
        responsavel: req.query.responsavel as string,
        tipo: req.query.tipo as any,
        status: req.query.status as any,
        mes: req.query.mes ? parseInt(req.query.mes as string) : undefined,
        ano: req.query.ano ? parseInt(req.query.ano as string) : undefined,
        dataInicio: req.query.dataInicio as string,
        dataFim: req.query.dataFim as string
      };

      const obrigacoes = obrigacaoModel.filtrar(filtro);
      res.json(obrigacoes);
    } catch (error) {
      console.error('Erro ao filtrar obrigações:', error);
      res.status(500).json({ erro: 'Erro ao filtrar obrigações' });
    }
  }

  // POST /api/obrigacoes
  async criar(req: Request, res: Response) {
    try {
      const dados = req.body;

      // Validar recorrência se existir
      if (dados.recorrencia) {
        const validacao = recorrenciaService.validarRecorrencia(dados.recorrencia);
        if (!validacao.valido) {
          return res.status(400).json({ erro: validacao.erro });
        }
      }

      // Ajustar data de vencimento se necessário
      let dataVencimento = parseISO(dados.dataVencimento);
      const dataVencimentoOriginal = dataVencimento;

      if (dados.ajusteDataUtil !== false) {
        dataVencimento = await feriadoService.ajustarParaDiaUtil(dataVencimento);
      }

      const obrigacao = obrigacaoModel.criar({
        ...dados,
        dataVencimento: dataVencimento.toISOString().split('T')[0],
        dataVencimentoOriginal: dataVencimentoOriginal.toISOString().split('T')[0],
        ajusteDataUtil: dados.ajusteDataUtil !== false
      });

      // Salvar histórico
      obrigacaoModel.salvarHistorico({
        obrigacaoId: obrigacao.id,
        usuario: dados.criadoPor || 'Sistema',
        tipo: 'CREATE'
      });

      // Emitir evento via WebSocket (será tratado no server.ts)
      (req as any).io?.emit('obrigacao:created', obrigacao);

      res.status(201).json(obrigacao);
    } catch (error) {
      console.error('Erro ao criar obrigação:', error);
      res.status(500).json({ erro: 'Erro ao criar obrigação' });
    }
  }

  // PUT /api/obrigacoes/:id
  async atualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dados = req.body;

      const obrigacaoExistente = obrigacaoModel.buscarPorId(id);
      if (!obrigacaoExistente) {
        return res.status(404).json({ erro: 'Obrigação não encontrada' });
      }

      // Validar recorrência se existir
      if (dados.recorrencia) {
        const validacao = recorrenciaService.validarRecorrencia(dados.recorrencia);
        if (!validacao.valido) {
          return res.status(400).json({ erro: validacao.erro });
        }
      }

      // Ajustar data de vencimento se alterada
      if (dados.dataVencimento && dados.ajusteDataUtil !== false) {
        let dataVencimento = parseISO(dados.dataVencimento);
        dataVencimento = await feriadoService.ajustarParaDiaUtil(dataVencimento);
        dados.dataVencimento = dataVencimento.toISOString().split('T')[0];
      }

      const obrigacao = obrigacaoModel.atualizar(id, dados);

      // Detectar mudanças para histórico
      const camposAlterados: Record<string, any> = {};
      for (const key in dados) {
        if ((obrigacaoExistente as any)[key] !== (dados as any)[key]) {
          camposAlterados[key] = {
            anterior: (obrigacaoExistente as any)[key],
            novo: (dados as any)[key]
          };
        }
      }

      // Salvar histórico
      if (Object.keys(camposAlterados).length > 0) {
        obrigacaoModel.salvarHistorico({
          obrigacaoId: id,
          usuario: dados.atualizadoPor || 'Sistema',
          tipo: 'UPDATE',
          camposAlterados
        });
      }

      // Emitir evento via WebSocket
      (req as any).io?.emit('obrigacao:updated', obrigacao);

      res.json(obrigacao);
    } catch (error) {
      console.error('Erro ao atualizar obrigação:', error);
      res.status(500).json({ erro: 'Erro ao atualizar obrigação' });
    }
  }

  // DELETE /api/obrigacoes/:id
  async deletar(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const obrigacao = obrigacaoModel.buscarPorId(id);
      if (!obrigacao) {
        return res.status(404).json({ erro: 'Obrigação não encontrada' });
      }

      // Salvar histórico antes de deletar
      obrigacaoModel.salvarHistorico({
        obrigacaoId: id,
        usuario: req.body.deletadoPor || 'Sistema',
        tipo: 'DELETE'
      });

      const sucesso = obrigacaoModel.deletar(id);

      if (sucesso) {
        // Emitir evento via WebSocket
        (req as any).io?.emit('obrigacao:deleted', { id });
        res.status(204).send();
      } else {
        res.status(500).json({ erro: 'Erro ao deletar obrigação' });
      }
    } catch (error) {
      console.error('Erro ao deletar obrigação:', error);
      res.status(500).json({ erro: 'Erro ao deletar obrigação' });
    }
  }

  // GET /api/obrigacoes/:id/historico
  async buscarHistorico(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const historico = obrigacaoModel.buscarHistorico(id);
      res.json(historico);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      res.status(500).json({ erro: 'Erro ao buscar histórico' });
    }
  }

  // POST /api/obrigacoes/:id/gerar-proxima
  async gerarProxima(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const obrigacao = obrigacaoModel.buscarPorId(id);

      if (!obrigacao) {
        return res.status(404).json({ erro: 'Obrigação não encontrada' });
      }

      if (!obrigacao.recorrencia) {
        return res.status(400).json({ erro: 'Obrigação não possui recorrência configurada' });
      }

      const proximaObrigacao = await recorrenciaService.gerarProximaObrigacao(obrigacao);

      if (!proximaObrigacao) {
        return res.status(400).json({ erro: 'Não foi possível gerar próxima ocorrência' });
      }

      const novaObrigacao = obrigacaoModel.criar(proximaObrigacao as any);

      // Emitir evento via WebSocket
      (req as any).io?.emit('obrigacao:created', novaObrigacao);

      res.status(201).json(novaObrigacao);
    } catch (error) {
      console.error('Erro ao gerar próxima obrigação:', error);
      res.status(500).json({ erro: 'Erro ao gerar próxima obrigação' });
    }
  }
}

export default new ObrigacaoController();

