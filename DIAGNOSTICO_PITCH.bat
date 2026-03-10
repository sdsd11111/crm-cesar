@echo off
cd /d "%~dp0"
echo ==========================================
echo    DIAGNOSTICO DE APIS (TRAINER)
echo ==========================================
echo.
echo [INFO] Directorio: %cd%
echo [INFO] Ejecutando script de diagnostico...
echo.
call npx tsx scripts/test-api-diagnostic.ts
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] El script fallo con codigo %errorlevel%
)
echo.
echo Presione cualquier tecla para terminar...
pause > nul
