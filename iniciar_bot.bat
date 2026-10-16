@echo off
chcp 65001 > nul
title LinkedIn Job Alert Bot
color 0B
cd /d "%~dp0"

echo ========================================================
echo        🤖 LINKEDIN JOB ALERT BOT - SISTEMAS / TI        
echo ========================================================
echo.
echo 1. Probar conexion con Telegram
echo 2. Escanear vacantes de HOY (Una sola vez)
echo 3. Iniciar Bot continuo en segundo plano (Revisa cada 30 min)
echo 4. Iniciar con Python (bot.py)
echo 5. Abrir archivo de configuracion (config.json)
echo 6. Salir
echo.
set /p opt="Selecciona una opcion (1-6): "

if "%opt%"=="1" (
    echo.
    echo Probando conexion...
    node test_telegram.cjs
    pause
    goto end
)
if "%opt%"=="2" (
    echo.
    echo Escaneando vacantes de hoy...
    node escanear_ahora.cjs
    pause
    goto end
)
if "%opt%"=="3" (
    echo.
    echo Iniciando monitor continuo con Node.js...
    node bot.cjs
    pause
    goto end
)
if "%opt%"=="4" (
    echo.
    echo Iniciando con Python...
    python bot.py
    pause
    goto end
)
if "%opt%"=="5" (
    notepad config.json
    goto end
)
:end
