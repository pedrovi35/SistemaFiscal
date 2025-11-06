import { Request, Response } from 'express';
import obrigacaoModel from '../models/obrigacaoModel';
import recorrenciaService from '../services/recorrenciaService';
import feriadoService from '../services/feriadoService';
import { FiltroObrigacoes } from '../types';
import { parseISO } from 'date-fns';

export class ObrigacaoController {
  // GET /api/obrigacoes
  async listarTodas(_req: Request, res: Response): Promise<void> {
    try {
      const obrigacoes = await obrigacaoModel.listarTodas();
      res.json(obrigacoes);
    } catch (error) {
      console.error('Erro ao listar obrigações:', error);
      res.status(500).json({ erro: 'Erro ao listar obrigações' });
    }
  }

  // GET /api/obrigacoes/:id
  async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const obrigacao = await obrigacaoModel.buscarPorId(id);

      if (!obrigacao) {
        res.status(404).json({ erro: 'Obrigação não encontrada' });
        return;
      }

      res.json(obrigacao);
    } catch (error) {
      console.error('Erro ao buscar obrigação:', error);
      res.status(500).json({ erro: 'Erro ao buscar obrigação' });
    }
  }

  // GET /api/obrigacoes/filtrar
  async filtrar(req: Request, res: Response): Promise<void> {
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

      const obrigacoes = await obrigacaoModel.filtrar(filtro);
      res.json(obrigacoes);
    } catch (error) {
      console.error('Erro ao filtrar obrigações:', error);
      res.status(500).json({ erro: 'Erro ao filtrar obrigações' });
    }
  }

  // POST /api/obrigacoes
  async criar(req: Request, res: Response): Promise<void> {
    try {
      console.log('📥 Recebendo requisição para criar obrigação');
      console.log('📋 Dados recebidos:', JSON.stringify(req.body, null, 2));
      
      const dados = req.body;

      // Validar recorrência se existir
      if (dados.recorrencia) {
        console.log('🔄 Validando recorrência...');
        
        // Garantir que recorrência é um objeto, não uma string
        if (typeof dados.recorrencia === 'string') {
          console.error('❌ Recorrência deve ser um objeto, não uma string:', dados.recorrencia);
          res.status(400).json({ 
            erro: 'Formato de recorrência inválido. Esperado objeto com propriedade "tipo"' 
          });
          return;
        }
        
        const validacao = recorrenciaService.validarRecorrencia(dados.recorrencia);
        if (!validacao.valido) {
          console.error('❌ Recorrência inválida:', validacao.erro);
          res.status(400).json({ erro: validacao.erro });
          return;
        }
        console.log('✅ Recorrência válida');
      }

      // Ajustar data de vencimento se necessário
      console.log('📅 Processando data de vencimento:', dados.dataVencimento);
      let dataVencimento = parseISO(dados.dataVencimento);
      const dataVencimentoOriginal = dataVencimento;

      if (dados.ajusteDataUtil !== false) {
        console.log('🔧 Ajustando para dia útil...');
        const direcao: 'proximo' | 'anterior' = (dados.preferenciaAjuste === 'anterior') ? 'anterior' : 'proximo';
        dataVencimento = await feriadoService.ajustarParaDiaUtil(dataVencimento, direcao);
        console.log('✅ Data ajustada:', dataVencimento.toISOString().split('T')[0]);
      }

      console.log('💾 Salvando obrigação no banco de dados...');
      const obrigacao = await obrigacaoModel.criar({
        ...dados,
        dataVencimento: dataVencimento.toISOString().split('T')[0],
        dataVencimentoOriginal: dataVencimentoOriginal.toISOString().split('T')[0],
        ajusteDataUtil: dados.ajusteDataUtil !== false
      });
      console.log('✅ Obrigação criada com ID:', obrigacao.id);

      // Salvar histórico
      console.log('📝 Salvando histórico...');
      await obrigacaoModel.salvarHistorico({
        obrigacaoId: obrigacao.id,
        usuario: dados.criadoPor || 'Sistema',
        tipo: 'CREATE'
      });
      console.log('✅ Histórico salvo');

      // Emitir evento via WebSocket (será tratado no server.ts)
      console.log('📡 Emitindo evento via WebSocket...');
      (req as any).io?.emit('obrigacao:created', obrigacao);

      console.log('✅ Obrigação criada com sucesso! Retornando resposta...');
      res.status(201).json(obrigacao);
    } catch (error: any) {
      console.error('❌ ERRO ao criar obrigação:');
      console.error('📋 Mensagem:', error.message);
      console.error('📋 Stack:', error.stack);
      console.error('📋 Código:', error.code);
      console.error('📋 Detalhes completos:', error);
      res.status(500).json({ 
        erro: 'Erro ao criar obrigação',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // PUT /api/obrigacoes/:id
  async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dados = req.body;

      const obrigacaoExistente = await obrigacaoModel.buscarPorId(id);
      if (!obrigacaoExistente) {
        res.status(404).json({ erro: 'Obrigação não encontrada' });
        return;
      }

      // Validar recorrência se existir
      if (dados.recorrencia) {
        // Garantir que recorrência é um objeto, não uma string
        if (typeof dados.recorrencia === 'string') {
          res.status(400).json({ 
            erro: 'Formato de recorrência inválido. Esperado objeto com propriedade "tipo"' 
          });
          return;
        }
        
        const validacao = recorrenciaService.validarRecorrencia(dados.recorrencia);
        if (!validacao.valido) {
          res.status(400).json({ erro: validacao.erro });
          return;
        }
      }

      // Ajustar data de vencimento se alterada
      if (dados.dataVencimento && dados.ajusteDataUtil !== false) {
        let dataVencimento = parseISO(dados.dataVencimento);
        const direcao: 'proximo' | 'anterior' = (dados.preferenciaAjuste === 'anterior') ? 'anterior' : 'proximo';
        dataVencimento = await feriadoService.ajustarParaDiaUtil(dataVencimento, direcao);
        dados.dataVencimento = dataVencimento.toISOString().split('T')[0];
      }

      const obrigacao = await obrigacaoModel.atualizar(id, dados);

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
        await obrigacaoModel.salvarHistorico({
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
  async deletar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const obrigacao = await obrigacaoModel.buscarPorId(id);
      if (!obrigacao) {
        res.status(404).json({ erro: 'Obrigação não encontrada' });
        return;
      }

      // Salvar histórico antes de deletar
      await obrigacaoModel.salvarHistorico({
        obrigacaoId: id,
        usuario: req.body.deletadoPor || 'Sistema',
        tipo: 'DELETE'
      });

      const sucesso = await obrigacaoModel.deletar(id);

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
  async buscarHistorico(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const historico = await obrigacaoModel.buscarHistorico(id);
      res.json(historico);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      res.status(500).json({ erro: 'Erro ao buscar histórico' });
    }
  }

  // POST /api/obrigacoes/:id/gerar-proxima
  async gerarProxima(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const obrigacao = await obrigacaoModel.buscarPorId(id);

      if (!obrigacao) {
        res.status(404).json({ erro: 'Obrigação não encontrada' });
        return;
      }

      if (!obrigacao.recorrencia) {
        res.status(400).json({ erro: 'Obrigação não possui recorrência configurada' });
        return;
      }

      const proximaObrigacao = await recorrenciaService.gerarProximaObrigacao(obrigacao);

      if (!proximaObrigacao) {
        res.status(400).json({ erro: 'Não foi possível gerar próxima ocorrência' });
        return;
      }

      const novaObrigacao = await obrigacaoModel.criar(proximaObrigacao as any);

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
