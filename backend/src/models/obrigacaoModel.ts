import db from '../config/database';
import { Obrigacao, Recorrencia, FiltroObrigacoes, HistoricoAlteracao } from '../types';

export class ObrigacaoModel {
  // Criar obrigação
  async criar(obrigacao: Omit<Obrigacao, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Obrigacao> {
    const agora = new Date().toISOString();

    // PostgreSQL: usar RETURNING para obter o ID
    const result = await db.get(`
      INSERT INTO obrigacoes (
        titulo, descricao, data_vencimento, data_vencimento_original, tipo, status, 
        cliente_id, empresa, responsavel, ajuste_data_util, preferencia_ajuste,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `, [
      obrigacao.titulo,
      obrigacao.descricao || null,
      obrigacao.dataVencimento,
      obrigacao.dataVencimentoOriginal || obrigacao.dataVencimento, // Garantir que está presente
      obrigacao.tipo,
      obrigacao.status,
      null, // cliente_id - será mapeado depois
      obrigacao.empresa || null,
      obrigacao.responsavel || null,
      obrigacao.ajusteDataUtil ? true : false,
      obrigacao.preferenciaAjuste || 'proximo',
      agora,
      agora
    ]);

    const id = result?.id;

    if (!id) {
      throw new Error('Erro ao criar obrigação: ID não retornado');
    }

    // Salvar recorrência se existir
    if (obrigacao.recorrencia) {
      await this.salvarRecorrencia(id, obrigacao.recorrencia);
    }

    const resultado = await this.buscarPorId(id);
    if (!resultado) {
      throw new Error('Erro ao criar obrigação');
    }
    return resultado;
  }

  // Buscar por ID
  async buscarPorId(id: string): Promise<Obrigacao | undefined> {
    const obrigacao = await db.get('SELECT * FROM obrigacoes WHERE id = ?', [id]) as any;

    if (!obrigacao) return undefined;

    return this.mapearObrigacao(obrigacao);
  }

  // Listar todas
  async listarTodas(): Promise<Obrigacao[]> {
    try {
      const obrigacoes = await db.all('SELECT * FROM obrigacoes ORDER BY data_vencimento ASC', []) as any[];

      const resultados: Obrigacao[] = [];
      for (const o of obrigacoes) {
        try {
          const mapped = await this.mapearObrigacao(o);
          resultados.push(mapped);
        } catch (mapError: any) {
          console.error(`Erro ao mapear obrigação ID ${o.id}:`, mapError.message);
          // Continua com as outras obrigações
        }
      }
      return resultados;
    } catch (error: any) {
      console.error('Erro ao listar obrigações:', error.message);
      throw error;
    }
  }

  // Filtrar obrigações
  async filtrar(filtro: FiltroObrigacoes): Promise<Obrigacao[]> {
    let query = 'SELECT * FROM obrigacoes WHERE 1=1';
    const params: any[] = [];

    if (filtro.cliente) {
      query += ' AND cliente = ?';
      params.push(filtro.cliente);
    }

    if (filtro.empresa) {
      query += ' AND empresa = ?';
      params.push(filtro.empresa);
    }

    if (filtro.responsavel) {
      query += ' AND responsavel = ?';
      params.push(filtro.responsavel);
    }

    if (filtro.tipo) {
      query += ' AND tipo = ?';
      params.push(filtro.tipo);
    }

    if (filtro.status) {
      query += ' AND status = ?';
      params.push(filtro.status);
    }

    if (filtro.mes !== undefined && filtro.ano !== undefined) {
      const mesStr = String(filtro.mes).padStart(2, '0');
      query += ` AND data_vencimento::TEXT LIKE ?`;
      params.push(`${filtro.ano}-${mesStr}-%`);
    }

    if (filtro.dataInicio) {
      query += ' AND data_vencimento >= ?';
      params.push(filtro.dataInicio);
    }

    if (filtro.dataFim) {
      query += ' AND data_vencimento <= ?';
      params.push(filtro.dataFim);
    }

    query += ' ORDER BY data_vencimento ASC';

    const obrigacoes = await db.all(query, params) as any[];

    const resultados: Obrigacao[] = [];
    for (const o of obrigacoes) {
      resultados.push(await this.mapearObrigacao(o));
    }
    return resultados;
  }

  // Atualizar
  async atualizar(id: string, dados: Partial<Obrigacao>): Promise<Obrigacao | undefined> {
    const campos: string[] = [];
    const valores: any[] = [];

    const camposPermitidos = [
      'titulo', 'descricao', 'dataVencimento', 'dataVencimentoOriginal',
      'tipo', 'status', 'cliente', 'empresa', 'responsavel',
      'ajusteDataUtil', 'preferenciaAjuste', 'cor'
    ];

    const mapeamentoCampos: Record<string, string> = {
      'dataVencimento': 'data_vencimento',
      'dataVencimentoOriginal': 'data_vencimento_original',
      'ajusteDataUtil': 'ajuste_data_util',
      'preferenciaAjuste': 'preferencia_ajuste'
    };

    for (const campo of camposPermitidos) {
      if (campo in dados) {
        const nomeCampo = mapeamentoCampos[campo] || campo;
        campos.push(`${nomeCampo} = ?`);
        const valor = (dados as any)[campo];
        valores.push(campo === 'ajusteDataUtil' ? (valor ? 1 : 0) : valor);
      }
    }

    if (campos.length === 0) return this.buscarPorId(id);

    campos.push('updated_at = ?');
    valores.push(new Date().toISOString());
    valores.push(id);

    const query = `UPDATE obrigacoes SET ${campos.join(', ')} WHERE id = ?`;
    await db.run(query, valores);

    // Atualizar recorrência se existir
    if (dados.recorrencia) {
      await this.atualizarRecorrencia(id, dados.recorrencia);
    }

    return this.buscarPorId(id);
  }

  // Deletar
  async deletar(id: string): Promise<boolean> {
    const result = await db.run('DELETE FROM obrigacoes WHERE id = ?', [id]) as any;
    return result.changes > 0;
  }

  // Salvar recorrência
  private async salvarRecorrencia(obrigacaoId: string, recorrencia: Recorrencia) {
    const agora = new Date().toISOString();
    await db.run(`
      INSERT INTO recorrencias (obrigacao_id, tipo, intervalo, dia_do_mes, mes_do_ano, criada_em)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      obrigacaoId,
      recorrencia.tipo,
      recorrencia.intervalo || null,
      recorrencia.diaDoMes || null,
      null, // mes_do_ano - não está sendo usado atualmente
      agora
    ]);
  }

  // Atualizar recorrência
  private async atualizarRecorrencia(obrigacaoId: string, recorrencia: Recorrencia) {
    const agora = new Date().toISOString();
    // PostgreSQL: usar UPSERT com ON CONFLICT
    await db.run(`
      INSERT INTO recorrencias (obrigacao_id, tipo, intervalo, dia_do_mes, mes_do_ano, criada_em)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (obrigacao_id) DO UPDATE SET
        tipo = EXCLUDED.tipo,
        intervalo = EXCLUDED.intervalo,
        dia_do_mes = EXCLUDED.dia_do_mes,
        mes_do_ano = EXCLUDED.mes_do_ano
    `, [
      obrigacaoId,
      recorrencia.tipo,
      recorrencia.intervalo || null,
      recorrencia.diaDoMes || null,
      null, // mes_do_ano
      agora
    ]);
  }

  // Buscar recorrência
  private async buscarRecorrencia(obrigacaoId: string): Promise<Recorrencia | undefined> {
    try {
      const rec = await db.get('SELECT * FROM recorrencias WHERE obrigacao_id = ?', [obrigacaoId]) as any;

      if (!rec) return undefined;

      return {
        tipo: rec.tipo,
        intervalo: rec.intervalo || undefined,
        diaDoMes: rec.dia_do_mes || rec.diaDoMes || undefined,
        dataFim: undefined, // dataFim não existe na tabela atual
        proximaOcorrencia: undefined // proximaOcorrencia não existe na tabela atual
      };
    } catch (error) {
      // Se tabela recorrencias não existir ou houver erro, retorna undefined
      console.warn('Aviso ao buscar recorrência:', error);
      return undefined;
    }
  }

  // Mapear obrigação do banco
  private async mapearObrigacao(row: any): Promise<Obrigacao> {
    try {
      const recorrencia = await this.buscarRecorrencia(row.id).catch(() => undefined);
      
      return {
        id: row.id,
        titulo: row.titulo,
        descricao: row.descricao || undefined,
        dataVencimento: row.data_vencimento || row.dataVencimento,
        dataVencimentoOriginal: row.data_vencimento_original || row.dataVencimentoOriginal || row.data_vencimento,
        tipo: row.tipo,
        status: row.status,
        cliente: row.cliente || undefined,
        empresa: row.empresa || undefined,
        responsavel: row.responsavel || undefined,
        recorrencia: recorrencia,
        ajusteDataUtil: row.ajuste_data_util === true || row.ajusteDataUtil === 1,
        preferenciaAjuste: row.preferencia_ajuste || row.preferenciaAjuste || 'proximo',
        cor: row.cor || undefined,
        criadoEm: row.created_at || row.criadoEm,
        atualizadoEm: row.updated_at || row.atualizadoEm,
        criadoPor: row.criadoPor || undefined
      };
    } catch (error) {
      console.error('Erro ao mapear obrigação:', error);
      throw error;
    }
  }

  // Salvar histórico
  async salvarHistorico(historico: Omit<HistoricoAlteracao, 'id' | 'timestamp'>): Promise<void> {
    const agora = new Date().toISOString();
    // A tabela no PostgreSQL é historico_alteracoes, não historico
    await db.run(`
      INSERT INTO historico_alteracoes (obrigacao_id, campo_alterado, valor_anterior, valor_novo, usuario, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      historico.obrigacaoId,
      historico.tipo || 'alteracao',
      null, // valor_anterior - não disponível no HistoricoAlteracao atual
      historico.camposAlterados ? JSON.stringify(historico.camposAlterados) : null,
      historico.usuario,
      agora
    ]);
  }

  // Buscar histórico
  async buscarHistorico(obrigacaoId: string): Promise<HistoricoAlteracao[]> {
    const registros = await db.all(`
      SELECT * FROM historico_alteracoes 
      WHERE obrigacao_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [obrigacaoId]) as any[];

    return registros.map(r => ({
      id: r.id.toString(),
      obrigacaoId: r.obrigacao_id || r.obrigacaoId,
      usuario: r.usuario || 'Sistema',
      tipo: r.campo_alterado || r.tipo || 'alteracao',
      camposAlterados: r.valor_novo ? (
        typeof r.valor_novo === 'string' && r.valor_novo.startsWith('{') 
          ? JSON.parse(r.valor_novo) 
          : { [r.campo_alterado]: r.valor_novo }
      ) : undefined,
      timestamp: r.created_at || r.timestamp
    }));
  }
}

export default new ObrigacaoModel();
