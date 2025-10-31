import db from '../config/database';
import { Obrigacao, Recorrencia, FiltroObrigacoes, HistoricoAlteracao } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ObrigacaoModel {
  // Criar obrigação
  async criar(obrigacao: Omit<Obrigacao, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Obrigacao> {
    const id = uuidv4();
    const agora = new Date().toISOString();

    await db.run(`
      INSERT INTO obrigacoes (
        id, titulo, descricao, dataVencimento, dataVencimentoOriginal,
        tipo, status, cliente, empresa, responsavel, ajusteDataUtil,
        cor, criadoEm, atualizadoEm, criadoPor
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      obrigacao.titulo,
      obrigacao.descricao || null,
      obrigacao.dataVencimento,
      obrigacao.dataVencimentoOriginal,
      obrigacao.tipo,
      obrigacao.status,
      obrigacao.cliente || null,
      obrigacao.empresa || null,
      obrigacao.responsavel || null,
      obrigacao.ajusteDataUtil ? 1 : 0,
      obrigacao.cor || null,
      agora,
      agora,
      obrigacao.criadoPor || null
    ]);

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
    const obrigacoes = await db.all('SELECT * FROM obrigacoes ORDER BY dataVencimento ASC', []) as any[];

    const resultados: Obrigacao[] = [];
    for (const o of obrigacoes) {
      resultados.push(await this.mapearObrigacao(o));
    }
    return resultados;
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
      query += ` AND dataVencimento LIKE ?`;
      params.push(`${filtro.ano}-${mesStr}-%`);
    }

    if (filtro.dataInicio) {
      query += ' AND dataVencimento >= ?';
      params.push(filtro.dataInicio);
    }

    if (filtro.dataFim) {
      query += ' AND dataVencimento <= ?';
      params.push(filtro.dataFim);
    }

    query += ' ORDER BY dataVencimento ASC';

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
      'ajusteDataUtil', 'cor'
    ];

    for (const campo of camposPermitidos) {
      if (campo in dados) {
        campos.push(`${campo} = ?`);
        const valor = (dados as any)[campo];
        valores.push(campo === 'ajusteDataUtil' ? (valor ? 1 : 0) : valor);
      }
    }

    if (campos.length === 0) return this.buscarPorId(id);

    campos.push('atualizadoEm = ?');
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
    await db.run(`
      INSERT INTO recorrencias (obrigacaoId, tipo, intervalo, diaDoMes, dataFim, proximaOcorrencia)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      obrigacaoId,
      recorrencia.tipo,
      recorrencia.intervalo || null,
      recorrencia.diaDoMes || null,
      recorrencia.dataFim || null,
      recorrencia.proximaOcorrencia || null
    ]);
  }

  // Atualizar recorrência
  private async atualizarRecorrencia(obrigacaoId: string, recorrencia: Recorrencia) {
    // PostgreSQL: usar UPSERT com ON CONFLICT
    await db.run(`
      INSERT INTO recorrencias (obrigacaoId, tipo, intervalo, diaDoMes, dataFim, proximaOcorrencia)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (obrigacaoId) DO UPDATE SET
        tipo = EXCLUDED.tipo,
        intervalo = EXCLUDED.intervalo,
        diaDoMes = EXCLUDED.diaDoMes,
        dataFim = EXCLUDED.dataFim,
        proximaOcorrencia = EXCLUDED.proximaOcorrencia
    `, [
      obrigacaoId,
      recorrencia.tipo,
      recorrencia.intervalo || null,
      recorrencia.diaDoMes || null,
      recorrencia.dataFim || null,
      recorrencia.proximaOcorrencia || null
    ]);
  }

  // Buscar recorrência
  private async buscarRecorrencia(obrigacaoId: string): Promise<Recorrencia | undefined> {
    const rec = await db.get('SELECT * FROM recorrencias WHERE obrigacaoId = ?', [obrigacaoId]) as any;

    if (!rec) return undefined;

    return {
      tipo: rec.tipo,
      intervalo: rec.intervalo || undefined,
      diaDoMes: rec.diaDoMes || undefined,
      dataFim: rec.dataFim || undefined,
      proximaOcorrencia: rec.proximaOcorrencia || undefined
    };
  }

  // Mapear obrigação do banco
  private async mapearObrigacao(row: any): Promise<Obrigacao> {
    return {
      id: row.id,
      titulo: row.titulo,
      descricao: row.descricao || undefined,
      dataVencimento: row.dataVencimento,
      dataVencimentoOriginal: row.dataVencimentoOriginal,
      tipo: row.tipo,
      status: row.status,
      cliente: row.cliente || undefined,
      empresa: row.empresa || undefined,
      responsavel: row.responsavel || undefined,
      recorrencia: await this.buscarRecorrencia(row.id),
      ajusteDataUtil: row.ajusteDataUtil === 1,
      cor: row.cor || undefined,
      criadoEm: row.criadoEm,
      atualizadoEm: row.atualizadoEm,
      criadoPor: row.criadoPor || undefined
    };
  }

  // Salvar histórico
  async salvarHistorico(historico: Omit<HistoricoAlteracao, 'id' | 'timestamp'>): Promise<void> {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    await db.run(`
      INSERT INTO historico (id, obrigacaoId, usuario, tipo, camposAlterados, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id,
      historico.obrigacaoId,
      historico.usuario,
      historico.tipo,
      historico.camposAlterados ? JSON.stringify(historico.camposAlterados) : null,
      timestamp
    ]);
  }

  // Buscar histórico
  async buscarHistorico(obrigacaoId: string): Promise<HistoricoAlteracao[]> {
    const registros = await db.all(`
      SELECT * FROM historico 
      WHERE obrigacaoId = ? 
      ORDER BY timestamp DESC 
      LIMIT 50
    `, [obrigacaoId]) as any[];

    return registros.map(r => ({
      id: r.id,
      obrigacaoId: r.obrigacaoId,
      usuario: r.usuario,
      tipo: r.tipo,
      camposAlterados: r.camposAlterados ? JSON.parse(r.camposAlterados) : undefined,
      timestamp: r.timestamp
    }));
  }
}

export default new ObrigacaoModel();
