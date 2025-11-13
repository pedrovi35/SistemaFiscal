import axios from 'axios';
import { Obrigacao, FiltroObrigacoes, Feriado, HistoricoAlteracao } from '../types';
import { Cliente } from '../components/Clientes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  response => response,
  error => {
    const status = error?.response?.status;
    const backendMessage = error?.response?.data?.erro || error?.response?.data?.message;
    const message = backendMessage || error?.message || 'Erro na comunicação com a API';
    const normalized = { ...error, message, status };
    console.error('Erro na API:', normalized);
    return Promise.reject(normalized);
  }
);

// ==================== OBRIGAÇÕES ====================

export const obrigacoesApi = {
  listarTodas: async (): Promise<Obrigacao[]> => {
    const response = await api.get('/obrigacoes');
    return response.data;
  },

  buscarPorId: async (id: string): Promise<Obrigacao> => {
    const response = await api.get(`/obrigacoes/${id}`);
    return response.data;
  },

  filtrar: async (filtro: FiltroObrigacoes): Promise<Obrigacao[]> => {
    const params = new URLSearchParams();
    
    Object.entries(filtro).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await api.get(`/obrigacoes/filtrar?${params.toString()}`);
    return response.data;
  },

  criar: async (obrigacao: Partial<Obrigacao>): Promise<Obrigacao> => {
    const response = await api.post('/obrigacoes', obrigacao);
    return response.data;
  },

  atualizar: async (id: string, dados: Partial<Obrigacao>): Promise<Obrigacao> => {
    const response = await api.put(`/obrigacoes/${id}`, dados);
    return response.data;
  },

  deletar: async (id: string): Promise<void> => {
    await api.delete(`/obrigacoes/${id}`);
  },

  buscarHistorico: async (id: string): Promise<HistoricoAlteracao[]> => {
    const response = await api.get(`/obrigacoes/${id}/historico`);
    return response.data;
  },

  gerarProxima: async (id: string): Promise<Obrigacao> => {
    const response = await api.post(`/obrigacoes/${id}/gerar-proxima`);
    return response.data;
  }
};

// ==================== FERIADOS ====================

export const feriadosApi = {
  listarPorAno: async (ano: number): Promise<Feriado[]> => {
    const response = await api.get(`/feriados/${ano}`);
    return response.data;
  },

  ajustarData: async (
    data: string,
    direcao: 'proximo' | 'anterior' = 'proximo'
  ): Promise<{ dataOriginal: string; dataAjustada: string; ajustada: boolean }> => {
    const response = await api.post('/feriados/ajustar-data', { data, direcao });
    return response.data;
  }
};

// ==================== CLIENTES ====================

export const clientesApi = {
  listarTodos: async (): Promise<Cliente[]> => {
    const response = await api.get('/clientes');
    return response.data;
  },

  listarAtivos: async (): Promise<Cliente[]> => {
    const response = await api.get('/clientes/ativos');
    return response.data;
  },

  buscarPorId: async (id: string): Promise<Cliente> => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  },

  buscarPorCnpj: async (cnpj: string): Promise<Cliente> => {
    const response = await api.get(`/clientes/cnpj/${cnpj}`);
    return response.data;
  },

  criar: async (cliente: Partial<Cliente>): Promise<Cliente> => {
    const response = await api.post('/clientes', cliente);
    return response.data;
  },

  atualizar: async (id: string, dados: Partial<Cliente>): Promise<Cliente> => {
    const response = await api.put(`/clientes/${id}`, dados);
    return response.data;
  },

  deletar: async (id: string): Promise<void> => {
    await api.delete(`/clientes/${id}`);
  }
};

export default api;

