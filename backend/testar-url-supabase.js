/**
 * Script para testar conexão com Supabase
 * Teste localmente antes de configurar no Render
 * 
 * USO:
 * node testar-url-supabase.js "sua-url-completa-aqui"
 */

const { Pool } = require('pg');

// Cores para o terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testarConexao(databaseUrl) {
  log('\n🔍 TESTADOR DE CONEXÃO SUPABASE + RENDER', 'cyan');
  log('='.repeat(50), 'cyan');
  
  if (!databaseUrl) {
    log('\n❌ Erro: URL não fornecida', 'red');
    log('\nUso:', 'yellow');
    log('  node testar-url-supabase.js "sua-database-url"', 'yellow');
    log('\nExemplo:', 'yellow');
    log('  node testar-url-supabase.js "postgresql://postgres.xxx:senha@db.xxx.supabase.co:5432/postgres"', 'yellow');
    process.exit(1);
  }

  // Verificar formato da URL
  log('\n📋 Verificando formato da URL...', 'blue');
  const urlSemSenha = databaseUrl.replace(/:([^:@]+)@/, ':****@');
  log(`   URL: ${urlSemSenha}`, 'blue');

  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    log('   ❌ URL deve começar com postgresql:// ou postgres://', 'red');
    process.exit(1);
  }
  log('   ✅ Formato correto', 'green');

  // Identificar tipo de conexão
  log('\n🔎 Identificando tipo de conexão...', 'blue');
  if (databaseUrl.includes('pooler.supabase.com')) {
    const porta = databaseUrl.match(/:(\d+)\//)?.[1];
    log('   ⚠️  Connection Pooling URL detectada', 'yellow');
    log(`   Porta: ${porta}`, 'yellow');
    
    if (porta === '5432') {
      log('   ⚠️  Porta 5432 com pooler pode causar problemas no Render', 'yellow');
      log('   💡 RECOMENDAÇÃO: Use Direct Connection URL', 'yellow');
      log('   💡 OU troque para porta 6543 (Transaction Mode)', 'yellow');
    } else if (porta === '6543') {
      log('   ✅ Transaction Mode (porta 6543)', 'green');
    }
  } else if (databaseUrl.includes('.supabase.co')) {
    log('   ✅ Direct Connection URL (recomendado para Render)', 'green');
  } else {
    log('   ⚠️  URL não reconhecida como Supabase', 'yellow');
  }

  // Testar conexão
  log('\n🔌 Testando conexão...', 'blue');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    max: 1
  });

  try {
    log('   ⏳ Aguardando conexão...', 'yellow');
    const startTime = Date.now();
    
    const client = await pool.connect();
    const elapsed = Date.now() - startTime;
    
    log(`   ✅ Conectado em ${elapsed}ms`, 'green');

    // Testar query
    log('\n🧪 Testando query...', 'blue');
    const result = await client.query('SELECT 1 as ok, version() as version');
    
    if (result.rows[0].ok === 1) {
      log('   ✅ Query executada com sucesso', 'green');
      log(`   ℹ️  PostgreSQL: ${result.rows[0].version.split(' ')[1]}`, 'blue');
    }

    client.release();

    // Verificar tabelas
    log('\n📊 Verificando tabelas do sistema...', 'blue');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('clientes', 'obrigacoes', 'obrigacoes_executadas', 'feriados')
      ORDER BY table_name
    `);

    const tabelasEncontradas = tablesResult.rows.map(r => r.table_name);
    const tabelasEsperadas = ['clientes', 'obrigacoes', 'obrigacoes_executadas', 'feriados'];

    tabelasEsperadas.forEach(tabela => {
      if (tabelasEncontradas.includes(tabela)) {
        log(`   ✅ Tabela '${tabela}' existe`, 'green');
      } else {
        log(`   ❌ Tabela '${tabela}' NÃO encontrada`, 'red');
      }
    });

    if (tabelasEncontradas.length === 0) {
      log('\n   ⚠️  ATENÇÃO: Nenhuma tabela encontrada!', 'yellow');
      log('   💡 Execute o script database_supabase.sql no Supabase SQL Editor', 'yellow');
    }

    await pool.end();

    // Resumo final
    log('\n' + '='.repeat(50), 'cyan');
    log('✅ TESTE CONCLUÍDO COM SUCESSO!', 'green');
    log('='.repeat(50), 'cyan');
    log('\n📝 Próximos passos:', 'blue');
    log('   1. Configure essa URL no Render (Environment → DATABASE_URL)', 'blue');
    log('   2. Salve as alterações', 'blue');
    log('   3. Aguarde o redeploy automático', 'blue');
    log('   4. Verifique os logs no Render Dashboard\n', 'blue');

  } catch (error) {
    log(`\n   ❌ ERRO: ${error.message}`, 'red');
    
    if (error.code === 'ECONNREFUSED') {
      log('\n💡 Soluções para ECONNREFUSED:', 'yellow');
      log('   1. Verifique se a URL está correta', 'yellow');
      log('   2. Tente usar Direct Connection URL ao invés de Pooling', 'yellow');
      log('   3. Verifique se o projeto Supabase está ativo (não pausado)', 'yellow');
      log('   4. Confira se a senha está correta na URL', 'yellow');
    } else if (error.code === 'ETIMEDOUT') {
      log('\n💡 Soluções para TIMEOUT:', 'yellow');
      log('   1. Verifique sua conexão com a internet', 'yellow');
      log('   2. Tente novamente em alguns segundos', 'yellow');
      log('   3. Verifique se há firewall bloqueando a porta 5432', 'yellow');
    } else if (error.message.includes('password')) {
      log('\n💡 Erro de autenticação:', 'yellow');
      log('   1. Verifique se a senha na URL está correta', 'yellow');
      log('   2. Resete a senha do database no Supabase se necessário', 'yellow');
    }
    
    log('\n📋 Detalhes técnicos:', 'red');
    console.error(error);
    
    await pool.end();
    process.exit(1);
  }
}

// Executar
const databaseUrl = process.argv[2];
testarConexao(databaseUrl).catch(error => {
  log(`\n❌ Erro fatal: ${error.message}`, 'red');
  process.exit(1);
});

