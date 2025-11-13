import { addMonths, format, parseISO, isBefore, isAfter } from 'date-fns';
import { Obrigacao, TipoRecorrencia, StatusObrigacao } from '../types';

/**
 * Gera eventos virtuais (futuros) baseados na recorrência de uma obrigação
 * @param obrigacao Obrigação com recorrência configurada
 * @param mesesFuturos Número de meses para gerar no futuro (padrão: 12)
 * @returns Array de obrigações virtuais (futuras)
 */
export function gerarEventosRecorrentesFuturos(
  obrigacao: Obrigacao,
  mesesFuturos: number = 12
): Obrigacao[] {
  // Validar se tem recorrência ativa
  if (!obrigacao.recorrencia || obrigacao.recorrencia.ativo === false) {
    return [];
  }

  const recorrencia = obrigacao.recorrencia;
  const eventosVirtuais: Obrigacao[] = [];
  
  // Data de início para cálculo (data de vencimento original da obrigação)
  let dataBase = parseISO(obrigacao.dataVencimento);
  
  // Data limite (até quando gerar eventos)
  const dataLimiteGeracao = addMonths(new Date(), mesesFuturos);
  
  // Verificar se tem data fim configurada
  let dataFimRecorrencia: Date | null = null;
  if (recorrencia.dataFim) {
    dataFimRecorrencia = parseISO(recorrencia.dataFim);
    // Se a data fim é menor que a data limite, usar a data fim
    if (isBefore(dataFimRecorrencia, dataLimiteGeracao)) {
      // Usar data fim como limite
    }
  }

  // Determinar o intervalo em meses baseado no tipo de recorrência
  let intervaloMeses: number;
  switch (recorrencia.tipo) {
    case TipoRecorrencia.MENSAL:
      intervaloMeses = 1;
      break;
    case TipoRecorrencia.BIMESTRAL:
      intervaloMeses = 2;
      break;
    case TipoRecorrencia.TRIMESTRAL:
      intervaloMeses = 3;
      break;
    case TipoRecorrencia.SEMESTRAL:
      intervaloMeses = 6;
      break;
    case TipoRecorrencia.ANUAL:
      intervaloMeses = 12;
      break;
    case TipoRecorrencia.CUSTOMIZADA:
      intervaloMeses = recorrencia.intervalo || 1;
      break;
    default:
      intervaloMeses = 1;
  }

  // Gerar eventos futuros
  let ocorrenciaAtual = dataBase;
  let contador = 0;
  const maxOcorrencias = 100; // Limite de segurança

  while (contador < maxOcorrencias) {
    // Calcular próxima ocorrência
    if (contador === 0) {
      // Primeira iteração: adicionar o intervalo à data base
      ocorrenciaAtual = addMonths(dataBase, intervaloMeses);
    } else {
      // Demais iterações: adicionar intervalo à ocorrência atual
      ocorrenciaAtual = addMonths(ocorrenciaAtual, intervaloMeses);
    }

    // Se tem dia fixo do mês configurado, ajustar
    if (recorrencia.diaDoMes) {
      const ano = ocorrenciaAtual.getFullYear();
      const mes = ocorrenciaAtual.getMonth();
      const maxDiaNoMes = new Date(ano, mes + 1, 0).getDate();
      const diaAjustado = Math.min(recorrencia.diaDoMes, maxDiaNoMes);
      ocorrenciaAtual = new Date(ano, mes, diaAjustado);
    }

    // Verificar se ultrapassou o limite de geração
    if (isAfter(ocorrenciaAtual, dataLimiteGeracao)) {
      break;
    }

    // Verificar se ultrapassou a data fim da recorrência
    if (dataFimRecorrencia && isAfter(ocorrenciaAtual, dataFimRecorrencia)) {
      break;
    }

    // Criar evento virtual
    const eventoVirtual: Obrigacao = {
      ...obrigacao,
      id: `${obrigacao.id}-recorrencia-${contador}`, // ID virtual único
      dataVencimento: format(ocorrenciaAtual, 'yyyy-MM-dd'),
      dataVencimentoOriginal: format(ocorrenciaAtual, 'yyyy-MM-dd'),
      status: StatusObrigacao.PENDENTE,
      // Marcar como virtual para identificação
      criadoEm: '', // Não tem data de criação ainda (evento virtual)
      atualizadoEm: ''
    };

    eventosVirtuais.push(eventoVirtual);
    contador++;
  }

  return eventosVirtuais;
}

/**
 * Gera todos os eventos recorrentes futuros de uma lista de obrigações
 * @param obrigacoes Lista de obrigações
 * @param mesesFuturos Número de meses para gerar no futuro
 * @returns Array de obrigações incluindo as virtuais
 */
export function gerarTodosEventosRecorrentes(
  obrigacoes: Obrigacao[],
  mesesFuturos: number = 12
): Obrigacao[] {
  const todasObrigacoes: Obrigacao[] = [...obrigacoes];
  
  obrigacoes.forEach(obrigacao => {
    const eventosVirtuais = gerarEventosRecorrentesFuturos(obrigacao, mesesFuturos);
    todasObrigacoes.push(...eventosVirtuais);
  });

  return todasObrigacoes;
}

/**
 * Verifica se uma obrigação é um evento virtual (futuro/recorrente não criado ainda)
 * @param obrigacao Obrigação a verificar
 * @returns true se for virtual
 */
export function isEventoVirtual(obrigacao: Obrigacao): boolean {
  // Garantir que id seja string (pode vir como número do backend)
  const idString = String(obrigacao.id || '');
  return idString.includes('-recorrencia-') || obrigacao.criadoEm === '';
}

/**
 * Extrai o ID original de uma obrigação virtual
 * @param obrigacao Obrigação virtual
 * @returns ID da obrigação original
 */
export function getIdOriginal(obrigacao: Obrigacao): string {
  // Garantir que id seja string (pode vir como número do backend)
  const idString = String(obrigacao.id || '');
  
  if (isEventoVirtual(obrigacao)) {
    return idString.split('-recorrencia-')[0];
  }
  return idString;
}