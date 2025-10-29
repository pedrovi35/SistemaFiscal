# Script PowerShell para iniciar o Sistema Fiscal
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sistema de Obrigações Fiscais" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale o Node.js 18+ de: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Verificar se as pastas existem
if (-not (Test-Path "backend")) {
    Write-Host "✗ Pasta 'backend' não encontrada!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "frontend")) {
    Write-Host "✗ Pasta 'frontend' não encontrada!" -ForegroundColor Red
    exit 1
}

# Iniciar Backend
Write-Host ""
Write-Host "Iniciando backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Backend - Sistema Fiscal' -ForegroundColor Green; cd backend; npm run dev"

# Aguardar
Write-Host "Aguardando backend inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Iniciar Frontend
Write-Host ""
Write-Host "Iniciando frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Frontend - Sistema Fiscal' -ForegroundColor Green; cd frontend; npm run dev"

# Aguardar
Start-Sleep -Seconds 2

# Mensagem final
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Sistema iniciado com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Aguarde alguns segundos e acesse o frontend no navegador!" -ForegroundColor Yellow
Write-Host ""

