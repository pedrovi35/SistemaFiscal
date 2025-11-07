import { parseISO, format, isBefore, differenceInMonths } from 'date-fns';
import { Obrigacao, TipoRecorrencia, StatusObrigacao } from '../types';
import obrigacaoModel from '../models/obrigacaoModel';
import feriadoService from './feriadoService';

/**
 * Serviço de Geração Automática de Obrigações Recorrentes
 * 
 * Regras:
 * - Toda obrigação é gerada no dia configurado (padrão: dia 1 de cada mês)
 * - Data de vencimento é fixa (ex: sempre dia 20)
 * - Periodicidade: Mensal, Trimestral, Semestral, Anual
 * - Só gera quando o ciclo é atingido
 * - Permite pausar/retomar recorrências
 */
export class RecorrenciaAutomaticaService {
  
  /**
   * Executar geração automática (deve ser chamado diariamente via cron)
   */
  async executarGeracaoAutomatica(): Promise<{
    total: number;
    geradas: number;
    erros: number;
    obrigacoes: any[];
  }> {
    console.log('🔄 Iniciando geração automática de obrigações recorrentes...');
    const hoje = new Date();
    
    try {
      // Buscar todas as obrigações com recorrência ativa
      const obrigacoesComRecorrencia = await this.buscarObrigacoesRecorrentesAtivas();
      
      console.log(`📊 Encontradas ${obrigacoesComRecorrencia.length} obrigações com recorrência ativa`);
      
      let geradas = 0;
      let erros = 0;
      const obrigacoesGeradas: any[] = [];
      
      for (const obrigacao of obrigacoesComRecorrencia) {
        try {
          // Verificar se deve gerar hoje
          if (await this.deveGerarHoje(obrigacao, hoje)) {
            console.log(`✅ Gerando obrigação: ${obrigacao.titulo}`);
            const novaObrigacao = await this.gerarProximaObrigacao(obrigacao, hoje);
            
            if (novaObrigacao) {
              obrigacoesGeradas.push(novaObrigacao);
              geradas++;
            }
          }
        } catch (error: any) {
          console.error(`❌ Erro ao gerar obrigação ${obrigacao.id}:`, error.message);
          erros++;
        }
      }
      
      console.log(`✅ Geração automática concluída: ${geradas} geradas, ${erros} erros`);
      
      return {
        total: obrigacoesComRecorrencia.length,
        geradas,
        erros,
        obrigacoes: obrigacoesGeradas
      };
    } catch (error: any) {
      console.error('❌ Erro na geração automática:', error.message);
      throw error;
    }
  }
  
  /**
   * Buscar obrigações com recorrência ativa
   */
  private async buscarObrigacoesRecorrentesAtivas(): Promise<Obrigacao[]> {
    const todasObrigacoes = await obrigacaoModel.listarTodas();
    
    return todasObrigacoes.filter(o => {
      // Tem recorrência configurada
      if (!o.recorrencia) return false;
      
      // Recorrência está ativa (padrão: true se não especificado)
      if (o.recorrencia.ativo === false) return false;
      
      // Verificar se não passou da data fim
      if (o.recorrencia.dataFim) {
        const dataFim = parseISO(o.recorrencia.dataFim);
        if (isBefore(dataFim, new Date())) return false;
      }
      
      return true;
    });
  }
  
