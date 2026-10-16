@echo off
chcp 65001 > nul
title Programar Escaneo Automatico a las 10:00 AM
color 0B
cd /d "%~dp0"

echo ========================================================
echo     ⏰ PROGRAMADOR AUTOMATICO EN WINDOWS (10:00 AM)      
echo ========================================================
echo.
echo Este script configurara Windows para que busque y envie
echo automaticamente las nuevas vacantes a tu Telegram todos los
echo dias a las 10:00 AM (el mejor horario de publicacion).
echo.
echo Presiona cualquier tecla para activar la programacion a las 10:00 AM...
pause > nul

schtasks /create /tn "LinkedInJobAlerts_10AM" /tr "\"%~dp0escanear_ahora.bat\"" /sc daily /st 10:00 /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo ✅ ¡Listo! Tarea programada exitosamente a las 10:00 AM.
    echo Todos los dias a las 10:00 AM recibiras tus vacantes en Telegram.
    echo ========================================================
) else (
    echo.
    echo ⚠️ Si dio error de permisos, haz clic derecho sobre este
    echo archivo y elige 'Ejecutar como administrador'.
)

echo.
pause
