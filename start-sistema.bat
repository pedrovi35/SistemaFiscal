@echo off
echo ========================================
echo   SISTEMA FISCAL - Inicializacao Completa
echo ========================================
echo.
echo Iniciando Backend e Frontend...
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Pressione Ctrl+C para encerrar os servicos
echo.

start "Sistema Fiscal - Backend" cmd /k "cd backend && npm start"
timeout /t 5 /nobreak > nul
start "Sistema Fiscal - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Aguarde alguns segundos e acesse: http://localhost:5173
echo.
pause

