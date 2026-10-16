@echo off
chcp 65001 > nul
title Programar Escaneo Matutino Automatico
color 0B
cd /d "%~dp0"

echo ========================================================
echo     ⏰ PROGRAMADOR AUTOMATICO MATUTINO EN WINDOWS       
echo ========================================================
echo.
echo Este script configurara Windows para que busque y envie
echo automaticamente las nuevas vacantes a tu Telegram cada
echo mañana a las 8:00 AM (sin que tengas que abrir nada).
echo.
echo Presiona cualquier tecla para activar la programacion diaria...
pause > nul

schtasks /create /tn "LinkedInJobAlerts_Matutino" /tr "\"%~dp0escanear_ahora.bat\"" /sc daily /st 08:00 /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo ✅ ¡Listo! Tarea programada exitosamente a las 8:00 AM.
    echo Todos los dias a las 8:00 AM recibiras tus vacantes en Telegram.
    echo ========================================================
) else (
    echo.
    echo ⚠️ Si dio error de permisos, haz clic derecho sobre este
    echo archivo y elige 'Ejecutar como administrador'.
)

echo.
pause
