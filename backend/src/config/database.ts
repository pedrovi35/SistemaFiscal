import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const DB_DIR = join(__dirname, '../../database');
const DB_PATH = join(DB_DIR, 'fiscal.db');

// Criar diretório se não existir
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

// Criar conexão com banco
const db = new Database(DB_PATH);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Criar tabelas
export function initializeDatabase() {
  // Tabela de obrigações
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
    CREATE TABLE IF NOT EXISTS feriados (
      data TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL
    )
  `);

  // Índices para melhor performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_obrigacoes_data ON obrigacoes(dataVencimento);
    CREATE INDEX IF NOT EXISTS idx_obrigacoes_cliente ON obrigacoes(cliente);
    CREATE INDEX IF NOT EXISTS idx_obrigacoes_responsavel ON obrigacoes(responsavel);
    CREATE INDEX IF NOT EXISTS idx_historico_obrigacao ON historico(obrigacaoId);
  `);

  console.log('✅ Banco de dados inicializado com sucesso!');
}

export default db;

