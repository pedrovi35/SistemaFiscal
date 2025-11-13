import db from '../config/database';
import { Obrigacao, Recorrencia, FiltroObrigacoes, HistoricoAlteracao } from '../types';

export class ObrigacaoModel {
  // Criar obrigação
  async criar(obrigacao: Omit<Obrigacao, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Obrigacao> {
    try {
      const agora = new Date().toISOString();

      // Verificar quais colunas existem
      const colunasExistentes = await this.verificarColunasExistentes();

      // Construir INSERT dinamicamente baseado nas colunas existentes
      const campos: string[] = [];
      const placeholders: string[] = [];
      const valores: any[] = [];

      // Campos obrigatórios que sempre devem existir
      campos.push('titulo', 'descricao', 'data_vencimento', 'tipo', 'status', 'cliente_id', 'empresa', 'responsavel', 'ajuste_data_util', 'created_at', 'updated_at');
      placeholders.push('?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?');
      valores.push(
        obrigacao.titulo,
        obrigacao.descricao || null,
        obrigacao.dataVencimento,
        obrigacao.tipo,
        obrigacao.status,
        null, // cliente_id
        obrigacao.empresa || null,
        obrigacao.responsavel || null,
        obrigacao.ajusteDataUtil ? true : false,
        agora,
        agora
      );

      // Campos opcionais que podem não existir
      if (colunasExistentes.includes('data_vencimento_original')) {
        campos.push('data_vencimento_original');
        placeholders.push('?');
        valores.push(obrigacao.dataVencimentoOriginal || obrigacao.dataVencimento);
      }

      if (colunasExistentes.includes('preferencia_ajuste')) {
        campos.push('preferencia_ajuste');
        placeholders.push('?');
        valores.push(obrigacao.preferenciaAjuste || 'proximo');
      }

      const query = `
        INSERT INTO obrigacoes (${campos.join(', ')}) 
        VALUES (${placeholders.join(', ')})
        RETURNING id
      `;

      console.log('🔍 Query de criação:', query);
      console.log('📋 Valores:', valores);

      const result = await db.get(query, valores);

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
    } catch (error: any) {
      console.error('❌ Erro ao criar obrigação:', error);
      console.error('📋 Detalhes:', {
        obrigacao,
        message: error.message,
        code: error.code
      });
      throw error;
    }
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
    try {
      console.log('🔍 Iniciando atualização da obrigação:', id);
      console.log('📋 Dados recebidos:', JSON.stringify(dados, null, 2));
      
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

      // Verificar quais colunas existem no banco antes de tentar atualizar
      console.log('🔍 Verificando colunas existentes no banco...');
      const colunasExistentes = await this.verificarColunasExistentes();

      // Separar campos de recorrência dos campos da obrigação
      const recorrencia = dados.recorrencia;
      const dadosSemRecorrencia = { ...dados };
      delete (dadosSemRecorrencia as any).recorrencia;

      for (const campo of camposPermitidos) {
        if (campo in dadosSemRecorrencia) {
          const nomeCampo = mapeamentoCampos[campo] || campo;
          
          // Pular campos que não existem no banco
          if (!colunasExistentes.includes(nomeCampo)) {
            console.warn(`⚠️ Campo ${nomeCampo} não existe no banco, pulando...`);
            continue;
          }

          campos.push(`${nomeCampo} = ?`);
          const valor = (dadosSemRecorrencia as any)[campo];
          
          // Converter boolean para integer se necessário
          if (campo === 'ajusteDataUtil') {
            valores.push(valor === true || valor === 1 ? 1 : 0);
          } else {
            valores.push(valor);
          }
        }
      }

      if (campos.length === 0) {
        console.warn('⚠️ Nenhum campo para atualizar (exceto recorrência), buscando obrigação atual...');
        // Se não há campos para atualizar, mas pode haver recorrência
        if (recorrencia) {
          await this.atualizarRecorrencia(id, recorrencia);
        }
        return this.buscarPorId(id);
      }

      campos.push('updated_at = ?');
      valores.push(new Date().toISOString());
      valores.push(id);

      const query = `UPDATE obrigacoes SET ${campos.join(', ')} WHERE id = ?`;
      console.log('🔍 Query de atualização:', query);
      console.log('📋 Valores:', valores);
      
      try {
        await db.run(query, valores);
        console.log('✅ Obrigação atualizada com sucesso no banco');
      } catch (dbError: any) {
        console.error('❌ Erro ao executar UPDATE:', dbError);
        console.error('📋 Mensagem:', dbError.message);
        console.error('📋 Código:', dbError.code);
        throw dbError;
      }

      // Atualizar recorrência se existir (não propaga erro se falhar)
      if (recorrencia) {
        console.log('🔄 Atualizando recorrência...');
        await this.atualizarRecorrencia(id, recorrencia);
      }

      // Buscar e retornar obrigação atualizada
      const obrigacaoAtualizada = await this.buscarPorId(id);
      
      if (!obrigacaoAtualizada) {
        console.error('❌ Obrigação não encontrada após atualização');
        throw new Error('Obrigação não encontrada após atualização');
      }
      
      console.log('✅ Atualização concluída com sucesso');
      return obrigacaoAtualizada;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar obrigação:', error);
      console.error('📋 Detalhes:', {
        id,
        dados: JSON.stringify(dados, null, 2),
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }

  // Verificar quais colunas existem na tabela obrigacoes
  private async verificarColunasExistentes(): Promise<string[]> {
    try {
      // PostgreSQL usa information_schema em vez de PRAGMA
      const result = await db.all(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'obrigacoes' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `, []);
      
      const colunas = result.map((row: any) => row.column_name || row.column_name);
      console.log('📊 Colunas existentes na tabela obrigacoes:', colunas);
      
      if (colunas.length === 0) {
        console.warn('⚠️ Nenhuma coluna encontrada, usando lista padrão');
        return [
          'id', 'titulo', 'descricao', 'data_vencimento', 
          'tipo', 'status', 'cliente_id', 'empresa', 'responsavel',
          'ajuste_data_util', 'created_at', 'updated_at',
          'data_vencimento_original', 'preferencia_ajuste', 'cor'
        ];
      }
      
      return colunas;
    } catch (error: any) {
      console.error('⚠️ Erro ao verificar colunas, usando lista padrão:', error.message);
      console.error('📋 Stack:', error.stack);
      // Lista padrão de colunas que sempre devem existir
      return [
        'id', 'titulo', 'descricao', 'data_vencimento', 
        'tipo', 'status', 'cliente_id', 'empresa', 'responsavel',
        'ajuste_data_util', 'created_at', 'updated_at',
        'data_vencimento_original', 'preferencia_ajuste', 'cor'
      ];
    }
  }

  // Deletar
  async deletar(id: string): Promise<boolean> {
    const result = await db.run('DELETE FROM obrigacoes WHERE id = ?', [id]) as any;
    return result.changes > 0;
  }

  // Salvar recorrência
  private async salvarRecorrencia(obrigacaoId: string, recorrencia: Recorrencia) {
    const agora = new Date().toISOString();
    
    // Verificar quais colunas existem na tabela recorrencias
    const colunasRecorrencia = await this.verificarColunasRecorrencia();
    
    const campos = ['obrigacao_id', 'tipo', 'criada_em'];
    const placeholders = ['?', '?', '?'];
    const valores: any[] = [obrigacaoId, recorrencia.tipo, agora];
    
    // Campos opcionais
    if (colunasRecorrencia.includes('intervalo')) {
      campos.push('intervalo');
      placeholders.push('?');
      valores.push(recorrencia.intervalo || null);
    }
    
    if (colunasRecorrencia.includes('dia_do_mes')) {
      campos.push('dia_do_mes');
      placeholders.push('?');
      valores.push(recorrencia.diaDoMes || null);
    }
    
    if (colunasRecorrencia.includes('ativo')) {
      campos.push('ativo');
      placeholders.push('?');
      valores.push(recorrencia.ativo !== false);
    }
    
    if (colunasRecorrencia.includes('dia_geracao')) {
      campos.push('dia_geracao');
      placeholders.push('?');
      valores.push(recorrencia.diaGeracao || 1);
    }
    
    if (colunasRecorrencia.includes('data_fim')) {
      campos.push('data_fim');
      placeholders.push('?');
      valores.push(recorrencia.dataFim || null);
    }
    
    if (colunasRecorrencia.includes('ultima_geracao')) {
      campos.push('ultima_geracao');
      placeholders.push('?');
      valores.push(recorrencia.ultimaGeracao || null);
    }
    
    const query = `
      INSERT INTO recorrencias (${campos.join(', ')}) 
      VALUES (${placeholders.join(', ')})
    `;
    
    await db.run(query, valores);
  }
  
  // Verificar colunas da tabela recorrencias
  private async verificarColunasRecorrencia(): Promise<string[]> {
    try {
      // PostgreSQL usa information_schema em vez de PRAGMA
      const result = await db.all(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'recorrencias' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `, []);
      
      const colunas = result.map((row: any) => row.column_name || row.column_name);
      
      if (colunas.length === 0) {
        console.warn('⚠️ Tabela recorrencias não encontrada ou vazia, usando lista padrão');
        return ['id', 'obrigacao_id', 'tipo', 'intervalo', 'dia_do_mes', 'criada_em', 'ativo', 'dia_geracao', 'data_fim', 'ultima_geracao'];
      }
      
      return colunas;
    } catch (error: any) {
      console.error('⚠️ Erro ao verificar colunas de recorrencias, usando lista padrão:', error.message);
      // Lista padrão se não conseguir consultar
      return ['id', 'obrigacao_id', 'tipo', 'intervalo', 'dia_do_mes', 'criada_em', 'ativo', 'dia_geracao', 'data_fim', 'ultima_geracao'];
    }
  }

  // Atualizar recorrência
  private async atualizarRecorrencia(obrigacaoId: string, recorrencia: Recorrencia) {
    try {
      console.log('🔄 Iniciando atualização de recorrência para obrigação:', obrigacaoId);
      console.log('📋 Dados de recorrência:', JSON.stringify(recorrencia, null, 2));
      
      const agora = new Date().toISOString();
      const colunasRecorrencia = await this.verificarColunasRecorrencia();
      
      // Verificar se a tabela existe e tem colunas
      if (!colunasRecorrencia || colunasRecorrencia.length === 0) {
        console.warn('⚠️ Tabela recorrencias não existe ou está vazia. Pulando atualização de recorrência.');
        return;
      }
      
      // Construir campos do INSERT
      const campos = ['obrigacao_id', 'tipo', 'criada_em'];
      const placeholders = ['?', '?', '?'];
      const valores: any[] = [obrigacaoId, recorrencia.tipo, agora];
      
      // Construir campos do UPDATE
      const camposUpdate: string[] = ['tipo = EXCLUDED.tipo'];
      
      // Campos opcionais
      if (colunasRecorrencia.includes('intervalo')) {
        campos.push('intervalo');
        placeholders.push('?');
        valores.push(recorrencia.intervalo || null);
        camposUpdate.push('intervalo = EXCLUDED.intervalo');
      }
      
      if (colunasRecorrencia.includes('dia_do_mes')) {
        campos.push('dia_do_mes');
        placeholders.push('?');
        valores.push(recorrencia.diaDoMes || null);
        camposUpdate.push('dia_do_mes = EXCLUDED.dia_do_mes');
      }
      
      if (colunasRecorrencia.includes('ativo')) {
        campos.push('ativo');
        placeholders.push('?');
        valores.push(recorrencia.ativo !== undefined ? recorrencia.ativo : true);
        camposUpdate.push('ativo = EXCLUDED.ativo');
      }
      
      if (colunasRecorrencia.includes('dia_geracao')) {
        campos.push('dia_geracao');
        placeholders.push('?');
        valores.push(recorrencia.diaGeracao || 1);
        camposUpdate.push('dia_geracao = EXCLUDED.dia_geracao');
      }
      
      if (colunasRecorrencia.includes('data_fim')) {
        campos.push('data_fim');
        placeholders.push('?');
        valores.push(recorrencia.dataFim || null);
        camposUpdate.push('data_fim = EXCLUDED.data_fim');
      }
      
      if (colunasRecorrencia.includes('ultima_geracao')) {
        campos.push('ultima_geracao');
        placeholders.push('?');
        valores.push(recorrencia.ultimaGeracao || null);
        camposUpdate.push('ultima_geracao = EXCLUDED.ultima_geracao');
      }
      
      // Verificar se existe constraint UNIQUE em obrigacao_id antes de usar ON CONFLICT
      let temConstraint = false;
      try {
        const constraintCheck = await db.all(`
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = 'recorrencias' 
          AND constraint_type = 'UNIQUE'
          AND table_schema = 'public'
        `, []);
        
        // Verificar se há constraint única envolvendo obrigacao_id
        if (constraintCheck && constraintCheck.length > 0) {
          for (const constraint of constraintCheck) {
            const constraintName = constraint.constraint_name || constraint.constraintName;
            if (!constraintName) continue;
            
            const columnsCheck = await db.all(`
              SELECT column_name 
              FROM information_schema.key_column_usage 
              WHERE constraint_name = ? 
              AND table_name = 'recorrencias'
              AND table_schema = 'public'
            `, [constraintName]);
            
            const columns = columnsCheck.map((c: any) => c.column_name || c.columnName);
            if (columns.includes('obrigacao_id')) {
              temConstraint = true;
              console.log('✅ Constraint UNIQUE encontrada em obrigacao_id:', constraintName);
              break;
            }
          }
        }
      } catch (constraintError: any) {
        console.warn('⚠️ Erro ao verificar constraints, tentando UPDATE direto:', constraintError.message);
      }
      
      let query: string;
      
      if (temConstraint) {
        // Usar ON CONFLICT se houver constraint UNIQUE
        query = `
          INSERT INTO recorrencias (${campos.join(', ')}) 
          VALUES (${placeholders.join(', ')})
          ON CONFLICT (obrigacao_id) DO UPDATE SET
            ${camposUpdate.join(', ')}
        `;
        console.log('✅ Usando ON CONFLICT (constraint UNIQUE encontrada)');
      } else {
        // Fallback: deletar e inserir novamente
        console.warn('⚠️ Constraint UNIQUE não encontrada, usando DELETE + INSERT');
        
        // Primeiro, tentar deletar se existir
        try {
          await db.run('DELETE FROM recorrencias WHERE obrigacao_id = ?', [obrigacaoId]);
        } catch (deleteError: any) {
          console.warn('⚠️ Erro ao deletar recorrência existente (pode não existir):', deleteError.message);
        }
        
        // Inserir nova recorrência
        query = `
          INSERT INTO recorrencias (${campos.join(', ')}) 
          VALUES (${placeholders.join(', ')})
        `;
      }
      
      console.log('🔍 Query de atualização de recorrência:', query);
      console.log('📋 Valores:', valores);
      
      await db.run(query, valores);
      
      console.log('✅ Recorrência atualizada com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao atualizar recorrência:', error);
      console.error('📋 Mensagem:', error.message);
      console.error('📋 Stack:', error.stack);
      console.error('📋 Código:', error.code);
      
      // Não propagar o erro para não quebrar a atualização da obrigação
      // A recorrência é opcional, então se falhar, logamos mas continuamos
      console.warn('⚠️ Continuando atualização da obrigação sem atualizar recorrência');
    }
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
        dataFim: rec.data_fim || rec.dataFim || undefined,
        proximaOcorrencia: rec.proxima_ocorrencia || rec.proximaOcorrencia || undefined,
        ativo: rec.ativo !== undefined ? Boolean(rec.ativo) : true,
        diaGeracao: rec.dia_geracao || rec.diaGeracao || 1,
        ultimaGeracao: rec.ultima_geracao || rec.ultimaGeracao || undefined
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
