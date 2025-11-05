@echo off
echo ========================================
echo   BACKEND - Modo Debug
echo ========================================
echo.
echo Diretorio: %CD%
echo.

echo Verificando arquivo .env...
if exist .env (
    echo [OK] Arquivo .env encontrado
) else (
    echo [ERRO] Arquivo .env NAO encontrado!
    pause
    exit /b 1
)

echo.
echo Testando conexao com Supabase...
node test-connection.js
if errorlevel 1 (
    echo.
    echo [ERRO] Falha na conexao com Supabase!
    echo Verifique o arquivo .env
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Iniciando servidor...
echo ========================================
echo.

npm start

pause

