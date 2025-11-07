# Script de Verificação Pré-Deploy
# Sistema Fiscal - Render + Supabase
# Execute antes de fazer deploy para verificar se tudo está OK

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   VERIFICAÇÃO PRÉ-DEPLOY - Sistema Fiscal                 ║" -ForegroundColor Cyan
Write-Host "║   Render + Supabase                                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$erros = 0
$avisos = 0
$sucessos = 0

# Função para exibir resultados
function Resultado {
    param(
        [string]$Tipo,
        [string]$Mensagem
    )
    
    switch ($Tipo) {
        "OK" { 
            Write-Host "✅ " -NoNewline -ForegroundColor Green
            Write-Host $Mensagem
            $script:sucessos++
        }
        "ERRO" { 
            Write-Host "❌ " -NoNewline -ForegroundColor Red
            Write-Host $Mensagem
            $script:erros++
        }
        "AVISO" { 
            Write-Host "⚠️  " -NoNewline -ForegroundColor Yellow
            Write-Host $Mensagem
            $script:avisos++
        }
        "INFO" { 
            Write-Host "ℹ️  " -NoNewline -ForegroundColor Blue
            Write-Host $Mensagem
        }
    }
}

# ============================================================
# 1. VERIFICAR NODE.JS
# ============================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "1️⃣  VERIFICANDO NODE.JS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

try {
    $nodeVersion = node --version
    $versionNumber = $nodeVersion.Replace("v", "").Split(".")[0]
    
    if ([int]$versionNumber -ge 18) {
        Resultado "OK" "Node.js instalado: $nodeVersion"
    } else {
        Resultado "ERRO" "Node.js $nodeVersion é muito antigo. Precisa de v18+"
        Resultado "INFO" "Download: https://nodejs.org"
    }
} catch {
    Resultado "ERRO" "Node.js não está instalado"
    Resultado "INFO" "Download: https://nodejs.org"
}

# ============================================================
# 2. VERIFICAR ESTRUTURA DO PROJETO
# ============================================================
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "2️⃣  VERIFICANDO ESTRUTURA DO PROJETO" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$arquivosNecessarios = @(
    "backend\package.json",
    "backend\tsconfig.json",
    "backend\src\server.ts",
    "backend\src\config\database.ts",
    "frontend\package.json",
    "frontend\src\App.tsx",
    "database_supabase.sql"
)

foreach ($arquivo in $arquivosNecessarios) {
    if (Test-Path $arquivo) {
        Resultado "OK" "Arquivo encontrado: $arquivo"
    } else {
        Resultado "ERRO" "Arquivo não encontrado: $arquivo"
    }
}

# ============================================================
# 3. VERIFICAR DEPENDÊNCIAS DO BACKEND
# ============================================================
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "3️⃣  VERIFICANDO DEPENDÊNCIAS DO BACKEND" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if (Test-Path "backend\node_modules") {
    Resultado "OK" "node_modules do backend existe"
    
    # Verificar dependências críticas
    $depsCriticas = @("pg", "express", "socket.io", "typescript", "dotenv")
    foreach ($dep in $depsCriticas) {
        if (Test-Path "backend\node_modules\$dep") {
            Resultado "OK" "Dependência instalada: $dep"
        } else {
            Resultado "ERRO" "Dependência não instalada: $dep"
        }
    }
} else {
    Resultado "ERRO" "node_modules do backend não existe"
    Resultado "INFO" "Execute: cd backend && npm install"
}

# ============================================================
# 4. VERIFICAR BUILD DO BACKEND
# ============================================================
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "4️⃣  VERIFICANDO BUILD DO BACKEND" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if (Test-Path "backend\dist\server.js") {
    Resultado "OK" "Build do backend existe"
} else {
    Resultado "AVISO" "Build do backend não existe"
    Resultado "INFO" "Será criado automaticamente no deploy"
}

# ============================================================
# 5. VERIFICAR SCRIPTS NPM
# ============================================================
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "5️⃣  VERIFICANDO SCRIPTS NPM DO BACKEND" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if (Test-Path "backend\package.json") {
    $packageJson = Get-Content "backend\package.json" -Raw | ConvertFrom-Json
    
    $scriptsNecessarios = @("build", "start", "prestart")
    foreach ($script in $scriptsNecessarios) {
        if ($packageJson.scripts.$script) {
            Resultado "OK" "Script '$script' configurado"
        } else {
            Resultado "ERRO" "Script '$script' não encontrado no package.json"
        }
    }
}

