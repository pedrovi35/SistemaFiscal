import db from '../config/database';
import { Obrigacao, Recorrencia, FiltroObrigacoes, HistoricoAlteracao, TipoObrigacao, StatusObrigacao } from '../types';

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
      // Verificar se existe cliente_id ou cliente (nome)
      const temClienteId = colunasExistentes.includes('cliente_id');
      const temCliente = colunasExistentes.includes('cliente');
      
      campos.push('titulo', 'descricao', 'data_vencimento', 'tipo', 'status', 'empresa', 'responsavel', 'ajuste_data_util', 'created_at', 'updated_at');
      placeholders.push('?', '?', '?', '?', '?', '?', '?', '?', '?', '?');
      valores.push(
        obrigacao.titulo,
        obrigacao.descricao || null,
        obrigacao.dataVencimento,
        obrigacao.tipo,
        obrigacao.status,
        obrigacao.empresa || null,
        obrigacao.responsavel || null,
        obrigacao.ajusteDataUtil ? true : false,
        agora,
        agora
      );
      
      // Adicionar cliente (nome) ou cliente_id conforme disponível
      if (temCliente) {
        campos.push('cliente');
        placeholders.push('?');
        valores.push(obrigacao.cliente || null);
      } else if (temClienteId) {
        campos.push('cliente_id');
        placeholders.push('?');
        valores.push(null); // cliente_id será null se não houver conversão de nome para ID
      }

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

      let result;
      try {
        result = await db.get(query, valores);
      } catch (dbError: any) {
        console.error('❌ Erro ao executar query:', dbError);
        console.error('📋 Código do erro:', dbError.code);
        console.error('📋 Mensagem:', dbError.message);
        
        // Mensagens de erro mais específicas
        if (dbError.code === '23505') { // Unique violation
          throw new Error('Violação de constraint única. Verifique se já existe uma obrigação com os mesmos dados.');
        } else if (dbError.code === '23502') { // NOT NULL violation
          throw new Error('Campo obrigatório não fornecido ou nulo.');
        } else if (dbError.code === '23503') { // Foreign key violation
          throw new Error('Violação de chave estrangeira. Verifique se o cliente existe.');
        } else if (dbError.code === '42P01') { // Table doesn't exist
          throw new Error('Tabela obrigacoes não encontrada no banco de dados.');
        } else if (dbError.message) {
          throw new Error(`Erro no banco de dados: ${dbError.message}`);
        } else {
          throw new Error('Erro desconhecido ao criar obrigação no banco de dados.');
        }
      }

      const id = result?.id;

      if (!id) {
        console.error('❌ ID não retornado após inserção');
        console.error('📋 Resultado:', result);
        throw new Error('Erro ao criar obrigação: ID não retornado após inserção');
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
      console.log('🔍 Executando query: SELECT * FROM obrigacoes...');
      
      // Tentar buscar diretamente - se a tabela não existir, o erro será claro
      const obrigacoes = await db.all('SELECT * FROM obrigacoes ORDER BY data_vencimento ASC', []) as any[];
      console.log(`📊 ${obrigacoes.length} registros retornados do banco`);

      // Se não houver obrigações, retornar array vazio
      if (!obrigacoes || obrigacoes.length === 0) {
        console.log('ℹ️ Nenhuma obrigação encontrada no banco');
        return [];
      }

      const resultados: Obrigacao[] = [];
      for (const o of obrigacoes) {
        try {
          const mapped = await this.mapearObrigacao(o);
          resultados.push(mapped);
        } catch (mapError: any) {
          console.error(`❌ Erro ao mapear obrigação ID ${o?.id || 'desconhecido'}:`, mapError.message);
          console.error('📋 Stack do erro de mapeamento:', mapError.stack);
          // Continua com as outras obrigações - não quebra o fluxo
        }
      }
      console.log(`✅ ${resultados.length} obrigações mapeadas com sucesso`);
      return resultados;
    } catch (error: any) {
      console.error('❌ Erro ao listar obrigações no model:');
      console.error('📋 Mensagem:', error.message);
      console.error('📋 Stack:', error.stack);
      console.error('📋 Código:', error.code);
      console.error('📋 Detalhes completos:', error);
      
      // Se for erro de tabela não encontrada, retornar array vazio em vez de quebrar
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.warn('⚠️ Tabela obrigacoes não encontrada. Retornando array vazio.');
        return [];
      }
      
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
          'tipo', 'status', 'cliente', 'cliente_id', 'empresa', 'responsavel',
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
        'tipo', 'status', 'cliente', 'cliente_id', 'empresa', 'responsavel',
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
      // Verificar se a tabela existe antes de consultar
      const tableCheck = await db.all(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recorrencias'
      `, []) as any[];
      
      if (tableCheck.length === 0) {
        // Tabela não existe, retornar undefined sem erro
        return undefined;
      }
      
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
    } catch (error: any) {
      // Se tabela recorrencias não existir ou houver erro, retorna undefined
      console.warn(`⚠️ Aviso ao buscar recorrência para obrigação ${obrigacaoId}:`, error.message);
      return undefined;
    }
  }

  // Mapear obrigação do banco
  private async mapearObrigacao(row: any): Promise<Obrigacao> {
    try {
      // Validar que row existe e tem id
      if (!row || !row.id) {
        throw new Error('Dados de obrigação inválidos: row ou id ausente');
      }

      // Buscar recorrência de forma segura (não deve quebrar o mapeamento)
      let recorrencia: Recorrencia | undefined;
      try {
        recorrencia = await this.buscarRecorrencia(row.id);
      } catch (recError: any) {
        // Se falhar ao buscar recorrência, apenas logar e continuar
        // Não é crítico - a obrigação pode não ter recorrência
        console.warn(`⚠️ Erro ao buscar recorrência para obrigação ${row.id}:`, recError.message);
        recorrencia = undefined;
      }
      
      // Mapear com valores padrão seguros
      // Lidar com campos que podem estar em snake_case ou camelCase (com ou sem aspas)
      return {
        id: String(row.id || ''),
        titulo: String(row.titulo || ''),
        descricao: row.descricao ? String(row.descricao) : undefined,
        dataVencimento: row.data_vencimento || row.dataVencimento || new Date().toISOString().split('T')[0],
        dataVencimentoOriginal: row.data_vencimento_original || row.dataVencimentoOriginal || row.data_vencimento || new Date().toISOString().split('T')[0],
        tipo: (row.tipo || 'OUTRO') as TipoObrigacao,
        status: (row.status || 'PENDENTE') as StatusObrigacao,
        cliente: (row.cliente || row['cliente']) ? String(row.cliente || row['cliente'] || '') : undefined,
        empresa: row.empresa ? String(row.empresa) : undefined,
        responsavel: row.responsavel ? String(row.responsavel) : undefined,
        recorrencia: recorrencia,
        ajusteDataUtil: row.ajuste_data_util === true || row.ajusteDataUtil === 1 || row.ajuste_data_util === 'true' || row.ajuste_data_util === 1,
        preferenciaAjuste: (row.preferencia_ajuste || row.preferenciaAjuste || 'proximo') as 'proximo' | 'anterior',
        cor: row.cor ? String(row.cor) : undefined,
        criadoEm: row.created_at || row.criadoEm || new Date().toISOString(),
        atualizadoEm: row.updated_at || row.atualizadoEm || new Date().toISOString(),
        criadoPor: row.criadoPor ? String(row.criadoPor) : undefined
      };
    } catch (error: any) {
      console.error('❌ Erro ao mapear obrigação:');
      console.error('📋 Row data:', JSON.stringify(row, null, 2));
      console.error('📋 Mensagem:', error.message);
      console.error('📋 Stack:', error.stack);
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
