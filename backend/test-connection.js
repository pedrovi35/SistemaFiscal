// Test de conexão com o Supabase
require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Testando conexão com o Supabase...\n');

// Verificar se DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não está definida no arquivo .env');
  process.exit(1);
}

console.log('✅ DATABASE_URL encontrada');
console.log('📍 URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
console.log('');

// Tentar conectar
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    console.log('🔌 Conectando ao PostgreSQL...');
    const result = await pool.query('SELECT 1 as test, current_database() as db, version()');
    
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Banco de dados:', result.rows[0].db);
    console.log('🐘 Versão:', result.rows[0].version.split(',')[0]);
    console.log('');

    // Verificar tabelas
    console.log('🔍 Verificando tabelas...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (tables.rows.length === 0) {
      console.log('⚠️  Nenhuma tabela encontrada!');
      console.log('');
      console.log('📝 AÇÃO NECESSÁRIA:');
      console.log('   1. Acesse o Supabase Dashboard: https://app.supabase.com');
      console.log('   2. Vá em SQL Editor');
      console.log('   3. Execute o arquivo database_supabase_fixed.sql');
      console.log('');
    } else {
      console.log(`✅ ${tables.rows.length} tabelas encontradas:`);
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro ao conectar:');
    console.error('   Mensagem:', error.message);
    console.error('');
    console.error('🔧 Possíveis soluções:');
    console.error('   1. Verifique se a DATABASE_URL está correta');
    console.error('   2. Verifique se a senha está correta');
    console.error('   3. Verifique se o projeto Supabase está ativo');
    console.error('   4. Tente usar a Connection Pooling URL');
    console.error('');
    await pool.end();
    process.exit(1);
  }
}

test();