  /**
   * Verificar se deve gerar obrigação hoje
   */
  private async deveGerarHoje(obrigacao: Obrigacao, hoje: Date): Promise<boolean> {
    if (!obrigacao.recorrencia) return false;
    
    const recorrencia = obrigacao.recorrencia;
    
    // 1. Verificar se é o dia de geração (padrão: dia 1)
    const diaGeracao = recorrencia.diaGeracao || 1;
    if (hoje.getDate() !== diaGeracao) {
      return false;
    }
    
    // 2. Verificar se já gerou este mês
    if (recorrencia.ultimaGeracao) {
      const ultimaGeracao = parseISO(recorrencia.ultimaGeracao);
      
      // Se gerou no mesmo mês/ano, não gera novamente
      if (
        ultimaGeracao.getMonth() === hoje.getMonth() &&
        ultimaGeracao.getFullYear() === hoje.getFullYear()
      ) {
        return false;
      }
    }
    
    // 3. Verificar se atingiu o ciclo de recorrência
    const dataVencimento = parseISO(obrigacao.dataVencimento);
    const mesesDesdeUltimaGeracao = recorrencia.ultimaGeracao 
      ? differenceInMonths(hoje, parseISO(recorrencia.ultimaGeracao))
      : differenceInMonths(hoje, dataVencimento);
    
    let cicloEmMeses = 1; // Padrão: mensal
    
    switch (recorrencia.tipo) {
      case TipoRecorrencia.MENSAL:
        cicloEmMeses = 1;
        break;
      case TipoRecorrencia.BIMESTRAL:
        cicloEmMeses = 2;
        break;
      case TipoRecorrencia.TRIMESTRAL:
        cicloEmMeses = 3;
        break;
      case TipoRecorrencia.SEMESTRAL:
        cicloEmMeses = 6;
        break;
      case TipoRecorrencia.ANUAL:
        cicloEmMeses = 12;
        break;
      case TipoRecorrencia.CUSTOMIZADA:
        cicloEmMeses = recorrencia.intervalo || 1;
        break;
    }
    
    // Só gera se passou o período do ciclo
    return mesesDesdeUltimaGeracao >= cicloEmMeses;
  }
  
  /**
   * Gerar próxima obrigação
   */
  private async gerarProximaObrigacao(obrigacaoOriginal: Obrigacao, dataGeracao: Date): Promise<Obrigacao | null> {
    if (!obrigacaoOriginal.recorrencia) return null;
    
    const recorrencia = obrigacaoOriginal.recorrencia;
    
    // Calcular data de vencimento
    // Se diaDoMes está configurado, usar esse dia fixo
    let dataVencimento: Date;
    
    if (recorrencia.diaDoMes) {
      // Usar dia fixo do mês atual de geração
      const ano = dataGeracao.getFullYear();
      const mes = dataGeracao.getMonth();
      
      // Verificar último dia do mês para não passar
      const ultimoDiaDoMes = new Date(ano, mes + 1, 0).getDate();
      const diaVencimento = Math.min(recorrencia.diaDoMes, ultimoDiaDoMes);
      
      dataVencimento = new Date(ano, mes, diaVencimento);
    } else {
      // Usar a mesma diferença de dias da obrigação original
      const dataVencimentoOriginal = parseISO(obrigacaoOriginal.dataVencimento);
      const diferencaDias = dataVencimentoOriginal.getDate() - 1; // Assumindo criação no dia 1
      
      dataVencimento = new Date(dataGeracao);
      dataVencimento.setDate(dataGeracao.getDate() + diferencaDias);
    }
    
    // Ajustar para dia útil se necessário
    const dataVencimentoOriginalSemAjuste = new Date(dataVencimento);
    if (obrigacaoOriginal.ajusteDataUtil) {
      const direcao = obrigacaoOriginal.preferenciaAjuste || 'proximo';
      dataVencimento = await feriadoService.ajustarParaDiaUtil(dataVencimento, direcao as any);
    }
    
    // Criar nova obrigação
    const dadosNovaObrigacao = {
      titulo: obrigacaoOriginal.titulo,
      descricao: obrigacaoOriginal.descricao || '',
      dataVencimento: format(dataVencimento, 'yyyy-MM-dd'),
      dataVencimentoOriginal: format(dataVencimentoOriginalSemAjuste, 'yyyy-MM-dd'),
      tipo: obrigacaoOriginal.tipo,
      status: StatusObrigacao.PENDENTE, // Sempre começa como pendente
      cliente: obrigacaoOriginal.cliente,
      empresa: obrigacaoOriginal.empresa,
      responsavel: obrigacaoOriginal.responsavel,
      recorrencia: recorrencia, // Manter a mesma configuração
      ajusteDataUtil: obrigacaoOriginal.ajusteDataUtil,
      preferenciaAjuste: obrigacaoOriginal.preferenciaAjuste,
      cor: obrigacaoOriginal.cor,
      criadoPor: 'Sistema (Recorrência Automática)'
    };
    
    console.log('📝 Criando nova obrigação recorrente:', {
      titulo: dadosNovaObrigacao.titulo,
      dataVencimento: dadosNovaObrigacao.dataVencimento,
      tipo: dadosNovaObrigacao.tipo
    });
    
    const novaObrigacao = await obrigacaoModel.criar(dadosNovaObrigacao as any);
    
    // Atualizar última geração na obrigação original
    await this.atualizarUltimaGeracao(obrigacaoOriginal.id, dataGeracao);
    
    // Salvar no histórico
    await obrigacaoModel.salvarHistorico({
      obrigacaoId: novaObrigacao.id,
      usuario: 'Sistema',
      tipo: 'CREATE',
      camposAlterados: {
        origem: {
          anterior: null,
          novo: `Gerada automaticamente a partir da obrigação #${obrigacaoOriginal.id}`
        }
      }
    });
    
    return novaObrigacao;
  }
  
  /**
   * Atualizar última geração na recorrência
   */
  private async atualizarUltimaGeracao(obrigacaoId: string, dataGeracao: Date): Promise<void> {
    const obrigacao = await obrigacaoModel.buscarPorId(obrigacaoId);
    
    if (!obrigacao || !obrigacao.recorrencia) return;
    
    const recorrenciaAtualizada = {
      ...obrigacao.recorrencia,
      ultimaGeracao: format(dataGeracao, 'yyyy-MM-dd')
    };
    
    await obrigacaoModel.atualizar(obrigacaoId, {
      recorrencia: recorrenciaAtualizada
    } as any);
    
    console.log(`✅ Atualizada última geração da obrigação #${obrigacaoId}`);
  }
  
  /**
   * Pausar recorrência
   */
  async pausarRecorrencia(obrigacaoId: string): Promise<void> {
    const obrigacao = await obrigacaoModel.buscarPorId(obrigacaoId);
    
    if (!obrigacao || !obrigacao.recorrencia) {
      throw new Error('Obrigação não possui recorrência configurada');
    }
    
    const recorrenciaAtualizada = {
      ...obrigacao.recorrencia,
      ativo: false
    };
    
    await obrigacaoModel.atualizar(obrigacaoId, {
      recorrencia: recorrenciaAtualizada
    } as any);
    
    console.log(`⏸️ Recorrência pausada para obrigação #${obrigacaoId}`);
  }
  
  /**
   * Retomar recorrência
   */
  async retomarRecorrencia(obrigacaoId: string): Promise<void> {
    const obrigacao = await obrigacaoModel.buscarPorId(obrigacaoId);
    
    if (!obrigacao || !obrigacao.recorrencia) {
      throw new Error('Obrigação não possui recorrência configurada');
    }
    
    const recorrenciaAtualizada = {
      ...obrigacao.recorrencia,
      ativo: true
    };
    
    await obrigacaoModel.atualizar(obrigacaoId, {
      recorrencia: recorrenciaAtualizada
    } as any);
    
    console.log(`▶️ Recorrência retomada para obrigação #${obrigacaoId}`);
  }
  
  /**
   * Buscar histórico de obrigações geradas por recorrência
   */
  async buscarHistoricoRecorrencia(obrigacaoId: string): Promise<Obrigacao[]> {
    const todasObrigacoes = await obrigacaoModel.listarTodas();
    
    // Buscar obrigações que têm o mesmo título e recorrência
    const obrigacaoOriginal = await obrigacaoModel.buscarPorId(obrigacaoId);
    
    if (!obrigacaoOriginal) return [];
    
    return todasObrigacoes.filter(o => 
      o.titulo === obrigacaoOriginal.titulo &&
      o.recorrencia &&
      JSON.stringify(o.recorrencia) === JSON.stringify(obrigacaoOriginal.recorrencia)
    ).sort((a, b) => {
      return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
    });
  }
}

export default new RecorrenciaAutomaticaService();

