import { Pool } from 'pg';

let pgPool: Pool | null = null;

// Utilitário: converte placeholders `?` para `$1, $2, ...` do Postgres
function toPgParams(sql: string, params: any[]): { text: string; values: any[] } {
  let index = 0;
  const text = sql.replace(/\?/g, () => `$${++index}`);
  return { text, values: params };
}

// Funções adaptadas para usar Postgres
async function exec(sql: string): Promise<void> {
  if (!pgPool) throw new Error('Banco de dados não inicializado. DATABASE_URL deve estar configurada.');
  await pgPool.query(sql);
}

async function get(sql: string, params: any[] = []): Promise<any> {
  if (!pgPool) throw new Error('Banco de dados não inicializado. DATABASE_URL deve estar configurada.');
  const { text, values } = toPgParams(sql, params);
  const res = await pgPool.query(text, values);
  return res.rows[0];
}

async function all(sql: string, params: any[] = []): Promise<any[]> {
  if (!pgPool) throw new Error('Banco de dados não inicializado. DATABASE_URL deve estar configurada.');
  const { text, values } = toPgParams(sql, params);
  const res = await pgPool.query(text, values);
  return res.rows as any[];
}

async function run(sql: string, params: any[] = []): Promise<{ changes: number; lastID: number }> {
  if (!pgPool) throw new Error('Banco de dados não inicializado. DATABASE_URL deve estar configurada.');
  const { text, values } = toPgParams(sql, params);
  const res: any = await pgPool.query(text, values);
  return { changes: res.rowCount ?? 0, lastID: 0 };
}

// Inicializar banco de dados
export async function initializeDatabase() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não está definida.');
    }

    if (!process.env.DATABASE_URL.startsWith('postgres')) {
      throw new Error('DATABASE_URL deve ser uma URL PostgreSQL válida (começando com postgres:// ou postgresql://)');
    }

    // Log da URL (sem senha) para debug
    const urlSemSenha = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
    console.log('🔍 Tentando conectar ao PostgreSQL...');
    console.log('🔗 URL:', urlSemSenha);

    // Criar pool de conexões - configuração simplificada e compatível com Render/Supabase
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // 🔥 obrigatório em Render/Supabase
      },
      connectionTimeoutMillis: 30000, // 30 segundos
      idleTimeoutMillis: 30000,
      max: 20 // Máximo de conexões no pool
    });

    // Log de eventos do pool
    pgPool.on('error', (err) => {
      console.error('❌ Erro inesperado no pool de conexões:', err);
    });

    pgPool.on('connect', () => {
      console.log('🔌 Nova conexão estabelecida no pool');
    });

    // Testar conexão
    console.log('⏳ Testando conexão com SELECT 1...');
    const test = await pgPool.query('SELECT 1 as ok');
    if (test.rows?.[0]?.ok === 1) {
      console.log('✅ Conectado ao PostgreSQL (Supabase/Render)');
    } else {
      throw new Error('Conexão ao PostgreSQL efetuada, mas teste não retornou como esperado.');
    }

    console.log('ℹ️ Modo PostgreSQL ativo');
    console.log('ℹ️ Certifique-se de que as tabelas foram criadas usando o script database_supabase.sql');

    // Verificar e corrigir schema automaticamente
    await verificarESCorrigirSchema();

  } catch (error: any) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message);
    console.error('📋 Detalhes do erro:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    });
    
    // Dicas de troubleshooting
    if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('💡 DICA: Erro de conexão recusada. Verifique:');
      console.error('   1. A DATABASE_URL está correta?');
      console.error('   2. Está usando Connection Pooling URL do Supabase?');
      console.error('   3. O firewall não está bloqueando a porta 5432?');
      console.error('   4. O IP do Render está na whitelist do Supabase?');
      console.error('');
    }
    
    throw error;
  }
}

