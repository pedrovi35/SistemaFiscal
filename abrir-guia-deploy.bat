@echo off
REM Script para abrir o guia de deploy rapidamente
REM Sistema Fiscal - Render + Supabase

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║   🚀 GUIA DE DEPLOY - Sistema Fiscal                      ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo.
echo 📖 Abrindo guias de deploy...
echo.

REM Verificar se os arquivos existem
if not exist "RENDER_DEPLOYMENT_GUIDE.md" (
    echo ❌ Arquivo RENDER_DEPLOYMENT_GUIDE.md não encontrado!
    echo.
    pause
    exit /b 1
)

REM Abrir o guia principal
start "" "RENDER_DEPLOYMENT_GUIDE.md"

echo ✅ Guia principal aberto!
echo.
echo 💡 Outros guias úteis:
echo.
echo    📋 QUICK_REFERENCE_DEPLOY.md       - Referência rápida
echo    ❓ FAQ_RENDER_SUPABASE.md          - Perguntas frequentes
echo    📊 DIAGRAMA_SOLUCAO_RENDER.md      - Visualização
echo    📝 SOLUCAO_COMPLETA_CRIADA.md      - Resumo executivo
echo    📚 INDICE_TROUBLESHOOTING.md       - Índice completo
echo.
echo 🛠️ Ferramentas:
echo.
echo    🧪 backend\testar-url-supabase.js  - Teste de conexão
echo    ✅ verificar-pre-deploy.ps1         - Verificação completa
echo.
echo.

REM Perguntar se quer abrir outros guias
choice /C SN /M "Deseja abrir outros guias também"

if errorlevel 2 goto fim
if errorlevel 1 goto abrir_outros

:abrir_outros
echo.
echo 📖 Abrindo guias adicionais...
echo.

if exist "QUICK_REFERENCE_DEPLOY.md" (
    start "" "QUICK_REFERENCE_DEPLOY.md"
    echo ✅ Referência rápida aberta
)

if exist "FAQ_RENDER_SUPABASE.md" (
    start "" "FAQ_RENDER_SUPABASE.md"
    echo ✅ FAQ aberto
)

if exist "SOLUCAO_COMPLETA_CRIADA.md" (
    start "" "SOLUCAO_COMPLETA_CRIADA.md"
    echo ✅ Resumo executivo aberto
)

if exist "RESUMO_VISUAL_SOLUCAO.txt" (
    start "" "RESUMO_VISUAL_SOLUCAO.txt"
    echo ✅ Resumo visual aberto
)

echo.

:fim
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo 🎯 PRÓXIMOS PASSOS:
echo.
echo    1. Leia o RENDER_DEPLOYMENT_GUIDE.md
echo    2. Execute: verificar-pre-deploy.ps1
echo    3. Teste sua URL com: node backend\testar-url-supabase.js
echo    4. Configure no Render
echo    5. Deploy! 🚀
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo ✅ Pronto! Siga o guia que foi aberto.
echo.

pause

