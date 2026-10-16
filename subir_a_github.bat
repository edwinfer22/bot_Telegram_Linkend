@echo off
chcp 65001 > nul
title Subir Proyecto a GitHub
color 0B
cd /d "%~dp0"

echo ========================================================
echo          🚀 SUBIR LINKEDIN JOB BOT A GITHUB             
echo ========================================================
echo.
echo Recuerda: Tu repositorio en GitHub DEBE ser PRIVADO
echo para proteger tu token de Telegram.
echo.

git init
git branch -M main
git add .
git commit -m "Bot de alertas de empleo LinkedIn para Telegram con GitHub Actions"

echo.
echo ========================================================
echo Pega la URL HTTPS de tu nuevo repositorio de GitHub
echo Ejemplo: https://github.com/tu-usuario/linkedin-job-bot.git
echo ========================================================
echo.
set /p repourl="URL del repositorio: "

if "%repourl%"=="" (
    echo No ingresaste ninguna URL. Operacion cancelada.
    pause
    exit /b
)

git remote remove origin 2>nul
git remote add origin %repourl%
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo 🎉 ¡Subido con éxito a GitHub!
    echo Las alertas ya se ejecutaran solas en la nube a las 10:00 AM.
    echo ========================================================
) else (
    echo.
    echo ⚠️ Hubo un detalle al hacer push. Verifica que hayas iniciado sesion
    echo en GitHub o que la URL sea la correcta.
)

pause
