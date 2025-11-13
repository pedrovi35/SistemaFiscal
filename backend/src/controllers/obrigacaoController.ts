import { Request, Response } from 'express';
import obrigacaoModel from '../models/obrigacaoModel';
import recorrenciaService from '../services/recorrenciaService';
import recorrenciaAutomaticaService from '../services/recorrenciaAutomaticaService';
import feriadoService from '../services/feriadoService';
import { FiltroObrigacoes } from '../types';
import { parseISO } from 'date-fns';

export class ObrigacaoController {
  // GET /api/obrigacoes
  async listarTodas(_req: Request, res: Response): Promise<void> {
    try {
      console.log('📋 Iniciando listagem de obrigações...');
      const obrigacoes = await obrigacaoModel.listarTodas();
      console.log(`✅ ${obrigacoes.length} obrigações encontradas`);
      res.json(obrigacoes);
    } catch (error: any) {
      console.error('❌ Erro ao listar obrigações:');
      console.error('📋 Mensagem:', error.message);
      console.error('📋 Stack:', error.stack);
      console.error('📋 Código:', error.code);
      console.error('📋 Detalhes completos:', error);
      res.status(500).json({ 
        erro: 'Erro ao listar obrigações',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined,
        codigo: error.code || undefined
      });
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
      console.log('📥 Recebendo requisição para atualizar obrigação');
      console.log('🆔 ID:', req.params.id);
      console.log('📋 Dados recebidos:', JSON.stringify(req.body, null, 2));
      
      const { id } = req.params;
      const dados = req.body;

      const obrigacaoExistente = await obrigacaoModel.buscarPorId(id);
      if (!obrigacaoExistente) {
        console.error('❌ Obrigação não encontrada:', id);
        res.status(404).json({ erro: 'Obrigação não encontrada' });
        return;
      }

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

      // Ajustar data de vencimento se alterada
      if (dados.dataVencimento) {
        console.log('📅 Processando data de vencimento:', dados.dataVencimento);
        
        try {
          // Garantir formato correto da data (yyyy-MM-dd)
          let dataStr = dados.dataVencimento;
          if (dataStr.includes('T')) {
            dataStr = dataStr.split('T')[0];
          }
          
          if (dados.ajusteDataUtil !== false) {
            console.log('🔧 Ajustando para dia útil...');
            let dataVencimento = parseISO(dataStr);
            const direcao: 'proximo' | 'anterior' = (dados.preferenciaAjuste === 'anterior') ? 'anterior' : 'proximo';
            dataVencimento = await feriadoService.ajustarParaDiaUtil(dataVencimento, direcao);
            dados.dataVencimento = dataVencimento.toISOString().split('T')[0];
            console.log('✅ Data ajustada:', dados.dataVencimento);
          } else {
            dados.dataVencimento = dataStr;
          }
        } catch (dateError: any) {
          console.error('❌ Erro ao processar data:', dateError.message);
          res.status(400).json({ erro: 'Formato de data inválido' });
          return;
        }
      }

      // Validações preditivas antes de atualizar
      console.log('🔍 Validando dados antes de atualizar...');
      
      // Validar que pelo menos um campo foi enviado para atualizar
      const camposPermitidos = [
        'titulo', 'descricao', 'dataVencimento', 'dataVencimentoOriginal',
        'tipo', 'status', 'cliente', 'empresa', 'responsavel',
        'ajusteDataUtil', 'preferenciaAjuste', 'cor', 'recorrencia'
      ];
      
      const camposParaAtualizar = Object.keys(dados).filter(key => 
        camposPermitidos.includes(key) && dados[key] !== undefined
      );
      
      if (camposParaAtualizar.length === 0) {
        console.warn('⚠️ Nenhum campo válido para atualizar');
        res.status(400).json({ erro: 'Nenhum campo válido para atualizar' });
        return;
      }
      
      console.log('✅ Campos a serem atualizados:', camposParaAtualizar);

      console.log('💾 Atualizando obrigação no banco de dados...');
      let obrigacao;
      
      try {
        obrigacao = await obrigacaoModel.atualizar(id, dados);
      } catch (dbError: any) {
        console.error('❌ Erro ao atualizar no banco de dados:', dbError);
        console.error('📋 Mensagem:', dbError.message);
        console.error('📋 Stack:', dbError.stack);
        console.error('📋 Código:', dbError.code);
        
        // Mensagens de erro mais específicas
        if (dbError.code === '23505') { // Unique violation
          res.status(409).json({ 
            erro: 'Violação de constraint única',
            detalhes: process.env.NODE_ENV === 'development' ? dbError.message : undefined
          });
          return;
        } else if (dbError.code === '23503') { // Foreign key violation
          res.status(400).json({ 
            erro: 'Violação de chave estrangeira',
            detalhes: process.env.NODE_ENV === 'development' ? dbError.message : undefined
          });
          return;
        } else if (dbError.code === '42P01') { // Table doesn't exist
          res.status(500).json({ 
            erro: 'Tabela não encontrada no banco de dados',
            detalhes: process.env.NODE_ENV === 'development' ? dbError.message : undefined
          });
          return;
        }
        
        // Erro genérico
        res.status(500).json({ 
          erro: 'Erro ao atualizar obrigação',
          detalhes: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        });
        return;
      }

      if (!obrigacao) {
        console.error('❌ Erro ao atualizar: obrigação não retornada');
        res.status(500).json({ erro: 'Erro ao atualizar obrigação: registro não encontrado após atualização' });
        return;
      }

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
        console.log('📝 Salvando histórico...');
        await obrigacaoModel.salvarHistorico({
          obrigacaoId: id,
          usuario: dados.atualizadoPor || 'Sistema',
          tipo: 'UPDATE',
          camposAlterados
        });
        console.log('✅ Histórico salvo');
      }

      // Emitir evento via WebSocket
      console.log('📡 Emitindo evento via WebSocket...');
      (req as any).io?.emit('obrigacao:updated', obrigacao);

      console.log('✅ Obrigação atualizada com sucesso! Retornando resposta...');
      res.json(obrigacao);
    } catch (error: any) {
      console.error('❌ ERRO ao atualizar obrigação:');
      console.error('📋 Mensagem:', error.message);
      console.error('📋 Stack:', error.stack);
      console.error('📋 Código:', error.code);
      res.status(500).json({ 
        erro: 'Erro ao atualizar obrigação',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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

  // POST /api/obrigacoes/:id/recorrencia/pausar
  async pausarRecorrencia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await recorrenciaAutomaticaService.pausarRecorrencia(id);
      res.json({ mensagem: 'Recorrência pausada com sucesso' });
    } catch (error: any) {
      console.error('Erro ao pausar recorrência:', error);
      res.status(500).json({ erro: error.message });
    }
  }

  // POST /api/obrigacoes/:id/recorrencia/retomar
  async retomarRecorrencia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await recorrenciaAutomaticaService.retomarRecorrencia(id);
      res.json({ mensagem: 'Recorrência retomada com sucesso' });
    } catch (error: any) {
      console.error('Erro ao retomar recorrência:', error);
      res.status(500).json({ erro: error.message });
    }
  }

  // GET /api/obrigacoes/:id/recorrencia/historico
  async buscarHistoricoRecorrencia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const historico = await recorrenciaAutomaticaService.buscarHistoricoRecorrencia(id);
      res.json(historico);
    } catch (error) {
      console.error('Erro ao buscar histórico de recorrência:', error);
      res.status(500).json({ erro: 'Erro ao buscar histórico de recorrência' });
    }
  }
}

export default new ObrigacaoController();
