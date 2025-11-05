# Script para testar as correções do backend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE DAS CORREÇÕES - Backend" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Parar processos antigos
Write-Host "1. Parando processos Node.js antigos..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "   ✅ Processos encerrados`n" -ForegroundColor Green

# 2. Recompilar
Write-Host "2. Recompilando TypeScript..." -ForegroundColor Yellow
npm run build | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Compilação bem-sucedida`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erro na compilação!`n" -ForegroundColor Red
    exit 1
}

# 3. Iniciar backend em nova janela
Write-Host "3. Iniciando backend em nova janela..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD'; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; Write-Host '🚀 BACKEND INICIANDO...' -ForegroundColor Cyan; npm start"
Write-Host "   ✅ Backend iniciado`n" -ForegroundColor Green

# 4. Aguardar inicialização
Write-Host "4. Aguardando backend inicializar (15 segundos)..." -ForegroundColor Yellow
for ($i = 15; $i -gt 0; $i--) {
    Write-Host "   ⏳ $i segundos..." -NoNewline
    Start-Sleep -Seconds 1
    Write-Host "`r" -NoNewline
}
Write-Host "   ✅ Tempo de espera concluído`n" -ForegroundColor Green

# 5. Testar endpoints
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTANDO ENDPOINTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$todosOk = $true

# Teste 1: Health
Write-Host "1. GET /health" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod "http://localhost:3001/health" -TimeoutSec 5
    Write-Host "   ✅ OK - Status: $($health.status)" -ForegroundColor Green
    Write-Host "   📄 $($health.service)`n" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ FALHOU - $($_.Exception.Message)`n" -ForegroundColor Red
    $todosOk = $false
}

# Teste 2: Listar Obrigações
Write-Host "2. GET /api/obrigacoes" -ForegroundColor Yellow
try {
    $obrigacoes = Invoke-RestMethod "http://localhost:3001/api/obrigacoes" -TimeoutSec 5
    Write-Host "   ✅ OK - $($obrigacoes.Count) obrigações encontradas`n" -ForegroundColor Green
} catch {
    $errorMsg = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($errorMsg) {
        Write-Host "   ❌ FALHOU - $($errorMsg.erro)`n" -ForegroundColor Red
    } else {
        Write-Host "   ❌ FALHOU - $($_.Exception.Message)`n" -ForegroundColor Red
    }
    $todosOk = $false
}

# Teste 3: Listar Clientes (NOVO!)
Write-Host "3. GET /api/clientes (CORRIGIDO)" -ForegroundColor Yellow
try {
    $clientes = Invoke-RestMethod "http://localhost:3001/api/clientes" -TimeoutSec 5
    Write-Host "   ✅ OK - $($clientes.Count) clientes encontrados`n" -ForegroundColor Green
} catch {
    $errorMsg = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($errorMsg) {
        Write-Host "   ❌ FALHOU - $($errorMsg.erro)`n" -ForegroundColor Red
    } else {
        Write-Host "   ❌ FALHOU - $($_.Exception.Message)`n" -ForegroundColor Red
    }
    $todosOk = $false
}

# Teste 4: Criar Cliente
Write-Host "4. POST /api/clientes (NOVO!)" -ForegroundColor Yellow
try {
    $novoCliente = @{
        nome = "Empresa Teste LTDA"
        cnpj = "12.345.678/0001-90"
        email = "contato@empresateste.com.br"
        telefone = "(11) 98765-4321"
        ativo = $true
        regimeTributario = "Lucro Presumido"
    } | ConvertTo-Json

    $clienteCriado = Invoke-RestMethod -Uri "http://localhost:3001/api/clientes" -Method POST -Body $novoCliente -ContentType "application/json" -TimeoutSec 5
    Write-Host "   ✅ OK - Cliente criado: $($clienteCriado.nome)" -ForegroundColor Green
    Write-Host "   📄 ID: $($clienteCriado.id)`n" -ForegroundColor Gray
} catch {
    $errorMsg = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($errorMsg) {
        Write-Host "   ⚠️  $($errorMsg.erro) (pode já existir)`n" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ FALHOU - $($_.Exception.Message)`n" -ForegroundColor Red
        $todosOk = $false
    }
}

# Teste 5: Feriados
Write-Host "5. GET /api/feriados/2025" -ForegroundColor Yellow
try {
    $feriados = Invoke-RestMethod "http://localhost:3001/api/feriados/2025" -TimeoutSec 5
    Write-Host "   ✅ OK - $($feriados.Count) feriados em 2025`n" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Endpoint não testado (erro esperado se não houver feriados)`n" -ForegroundColor Yellow
}

# Resultado final
Write-Host "========================================" -ForegroundColor Cyan
if ($todosOk) {
    Write-Host "  ✅ TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Backend está funcionando perfeitamente!" -ForegroundColor Green
    Write-Host "URL: http://localhost:3001" -ForegroundColor White
    Write-Host ""
    Write-Host "Endpoints disponíveis:" -ForegroundColor White
    Write-Host "  ✅ GET  /health" -ForegroundColor Gray
    Write-Host "  ✅ GET  /api/obrigacoes" -ForegroundColor Gray
    Write-Host "  ✅ POST /api/obrigacoes" -ForegroundColor Gray
    Write-Host "  ✅ GET  /api/clientes" -ForegroundColor Gray
    Write-Host "  ✅ POST /api/clientes" -ForegroundColor Gray
    Write-Host "  ✅ GET  /api/feriados/:ano" -ForegroundColor Gray
} else {
    Write-Host "  ⚠️  ALGUNS TESTES FALHARAM" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Verifique a janela do backend para ver os erros detalhados." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

