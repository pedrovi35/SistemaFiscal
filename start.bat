@echo off
echo ========================================
echo   Sistema de Obrigacoes Fiscais
echo ========================================
echo.
echo Iniciando backend...
start "Backend - Sistema Fiscal" cmd /k "cd backend && npm run dev"
echo.
echo Aguardando 5 segundos...
timeout /t 5 /nobreak >nul
echo.
echo Iniciando frontend...
start "Frontend - Sistema Fiscal" cmd /k "cd frontend && npm run dev"
echo.
echo ========================================
echo   Sistema iniciado com sucesso!
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Pressione qualquer tecla para sair...
pause >nul

