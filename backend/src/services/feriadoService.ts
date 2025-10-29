import axios from 'axios';
import NodeCache from 'node-cache';
import db from '../config/database';
import { Feriado } from '../types';
import { isWeekend, addDays, format } from 'date-fns';

// Cache de feriados (24 horas)
const feriadoCache = new NodeCache({ stdTTL: 86400 });

export class FeriadoService {
  // Buscar feriados nacionais da API pública brasileira
  async buscarFeriadosNacionais(ano: number): Promise<Feriado[]> {
    const cacheKey = `feriados_${ano}`;
    const cached = feriadoCache.get<Feriado[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // API pública de feriados brasileiros
      const response = await axios.get(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
      
      const feriados: Feriado[] = response.data.map((f: any) => ({
        data: f.date,
        nome: f.name,
        tipo: f.type === 'national' ? 'nacional' : 'estadual'
      }));

      // Salvar no cache e banco
      feriadoCache.set(cacheKey, feriados);
      await this.salvarFeriadosNoBanco(feriados);

      return feriados;
    } catch (error) {
      console.warn('⚠️ Erro ao buscar feriados da API, usando cache local:', error);
      return this.buscarFeriadosDoBanco(ano);
    }
  }

  // Salvar feriados no banco
  private async salvarFeriadosNoBanco(feriados: Feriado[]) {
    for (const feriado of feriados) {
      await db.run(`
        INSERT OR REPLACE INTO feriados (data, nome, tipo)
        VALUES (?, ?, ?)
      `, [feriado.data, feriado.nome, feriado.tipo]);
    }
  }

  // Buscar feriados do banco (fallback)
  private async buscarFeriadosDoBanco(ano: number): Promise<Feriado[]> {
    const feriados = await db.all(`
      SELECT * FROM feriados 
      WHERE data LIKE ?
    `, [`${ano}-%`]) as Feriado[];
    
    return feriados;
  }

  // Verificar se é feriado
  async isFeriado(data: Date, ano: number): Promise<boolean> {
    const feriados = await this.buscarFeriadosNacionais(ano);
    const dataStr = format(data, 'yyyy-MM-dd');
    
    return feriados.some(f => f.data === dataStr);
  }

  // Ajustar data para próximo dia útil
  async ajustarParaDiaUtil(data: Date): Promise<Date> {
    let dataAjustada = data;
    const ano = dataAjustada.getFullYear();
    const feriados = await this.buscarFeriadosNacionais(ano);

    // Verificar até encontrar um dia útil
    while (this.isNaoUtil(dataAjustada, feriados)) {
      dataAjustada = addDays(dataAjustada, 1);
      
      // Se mudou de ano, buscar feriados do novo ano
      if (dataAjustada.getFullYear() !== ano) {
        const novosFeriados = await this.buscarFeriadosNacionais(dataAjustada.getFullYear());
        feriados.push(...novosFeriados);
      }
    }

    return dataAjustada;
  }

  // Verificar se data é não útil (fim de semana ou feriado)
  private isNaoUtil(data: Date, feriados: Feriado[]): boolean {
    // Fim de semana
    if (isWeekend(data)) {
      return true;
    }

    // Feriado
    const dataStr = format(data, 'yyyy-MM-dd');
    return feriados.some(f => f.data === dataStr);
  }

  // Listar todos os feriados de um ano
  async listarFeriados(ano: number): Promise<Feriado[]> {
    return this.buscarFeriadosNacionais(ano);
  }
}

export default new FeriadoService();
