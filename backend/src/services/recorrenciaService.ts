import { addMonths, addYears, parseISO, format, isBefore, isAfter } from 'date-fns';
import { Recorrencia, TipoRecorrencia, Obrigacao } from '../types';
import feriadoService from './feriadoService';

export class RecorrenciaService {
  // Calcular próxima ocorrência (geração lazy)
  async calcularProximaOcorrencia(
    dataAtual: Date,
    recorrencia: Recorrencia,
    ajusteDataUtil: boolean = true
  ): Promise<Date> {
    let proximaData: Date;

    switch (recorrencia.tipo) {
      case TipoRecorrencia.MENSAL:
        proximaData = addMonths(dataAtual, 1);
        break;
      
      case TipoRecorrencia.BIMESTRAL:
        proximaData = addMonths(dataAtual, 2);
        break;
      
      case TipoRecorrencia.TRIMESTRAL:
        proximaData = addMonths(dataAtual, 3);
        break;
      
      case TipoRecorrencia.SEMESTRAL:
        proximaData = addMonths(dataAtual, 6);
        break;
      
      case TipoRecorrencia.ANUAL:
        proximaData = addYears(dataAtual, 1);
        break;
      
      case TipoRecorrencia.CUSTOMIZADA:
        if (recorrencia.intervalo) {
          proximaData = addMonths(dataAtual, recorrencia.intervalo);
        } else {
          proximaData = addMonths(dataAtual, 1);
        }
        break;
      
      default:
        proximaData = addMonths(dataAtual, 1);
    }

    // Ajustar para dia específico do mês se configurado
    if (recorrencia.diaDoMes) {
      const maxDia = new Date(
        proximaData.getFullYear(),
        proximaData.getMonth() + 1,
        0
      ).getDate();
      
      const dia = Math.min(recorrencia.diaDoMes, maxDia);
      proximaData.setDate(dia);
    }

    // Ajustar para dia útil se necessário
    if (ajusteDataUtil) {
      proximaData = await feriadoService.ajustarParaDiaUtil(proximaData);
    }

    return proximaData;
  }

  // Verificar se deve gerar próxima ocorrência
  deveGerarProxima(recorrencia: Recorrencia): boolean {
    if (!recorrencia.dataFim) {
      return true;
    }

    const dataFim = parseISO(recorrencia.dataFim);
    const hoje = new Date();

    return isBefore(hoje, dataFim);
  }

  // Gerar próxima obrigação a partir de recorrência
  async gerarProximaObrigacao(obrigacao: Obrigacao): Promise<Partial<Obrigacao> | null> {
    if (!obrigacao.recorrencia) {
      return null;
    }

    if (!this.deveGerarProxima(obrigacao.recorrencia)) {
      return null;
    }

    const dataAtual = parseISO(obrigacao.dataVencimento);
    const proximaData = await this.calcularProximaOcorrencia(
      dataAtual,
      obrigacao.recorrencia,
      obrigacao.ajusteDataUtil
    );

    return {
      titulo: obrigacao.titulo,
      descricao: obrigacao.descricao,
      dataVencimento: format(proximaData, 'yyyy-MM-dd'),
      dataVencimentoOriginal: format(proximaData, 'yyyy-MM-dd'),
      tipo: obrigacao.tipo,
      status: obrigacao.status,
      cliente: obrigacao.cliente,
      empresa: obrigacao.empresa,
      responsavel: obrigacao.responsavel,
      recorrencia: obrigacao.recorrencia,
      ajusteDataUtil: obrigacao.ajusteDataUtil,
      cor: obrigacao.cor
    };
  }

  // Validar recorrência
  validarRecorrencia(recorrencia: Recorrencia): { valido: boolean; erro?: string } {
    if (recorrencia.tipo === TipoRecorrencia.CUSTOMIZADA && !recorrencia.intervalo) {
      return { valido: false, erro: 'Intervalo é obrigatório para recorrência customizada' };
    }

    if (recorrencia.diaDoMes && (recorrencia.diaDoMes < 1 || recorrencia.diaDoMes > 31)) {
      return { valido: false, erro: 'Dia do mês deve estar entre 1 e 31' };
    }

    if (recorrencia.dataFim) {
      const dataFim = parseISO(recorrencia.dataFim);
      const hoje = new Date();
      
      if (isBefore(dataFim, hoje)) {
        return { valido: false, erro: 'Data fim não pode ser anterior à data atual' };
      }
    }

    return { valido: true };
  }
}

export default new RecorrenciaService();

