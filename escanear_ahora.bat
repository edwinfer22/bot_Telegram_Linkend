@echo off
chcp 65001 > nul
title Escaneando Vacantes de Hoy en LinkedIn...
color 0A
cd /d "%~dp0"

echo ========================================================
echo       ☀️  ESCANEO DE VACANTES DE HOY - SISTEMAS / TI      
echo ========================================================
echo.
echo Conectando con LinkedIn y enviando las ofertas a tu Telegram...
echo.

node escanear_ahora.cjs

echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul
