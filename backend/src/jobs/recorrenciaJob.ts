import cron from 'node-cron';
import recorrenciaAutomaticaService from '../services/recorrenciaAutomaticaService';

/**
 * Job de Geração Automática de Obrigações Recorrentes
 * 
 * Executa diariamente às 00:05 (5 minutos após meia-noite)
 * para verificar e gerar obrigações recorrentes
 */
export class RecorrenciaJob {
  private job: cron.ScheduledTask | null = null;
  private executando = false;
  
  /**
   * Iniciar job
   */
  iniciar(): void {
    // Executar todos os dias às 00:05
    // Cron: '5 0 * * *' = minuto 5, hora 0, todos os dias
    this.job = cron.schedule('5 0 * * *', async () => {
      await this.executar();
    }, {
      scheduled: true,
      timezone: 'America/Sao_Paulo' // Ajuste conforme necessário
    });
    
    console.log('✅ Job de recorrência automática iniciado (executa às 00:05 diariamente)');
    
    // Executar imediatamente na inicialização (opcional)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Executando job inicial em desenvolvimento...');
      setTimeout(() => this.executar(), 5000); // Aguardar 5 segundos após inicialização
    }
  }
  
  /**
   * Parar job
   */
  parar(): void {
    if (this.job) {
      this.job.stop();
      console.log('⏹️ Job de recorrência automática parado');
    }
  }
  
  /**
   * Executar job manualmente
   */
  async executar(): Promise<void> {
    if (this.executando) {
      console.log('⚠️ Job já está em execução, pulando...');
      return;
    }
    
    this.executando = true;
    const inicio = Date.now();
    
    try {
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔄 EXECUTANDO GERAÇÃO AUTOMÁTICA DE OBRIGAÇÕES');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
      console.log('');
      
      const resultado = await recorrenciaAutomaticaService.executarGeracaoAutomatica();
      
      const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
      
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ GERAÇÃO AUTOMÁTICA CONCLUÍDA');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`📊 Total analisadas: ${resultado.total}`);
      console.log(`✅ Obrigações geradas: ${resultado.geradas}`);
      console.log(`❌ Erros: ${resultado.erros}`);
      console.log(`⏱️ Duração: ${duracao}s`);
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
      
      // Log das obrigações geradas
      if (resultado.obrigacoes.length > 0) {
        console.log('📋 Obrigações geradas:');
        resultado.obrigacoes.forEach(o => {
          console.log(`  - ${o.titulo} (vencimento: ${o.dataVencimento})`);
        });
        console.log('');
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao executar job de recorrência:', error.message);
      console.error(error.stack);
    } finally {
      this.executando = false;
    }
  }
  
  /**
   * Verificar se está executando
   */
  isExecutando(): boolean {
    return this.executando;
  }
}

export default new RecorrenciaJob();

