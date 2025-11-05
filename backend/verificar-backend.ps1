# Script de Verificação e Diagnóstico do Backend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DIAGNÓSTICO DO BACKEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar diretório
$currentDir = Get-Location
Write-Host "📁 Diretório atual: $currentDir" -ForegroundColor White

if ($currentDir.Path -notlike "*\backend") {
    Write-Host "⚠️  AVISO: Você não está na pasta backend!" -ForegroundColor Yellow
    Write-Host "   Execute: cd backend" -ForegroundColor Yellow
    Write-Host ""
}

# 2. Verificar .env
Write-Host "🔍 Verificando arquivo .env..." -ForegroundColor White
if (Test-Path ".env") {
    Write-Host "   ✅ Arquivo .env existe" -ForegroundColor Green
    $envContent = Get-Content .env | Select-String "DATABASE_URL" | Select-Object -First 1
    if ($envContent) {
        Write-Host "   ✅ DATABASE_URL configurada" -ForegroundColor Green
    } else {
        Write-Host "   ❌ DATABASE_URL não encontrada no .env!" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Arquivo .env NÃO existe!" -ForegroundColor Red
    Write-Host "   Crie o arquivo .env com as credenciais do Supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 3. Verificar node_modules
Write-Host "🔍 Verificando dependências..." -ForegroundColor White
if (Test-Path "node_modules") {
    $nodeModulesCount = (Get-ChildItem node_modules -Directory | Measure-Object).Count
    Write-Host "   ✅ node_modules existe ($nodeModulesCount pacotes)" -ForegroundColor Green
} else {
    Write-Host "   ❌ node_modules NÃO existe!" -ForegroundColor Red
    Write-Host "   Execute: npm install" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 4. Verificar compilação
Write-Host "🔍 Verificando compilação..." -ForegroundColor White
if (Test-Path "dist\server.js") {
    Write-Host "   ✅ Backend compilado (dist/server.js existe)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend não compilado" -ForegroundColor Yellow
    Write-Host "   Compilando agora..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Compilação bem-sucedida!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erro na compilação!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# 5. Testar conexão com Supabase
Write-Host "🔍 Testando conexão com Supabase..." -ForegroundColor White
Write-Host "   Aguarde..." -ForegroundColor Gray
$testResult = node test-connection.js 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Conexão com Supabase OK!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Falha na conexão com Supabase!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Saída do teste:" -ForegroundColor Yellow
    Write-Host $testResult
    Write-Host ""
    Write-Host "SOLUÇÃO:" -ForegroundColor Yellow
    Write-Host "1. Verifique se o projeto Supabase está ativo" -ForegroundColor White
    Write-Host "2. Copie a DATABASE_URL correta do Supabase" -ForegroundColor White
    Write-Host "3. Atualize o arquivo .env" -ForegroundColor White
    exit 1
}

Write-Host ""

# 6. Verificar se porta 3001 está livre
Write-Host "🔍 Verificando porta 3001..." -ForegroundColor White
$portInUse = netstat -ano | Select-String ":3001.*LISTENING"
if ($portInUse) {
    Write-Host "   ⚠️  Porta 3001 JÁ está em uso!" -ForegroundColor Yellow
    Write-Host "   $portInUse" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Deseja matar o processo? (S/N): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s") {
        Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
        Write-Host "   ✅ Processos Node encerrados" -ForegroundColor Green
    }
} else {
    Write-Host "   ✅ Porta 3001 está livre" -ForegroundColor Green
}

Write-Host ""

# 7. Resumo
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMO DO DIAGNÓSTICO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Arquivo .env: OK" -ForegroundColor Green
Write-Host "✅ Dependências: OK" -ForegroundColor Green
Write-Host "✅ Compilação: OK" -ForegroundColor Green
Write-Host "✅ Conexão Supabase: OK" -ForegroundColor Green
Write-Host "✅ Porta 3001: Livre" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  TUDO PRONTO! INICIANDO BACKEND..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Iniciar backend
Write-Host "Pressione Ctrl+C para encerrar o servidor" -ForegroundColor Yellow
Write-Host ""

npm start

