@echo off
title Lanzador Maestro Equipment Manager

echo ===============================================
echo   INICIANDO ENTORNO DE DESARROLLO COMPLETO
echo ===============================================

:: 1. Lanzar el BACKEND
echo [1/3] Iniciando Backend...
start "Backend API" cmd /k "cd /d C:\Users\botty\Downloads\equipment-manager\backend && npm run dev"

:: Esperamos 3 segundos para que el backend conecte a la base de datos, etc.
timeout /t 3 /nobreak >nul

:: 2. Lanzar el FRONTEND
:: RECUERDA: Verifica que la ruta 'frontend' sea la correcta
echo [2/3] Iniciando Frontend...
start "Frontend App" cmd /k "cd /d C:\Users\botty\Downloads\equipment-manager\frontend && npm run dev"

:: 3. Esperar a que el servidor web arranque
echo Esperando a que el servidor este listo para abrir Chrome...
timeout /t 4 /nobreak >nul

:: 4. Abrir GOOGLE CHROME
echo [3/3] Abriendo Google Chrome...
start chrome "http://localhost:5173"

echo.
echo ===============================================
echo        TODO LISTO. A PROGRAMAR!
echo ===============================================
:: Esta pausa final es opcional, solo para que veas el mensaje de éxito
timeout /t 3 >nul
exit