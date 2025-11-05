@echo off
echo ========================================
echo   INICIANDO FRONTEND - Sistema Fiscal
echo ========================================
echo.

cd frontend

echo Aguardando 3 segundos para o backend inicializar...
timeout /t 3 /nobreak > nul

echo.
echo Iniciando servidor frontend na porta 5173...
call npm run dev

