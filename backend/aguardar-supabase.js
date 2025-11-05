// Script para aguardar o Supabase ficar pronto
require('dotenv').config();
const { Pool } = require('pg');

console.log('🔄 AGUARDANDO PROJETO SUPABASE INICIALIZAR...\n');
console.log('⏱️  Projetos novos levam 2-5 minutos para ficarem prontos');
console.log('📍 Testando conexão a cada 10 segundos...\n');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada no .env');
  process.exit(1);
}

console.log('✅ DATABASE_URL configurada');
console.log('🔗 URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
console.log('');

let tentativas = 0;
const maxTentativas = 30; // 5 minutos (30 * 10 segundos)

async function testarConexao() {
  tentativas++;
  
  console.log(`\n🔍 Tentativa ${tentativas}/${maxTentativas}...`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    const result = await pool.query('SELECT 1 as test, current_database() as db, version()');
    
    console.log('\n✅ ✅ ✅ SUCESSO! ✅ ✅ ✅');
    console.log('🎉 Conexão com Supabase estabelecida!\n');
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
      console.log('⚠️  Nenhuma tabela encontrada!\n');
      console.log('📝 PRÓXIMO PASSO:');
      console.log('   1. Acesse: https://app.supabase.com');
      console.log('   2. Vá em SQL Editor');
      console.log('   3. Cole e execute o arquivo database_supabase.sql\n');
    } else {
      console.log(`✅ ${tables.rows.length} tabelas encontradas:`);
      tables.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
      console.log('');
    }

    console.log('🚀 BACKEND PRONTO PARA INICIAR!');
    console.log('   Execute: npm start\n');

    await pool.end();
    process.exit(0);

  } catch (error) {
    await pool.end();
    
    if (tentativas >= maxTentativas) {
      console.log('\n❌ ❌ ❌ TEMPO ESGOTADO ❌ ❌ ❌\n');
      console.log('O projeto não ficou disponível após 5 minutos.\n');
      console.log('🔧 POSSÍVEIS CAUSAS:');
      console.log('   1. O projeto está realmente pausado');
      console.log('   2. A senha está incorreta');
      console.log('   3. A URL está incorreta');
      console.log('   4. Problema temporário do Supabase\n');
      console.log('💡 SOLUÇÃO:');
      console.log('   1. Acesse: https://app.supabase.com');
      console.log('   2. Verifique o status do projeto');
      console.log('   3. Clique no projeto e veja se está "Active"');
      console.log('   4. Copie novamente a DATABASE_URL em Settings → Database\n');
      process.exit(1);
    }

    // Mostrar apenas erro resumido
    const errorMsg = error.message;
    if (errorMsg.includes('ENOTFOUND')) {
      console.log('   ⏳ Aguardando DNS resolver...');
    } else if (errorMsg.includes('ECONNREFUSED')) {
      console.log('   ⏳ Aguardando servidor aceitar conexões...');
    } else if (errorMsg.includes('timeout')) {
      console.log('   ⏳ Timeout - servidor ainda inicializando...');
    } else {
      console.log(`   ⚠️  ${errorMsg}`);
    }

    // Aguardar 10 segundos antes da próxima tentativa
    await new Promise(resolve => setTimeout(resolve, 10000));
    await testarConexao();
  }
}

// Iniciar
testarConexao();

