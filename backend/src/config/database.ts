import sqlite3 from 'sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { promisify } from 'util';

const DB_DIR = join(__dirname, '../../database');
const DB_PATH = join(DB_DIR, 'fiscal.db');

// Criar diretório se não existir
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

// Criar conexão com banco
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('✅ Conectado ao banco de dados SQLite');
  }
});

// Converter métodos para promessas
const dbExec = promisify(db.exec.bind(db));

// Wrapper para db.get que aceita parâmetros
const dbGet = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Wrapper para db.all que aceita parâmetros
const dbAll = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
};

// Wrapper para db.run que retorna informações sobre mudanças
const dbRun = (sql: string, params: any[] = []): Promise<{ changes: number; lastID: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes, lastID: this.lastID });
      }
    });
  });
};

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON');

// Criar tabelas
export async function initializeDatabase() {
  try {
    // Tabela de obrigações
    await dbExec(`
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
    await dbExec(`
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
    await dbExec(`
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
    await dbExec(`
      CREATE TABLE IF NOT EXISTS feriados (
        data TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL
      )
    `);

    // Índices para melhor performance
    await dbExec(`
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

// Exportar db e métodos promisificados
export default {
  db,
  run: dbRun,
  get: dbGet,
  all: dbAll,
  exec: dbExec
};

