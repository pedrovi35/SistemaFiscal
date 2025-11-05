export interface Obrigacao {
  id: string;
  titulo: string;
  descricao?: string;
  dataVencimento: string; // ISO string
  dataVencimentoOriginal: string; // ISO string
  tipo: TipoObrigacao;
  status: StatusObrigacao;
  cliente?: string;
  empresa?: string;
  responsavel?: string;
  recorrencia?: Recorrencia;
  ajusteDataUtil: boolean;
  preferenciaAjuste?: 'proximo' | 'anterior';
  cor?: string;
  criadoEm: string;
  atualizadoEm: string;
  criadoPor?: string;
}

export enum TipoObrigacao {
  FEDERAL = 'FEDERAL',
  ESTADUAL = 'ESTADUAL',
  MUNICIPAL = 'MUNICIPAL',
  TRABALHISTA = 'TRABALHISTA',
  PREVIDENCIARIA = 'PREVIDENCIARIA',
  OUTRO = 'OUTRO'
}

export enum StatusObrigacao {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  ATRASADA = 'ATRASADA',
  CANCELADA = 'CANCELADA'
}

export enum TipoRecorrencia {
  MENSAL = 'MENSAL',
  BIMESTRAL = 'BIMESTRAL',
  TRIMESTRAL = 'TRIMESTRAL',
  SEMESTRAL = 'SEMESTRAL',
  ANUAL = 'ANUAL',
  CUSTOMIZADA = 'CUSTOMIZADA'
}

export interface Recorrencia {
  tipo: TipoRecorrencia;
  intervalo?: number; // Para customizada
  diaDoMes?: number; // Dia específico do mês (1-31)
  dataFim?: string; // ISO string - quando parar a recorrência
  proximaOcorrencia?: string; // ISO string
}

export interface Feriado {
  data: string; // ISO string
  nome: string;
  tipo: 'nacional' | 'estadual' | 'municipal';
}

export interface FiltroObrigacoes {
  cliente?: string;
  empresa?: string;
  responsavel?: string;
  tipo?: TipoObrigacao;
  status?: StatusObrigacao;
  mes?: number;
  ano?: number;
  dataInicio?: string;
  dataFim?: string;
}

export interface HistoricoAlteracao {
  id: string;
  obrigacaoId: string;
  usuario: string;
  tipo: 'CREATE' | 'UPDATE' | 'DELETE';
  camposAlterados?: Record<string, { anterior: any; novo: any }>;
  timestamp: string;
}

export interface WebSocketMessage {
  type: 'obrigacao:created' | 'obrigacao:updated' | 'obrigacao:deleted' | 'user:connected' | 'user:disconnected';
  data: any;
  userId?: string;
  timestamp: string;
}

export const CoresObrigacao: Record<TipoObrigacao, string> = {
  [TipoObrigacao.FEDERAL]: '#3B82F6',
  [TipoObrigacao.ESTADUAL]: '#10B981',
  [TipoObrigacao.MUNICIPAL]: '#F59E0B',
  [TipoObrigacao.TRABALHISTA]: '#EF4444',
  [TipoObrigacao.PREVIDENCIARIA]: '#8B5CF6',
  [TipoObrigacao.OUTRO]: '#6B7280'
};