# ============================================================
# 6. VERIFICAR VARIÁVEIS DE AMBIENTE (LOCAL)
# ============================================================
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "6️⃣  VERIFICANDO VARIÁVEIS DE AMBIENTE" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if (Test-Path "backend\.env") {
    Resultado "OK" "Arquivo .env existe"
    
    $envContent = Get-Content "backend\.env" -Raw
    
    if ($envContent -match "DATABASE_URL") {
        Resultado "OK" "DATABASE_URL configurada"
        
        # Verificar se é URL do Supabase
        if ($envContent -match "postgresql://") {
            Resultado "OK" "URL PostgreSQL/Supabase detectada"
            
            # Verificar se é Direct Connection (recomendado)
            if ($envContent -match "db\..+\.supabase\.co") {
                Resultado "OK" "Direct Connection URL (recomendado) ✨"
            } elseif ($envContent -match "pooler\.supabase\.com") {
                Resultado "AVISO" "Pooling URL detectada"
                Resultado "INFO" "Recomendado: Use Direct Connection URL"
            }
        }
    } else {
        Resultado "ERRO" "DATABASE_URL não configurada no .env"
    }
} else {
    Resultado "AVISO" "Arquivo .env não existe (OK para deploy)"
    Resultado "INFO" "Configure DATABASE_URL no Render Environment"
}

# ============================================================
# 7. VERIFICAR FERRAMENTAS DE TESTE
# ============================================================
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "7️⃣  VERIFICANDO FERRAMENTAS DE TESTE" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if (Test-Path "backend\testar-url-supabase.js") {
    Resultado "OK" "Script de teste disponível"
    Resultado "INFO" "Use: node backend\testar-url-supabase.js 'sua-url'"
} else {
    Resultado "AVISO" "Script de teste não encontrado"
}

# ============================================================
# 8. VERIFICAR GIT
# ============================================================
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "8️⃣  VERIFICANDO GIT" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

try {
    $gitVersion = git --version
    Resultado "OK" "Git instalado: $gitVersion"
    
    if (Test-Path ".git") {
        Resultado "OK" "Repositório Git inicializado"
        
        # Verificar se tem commits
        try {
            $commits = git rev-list --count HEAD
            if ([int]$commits -gt 0) {
                Resultado "OK" "Repositório tem $commits commit(s)"
            }
        } catch {
            Resultado "AVISO" "Nenhum commit ainda"
        }
        
        # Verificar remote
        try {
            $remote = git remote -v
            if ($remote) {
                Resultado "OK" "Remote configurado"
            } else {
                Resultado "AVISO" "Nenhum remote configurado"
                Resultado "INFO" "Configure: git remote add origin <url>"
            }
        } catch {
            Resultado "AVISO" "Nenhum remote configurado"
        }
    } else {
        Resultado "ERRO" "Não é um repositório Git"
        Resultado "INFO" "Execute: git init"
    }
} catch {
    Resultado "ERRO" "Git não está instalado"
    Resultado "INFO" "Download: https://git-scm.com"
}

# ============================================================
# 9. VERIFICAR DOCUMENTAÇÃO
# ============================================================
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "9️⃣  VERIFICANDO DOCUMENTAÇÃO" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$guias = @(
    "RENDER_DEPLOYMENT_GUIDE.md",
    "SOLUCAO_ERRO_RENDER_SUPABASE.md",
    "FAQ_RENDER_SUPABASE.md",
    "INDICE_TROUBLESHOOTING.md"
)

foreach ($guia in $guias) {
    if (Test-Path $guia) {
        Resultado "OK" "Guia disponível: $guia"
    } else {
        Resultado "AVISO" "Guia não encontrado: $guia"
    }
}

# ============================================================
# RESUMO FINAL
# ============================================================
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    RESUMO DA VERIFICAÇÃO                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Sucessos: " -NoNewline -ForegroundColor Green
Write-Host $sucessos
Write-Host "⚠️  Avisos: " -NoNewline -ForegroundColor Yellow
Write-Host $avisos
Write-Host "❌ Erros: " -NoNewline -ForegroundColor Red
Write-Host $erros

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($erros -eq 0) {
    Write-Host ""
    Write-Host "🎉 SISTEMA PRONTO PARA DEPLOY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Obtenha a Direct Connection URL do Supabase" -ForegroundColor White
    Write-Host "   2. Teste com: node backend\testar-url-supabase.js 'sua-url'" -ForegroundColor White
    Write-Host "   3. Configure no Render (Environment → DATABASE_URL)" -ForegroundColor White
    Write-Host "   4. Faça o deploy!" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Guia completo: RENDER_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
    Write-Host ""
} elseif ($erros -le 3 -and $avisos -gt 0) {
    Write-Host ""
    Write-Host "⚠️  SISTEMA QUASE PRONTO" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Corrija os erros acima antes de fazer deploy." -ForegroundColor Yellow
    Write-Host "Os avisos não impedem o deploy, mas verifique-os." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ SISTEMA NÃO ESTÁ PRONTO PARA DEPLOY" -ForegroundColor Red
    Write-Host ""
    Write-Host "Corrija os erros acima antes de continuar." -ForegroundColor Red
    Write-Host ""
    Write-Host "📖 Consulte: INSTALL.md para instalação local" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Pausar no final
Read-Host "Pressione Enter para sair"

