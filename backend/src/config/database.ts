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
