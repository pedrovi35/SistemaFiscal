# Script PowerShell para iniciar o Sistema Fiscal completo

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SISTEMA FISCAL - Inicialização Completa" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurar ExecutionPolicy
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

# Verificar se as pastas existem
if (-not (Test-Path "backend")) {
    Write-Host "❌ Pasta 'backend' não encontrada!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "frontend")) {
    Write-Host "❌ Pasta 'frontend' não encontrada!" -ForegroundColor Red
    exit 1
}

# Verificar se node_modules existem
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "⚠️  Instalando dependências do backend..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "⚠️  Instalando dependências do frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

Write-Host "✅ Dependências verificadas" -ForegroundColor Green
Write-Host ""

# Compilar backend
Write-Host "🔨 Compilando backend..." -ForegroundColor Yellow
Set-Location backend
npm run build
Set-Location ..

Write-Host "✅ Backend compilado" -ForegroundColor Green
Write-Host ""

# Iniciar Backend
Write-Host "🚀 Iniciando Backend (porta 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD\backend'; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; npm start"

# Aguardar backend inicializar
Write-Host "⏳ Aguardando backend inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Iniciar Frontend
Write-Host "🚀 Iniciando Frontend (porta 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD\frontend'; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ SISTEMA INICIADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "📍 Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "📍 API:      http://localhost:3001/api" -ForegroundColor White
Write-Host ""
Write-Host "Aguarde ~10 segundos e acesse: " -NoNewline
Write-Host "http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para parar os serviços, feche as janelas do PowerShell abertas." -ForegroundColor Gray
Write-Host ""

# Aguardar 5 segundos e abrir o navegador
Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"

