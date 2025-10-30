import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { promisify } from 'util';
import { Pool } from 'pg';

let pgPool: Pool | null = null;

// Objetos e funções do SQLite serão definidos apenas se necessário (para evitar crashes em produção)
let sqliteDb: any = null;
let sqliteExec: ((sql: string) => Promise<void>) | null = null;
let sqliteGet: ((sql: string, params?: any[]) => Promise<any>) | null = null;
let sqliteAll: ((sql: string, params?: any[]) => Promise<any[]>) | null = null;
let sqliteRun: ((sql: string, params?: any[]) => Promise<{ changes: number; lastID: number }>) | null = null;

// Adaptadores atuais (podem ser sobrescritos quando Postgres estiver ativo)
let currentExec: (sql: string) => Promise<void>;
let currentGet: (sql: string, params?: any[]) => Promise<any>;
let currentAll: (sql: string, params?: any[]) => Promise<any[]>;
let currentRun: (sql: string, params?: any[]) => Promise<{ changes: number; lastID: number }>;

// Utilitário: converte placeholders `?` para `$1, $2, ...` do Postgres
function toPgParams(sql: string, params: any[]): { text: string; values: any[] } {
  let index = 0;
  const text = sql.replace(/\?/g, () => `$${++index}`);
  return { text, values: params };
}

// Criar tabelas
export async function initializeDatabase() {
  try {
    // Ativar Postgres (Supabase) se variável estiver definida
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      try {
        pgPool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        });

        // Substituir adaptadores para usar Postgres
        currentExec = async (sql: string) => {
          await (pgPool as Pool).query(sql);
        };
        currentGet = async (sql: string, params: any[] = []) => {
          const { text, values } = toPgParams(sql, params);
          const res = await (pgPool as Pool).query(text, values);
          return res.rows[0];
        };
        currentAll = async (sql: string, params: any[] = []) => {
          const { text, values } = toPgParams(sql, params);
          const res = await (pgPool as Pool).query(text, values);
          return res.rows as any[];
        };
        currentRun = async (sql: string, params: any[] = []) => {
          const { text, values } = toPgParams(sql, params);
          const res: any = await (pgPool as Pool).query(text, values);
          return { changes: res.rowCount ?? 0, lastID: 0 };
        };

        // Testar conexão
        const test = await (pgPool as Pool).query('select 1 as ok');
        if (test.rows?.[0]?.ok === 1) {
          console.log('✅ Conectado ao PostgreSQL (Supabase)');
        } else {
          console.warn('⚠️ Conexão ao PostgreSQL efetuada, mas teste não retornou como esperado.');
        }

        console.log('ℹ️ Modo Postgres ativo: criação de tabelas via SQL externo (database_supabase.sql)');
        return;
      } catch (pgError) {
        // Falha ao conectar no Postgres: voltar para SQLite
        console.warn('⚠️ Falha ao conectar ao PostgreSQL (Supabase). Voltando para SQLite. Detalhe:', pgError);
        pgPool = null;
        // segue para criação das tabelas SQLite abaixo
      }
    }

    // Modo SQLite (padrão): carregar dependência e preparar arquivos apenas aqui
    const { default: sqlite3 } = await import('sqlite3');
    const DB_DIR = join(__dirname, '../../database');
    const DB_PATH = join(DB_DIR, 'fiscal.db');

    if (!existsSync(DB_DIR)) {
      mkdirSync(DB_DIR, { recursive: true });
    }

    sqliteDb = new sqlite3.Database(DB_PATH, (err: Error | null) => {
      if (err) {
        console.error('❌ Erro ao conectar ao banco de dados SQLite:', err);
      } else {
        console.log('✅ Conectado ao banco de dados SQLite');
      }
    });

    sqliteExec = promisify(sqliteDb.exec.bind(sqliteDb)) as unknown as (sql: string) => Promise<void>;
    sqliteGet = (sql: string, params: any[] = []): Promise<any> => {
      return new Promise((resolve, reject) => {
        sqliteDb.get(sql, params, (err: Error | null, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      });
    };
    sqliteAll = (sql: string, params: any[] = []): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err: Error | null, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        });
      });
    };
    sqliteRun = (sql: string, params: any[] = []): Promise<{ changes: number; lastID: number }> => {
      return new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function(this: any, err: Error | null) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes, lastID: this.lastID });
          }
        });
      });
    };
    sqliteDb.run('PRAGMA foreign_keys = ON');

    // Definir adaptadores atuais para SQLite
    currentExec = sqliteExec as any;
    currentGet = sqliteGet as any;
    currentAll = sqliteAll as any;
    currentRun = sqliteRun as any;

    // Criar tabelas SQLite
    await currentExec(`
      CREATE TABLE IF NOT EXISTS obrigacoes (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        descricao TEXT,
        dataVencimento TEXT NOT NULL,
        dataVencimentoOriginal TEXT NOT NULL,
        tipo TEXT NOT NULL,
        status TEXT NOT NULL,
        cliente TEXT,
        empresa TEXT,
        responsavel TEXT,
        ajusteDataUtil INTEGER NOT NULL DEFAULT 1,
        cor TEXT,
        criadoEm TEXT NOT NULL,
        atualizadoEm TEXT NOT NULL,
        criadoPor TEXT
      )
    `);

    // Tabela de recorrência
    await currentExec(`
      CREATE TABLE IF NOT EXISTS recorrencias (
        obrigacaoId TEXT PRIMARY KEY,
        tipo TEXT NOT NULL,
        intervalo INTEGER,
        diaDoMes INTEGER,
        dataFim TEXT,
        proximaOcorrencia TEXT,
        FOREIGN KEY (obrigacaoId) REFERENCES obrigacoes(id) ON DELETE CASCADE
      )
    `);

    // Tabela de histórico
    await currentExec(`
      CREATE TABLE IF NOT EXISTS historico (
        id TEXT PRIMARY KEY,
        obrigacaoId TEXT NOT NULL,
        usuario TEXT NOT NULL,
        tipo TEXT NOT NULL,
        camposAlterados TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (obrigacaoId) REFERENCES obrigacoes(id) ON DELETE CASCADE
      )
    `);

    // Tabela de feriados (cache)
    await currentExec(`
      CREATE TABLE IF NOT EXISTS feriados (
        data TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL
      )
    `);

    // Índices para melhor performance
    await currentExec(`
      CREATE INDEX IF NOT EXISTS idx_obrigacoes_data ON obrigacoes(dataVencimento);
      CREATE INDEX IF NOT EXISTS idx_obrigacoes_cliente ON obrigacoes(cliente);
      CREATE INDEX IF NOT EXISTS idx_obrigacoes_responsavel ON obrigacoes(responsavel);
      CREATE INDEX IF NOT EXISTS idx_historico_obrigacao ON historico(obrigacaoId);
    `);

    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

// Exportar adaptadores compatíveis
export default {
  db: sqliteDb,
  run: (sql: string, params: any[] = []) => currentRun(sql, params),
  get: (sql: string, params: any[] = []) => currentGet(sql, params),
  all: (sql: string, params: any[] = []) => currentAll(sql, params),
  exec: (sql: string) => currentExec(sql)
};

