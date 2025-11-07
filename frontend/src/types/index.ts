export interface Obrigacao {
  id: string;
  titulo: string;
  descricao?: string;
  dataVencimento: string;
  dataVencimentoOriginal: string;
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
  intervalo?: number;
  diaDoMes?: number; // Dia fixo do mês para vencimento (1-31)
  dataFim?: string; // Data limite para parar geração
  proximaOcorrencia?: string; // Próxima data de criação
  ativo?: boolean; // Controle de pausa/retomada
  diaGeracao?: number; // Dia do mês para gerar (padrão: 1)
  ultimaGeracao?: string; // Última geração automática
}

export interface Feriado {
  data: string;
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

export const CoresObrigacao: Record<TipoObrigacao, string> = {
  [TipoObrigacao.FEDERAL]: '#3B82F6',
  [TipoObrigacao.ESTADUAL]: '#10B981',
  [TipoObrigacao.MUNICIPAL]: '#F59E0B',
  [TipoObrigacao.TRABALHISTA]: '#EF4444',
  [TipoObrigacao.PREVIDENCIARIA]: '#8B5CF6',
  [TipoObrigacao.OUTRO]: '#6B7280'
};

export const NomesTipoObrigacao: Record<TipoObrigacao, string> = {
  [TipoObrigacao.FEDERAL]: 'Federal',
  [TipoObrigacao.ESTADUAL]: 'Estadual',
  [TipoObrigacao.MUNICIPAL]: 'Municipal',
  [TipoObrigacao.TRABALHISTA]: 'Trabalhista',
  [TipoObrigacao.PREVIDENCIARIA]: 'Previdenciária',
  [TipoObrigacao.OUTRO]: 'Outro'
};

export const NomesStatusObrigacao: Record<StatusObrigacao, string> = {
  [StatusObrigacao.PENDENTE]: 'Pendente',
  [StatusObrigacao.EM_ANDAMENTO]: 'Em Andamento',
  [StatusObrigacao.CONCLUIDA]: 'Concluída',
  [StatusObrigacao.ATRASADA]: 'Atrasada',
  [StatusObrigacao.CANCELADA]: 'Cancelada'
};

export const NomesTipoRecorrencia: Record<TipoRecorrencia, string> = {
  [TipoRecorrencia.MENSAL]: 'Mensal',
  [TipoRecorrencia.BIMESTRAL]: 'Bimestral',
  [TipoRecorrencia.TRIMESTRAL]: 'Trimestral',
  [TipoRecorrencia.SEMESTRAL]: 'Semestral',
  [TipoRecorrencia.ANUAL]: 'Anual',
  [TipoRecorrencia.CUSTOMIZADA]: 'Customizada'
};