// Verificar e corrigir schema do banco de dados
async function verificarESCorrigirSchema() {
  if (!pgPool) return;

  try {
    console.log('🔍 Verificando schema do banco de dados...');

    // Verificar se a tabela clientes existe
    const checkTable = await pgPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = 'clientes'
    `);

    if (checkTable.rows.length === 0) {
      console.log('⚠️ Tabela clientes não encontrada. Criando...');
      await pgPool.query(`
        CREATE TABLE clientes (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
          nome VARCHAR(255) NOT NULL,
          cnpj VARCHAR(18) UNIQUE,
          email VARCHAR(255),
          telefone VARCHAR(20),
          ativo BOOLEAN DEFAULT TRUE,
          "regimeTributario" VARCHAR(50),
          "criadoEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "atualizadoEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabela clientes criada com sucesso');
    } else {
      // Verificar se a coluna id é do tipo correto (TEXT, não INTEGER)
      const checkIdType = await pgPool.query(`
        SELECT data_type 
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'clientes'
        AND column_name = 'id'
      `);

      if (checkIdType.rows.length > 0) {
        const idType = checkIdType.rows[0].data_type;
        console.log(`ℹ️ Tipo atual da coluna id: ${idType}`);

        if (idType === 'integer' || idType === 'bigint') {
          console.log('⚠️ Coluna id é INTEGER. Migrando para TEXT (UUID)...');
          console.log('⚠️ ATENÇÃO: Execute o script migrate_id_to_uuid.sql manualmente no Supabase');
          console.log('⚠️ A migração automática não é segura para tabelas com dados existentes');
          // Não fazemos a migração automática aqui porque pode haver dados existentes
          // O usuário deve executar o script SQL manualmente
        } else if (idType === 'text' || idType === 'character varying') {
          console.log('✅ Coluna id já é TEXT (UUID)');
        }
      }
    }

    // Verificar se a coluna regimeTributario existe na tabela clientes
    // Usar comparação case-insensitive para garantir que encontre a coluna
    const checkColumn = await pgPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'clientes' 
      AND LOWER(column_name) = LOWER('regimeTributario')
    `);

    if (checkColumn.rows.length === 0) {
      console.log('⚠️ Coluna regimeTributario não encontrada. Criando...');
      
      try {
        await pgPool.query(`
          ALTER TABLE clientes 
          ADD COLUMN "regimeTributario" VARCHAR(50)
        `);
        console.log('✅ Coluna regimeTributario criada com sucesso');
      } catch (alterError: any) {
        // Se a coluna já existe (erro de duplicação), apenas logar
        if (alterError.code === '42701' || alterError.message?.includes('already exists')) {
          console.log('ℹ️ Coluna regimeTributario já existe (detectada durante criação)');
        } else {
          throw alterError;
        }
      }
    } else {
      console.log(`✅ Coluna regimeTributario já existe (nome: ${checkColumn.rows[0].column_name})`);
    }

    // Verificar outras colunas importantes
    const checkCriadoEm = await pgPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'clientes' 
      AND LOWER(column_name) = LOWER('criadoEm')
    `);

    if (checkCriadoEm.rows.length === 0) {
      console.log('⚠️ Coluna criadoEm não encontrada. Criando...');
      try {
        await pgPool.query(`
          ALTER TABLE clientes 
          ADD COLUMN "criadoEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('✅ Coluna criadoEm criada com sucesso');
      } catch (alterError: any) {
        if (alterError.code === '42701' || alterError.message?.includes('already exists')) {
          console.log('ℹ️ Coluna criadoEm já existe (detectada durante criação)');
        } else {
          throw alterError;
        }
      }
    }

    const checkAtualizadoEm = await pgPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'clientes' 
      AND LOWER(column_name) = LOWER('atualizadoEm')
    `);

    if (checkAtualizadoEm.rows.length === 0) {
      console.log('⚠️ Coluna atualizadoEm não encontrada. Criando...');
      try {
        await pgPool.query(`
          ALTER TABLE clientes 
          ADD COLUMN "atualizadoEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('✅ Coluna atualizadoEm criada com sucesso');
      } catch (alterError: any) {
        if (alterError.code === '42701' || alterError.message?.includes('already exists')) {
          console.log('ℹ️ Coluna atualizadoEm já existe (detectada durante criação)');
        } else {
          throw alterError;
        }
      }
    }

    console.log('✅ Verificação de schema concluída');
  } catch (error: any) {
    console.error('⚠️ Erro ao verificar/corrigir schema:', error.message);
    console.error('💡 Execute o script fix_regime_tributario.sql manualmente no Supabase');
    // Não lançar erro - permitir que o servidor inicie mesmo se a verificação falhar
  }
}

// Fechar conexões ao encerrar
export async function closeDatabase() {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
    console.log('✅ Conexões do banco de dados fechadas');
  }
}

// Exportar adaptadores
export default { run, get, all, exec };
