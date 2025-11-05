@echo off
echo ========================================
echo   INICIANDO BACKEND - Sistema Fiscal
echo ========================================
echo.

cd backend

echo Compilando TypeScript...
call npm run build

echo.
echo Iniciando servidor backend na porta 3001...
call npm start

